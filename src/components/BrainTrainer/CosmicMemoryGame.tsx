import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import {
    ChevronLeft, RotateCcw, Trophy,
    Star, Zap, Brain, Eye, Heart, Clock, Play, Home,
    CheckCircle2, XCircle, Sparkles
} from 'lucide-react';
import { useSound } from '../../hooks/useSound';
import { useGamePersistence } from '../../hooks/useGamePersistence';

// ------------------ Tip Tanımları ------------------
type GameMode = 'NORMAL' | 'REVERSE';

interface GameState {
    level: number;
    score: number;
    sequence: number[];
    userSequence: number[];
    isDisplaying: number | null;
    status: 'WAITING' | 'DISPLAYING' | 'INPUT' | 'SUCCESS' | 'FAILURE' | 'GAMEOVER';
    gridSize: number;
    mode: GameMode;
}

// Child-friendly feedback messages
const SUCCESS_MESSAGES = [
    "Süper hafıza! ⭐",
    "Uzay dahisi! 🚀",
    "Harikasın! 🌟",
    "Mükemmel! 💫",
    "Kozmik zeka! 🧠",
];

const FAIL_MESSAGES = [
    "Tekrar dene! 💪",
    "Diziye odaklan! 👀",
    "Biraz daha dikkat! 🎯",
];

