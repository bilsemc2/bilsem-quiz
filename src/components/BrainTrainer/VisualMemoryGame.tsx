import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer, Target,
    XCircle, ChevronLeft, Zap, Heart, Eye,
    Circle, Square, Triangle, Hexagon, Diamond,
    Cloud, Sun, Moon, Anchor, Music, Ghost, Flower, Crown
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useExam } from '../../contexts/ExamContext';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';


// ──────────── Game Constants ────────────
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180; // 3 dakika
const MAX_LEVEL = 20;

type Phase = 'welcome' | 'memorize' | 'transition' | 'recall' | 'feedback' | 'game_over' | 'victory';

interface VisualMemoryGameProps {
    examMode?: boolean;
    examLevel?: number;
    examTimeLimit?: number;
}

// ──────────── Icon & Color Pool ────────────
type IconType =
    | 'Star' | 'Circle' | 'Square' | 'Triangle' | 'Hexagon' | 'Diamond'
    | 'Heart' | 'Cloud' | 'Sun' | 'Moon' | 'Zap' | 'Anchor'
    | 'Music' | 'Ghost' | 'Flower' | 'Crown';

interface GridCell {
    id: string;
    icon: IconType | null;
    color: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ICON_MAP: Record<IconType, any> = {
    Star, Circle, Square, Triangle, Hexagon, Diamond,
    Heart, Cloud, Sun, Moon, Zap, Anchor,
    Music, Ghost, Flower, Crown,
};

const ICON_TYPES: IconType[] = Object.keys(ICON_MAP) as IconType[];

const COLORS = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
    '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
    '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
    '#EC4899', '#F43F5E',
];

// ──────────── Level Configuration ────────────
interface LevelConfig {
    gridSize: number;  // 3, 4, or 5
    items: number;     // filled cells
    memorizeMs: number; // memorize time in ms
}

const LEVEL_CONFIG: Record<number, LevelConfig> = {
    1: { gridSize: 3, items: 3, memorizeMs: 3000 },
    2: { gridSize: 3, items: 3, memorizeMs: 2800 },
    3: { gridSize: 3, items: 4, memorizeMs: 3000 },
    4: { gridSize: 3, items: 5, memorizeMs: 3000 },
    5: { gridSize: 3, items: 5, memorizeMs: 2500 },
    6: { gridSize: 3, items: 6, memorizeMs: 3000 },
    7: { gridSize: 3, items: 7, memorizeMs: 2500 },
    8: { gridSize: 4, items: 6, memorizeMs: 3500 },
    9: { gridSize: 4, items: 7, memorizeMs: 3000 },
    10: { gridSize: 4, items: 8, memorizeMs: 3000 },
    11: { gridSize: 4, items: 9, memorizeMs: 2500 },
    12: { gridSize: 4, items: 9, memorizeMs: 2000 },
    13: { gridSize: 4, items: 10, memorizeMs: 2500 },
    14: { gridSize: 4, items: 11, memorizeMs: 2500 },
    15: { gridSize: 4, items: 12, memorizeMs: 2000 },
    16: { gridSize: 5, items: 10, memorizeMs: 3000 },
    17: { gridSize: 5, items: 12, memorizeMs: 2500 },
    18: { gridSize: 5, items: 13, memorizeMs: 2000 },
    19: { gridSize: 5, items: 14, memorizeMs: 1800 },
    20: { gridSize: 5, items: 15, memorizeMs: 1500 },
};

// ──────────── Feedback Messages ────────────
// ──────────── Game Logic Helpers ────────────
const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const shuffle = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

const generateGrid = (gridSize: number, itemCount: number): GridCell[] => {
    const totalCells = gridSize * gridSize;
    const cells: GridCell[] = Array.from({ length: totalCells }, (_, i) => ({
        id: `cell-${i}`,
        icon: null,
        color: '#6B7280',
    }));

    const indices = shuffle(Array.from({ length: totalCells }, (_, i) => i)).slice(0, itemCount);

    indices.forEach((index) => {
        cells[index] = {
            ...cells[index],
            icon: getRandomItem(ICON_TYPES),
            color: getRandomItem(COLORS),
        };
    });

    return cells;
};

