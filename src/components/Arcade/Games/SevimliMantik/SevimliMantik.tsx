import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { RotateCcw, Timer, Bug } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useGamePersistence } from '../../../../hooks/useGamePersistence';
import ArcadeGameShell from '../../Shared/ArcadeGameShell';
import ArcadeFeedbackBanner from '../../Shared/ArcadeFeedbackBanner';
import { ARCADE_SCORE_FORMULA, ARCADE_SCORE_BASE } from '../../Shared/ArcadeConstants';

// ─── Constants ──────────────────────────────────────
const INITIAL_LIVES = 3;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;

// ─── Creature Data ──────────────────────────────────
type CreatureAction = 'jump' | 'spin' | 'move_right' | 'move_left' | 'shake' | 'idle' | 'grow';

interface CreatureData {
    id: string;
    imageUrl: string;
    name: string;
    color: string;
    action: CreatureAction;
}

interface RoundData {
    creatures: CreatureData[];
    instruction: string;
    options: { id: string; label: string; bgColor: string }[];
    correctOptionId: string;
}

const CREATURES = [
    { imageUrl: "https://api.dicebear.com/9.x/bottts/svg?seed=Bibo&baseColor=3b82f6", name: "Mavi Robot Bibo", id: "botBlue", color: "blue" },
    { imageUrl: "https://api.dicebear.com/9.x/bottts/svg?seed=Gogo&baseColor=22c55e", name: "Yeşil Robot Gogo", id: "botGreen", color: "green" },
    { imageUrl: "https://api.dicebear.com/9.x/bottts/svg?seed=Pupu&baseColor=ec4899", name: "Pembe Robot Pupu", id: "botPink", color: "pink" },
    { imageUrl: "https://api.dicebear.com/9.x/bottts/svg?seed=Yoyo&baseColor=eab308", name: "Sarı Robot Yoyo", id: "botYellow", color: "yellow" },
    { imageUrl: "https://api.dicebear.com/9.x/bottts/svg?seed=Bobo&baseColor=78716c", name: "Gri Robot Bobo", id: "botGrey", color: "grey" },
];

const COLORS = [
    { label: "Kırmızı", bgColor: "from-red-500 to-red-600", id: "red" },
    { label: "Mavi", bgColor: "from-blue-500 to-blue-600", id: "blue" },
    { label: "Yeşil", bgColor: "from-green-500 to-green-600", id: "green" },
    { label: "Sarı", bgColor: "from-yellow-400 to-amber-500", id: "yellow" },
    { label: "Mor", bgColor: "from-purple-500 to-purple-600", id: "purple" },
    { label: "Turuncu", bgColor: "from-orange-500 to-orange-600", id: "orange" },
];

const ACTIONS: { key: CreatureAction; text: string }[] = [
    { key: 'jump', text: 'zıplarsa' },
    { key: 'spin', text: 'dönerse' },
    { key: 'move_right', text: 'sağa giderse' },
    { key: 'move_left', text: 'sola giderse' },
    { key: 'shake', text: 'sallanırsa' },
    { key: 'grow', text: 'büyürse' },
    { key: 'idle', text: 'hareket etmezse' },
];

// ─── Helpers ────────────────────────────────────────
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => 0.5 - Math.random());

type Difficulty = 'easy' | 'medium' | 'hard';
const getDifficulty = (level: number): Difficulty => level <= 7 ? 'easy' : level <= 14 ? 'medium' : 'hard';

