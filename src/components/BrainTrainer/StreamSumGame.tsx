// StreamSumGame (Optimize Edilmiş ve Sadeleştirilmiş)
// Amaç: Aynı davranışı koruyup okunabilirlik, performans ve bakım kolaylığı sağlamak

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    RotateCcw, Trophy, CheckCircle2, XCircle, Plus, ChevronRight, Star, Zap, Timer, Heart
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSound } from '../../hooks/useSound';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useExam } from '../../contexts/ExamContext';

/* ------------------------------------------------------------------ */
/* Types & Constants */
/* ------------------------------------------------------------------ */
type GameStatus = 'waiting' | 'playing' | 'gameover';



const MAX_LIVES = 3;
const BASE_TIME = 60;

/* ------------------------------------------------------------------ */
/* Helper Functions */
/* ------------------------------------------------------------------ */
const randomDigit = () => Math.floor(Math.random() * 9) + 1;

/* ------------------------------------------------------------------ */
/* Component */
/* ------------------------------------------------------------------ */
const StreamSumGame: React.FC = () => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const { submitResult } = useExam();
    const { feedbackState, showFeedback } = useGameFeedback();

    const location = useLocation();
    const navigate = useNavigate();

    /* -------------------- Game State -------------------- */
    const [status, setStatus] = useState<GameStatus>('waiting');
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(MAX_LIVES);
    const [current, setCurrent] = useState<number | null>(null);
    const [previous, setPrevious] = useState<number | null>(null);
    const [input, setInput] = useState('');
    const [timeLeft, setTimeLeft] = useState(BASE_TIME);
    const [streak, setStreak] = useState(0);

    /* -------------------- Refs -------------------- */
    const gameStartRef = useRef<number>(0);
    const savedRef = useRef(false);
    const streamIntervalRef = useRef<NodeJS.Timeout | null>(null);

    /* -------------------- Modes -------------------- */
    const examMode = location.state?.examMode ?? false;
    const examTimeLimit = location.state?.examTimeLimit ?? BASE_TIME;
    const arcadeMode = location.state?.arcadeMode ?? false;

    const backLink = arcadeMode ? '/bilsem-zeka' : '/atolyeler/bireysel-degerlendirme';
    const backLabel = arcadeMode ? 'Bilsem Zeka' : 'Geri';

    /* -------------------- Derived Values -------------------- */
    const flowSpeed = useMemo(() => Math.max(800, 2000 - level * 100), [level]);

    /* ------------------------------------------------------------------ */
    /* Core Logic */
    /* ------------------------------------------------------------------ */
    const nextNumber = useCallback(() => {
        // Use functional update to get the latest 'current' value for 'previous'
        setCurrent(prevCurrent => {
            setPrevious(prevCurrent);
            return randomDigit();
        });
        setInput('');
    }, []);

    const startGame = useCallback(() => {
        setStatus('playing');
        setLevel(1);
        setScore(0);
        setLives(MAX_LIVES);
        setStreak(0);
        setTimeLeft(examMode ? examTimeLimit : BASE_TIME);
        setPrevious(null);
        setCurrent(null);
        setInput('');

        savedRef.current = false;
        gameStartRef.current = Date.now();

        setTimeout(() => setCurrent(randomDigit()), 500);
    }, [examMode, examTimeLimit]);

    /* ------------------------------------------------------------------ */
    /* Closing Rule: Clear feedbackState on gameover */
    /* ------------------------------------------------------------------ */
    useEffect(() => {
        if (status === 'gameover') {
        }
    }, [status]);

    /* ------------------------------------------------------------------ */
    /* Auto Start */
    /* ------------------------------------------------------------------ */
    useEffect(() => {
        if ((location.state?.autoStart || examMode) && status === 'waiting') {
            startGame();
        }
    }, [location.state, examMode, status, startGame]);

    /* ------------------------------------------------------------------ */
    /* Timer */
    /* ------------------------------------------------------------------ */
    useEffect(() => {
        if (status !== 'playing') return;

        const timer = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) {
                    setStatus('gameover');
                    return 0;
                }
                return t - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [status]);

    /* ------------------------------------------------------------------ */
    /* Stream Loop */
    /* ------------------------------------------------------------------ */
    useEffect(() => {
        if (status !== 'playing' || current === null) return;

        streamIntervalRef.current = setInterval(() => {
            if (previous === null) {
                nextNumber();
                return;
            }

            if (feedbackState === null) {
                playSound('incorrect');
                showFeedback(false);
                setStreak(0);

                setLives(l => {
                    if (l <= 1) {
                        if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
                        // Clear feedbackState BEFORE gameover to prevent overlay sticking
                        setTimeout(() => {
                            setStatus('gameover');
                        }, 1200);
                        return 0;
                    }
                    setTimeout(nextNumber, 500);
                    return l - 1;
                });
            } else {
                nextNumber();
            }
        }, flowSpeed + 400);

        return () => {
            if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
        };
    }, [status, current, previous, feedbackState, flowSpeed, nextNumber, playSound]);

    /* ------------------------------------------------------------------ */
    /* Input Handling */
    /* ------------------------------------------------------------------ */
    const handleInput = (digit: string) => {
        if (status !== 'playing' || feedbackState || previous === null) return;

        const expected = previous + (current ?? 0);
        const nextInput = input + digit;
        setInput(nextInput);

        if (Number(nextInput) === expected) {
            playSound('correct');
            showFeedback(true);
            setStreak(s => s + 1);
            setScore(s => s + level * 50 + streak * 10);

            if ((streak + 1) % 5 === 0) setLevel(l => l + 1);

            if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
            setTimeout(nextNumber, 400);
            return;
        }

        if (nextInput.length >= expected.toString().length) {
            playSound('incorrect');
            showFeedback(false);
            setStreak(0);

            if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);

            setLives(l => {
                if (l <= 1) {
                    // Clear feedbackState BEFORE gameover to prevent overlay sticking
                    setTimeout(() => {
                        setStatus('gameover');
                    }, 1200);
                    return 0;
                }
                setTimeout(nextNumber, 600);
                return l - 1;
            });
        }
    };

    /* ------------------------------------------------------------------ */
    /* Persist Result */
    /* ------------------------------------------------------------------ */
    useEffect(() => {
        if (status !== 'gameover' || savedRef.current || !gameStartRef.current) return;

        savedRef.current = true;
        const duration = Math.floor((Date.now() - gameStartRef.current) / 1000);

        if (examMode) {
            submitResult(score > 50, score, 300, duration).then(() => {
            navigate("/atolyeler/sinav-simulasyonu/devam"); });
            return;
        }

        saveGamePlay({
            game_id: 'akiskan-toplam',
            score_achieved: score,
            duration_seconds: duration,
            lives_remaining: lives,
            metadata: {
                level_reached: level,
                streak,
                game_name: 'Akışkan Toplam'
            }
        });
    }, [status, score, lives, level, streak, examMode, submitResult, navigate, saveGamePlay]);

    /* ------------------------------------------------------------------ */
    /* UI Components */
    /* ------------------------------------------------------------------ */

    if (status === 'waiting') {
        return (
            <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(14,165,233,0.1),transparent_50%)]" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative z-10 text-center max-w-md w-full"
                >
                    <div className="w-24 h-24 bg-sky-500/20 rounded-3xl border border-sky-500/50 flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(14,165,233,0.3)]">
                        <Plus size={48} className="text-sky-400" />
                    </div>

                    <h1 className="text-4xl font-black mb-4 tracking-tight">Akışkan Toplam</h1>
                    <p className="text-slate-400 mb-8 leading-relaxed">
                        Sayılar akarken her yeni sayıyı bir öncekiyle topla. Rekor kırmak için ne kadar hızlısın?
                    </p>

                    <div className="bg-white/5 rounded-2xl p-6 mb-8 border border-white/10 text-left">
                        <h3 className="font-bold text-sky-400 mb-2 flex items-center gap-2">
                            Nasıl Oynanır?
                        </h3>
                        <ul className="text-sm text-slate-400 space-y-2">
                            <li className="flex gap-2"><span>1.</span> İlk sayıyı aklında tut.</li>
                            <li className="flex gap-2"><span>2.</span> Gelen her yeni sayıyı öncekiyle topla.</li>
                            <li className="flex gap-2"><span>3.</span> Toplamı klavyeden gir.</li>
                        </ul>
                    </div>

                    <button
                        onClick={startGame}
                        className="w-full py-4 bg-sky-600 hover:bg-sky-500 text-white font-black rounded-2xl transition-all shadow-[0_8px_30px_rgba(14,165,233,0.3)] flex items-center justify-center gap-2"
                    >
                        OYUNA BAŞLA <ChevronRight size={20} />
                    </button>

                    <Link to={backLink} className="block mt-6 text-sm text-slate-500 hover:text-white transition-colors">
                        Vazgeç ve Geri Dön
                    </Link>
                </motion.div>
            </div>
        );
    }

    if (status === 'gameover') {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center max-w-sm w-full"
                >
                    <div className="w-20 h-20 bg-amber-500/20 rounded-3xl border border-amber-500/50 flex items-center justify-center mx-auto mb-6">
                        <Trophy size={40} className="text-amber-400" />
                    </div>

                    <h2 className="text-3xl font-black mb-2">Oyun Bitti!</h2>
                    <p className="text-slate-400 mb-8 text-lg">Seviye {level} tamamsın!</p>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Skor</div>
                            <div className="text-2xl font-black text-sky-400">{score}</div>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Seri</div>
                            <div className="text-2xl font-black text-emerald-400">{streak}</div>
                        </div>
                    </div>

                    <button
                        onClick={startGame}
                        className="w-full py-4 bg-white text-slate-950 font-black rounded-2xl hover:bg-slate-200 transition-all mb-4 flex items-center justify-center gap-2"
                    >
                        <RotateCcw size={20} /> TEKRAR DENE
                    </button>

                    <Link to={backLink} className="block py-4 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/5 transition-all">
                        {backLabel}
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white relative flex flex-col items-center p-4">
            {/* Header Stats */}
            <div className="w-full max-w-md flex justify-between items-center py-6 relative z-10">
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 text-sm font-bold">
                        <Star size={14} className="text-amber-400" /> {score}
                    </div>
                    {streak > 1 && (
                        <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 text-sm font-bold text-emerald-400">
                            <Zap size={14} /> {streak}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 bg-sky-500/10 px-4 py-2 rounded-full border border-sky-500/20 text-lg font-black font-mono text-sky-400">
                    <Timer size={18} /> {timeLeft}s
                </div>

                <div className="flex gap-1.5">
                    {[...Array(MAX_LIVES)].map((_, i) => (
                        <Heart
                            key={i}
                            size={16}
                            fill={i < lives ? "currentColor" : "none"}
                            className={i < lives ? "text-red-500" : "text-slate-800"}
                        />
                    ))}
                </div>
            </div>

            {/* Game Canvas */}
            <div className="flex-1 w-full max-w-md flex flex-col justify-center gap-12 relative z-10">
                <div className="text-center">
                    <div className="text-xs text-slate-500 font-black uppercase tracking-[0.2em] mb-4">Sıradaki Sayı</div>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={current}
                            initial={{ y: 20, opacity: 0, scale: 0.8 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: -20, opacity: 0, scale: 1.2 }}
                            transition={{ type: "spring", damping: 15 }}
                            className="text-[12rem] leading-none font-black text-white"
                        >
                            {current}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Input Area */}
                <div className="space-y-6">
                    <div className="flex items-center justify-center gap-3">
                        {previous !== null && (
                            <div className="flex items-center gap-3 text-slate-500 text-xl font-bold">
                                <span>{previous}</span>
                                <Plus size={20} />
                                <span>{current}</span>
                                <span>=</span>
                                <motion.div
                                    className="w-20 h-20 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center text-4xl text-white font-black"
                                    animate={feedbackState ? { scale: [1, 1.1, 1] } : {}}
                                >
                                    {input || '?'}
                                </motion.div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(n => (
                            <motion.button
                                key={n}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleInput(String(n))}
                                className={`h-20 rounded-[2rem] text-3xl font-black transition-all ${n === 0
                                    ? 'col-span-3 bg-white/10 text-white'
                                    : 'bg-white/5 text-white border border-white/5 hover:bg-white/10'
                                    }`}
                            >
                                {n}
                            </motion.button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Feedback Mask - Security Rule: Only show when playing */}
            <AnimatePresence>
                {status === 'playing' && feedbackState && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-slate-950/80 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.8, y: 30 }}
                            animate={{ scale: 1, y: 0 }}
                            className={`p-10 rounded-[3rem] text-center shadow-2xl ${feedbackState?.correct === true
                                ? 'bg-emerald-500 text-white'
                                : 'bg-orange-500 text-white'
                                }`}
                        >
                            <div className="flex justify-center mb-4">
                                {feedbackState?.correct === true ? <CheckCircle2 size={72} /> : <XCircle size={72} />}
                            </div>
                            <h2 className="text-4xl font-black mb-2">{feedbackState?.message}</h2>
                            {feedbackState?.correct === false && previous !== null && (
                                <p className="text-xl font-bold opacity-80">
                                    Doğrusu: {previous + (current ?? 0)}
                                </p>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StreamSumGame;
