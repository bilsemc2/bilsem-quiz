import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap, Timer, Trophy, Play, RotateCcw, ChevronLeft,
    Brain, Target, Star, Heart, Home, XCircle,
    Square, Circle, Triangle, Pentagon, Hexagon, Sparkles
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSound } from '../../hooks/useSound';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useExam } from '../../contexts/ExamContext';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';

interface Shape {
    id: string;
    icon: React.ReactNode;
    color: string;
    bgGradient: string;
}

// Soft pastel renklerde şekiller
const SHAPES: Shape[] = [
    { id: 'square', icon: <Square />, color: '#818CF8', bgGradient: 'from-indigo-400 to-violet-500' },
    { id: 'circle', icon: <Circle />, color: '#34D399', bgGradient: 'from-emerald-400 to-teal-500' },
    { id: 'triangle', icon: <Triangle />, color: '#FBBF24', bgGradient: 'from-amber-400 to-orange-500' },
    { id: 'star', icon: <Star />, color: '#F472B6', bgGradient: 'from-pink-400 to-rose-500' },
    { id: 'hexagon', icon: <Hexagon />, color: '#A78BFA', bgGradient: 'from-purple-400 to-fuchsia-500' },
    { id: 'pentagon', icon: <Pentagon />, color: '#60A5FA', bgGradient: 'from-blue-400 to-cyan-500' }
];

// Child-friendly feedbackState messages
type GameState = 'waiting' | 'playing' | 'feedback' | 'gameover';

