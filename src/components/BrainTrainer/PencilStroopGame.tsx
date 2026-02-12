import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RotateCcw, Play, Star, Target, ChevronLeft, Zap, Pencil, Heart, Sparkles, Eye } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';

interface Round {
    textColorName: string;
    textColor: string;
    wrongColorName: string;
    correctPencilColor: string;
}

const COLORS = [
    { name: 'KIRMIZI', color: '#FF6B6B', pencilColor: '#dc2626' },
    { name: 'MAVİ', color: '#4ECDC4', pencilColor: '#2563eb' },
    { name: 'YEŞİL', color: '#6BCB77', pencilColor: '#16a34a' },
    { name: 'SARI', color: '#FFD93D', pencilColor: '#ca8a04' },
    { name: 'TURUNCU', color: '#FFA07A', pencilColor: '#ea580c' },
    { name: 'MOR', color: '#9B59B6', pencilColor: '#9333ea' },
];

// Child-friendly messages


// Gummy Pencil SVG Component
const ColoredPencil: React.FC<{ color: string; isSelected?: boolean; isCorrect?: boolean; isWrong?: boolean }> = ({
    color,
    isSelected,
    isCorrect,
    isWrong
}) => (
    <svg
        viewBox="0 0 100 300"
        className={`w-14 h-40 transition-all duration-200 ${isSelected ? 'scale-110' : 'hover:scale-105'
            } ${isCorrect ? 'drop-shadow-[0_0_20px_rgba(34,197,94,0.8)]' : ''} ${isWrong ? 'opacity-40' : ''}`}
    >
        {/* Pencil body with gummy gradient */}
        <defs>
            <linearGradient id={`pencil-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={color} />
                <stop offset="50%" stopColor={color} stopOpacity="0.9" />
                <stop offset="100%" stopColor={color} stopOpacity="0.7" />
            </linearGradient>
        </defs>
        <rect x="25" y="60" width="50" height="180" fill={`url(#pencil-${color})`} rx="8" />
        {/* Wood part */}
        <polygon points="25,60 50,10 75,60" fill="#d4a574" />
        {/* Lead tip */}
        <polygon points="45,30 50,10 55,30" fill="#374151" />
        {/* Metal band - glassmorphism */}
        <rect x="23" y="230" width="54" height="20" fill="rgba(156, 163, 175, 0.6)" rx="4" />
        {/* Eraser - gummy style */}
        <rect x="23" y="250" width="54" height="30" fill="#F472B6" rx="8" />
        {/* Shine effect */}
        <rect x="30" y="70" width="10" height="150" fill="rgba(255,255,255,0.3)" rx="4" />
    </svg>
);

const PencilStroopGame: React.FC = () => {
    const { saveGamePlay } = useGamePersistence();
    const { feedbackState, showFeedback } = useGameFeedback();
    const location = useLocation();
    const [gameState, setGameState] = useState<'idle' | 'playing' | 'finished'>('idle');
    const [currentRound, setCurrentRound] = useState<Round | null>(null);
    const [roundNumber, setRoundNumber] = useState(0);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [correctCount, setCorrectCount] = useState(0);
    const [wrongCount, setWrongCount] = useState(0);
    const [reactionTimes, setReactionTimes] = useState<number[]>([]);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [roundStartTime, setRoundStartTime] = useState(0);
    const gameStartTimeRef = useRef<number>(0);
    const hasSavedRef = useRef<boolean>(false);
    const totalRounds = 20;

    // Back link
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    // Generate a new round
    const generateRound = useCallback((): Round => {
        const textColorIndex = Math.floor(Math.random() * COLORS.length);
        const textColor = COLORS[textColorIndex].color;
        const textColorName = COLORS[textColorIndex].name;
        const correctPencilColor = COLORS[textColorIndex].pencilColor;

        let wrongColorIndex;
        do {
            wrongColorIndex = Math.floor(Math.random() * COLORS.length);
        } while (wrongColorIndex === textColorIndex);

        const wrongColorName = COLORS[wrongColorIndex].name;

        return { textColorName, textColor, wrongColorName, correctPencilColor };
    }, []);

    // Start game
    const startGame = useCallback(() => {
        window.scrollTo(0, 0);
        setGameState('playing');
        setRoundNumber(1);
        setScore(0);
        setLives(3);
        setCorrectCount(0);
        setWrongCount(0);
        setReactionTimes([]);
        setStreak(0);
        setBestStreak(0);
        setSelectedColor(null);
        gameStartTimeRef.current = Date.now();
        hasSavedRef.current = false;
        const round = generateRound();
        setCurrentRound(round);
        setRoundStartTime(Date.now());
    }, [generateRound]);

    // Auto start from HUB
    useEffect(() => {
        if (location.state?.autoStart && gameState === 'idle') {
            startGame();
        }
    }, [location.state, gameState, startGame]);

    // Save game data on finish
    useEffect(() => {
        if (gameState === 'finished' && gameStartTimeRef.current > 0 && !hasSavedRef.current) {
            hasSavedRef.current = true;
            const durationSeconds = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
            const avgReaction = reactionTimes.length > 0
                ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
                : 0;
            saveGamePlay({
                game_id: 'stroop-kalem',
                score_achieved: score,
                duration_seconds: durationSeconds,
                metadata: {
                    correct_count: correctCount,
                    wrong_count: wrongCount,
                    best_streak: bestStreak,
                    average_reaction_ms: avgReaction,
                    total_rounds: totalRounds,
                    accuracy: correctCount + wrongCount > 0 ? Math.round((correctCount / (correctCount + wrongCount)) * 100) : 0,
                    game_name: 'Renkli Kalemler',
                }
            });
        }
    }, [gameState, score, correctCount, wrongCount, bestStreak, reactionTimes, saveGamePlay]);

    // Handle pencil click
    const handlePencilClick = useCallback((pencilColor: string) => {
        if (!currentRound || feedbackState) return;

        const reactionTime = Date.now() - roundStartTime;
        setReactionTimes(prev => [...prev, reactionTime]);
        setSelectedColor(pencilColor);

        const isCorrect = pencilColor === currentRound.correctPencilColor;

        if (isCorrect) {
            showFeedback(true);
            setCorrectCount(prev => prev + 1);
            setStreak(prev => {
                const newStreak = prev + 1;
                if (newStreak > bestStreak) setBestStreak(newStreak);
                return newStreak;
            });

            const timeBonus = Math.max(0, Math.floor((2500 - reactionTime) / 100));
            const streakBonus = streak * 5;
            setScore(prev => prev + 100 + timeBonus + streakBonus);
        } else {
            showFeedback(false);
            setWrongCount(prev => prev + 1);
            setStreak(0);
            setLives(prev => prev - 1);
        }

        setTimeout(() => {
            setSelectedColor(null);

            if (lives <= 1 && !isCorrect) {
                setGameState('finished');
            } else if (roundNumber >= totalRounds) {
                setGameState('finished');
            } else {
                setRoundNumber(prev => prev + 1);
                const round = generateRound();
                setCurrentRound(round);
                setRoundStartTime(Date.now());
            }
        }, 1200);
    }, [currentRound, roundStartTime, roundNumber, totalRounds, streak, bestStreak, generateRound, feedbackState, lives]);

    const averageReactionTime = reactionTimes.length > 0
        ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
        : 0;

    const accuracy = correctCount + wrongCount > 0
        ? Math.round((correctCount / (correctCount + wrongCount)) * 100)
        : 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-amber-950 to-orange-950 text-white">
            {/* Decorative Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
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

                    {gameState === 'playing' && (
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

                            {/* Progress */}
                            <div
                                className="flex items-center gap-2 px-4 py-2 rounded-xl"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(234, 88, 12, 0.1) 100%)',
                                    boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(249, 115, 22, 0.3)'
                                }}
                            >
                                <Target className="text-orange-400" size={18} />
                                <span className="font-bold text-orange-400">{roundNumber}/{totalRounds}</span>
                            </div>

                            {/* Streak */}
                            {streak > 1 && (
                                <div
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.1) 100%)',
                                        boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                                        border: '1px solid rgba(245, 158, 11, 0.3)'
                                    }}
                                >
                                    <Zap className="text-amber-400" size={18} />
                                    <span className="font-bold text-amber-400">x{streak}</span>
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
                    {gameState === 'idle' && (
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
                                    background: 'linear-gradient(135deg, #F59E0B 0%, #EA580C 100%)',
                                    boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)'
                                }}
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Pencil size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                                ✏️ Renkli Kalemler
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
                                <p className="text-3xl font-black mb-2" style={{ color: '#FF6B6B' }}>
                                    SARI KALEMİ AL
                                </p>
                                <p className="text-slate-400 text-sm">Doğru cevap: <span className="text-red-400 font-bold">Kırmızı kalem</span> (yazının rengi)</p>
                            </div>

                            {/* Instructions */}
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                                <h3 className="text-lg font-bold text-amber-300 mb-3 flex items-center gap-2">
                                    <Eye size={20} /> Nasıl Oynanır?
                                </h3>
                                <ul className="space-y-2 text-slate-300 text-sm">
                                    <li className="flex items-center gap-2">
                                        <Sparkles size={14} className="text-orange-400" />
                                        <span>Yazıda ne dediğine değil, <strong>rengine</strong> bak!</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Sparkles size={14} className="text-orange-400" />
                                        <span>Doğru renkteki kaleme tıkla</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Sparkles size={14} className="text-orange-400" />
                                        <span>{totalRounds} soru, dikkatini topla!</span>
                                    </li>
                                </ul>
                            </div>

                            {/* TUZÖ Badge */}
                            <div className="bg-amber-500/10 text-amber-300 text-xs px-4 py-2 rounded-full mb-6 inline-block border border-amber-500/30">
                                TUZÖ 5.2.1 Seçici Dikkat
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05, y: -4 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={startGame}
                                className="px-8 py-4 rounded-2xl font-bold text-lg"
                                style={{
                                    background: 'linear-gradient(135deg, #F59E0B 0%, #EA580C 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(245, 158, 11, 0.4)'
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <Play size={24} fill="currentColor" />
                                    <span>Oyuna Başla</span>
                                </div>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* Playing */}
                    {gameState === 'playing' && currentRound && (
                        <motion.div
                            key="game"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full max-w-3xl"
                        >
                            {/* Instruction */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={roundNumber}
                                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.8, y: -20 }}
                                    className="text-center mb-8"
                                >
                                    <p className="text-slate-400 text-sm mb-4">Hangi kalemi almalısın?</p>
                                    <div
                                        className="rounded-3xl p-8"
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                            boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.2)',
                                            border: '1px solid rgba(255,255,255,0.1)'
                                        }}
                                    >
                                        <motion.h2
                                            className="text-4xl lg:text-5xl font-black"
                                            style={{ color: currentRound.textColor }}
                                            animate={{ scale: [1, 1.02, 1] }}
                                            transition={{ duration: 0.5, repeat: Infinity }}
                                        >
                                            {currentRound.wrongColorName} KALEMİ AL
                                        </motion.h2>
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            {/* Pencils */}
                            <div className="flex justify-center gap-3 flex-wrap mb-8">
                                {COLORS.map((color, index) => (
                                    <motion.button
                                        key={color.name}
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        onClick={() => handlePencilClick(color.pencilColor)}
                                        disabled={feedbackState !== null}
                                        whileHover={!feedbackState ? { scale: 1.1, y: -8 } : {}}
                                        whileTap={!feedbackState ? { scale: 0.95 } : {}}
                                        className="focus:outline-none"
                                    >
                                        <ColoredPencil
                                            color={color.pencilColor}
                                            isSelected={selectedColor === color.pencilColor}
                                            isCorrect={feedbackState?.correct === true && color.pencilColor === currentRound.correctPencilColor}
                                            isWrong={feedbackState ? color.pencilColor !== currentRound.correctPencilColor : undefined}
                                        />
                                        <p className="text-center text-xs font-bold text-slate-400 mt-1">
                                            {color.name}
                                        </p>
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Game Over */}
                    {gameState === 'finished' && (
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
                                    background: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
                                    boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)'
                                }}
                                animate={{ rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <Trophy size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h2 className="text-3xl font-black text-amber-300 mb-2">
                                {accuracy >= 80 ? '🎉 Tebrikler!' : 'Oyun Bitti!'}
                            </h2>
                            <p className="text-slate-400 mb-6">
                                {accuracy >= 80 ? 'Muhteşem renk dikkatı!' : 'Biraz daha pratik yap!'}
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
                                        <p className="text-slate-400 text-sm">Doğruluk</p>
                                        <p className="text-3xl font-bold text-emerald-400">%{accuracy}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Ort. Tepki</p>
                                        <p className="text-3xl font-bold text-blue-400">{averageReactionTime}ms</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">En İyi Seri</p>
                                        <p className="text-3xl font-bold text-orange-400">x{bestStreak}</p>
                                    </div>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={startGame}
                                className="w-full px-6 py-4 rounded-2xl font-bold text-lg mb-4"
                                style={{
                                    background: 'linear-gradient(135deg, #F59E0B 0%, #EA580C 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(245, 158, 11, 0.4)'
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

export default PencilStroopGame;

