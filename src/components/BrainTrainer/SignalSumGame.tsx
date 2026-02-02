import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, RotateCcw, Trophy, Play, Timer,
    Star, Heart, Zap, CheckCircle2, XCircle, Radar, Sparkles, Eye
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useSound } from '../../hooks/useSound';
import { useGamePersistence } from '../../hooks/useGamePersistence';

// --- Sabitler ---
const COLORS = [
    { name: 'SİYAN', value: '#06b6d4' },
    { name: 'AMBER', value: '#f59e0b' },
    { name: 'ROSE', value: '#f43f5e' },
    { name: 'ZÜMRÜT', value: '#10b981' },
];

interface SignalItem {
    id: string;
    value: number;
    colorIdx: number;
    x: number;
    y: number;
}

type GameStatus = 'waiting' | 'display' | 'question' | 'result' | 'gameover';

// Child-friendly messages
const SUCCESS_MESSAGES = [
    "Harika! 🎯",
    "Süper! ⭐",
    "Doğru! 🎉",
    "Bravo! 🌟",
];

const FAILURE_MESSAGES = [
    "Dikkatli bak! 👀",
    "Tekrar dene! 💪",
];

const SignalSumGame: React.FC = () => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();
    const [status, setStatus] = useState<GameStatus>('waiting');
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [signals, setSignals] = useState<SignalItem[]>([]);
    const [targetColorIdx, setTargetColorIdx] = useState(0);
    const [options, setOptions] = useState<number[]>([]);
    const [correctAnswer, setCorrectAnswer] = useState(0);
    const [displayTimer, setDisplayTimer] = useState(5);
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
    const [feedbackMsg, setFeedbackMsg] = useState('');
    const [streak, setStreak] = useState(0);
    const gameStartTimeRef = useRef<number>(0);
    const hasSavedRef = useRef<boolean>(false);

    // Back link
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    // --- Sinyal Üretme ---
    const generateSignals = useCallback((lvl: number) => {
        const count = Math.min(10, 3 + Math.floor(lvl / 2));
        const newSignals: SignalItem[] = [];
        const usedColors = new Set<number>();

        for (let i = 0; i < count; i++) {
            let x: number, y: number, isTooClose, attempts = 0;
            do {
                x = Math.random() * 70 + 15;
                y = Math.random() * 70 + 15;
                isTooClose = newSignals.some(s => Math.sqrt(Math.pow(s.x - x, 2) + Math.pow(s.y - y, 2)) < 15);
                attempts++;
            } while (isTooClose && attempts < 50);

            const colorIdx = Math.floor(Math.random() * COLORS.length);
            usedColors.add(colorIdx);

            newSignals.push({
                id: Math.random().toString(36).substr(2, 9),
                value: Math.floor(Math.random() * 9) + 1,
                colorIdx,
                x, y
            });
        }

        // En az bir renk seç ve onun toplamını hedefle
        const colorArray = Array.from(usedColors);
        const targetIdx = colorArray[Math.floor(Math.random() * colorArray.length)];
        const sum = newSignals.filter(s => s.colorIdx === targetIdx).reduce((acc, curr) => acc + curr.value, 0);

        // Şıklar
        const opts = [sum];
        while (opts.length < 4) {
            const fake = sum + (Math.floor(Math.random() * 10) - 5);
            if (fake > 0 && !opts.includes(fake)) opts.push(fake);
        }

        setSignals(newSignals);
        setTargetColorIdx(targetIdx);
        setCorrectAnswer(sum);
        setOptions(opts.sort(() => Math.random() - 0.5));
    }, []);

    const startLevel = useCallback((lvl: number) => {
        generateSignals(lvl);
        setStatus('display');
        setDisplayTimer(Math.max(2, 6 - Math.floor(lvl / 4)));
        setFeedback(null);
    }, [generateSignals]);

    const startApp = useCallback(() => {
        setLevel(1);
        setScore(0);
        setLives(3);
        setStreak(0);
        hasSavedRef.current = false;
        gameStartTimeRef.current = Date.now();
        startLevel(1);
    }, [startLevel]);

    // Handle Auto Start from HUB
    useEffect(() => {
        if (location.state?.autoStart && status === 'waiting') {
            startApp();
        }
    }, [location.state, status, startApp]);

    // --- Oyun Döngüsü ---
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (status === 'display' && displayTimer > 0) {
            interval = setInterval(() => setDisplayTimer(prev => prev - 1), 1000);
        } else if (status === 'display' && displayTimer === 0) {
            setStatus('question');
        }
        return () => clearInterval(interval);
    }, [status, displayTimer]);

    // Oyun bittiğinde verileri kaydet
    useEffect(() => {
        if (status === 'gameover' && gameStartTimeRef.current > 0 && !hasSavedRef.current) {
            hasSavedRef.current = true;
            const durationSeconds = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
            saveGamePlay({
                game_id: 'sinyal-toplami',
                score_achieved: score,
                duration_seconds: durationSeconds,
                lives_remaining: lives,
                metadata: {
                    level_reached: level,
                    game_name: 'Sinyal Toplamı',
                }
            });
        }
    }, [status, score, level, lives, saveGamePlay]);

    const handleSelect = (val: number) => {
        if (status !== 'question' || feedback) return;

        if (val === correctAnswer) {
            playSound('correct');
            setFeedback('correct');
            setFeedbackMsg(SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)]);
            setStreak(prev => prev + 1);
            setScore(prev => prev + (level * 100) + (streak * 10));
            setTimeout(() => {
                setLevel(prev => prev + 1);
                startLevel(level + 1);
            }, 1500);
        } else {
            playSound('incorrect');
            setFeedback('wrong');
            setFeedbackMsg(FAILURE_MESSAGES[Math.floor(Math.random() * FAILURE_MESSAGES.length)]);
            setStreak(0);
            setLives(l => l - 1);
            setTimeout(() => {
                if (lives <= 1) {
                    setStatus('gameover');
                } else {
                    startLevel(level);
                }
            }, 1500);
        }
    };

    // Welcome Screen
    if (status === 'waiting') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-white">
                {/* Decorative Background */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
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
                                background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                                boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)'
                            }}
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <Radar size={52} className="text-white drop-shadow-lg" />
                        </motion.div>

                        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                            🎯 Sinyal Toplamı
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
                            <div className="flex justify-center gap-4 text-3xl mb-2">
                                <span style={{ color: COLORS[0].value }}>3</span>
                                <span style={{ color: COLORS[1].value }}>7</span>
                                <span style={{ color: COLORS[0].value }}>5</span>
                                <span style={{ color: COLORS[2].value }}>2</span>
                            </div>
                            <p className="text-slate-400 text-sm">
                                SİYAN rengin toplamı = <span className="text-cyan-400 font-bold">8</span>
                            </p>
                        </div>

                        {/* Instructions */}
                        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                            <h3 className="text-lg font-bold text-blue-300 mb-3 flex items-center gap-2">
                                <Eye size={20} /> Nasıl Oynanır?
                            </h3>
                            <ul className="space-y-2 text-slate-300 text-sm">
                                <li className="flex items-center gap-2">
                                    <Sparkles size={14} className="text-blue-400" />
                                    <span>Ekranda <strong>renkli sayılar</strong> belirir</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Sparkles size={14} className="text-blue-400" />
                                    <span>Sayılar kaybolduktan sonra <strong>hedef rengin toplamını</strong> bul</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Sparkles size={14} className="text-blue-400" />
                                    <span>3 can! Dikkatli ol!</span>
                                </li>
                            </ul>
                        </div>

                        {/* TUZÖ Badge */}
                        <div className="bg-blue-500/10 text-blue-300 text-xs px-4 py-2 rounded-full mb-6 inline-block border border-blue-500/30">
                            TUZÖ 5.5.1 Seçici Dikkat
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.05, y: -4 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={startApp}
                            className="px-8 py-4 rounded-2xl font-bold text-lg"
                            style={{
                                background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                                boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(59, 130, 246, 0.4)'
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
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-white">
            {/* Decorative Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
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

                        {/* Level */}
                        <div
                            className="flex items-center gap-2 px-4 py-2 rounded-xl"
                            style={{
                                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(29, 78, 216, 0.1) 100%)',
                                boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                                border: '1px solid rgba(59, 130, 246, 0.3)'
                            }}
                        >
                            <Radar className="text-blue-400" size={18} />
                            <span className="font-bold text-blue-400">Seviye {level}</span>
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
                            className="w-full max-w-2xl"
                        >
                            {/* Timer */}
                            <div className="flex justify-center mb-4">
                                <div
                                    className="flex items-center gap-2 px-6 py-3 rounded-xl"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(29, 78, 216, 0.2) 100%)',
                                        boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2)',
                                        border: '1px solid rgba(59, 130, 246, 0.5)'
                                    }}
                                >
                                    <Timer className="text-blue-400 animate-pulse" size={20} />
                                    <span className="font-bold text-blue-400 text-xl">{displayTimer}s</span>
                                </div>
                            </div>

                            {/* Signal Area */}
                            <div
                                className="relative aspect-[16/9] rounded-3xl overflow-hidden"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}
                            >
                                {signals.map((s) => (
                                    <motion.div
                                        key={s.id}
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        style={{
                                            position: 'absolute',
                                            left: `${s.x}%`,
                                            top: `${s.y}%`,
                                            color: COLORS[s.colorIdx].value,
                                            textShadow: `0 0 20px ${COLORS[s.colorIdx].value}88`
                                        }}
                                        className="text-5xl lg:text-6xl font-black transform -translate-x-1/2 -translate-y-1/2"
                                    >
                                        {s.value}
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Question Phase */}
                    {status === 'question' && (
                        <motion.div
                            key="question"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full max-w-xl"
                        >
                            <div
                                className="rounded-3xl p-8 mb-8 text-center"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}
                            >
                                <p className="text-slate-400 text-sm mb-4">Sadece bu renkteki sayıların toplamını bul:</p>
                                <div
                                    className="inline-block px-6 py-3 rounded-xl text-2xl font-bold mb-4"
                                    style={{
                                        backgroundColor: COLORS[targetColorIdx].value + '33',
                                        color: COLORS[targetColorIdx].value,
                                        border: `2px solid ${COLORS[targetColorIdx].value}`
                                    }}
                                >
                                    {COLORS[targetColorIdx].name}
                                </div>
                            </div>

                            {/* Options */}
                            <div className="grid grid-cols-2 gap-4">
                                {options.map((opt, i) => (
                                    <motion.button
                                        key={i}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        onClick={() => handleSelect(opt)}
                                        disabled={feedback !== null}
                                        whileHover={!feedback ? { scale: 0.98, y: -2 } : {}}
                                        whileTap={!feedback ? { scale: 0.95 } : {}}
                                        className="py-6 rounded-2xl font-bold text-3xl transition-all"
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                                            boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            color: '#fff',
                                            cursor: feedback ? 'default' : 'pointer'
                                        }}
                                    >
                                        {opt}
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

                            <h2 className="text-3xl font-black text-blue-300 mb-2">
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
                                        <p className="text-2xl font-bold text-blue-400">{level}</p>
                                    </div>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={startApp}
                                className="w-full px-6 py-4 rounded-2xl font-bold text-lg mb-4"
                                style={{
                                    background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(59, 130, 246, 0.4)'
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
                                {location.state?.arcadeMode ? 'Arcade Hub\'a Dön' : 'Geri Dön'}
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
                                {feedback === 'wrong' && (
                                    <p className="text-white/80 mt-2">
                                        Doğrusu: <span className="font-bold">{correctAnswer}</span>
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

export default SignalSumGame;
