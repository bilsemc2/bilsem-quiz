import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer, Target,
    CheckCircle2, XCircle, ChevronLeft, Zap, Heart, Eye
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useExam } from '../../contexts/ExamContext';

// ── Platform Standards ──
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;
const BASE_DIGIT_LENGTH = 5;

type Phase = 'welcome' | 'playing' | 'feedback' | 'game_over' | 'victory';

// Visual confusion map (psikolojik test standartlarına uygun)
const CONFUSION_PAIRS: Record<string, string[]> = {
    '3': ['8', '5'],
    '8': ['3', '0'],
    '1': ['7'],
    '7': ['1'],
    '6': ['9', '0'],
    '9': ['6'],
    '5': ['2', '3'],
    '2': ['5'],
};

interface Challenge {
    left: string;
    right: string;
    isSame: boolean;
    type: 'same' | 'transposition' | 'similarity' | 'random';
}

const CORRECT_MESSAGES = [
    'Harikasın! 🎨',
    'Süpersin! ⭐',
    'Muhteşem! 🌟',
    'Bravo! 🎉',
    'Tam isabet! 🎯',
];

const WRONG_MESSAGES = [
    'Tekrar dene! 💪',
    'Düşün ve bul! 🧐',
    'Biraz daha dikkat! 🎯',
];

// ── Helper Functions ──
const generateRandomNumberString = (length: number): string => {
    let result = '';
    for (let i = 0; i < length; i++) {
        result += Math.floor(Math.random() * 10).toString();
    }
    return result;
};

const createChallenge = (digitLength: number): Challenge => {
    const base = generateRandomNumberString(digitLength);
    const isSame = Math.random() > 0.5;

    if (isSame) {
        return { left: base, right: base, isSame: true, type: 'same' };
    }

    const modified = base.split('');
    const roll = Math.random();
    let type: Challenge['type'] = 'random';

    if (roll < 0.45) {
        // Transpozisyon: yan yana rakamların yeri değişir
        const idx = Math.floor(Math.random() * (base.length - 1));
        [modified[idx], modified[idx + 1]] = [modified[idx + 1], modified[idx]];
        type = 'transposition';
    } else if (roll < 0.90) {
        // Görsel benzerlik: 3↔8, 1↔7 vb.
        const candidates = base
            .split('')
            .map((c, i) => ({ c, i }))
            .filter(item => CONFUSION_PAIRS[item.c]);

        if (candidates.length > 0) {
            const target = candidates[Math.floor(Math.random() * candidates.length)];
            const replacements = CONFUSION_PAIRS[target.c];
            modified[target.i] = replacements[Math.floor(Math.random() * replacements.length)];
            type = 'similarity';
        } else {
            const idx = Math.floor(Math.random() * base.length);
            modified[idx] = ((parseInt(modified[idx]) + 1) % 10).toString();
            type = 'random';
        }
    } else {
        // Rastgele tek rakam değişimi
        const idx = Math.floor(Math.random() * base.length);
        let newDigit = Math.floor(Math.random() * 10).toString();
        while (newDigit === modified[idx]) {
            newDigit = Math.floor(Math.random() * 10).toString();
        }
        modified[idx] = newDigit;
    }

    const right = modified.join('');
    if (base === right) {
        modified[0] = modified[0] === '1' ? '2' : '1';
    }

    return { left: base, right: modified.join(''), isSame: false, type };
};

// ── Component ──
interface PerceptualSpeedGameProps {
    examMode?: boolean;
    examLevel?: number;
    examTimeLimit?: number;
}

