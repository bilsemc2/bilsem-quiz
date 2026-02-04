import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RotateCcw, Play, Star, Heart, CheckCircle2, XCircle, ChevronLeft, Zap, BookOpen, Loader2, AlertCircle, Sparkles, Timer, Eye } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useSound } from '../../hooks/useSound';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useExam } from '../../contexts/ExamContext';

interface Question {
    id: string;
    originalText: string;
    displayText: string; // Text with blank
    correctAnswer: string;
    options: string[];
}

// Ana kelimeler listesi (doğru cevap olarak kullanılacak)
const KEY_WORDS = [
    'beyin', 'kalp', 'akciğer', 'böbrek', 'mide', 'karaciğer', 'kemik', 'kas', 'deri', 'kan',
    'oksijen', 'karbondioksit', 'su', 'enerji', 'besin', 'vitamin', 'protein', 'mineral',
    'bitki', 'hayvan', 'böcek', 'kuş', 'balık', 'memeli', 'sürüngen', 'kurbağa',
    'güneş', 'ay', 'dünya', 'mevsim', 'yaz', 'kış', 'ilkbahar', 'sonbahar',
    'sıcak', 'soğuk', 'ısı', 'sıcaklık', 'basınç', 'elektrik', 'manyetik', 'ışık',
    'atom', 'molekül', 'hücre', 'organ', 'sistem', 'vücut', 'iskelet', 'sinir',
    'kulak', 'göz', 'burun', 'dil', 'dokunma', 'tat', 'koku', 'ses', 'görme',
    'fotosentez', 'solunum', 'sindirim', 'dolaşım', 'boşaltım',
    'kök', 'gövde', 'yaprak', 'çiçek', 'meyve', 'tohum', 'polen',
    'orman', 'çöl', 'okyanus', 'deniz', 'göl', 'nehir', 'dağ',
    'yumurta', 'yavru', 'süt', 'kanat', 'tüy', 'pul', 'kabuk',
    'arı', 'karınca', 'kelebek', 'örümcek', 'solucan', 'balina', 'yunus',
    'aslan', 'fil', 'zürafa', 'tavşan', 'köpek', 'kedi', 'kuş', 'penguen',
    'erime', 'donma', 'buharlaşma', 'yoğuşma', 'katı', 'sıvı', 'gaz'
];

// Child-friendly messages
const SUCCESS_MESSAGES = [
    "Harika! 📚",
    "Süper! ⭐",
    "Doğru! 🎉",
    "Bravo! 🌟",
];

const FAILURE_MESSAGES = [
    "Dikkatli bak! 👀",
    "Tekrar dene! 💪",
];

interface KnowledgeCardGameProps {
    examMode?: boolean;
    examLevel?: number;
    examTimeLimit?: number;
}