const generateRound = (level: number): RoundData => {
    const diff = getDifficulty(level);
    const selectedCreatures = shuffle(CREATURES).slice(0, 2);
    const selectedColors = shuffle(COLORS).slice(0, 2);
    const option1 = selectedColors[0];
    const option2 = selectedColors[1];

    const creatures: CreatureData[] = selectedCreatures.map((c, idx) => ({
        id: `c-${level}-${idx}`,
        imageUrl: c.imageUrl,
        name: c.name,
        color: c.color,
        action: pick(ACTIONS).key,
    }));

    const subjectCreature = creatures[0];
    const otherCreature = creatures[1];
    const conditionAction = pick(ACTIONS);

    let instruction: string;
    let correctOptionId: string;

    if (diff === 'easy' || (diff === 'medium' && Math.random() > 0.4)) {
        instruction = `Eğer ${subjectCreature.name} ${conditionAction.text}, ${option1.label} rengine tıkla. Aksi takdirde ${option2.label} rengine tıkla.`;
        const isMatch = subjectCreature.action === conditionAction.key;
        correctOptionId = isMatch ? option1.id : option2.id;
    } else {
        const conditionAction2 = pick(ACTIONS);
        const isAnd = Math.random() > 0.5;
        const operatorText = isAnd ? "VE" : "VEYA";
        instruction = `Eğer ${subjectCreature.name} ${conditionAction.text} ${operatorText} ${otherCreature.name} ${conditionAction2.text}, ${option1.label} rengine tıkla. Aksi takdirde ${option2.label} rengine tıkla.`;
        const cond1 = subjectCreature.action === conditionAction.key;
        const cond2 = otherCreature.action === conditionAction2.key;
        const match = isAnd ? (cond1 && cond2) : (cond1 || cond2);
        correctOptionId = match ? option1.id : option2.id;
    }

    return {
        creatures,
        instruction,
        options: selectedColors.map(c => ({ id: c.id, label: c.label, bgColor: c.bgColor })),
        correctOptionId,
    };
};

// ─── Animated Creature Component ────────────────────
const CREATURE_BG: Record<string, string> = {
    blue: 'from-sky-300 to-sky-400 border-sky-500',
    green: 'from-green-300 to-green-400 border-green-500',
    pink: 'from-pink-300 to-pink-400 border-pink-500',
    yellow: 'from-yellow-300 to-yellow-400 border-yellow-500',
    grey: 'from-stone-300 to-stone-400 border-stone-500',
};

