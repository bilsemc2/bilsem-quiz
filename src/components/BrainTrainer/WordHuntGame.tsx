import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer, Target,
    CheckCircle2, XCircle, ChevronLeft, Zap, Heart, Search,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useExam } from '../../contexts/ExamContext';

// ──────────── Constants ────────────
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;

type Phase = 'welcome' | 'playing' | 'exposure' | 'feedback' | 'game_over' | 'victory';

interface WordHuntGameProps {
    examMode?: boolean;
}

// ──────────── Turkish Alphabet Data ────────────
const ALPHABET = [...'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ'];
const VOWELS = [...'AEIİOÖUÜ'];
const CONSONANTS = [...'BCÇDFGĞHJKLMNPRSŞTVYZ'];
const BIGRAMS = [
    'AR', 'ER', 'AN', 'AL', 'LA', 'RA', 'TE', 'SE', 'İN', 'IN',
    'DE', 'DA', 'EN', 'EL', 'MA', 'ME', 'TA', 'SA', 'YA', 'YE',
    'UR', 'UN', 'US', 'UT', 'AK', 'EK', 'IL', 'İL', 'OL',
];

const TRAP_MAP: Record<string, string[]> = {
    A: ['E'], E: ['A'], I: ['İ'], 'İ': ['I'],
    O: ['Ö'], 'Ö': ['O'], U: ['Ü'], 'Ü': ['U'],
    S: ['Ş'], 'Ş': ['S'], C: ['Ç'], 'Ç': ['C'],
    G: ['Ğ'], 'Ğ': ['G'],
};

// ──────────── Cell Colors (Gummy Style) ────────────
const CARD_COLORS = [
    'from-violet-500 to-purple-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-teal-500 to-emerald-600',
    'from-indigo-500 to-blue-600',
    'from-fuchsia-500 to-pink-600',
    'from-cyan-500 to-teal-600',
    'from-lime-500 to-green-600',
];

// ──────────── Feedback Messages ────────────
const CORRECT_MESSAGES = [
    'Keskin bakış! 🔍',
    'Süpersin! ⭐',
    'Mükemmel algı! 🎯',
    'Harikasın! 🌟',
    'Tam isabet! 💫',
];

const WRONG_MESSAGES = [
    'Daha dikkatli bak! 👀',
    'Harflere odaklan! 🧐',
    'Tekrar dene! 💪',
];

const randomMsg = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// ──────────── Level Configuration ────────────
interface LevelConfig {
    wordLength: number;
    itemCount: number;
    roundDuration: number; // seconds for selection
    flashDuration: number; // seconds for flash exposure
    useBigram: boolean;
}

const getLevelConfig = (level: number): LevelConfig => {
    if (level <= 5) {
        return {
            wordLength: 5,
            itemCount: 8,
            roundDuration: 4.5 - (level - 1) * 0.1,
            flashDuration: 0.6,
            useBigram: false,
        };
    } else if (level <= 10) {
        return {
            wordLength: 6,
            itemCount: 9,
            roundDuration: 3.8 - (level - 6) * 0.1,
            flashDuration: 0.55,
            useBigram: level >= 8,
        };
    } else if (level <= 15) {
        return {
            wordLength: 7,
            itemCount: 10,
            roundDuration: 3.2 - (level - 11) * 0.1,
            flashDuration: 0.5,
            useBigram: true,
        };
    } else {
        return {
            wordLength: 8,
            itemCount: 12,
            roundDuration: 2.6 - (level - 16) * 0.05,
            flashDuration: 0.4,
            useBigram: true,
        };
    }
};

// ──────────── Word Generation Utilities ────────────
const makePseudoWord = (length: number): string => {
    let word = '';
    let useVowel = Math.random() > 0.45;
    for (let i = 0; i < length; i++) {
        word += useVowel ? pick(VOWELS) : pick(CONSONANTS);
        useVowel = !useVowel;
        if (Math.random() < 0.18) useVowel = !useVowel;
    }
    return word;
};

