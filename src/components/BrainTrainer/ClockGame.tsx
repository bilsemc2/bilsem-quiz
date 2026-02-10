import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer, Target,
    CheckCircle2, XCircle, ChevronLeft, Zap, Heart, Clock
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useExam } from '../../contexts/ExamContext';

// ─── Constants ───────────────────────────────────────────
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;

type Phase = 'welcome' | 'playing' | 'feedback' | 'game_over' | 'victory';

interface ClockGameProps {
    examMode?: boolean;
    examLevel?: number;
    examTimeLimit?: number;
}

// ─── Feedback Messages ────────────────────────────────────
const CORRECT_MESSAGES = ["Harikasın! 🎨", "Süpersin! ⭐", "Muhteşem! 🌟", "Bravo! 🎉", "Tam isabet! 🎯"];
const WRONG_MESSAGES = ["Tekrar dene! 💪", "Düşün ve bul! 🧐", "Biraz daha dikkat! 🎯"];

// ─── Clock Math Utilities ─────────────────────────────────
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const normalizeAngle = (angle: number) => {
    let value = angle % 360;
    if (value < 0) value += 360;
    return Math.round(value * 2) / 2;
};

const angleDiff = (a: number, b: number) => {
    let diff = Math.abs(a - b) % 360;
    if (diff > 180) diff = 360 - diff;
    return diff;
};

const getAngles = (hours: number, minutes: number) => ({
    hour: normalizeAngle(hours * 30 + minutes * 0.5),
    minute: normalizeAngle(minutes * 6),
});

const formatClockTime = (hours: number, minutes: number) => {
    const displayHour = hours === 0 ? 12 : hours;
    const displayMinutes = String(minutes).padStart(2, '0');
    return `${displayHour}:${displayMinutes}`;
};

const addMinutes = (hours: number, minutes: number, delta: number) => {
    let total = (hours * 60 + minutes + delta) % 720;
    if (total < 0) total += 720;
    return { hours: Math.floor(total / 60), minutes: total % 60 };
};

// Level-based offset ranges
const getLevelOffsets = (level: number): number[] => {
    if (level <= 5) return [5, 10, 15];
    if (level <= 10) return [10, 15, 20, 25];
    if (level <= 15) return [20, 30, 35, 40, 45];
    return [35, 40, 45, 50, 55, 60];
};

const generateRound = (level: number) => {
    const hours = randomInt(0, 11);
    const minutes = randomInt(0, 11) * 5;
    const offsets = getLevelOffsets(level);
    const offset = offsets[randomInt(0, offsets.length - 1)];
    return { hours, minutes, offset };
};

// ─── Clock Face Component (Pure SVG) ─────────────────────
interface ClockFaceProps {
    hourAngle: number;
    minuteAngle: number;
    ghostHourAngle: number | null;
    ghostMinuteAngle: number | null;
    interactive: boolean;
    activeHand: 'hour' | 'minute';
    onPointerDown?: (e: React.PointerEvent) => void;
    onPointerMove?: (e: React.PointerEvent) => void;
    onPointerUp?: (e: React.PointerEvent) => void;
    size?: number;
}

// Convert clock angle (0=12, 90=3, 180=6, 270=9) to SVG line endpoint
const angleToPoint = (cx: number, cy: number, angleDeg: number, length: number) => {
    const rad = (angleDeg - 90) * (Math.PI / 180);
    return { x: cx + Math.cos(rad) * length, y: cy + Math.sin(rad) * length };
};

