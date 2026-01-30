import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RotateCcw, Play, Star, Target, CheckCircle2, XCircle, ChevronLeft, Zap, BookOpen, Loader2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useGamePersistence } from '../../hooks/useGamePersistence';

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

const VerbalAnalogyGame: React.FC = () => {
    const { saveGamePlay } = useGamePersistence();
    const [gameState, setGameState] = useState<'idle' | 'loading' | 'playing' | 'finished' | 'error'>('idle');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [wrongCount, setWrongCount] = useState(0);
    const [showFeedback, setShowFeedback] = useState<'correct' | 'wrong' | null>(null);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [errorMessage, setErrorMessage] = useState('');
    const gameStartTimeRef = useRef<number>(0);
    const hasSavedRef = useRef<boolean>(false);

    const totalQuestions = 15;

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
        setScore(0);
        setCorrectCount(0);
        setWrongCount(0);
        setCurrentQuestionIndex(0);
        setStreak(0);
        setBestStreak(0);
        setSelectedAnswer(null);
        setShowFeedback(null);
        hasSavedRef.current = false;
        fetchQuestions();
    }, [fetchQuestions]);

    // Oyun bittiğinde verileri kaydet
    useEffect(() => {
        if (gameState === 'finished' && gameStartTimeRef.current > 0 && !hasSavedRef.current) {
            hasSavedRef.current = true;
            const durationSeconds = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
            saveGamePlay({
                game_id: 'sozel-analoji',
                score_achieved: score,
                duration_seconds: durationSeconds,
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
    }, [gameState]);

    // Cevap kontrolü
    const handleAnswer = (answerId: string) => {
        if (showFeedback || !questions[currentQuestionIndex]) return;

        setSelectedAnswer(answerId);
        const currentQuestion = questions[currentQuestionIndex];
        const isCorrect = answerId === currentQuestion.correct_option_id;

        if (isCorrect) {
            setShowFeedback('correct');
            setCorrectCount(prev => prev + 1);
            setStreak(prev => {
                const newStreak = prev + 1;
                if (newStreak > bestStreak) setBestStreak(newStreak);
                return newStreak;
            });
            const streakBonus = streak * 10;
            setScore(prev => prev + 100 + streakBonus);
        } else {
            setShowFeedback('wrong');
            setWrongCount(prev => prev + 1);
            setStreak(0);
        }

        setTimeout(() => {
            setShowFeedback(null);
            setSelectedAnswer(null);

            if (currentQuestionIndex + 1 >= questions.length) {
                setGameState('finished');
            } else {
                setCurrentQuestionIndex(prev => prev + 1);
            }
        }, 2500);
    };

    const currentQuestion = questions[currentQuestionIndex];
    const accuracy = correctCount + wrongCount > 0
        ? Math.round((correctCount / (correctCount + wrongCount)) * 100)
        : 0;

    // Soru metninden analoji formatını çıkar
    const formatQuestionText = (text: string) => {
        // "A:B :: C:?" formatını güzelleştir
        return text
            .replace(/::/g, ' ▸ ')
            .replace(/:/g, ' → ');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-pink-950 to-slate-900 pt-24 pb-12 px-6">
            <div className="container mx-auto max-w-4xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <Link
                        to="/atolyeler/bireysel-degerlendirme"
                        className="inline-flex items-center gap-2 text-pink-400 font-bold hover:text-pink-300 transition-colors mb-4 uppercase text-xs tracking-widest"
                    >
                        <ChevronLeft size={16} />
                        Bireysel Değerlendirme
                    </Link>
                    <h1 className="text-4xl lg:text-5xl font-black text-white mb-2">
                        📚 <span className="text-pink-400">Sözel</span> Analoji
                    </h1>
                    <p className="text-slate-400">İlişkiyi bul, eksik kelimeyi tamamla!</p>
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
                                <Target className="w-5 h-5 text-pink-400" />
                                <span className="text-white font-bold">{currentQuestionIndex + 1}/{questions.length}</span>
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
                                <div className="text-6xl mb-4">📚</div>
                                <h2 className="text-2xl font-bold text-white mb-4">Sözel Analoji Testi</h2>

                                <div className="bg-slate-700/50 rounded-xl p-4 mb-6">
                                    <p className="text-slate-300 text-sm mb-3">Örnek:</p>
                                    <div className="text-xl font-bold text-white mb-2">
                                        Arı → Bal :: İpek Böceği → ?
                                    </div>
                                    <p className="text-slate-400 text-sm">
                                        Cevap: <span className="text-pink-400 font-bold">İpek</span>
                                    </p>
                                    <p className="text-slate-500 text-xs mt-2">
                                        (Arı bal üretir, İpek böceği ipek üretir)
                                    </p>
                                </div>

                                <ul className="text-slate-400 text-sm space-y-2 text-left mb-6">
                                    <li className="flex items-center gap-2">
                                        <BookOpen className="w-4 h-4 text-pink-400" />
                                        İki kavram arasındaki <strong className="text-white">ilişkiyi bul</strong>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-amber-400" />
                                        Aynı ilişkiyi diğer çifte uygula
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Target className="w-4 h-4 text-emerald-400" />
                                        {totalQuestions} soru, sözel zekanı test et!
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

                    {/* Loading State */}
                    {gameState === 'loading' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-20"
                        >
                            <Loader2 className="w-12 h-12 text-pink-400 animate-spin mx-auto mb-4" />
                            <p className="text-slate-400">Sorular yükleniyor...</p>
                        </motion.div>
                    )}

                    {/* Error State */}
                    {gameState === 'error' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center space-y-6 max-w-md"
                        >
                            <div className="bg-red-500/10 border border-red-500/30 rounded-3xl p-8">
                                <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                                <h2 className="text-xl font-bold text-white mb-2">Hata</h2>
                                <p className="text-slate-400 mb-6">{errorMessage}</p>
                                <Link
                                    to="/atolyeler/bireysel-degerlendirme"
                                    className="px-6 py-3 bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-600 transition-all inline-block"
                                >
                                    Geri Dön
                                </Link>
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
                                    className="h-full bg-gradient-to-r from-pink-500 to-rose-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                                />
                            </div>

                            {/* Question Display */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentQuestionIndex}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className={`bg-slate-800/50 border-4 rounded-3xl p-8 mb-6 ${showFeedback === 'correct' ? 'border-emerald-500 bg-emerald-500/10' :
                                        showFeedback === 'wrong' ? 'border-red-500 bg-red-500/10' :
                                            'border-white/10'
                                        } transition-all`}
                                >
                                    <p className="text-slate-400 text-sm text-center mb-4">Eksik kelimeyi tamamla:</p>
                                    <h2 className="text-2xl lg:text-3xl font-bold text-white text-center leading-relaxed">
                                        {formatQuestionText(currentQuestion.text)}
                                    </h2>

                                    {/* Explanation (after answer) */}
                                    <AnimatePresence>
                                        {showFeedback && currentQuestion.explanation && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="mt-4 pt-4 border-t border-white/10"
                                            >
                                                <p className="text-pink-400 text-sm font-medium mb-1">Açıklama:</p>
                                                <p className="text-slate-300 text-center">{currentQuestion.explanation}</p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            </AnimatePresence>

                            {/* Options */}
                            <div className="grid grid-cols-2 gap-4">
                                {currentQuestion.options.map((option, idx) => {
                                    const isSelected = selectedAnswer === option.id;
                                    const isCorrect = option.id === currentQuestion.correct_option_id;
                                    const showResult = showFeedback !== null;

                                    return (
                                        <motion.button
                                            key={option.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            onClick={() => handleAnswer(option.id)}
                                            disabled={showFeedback !== null}
                                            whileHover={{ scale: showFeedback ? 1 : 1.02 }}
                                            whileTap={{ scale: showFeedback ? 1 : 0.98 }}
                                            className={`py-5 px-4 text-lg font-bold rounded-2xl transition-all ${showResult
                                                ? isCorrect
                                                    ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400'
                                                    : isSelected
                                                        ? 'bg-red-500/20 border-2 border-red-500 text-red-400'
                                                        : 'bg-slate-800/50 border border-white/5 text-slate-500'
                                                : 'bg-slate-800/50 border border-white/10 text-white hover:bg-slate-700/50 hover:border-pink-500/50 active:scale-95'
                                                }`}
                                        >
                                            <div className="flex items-center justify-center gap-3">
                                                <span className="w-8 h-8 bg-slate-700/50 rounded-lg flex items-center justify-center text-sm uppercase">
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
                                                Doğru! +{100 + streak * 10} puan
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="w-6 h-6" />
                                                Doğrusu: {currentQuestion.options.find(o => o.id === currentQuestion.correct_option_id)?.text} idi
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
                            <div className="bg-gradient-to-br from-pink-500/20 to-rose-500/20 border border-pink-500/30 rounded-3xl p-8">
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
                                        <p className="text-slate-400 text-sm">Doğru Sayısı</p>
                                        <p className="text-2xl font-black text-pink-400">{correctCount}/{questions.length}</p>
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

export default VerbalAnalogyGame;
