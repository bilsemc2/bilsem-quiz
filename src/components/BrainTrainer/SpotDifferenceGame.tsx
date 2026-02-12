import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer, Target,
    XCircle, ChevronLeft, Zap, Heart, Eye
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useExam } from '../../contexts/ExamContext';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';

// ============== CONSTANTS ==============
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;

// ============== TYPES ==============
type Phase = 'welcome' | 'playing' | 'feedback' | 'game_over' | 'victory';

type DiffType = 'lightness' | 'hue' | 'radius' | 'scale' | 'rotation' | 'shape';

interface ShapeData {
    id: string;
    path: string;
}

interface TileStyle {
    hue: number;
    sat: number;
    light: number;
    radius: number;
    rotate: number;
    scale: number;
}

interface TileDecor {
    d1x: number; d1y: number; d1s: number;
    d2x: number; d2y: number; d2s: number;
}

interface TileData {
    index: number;
    style: TileStyle;
    shape: ShapeData;
    decor: TileDecor;
}

interface RoundData {
    size: number;
    total: number;
    oddIndex: number;
    diffType: DiffType;
    baseShape: ShapeData;
    oddShape: ShapeData;
    base: TileStyle;
    odd: TileStyle;
    perRoundTime: number;
}

interface SpotDifferenceGameProps {
    examMode?: boolean;
    examLevel?: number;
    examTimeLimit?: number;
}

// ============== GAME DATA ==============
const DIFF_LABELS: Record<DiffType, string> = {
    lightness: 'Açıklık',
    hue: 'Renk Tonu',
    radius: 'Köşe',
    scale: 'Boyut',
    rotation: 'Açı',
    shape: 'Şekil',
};

const SHAPES: ShapeData[] = [
    { id: 'triangle', path: 'M50 8 L92 88 L8 88 Z' },
    { id: 'star', path: 'M50 6 L62 34 L92 38 L68 56 L76 88 L50 70 L24 88 L32 56 L8 38 L38 34 Z' },
    { id: 'hex', path: 'M26 8 L74 8 L94 50 L74 92 L26 92 L6 50 Z' },
    { id: 'kite', path: 'M50 6 L88 40 L64 94 L36 94 L12 40 Z' },
    { id: 'drop', path: 'M50 6 C70 20 84 40 84 60 C84 80 68 94 50 94 C32 94 16 80 16 60 C16 40 30 20 50 6 Z' },
    { id: 'blob', path: 'M58 8 C74 10 90 24 92 42 C94 60 86 80 68 88 C50 96 30 92 18 78 C6 64 4 44 16 28 C28 12 42 6 58 8 Z' },
    { id: 'diamond', path: 'M50 4 L94 50 L50 96 L6 50 Z' },
    { id: 'octagon', path: 'M30 6 L70 6 L94 30 L94 70 L70 94 L30 94 L6 70 L6 30 Z' },
    { id: 'hourglass', path: 'M18 10 L82 10 L60 50 L82 90 L18 90 L40 50 Z' },
    { id: 'chevron', path: 'M8 32 L50 8 L92 32 L70 54 L92 76 L50 92 L8 76 L30 54 Z' },
    { id: 'leaf', path: 'M14 68 C24 38 48 16 72 14 C90 12 94 28 88 46 C80 74 52 92 28 88 C16 86 10 80 14 68 Z' },
    { id: 'wave', path: 'M8 60 C22 40 40 40 52 54 C64 68 82 68 92 50 C86 78 66 92 44 90 C24 88 10 78 8 60 Z' },
];

const GHOST_PATH = 'M60 12 C78 14 92 30 90 48 C88 66 72 82 54 88 C36 94 16 88 10 70 C4 52 10 30 26 20 C40 10 46 10 60 12 Z';

// Feedback mesajları artık useGameFeedback hook'unda yönetiliyor

// ============== HELPERS ==============
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const createDecor = (): TileDecor => ({
    d1x: randInt(8, 58), d1y: randInt(6, 56), d1s: randInt(18, 32),
    d2x: randInt(32, 72), d2y: randInt(30, 70), d2s: randInt(12, 24),
});