const KnowledgeCardGame: React.FC<KnowledgeCardGameProps> = ({ examMode: examModeProp = false }) => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();
    const navigate = useNavigate();
    const { submitResult } = useExam();

    // examMode can come from props OR location.state (when navigating from ExamContinuePage)
    const examMode = examModeProp || location.state?.examMode === true;
    const [gameState, setGameState] = useState<'idle' | 'loading' | 'playing' | 'finished' | 'error'>('idle');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [wrongCount, setWrongCount] = useState(0);
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
    const [feedbackMsg, setFeedbackMsg] = useState('');
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [lives, setLives] = useState(3);
    const [totalTime, setTotalTime] = useState(180);
    const [errorMessage, setErrorMessage] = useState('');
    const gameStartTimeRef = useRef<number>(0);
    const hasSavedRef = useRef<boolean>(false);

    const totalQuestions = 10;

    // Back link
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    // Kelime çıkarma ve boşluk oluşturma
    const createBlankFromSentence = (text: string): { displayText: string; answer: string } | null => {
        const words = text.split(/\s+/);

        // Anahtar kelimelerden birini bul
        for (const keyWord of KEY_WORDS) {
            const wordIndex = words.findIndex(w =>
                w.toLowerCase().replace(/[.,;:!?()]/g, '') === keyWord.toLowerCase()
            );
            if (wordIndex !== -1) {
                const originalWord = words[wordIndex].replace(/[.,;:!?()]/g, '');
                const punctuation = words[wordIndex].replace(originalWord, '');
                words[wordIndex] = '_____' + punctuation;
                return {
                    displayText: words.join(' '),
                    answer: originalWord
                };
            }
        }

        // Anahtar kelime bulunamazsa, 4+ harfli kelimeleri dene
        const longWords = words
            .map((w, i) => ({ word: w.replace(/[.,;:!?()]/g, ''), index: i, original: w }))
            .filter(w => w.word.length >= 4 && !['için', 'veya', 'gibi', 'çok', 'daha', 'olan', 'olur', 'olarak', 'eder', 'eler', 'alar', 'eler'].includes(w.word.toLowerCase()));

        if (longWords.length === 0) return null;

        const selected = longWords[Math.floor(Math.random() * longWords.length)];
        const punctuation = selected.original.replace(selected.word, '');
        words[selected.index] = '_____' + punctuation;

        return {
            displayText: words.join(' '),
            answer: selected.word
        };
    };

    // Yanlış seçenekler oluştur
    const generateWrongOptions = (correctAnswer: string, allAnswers: string[]): string[] => {
        const wrongOptions = allAnswers
            .filter(a => a.toLowerCase() !== correctAnswer.toLowerCase() && a.length >= 3)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);

        // Yeterli yanlış seçenek yoksa anahtar kelimelerden al
        while (wrongOptions.length < 3) {
            const randomWord = KEY_WORDS[Math.floor(Math.random() * KEY_WORDS.length)];
            if (!wrongOptions.includes(randomWord) && randomWord.toLowerCase() !== correctAnswer.toLowerCase()) {
                wrongOptions.push(randomWord);
            }
        }

        return wrongOptions;
    };

    // Veritabanından bilgi kartlarını çek
    const fetchQuestions = useCallback(async () => {
        setGameState('loading');
        try {
            const { data, error } = await supabase
                .from('bilgi_kartlari')
                .select('id, icerik')
                .eq('is_active', true)
                .limit(200);

            if (error) throw error;

            if (!data || data.length === 0) {
                setErrorMessage('Bilgi kartı bulunamadı. Lütfen daha sonra tekrar deneyin.');
                setGameState('error');
                return;
            }

            // Kartları işle ve soruları oluştur
            const processedQuestions: Question[] = [];
            const allAnswers: string[] = [];
            const shuffledData = data.sort(() => Math.random() - 0.5);

            for (const card of shuffledData) {
                if (processedQuestions.length >= totalQuestions) break;

                const result = createBlankFromSentence(card.icerik);
                if (result) {
                    allAnswers.push(result.answer);
                    processedQuestions.push({
                        id: card.id,
                        originalText: card.icerik,
                        displayText: result.displayText,
                        correctAnswer: result.answer,
                        options: [] // Sonra dolduracağız
                    });
                }
            }

            // Seçenekleri oluştur
            const finalQuestions = processedQuestions.map(q => {
                const wrongOptions = generateWrongOptions(q.correctAnswer, allAnswers);
                const allOptions = [q.correctAnswer, ...wrongOptions].sort(() => Math.random() - 0.5);
                return { ...q, options: allOptions };
            });

            if (finalQuestions.length < 5) {
                setErrorMessage('Yeterli soru oluşturulamadı. Lütfen daha sonra tekrar deneyin.');
                setGameState('error');
                return;
            }

            setQuestions(finalQuestions);
            setGameState('playing');
            gameStartTimeRef.current = Date.now();
        } catch (error) {
            console.error('Sorular yüklenirken hata:', error);
            setErrorMessage('Sorular yüklenirken bir hata oluştu.');
            setGameState('error');
        }
    }, []);

    // Timer
    useEffect(() => {
        if (gameState !== 'playing') return;
        const timer = setInterval(() => {
            setTotalTime(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setGameState('finished');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [gameState]);

    // Oyunu başlat
    const startGame = useCallback(() => {
        setScore(0);
        setCorrectCount(0);
        setWrongCount(0);
        setCurrentQuestionIndex(0);
        setStreak(0);
        setBestStreak(0);
        setLives(3);
        setTotalTime(180);
        setSelectedAnswer(null);
        setFeedback(null);
        hasSavedRef.current = false;
        fetchQuestions();
    }, [fetchQuestions]);

    // Handle Auto Start from HUB or Exam Mode
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

            // Exam mode: submit result and navigate
            if (examMode) {
                const passed = correctCount >= questions.length / 2;
                submitResult(passed, score, 1000, durationSeconds).then(() => {
                    navigate('/atolyeler/sinav-simulasyonu/devam');
                });
                return;
            }

            saveGamePlay({
                game_id: 'bilgi-kartlari-bosluk-doldur',
                score_achieved: score,
                duration_seconds: durationSeconds,
                lives_remaining: lives,
                metadata: {
                    correct_count: correctCount,
                    wrong_count: wrongCount,
                    best_streak: bestStreak,
                    total_questions: questions.length,
                    accuracy: correctCount + wrongCount > 0 ? Math.round((correctCount / (correctCount + wrongCount)) * 100) : 0,
                    game_name: 'Bilgi Kartları - Boşluk Doldur',
                }
            });
        }
    }, [gameState, score, lives, correctCount, wrongCount, bestStreak, questions.length, saveGamePlay, examMode, navigate, submitResult]);

    // Cevap kontrolü
    const handleAnswer = (answer: string) => {
        if (feedback || !questions[currentQuestionIndex]) return;

        setSelectedAnswer(answer);
        const currentQuestion = questions[currentQuestionIndex];
        const isCorrect = answer.toLowerCase() === currentQuestion.correctAnswer.toLowerCase();

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
            const streakBonus = streak * 10;
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
            } else if (currentQuestionIndex + 1 >= questions.length) {
                setGameState('finished');
            } else {
                setCurrentQuestionIndex(prev => prev + 1);
            }
        }, 2000);
    };

    const currentQuestion = questions[currentQuestionIndex];
    const accuracy = correctCount + wrongCount > 0
        ? Math.round((correctCount / (correctCount + wrongCount)) * 100)
        : 0;

    // Welcome Screen
    if (gameState === 'idle') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-cyan-950 to-teal-950 text-white">
                {/* Decorative Background */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
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
                                background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                                boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)'
                            }}
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <BookOpen size={52} className="text-white drop-shadow-lg" />
                        </motion.div>

                        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                            📚 Bilgi Kartları
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
                            <div className="text-lg font-bold text-white mb-2">
                                "Kafatası kemikleri <span className="text-teal-400 bg-teal-400/20 px-2 py-1 rounded">_____</span> korur."
                            </div>
                            <p className="text-slate-400 text-sm">
                                = <span className="text-amber-400 font-bold">beynimizi</span>
                            </p>
                        </div>

                        {/* Instructions */}
                        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                            <h3 className="text-lg font-bold text-teal-300 mb-3 flex items-center gap-2">
                                <Eye size={20} /> Nasıl Oynanır?
                            </h3>
                            <ul className="space-y-2 text-slate-300 text-sm">
                                <li className="flex items-center gap-2">
                                    <Sparkles size={14} className="text-teal-400" />
                                    <span>Cümledeki <strong>eksik kelimeyi</strong> bul</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Sparkles size={14} className="text-teal-400" />
                                    <span>4 seçenekten doğru olanı seç</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Sparkles size={14} className="text-teal-400" />
                                    <span>10 soru, 3 can, 3 dakika! Genel kültürünü test et!</span>
                                </li>
                            </ul>
                        </div>

                        {/* TUZÖ Badge */}
                        <div className="bg-teal-500/10 text-teal-300 text-xs px-4 py-2 rounded-full mb-6 inline-block border border-teal-500/30">
                            TUZÖ 6.3.1 Genel Bilgi
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.05, y: -4 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={startGame}
                            className="px-8 py-4 rounded-2xl font-bold text-lg"
                            style={{
                                background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                                boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(20, 184, 166, 0.4)'
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

    // Loading Screen
    if (gameState === 'loading') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-cyan-950 to-teal-950 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-teal-400 animate-spin mx-auto mb-4" />
                    <p className="text-slate-400">Bilgi kartları yükleniyor...</p>
                </div>
            </div>
        );
    }

    // Error Screen
    if (gameState === 'error') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-cyan-950 to-teal-950 flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <div className="bg-red-500/10 border border-red-500/30 rounded-3xl p-8">
                        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-white mb-2">Hata</h2>
                        <p className="text-slate-400 mb-6">{errorMessage}</p>
                        <Link
                            to={backLink}
                            className="px-6 py-3 bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-600 transition-all inline-block"
                        >
                            Geri Dön
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-cyan-950 to-teal-950 text-white">
            {/* Decorative Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
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
                        <div
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl ${totalTime < 30 ? 'animate-pulse' : ''}`}
                            style={{
                                background: totalTime < 30
                                    ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.2) 100%)'
                                    : 'linear-gradient(135deg, rgba(20, 184, 166, 0.2) 0%, rgba(13, 148, 136, 0.1) 100%)',
                                boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                                border: totalTime < 30 ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(20, 184, 166, 0.3)'
                            }}
                        >
                            <Timer className={totalTime < 30 ? 'text-red-400' : 'text-teal-400'} size={18} />
                            <span className={`font-bold font-mono ${totalTime < 30 ? 'text-red-400' : 'text-teal-400'}`}>
                                {Math.floor(totalTime / 60)}:{(totalTime % 60).toString().padStart(2, '0')}
                            </span>
                        </div>

                        {/* Progress */}
                        <div
                            className="flex items-center gap-2 px-4 py-2 rounded-xl"
                            style={{
                                background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.2) 0%, rgba(13, 148, 136, 0.1) 100%)',
                                boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                                border: '1px solid rgba(20, 184, 166, 0.3)'
                            }}
                        >
                            <BookOpen className="text-teal-400" size={18} />
                            <span className="font-bold text-teal-400">{currentQuestionIndex + 1}/{questions.length}</span>
                        </div>

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
                            className="w-full max-w-2xl"
                        >
                            {/* Progress Bar */}
                            <div className="h-2 bg-slate-800/50 rounded-full mb-8 overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{ background: 'linear-gradient(90deg, #14B8A6 0%, #06B6D4 100%)' }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                                />
                            </div>

                            {/* Question Display */}
                            <div
                                className="rounded-3xl p-8 mb-8"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}
                            >
                                <p className="text-slate-400 text-sm mb-4 text-center">Boşluğa hangi kelime gelmelidir?</p>
                                <motion.h2
                                    key={currentQuestionIndex}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-xl lg:text-2xl font-bold text-white text-center leading-relaxed"
                                >
                                    {currentQuestion.displayText.split('_____').map((part, i, arr) => (
                                        <React.Fragment key={i}>
                                            {part}
                                            {i < arr.length - 1 && (
                                                <span className="inline-block bg-teal-400/20 text-teal-400 px-3 py-1 rounded-lg border-2 border-dashed border-teal-400/50 mx-1">
                                                    {feedback ? currentQuestion.correctAnswer : '?????'}
                                                </span>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </motion.h2>
                            </div>

                            {/* Options */}
                            <div className="grid grid-cols-2 gap-4">
                                {currentQuestion.options.map((option, idx) => {
                                    const isSelected = selectedAnswer === option;
                                    const isCorrect = option.toLowerCase() === currentQuestion.correctAnswer.toLowerCase();
                                    const showResult = feedback !== null;

                                    return (
                                        <motion.button
                                            key={option}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            onClick={() => handleAnswer(option)}
                                            disabled={feedback !== null}
                                            whileHover={!feedback ? { scale: 0.98, y: -2 } : {}}
                                            whileTap={!feedback ? { scale: 0.95 } : {}}
                                            className="py-5 px-4 rounded-2xl font-bold text-lg transition-all"
                                            style={{
                                                background: showResult && isCorrect
                                                    ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                                                    : showResult && isSelected && !isCorrect
                                                        ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                                                        : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                                                boxShadow: showResult && (isCorrect || (isSelected && !isCorrect))
                                                    ? '0 0 20px rgba(20, 184, 166, 0.3)'
                                                    : 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.05)',
                                                border: showResult && isCorrect
                                                    ? '2px solid #10B981'
                                                    : showResult && isSelected && !isCorrect
                                                        ? '2px solid #EF4444'
                                                        : '1px solid rgba(255,255,255,0.1)',
                                                color: '#fff',
                                                cursor: feedback ? 'default' : 'pointer',
                                                opacity: showResult && !isCorrect && !isSelected ? 0.5 : 1
                                            }}
                                        >
                                            <div className="flex items-center justify-center gap-3">
                                                <span className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-sm uppercase">
                                                    {String.fromCharCode(65 + idx)}
                                                </span>
                                                {showResult && isCorrect && <CheckCircle2 className="w-5 h-5" />}
                                                {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5" />}
                                                <span>{option}</span>
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
                                        : 'linear-gradient(135deg, #14B8A6 0%, #EF4444 100%)',
                                    boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)'
                                }}
                                animate={{ rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <Trophy size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h2 className="text-3xl font-black text-teal-300 mb-2">
                                {lives <= 0 ? 'Tekrar Deneyelim! 💪' : totalTime <= 0 ? 'Süre Doldu! ⏰' : accuracy >= 80 ? '🎉 Harika!' : 'İyi İş!'}
                            </h2>
                            <p className="text-slate-400 mb-6">
                                {accuracy >= 80 ? 'Bilgi ustasısın!' : 'Tekrar deneyelim!'}
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
                                        <p className="text-slate-400 text-sm">Doğru</p>
                                        <p className="text-2xl font-bold text-teal-400">{correctCount}/{questions.length}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">En İyi Seri</p>
                                        <p className="text-2xl font-bold text-cyan-400">x{bestStreak}</p>
                                    </div>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={startGame}
                                className="w-full px-6 py-4 rounded-2xl font-bold text-lg mb-4"
                                style={{
                                    background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(20, 184, 166, 0.4)'
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
                                        Doğrusu: <span className="font-bold">{currentQuestion.correctAnswer}</span>
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

export default KnowledgeCardGame;