const AnimatedCreature: React.FC<{ data: CreatureData; isPlaying: boolean; onAnimationEnd?: (id: string) => void }> = ({ data, isPlaying, onAnimationEnd }) => {
    const controls = useAnimation();

    useEffect(() => {
        let cancelled = false;
        const run = async () => {
            if (isPlaying) {
                try {
                    switch (data.action) {
                        case 'jump': await controls.start({ y: [0, -60, 0, -30, 0], scale: [1, 1.1, 0.9, 1.05, 1], transition: { duration: 0.8 } }); break;
                        case 'spin': await controls.start({ rotate: 360, scale: [1, 1.2, 1], transition: { duration: 0.8 } }); break;
                        case 'shake': await controls.start({ x: [-10, 10, -10, 10, -5, 5, 0], transition: { duration: 0.6 } }); break;
                        case 'move_right': await controls.start({ x: 80, rotate: [0, 10, -10, 0], transition: { duration: 1 } }); break;
                        case 'move_left': await controls.start({ x: -80, rotate: [0, -10, 10, 0], transition: { duration: 1 } }); break;
                        case 'grow': await controls.start({ scale: [1, 1.5, 1.5, 1], transition: { duration: 1.2 } }); break;
                        case 'idle': default: await controls.start({ scale: [1, 1.05, 1], transition: { duration: 1 } }); break;
                    }
                } catch {
                    // No-op: animation can be interrupted when phase changes.
                }
                if (!cancelled && onAnimationEnd) onAnimationEnd(data.id);
            } else {
                controls.set({ x: 0, y: 0, rotate: 0, scale: 1 });
            }
        };
        run();
        return () => { cancelled = true; };
    }, [isPlaying, data.id, data.action, onAnimationEnd, controls]);

    const bg = CREATURE_BG[data.color] || 'bg-slate-300 border-slate-500';

    return (
        <div className="flex flex-col items-center justify-end">
            <div className="w-20 h-3 bg-black/20 rounded-full blur-sm mb-1" />
            <motion.div animate={controls}
                className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl sm:rounded-[2rem] bg-gradient-to-br ${bg} border-2 border-black/10 dark:border-slate-800 flex items-center justify-center overflow-hidden shadow-neo-sm transition-colors duration-300`}>
                <img src={data.imageUrl} alt={data.name} className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-md z-10" />
                <div className="absolute top-2 left-2 w-4 h-6 bg-white/60 rounded-full rotate-12" />
            </motion.div>
            <div className="mt-4 bg-white dark:bg-slate-700 px-4 py-1.5 rounded-xl border-2 border-black/10 dark:border-slate-800 shadow-neo-sm text-xs sm:text-sm font-black text-black dark:text-white whitespace-nowrap rotate-2 transition-colors duration-300">
                {data.name}
            </div>
        </div>
    );
};

// ─── Types ──────────────────────────────────────────
type Phase = 'welcome' | 'animating' | 'playing' | 'feedback' | 'game_over' | 'victory';

// ─── Action Labels ──────────────────────────────────
const actionLabels: Record<CreatureAction, string> = {
    jump: '⬆️ Zıpladı', spin: '🔄 Döndü', move_right: '➡️ Sağa gitti',
    move_left: '⬅️ Sola gitti', shake: '↔️ Sallandı', idle: '🧘 Durdu', grow: '📏 Büyüdü',
};

// ─── Component ──────────────────────────────────────
const SevimliMantik: React.FC = () => {
    const { saveGamePlay } = useGamePersistence();
    const hasSavedRef = useRef(false);
    const isResolvingRef = useRef(false);
    const location = useLocation();

    const [phase, setPhase] = useState<Phase>('welcome');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [level, setLevel] = useState(1);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const [round, setRound] = useState<RoundData | null>(null);
    const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);
    const animationDoneRef = useRef<Set<string>>(new Set());

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    // Timer
    useEffect(() => {
        if ((phase === 'playing' || phase === 'animating') && timeLeft > 0) {
            timerRef.current = setTimeout(() => setTimeLeft(p => p - 1), 1000);
        } else if (timeLeft === 0 && (phase === 'playing' || phase === 'animating')) {
            handleGameOver();
        }
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [phase, timeLeft]);

    // Generate round when level changes
    useEffect(() => {
        if (phase === 'animating' || phase === 'playing') {
            const newRound = generateRound(level);
            setRound(newRound);
            setPhase('animating');
        }
    }, [level]);

    // Start
    const handleStart = useCallback(() => {
        window.scrollTo(0, 0);
        const newRound = generateRound(1);
        setRound(newRound);
        setPhase('animating');
        setScore(0);
        setLives(INITIAL_LIVES);
        setLevel(1);
        setTimeLeft(TIME_LIMIT);
        setFeedback(null);
        startTimeRef.current = Date.now();
        hasSavedRef.current = false;
        isResolvingRef.current = false;
    }, []);

    // Auto-start for arcade mode
    useEffect(() => {
        if (location.state?.autoStart && phase === 'welcome') handleStart();
    }, [location.state, phase, handleStart]);

    // Animation end handler
    const handleAnimationEnd = useCallback((creatureId: string) => {
        if (phase !== 'animating' || !round) return;
        animationDoneRef.current.add(creatureId);
        if (animationDoneRef.current.size >= round.creatures.length) {
            setPhase('playing');
        }
    }, [phase, round]);

    useEffect(() => {
        if (phase === 'animating') {
            animationDoneRef.current.clear();
        }
    }, [phase, round]);

    // Replay animation
    const handleReplay = useCallback(() => {
        if (phase === 'playing') setPhase('animating');
    }, [phase]);

    // Game Over
    const handleGameOver = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        isResolvingRef.current = true;
        setPhase('game_over');
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        await saveGamePlay({ game_id: 'arcade-sevimli-mantik', score_achieved: score, duration_seconds: duration, metadata: { levels_completed: level, final_lives: lives } });
    }, [saveGamePlay, score, level, lives]);

    // Victory
    const handleVictory = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        isResolvingRef.current = true;
        setPhase('victory');
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        await saveGamePlay({ game_id: 'arcade-sevimli-mantik', score_achieved: score, duration_seconds: duration, metadata: { levels_completed: MAX_LEVEL, victory: true } });
    }, [saveGamePlay, score]);

    // Select option
    const handleOptionSelect = useCallback((optionId: string) => {
        if (!round || phase !== 'playing' || isResolvingRef.current) return;
        isResolvingRef.current = true;

        const correct = optionId === round.correctOptionId;

        if (correct) {
            setScore(s => s + ARCADE_SCORE_FORMULA(ARCADE_SCORE_BASE, level));
            setFeedback({ message: 'Harikasın! 🎉', type: 'success' });
        } else {
            setLives(l => l - 1);
            setFeedback({ message: 'Tekrar dene! 💪', type: 'error' });
        }

        setTimeout(() => {
            setFeedback(null);
            const newLives = correct ? lives : lives - 1;
            if (!correct && newLives <= 0) { handleGameOver(); return; }
            if (correct && level >= MAX_LEVEL) { handleVictory(); return; }
            if (correct) setLevel(l => l + 1);
            else { setRound(generateRound(level)); setPhase('animating'); }
            if (correct) setPhase('animating');
            isResolvingRef.current = false;
        }, 1500);
    }, [round, phase, score, lives, level, handleGameOver, handleVictory]);

    // Shell status mapping
    const shellStatus: 'START' | 'PLAYING' | 'GAME_OVER' =
        phase === 'welcome' ? 'START' :
            (phase === 'game_over' || phase === 'victory') ? 'GAME_OVER' : 'PLAYING';

    // Timer HUD extra
    const timerHudExtra = (
        <div className={`bg-blue-300 px-3 sm:px-5 py-1.5 sm:py-2 rounded-xl shadow-neo-sm flex items-center gap-1.5 sm:gap-2 border-2 border-black/10`}>
            <Timer className="text-black w-4 h-4 sm:w-6 sm:h-6" strokeWidth={3} />
            <span className={`text-base sm:text-xl font-black text-black leading-none ${timeLeft <= 30 ? 'text-red-500 animate-pulse' : ''}`}>{formatTime(timeLeft)}</span>
        </div>
    );

    return (
        <ArcadeGameShell
            gameState={{ score, level, lives, status: shellStatus }}
            gameMetadata={{
                id: 'sevimli-mantik',
                title: 'SEVİMLİ MANTIK',
                description: (
                    <>
                        <p>1. Robotların <span className="bg-yellow-300 text-black px-1.5 rounded font-black border-2 border-black/10 rotate-1 inline-block text-xs">hareketlerini</span> izle.</p>
                        <p>2. Koşulları değerlendir, doğru <span className="bg-emerald-300 text-black px-1.5 rounded font-black border-2 border-black/10 -rotate-1 inline-block text-xs">renge</span> tıkla!</p>
                        <p>3. <span className="text-rose-500 font-black">{INITIAL_LIVES} can, {TIME_LIMIT / 60} dakika, {MAX_LEVEL} seviye!</span></p>
                    </>
                ),
                tuzoCode: '5.2.1 Mantıksal Düşünce / Koşullu Çıkarım',
                icon: <Bug className="w-14 h-14 text-black" strokeWidth={3} />,
                iconBgColor: 'bg-purple-400',
                containerBgColor: 'bg-sky-200 dark:bg-slate-900'
            }}
            onStart={handleStart}
            onRestart={handleStart}
            showLevel={true}
            showLives={true}
            hudExtras={shellStatus === 'PLAYING' ? timerHudExtra : undefined}
        >
            {/* Game content — only visible during active phases */}
            {(phase === 'playing' || phase === 'animating' || phase === 'feedback') && round && (
                <div className="w-full max-w-3xl mx-auto pt-20 sm:pt-24 px-4 flex flex-col items-center">
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-4 rounded-full mb-6 border-2 border-black/10 dark:border-slate-800 overflow-hidden shadow-neo-sm transition-colors duration-300">
                        <motion.div className="h-full bg-emerald-400 border-r-4 border-black/10 dark:border-slate-800"
                            initial={{ width: 0 }} animate={{ width: `${(level / MAX_LEVEL) * 100}%` }} transition={{ duration: 0.5 }} />
                    </div>

                    {/* Instruction */}
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-yellow-100 dark:bg-slate-800 rounded-3xl p-5 sm:p-6 mb-6 border-2 border-black/10 dark:border-slate-700 shadow-neo-sm dark:shadow-[12px_12px_0_#0f172a] -rotate-1 relative w-full transition-colors duration-300"
                    >
                        <div className="absolute -top-4 -left-4 bg-indigo-400 px-3 py-1 rounded-xl border-2 border-black/10 dark:border-slate-800 shadow-neo-sm transform -rotate-12 flex items-center gap-1 transition-colors duration-300">
                            <span className="text-sm font-black uppercase text-black tracking-widest">Görev</span>
                        </div>
                        <p className="text-lg sm:text-2xl font-black leading-relaxed mt-2 text-black dark:text-white uppercase transition-colors duration-300">{round.instruction}</p>
                    </motion.div>

                    {/* Stage — Creatures */}
                    <div className="bg-sky-100 dark:bg-slate-800 rounded-3xl p-6 sm:p-8 mb-6 border-2 border-black/10 dark:border-slate-700 shadow-neo-sm dark:shadow-[12px_12px_0_#0f172a] rotate-1 relative w-full transition-colors duration-300">
                        <div className="flex justify-center items-end gap-8 sm:gap-16 min-h-[200px]">
                            {round.creatures.map((creature) => (
                                <AnimatedCreature
                                    key={creature.id}
                                    data={creature}
                                    isPlaying={phase === 'animating'}
                                    onAnimationEnd={handleAnimationEnd}
                                />
                            ))}
                        </div>

                        {/* Action Labels (shown after animation) */}
                        {phase === 'playing' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center gap-6 mt-6">
                                {round.creatures.map(c => (
                                    <div key={c.id} className="text-sm sm:text-base font-black text-black dark:text-white bg-white dark:bg-slate-700 px-4 py-2 rounded-xl border-2 border-black/10 dark:border-slate-800 shadow-neo-sm -rotate-2 transition-colors duration-300">
                                        {c.name.split(' ').pop()}: {actionLabels[c.action]}
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </div>

                    {/* Options */}
                    {phase === 'playing' && (
                        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-4">
                            {round.options.map(opt => (
                                <motion.button key={opt.id} whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}
                                    onClick={() => handleOptionSelect(opt.id)}
                                    disabled={isResolvingRef.current}
                                    className={`py-5 rounded-2xl bg-gradient-to-br ${opt.bgColor} font-black text-xl text-white border-2 border-black/10 dark:border-slate-800 shadow-neo-sm hover:shadow-neo-sm active:translate-y-1 active:shadow-none transition-all`}
                                >
                                    <span className="bg-white/30 px-3 py-1 rounded-lg">{opt.label}</span>
                                </motion.button>
                            ))}
                        </div>
                    )}

                    {phase === 'animating' && (
                        <div className="text-center">
                            <p className="text-black dark:text-white font-black text-lg bg-yellow-300 dark:bg-yellow-500 inline-block px-4 py-2 rounded-xl border-2 border-black/10 dark:border-slate-800 shadow-neo-sm animate-bounce -rotate-2 transition-colors duration-300">🎬 Animasyonu izle...</p>
                        </div>
                    )}

                    {phase === 'playing' && (
                        <div className="text-center mt-6">
                            <button onClick={handleReplay}
                                className="bg-purple-400 hover:bg-purple-300 px-6 py-3 rounded-2xl text-black dark:text-white font-black text-base border-2 border-black/10 dark:border-slate-800 shadow-neo-sm hover:-translate-y-1 active:translate-y-1 hover:shadow-neo-sm active:shadow-none transition-all inline-flex items-center gap-2">
                                <RotateCcw size={18} strokeWidth={3} /> Tekrar İzle
                            </button>
                        </div>
                    )}

                    {/* Feedback Banner */}
                    <ArcadeFeedbackBanner message={feedback?.message ?? null} type={feedback?.type} />
                </div>
            )}
        </ArcadeGameShell>
    );
};

export default SevimliMantik;
