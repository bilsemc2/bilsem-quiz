import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, RotateCcw, Trophy, Play, Timer,
    Star, Heart, Zap, CheckCircle2, XCircle, Hash, Plus, Sparkles, Eye
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useSound } from '../../hooks/useSound';
import { useGamePersistence } from '../../hooks/useGamePersistence';

// --- Types ---
type GameStatus = 'waiting' | 'playing' | 'gameover';

// Child-friendly messages
const SUCCESS_MESSAGES = [
    "Harika! ➕",
    "Süper! ⭐",
    "Doğru! 🎉",
    "Bravo! 🌟",
];

const FAILURE_MESSAGES = [
    "Dikkatli bak! 👀",
    "Tekrar dene! 💪",
];

const StreamSumGame: React.FC = () => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();
    const [status, setStatus] = useState<GameStatus>('waiting');
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [currentNumber, setCurrentNumber] = useState<number | null>(null);
    const [previousNumber, setPreviousNumber] = useState<number | null>(null);
    const [inputValue, setInputValue] = useState('');
    const [timeLeft, setTimeLeft] = useState(60);
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
    const [feedbackMsg, setFeedbackMsg] = useState('');
    const [streak, setStreak] = useState(0);
    const gameStartTimeRef = useRef<number>(0);
    const hasSavedRef = useRef<boolean>(false);

    // Config
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const flowSpeed = Math.max(800, 2000 - (level * 100)); // Speed increases with level

    // Back link
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    // --- Core Logic ---
    const nextNumber = useCallback(() => {
        const nextNum = Math.floor(Math.random() * 9) + 1;
        setPreviousNumber(currentNumber);
        setCurrentNumber(nextNum);
        setInputValue('');
        setFeedback(null);
    }, [currentNumber]);

    const startApp = useCallback(() => {
        setLevel(1);
        setScore(0);
        setLives(3);
        setStreak(0);
        setTimeLeft(60);
        setPreviousNumber(null);
        setCurrentNumber(null);
        setInputValue('');
        setFeedback(null);
        setStatus('playing');
        hasSavedRef.current = false;
        gameStartTimeRef.current = Date.now();

        // Initial delay before first numbers
        setTimeout(() => {
            const first = Math.floor(Math.random() * 9) + 1;
            setCurrentNumber(first);
        }, 500);
    }, []);

    // Handle Auto Start from HUB
    useEffect(() => {
        if (location.state?.autoStart && status === 'waiting') {
            startApp();
        }
    }, [location.state, status, startApp]);

    // Game Loop
    useEffect(() => {
        if (status === 'playing') {
            const timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        setStatus('gameover');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [status]);

    // Oyun bittiğinde verileri kaydet
    useEffect(() => {
        if (status === 'gameover' && gameStartTimeRef.current > 0 && !hasSavedRef.current) {
            hasSavedRef.current = true;
            const durationSeconds = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
            saveGamePlay({
                game_id: 'akiskan-toplam',
                score_achieved: score,
                duration_seconds: durationSeconds,
                lives_remaining: lives,
                metadata: {
                    level_reached: level,
                    streak: streak,
                    game_name: 'Akışkan Toplam',
                }
            });
        }
    }, [status, score, level, lives, streak, saveGamePlay]);

    // Stream Loop
    useEffect(() => {
        if (status === 'playing' && currentNumber !== null) {
            intervalRef.current = setInterval(() => {
                // If it's the first number, just move to next
                if (previousNumber === null) {
                    nextNumber();
                } else {
                    // Force miss if no input in time
                    if (feedback === null) {
                        playSound('incorrect');
                        setFeedback('wrong');
                        setFeedbackMsg(FAILURE_MESSAGES[Math.floor(Math.random() * FAILURE_MESSAGES.length)]);
                        setStreak(0);
                        setLives(l => {
                            if (l <= 1) {
                                setTimeout(() => setStatus('gameover'), 500);
                                return 0;
                            }
                            return l - 1;
                        });
                        setTimeout(nextNumber, 500);
                    } else {
                        nextNumber();
                    }
                }
            }, flowSpeed + 500); // Buffer for animation
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [status, currentNumber, previousNumber, flowSpeed, nextNumber, feedback, playSound]);

    // Input Handling
    const handleInput = (val: string) => {
        if (status !== 'playing' || feedback || previousNumber === null) return;

        const correctSum = previousNumber + (currentNumber || 0);
        const currentInput = inputValue + val;
        setInputValue(currentInput);

        if (parseInt(currentInput) === correctSum) {
            playSound('correct');
            setFeedback('correct');
            setFeedbackMsg(SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)]);
            setStreak(prev => prev + 1);
            setScore(prev => prev + (level * 50) + (streak * 10));

            // Level up every 5 correct
            if ((streak + 1) % 5 === 0) {
                setLevel(prev => prev + 1);
            }

            // Speed up to next number on success
            if (intervalRef.current) clearInterval(intervalRef.current);
            setTimeout(nextNumber, 400);
        } else if (currentInput.length >= correctSum.toString().length) {
            playSound('incorrect');
            setFeedback('wrong');
            setFeedbackMsg(FAILURE_MESSAGES[Math.floor(Math.random() * FAILURE_MESSAGES.length)]);
            setStreak(0);
            setLives(l => {
                if (l <= 1) {
                    setTimeout(() => setStatus('gameover'), 600);
                    return 0;
                }
                return l - 1;
            });

            if (intervalRef.current) clearInterval(intervalRef.current);
            setTimeout(nextNumber, 600);
        }
    };

    // Welcome Screen
    if (status === 'waiting') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-sky-950 to-cyan-950 text-white">
                {/* Decorative Background */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
                </div>

                <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center max-w-xl"
                    >
                        {/* 3D Gummy Icon */}
                        <motion.div
                            className="w-28 h-28 rounded-[40%] flex items-center justify-center mx-auto mb-6"
                            style={{
                                background: 'linear-gradient(135deg, #0EA5E9 0%, #0369A1 100%)',
                                boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)'
                            }}
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <Hash size={52} className="text-white drop-shadow-lg" />
                        </motion.div>

                        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">
                            ➕ Akışkan Toplam
                        </h1>

                        {/* Preview */}
                        <div
                            className="rounded-2xl p-5 mb-6"
                            style={{
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.2)',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}
                        >
                            <div className="flex items-center justify-center gap-2 text-2xl mb-2">
                                <span className="text-slate-400">Önceki:</span>
                                <span className="text-sky-400 font-bold">5</span>
                                <Plus className="text-slate-400" size={20} />
                                <span className="text-slate-400">Yeni:</span>
                                <span className="text-cyan-400 font-bold">3</span>
                                <span className="text-slate-400">=</span>
                                <span className="text-emerald-400 font-bold">8</span>
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                            <h3 className="text-lg font-bold text-sky-300 mb-3 flex items-center gap-2">
                                <Eye size={20} /> Nasıl Oynanır?
                            </h3>
                            <ul className="space-y-2 text-slate-300 text-sm">
                                <li className="flex items-center gap-2">
                                    <Sparkles size={14} className="text-sky-400" />
                                    <span>Sayılar <strong>birer birer</strong> akar</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Sparkles size={14} className="text-sky-400" />
                                    <span>Her yeni sayıyı <strong>önceki ile topla</strong></span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Sparkles size={14} className="text-sky-400" />
                                    <span>3 can, 60 saniye! Hızlı ol!</span>
                                </li>
                            </ul>
                        </div>

                        {/* TUZÖ Badge */}
                        <div className="bg-sky-500/10 text-sky-300 text-xs px-4 py-2 rounded-full mb-6 inline-block border border-sky-500/30">
                            TUZÖ 5.3.1 Çalışma Belleği
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.05, y: -4 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={startApp}
                            className="px-8 py-4 rounded-2xl font-bold text-lg"
                            style={{
                                background: 'linear-gradient(135deg, #0EA5E9 0%, #0369A1 100%)',
                                boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(14, 165, 233, 0.4)'
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <Play size={24} fill="currentColor" />
                                <span>Akışı Başlat</span>
                            </div>
                        </motion.button>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-sky-950 to-cyan-950 text-white">
            {/* Decorative Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <div className="relative z-10 p-4 pt-20">
                <div className="max-w-4xl mx-auto flex items-center justify-between flex-wrap gap-4">
                    <Link
                        to={backLink}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft size={20} />
                        <span>{backLabel}</span>
                    </Link>

                    <div className="flex items-center gap-4 flex-wrap">
                        {/* Score */}
                        <div
                            className="flex items-center gap-2 px-4 py-2 rounded-xl"
                            style={{
                                background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)',
                                boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                                border: '1px solid rgba(251, 191, 36, 0.3)'
                            }}
                        >
                            <Star className="text-amber-400 fill-amber-400" size={18} />
                            <span className="font-bold text-amber-400">{score}</span>
                        </div>

                        {/* Lives */}
                        <div
                            className="flex items-center gap-2 px-4 py-2 rounded-xl"
                            style={{
                                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)',
                                boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)'
                            }}
                        >
                            {[...Array(3)].map((_, i) => (
                                <Heart
                                    key={i}
                                    size={18}
                                    className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-900'}
                                />
                            ))}
                        </div>

                        {/* Timer */}
                        <div
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl ${timeLeft <= 10 ? 'animate-pulse' : ''}`}
                            style={{
                                background: timeLeft <= 10
                                    ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.2) 100%)'
                                    : 'linear-gradient(135deg, rgba(14, 165, 233, 0.2) 0%, rgba(3, 105, 161, 0.1) 100%)',
                                boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                                border: timeLeft <= 10 ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(14, 165, 233, 0.3)'
                            }}
                        >
                            <Timer className={timeLeft <= 10 ? 'text-red-400' : 'text-sky-400'} size={18} />
                            <span className={`font-bold font-mono ${timeLeft <= 10 ? 'text-red-400' : 'text-sky-400'}`}>
                                {timeLeft}s
                            </span>
                        </div>

                        {/* Streak */}
                        {streak > 0 && (
                            <div
                                className="flex items-center gap-2 px-4 py-2 rounded-xl"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.3) 0%, rgba(245, 158, 11, 0.2) 100%)',
                                    boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(251, 191, 36, 0.5)'
                                }}
                            >
                                <Zap className="text-amber-400" size={18} />
                                <span className="font-bold text-amber-400">x{streak}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-4">
                <AnimatePresence mode="wait">
                    {status === 'playing' && (
                        <motion.div
                            key="game"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full max-w-md space-y-8"
                        >
                            {/* Number Display */}
                            <div
                                className="relative rounded-3xl p-8 text-center overflow-hidden"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}
                            >
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentNumber}
                                        initial={{ y: 50, opacity: 0, scale: 0.5 }}
                                        animate={{ y: 0, opacity: 1, scale: 1 }}
                                        exit={{ y: -50, opacity: 0, scale: 1.5 }}
                                        className="text-8xl font-black text-white mb-4"
                                        style={{ textShadow: '0 0 30px rgba(14, 165, 233, 0.5)' }}
                                    >
                                        {currentNumber}
                                    </motion.div>
                                </AnimatePresence>

                                {previousNumber !== null && (
                                    <div className="flex items-center justify-center gap-2 text-slate-400">
                                        <span className="text-sky-400/60">Önceki: {previousNumber}</span>
                                        <Plus size={16} />
                                        <span>Yeni: {currentNumber}</span>
                                        <span>=</span>
                                        <span className="text-cyan-400 font-bold">{inputValue || '?'}</span>
                                    </div>
                                )}
                            </div>

                            {/* Numpad */}
                            <div className="grid grid-cols-3 gap-3">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((n) => (
                                    <motion.button
                                        key={n}
                                        whileHover={{ scale: 0.98 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleInput(n.toString())}
                                        className={`py-5 rounded-2xl text-2xl font-black transition-all ${n === 0 ? 'col-span-3' : ''}`}
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                                            boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            color: '#fff'
                                        }}
                                    >
                                        {n}
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Game Over */}
                    {status === 'gameover' && (
                        <motion.div
                            key="gameover"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center max-w-xl"
                        >
                            <motion.div
                                className="w-28 h-28 rounded-[40%] flex items-center justify-center mx-auto mb-6"
                                style={{
                                    background: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
                                    boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)'
                                }}
                                animate={{ rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <Trophy size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h2 className="text-3xl font-black text-sky-300 mb-2">
                                {score >= 500 ? '🎉 Harika!' : 'İyi İş!'}
                            </h2>
                            <p className="text-slate-400 mb-6">
                                Seviye {level}'e ulaştın!
                            </p>

                            <div
                                className="rounded-2xl p-6 mb-8"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Skor</p>
                                        <p className="text-2xl font-bold text-amber-400">{score}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Seviye</p>
                                        <p className="text-2xl font-bold text-sky-400">{level}</p>
                                    </div>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={startApp}
                                className="w-full px-6 py-4 rounded-2xl font-bold text-lg mb-4"
                                style={{
                                    background: 'linear-gradient(135deg, #0EA5E9 0%, #0369A1 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(14, 165, 233, 0.4)'
                                }}
                            >
                                <div className="flex items-center justify-center gap-3">
                                    <RotateCcw size={24} />
                                    <span>Tekrar Oyna</span>
                                </div>
                            </motion.button>

                            <Link
                                to={backLink}
                                className="block text-slate-500 hover:text-white transition-colors"
                            >
                                {location.state?.arcadeMode ? 'Bilsem Zeka' : 'Geri Dön'}
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Feedback Overlay */}
                <AnimatePresence>
                    {feedback && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                        >
                            <motion.div
                                initial={{ y: 50 }}
                                animate={{ y: 0 }}
                                className={`px-12 py-8 rounded-3xl text-center ${feedback === 'correct'
                                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                                    : 'bg-gradient-to-br from-orange-500 to-amber-600'
                                    }`}
                                style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}
                            >
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1], rotate: feedback === 'correct' ? [0, 10, -10, 0] : [0, -5, 5, 0] }}
                                    transition={{ duration: 0.5 }}
                                >
                                    {feedback === 'correct'
                                        ? <CheckCircle2 size={64} className="mx-auto mb-4 text-white" />
                                        : <XCircle size={64} className="mx-auto mb-4 text-white" />
                                    }
                                </motion.div>
                                <p className="text-3xl font-black text-white">{feedbackMsg}</p>
                                {feedback === 'wrong' && previousNumber !== null && currentNumber !== null && (
                                    <p className="text-white/80 mt-2">
                                        Doğrusu: <span className="font-bold">{previousNumber + currentNumber}</span>
                                    </p>
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default StreamSumGame;