// Adaptive difficulty based on BrainTrainer level (1-20)
const getLevelConfig = (level: number) => {
    // Grid size: 3×3 → 6×6
    const gridMin = Math.min(3 + Math.floor(level / 5), 5);
    const gridMax = Math.min(gridMin + 1, 6);

    // Per-round time decreases as level increases
    const perRoundTime = Math.max(5, 15 - Math.floor(level / 3));

    // Deltas get smaller (harder to spot) as level increases
    const difficultyFactor = Math.max(0.3, 1 - (level - 1) * 0.035);

    const allTypes: DiffType[] = ['lightness', 'hue', 'radius', 'scale', 'rotation', 'shape'];
    // Fewer types at lower levels
    const typeCount = Math.min(allTypes.length, 3 + Math.floor(level / 4));
    const types = allTypes.slice(0, typeCount);

    return {
        gridMin, gridMax, perRoundTime, types,
        deltas: {
            lightness: Math.round(24 * difficultyFactor),
            hue: Math.round(22 * difficultyFactor),
            radius: Math.round(28 * difficultyFactor),
            scale: +(0.16 * difficultyFactor).toFixed(3),
            rotation: Math.round(14 * difficultyFactor),
        },
    };
};

const createRound = (level: number): RoundData => {
    const config = getLevelConfig(level);
    const size = randInt(config.gridMin, config.gridMax);
    const total = size * size;
    const oddIndex = randInt(0, total - 1);
    const diffType = pick(config.types);
    const baseShape = pick(SHAPES);

    const base: TileStyle = {
        hue: randInt(0, 360),
        sat: randInt(62, 88),
        light: randInt(50, 72),
        radius: randInt(10, 48),
        rotate: randInt(-10, 10),
        scale: 1,
    };

    const odd: TileStyle = { ...base };
    let oddShape = baseShape;
    const sign = Math.random() > 0.5 ? 1 : -1;

    if (diffType === 'shape') {
        const choices = SHAPES.filter(s => s.id !== baseShape.id);
        oddShape = pick(choices);
    } else if (diffType === 'lightness') {
        odd.light = clamp(base.light + sign * config.deltas.lightness, 18, 82);
    } else if (diffType === 'hue') {
        odd.hue = (base.hue + sign * config.deltas.hue + 360) % 360;
    } else if (diffType === 'radius') {
        odd.radius = clamp(base.radius + sign * config.deltas.radius, 4, 70);
    } else if (diffType === 'scale') {
        odd.scale = clamp(base.scale + sign * config.deltas.scale, 0.74, 1.22);
    } else if (diffType === 'rotation') {
        odd.rotate = base.rotate + sign * config.deltas.rotation;
    }

    return { size, total, oddIndex, diffType, baseShape, oddShape, base, odd, perRoundTime: config.perRoundTime };
};