const ClockFace: React.FC<ClockFaceProps> = ({
    hourAngle, minuteAngle, ghostHourAngle, ghostMinuteAngle,
    interactive, activeHand, onPointerDown, onPointerMove, onPointerUp, size = 260,
}) => {
    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 5; // account for border

    const hourLen = r * 0.5;
    const minuteLen = r * 0.7;
    const numR = r * 0.75;

    const hourTip = angleToPoint(cx, cy, hourAngle, hourLen);
    const minuteTip = angleToPoint(cx, cy, minuteAngle, minuteLen);

    return (
        <svg
            width={size} height={size}
            style={{ cursor: interactive ? 'crosshair' : 'default', touchAction: 'none' }}
            onPointerDown={interactive ? onPointerDown : undefined}
            onPointerMove={interactive ? onPointerMove : undefined}
            onPointerUp={interactive ? onPointerUp : undefined}
        >
            {/* Clock face background */}
            <circle cx={cx} cy={cy} r={r}
                fill="url(#clockGrad)" stroke="rgba(255,255,255,0.2)" strokeWidth={5} />
            <defs>
                <radialGradient id="clockGrad">
                    <stop offset="0%" stopColor="rgba(30,30,60,0.9)" />
                    <stop offset="100%" stopColor="rgba(15,15,40,0.95)" />
                </radialGradient>
                <filter id="handGlow">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
            </defs>

            {/* Tick marks */}
            {Array.from({ length: 60 }).map((_, i) => {
                const isMajor = i % 5 === 0;
                const outerR = r * 0.95;
                const innerR = isMajor ? r * 0.8 : r * 0.88;
                const p1 = angleToPoint(cx, cy, i * 6, innerR);
                const p2 = angleToPoint(cx, cy, i * 6, outerR);
                return (
                    <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                        stroke={isMajor ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)'}
                        strokeWidth={isMajor ? 2.5 : 1.2} strokeLinecap="round" />
                );
            })}

            {/* Numbers */}
            {Array.from({ length: 12 }).map((_, i) => {
                const num = i === 0 ? 12 : i;
                const p = angleToPoint(cx, cy, i * 30, numR);
                return (
                    <text key={`n${i}`} x={p.x} y={p.y}
                        textAnchor="middle" dominantBaseline="central"
                        fill="rgba(255,255,255,0.75)" fontSize={size * 0.065} fontWeight={700}
                        fontFamily="system-ui, sans-serif"
                    >{num}</text>
                );
            })}

            {/* Ghost hands (answer preview) */}
            {ghostHourAngle !== null && (() => {
                const tip = angleToPoint(cx, cy, ghostHourAngle, hourLen);
                return <line x1={cx} y1={cy} x2={tip.x} y2={tip.y}
                    stroke="rgba(129,140,248,0.5)" strokeWidth={5}
                    strokeLinecap="round" strokeDasharray="6 4" />;
            })()}
            {ghostMinuteAngle !== null && (() => {
                const tip = angleToPoint(cx, cy, ghostMinuteAngle, minuteLen);
                return <line x1={cx} y1={cy} x2={tip.x} y2={tip.y}
                    stroke="rgba(129,140,248,0.5)" strokeWidth={3}
                    strokeLinecap="round" strokeDasharray="6 4" />;
            })()}

            {/* Hour hand */}
            <line x1={cx} y1={cy} x2={hourTip.x} y2={hourTip.y}
                stroke={activeHand === 'hour' ? '#818cf8' : 'rgba(255,255,255,0.85)'}
                strokeWidth={7} strokeLinecap="round"
                filter={activeHand === 'hour' ? 'url(#handGlow)' : undefined} />

            {/* Minute hand */}
            <line x1={cx} y1={cy} x2={minuteTip.x} y2={minuteTip.y}
                stroke={activeHand === 'minute' ? '#a78bfa' : 'rgba(200,200,240,0.85)'}
                strokeWidth={4} strokeLinecap="round"
                filter={activeHand === 'minute' ? 'url(#handGlow)' : undefined} />

            {/* Center dot */}
            <circle cx={cx} cy={cy} r={7} fill="url(#dotGrad)" />
            <defs>
                <radialGradient id="dotGrad">
                    <stop offset="0%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#818cf8" />
                </radialGradient>
            </defs>
        </svg>
    );
};

