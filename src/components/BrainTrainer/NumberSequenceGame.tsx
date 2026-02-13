import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RotateCcw, Play, Star, Target, CheckCircle2, XCircle, ChevronLeft, Zap, Hash, TrendingUp, Eye, Sparkles, Heart } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';
import { useExam } from '../../contexts/ExamContext';

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

// Child-friendly messages


const NumberSequenceGame: React.FC = () => {
    const { saveGamePlay } = useGamePersistence();
    const { submitResult } = useExam();
    const { feedbackState, showFeedback: triggerFeedback } = useGameFeedback();
    const location = useLocation();
    const navigate = useNavigate();
    const [gameState, setGameState] = useState<'idle' | 'playing' | 'finished'>('idle');
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [questionNumber, setQuestionNumber] = useState(0);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [correctCount, setCorrectCount] = useState(0);
    const [wrongCount, setWrongCount] = useState(0);
    const [level, setLevel] = useState(1);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const gameStartTimeRef = useRef<number>(0);
    const hasSavedRef = useRef<boolean>(false);

    const totalQuestions = 15;

    // Exam Mode Props
    const examMode = location.state?.examMode || false;

    // Back link
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

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
                const start = Math.floor(Math.random() * 10) + 1;
                const diff = Math.floor(Math.random() * (lvl + 2)) + 1;
                const sequence = Array.from({ length: seqLength }, (_, i) => start + i * diff);
                const answer = start + seqLength * diff;
                return { sequence, answer, description: `Her sayı ${diff} artıyor` };
            }
            case 'geometric': {
                const start = Math.floor(Math.random() * 3) + 1;
                const ratio = lvl <= 3 ? 2 : Math.floor(Math.random() * 2) + 2;
                const sequence = Array.from({ length: seqLength }, (_, i) => start * Math.pow(ratio, i));
                const answer = start * Math.pow(ratio, seqLength);
                return { sequence, answer, description: `Her sayı ${ratio} ile çarpılıyor` };
            }
            case 'fibonacci': {
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
                const start = Math.floor(Math.random() * 3) + 1;
                const sequence = Array.from({ length: seqLength }, (_, i) => Math.pow(start + i, 2));
                const answer = Math.pow(start + seqLength, 2);
                return { sequence, answer, description: 'Ardışık sayıların kareleri' };
            }
            case 'cube': {
                const start = Math.floor(Math.random() * 2) + 1;
                const sequence = Array.from({ length: seqLength }, (_, i) => Math.pow(start + i, 3));
                const answer = Math.pow(start + seqLength, 3);
                return { sequence, answer, description: 'Ardışık sayıların küpleri' };
            }
            case 'prime': {
                const startIdx = Math.floor(Math.random() * 5);
                const sequence = PRIMES.slice(startIdx, startIdx + seqLength);
                const answer = PRIMES[startIdx + seqLength];
                return { sequence, answer, description: 'Asal sayılar serisi' };
            }
            case 'alternating': {
                const start = Math.floor(Math.random() * 5) + 1;
                const diff1 = Math.floor(Math.random() * 3) + 1;
                const diff2 = Math.floor(Math.random() * 3) + 2;
                const sequence = [start];
                for (let i = 1; i < seqLength; i++) {
                    sequence.push(sequence[i - 1] + (i % 2 === 1 ? diff1 : diff2));
                }
                const answer = sequence[seqLength - 1] + (seqLength % 2 === 1 ? diff1 : diff2);
                return { sequence, answer, description: `Değişen artış: +${diff1}, +${diff2}...` };
            }
            case 'doubleStep': {
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
        window.scrollTo(0, 0);
        setGameState('playing');
        setQuestionNumber(1);
        setScore(0);
        setLives(3);
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
    }, [generateQuestion]);

    // Auto start from HUB or examMode
    useEffect(() => {
        if ((location.state?.autoStart || examMode) && gameState === 'idle') {
            startGame();
        }
    }, [location.state, gameState, startGame, examMode]);

    // Oyun bittiğinde verileri kaydet
    useEffect(() => {
        if (gameState === 'finished' && gameStartTimeRef.current > 0 && !hasSavedRef.current) {
            hasSavedRef.current = true;
            const durationSeconds = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);

            // Exam mode: submit result and redirect
            if (examMode) {
                const passed = correctCount >= Math.floor(totalQuestions * 0.6);
                await submitResult(passed, score, totalQuestions * 150, durationSeconds).then(() => {
                navigate("/atolyeler/sinav-simulasyonu/devam"); });
                return;
            }

            saveGamePlay({
                game_id: 'sayisal-dizi',
                score_achieved: score,
                duration_seconds: durationSeconds,
                lives_remaining: lives,
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
    }, [gameState, score, lives, correctCount, wrongCount, level, bestStreak, saveGamePlay, examMode, submitResult, navigate]);

    // Cevap kontrolü
    const handleAnswer = (answer: number) => {
        if (feedbackState || !currentQuestion) return;

        setSelectedAnswer(answer);
        const isCorrect = answer === currentQuestion.answer;

        if (isCorrect) {
            triggerFeedback(true);
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
            triggerFeedback(false);
            setWrongCount(prev => prev + 1);
            setStreak(0);
            setLives(prev => prev - 1);
        }

        setTimeout(() => {
            setSelectedAnswer(null);

            if (lives <= 1 && !isCorrect) {
                setGameState('finished');
            } else if (questionNumber >= totalQuestions) {
                setGameState('finished');
            } else {
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
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-white">
            {/* Decorative Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
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

                            {/* Level */}
                            <div
                                className="flex items-center gap-2 px-4 py-2 rounded-xl"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(79, 70, 229, 0.1) 100%)',
                                    boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(99, 102, 241, 0.3)'
                                }}
                            >
                                <TrendingUp className="text-indigo-400" size={18} />
                                <span className="font-bold text-indigo-400">Lv.{level}</span>
                            </div>

                            {/* Streak */}
                            {streak > 0 && (
                                <div
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)',
                                        boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                                        border: '1px solid rgba(168, 85, 247, 0.3)'
                                    }}
                                >
                                    <Zap className="text-purple-400" size={18} />
                                    <span className="font-bold text-purple-400">x{streak}</span>
                                </div>
                            )}

                            {/* Progress */}
                            <div
                                className="flex items-center gap-2 px-4 py-2 rounded-xl"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(8, 145, 178, 0.1) 100%)',
                                    boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(6, 182, 212, 0.3)'
                                }}
                            >
                                <Target className="text-cyan-400" size={18} />
                                <span className="font-bold text-cyan-400">{questionNumber}/{totalQuestions}</span>
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
                                    background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                                    boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)'
                                }}
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Hash size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                                🔢 Sayısal Dizi
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
                                <div className="flex justify-center gap-2 mb-3">
                                    {[2, 4, 8, 16].map((n, i) => (
                                        <div
                                            key={i}
                                            className="w-12 h-12 rounded-[30%] flex items-center justify-center text-lg font-bold"
                                            style={{
                                                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(79, 70, 229, 0.2) 100%)',
                                                boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2)',
                                                border: '1px solid rgba(99, 102, 241, 0.3)'
                                            }}
                                        >
                                            {n}
                                        </div>
                                    ))}
                                    <div
                                        className="w-12 h-12 rounded-[30%] flex items-center justify-center text-lg font-bold text-amber-400"
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.3) 0%, rgba(245, 158, 11, 0.2) 100%)',
                                            boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2)',
                                            border: '2px solid rgba(251, 191, 36, 0.5)'
                                        }}
                                    >
                                        ?
                                    </div>
                                </div>
                                <p className="text-slate-400 text-sm">Cevap: <span className="text-indigo-400 font-bold">32</span> (×2 ile çarpılıyor)</p>
                            </div>

                            {/* Instructions */}
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                                <h3 className="text-lg font-bold text-indigo-300 mb-3 flex items-center gap-2">
                                    <Eye size={20} /> Nasıl Oynanır?
                                </h3>
                                <ul className="space-y-2 text-slate-300 text-sm">
                                    <li className="flex items-center gap-2">
                                        <Sparkles size={14} className="text-blue-400" />
                                        <span>Sayı dizisindeki <strong>deseni bul</strong></span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Sparkles size={14} className="text-blue-400" />
                                        <span>Sıradaki sayıyı tahmin et</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Sparkles size={14} className="text-blue-400" />
                                        <span>{totalQuestions} soru, 3 can!</span>
                                    </li>
                                </ul>
                            </div>

                            {/* TUZÖ Badge */}
                            <div className="bg-indigo-500/10 text-indigo-300 text-xs px-4 py-2 rounded-full mb-6 inline-block border border-indigo-500/30">
                                TUZÖ 3.1.1 Sayısal Akıl Yürütme
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05, y: -4 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={startGame}
                                className="px-8 py-4 rounded-2xl font-bold text-lg"
                                style={{
                                    background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(99, 102, 241, 0.4)'
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <Play size={24} fill="currentColor" />
                                    <span>Teste Başla</span>
                                </div>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* Playing State */}
                    {gameState === 'playing' && currentQuestion && (
                        <motion.div
                            key="game"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full max-w-2xl"
                        >
                            {/* Progress Bar */}
                            <div
                                className="h-3 rounded-full mb-8 overflow-hidden"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}
                            >
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{
                                        background: 'linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)',
                                        boxShadow: '0 0 10px rgba(99, 102, 241, 0.5)'
                                    }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>

                            {/* Sequence Display */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={questionNumber}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="rounded-3xl p-8 mb-6 transition-all"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                        boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.2)',
                                        border: feedbackState?.correct === true ? '2px solid #10B981' :
                                            feedbackState?.correct === false ? '2px solid #EF4444' :
                                                '1px solid rgba(255,255,255,0.1)'
                                    }}
                                >
                                    <p className="text-slate-400 text-sm text-center mb-6">Sıradaki sayı nedir?</p>

                                    <div className="flex justify-center items-center gap-3 flex-wrap">
                                        {currentQuestion.sequence.map((num, idx) => (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, scale: 0 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: idx * 0.1 }}
                                                className="w-14 h-14 lg:w-16 lg:h-16 rounded-[30%] flex items-center justify-center"
                                                style={{
                                                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(79, 70, 229, 0.2) 100%)',
                                                    boxShadow: 'inset 0 -3px 6px rgba(0,0,0,0.2), inset 0 3px 6px rgba(255,255,255,0.1)',
                                                    border: '1px solid rgba(99, 102, 241, 0.3)'
                                                }}
                                            >
                                                <span className="text-indigo-300 font-bold text-xl lg:text-2xl">{num}</span>
                                            </motion.div>
                                        ))}
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: currentQuestion.sequence.length * 0.1 }}
                                            className="w-14 h-14 lg:w-16 lg:h-16 rounded-[30%] flex items-center justify-center"
                                            style={{
                                                background: feedbackState?.correct === true
                                                    ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                                                    : feedbackState?.correct === false
                                                        ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                                                        : 'linear-gradient(135deg, rgba(251, 191, 36, 0.3) 0%, rgba(245, 158, 11, 0.2) 100%)',
                                                boxShadow: 'inset 0 -3px 6px rgba(0,0,0,0.2), inset 0 3px 6px rgba(255,255,255,0.1)',
                                                border: feedbackState?.correct === true ? '2px solid #10B981' :
                                                    feedbackState?.correct === false ? '2px solid #EF4444' :
                                                        '2px solid rgba(251, 191, 36, 0.5)'
                                            }}
                                        >
                                            <span className={`font-bold text-xl lg:text-2xl ${feedbackState ? 'text-white' : 'text-amber-400'
                                                }`}>
                                                {feedbackState ? currentQuestion.answer : '?'}
                                            </span>
                                        </motion.div>
                                    </div>

                                    {/* Pattern Description */}
                                    <AnimatePresence>
                                        {feedbackState && (
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
                                    const showResult = feedbackState !== null;

                                    return (
                                        <motion.button
                                            key={idx}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            onClick={() => handleAnswer(option)}
                                            disabled={feedbackState !== null}
                                            whileHover={!feedbackState ? { scale: 0.98, y: -2 } : {}}
                                            whileTap={!feedbackState ? { scale: 0.95 } : {}}
                                            className="py-6 px-4 text-2xl font-bold rounded-[25%] transition-all"
                                            style={{
                                                background: showResult && isCorrect
                                                    ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                                                    : showResult && isSelected && !isCorrect
                                                        ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                                                        : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                                                boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.1)',
                                                border: showResult && isCorrect ? '2px solid #10B981' :
                                                    showResult && isSelected ? '2px solid #EF4444' :
                                                        '1px solid rgba(255,255,255,0.1)',
                                                cursor: feedbackState ? 'default' : 'pointer',
                                                opacity: showResult && !isCorrect && !isSelected ? 0.5 : 1
                                            }}
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
                                {accuracy >= 80 ? 'Müthiş sayısal zekâ!' : 'Tekrar deneyelim!'}
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
                                        <p className="text-slate-400 text-sm">Seviye</p>
                                        <p className="text-3xl font-bold text-indigo-400">Lv.{level}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">En İyi Seri</p>
                                        <p className="text-3xl font-bold text-purple-400">x{bestStreak}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-center gap-4 text-sm text-slate-400 mt-6">
                                    <div className="flex items-center gap-1">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                        <span>{correctCount} Doğru</span>
                                    </div>
                                    <span className="text-slate-600">|</span>
                                    <div className="flex items-center gap-1">
                                        <XCircle className="w-4 h-4 text-red-400" />
                                        <span>{wrongCount} Yanlış</span>
                                    </div>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={startGame}
                                className="w-full px-6 py-4 rounded-2xl font-bold text-lg mb-4"
                                style={{
                                    background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(99, 102, 241, 0.4)'
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

export default NumberSequenceGame;