const insertTarget = (word: string, target: string): string => {
    if (word.length < target.length) return target;
    const start = Math.floor(Math.random() * (word.length - target.length + 1));
    return word.slice(0, start) + target + word.slice(start + target.length);
};

const replacementForTarget = (target: string): string => {
    if (target.length === 1) {
        return pick(ALPHABET.filter(l => l !== target));
    }
    let replacement = target;
    while (replacement === target) {
        replacement = `${pick(ALPHABET)}${pick(ALPHABET)}`;
    }
    return replacement;
};

const applyTrap = (word: string, target: string): string => {
    const candidates = target
        .split('')
        .map(char => TRAP_MAP[char])
        .filter(Boolean)
        .flat();
    if (candidates.length === 0) return word;
    const idx = Math.floor(Math.random() * word.length);
    const replaced = word.slice(0, idx) + pick(candidates) + word.slice(idx + 1);
    return replaced.includes(target) ? word : replaced;
};

const makeNonTarget = (length: number, target: string): string => {
    let word = '';
    let guard = 0;
    do {
        word = makePseudoWord(length);
        guard++;
    } while (word.includes(target) && guard < 20);

    if (word.includes(target)) {
        const idx = word.indexOf(target);
        const replacement = replacementForTarget(target);
        word = word.slice(0, idx) + replacement + word.slice(idx + target.length);
    }

    if (Math.random() < 0.6) {
        const trapped = applyTrap(word, target);
        return trapped.includes(target) ? word : trapped;
    }
    return word;
};

