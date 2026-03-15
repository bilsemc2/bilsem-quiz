import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Lightbulb, Play, RotateCcw, Star, Target as TargetIcon } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../../../hooks/useGamePersistence';
import { useGameViewportFocus } from '../../../../hooks/useGameViewportFocus';
import { GamePhase, Cell, ColorType } from './types';
import { GAME_CONFIG, LEVEL_CONFIG, COLORS, COLOR_LABELS } from './constants';
import { generateGrid } from './utils';
import { ARCADE_FEEDBACK_TEXTS, ARCADE_SCORE_FORMULA } from '../../Shared/ArcadeConstants';
import { useArcadeSoundEffects } from '../../Shared/useArcadeSoundEffects';
import { KidCard, KidGameFeedbackBanner, KidGameShell, KidGameStatusOverlay } from '../../../kid-ui';

const SCORE_BASE = 10;

const RenkliLambalarPreview: React.FC = () => {
    const steps = [
        {
            title: 'Renkleri Ezberle',
            description: 'Izgara kısa süre açık kalır. Renk kümelerine hızlıca bak ve dağılımı aklında tut.',
            accentColor: 'yellow',
        },
        {
            title: 'Hedefi Bul',
            description: 'Sana söylenen rengi seç ve yalnızca doğru lambaları açarak ilerle.',
            accentColor: 'blue',
        },
        {
            title: 'Seriyi Büyüt',
            description: 'Doğru seçimler hem puan hem seri kazandırır. Bölüm büyüdükçe dikkatini koru.',
            accentColor: 'emerald',
        },
    ] as const;

    return (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <div className="rounded-[2rem] border-2 border-black/10 bg-white/85 p-5 shadow-neo-md dark:border-white/10 dark:bg-slate-900/80">
                <div className="rounded-[1.5rem] border-2 border-black/10 bg-[linear-gradient(180deg,#fef3c7_0%,#ffffff_42%,#dbeafe_100%)] p-6 shadow-inner dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(30,41,59,0.96)_0%,rgba(15,23,42,0.96)_100%)]">
                    <div className="mx-auto grid max-w-md grid-cols-3 gap-3 sm:gap-4">
                        {(['yellow', 'blue', 'red', 'green', 'blue', 'yellow', 'red', 'green', 'yellow'] as const).map((tone, index) => (
                            <div
                                key={`${tone}-${index}`}
                                className="aspect-square rounded-[1.25rem] border-2 border-black/10 shadow-neo-sm"
                                style={{ backgroundColor: COLORS[tone] }}
                            >
                                <div className="ml-3 mt-3 h-3 w-3 rounded-full bg-white/60" />
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 rounded-[1.5rem] border-2 border-black/10 bg-cyber-blue px-4 py-4 text-center text-white shadow-neo-sm">
                        <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/75">
                            Örnek Hedef
                        </div>
                        <div className="mt-2 text-2xl font-black uppercase tracking-[0.2em]">
                            SARI
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-4">
                {steps.map((step) => (
                    <KidCard key={step.title} accentColor={step.accentColor} animate={false} className="h-full">
                        <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                            Lamba Görevi
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

const RenkliLambalar: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const autoStart = location.state?.autoStart === true;
    const { saveGamePlay } = useGamePersistence();
    const { playAreaRef, focusPlayArea } = useGameViewportFocus();
    const { playArcadeSound } = useArcadeSoundEffects();

    const hasSavedRef = useRef<boolean>(false);
    const isResolvingRef = useRef<boolean>(false);
    const startTimeRef = useRef<number>(0);
    const countdownTimeoutRef = useRef<number | null>(null);
    const feedbackTimeoutRef = useRef<number | null>(null);
    const levelAdvanceTimeoutRef = useRef<number | null>(null);
    const releaseResolveTimeoutRef = useRef<number | null>(null);
    const clearErrorTimeoutRef = useRef<number | null>(null);
    const revealPhaseTimeoutRef = useRef<number | null>(null);
    const gameOverTimeoutRef = useRef<number | null>(null);

    const [phase, setPhase] = useState<GamePhase>('idle');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(GAME_CONFIG.INITIAL_LIVES);
    const [level, setLevel] = useState(1);
    const [streak, setStreak] = useState(0);
    const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
    const [grid, setGrid] = useState<Cell[]>([]);
    const [currentGridSize, setCurrentGridSize] = useState(3);
    const [targetColor, setTargetColor] = useState<ColorType | null>(null);
    const [countdown, setCountdown] = useState(5);
    const [totalTargets, setTotalTargets] = useState(0);
    const [foundTargets, setFoundTargets] = useState(0);

    const clearTrackedTimeout = useCallback((timeoutRef: React.MutableRefObject<number | null>) => {
        if (timeoutRef.current !== null) {
            window.clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

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

    const clearScheduledTimeouts = useCallback(() => {
        clearTrackedTimeout(countdownTimeoutRef);
        clearTrackedTimeout(feedbackTimeoutRef);
        clearTrackedTimeout(levelAdvanceTimeoutRef);
        clearTrackedTimeout(releaseResolveTimeoutRef);
        clearTrackedTimeout(clearErrorTimeoutRef);
        clearTrackedTimeout(revealPhaseTimeoutRef);
        clearTrackedTimeout(gameOverTimeoutRef);
    }, [clearTrackedTimeout]);

    useEffect(() => {
        return () => {
            clearScheduledTimeouts();
        };
    }, [clearScheduledTimeouts]);

    useEffect(() => {
        if (!feedback) {
            clearTrackedTimeout(feedbackTimeoutRef);
            return;
        }

        scheduleTrackedTimeout(feedbackTimeoutRef, () => setFeedback(null), 1000);
    }, [clearTrackedTimeout, feedback, scheduleTrackedTimeout]);

    useEffect(() => {
        if (phase !== 'memorizing') {
            clearTrackedTimeout(countdownTimeoutRef);
            return;
        }

        if (countdown > 0) {
            scheduleTrackedTimeout(countdownTimeoutRef, () => setCountdown((prev) => prev - 1), 1000);
            return;
        }

        const colorsInGrid = Array.from(new Set(grid.map((cell) => cell.color)));
        const randomTarget = colorsInGrid[Math.floor(Math.random() * colorsInGrid.length)] as ColorType;
        const count = grid.filter((cell) => cell.color === randomTarget).length;

        setTargetColor(randomTarget);
        setTotalTargets(count);
        setFoundTargets(0);
        setPhase('playing');
    }, [clearTrackedTimeout, countdown, grid, phase, scheduleTrackedTimeout]);

    const handleStart = useCallback(() => {
        clearScheduledTimeouts();
        const levelConfig = LEVEL_CONFIG[1];
        const newGrid = generateGrid(levelConfig.gridSize);
        playArcadeSound('start');

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
        setTotalTargets(0);
        setFoundTargets(0);
        startTimeRef.current = Date.now();
        hasSavedRef.current = false;
        isResolvingRef.current = false;
        focusPlayArea();
    }, [clearScheduledTimeouts, focusPlayArea, playArcadeSound]);

    useEffect(() => {
        if (autoStart && phase === 'idle') {
            handleStart();
        }
    }, [autoStart, phase, handleStart]);

    const startNextLevel = useCallback((nextLevel: number) => {
        clearScheduledTimeouts();
        const levelConfig = LEVEL_CONFIG[nextLevel] || LEVEL_CONFIG[10];
        const newGrid = generateGrid(levelConfig.gridSize);

        setGrid(newGrid);
        setCurrentGridSize(levelConfig.gridSize);
        setPhase('memorizing');
        setCountdown(levelConfig.memorizeTime);
        setTargetColor(null);
        setFeedback(null);
        setTotalTargets(0);
        setFoundTargets(0);
        isResolvingRef.current = false;
        focusPlayArea();
    }, [clearScheduledTimeouts, focusPlayArea]);

    const handleGameOver = useCallback(async () => {
        if (hasSavedRef.current) {
            return;
        }

        hasSavedRef.current = true;
        clearScheduledTimeouts();
        isResolvingRef.current = false;
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
            },
        });
    }, [clearScheduledTimeouts, saveGamePlay, score, level, lives, streak]);

    const handleVictory = useCallback(async () => {
        if (hasSavedRef.current) {
            return;
        }

        hasSavedRef.current = true;
        clearScheduledTimeouts();
        isResolvingRef.current = false;
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
            },
        });
    }, [clearScheduledTimeouts, saveGamePlay, score, streak]);

    const handleCellClick = useCallback((cellId: number) => {
        if (phase !== 'playing' || !targetColor || isResolvingRef.current) {
            return;
        }

        const cell = grid[cellId];
        if (!cell || cell.isRevealed) {
            return;
        }

        isResolvingRef.current = true;

        if (cell.color === targetColor) {
            const updatedGrid = [...grid];
            updatedGrid[cellId].isRevealed = true;
            setGrid(updatedGrid);

            const newFoundTargets = foundTargets + 1;
            setFoundTargets(newFoundTargets);
            setScore((prev) => prev + ARCADE_SCORE_FORMULA(SCORE_BASE, level));
            setStreak((prev) => prev + 1);

            const message =
                ARCADE_FEEDBACK_TEXTS.SUCCESS_MESSAGES[
                    Math.floor(Math.random() * ARCADE_FEEDBACK_TEXTS.SUCCESS_MESSAGES.length)
                ];
            setFeedback({ message, type: 'success' });
            playArcadeSound(newFoundTargets === totalTargets ? 'success' : 'hit');

            if (newFoundTargets === totalTargets) {
                if (level >= GAME_CONFIG.MAX_LEVEL) {
                    playArcadeSound('levelUp');
                    void handleVictory();
                } else {
                    const nextLevel = level + 1;
                    playArcadeSound('levelUp');
                    setLevel(nextLevel);
                    scheduleTrackedTimeout(levelAdvanceTimeoutRef, () => startNextLevel(nextLevel), 1000);
                }
            }

            scheduleTrackedTimeout(releaseResolveTimeoutRef, () => {
                isResolvingRef.current = false;
            }, 300);
            return;
        }

        const updatedGrid = [...grid];
        updatedGrid[cellId].isError = true;
        setGrid(updatedGrid);
        setStreak(0);

        const newLives = lives - 1;
        setLives(newLives);

        const message =
            ARCADE_FEEDBACK_TEXTS.ERROR_MESSAGES[
                Math.floor(Math.random() * ARCADE_FEEDBACK_TEXTS.ERROR_MESSAGES.length)
            ];
        setFeedback({ message, type: 'error' });
        playArcadeSound('fail');

        scheduleTrackedTimeout(clearErrorTimeoutRef, () => {
            setGrid((prev) => prev.map((item) => (item.id === cellId ? { ...item, isError: false } : item)));
        }, 400);

        if (newLives <= 0) {
            scheduleTrackedTimeout(revealPhaseTimeoutRef, () => {
                setPhase('revealing');
            }, 500);

            scheduleTrackedTimeout(gameOverTimeoutRef, () => {
                void handleGameOver();
            }, 2500);
            return;
        }

        scheduleTrackedTimeout(releaseResolveTimeoutRef, () => {
            isResolvingRef.current = false;
        }, 500);
    }, [
        foundTargets,
        grid,
        handleGameOver,
        handleVictory,
        level,
        lives,
        phase,
        scheduleTrackedTimeout,
        startNextLevel,
        targetColor,
        totalTargets,
        playArcadeSound,
    ]);

    const isActivePlayPhase = phase === 'memorizing' || phase === 'playing' || phase === 'revealing';
    const targetLabel =
        phase === 'memorizing'
            ? 'Ezberle'
            : phase === 'revealing'
                ? 'Açılıyor'
                : targetColor
                    ? COLOR_LABELS[targetColor]
                    : 'Hazır';
    const progressLabel = totalTargets > 0 ? `${foundTargets}/${totalTargets}` : 'Hazırlanıyor';

    const overlay = phase === 'idle' ? (
        <KidGameStatusOverlay
            tone="yellow"
            icon={Lightbulb}
            title="Renkli Lambalar"
            description="Renkleri kısa sürede ezberle, hedef rengi bul ve her bölümde dikkatini biraz daha büyüt."
            actions={[
                { label: 'Oyuna Başla', variant: 'primary', size: 'lg', icon: Play, onClick: handleStart },
                { label: "Arcade'e Dön", variant: 'ghost', size: 'lg', onClick: () => navigate('/bilsem-zeka') },
            ]}
        >
            <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border-2 border-black/10 bg-cyber-yellow/80 px-4 py-4 shadow-neo-sm">
                    <div className="text-[11px] font-black uppercase tracking-[0.2em] text-black/70">1</div>
                    <div className="mt-2 text-sm font-black uppercase">Rengi Ezberle</div>
                </div>
                <div className="rounded-2xl border-2 border-black/10 bg-cyber-blue px-4 py-4 text-white shadow-neo-sm">
                    <div className="text-[11px] font-black uppercase tracking-[0.2em] text-white/70">2</div>
                    <div className="mt-2 text-sm font-black uppercase">Hedefi Seç</div>
                </div>
                <div className="rounded-2xl border-2 border-black/10 bg-cyber-emerald px-4 py-4 text-black shadow-neo-sm">
                    <div className="text-[11px] font-black uppercase tracking-[0.2em] text-black/70">3</div>
                    <div className="mt-2 text-sm font-black uppercase">Seriyi Koru</div>
                </div>
            </div>
        </KidGameStatusOverlay>
    ) : phase === 'game_over' ? (
        <KidGameStatusOverlay
            tone="pink"
            icon={Heart}
            title="Tur Bitti"
            description="Renkleri yakaladın ama canlar tükendi. Bir tur daha deneyip daha uzun seri kurabilirsin."
            stats={[
                { label: 'Puan', value: score, tone: 'yellow' },
                { label: 'Seviye', value: level, tone: 'blue' },
                { label: 'Seri', value: streak, tone: 'emerald' },
            ]}
            actions={[
                { label: 'Tekrar Oyna', variant: 'primary', size: 'lg', icon: RotateCcw, onClick: handleStart },
                { label: "Arcade'e Dön", variant: 'ghost', size: 'lg', onClick: () => navigate('/bilsem-zeka') },
            ]}
            backdropClassName="bg-slate-950/60"
        />
    ) : phase === 'victory' ? (
        <KidGameStatusOverlay
            tone="emerald"
            icon={Star}
            title="Lambaların Ustası"
            description="Tüm bölümleri tamamladın. Görsel belleğin ve odak hızın birlikte çok iyi çalıştı."
            stats={[
                { label: 'Puan', value: score, tone: 'yellow' },
                { label: 'Bölüm', value: GAME_CONFIG.MAX_LEVEL, tone: 'blue' },
                { label: 'Seri', value: streak, tone: 'emerald' },
            ]}
            actions={[
                { label: 'Yeniden Başla', variant: 'primary', size: 'lg', icon: RotateCcw, onClick: handleStart },
                { label: "Arcade'e Dön", variant: 'ghost', size: 'lg', onClick: () => navigate('/bilsem-zeka') },
            ]}
            backdropClassName="bg-slate-950/60"
        />
    ) : null;

    return (
        <KidGameShell
            title="Renkli Lambalar"
            subtitle="Renk kümelerini ezberle, hedef rengi hızlıca bul ve bölümler büyüdükçe odağını koru."
            instruction="Önce renkleri aklında tut. Oyun başlayınca yalnızca istenen renkteki lambalara dokun."
            backHref="/bilsem-zeka"
            backLabel="Arcade'e Dön"
            badges={[
                { label: 'Görsel Bellek', variant: 'difficulty' },
                { label: 'TUZÖ 5.4.2', variant: 'tuzo' },
            ]}
            stats={[
                {
                    label: 'Puan',
                    value: score,
                    tone: 'yellow',
                    icon: Star,
                    helper: streak > 0 ? `${streak} seri` : 'Seriyi başlat',
                },
                {
                    label: 'Seviye',
                    value: level,
                    tone: 'blue',
                    icon: Lightbulb,
                    helper: `${currentGridSize}x${currentGridSize} ızgara`,
                },
                {
                    label: 'Can',
                    value: `${lives}/${GAME_CONFIG.INITIAL_LIVES}`,
                    tone: lives <= 1 ? 'pink' : 'emerald',
                    emphasis: lives <= 1 ? 'danger' : 'default',
                    icon: Heart,
                    helper: phase === 'revealing' ? 'Renkler açılıyor' : 'Yanlış seçim can götürür',
                },
                {
                    label: 'Hedef',
                    value: targetLabel,
                    tone: 'orange',
                    icon: TargetIcon,
                    helper: progressLabel,
                },
            ]}
            supportTitle="Lamba Rehberi"
            supportDescription="Renkleri daha kolay hatırlamak ve hata sayısını azaltmak için kısa ipuçları burada."
            playAreaRef={playAreaRef}
            playAreaClassName="min-h-[760px]"
            supportArea={(
                <div className="grid gap-3 lg:grid-cols-3">
                    <div className="rounded-[1.5rem] border-2 border-black/10 bg-cyber-yellow/30 px-4 py-4 shadow-neo-sm">
                        <div className="text-sm font-black uppercase tracking-[0.2em] text-black dark:text-white">
                            Ezber Taktigi
                        </div>
                        <p className="mt-2 text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-300">
                            Tüm kareleri tek tek saymak yerine aynı renkteki kümeleri gözünle grupla. Böylece hedef rengi daha hızlı bulursun.
                        </p>
                    </div>
                    <div className="rounded-[1.5rem] border-2 border-black/10 bg-cyber-blue/15 px-4 py-4 shadow-neo-sm">
                        <div className="text-sm font-black uppercase tracking-[0.2em] text-black dark:text-white">
                            Hedef Kontrol
                        </div>
                        <p className="mt-2 text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-300">
                            Oyun başlayınca önce üstteki hedef rengin etiketine bak, sonra yalnızca o renkteki lambaları sırayla aç.
                        </p>
                    </div>
                    <div className="rounded-[1.5rem] border-2 border-black/10 bg-cyber-emerald/20 px-4 py-4 shadow-neo-sm">
                        <div className="text-sm font-black uppercase tracking-[0.2em] text-black dark:text-white">
                            Seri Bonusu
                        </div>
                        <p className="mt-2 text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-300">
                            Hızlı ve doğru seçimler seri kurmanı kolaylaştırır. Seri yükseldikçe ritmin oturur ve hata yapma olasılığın düşer.
                        </p>
                    </div>
                </div>
            )}
            overlay={overlay}
        >
            <div className="space-y-5 text-black dark:text-white">
                <KidGameFeedbackBanner message={feedback?.message ?? null} type={feedback?.type} />

                <AnimatePresence mode="wait">
                    {isActivePlayPhase ? (
                        <motion.div
                            key="game"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            className="space-y-4"
                        >
                            <KidCard accentColor={phase === 'memorizing' ? 'yellow' : phase === 'revealing' ? 'pink' : 'blue'} animate={false}>
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    {phase === 'memorizing' ? (
                                        <>
                                            <div>
                                                <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                                                    Ezberleme Süresi
                                                </div>
                                                <div className="mt-2 text-3xl font-black tracking-tight text-black dark:text-white">
                                                    Renkleri Hatırla
                                                </div>
                                            </div>
                                            <div className="rounded-[1.5rem] border-2 border-black/10 bg-cyber-yellow px-5 py-4 text-center text-black shadow-neo-sm">
                                                <div className="text-[11px] font-black uppercase tracking-[0.22em] text-black/70">
                                                    Sayaç
                                                </div>
                                                <div className="mt-2 text-4xl font-black leading-none">
                                                    {countdown}
                                                </div>
                                            </div>
                                        </>
                                    ) : phase === 'playing' && targetColor ? (
                                        <>
                                            <div>
                                                <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                                                    Hedef Renk
                                                </div>
                                                <div className="mt-2 flex items-center gap-3">
                                                    <span
                                                        className="rounded-[1.25rem] border-2 border-black/10 px-4 py-2 text-xl font-black uppercase tracking-[0.18em] shadow-neo-sm"
                                                        style={{ backgroundColor: COLORS[targetColor], color: '#000' }}
                                                    >
                                                        {COLOR_LABELS[targetColor]}
                                                    </span>
                                                    <span className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                                        {foundTargets}/{totalTargets}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="rounded-[1.5rem] border-2 border-black/10 bg-cyber-blue px-5 py-4 text-center text-white shadow-neo-sm">
                                                <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/70">
                                                    Seri
                                                </div>
                                                <div className="mt-2 text-4xl font-black leading-none">
                                                    {streak}
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div>
                                                <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                                                    Son Görünüm
                                                </div>
                                                <div className="mt-2 text-3xl font-black tracking-tight text-black dark:text-white">
                                                    Renkler Yeniden Açılıyor
                                                </div>
                                            </div>
                                            <div className="rounded-[1.5rem] border-2 border-black/10 bg-cyber-pink px-5 py-4 text-center text-white shadow-neo-sm">
                                                <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/70">
                                                    Can
                                                </div>
                                                <div className="mt-2 text-4xl font-black leading-none">
                                                    {lives}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </KidCard>

                            <div className="rounded-[2rem] border-2 border-black/10 bg-white/80 p-4 shadow-neo-md dark:border-white/10 dark:bg-slate-900/80">
                                <div
                                    className="mx-auto grid gap-1.5 rounded-[1.75rem] border-2 border-black/10 bg-slate-100 p-3 shadow-neo-sm dark:border-white/10 dark:bg-slate-800 sm:gap-3 sm:p-6"
                                    style={{
                                        gridTemplateColumns: `repeat(${currentGridSize}, minmax(0, 1fr))`,
                                        width: 'min(80vw, 400px)',
                                        aspectRatio: '1',
                                    }}
                                >
                                    {grid.map((cell) => {
                                        const isVisible = phase === 'memorizing' || phase === 'revealing' || cell.isRevealed;
                                        const isRevealing = phase === 'revealing';

                                        return (
                                            <motion.button
                                                key={cell.id}
                                                type="button"
                                                onClick={() => handleCellClick(cell.id)}
                                                disabled={phase !== 'playing' || cell.isRevealed}
                                                whileHover={phase === 'playing' && !cell.isRevealed ? { scale: 1.05, y: -2 } : {}}
                                                whileTap={phase === 'playing' && !cell.isRevealed ? { scale: 0.95 } : {}}
                                                animate={isRevealing ? { scale: [1, 1.1, 1], transition: { duration: 0.3 } } : {}}
                                                className={[
                                                    'relative aspect-square overflow-hidden rounded-xl border-2 border-black/10 transition-all duration-300 sm:rounded-2xl dark:border-white/10',
                                                    cell.isError ? 'animate-shake' : '',
                                                    phase === 'playing' && !cell.isRevealed ? 'cursor-pointer hover:shadow-neo-sm' : 'shadow-none',
                                                    isVisible ? '' : 'shadow-neo-sm dark:shadow-[4px_4px_0_#0f172a]',
                                                ].join(' ')}
                                                style={{
                                                    backgroundColor: isVisible ? cell.hex : '#94a3b8',
                                                    transform: isVisible ? 'translateY(4px)' : 'translateY(0)',
                                                    boxShadow: isVisible ? 'none' : '4px 4px 0 #000',
                                                }}
                                            >
                                                {isVisible ? (
                                                    <div className="absolute left-2 top-1 h-3 w-3 rounded-full bg-white/60 sm:left-3 sm:top-2 sm:h-4 sm:w-4" />
                                                ) : null}
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="preview"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                        >
                            <RenkliLambalarPreview />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </KidGameShell>
    );
};

export default RenkliLambalar;