const NBackGame: React.FC = () => {
    const { playSound } = useSound();

    // Shared Feedback System
    const { feedbackState, showFeedback, isFeedbackActive } = useGameFeedback();

    const { saveGamePlay } = useGamePersistence();
    const { submitResult } = useExam();
    const location = useLocation();
    const navigate = useNavigate();
    const [gameState, setGameState] = useState<GameState>('waiting');
    const [history, setHistory] = useState<Shape[]>([]);
    const [currentShape, setCurrentShape] = useState<Shape | null>(null);
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [nValue, setNValue] = useState(1);
    const [timeLeft, setTimeLeft] = useState(45);
    const [lives, setLives] = useState(5);
    const [trials, setTrials] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);

    const gameStartTimeRef = useRef<number>(0);
    const hasSavedRef = useRef(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const shapeIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Exam Mode Props
    const examMode = location.state?.examMode || false;
    const examTimeLimit = location.state?.examTimeLimit || 45;

    const generateNewShape = useCallback(() => {
        const shouldBeMatch = Math.random() < 0.3 && history.length >= nValue;

        let nextShape;
        if (shouldBeMatch) {
            nextShape = history[history.length - nValue];
        } else {
            const availableShapes = SHAPES.filter(s =>
                history.length < nValue || s.id !== history[history.length - nValue]?.id
            );
            nextShape = availableShapes[Math.floor(Math.random() * availableShapes.length)];
        }

        setCurrentShape(null);
        setTimeout(() => {
            setCurrentShape(nextShape);
            setHistory(prev => [...prev, nextShape]);
            setTrials(prev => prev + 1);
            playSound('radar_scan');
        }, 300);
    }, [history, nValue, playSound]);

    const startGame = useCallback(() => {
        window.scrollTo(0, 0);
        setGameState('playing');
        setScore(0);
        setLevel(1);
        setNValue(1);
        setHistory([]);
        setTrials(0);
        setCorrectCount(0);
        setTimeLeft(examMode ? examTimeLimit : 45);
        setLives(5);
        hasSavedRef.current = false;
        gameStartTimeRef.current = Date.now();
        generateNewShape();
    }, [generateNewShape, examMode, examTimeLimit]);

    useEffect(() => {
        if ((location.state?.autoStart || examMode) && gameState === 'waiting') {
            startGame();
        }
    }, [location.state, gameState, startGame, examMode]);

    useEffect(() => {
        if (gameState === 'playing' && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && gameState === 'playing') {
            handleGameOver();
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [gameState, timeLeft]);

    const handleGameOver = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;

        setGameState('gameover');
        if (shapeIntervalRef.current) clearInterval(shapeIntervalRef.current);

        const durationSeconds = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);

        // Exam mode: submit result and redirect
        if (examMode) {
            (async () => {
                await submitResult(score > 200, score, 1000, durationSeconds);
                navigate("/atolyeler/sinav-simulasyonu/devam");
            })();
            return;
        }

        saveGamePlay({
            game_id: 'n-geri-sifresi',
            score_achieved: score,
            duration_seconds: durationSeconds,
            metadata: {
                n_value: nValue,
                level: level,
                correct_count: correctCount,
                trials: trials,
                game_name: 'N-Geri Şifresi',
            }
        });
    }, [score, nValue, level, correctCount, trials, saveGamePlay, examMode, submitResult, navigate]);

    useEffect(() => {
        if (gameState === 'playing') {
            shapeIntervalRef.current = setInterval(() => {
                if (!isFeedbackActive && trials > nValue) {
                    const isActuallyMatch = history[history.length - 1]?.id === history[history.length - (nValue + 1)]?.id;
                    if (isActuallyMatch) {
                        showFeedback(false);
                        playSound('radar_incorrect');

                        const newLives = lives - 1;
                        setLives(newLives);

                        if (newLives <= 0) {
                            setTimeout(() => {
                                handleGameOver();
                            }, 1200);
                            return;
                        }
                    }
                }
                generateNewShape();
            }, 3000 - (level * 100));
        }
        return () => {
            if (shapeIntervalRef.current) clearInterval(shapeIntervalRef.current);
        };
    }, [gameState, level, generateNewShape, history, nValue, trials, isFeedbackActive, playSound, lives, handleGameOver]);

    const handleDecision = (isMatch: boolean) => {
        if (gameState !== 'playing' || isFeedbackActive || history.length <= nValue) return;

        const actualMatch = history[history.length - 1].id === history[history.length - (nValue + 1)].id;

        if (isMatch === actualMatch) {

            setScore(prev => prev + (10 * nValue * level));
            setCorrectCount(prev => prev + 1);
            playSound('radar_correct');

            if (correctCount + 1 >= level * 5) {
                setLevel(prev => prev + 1);
                if (level % 2 === 0 && nValue < 3) {
                    setNValue(prev => prev + 1);
                    playSound('complete');
                }
            }
        } else {

            playSound('radar_incorrect');

            const newLives = lives - 1;
            setLives(newLives);

            if (newLives <= 0) {
                setTimeout(() => {
                    handleGameOver();
                }, 1200);
                return;
            }
        }

        if (shapeIntervalRef.current) clearInterval(shapeIntervalRef.current);
        setTimeout(() => {
            generateNewShape();
        }, 1200);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";

    // =============== WELCOME SCREEN ===============
    if (gameState === 'waiting') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-teal-950 via-emerald-950 to-slate-900 flex items-center justify-center p-6 text-white relative overflow-hidden">
                {/* Decorative Background */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
                </div>

                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white/10 backdrop-blur-xl p-10 rounded-3xl border border-white/20 text-center max-w-xl relative z-10"
                    style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.3)' }}
                >
                    {/* 3D Gummy Icon */}
                    <motion.div
                        className="w-28 h-28 bg-gradient-to-br from-teal-400 to-emerald-600 rounded-[40%] flex items-center justify-center mx-auto mb-6"
                        style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }}
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <Brain size={52} className="text-white drop-shadow-lg" />
                    </motion.div>

                    <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-teal-300 via-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                        N-Geri Şifresi
                    </h1>

                    <p className="text-slate-300 mb-6 text-lg">
                        Şekilleri hatırla ve karşılaştır! 🧠
                    </p>

                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                        <h3 className="font-bold text-emerald-300 mb-3 flex items-center gap-2">
                            <Sparkles size={18} />
                            Nasıl Oynanır?
                        </h3>
                        <ul className="text-sm text-slate-200 space-y-2">
                            <li className="flex items-center gap-2">
                                <span className="w-6 h-6 bg-teal-500/30 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                                Ekranda şekiller belirir
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-6 h-6 bg-emerald-500/30 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                                N adım önceki şekille aynı mı?
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-6 h-6 bg-cyan-500/30 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                                AYNI veya FARKLI seç
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-6 h-6 bg-blue-500/30 rounded-full flex items-center justify-center text-xs font-bold">🎯</span>
                                Seviye arttıkça N değeri artar!
                            </li>
                        </ul>
                    </div>

                    <div className="flex flex-wrap justify-center gap-4 mb-6">
                        <div className="bg-white/10 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2 border border-white/20">
                            <Heart className="text-red-400" size={16} />
                            <span className="text-sm text-slate-200">5 Can</span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2 border border-white/20">
                            <Timer className="text-blue-400" size={16} />
                            <span className="text-sm text-slate-200">45 Saniye</span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2 border border-white/20">
                            <Zap className="text-emerald-400" size={16} />
                            <span className="text-sm text-slate-200">N=1 Başla</span>
                        </div>
                    </div>

                    {/* TUZÖ Badge */}
                    <div className="mb-6 inline-flex items-center gap-1.5 px-3 py-1 bg-teal-500/20 border border-teal-500/30 rounded-full">
                        <span className="text-[9px] font-black text-teal-300 uppercase tracking-wider">TUZÖ</span>
                        <span className="text-[9px] font-bold text-teal-400">5.9.1 Çalışma Belleği Güncelleme</span>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={startGame}
                        className="px-10 py-5 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-2xl font-bold text-xl"
                        style={{ boxShadow: '0 8px 32px rgba(20, 184, 166, 0.4)' }}
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

    // =============== GAME SCREEN ===============
    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-950 via-emerald-950 to-slate-900 text-white relative overflow-hidden">
            {/* Decorative Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl" />
            </div>

            {/* Shared Feedback Banner */}
            <AnimatePresence>
                {feedbackState && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-end justify-center pb-24 pointer-events-none"
                    >
                        <div className="pointer-events-auto">
                            <GameFeedbackBanner feedback={feedbackState} />
                        </div>
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
                        <span>Geri</span>
                    </Link>

                    {gameState === 'playing' && (
                        <div className="flex items-center gap-3 flex-wrap justify-end">
                            {/* N-Value Badge */}
                            <div className="flex items-center gap-2 bg-teal-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-teal-500/30">
                                <Brain className="text-teal-400" size={18} />
                                <span className="font-bold text-teal-400">N={nValue}</span>
                            </div>

                            {/* Score */}
                            <div className="flex items-center gap-2 bg-amber-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-amber-500/30">
                                <Star className="text-amber-400" size={18} />
                                <span className="font-bold text-amber-400">{score}</span>
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
                                <Timer className="text-blue-400" size={18} />
                                <span className={`font-bold ${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-blue-400'}`}>
                                    {formatTime(timeLeft)}
                                </span>
                            </div>

                            {/* Level */}
                            <div className="flex items-center gap-2 bg-emerald-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-emerald-500/30">
                                <Zap className="text-emerald-400" size={18} />
                                <span className="font-bold text-emerald-400">Lv.{level}</span>
                            </div>

                            {/* Restart */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={startGame}
                                className="p-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20"
                            >
                                <RotateCcw size={20} className="text-slate-300" />
                            </motion.button>
                        </div>
                    )}
                </div>

                {/* Main Game Area */}
                <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)]">
                    {gameState === 'playing' && (
                        <div className="flex flex-col items-center">
                            {/* Shape Display - 3D Gummy Card */}
                            <motion.div
                                className="w-64 h-64 rounded-[40%] flex items-center justify-center mb-8"
                                style={{
                                    background: currentShape
                                        ? `linear-gradient(135deg, ${currentShape.color}40 0%, ${currentShape.color}20 100%)`
                                        : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                                    boxShadow: currentShape
                                        ? `inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.2), 0 0 40px ${currentShape.color}40`
                                        : 'inset 0 -6px 12px rgba(0,0,0,0.2), inset 0 6px 12px rgba(255,255,255,0.1)',
                                    border: currentShape ? `2px solid ${currentShape.color}40` : '1px solid rgba(255,255,255,0.1)',
                                }}
                            >
                                <AnimatePresence mode="wait">
                                    {currentShape ? (
                                        <motion.div
                                            key={currentShape.id}
                                            initial={{ scale: 0, opacity: 0, rotate: -45 }}
                                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                            exit={{ scale: 1.2, opacity: 0, rotate: 45 }}
                                            style={{ color: currentShape.color }}
                                            className="text-8xl drop-shadow-lg"
                                        >
                                            {React.cloneElement(currentShape.icon as React.ReactElement, { size: 100 })}
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="loader"
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            className="text-teal-500/30"
                                        >
                                            <RotateCcw size={40} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>

                            {/* Progress Indicator */}
                            {history.length <= nValue && (
                                <div className="mb-6 flex items-center gap-2 text-teal-400/60">
                                    <div className="flex gap-1">
                                        {Array.from({ length: nValue + 1 }).map((_, i) => (
                                            <div
                                                key={i}
                                                className={`w-3 h-3 rounded-full ${i < history.length ? 'bg-teal-400' : 'bg-teal-400/20'}`}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-sm">Veri toplanıyor...</span>
                                </div>
                            )}

                            {/* Decision Buttons - 3D Gummy Style */}
                            <div className="grid grid-cols-2 gap-6 w-full max-w-md">
                                <motion.button
                                    whileHover={history.length > nValue ? { scale: 1.05, y: -4 } : {}}
                                    whileTap={history.length > nValue ? { scale: 0.95 } : {}}
                                    disabled={history.length <= nValue}
                                    onClick={() => handleDecision(true)}
                                    className={`p-6 rounded-2xl flex flex-col items-center gap-3 transition-all ${history.length <= nValue
                                        ? 'opacity-30 cursor-not-allowed'
                                        : 'cursor-pointer'
                                        }`}
                                    style={{
                                        background: history.length > nValue
                                            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(20, 184, 166, 0.2) 100%)'
                                            : 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                        boxShadow: history.length > nValue
                                            ? 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.1), 0 4px 16px rgba(16, 185, 129, 0.2)'
                                            : 'inset 0 -2px 4px rgba(0,0,0,0.2)',
                                        border: history.length > nValue
                                            ? '1px solid rgba(16, 185, 129, 0.4)'
                                            : '1px solid rgba(255,255,255,0.1)',
                                    }}
                                >
                                    <Target size={32} className="text-emerald-400" />
                                    <span className="font-black text-emerald-300 uppercase tracking-widest text-sm">Aynı</span>
                                </motion.button>

                                <motion.button
                                    whileHover={history.length > nValue ? { scale: 1.05, y: -4 } : {}}
                                    whileTap={history.length > nValue ? { scale: 0.95 } : {}}
                                    disabled={history.length <= nValue}
                                    onClick={() => handleDecision(false)}
                                    className={`p-6 rounded-2xl flex flex-col items-center gap-3 transition-all ${history.length <= nValue
                                        ? 'opacity-30 cursor-not-allowed'
                                        : 'cursor-pointer'
                                        }`}
                                    style={{
                                        background: history.length > nValue
                                            ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.3) 0%, rgba(234, 88, 12, 0.2) 100%)'
                                            : 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                        boxShadow: history.length > nValue
                                            ? 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.1), 0 4px 16px rgba(249, 115, 22, 0.2)'
                                            : 'inset 0 -2px 4px rgba(0,0,0,0.2)',
                                        border: history.length > nValue
                                            ? '1px solid rgba(249, 115, 22, 0.4)'
                                            : '1px solid rgba(255,255,255,0.1)',
                                    }}
                                >
                                    <XCircle size={32} className="text-orange-400" />
                                    <span className="font-black text-orange-300 uppercase tracking-widest text-sm">Farklı</span>
                                </motion.button>
                            </div>
                        </div>
                    )}

                    {/* Game Over Screen */}
                    {gameState === 'gameover' && (
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
                                {score >= 500 ? '🎉 Hafıza Ustası!' : 'Görev Tamamlandı!'}
                            </h2>
                            <p className="text-slate-300 mb-6">Çalışma belleğini zorladın!</p>

                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/20">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Skor</p>
                                        <p className="text-2xl font-black text-amber-400">{score}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">N-Level</p>
                                        <p className="text-2xl font-black text-teal-400">{nValue}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Doğruluk</p>
                                        <p className="text-2xl font-black text-emerald-400">
                                            %{Math.round((correctCount / Math.max(trials - nValue, 1)) * 100)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={startGame}
                                    className="w-full px-6 py-4 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-2xl font-bold text-lg"
                                    style={{ boxShadow: '0 8px 32px rgba(20, 184, 166, 0.4)' }}
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
                                    <span>{location.state?.arcadeMode ? "Bilsem Zeka" : "Çıkış"}</span>
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NBackGame;
