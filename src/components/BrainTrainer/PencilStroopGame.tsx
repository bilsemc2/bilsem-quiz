import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RotateCcw, Play, Star, Timer, Target, CheckCircle2, XCircle, ChevronLeft, Zap, Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Round {
    textColorName: string;
    textColor: string;
    wrongColorName: string;
    correctPencilColor: string;
}

const COLORS = [
    { name: 'KIRMIZI', color: '#ef4444', pencilColor: '#dc2626' },
    { name: 'MAVİ', color: '#3b82f6', pencilColor: '#2563eb' },
    { name: 'YEŞİL', color: '#22c55e', pencilColor: '#16a34a' },
    { name: 'SARI', color: '#eab308', pencilColor: '#ca8a04' },
    { name: 'TURUNCU', color: '#f97316', pencilColor: '#ea580c' },
    { name: 'MOR', color: '#a855f7', pencilColor: '#9333ea' },
];

// Pencil SVG Component
const ColoredPencil: React.FC<{ color: string; isSelected?: boolean; isCorrect?: boolean; isWrong?: boolean }> = ({
    color,
    isSelected,
    isCorrect,
    isWrong
}) => (
    <svg
        viewBox="0 0 100 300"
        className={`w-16 h-48 transition-all duration-200 ${isSelected ? 'scale-110' : 'hover:scale-105'
            } ${isCorrect ? 'drop-shadow-[0_0_20px_rgba(34,197,94,0.8)]' : ''} ${isWrong ? 'opacity-40' : ''}`}
    >
        {/* Pencil body */}
        <rect x="25" y="60" width="50" height="180" fill={color} rx="3" />
        {/* Wood part */}
        <polygon points="25,60 50,10 75,60" fill="#d4a574" />
        {/* Lead tip */}
        <polygon points="45,30 50,10 55,30" fill="#374151" />
        {/* Metal band */}
        <rect x="23" y="230" width="54" height="20" fill="#9ca3af" rx="2" />
        {/* Eraser */}
        <rect x="23" y="250" width="54" height="30" fill="#f472b6" rx="5" />
        {/* Shine effect */}
        <rect x="30" y="70" width="8" height="150" fill="rgba(255,255,255,0.2)" rx="2" />
    </svg>
);