const PerceptualSpeedGame: React.FC<PerceptualSpeedGameProps> = ({ examMode = false }) => {
    const { saveGamePlay } = useGamePersistence();
    const hasSavedRef = useRef(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { submitResult } = useExam();

    // Core State
    const [phase, setPhase] = useState<Phase>('welcome');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [level, setLevel] = useState(1);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);

    // Game-specific
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [feedbackCorrect, setFeedbackCorrect] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [correctCount, setCorrectCount] = useState(0);
    const [totalAttempts, setTotalAttempts] = useState(0);

    // Refs
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);
    const challengeStartRef = useRef<number>(0);
    const reactionTimesRef = useRef<number[]>([]);

    // Seviye → rakam uzunluğu (5 → 9)
    const getDigitLength = useCallback((lvl: number) => {
        return Math.min(BASE_DIGIT_LENGTH + Math.floor((lvl - 1) / 4), 9);
    }, []);

    // Timer
    useEffect(() => {
        if (phase === 'playing' && timeLeft > 0) {
            timerRef.current = setTimeout(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && phase === 'playing') {
            handleGameOver();
        }
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [phase, timeLeft]);

    // Generate challenge
    const generateChallenge = useCallback(() => {
        const digitLen = getDigitLength(level);
        setChallenge(createChallenge(digitLen));
        challengeStartRef.current = performance.now();
    }, [level, getDigitLength]);

    // Level setup
    useEffect(() => {
        if (phase === 'playing') {
            generateChallenge();
        }
    }, [phase, level, generateChallenge]);

    // Start
    const handleStart = useCallback(() => {
        setPhase('playing');
        setScore(0);
        setLives(INITIAL_LIVES);
        setLevel(1);
        setTimeLeft(TIME_LIMIT);
        setCorrectCount(0);
        setTotalAttempts(0);
        reactionTimesRef.current = [];
        startTimeRef.current = Date.now();
        hasSavedRef.current = false;
    }, []);

    // Auto-start
    useEffect(() => {
        if ((location.state?.autoStart || examMode) && phase === 'welcome') {
            handleStart();
        }
    }, [location.state, examMode, phase, handleStart]);

    // Game Over
    const handleGameOver = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        setPhase('game_over');

        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const avgReaction = reactionTimesRef.current.length > 0
            ? Math.round(reactionTimesRef.current.reduce((a, b) => a + b, 0) / reactionTimesRef.current.length)
            : 0;

        if (examMode) {
            const passed = correctCount >= 10 && avgReaction < 2000;
            submitResult(passed, score, 1000, duration);
            setTimeout(() => navigate('/sinav-simulasyonu'), 1500);
            return;
        }

        await saveGamePlay({
            game_id: 'algisal-hiz',
            score_achieved: score,
            duration_seconds: duration,
            metadata: {
                levels_completed: level,
                final_lives: lives,
                correct_count: correctCount,
                total_attempts: totalAttempts,
                avg_reaction_ms: avgReaction,
            },
        });
    }, [saveGamePlay, score, level, lives, examMode, submitResult, navigate, correctCount, totalAttempts]);

    // Victory
    const handleVictory = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        setPhase('victory');

        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const avgReaction = reactionTimesRef.current.length > 0
            ? Math.round(reactionTimesRef.current.reduce((a, b) => a + b, 0) / reactionTimesRef.current.length)
            : 0;

        if (examMode) {
            submitResult(true, score, 1000, duration);
            setTimeout(() => navigate('/sinav-simulasyonu'), 1500);
            return;
        }

        await saveGamePlay({
            game_id: 'algisal-hiz',
            score_achieved: score,
            duration_seconds: duration,
            metadata: {
                levels_completed: MAX_LEVEL,
                victory: true,
                correct_count: correctCount,
                total_attempts: totalAttempts,
                avg_reaction_ms: avgReaction,
            },
        });
    }, [saveGamePlay, score, examMode, submitResult, navigate, correctCount, totalAttempts]);

    // Doğru yanlış kontrol — her seviyede 3 doğru yanıt gerekiyor
    const correctInLevelRef = useRef(0);

    const handleAnswer = useCallback((userSaysSame: boolean) => {
        if (!challenge || phase !== 'playing') return;

        const reaction = performance.now() - challengeStartRef.current;
        reactionTimesRef.current.push(reaction);

        const isCorrect = userSaysSame === challenge.isSame;
        setTotalAttempts(prev => prev + 1);

        const msg = isCorrect
            ? CORRECT_MESSAGES[Math.floor(Math.random() * CORRECT_MESSAGES.length)]
            : WRONG_MESSAGES[Math.floor(Math.random() * WRONG_MESSAGES.length)];

        setFeedbackCorrect(isCorrect);
        setFeedbackMessage(msg);
        setPhase('feedback');

        if (isCorrect) {
            setScore(prev => prev + 10 * level);
            setCorrectCount(prev => prev + 1);
            correctInLevelRef.current += 1;

            setTimeout(() => {
                if (correctInLevelRef.current >= 3) {
                    // Seviye atla
                    correctInLevelRef.current = 0;
                    if (level >= MAX_LEVEL) {
                        handleVictory();
                    } else {
                        setLevel(prev => prev + 1);
                        setPhase('playing');
                    }
                } else {
                    setPhase('playing');
                    generateChallenge();
                }
            }, 600);
        } else {
            const newLives = lives - 1;
            setLives(newLives);

            setTimeout(() => {
                if (newLives <= 0) {
                    handleGameOver();
                } else {
                    setPhase('playing');
                    generateChallenge();
                }
            }, 800);
        }
    }, [challenge, phase, level, lives, handleVictory, handleGameOver, generateChallenge]);

    // Keyboard
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (phase !== 'playing') return;
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') handleAnswer(true);
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') handleAnswer(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [phase, handleAnswer]);

    // Format time
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-950 to-slate-900 text-white">
            {/* Decorative Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
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

                    {phase === 'playing' && (
                        <div className="flex items-center gap-3 md:gap-6">
                            {/* Score */}
                            <div className="flex items-center gap-2 bg-amber-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-amber-500/30">
                                <Star className="text-amber-400" size={16} />
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
                                <Timer className="text-blue-400" size={16} />
                                <span className={`font-bold text-sm ${timeLeft <= 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'}`}>
                                    {formatTime(timeLeft)}
                                </span>
                            </div>

                            {/* Level */}
                            <div className="flex items-center gap-2 bg-emerald-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-emerald-500/30">
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
                    {/* ── Welcome ── */}
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
                                <span className="text-[9px] font-bold text-violet-400">5.6.1 İşleme Hızı</span>
                            </div>

                            <motion.div
                                className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-[40%] flex items-center justify-center"
                                style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }}
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            >
                                <Eye size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                                Algısal Hız Testi
                            </h1>

                            <p className="text-slate-400 mb-4">
                                İki sayı dizisini karşılaştır — aynı mı, farklı mı?
                                Görsel benzerlikler ve transpozisyonlara dikkat et!
                            </p>

                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 mb-6 text-left text-sm text-slate-400 border border-white/10">
                                <p className="text-slate-300 font-semibold mb-2">Nasıl Oynanır?</p>
                                <ul className="space-y-1 list-disc list-inside">
                                    <li>Ekrandaki iki sayı dizisini hızlıca karşılaştır</li>
                                    <li>Diziler <span className="text-cyan-400 font-semibold">birebir aynı</span> ise AYNI, farklıysa FARKLI tuşuna bas</li>
                                    <li>Hatalar: 3↔8, 1↔7 ve yan yana rakam yer değiştirmeleri</li>
                                    <li className="text-slate-500">Klavye: ← Sol Ok (Aynı) / Sağ Ok → (Farklı)</li>
                                </ul>
                            </div>

                            <div className="flex flex-wrap justify-center gap-4 mb-8">
                                <div className="bg-white/10 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2 border border-white/20">
                                    <Heart className="text-red-400" size={16} />
                                    <span className="text-sm text-slate-300">{INITIAL_LIVES} Can</span>
                                </div>
                                <div className="bg-white/10 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2 border border-white/20">
                                    <Timer className="text-blue-400" size={16} />
                                    <span className="text-sm text-slate-300">{TIME_LIMIT / 60} Dakika</span>
                                </div>
                                <div className="bg-white/10 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2 border border-white/20">
                                    <Target className="text-emerald-400" size={16} />
                                    <span className="text-sm text-slate-300">{MAX_LEVEL} Seviye</span>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleStart}
                                className="px-10 py-5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl font-bold text-xl"
                                style={{ boxShadow: '0 8px 32px rgba(6, 182, 212, 0.4)' }}
                            >
                                <div className="flex items-center gap-3">
                                    <Play size={28} className="fill-white" />
                                    <span>Başla</span>
                                </div>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* ── Playing ── */}
                    {phase === 'playing' && challenge && (
                        <motion.div
                            key="playing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full max-w-2xl"
                        >
                            {/* Seviye bilgisi */}
                            <div className="text-center mb-4">
                                <p className="text-sm text-slate-400">
                                    {getDigitLength(level)} haneli — {correctInLevelRef.current}/3 doğru
                                </p>
                            </div>

                            {/* Karşılaştırma Kartları */}
                            <div
                                className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 md:p-10 border border-white/20 mb-8"
                                style={{
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.1), 0 0 30px rgba(6, 182, 212, 0.15)',
                                }}
                            >
                                <div className="flex flex-col items-center gap-6 py-4">
                                    {/* Row 1 */}
                                    <div className="flex items-center gap-4">
                                        <span className="text-slate-500 font-mono text-lg select-none w-8 text-right">1.</span>
                                        <div className="font-mono text-3xl md:text-5xl lg:text-6xl tracking-[0.25em] font-bold text-white drop-shadow-md tabular-nums select-none">
                                            {challenge.left}
                                        </div>
                                    </div>

                                    <div className="w-full h-px bg-white/10" />

                                    {/* Row 2 */}
                                    <div className="flex items-center gap-4">
                                        <span className="text-slate-500 font-mono text-lg select-none w-8 text-right">2.</span>
                                        <div className="font-mono text-3xl md:text-5xl lg:text-6xl tracking-[0.25em] font-bold text-white drop-shadow-md tabular-nums select-none">
                                            {challenge.right}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Butonlar */}
                            <div className="grid grid-cols-2 gap-4 md:gap-6">
                                <motion.button
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleAnswer(true)}
                                    className="flex flex-col items-center justify-center min-h-[80px] p-5 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 backdrop-blur-xl rounded-2xl border border-emerald-500/30"
                                    style={{ boxShadow: 'inset 0 -3px 6px rgba(0,0,0,0.2), inset 0 3px 6px rgba(255,255,255,0.1)' }}
                                >
                                    <CheckCircle2 className="text-emerald-400 mb-2" size={28} />
                                    <span className="text-lg font-bold text-emerald-300">AYNI</span>
                                    <span className="text-[10px] text-slate-500 mt-1">← Sol Ok</span>
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleAnswer(false)}
                                    className="flex flex-col items-center justify-center min-h-[80px] p-5 bg-gradient-to-br from-rose-500/20 to-rose-600/10 backdrop-blur-xl rounded-2xl border border-rose-500/30"
                                    style={{ boxShadow: 'inset 0 -3px 6px rgba(0,0,0,0.2), inset 0 3px 6px rgba(255,255,255,0.1)' }}
                                >
                                    <XCircle className="text-rose-400 mb-2" size={28} />
                                    <span className="text-lg font-bold text-rose-300">FARKLI</span>
                                    <span className="text-[10px] text-slate-500 mt-1">Sağ Ok →</span>
                                </motion.button>
                            </div>
                        </motion.div>
                    )}

                    {/* ── Feedback ── */}
                    {phase === 'feedback' && (
                        <motion.div
                            key="feedback"
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
                                    animate={{
                                        scale: [1, 1.2, 1],
                                        rotate: feedbackCorrect ? [0, 10, -10, 0] : [0, -5, 5, 0],
                                    }}
                                    transition={{ duration: 0.5 }}
                                >
                                    {feedbackCorrect ? (
                                        <CheckCircle2 size={64} className="mx-auto mb-4 text-white" />
                                    ) : (
                                        <XCircle size={64} className="mx-auto mb-4 text-white" />
                                    )}
                                </motion.div>
                                <p className="text-3xl font-black text-white">{feedbackMessage}</p>
                            </motion.div>
                        </motion.div>
                    )}

                    {/* ── Game Over ── */}
                    {phase === 'game_over' && (
                        <motion.div
                            key="game_over"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center max-w-xl"
                        >
                            <div
                                className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-red-500 to-rose-600 rounded-[40%] flex items-center justify-center"
                                style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3)' }}
                            >
                                <XCircle size={48} className="text-white" />
                            </div>

                            <h2 className="text-3xl font-bold text-red-400 mb-4">Oyun Bitti!</h2>

                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/20">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Skor</p>
                                        <p className="text-2xl font-bold text-amber-400">{score}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Seviye</p>
                                        <p className="text-2xl font-bold text-emerald-400">{level}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Doğruluk</p>
                                        <p className="text-2xl font-bold text-cyan-400">
                                            {totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0}%
                                        </p>
                                    </div>
                                </div>
                                {reactionTimesRef.current.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-white/10 text-center">
                                        <p className="text-slate-400 text-sm">Ort. Tepki Süresi</p>
                                        <p className="text-xl font-bold text-purple-400">
                                            {(reactionTimesRef.current.reduce((a, b) => a + b, 0) / reactionTimesRef.current.length / 1000).toFixed(2)}s
                                        </p>
                                    </div>
                                )}
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

                    {/* ── Victory ── */}
                    {phase === 'victory' && (
                        <motion.div
                            key="victory"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center max-w-xl"
                        >
                            <motion.div
                                className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-[40%] flex items-center justify-center"
                                style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3)' }}
                                animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                <Trophy size={48} className="text-white" />
                            </motion.div>

                            <h2 className="text-3xl font-bold text-amber-400 mb-4">🎉 Şampiyon!</h2>

                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/20">
                                <p className="text-4xl font-bold text-amber-400">{score}</p>
                                <p className="text-slate-400">Toplam Puan</p>
                                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/10">
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Doğruluk</p>
                                        <p className="text-xl font-bold text-cyan-400">
                                            {totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0}%
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Ort. Tepki</p>
                                        <p className="text-xl font-bold text-purple-400">
                                            {reactionTimesRef.current.length > 0
                                                ? (reactionTimesRef.current.reduce((a, b) => a + b, 0) / reactionTimesRef.current.length / 1000).toFixed(2)
                                                : '0'}s
                                        </p>
                                    </div>
                                </div>
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
            </div>
        </div>
    );
};

export default PerceptualSpeedGame;
