import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RotateCcw, Play, Star, Heart, CheckCircle2, XCircle, ChevronLeft, Zap, Smile, Timer, Sparkles, Eye } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSound } from '../../hooks/useSound';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useExam } from '../../contexts/ExamContext';

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

// Child-friendly messages
const SUCCESS_MESSAGES = [
    "Harika! 😊",
    "Süper! ⭐",
    "Doğru! 🎉",
    "Bravo! 🌟",
];

const FAILURE_MESSAGES = [
    "Dikkatli bak! 👀",
    "Tekrar dene! 💪",
];

interface FaceExpressionGameProps {
    examMode?: boolean;
    examLevel?: number;
    examTimeLimit?: number;
}

const FaceExpressionGame: React.FC<FaceExpressionGameProps> = ({ examMode: examModeProp = false }) => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();
    const navigate = useNavigate();
    const { submitResult } = useExam();

    // examMode can come from props OR location.state (when navigating from ExamContinuePage)
    const examMode = examModeProp || location.state?.examMode === true;
    const [gameState, setGameState] = useState<'idle' | 'playing' | 'finished'>('idle');
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [questionNumber, setQuestionNumber] = useState(0);
    const [score, setScore] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [wrongCount, setWrongCount] = useState(0);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
    const [feedbackMsg, setFeedbackMsg] = useState('');
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState(60);
    const [lives, setLives] = useState(3);
    const gameStartTimeRef = useRef<number>(0);
    const hasSavedRef = useRef<boolean>(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const gameDuration = 60;
    const optionsCount = 4;

    // Back link
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

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
        setLives(3);
        setTimeLeft(gameDuration);
        gameStartTimeRef.current = Date.now();
        hasSavedRef.current = false;
        setFeedback(null);
        setSelectedAnswer(null);
        setCurrentQuestion(generateQuestion());
    }, [generateQuestion]);

    // Handle Auto Start from HUB or Exam Mode
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
            const accuracy = correctCount + wrongCount > 0
                ? Math.round((correctCount / (correctCount + wrongCount)) * 100)
                : 0;

            // Exam mode: submit result and navigate
            if (examMode) {
                const passed = accuracy >= 60;
                submitResult(passed, score, 1000, durationSeconds).then(() => {
                    navigate('/atolyeler/sinav-simulasyonu/devam');
                });
                return;
            }

            saveGamePlay({
                game_id: 'yuz-ifadesi',
                score_achieved: score,
                duration_seconds: durationSeconds,
                lives_remaining: lives,
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
    }, [gameState, score, lives, correctCount, wrongCount, bestStreak, saveGamePlay, examMode, navigate, submitResult]);

    // Cevap kontrolü
    const handleAnswer = useCallback((emotionId: string) => {
        if (feedback || !currentQuestion) return;

        setSelectedAnswer(emotionId);
        const isCorrect = emotionId === currentQuestion.correctEmotion.id;

        if (isCorrect) {
            playSound('correct');
            setFeedback('correct');
            setFeedbackMsg(SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)]);
            setCorrectCount(prev => prev + 1);
            setStreak(prev => {
                const newStreak = prev + 1;
                if (newStreak > bestStreak) setBestStreak(newStreak);
                return newStreak;
            });
            const streakBonus = Math.min(streak * 10, 50);
            setScore(prev => prev + 100 + streakBonus);
        } else {
            playSound('incorrect');
            setFeedback('wrong');
            setFeedbackMsg(FAILURE_MESSAGES[Math.floor(Math.random() * FAILURE_MESSAGES.length)]);
            setWrongCount(prev => prev + 1);
            setStreak(0);
            setLives(l => l - 1);
        }

        setTimeout(() => {
            setFeedback(null);
            setSelectedAnswer(null);

            if (lives <= 1 && !isCorrect) {
                setGameState('finished');
            } else {
                setQuestionNumber(prev => prev + 1);
                setCurrentQuestion(generateQuestion());
            }
        }, 1500);
    }, [feedback, currentQuestion, streak, bestStreak, generateQuestion, lives, playSound]);

    const accuracy = correctCount + wrongCount > 0
        ? Math.round((correctCount / (correctCount + wrongCount)) * 100)
        : 0;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Welcome Screen
    if (gameState === 'idle') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-fuchsia-950 to-purple-950 text-white">
                {/* Decorative Background */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
                </div>

                <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center max-w-xl"
                    >
                        {/* 3D Gummy Icon */}
                        <motion.div
                            className="w-28 h-28 rounded-[40%] flex items-center justify-center mx-auto mb-6"
                            style={{
                                background: 'linear-gradient(135deg, #D946EF 0%, #C026D3 100%)',
                                boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)'
                            }}
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <Smile size={52} className="text-white drop-shadow-lg" />
                        </motion.div>

                        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
                            😊 Yüz İfadesi Tanıma
                        </h1>

                        {/* Emotions Preview */}
                        <div
                            className="rounded-2xl p-5 mb-6"
                            style={{
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.2)',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}
                        >
                            <p className="text-slate-400 text-sm mb-3">Temel Duygular:</p>
                            <div className="flex flex-wrap justify-center gap-2">
                                {EMOTIONS.slice(0, 6).map((emotion) => (
                                    <div
                                        key={emotion.id}
                                        className="flex items-center gap-1 bg-white/10 rounded-lg px-2 py-1"
                                    >
                                        <span className="text-xl">{emotion.emoji}</span>
                                        <span className="text-slate-300 text-xs">{emotion.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                            <h3 className="text-lg font-bold text-fuchsia-300 mb-3 flex items-center gap-2">
                                <Eye size={20} /> Nasıl Oynanır?
                            </h3>
                            <ul className="space-y-2 text-slate-300 text-sm">
                                <li className="flex items-center gap-2">
                                    <Sparkles size={14} className="text-fuchsia-400" />
                                    <span>Yüz ifadesini <strong>incele</strong></span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Sparkles size={14} className="text-fuchsia-400" />
                                    <span>Hangi <strong>duyguyu</strong> ifade ediyor?</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Sparkles size={14} className="text-fuchsia-400" />
                                    <span>{gameDuration} saniye, 3 can! Hızlı ol!</span>
                                </li>
                            </ul>
                        </div>

                        {/* TUZÖ Badge */}
                        <div className="bg-fuchsia-500/10 text-fuchsia-300 text-xs px-4 py-2 rounded-full mb-6 inline-block border border-fuchsia-500/30">
                            TUZÖ 7.1.1 Sosyal Algı
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.05, y: -4 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={startGame}
                            className="px-8 py-4 rounded-2xl font-bold text-lg"
                            style={{
                                background: 'linear-gradient(135deg, #D946EF 0%, #C026D3 100%)',
                                boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(217, 70, 239, 0.4)'
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <Play size={24} fill="currentColor" />
                                <span>Teste Başla</span>
                            </div>
                        </motion.button>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-fuchsia-950 to-purple-950 text-white">
            {/* Decorative Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
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

                        {/* Timer */}
                        {gameState === 'playing' && (
                            <div
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl ${timeLeft <= 10 ? 'animate-pulse' : ''}`}
                                style={{
                                    background: timeLeft <= 10
                                        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.2) 100%)'
                                        : 'linear-gradient(135deg, rgba(217, 70, 239, 0.2) 0%, rgba(192, 38, 211, 0.1) 100%)',
                                    boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                                    border: timeLeft <= 10 ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(217, 70, 239, 0.3)'
                                }}
                            >
                                <Timer className={timeLeft <= 10 ? 'text-red-400' : 'text-fuchsia-400'} size={18} />
                                <span className={`font-bold font-mono ${timeLeft <= 10 ? 'text-red-400' : 'text-fuchsia-400'}`}>
                                    {formatTime(timeLeft)}
                                </span>
                            </div>
                        )}

                        {/* Streak */}
                        {streak > 0 && (
                            <div
                                className="flex items-center gap-2 px-4 py-2 rounded-xl"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.3) 0%, rgba(245, 158, 11, 0.2) 100%)',
                                    boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(251, 191, 36, 0.5)'
                                }}
                            >
                                <Zap className="text-amber-400" size={18} />
                                <span className="font-bold text-amber-400">x{streak}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-4">
                <AnimatePresence mode="wait">
                    {gameState === 'playing' && currentQuestion && (
                        <motion.div
                            key="game"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
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
                            <div
                                className="rounded-3xl p-8 mb-6 text-center"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}
                            >
                                <p className="text-slate-400 text-sm mb-4">Bu yüz ifadesi hangi duyguyu ifade ediyor?</p>

                                {/* Big Emoji */}
                                <motion.div
                                    key={questionNumber}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', bounce: 0.5 }}
                                    className="text-9xl mb-4"
                                >
                                    {currentQuestion.emoji}
                                </motion.div>
                            </div>

                            {/* Options */}
                            <div className="grid grid-cols-2 gap-3">
                                {currentQuestion.options.map((emotion, idx) => {
                                    const isSelected = selectedAnswer === emotion.id;
                                    const isCorrect = emotion.id === currentQuestion.correctEmotion.id;
                                    const showResult = feedback !== null;

                                    return (
                                        <motion.button
                                            key={emotion.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            onClick={() => handleAnswer(emotion.id)}
                                            disabled={feedback !== null}
                                            whileHover={!feedback ? { scale: 0.98, y: -2 } : {}}
                                            whileTap={!feedback ? { scale: 0.95 } : {}}
                                            className="p-4 rounded-2xl transition-all flex items-center gap-3"
                                            style={{
                                                background: showResult && isCorrect
                                                    ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                                                    : showResult && isSelected && !isCorrect
                                                        ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                                                        : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                                                boxShadow: showResult && (isCorrect || (isSelected && !isCorrect))
                                                    ? '0 0 20px rgba(217, 70, 239, 0.3)'
                                                    : 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.05)',
                                                border: showResult && isCorrect
                                                    ? '2px solid #10B981'
                                                    : showResult && isSelected && !isCorrect
                                                        ? '2px solid #EF4444'
                                                        : '1px solid rgba(255,255,255,0.1)',
                                                cursor: feedback ? 'default' : 'pointer',
                                                opacity: showResult && !isCorrect && !isSelected ? 0.5 : 1
                                            }}
                                        >
                                            <span
                                                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                                                style={{ backgroundColor: emotion.color + '30' }}
                                            >
                                                {emotion.emoji}
                                            </span>
                                            <div className="text-left">
                                                <p className="font-bold text-white">
                                                    {emotion.name}
                                                </p>
                                                <p className="text-slate-400 text-xs">{emotion.description}</p>
                                            </div>
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
                                    background: accuracy >= 70
                                        ? 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)'
                                        : 'linear-gradient(135deg, #D946EF 0%, #EF4444 100%)',
                                    boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)'
                                }}
                                animate={{ rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <Trophy size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h2 className="text-3xl font-black text-fuchsia-300 mb-2">
                                {lives <= 0 ? 'Tekrar Deneyelim! 💪' : timeLeft <= 0 ? 'Süre Doldu! ⏰' : accuracy >= 80 ? '🎉 Harika!' : 'İyi İş!'}
                            </h2>
                            <p className="text-slate-400 mb-6">
                                {accuracy >= 80 ? 'Duygu ustasısın!' : 'Tekrar deneyelim!'}
                            </p>

                            <div
                                className="rounded-2xl p-6 mb-8"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Skor</p>
                                        <p className="text-2xl font-bold text-amber-400">{score}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Doğruluk</p>
                                        <p className="text-2xl font-bold text-emerald-400">%{accuracy}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Toplam Soru</p>
                                        <p className="text-2xl font-bold text-fuchsia-400">{correctCount + wrongCount}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">En İyi Seri</p>
                                        <p className="text-2xl font-bold text-purple-400">x{bestStreak}</p>
                                    </div>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={startGame}
                                className="w-full px-6 py-4 rounded-2xl font-bold text-lg mb-4"
                                style={{
                                    background: 'linear-gradient(135deg, #D946EF 0%, #C026D3 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(217, 70, 239, 0.4)'
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
                <AnimatePresence>
                    {feedback && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                        >
                            <motion.div
                                initial={{ y: 50 }}
                                animate={{ y: 0 }}
                                className={`px-12 py-8 rounded-3xl text-center ${feedback === 'correct'
                                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                                    : 'bg-gradient-to-br from-orange-500 to-amber-600'
                                    }`}
                                style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}
                            >
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1], rotate: feedback === 'correct' ? [0, 10, -10, 0] : [0, -5, 5, 0] }}
                                    transition={{ duration: 0.5 }}
                                >
                                    {feedback === 'correct'
                                        ? <CheckCircle2 size={64} className="mx-auto mb-4 text-white" />
                                        : <XCircle size={64} className="mx-auto mb-4 text-white" />
                                    }
                                </motion.div>
                                <p className="text-3xl font-black text-white">{feedbackMsg}</p>
                                {feedback === 'wrong' && currentQuestion && (
                                    <p className="text-white/80 mt-2">
                                        Doğrusu: <span className="font-bold">{currentQuestion.correctEmotion.name}</span>
                                    </p>
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default FaceExpressionGame;
