import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RotateCcw, Play, Star, Timer, CheckCircle2, ChevronLeft, Zap, Hash, Eye, Sparkles } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import { useExam } from '../../contexts/ExamContext';

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
    const { submitResult } = useExam();
    const { feedbackState, showFeedback } = useGameFeedback();
    const location = useLocation();
    const navigate = useNavigate();
    const [gameState, setGameState] = useState<'idle' | 'playing' | 'finished'>('idle');
    const [symbolMap, setSymbolMap] = useState<Record<number, string>>({});
    const [currentNumber, setCurrentNumber] = useState<number>(1);
    const [score, setScore] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [wrongCount, setWrongCount] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [lastAnswer, setLastAnswer] = useState<string | null>(null);
    const gameStartTimeRef = useRef<number>(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const hasSavedRef = useRef<boolean>(false);

    const gameDuration = 60; // 60 saniye

    // Exam Mode Props
    const examMode = location.state?.examMode || false;
    const examTimeLimit = location.state?.examTimeLimit || gameDuration;

    // Back link
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    // Yeni sayı üret
    const generateNewNumber = useCallback(() => {
        const newNumber = Math.floor(Math.random() * 9) + 1;
        setCurrentNumber(newNumber);
    }, []);

    // Oyunu başlat
    const startGame = useCallback(() => {
        window.scrollTo(0, 0);
        const newMap = createSymbolMap();
        setSymbolMap(newMap);
        setScore(0);
        setCorrectCount(0);
        setWrongCount(0);
        setTimeLeft(examMode ? examTimeLimit : gameDuration);
        setStreak(0);
        setBestStreak(0);
        setLastAnswer(null);
        generateNewNumber();
        setGameState('playing');
        gameStartTimeRef.current = Date.now();
        hasSavedRef.current = false;
    }, [generateNewNumber, examMode, examTimeLimit]);

    // Auto start from HUB or examMode
    useEffect(() => {
        if ((location.state?.autoStart || examMode) && gameState === 'idle') {
            startGame();
        }
    }, [location.state, gameState, startGame, examMode]);

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
            const acc = correctCount + wrongCount > 0 ? correctCount / (correctCount + wrongCount) : 0;

            // Exam mode: submit result and redirect
            if (examMode) {
                await submitResult(acc >= 0.6, score, (correctCount + wrongCount) * 50, durationSeconds).then(() => {
                    navigate("/atolyeler/sinav-simulasyonu/devam");
                });
                return;
            }

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
    }, [gameState, score, correctCount, wrongCount, bestStreak, saveGamePlay, examMode, submitResult, navigate]);

    // Cevap kontrolü
    const handleAnswer = (selectedSymbol: string) => {
        if (feedbackState || gameState !== 'playing') return;

        const correctSymbol = symbolMap[currentNumber];
        const isCorrect = selectedSymbol === correctSymbol;
        setLastAnswer(selectedSymbol);

        if (isCorrect) {
            showFeedback(true);
            setCorrectCount(prev => prev + 1);
            setStreak(prev => {
                const newStreak = prev + 1;
                if (newStreak > bestStreak) setBestStreak(newStreak);
                return newStreak;
            });
            const streakBonus = Math.min(streak * 5, 50);
            setScore(prev => prev + 50 + streakBonus);
        } else {
            showFeedback(false);
            setWrongCount(prev => prev + 1);
            setStreak(0);
        }

        // Hızlı geçiş - işlem hızı testi
        setTimeout(() => {
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
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950 to-indigo-950 text-white">
            {/* Decorative Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
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

                            {/* Timer */}
                            <div
                                className="flex items-center gap-2 px-4 py-2 rounded-xl"
                                style={{
                                    background: timeLeft <= 10
                                        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.2) 100%)'
                                        : 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(124, 58, 237, 0.1) 100%)',
                                    boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                                    border: timeLeft <= 10
                                        ? '1px solid rgba(239, 68, 68, 0.5)'
                                        : '1px solid rgba(139, 92, 246, 0.3)',
                                    animation: timeLeft <= 10 ? 'pulse 1s infinite' : 'none'
                                }}
                            >
                                <Timer className={timeLeft <= 10 ? 'text-red-400' : 'text-violet-400'} size={18} />
                                <span className={`font-bold ${timeLeft <= 10 ? 'text-red-400' : 'text-violet-400'}`}>{formatTime(timeLeft)}</span>
                            </div>

                            {/* Streak */}
                            {streak > 1 && (
                                <div
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(79, 70, 229, 0.1) 100%)',
                                        boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                                        border: '1px solid rgba(99, 102, 241, 0.3)'
                                    }}
                                >
                                    <Zap className="text-indigo-400" size={18} />
                                    <span className="font-bold text-indigo-400">x{streak}</span>
                                </div>
                            )}

                            {/* Correct Count */}
                            <div
                                className="flex items-center gap-2 px-4 py-2 rounded-xl"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)',
                                    boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(16, 185, 129, 0.3)'
                                }}
                            >
                                <CheckCircle2 className="text-emerald-400" size={18} />
                                <span className="font-bold text-emerald-400">{correctCount}</span>
                            </div>
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
                                    background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                                    boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)'
                                }}
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Hash size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                                🔢 Simge Kodlama
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
                                <p className="text-slate-400 text-sm mb-3">Nasıl Oynanır:</p>
                                <div className="flex justify-center gap-4 mb-3 text-2xl">
                                    {[1, 2, 3].map(n => (
                                        <div key={n} className="flex flex-col items-center">
                                            <span className="text-violet-400 font-bold">{n}</span>
                                            <span className="text-white">{['◯', '△', '□'][n - 1]}</span>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-slate-400 text-sm">Ekranda sayı gösterilecek, o sayıya ait sembolü seç!</p>
                            </div>

                            {/* Instructions */}
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                                <h3 className="text-lg font-bold text-violet-300 mb-3 flex items-center gap-2">
                                    <Eye size={20} /> Oyun Kuralları
                                </h3>
                                <ul className="space-y-2 text-slate-300 text-sm">
                                    <li className="flex items-center gap-2">
                                        <Sparkles size={14} className="text-indigo-400" />
                                        <span>1-9 arası sayılar ve 9 farklı sembol</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Sparkles size={14} className="text-indigo-400" />
                                        <span>{gameDuration} saniye süren</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Sparkles size={14} className="text-indigo-400" />
                                        <span>Ne kadar çok doğru, o kadar yüksek puan!</span>
                                    </li>
                                </ul>
                            </div>

                            {/* TUZÖ Badge */}
                            <div className="bg-violet-500/10 text-violet-300 text-xs px-4 py-2 rounded-full mb-6 inline-block border border-violet-500/30">
                                TUZÖ 5.5.1 İşlem Hızı
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05, y: -4 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={startGame}
                                className="px-8 py-4 rounded-2xl font-bold text-lg"
                                style={{
                                    background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(139, 92, 246, 0.4)'
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
                    {gameState === 'playing' && (
                        <motion.div
                            key="game"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full max-w-2xl"
                        >
                            {/* Legend - Sayı-Sembol Haritası */}
                            <div
                                className="rounded-2xl p-4 mb-6"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}
                            >
                                <p className="text-slate-400 text-xs text-center mb-3 uppercase tracking-wider">Referans Tablosu</p>
                                <div className="flex justify-center gap-2 flex-wrap">
                                    {Object.entries(symbolMap).map(([num, symbol]) => (
                                        <div
                                            key={num}
                                            className="flex flex-col items-center bg-white/5 rounded-lg px-3 py-2 min-w-[45px]"
                                        >
                                            <span className="text-violet-400 font-bold">{num}</span>
                                            <span className="text-white text-xl">{symbol}</span>
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
                                    className="text-center mb-6"
                                >
                                    <p className="text-slate-400 text-sm mb-2">Bu sayının sembolünü bul:</p>
                                    <div
                                        className="rounded-3xl p-8"
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                            boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.2)',
                                            border: '1px solid rgba(255,255,255,0.1)'
                                        }}
                                    >
                                        <div className="text-8xl font-black text-violet-400">
                                            {currentNumber}
                                        </div>
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            {/* Symbol Options */}
                            <div className="grid grid-cols-3 gap-3">
                                {SYMBOLS.map((symbol, idx) => {
                                    const isSelected = lastAnswer === symbol;
                                    const isCorrect = symbol === symbolMap[currentNumber];
                                    const showResult = feedbackState !== null;

                                    return (
                                        <motion.button
                                            key={symbol}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.03 }}
                                            onClick={() => handleAnswer(symbol)}
                                            disabled={feedbackState !== null}
                                            whileHover={!feedbackState ? { scale: 0.98, y: -2 } : {}}
                                            whileTap={!feedbackState ? { scale: 0.95 } : {}}
                                            className="py-6 text-4xl font-bold rounded-[25%] transition-all"
                                            style={{
                                                background: showResult && isCorrect
                                                    ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                                                    : showResult && isSelected && !isCorrect
                                                        ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                                                        : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                                                boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.1)',
                                                border: showResult && isCorrect
                                                    ? '2px solid #10B981'
                                                    : '1px solid rgba(255,255,255,0.1)',
                                                cursor: feedbackState ? 'default' : 'pointer',
                                                opacity: showResult && !isCorrect && !isSelected ? 0.5 : 1
                                            }}
                                        >
                                            {symbol}
                                        </motion.button>
                                    );
                                })}
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
                                {accuracy >= 80 ? '🎉 Süper!' : 'Süre Doldu!'}
                            </h2>
                            <p className="text-slate-400 mb-6">
                                {accuracy >= 80 ? 'Muhteşem işlem hızı!' : 'Biraz daha pratik yap!'}
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
                                        <p className="text-slate-400 text-sm">Toplam Deneme</p>
                                        <p className="text-3xl font-bold text-violet-400">{correctCount + wrongCount}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">En İyi Seri</p>
                                        <p className="text-3xl font-bold text-indigo-400">x{bestStreak}</p>
                                    </div>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={startGame}
                                className="w-full px-6 py-4 rounded-2xl font-bold text-lg mb-4"
                                style={{
                                    background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(139, 92, 246, 0.4)'
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
            </div>
        </div>
    );
};

export default DigitSymbolGame;