// ============== TILE COMPONENT ==============
const Tile: React.FC<{
    tile: TileData;
    isOdd: boolean;
    isSelected: boolean;
    isRevealed: boolean;
    onClick: () => void;
    disabled: boolean;
}> = ({ tile, isOdd, isSelected, isRevealed, onClick, disabled }) => {
    const s = tile.style;
    const d = tile.decor;

    return (
        <motion.button
            whileHover={disabled ? {} : { scale: 1.05 }}
            whileTap={disabled ? {} : { scale: 0.95 }}
            animate={isRevealed && isOdd ? { scale: [1, 1.08, 1], boxShadow: ['0 0 0 4px rgba(52,211,153,0.3)', '0 0 0 8px rgba(52,211,153,0.5)', '0 0 0 4px rgba(52,211,153,0.3)'] } : {}}
            transition={isRevealed && isOdd ? { duration: 1, repeat: Infinity } : {}}
            onClick={onClick}
            disabled={disabled}
            className="aspect-square relative overflow-hidden grid place-items-center"
            style={{
                background: `radial-gradient(circle at 25% 20%, hsl(${s.hue} ${s.sat}% ${s.light + 14}%), hsl(${s.hue} ${s.sat}% ${s.light}%))`,
                borderRadius: `${s.radius}%`,
                transform: `rotate(${s.rotate}deg) scale(${s.scale})`,
                border: isRevealed && isOdd
                    ? '3px solid rgba(52, 211, 153, 0.9)'
                    : isSelected
                        ? '3px solid rgba(251, 191, 36, 0.9)'
                        : '2px solid rgba(255, 255, 255, 0.15)',
                boxShadow: isRevealed && isOdd
                    ? '0 0 0 4px rgba(52, 211, 153, 0.3), inset 0 -6px 12px rgba(0,0,0,0.15)'
                    : isSelected
                        ? '0 0 0 4px rgba(251, 191, 36, 0.3), inset 0 -6px 12px rgba(0,0,0,0.15)'
                        : 'inset 0 -6px 12px rgba(0,0,0,0.15), inset 0 4px 8px rgba(255,255,255,0.2)',
                cursor: disabled ? 'default' : 'pointer',
                isolation: 'isolate',
                transition: 'border 0.2s, box-shadow 0.2s',
            }}
        >
            {/* Decorative circles */}
            <span
                className="absolute rounded-full pointer-events-none"
                style={{
                    width: `${d.d1s}%`, height: `${d.d1s}%`,
                    top: `${d.d1y}%`, left: `${d.d1x}%`,
                    opacity: 0.45,
                    background: `radial-gradient(circle at 30% 30%, hsla(${s.hue + 28}, ${s.sat}%, ${s.light + 26}%, 0.7), transparent 70%)`,
                    filter: 'blur(0.4px)',
                }}
            />
            <span
                className="absolute rounded-full pointer-events-none"
                style={{
                    width: `${d.d2s}%`, height: `${d.d2s}%`,
                    top: `${d.d2y}%`, left: `${d.d2x}%`,
                    opacity: 0.35,
                    background: `radial-gradient(circle at 70% 30%, hsla(${s.hue - 22}, ${s.sat}%, ${s.light + 22}%, 0.6), transparent 70%)`,
                    filter: 'blur(0.4px)',
                }}
            />

            {/* Ghost shape */}
            <svg
                className="absolute pointer-events-none"
                style={{ inset: '8%', fill: `hsl(${s.hue + 36} ${s.sat}% ${s.light + 22}%)`, opacity: 0.22 }}
                viewBox="0 0 100 100"
                aria-hidden="true"
            >
                <path d={GHOST_PATH} />
            </svg>

            {/* Main shape */}
            <svg
                className="absolute pointer-events-none"
                style={{ inset: '18%', fill: `hsl(${s.hue} ${s.sat}% ${s.light + 6}%)`, opacity: 0.92 }}
                viewBox="0 0 100 100"
                aria-hidden="true"
            >
                <path d={tile.shape.path} />
            </svg>
        </motion.button>
    );
};

