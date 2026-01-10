import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RotateCcw, Play, Star, Timer, CheckCircle2, XCircle, ChevronLeft, Zap, Heart, Smile } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';

// Duygu tanımları - emoji ve açıklamalarıyla
const EMOTIONS = [
    {
        id: 'mutlu',
        name: 'Mutlu',
        emoji: '😊',
        description: 'Neşeli, sevinçli',
        color: '#eab308' // yellow
    },
    {
        id: 'uzgun',
        name: 'Üzgün',
        emoji: '😢',
        description: 'Kederli, hüzünlü',
        color: '#3b82f6' // blue
    },
    {
        id: 'kizgin',
        name: 'Kızgın',
        emoji: '😠',
        description: 'Öfkeli, sinirli',
        color: '#ef4444' // red
    },
    {
        id: 'saskin',
        name: 'Şaşkın',
        emoji: '😲',
        description: 'Hayret içinde',
        color: '#f97316' // orange
    },
    {
        id: 'korkmus',
        name: 'Korkmuş',
        emoji: '😨',
        description: 'Ürkmüş, endişeli',
        color: '#a855f7' // purple
    },
    {
        id: 'igrenme',
        name: 'İğrenme',
        emoji: '🤢',
        description: 'Tiksinmiş',
        color: '#22c55e' // green
    },
    {
        id: 'nötr',
        name: 'Nötr',
        emoji: '😐',
        description: 'Tarafsız, sakin',
        color: '#64748b' // slate
    },
    {
        id: 'dusunceli',
        name: 'Düşünceli',
        emoji: '🤔',
        description: 'Derin düşüncede',
        color: '#06b6d4' // cyan
    },
];

// Ek yüz ifadeleri (aynı duyguların farklı varyasyonları)
const EXPRESSION_VARIANTS: Record<string, string[]> = {
    'mutlu': ['😊', '😄', '😁', '🙂', '☺️', '😃'],
    'uzgun': ['😢', '😞', '😔', '🙁', '😿', '😥'],
    'kizgin': ['😠', '😡', '🤬', '😤', '💢', '👿'],
    'saskin': ['😲', '😮', '😯', '🤯', '😳', '🫢'],
    'korkmus': ['😨', '😰', '😱', '🫣', '😧', '🥶'],
    'igrenme': ['🤢', '🤮', '😖', '😣', '🥴', '😬'],
    'nötr': ['😐', '😑', '😶', '🫡', '😏', '🙄'],
    'dusunceli': ['🤔', '🧐', '🤨', '😕', '💭', '🤷'],
};

interface Question {
    emoji: string;
    correctEmotion: typeof EMOTIONS[0];
    options: typeof EMOTIONS[0][];
}

