import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useGamePersistence } from '../../../../hooks/useGamePersistence';
import { GamePhase, Cell, ColorType } from './types';
import { GAME_CONFIG, LEVEL_CONFIG, COLORS, COLOR_LABELS } from './constants';
import { generateGrid } from './utils';
import ArcadeGameShell from '../../Shared/ArcadeGameShell';
import ArcadeFeedbackBanner from '../../Shared/ArcadeFeedbackBanner';
import { ARCADE_FEEDBACK_TEXTS, ARCADE_SCORE_FORMULA } from '../../Shared/ArcadeConstants';

// ── Phase → GameState Status Mapping ────────────────────────────────────────
const getShellStatus = (phase: GamePhase): 'START' | 'PLAYING' | 'GAME_OVER' | 'SUCCESS' => {
    switch (phase) {
        case 'idle': return 'START';
        case 'game_over': return 'GAME_OVER';
        case 'victory': return 'SUCCESS';
        default: return 'PLAYING'; // memorizing, playing, revealing
    }
};

// ── Score base for this game (standart formül: base × level) ────────────────
const SCORE_BASE = 10;

const RenkliLambalar: React.FC = () => {
    const location = useLocation();
    const autoStart = location.state?.autoStart === true;

    // Persistence Hook
    const { saveGamePlay } = useGamePersistence();
    const hasSavedRef = useRef<boolean>(false);
    const isResolvingRef = useRef<boolean>(false);

    // Core State
    const [phase, setPhase] = useState<GamePhase>('idle');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(GAME_CONFIG.INITIAL_LIVES);
    const [level, setLevel] = useState(1);
    const [streak, setStreak] = useState(0);

    // Feedback Banner State
    const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

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

    // Global Unmount Cleanup (Zorunlu)
    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    // Auto-clear feedback banner
    useEffect(() => {
        if (feedback) {
            const t = setTimeout(() => setFeedback(null), 1000);
            return () => clearTimeout(t);
        }
    }, [feedback]);

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
        window.scrollTo(0, 0);
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
        setFeedback(null);
        startTimeRef.current = Date.now();
        hasSavedRef.current = false;
        isResolvingRef.current = false;
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
        setFeedback(null);
        isResolvingRef.current = false;
    }, []);

    // Game Over Handler (Idempotent)
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

    // Victory Handler (Idempotent)
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

    // Cell Click Handler (with Callback Lock Pattern)
    const handleCellClick = useCallback((cellId: number) => {
        if (phase !== 'playing' || !targetColor) return;
        if (isResolvingRef.current) return;
        isResolvingRef.current = true;

        const cell = grid[cellId];
        if (cell.isRevealed) {
            isResolvingRef.current = false;
            return;
        }

        if (cell.color === targetColor) {
            // Correct!
            const updatedGrid = [...grid];
            updatedGrid[cellId].isRevealed = true;
            setGrid(updatedGrid);

            const newFound = foundTargets + 1;
            setFoundTargets(newFound);
            setScore(prev => prev + ARCADE_SCORE_FORMULA(SCORE_BASE, level));
            setStreak(prev => prev + 1);

            // Feedback Banner
            const msg = ARCADE_FEEDBACK_TEXTS.SUCCESS_MESSAGES[Math.floor(Math.random() * ARCADE_FEEDBACK_TEXTS.SUCCESS_MESSAGES.length)];
            setFeedback({ message: msg, type: 'success' });

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

            setTimeout(() => { isResolvingRef.current = false; }, 300);
        } else {
            // Wrong!
            const updatedGrid = [...grid];
            updatedGrid[cellId].isError = true;
            setGrid(updatedGrid);
            setStreak(0);

            const newLives = lives - 1;
            setLives(newLives);

            // Feedback Banner
            const errMsg = ARCADE_FEEDBACK_TEXTS.ERROR_MESSAGES[Math.floor(Math.random() * ARCADE_FEEDBACK_TEXTS.ERROR_MESSAGES.length)];
            setFeedback({ message: errMsg, type: 'error' });

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

            setTimeout(() => { isResolvingRef.current = false; }, 500);
        }
    }, [phase, targetColor, grid, foundTargets, totalTargets, level, lives, handleVictory, handleGameOver, startNextLevel]);

    // Derive Shell status from internal phase
    const shellStatus = getShellStatus(phase);

    return (
        <ArcadeGameShell
            gameState={{ score, level, lives, status: shellStatus }}
            gameMetadata={{
                id: 'renkli-lambalar',
                title: 'RENKLi LAMBALAR',
                description: <p>Renkleri ezberle ve doğru renkteki lambaları bul!</p>,
                tuzoCode: '5.4.2 Görsel Bellek',
                icon: <Lightbulb className="w-14 h-14 text-black" strokeWidth={3} />,
                iconBgColor: 'bg-yellow-400',
                containerBgColor: 'bg-sky-200 dark:bg-slate-900'
            }}
            onStart={handleStart}
            onRestart={handleStart}
            showLevel={true}
            showLives={true}
        >
            <div className="h-full w-full text-black dark:text-white transition-colors duration-300 touch-none [-webkit-tap-highlight-color:transparent] overflow-hidden flex flex-col">
                {/* Decorative Background */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-50 dark:opacity-20 transition-opacity duration-300">
                    <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-400 rounded-full border-2 border-black/10 shadow-neo-sm" />
                    <div className="absolute bottom-20 right-10 w-48 h-48 bg-blue-400 rounded-full border-2 border-black/10 shadow-neo-sm" />
                    <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-red-400 rounded-full border-2 border-black/10 shadow-neo-sm" />
                </div>

                {/* Spacer for ArcadeGameShell HUD */}
                <div className="h-20 sm:h-24" />

                {/* Feedback Banner */}
                <ArcadeFeedbackBanner message={feedback?.message ?? null} type={feedback?.type} />

                {/* Main Content */}
                <div className="relative z-10 flex flex-col items-center justify-center flex-1 p-2 sm:p-4">
                    <AnimatePresence mode="wait">
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
                                <div className="mb-2 h-10 flex items-center justify-center">
                                    {phase === 'memorizing' && (
                                        <motion.p
                                            initial={{ scale: 0.8 }}
                                            animate={{ scale: 1 }}
                                            className="text-xl sm:text-3xl font-black text-black bg-yellow-300 px-4 sm:px-6 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border-3 sm:border-2 border-black/10 dark:border-slate-800 shadow-neo-sm sm:shadow-neo-sm rotate-2 transition-colors duration-300"
                                        >
                                            Ezberle! <span className="text-2xl sm:text-4xl ml-1.5 sm:ml-2 bg-white dark:bg-slate-800 text-black dark:text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg sm:rounded-xl border-2 border-black/10 dark:border-slate-700 inline-block -rotate-3 transition-colors duration-300">{countdown}</span>
                                        </motion.p>
                                    )}
                                    {phase === 'playing' && targetColor && (
                                        <p className="text-base sm:text-2xl font-black bg-white dark:bg-slate-800 text-black dark:text-white px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl border-3 sm:border-2 border-black/10 dark:border-slate-700 shadow-neo-sm sm:shadow-neo-sm flex items-center gap-1.5 sm:gap-2 -rotate-1 transition-colors duration-300">
                                            Hedef: <span
                                                className="font-black px-3 sm:px-4 py-0.5 sm:py-1 rounded-lg sm:rounded-xl border-3 sm:border-2 border-black/10 dark:border-slate-700 uppercase tracking-wider sm:tracking-widest text-sm sm:text-xl shadow-neo-sm rotate-2 transition-colors duration-300"
                                                style={{ backgroundColor: COLORS[targetColor], color: '#000' }}
                                            >
                                                {COLOR_LABELS[targetColor]}
                                            </span> ({foundTargets}/{totalTargets})
                                        </p>
                                    )}
                                </div>

                                {/* Game Grid - Solid Blocks */}
                                <div
                                    className="grid gap-1.5 sm:gap-3 p-3 sm:p-6 bg-slate-100 dark:bg-slate-800 rounded-2xl sm:rounded-[2rem] border-6 sm:border-2 border-black/10 dark:border-slate-700 shadow-neo-sm sm:shadow-neo-sm dark:shadow-[8px_8px_0_#0f172a] sm:dark:shadow-[12px_12px_0_#0f172a] mx-auto rotate-1 transition-colors duration-300"
                                    style={{
                                        gridTemplateColumns: `repeat(${currentGridSize}, minmax(0, 1fr))`,
                                        width: 'min(80vw, 400px)',
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
                                                whileHover={phase === 'playing' && !cell.isRevealed ? { scale: 1.05, y: -2 } : {}}
                                                whileTap={phase === 'playing' && !cell.isRevealed ? { scale: 0.95 } : {}}
                                                animate={isRevealing ? {
                                                    scale: [1, 1.1, 1],
                                                    transition: { duration: 0.3 }
                                                } : {}}
                                                className={`
                                                relative rounded-xl sm:rounded-2xl transition-all duration-300 overflow-hidden border-2 border-black/10 dark:border-slate-700
                                                ${cell.isError ? 'animate-shake' : ''}
                                                ${phase === 'playing' && !cell.isRevealed ? 'cursor-pointer hover:shadow-neo-sm' : 'shadow-none'}
                                                ${isVisible ? '' : 'shadow-neo-sm dark:shadow-[4px_4px_0_#0f172a]'}
                                            `}
                                                style={{
                                                    aspectRatio: '1',
                                                    backgroundColor: isVisible ? cell.hex : '#94a3b8', // slate-400 for unrevealed dark compatible
                                                    transform: isVisible ? 'translateY(4px)' : 'translateY(0)',
                                                    boxShadow: isVisible ? 'none' : '4px 4px 0 #000',
                                                }}
                                            >
                                                {/* Solid Highlight */}
                                                {isVisible && (
                                                    <div className="absolute top-1 left-2 w-3 h-3 sm:w-4 sm:h-4 bg-white/60 rounded-full" />
                                                )}
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </ArcadeGameShell>
    );
};

export default RenkliLambalar;
