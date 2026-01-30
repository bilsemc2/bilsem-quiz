import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RotateCcw, Play, Star, Target, CheckCircle2, XCircle, ChevronLeft, Zap, Hash, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';

type PatternType = 'arithmetic' | 'geometric' | 'fibonacci' | 'square' | 'cube' | 'prime' | 'alternating' | 'doubleStep';

interface Question {
    sequence: number[];
    answer: number;
    options: number[];
    patternType: PatternType;
    patternDescription: string;
}

// Asal sayılar listesi
const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];

const NumberSequenceGame: React.FC = () => {
    const { saveGamePlay } = useGamePersistence();
    const [gameState, setGameState] = useState<'idle' | 'playing' | 'finished'>('idle');
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [questionNumber, setQuestionNumber] = useState(0);
    const [score, setScore] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [wrongCount, setWrongCount] = useState(0);
    const [level, setLevel] = useState(1);
    const [showFeedback, setShowFeedback] = useState<'correct' | 'wrong' | null>(null);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const gameStartTimeRef = useRef<number>(0);
    const hasSavedRef = useRef<boolean>(false);

    const totalQuestions = 15;

    // Zorluk seviyesine göre desen türleri
    const getAvailablePatterns = (lvl: number): PatternType[] => {
        if (lvl <= 2) return ['arithmetic', 'geometric'];
        if (lvl <= 4) return ['arithmetic', 'geometric', 'square', 'fibonacci'];
        if (lvl <= 6) return ['arithmetic', 'geometric', 'square', 'fibonacci', 'cube', 'alternating'];
        return ['arithmetic', 'geometric', 'square', 'fibonacci', 'cube', 'alternating', 'prime', 'doubleStep'];
    };

    // Desen oluşturma fonksiyonları
    const generatePattern = useCallback((type: PatternType, lvl: number): { sequence: number[], answer: number, description: string } => {
        const seqLength = Math.min(4 + Math.floor(lvl / 3), 6);

        switch (type) {
            case 'arithmetic': {
                // Aritmetik dizi: a, a+d, a+2d, ...
                const start = Math.floor(Math.random() * 10) + 1;
                const diff = Math.floor(Math.random() * (lvl + 2)) + 1;
                const sequence = Array.from({ length: seqLength }, (_, i) => start + i * diff);
                const answer = start + seqLength * diff;
                return { sequence, answer, description: `Her sayı ${diff} artıyor` };
            }
            case 'geometric': {
                // Geometrik dizi: a, a*r, a*r^2, ...
                const start = Math.floor(Math.random() * 3) + 1;
                const ratio = lvl <= 3 ? 2 : Math.floor(Math.random() * 2) + 2;
                const sequence = Array.from({ length: seqLength }, (_, i) => start * Math.pow(ratio, i));
                const answer = start * Math.pow(ratio, seqLength);
                return { sequence, answer, description: `Her sayı ${ratio} ile çarpılıyor` };
            }
            case 'fibonacci': {
                // Fibonacci benzeri: her sayı önceki ikisinin toplamı
                const a = Math.floor(Math.random() * 3) + 1;
                const b = Math.floor(Math.random() * 3) + 1;
                const sequence = [a, b];
                for (let i = 2; i < seqLength; i++) {
                    sequence.push(sequence[i - 1] + sequence[i - 2]);
                }
                const answer = sequence[seqLength - 1] + sequence[seqLength - 2];
                return { sequence, answer, description: 'Her sayı önceki iki sayının toplamı' };
            }
            case 'square': {
                // Kare sayılar: 1, 4, 9, 16, ...
                const start = Math.floor(Math.random() * 3) + 1;
                const sequence = Array.from({ length: seqLength }, (_, i) => Math.pow(start + i, 2));
                const answer = Math.pow(start + seqLength, 2);
                return { sequence, answer, description: 'Ardışık sayıların kareleri' };
            }
            case 'cube': {
                // Küp sayılar: 1, 8, 27, 64, ...
                const start = Math.floor(Math.random() * 2) + 1;
                const sequence = Array.from({ length: seqLength }, (_, i) => Math.pow(start + i, 3));
                const answer = Math.pow(start + seqLength, 3);
                return { sequence, answer, description: 'Ardışık sayıların küpleri' };
            }
            case 'prime': {
                // Asal sayılar
                const startIdx = Math.floor(Math.random() * 5);
                const sequence = PRIMES.slice(startIdx, startIdx + seqLength);
                const answer = PRIMES[startIdx + seqLength];
                return { sequence, answer, description: 'Asal sayılar serisi' };
            }
            case 'alternating': {
                // Değişen artış: +1, +2, +1, +2, ...
                const start = Math.floor(Math.random() * 5) + 1;
                const diff1 = Math.floor(Math.random() * 3) + 1;
                const diff2 = Math.floor(Math.random() * 3) + 2;
                const sequence = [start];
                for (let i = 1; i < seqLength; i++) {
                    sequence.push(sequence[i - 1] + (i % 2 === 1 ? diff1 : diff2));
                }
                const answer = sequence[seqLength - 1] + (seqLength % 2 === 1 ? diff1 : diff2);
                return { sequence, answer, description: `Değişen artış: +${diff1}, +${diff2}, +${diff1}...` };
            }
            case 'doubleStep': {
                // Çift adım: artış miktarı da artıyor
                const start = Math.floor(Math.random() * 5) + 1;
                const sequence = [start];
                let step = 1;
                for (let i = 1; i < seqLength; i++) {
                    sequence.push(sequence[i - 1] + step);
                    step++;
                }
                const answer = sequence[seqLength - 1] + step;
                return { sequence, answer, description: 'Artış miktarı her adımda 1 artıyor' };
            }
            default:
                return generatePattern('arithmetic', lvl);
        }
    }, []);

    // Soru oluştur
    const generateQuestion = useCallback((): Question => {
        const patterns = getAvailablePatterns(level);
        const patternType = patterns[Math.floor(Math.random() * patterns.length)];
        const { sequence, answer, description } = generatePattern(patternType, level);

        // Yanlış seçenekler oluştur
        const wrongOptions = new Set<number>();
        while (wrongOptions.size < 3) {
            const offset = (Math.floor(Math.random() * 20) - 10) || 1;
            const wrongAnswer = answer + offset;
            if (wrongAnswer !== answer && wrongAnswer > 0 && !wrongOptions.has(wrongAnswer)) {
                wrongOptions.add(wrongAnswer);
            }
        }

        const options = [answer, ...Array.from(wrongOptions)].sort(() => Math.random() - 0.5);

        return {
            sequence,
            answer,
            options,
            patternType,
            patternDescription: description,
        };
    }, [level, generatePattern]);

    // Oyunu başlat
    const startGame = useCallback(() => {
        setGameState('playing');
        setQuestionNumber(1);
        setScore(0);
        setCorrectCount(0);
        setWrongCount(0);
        setLevel(1);
        setStreak(0);
        setBestStreak(0);
        gameStartTimeRef.current = Date.now();
        hasSavedRef.current = false;
        const question = generateQuestion();
        setCurrentQuestion(question);
        setSelectedAnswer(null);
        setShowFeedback(null);
    }, [generateQuestion]);

    // Oyun bittiğinde verileri kaydet
    useEffect(() => {
        if (gameState === 'finished' && gameStartTimeRef.current > 0 && !hasSavedRef.current) {
            hasSavedRef.current = true;
            const durationSeconds = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
            saveGamePlay({
                game_id: 'sayisal-dizi',
                score_achieved: score,
                duration_seconds: durationSeconds,
                metadata: {
                    correct_count: correctCount,
                    wrong_count: wrongCount,
                    level_reached: level,
                    best_streak: bestStreak,
                    total_questions: totalQuestions,
                    accuracy: Math.round((correctCount / (correctCount + wrongCount)) * 100),
                    game_name: 'Sayısal Dizi Tamamlama',
                }
            });
        }
    }, [gameState]);

    // Cevap kontrolü
    const handleAnswer = (answer: number) => {
        if (showFeedback || !currentQuestion) return;

        setSelectedAnswer(answer);
        const isCorrect = answer === currentQuestion.answer;

        if (isCorrect) {
            setShowFeedback('correct');
            setCorrectCount(prev => prev + 1);
            setStreak(prev => {
                const newStreak = prev + 1;
                if (newStreak > bestStreak) setBestStreak(newStreak);
                return newStreak;
            });
            const levelBonus = level * 10;
            const streakBonus = streak * 5;
            setScore(prev => prev + 100 + levelBonus + streakBonus);
        } else {
            setShowFeedback('wrong');
            setWrongCount(prev => prev + 1);
            setStreak(0);
        }

        setTimeout(() => {
            setShowFeedback(null);
            setSelectedAnswer(null);

            if (questionNumber >= totalQuestions) {
                setGameState('finished');
            } else {
                // Her 3 soruda zorluk artır
                if ((questionNumber + 1) % 3 === 0 && level < 8) {
                    setLevel(prev => prev + 1);
                }
                setQuestionNumber(prev => prev + 1);
                const question = generateQuestion();
                setCurrentQuestion(question);
            }
        }, 2000);
    };

    const accuracy = correctCount + wrongCount > 0
        ? Math.round((correctCount / (correctCount + wrongCount)) * 100)
        : 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 pt-24 pb-12 px-6">
            <div className="container mx-auto max-w-4xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <Link
                        to="/atolyeler/bireysel-degerlendirme"
                        className="inline-flex items-center gap-2 text-blue-400 font-bold hover:text-blue-300 transition-colors mb-4 uppercase text-xs tracking-widest"
                    >
                        <ChevronLeft size={16} />
                        Bireysel Değerlendirme
                    </Link>
                    <h1 className="text-4xl lg:text-5xl font-black text-white mb-2">
                        🔢 <span className="text-blue-400">Sayısal Dizi</span> Tamamlama
                    </h1>
                    <p className="text-slate-400">Deseni bul, sıradaki sayıyı tahmin et!</p>
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
                                <Target className="w-5 h-5 text-blue-400" />
                                <span className="text-white font-bold">{questionNumber}/{totalQuestions}</span>
                            </div>
                            <div className="bg-slate-800/50 border border-white/10 rounded-xl px-5 py-2 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-emerald-400" />
                                <span className="text-white font-bold">Lv.{level}</span>
                            </div>
                            <div className="bg-slate-800/50 border border-white/10 rounded-xl px-5 py-2 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-amber-400" />
                                <span className="text-white font-bold">x{streak}</span>
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
                            <div className="bg-slate-800/50 border border-white/10 rounded-3xl p-8 max-w-md">
                                <div className="text-6xl mb-4">🔢</div>
                                <h2 className="text-2xl font-bold text-white mb-4">Sayısal Dizi Tamamlama</h2>

                                <div className="bg-slate-700/50 rounded-xl p-4 mb-6">
                                    <p className="text-slate-300 text-sm mb-3">Örnek:</p>
                                    <div className="flex justify-center gap-3 mb-2">
                                        {[2, 4, 8, 16].map((n, i) => (
                                            <span key={i} className="w-12 h-12 bg-blue-500/20 border border-blue-500/30 rounded-xl flex items-center justify-center text-blue-400 font-bold text-lg">
                                                {n}
                                            </span>
                                        ))}
                                        <span className="w-12 h-12 bg-amber-500/20 border-2 border-amber-500 rounded-xl flex items-center justify-center text-amber-400 font-bold text-lg">
                                            ?
                                        </span>
                                    </div>
                                    <p className="text-slate-400 text-sm">Cevap: <span className="text-blue-400 font-bold">32</span> (×2 ile çarpılıyor)</p>
                                </div>

                                <ul className="text-slate-400 text-sm space-y-2 text-left mb-6">
                                    <li className="flex items-center gap-2">
                                        <Hash className="w-4 h-4 text-blue-400" />
                                        Sayı dizisindeki <strong className="text-white">deseni bul</strong>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                                        Zorluk arttıkça farklı desenler
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-amber-400" />
                                        {totalQuestions} soru, sayısal zekânı test et!
                                    </li>
                                </ul>

                                <button
                                    onClick={startGame}
                                    className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl hover:from-blue-400 hover:to-cyan-400 transition-all flex items-center gap-3 mx-auto"
                                >
                                    <Play className="w-5 h-5" />
                                    Teste Başla
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Playing State */}
                    {gameState === 'playing' && currentQuestion && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="w-full max-w-2xl"
                        >
                            {/* Progress Bar */}
                            <div className="h-2 bg-slate-800 rounded-full mb-8 overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
                                />
                            </div>

                            {/* Sequence Display */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={questionNumber}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className={`bg-slate-800/50 border-4 rounded-3xl p-8 mb-6 ${showFeedback === 'correct' ? 'border-emerald-500 bg-emerald-500/10' :
                                        showFeedback === 'wrong' ? 'border-red-500 bg-red-500/10' :
                                            'border-white/10'
                                        } transition-all`}
                                >
                                    <p className="text-slate-400 text-sm text-center mb-6">Sıradaki sayı nedir?</p>

                                    <div className="flex justify-center items-center gap-3 flex-wrap">
                                        {currentQuestion.sequence.map((num, idx) => (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, scale: 0 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: idx * 0.1 }}
                                                className="w-14 h-14 lg:w-16 lg:h-16 bg-blue-500/20 border border-blue-500/30 rounded-xl flex items-center justify-center"
                                            >
                                                <span className="text-blue-400 font-bold text-xl lg:text-2xl">{num}</span>
                                            </motion.div>
                                        ))}
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: currentQuestion.sequence.length * 0.1 }}
                                            className={`w-14 h-14 lg:w-16 lg:h-16 rounded-xl flex items-center justify-center ${showFeedback
                                                ? showFeedback === 'correct'
                                                    ? 'bg-emerald-500/20 border-2 border-emerald-500'
                                                    : 'bg-red-500/20 border-2 border-red-500'
                                                : 'bg-amber-500/20 border-2 border-amber-500'
                                                }`}
                                        >
                                            <span className={`font-bold text-xl lg:text-2xl ${showFeedback
                                                ? showFeedback === 'correct'
                                                    ? 'text-emerald-400'
                                                    : 'text-red-400'
                                                : 'text-amber-400'
                                                }`}>
                                                {showFeedback ? currentQuestion.answer : '?'}
                                            </span>
                                        </motion.div>
                                    </div>

                                    {/* Pattern Description (after answer) */}
                                    <AnimatePresence>
                                        {showFeedback && (
                                            <motion.p
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="text-center text-slate-400 text-sm mt-4"
                                            >
                                                💡 {currentQuestion.patternDescription}
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            </AnimatePresence>

                            {/* Options */}
                            <div className="grid grid-cols-2 gap-4">
                                {currentQuestion.options.map((option, idx) => {
                                    const isSelected = selectedAnswer === option;
                                    const isCorrect = option === currentQuestion.answer;
                                    const showResult = showFeedback !== null;

                                    return (
                                        <motion.button
                                            key={idx}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            onClick={() => handleAnswer(option)}
                                            disabled={showFeedback !== null}
                                            whileHover={{ scale: showFeedback ? 1 : 1.02 }}
                                            whileTap={{ scale: showFeedback ? 1 : 0.98 }}
                                            className={`py-6 px-4 text-2xl font-bold rounded-2xl transition-all ${showResult
                                                ? isCorrect
                                                    ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400'
                                                    : isSelected
                                                        ? 'bg-red-500/20 border-2 border-red-500 text-red-400'
                                                        : 'bg-slate-800/50 border border-white/5 text-slate-500'
                                                : 'bg-slate-800/50 border border-white/10 text-white hover:bg-slate-700/50 hover:border-blue-500/50 active:scale-95'
                                                }`}
                                        >
                                            <div className="flex items-center justify-center gap-2">
                                                {showResult && isCorrect && <CheckCircle2 className="w-6 h-6" />}
                                                {showResult && isSelected && !isCorrect && <XCircle className="w-6 h-6" />}
                                                {option}
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </div>

                            {/* Feedback */}
                            <AnimatePresence>
                                {showFeedback && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className={`flex items-center justify-center gap-2 font-bold mt-6 ${showFeedback === 'correct' ? 'text-emerald-400' : 'text-red-400'
                                            }`}
                                    >
                                        {showFeedback === 'correct' ? (
                                            <>
                                                <CheckCircle2 className="w-6 h-6" />
                                                Doğru! +{100 + level * 10 + streak * 5} puan
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="w-6 h-6" />
                                                Doğrusu: {currentQuestion.answer} idi
                                            </>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}

                    {/* Finished State */}
                    {gameState === 'finished' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center space-y-6 w-full max-w-md"
                        >
                            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-3xl p-8">
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
                                        <p className="text-slate-400 text-sm">Ulaşılan Seviye</p>
                                        <p className="text-2xl font-black text-blue-400">Lv.{level}</p>
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
                                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl hover:from-blue-400 hover:to-cyan-400 transition-all flex items-center gap-2"
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

export default NumberSequenceGame;