const CosmicMemoryGame: React.FC = () => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();
    const [gameStarted, setGameStarted] = useState(false);
    const gameStartTimeRef = useRef<number>(0);
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [showFeedback, setShowFeedback] = useState(false);
    const [isCorrectFeedback, setIsCorrectFeedback] = useState(true);

    const [state, setState] = useState<GameState>({
        level: 1,
        score: 0,
        sequence: [],
        userSequence: [],
        isDisplaying: null,
        status: 'WAITING',
        gridSize: 3,
        mode: 'NORMAL'
    });
    const [lives, setLives] = useState(5);
    const [totalTime, setTotalTime] = useState(180);

    // ------------------ Oyun Mantığı ------------------

    const generateSequence = useCallback((level: number, size: number) => {
        const length = level + 2;
        const newSequence = [];
        for (let i = 0; i < length; i++) {
            newSequence.push(Math.floor(Math.random() * (size * size)));
        }
        return newSequence;
    }, []);

    const startLevel = useCallback(() => {
        const gridSize = state.level <= 3 ? 3 : state.level <= 7 ? 4 : 5;
        const newSequence = generateSequence(state.level, gridSize);
        const mode: GameMode = state.level > 5 ? (Math.random() > 0.5 ? 'REVERSE' : 'NORMAL') : 'NORMAL';

        setState(prev => ({
            ...prev,
            sequence: newSequence,
            userSequence: [],
            isDisplaying: null,
            status: 'DISPLAYING',
            gridSize,
            mode
        }));
    }, [state.level, generateSequence]);

    useEffect(() => {
        if (state.status === 'DISPLAYING') {
            let i = 0;
            const interval = setInterval(() => {
                if (i >= state.sequence.length) {
                    clearInterval(interval);
                    setState(prev => ({ ...prev, status: 'INPUT', isDisplaying: null }));
                    return;
                }

                const currentIdx = state.sequence[i];
                setState(prev => ({ ...prev, isDisplaying: currentIdx }));
                playSound('cosmic_pop');

                setTimeout(() => {
                    setState(prev => ({ ...prev, isDisplaying: null }));
                }, 600);

                i++;
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [state.status, state.sequence, playSound]);

    const handleCellClick = (idx: number) => {
        if (state.status !== 'INPUT' || state.isDisplaying !== null) return;

        const nextUserSequence = [...state.userSequence, idx];
        const currentStep = state.userSequence.length;

        let isCorrect = false;
        if (state.mode === 'NORMAL') {
            isCorrect = state.sequence[currentStep] === idx;
        } else {
            isCorrect = state.sequence[state.sequence.length - 1 - currentStep] === idx;
        }

        if (isCorrect) {
            playSound('cosmic_success');
            setState(prev => ({ ...prev, userSequence: nextUserSequence }));

            if (nextUserSequence.length === state.sequence.length) {
                setIsCorrectFeedback(true);
                setFeedbackMessage(SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)]);
                setShowFeedback(true);

                setTimeout(() => {
                    setShowFeedback(false);
                    if (state.level === 10) {
                        setState(prev => ({ ...prev, status: 'GAMEOVER', score: prev.score + 500 }));
                    } else {
                        setState(prev => ({
                            ...prev,
                            status: 'SUCCESS',
                            score: prev.score + (state.level * 100),
                        }));
                        setTimeout(() => {
                            setState(prev => ({ ...prev, level: prev.level + 1 }));
                        }, 500);
                    }
                }, 1200);
            }
        } else {
            playSound('cosmic_fail');
            setIsCorrectFeedback(false);
            setFeedbackMessage(FAIL_MESSAGES[Math.floor(Math.random() * FAIL_MESSAGES.length)]);
            setShowFeedback(true);

            setLives(l => {
                const newLives = l - 1;
                setTimeout(() => {
                    setShowFeedback(false);
                    if (newLives <= 0) {
                        setState(prev => ({ ...prev, status: 'FAILURE' }));
                        setTimeout(() => {
                            setState(prev => ({ ...prev, status: 'GAMEOVER' }));
                        }, 500);
                    } else {
                        setState(prev => ({ ...prev, status: 'FAILURE' }));
                        setTimeout(() => {
                            if (state.level === 10) {
                                setState(prev => ({ ...prev, status: 'GAMEOVER' }));
                            } else {
                                setState(prev => ({ ...prev, level: prev.level + 1, status: 'WAITING' }));
                            }
                        }, 500);
                    }
                }, 1200);
                return newLives;
            });
        }
    };

    useEffect(() => {
        if (gameStarted && (state.status === 'WAITING' || state.status === 'SUCCESS')) {
            startLevel();
        }
    }, [gameStarted, state.status, startLevel]);

    const restartGame = useCallback(() => {
        setState({
            level: 1,
            score: 0,
            sequence: [],
            userSequence: [],
            isDisplaying: null,
            status: 'WAITING',
            gridSize: 3,
            mode: 'NORMAL'
        });
        setLives(5);
        setTotalTime(180);
        setGameStarted(true);
    }, []);

    useEffect(() => {
        if (location.state?.autoStart && !gameStarted) {
            restartGame();
        }
    }, [location.state, gameStarted, restartGame]);

    useEffect(() => {
        if (gameStarted && state.status !== 'GAMEOVER') {
            gameStartTimeRef.current = Date.now();
        }
    }, [gameStarted, state.status]);

    useEffect(() => {
        if (!gameStarted || state.status === 'GAMEOVER') return;
        const totalTimer = setInterval(() => {
            setTotalTime(prev => {
                if (prev <= 1) {
                    clearInterval(totalTimer);
                    setState(p => ({ ...p, status: 'GAMEOVER' }));
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(totalTimer);
    }, [gameStarted, state.status]);

    useEffect(() => {
        if (state.status === 'GAMEOVER' && gameStartTimeRef.current > 0) {
            const durationSeconds = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
            saveGamePlay({
                game_id: 'kozmik-hafiza',
                score_achieved: state.score,
                duration_seconds: durationSeconds,
                metadata: {
                    level_reached: state.level,
                    game_name: 'Kozmik Hafıza',
                    mode: state.mode,
                    grid_size: state.gridSize,
                }
            });
        }
    }, [state.status, state.score, state.level, state.mode, state.gridSize, saveGamePlay]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Back link - FIXED
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    // ------------------ Welcome Screen ------------------

    if (!gameStarted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 flex items-center justify-center p-6 text-white relative overflow-hidden">
                {/* Decorative Background */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl" />
                </div>

                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white/10 backdrop-blur-xl p-10 rounded-3xl border border-white/20 text-center max-w-xl relative z-10"
                    style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.3)' }}
                >
                    {/* 3D Gummy Icon */}
                    <motion.div
                        className="w-28 h-28 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-[40%] flex items-center justify-center mx-auto mb-6"
                        style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }}
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <Star size={52} className="text-white fill-white drop-shadow-lg" />
                    </motion.div>

                    <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                        Kozmik Hafıza
                    </h1>

                    <p className="text-slate-300 mb-6 text-lg">
                        Yıldızların sırasını hatırla! ⭐
                    </p>

                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                        <h3 className="font-bold text-indigo-300 mb-3 flex items-center gap-2">
                            <Sparkles size={18} />
                            Nasıl Oynanır?
                        </h3>
                        <ul className="text-sm text-slate-200 space-y-2">
                            <li className="flex items-center gap-2">
                                <span className="w-6 h-6 bg-indigo-500/30 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                                Parlayan yıldızları takip et
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-6 h-6 bg-purple-500/30 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                                NORMAL: Aynı sırada tıkla
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-6 h-6 bg-pink-500/30 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                                REVERSE: Ters sırada tıkla
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-6 h-6 bg-emerald-500/30 rounded-full flex items-center justify-center text-xs font-bold">🎯</span>
                                10 seviye tamamla!
                            </li>
                        </ul>
                    </div>

                    <div className="flex flex-wrap justify-center gap-4 mb-6">
                        <div className="bg-white/10 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2 border border-white/20">
                            <Heart className="text-red-400" size={16} />
                            <span className="text-sm text-slate-200">5 Can</span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2 border border-white/20">
                            <Clock className="text-blue-400" size={16} />
                            <span className="text-sm text-slate-200">3 Dakika</span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2 border border-white/20">
                            <Zap className="text-emerald-400" size={16} />
                            <span className="text-sm text-slate-200">10 Seviye</span>
                        </div>
                    </div>

                    {/* TUZÖ Badge */}
                    <div className="mb-6 inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full">
                        <span className="text-[9px] font-black text-indigo-300 uppercase tracking-wider">TUZÖ</span>
                        <span className="text-[9px] font-bold text-indigo-400">5.4.2 Görsel Kısa Süreli Bellek</span>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setGameStarted(true)}
                        className="px-10 py-5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl font-bold text-xl"
                        style={{ boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)' }}
                    >
                        <div className="flex items-center gap-3">
                            <Play size={28} className="fill-white" />
                            <span>Başla</span>
                        </div>
                    </motion.button>
                </motion.div>
            </div>
        );
    }

    // ------------------ Game Screen ------------------

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 text-white relative overflow-hidden">
            {/* Decorative Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl" />
            </div>

            {/* Feedback Overlay */}
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
                            className={`
                                px-12 py-8 rounded-3xl text-center
                                ${isCorrectFeedback
                                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                                    : 'bg-gradient-to-br from-orange-500 to-amber-600'
                                }
                            `}
                            style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}
                        >
                            <motion.div
                                animate={{ scale: [1, 1.2, 1], rotate: isCorrectFeedback ? [0, 10, -10, 0] : [0, -5, 5, 0] }}
                                transition={{ duration: 0.5 }}
                            >
                                {isCorrectFeedback
                                    ? <CheckCircle2 size={64} className="mx-auto mb-4 text-white" />
                                    : <XCircle size={64} className="mx-auto mb-4 text-white" />
                                }
                            </motion.div>
                            <p className="text-3xl font-black text-white">{feedbackMessage}</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative z-10 p-4">
                {/* Header */}
                <div className="max-w-4xl mx-auto flex items-center justify-between mb-6">
                    <Link
                        to={backLink}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft size={20} />
                        <span>{backLabel}</span>
                    </Link>

                    <div className="flex items-center gap-3 flex-wrap justify-end">
                        {/* Score */}
                        <div className="flex items-center gap-2 bg-purple-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-purple-500/30">
                            <Star className="text-purple-400" size={18} />
                            <span className="font-bold text-purple-400">{state.score}</span>
                        </div>

                        {/* Lives */}
                        <div className="flex items-center gap-1 bg-red-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-red-500/30">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Heart
                                    key={i}
                                    size={14}
                                    className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-400/30'}
                                />
                            ))}
                        </div>

                        {/* Timer */}
                        <div className="flex items-center gap-2 bg-blue-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-blue-500/30">
                            <Clock className="text-blue-400" size={18} />
                            <span className={`font-bold ${totalTime <= 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'}`}>
                                {formatTime(totalTime)}
                            </span>
                        </div>

                        {/* Level */}
                        <div className="flex items-center gap-2 bg-emerald-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-emerald-500/30">
                            <Zap className="text-emerald-400" size={18} />
                            <span className="font-bold text-emerald-400">Lv.{state.level}</span>
                        </div>

                        {/* Mode Badge */}
                        <div className={`px-3 py-2 rounded-xl font-bold text-sm ${state.mode === 'REVERSE'
                            ? 'bg-pink-500/20 border border-pink-500/30 text-pink-300'
                            : 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-300'
                            }`}>
                            {state.mode}
                        </div>

                        {/* Restart */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={restartGame}
                            className="p-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20"
                        >
                            <RotateCcw size={20} className="text-slate-300" />
                        </motion.button>
                    </div>
                </div>

                {/* Game Grid */}
                <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)]">
                    {/* Status Banner */}
                    <AnimatePresence>
                        {(state.status === 'DISPLAYING' || state.status === 'INPUT') && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className={`mb-6 flex items-center gap-3 px-6 py-3 rounded-2xl font-bold ${state.status === 'DISPLAYING'
                                    ? 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-300'
                                    : 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
                                    }`}
                            >
                                {state.status === 'DISPLAYING' ? (
                                    <><Eye className="animate-pulse" size={20} /> Takip Et!</>
                                ) : (
                                    <><Brain className="animate-bounce" size={20} /> {state.mode === 'REVERSE' ? 'Ters Sırayla Tıkla!' : 'Aynı Sırayla Tıkla!'}</>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Grid - 3D Gummy Cards */}
                    <div
                        className="grid gap-3 p-6 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20"
                        style={{
                            gridTemplateColumns: `repeat(${state.gridSize}, 1fr)`,
                            width: state.gridSize === 3 ? '320px' : state.gridSize === 4 ? '400px' : '480px',
                            boxShadow: 'inset 0 2px 12px rgba(255,255,255,0.1), 0 8px 32px rgba(0,0,0,0.3)'
                        }}
                    >
                        {Array.from({ length: state.gridSize * state.gridSize }).map((_, idx) => {
                            const isActive = state.isDisplaying === idx;
                            const isClicked = state.userSequence.includes(idx);

                            return (
                                <motion.button
                                    key={idx}
                                    initial={false}
                                    animate={isActive ? {
                                        scale: 1.1,
                                    } : {
                                        scale: 1,
                                    }}
                                    whileHover={state.status === 'INPUT' ? { scale: 1.05 } : {}}
                                    whileTap={state.status === 'INPUT' ? { scale: 0.95 } : {}}
                                    onClick={() => handleCellClick(idx)}
                                    className={`aspect-square rounded-2xl transition-all ${state.status === 'INPUT' ? 'cursor-pointer' : 'cursor-default'}`}
                                    style={{
                                        background: isActive
                                            ? 'linear-gradient(135deg, #818CF8 0%, #A78BFA 100%)'
                                            : isClicked
                                                ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.4) 0%, rgba(139, 92, 246, 0.4) 100%)'
                                                : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                                        boxShadow: isActive
                                            ? 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.3), 0 0 30px rgba(129, 140, 248, 0.6)'
                                            : 'inset 0 -3px 6px rgba(0,0,0,0.2), inset 0 3px 6px rgba(255,255,255,0.1)',
                                        border: isActive ? '2px solid rgba(255,255,255,0.5)' : '1px solid rgba(255,255,255,0.1)',
                                    }}
                                >
                                    <AnimatePresence>
                                        {(isActive || isClicked) && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0 }}
                                                className="flex items-center justify-center h-full w-full"
                                            >
                                                <Star
                                                    className={isActive ? "text-white fill-white drop-shadow-lg" : "text-indigo-300/50"}
                                                    size={state.gridSize === 3 ? 32 : state.gridSize === 4 ? 28 : 24}
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Game Over Overlay */}
            <AnimatePresence>
                {state.status === 'GAMEOVER' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white/10 backdrop-blur-xl rounded-3xl p-10 border border-white/20 text-center max-w-md w-full"
                            style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}
                        >
                            <motion.div
                                className="w-24 h-24 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-[40%] flex items-center justify-center mx-auto mb-6"
                                style={{ boxShadow: 'inset 0 -6px 12px rgba(0,0,0,0.2), inset 0 6px 12px rgba(255,255,255,0.4), 0 8px 32px rgba(251, 191, 36, 0.5)' }}
                                animate={{ y: [0, -8, 0], rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                <Trophy size={48} className="text-white" />
                            </motion.div>

                            <h2 className="text-3xl font-black text-amber-300 mb-2">
                                {state.score >= 5000 ? '🎉 Uzay Dahisi!' : 'Görev Tamamlandı!'}
                            </h2>
                            <p className="text-slate-300 mb-6">Kozmik hafızan harika!</p>

                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/20">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Skor</p>
                                        <p className="text-3xl font-black text-purple-400">{state.score}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Seviye</p>
                                        <p className="text-3xl font-black text-emerald-400">{state.level}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={restartGame}
                                    className="w-full px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl font-bold text-lg"
                                    style={{ boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)' }}
                                >
                                    <div className="flex items-center justify-center gap-3">
                                        <RotateCcw size={24} />
                                        <span>Tekrar Oyna</span>
                                    </div>
                                </motion.button>
                                <Link
                                    to={backLink}
                                    className="w-full px-6 py-4 bg-white/10 backdrop-blur-sm rounded-2xl font-bold flex items-center justify-center gap-2 border border-white/20"
                                >
                                    <Home size={20} />
                                    <span>{location.state?.arcadeMode ? "Bilsem Zeka" : "Geri Dön"}</span>
                                </Link>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CosmicMemoryGame;
