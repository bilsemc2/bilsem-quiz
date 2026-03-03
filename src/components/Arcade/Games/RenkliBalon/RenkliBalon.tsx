import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import confetti from 'canvas-confetti';
import ArcadeGameShell from '../../Shared/ArcadeGameShell';
import Balloon from '../../Shared/Balloon';
import Cloud from '../../Shared/Cloud';
import { Difficulty, GameState, Pattern, FloatingBalloon } from './types';
import { generateLocalPattern } from './services/patternService';
import { useGamePersistence } from '../../../../hooks/useGamePersistence';

import { ARCADE_COLORS, ARCADE_COLOR_NAMES, ARCADE_FEEDBACK_TEXTS, ARCADE_DIFFICULTY_THRESHOLDS, ARCADE_SPAWN_CONFIG, ARCADE_SCORE_FORMULA, ARCADE_SCORE_BASE } from '../../Shared/ArcadeConstants';
import ArcadeFeedbackBanner from '../../Shared/ArcadeFeedbackBanner';

const RenkliBalon: React.FC = () => {
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();

    const [gameState, setGameState] = useState<GameState>({
        score: 0,
        level: 1,
        lives: 3,
        status: 'START',
    });

    const [currentPattern, setCurrentPattern] = useState<Pattern | null>(null);
    const [activeBalloons, setActiveBalloons] = useState<FloatingBalloon[]>([]);
    const [poppedId, setPoppedId] = useState<string | null>(null);
    const [laserPath, setLaserPath] = useState<{ x: number; y: number } | null>(null);
    const [feedback, setFeedback] = useState<{ message: string, type: 'success' | 'error' | 'warning' } | null>(null);

    const gameContainerRef = useRef<HTMLDivElement>(null);
    const spawnTimerRef = useRef<number | null>(null);
    const gameStartTimeRef = useRef<number>(0);

    // Modernization Refs
    const hasSavedRef = useRef<boolean>(false);
    const isResolvingRef = useRef<boolean>(false);
    const laserTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const patternTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Global Timeout Cleanup on Unmount
    useEffect(() => {
        return () => {
            if (laserTimeoutRef.current) clearTimeout(laserTimeoutRef.current);
            if (patternTimeoutRef.current) clearTimeout(patternTimeoutRef.current);
            if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
            if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
        };
    }, []);

    const startNewPattern = useCallback((level: number) => {
        let diff = Difficulty.EASY;
        if (level > ARCADE_DIFFICULTY_THRESHOLDS.HARD_LEVEL) diff = Difficulty.HARD;
        else if (level > ARCADE_DIFFICULTY_THRESHOLDS.MEDIUM_LEVEL) diff = Difficulty.MEDIUM;

        const pattern = generateLocalPattern(diff);
        setCurrentPattern(pattern);
        setPoppedId(null);
        setLaserPath(null);
        setActiveBalloons([]);
        setFeedback(null);
    }, []);

    const startGame = () => {
        window.scrollTo(0, 0);
        hasSavedRef.current = false;
        isResolvingRef.current = false;
        setGameState({ score: 0, level: 1, lives: 3, status: 'PLAYING' });
        gameStartTimeRef.current = Date.now();
        startNewPattern(1);
    };

    // Auto-start from Hub
    useEffect(() => {
        if (location.state?.autoStart && gameState.status === 'START') {
            startGame();
        }
    }, [location.state, gameState.status]);

    // Balloon Spawning
    useEffect(() => {
        if (gameState.status !== 'PLAYING' || !currentPattern) return;

        const spawnBalloon = () => {
            const roll = Math.random();
            let value: number;
            let color: string;

            if (roll > 0.7) {
                value = currentPattern.answer;
                color = currentPattern.targetColor;
            } else if (roll > 0.5) {
                value = currentPattern.answer;
                const otherColors = ARCADE_COLORS.filter(c => c !== currentPattern.targetColor);
                color = otherColors[Math.floor(Math.random() * otherColors.length)];
            } else if (roll > 0.3) {
                const wrongOptions = currentPattern.options.filter(o => o !== currentPattern.answer);
                value = wrongOptions.length > 0 ? wrongOptions[Math.floor(Math.random() * wrongOptions.length)] : currentPattern.answer + 1;
                color = currentPattern.targetColor;
            } else {
                const wrongOptions = currentPattern.options.filter(o => o !== currentPattern.answer);
                value = wrongOptions.length > 0 ? wrongOptions[Math.floor(Math.random() * wrongOptions.length)] : currentPattern.answer + 1;
                const otherColors = ARCADE_COLORS.filter(c => c !== currentPattern.targetColor);
                color = otherColors[Math.floor(Math.random() * otherColors.length)];
            }

            const newBalloon: FloatingBalloon = {
                id: window.crypto && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
                value,
                color,
                x: 10 + Math.random() * 80,
                speed: Math.max(
                    ARCADE_SPAWN_CONFIG.SPEED_MIN,
                    ARCADE_SPAWN_CONFIG.SPEED_BASE
                    + Math.random() * ARCADE_SPAWN_CONFIG.SPEED_VARIANCE
                    - (gameState.level * ARCADE_SPAWN_CONFIG.SPEED_DECAY_PER_LEVEL)
                ),
                startTime: Date.now()
            };

            setActiveBalloons(prev => [...prev, newBalloon]);
        };

        const interval = Math.max(
            ARCADE_SPAWN_CONFIG.INTERVAL_MIN_MS,
            ARCADE_SPAWN_CONFIG.INTERVAL_BASE_MS - (gameState.level * ARCADE_SPAWN_CONFIG.INTERVAL_DECAY_PER_LEVEL)
        );
        spawnTimerRef.current = window.setInterval(spawnBalloon, interval);

        return () => {
            if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
        };
    }, [gameState.status, gameState.level, currentPattern]);

    // Balloon Lifecycle & Game Over Check
    useEffect(() => {
        if (gameState.status !== 'PLAYING') return;

        const checkBalloons = setInterval(() => {
            const now = Date.now();
            setActiveBalloons(prev => {
                const remaining = prev.filter(b => {
                    const duration = (now - b.startTime) / 1000;
                    const isOffScreen = duration > b.speed;

                    if (isOffScreen && b.value === currentPattern?.answer && b.color === currentPattern?.targetColor && poppedId !== b.id) {
                        setGameState(gs => ({ ...gs, lives: Math.max(0, gs.lives - 1) }));
                        setFeedback({ message: 'Hedef balon kaçtı!', type: 'error' });
                    }

                    return !isOffScreen;
                });

                return remaining;
            });
        }, 100);

        return () => clearInterval(checkBalloons);
    }, [currentPattern, poppedId]);

    // Game Over Handler
    useEffect(() => {
        if (gameState.lives <= 0 && gameState.status === 'PLAYING') {
            setGameState(gs => ({ ...gs, status: 'GAME_OVER' }));
            if (!hasSavedRef.current) {
                hasSavedRef.current = true;
                saveGamePlay({
                    game_id: 'renkli-balon',
                    score_achieved: gameState.score,
                    duration_seconds: (Date.now() - gameStartTimeRef.current) / 1000,
                    metadata: { level_reached: gameState.level }
                });
            }
        }
    }, [gameState.lives, gameState.status, gameState.score, gameState.level, saveGamePlay]);

    const handleShoot = async (balloon: FloatingBalloon, event: React.MouseEvent) => {
        if (gameState.status !== 'PLAYING' || poppedId || isResolvingRef.current) return;

        isResolvingRef.current = true;
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        // Store raw viewport coordinates for laser rendering
        setLaserPath({
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        });

        await new Promise(r => setTimeout(r, 100));

        const isCorrectValue = balloon.value === currentPattern?.answer;
        const isCorrectColor = balloon.color === currentPattern?.targetColor;

        if (isCorrectValue && isCorrectColor) {
            setPoppedId(balloon.id);
            const successMsg = ARCADE_FEEDBACK_TEXTS.SUCCESS_MESSAGES[Math.floor(Math.random() * ARCADE_FEEDBACK_TEXTS.SUCCESS_MESSAGES.length)];
            setFeedback({ message: successMsg, type: 'success' });

            // Prevent stale closure issue by calculating next level here
            const nextLevel = gameState.level + 1;

            confetti({
                particleCount: 100,
                spread: 70,
                origin: { x: (rect.left + rect.width / 2) / (window.innerWidth || 1000), y: (rect.top + rect.height / 2) / (window.innerHeight || 1000) }
            });

            setGameState(prev => ({
                ...prev,
                score: prev.score + ARCADE_SCORE_FORMULA(ARCADE_SCORE_BASE, prev.level),
                level: nextLevel
            }));

            if (patternTimeoutRef.current) clearTimeout(patternTimeoutRef.current);
            patternTimeoutRef.current = setTimeout(() => {
                startNewPattern(nextLevel);
                isResolvingRef.current = false;
            }, 1000);
        } else {
            let type: 'error' | 'warning' = 'error';
            let msg = ARCADE_FEEDBACK_TEXTS.ERROR_MESSAGES[Math.floor(Math.random() * ARCADE_FEEDBACK_TEXTS.ERROR_MESSAGES.length)];

            if (isCorrectValue && !isCorrectColor) {
                msg = "Numara doğru ama renk yanlış!";
                type = 'warning';
            }
            else if (!isCorrectValue && isCorrectColor) {
                msg = "Renk doğru ama numara yanlış!";
                type = 'warning';
            }

            setFeedback({ message: msg, type });

            setActiveBalloons(prev => prev.map(b => {
                if (b.value === currentPattern?.answer && b.color === currentPattern?.targetColor) {
                    return { ...b, isHighlighted: true };
                }
                return b;
            }));

            setGameState(prev => ({
                ...prev,
                lives: Math.max(0, prev.lives - 1),
            }));

            setActiveBalloons(prev => prev.filter(b => b.id !== balloon.id));

            if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
            highlightTimeoutRef.current = setTimeout(() => {
                setActiveBalloons(prev => prev.map(b => ({ ...b, isHighlighted: false })));
                isResolvingRef.current = false;
            }, 500);
        }

        if (laserTimeoutRef.current) clearTimeout(laserTimeoutRef.current);
        laserTimeoutRef.current = setTimeout(() => {
            setLaserPath(null);
            setFeedback(null);
        }, 2000);
    };

    return (
        <ArcadeGameShell
            gameState={gameState}
            gameMetadata={{
                id: 'renkli-balon',
                title: 'RENKLİ BALON AVI',
                description: (
                    <>
                        <p>1. Örüntüdeki <span className="text-amber-500 bg-white px-2 py-0.5 rounded border-2 border-black/10 rotate-1 inline-block">eksik sayıyı</span> bul.</p>
                        <p>2. <span className="text-rose-500">Hedef rengi</span> kontrol et.</p>
                        <p>3. Gökyüzünde sadece o <span className="text-indigo-500 bg-white px-1.5 py-0.5 rounded border-2 border-black/10 shadow-neo-sm -rotate-2 inline-block">renk</span> ve <span className="text-emerald-500 bg-white px-1.5 py-0.5 rounded border-2 border-black/10 shadow-neo-sm rotate-1 inline-block">numara</span> ikilisini vur!</p>
                    </>
                ),
                tuzoCode: '5.1.1 Sayı Örüntüsü / Seçici Dikkat',
                icon: <Target className="w-14 h-14 text-black" strokeWidth={3} />,
                iconBgColor: 'bg-rose-400',
                containerBgColor: 'bg-sky-200 dark:bg-slate-900'
            }}
            onStart={startGame}
            onRestart={startGame} // Using startGame as restart for this specific loop
        >


            {/* Mission Area - Compact layout to fit within viewport */}
            <div className="w-full flex justify-center pt-20 lg:pt-24 pb-16 px-4 relative z-20 pointer-events-none">
                <AnimatePresence mode='wait'>
                    {gameState.status === 'PLAYING' && currentPattern && (
                        <motion.div
                            initial={{ y: -120, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -120, opacity: 0 }}
                            className="w-full flex flex-col items-center"
                        >
                            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-[2rem] border-2 border-black/10 dark:border-slate-700 shadow-neo-sm dark:shadow-[8px_8px_0_#0f172a] rotate-1 flex flex-col md:flex-row items-center gap-6 sm:gap-8 max-w-4xl transition-colors duration-300 pointer-events-auto">
                                <div>
                                    <h2 className="text-black dark:text-white bg-sky-100 dark:bg-slate-700 px-3 py-1 rounded-lg border-2 border-black/10 dark:border-slate-800 text-[10px] sm:text-xs font-black mb-4 uppercase tracking-widest text-center shadow-neo-sm transform -rotate-2 w-max mx-auto md:mx-0 transition-colors duration-300">Örüntü Görevi</h2>
                                    <div className="flex gap-2 sm:gap-4 items-end justify-center">
                                        {currentPattern.sequence.map((val, i) => (
                                            <div key={`p-${i}`} className="flex flex-col items-center">
                                                <div
                                                    className={`w-12 h-14 sm:w-14 sm:h-16 rounded-[40%_40%_50%_50%] flex items-center justify-center text-black text-xl font-black border-2 border-black/10 relative ${val === '?' ? 'bg-slate-200 animate-pulse scale-110 shadow-neo-sm' : 'shadow-none'}`}
                                                    style={{ backgroundColor: val === '?' ? undefined : ARCADE_COLORS[i % ARCADE_COLORS.length] }}
                                                >
                                                    {val !== '?' && <div className="absolute top-1 left-2 w-3 h-3 bg-white/60 rounded-full" />}
                                                    <span className="z-10 bg-white/30 px-1 rounded">{val}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="h-2 w-full md:h-20 md:w-2 bg-black dark:bg-slate-700 rounded-full hidden md:block transition-colors duration-300"></div>

                                <div className="flex flex-col items-center">
                                    <h2 className="text-black dark:text-white bg-rose-200 dark:bg-slate-700 px-3 py-1 rounded-lg border-2 border-black/10 dark:border-slate-800 text-[10px] sm:text-xs font-black mb-4 uppercase tracking-widest text-center shadow-neo-sm transform rotate-2 w-max mx-auto transition-colors duration-300">Hedef Balon</h2>
                                    <div className="flex items-center gap-4 bg-slate-100 dark:bg-slate-700 p-2 sm:p-3 rounded-2xl border-2 border-black/10 dark:border-slate-800 shadow-neo-sm -rotate-1 transition-colors duration-300">
                                        <div
                                            className="w-10 h-12 rounded-[40%_40%_50%_50%] border-2 border-black/10 relative"
                                            style={{ backgroundColor: currentPattern.targetColor }}
                                        >
                                            <div className="absolute top-1 left-1.5 w-2.5 h-2.5 bg-white/60 rounded-full" />
                                        </div>
                                        <span className="text-black dark:text-white font-black text-lg sm:text-xl uppercase tracking-wider transition-colors duration-300">{ARCADE_COLOR_NAMES[currentPattern.targetColor]}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Game Background and Animation Layer */}
            <div ref={gameContainerRef} className="absolute inset-0 overflow-hidden pointer-events-none z-10">
                <Cloud top="10%" delay={0} duration={45} />
                <Cloud top="35%" delay={7} duration={60} />
                <Cloud top="65%" delay={20} duration={50} />

                {/* Gameplay Layer */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    {activeBalloons.map((balloon) => (
                        <motion.div
                            key={balloon.id}
                            initial={{ y: '110vh', x: `${balloon.x}vw` }}
                            animate={{ y: '-30vh' }}
                            transition={{ duration: balloon.speed, ease: "linear" }}
                            className="absolute pointer-events-auto"
                            style={{ left: 0 }}
                        >
                            <Balloon
                                value={balloon.value}
                                color={balloon.color}
                                isPopping={poppedId === balloon.id}
                                isHighlighted={balloon.isHighlighted}
                                onClick={(e) => { handleShoot(balloon, e); }}
                            />
                        </motion.div>
                    ))}
                </div>

                {/* Laser Visual - fixed viewport coords, shoots from screen bottom-center to balloon */}
                {laserPath && (() => {
                    const baseX = window.innerWidth / 2;
                    const baseY = window.innerHeight;
                    const dx = laserPath.x - baseX;
                    const dy = laserPath.y - baseY;
                    const lengthPx = Math.sqrt(dx * dx + dy * dy);
                    const angleDeg = Math.atan2(dx, -dy) * (180 / Math.PI);
                    return (
                        <motion.div
                            key={`laser-${laserPath.x}-${laserPath.y}`}
                            initial={{ opacity: 1 }}
                            animate={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="fixed w-2 bg-red-500 shadow-[0_0_20px_#f00,0_0_40px_#f00] z-[9999] pointer-events-none origin-bottom"
                            style={{
                                bottom: 0,
                                left: baseX,
                                height: `${lengthPx}px`,
                                rotate: `${angleDeg}deg`,
                            }}
                        />
                    );
                })()}

                {/* Feedback Messages */}
                <ArcadeFeedbackBanner message={feedback?.message || null} type={feedback?.type} />
            </div>

            {/* Laser Base Decoration - fixed to match laser beam coordinate system */}
            {gameState.status === 'PLAYING' && (
                <div className="fixed bottom-0 left-0 w-full h-12 bg-emerald-400 dark:bg-emerald-600 z-40 border-t-8 border-black/10 dark:border-slate-800 transition-colors duration-300 pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[calc(100%+8px)] w-24 sm:w-32 h-16 bg-slate-100 dark:bg-slate-800 rounded-t-3xl border-8 border-b-0 border-black/10 dark:border-slate-800 flex items-center justify-center transition-colors duration-300">
                        <div className="w-8 h-12 bg-rose-500 rounded-t-xl -translate-y-4 border-4 border-b-0 border-black/10 dark:border-slate-800 shadow-[inset_0_4px_8px_rgba(0,0,0,0.3)] relative overflow-hidden transition-colors duration-300">
                            <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                        </div>
                    </div>
                </div>
            )}
        </ArcadeGameShell >
    );
};

export default RenkliBalon;