// ─── Main Component ──────────────────────────────────────
const ClockGame: React.FC<ClockGameProps> = ({ examMode = false }) => {
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();
    const navigate = useNavigate();
    const { submitResult } = useExam();
    const hasSavedRef = useRef(false);

    // Core State
    const [phase, setPhase] = useState<Phase>('welcome');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [level, setLevel] = useState(1);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const [feedbackMsg, setFeedbackMsg] = useState('');
    const [feedbackCorrect, setFeedbackCorrect] = useState(false);

    // Clock State
    const [round, setRound] = useState(() => generateRound(1));
    const [userTotal, setUserTotal] = useState(() => round.hours * 60 + round.minutes);
    const [activeHand, setActiveHand] = useState<'hour' | 'minute'>('minute');
    const [dragging, setDragging] = useState(false);
    const [showAnswer, setShowAnswer] = useState(false);
    const [answered, setAnswered] = useState(false);

    // Refs
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const startTimeRef = useRef(0);

    // Derived values
    const target = useMemo(() => addMinutes(round.hours, round.minutes, round.offset), [round]);
    const targetAngles = useMemo(() => getAngles(target.hours, target.minutes), [target]);
    const userMinute = userTotal % 60;
    const hourAngle = normalizeAngle(userTotal * 0.5);
    const minuteAngle = normalizeAngle(userMinute * 6);

    // Timer Effect
    useEffect(() => {
        if (phase === 'playing' && timeLeft > 0) {
            timerRef.current = setTimeout(() => setTimeLeft(p => p - 1), 1000);
        } else if (timeLeft === 0 && phase === 'playing') {
            handleGameOver();
        }
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [phase, timeLeft]);

    // New round on level change
    useEffect(() => {
        if (phase === 'playing') {
            const r = generateRound(level);
            setRound(r);
            setUserTotal(r.hours * 60 + r.minutes);
            setActiveHand('minute');
            setShowAnswer(false);
            setAnswered(false);
        }
    }, [level, phase]);

    // Start Game
    const handleStart = useCallback(() => {
        setPhase('playing');
        setScore(0);
        setLives(INITIAL_LIVES);
        setLevel(1);
        setTimeLeft(TIME_LIMIT);
        startTimeRef.current = Date.now();
        hasSavedRef.current = false;
    }, []);

    // Auto Start
    useEffect(() => {
        if ((location.state?.autoStart || examMode) && phase === 'welcome') {
            handleStart();
        }
    }, [location.state, examMode, phase, handleStart]);

    // Game Over
    const handleGameOver = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        setPhase('game_over');
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (examMode) {
            submitResult(level >= 5, score, 1000, duration);
            setTimeout(() => navigate('/sinav-simulasyonu'), 1500);
            return;
        }
        await saveGamePlay({
            game_id: 'saat-problemi', score_achieved: score, duration_seconds: duration,
            metadata: { levels_completed: level, final_lives: lives },
        });
    }, [saveGamePlay, score, level, lives, examMode, submitResult, navigate]);

    // Victory
    const handleVictory = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        setPhase('victory');
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (examMode) {
            submitResult(true, score, 1000, duration);
            setTimeout(() => navigate('/sinav-simulasyonu'), 1500);
            return;
        }
        await saveGamePlay({
            game_id: 'saat-problemi', score_achieved: score, duration_seconds: duration,
            metadata: { levels_completed: MAX_LEVEL, victory: true },
        });
    }, [saveGamePlay, score, examMode, submitResult, navigate]);

    // Pointer handlers
    const getPointerAngle = useCallback((event: React.PointerEvent) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        let degrees = (Math.atan2(y, x) * 180) / Math.PI;
        degrees = (degrees + 90 + 360) % 360;
        return degrees;
    }, []);

    const updateHandFromPointer = useCallback((event: React.PointerEvent) => {
        const degrees = getPointerAngle(event);
        if (activeHand === 'minute') {
            setUserTotal(prev => {
                const currentMinute = prev % 60;
                let delta = Math.round(degrees / 6) % 60 - currentMinute;
                if (delta > 30) delta -= 60;
                if (delta < -30) delta += 60;
                let next = prev + delta;
                if (next < 0) next += 720;
                if (next >= 720) next -= 720;
                return next;
            });
        } else {
            setUserTotal(prev => {
                const currentMinute = prev % 60;
                let base = degrees - currentMinute * 0.5;
                base %= 360;
                if (base < 0) base += 360;
                const hour = Math.round(base / 30) % 12;
                return hour * 60 + currentMinute;
            });
        }
    }, [activeHand, getPointerAngle]);

    const handlePointerDown = useCallback((event: React.PointerEvent) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        setDragging(true);
        updateHandFromPointer(event);
    }, [updateHandFromPointer]);

    const handlePointerMove = useCallback((event: React.PointerEvent) => {
        if (!dragging) return;
        updateHandFromPointer(event);
    }, [dragging, updateHandFromPointer]);

    const handlePointerUp = useCallback((event: React.PointerEvent) => {
        setDragging(false);
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
    }, []);

    // Check Answer
    const handleCheck = useCallback(() => {
        if (answered) return;
        setAnswered(true);
        const hourDiffVal = angleDiff(hourAngle, targetAngles.hour);
        const minuteDiffVal = angleDiff(minuteAngle, targetAngles.minute);
        const isCorrect = hourDiffVal <= 1 && minuteDiffVal <= 2;

        setFeedbackCorrect(isCorrect);
        setFeedbackMsg(isCorrect
            ? CORRECT_MESSAGES[Math.floor(Math.random() * CORRECT_MESSAGES.length)]
            : WRONG_MESSAGES[Math.floor(Math.random() * WRONG_MESSAGES.length)]
        );
        setShowAnswer(true);
        setPhase('feedback');

        if (isCorrect) {
            setScore(p => p + 10 * level);
            setTimeout(() => {
                if (level >= MAX_LEVEL) { handleVictory(); }
                else { setLevel(p => p + 1); setPhase('playing'); }
            }, 2000);
        } else {
            const newLives = lives - 1;
            setLives(newLives);
            setTimeout(() => {
                if (newLives <= 0) { handleGameOver(); }
                else { setPhase('playing'); }
            }, 2000);
        }
    }, [answered, hourAngle, minuteAngle, targetAngles, level, lives, handleVictory, handleGameOver]);

    // Reset to start position
    const handleReset = useCallback(() => {
        setUserTotal(round.hours * 60 + round.minutes);
    }, [round]);

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white">
            {/* Decorative Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <div className="relative z-10 p-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Link to="/atolyeler/bireysel-degerlendirme" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                        <ChevronLeft size={20} />
                        <span>Geri</span>
                    </Link>
                    {(phase === 'playing' || phase === 'feedback') && (
                        <div className="flex items-center gap-3 sm:gap-6 flex-wrap justify-end">
                            <div className="flex items-center gap-2 bg-amber-500/20 px-3 py-2 rounded-xl border border-amber-500/30">
                                <Star className="text-amber-400" size={18} />
                                <span className="font-bold text-amber-400">{score}</span>
                            </div>
                            <div className="flex items-center gap-1 bg-red-500/20 px-3 py-2 rounded-xl border border-red-500/30">
                                {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
                                    <Heart key={i} size={14} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-400/30'} />
                                ))}
                            </div>
                            <div className="flex items-center gap-2 bg-blue-500/20 px-3 py-2 rounded-xl border border-blue-500/30">
                                <Timer className="text-blue-400" size={18} />
                                <span className={`font-bold ${timeLeft <= 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'}`}>
                                    {formatTime(timeLeft)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 bg-emerald-500/20 px-3 py-2 rounded-xl border border-emerald-500/30">
                                <Zap className="text-emerald-400" size={18} />
                                <span className="font-bold text-emerald-400">Seviye {level}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4">
                <AnimatePresence mode="wait">
                    {/* Welcome Screen */}
                    {phase === 'welcome' && (
                        <motion.div key="welcome" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
                            <motion.div
                                className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center"
                                style={{ borderRadius: '40%', boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }}
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Clock size={52} className="text-white drop-shadow-lg" />
                            </motion.div>
                            <div className="mb-6 inline-flex items-center gap-1.5 px-3 py-1 bg-violet-500/20 border border-violet-500/30 rounded-full">
                                <span className="text-[9px] font-black text-violet-300 uppercase tracking-wider">TUZÖ</span>
                                <span className="text-[9px] font-bold text-violet-400">5.2.3 Sayısal-Zamansal İlişki</span>
                            </div>
                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                Saat Problemi
                            </h1>
                            <p className="text-slate-400 mb-8">
                                Başlangıç saatini incele, verilen süre sonrasındaki saati ibreleri sürükleyerek ayarla!
                                Yelkovanı çevirirken akrep otomatik ilerler.
                            </p>
                            <div className="flex flex-wrap justify-center gap-4 mb-8">
                                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2">
                                    <Heart className="text-red-400" size={16} />
                                    <span className="text-sm text-slate-300">{INITIAL_LIVES} Can</span>
                                </div>
                                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2">
                                    <Timer className="text-blue-400" size={16} />
                                    <span className="text-sm text-slate-300">{TIME_LIMIT / 60} Dakika</span>
                                </div>
                                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2">
                                    <Target className="text-emerald-400" size={16} />
                                    <span className="text-sm text-slate-300">{MAX_LEVEL} Seviye</span>
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleStart}
                                className="px-10 py-5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl font-bold text-xl"
                                style={{ boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)' }}
                            >
                                <div className="flex items-center gap-3">
                                    <Play size={28} className="fill-white" />
                                    <span>Başla</span>
                                </div>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* Game Board */}
                    {(phase === 'playing' || phase === 'feedback') && (
                        <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-2xl">
                            {/* Question Panel */}
                            <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/10 mb-6">
                                <div className="text-center mb-4">
                                    <p className="text-slate-400 text-sm uppercase tracking-wider mb-2">Başlangıç Saati</p>
                                    <p className="text-4xl font-bold text-white">{formatClockTime(round.hours, round.minutes)}</p>
                                </div>
                                <div className="bg-indigo-500/20 rounded-2xl px-6 py-4 border border-indigo-500/30 text-center">
                                    <p className="text-indigo-300 text-sm mb-1">Zaman Atlaması</p>
                                    <p className="text-2xl font-bold text-white">{round.offset} dakika sonra</p>
                                </div>
                            </div>

                            {/* Clock + Controls */}
                            <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/10 flex flex-col items-center gap-6">
                                <p className="text-slate-400 text-sm">
                                    {showAnswer
                                        ? `Doğru cevap: ${formatClockTime(target.hours, target.minutes)}`
                                        : 'İbreleri sürükleyerek doğru saati ayarla'}
                                </p>

                                <ClockFace
                                    hourAngle={hourAngle}
                                    minuteAngle={minuteAngle}
                                    ghostHourAngle={showAnswer ? targetAngles.hour : null}
                                    ghostMinuteAngle={showAnswer ? targetAngles.minute : null}
                                    interactive={phase === 'playing'}
                                    activeHand={activeHand}
                                    onPointerDown={handlePointerDown}
                                    onPointerMove={handlePointerMove}
                                    onPointerUp={handlePointerUp}
                                    size={260}
                                />

                                {/* Hand Toggle + Reset */}
                                <div className="flex items-center gap-4 flex-wrap justify-center">
                                    <div className="flex gap-2 p-1.5 rounded-full border border-white/15 bg-white/5">
                                        <button
                                            onClick={() => setActiveHand('hour')}
                                            className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all min-h-[44px] ${activeHand === 'hour'
                                                ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/40'
                                                : 'text-slate-400 hover:text-white border border-transparent'
                                                }`}
                                        >
                                            Akrep
                                        </button>
                                        <button
                                            onClick={() => setActiveHand('minute')}
                                            className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all min-h-[44px] ${activeHand === 'minute'
                                                ? 'bg-purple-500/30 text-purple-300 border border-purple-500/40'
                                                : 'text-slate-400 hover:text-white border border-transparent'
                                                }`}
                                        >
                                            Yelkovan
                                        </button>
                                    </div>
                                    <button
                                        onClick={handleReset}
                                        className="px-4 py-2.5 rounded-full text-sm text-slate-400 hover:text-white border border-white/15 transition-all min-h-[44px]"
                                    >
                                        <RotateCcw size={16} className="inline mr-1" /> Sıfırla
                                    </button>
                                </div>

                                {/* Check Button */}
                                {phase === 'playing' && (
                                    <motion.button
                                        whileHover={{ scale: 1.05, y: -2 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleCheck}
                                        className="px-10 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl font-bold text-lg min-h-[56px]"
                                        style={{ boxShadow: '0 8px 24px rgba(16,185,129,0.3)' }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 size={24} />
                                            <span>Kontrol Et</span>
                                        </div>
                                    </motion.button>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Game Over */}
                    {phase === 'game_over' && (
                        <motion.div key="game_over" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
                            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-red-500 to-rose-600 rounded-3xl flex items-center justify-center">
                                <XCircle size={48} className="text-white" />
                            </div>
                            <h2 className="text-3xl font-bold text-red-400 mb-4">Oyun Bitti!</h2>
                            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 mb-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Skor</p>
                                        <p className="text-2xl font-bold text-amber-400">{score}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Seviye</p>
                                        <p className="text-2xl font-bold text-emerald-400">{level}</p>
                                    </div>
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={handleStart}
                                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl font-bold text-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <RotateCcw size={24} />
                                    <span>Tekrar Dene</span>
                                </div>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* Victory */}
                    {phase === 'victory' && (
                        <motion.div key="victory" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
                            <motion.div
                                className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-3xl flex items-center justify-center"
                                animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                <Trophy size={48} className="text-white" />
                            </motion.div>
                            <h2 className="text-3xl font-bold text-amber-400 mb-4">🎉 Şampiyon!</h2>
                            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 mb-6">
                                <p className="text-4xl font-bold text-amber-400">{score}</p>
                                <p className="text-slate-400">Toplam Puan</p>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={handleStart}
                                className="px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-2xl font-bold text-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <RotateCcw size={24} />
                                    <span>Tekrar Oyna</span>
                                </div>
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Feedback Overlay */}
                <AnimatePresence>
                    {phase === 'feedback' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                        >
                            <motion.div
                                initial={{ y: 50 }} animate={{ y: 0 }}
                                className={`px-12 py-8 rounded-3xl text-center ${feedbackCorrect
                                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                                    : 'bg-gradient-to-br from-orange-500 to-amber-600'
                                    }`}
                                style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}
                            >
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1], rotate: feedbackCorrect ? [0, 10, -10, 0] : [0, -5, 5, 0] }}
                                    transition={{ duration: 0.5 }}
                                >
                                    {feedbackCorrect
                                        ? <CheckCircle2 size={64} className="mx-auto mb-4 text-white" />
                                        : <XCircle size={64} className="mx-auto mb-4 text-white" />
                                    }
                                </motion.div>
                                <p className="text-3xl font-black text-white">{feedbackMsg}</p>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ClockGame;
