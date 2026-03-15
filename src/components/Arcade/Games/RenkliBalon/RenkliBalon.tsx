import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Brain, Heart, Play, RotateCcw, Star, Target } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import Balloon from '../../Shared/Balloon';
import Cloud from '../../Shared/Cloud';
import { Difficulty, GameState, Pattern, FloatingBalloon } from './types';
import { generateLocalPattern } from './services/patternService';
import { useGamePersistence } from '../../../../hooks/useGamePersistence';
import { useGameViewportFocus } from '../../../../hooks/useGameViewportFocus';
import { useArcadeSoundEffects } from '../../Shared/useArcadeSoundEffects';
import {
    ARCADE_COLORS,
    ARCADE_COLOR_NAMES,
    ARCADE_FEEDBACK_TEXTS,
    ARCADE_DIFFICULTY_THRESHOLDS,
    ARCADE_SPAWN_CONFIG,
    ARCADE_SCORE_FORMULA,
    ARCADE_SCORE_BASE,
} from '../../Shared/ArcadeConstants';
import { KidCard, KidGameFeedbackBanner, KidGameShell, KidGameStatusOverlay } from '../../../kid-ui';

const RenkliBalonPreview: React.FC = () => {
    const steps = [
        {
            title: 'Örüntüyü Oku',
            description: 'Eksik sayı hangi adımda saklanmışsa sırayı dikkatlice takip et.',
            accentColor: 'yellow',
        },
        {
            title: 'Rengi Kontrol Et',
            description: 'Doğru sayı tek başına yetmez; hedef balonun rengi de eşleşmeli.',
            accentColor: 'blue',
        },
        {
            title: 'Balonu Yakala',
            description: 'Gökyüzünde doğru sayı ve doğru renk bir araya gelince hemen vur.',
            accentColor: 'emerald',
        },
    ] as const;

    return (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <div className="rounded-[2rem] border-2 border-black/10 bg-white/85 p-5 shadow-neo-md dark:border-white/10 dark:bg-slate-900/80">
                <div className="rounded-[1.5rem] border-2 border-black/10 bg-[linear-gradient(180deg,#fef3c7_0%,#ffffff_40%,#dbeafe_100%)] p-6 shadow-inner dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(30,41,59,0.96)_0%,rgba(15,23,42,0.96)_100%)]">
                    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                        {[2, 4, '?', 8, 10].map((value, index) => (
                            <div
                                key={`${value}-${index}`}
                                className={[
                                    'relative flex h-16 w-14 items-center justify-center rounded-[40%_40%_50%_50%] border-2 border-black/10 text-xl font-black text-black shadow-neo-sm sm:h-20 sm:w-16 sm:text-2xl',
                                    value === '?' ? 'bg-slate-200 animate-pulse' : '',
                                ].join(' ')}
                                style={value === '?' ? undefined : { backgroundColor: ARCADE_COLORS[index % ARCADE_COLORS.length] }}
                            >
                                {value !== '?' && <div className="absolute left-2 top-2 h-3 w-3 rounded-full bg-white/60" />}
                                <span className="rounded-lg bg-white/30 px-2">{value}</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 flex items-center justify-center gap-4 rounded-[1.5rem] border-2 border-black/10 bg-cyber-blue px-4 py-4 text-white shadow-neo-sm">
                        <div className="h-12 w-10 rounded-[40%_40%_50%_50%] border-2 border-black/10 bg-cyber-pink">
                            <div className="ml-2 mt-2 h-2.5 w-2.5 rounded-full bg-white/60" />
                        </div>
                        <div>
                            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/75">
                                Örnek Hedef
                            </div>
                            <div className="mt-1 text-xl font-black uppercase tracking-[0.2em]">
                                Pembe 6
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-4">
                {steps.map((step) => (
                    <KidCard key={step.title} accentColor={step.accentColor} animate={false} className="h-full">
                        <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                            Balon Görevi
                        </div>
                        <div className="mt-2 text-2xl font-black tracking-tight text-black dark:text-white">
                            {step.title}
                        </div>
                        <p className="mt-2 text-sm font-bold leading-relaxed text-slate-600 dark:text-slate-300">
                            {step.description}
                        </p>
                    </KidCard>
                ))}
            </div>
        </div>
    );
};

const RenkliBalon: React.FC = () => {
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();
    const navigate = useNavigate();
    const { playAreaRef, focusPlayArea } = useGameViewportFocus();
    const { playArcadeSound } = useArcadeSoundEffects();

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
    const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

    const gameContainerRef = useRef<HTMLDivElement>(null);
    const spawnTimerRef = useRef<number | null>(null);
    const checkTimerRef = useRef<number | null>(null);
    const gameStartTimeRef = useRef<number>(0);
    const hasSavedRef = useRef<boolean>(false);
    const isResolvingRef = useRef<boolean>(false);
    const laserTimeoutRef = useRef<number | null>(null);
    const patternTimeoutRef = useRef<number | null>(null);
    const highlightTimeoutRef = useRef<number | null>(null);
    const shotDelayTimeoutRef = useRef<number | null>(null);

    const clearTrackedTimeout = useCallback((timeoutRef: React.MutableRefObject<number | null>) => {
        if (timeoutRef.current !== null) {
            window.clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const clearTransientTimers = useCallback(() => {
        clearTrackedTimeout(laserTimeoutRef);
        clearTrackedTimeout(patternTimeoutRef);
        clearTrackedTimeout(highlightTimeoutRef);
        clearTrackedTimeout(shotDelayTimeoutRef);
        if (spawnTimerRef.current !== null) {
            window.clearInterval(spawnTimerRef.current);
            spawnTimerRef.current = null;
        }
        if (checkTimerRef.current !== null) {
            window.clearInterval(checkTimerRef.current);
            checkTimerRef.current = null;
        }
    }, [clearTrackedTimeout]);

    const scheduleTrackedTimeout = useCallback((
        timeoutRef: React.MutableRefObject<number | null>,
        callback: () => void,
        delay: number,
    ) => {
        clearTrackedTimeout(timeoutRef);
        timeoutRef.current = window.setTimeout(() => {
            timeoutRef.current = null;
            callback();
        }, delay);
    }, [clearTrackedTimeout]);

    useEffect(() => {
        return () => {
            clearTransientTimers();
        };
    }, [clearTransientTimers]);

    const startNewPattern = useCallback((level: number) => {
        clearTransientTimers();
        let difficulty = Difficulty.EASY;
        if (level > ARCADE_DIFFICULTY_THRESHOLDS.HARD_LEVEL) {
            difficulty = Difficulty.HARD;
        } else if (level > ARCADE_DIFFICULTY_THRESHOLDS.MEDIUM_LEVEL) {
            difficulty = Difficulty.MEDIUM;
        }

        const pattern = generateLocalPattern(difficulty);
        setCurrentPattern(pattern);
        setPoppedId(null);
        setLaserPath(null);
        setActiveBalloons([]);
        setFeedback(null);
    }, [clearTransientTimers]);

    const startGame = useCallback(() => {
        clearTransientTimers();
        hasSavedRef.current = false;
        isResolvingRef.current = false;
        setGameState({ score: 0, level: 1, lives: 3, status: 'PLAYING' });
        gameStartTimeRef.current = Date.now();
        startNewPattern(1);
        playArcadeSound('start');
        focusPlayArea();
    }, [clearTransientTimers, focusPlayArea, playArcadeSound, startNewPattern]);

    useEffect(() => {
        if (location.state?.autoStart && gameState.status === 'START') {
            startGame();
        }
    }, [gameState.status, location.state, startGame]);

    useEffect(() => {
        if (gameState.status !== 'PLAYING' || !currentPattern) {
            return;
        }

        const spawnBalloon = () => {
            if (isResolvingRef.current) {
                return;
            }

            const roll = Math.random();
            let value: number;
            let color: string;

            if (roll > 0.7) {
                value = currentPattern.answer;
                color = currentPattern.targetColor;
            } else if (roll > 0.5) {
                value = currentPattern.answer;
                const otherColors = ARCADE_COLORS.filter((item) => item !== currentPattern.targetColor);
                color = otherColors[Math.floor(Math.random() * otherColors.length)];
            } else if (roll > 0.3) {
                const wrongOptions = currentPattern.options.filter((item) => item !== currentPattern.answer);
                value = wrongOptions.length > 0
                    ? wrongOptions[Math.floor(Math.random() * wrongOptions.length)]
                    : currentPattern.answer + 1;
                color = currentPattern.targetColor;
            } else {
                const wrongOptions = currentPattern.options.filter((item) => item !== currentPattern.answer);
                value = wrongOptions.length > 0
                    ? wrongOptions[Math.floor(Math.random() * wrongOptions.length)]
                    : currentPattern.answer + 1;
                const otherColors = ARCADE_COLORS.filter((item) => item !== currentPattern.targetColor);
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
                        - (gameState.level * ARCADE_SPAWN_CONFIG.SPEED_DECAY_PER_LEVEL),
                ),
                startTime: Date.now(),
            };

            setActiveBalloons((prev) => [...prev, newBalloon]);
        };

        const interval = Math.max(
            ARCADE_SPAWN_CONFIG.INTERVAL_MIN_MS,
            ARCADE_SPAWN_CONFIG.INTERVAL_BASE_MS - (gameState.level * ARCADE_SPAWN_CONFIG.INTERVAL_DECAY_PER_LEVEL),
        );

        spawnTimerRef.current = window.setInterval(spawnBalloon, interval);

        return () => {
            if (spawnTimerRef.current !== null) {
                window.clearInterval(spawnTimerRef.current);
                spawnTimerRef.current = null;
            }
        };
    }, [gameState.status, gameState.level, currentPattern]);

    useEffect(() => {
        if (gameState.status !== 'PLAYING') {
            return;
        }

        checkTimerRef.current = window.setInterval(() => {
            if (isResolvingRef.current) {
                return;
            }

            const now = Date.now();
            setActiveBalloons((prev) => prev.filter((balloon) => {
                const duration = (now - balloon.startTime) / 1000;
                const isOffScreen = duration > balloon.speed;

                if (
                    isOffScreen &&
                    balloon.value === currentPattern?.answer &&
                    balloon.color === currentPattern?.targetColor &&
                    poppedId !== balloon.id
                ) {
                    setGameState((prevState) => ({
                        ...prevState,
                        lives: Math.max(0, prevState.lives - 1),
                    }));
                    setFeedback({ message: 'Hedef balon kaçtı!', type: 'error' });
                }

                return !isOffScreen;
            }));
        }, 100);

        return () => {
            if (checkTimerRef.current !== null) {
                window.clearInterval(checkTimerRef.current);
                checkTimerRef.current = null;
            }
        };
    }, [currentPattern, gameState.status, poppedId]);

    useEffect(() => {
        if (gameState.lives <= 0 && gameState.status === 'PLAYING') {
            clearTransientTimers();
            isResolvingRef.current = false;
            setGameState((prev) => ({ ...prev, status: 'GAME_OVER' }));
            if (!hasSavedRef.current) {
                hasSavedRef.current = true;
                void saveGamePlay({
                    game_id: 'renkli-balon',
                    score_achieved: gameState.score,
                    duration_seconds: (Date.now() - gameStartTimeRef.current) / 1000,
                    metadata: { level_reached: gameState.level },
                });
            }
        }
    }, [clearTransientTimers, gameState.lives, gameState.status, gameState.score, gameState.level, saveGamePlay]);

    const handleShoot = (balloon: FloatingBalloon, event: React.MouseEvent) => {
        if (gameState.status !== 'PLAYING' || poppedId || isResolvingRef.current || !currentPattern) {
            return;
        }

        isResolvingRef.current = true;
        const targetRect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        const containerRect = gameContainerRef.current?.getBoundingClientRect();

        if (containerRect) {
            setLaserPath({
                x: targetRect.left + targetRect.width / 2 - containerRect.left,
                y: targetRect.top + targetRect.height / 2 - containerRect.top,
            });
        }

        scheduleTrackedTimeout(shotDelayTimeoutRef, () => {
            const isCorrectValue = balloon.value === currentPattern.answer;
            const isCorrectColor = balloon.color === currentPattern.targetColor;

            if (isCorrectValue && isCorrectColor) {
                setPoppedId(balloon.id);
                setActiveBalloons((prev) => prev.filter((item) => item.id === balloon.id));
                playArcadeSound('success');
                playArcadeSound('levelUp');
                const successMessage =
                    ARCADE_FEEDBACK_TEXTS.SUCCESS_MESSAGES[
                        Math.floor(Math.random() * ARCADE_FEEDBACK_TEXTS.SUCCESS_MESSAGES.length)
                    ];
                setFeedback({ message: successMessage, type: 'success' });

                const nextLevel = gameState.level + 1;
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: {
                        x: (targetRect.left + targetRect.width / 2) / (window.innerWidth || 1000),
                        y: (targetRect.top + targetRect.height / 2) / (window.innerHeight || 1000),
                    },
                });

                setGameState((prev) => ({
                    ...prev,
                    score: prev.score + ARCADE_SCORE_FORMULA(ARCADE_SCORE_BASE, prev.level),
                    level: nextLevel,
                }));

                scheduleTrackedTimeout(patternTimeoutRef, () => {
                    startNewPattern(nextLevel);
                    focusPlayArea();
                    isResolvingRef.current = false;
                }, 1000);
            } else {
                playArcadeSound('fail');
                let type: 'error' | 'warning' = 'error';
                let message =
                    ARCADE_FEEDBACK_TEXTS.ERROR_MESSAGES[
                        Math.floor(Math.random() * ARCADE_FEEDBACK_TEXTS.ERROR_MESSAGES.length)
                    ];

                if (isCorrectValue && !isCorrectColor) {
                    message = 'Numara doğru ama renk yanlış!';
                    type = 'warning';
                } else if (!isCorrectValue && isCorrectColor) {
                    message = 'Renk doğru ama numara yanlış!';
                    type = 'warning';
                }

                setFeedback({ message, type });
                setActiveBalloons((prev) => prev.map((item) => {
                    if (item.value === currentPattern.answer && item.color === currentPattern.targetColor) {
                        return { ...item, isHighlighted: true };
                    }
                    return item;
                }));
                setGameState((prev) => ({
                    ...prev,
                    lives: Math.max(0, prev.lives - 1),
                }));
                setActiveBalloons((prev) => prev.filter((item) => item.id !== balloon.id));

                scheduleTrackedTimeout(highlightTimeoutRef, () => {
                    setActiveBalloons((prev) => prev.map((item) => ({ ...item, isHighlighted: false })));
                    isResolvingRef.current = false;
                }, 500);
            }

            scheduleTrackedTimeout(laserTimeoutRef, () => {
                setLaserPath(null);
                setFeedback(null);
            }, 2000);
        }, 100);
    };

    const targetColorName = currentPattern ? ARCADE_COLOR_NAMES[currentPattern.targetColor] : 'Hazır';

    const overlay = gameState.status === 'START' ? (
        <KidGameStatusOverlay
            tone="yellow"
            icon={Target}
            title="Renkli Balon Avı"
            description="Eksik sayıyı bul, hedef rengi kontrol et ve gökyüzünde doğru balonu yakalayarak seviyeyi büyüt."
            actions={[
                { label: 'Oyuna Başla', variant: 'primary', size: 'lg', icon: Play, onClick: startGame },
                { label: "Arcade'e Dön", variant: 'ghost', size: 'lg', onClick: () => navigate('/bilsem-zeka') },
            ]}
        />
    ) : gameState.status === 'GAME_OVER' ? (
        <KidGameStatusOverlay
            tone="pink"
            icon={Heart}
            title="Balonlar Kaçtı"
            description="Doğru renk ve doğru sayı eşleşmesini birkaç kez kaçırdın. Yeni turda daha sakin ve hızlı oynayabilirsin."
            stats={[
                { label: 'Puan', value: gameState.score, tone: 'yellow' },
                { label: 'Seviye', value: gameState.level, tone: 'blue' },
                { label: 'Can', value: gameState.lives, tone: 'emerald' },
            ]}
            actions={[
                { label: 'Tekrar Oyna', variant: 'primary', size: 'lg', icon: RotateCcw, onClick: startGame },
                { label: "Arcade'e Dön", variant: 'ghost', size: 'lg', onClick: () => navigate('/bilsem-zeka') },
            ]}
            backdropClassName="bg-slate-950/60"
        />
    ) : null;

    return (
        <KidGameShell
            title="Renkli Balon Avı"
            subtitle="Örüntüdeki eksik sayıyı bul, hedef rengi aklında tut ve gökyüzünde doğru balonu vur."
            instruction="Doğru cevap için hem sayı hem renk aynı anda eşleşmeli. Yanlış renk ya da yanlış sayı can götürür."
            backHref="/bilsem-zeka"
            backLabel="Arcade'e Dön"
            badges={[
                { label: 'Seçici Dikkat', variant: 'difficulty' },
                { label: 'TUZÖ 5.1.1', variant: 'tuzo' },
            ]}
            stats={[
                {
                    label: 'Seviye',
                    value: gameState.level,
                    tone: 'blue',
                    icon: Brain,
                    helper: currentPattern?.rule || 'Örüntü hazır',
                },
                {
                    label: 'Puan',
                    value: gameState.score,
                    tone: 'yellow',
                    icon: Star,
                    helper: 'Doğru balon seviye puanı getirir',
                },
                {
                    label: 'Can',
                    value: `${gameState.lives}/3`,
                    tone: gameState.lives <= 1 ? 'pink' : 'emerald',
                    emphasis: gameState.lives <= 1 ? 'danger' : 'default',
                    icon: Heart,
                    helper: gameState.lives <= 1 ? 'Son şans' : 'Balon kaçarsa can azalır',
                },
                {
                    label: 'Hedef',
                    value: targetColorName,
                    tone: 'orange',
                    icon: Target,
                    helper: currentPattern ? `Cevap: ${currentPattern.answer}` : 'Başlangıç bekleniyor',
                },
            ]}
            supportTitle="Balon Rehberi"
            supportDescription="Örüntüyü daha hızlı çözmek ve doğru balonu kaçırmamak için kısa ipuçları burada."
            playAreaRef={playAreaRef}
            playAreaClassName="min-h-[920px]"
            supportArea={(
                <div className="grid gap-3 lg:grid-cols-3">
                    <div className="rounded-[1.5rem] border-2 border-black/10 bg-cyber-yellow/30 px-4 py-4 shadow-neo-sm">
                        <div className="text-sm font-black uppercase tracking-[0.2em] text-black dark:text-white">
                            Örüntü İpucu
                        </div>
                        <p className="mt-2 text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-300">
                            Önce sayı dizisinin artış kuralını bul. Eksik sayı netleşince gökyüzünde yanlış seçenekleri daha hızlı elersin.
                        </p>
                    </div>
                    <div className="rounded-[1.5rem] border-2 border-black/10 bg-cyber-blue/15 px-4 py-4 shadow-neo-sm">
                        <div className="text-sm font-black uppercase tracking-[0.2em] text-black dark:text-white">
                            Renk Kontrolü
                        </div>
                        <p className="mt-2 text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-300">
                            Doğru sayı tek başına yetmez. Balonun rengi hedef etiketiyle eşleşmiyorsa vurmadan önce bir kez daha bak.
                        </p>
                    </div>
                    <div className="rounded-[1.5rem] border-2 border-black/10 bg-cyber-emerald/20 px-4 py-4 shadow-neo-sm">
                        <div className="text-sm font-black uppercase tracking-[0.2em] text-black dark:text-white">
                            Hız Taktigi
                        </div>
                        <p className="mt-2 text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-300">
                            Hedef balon yükselip ekran dışına çıkmadan önce karar ver. Emin değilsen yanlış atış yerine bir an daha izle.
                        </p>
                    </div>
                </div>
            )}
            overlay={overlay}
        >
            {gameState.status === 'PLAYING' && currentPattern ? (
                <div className="space-y-5">
                    <KidGameFeedbackBanner message={feedback?.message || null} type={feedback?.type} />

                    <KidCard accentColor="yellow" animate={false}>
                        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
                            <div>
                                <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                                    Örüntü Görevi
                                </div>
                                <div className="mt-4 flex flex-wrap items-end justify-center gap-2 sm:gap-4 xl:justify-start">
                                    {currentPattern.sequence.map((value, index) => (
                                        <div
                                            key={`sequence-${index}`}
                                            className={[
                                                'relative flex h-16 w-14 items-center justify-center rounded-[40%_40%_50%_50%] border-2 border-black/10 text-xl font-black text-black sm:h-20 sm:w-16 sm:text-2xl',
                                                value === '?' ? 'bg-slate-200 animate-pulse shadow-neo-sm' : '',
                                            ].join(' ')}
                                            style={value === '?' ? undefined : { backgroundColor: ARCADE_COLORS[index % ARCADE_COLORS.length] }}
                                        >
                                            {value !== '?' && <div className="absolute left-2 top-2 h-3 w-3 rounded-full bg-white/60" />}
                                            <span className="rounded-lg bg-white/30 px-2">{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-[1.75rem] border-2 border-black/10 bg-cyber-blue px-4 py-4 text-center text-white shadow-neo-sm">
                                <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/75">
                                    Hedef Balon
                                </div>
                                <div className="mt-3 flex items-center gap-3">
                                    <div
                                        className="relative h-12 w-10 rounded-[40%_40%_50%_50%] border-2 border-black/10"
                                        style={{ backgroundColor: currentPattern.targetColor }}
                                    >
                                        <div className="absolute left-2 top-2 h-2.5 w-2.5 rounded-full bg-white/60" />
                                    </div>
                                    <div className="text-left">
                                        <div className="text-lg font-black uppercase tracking-[0.18em]">
                                            {ARCADE_COLOR_NAMES[currentPattern.targetColor]}
                                        </div>
                                        <div className="text-sm font-black uppercase tracking-[0.2em] text-white/80">
                                            Cevap {currentPattern.answer}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </KidCard>

                    <div
                        ref={gameContainerRef}
                        className="relative min-h-[680px] overflow-hidden rounded-[2rem] border-2 border-black/10 bg-[linear-gradient(180deg,#dbeafe_0%,#e0f2fe_45%,#f0fdf4_100%)] shadow-neo-md dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(30,41,59,0.96)_0%,rgba(15,23,42,0.96)_55%,rgba(6,78,59,0.92)_100%)]"
                    >
                        <div className="absolute inset-0 pointer-events-none opacity-90">
                            <Cloud top="8%" delay={0} duration={45} />
                            <Cloud top="30%" delay={7} duration={60} />
                            <Cloud top="58%" delay={20} duration={50} />
                        </div>

                        <div className="absolute inset-0 pb-20 pointer-events-none">
                            {activeBalloons.map((balloon) => (
                                <motion.div
                                    key={balloon.id}
                                    initial={{ top: '110%' }}
                                    animate={{ top: '-22%' }}
                                    transition={{ duration: balloon.speed, ease: 'linear' }}
                                    className="absolute -translate-x-1/2 pointer-events-auto"
                                    style={{ left: `${balloon.x}%` }}
                                >
                                    <Balloon
                                        value={balloon.value}
                                        color={balloon.color}
                                        isPopping={poppedId === balloon.id}
                                        isHighlighted={balloon.isHighlighted}
                                        onClick={(event) => { handleShoot(balloon, event); }}
                                    />
                                </motion.div>
                            ))}
                        </div>

                        {laserPath && gameContainerRef.current ? (() => {
                            const baseX = gameContainerRef.current.clientWidth / 2;
                            const baseY = gameContainerRef.current.clientHeight;
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
                                    className="absolute z-40 w-2 origin-bottom bg-red-500 shadow-[0_0_20px_#f00,0_0_40px_#f00] pointer-events-none"
                                    style={{
                                        bottom: 0,
                                        left: baseX,
                                        height: `${lengthPx}px`,
                                        rotate: `${angleDeg}deg`,
                                    }}
                                />
                            );
                        })() : null}

                        <div className="absolute bottom-0 left-0 w-full h-14 border-t-4 border-black/10 bg-cyber-emerald dark:border-white/10 pointer-events-none">
                            <div className="absolute left-1/2 top-0 h-16 w-24 -translate-x-1/2 -translate-y-[calc(100%+6px)] rounded-t-[2rem] border-4 border-b-0 border-black/10 bg-white/90 dark:border-white/10 dark:bg-slate-800 sm:w-32">
                                <div className="absolute left-1/2 top-1/2 h-12 w-8 -translate-x-1/2 -translate-y-1/2 rounded-t-xl border-4 border-b-0 border-black/10 bg-cyber-pink shadow-[inset_0_4px_8px_rgba(0,0,0,0.25)] dark:border-white/10">
                                    <div className="absolute inset-0 animate-pulse bg-white/30" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <RenkliBalonPreview />
            )}
        </KidGameShell>
    );
};

export default RenkliBalon;
