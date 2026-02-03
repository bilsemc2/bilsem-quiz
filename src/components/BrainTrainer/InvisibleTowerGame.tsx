import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, RotateCcw, Trophy, TrendingUp, Timer,
    Activity, Zap, CheckCircle2, XCircle, Heart, Star,
    Play, Eye, Sparkles, Layers
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useSound } from '../../hooks/useSound';
import { useGamePersistence } from '../../hooks/useGamePersistence';

// --- Types ---
interface TowerSegment {
    id: string;
    value: number;
    multiplier?: number;
    isNegative: boolean;
    row: number;
    col: number;
}

type GameStatus = 'waiting' | 'building' | 'flashing' | 'question' | 'result' | 'gameover';

// Child-friendly messages
const SUCCESS_MESSAGES = [
    "Harika! 🏗️",
    "Süper Hafıza! 🧠",
    "Müthiş! ⭐",
    "Bravo! 🌟",
];

const FAILURE_MESSAGES = [
    "Tekrar dene! 💪",
    "Dikkatli say! 🔢",
];

const InvisibleTowerGame: React.FC = () => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();
    const [status, setStatus] = useState<GameStatus>('waiting');
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [tower, setTower] = useState<TowerSegment[]>([]);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [correctAnswer, setCorrectAnswer] = useState(0);
    const [options, setOptions] = useState<number[]>([]);
    const [timeLeft, setTimeLeft] = useState(45);
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
    const [feedbackMsg, setFeedbackMsg] = useState('');
    const gameStartTimeRef = useRef<number>(0);
    const hasSavedRef = useRef<boolean>(false);
    const totalQuestions = 10;

    // Back link
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    // --- Tower Generation ---
    const generateTower = useCallback((lvl: number) => {
        const rows = Math.min(6, 2 + Math.floor(lvl / 2));
        const newTower: TowerSegment[] = [];
        let totalSum = 0;

        for (let r = 0; r < rows; r++) {
            const colsInRow = rows - r;
            for (let c = 0; c < colsInRow; c++) {
                const isNegative = lvl > 3 && Math.random() < 0.2;
                const multiplier = lvl > 5 && Math.random() < 0.15 ? (Math.random() < 0.7 ? 2 : 3) : undefined;
                let val = Math.floor(Math.random() * 9) + 1;

                if (isNegative) val = -val;
                const effectiveVal = val * (multiplier || 1);
                totalSum += effectiveVal;

                newTower.push({
                    id: Math.random().toString(36).substr(2, 9),
                    value: Math.abs(val),
                    multiplier,
                    isNegative,
                    row: r,
                    col: c
                });
            }
        }

        const opts = [totalSum];
        while (opts.length < 4) {
            const fake = totalSum + (Math.floor(Math.random() * 20) - 10);
            if (!opts.includes(fake)) opts.push(fake);
        }

        setTower(newTower);
        setCorrectAnswer(totalSum);
        setOptions(opts.sort(() => Math.random() - 0.5));
    }, []);

    const startLevel = useCallback((lvl: number) => {
        generateTower(lvl);
        setCurrentIndex(-1);
        setStatus('building');
        setFeedback(null);
        setTimeLeft(45);
        playSound('detective_mystery');
    }, [generateTower, playSound]);

    const startGame = useCallback(() => {
        setLevel(1);
        setScore(0);
        setLives(3);
        gameStartTimeRef.current = Date.now();
        hasSavedRef.current = false;
        startLevel(1);
    }, [startLevel]);

    // Handle Auto Start from HUB
    useEffect(() => {
        if (location.state?.autoStart && status === 'waiting') {
            startGame();
        }
    }, [location.state, status, startGame]);

    // --- Animation Sequence ---
    useEffect(() => {
        if (status === 'building') {
            const timer = setTimeout(() => setStatus('flashing'), 1000);
            return () => clearTimeout(timer);
        }

        if (status === 'flashing') {
            if (currentIndex < tower.length - 1) {
                const timer = setTimeout(() => {
                    setCurrentIndex(prev => prev + 1);
                    playSound('radar_scan');
                }, 1200);
                return () => clearTimeout(timer);
            } else {
                const timer = setTimeout(() => {
                    setStatus('question');
                    playSound('complete');
                }, 1500);
                return () => clearTimeout(timer);
            }
        }
    }, [status, currentIndex, tower.length, playSound]);

    // Timer
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (status === 'question' && timeLeft > 0 && !feedback) {
            interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0 && status === 'question' && !feedback) {
            setFeedback('wrong');
            setFeedbackMsg(FAILURE_MESSAGES[Math.floor(Math.random() * FAILURE_MESSAGES.length)]);
            setLives(l => l - 1);
        }
        return () => clearInterval(interval);
    }, [status, timeLeft, feedback]);

    // Handle feedback timeout
    useEffect(() => {
        if (feedback) {
            const timeout = setTimeout(() => {
                setFeedback(null);
                if (lives <= 0 && feedback === 'wrong') {
                    setStatus('gameover');
                } else if (level >= totalQuestions) {
                    setStatus('gameover');
                } else {
                    setLevel(l => l + 1);
                    startLevel(level + 1);
                }
            }, 2000);
            return () => clearTimeout(timeout);
        }
    }, [feedback, lives, level, startLevel]);

    // Save game data on finish
    useEffect(() => {
        if (status === 'gameover' && gameStartTimeRef.current > 0 && !hasSavedRef.current) {
            hasSavedRef.current = true;
            const durationSeconds = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
            saveGamePlay({
                game_id: 'gorunmez-kule',
                score_achieved: score,
                duration_seconds: durationSeconds,
                lives_remaining: lives,
                metadata: {
                    level_reached: level,
                    game_name: 'Görünmez Kule',
                }
            });
        }
    }, [status, score, lives, level, saveGamePlay]);

    const handleSelect = (val: number) => {
        if (status !== 'question' || feedback) return;

        if (val === correctAnswer) {
            setFeedback('correct');
            setFeedbackMsg(SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)]);
            playSound('detective_correct');
            setScore(prev => prev + (level * 200) + (timeLeft * 5));
        } else {
            setFeedback('wrong');
            setFeedbackMsg(FAILURE_MESSAGES[Math.floor(Math.random() * FAILURE_MESSAGES.length)]);
            playSound('detective_incorrect');
            setLives(l => l - 1);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-950 text-white">
            {/* Decorative Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <div className="relative z-10 p-4 pt-20">
                <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-4">
                    <Link
                        to={backLink}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft size={20} />
                        <span>{backLabel}</span>
                    </Link>

                    {(status === 'building' || status === 'flashing' || status === 'question') && (
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
                                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)',
                                    boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(16, 185, 129, 0.3)'
                                }}
                            >
                                <Layers className="text-emerald-400" size={18} />
                                <span className="font-bold text-emerald-400">{level}/{totalQuestions}</span>
                            </div>

                            {/* Timer */}
                            {status === 'question' && (
                                <div
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl"
                                    style={{
                                        background: timeLeft <= 10
                                            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.2) 100%)'
                                            : 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(8, 145, 178, 0.1) 100%)',
                                        boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                                        border: timeLeft <= 10
                                            ? '1px solid rgba(239, 68, 68, 0.5)'
                                            : '1px solid rgba(6, 182, 212, 0.3)'
                                    }}
                                >
                                    <Timer className={timeLeft <= 10 ? 'text-red-400' : 'text-cyan-400'} size={18} />
                                    <span className={`font-bold ${timeLeft <= 10 ? 'text-red-400' : 'text-cyan-400'}`}>{timeLeft}s</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-4">
                <AnimatePresence mode="wait">
                    {/* Welcome Screen */}
                    {status === 'waiting' && (
                        <motion.div
                            key="welcome"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center max-w-xl"
                        >
                            {/* 3D Gummy Icon */}
                            <motion.div
                                className="w-28 h-28 rounded-[40%] flex items-center justify-center mx-auto mb-6"
                                style={{
                                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                    boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)'
                                }}
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <TrendingUp size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                                🏗️ Görünmez Kule
                            </h1>

                            {/* Example */}
                            <div
                                className="rounded-2xl p-5 mb-6"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}
                            >
                                <p className="text-slate-400 text-sm mb-3">Örnek:</p>
                                <div className="flex justify-center items-center gap-2 mb-3">
                                    {[3, 5, 2, 7].map((n, i) => (
                                        <div
                                            key={i}
                                            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold"
                                            style={{
                                                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.2) 100%)',
                                                boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2)',
                                                border: '1px solid rgba(16, 185, 129, 0.3)'
                                            }}
                                        >
                                            {n}
                                        </div>
                                    ))}
                                    <span className="text-2xl mx-2">=</span>
                                    <div
                                        className="w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold text-amber-400"
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.3) 0%, rgba(245, 158, 11, 0.2) 100%)',
                                            boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2)',
                                            border: '2px solid rgba(251, 191, 36, 0.5)'
                                        }}
                                    >
                                        17
                                    </div>
                                </div>
                                <p className="text-slate-400 text-sm">Kule bloklarını topla!</p>
                            </div>

                            {/* Instructions */}
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                                <h3 className="text-lg font-bold text-emerald-300 mb-3 flex items-center gap-2">
                                    <Eye size={20} /> Nasıl Oynanır?
                                </h3>
                                <ul className="space-y-2 text-slate-300 text-sm">
                                    <li className="flex items-center gap-2">
                                        <Sparkles size={14} className="text-teal-400" />
                                        <span>Kuledeki sayıları <strong>izle</strong></span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Sparkles size={14} className="text-teal-400" />
                                        <span>Hepsini zihninde <strong>topla</strong></span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Sparkles size={14} className="text-teal-400" />
                                        <span>Dikkat: Çarpanlar ve negatifler! 3 can!</span>
                                    </li>
                                </ul>
                            </div>

                            {/* TUZÖ Badge */}
                            <div className="bg-emerald-500/10 text-emerald-300 text-xs px-4 py-2 rounded-full mb-6 inline-block border border-emerald-500/30">
                                TUZÖ 2.1.1 Ardışık Hafıza & Hesaplama
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05, y: -4 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={startGame}
                                className="px-8 py-4 rounded-2xl font-bold text-lg"
                                style={{
                                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(16, 185, 129, 0.4)'
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <Play size={24} fill="currentColor" />
                                    <span>Tırmanışa Başla</span>
                                </div>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* Playing State */}
                    {(status === 'building' || status === 'flashing' || status === 'question') && (
                        <motion.div
                            key="game"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full max-w-3xl flex flex-col items-center gap-8"
                        >
                            {/* Tower Structure */}
                            <div className="flex flex-col-reverse items-center gap-1 relative pt-16">
                                {/* Progress Indicator */}
                                {status === 'flashing' && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2"
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)',
                                            border: '1px solid rgba(16, 185, 129, 0.3)'
                                        }}
                                    >
                                        <Zap size={14} className="text-emerald-400 animate-pulse" />
                                        <span className="text-emerald-400">{currentIndex + 1}/{tower.length}</span>
                                    </motion.div>
                                )}

                                {Array.from({ length: Math.max(...tower.map(t => t.row)) + 1 }).map((_, rIdx) => (
                                    <div key={rIdx} className="flex gap-1">
                                        {tower.filter(t => t.row === rIdx).map((segment) => {
                                            const globalIndex = tower.findIndex(t => t.id === segment.id);
                                            const isActive = globalIndex === currentIndex;
                                            const isPast = globalIndex < currentIndex;
                                            const isQuestionMode = status === 'question';

                                            return (
                                                <motion.div
                                                    key={segment.id}
                                                    initial={{ scale: 0.8, opacity: 0 }}
                                                    animate={{
                                                        scale: (isActive && !isQuestionMode) ? 1.1 : 1,
                                                        opacity: (isQuestionMode && !isPast) ? 0.3 : 1,
                                                    }}
                                                    className="w-20 h-16 rounded-[25%] flex flex-col items-center justify-center transition-all relative"
                                                    style={{
                                                        background: (isActive && !isQuestionMode)
                                                            ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                                                            : isQuestionMode
                                                                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)'
                                                                : 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)',
                                                        boxShadow: (isActive && !isQuestionMode)
                                                            ? 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 0 30px rgba(16, 185, 129, 0.5)'
                                                            : 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                                                        border: (isActive && !isQuestionMode)
                                                            ? '2px solid #10B981'
                                                            : '1px solid rgba(16, 185, 129, 0.2)',
                                                        zIndex: isActive ? 20 : 1
                                                    }}
                                                >
                                                    <AnimatePresence>
                                                        {(isActive && !isQuestionMode) && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                exit={{ opacity: 0, scale: 2 }}
                                                                className="flex flex-col items-center"
                                                            >
                                                                <span className={`text-3xl font-black ${segment.isNegative ? 'text-red-200' : 'text-white'}`}>
                                                                    {segment.isNegative ? '-' : ''}{segment.value}
                                                                </span>
                                                                {segment.multiplier && (
                                                                    <span
                                                                        className="absolute -top-2 -right-2 text-[10px] font-black px-2 py-1 rounded-full animate-bounce"
                                                                        style={{
                                                                            background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                                                                            boxShadow: '0 2px 6px rgba(239, 68, 68, 0.5)'
                                                                        }}
                                                                    >
                                                                        x{segment.multiplier}
                                                                    </span>
                                                                )}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>

                                                    {!isQuestionMode && !isActive && (
                                                        <Activity size={14} className="text-emerald-500/30" />
                                                    )}
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>

                            {/* Question Panel */}
                            {status === 'question' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="w-full rounded-3xl p-8"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                        boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.2)',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}
                                >
                                    <h3 className="text-xl font-bold text-center mb-6">
                                        Kulenin toplam değeri nedir?
                                    </h3>

                                    <div className="grid grid-cols-2 gap-4">
                                        {options.map((opt, i) => (
                                            <motion.button
                                                key={i}
                                                whileHover={!feedback ? { scale: 0.98, y: -2 } : {}}
                                                whileTap={!feedback ? { scale: 0.95 } : {}}
                                                onClick={() => handleSelect(opt)}
                                                disabled={feedback !== null}
                                                className="py-6 text-2xl font-bold rounded-[25%] transition-all"
                                                style={{
                                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.1)',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    cursor: feedback ? 'default' : 'pointer'
                                                }}
                                            >
                                                {opt}
                                            </motion.button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
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
                                    background: 'linear-gradient(135deg, #10B981 0%, #EF4444 100%)',
                                    boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)'
                                }}
                                animate={{ rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <Trophy size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h2 className="text-3xl font-black text-emerald-300 mb-2">
                                {level >= 8 ? '🎉 Harika!' : 'Tırmanış Sonlandı!'}
                            </h2>
                            <p className="text-slate-400 mb-6">
                                {level >= 8 ? 'Kuleyi fethettin!' : 'Tekrar deneyelim!'}
                            </p>

                            <div
                                className="rounded-2xl p-6 mb-8"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}
                            >
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Skor</p>
                                        <p className="text-3xl font-bold text-amber-400">{score}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Kat</p>
                                        <p className="text-3xl font-bold text-emerald-400">{level}</p>
                                    </div>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={startGame}
                                className="w-full px-6 py-4 rounded-2xl font-bold text-lg mb-4"
                                style={{
                                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(16, 185, 129, 0.4)'
                                }}
                            >
                                <div className="flex items-center justify-center gap-3">
                                    <RotateCcw size={24} />
                                    <span>Yeni Kule İnşa Et</span>
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
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default InvisibleTowerGame;