const shuffle = <T,>(arr: T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

interface WordItem {
    id: string;
    text: string;
    hasTarget: boolean;
}

const generateItems = (target: string, length: number, count: number): WordItem[] => {
    const targetCountBase = Math.round(count * 0.5);
    const variance = Math.floor(Math.random() * 3) - 1;
    const targetCount = Math.min(count - 2, Math.max(2, targetCountBase + variance));

    const items: WordItem[] = [];
    for (let i = 0; i < count; i++) {
        const hasTarget = i < targetCount;
        const base = makePseudoWord(length);
        const text = hasTarget ? insertTarget(base, target) : makeNonTarget(length, target);
        items.push({ id: `${i}-${text}-${Math.random()}`, text, hasTarget });
    }
    return shuffle(items);
};

// ══════════════════════════════════════════════════
// WordHuntGame Component
// ══════════════════════════════════════════════════

const WordHuntGame: React.FC<WordHuntGameProps> = ({ examMode = false }) => {
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();
    const navigate = useNavigate();
    const { submitResult } = useExam();
    const hasSavedRef = useRef(false);

    // Core State
    const [phase, setPhase] = useState<Phase>('welcome');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [level, setLevel] = useState(1);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);

    // Game-Specific State
    const [target, setTarget] = useState('—');
    const [items, setItems] = useState<WordItem[]>([]);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [roundTimeLeft, setRoundTimeLeft] = useState(0);
    const [isExposure, setIsExposure] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedbackCorrect, setFeedbackCorrect] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [roundResults, setRoundResults] = useState<{
        correct: number; missed: number; falsePositives: number; accuracy: number;
    } | null>(null);

    // Refs
    const globalTimerRef = useRef<NodeJS.Timeout | null>(null);
    const roundTimerRef = useRef<number>(0);
    const startTimeRef = useRef(0);
    const exposureTimerRef = useRef<NodeJS.Timeout | null>(null);
    const currentConfigRef = useRef<LevelConfig>(getLevelConfig(1));

    // ──────────── Global Timer ────────────
    useEffect(() => {
        if (phase === 'playing' || phase === 'exposure') {
            if (timeLeft > 0) {
                globalTimerRef.current = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
            } else {
                handleGameOver();
            }
        }
        return () => { if (globalTimerRef.current) clearTimeout(globalTimerRef.current); };
    }, [phase, timeLeft]);

    // ──────────── Round Timer (RAF-based) ────────────
    useEffect(() => {
        if (phase !== 'playing') return;

        const start = performance.now();
        const duration = currentConfigRef.current.roundDuration;

        const tick = (now: number) => {
            const elapsed = (now - start) / 1000;
            const remaining = Math.max(0, duration - elapsed);
            setRoundTimeLeft(remaining);
            if (remaining <= 0) {
                finishRound();
                return;
            }
            roundTimerRef.current = requestAnimationFrame(tick);
        };

        roundTimerRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(roundTimerRef.current);
    }, [phase, level, items]);

    // ──────────── Start Level ────────────
    const startLevel = useCallback((lvl: number) => {
        const config = getLevelConfig(lvl);
        currentConfigRef.current = config;

        const nextTarget = config.useBigram ? pick(BIGRAMS) : pick(ALPHABET);
        const roundItems = generateItems(nextTarget, config.wordLength, config.itemCount);

        setTarget(nextTarget);
        setItems(roundItems);
        setSelected(new Set());
        setRoundTimeLeft(config.roundDuration);
        setRoundResults(null);

        // Flash exposure phase
        setIsExposure(true);
        setPhase('exposure');

        if (exposureTimerRef.current) clearTimeout(exposureTimerRef.current);
        exposureTimerRef.current = setTimeout(() => {
            setIsExposure(false);
            setPhase('playing');
        }, config.flashDuration * 1000);
    }, []);

    // ──────────── Start Game ────────────
    const handleStart = useCallback(() => {
        setScore(0);
        setLives(INITIAL_LIVES);
        setLevel(1);
        setTimeLeft(TIME_LIMIT);
        setShowFeedback(false);
        startTimeRef.current = Date.now();
        hasSavedRef.current = false;
        startLevel(1);
    }, [startLevel]);

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
        cancelAnimationFrame(roundTimerRef.current);

        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

        if (examMode) {
            const passed = level >= 5;
            submitResult(passed, score, 1000, duration);
            setTimeout(() => navigate('/sinav-simulasyonu'), 1500);
            return;
        }

        await saveGamePlay({
            game_id: 'kelime-avi',
            score_achieved: score,
            duration_seconds: duration,
            metadata: { levels_completed: level, final_lives: lives },
        });
    }, [saveGamePlay, score, level, lives, examMode, submitResult, navigate]);

    // ──────────── Victory ────────────
    const handleVictory = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        setPhase('victory');
        cancelAnimationFrame(roundTimerRef.current);

        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

        if (examMode) {
            submitResult(true, score, 1000, duration);
            setTimeout(() => navigate('/sinav-simulasyonu'), 1500);
            return;
        }

        await saveGamePlay({
            game_id: 'kelime-avi',
            score_achieved: score,
            duration_seconds: duration,
            metadata: { levels_completed: MAX_LEVEL, victory: true },
        });
    }, [saveGamePlay, score, examMode, submitResult, navigate]);

    // ──────────── Toggle Selection ────────────
    const toggleSelect = (id: string) => {
        if (phase !== 'playing') return;
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // ──────────── Finish Round ────────────
    const finishRound = useCallback(() => {
        cancelAnimationFrame(roundTimerRef.current);

        setSelected(prev => {
            const selectedSet = prev;
            const totalTargets = items.filter(item => item.hasTarget).length;
            const correct = items.filter(item => item.hasTarget && selectedSet.has(item.id)).length;
            const missed = Math.max(0, totalTargets - correct);
            const falsePositives = Math.max(0, selectedSet.size - correct);
            const accuracy = totalTargets ? correct / totalTargets : 0;

            setRoundResults({ correct, missed, falsePositives, accuracy });

            if (accuracy >= 0.5) {
                // Good round
                setFeedbackCorrect(true);
                setFeedbackMessage(randomMsg(CORRECT_MESSAGES));
                setScore(s => s + 10 * level);
                setShowFeedback(true);

                setTimeout(() => {
                    setShowFeedback(false);
                    if (level >= MAX_LEVEL) {
                        handleVictory();
                    } else {
                        const nextLevel = level + 1;
                        setLevel(nextLevel);
                        startLevel(nextLevel);
                    }
                }, 1500);
            } else {
                // Poor round
                setFeedbackCorrect(false);
                setFeedbackMessage(randomMsg(WRONG_MESSAGES));
                const newLives = lives - 1;
                setLives(newLives);
                setShowFeedback(true);

                setTimeout(() => {
                    setShowFeedback(false);
                    if (newLives <= 0) {
                        handleGameOver();
                    } else {
                        // Retry same level
                        startLevel(level);
                    }
                }, 1500);
            }

            return prev;
        });
    }, [items, level, lives, handleVictory, handleGameOver, startLevel]);

    // ──────────── Format Time ────────────
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // ──────────── Round Progress ────────────
    const roundProgress = useMemo(() => {
        const duration = currentConfigRef.current.roundDuration;
        if (!duration) return 0;
        return Math.max(0, Math.min(100, (roundTimeLeft / duration) * 100));
    }, [roundTimeLeft]);

    // ══════════════════════════════════════════════════
    // RENDER
    // ══════════════════════════════════════════════════

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950 to-slate-900 text-white">
            {/* Decorative Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
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

                    {(phase === 'playing' || phase === 'exposure') && (
                        <div className="flex items-center gap-3 sm:gap-5 flex-wrap justify-end">
                            <div className="flex items-center gap-2 bg-amber-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-amber-500/30">
                                <Star className="text-amber-400" size={16} />
                                <span className="font-bold text-amber-400 text-sm">{score}</span>
                            </div>
                            <div className="flex items-center gap-1 bg-red-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-red-500/30">
                                {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
                                    <Heart key={i} size={14} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-400/30'} />
                                ))}
                            </div>
                            <div className="flex items-center gap-2 bg-blue-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-blue-500/30">
                                <Timer className="text-blue-400" size={16} />
                                <span className={`font-bold text-sm ${timeLeft <= 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'}`}>
                                    {formatTime(timeLeft)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 bg-emerald-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-emerald-500/30">
                                <Zap className="text-emerald-400" size={16} />
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
                                <span className="text-[9px] font-bold text-violet-400">5.6.1 Algısal İşlem Hızı</span>
                            </div>

                            <motion.div
                                className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center"
                                style={{
                                    borderRadius: '40%',
                                    boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)',
                                }}
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            >
                                <Search size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                                Kelime Avı
                            </h1>

                            <p className="text-slate-400 mb-8 leading-relaxed">
                                Hedef harfi içeren kelimeleri bul!
                                Hızlı algılama ve ortografik farkındalığını test et.
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
                                className="px-10 py-5 bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl font-bold text-xl"
                                style={{ boxShadow: '0 8px 32px rgba(139, 92, 246, 0.4)' }}
                            >
                                <div className="flex items-center gap-3">
                                    <Play size={28} className="fill-white" />
                                    <span>Başla</span>
                                </div>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* ──── Playing / Exposure Phase ──── */}
                    {(phase === 'playing' || phase === 'exposure') && (
                        <motion.div
                            key="playing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full max-w-2xl flex flex-col items-center"
                        >
                            {/* Target Card */}
                            <div className="mb-4 flex items-center gap-4">
                                <div className="bg-gradient-to-br from-violet-500 to-purple-600 px-6 py-3 rounded-2xl text-center"
                                    style={{ boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.25), 0 4px 16px rgba(139, 92, 246, 0.4)' }}
                                >
                                    <p className="text-[10px] uppercase tracking-widest text-violet-200 mb-0.5">Hedef</p>
                                    <p className="text-4xl font-black text-white tracking-wider">{target}</p>
                                </div>

                                {/* Round Timer Bar */}
                                <div className="flex-1 max-w-[200px]">
                                    <div className="h-3 bg-slate-800/60 rounded-full overflow-hidden border border-white/10">
                                        <motion.div
                                            className={`h-full rounded-full ${roundProgress > 30 ? 'bg-gradient-to-r from-violet-400 to-purple-500' : 'bg-gradient-to-r from-red-400 to-orange-500'}`}
                                            style={{ width: `${roundProgress}%` }}
                                            transition={{ duration: 0.1 }}
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-1 text-center">
                                        {roundTimeLeft.toFixed(1)}s
                                    </p>
                                </div>
                            </div>

                            {/* Word Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 w-full p-4 bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-white/10"
                                style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
                            >
                                {items.map((item, index) => {
                                    const isSelected = selected.has(item.id);
                                    const colorIdx = index % CARD_COLORS.length;

                                    return (
                                        <motion.button
                                            key={item.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.04 }}
                                            whileTap={phase === 'playing' ? { scale: 0.95 } : undefined}
                                            onClick={() => toggleSelect(item.id)}
                                            disabled={phase !== 'playing'}
                                            className={`relative py-4 px-3 rounded-xl font-mono text-lg sm:text-xl font-bold tracking-widest text-center transition-all duration-200 select-none
                                                ${isExposure
                                                    ? `bg-gradient-to-br ${CARD_COLORS[colorIdx]} text-white`
                                                    : isSelected
                                                        ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white ring-2 ring-white/60 scale-105'
                                                        : 'bg-slate-700/50 text-slate-200 hover:bg-slate-600/50'
                                                }
                                            `}
                                            style={{
                                                boxShadow: isSelected
                                                    ? 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 0 20px rgba(139, 92, 246, 0.5)'
                                                    : isExposure
                                                        ? 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.25)'
                                                        : 'inset 0 -3px 6px rgba(0,0,0,0.15)',
                                            }}
                                        >
                                            {item.text}
                                            {isSelected && !isExposure && (
                                                <div className="absolute top-1.5 right-1.5 w-3 h-3 bg-white rounded-full" />
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </div>

                            {/* Hint */}
                            <p className="text-xs text-slate-500 mt-3 text-center">
                                {isExposure
                                    ? '👀 Kelimeleri incele...'
                                    : `🔍 "${target}" içeren kelimeleri seç!`
                                }
                            </p>
                        </motion.div>
                    )}

                    {/* ──── Game Over ──── */}
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

                    {/* ──── Victory ──── */}
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
                <AnimatePresence>
                    {showFeedback && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                        >
                            <motion.div
                                initial={{ y: 50 }}
                                animate={{ y: 0 }}
                                className={`px-12 py-8 rounded-3xl text-center ${feedbackCorrect
                                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                                    : 'bg-gradient-to-br from-orange-500 to-amber-600'
                                    }`}
                                style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}
                            >
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1], rotate: feedbackCorrect ? [0, 10, -10, 0] : [0, -5, 5, 0] }}
                                    transition={{ duration: 0.5 }}
                                >
                                    {feedbackCorrect
                                        ? <CheckCircle2 size={64} className="mx-auto mb-4 text-white" />
                                        : <XCircle size={64} className="mx-auto mb-4 text-white" />
                                    }
                                </motion.div>
                                <p className="text-3xl font-black text-white">{feedbackMessage}</p>
                                {roundResults && (
                                    <div className="mt-3 flex items-center justify-center gap-4 text-white/80 text-sm">
                                        <span>✅ {roundResults.correct}</span>
                                        <span>❌ {roundResults.missed}</span>
                                        <span>🎯 {Math.round(roundResults.accuracy * 100)}%</span>
                                    </div>
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default WordHuntGame;
