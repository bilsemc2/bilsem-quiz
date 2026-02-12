import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, RotateCcw, Trophy, Timer, Play, Star, Heart, Grid3X3, Eye, EyeOff, Plus, Sparkles } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSound } from '../../hooks/useSound';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useExam } from '../../contexts/ExamContext';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';

// --- Types ---
interface Card {
    id: string;
    value: number;
    isRevealed: boolean;
    isSolved: boolean;
}

type GameStatus = 'waiting' | 'preview' | 'playing' | 'gameover';

// Child-friendly messages


const TargetGridGame: React.FC = () => {
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
    const [cards, setCards] = useState<Card[]>([]);
    const [targetSum, setTargetSum] = useState(0);
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
    const [currentSum, setCurrentSum] = useState(0);
    const [previewTimer, setPreviewTimer] = useState(3);    const [lives, setLives] = useState(3);
    const gameStartTimeRef = useRef<number>(0);
    const hasSavedRef = useRef<boolean>(false);
    const totalRounds = 10;

    // Back link
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    // --- Grid Generation Logic ---
    const generateGrid = useCallback((lvl: number) => {
        const gridSize = 16; // 4x4
        const newCards: Card[] = [];

        // Generate random values between 1-9
        for (let i = 0; i < gridSize; i++) {
            newCards.push({
                id: Math.random().toString(36).substr(2, 9),
                value: Math.floor(Math.random() * 9) + 1,
                isRevealed: true,
                isSolved: false
            });
        }

        // Determine target sum (pick 2-3 unique random cards to guarantee a solution)
        const numToCombine = Math.random() > 0.7 && lvl > 3 ? 3 : 2;
        const targetIndices: number[] = [];
        while (targetIndices.length < numToCombine) {
            const idx = Math.floor(Math.random() * gridSize);
            if (!targetIndices.includes(idx)) targetIndices.push(idx);
        }

        const sum = targetIndices.reduce((acc, idx) => acc + newCards[idx].value, 0);

        setCards(newCards);
        setTargetSum(sum);
        setSelectedIndices([]);
        setCurrentSum(0);
        setPreviewTimer(Math.max(2, 4 - Math.floor(lvl / 3)));
    }, []);

    const startLevel = useCallback((lvl: number) => {
        generateGrid(lvl);
        setStatus('preview');
        playSound('signal_appear');
    }, [generateGrid, playSound]);

    const startGame = useCallback(() => {
        window.scrollTo(0, 0);
        setLevel(1);
        setScore(0);
        setLives(3);
        hasSavedRef.current = false;
        gameStartTimeRef.current = Date.now();
        startLevel(1);
    }, [startLevel]);

    // Handle Auto Start from HUB or Exam Mode
    useEffect(() => {
        if ((location.state?.autoStart || examMode) && status === 'waiting') {
            startGame();
        }
    }, [location.state, status, startGame, examMode]);

    // --- Preview Timer ---
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (status === 'preview' && previewTimer > 0) {
            interval = setInterval(() => setPreviewTimer(prev => prev - 1), 1000);
        } else if (status === 'preview' && previewTimer === 0) {
            setStatus('playing');
            setCards(prev => prev.map(c => ({ ...c, isRevealed: false })));
            playSound('signal_disappear');
        }
        return () => clearInterval(interval);
    }, [status, previewTimer, playSound]);

    // Save game data on finish
    useEffect(() => {
        if (status === 'gameover' && gameStartTimeRef.current > 0 && !hasSavedRef.current) {
            hasSavedRef.current = true;
            const durationSeconds = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);

            // Exam mode: submit result and navigate
            if (examMode) {
                const passed = level >= 5;
                submitResult(passed, score, 1000, durationSeconds).then(() => {
                    navigate("/atolyeler/sinav-simulasyonu/devam");
                });
                return;
            }

            saveGamePlay({
                game_id: 'hedef-sayi',
                score_achieved: score,
                duration_seconds: durationSeconds,
                lives_remaining: lives,
                metadata: {
                    level_reached: level,
                    game_name: 'Hedef Sayı',
                }
            });
        }
    }, [status, score, lives, level, saveGamePlay, examMode, submitResult, navigate]);

    // --- Interaction ---
    const handleCardClick = (idx: number) => {
        if (status !== 'playing' || cards[idx].isRevealed || cards[idx].isSolved || feedbackState) return;

        const card = cards[idx];
        const newSelected = [...selectedIndices, idx];
        const newSum = currentSum + card.value;

        setSelectedIndices(newSelected);
        setCurrentSum(newSum);

        setCards(prev => prev.map((c, i) => i === idx ? { ...c, isRevealed: true } : c));
        playSound('grid_flip');

        if (newSum === targetSum) {
            showFeedback(true);
            playSound('correct');
            setScore(prev => prev + (level * 100));

            setTimeout(() => {
                if (level >= totalRounds) {
                    setStatus('gameover');
                } else {
                    setLevel(prev => prev + 1);
                    startLevel(level + 1);
                }
            }, 1500);
        } else if (newSum > targetSum) {
            showFeedback(false);
            playSound('incorrect');
            setLives(l => l - 1);

            setTimeout(() => {
                if (lives <= 1) {
                    setStatus('gameover');
                } else {
                    setCards(prev => prev.map(c => ({ ...c, isRevealed: false })));
                    setSelectedIndices([]);
                    setCurrentSum(0);
                }
            }, 1500);
        }
    };

    // Welcome Screen
    if (status === 'waiting') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 text-white">
                {/* Decorative Background */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
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
                                background: 'linear-gradient(135deg, #818CF8 0%, #6366F1 100%)',
                                boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)'
                            }}
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <Grid3X3 size={52} className="text-white drop-shadow-lg" />
                        </motion.div>

                        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                            🎯 Hedef Sayı
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
                            <div className="flex items-center justify-center gap-4 mb-3">
                                <div className="grid grid-cols-3 gap-2">
                                    {[5, 3, 7, 2, 8, 4, 6, 1, 9].map((n, i) => (
                                        <div
                                            key={i}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
                                            style={{
                                                background: i === 1 || i === 7 ? '#818CF8' : 'rgba(255,255,255,0.1)',
                                                color: i === 1 || i === 7 ? '#fff' : 'rgba(255,255,255,0.5)'
                                            }}
                                        >
                                            {n}
                                        </div>
                                    ))}
                                </div>
                                <div className="text-center">
                                    <span className="text-xs text-slate-400">Hedef</span>
                                    <div className="text-xl font-bold text-indigo-400">4</div>
                                    <span className="text-xs text-slate-400">3 + 1 = 4</span>
                                </div>
                            </div>
                            <p className="text-slate-400 text-sm">Hedef sayıya ulaşan kartları bul!</p>
                        </div>

                        {/* Instructions */}
                        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                            <h3 className="text-lg font-bold text-indigo-300 mb-3 flex items-center gap-2">
                                <Eye size={20} /> Nasıl Oynanır?
                            </h3>
                            <ul className="space-y-2 text-slate-300 text-sm">
                                <li className="flex items-center gap-2">
                                    <Sparkles size={14} className="text-indigo-400" />
                                    <span>Sayıları <strong>ezberle</strong> - kısa sürede gizlenecek</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Sparkles size={14} className="text-indigo-400" />
                                    <span>Hedef sayıya ulaşan <strong>kartları seç</strong></span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Sparkles size={14} className="text-indigo-400" />
                                    <span>Toplamı aşma! 3 can ile başlıyorsun</span>
                                </li>
                            </ul>
                        </div>

                        {/* TUZÖ Badge */}
                        <div className="bg-indigo-500/10 text-indigo-300 text-xs px-4 py-2 rounded-full mb-6 inline-block border border-indigo-500/30">
                            TUZÖ 5.4.2 Görsel Kısa Süreli Bellek + Sayısal Akıl Yürütme
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.05, y: -4 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={startGame}
                            className="px-8 py-4 rounded-2xl font-bold text-lg"
                            style={{
                                background: 'linear-gradient(135deg, #818CF8 0%, #6366F1 100%)',
                                boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(129, 140, 248, 0.4)'
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <Play size={24} fill="currentColor" />
                                <span>Oyuna Başla</span>
                            </div>
                        </motion.button>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 text-white">
            {/* Decorative Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
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
                                background: 'linear-gradient(135deg, rgba(129, 140, 248, 0.2) 0%, rgba(99, 102, 241, 0.1) 100%)',
                                boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                                border: '1px solid rgba(129, 140, 248, 0.3)'
                            }}
                        >
                            <Grid3X3 className="text-indigo-400" size={18} />
                            <span className="font-bold text-indigo-400">{level}/{totalRounds}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-4">
                <AnimatePresence mode="wait">
                    {(status === 'preview' || status === 'playing') && (
                        <motion.div
                            key="game"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full max-w-lg"
                        >
                            {/* Target Sum Display */}
                            <div
                                className="rounded-2xl p-6 mb-6 text-center"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(129, 140, 248, 0.2) 0%, rgba(99, 102, 241, 0.1) 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.2)',
                                    border: '2px solid rgba(129, 140, 248, 0.3)'
                                }}
                            >
                                <span className="text-sm font-bold text-indigo-400 uppercase tracking-wider">Hedef Sayı</span>
                                <motion.div
                                    key={targetSum}
                                    initial={{ scale: 0.8 }}
                                    animate={{ scale: 1 }}
                                    className="text-5xl font-black text-white"
                                >
                                    {targetSum}
                                </motion.div>
                                <div className="flex items-center justify-center gap-2 mt-2 text-slate-400 text-sm">
                                    <Plus size={14} />
                                    <span>Toplam: </span>
                                    <span className="text-lg font-bold text-white">{currentSum}</span>
                                </div>
                            </div>

                            {/* Preview Badge */}
                            {status === 'preview' && (
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center justify-center gap-3 mb-4 px-6 py-3 rounded-full"
                                    style={{
                                        background: 'linear-gradient(135deg, #818CF8 0%, #6366F1 100%)',
                                        boxShadow: '0 4px 20px rgba(129, 140, 248, 0.4)'
                                    }}
                                >
                                    <Timer size={20} className="animate-pulse" />
                                    <span className="font-bold">Ezberle: {previewTimer}s</span>
                                </motion.div>
                            )}

                            {/* Grid */}
                            <div
                                className="grid grid-cols-4 gap-3 p-6 rounded-3xl"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}
                            >
                                {cards.map((card, i) => (
                                    <motion.button
                                        key={card.id}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: i * 0.03 }}
                                        onClick={() => handleCardClick(i)}
                                        disabled={status === 'preview' || card.isRevealed || feedbackState !== null}
                                        className="aspect-square rounded-2xl flex items-center justify-center font-bold text-2xl transition-all"
                                        style={{
                                            background: card.isRevealed
                                                ? 'linear-gradient(135deg, #818CF8 0%, #6366F1 100%)'
                                                : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                                            boxShadow: card.isRevealed
                                                ? '0 0 20px rgba(129, 140, 248, 0.4), inset 0 -4px 8px rgba(0,0,0,0.2)'
                                                : 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.05)',
                                            border: card.isRevealed ? '2px solid #818CF8' : '1px solid rgba(255,255,255,0.1)',
                                            color: card.isRevealed ? '#fff' : 'transparent',
                                            cursor: status === 'preview' || card.isRevealed ? 'default' : 'pointer'
                                        }}
                                    >
                                        {card.isRevealed ? card.value : <EyeOff className="text-white/20" size={20} />}
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
                                    background: level >= 7
                                        ? 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)'
                                        : 'linear-gradient(135deg, #818CF8 0%, #EF4444 100%)',
                                    boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)'
                                }}
                                animate={{ rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <Trophy size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h2 className="text-3xl font-black text-indigo-300 mb-2">
                                {level >= 7 ? '🎉 Harika!' : 'Oyun Bitti!'}
                            </h2>
                            <p className="text-slate-400 mb-6">
                                {level >= 7 ? 'Hesaplama ustasısın!' : 'Tekrar deneyelim!'}
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
                                        <p className="text-slate-400 text-sm">Seviye</p>
                                        <p className="text-3xl font-bold text-indigo-400">{level}</p>
                                    </div>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={startGame}
                                className="w-full px-6 py-4 rounded-2xl font-bold text-lg mb-4"
                                style={{
                                    background: 'linear-gradient(135deg, #818CF8 0%, #6366F1 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(129, 140, 248, 0.4)'
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
        </div>
    );
};

export default TargetGridGame;
