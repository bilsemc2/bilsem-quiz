import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RotateCcw, Play, Star, Timer, Target, CheckCircle2, XCircle, ChevronLeft, Zap, Smile } from 'lucide-react';
import { Link } from 'react-router-dom';

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

const EmojiStroopGame: React.FC = () => {
    const [gameState, setGameState] = useState<'idle' | 'playing' | 'finished'>('idle');
    const [currentRound, setCurrentRound] = useState<Round | null>(null);
    const [roundNumber, setRoundNumber] = useState(0);
    const [score, setScore] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [wrongCount, setWrongCount] = useState(0);
    const [totalTime, setTotalTime] = useState(0);
    const [roundStartTime, setRoundStartTime] = useState(0);
    const [reactionTimes, setReactionTimes] = useState<number[]>([]);
    const [showFeedback, setShowFeedback] = useState<'correct' | 'wrong' | null>(null);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const totalRounds = 15;
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Generate a new round
    const generateRound = useCallback((): Round => {
        // Pick a random emoji
        const emojiIndex = Math.floor(Math.random() * EMOTIONS.length);
        const emoji = EMOTIONS[emojiIndex].emoji;
        const correctAnswer = EMOTIONS[emojiIndex].name;

        // Pick a DIFFERENT word (different emotion name)
        let wordIndex;
        do {
            wordIndex = Math.floor(Math.random() * EMOTIONS.length);
        } while (wordIndex === emojiIndex);

        const word = EMOTIONS[wordIndex].word;

        // Generate options (including correct answer)
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
        setGameState('playing');
        setRoundNumber(1);
        setScore(0);
        setCorrectCount(0);
        setWrongCount(0);
        setTotalTime(0);
        setReactionTimes([]);
        setStreak(0);
        setBestStreak(0);
        const round = generateRound();
        setCurrentRound(round);
        setRoundStartTime(Date.now());
    }, [generateRound]);

    // Handle answer
    const handleAnswer = useCallback((answer: string) => {
        if (!currentRound || showFeedback) return;

        const reactionTime = Date.now() - roundStartTime;
        setReactionTimes(prev => [...prev, reactionTime]);

        const isCorrect = answer === currentRound.correctAnswer;

        if (isCorrect) {
            setShowFeedback('correct');
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
            setShowFeedback('wrong');
            setWrongCount(prev => prev + 1);
            setStreak(0);
        }

        setTimeout(() => {
            setShowFeedback(null);

            if (roundNumber >= totalRounds) {
                setGameState('finished');
                setTotalTime(Date.now() - roundStartTime + reactionTimes.reduce((a, b) => a + b, 0));
            } else {
                setRoundNumber(prev => prev + 1);
                const round = generateRound();
                setCurrentRound(round);
                setRoundStartTime(Date.now());
            }
        }, 600);
    }, [currentRound, roundStartTime, roundNumber, totalRounds, streak, bestStreak, generateRound, reactionTimes, showFeedback]);

    // Timer
    useEffect(() => {
        if (gameState === 'playing') {
            timerRef.current = setInterval(() => {
                setTotalTime(prev => prev + 100);
            }, 100);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [gameState]);

    const averageReactionTime = reactionTimes.length > 0
        ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
        : 0;

    const accuracy = correctCount + wrongCount > 0
        ? Math.round((correctCount / (correctCount + wrongCount)) * 100)
        : 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-100 dark:from-slate-900 dark:via-purple-950 dark:to-slate-900 pt-24 pb-12 px-6">
            <div className="container mx-auto max-w-4xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <Link
                        to="/atolyeler/bireysel-degerlendirme"
                        className="inline-flex items-center gap-2 text-pink-500 font-bold hover:text-pink-400 transition-colors mb-4 uppercase text-xs tracking-widest"
                    >
                        <ChevronLeft size={16} />
                        Bireysel Değerlendirme
                    </Link>
                    <h1 className="text-4xl lg:text-5xl font-black text-gray-800 dark:text-white mb-2">
                        😊 <span className="text-pink-500">Emoji</span> Stroop
                    </h1>
                    <p className="text-gray-600 dark:text-slate-400">Emojiyi tanı, yazıya aldanma!</p>
                </motion.div>

                {/* Stats */}
                <div className="flex justify-center gap-4 mb-8 flex-wrap">
                    <div className="bg-white/80 dark:bg-slate-800/50 border border-pink-200 dark:border-white/10 rounded-xl px-5 py-2 flex items-center gap-2 shadow-sm">
                        <Star className="w-5 h-5 text-amber-400" />
                        <span className="text-gray-800 dark:text-white font-bold">{score}</span>
                    </div>
                    {gameState === 'playing' && (
                        <>
                            <div className="bg-white/80 dark:bg-slate-800/50 border border-pink-200 dark:border-white/10 rounded-xl px-5 py-2 flex items-center gap-2 shadow-sm">
                                <Target className="w-5 h-5 text-pink-500" />
                                <span className="text-gray-800 dark:text-white font-bold">{roundNumber}/{totalRounds}</span>
                            </div>
                            <div className="bg-white/80 dark:bg-slate-800/50 border border-pink-200 dark:border-white/10 rounded-xl px-5 py-2 flex items-center gap-2 shadow-sm">
                                <Zap className="w-5 h-5 text-amber-400" />
                                <span className="text-gray-800 dark:text-white font-bold">x{streak}</span>
                            </div>
                            <div className="bg-white/80 dark:bg-slate-800/50 border border-pink-200 dark:border-white/10 rounded-xl px-5 py-2 flex items-center gap-2 shadow-sm">
                                <Timer className="w-5 h-5 text-emerald-500" />
                                <span className="text-gray-800 dark:text-white font-bold">{Math.floor(totalTime / 1000)}s</span>
                            </div>
                        </>
                    )}
                </div>

                {/* Game Area */}
                <div className="flex flex-col items-center">
                    {gameState === 'idle' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center space-y-6"
                        >
                            <div className="bg-white/90 dark:bg-slate-800/50 border border-pink-200 dark:border-white/10 rounded-3xl p-8 max-w-md shadow-xl">
                                <div className="text-7xl mb-4 animate-bounce">😊</div>
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Emoji Stroop Oyunu</h2>

                                <div className="bg-gradient-to-r from-pink-100 to-purple-100 dark:from-slate-700/50 dark:to-slate-700/50 rounded-xl p-4 mb-6">
                                    <p className="text-gray-600 dark:text-slate-300 text-sm mb-3">Örnek:</p>
                                    <div className="flex items-center justify-center gap-4 mb-2">
                                        <span className="text-6xl">😊</span>
                                        <span className="text-3xl font-black text-gray-800 dark:text-white">ÜZGÜN</span>
                                    </div>
                                    <p className="text-gray-500 dark:text-slate-400 text-sm">Doğru cevap: <span className="text-pink-500 font-bold">Mutlu</span> (emoji ne gösteriyor)</p>
                                </div>

                                <ul className="text-gray-600 dark:text-slate-400 text-sm space-y-2 text-left mb-6">
                                    <li className="flex items-center gap-2">
                                        <Smile className="w-4 h-4 text-pink-500" />
                                        Yazıya değil, <strong className="text-gray-800 dark:text-white">emojiye</strong> bak!
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-amber-400" />
                                        Hızlı ol, daha çok puan kazan!
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Target className="w-4 h-4 text-emerald-500" />
                                        {totalRounds} soru, eğlenerek öğren!
                                    </li>
                                </ul>
                                <button
                                    onClick={startGame}
                                    className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold rounded-xl hover:from-pink-400 hover:to-purple-400 transition-all flex items-center gap-3 mx-auto shadow-lg hover:shadow-xl transform hover:scale-105"
                                >
                                    <Play className="w-5 h-5" />
                                    Oynamaya Başla!
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {gameState === 'playing' && currentRound && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center gap-8 w-full max-w-lg"
                        >
                            {/* Emoji Display */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={roundNumber}
                                    initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                    exit={{ opacity: 0, scale: 0.5, rotate: 10 }}
                                    className={`bg-white/90 dark:bg-slate-800/80 border-4 rounded-3xl p-8 w-full text-center shadow-xl ${showFeedback === 'correct' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' :
                                            showFeedback === 'wrong' ? 'border-red-500 bg-red-50 dark:bg-red-500/10' :
                                                'border-pink-300 dark:border-white/10'
                                        } transition-all`}
                                >
                                    <p className="text-gray-500 dark:text-slate-400 text-sm mb-4">Bu emoji ne hissediyor?</p>
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
                                    <p className="text-3xl lg:text-4xl font-black text-gray-800 dark:text-white">
                                        {currentRound.word}
                                    </p>
                                </motion.div>
                            </AnimatePresence>

                            {/* Options */}
                            <div className="grid grid-cols-2 gap-4 w-full">
                                {currentRound.options.map((option, index) => (
                                    <motion.button
                                        key={option}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        onClick={() => handleAnswer(option)}
                                        disabled={showFeedback !== null}
                                        className={`py-5 px-4 text-xl font-bold rounded-2xl transition-all shadow-md ${showFeedback && option === currentRound.correctAnswer
                                                ? 'bg-emerald-500 text-white scale-105'
                                                : showFeedback === 'wrong' && option !== currentRound.correctAnswer
                                                    ? 'bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-slate-500'
                                                    : 'bg-white dark:bg-slate-800 border-2 border-pink-200 dark:border-white/10 text-gray-800 dark:text-white hover:bg-pink-50 dark:hover:bg-slate-700 hover:border-pink-400 dark:hover:border-pink-500/50 active:scale-95'
                                            }`}
                                    >
                                        {option}
                                    </motion.button>
                                ))}
                            </div>

                            {/* Feedback */}
                            <AnimatePresence>
                                {showFeedback && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.8 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        className={`flex items-center gap-2 font-bold text-lg ${showFeedback === 'correct' ? 'text-emerald-500' : 'text-red-500'
                                            }`}
                                    >
                                        {showFeedback === 'correct' ? (
                                            <>
                                                <CheckCircle2 className="w-8 h-8" />
                                                Harika! 🎉
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="w-8 h-8" />
                                                Doğrusu: {currentRound.correctAnswer}
                                            </>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}

                    {gameState === 'finished' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center space-y-6 w-full max-w-md"
                        >
                            <div className="bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-500/20 dark:to-purple-500/20 border border-pink-300 dark:border-pink-500/30 rounded-3xl p-8 shadow-xl">
                                <motion.div
                                    animate={{ rotate: [0, 10, -10, 0] }}
                                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                                >
                                    <Trophy className="w-20 h-20 text-amber-400 mx-auto mb-4" />
                                </motion.div>
                                <h2 className="text-3xl font-black text-gray-800 dark:text-white mb-2">Tebrikler! 🎊</h2>

                                <div className="grid grid-cols-2 gap-4 my-6">
                                    <div className="bg-white/80 dark:bg-slate-800/50 rounded-xl p-4 shadow">
                                        <p className="text-gray-500 dark:text-slate-400 text-sm">Puan</p>
                                        <p className="text-2xl font-black text-amber-500">{score}</p>
                                    </div>
                                    <div className="bg-white/80 dark:bg-slate-800/50 rounded-xl p-4 shadow">
                                        <p className="text-gray-500 dark:text-slate-400 text-sm">Başarı</p>
                                        <p className="text-2xl font-black text-emerald-500">%{accuracy}</p>
                                    </div>
                                    <div className="bg-white/80 dark:bg-slate-800/50 rounded-xl p-4 shadow">
                                        <p className="text-gray-500 dark:text-slate-400 text-sm">Ortalama</p>
                                        <p className="text-2xl font-black text-blue-500">{averageReactionTime}ms</p>
                                    </div>
                                    <div className="bg-white/80 dark:bg-slate-800/50 rounded-xl p-4 shadow">
                                        <p className="text-gray-500 dark:text-slate-400 text-sm">En İyi Seri</p>
                                        <p className="text-2xl font-black text-pink-500">x{bestStreak}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-slate-400 mb-6">
                                    <span className="text-2xl">✅</span>
                                    <span>{correctCount} Doğru</span>
                                    <span className="text-gray-400">|</span>
                                    <span className="text-2xl">❌</span>
                                    <span>{wrongCount} Yanlış</span>
                                </div>

                                <div className="flex justify-center gap-4">
                                    <button
                                        onClick={startGame}
                                        className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold rounded-xl hover:from-pink-400 hover:to-purple-400 transition-all flex items-center gap-2 shadow-lg"
                                    >
                                        <RotateCcw className="w-5 h-5" />
                                        Tekrar!
                                    </button>
                                    <Link
                                        to="/atolyeler/bireysel-degerlendirme"
                                        className="px-6 py-3 bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-white font-bold rounded-xl hover:bg-gray-300 dark:hover:bg-slate-600 transition-all"
                                    >
                                        Geri Dön
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmojiStroopGame;
