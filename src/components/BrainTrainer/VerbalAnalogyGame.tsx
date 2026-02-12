import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RotateCcw, Play, Star, Heart, CheckCircle2, XCircle, ChevronLeft, Zap, GitBranch, Loader2, AlertCircle, Sparkles, Eye } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useSound } from '../../hooks/useSound';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useExam } from '../../contexts/ExamContext';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';

interface Option {
    id: string;
    text: string;
}

interface Question {
    id: number;
    text: string;
    options: Option[];
    correct_option_id: string;
    explanation?: string;
}

// Child-friendly messages


const VerbalAnalogyGame: React.FC = () => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const { submitResult } = useExam();
    const { feedbackState, showFeedback } = useGameFeedback();
    const location = useLocation();
    const navigate = useNavigate();
    const [gameState, setGameState] = useState<'idle' | 'loading' | 'playing' | 'finished' | 'error'>('idle');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [wrongCount, setWrongCount] = useState(0);    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [lives, setLives] = useState(3);
    const [errorMessage, setErrorMessage] = useState('');
    const gameStartTimeRef = useRef<number>(0);
    const hasSavedRef = useRef<boolean>(false);

    const totalQuestions = 10;

    // Exam Mode Props
    const examMode = location.state?.examMode || false;

    // Back link
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    // Veritabanından analoji sorularını çek
    const fetchQuestions = useCallback(async () => {
        setGameState('loading');
        try {
            const { data, error } = await supabase
                .from('analoji_sorulari')
                .select('id, soru_metni, secenek_a, secenek_b, secenek_c, secenek_d, dogru_cevap, aciklama')
                .limit(100);

            if (error) throw error;

            if (!data || data.length === 0) {
                setErrorMessage('Analoji sorusu bulunamadı. Lütfen daha sonra tekrar deneyin.');
                setGameState('error');
                return;
            }

            // Soruları karıştır ve ilk N tanesini al
            const shuffled = data.sort(() => Math.random() - 0.5);
            const selected = shuffled.slice(0, Math.min(totalQuestions, shuffled.length));

            // Veritabanı formatını oyun formatına dönüştür
            const parsedQuestions: Question[] = selected.map(q => ({
                id: q.id,
                text: q.soru_metni,
                options: [
                    { id: 'a', text: q.secenek_a },
                    { id: 'b', text: q.secenek_b },
                    { id: 'c', text: q.secenek_c },
                    { id: 'd', text: q.secenek_d },
                ],
                correct_option_id: q.dogru_cevap,
                explanation: q.aciklama,
            }));

            setQuestions(parsedQuestions);
            setGameState('playing');
            gameStartTimeRef.current = Date.now();
        } catch (error) {
            console.error('Sorular yüklenirken hata:', error);
            setErrorMessage('Sorular yüklenirken bir hata oluştu.');
            setGameState('error');
        }
    }, []);

    // Oyunu başlat
    const startGame = useCallback(() => {
        window.scrollTo(0, 0);
        setScore(0);
        setCorrectCount(0);
        setWrongCount(0);
        setCurrentQuestionIndex(0);
        setStreak(0);
        setBestStreak(0);
        setLives(3);
        setSelectedAnswer(null);
        hasSavedRef.current = false;
        fetchQuestions();
    }, [fetchQuestions]);

    // Handle Auto Start from HUB or examMode
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
            const acc = correctCount + wrongCount > 0 ? correctCount / (correctCount + wrongCount) : 0;

            // Exam mode: submit result and redirect
            if (examMode) {
                submitResult(acc >= 0.6, score, totalQuestions * 100, durationSeconds).then(() => {
                navigate("/atolyeler/sinav-simulasyonu/devam"); });
                return;
            }

            saveGamePlay({
                game_id: 'sozel-analoji',
                score_achieved: score,
                duration_seconds: durationSeconds,
                lives_remaining: lives,
                metadata: {
                    correct_count: correctCount,
                    wrong_count: wrongCount,
                    best_streak: bestStreak,
                    total_questions: questions.length,
                    accuracy: Math.round((correctCount / (correctCount + wrongCount)) * 100),
                    game_name: 'Sözel Analoji',
                }
            });
        }
    }, [gameState, score, lives, correctCount, wrongCount, bestStreak, questions.length, saveGamePlay, examMode, submitResult, navigate]);

    // Cevap kontrolü
    const handleAnswer = (answerId: string) => {
        if (feedbackState || !questions[currentQuestionIndex]) return;

        setSelectedAnswer(answerId);
        const currentQuestion = questions[currentQuestionIndex];
        const isCorrect = answerId === currentQuestion.correct_option_id;

        if (isCorrect) {
            playSound('correct');
            showFeedback(true);
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
            showFeedback(false);
            setWrongCount(prev => prev + 1);
            setStreak(0);
            setLives(l => l - 1);
        }

        setTimeout(() => {
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

    // Soru metninden analoji formatını çıkar
    const formatQuestionText = (text: string) => {
        return text.replace(/::/g, ' ▸ ').replace(/:/g, ' → ');
    };

    // Welcome Screen
    if (gameState === 'idle') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-pink-950 to-rose-950 text-white">
                {/* Decorative Background */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl" />
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
                                background: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
                                boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)'
                            }}
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <GitBranch size={52} className="text-white drop-shadow-lg" />
                        </motion.div>

                        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
                            📚 Sözel Analoji
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
                            <div className="text-xl font-bold text-white mb-2">
                                Arı → Bal :: İpek Böceği → ?
                            </div>
                            <p className="text-slate-400 text-sm">
                                = <span className="text-amber-400 font-bold">İpek</span> (aynı ilişki)
                            </p>
                        </div>

                        {/* Instructions */}
                        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                            <h3 className="text-lg font-bold text-pink-300 mb-3 flex items-center gap-2">
                                <Eye size={20} /> Nasıl Oynanır?
                            </h3>
                            <ul className="space-y-2 text-slate-300 text-sm">
                                <li className="flex items-center gap-2">
                                    <Sparkles size={14} className="text-pink-400" />
                                    <span>İki kavram arasındaki <strong>ilişkiyi</strong> bul</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Sparkles size={14} className="text-pink-400" />
                                    <span>Aynı ilişkiyi <strong>diğer çifte</strong> uygula</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Sparkles size={14} className="text-pink-400" />
                                    <span>10 soru, 3 can! Sözel zekanı test et!</span>
                                </li>
                            </ul>
                        </div>

                        {/* TUZÖ Badge */}
                        <div className="bg-pink-500/10 text-pink-300 text-xs px-4 py-2 rounded-full mb-6 inline-block border border-pink-500/30">
                            TUZÖ 6.2.1 Sözel Akıl Yürütme
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.05, y: -4 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={startGame}
                            className="px-8 py-4 rounded-2xl font-bold text-lg"
                            style={{
                                background: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
                                boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(236, 72, 153, 0.4)'
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
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-pink-950 to-rose-950 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-pink-400 animate-spin mx-auto mb-4" />
                    <p className="text-slate-400">Sorular yükleniyor...</p>
                </div>
            </div>
        );
    }

    // Error Screen
    if (gameState === 'error') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-pink-950 to-rose-950 flex items-center justify-center p-4">
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
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-pink-950 to-rose-950 text-white">
            {/* Decorative Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl" />
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

                        {/* Progress */}
                        <div
                            className="flex items-center gap-2 px-4 py-2 rounded-xl"
                            style={{
                                background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(219, 39, 119, 0.1) 100%)',
                                boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                                border: '1px solid rgba(236, 72, 153, 0.3)'
                            }}
                        >
                            <GitBranch className="text-pink-400" size={18} />
                            <span className="font-bold text-pink-400">{currentQuestionIndex + 1}/{questions.length}</span>
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
                                    style={{ background: 'linear-gradient(90deg, #EC4899 0%, #F43F5E 100%)' }}
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
                                <p className="text-slate-400 text-sm mb-4 text-center">Eksik kelimeyi tamamla:</p>
                                <motion.h2
                                    key={currentQuestionIndex}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-2xl lg:text-3xl font-bold text-white text-center leading-relaxed"
                                >
                                    {formatQuestionText(currentQuestion.text)}
                                </motion.h2>
                            </div>

                            {/* Options */}
                            <div className="grid grid-cols-2 gap-4">
                                {currentQuestion.options.map((option, idx) => {
                                    const isSelected = selectedAnswer === option.id;
                                    const isCorrect = option.id === currentQuestion.correct_option_id;
                                    const showResult = feedbackState !== null;

                                    return (
                                        <motion.button
                                            key={option.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            onClick={() => handleAnswer(option.id)}
                                            disabled={feedbackState !== null}
                                            whileHover={!feedbackState ? { scale: 0.98, y: -2 } : {}}
                                            whileTap={!feedbackState ? { scale: 0.95 } : {}}
                                            className="py-5 px-4 rounded-2xl font-bold text-lg transition-all"
                                            style={{
                                                background: showResult && isCorrect
                                                    ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                                                    : showResult && isSelected && !isCorrect
                                                        ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                                                        : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                                                boxShadow: showResult && (isCorrect || (isSelected && !isCorrect))
                                                    ? '0 0 20px rgba(236, 72, 153, 0.3)'
                                                    : 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.05)',
                                                border: showResult && isCorrect
                                                    ? '2px solid #10B981'
                                                    : showResult && isSelected && !isCorrect
                                                        ? '2px solid #EF4444'
                                                        : '1px solid rgba(255,255,255,0.1)',
                                                color: '#fff',
                                                cursor: feedbackState ? 'default' : 'pointer',
                                                opacity: showResult && !isCorrect && !isSelected ? 0.5 : 1
                                            }}
                                        >
                                            <div className="flex items-center justify-center gap-3">
                                                <span className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-sm uppercase">
                                                    {option.id}
                                                </span>
                                                {showResult && isCorrect && <CheckCircle2 className="w-5 h-5" />}
                                                {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5" />}
                                                <span>{option.text}</span>
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
                                        : 'linear-gradient(135deg, #EC4899 0%, #EF4444 100%)',
                                    boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)'
                                }}
                                animate={{ rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <Trophy size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h2 className="text-3xl font-black text-pink-300 mb-2">
                                {accuracy >= 80 ? '🎉 Harika!' : accuracy >= 50 ? 'İyi İş!' : 'Oyun Bitti!'}
                            </h2>
                            <p className="text-slate-400 mb-6">
                                {accuracy >= 80 ? 'Analoji ustasısın!' : 'Tekrar deneyelim!'}
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
                                        <p className="text-2xl font-bold text-pink-400">{correctCount}/{questions.length}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">En İyi Seri</p>
                                        <p className="text-2xl font-bold text-rose-400">x{bestStreak}</p>
                                    </div>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={startGame}
                                className="w-full px-6 py-4 rounded-2xl font-bold text-lg mb-4"
                                style={{
                                    background: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(236, 72, 153, 0.4)'
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

export default VerbalAnalogyGame;