const PencilStroopGame: React.FC = () => {
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
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const totalRounds = 20;
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Generate a new round
    const generateRound = useCallback((): Round => {
        // Pick the color the text will BE (this is the correct answer)
        const textColorIndex = Math.floor(Math.random() * COLORS.length);
        const textColor = COLORS[textColorIndex].color;
        const textColorName = COLORS[textColorIndex].name;
        const correctPencilColor = COLORS[textColorIndex].pencilColor;

        // Pick a DIFFERENT color name for the text to SAY (this is the trap)
        let wrongColorIndex;
        do {
            wrongColorIndex = Math.floor(Math.random() * COLORS.length);
        } while (wrongColorIndex === textColorIndex);

        const wrongColorName = COLORS[wrongColorIndex].name;

        return {
            textColorName,
            textColor,
            wrongColorName,
            correctPencilColor
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
        setSelectedColor(null);
        const round = generateRound();
        setCurrentRound(round);
        setRoundStartTime(Date.now());
    }, [generateRound]);

    // Handle pencil click
    const handlePencilClick = useCallback((pencilColor: string) => {
        if (!currentRound || showFeedback) return;

        const reactionTime = Date.now() - roundStartTime;
        setReactionTimes(prev => [...prev, reactionTime]);
        setSelectedColor(pencilColor);

        const isCorrect = pencilColor === currentRound.correctPencilColor;

        if (isCorrect) {
            setShowFeedback('correct');
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
            setShowFeedback('wrong');
            setWrongCount(prev => prev + 1);
            setStreak(0);
        }

        setTimeout(() => {
            setShowFeedback(null);
            setSelectedColor(null);

            if (roundNumber >= totalRounds) {
                setGameState('finished');
                setTotalTime(Date.now() - roundStartTime + reactionTimes.reduce((a, b) => a + b, 0));
            } else {
                setRoundNumber(prev => prev + 1);
                const round = generateRound();
                setCurrentRound(round);
                setRoundStartTime(Date.now());
            }
        }, 700);
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
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-slate-900 dark:via-amber-950 dark:to-slate-900 pt-24 pb-12 px-6">
            <div className="container mx-auto max-w-5xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <Link
                        to="/atolyeler/bireysel-degerlendirme"
                        className="inline-flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold hover:text-amber-500 transition-colors mb-4 uppercase text-xs tracking-widest"
                    >
                        <ChevronLeft size={16} />
                        Bireysel Değerlendirme
                    </Link>
                    <h1 className="text-4xl lg:text-5xl font-black text-gray-800 dark:text-white mb-2">
                        ✏️ <span className="text-amber-600 dark:text-amber-400">Renkli Kalemler</span>
                    </h1>
                    <p className="text-gray-600 dark:text-slate-400">Yazının rengindeki kalemi seç!</p>
                </motion.div>

                {/* Stats */}
                <div className="flex justify-center gap-4 mb-8 flex-wrap">
                    <div className="bg-white/80 dark:bg-slate-800/50 border border-amber-200 dark:border-white/10 rounded-xl px-5 py-2 flex items-center gap-2 shadow-sm">
                        <Star className="w-5 h-5 text-amber-500" />
                        <span className="text-gray-800 dark:text-white font-bold">{score}</span>
                    </div>
                    {gameState === 'playing' && (
                        <>
                            <div className="bg-white/80 dark:bg-slate-800/50 border border-amber-200 dark:border-white/10 rounded-xl px-5 py-2 flex items-center gap-2 shadow-sm">
                                <Target className="w-5 h-5 text-amber-600" />
                                <span className="text-gray-800 dark:text-white font-bold">{roundNumber}/{totalRounds}</span>
                            </div>
                            <div className="bg-white/80 dark:bg-slate-800/50 border border-amber-200 dark:border-white/10 rounded-xl px-5 py-2 flex items-center gap-2 shadow-sm">
                                <Zap className="w-5 h-5 text-amber-500" />
                                <span className="text-gray-800 dark:text-white font-bold">x{streak}</span>
                            </div>
                            <div className="bg-white/80 dark:bg-slate-800/50 border border-amber-200 dark:border-white/10 rounded-xl px-5 py-2 flex items-center gap-2 shadow-sm">
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
                            <div className="bg-white/90 dark:bg-slate-800/50 border border-amber-200 dark:border-white/10 rounded-3xl p-8 max-w-lg shadow-xl">
                                <div className="flex justify-center gap-2 mb-4">
                                    {COLORS.slice(0, 4).map((c, i) => (
                                        <motion.div
                                            key={c.name}
                                            initial={{ y: -20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: i * 0.1 }}
                                        >
                                            <ColoredPencil color={c.pencilColor} />
                                        </motion.div>
                                    ))}
                                </div>

                                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Renkli Kalemler</h2>

                                <div className="bg-gradient-to-r from-amber-100 to-orange-100 dark:from-slate-700/50 dark:to-slate-700/50 rounded-xl p-4 mb-6">
                                    <p className="text-gray-600 dark:text-slate-300 text-sm mb-3">Örnek:</p>
                                    <p className="text-3xl font-black mb-2" style={{ color: '#ef4444' }}>
                                        SARI KALEMİ AL
                                    </p>
                                    <p className="text-gray-500 dark:text-slate-400 text-sm">
                                        Doğru cevap: <span className="text-red-500 font-bold">Kırmızı kalem</span> (yazının rengi)
                                    </p>
                                </div>

                                <ul className="text-gray-600 dark:text-slate-400 text-sm space-y-2 text-left mb-6">
                                    <li className="flex items-center gap-2">
                                        <Pencil className="w-4 h-4 text-amber-500" />
                                        Yazıda ne dediğine değil, <strong className="text-gray-800 dark:text-white">rengine</strong> bak!
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-amber-500" />
                                        Doğru renkteki kaleme tıkla
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Target className="w-4 h-4 text-emerald-500" />
                                        {totalRounds} soru, dikkatini topla!
                                    </li>
                                </ul>
                                <button
                                    onClick={startGame}
                                    className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:from-amber-400 hover:to-orange-400 transition-all flex items-center gap-3 mx-auto shadow-lg hover:shadow-xl transform hover:scale-105"
                                >
                                    <Play className="w-5 h-5" />
                                    Oyuna Başla
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {gameState === 'playing' && currentRound && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center gap-8 w-full"
                        >
                            {/* Instruction */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={roundNumber}
                                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.8, y: -20 }}
                                    className={`bg-white/90 dark:bg-slate-800/80 border-4 rounded-3xl p-8 text-center shadow-xl ${showFeedback === 'correct' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' :
                                        showFeedback === 'wrong' ? 'border-red-500 bg-red-50 dark:bg-red-500/10' :
                                            'border-amber-300 dark:border-white/10'
                                        } transition-all`}
                                >
                                    <p className="text-gray-500 dark:text-slate-400 text-sm mb-4">Hangi kalemi almalısın?</p>
                                    <motion.h2
                                        className="text-4xl lg:text-5xl font-black"
                                        style={{ color: currentRound.textColor }}
                                        animate={{ scale: [1, 1.02, 1] }}
                                        transition={{ duration: 0.5, repeat: Infinity }}
                                    >
                                        {currentRound.wrongColorName} KALEMİ AL
                                    </motion.h2>
                                </motion.div>
                            </AnimatePresence>

                            {/* Pencils */}
                            <div className="flex justify-center gap-4 flex-wrap">
                                {COLORS.map((color, index) => (
                                    <motion.button
                                        key={color.name}
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        onClick={() => handlePencilClick(color.pencilColor)}
                                        disabled={showFeedback !== null}
                                        className="focus:outline-none transform transition-transform hover:scale-110 active:scale-95"
                                    >
                                        <ColoredPencil
                                            color={color.pencilColor}
                                            isSelected={selectedColor === color.pencilColor}
                                            isCorrect={showFeedback === 'correct' && color.pencilColor === currentRound.correctPencilColor}
                                            isWrong={showFeedback ? color.pencilColor !== currentRound.correctPencilColor : undefined}
                                        />
                                        <p className="text-center text-xs font-bold text-gray-600 dark:text-slate-400 mt-1">
                                            {color.name}
                                        </p>
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
                                                Doğru! 🎉
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="w-8 h-8" />
                                                Yanlış! Doğru renk: {currentRound.textColorName}
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
                            <div className="bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-500/20 dark:to-orange-500/20 border border-amber-300 dark:border-amber-500/30 rounded-3xl p-8 shadow-xl">
                                <motion.div
                                    animate={{ rotate: [0, 10, -10, 0] }}
                                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                                >
                                    <Trophy className="w-20 h-20 text-amber-500 mx-auto mb-4" />
                                </motion.div>
                                <h2 className="text-3xl font-black text-gray-800 dark:text-white mb-2">Tebrikler! ✏️</h2>

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
                                        <p className="text-2xl font-black text-orange-500">x{bestStreak}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-slate-400 mb-6">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    <span>{correctCount} Doğru</span>
                                    <span className="text-gray-400">|</span>
                                    <XCircle className="w-4 h-4 text-red-500" />
                                    <span>{wrongCount} Yanlış</span>
                                </div>

                                <div className="flex justify-center gap-4">
                                    <button
                                        onClick={startGame}
                                        className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:from-amber-400 hover:to-orange-400 transition-all flex items-center gap-2 shadow-lg"
                                    >
                                        <RotateCcw className="w-5 h-5" />
                                        Tekrar Oyna
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

export default PencilStroopGame;
