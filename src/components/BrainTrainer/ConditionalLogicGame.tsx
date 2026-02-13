import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer, Target,
    CheckCircle2, XCircle, ChevronLeft, Zap, Heart, BrainCircuit
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';
import { useExam } from '../../contexts/ExamContext';

// ─── Constants ──────────────────────────────────────
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;


// ─── Shape / Color Types ────────────────────────────
type ShapeType = 'Circle' | 'Square' | 'Triangle' | 'Star' | 'Diamond';
type ColorType = 'Red' | 'Blue' | 'Green' | 'Yellow' | 'Purple';

interface GameObject {
    id: string;
    shape: ShapeType;
    color: ColorType;
}

const SHAPES: ShapeType[] = ['Circle', 'Square', 'Triangle', 'Star', 'Diamond'];
const COLORS: ColorType[] = ['Red', 'Blue', 'Green', 'Yellow', 'Purple'];

const SHAPE_NAMES: Record<ShapeType, string> = {
    Circle: 'Daire', Square: 'Kare', Triangle: 'Üçgen', Star: 'Yıldız', Diamond: 'Elmas',
};
const COLOR_NAMES: Record<ColorType, string> = {
    Red: 'Kırmızı', Blue: 'Mavi', Green: 'Yeşil', Yellow: 'Sarı', Purple: 'Mor',
};

const COLOR_VALUES: Record<ColorType, string> = {
    Red: '#ef4444', Blue: '#3b82f6', Green: '#22c55e', Yellow: '#eab308', Purple: '#a855f7',
};

// ─── Helpers ────────────────────────────────────────
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const uid = () => Math.random().toString(36).substring(2, 8);

const getObjectCount = (level: number): number => {
    if (level <= 7) return 4;
    if (level <= 14) return 6;
    return 8;
};

// ─── Round Generator ────────────────────────────────
interface RoundData {
    objects: GameObject[];
    instruction: string;
    targetId: string;
}

const generateRound = (level: number): RoundData => {
    const count = getObjectCount(level);

    // Generate objects
    const objects: GameObject[] = [];
    for (let i = 0; i < count; i++) {
        objects.push({ id: uid(), shape: pick(SHAPES), color: pick(COLORS) });
    }

    // Find singletons (unique color+shape combos) for unambiguous targets
    const comboCounts: Record<string, number> = {};
    objects.forEach(o => {
        const key = `${o.color}-${o.shape}`;
        comboCounts[key] = (comboCounts[key] || 0) + 1;
    });
    const singletons = objects.filter(o => comboCounts[`${o.color}-${o.shape}`] === 1);
    if (singletons.length < 2) return generateRound(level); // retry

    const targetA = pick(singletons);
    let targetB = pick(singletons);
    while (targetB.id === targetA.id) targetB = pick(singletons);

    // Generate condition (6 types)
    const logicType = Math.floor(Math.random() * 6);
    let condText = '';
    let condTrue = false;

    switch (logicType) {
        case 0: { // Existence
            const test = Math.random() > 0.5 ? pick(objects) : { color: pick(COLORS), shape: pick(SHAPES) };
            condTrue = objects.some(o => o.color === test.color && o.shape === test.shape);
            condText = `bir ${COLOR_NAMES[test.color]} ${SHAPE_NAMES[test.shape]} varsa`;
            break;
        }
        case 1: { // Count color > N
            const c = pick(COLORS);
            const n = objects.filter(o => o.color === c).length;
            const t = Math.max(0, n - 1 + Math.floor(Math.random() * 3));
            condTrue = n > t;
            condText = `${t} adetten fazla ${COLOR_NAMES[c]} nesne varsa`;
            break;
        }
        case 2: { // Count shape < N
            const s = pick(SHAPES);
            const n = objects.filter(o => o.shape === s).length;
            const t = Math.max(1, n - 1 + Math.floor(Math.random() * 3));
            condTrue = n < t;
            condText = `${t} adetten az ${SHAPE_NAMES[s]} varsa`;
            break;
        }
        case 3: { // No color
            const c = pick(COLORS);
            condTrue = objects.filter(o => o.color === c).length === 0;
            condText = `hiç ${COLOR_NAMES[c]} nesne yoksa`;
            break;
        }
        case 4: { // Majority
            const c1 = pick(COLORS);
            let c2 = pick(COLORS);
            while (c1 === c2) c2 = pick(COLORS);
            condTrue = objects.filter(o => o.color === c1).length > objects.filter(o => o.color === c2).length;
            condText = `${COLOR_NAMES[c1]} nesneler ${COLOR_NAMES[c2]} olanlardan fazlaysa`;
            break;
        }
        case 5: { // Equality
            const s = pick(SHAPES);
            const c = pick(COLORS);
            condTrue = objects.filter(o => o.shape === s).length === objects.filter(o => o.color === c).length;
            condText = `${SHAPE_NAMES[s]} sayısı ${COLOR_NAMES[c]} nesne sayısına eşitse`;
            break;
        }
    }

    const finalTarget = condTrue ? targetA : targetB;
    const descA = `${COLOR_NAMES[targetA.color]} ${SHAPE_NAMES[targetA.shape]}`;
    const descB = `${COLOR_NAMES[targetB.color]} ${SHAPE_NAMES[targetB.shape]}`;
    const instruction = `Eğer ${condText}, ${descA} seç, aksi halde ${descB} seç.`;

    return { objects, instruction, targetId: finalTarget.id };
};

