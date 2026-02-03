import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer, Target,
    XCircle, ChevronLeft, Zap, Lightbulb, Heart, Home
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useGamePersistence } from '../../../../hooks/useGamePersistence';
import { GamePhase, Cell, ColorType } from './types';
import { GAME_CONFIG, LEVEL_CONFIG, COLORS, COLOR_LABELS } from './constants';
import { generateGrid } from './utils';

const RenkliLambalar: React.FC = () => {
    const location = useLocation();
    const autoStart = location.state?.autoStart === true;

    // Persistence Hook
    const { saveGamePlay } = useGamePersistence();
    const hasSavedRef = useRef(false);

    // Core State
    const [phase, setPhase] = useState<GamePhase>('idle');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(GAME_CONFIG.INITIAL_LIVES);
    const [level, setLevel] = useState(1);
    const [streak, setStreak] = useState(0);

    // Game-Specific State
    const [grid, setGrid] = useState<Cell[]>([]);
    const [currentGridSize, setCurrentGridSize] = useState(3);
    const [targetColor, setTargetColor] = useState<ColorType | null>(null);
    const [countdown, setCountdown] = useState(5);
    const [totalTargets, setTotalTargets] = useState(0);
    const [foundTargets, setFoundTargets] = useState(0);

    // Refs
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);

    // Auto-start for arcade mode
    useEffect(() => {
        if (autoStart && phase === 'idle') {
            handleStart();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoStart]);

    // Memorize countdown
    useEffect(() => {
        if (phase === 'memorizing') {
            if (countdown > 0) {
                timerRef.current = setTimeout(() => setCountdown(countdown - 1), 1000);
            } else {
                // Select random target color from grid
                const colorsInGrid = Array.from(new Set(grid.map(c => c.color)));
                const randomTarget = colorsInGrid[Math.floor(Math.random() * colorsInGrid.length)];
                const count = grid.filter(c => c.color === randomTarget).length;

                setTargetColor(randomTarget);
                setTotalTargets(count);
                setFoundTargets(0);
                setPhase('playing');
            }
        }
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [phase, countdown, grid]);

    // Start Game
    const handleStart = useCallback(() => {
        const levelConfig = LEVEL_CONFIG[1];
        const newGrid = generateGrid(levelConfig.gridSize);
        setGrid(newGrid);
        setCurrentGridSize(levelConfig.gridSize);
        setPhase('memorizing');
        setCountdown(levelConfig.memorizeTime);
        setScore(0);
        setLives(GAME_CONFIG.INITIAL_LIVES);
        setLevel(1);
        setStreak(0);
        setTargetColor(null);
        startTimeRef.current = Date.now();
        hasSavedRef.current = false;
    }, []);

    // Next Level
    const startNextLevel = useCallback((nextLevel: number) => {
        const levelConfig = LEVEL_CONFIG[nextLevel] || LEVEL_CONFIG[10];
        const newGrid = generateGrid(levelConfig.gridSize);
        setGrid(newGrid);
        setCurrentGridSize(levelConfig.gridSize);
        setPhase('memorizing');
        setCountdown(levelConfig.memorizeTime);
        setTargetColor(null);
    }, []);

    // Game Over Handler
    const handleGameOver = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;

        setPhase('game_over');

        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

        await saveGamePlay({
            game_id: 'renkli-lambalar',
            score_achieved: score,
            duration_seconds: duration,
            metadata: {
                levels_completed: level - 1,
                final_lives: lives,
                max_streak: streak,
            }
        });
    }, [saveGamePlay, score, level, lives, streak]);

    // Victory Handler
    const handleVictory = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;

        setPhase('victory');

        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

        await saveGamePlay({
            game_id: 'renkli-lambalar',
            score_achieved: score,
            duration_seconds: duration,
            metadata: {
                levels_completed: GAME_CONFIG.MAX_LEVEL,
                victory: true,
                max_streak: streak,
            }
        });
    }, [saveGamePlay, score, streak]);

    // Cell Click Handler
    const handleCellClick = useCallback((cellId: number) => {
        if (phase !== 'playing' || !targetColor) return;

        const cell = grid[cellId];
        if (cell.isRevealed) return;

        if (cell.color === targetColor) {
            // Correct!
            const updatedGrid = [...grid];
            updatedGrid[cellId].isRevealed = true;
            setGrid(updatedGrid);

            const newFound = foundTargets + 1;
            setFoundTargets(newFound);
            setScore(prev => prev + 10 * level);
            setStreak(prev => prev + 1);

            if (newFound === totalTargets) {
                // Round complete!
                if (level >= GAME_CONFIG.MAX_LEVEL) {
                    handleVictory();
                } else {
                    const nextLevel = level + 1;
                    setLevel(nextLevel);
                    setTimeout(() => startNextLevel(nextLevel), 1000);
                }
            }
        } else {
            // Wrong!
            const updatedGrid = [...grid];
            updatedGrid[cellId].isError = true;
            setGrid(updatedGrid);
            setStreak(0);

            const newLives = lives - 1;
            setLives(newLives);

            // Brief error shake
            setTimeout(() => {
                setGrid(prev => prev.map(c => c.id === cellId ? { ...c, isError: false } : c));
            }, 400);

            if (newLives <= 0) {
                // Show all colors before game over
                setTimeout(() => {
                    setPhase('revealing');
                }, 500);

                // Then game over
                setTimeout(() => {
                    handleGameOver();
                }, 2500);
            }
        }
    }, [phase, targetColor, grid, foundTargets, totalTargets, level, lives, handleVictory, handleGameOver, startNextLevel]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white touch-none" style={{ WebkitTapHighlightColor: 'transparent' }}>
            {/* Decorative Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-400/10 blur-3xl rounded-full" />
                <div className="absolute bottom-20 right-10 w-48 h-48 bg-blue-500/10 blur-3xl rounded-full" />
                <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-red-500/10 blur-3xl rounded-full" />
            </div>

            {/* Header */}
            <div className="relative z-10 p-2 sm:p-4 pt-16 sm:pt-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Link
                        to="/bilsem-zeka"
                        className="flex items-center gap-1.5 sm:gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
                        <span className="text-xs sm:text-base">BİLSEM</span>
                    </Link>

                    {phase === 'playing' && (
                        <div className="flex items-center gap-2 sm:gap-4">
                            {/* Score */}
                            <div className="flex items-center gap-1.5 sm:gap-2 bg-amber-500/20 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl">
                                <Star className="text-amber-400 w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                                <span className="font-bold text-amber-400 text-sm sm:text-base">{score}</span>
                            </div>

                            {/* Lives */}
                            <div className="flex items-center gap-0.5 sm:gap-1 bg-red-500/20 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl">
                                {Array.from({ length: GAME_CONFIG.INITIAL_LIVES }).map((_, i) => (
                                    <Heart
                                        key={i}
                                        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${i < lives ? 'text-red-400 fill-red-400' : 'text-red-400/30'}`}
                                    />
                                ))}
                            </div>

                            {/* Level */}
                            <div className="flex items-center gap-1.5 sm:gap-2 bg-emerald-500/20 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl">
                                <Zap className="text-emerald-400 w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                                <span className="font-bold text-emerald-400 text-sm sm:text-base">Lv.{level}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4">
                <AnimatePresence mode="wait">
                    {/* Welcome Screen */}
                    {phase === 'idle' && (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center max-w-xl"
                        >
                            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-pink-500 to-purple-600 rounded-3xl flex items-center justify-center">
                                <Lightbulb size={48} className="text-white" />
                            </div>

                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-pink-400 via-yellow-400 to-cyan-400 bg-clip-text text-transparent">
                                Renkli Lambalar
                            </h1>

                            <p className="text-slate-400 mb-8">
                                Renkli solucanların yollarını ezberle ve hedef renkteki tüm hücreleri bul!
                            </p>

                            <div className="flex flex-wrap justify-center gap-4 mb-8">
                                <div className="flex gap-2 bg-slate-800/50 backdrop-blur-xl px-4 py-2 rounded-xl">
                                    {Object.values(COLORS).map(c => (
                                        <div key={c} className="w-6 h-6 rounded-full shadow-lg" style={{ backgroundColor: c }} />
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-wrap justify-center gap-4 mb-8">
                                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2">
                                    <Heart className="text-red-400" size={16} />
                                    <span className="text-sm text-slate-300">{GAME_CONFIG.INITIAL_LIVES} Can</span>
                                </div>
                                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2">
                                    <Timer className="text-blue-400" size={16} />
                                    <span className="text-sm text-slate-300">Kolaydan Zora</span>
                                </div>
                                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2">
                                    <Target className="text-emerald-400" size={16} />
                                    <span className="text-sm text-slate-300">{GAME_CONFIG.MAX_LEVEL} Seviye</span>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleStart}
                                className="px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl font-bold text-lg shadow-lg shadow-pink-500/25"
                            >
                                <div className="flex items-center gap-3">
                                    <Play size={24} />
                                    <span>Başla</span>
                                </div>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* Memorizing & Playing & Revealing */}
                    {(phase === 'memorizing' || phase === 'playing' || phase === 'revealing') && (
                        <motion.div
                            key="game"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full max-w-lg flex flex-col items-center"
                        >
                            {/* Status Bar */}
                            <div className="mb-6 h-12 flex items-center justify-center">
                                {phase === 'memorizing' && (
                                    <motion.p
                                        initial={{ scale: 0.8 }}
                                        animate={{ scale: 1 }}
                                        className="text-2xl font-bold text-yellow-300 animate-pulse"
                                    >
                                        Ezberle! <span className="text-4xl ml-2">{countdown}</span>
                                    </motion.p>
                                )}
                                {phase === 'playing' && targetColor && (
                                    <p className="text-xl font-semibold">
                                        Tüm <span
                                            className="font-bold px-2 mx-1 rounded"
                                            style={{ color: COLORS[targetColor] }}
                                        >
                                            {COLOR_LABELS[targetColor]}
                                        </span> lambaları bul! ({foundTargets}/{totalTargets})
                                    </p>
                                )}
                            </div>

                            {/* Game Grid - Soft Candy Gummies */}
                            <div
                                className="grid gap-2.5 p-6 bg-gradient-to-br from-rose-100/10 to-sky-100/10 backdrop-blur-xl rounded-[2rem] border border-white/20 shadow-xl"
                                style={{
                                    gridTemplateColumns: `repeat(${currentGridSize}, minmax(0, 1fr))`,
                                    width: 'min(90vw, 400px)',
                                    aspectRatio: '1',
                                }}
                            >
                                {grid.map((cell) => {
                                    // Show colors during memorizing, revealing, or if already found
                                    const isVisible = phase === 'memorizing' || phase === 'revealing' || cell.isRevealed;
                                    const isRevealing = phase === 'revealing';

                                    return (
                                        <motion.button
                                            key={cell.id}
                                            onClick={() => handleCellClick(cell.id)}
                                            disabled={phase !== 'playing' || cell.isRevealed}
                                            whileHover={phase === 'playing' && !cell.isRevealed ? { scale: 1.12, y: -3 } : {}}
                                            whileTap={phase === 'playing' && !cell.isRevealed ? { scale: 0.92 } : {}}
                                            animate={isRevealing ? {
                                                scale: [1, 1.1, 1],
                                                transition: { duration: 0.3 }
                                            } : {}}
                                            className={`
                                                relative rounded-[40%] transition-all duration-400 overflow-hidden
                                                ${cell.isError ? 'animate-shake' : ''}
                                                ${phase === 'playing' && !cell.isRevealed ? 'cursor-pointer' : ''}
                                            `}
                                            style={{
                                                aspectRatio: '1',
                                                background: isVisible
                                                    ? `linear-gradient(145deg, ${cell.hex} 0%, ${cell.hex}dd 100%)`
                                                    : 'linear-gradient(145deg, #6b7280 0%, #4b5563 100%)',
                                                boxShadow: isVisible
                                                    ? `
                                                        0 6px 20px ${cell.hex}50,
                                                        inset 0 2px 4px rgba(255,255,255,0.4),
                                                        inset 0 -4px 8px ${cell.hex}aa
                                                    `
                                                    : `
                                                        0 4px 12px rgba(0,0,0,0.2),
                                                        inset 0 2px 4px rgba(255,255,255,0.1),
                                                        inset 0 -3px 6px rgba(0,0,0,0.2)
                                                    `,
                                                transform: isVisible ? 'translateY(-2px)' : 'translateY(0)',
                                            }}
                                        >
                                            {/* Soft Candy Highlight - Matte Shine */}
                                            <div
                                                className="absolute rounded-[40%]"
                                                style={{
                                                    top: '6%',
                                                    left: '10%',
                                                    width: '50%',
                                                    height: '30%',
                                                    background: 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 100%)',
                                                    borderRadius: '40%',
                                                    filter: 'blur(3px)',
                                                }}
                                            />

                                            {/* Subtle inner glow for lit candies */}
                                            {isVisible && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ duration: 0.3 }}
                                                    className="absolute inset-0 rounded-[40%]"
                                                    style={{
                                                        background: `radial-gradient(circle at 50% 60%, rgba(255,255,255,0.2) 0%, transparent 50%)`,
                                                    }}
                                                />
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {/* Game Over Screen */}
                    {phase === 'game_over' && (
                        <motion.div
                            key="game_over"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center max-w-xl"
                        >
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

                            <div className="flex gap-4 justify-center">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleStart}
                                    className="px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl font-bold text-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        <RotateCcw size={24} />
                                        <span>Tekrar Dene</span>
                                    </div>
                                </motion.button>

                                <Link
                                    to="/bilsem-zeka"
                                    className="px-6 py-4 bg-slate-700 hover:bg-slate-600 rounded-2xl font-bold transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <Home size={20} />
                                        <span>Arcade</span>
                                    </div>
                                </Link>
                            </div>
                        </motion.div>
                    )}

                    {/* Victory Screen */}
                    {phase === 'victory' && (
                        <motion.div
                            key="victory"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center max-w-xl"
                        >
                            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-3xl flex items-center justify-center animate-bounce">
                                <Trophy size={48} className="text-white" />
                            </div>

                            <h2 className="text-3xl font-bold text-amber-400 mb-4">🎉 Şampiyon!</h2>

                            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 mb-6">
                                <p className="text-4xl font-bold text-amber-400">{score}</p>
                                <p className="text-slate-400">Toplam Puan</p>
                            </div>

                            <div className="flex gap-4 justify-center">
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

                                <Link
                                    to="/bilsem-zeka"
                                    className="px-6 py-4 bg-slate-700 hover:bg-slate-600 rounded-2xl font-bold transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <Home size={20} />
                                        <span>Arcade</span>
                                    </div>
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div >
    );
};

export default RenkliLambalar;