const createModifiedGrid = (originalGrid: GridCell[]): { grid: GridCell[]; targetId: string } => {
    const newGrid = originalGrid.map(c => ({ ...c }));

    const activeIndices = newGrid
        .map((cell, idx) => (cell.icon !== null ? idx : -1))
        .filter(idx => idx !== -1);

    if (activeIndices.length === 0) throw new Error('Grid is empty');

    const indexToChange = getRandomItem(activeIndices);
    const cellToChange = newGrid[indexToChange];
    const oldIcon = cellToChange.icon;

    let newIcon: IconType;
    do {
        newIcon = getRandomItem(ICON_TYPES);
    } while (newIcon === oldIcon);

    const newColor = getRandomItem(COLORS);

    newGrid[indexToChange] = {
        ...cellToChange,
        icon: newIcon,
        color: newColor,
    };

    return { grid: newGrid, targetId: cellToChange.id };
};

// ══════════════════════════════════════════════════
// VisualMemoryGame Component
// ══════════════════════════════════════════════════

const VisualMemoryGame: React.FC = () => {
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;
    const examMode = location.state?.examMode || false;
    const navigate = useNavigate();
    const { submitResult } = useExam();

    // Shared Feedback System
    const { feedbackState, showFeedback } = useGameFeedback();

    const hasSavedRef = useRef(false);

    // Core State
    const [phase, setPhase] = useState<Phase>('welcome');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [level, setLevel] = useState(1);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);

    // Game-Specific State
    const [gridBefore, setGridBefore] = useState<GridCell[]>([]);
    const [gridAfter, setGridAfter] = useState<GridCell[]>([]);
    const [targetCellId, setTargetCellId] = useState<string | null>(null);
    const [userSelectedId, setUserSelectedId] = useState<string | null>(null);
    const [memorizeTimeLeft, setMemorizeTimeLeft] = useState(0);
    const [memorizeTimeMax, setMemorizeTimeMax] = useState(0);
    const [currentGridSize, setCurrentGridSize] = useState(3);

    // Refs
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);

    // ──────────── Global Timer ────────────
    useEffect(() => {
        if (phase === 'memorize' || phase === 'transition' || phase === 'recall') {
            if (timeLeft > 0) {
                timerRef.current = setTimeout(() => {
                    setTimeLeft(prev => prev - 1);
                }, 1000);
            } else {
                handleGameOver();
            }
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [phase, timeLeft]);

    // ──────────── Memorize Timer ────────────
    useEffect(() => {
        if (phase === 'memorize' && memorizeTimeLeft > 0) {
            const interval = window.setInterval(() => {
                setMemorizeTimeLeft(prev => Math.max(0, prev - 100));
            }, 100);
            return () => window.clearInterval(interval);
        } else if (phase === 'memorize' && memorizeTimeLeft <= 0 && gridBefore.length > 0) {
            transitionToRecall();
        }
    }, [phase, memorizeTimeLeft, gridBefore.length]);

    // ──────────── Start Level ────────────
    const startLevel = useCallback((lvl: number) => {
        const config = LEVEL_CONFIG[lvl] || LEVEL_CONFIG[MAX_LEVEL];
        const grid = generateGrid(config.gridSize, config.items);

        setCurrentGridSize(config.gridSize);
        setGridBefore(grid);
        setGridAfter([]);
        setTargetCellId(null);
        setUserSelectedId(null);
        setMemorizeTimeMax(config.memorizeMs);
        setMemorizeTimeLeft(config.memorizeMs);
        setPhase('memorize');
    }, []);

    // ──────────── Transition to Recall ────────────
    const transitionToRecall = useCallback(() => {
        setPhase('transition');

        setTimeout(() => {
            const { grid, targetId } = createModifiedGrid(gridBefore);
            setGridAfter(grid);
            setTargetCellId(targetId);
            setPhase('recall');
        }, 800);
    }, [gridBefore]);

    // ──────────── Start Game ────────────
    const handleStart = useCallback(() => {
        window.scrollTo(0, 0);
        setPhase('memorize');
        setScore(0);
        setLives(INITIAL_LIVES);
        setLevel(1);
        setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
        startTimeRef.current = Date.now();
        hasSavedRef.current = false;

        const config = LEVEL_CONFIG[1];
        const grid = generateGrid(config.gridSize, config.items);
        setCurrentGridSize(config.gridSize);
        setGridBefore(grid);
        setGridAfter([]);
        setTargetCellId(null);
        setUserSelectedId(null);
        setMemorizeTimeMax(config.memorizeMs);
        setMemorizeTimeLeft(config.memorizeMs);
    }, [hasSavedRef]);

    // ──────────── Auto Start ────────────
    useEffect(() => {
        if ((location.state?.autoStart || examMode) && phase === 'welcome') {
            handleStart();
        }
    }, [location.state, examMode, phase, handleStart]);

    // ──────────── Game Over ────────────
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
            game_id: 'gorsel-hafiza',
            score_achieved: score,
            duration_seconds: duration,
            metadata: {
                levels_completed: level,
                final_lives: lives,
            }
        });
    }, [saveGamePlay, score, level, lives, hasSavedRef, examMode, submitResult, navigate]);

    // ──────────── Victory ────────────
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
            game_id: 'gorsel-hafiza',
            score_achieved: score,
            duration_seconds: duration,
            metadata: {
                levels_completed: MAX_LEVEL,
                victory: true,
            }
        });
    }, [saveGamePlay, score, hasSavedRef, examMode, submitResult, navigate]);

    // ──────────── Cell Click ────────────
    const handleCellClick = useCallback((cellId: string) => {
        if (phase !== 'recall') return;

        setUserSelectedId(cellId);
        const isCorrect = cellId === targetCellId;

        if (isCorrect) {
            setScore(prev => prev + 10 * level);
            showFeedback(true);
            setPhase('feedback');

            setTimeout(() => {
                if (level >= MAX_LEVEL) {
                    handleVictory();
                } else {
                    const nextLevel = level + 1;
                    setLevel(nextLevel);
                    startLevel(nextLevel);
                }
            }, 1200);
        } else {
            const newLives = lives - 1;
            setLives(newLives);
            showFeedback(false);
            setPhase('feedback');

            setTimeout(() => {
                if (newLives <= 0) {
                    handleGameOver();
                } else {
                    // Retry same level
                    startLevel(level);
                }
            }, 1200);
        }
    }, [phase, targetCellId, level, lives, handleVictory, handleGameOver, startLevel]);

    // ──────────── Format Time ────────────
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // ──────────── Grid Renderer ────────────
    const renderGrid = (grid: GridCell[], interactive: boolean, showTarget?: boolean) => {
        const gridCols = currentGridSize === 3 ? 'grid-cols-3' : currentGridSize === 4 ? 'grid-cols-4' : 'grid-cols-5';
        const cellSize = currentGridSize <= 3 ? 'w-20 h-20 sm:w-24 sm:h-24' : currentGridSize === 4 ? 'w-16 h-16 sm:w-20 sm:h-20' : 'w-14 h-14 sm:w-16 sm:h-16';
        const iconSize = currentGridSize <= 3 ? 32 : currentGridSize === 4 ? 26 : 20;

        return (
            <div className={`grid ${gridCols} gap-3 sm:gap-4 mx-auto`} style={{ maxWidth: currentGridSize <= 3 ? '320px' : currentGridSize === 4 ? '380px' : '400px' }}>
                {grid.map((cell) => {
                    const IconComponent = cell.icon ? ICON_MAP[cell.icon] : null;
                    const isTarget = showTarget && cell.id === targetCellId;
                    const isUserSelected = showTarget && cell.id === userSelectedId;
                    const isWrongSelection = isUserSelected && cell.id !== targetCellId;

                    let bg = 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)';
                    let shadow = 'inset 0 -3px 6px rgba(0,0,0,0.2), inset 0 3px 6px rgba(255,255,255,0.08)';
                    let border = '1px solid rgba(255,255,255,0.1)';

                    if (isTarget) {
                        bg = 'linear-gradient(135deg, #10B981 0%, #059669 100%)';
                        shadow = 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.3), 0 0 30px rgba(16, 185, 129, 0.6)';
                        border = '2px solid rgba(16, 185, 129, 0.8)';
                    } else if (isWrongSelection) {
                        bg = 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)';
                        shadow = 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 0 20px rgba(239, 68, 68, 0.4)';
                        border = '2px solid rgba(239, 68, 68, 0.8)';
                    } else if (interactive) {
                        bg = 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)';
                        shadow = 'inset 0 -3px 6px rgba(0,0,0,0.2), inset 0 3px 6px rgba(255,255,255,0.1)';
                    }

                    return (
                        <motion.div
                            key={cell.id}
                            whileHover={interactive ? { scale: 1.08, y: -4 } : undefined}
                            whileTap={interactive ? { scale: 0.95 } : undefined}
                            onClick={() => interactive && handleCellClick(cell.id)}
                            className={`${cellSize} rounded-2xl flex items-center justify-center transition-all duration-200 ${interactive ? 'cursor-pointer' : ''}`}
                            style={{
                                background: bg,
                                boxShadow: shadow,
                                border: border,
                                borderRadius: '20px',
                            }}
                        >
                            {IconComponent && (
                                <span style={{ color: cell.color }}>
                                    <IconComponent
                                        size={iconSize}
                                        strokeWidth={2.5}
                                        className="drop-shadow-lg transition-transform duration-300"
                                    />
                                </span>
                            )}
                            {!IconComponent && (
                                <div className="w-3 h-3 rounded-full bg-white/10" />
                            )}
                        </motion.div>
                    );
                })}
            </div>
        );
    };

    // ══════════════════════════════════════════════════
    // RENDER
    // ══════════════════════════════════════════════════

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white">
            {/* Decorative Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />
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

                    {(phase === 'memorize' || phase === 'transition' || phase === 'recall' || phase === 'feedback') && (
                        <div className="flex items-center gap-4 sm:gap-6 flex-wrap justify-end">
                            {/* Score */}
                            <div className="flex items-center gap-2 bg-amber-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-amber-500/30">
                                <Star className="text-amber-400" size={18} />
                                <span className="font-bold text-amber-400 text-sm">{score}</span>
                            </div>

                            {/* Lives */}
                            <div className="flex items-center gap-1 bg-red-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-red-500/30">
                                {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
                                    <Heart
                                        key={i}
                                        size={14}
                                        className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-400/30'}
                                    />
                                ))}
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
                    {/* ──── Welcome Screen ──── */}
                    {phase === 'welcome' && (
                        <motion.div
                            key="welcome"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center max-w-xl"
                        >
                            {/* TUZÖ Badge */}
                            <div className="mb-6 inline-flex items-center gap-1.5 px-3 py-1 bg-violet-500/20 border border-violet-500/30 rounded-full">
                                <span className="text-[9px] font-black text-violet-300 uppercase tracking-wider">TUZÖ</span>
                                <span className="text-[9px] font-bold text-violet-400">5.4.2 Görsel Kısa Süreli Bellek</span>
                            </div>

                            {/* Icon */}
                            <motion.div
                                className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center"
                                style={{
                                    borderRadius: '40%',
                                    boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)'
                                }}
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Eye size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
                                Görsel Hafıza
                            </h1>

                            <p className="text-slate-400 mb-8 leading-relaxed">
                                Ekranda beliren sembolleri hafızana kazı! Sonra değişen sembolü bul.
                                Bilişsel kodlama gücünü test et.
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
                                className="px-10 py-5 bg-gradient-to-r from-sky-500 to-indigo-600 rounded-2xl font-bold text-xl"
                                style={{ boxShadow: '0 8px 32px rgba(14, 165, 233, 0.4)' }}
                            >
                                <div className="flex items-center gap-3">
                                    <Play size={28} className="fill-white" />
                                    <span>Başla</span>
                                </div>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* ──── Memorize Phase ──── */}
                    {phase === 'memorize' && (
                        <motion.div
                            key="memorize"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full max-w-4xl flex flex-col items-center"
                        >
                            <div className="mb-6 text-center">
                                <h2 className="text-2xl font-bold text-sky-400 mb-2">Ezberle!</h2>
                                <p className="text-slate-400 text-sm">Sembollerin yerlerini ve şekillerini hafızana al.</p>
                            </div>

                            {renderGrid(gridBefore, false)}

                            {/* Memorize Progress Bar */}
                            <div className="w-full max-w-xs mt-8 h-3 bg-slate-800 rounded-full overflow-hidden border border-white/10">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-sky-400 to-indigo-500"
                                    style={{ width: `${(memorizeTimeLeft / memorizeTimeMax) * 100}%` }}
                                    transition={{ duration: 0.1, ease: 'linear' }}
                                />
                            </div>
                        </motion.div>
                    )}

                    {/* ──── Transition Phase ──── */}
                    {phase === 'transition' && (
                        <motion.div
                            key="transition"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center"
                        >
                            <div className="w-16 h-16 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin mb-4" />
                            <p className="text-sky-400 font-bold text-lg">Hazırlan...</p>
                        </motion.div>
                    )}

                    {/* ──── Recall Phase ──── */}
                    {phase === 'recall' && (
                        <motion.div
                            key="recall"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="w-full max-w-4xl flex flex-col items-center"
                        >
                            <div className="mb-6 text-center">
                                <h2 className="text-2xl font-bold text-amber-400 mb-2">Hangisi Değişti?</h2>
                                <p className="text-slate-400 text-sm">Değişen veya farklı olan sembolü seç.</p>
                            </div>

                            {renderGrid(gridAfter, true)}
                        </motion.div>
                    )}

                    {/* ──── Game Over Screen ──── */}
                    {phase === 'game_over' && (
                        <motion.div
                            key="game_over"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center max-w-xl"
                        >
                            <div
                                className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center"
                                style={{ borderRadius: '40%', boxShadow: 'inset 0 -6px 12px rgba(0,0,0,0.2), 0 8px 24px rgba(0,0,0,0.3)' }}
                            >
                                <XCircle size={48} className="text-white" />
                            </div>

                            <h2 className="text-3xl font-bold text-red-400 mb-4">Oyun Bitti!</h2>

                            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10">
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
                                style={{ boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)' }}
                            >
                                <div className="flex items-center gap-3">
                                    <RotateCcw size={24} />
                                    <span>Tekrar Dene</span>
                                </div>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* ──── Victory Screen ──── */}
                    {phase === 'victory' && (
                        <motion.div
                            key="victory"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center max-w-xl"
                        >
                            <motion.div
                                className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center"
                                style={{ borderRadius: '40%', boxShadow: 'inset 0 -6px 12px rgba(0,0,0,0.2), 0 8px 24px rgba(0,0,0,0.3)' }}
                                animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                <Trophy size={48} className="text-white" />
                            </motion.div>

                            <h2 className="text-3xl font-bold text-amber-400 mb-4">🎉 Şampiyon!</h2>

                            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10">
                                <p className="text-4xl font-bold text-amber-400">{score}</p>
                                <p className="text-slate-400">Toplam Puan</p>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleStart}
                                className="px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-2xl font-bold text-lg"
                                style={{ boxShadow: '0 8px 32px rgba(245, 158, 11, 0.4)' }}
                            >
                                <div className="flex items-center gap-3">
                                    <RotateCcw size={24} />
                                    <span>Tekrar Oyna</span>
                                </div>
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ──── Feedback Overlay ──── */}
                <GameFeedbackBanner feedback={feedbackState} />
            </div>
        </div>
    );
};

export default VisualMemoryGame;