// ─── ShapeIcon ──────────────────────────────────────
const ShapeIcon: React.FC<{ shape: ShapeType; color: ColorType; size?: number }> = ({ shape, color, size = 64 }) => {
    const fill = COLOR_VALUES[color];
    const s = size;

    switch (shape) {
        case 'Circle':
            return (
                <svg width={s} height={s} viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill={fill} stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                    <ellipse cx="40" cy="35" rx="14" ry="8" fill="rgba(255,255,255,0.25)" transform="rotate(-20 40 35)" />
                </svg>
            );
        case 'Square':
            return (
                <svg width={s} height={s} viewBox="0 0 100 100">
                    <rect x="12" y="12" width="76" height="76" rx="8" fill={fill} stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                    <rect x="20" y="18" width="28" height="12" rx="4" fill="rgba(255,255,255,0.2)" />
                </svg>
            );
        case 'Triangle':
            return (
                <svg width={s} height={s} viewBox="0 0 100 100">
                    <polygon points="50,10 90,85 10,85" fill={fill} stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                    <polygon points="50,24 36,55 50,55" fill="rgba(255,255,255,0.2)" />
                </svg>
            );
        case 'Star':
            return (
                <svg width={s} height={s} viewBox="0 0 100 100">
                    <polygon points="50,5 61,35 95,35 68,55 79,88 50,68 21,88 32,55 5,35 39,35" fill={fill} stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                    <polygon points="50,18 55,33 45,33" fill="rgba(255,255,255,0.2)" />
                </svg>
            );
        case 'Diamond':
            return (
                <svg width={s} height={s} viewBox="0 0 100 100">
                    <polygon points="50,8 92,50 50,92 8,50" fill={fill} stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                    <polygon points="50,20 38,50 50,50" fill="rgba(255,255,255,0.2)" />
                </svg>
            );
    }
};

// ─── Types ──────────────────────────────────────────
type Phase = 'welcome' | 'playing' | 'feedback' | 'game_over' | 'victory';

interface ConditionalLogicGameProps {
    examMode?: boolean;
    examLevel?: number;
    examTimeLimit?: number;
}

