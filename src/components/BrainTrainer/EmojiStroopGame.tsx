import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RotateCcw, Play, Star, Target, ChevronLeft, Zap, Smile, Heart, Sparkles, Eye } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';

interface Round {
    emoji: string;
    word: string;
    correctAnswer: string;
    options: string[];
}

const EMOTIONS = [
    { emoji: '😊', name: 'Mutlu', word: 'MUTLU' },
    { emoji: '😢', name: 'Üzgün', word: 'ÜZGÜN' },
    { emoji: '😠', name: 'Kızgın', word: 'KIZGIN' },
    { emoji: '😨', name: 'Korkmuş', word: 'KORKMUŞ' },
    { emoji: '😮', name: 'Şaşkın', word: 'ŞAŞKIN' },
    { emoji: '😴', name: 'Uykulu', word: 'UYKULU' },
    { emoji: '🤔', name: 'Düşünceli', word: 'DÜŞÜNCELİ' },
    { emoji: '😍', name: 'Aşık', word: 'AŞIK' },
];

// Child-friendly messages


const EmojiStroopGame: React.FC = () => {
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
    const totalRounds = 15;

    // Back link
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    // Generate a new round
    const generateRound = useCallback((): Round => {
        const emojiIndex = Math.floor(Math.random() * EMOTIONS.length);
        const emoji = EMOTIONS[emojiIndex].emoji;
        const correctAnswer = EMOTIONS[emojiIndex].name;

        let wordIndex;
        do {
            wordIndex = Math.floor(Math.random() * EMOTIONS.length);
        } while (wordIndex === emojiIndex);

        const word = EMOTIONS[wordIndex].word;

        const options = new Set<string>([correctAnswer]);
        while (options.size < 4) {
            const randomEmotion = EMOTIONS[Math.floor(Math.random() * EMOTIONS.length)];
            options.add(randomEmotion.name);
        }

        return {
            emoji,
            word,
            correctAnswer,
            options: Array.from(options).sort(() => Math.random() - 0.5)
        };
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
                game_id: 'stroop-emoji',
                score_achieved: score,
                duration_seconds: durationSeconds,
                metadata: {
                    correct_count: correctCount,
                    wrong_count: wrongCount,
                    best_streak: bestStreak,
                    average_reaction_ms: avgReaction,
                    total_rounds: totalRounds,
                    accuracy: correctCount + wrongCount > 0 ? Math.round((correctCount / (correctCount + wrongCount)) * 100) : 0,
                    game_name: 'Emoji Stroop',
                }
            });
        }
    }, [gameState, score, correctCount, wrongCount, bestStreak, reactionTimes, saveGamePlay]);

    // Handle answer
    const handleAnswer = useCallback((answer: string) => {
        if (!currentRound || feedbackState) return;

        const reactionTime = Date.now() - roundStartTime;
        setReactionTimes(prev => [...prev, reactionTime]);

        const isCorrect = answer === currentRound.correctAnswer;

        if (isCorrect) {
            showFeedback(true);
            setCorrectCount(prev => prev + 1);
            setStreak(prev => {
                const newStreak = prev + 1;
                if (newStreak > bestStreak) setBestStreak(newStreak);
                return newStreak;
            });

            const timeBonus = Math.max(0, Math.floor((3000 - reactionTime) / 100));
            const streakBonus = streak * 10;
            setScore(prev => prev + 100 + timeBonus + streakBonus);
        } else {
            showFeedback(false);
            setWrongCount(prev => prev + 1);
            setStreak(0);
            setLives(prev => prev - 1);
        }

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

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-pink-950 to-rose-950 text-white">
            {/* Decorative Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl" />
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
                                    background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(219, 39, 119, 0.1) 100%)',
                                    boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(236, 72, 153, 0.3)'
                                }}
                            >
                                <Target className="text-pink-400" size={18} />
                                <span className="font-bold text-pink-400">{roundNumber}/{totalRounds}</span>
                            </div>

                            {/* Streak */}
                            {streak > 1 && (
                                <div
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.2) 0%, rgba(225, 29, 72, 0.1) 100%)',
                                        boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                                        border: '1px solid rgba(244, 63, 94, 0.3)'
                                    }}
                                >
                                    <Zap className="text-rose-400" size={18} />
                                    <span className="font-bold text-rose-400">x{streak}</span>
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
                                    background: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
                                    boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)'
                                }}
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Smile size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
                                😊 Emoji Stroop
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
                                <div className="flex items-center justify-center gap-4 mb-2">
                                    <span className="text-6xl">😊</span>
                                    <span className="text-3xl font-black">ÜZGÜN</span>
                                </div>
                                <p className="text-slate-400 text-sm">Doğru cevap: <span className="text-pink-400 font-bold">Mutlu</span> (emoji ne gösteriyor)</p>
                            </div>

                            {/* Instructions */}
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                                <h3 className="text-lg font-bold text-pink-300 mb-3 flex items-center gap-2">
                                    <Eye size={20} /> Nasıl Oynanır?
                                </h3>
                                <ul className="space-y-2 text-slate-300 text-sm">
                                    <li className="flex items-center gap-2">
                                        <Sparkles size={14} className="text-rose-400" />
                                        <span>Yazıya değil, <strong>emojiye</strong> bak!</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Sparkles size={14} className="text-rose-400" />
                                        <span>Hızlı ol, daha çok puan kazan</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Sparkles size={14} className="text-rose-400" />
                                        <span>{totalRounds} soru, eğlenerek öğren!</span>
                                    </li>
                                </ul>
                            </div>

                            {/* TUZÖ Badge */}
                            <div className="bg-pink-500/10 text-pink-300 text-xs px-4 py-2 rounded-full mb-6 inline-block border border-pink-500/30">
                                TUZÖ 5.2.3 Duygusal Dikkat
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05, y: -4 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={startGame}
                                className="px-8 py-4 rounded-2xl font-bold text-lg"
                                style={{
                                    background: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(236, 72, 153, 0.4)'
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <Play size={24} fill="currentColor" />
                                    <span>Oynamaya Başla!</span>
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
                            {/* Emoji Display */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={roundNumber}
                                    initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                    exit={{ opacity: 0, scale: 0.5, rotate: 10 }}
                                    className="text-center mb-8"
                                >
                                    <p className="text-slate-400 text-sm mb-4">Bu emoji ne hissediyor?</p>
                                    <div
                                        className="rounded-3xl p-8"
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                            boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.2)',
                                            border: '1px solid rgba(255,255,255,0.1)'
                                        }}
                                    >
                                        <motion.div
                                            className="text-8xl lg:text-9xl mb-4"
                                            animate={{
                                                scale: [1, 1.1, 1],
                                                rotate: [0, 5, -5, 0]
                                            }}
                                            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                                        >
                                            {currentRound.emoji}
                                        </motion.div>
                                        <p className="text-3xl lg:text-4xl font-black">
                                            {currentRound.word}
                                        </p>
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            {/* Options */}
                            <div className="grid grid-cols-2 gap-3">
                                {currentRound.options.map((option, index) => (
                                    <motion.button
                                        key={option}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        onClick={() => handleAnswer(option)}
                                        disabled={feedbackState !== null}
                                        whileHover={!feedbackState ? { scale: 0.98, y: -2 } : {}}
                                        whileTap={!feedbackState ? { scale: 0.95 } : {}}
                                        className="py-5 px-4 text-xl font-bold rounded-[25%] transition-all"
                                        style={{
                                            background: feedbackState && option === currentRound.correctAnswer
                                                ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                                                : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                                            boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.1)',
                                            border: feedbackState && option === currentRound.correctAnswer
                                                ? '2px solid #10B981'
                                                : '1px solid rgba(255,255,255,0.1)',
                                            cursor: feedbackState ? 'default' : 'pointer',
                                            opacity: feedbackState && option !== currentRound.correctAnswer ? 0.5 : 1
                                        }}
                                    >
                                        {option}
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
                                {accuracy >= 80 ? 'Muhteşem duygu okuma!' : 'Biraz daha pratik yap!'}
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
                                        <p className="text-3xl font-bold text-pink-400">x{bestStreak}</p>
                                    </div>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={startGame}
                                className="w-full px-6 py-4 rounded-2xl font-bold text-lg mb-4"
                                style={{
                                    background: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(236, 72, 153, 0.4)'
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

export default EmojiStroopGame;
