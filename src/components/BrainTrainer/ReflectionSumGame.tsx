import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, RotateCcw, Trophy, Play, Timer,
    Star, Heart, Zap, CheckCircle2, Calculator, FlipHorizontal, Sparkles, Eye
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSound } from '../../hooks/useSound';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useExam } from '../../contexts/ExamContext';

// --- Tipler ---
type GameStatus = 'waiting' | 'display' | 'input_sequence' | 'input_sum' | 'result' | 'gameover';

// Child-friendly messages


const ReflectionSumGame: React.FC = () => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();
    const navigate = useNavigate();
    const { submitResult } = useExam();
    const { feedbackState, showFeedback } = useGameFeedback();

    // Exam Mode Props
    const examMode = location.state?.examMode || false;
    const [status, setStatus] = useState<GameStatus>('waiting');
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [digits, setDigits] = useState<number[]>([]);
    const [userSequence, setUserSequence] = useState<number[]>([]);
    const [userSum, setUserSum] = useState<string>('');
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [timeLeft, setTimeLeft] = useState(30);
    const [isMirrored, setIsMirrored] = useState(false);
    const [streak, setStreak] = useState(0);
    const gameStartTimeRef = useRef<number>(0);
    const hasSavedRef = useRef<boolean>(false);

    // Back link
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    // --- Oyun Mantığı ---
    const generateSequence = useCallback((lvl: number) => {
        const length = Math.min(10, 4 + Math.floor(lvl / 2));
        const newDigits = Array.from({ length }, () => Math.floor(Math.random() * 9) + 1);
        setDigits(newDigits);
        setUserSequence([]);
        setUserSum('');
        setCurrentIndex(-1);
        setIsMirrored(lvl > 2 && Math.random() < 0.4);
        setStatus('display');
    }, []);

    const startLevel = useCallback((lvl: number) => {
        generateSequence(lvl);
    }, [generateSequence]);

    const startApp = useCallback(() => {
        window.scrollTo(0, 0);
        setLevel(1);
        setScore(0);
        setLives(3);
        setStreak(0);
        setTimeLeft(30);
        hasSavedRef.current = false;
        gameStartTimeRef.current = Date.now();
        startLevel(1);
    }, [startLevel]);

    // Handle Auto Start from HUB or Exam Mode
    useEffect(() => {
        if ((location.state?.autoStart || examMode) && status === 'waiting') {
            startApp();
        }
    }, [location.state, status, startApp, examMode]);

    // Görünüm Fazı
    useEffect(() => {
        if (status === 'display') {
            if (currentIndex < digits.length - 1) {
                const timer = setTimeout(() => {
                    setCurrentIndex(prev => prev + 1);
                }, 1200);
                return () => clearTimeout(timer);
            } else {
                const timer = setTimeout(() => {
                    setCurrentIndex(-1);
                    setStatus('input_sequence');
                }, 1500);
                return () => clearTimeout(timer);
            }
        }
    }, [status, currentIndex, digits]);

    // Zamanlayıcı
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if ((status === 'input_sequence' || status === 'input_sum') && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0 && (status === 'input_sequence' || status === 'input_sum')) {
            setStatus('gameover');
        }
        return () => clearInterval(interval);
    }, [status, timeLeft]);

    // Oyun bittiğinde verileri kaydet
    useEffect(() => {
        if (status === 'gameover' && gameStartTimeRef.current > 0 && !hasSavedRef.current) {
            hasSavedRef.current = true;
            const durationSeconds = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);

            // Exam mode: submit result and navigate
            if (examMode) {
                const passed = level >= 3;
                await submitResult(passed, score, 1000, durationSeconds).then(() => {
                    navigate('/atolyeler/sinav-simulasyonu/devam');
                });
                return;
            }

            saveGamePlay({
                game_id: 'yansima-toplami',
                score_achieved: score,
                duration_seconds: durationSeconds,
                lives_remaining: lives,
                metadata: {
                    level_reached: level,
                    streak: streak,
                    game_name: 'Yansıma Toplamı',
                }
            });
        }
    }, [status, score, level, lives, streak, saveGamePlay, examMode, submitResult, navigate]);

    const handleDigitClick = (digit: number) => {
        if (status !== 'input_sequence' || feedbackState) return;

        const newSequence = [...userSequence, digit];
        setUserSequence(newSequence);

        // Geriye doğru kontrol (backward check)
        const reversedDigits = [...digits].reverse();
        if (digit !== reversedDigits[newSequence.length - 1]) {
            playSound('incorrect');
            showFeedback(false);
            setStreak(0);
            setLives(l => {
                if (l <= 1) {
                    setTimeout(() => { setStatus('gameover'); }, 1500);
                    return 0;
                }
                return l - 1;
            });
            setTimeout(() => {
                if (lives > 1) {
                    startLevel(level); // Yeni soru üret, aynı soruda bırakma
                }
            }, 1500);
            return;
        }

        if (newSequence.length === digits.length) {
            setTimeout(() => {
                setStatus('input_sum');
            }, 500);
        }
    };

    const handleSumSubmit = () => {
        if (feedbackState) return;
        const total = digits.reduce((a, b) => a + b, 0);
        if (parseInt(userSum) === total) {
            playSound('correct');
            showFeedback(true);
            setStreak(prev => prev + 1);
            setScore(prev => prev + (level * 300) + (timeLeft * 15) + (streak * 20));
            setTimeout(() => {
                setLevel(prev => prev + 1);
                setTimeLeft(30);
                startLevel(level + 1);
            }, 2000);
        } else {
            playSound('incorrect');
            showFeedback(false);
            setStreak(0);
            setLives(l => {
                if (l <= 1) {
                    setTimeout(() => { setStatus('gameover'); }, 1500);
                    return 0;
                }
                return l - 1;
            });
            setTimeout(() => {
                if (lives > 1) {
                    startLevel(level); // Yeni soru üret, aynı soruda bırakma
                }
            }, 1500);
        }
    };

    // Welcome Screen
    if (status === 'waiting') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-violet-950 text-white">
                {/* Decorative Background */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
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
                                background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
                                boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)'
                            }}
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <FlipHorizontal size={52} className="text-white drop-shadow-lg" />
                        </motion.div>

                        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">
                            🔄 Yansıma Toplamı
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
                                <span className="text-purple-400 font-bold">3 → 7 → 2</span>
                            </div>
                            <p className="text-slate-400 text-sm">
                                Tersine: <span className="text-violet-400 font-bold">2 → 7 → 3</span> | Toplam: <span className="text-emerald-400 font-bold">12</span>
                            </p>
                        </div>

                        {/* Instructions */}
                        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                            <h3 className="text-lg font-bold text-purple-300 mb-3 flex items-center gap-2">
                                <Eye size={20} /> Nasıl Oynanır?
                            </h3>
                            <ul className="space-y-2 text-slate-300 text-sm">
                                <li className="flex items-center gap-2">
                                    <Sparkles size={14} className="text-purple-400" />
                                    <span>Sayı dizisini <strong>izle</strong></span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Sparkles size={14} className="text-purple-400" />
                                    <span>Diziyi <strong>tersine</strong> gir</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Sparkles size={14} className="text-purple-400" />
                                    <span>Sonra <strong>toplamını</strong> hesapla!</span>
                                </li>
                            </ul>
                        </div>

                        {/* TUZÖ Badge */}
                        <div className="bg-purple-500/10 text-purple-300 text-xs px-4 py-2 rounded-full mb-6 inline-block border border-purple-500/30">
                            TUZÖ 5.4.1 Çalışma Belleği Güncelleme
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.05, y: -4 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={startApp}
                            className="px-8 py-4 rounded-2xl font-bold text-lg"
                            style={{
                                background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
                                boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(168, 85, 247, 0.4)'
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <Play size={24} fill="currentColor" />
                                <span>Teste Başla</span>
                            </div>
                        </motion.button>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-violet-950 text-white">
            {/* Decorative Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
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
                        {(status === 'input_sequence' || status === 'input_sum') && (
                            <div
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl ${timeLeft <= 10 ? 'animate-pulse' : ''}`}
                                style={{
                                    background: timeLeft <= 10
                                        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.2) 100%)'
                                        : 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(124, 58, 237, 0.1) 100%)',
                                    boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                                    border: timeLeft <= 10 ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(168, 85, 247, 0.3)'
                                }}
                            >
                                <Timer className={timeLeft <= 10 ? 'text-red-400' : 'text-purple-400'} size={18} />
                                <span className={`font-bold font-mono ${timeLeft <= 10 ? 'text-red-400' : 'text-purple-400'}`}>
                                    {timeLeft}s
                                </span>
                            </div>
                        )}

                        {/* Level */}
                        <div
                            className="flex items-center gap-2 px-4 py-2 rounded-xl"
                            style={{
                                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(124, 58, 237, 0.1) 100%)',
                                boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                                border: '1px solid rgba(168, 85, 247, 0.3)'
                            }}
                        >
                            <FlipHorizontal className="text-purple-400" size={18} />
                            <span className="font-bold text-purple-400">Seviye {level}</span>
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
                    {/* Display Phase */}
                    {status === 'display' && (
                        <motion.div
                            key="display"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center gap-8"
                        >
                            <div className="relative w-48 h-48 flex items-center justify-center">
                                <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full animate-spin-slow" />
                                <AnimatePresence mode="wait">
                                    {currentIndex >= 0 && (
                                        <motion.div
                                            key={currentIndex}
                                            initial={{ scale: 0.5, opacity: 0, rotateY: isMirrored ? 180 : 0 }}
                                            animate={{ scale: 1.5, opacity: 1, rotateY: isMirrored ? 180 : 0 }}
                                            exit={{ scale: 2, opacity: 0 }}
                                            className="text-8xl font-black text-white"
                                            style={{ textShadow: '0 0 30px rgba(168, 85, 247, 0.5)' }}
                                        >
                                            {digits[currentIndex]}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            <div className="flex gap-2">
                                {digits.map((_, i) => (
                                    <div key={i} className={`w-3 h-3 rounded-full border-2 border-purple-500/50 ${i <= currentIndex ? 'bg-purple-500 shadow-[0_0_10px_purple]' : ''}`} />
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Input Sequence Phase */}
                    {status === 'input_sequence' && (
                        <motion.div
                            key="sequence"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="w-full max-w-xl space-y-8"
                        >
                            <div className="text-center">
                                <p className="text-slate-400 text-sm mb-4">Diziyi <span className="text-purple-400 font-bold">tersine</span> girin:</p>
                                <div className="flex justify-center gap-2 min-h-[60px] flex-wrap">
                                    <AnimatePresence>
                                        {userSequence.map((d, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ scale: 0.5, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                className="w-12 h-14 bg-purple-500/20 border-2 border-purple-500/50 rounded-xl flex items-center justify-center text-2xl font-black text-white"
                                            >
                                                {d}
                                            </motion.div>
                                        ))}
                                        {Array.from({ length: digits.length - userSequence.length }).map((_, i) => (
                                            <div key={i + 100} className="w-12 h-14 border-2 border-dashed border-purple-500/20 rounded-xl flex items-center justify-center text-purple-500/20 text-2xl font-black">?</div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>

                            <div className="grid grid-cols-5 gap-3">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(n => (
                                    <motion.button
                                        key={n}
                                        whileHover={{ scale: 0.98 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleDigitClick(n)}
                                        className="py-5 rounded-2xl text-2xl font-black transition-all"
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

                    {/* Input Sum Phase */}
                    {status === 'input_sum' && (
                        <motion.div
                            key="sum"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full max-w-md space-y-6"
                        >
                            <div
                                className="rounded-3xl p-8 text-center"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}
                            >
                                <Calculator className="mx-auto text-purple-400 mb-4" size={48} />
                                <p className="text-slate-400 text-sm mb-4">Tüm sayıların <span className="text-purple-400 font-bold">toplamı</span> nedir?</p>
                                <input
                                    type="number"
                                    value={userSum}
                                    onChange={(e) => setUserSum(e.target.value)}
                                    autoFocus
                                    onKeyPress={(e) => e.key === 'Enter' && handleSumSubmit()}
                                    className="w-full bg-slate-950/50 border-2 border-purple-500/30 text-center text-5xl font-black text-white py-4 rounded-2xl focus:border-purple-500 focus:outline-none transition-all"
                                    placeholder="?"
                                />
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSumSubmit}
                                className="w-full py-4 rounded-2xl font-bold text-lg"
                                style={{
                                    background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(168, 85, 247, 0.4)'
                                }}
                            >
                                <div className="flex items-center justify-center gap-3">
                                    <CheckCircle2 size={24} />
                                    <span>Onayla</span>
                                </div>
                            </motion.button>
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

                            <h2 className="text-3xl font-black text-purple-300 mb-2">
                                {level >= 5 ? '🎉 Harika!' : 'İyi İş!'}
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
                                        <p className="text-2xl font-bold text-purple-400">{level}</p>
                                    </div>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={startApp}
                                className="w-full px-6 py-4 rounded-2xl font-bold text-lg mb-4"
                                style={{
                                    background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(168, 85, 247, 0.4)'
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
                <GameFeedbackBanner feedback={feedbackState} />
            </div>

            <style>{`
                .animate-spin-slow { animation: spin 12s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default ReflectionSumGame;