// ─── Component ──────────────────────────────────────
const ConditionalLogicGame: React.FC<ConditionalLogicGameProps> = ({ examMode = false }) => {
    const { saveGamePlay } = useGamePersistence();
    const hasSavedRef = useRef(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { submitResult } = useExam();
    const { feedbackState, showFeedback } = useGameFeedback();

    const [phase, setPhase] = useState<Phase>('welcome');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [level, setLevel] = useState(1);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const [round, setRound] = useState<RoundData | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);

    // Timer
    useEffect(() => {
        if (phase === 'playing' && timeLeft > 0) {
            timerRef.current = setTimeout(() => setTimeLeft(p => p - 1), 1000);
        } else if (timeLeft === 0 && phase === 'playing') {
            handleGameOver();
        }
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [phase, timeLeft]);

    // Generate round on level change
    useEffect(() => {
        if (phase === 'playing') {
            setRound(generateRound(level));
            setSelectedId(null);
        }
    }, [phase, level]);

    // Start
    const handleStart = useCallback(() => {
        window.scrollTo(0, 0);
        setPhase('playing');
        setScore(0);
        setLives(INITIAL_LIVES);
        setLevel(1);
        setTimeLeft(TIME_LIMIT);
        startTimeRef.current = Date.now();
        hasSavedRef.current = false;
    }, []);

    // Auto-start
    useEffect(() => {
        if ((location.state?.autoStart || examMode) && phase === 'welcome') handleStart();
    }, [location.state, examMode, phase, handleStart]);

    // Game Over
    const handleGameOver = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        setPhase('game_over');
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (examMode) {
            await submitResult(level >= 5, score, 1000, duration);
            setTimeout(() => navigate('/atolyeler/sinav-simulasyonu/devam'), 1500);
            return;
        }
        await saveGamePlay({
            game_id: 'kosullu-yonerge',
            score_achieved: score,
            duration_seconds: duration,
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
            await submitResult(true, score, 1000, duration);
            setTimeout(() => navigate('/atolyeler/sinav-simulasyonu/devam'), 1500);
            return;
        }
        await saveGamePlay({
            game_id: 'kosullu-yonerge',
            score_achieved: score,
            duration_seconds: duration,
            metadata: { levels_completed: MAX_LEVEL, victory: true },
        });
    }, [saveGamePlay, score, examMode, submitResult, navigate]);

    // Object click
    const handleObjectClick = useCallback((id: string) => {
        if (!round || phase !== 'playing' || selectedId) return;
        const correct = id === round.targetId;
        setSelectedId(id);
        showFeedback(correct);

        setPhase('feedback');

        const newScore = correct ? score + 10 * level : score;
        const newLives = correct ? lives : lives - 1;
        if (correct) setScore(newScore);
        else setLives(newLives);

        setTimeout(() => {
            if (!correct && newLives <= 0) { handleGameOver(); return; }
            if (correct && level >= MAX_LEVEL) { handleVictory(); return; }
            if (correct) setLevel(l => l + 1);
            else setRound(generateRound(level)); // new round on wrong answer, same level
            setSelectedId(null);
            setPhase('playing');
        }, 2000);
    }, [round, phase, selectedId, score, lives, level, handleGameOver, handleVictory]);

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white">
            {/* Decorative BG */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <div className="relative z-10 p-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Link to="/atolyeler/bireysel-degerlendirme" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                        <ChevronLeft size={20} /><span>Geri</span>
                    </Link>
                    {(phase === 'playing' || phase === 'feedback') && (
                        <div className="flex items-center gap-3 sm:gap-6 flex-wrap justify-end">
                            <div className="flex items-center gap-2 bg-amber-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-amber-500/30">
                                <Star className="text-amber-400" size={18} />
                                <span className="font-bold text-amber-400 text-sm">{score}</span>
                            </div>
                            <div className="flex items-center gap-1 bg-red-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-red-500/30">
                                {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
                                    <Heart key={i} size={14} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-400/30'} />
                                ))}
                            </div>
                            <div className="flex items-center gap-2 bg-blue-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-blue-500/30">
                                <Timer className="text-blue-400" size={18} />
                                <span className={`font-bold text-sm ${timeLeft <= 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'}`}>
                                    {formatTime(timeLeft)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 bg-emerald-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-emerald-500/30">
                                <Zap className="text-emerald-400" size={18} />
                                <span className="font-bold text-emerald-400 text-sm">Seviye {level}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4">
                <AnimatePresence mode="wait">
                    {/* ── Welcome ── */}
                    {phase === 'welcome' && (
                        <motion.div key="welcome" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
                            <div className="mb-6 inline-flex items-center gap-1.5 px-3 py-1 bg-violet-500/20 border border-violet-500/30 rounded-full">
                                <span className="text-[9px] font-black text-violet-300 uppercase tracking-wider">TUZÖ</span>
                                <span className="text-[9px] font-bold text-violet-400">5.5.2 Koşullu Çıkarım</span>
                            </div>

                            <motion.div
                                className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-indigo-400 to-blue-600 rounded-[40%] flex items-center justify-center"
                                style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }}
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <BrainCircuit size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">
                                Koşullu Yönerge Takibi
                            </h1>
                            <p className="text-slate-400 mb-6">
                                Mantık yönergesini oku, koşulu değerlendir ve <span className="font-bold text-white">doğru nesneyi</span> seç!
                            </p>

                            {/* Example */}
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 mb-6 border border-white/10 text-left">
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-3 text-center">Örnek Yönerge</p>
                                <p className="text-sm text-slate-300 italic leading-relaxed">
                                    "Eğer bir <span className="text-blue-400 font-bold">Mavi Daire</span> varsa, <span className="text-red-400 font-bold">Kırmızı Kare</span> seç,
                                    aksi halde <span className="text-green-400 font-bold">Yeşil Üçgen</span> seç."
                                </p>
                            </div>

                            <div className="flex flex-wrap justify-center gap-4 mb-8">
                                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2">
                                    <Heart className="text-red-400" size={16} /><span className="text-sm text-slate-300">{INITIAL_LIVES} Can</span>
                                </div>
                                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2">
                                    <Timer className="text-blue-400" size={16} /><span className="text-sm text-slate-300">{TIME_LIMIT / 60} Dakika</span>
                                </div>
                                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2">
                                    <Target className="text-emerald-400" size={16} /><span className="text-sm text-slate-300">{MAX_LEVEL} Seviye</span>
                                </div>
                            </div>

                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart}
                                className="px-10 py-5 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-2xl font-bold text-xl"
                                style={{ boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)' }}
                            >
                                <div className="flex items-center gap-3">
                                    <Play size={28} className="fill-white" /><span>Başla</span>
                                </div>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* ── Playing ── */}
                    {(phase === 'playing' || phase === 'feedback') && round && (
                        <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-4xl">
                            {/* Instruction Card */}
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gradient-to-r from-indigo-600/80 to-blue-600/80 backdrop-blur-xl rounded-2xl p-5 sm:p-6 mb-6 border border-indigo-400/20 relative overflow-hidden"
                                style={{ boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3)' }}
                            >
                                <div className="absolute top-0 right-0 p-3 opacity-10">
                                    <BrainCircuit size={80} />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-2 opacity-80">
                                        <Zap size={14} />
                                        <p className="text-xs font-bold uppercase tracking-wider">Mantık Yönergesi</p>
                                    </div>
                                    <p className="text-lg sm:text-xl font-medium leading-relaxed">{round.instruction}</p>
                                </div>
                            </motion.div>

                            {/* Object Grid */}
                            <div className={`grid gap-3 sm:gap-4 ${round.objects.length <= 4 ? 'grid-cols-2 sm:grid-cols-4' : round.objects.length <= 6 ? 'grid-cols-3 sm:grid-cols-3' : 'grid-cols-4 sm:grid-cols-4'}`}>
                                {round.objects.map((obj, idx) => {
                                    const isSelected = selectedId === obj.id;
                                    const isTarget = obj.id === round.targetId;
                                    const showResults = phase === 'feedback';

                                    let borderColor = 'border-white/10';
                                    let bg = 'bg-white/5';
                                    let extraClass = 'hover:bg-white/10 hover:border-white/20 cursor-pointer';

                                    if (showResults) {
                                        if (isSelected && feedbackState?.correct) {
                                            borderColor = 'border-emerald-400';
                                            bg = 'bg-emerald-500/20';
                                            extraClass = 'ring-2 ring-emerald-400/50';
                                        } else if (isSelected && !feedbackState?.correct) {
                                            borderColor = 'border-red-400';
                                            bg = 'bg-red-500/20';
                                            extraClass = 'ring-2 ring-red-400/50';
                                        } else if (isTarget && !feedbackState?.correct) {
                                            borderColor = 'border-emerald-400/50';
                                            bg = 'bg-emerald-500/10';
                                            extraClass = 'opacity-60';
                                        } else {
                                            extraClass = 'opacity-30 cursor-default';
                                        }
                                    }

                                    return (
                                        <motion.button
                                            key={obj.id}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: idx * 0.06 }}
                                            disabled={phase !== 'playing'}
                                            onClick={() => handleObjectClick(obj.id)}
                                            className={`relative aspect-square rounded-2xl border-2 ${borderColor} ${bg} ${extraClass} transition-all duration-300 flex flex-col items-center justify-center min-h-[80px]`}
                                            style={{ boxShadow: 'inset 0 -3px 6px rgba(0,0,0,0.2), inset 0 3px 6px rgba(255,255,255,0.05)' }}
                                            whileHover={phase === 'playing' ? { scale: 1.05, y: -4 } : {}}
                                            whileTap={phase === 'playing' ? { scale: 0.95 } : {}}
                                        >
                                            <ShapeIcon shape={obj.shape} color={obj.color} size={round.objects.length > 6 ? 48 : 64} />
                                            {showResults && isSelected && (
                                                <div className="absolute top-2 right-2">
                                                    {feedbackState?.correct
                                                        ? <CheckCircle2 size={20} className="text-emerald-400" />
                                                        : <XCircle size={20} className="text-red-400" />
                                                    }
                                                </div>
                                            )}
                                            {showResults && isTarget && !feedbackState?.correct && !isSelected && (
                                                <div className="absolute top-2 right-2">
                                                    <CheckCircle2 size={20} className="text-emerald-400/60" />
                                                </div>
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {/* ── Game Over ── */}
                    {phase === 'game_over' && (
                        <motion.div key="game_over" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
                            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-red-500 to-rose-600 rounded-[40%] flex items-center justify-center"
                                style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }}>
                                <XCircle size={48} className="text-white" />
                            </div>
                            <h2 className="text-3xl font-bold text-red-400 mb-4">Oyun Bitti!</h2>
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center"><p className="text-slate-400 text-sm">Skor</p><p className="text-2xl font-bold text-amber-400">{score}</p></div>
                                    <div className="text-center"><p className="text-slate-400 text-sm">Seviye</p><p className="text-2xl font-bold text-emerald-400">{level}</p></div>
                                </div>
                            </div>
                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart}
                                className="px-10 py-5 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-2xl font-bold text-xl"
                                style={{ boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)' }}>
                                <div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Dene</span></div>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* ── Victory ── */}
                    {phase === 'victory' && (
                        <motion.div key="victory" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
                            <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-[40%] flex items-center justify-center"
                                style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }}
                                animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                                <Trophy size={48} className="text-white" />
                            </motion.div>
                            <h2 className="text-3xl font-bold text-amber-400 mb-4">🎉 Şampiyon!</h2>
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10">
                                <p className="text-4xl font-bold text-amber-400">{score}</p>
                                <p className="text-slate-400">Toplam Puan</p>
                            </div>
                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart}
                                className="px-10 py-5 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-2xl font-bold text-xl"
                                style={{ boxShadow: '0 8px 32px rgba(245, 158, 11, 0.4)' }}>
                                <div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Oyna</span></div>
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Feedback Overlay */}
                <GameFeedbackBanner feedback={feedbackState} />
            </div>
        </div>
    );
};

export default ConditionalLogicGame;

