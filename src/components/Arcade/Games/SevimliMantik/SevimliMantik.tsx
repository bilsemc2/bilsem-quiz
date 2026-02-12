import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer, Target,
    CheckCircle2, XCircle, ChevronLeft, Zap, Heart, Bug
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useGamePersistence } from '../../../../hooks/useGamePersistence';

// ─── Constants ──────────────────────────────────────
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;

const CORRECT_MESSAGES = ["Harikasın! 🎉", "Süpersin! ⭐", "Muhteşem! 🌟", "Bravo! 🎯"];
const WRONG_MESSAGES = ["Tekrar dene! 💪", "Düşün ve bul! 🧐", "Dikkatli bak! 🎯"];

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

const ACTIONS: { key: CreatureAction; text: string; past: string; negPast: string }[] = [
    { key: 'jump', text: 'zıplarsa', past: 'zıpladı', negPast: 'zıplamadı' },
    { key: 'spin', text: 'dönerse', past: 'döndü', negPast: 'dönmedi' },
    { key: 'move_right', text: 'sağa giderse', past: 'sağa gitti', negPast: 'sağa gitmedi' },
    { key: 'move_left', text: 'sola giderse', past: 'sola gitti', negPast: 'sola gitmedi' },
    { key: 'shake', text: 'sallanırsa', past: 'sallandı', negPast: 'sallanmadı' },
    { key: 'grow', text: 'büyürse', past: 'büyüdü', negPast: 'büyümedi' },
    { key: 'idle', text: 'hareket etmezse', past: 'hareket etmedi', negPast: 'hareket etti' },
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
        // Simple IF/ELSE
        instruction = `Eğer ${subjectCreature.name} ${conditionAction.text}, ${option1.label} rengine tıkla. Aksi takdirde ${option2.label} rengine tıkla.`;
        const isMatch = subjectCreature.action === conditionAction.key;
        correctOptionId = isMatch ? option1.id : option2.id;
    } else {
        // Complex AND/OR
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

const AnimatedCreature: React.FC<{ data: CreatureData; isPlaying: boolean; onAnimationEnd?: () => void }> = ({ data, isPlaying, onAnimationEnd }) => {
    const controls = useAnimation();

    useEffect(() => {
        const run = async () => {
            if (isPlaying) {
                switch (data.action) {
                    case 'jump': await controls.start({ y: [0, -60, 0, -30, 0], scale: [1, 1.1, 0.9, 1.05, 1], transition: { duration: 0.8 } }); break;
                    case 'spin': await controls.start({ rotate: 360, scale: [1, 1.2, 1], transition: { duration: 0.8 } }); break;
                    case 'shake': await controls.start({ x: [-10, 10, -10, 10, -5, 5, 0], transition: { duration: 0.6 } }); break;
                    case 'move_right': await controls.start({ x: 80, rotate: [0, 10, -10, 0], transition: { duration: 1 } }); break;
                    case 'move_left': await controls.start({ x: -80, rotate: [0, -10, 10, 0], transition: { duration: 1 } }); break;
                    case 'grow': await controls.start({ scale: [1, 1.5, 1.5, 1], transition: { duration: 1.2 } }); break;
                    case 'idle': default: await controls.start({ scale: [1, 1.05, 1], transition: { duration: 1.5, repeat: Infinity } }); break;
                }
                if (onAnimationEnd) onAnimationEnd();
            } else {
                controls.set({ x: 0, y: 0, rotate: 0, scale: 1 });
            }
        };
        run();
    }, [isPlaying, data.action, onAnimationEnd, controls]);

    const bg = CREATURE_BG[data.color] || 'from-gray-300 to-gray-400 border-gray-500';

    return (
        <div className="flex flex-col items-center justify-end">
            <div className="w-20 h-3 bg-black/10 rounded-full blur-sm mb-1" />
            <motion.div animate={controls}
                className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-[2rem] bg-gradient-to-br ${bg} border-b-4 border-r-2 flex items-center justify-center overflow-hidden`}
                style={{ boxShadow: 'inset 0 -6px 12px rgba(0,0,0,0.15), inset 0 6px 12px rgba(255,255,255,0.25), 0 6px 20px rgba(0,0,0,0.2)' }}>
                <img src={data.imageUrl} alt={data.name} className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-md z-10" />
                <div className="absolute top-2 left-2 w-6 h-6 bg-white/30 rounded-full blur-[2px]" />
            </motion.div>
            <div className="mt-2 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-slate-300 border border-white/10 whitespace-nowrap">
                {data.name}
            </div>
        </div>
    );
};

// ─── Types ──────────────────────────────────────────
type Phase = 'welcome' | 'animating' | 'playing' | 'feedback' | 'game_over' | 'victory';

// ─── Component ──────────────────────────────────────
const SevimliMantik: React.FC = () => {
    const { saveGamePlay } = useGamePersistence();
    const hasSavedRef = useRef(false);
    const location = useLocation();
    const isArcadeMode = location.state?.arcadeMode === true;

    const [phase, setPhase] = useState<Phase>('welcome');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [level, setLevel] = useState(1);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const [round, setRound] = useState<RoundData | null>(null);
    const [feedbackCorrect, setFeedbackCorrect] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState('');

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);

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
        startTimeRef.current = Date.now();
        hasSavedRef.current = false;
    }, []);

    // Auto-start for arcade mode
    useEffect(() => {
        if ((location.state?.autoStart || isArcadeMode) && phase === 'welcome') handleStart();
    }, [location.state, isArcadeMode, phase, handleStart]);

    // Animation end handler
    const handleAnimationEnd = useCallback(() => {
        if (phase === 'animating') setPhase('playing');
    }, [phase]);

    // Replay animation
    const handleReplay = useCallback(() => {
        if (phase === 'playing') setPhase('animating');
    }, [phase]);

    // Game Over
    const handleGameOver = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        setPhase('game_over');
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        await saveGamePlay({ game_id: 'arcade-sevimli-mantik', score_achieved: score, duration_seconds: duration, metadata: { levels_completed: level, final_lives: lives } });
    }, [saveGamePlay, score, level, lives]);

    // Victory
    const handleVictory = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        setPhase('victory');
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        await saveGamePlay({ game_id: 'arcade-sevimli-mantik', score_achieved: score, duration_seconds: duration, metadata: { levels_completed: MAX_LEVEL, victory: true } });
    }, [saveGamePlay, score]);

    // Select option
    const handleOptionSelect = useCallback((optionId: string) => {
        if (!round || phase !== 'playing') return;
        const correct = optionId === round.correctOptionId;
        setFeedbackCorrect(correct);
        setFeedbackMessage(correct
            ? CORRECT_MESSAGES[Math.floor(Math.random() * CORRECT_MESSAGES.length)]
            : WRONG_MESSAGES[Math.floor(Math.random() * WRONG_MESSAGES.length)]
        );
        setPhase('feedback');

        const newScore = correct ? score + 10 * level : score;
        const newLives = correct ? lives : lives - 1;
        if (correct) setScore(newScore);
        else setLives(newLives);

        setTimeout(() => {
            if (!correct && newLives <= 0) { handleGameOver(); return; }
            if (correct && level >= MAX_LEVEL) { handleVictory(); return; }
            if (correct) setLevel(l => l + 1);
            else { setRound(generateRound(level)); setPhase('animating'); }
            if (correct) setPhase('animating');
        }, 2000);
    }, [round, phase, score, lives, level, handleGameOver, handleVictory]);

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    const backLink = isArcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";

    // Action label in Turkish
    const actionLabels: Record<CreatureAction, string> = {
        jump: '⬆️ Zıpladı', spin: '🔄 Döndü', move_right: '➡️ Sağa gitti',
        move_left: '⬅️ Sola gitti', shake: '↔️ Sallandı', idle: '🧘 Durdu', grow: '📏 Büyüdü',
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 text-white">
            {/* Decorative */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <div className="relative z-10 p-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Link to={backLink} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                        <ChevronLeft size={20} /><span>Geri</span>
                    </Link>
                    {(phase === 'playing' || phase === 'animating' || phase === 'feedback') && (
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
                                <span className={`font-bold text-sm ${timeLeft <= 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'}`}>{formatTime(timeLeft)}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-indigo-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-indigo-500/30">
                                <Zap className="text-indigo-400" size={18} />
                                <span className="font-bold text-indigo-400 text-sm">Seviye {level}</span>
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
                            <div className="mb-6 inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full">
                                <span className="text-[9px] font-black text-indigo-300 uppercase tracking-wider">TUZÖ</span>
                                <span className="text-[9px] font-bold text-indigo-400">5.5.2 Koşullu Çıkarım</span>
                            </div>

                            <motion.div className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-[40%] flex items-center justify-center"
                                style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }}
                                animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
                                <Bug size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Sevimli Mantık</h1>
                            <p className="text-slate-400 mb-6">Robotların hareketlerini izle, koşulları değerlendir ve <span className="font-bold text-white">doğru renge</span> tıkla!</p>

                            <div className="flex flex-wrap justify-center gap-4 mb-8">
                                <div className="bg-slate-800/50 px-4 py-2 rounded-xl flex items-center gap-2"><Heart className="text-red-400" size={16} /><span className="text-sm text-slate-300">{INITIAL_LIVES} Can</span></div>
                                <div className="bg-slate-800/50 px-4 py-2 rounded-xl flex items-center gap-2"><Timer className="text-blue-400" size={16} /><span className="text-sm text-slate-300">{TIME_LIMIT / 60} Dakika</span></div>
                                <div className="bg-slate-800/50 px-4 py-2 rounded-xl flex items-center gap-2"><Target className="text-indigo-400" size={16} /><span className="text-sm text-slate-300">{MAX_LEVEL} Seviye</span></div>
                            </div>

                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart}
                                className="px-10 py-5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl font-bold text-xl"
                                style={{ boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)' }}>
                                <div className="flex items-center gap-3"><Play size={28} className="fill-white" /><span>Başla</span></div>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* ── Playing / Animating ── */}
                    {(phase === 'playing' || phase === 'animating' || phase === 'feedback') && round && (
                        <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-3xl">
                            {/* Progress */}
                            <div className="w-full bg-white/10 h-3 rounded-full mb-6 overflow-hidden">
                                <motion.div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                                    initial={{ width: 0 }} animate={{ width: `${(level / MAX_LEVEL) * 100}%` }} transition={{ duration: 0.5 }} />
                            </div>

                            {/* Instruction */}
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                                className="bg-gradient-to-r from-indigo-600/80 to-purple-600/80 backdrop-blur-xl rounded-2xl p-5 sm:p-6 mb-6 border border-indigo-400/20"
                                style={{ boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3)' }}>
                                <div className="flex items-center gap-2 mb-2 opacity-80">
                                    <Zap size={14} /><p className="text-xs font-bold uppercase tracking-wider">Görev</p>
                                </div>
                                <p className="text-lg sm:text-xl font-medium leading-relaxed">{round.instruction}</p>
                            </motion.div>

                            {/* Stage */}
                            <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 sm:p-8 mb-6 border border-white/10"
                                style={{ boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.1), 0 8px 24px rgba(0,0,0,0.2)' }}>
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
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center gap-6 mt-4">
                                        {round.creatures.map(c => (
                                            <div key={c.id} className="text-xs font-bold text-slate-400 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                                                {c.name.split(' ').pop()}: {actionLabels[c.action]}
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </div>

                            {/* Options / Replay */}
                            {phase === 'playing' && (
                                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-4">
                                    {round.options.map(opt => (
                                        <motion.button key={opt.id} whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}
                                            onClick={() => handleOptionSelect(opt.id)}
                                            className={`py-5 rounded-2xl bg-gradient-to-r ${opt.bgColor} font-bold text-xl text-white`}
                                            style={{ boxShadow: '0 6px 20px rgba(0,0,0,0.3)' }}>
                                            {opt.label}
                                        </motion.button>
                                    ))}
                                </div>
                            )}

                            {phase === 'animating' && (
                                <div className="text-center">
                                    <p className="text-slate-400 font-bold text-sm animate-pulse">🎬 Animasyonu izle...</p>
                                </div>
                            )}

                            {phase === 'playing' && (
                                <div className="text-center mt-2">
                                    <button onClick={handleReplay}
                                        className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full text-slate-400 font-bold text-sm transition-all inline-flex items-center gap-2">
                                        <RotateCcw size={14} /> Tekrar İzle
                                    </button>
                                </div>
                            )}
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
                                    <div className="text-center"><p className="text-slate-400 text-sm">Seviye</p><p className="text-2xl font-bold text-indigo-400">{level}</p></div>
                                </div>
                            </div>
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleStart}
                                className="px-10 py-5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl font-bold text-xl" style={{ boxShadow: '0 8px 32px rgba(99,102,241,0.4)' }}>
                                <div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Dene</span></div>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* ── Victory ── */}
                    {phase === 'victory' && (
                        <motion.div key="victory" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
                            <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-[40%] flex items-center justify-center"
                                style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3)' }}
                                animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                                <Trophy size={48} className="text-white" />
                            </motion.div>
                            <h2 className="text-3xl font-bold text-amber-400 mb-4">🎉 Şampiyon!</h2>
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10">
                                <p className="text-4xl font-bold text-amber-400">{score}</p>
                                <p className="text-slate-400">Toplam Puan</p>
                            </div>
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleStart}
                                className="px-10 py-5 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-2xl font-bold text-xl" style={{ boxShadow: '0 8px 32px rgba(245,158,11,0.4)' }}>
                                <div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Oyna</span></div>
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Feedback Overlay ── */}
                <AnimatePresence>
                    {phase === 'feedback' && (
                        <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none">
                            <motion.div initial={{ y: 50 }} animate={{ y: 0 }}
                                className={`px-12 py-8 rounded-3xl text-center ${feedbackCorrect ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-orange-500 to-amber-600'}`}
                                style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}>
                                <motion.div animate={{ scale: [1, 1.2, 1], rotate: feedbackCorrect ? [0, 10, -10, 0] : [0, -5, 5, 0] }} transition={{ duration: 0.5 }}>
                                    {feedbackCorrect ? <CheckCircle2 size={64} className="mx-auto mb-4 text-white" /> : <XCircle size={64} className="mx-auto mb-4 text-white" />}
                                </motion.div>
                                <p className="text-3xl font-black text-white">{feedbackMessage}</p>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default SevimliMantik;
