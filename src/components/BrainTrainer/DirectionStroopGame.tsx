import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RotateCcw, Play, Star, Target, ChevronLeft, Zap, Compass, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Heart, Sparkles, Eye } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';

interface Round {
    word: string;
    position: 'left' | 'right' | 'top' | 'bottom';
    correctAnswer: string;
}

const DIRECTIONS = [
    { word: 'SOL', position: 'left' as const, turkishName: 'Sol' },
    { word: 'SAĞ', position: 'right' as const, turkishName: 'Sağ' },
    { word: 'YUKARI', position: 'top' as const, turkishName: 'Yukarı' },
    { word: 'AŞAĞI', position: 'bottom' as const, turkishName: 'Aşağı' },
];

// Child-friendly messages


const DirectionStroopGame: React.FC = () => {
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
    const [reactionTimes, setReactionTimes] = useState<number[]>([]);    const [streak, setStreak] = useState(0);
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
        const wordIndex = Math.floor(Math.random() * DIRECTIONS.length);
        const word = DIRECTIONS[wordIndex].word;

        let positionIndex;
        do {
            positionIndex = Math.floor(Math.random() * DIRECTIONS.length);
        } while (positionIndex === wordIndex);

        const position = DIRECTIONS[positionIndex].position;
        const correctAnswer = DIRECTIONS[positionIndex].turkishName;

        return { word, position, correctAnswer };
    }, []);

    // Start game
    const startGame = useCallback(() => {
        setGameState('playing');
        setRoundNumber(1);
        setScore(0);
        setLives(3);
        setCorrectCount(0);
        setWrongCount(0);
        setReactionTimes([]);
        setStreak(0);
        setBestStreak(0);
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
                game_id: 'stroop-yon',
                score_achieved: score,
                duration_seconds: durationSeconds,
                metadata: {
                    correct_count: correctCount,
                    wrong_count: wrongCount,
                    best_streak: bestStreak,
                    average_reaction_ms: avgReaction,
                    total_rounds: totalRounds,
                    accuracy: correctCount + wrongCount > 0 ? Math.round((correctCount / (correctCount + wrongCount)) * 100) : 0,
                    game_name: 'Yön Stroop',
                }
            });
        }
    }, [gameState, score, correctCount, wrongCount, bestStreak, reactionTimes, saveGamePlay]);

    // Handle answer
    const handleAnswer = useCallback((position: string) => {
        if (!currentRound || feedbackState) return;

        const reactionTime = Date.now() - roundStartTime;
        setReactionTimes(prev => [...prev, reactionTime]);

        const isCorrect = position === currentRound.position;

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

        // Next round after feedbackState
        setTimeout(() => {

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

    // Get position style for word placement
    const getPositionStyle = (position: string) => {
        switch (position) {
            case 'left': return 'justify-start items-center pl-8';
            case 'right': return 'justify-end items-center pr-8';
            case 'top': return 'justify-center items-start pt-8';
            case 'bottom': return 'justify-center items-end pb-8';
            default: return 'justify-center items-center';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-cyan-950 to-teal-950 text-white">
            {/* Decorative Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
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
                                    background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(20, 184, 166, 0.1) 100%)',
                                    boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(6, 182, 212, 0.3)'
                                }}
                            >
                                <Target className="text-cyan-400" size={18} />
                                <span className="font-bold text-cyan-400">{roundNumber}/{totalRounds}</span>
                            </div>

                            {/* Streak */}
                            {streak > 1 && (
                                <div
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)',
                                        boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                                        border: '1px solid rgba(20, 184, 166, 0.3)'
                                    }}
                                >
                                    <Zap className="text-teal-400" size={18} />
                                    <span className="font-bold text-teal-400">x{streak}</span>
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
                                    background: 'linear-gradient(135deg, #06B6D4 0%, #14B8A6 100%)',
                                    boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)'
                                }}
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Compass size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                                🧭 Yön Stroop
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
                                <div className="bg-slate-800/50 rounded-lg p-4 h-20 flex justify-end items-center mb-2">
                                    <p className="text-3xl font-black text-cyan-400">SOL</p>
                                </div>
                                <p className="text-slate-400 text-sm">Doğru cevap: <span className="text-teal-400 font-bold">Sağ</span> (yazının konumu)</p>
                            </div>

                            {/* Instructions */}
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                                <h3 className="text-lg font-bold text-cyan-300 mb-3 flex items-center gap-2">
                                    <Eye size={20} /> Nasıl Oynanır?
                                </h3>
                                <ul className="space-y-2 text-slate-300 text-sm">
                                    <li className="flex items-center gap-2">
                                        <Sparkles size={14} className="text-teal-400" />
                                        <span>Kelimeyi değil, <strong>konumunu</strong> seç!</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Sparkles size={14} className="text-teal-400" />
                                        <span>Hızlı ol, daha çok puan kazan</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Sparkles size={14} className="text-teal-400" />
                                        <span>{totalRounds} soru, uzamsal dikkatini test et!</span>
                                    </li>
                                </ul>
                            </div>

                            {/* TUZÖ Badge */}
                            <div className="bg-cyan-500/10 text-cyan-300 text-xs px-4 py-2 rounded-full mb-6 inline-block border border-cyan-500/30">
                                TUZÖ 5.2.2 Uzamsal Dikkat
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05, y: -4 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={startGame}
                                className="px-8 py-4 rounded-2xl font-bold text-lg"
                                style={{
                                    background: 'linear-gradient(135deg, #06B6D4 0%, #14B8A6 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(6, 182, 212, 0.4)'
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <Play size={24} fill="currentColor" />
                                    <span>Teste Başla</span>
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
                            className="w-full max-w-lg"
                        >
                            {/* Word Display */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={roundNumber}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className={`w-full h-64 rounded-3xl flex ${getPositionStyle(currentRound.position)} mb-6`}
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                        boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.2)',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}
                                >
                                    <motion.h2
                                        className="text-5xl lg:text-7xl font-black text-cyan-400"
                                        animate={{ scale: [1, 1.02, 1] }}
                                        transition={{ duration: 0.5, repeat: Infinity }}
                                    >
                                        {currentRound.word}
                                    </motion.h2>
                                </motion.div>
                            </AnimatePresence>

                            <p className="text-slate-400 text-sm text-center mb-6">Yazı ekranın neresinde?</p>

                            {/* Direction Buttons */}
                            <div className="grid grid-cols-3 gap-3">
                                {/* Top */}
                                <div />
                                <motion.button
                                    whileHover={{ scale: 0.98, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleAnswer('top')}
                                    disabled={feedbackState !== null}
                                    className="py-4 px-4 text-lg font-bold rounded-[25%] flex items-center justify-center gap-2"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                                        boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.1)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        cursor: feedbackState ? 'default' : 'pointer'
                                    }}
                                >
                                    <ArrowUp size={24} />
                                    Yukarı
                                </motion.button>
                                <div />

                                {/* Left & Right */}
                                <motion.button
                                    whileHover={{ scale: 0.98, x: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleAnswer('left')}
                                    disabled={feedbackState !== null}
                                    className="py-4 px-4 text-lg font-bold rounded-[25%] flex items-center justify-center gap-2"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                                        boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.1)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        cursor: feedbackState ? 'default' : 'pointer'
                                    }}
                                >
                                    <ArrowLeft size={24} />
                                    Sol
                                </motion.button>
                                <div />
                                <motion.button
                                    whileHover={{ scale: 0.98, x: 2 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleAnswer('right')}
                                    disabled={feedbackState !== null}
                                    className="py-4 px-4 text-lg font-bold rounded-[25%] flex items-center justify-center gap-2"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                                        boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.1)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        cursor: feedbackState ? 'default' : 'pointer'
                                    }}
                                >
                                    Sağ
                                    <ArrowRight size={24} />
                                </motion.button>

                                {/* Bottom */}
                                <div />
                                <motion.button
                                    whileHover={{ scale: 0.98, y: 2 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleAnswer('bottom')}
                                    disabled={feedbackState !== null}
                                    className="py-4 px-4 text-lg font-bold rounded-[25%] flex items-center justify-center gap-2"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                                        boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.1)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        cursor: feedbackState ? 'default' : 'pointer'
                                    }}
                                >
                                    <ArrowDown size={24} />
                                    Aşağı
                                </motion.button>
                                <div />
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
                                {accuracy >= 80 ? '🎉 Harika!' : 'Test Tamamlandı!'}
                            </h2>
                            <p className="text-slate-400 mb-6">
                                {accuracy >= 80 ? 'Muhteşem uzamsal dikkat!' : 'Biraz daha pratik yap!'}
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
                                        <p className="text-3xl font-bold text-cyan-400">x{bestStreak}</p>
                                    </div>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={startGame}
                                className="w-full px-6 py-4 rounded-2xl font-bold text-lg mb-4"
                                style={{
                                    background: 'linear-gradient(135deg, #06B6D4 0%, #14B8A6 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(6, 182, 212, 0.4)'
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

export default DirectionStroopGame;
