import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RotateCcw, Play, Star, Timer, CheckCircle2, XCircle, ChevronLeft, Zap, Hash } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';

// Sembol seti - her biri benzersiz ve kolay ayırt edilebilir
const SYMBOLS = ['◯', '△', '□', '◇', '★', '♡', '⬡', '⬢', '✕'];

// Sayı-Sembol eşleştirme tablosu (1-9)
const createSymbolMap = () => {
    const shuffled = [...SYMBOLS].sort(() => Math.random() - 0.5);
    const map: Record<number, string> = {};
    for (let i = 1; i <= 9; i++) {
        map[i] = shuffled[i - 1];
    }
    return map;
};

const DigitSymbolGame: React.FC = () => {
    const { saveGamePlay } = useGamePersistence();
    const [gameState, setGameState] = useState<'idle' | 'playing' | 'finished'>('idle');
    const [symbolMap, setSymbolMap] = useState<Record<number, string>>({});
    const [currentNumber, setCurrentNumber] = useState<number>(1);
    const [score, setScore] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [wrongCount, setWrongCount] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [showFeedback, setShowFeedback] = useState<'correct' | 'wrong' | null>(null);
    const [lastAnswer, setLastAnswer] = useState<string | null>(null);
    const gameStartTimeRef = useRef<number>(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const hasSavedRef = useRef<boolean>(false);

    const gameDuration = 60; // 60 saniye

    // Yeni sayı üret
    const generateNewNumber = useCallback(() => {
        const newNumber = Math.floor(Math.random() * 9) + 1;
        setCurrentNumber(newNumber);
    }, []);

    // Oyunu başlat
    const startGame = useCallback(() => {
        const newMap = createSymbolMap();
        setSymbolMap(newMap);
        setScore(0);
        setCorrectCount(0);
        setWrongCount(0);
        setTimeLeft(gameDuration);
        setStreak(0);
        setBestStreak(0);
        setShowFeedback(null);
        setLastAnswer(null);
        generateNewNumber();
        setGameState('playing');
        gameStartTimeRef.current = Date.now();
        hasSavedRef.current = false;
    }, [generateNewNumber]);

    // Zamanlayıcı
    useEffect(() => {
        if (gameState === 'playing' && timeLeft > 0) {
            timerRef.current = setTimeout(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (gameState === 'playing' && timeLeft === 0) {
            setGameState('finished');
        }

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [gameState, timeLeft]);

    // Oyun bittiğinde verileri kaydet
    useEffect(() => {
        if (gameState === 'finished' && gameStartTimeRef.current > 0 && !hasSavedRef.current) {
            hasSavedRef.current = true;
            const durationSeconds = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
            saveGamePlay({
                game_id: 'simge-kodlama',
                score_achieved: score,
                duration_seconds: durationSeconds,
                metadata: {
                    correct_count: correctCount,
                    wrong_count: wrongCount,
                    best_streak: bestStreak,
                    total_attempts: correctCount + wrongCount,
                    accuracy: correctCount + wrongCount > 0 ? Math.round((correctCount / (correctCount + wrongCount)) * 100) : 0,
                    game_name: 'Simge Kodlama',
                }
            });
        }
    }, [gameState]);

    // Cevap kontrolü
    const handleAnswer = (selectedSymbol: string) => {
        if (showFeedback || gameState !== 'playing') return;

        const correctSymbol = symbolMap[currentNumber];
        const isCorrect = selectedSymbol === correctSymbol;
        setLastAnswer(selectedSymbol);

        if (isCorrect) {
            setShowFeedback('correct');
            setCorrectCount(prev => prev + 1);
            setStreak(prev => {
                const newStreak = prev + 1;
                if (newStreak > bestStreak) setBestStreak(newStreak);
                return newStreak;
            });
            const streakBonus = Math.min(streak * 5, 50);
            setScore(prev => prev + 50 + streakBonus);
        } else {
            setShowFeedback('wrong');
            setWrongCount(prev => prev + 1);
            setStreak(0);
        }

        // Hızlı geçiş - işlem hızı testi
        setTimeout(() => {
            setShowFeedback(null);
            setLastAnswer(null);
            generateNewNumber();
        }, 300);
    };

    const accuracy = correctCount + wrongCount > 0
        ? Math.round((correctCount / (correctCount + wrongCount)) * 100)
        : 0;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-950 to-slate-900 pt-24 pb-12 px-6">
            <div className="container mx-auto max-w-4xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-6"
                >
                    <Link
                        to="/atolyeler/bireysel-degerlendirme"
                        className="inline-flex items-center gap-2 text-cyan-400 font-bold hover:text-cyan-300 transition-colors mb-4 uppercase text-xs tracking-widest"
                    >
                        <ChevronLeft size={16} />
                        Bireysel Değerlendirme
                    </Link>
                    <h1 className="text-4xl lg:text-5xl font-black text-white mb-2">
                        🔢 <span className="text-cyan-400">Simge</span> Kodlama
                    </h1>
                    <p className="text-slate-400">Sayıya ait sembolü bul - hızlı ol!</p>
                </motion.div>

                {/* Stats */}
                <div className="flex justify-center gap-4 mb-6 flex-wrap">
                    <div className="bg-slate-800/50 border border-white/10 rounded-xl px-5 py-2 flex items-center gap-2">
                        <Star className="w-5 h-5 text-amber-400" />
                        <span className="text-white font-bold">{score}</span>
                    </div>
                    {gameState === 'playing' && (
                        <>
                            <div className={`bg-slate-800/50 border rounded-xl px-5 py-2 flex items-center gap-2 ${timeLeft <= 10 ? 'border-red-500 animate-pulse' : 'border-white/10'}`}>
                                <Timer className={`w-5 h-5 ${timeLeft <= 10 ? 'text-red-400' : 'text-cyan-400'}`} />
                                <span className={`font-bold ${timeLeft <= 10 ? 'text-red-400' : 'text-white'}`}>{formatTime(timeLeft)}</span>
                            </div>
                            <div className="bg-slate-800/50 border border-white/10 rounded-xl px-5 py-2 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-amber-400" />
                                <span className="text-white font-bold">x{streak}</span>
                            </div>
                            <div className="bg-slate-800/50 border border-white/10 rounded-xl px-5 py-2 flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                <span className="text-white font-bold">{correctCount}</span>
                            </div>
                        </>
                    )}
                </div>

                {/* Game Area */}
                <div className="flex flex-col items-center">
                    {/* Idle State */}
                    {gameState === 'idle' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center space-y-6"
                        >
                            <div className="bg-slate-800/50 border border-white/10 rounded-3xl p-8 max-w-lg">
                                <div className="text-6xl mb-4">🔢</div>
                                <h2 className="text-2xl font-bold text-white mb-4">Simge Kodlama Testi</h2>

                                <div className="bg-slate-700/50 rounded-xl p-4 mb-6">
                                    <p className="text-slate-300 text-sm mb-3">Nasıl Oynanır:</p>
                                    <div className="flex justify-center gap-2 mb-3 text-2xl">
                                        {[1, 2, 3].map(n => (
                                            <div key={n} className="flex flex-col items-center">
                                                <span className="text-cyan-400 font-bold">{n}</span>
                                                <span className="text-white">{['◯', '△', '□'][n - 1]}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-slate-400 text-sm">
                                        Ekranda sayı gösterilecek, o sayıya ait sembolü seç!
                                    </p>
                                </div>

                                <ul className="text-slate-400 text-sm space-y-2 text-left mb-6">
                                    <li className="flex items-center gap-2">
                                        <Hash className="w-4 h-4 text-cyan-400" />
                                        1-9 arası sayılar ve 9 farklı sembol
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Timer className="w-4 h-4 text-amber-400" />
                                        {gameDuration} saniye süren
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-pink-400" />
                                        Ne kadar çok doğru, o kadar yüksek puan!
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

                    {/* Playing State */}
                    {gameState === 'playing' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="w-full max-w-2xl"
                        >
                            {/* Legend - Sayı-Sembol Haritası */}
                            <div className="bg-slate-800/70 border border-white/20 rounded-2xl p-4 mb-6">
                                <p className="text-slate-400 text-xs text-center mb-3 uppercase tracking-wider">Referans Tablosu</p>
                                <div className="flex justify-center gap-3 flex-wrap">
                                    {Object.entries(symbolMap).map(([num, symbol]) => (
                                        <div
                                            key={num}
                                            className="flex flex-col items-center bg-slate-700/50 rounded-lg px-3 py-2 min-w-[50px]"
                                        >
                                            <span className="text-cyan-400 font-bold text-lg">{num}</span>
                                            <span className="text-white text-2xl">{symbol}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Current Number Display */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentNumber + '-' + correctCount + wrongCount}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ duration: 0.15 }}
                                    className={`bg-slate-800/50 border-4 rounded-3xl p-8 mb-6 text-center ${showFeedback === 'correct' ? 'border-emerald-500 bg-emerald-500/10' :
                                        showFeedback === 'wrong' ? 'border-red-500 bg-red-500/10' :
                                            'border-white/10'
                                        } transition-all`}
                                >
                                    <p className="text-slate-400 text-sm mb-2">Bu sayının sembolünü bul:</p>
                                    <div className="text-8xl font-black text-cyan-400">
                                        {currentNumber}
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            {/* Symbol Options */}
                            <div className="grid grid-cols-3 gap-3">
                                {SYMBOLS.map((symbol, idx) => {
                                    const isSelected = lastAnswer === symbol;
                                    const isCorrect = symbol === symbolMap[currentNumber];
                                    const showResult = showFeedback !== null;

                                    return (
                                        <motion.button
                                            key={symbol}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.03 }}
                                            onClick={() => handleAnswer(symbol)}
                                            disabled={showFeedback !== null}
                                            whileHover={{ scale: showFeedback ? 1 : 1.05 }}
                                            whileTap={{ scale: showFeedback ? 1 : 0.95 }}
                                            className={`py-6 text-4xl font-bold rounded-2xl transition-all ${showResult
                                                ? isCorrect
                                                    ? 'bg-emerald-500/20 border-2 border-emerald-500'
                                                    : isSelected
                                                        ? 'bg-red-500/20 border-2 border-red-500'
                                                        : 'bg-slate-800/50 border border-white/5 opacity-50'
                                                : 'bg-slate-800/50 border border-white/10 hover:bg-slate-700/50 hover:border-cyan-500/50 active:scale-95'
                                                }`}
                                        >
                                            {symbol}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {/* Finished State */}
                    {gameState === 'finished' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center space-y-6 w-full max-w-md"
                        >
                            <div className="bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 rounded-3xl p-8">
                                <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                                <h2 className="text-3xl font-black text-white mb-2">Süre Doldu! ⏱️</h2>

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
                                        <p className="text-slate-400 text-sm">Toplam Deneme</p>
                                        <p className="text-2xl font-black text-cyan-400">{correctCount + wrongCount}</p>
                                    </div>
                                    <div className="bg-slate-800/50 rounded-xl p-4">
                                        <p className="text-slate-400 text-sm">En İyi Seri</p>
                                        <p className="text-2xl font-black text-purple-400">x{bestStreak}</p>
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

export default DigitSymbolGame;