const FaceExpressionGame: React.FC = () => {
    const { saveGamePlay } = useGamePersistence();
    const [gameState, setGameState] = useState<'idle' | 'playing' | 'finished'>('idle');
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [questionNumber, setQuestionNumber] = useState(0);
    const [score, setScore] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [wrongCount, setWrongCount] = useState(0);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [showFeedback, setShowFeedback] = useState<'correct' | 'wrong' | null>(null);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState(60);
    const gameStartTimeRef = useRef<number>(0);
    const hasSavedRef = useRef<boolean>(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const gameDuration = 60;
    const optionsCount = 4;

    // Soru oluştur
    const generateQuestion = useCallback((): Question => {
        // Rastgele bir duygu seç
        const correctEmotion = EMOTIONS[Math.floor(Math.random() * EMOTIONS.length)];

        // O duygunun varyasyonlarından rastgele bir emoji seç
        const variants = EXPRESSION_VARIANTS[correctEmotion.id];
        const emoji = variants[Math.floor(Math.random() * variants.length)];

        // Yanlış seçenekler oluştur
        const wrongOptions = EMOTIONS
            .filter(e => e.id !== correctEmotion.id)
            .sort(() => Math.random() - 0.5)
            .slice(0, optionsCount - 1);

        // Seçenekleri karıştır
        const options = [correctEmotion, ...wrongOptions].sort(() => Math.random() - 0.5);

        return { emoji, correctEmotion, options };
    }, []);

    // Oyunu başlat
    const startGame = useCallback(() => {
        setGameState('playing');
        setQuestionNumber(1);
        setScore(0);
        setCorrectCount(0);
        setWrongCount(0);
        setStreak(0);
        setBestStreak(0);
        setTimeLeft(gameDuration);
        gameStartTimeRef.current = Date.now();
        hasSavedRef.current = false;
        setShowFeedback(null);
        setSelectedAnswer(null);
        setCurrentQuestion(generateQuestion());
    }, [generateQuestion]);

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
            const accuracy = correctCount + wrongCount > 0
                ? Math.round((correctCount / (correctCount + wrongCount)) * 100)
                : 0;

            saveGamePlay({
                game_id: 'yuz-ifadesi',
                score_achieved: score,
                duration_seconds: durationSeconds,
                metadata: {
                    correct_count: correctCount,
                    wrong_count: wrongCount,
                    best_streak: bestStreak,
                    total_questions: correctCount + wrongCount,
                    accuracy,
                    game_name: 'Yüz İfadesi Tanıma',
                }
            });
        }
    }, [gameState]);

    // Cevap kontrolü
    const handleAnswer = useCallback((emotionId: string) => {
        if (showFeedback || !currentQuestion) return;

        setSelectedAnswer(emotionId);
        const isCorrect = emotionId === currentQuestion.correctEmotion.id;

        if (isCorrect) {
            setShowFeedback('correct');
            setCorrectCount(prev => prev + 1);
            setStreak(prev => {
                const newStreak = prev + 1;
                if (newStreak > bestStreak) setBestStreak(newStreak);
                return newStreak;
            });
            const streakBonus = Math.min(streak * 10, 50);
            setScore(prev => prev + 100 + streakBonus);
        } else {
            setShowFeedback('wrong');
            setWrongCount(prev => prev + 1);
            setStreak(0);
        }

        setTimeout(() => {
            setShowFeedback(null);
            setSelectedAnswer(null);
            setQuestionNumber(prev => prev + 1);
            setCurrentQuestion(generateQuestion());
        }, 1500);
    }, [showFeedback, currentQuestion, streak, bestStreak, generateQuestion]);

    const accuracy = correctCount + wrongCount > 0
        ? Math.round((correctCount / (correctCount + wrongCount)) * 100)
        : 0;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-pink-950 to-slate-900 pt-24 pb-12 px-6">
            <div className="container mx-auto max-w-4xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-6"
                >
                    <Link
                        to="/atolyeler/bireysel-degerlendirme"
                        className="inline-flex items-center gap-2 text-pink-400 font-bold hover:text-pink-300 transition-colors mb-4 uppercase text-xs tracking-widest"
                    >
                        <ChevronLeft size={16} />
                        Bireysel Değerlendirme
                    </Link>
                    <h1 className="text-4xl lg:text-5xl font-black text-white mb-2">
                        😊 <span className="text-pink-400">Yüz İfadesi</span> Tanıma
                    </h1>
                    <p className="text-slate-400">Duyguları yüz ifadesinden tanı!</p>
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
                                <Timer className={`w-5 h-5 ${timeLeft <= 10 ? 'text-red-400' : 'text-pink-400'}`} />
                                <span className={`font-bold ${timeLeft <= 10 ? 'text-red-400' : 'text-white'}`}>{formatTime(timeLeft)}</span>
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
                            <div className="bg-slate-800/50 border border-white/10 rounded-3xl p-8 max-w-lg">
                                <div className="text-6xl mb-4">😊</div>
                                <h2 className="text-2xl font-bold text-white mb-4">Yüz İfadesi Tanıma</h2>

                                <div className="bg-slate-700/50 rounded-xl p-4 mb-6">
                                    <p className="text-slate-300 text-sm mb-3">Temel Duygular:</p>
                                    <div className="flex flex-wrap justify-center gap-2 mb-3">
                                        {EMOTIONS.slice(0, 6).map((emotion) => (
                                            <div
                                                key={emotion.id}
                                                className="flex items-center gap-1 bg-slate-600/50 rounded-lg px-2 py-1"
                                            >
                                                <span className="text-xl">{emotion.emoji}</span>
                                                <span className="text-slate-300 text-xs">{emotion.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <ul className="text-slate-400 text-sm space-y-2 text-left mb-6">
                                    <li className="flex items-center gap-2">
                                        <Smile className="w-4 h-4 text-pink-400" />
                                        Yüz ifadesini incele
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Heart className="w-4 h-4 text-red-400" />
                                        Hangi duyguyu ifade ediyor?
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Timer className="w-4 h-4 text-amber-400" />
                                        {gameDuration} saniyede en çok doğruyu bul!
                                    </li>
                                </ul>

                                <button
                                    onClick={startGame}
                                    className="px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-xl hover:from-pink-400 hover:to-rose-400 transition-all flex items-center gap-3 mx-auto"
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
                            className="w-full max-w-xl"
                        >
                            {/* Progress */}
                            <div className="flex justify-center items-center gap-4 mb-4 text-sm text-slate-400">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span>{correctCount} Doğru</span>
                                </div>
                                <span className="text-slate-600">|</span>
                                <div className="flex items-center gap-2">
                                    <XCircle className="w-4 h-4 text-red-400" />
                                    <span>{wrongCount} Yanlış</span>
                                </div>
                            </div>

                            {/* Question Card */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={questionNumber}
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                                    className={`bg-slate-800/50 border-4 rounded-3xl p-8 mb-6 text-center ${showFeedback === 'correct' ? 'border-emerald-500 bg-emerald-500/10' :
                                        showFeedback === 'wrong' ? 'border-red-500 bg-red-500/10' :
                                            'border-white/10'
                                        } transition-all`}
                                >
                                    <p className="text-slate-400 text-sm mb-4">Bu yüz ifadesi hangi duyguyu ifade ediyor?</p>

                                    {/* Big Emoji */}
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', bounce: 0.5 }}
                                        className="text-9xl mb-6"
                                    >
                                        {currentQuestion.emoji}
                                    </motion.div>

                                    {/* Feedback */}
                                    <AnimatePresence>
                                        {showFeedback && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0 }}
                                                className={`flex items-center justify-center gap-2 font-bold ${showFeedback === 'correct' ? 'text-emerald-400' : 'text-red-400'
                                                    }`}
                                            >
                                                {showFeedback === 'correct' ? (
                                                    <>
                                                        <CheckCircle2 className="w-6 h-6" />
                                                        Doğru! Bu {currentQuestion.correctEmotion.name}
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle className="w-6 h-6" />
                                                        Yanlış! Doğrusu: {currentQuestion.correctEmotion.name}
                                                    </>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            </AnimatePresence>

                            {/* Options */}
                            <div className="grid grid-cols-2 gap-3">
                                {currentQuestion.options.map((emotion, idx) => {
                                    const isSelected = selectedAnswer === emotion.id;
                                    const isCorrect = emotion.id === currentQuestion.correctEmotion.id;
                                    const showResult = showFeedback !== null;

                                    return (
                                        <motion.button
                                            key={emotion.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            onClick={() => handleAnswer(emotion.id)}
                                            disabled={showFeedback !== null}
                                            whileHover={{ scale: showFeedback ? 1 : 1.02 }}
                                            whileTap={{ scale: showFeedback ? 1 : 0.98 }}
                                            className={`p-4 rounded-2xl transition-all flex items-center gap-3 ${showResult
                                                ? isCorrect
                                                    ? 'bg-emerald-500/20 border-2 border-emerald-500'
                                                    : isSelected
                                                        ? 'bg-red-500/20 border-2 border-red-500'
                                                        : 'bg-slate-800/50 border border-white/5'
                                                : 'bg-slate-800/50 border border-white/10 hover:bg-slate-700/50 hover:border-pink-500/50'
                                                }`}
                                        >
                                            <span
                                                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                                                style={{ backgroundColor: emotion.color + '30' }}
                                            >
                                                {emotion.emoji}
                                            </span>
                                            <div className="text-left">
                                                <p className={`font-bold ${showResult && isCorrect ? 'text-emerald-400' :
                                                    showResult && isSelected ? 'text-red-400' :
                                                        'text-white'
                                                    }`}>
                                                    {emotion.name}
                                                </p>
                                                <p className="text-slate-500 text-xs">{emotion.description}</p>
                                            </div>
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
                            <div className="bg-gradient-to-br from-pink-500/20 to-rose-500/20 border border-pink-500/30 rounded-3xl p-8">
                                <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                                <h2 className="text-3xl font-black text-white mb-2">Süre Doldu! 😊</h2>

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
                                        <p className="text-slate-400 text-sm">Toplam Soru</p>
                                        <p className="text-2xl font-black text-pink-400">{correctCount + wrongCount}</p>
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
                                        className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-xl hover:from-pink-400 hover:to-rose-400 transition-all flex items-center gap-2"
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

export default FaceExpressionGame;
