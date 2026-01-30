import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RotateCcw, Play, Star, Timer, Target, CheckCircle2, XCircle, ChevronLeft, Zap, Compass, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';

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



const DirectionStroopGame: React.FC = () => {
    const { saveGamePlay } = useGamePersistence();
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
    const gameStartTimeRef = useRef<number>(0);
    const hasSavedRef = useRef<boolean>(false);
    const totalRounds = 20;
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Generate a new round
    const generateRound = useCallback((): Round => {
        // Pick a random word (direction name)
        const wordIndex = Math.floor(Math.random() * DIRECTIONS.length);
        const word = DIRECTIONS[wordIndex].word;

        // Pick a DIFFERENT position for the word
        let positionIndex;
        do {
            positionIndex = Math.floor(Math.random() * DIRECTIONS.length);
        } while (positionIndex === wordIndex); // Ensure word and position are different (Stroop effect)

        const position = DIRECTIONS[positionIndex].position;
        const correctAnswer = DIRECTIONS[positionIndex].turkishName;

        return {
            word,
            position,
            correctAnswer
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
        gameStartTimeRef.current = Date.now();
        hasSavedRef.current = false;
        const round = generateRound();
        setCurrentRound(round);
        setRoundStartTime(Date.now());
    }, [generateRound]);

    // Oyun bittiğinde verileri kaydet
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
                    accuracy: Math.round((correctCount / (correctCount + wrongCount)) * 100),
                    game_name: 'Yön Stroop',
                }
            });
        }
    }, [gameState]);

    // Handle answer
    const handleAnswer = useCallback((position: string) => {
        if (!currentRound || showFeedback) return;

        const reactionTime = Date.now() - roundStartTime;
        setReactionTimes(prev => [...prev, reactionTime]);

        const isCorrect = position === currentRound.position;

        if (isCorrect) {
            setShowFeedback('correct');
            setCorrectCount(prev => prev + 1);
            setStreak(prev => {
                const newStreak = prev + 1;
                if (newStreak > bestStreak) setBestStreak(newStreak);
                return newStreak;
            });

            // Score based on reaction time
            const timeBonus = Math.max(0, Math.floor((2500 - reactionTime) / 100));
            const streakBonus = streak * 5;
            setScore(prev => prev + 100 + timeBonus + streakBonus);
        } else {
            setShowFeedback('wrong');
            setWrongCount(prev => prev + 1);
            setStreak(0);
        }

        // Next round after feedback
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
        }, 500);
    }, [currentRound, roundStartTime, roundNumber, totalRounds, streak, bestStreak, generateRound, reactionTimes, showFeedback]);

    // Timer for total game time
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

    // Get position style for word placement
    const getPositionStyle = (position: string) => {
        switch (position) {
            case 'left':
                return 'justify-start items-center pl-8';
            case 'right':
                return 'justify-end items-center pr-8';
            case 'top':
                return 'justify-center items-start pt-8';
            case 'bottom':
                return 'justify-center items-end pb-8';
            default:
                return 'justify-center items-center';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-950 to-slate-900 pt-24 pb-12 px-6">
            <div className="container mx-auto max-w-4xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <Link
                        to="/atolyeler/bireysel-degerlendirme"
                        className="inline-flex items-center gap-2 text-cyan-400 font-bold hover:text-cyan-300 transition-colors mb-4 uppercase text-xs tracking-widest"
                    >
                        <ChevronLeft size={16} />
                        Bireysel Değerlendirme
                    </Link>
                    <h1 className="text-4xl lg:text-5xl font-black text-white mb-2">
                        🧭 <span className="text-cyan-400">Yön</span> Stroop
                    </h1>
                    <p className="text-slate-400">Yazının konumunu seç, kelimeyi değil!</p>
                </motion.div>

                {/* Stats */}
                <div className="flex justify-center gap-4 mb-8 flex-wrap">
                    <div className="bg-slate-800/50 border border-white/10 rounded-xl px-5 py-2 flex items-center gap-2">
                        <Star className="w-5 h-5 text-amber-400" />
                        <span className="text-white font-bold">{score}</span>
                    </div>
                    {gameState === 'playing' && (
                        <>
                            <div className="bg-slate-800/50 border border-white/10 rounded-xl px-5 py-2 flex items-center gap-2">
                                <Target className="w-5 h-5 text-cyan-400" />
                                <span className="text-white font-bold">{roundNumber}/{totalRounds}</span>
                            </div>
                            <div className="bg-slate-800/50 border border-white/10 rounded-xl px-5 py-2 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-amber-400" />
                                <span className="text-white font-bold">x{streak}</span>
                            </div>
                            <div className="bg-slate-800/50 border border-white/10 rounded-xl px-5 py-2 flex items-center gap-2">
                                <Timer className="w-5 h-5 text-emerald-400" />
                                <span className="text-white font-bold">{Math.floor(totalTime / 1000)}s</span>
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
                            <div className="bg-slate-800/50 border border-white/10 rounded-3xl p-8 max-w-md">
                                <div className="text-6xl mb-4">🧭</div>
                                <h2 className="text-2xl font-bold text-white mb-4">Yön Stroop Testi</h2>

                                <div className="bg-slate-700/50 rounded-xl p-4 mb-6">
                                    <p className="text-slate-300 text-sm mb-3">Örnek:</p>
                                    <div className="bg-slate-800 rounded-lg p-4 h-20 flex justify-end items-center">
                                        <p className="text-3xl font-black text-cyan-400">SOL</p>
                                    </div>
                                    <p className="text-slate-400 text-sm mt-2">Doğru cevap: <span className="text-cyan-400 font-bold">Sağ</span> (yazının konumu)</p>
                                </div>

                                <ul className="text-slate-400 text-sm space-y-2 text-left mb-6">
                                    <li className="flex items-center gap-2">
                                        <Compass className="w-4 h-4 text-cyan-400" />
                                        Kelime değil, <strong className="text-white">konum</strong> önemli!
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-amber-400" />
                                        Hızlı cevap = daha çok puan
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Target className="w-4 h-4 text-emerald-400" />
                                        {totalRounds} soru, uzamsal dikkatini test et!
                                    </li>
                                </ul>
                                <button
                                    onClick={startGame}
                                    className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-bold rounded-xl hover:from-cyan-400 hover:to-teal-400 transition-all flex items-center gap-3 mx-auto"
                                >
                                    <Play className="w-5 h-5" />
                                    Teste Başla
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
                            {/* Word Display */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={roundNumber}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className={`bg-slate-800/80 border-4 rounded-3xl w-full h-64 flex ${getPositionStyle(currentRound.position)} ${showFeedback === 'correct' ? 'border-emerald-500 bg-emerald-500/10' :
                                        showFeedback === 'wrong' ? 'border-red-500 bg-red-500/10' :
                                            'border-white/10'
                                        } transition-all`}
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

                            <p className="text-slate-400 text-sm">Yazı ekranın neresinde?</p>

                            {/* Direction Options */}
                            <div className="grid grid-cols-3 gap-4 w-full">
                                {/* Top */}
                                <div />
                                <motion.button
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onClick={() => handleAnswer('top')}
                                    disabled={showFeedback !== null}
                                    className={`py-4 px-6 text-lg font-bold rounded-2xl transition-all flex items-center justify-center gap-2 ${showFeedback && currentRound.position === 'top'
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-slate-800 border border-white/10 text-white hover:bg-slate-700 hover:border-cyan-500/50 active:scale-95'
                                        }`}
                                >
                                    <ArrowUp className="w-6 h-6" />
                                    Yukarı
                                </motion.button>
                                <div />

                                {/* Left & Right */}
                                <motion.button
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    onClick={() => handleAnswer('left')}
                                    disabled={showFeedback !== null}
                                    className={`py-4 px-6 text-lg font-bold rounded-2xl transition-all flex items-center justify-center gap-2 ${showFeedback && currentRound.position === 'left'
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-slate-800 border border-white/10 text-white hover:bg-slate-700 hover:border-cyan-500/50 active:scale-95'
                                        }`}
                                >
                                    <ArrowLeft className="w-6 h-6" />
                                    Sol
                                </motion.button>
                                <div />
                                <motion.button
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    onClick={() => handleAnswer('right')}
                                    disabled={showFeedback !== null}
                                    className={`py-4 px-6 text-lg font-bold rounded-2xl transition-all flex items-center justify-center gap-2 ${showFeedback && currentRound.position === 'right'
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-slate-800 border border-white/10 text-white hover:bg-slate-700 hover:border-cyan-500/50 active:scale-95'
                                        }`}
                                >
                                    Sağ
                                    <ArrowRight className="w-6 h-6" />
                                </motion.button>

                                {/* Bottom */}
                                <div />
                                <motion.button
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onClick={() => handleAnswer('bottom')}
                                    disabled={showFeedback !== null}
                                    className={`py-4 px-6 text-lg font-bold rounded-2xl transition-all flex items-center justify-center gap-2 ${showFeedback && currentRound.position === 'bottom'
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-slate-800 border border-white/10 text-white hover:bg-slate-700 hover:border-cyan-500/50 active:scale-95'
                                        }`}
                                >
                                    <ArrowDown className="w-6 h-6" />
                                    Aşağı
                                </motion.button>
                                <div />
                            </div>

                            {/* Feedback */}
                            <AnimatePresence>
                                {showFeedback && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className={`flex items-center gap-2 font-bold ${showFeedback === 'correct' ? 'text-emerald-400' : 'text-red-400'
                                            }`}
                                    >
                                        {showFeedback === 'correct' ? (
                                            <>
                                                <CheckCircle2 className="w-6 h-6" />
                                                Doğru!
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="w-6 h-6" />
                                                Doğrusu: {currentRound.correctAnswer} idi
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
                            <div className="bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 rounded-3xl p-8">
                                <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                                <h2 className="text-3xl font-black text-white mb-2">Test Tamamlandı! 🎉</h2>

                                <div className="grid grid-cols-2 gap-4 my-6">
                                    <div className="bg-slate-800/50 rounded-xl p-4">
                                        <p className="text-slate-400 text-sm">Toplam Puan</p>
                                        <p className="text-2xl font-black text-amber-400">{score}</p>
                                    </div>
                                    <div className="bg-slate-800/50 rounded-xl p-4">
                                        <p className="text-slate-400 text-sm">Doğruluk</p>
                                        <p className="text-2xl font-black text-emerald-400">%{accuracy}</p>
                                    </div>
                                    <div className="bg-slate-800/50 rounded-xl p-4">
                                        <p className="text-slate-400 text-sm">Ort. Tepki</p>
                                        <p className="text-2xl font-black text-blue-400">{averageReactionTime}ms</p>
                                    </div>
                                    <div className="bg-slate-800/50 rounded-xl p-4">
                                        <p className="text-slate-400 text-sm">En İyi Seri</p>
                                        <p className="text-2xl font-black text-cyan-400">x{bestStreak}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-center gap-2 text-sm text-slate-400 mb-6">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span>{correctCount} Doğru</span>
                                    <span className="text-slate-600">|</span>
                                    <XCircle className="w-4 h-4 text-red-400" />
                                    <span>{wrongCount} Yanlış</span>
                                </div>

                                <div className="flex justify-center gap-4">
                                    <button
                                        onClick={startGame}
                                        className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-bold rounded-xl hover:from-cyan-400 hover:to-teal-400 transition-all flex items-center gap-2"
                                    >
                                        <RotateCcw className="w-5 h-5" />
                                        Tekrar Oyna
                                    </button>
                                    <Link
                                        to="/atolyeler/bireysel-degerlendirme"
                                        className="px-6 py-3 bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-600 transition-all"
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

export default DirectionStroopGame;
