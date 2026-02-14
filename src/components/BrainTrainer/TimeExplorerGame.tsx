import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer, Target,
    XCircle, ChevronLeft, Zap, Heart, Clock
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useExam } from '../../contexts/ExamContext';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';

// Game Constants
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;

type Phase = 'welcome' | 'playing' | 'feedback' | 'game_over' | 'victory';



// ─── Clock Utilities (inline) ───────────────────────────────────────

const getRandomTime = (level: number): Date => {
    const date = new Date();
    const hours = Math.floor(Math.random() * 12) + 1;
    // Higher levels = finer minute granularity
    const granularity = level <= 5 ? 5 : level <= 10 ? 5 : level <= 15 ? 1 : 1;
    const maxMinute = 60 / granularity;
    const minutes = Math.floor(Math.random() * maxMinute) * granularity;
    date.setHours(hours);
    date.setMinutes(minutes);
    date.setSeconds(0);
    return date;
};

const addMinutes = (date: Date, minutes: number): Date => {
    const newDate = new Date(date);
    newDate.setMinutes(date.getMinutes() + minutes);
    return newDate;
};

const getTargetOffset = (level: number): number => {
    // Progressive difficulty
    if (level <= 3) return 5;
    if (level <= 6) return 10;
    if (level <= 9) return 30;
    if (level <= 12) return 40;
    if (level <= 15) return 50;
    if (level <= 17) return 60;
    // High levels: negative offsets (subtract)
    if (level <= 19) return -(Math.random() > 0.5 ? 10 : 15);
    return -(Math.random() > 0.5 ? 15 : 20);
};

const minutesToDegrees = (minutes: number): number => (minutes / 60) * 360;

const degreesToMinutes = (degrees: number): number => {
    let d = degrees % 360;
    if (d < 0) d += 360;
    const minutes = Math.round((d / 360) * 60);
    return minutes === 60 ? 0 : minutes;
};

const getAngle = (centerX: number, centerY: number, mouseX: number, mouseY: number): number => {
    const x = mouseX - centerX;
    const y = mouseY - centerY;
    let rad = Math.atan2(y, x);
    let deg = rad * (180 / Math.PI);
    deg += 90;
    if (deg < 0) deg += 360;
    return deg;
};

// ─── Inline Clock SVG Component ──────────────────────────────────────

interface InlineClockProps {
    hours: number;
    minutes: number;
    isInteractive: boolean;
    onMinuteChange: (newMinutes: number) => void;
}