// ============== MAIN COMPONENT ==============
const SpotDifferenceGame: React.FC<SpotDifferenceGameProps> = ({ examMode: examModeProp = false }) => {
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();
    const navigate = useNavigate();
    const { submitResult } = useExam();
    const hasSavedRef = useRef(false);

    // Exam Mode
    const examMode = examModeProp || location.state?.examMode === true;
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

    // Core State
    const [phase, setPhase] = useState<Phase>('welcome');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [level, setLevel] = useState(1);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);

    // Game State
    const [roundData, setRoundData] = useState<RoundData | null>(null);
    const [roundTimeLeft, setRoundTimeLeft] = useState(0);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    // Refs
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const roundTimerRef = useRef<number>(0);
    const startTimeRef = useRef<number>(0);

    // Back link
    const backLink = examMode ? '/atolyeler/sinav-simulasyonu' : '/atolyeler/bireysel-degerlendirme';

    // Global Timer
    useEffect(() => {
        if (phase === 'playing' && timeLeft > 0) {
            timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
        } else if (timeLeft === 0 && phase === 'playing') {
            handleGameOver();
        }
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [phase, timeLeft]);

    // Per-round timer (using rAF for precision)
    useEffect(() => {
        if (phase !== 'playing' || !roundData || selectedIndex !== null) return;

        const start = performance.now();
        const tick = (now: number) => {
            const elapsed = (now - start) / 1000;
            const remaining = Math.max(0, roundData.perRoundTime - elapsed);
            setRoundTimeLeft(remaining);
            if (remaining <= 0) {
                // Time ran out for this round — wrong answer
                handlePick(-1);
                return;
            }
            roundTimerRef.current = requestAnimationFrame(tick);
        };
        roundTimerRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(roundTimerRef.current);
    }, [phase, roundData, selectedIndex]);

    // Generate tiles
    const tiles = useMemo<TileData[]>(() => {
        if (!roundData) return [];
        return Array.from({ length: roundData.total }, (_, index) => ({
            index,
            style: index === roundData.oddIndex ? roundData.odd : roundData.base,
            shape: index === roundData.oddIndex ? roundData.oddShape : roundData.baseShape,
            decor: createDecor(),
        }));
    }, [roundData]);

    // Start new round
    const startNewRound = useCallback((lvl: number) => {
        const data = createRound(lvl);
        setRoundData(data);
        setRoundTimeLeft(data.perRoundTime);
        setSelectedIndex(null);
    }, []);

    // Start Game
    const handleStart = useCallback(() => {
        setPhase('playing');
        setScore(0);
        setLives(INITIAL_LIVES);
        setLevel(1);
        setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
        startTimeRef.current = Date.now();
        hasSavedRef.current = false;
        startNewRound(1);
    }, [examMode, examTimeLimit, startNewRound]);

    // Auto Start
    useEffect(() => {
        if ((location.state?.autoStart || examMode) && phase === 'welcome') {
            handleStart();
        }
    }, [location.state, examMode, phase, handleStart]);

    // Shared Feedback Hook
    const lastPickRef = useRef<{ correct: boolean; roundTimeLeft: number }>({ correct: false, roundTimeLeft: 0 });

    const { feedbackState, showFeedback, isFeedbackActive } = useGameFeedback({
        onFeedbackEnd: (correct) => {
            if (correct) {
                const timeBonus = Math.round(lastPickRef.current.roundTimeLeft * 5);
                setScore(s => s + 10 * level + timeBonus);
                if (level >= MAX_LEVEL) {
                    handleVictory();
                } else {
                    setLevel(l => l + 1);
                    startNewRound(level + 1);
                    setPhase('playing');
                }
            } else {
                const newLives = lives - 1;
                setLives(newLives);
                if (newLives <= 0) {
                    handleGameOver();
                } else {
                    startNewRound(level);
                    setPhase('playing');
                }
            }
        },
    });

    // Handle Pick
    const handlePick = useCallback((index: number) => {
        if (!roundData || selectedIndex !== null) return;
        cancelAnimationFrame(roundTimerRef.current);

        const correct = index === roundData.oddIndex;
        setSelectedIndex(index);
        setPhase('feedback');
        lastPickRef.current = { correct, roundTimeLeft };
        showFeedback(correct);
    }, [roundData, selectedIndex, roundTimeLeft, showFeedback]);

    // Game Over
    const handleGameOver = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        setPhase('game_over');

        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

        if (examMode) {
            const passed = level >= 5;
            submitResult(passed, score, 1000, duration).then(() => {
                navigate('/atolyeler/sinav-simulasyonu/devam');
            });
            return;
        }

        await saveGamePlay({
            game_id: 'farki-bul',
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
            submitResult(true, score + 200, 1000, duration).then(() => {
                navigate('/atolyeler/sinav-simulasyonu/devam');
            });
            return;
        }

        await saveGamePlay({
            game_id: 'farki-bul',
            score_achieved: score + 200,
            duration_seconds: duration,
            metadata: { levels_completed: MAX_LEVEL, victory: true },
        });
    }, [saveGamePlay, score, examMode, submitResult, navigate]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // ============== RENDER ==============
    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-950 to-slate-900 text-white">
            {/* Decorative Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <div className="relative z-10 p-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Link to={backLink} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                        <ChevronLeft size={20} />
                        <span>Geri</span>
                    </Link>

                    {(phase === 'playing' || phase === 'feedback') && (
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="flex items-center gap-2 bg-amber-500/20 px-3 py-2 rounded-xl">
                                <Star className="text-amber-400" size={16} />
                                <span className="font-bold text-amber-400 text-sm">{score}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
                                    <Heart key={i} size={14} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-400/30'} />
                                ))}
                            </div>
                            <div className="flex items-center gap-2 bg-blue-500/20 px-3 py-2 rounded-xl">
                                <Timer className="text-blue-400" size={16} />
                                <span className={`font-bold text-sm ${timeLeft <= 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'}`}>
                                    {formatTime(timeLeft)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 bg-emerald-500/20 px-3 py-2 rounded-xl">
                                <Zap className="text-emerald-400" size={16} />
                                <span className="font-bold text-emerald-400 text-sm">Lv.{level}</span>
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
                        <motion.div
                            key="welcome"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center max-w-xl"
                        >
                            <motion.div
                                className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-fuchsia-400 to-purple-600 rounded-[40%] flex items-center justify-center"
                                style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }}
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            >
                                <Eye size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 bg-violet-500/20 border border-violet-500/30 rounded-full">
                                <span className="text-[9px] font-black text-violet-300 uppercase tracking-wider">TUZÖ</span>
                                <span className="text-[9px] font-bold text-violet-400">5.7.1 Seçici Dikkat</span>
                            </div>

                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
                                Farkı Bul
                            </h1>

                            <p className="text-slate-400 mb-8">
                                Bir kare diğerlerinden farklı! Renk, şekil, boyut ve açı ipuçlarını gözlemle, farklı olanı bul.
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
                                className="px-10 py-5 bg-gradient-to-r from-fuchsia-500 to-purple-600 rounded-2xl font-bold text-xl"
                                style={{ boxShadow: '0 8px 32px rgba(192, 38, 211, 0.4)' }}
                            >
                                <div className="flex items-center gap-3">
                                    <Play size={28} className="fill-white" />
                                    <span>Gözlerini Aç!</span>
                                </div>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* Game Board */}
                    {(phase === 'playing' || phase === 'feedback') && roundData && (
                        <motion.div
                            key="playing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full max-w-lg"
                        >
                            {/* Round Timer Bar */}
                            <div className="mb-4 h-2 bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{
                                        width: `${(roundTimeLeft / roundData.perRoundTime) * 100}%`,
                                        background: roundTimeLeft < 3
                                            ? 'linear-gradient(90deg, #ef4444, #f97316)'
                                            : 'linear-gradient(90deg, #a855f7, #6366f1)',
                                        transition: 'background 0.3s',
                                    }}
                                />
                            </div>

                            {/* Difference hint */}
                            <div className="mb-4 text-center">
                                <span className="text-sm text-slate-400">
                                    Fark Tipi: <span className="text-fuchsia-300 font-bold">{DIFF_LABELS[roundData.diffType]}</span>
                                </span>
                            </div>

                            {/* Grid wrapper — relative so feedbackState overlays without layout shift */}
                            <div className="relative">
                                <div
                                    className="grid gap-2 sm:gap-3"
                                    style={{ gridTemplateColumns: `repeat(${roundData.size}, minmax(0, 1fr))` }}
                                >
                                    {tiles.map(tile => (
                                        <Tile
                                            key={tile.index}
                                            tile={tile}
                                            isOdd={tile.index === roundData.oddIndex}
                                            isSelected={tile.index === selectedIndex}
                                            isRevealed={isFeedbackActive}
                                            onClick={() => handlePick(tile.index)}
                                            disabled={phase !== 'playing'}
                                        />
                                    ))}
                                </div>

                                {/* Shared Feedback Banner */}
                                <GameFeedbackBanner feedback={feedbackState}>
                                    <p className="text-xs text-slate-400">
                                        Fark: {DIFF_LABELS[roundData.diffType]}
                                    </p>
                                </GameFeedbackBanner>
                            </div>
                        </motion.div>
                    )}

                    {/* Game Over */}
                    {phase === 'game_over' && (
                        <motion.div
                            key="game_over"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center max-w-xl"
                        >
                            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-red-500 to-rose-600 rounded-3xl flex items-center justify-center"
                                style={{ boxShadow: 'inset 0 -6px 12px rgba(0,0,0,0.2), inset 0 6px 12px rgba(255,255,255,0.2), 0 8px 24px rgba(0,0,0,0.3)' }}
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

                    {/* Victory */}
                    {phase === 'victory' && (
                        <motion.div
                            key="victory"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center max-w-xl"
                        >
                            <motion.div
                                className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-3xl flex items-center justify-center"
                                style={{ boxShadow: 'inset 0 -6px 12px rgba(0,0,0,0.2), inset 0 6px 12px rgba(255,255,255,0.2), 0 8px 24px rgba(0,0,0,0.3)' }}
                                animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                <Trophy size={48} className="text-white" />
                            </motion.div>

                            <h2 className="text-3xl font-bold text-amber-400 mb-4">🎉 Şampiyon!</h2>

                            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 mb-6">
                                <p className="text-4xl font-bold text-amber-400">{score + 200}</p>
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

export default SpotDifferenceGame;