const InlineClock: React.FC<InlineClockProps> = ({ hours, minutes, isInteractive, onMinuteChange }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const size = 280;
    const center = size / 2;
    const radius = size / 2 - 20;

    const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isInteractive) return;
        setIsDragging(true);
        e.preventDefault();
    };

    const handleMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (!isDragging || !svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
        const deg = getAngle(rect.left + rect.width / 2, rect.top + rect.height / 2, clientX, clientY);
        onMinuteChange(degreesToMinutes(deg));
    }, [isDragging, onMinuteChange]);

    const handleEnd = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMove);
            window.addEventListener('mouseup', handleEnd);
            window.addEventListener('touchmove', handleMove, { passive: false });
            window.addEventListener('touchend', handleEnd);
        } else {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleEnd);
        }
        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleEnd);
        };
    }, [isDragging, handleMove, handleEnd]);

    const minuteAngle = minutesToDegrees(minutes);
    const hourAngle = (hours % 12) * 30 + (minutes / 60) * 30;

    const renderNumbers = () => {
        const numbers = [];
        for (let i = 1; i <= 12; i++) {
            const x = center + (radius - 35) * Math.sin(i * (Math.PI / 6));
            const y = center - (radius - 35) * Math.cos(i * (Math.PI / 6));
            numbers.push(
                <text
                    key={i}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-indigo-200 text-lg font-bold font-sans pointer-events-none select-none"
                >
                    {i}
                </text>
            );
        }
        return numbers;
    };

    const renderTicks = () => {
        const ticks = [];
        for (let i = 0; i < 60; i++) {
            const isHour = i % 5 === 0;
            const angle = i * 6 * (Math.PI / 180);
            const innerR = isHour ? radius - 12 : radius - 7;
            const outerR = radius;
            ticks.push(
                <line
                    key={i}
                    x1={center + innerR * Math.sin(angle)}
                    y1={center - innerR * Math.cos(angle)}
                    x2={center + outerR * Math.sin(angle)}
                    y2={center - outerR * Math.cos(angle)}
                    stroke={isHour ? '#818CF8' : '#4338CA'}
                    strokeWidth={isHour ? 3 : 1}
                />
            );
        }
        return ticks;
    };

    return (
        <div className="relative touch-none mx-auto" style={{ width: size, height: size }}>
            <svg
                ref={svgRef}
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="block mx-auto"
            >
                {/* Clock face background - gummy candy style */}
                <defs>
                    <radialGradient id="clockFace" cx="40%" cy="35%" r="65%">
                        <stop offset="0%" stopColor="rgba(99,102,241,0.3)" />
                        <stop offset="100%" stopColor="rgba(30,27,75,0.6)" />
                    </radialGradient>
                    <filter id="clockShadow">
                        <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="rgba(0,0,0,0.5)" />
                    </filter>
                </defs>
                <circle cx={center} cy={center} r={radius} fill="url(#clockFace)" stroke="#6366F1" strokeWidth="4" filter="url(#clockShadow)" />

                {/* Inner glow ring */}
                <circle cx={center} cy={center} r={radius - 2} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

                {renderTicks()}
                {renderNumbers()}

                {/* Hour Hand */}
                <line
                    x1={center}
                    y1={center}
                    x2={center + (radius - 75) * Math.sin(hourAngle * (Math.PI / 180))}
                    y2={center - (radius - 75) * Math.cos(hourAngle * (Math.PI / 180))}
                    stroke="#C7D2FE"
                    strokeWidth="7"
                    strokeLinecap="round"
                />

                {/* Minute Hand (Interactive) */}
                <g
                    className={`${isInteractive ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
                    onMouseDown={handleStart}
                    onTouchStart={handleStart}
                >
                    {/* Invisible hit area */}
                    <line
                        x1={center}
                        y1={center}
                        x2={center + (radius - 18) * Math.sin(minuteAngle * (Math.PI / 180))}
                        y2={center - (radius - 18) * Math.cos(minuteAngle * (Math.PI / 180))}
                        stroke="transparent"
                        strokeWidth="40"
                        strokeLinecap="round"
                    />
                    {/* Visible hand - red accent */}
                    <line
                        x1={center}
                        y1={center}
                        x2={center + (radius - 18) * Math.sin(minuteAngle * (Math.PI / 180))}
                        y2={center - (radius - 18) * Math.cos(minuteAngle * (Math.PI / 180))}
                        stroke="#F87171"
                        strokeWidth="5"
                        strokeLinecap="round"
                    />
                    {/* Draggable tip circle */}
                    <circle
                        cx={center + (radius - 18) * Math.sin(minuteAngle * (Math.PI / 180))}
                        cy={center - (radius - 18) * Math.cos(minuteAngle * (Math.PI / 180))}
                        r={isInteractive ? 14 : 8}
                        fill="#F87171"
                        stroke="rgba(255,255,255,0.5)"
                        strokeWidth="2"
                    />
                    <circle cx={center} cy={center} r="6" fill="#F87171" />
                </g>

                {/* Center pin */}
                <circle cx={center} cy={center} r="4" fill="#A5B4FC" />
            </svg>
        </div>
    );
};

// ─── Main Game Component ─────────────────────────────────────────────

const TimeExplorerGame: React.FC = () => {
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();
    const navigate = useNavigate();
    const { submitResult } = useExam();
    const hasSavedRef = useRef(false);

    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;
    const examMode = location.state?.examMode || false;

    // Core State
    const [phase, setPhase] = useState<Phase>('welcome');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [level, setLevel] = useState(1);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);

    // Game-Specific State
    const [questionTime, setQuestionTime] = useState<Date>(new Date());
    const [targetOffset, setTargetOffset] = useState(5);
    const [userMinutes, setUserMinutes] = useState(0);
    const [displayHour, setDisplayHour] = useState(0);
    const prevMinutesRef = useRef(0);

    // Refs
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const startTimeRef = useRef<number>(0);

    // Timer Effect
    useEffect(() => {
        if (phase === 'playing' && timeLeft > 0) {
            timerRef.current = setTimeout(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && phase === 'playing') {
            handleGameOver();
        }
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [phase, timeLeft]);

    // Generate Question
    const generateQuestion = useCallback(() => {
        const newTime = getRandomTime(level);
        const newOffset = getTargetOffset(level);
        setQuestionTime(newTime);
        setTargetOffset(newOffset);
        setUserMinutes(newTime.getMinutes());
        setDisplayHour(newTime.getHours());
        prevMinutesRef.current = newTime.getMinutes();
    }, [level]);

    // Level Setup
    useEffect(() => {
        if (phase === 'playing') {
            generateQuestion();
        }
    }, [phase, level, generateQuestion]);

    // Start Game
    const handleStart = useCallback(() => {
        window.scrollTo(0, 0);
        setPhase('playing');
        setScore(0);
        setLives(INITIAL_LIVES);
        setLevel(1);
        setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
        startTimeRef.current = Date.now();
        hasSavedRef.current = false;
    }, [hasSavedRef, examMode, examTimeLimit]);

    // Auto Start from HUB or Exam Mode
    useEffect(() => {
        if ((location.state?.autoStart || examMode) && phase === 'welcome') {
            handleStart();
        }
    }, [location.state, examMode, phase, handleStart]);

    // Game Over Handler
    const handleGameOver = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        setPhase('game_over');

        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

        if (examMode) {
            const passed = level >= 5;
            (async () => {
                await submitResult(passed, score, 1000, duration);
                navigate('/atolyeler/sinav-simulasyonu/devam');
            })();
            return;
        }

        await saveGamePlay({
            game_id: 'zaman-gezgini',
            score_achieved: score,
            duration_seconds: duration,
            metadata: {
                levels_completed: level,
                final_lives: lives,
            }
        });
    }, [saveGamePlay, score, level, lives, hasSavedRef, examMode, submitResult, navigate]);

    // Victory Handler
    const handleVictory = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        setPhase('victory');

        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

        if (examMode) {
            (async () => {
                await submitResult(true, score, 1000, duration);
                navigate('/atolyeler/sinav-simulasyonu/devam');
            })();
            return;
        }

        await saveGamePlay({
            game_id: 'zaman-gezgini',
            score_achieved: score,
            duration_seconds: duration,
            metadata: {
                levels_completed: MAX_LEVEL,
                victory: true,
            }
        });
    }, [saveGamePlay, score, hasSavedRef, examMode, submitResult, navigate]);

    // Shared Feedback Hook
    const { feedbackState, showFeedback, isFeedbackActive } = useGameFeedback({
        onFeedbackEnd: (correct) => {
            if (correct) {
                const newScore = score + 10 * level;
                setScore(newScore);
                if (level >= MAX_LEVEL) {
                    handleVictory();
                } else {
                    setLevel(prev => prev + 1);
                    setPhase('playing');
                }
            } else {
                const newLives = lives - 1;
                setLives(newLives);
                if (newLives <= 0) {
                    handleGameOver();
                } else {
                    setPhase('playing');
                }
            }
        },
    });

    // Handle minute hand drag
    const handleMinuteChange = (newMinutes: number) => {
        if (phase !== 'playing' || isFeedbackActive) return;

        const prev = prevMinutesRef.current;

        // Detect crossing the 12 o'clock boundary
        // Forward crossing: e.g., 55 → 3 (prev > 45 && new < 15)
        // Backward crossing: e.g., 3 → 55 (prev < 15 && new > 45)
        if (prev > 45 && newMinutes < 15) {
            // Crossed forward → increment hour
            setDisplayHour(h => (h % 12) + 1);
        } else if (prev < 15 && newMinutes > 45) {
            // Crossed backward → decrement hour
            setDisplayHour(h => ((h - 2 + 12) % 12) + 1);
        }

        prevMinutesRef.current = newMinutes;
        setUserMinutes(newMinutes);
    };

    // Check answer
    const checkAnswer = () => {
        if (phase !== 'playing' || isFeedbackActive) return;

        const targetTime = addMinutes(questionTime, targetOffset);
        const targetMin = targetTime.getMinutes();
        const correct = userMinutes === targetMin;

        setPhase('feedback');

        const targetStr = `${targetTime.getHours()}:${targetMin.toString().padStart(2, '0')}`;
        const msg = correct
            ? undefined // default from hook
            : `Doğru cevap: ${targetStr}`;

        showFeedback(correct, msg);
    };

    // Format Time
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-950 to-slate-900 text-white">
            {/* Decorative Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <div className="relative z-10 p-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Link
                        to="/atolyeler/bireysel-degerlendirme"
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft size={20} />
                        <span>Geri</span>
                    </Link>

                    {(phase === 'playing' || phase === 'feedback') && (
                        <div className="flex items-center gap-3 sm:gap-6 flex-wrap justify-end">
                            {/* Score */}
                            <div className="flex items-center gap-2 bg-amber-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-amber-500/30">
                                <Star className="text-amber-400" size={18} />
                                <span className="font-bold text-amber-400 text-sm">{score}</span>
                            </div>

                            {/* Lives — heart icons */}
                            <div className="flex items-center gap-2 bg-red-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-red-500/30">
                                <div className="flex items-center gap-0.5">
                                    {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
                                        <Heart
                                            key={i}
                                            size={14}
                                            className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-400/30'}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Timer */}
                            <div className="flex items-center gap-2 bg-blue-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-blue-500/30">
                                <Timer className="text-blue-400" size={18} />
                                <span className={`font-bold text-sm ${timeLeft <= 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'}`}>
                                    {formatTime(timeLeft)}
                                </span>
                            </div>

                            {/* Level */}
                            <div className="flex items-center gap-2 bg-emerald-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-emerald-500/30">
                                <Zap className="text-emerald-400" size={18} />
                                <span className="font-bold text-emerald-400 text-sm">Seviye {level}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4">
                <AnimatePresence mode="wait">
                    {/* ─── Welcome Screen ─── */}
                    {phase === 'welcome' && (
                        <motion.div
                            key="welcome"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center max-w-xl"
                        >
                            {/* 3D Gummy Icon */}
                            <motion.div
                                className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-[40%] flex items-center justify-center"
                               
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Clock size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            {/* TUZÖ Badge */}
                            <div className="mb-6 inline-flex items-center gap-1.5 px-3 py-1 bg-violet-500/20 border border-violet-500/30 rounded-full">
                                <span className="text-[9px] font-black text-violet-300 uppercase tracking-wider">TUZÖ</span>
                                <span className="text-[9px] font-bold text-violet-400">5.2.1 Sayısal Akıl Yürütme</span>
                            </div>

                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                Zaman Gezgini
                            </h1>

                            <p className="text-slate-400 mb-8">
                                Saati oku, yelkovanı sürükle ve doğru zamanı göster!
                                Seviyeler ilerledikçe dakika farkları büyür ve geri sayma başlar.
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
                               
                            >
                                <div className="flex items-center gap-3">
                                    <Play size={28} className="fill-white" />
                                    <span>Başla</span>
                                </div>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* ─── Game Board ─── */}
                    {(phase === 'playing' || phase === 'feedback') && (
                        <motion.div
                            key="playing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full max-w-lg"
                        >
                            {/* Question Card */}
                            <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/20 mb-6">
                                <div className="text-center mb-2">
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Görev</p>
                                    <div className="bg-indigo-500/20 rounded-2xl p-4 border border-indigo-500/30">
                                        <p className="text-3xl font-black text-indigo-300 mb-1">
                                            {questionTime.getHours()}:{questionTime.getMinutes().toString().padStart(2, '0')}
                                        </p>
                                        <p className="text-base text-indigo-200 font-medium">
                                            Bu saatten{' '}
                                            <span
                                                className="font-black px-2 py-0.5 rounded-lg text-white"
                                                style={{
                                                    background: targetOffset >= 0
                                                        ? 'linear-gradient(135deg, #818CF8, #A78BFA)'
                                                        : 'linear-gradient(135deg, #F97316, #EF4444)',
                                                    boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.2)',
                                                }}
                                            >
                                                {Math.abs(targetOffset)} dakika {targetOffset >= 0 ? 'sonrasını' : 'öncesini'}
                                            </span>{' '}
                                            göster.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Clock + Check Button */}
                            <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/20">
                                <div className="flex flex-col items-center gap-6">
                                    {/* Clock */}
                                    <InlineClock
                                        hours={displayHour}
                                        minutes={userMinutes}
                                        isInteractive={phase === 'playing' && !isFeedbackActive}
                                        onMinuteChange={handleMinuteChange}
                                    />

                                    {/* Helper text */}
                                    <p className="text-slate-400 text-sm text-center">
                                        {phase === 'playing' && !isFeedbackActive
                                            ? '☝️ Yelkovanı (kırmızı) sürükle!'
                                            : 'Cevap kontrol ediliyor...'}
                                    </p>

                                    {/* Current user time display */}
                                    <div className="bg-slate-800/60 rounded-xl px-6 py-3 border border-white/10 text-center">
                                        <p className="text-xs text-slate-400 mb-1">Senin Cevabın</p>
                                        <p className="text-2xl font-black text-white">
                                            {displayHour}:{userMinutes.toString().padStart(2, '0')}
                                        </p>
                                    </div>

                                    {/* Check Answer Button */}
                                    {phase === 'playing' && !isFeedbackActive && (
                                        <motion.button
                                            whileHover={{ scale: 1.05, y: -2 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={checkAnswer}
                                            className="w-full px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl font-bold text-lg"
                                            style={{
                                                boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(16,185,129,0.4)',
                                                minHeight: '80px',
                                            }}
                                        >
                                            KONTROL ET ✓
                                        </motion.button>
                                    )}
                                </div>

                                {/* Feedback Banner */}
                                <GameFeedbackBanner feedback={feedbackState} />
                            </div>
                        </motion.div>
                    )}

                    {/* ─── Game Over Screen ─── */}
                    {phase === 'game_over' && (
                        <motion.div
                            key="game_over"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center max-w-xl"
                        >
                            <div
                                className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-red-500 to-rose-600 rounded-[40%] flex items-center justify-center"
                               
                            >
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
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
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

                    {/* ─── Victory Screen ─── */}
                    {phase === 'victory' && (
                        <motion.div
                            key="victory"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center max-w-xl"
                        >
                            <motion.div
                                className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-[40%] flex items-center justify-center"
                               
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
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
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
            </div>
        </div>
    );
};

export default TimeExplorerGame;
