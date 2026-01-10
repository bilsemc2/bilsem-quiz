import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RotateCcw, Play, Star, Target, CheckCircle2, XCircle, ChevronLeft, Zap, BookOpen, Loader2, AlertCircle, Heart, Clock, Lightbulb } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useGamePersistence } from '../../hooks/useGamePersistence';

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

const KnowledgeCardGame: React.FC = () => {
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
    const [lives, setLives] = useState(5);
    const [totalTime, setTotalTime] = useState(180);
    const [errorMessage, setErrorMessage] = useState('');
    const gameStartTimeRef = useRef<number>(0);
    const hasSavedRef = useRef<boolean>(false);

    const totalQuestions = 15;

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
        setLives(5);
        setTotalTime(180);
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
                game_id: 'bilgi-kartlari-bosluk-doldur',
                score_achieved: score,
                duration_seconds: durationSeconds,
                metadata: {
                    correct_count: correctCount,
                    wrong_count: wrongCount,
                    best_streak: bestStreak,
                    total_questions: questions.length,
                    lives_remaining: lives,
                    accuracy: correctCount + wrongCount > 0 ? Math.round((correctCount / (correctCount + wrongCount)) * 100) : 0,
                    game_name: 'Bilgi Kartları - Boşluk Doldur',
                }
            });
        }
    }, [gameState]);

    // Cevap kontrolü
    const handleAnswer = (answer: string) => {
        if (showFeedback || !questions[currentQuestionIndex]) return;

        setSelectedAnswer(answer);
        const currentQuestion = questions[currentQuestionIndex];
        const isCorrect = answer.toLowerCase() === currentQuestion.correctAnswer.toLowerCase();

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
            setLives(prev => {
                const newLives = prev - 1;
                if (newLives <= 0) {
                    setTimeout(() => setGameState('finished'), 2000);
                }
                return newLives;
            });
        }

        setTimeout(() => {
            setShowFeedback(null);
            setSelectedAnswer(null);

            if (lives <= 1 && !isCorrect) return; // Game over

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

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 pt-24 pb-12 px-6">
            <div className="container mx-auto max-w-4xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <Link
                        to="/atolyeler/bireysel-degerlendirme"
                        className="inline-flex items-center gap-2 text-emerald-400 font-bold hover:text-emerald-300 transition-colors mb-4 uppercase text-xs tracking-widest"
                    >
                        <ChevronLeft size={16} />
                        Bireysel Değerlendirme
                    </Link>
                    <h1 className="text-4xl lg:text-5xl font-black text-white mb-2">
                        📚 <span className="text-emerald-400">Bilgi Kartları</span> Boşluk Doldur
                    </h1>
                    <p className="text-slate-400">Cümledeki eksik kelimeyi bul!</p>
                </motion.div>

                {/* Stats */}
                <div className="flex justify-center gap-3 mb-8 flex-wrap">
                    {/* Lives */}
                    <div className="bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-2">
                        <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Heart key={i} size={16} className={`transition-all ${i < lives ? 'text-red-500 fill-red-500' : 'text-slate-700'}`} />
                            ))}
                        </div>
                    </div>
                    <div className="bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-2">
                        <Star className="w-5 h-5 text-amber-400" />
                        <span className="text-white font-bold">{score}</span>
                    </div>
                    {gameState === 'playing' && (
                        <>
                            <div className="bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-2">
                                <Target className="w-5 h-5 text-emerald-400" />
                                <span className="text-white font-bold">{currentQuestionIndex + 1}/{questions.length}</span>
                            </div>
                            <div className="bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-amber-400" />
                                <span className="text-white font-bold">x{streak}</span>
                            </div>
                            <div className={`bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-2 ${totalTime < 30 ? 'animate-pulse' : ''}`}>
                                <Clock className={`w-5 h-5 ${totalTime < 30 ? 'text-red-400' : 'text-cyan-400'}`} />
                                <span className={`font-bold font-mono ${totalTime < 30 ? 'text-red-400' : 'text-white'}`}>
                                    {Math.floor(totalTime / 60)}:{(totalTime % 60).toString().padStart(2, '0')}
                                </span>
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
                                <h2 className="text-2xl font-bold text-white mb-4">Bilgi Kartları - Boşluk Doldur</h2>

                                <div className="bg-slate-700/50 rounded-xl p-4 mb-6">
                                    <p className="text-slate-300 text-sm mb-3">Örnek:</p>
                                    <div className="text-lg font-bold text-white mb-2">
                                        "Kafatası kemikleri <span className="text-emerald-400 bg-emerald-400/20 px-2 py-1 rounded">_____</span> dış darbelerden korur."
                                    </div>
                                    <p className="text-slate-400 text-sm mt-2">
                                        Cevap: <span className="text-amber-400 font-bold">beynimizi</span>
                                    </p>
                                </div>

                                <ul className="text-slate-400 text-sm space-y-2 text-left mb-6">
                                    <li className="flex items-center gap-2">
                                        <BookOpen className="w-4 h-4 text-emerald-400" />
                                        Cümledeki <strong className="text-white">eksik kelimeyi</strong> bul
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Heart className="w-4 h-4 text-red-400" />
                                        5 can, 3 dakika süre
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Lightbulb className="w-4 h-4 text-amber-400" />
                                        Genel kültür bilgilerini test et!
                                    </li>
                                </ul>

                                <button
                                    onClick={startGame}
                                    className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl hover:from-emerald-400 hover:to-teal-400 transition-all flex items-center gap-3 mx-auto"
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
                            <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mx-auto mb-4" />
                            <p className="text-slate-400">Bilgi kartları yükleniyor...</p>
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
                                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
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
                                    <p className="text-slate-400 text-sm text-center mb-4">Boşluğa hangi kelime gelmelidir?</p>
                                    <h2 className="text-xl lg:text-2xl font-bold text-white text-center leading-relaxed">
                                        {currentQuestion.displayText.split('_____').map((part, i, arr) => (
                                            <React.Fragment key={i}>
                                                {part}
                                                {i < arr.length - 1 && (
                                                    <span className="inline-block bg-emerald-400/20 text-emerald-400 px-3 py-1 rounded-lg border-2 border-dashed border-emerald-400/50 mx-1">
                                                        {showFeedback ? currentQuestion.correctAnswer : '?????'}
                                                    </span>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </h2>
                                </motion.div>
                            </AnimatePresence>

                            {/* Options */}
                            <div className="grid grid-cols-2 gap-4">
                                {currentQuestion.options.map((option, idx) => {
                                    const isSelected = selectedAnswer === option;
                                    const isCorrect = option.toLowerCase() === currentQuestion.correctAnswer.toLowerCase();
                                    const showResult = showFeedback !== null;

                                    return (
                                        <motion.button
                                            key={option}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            onClick={() => handleAnswer(option)}
                                            disabled={showFeedback !== null}
                                            whileHover={{ scale: showFeedback ? 1 : 1.02 }}
                                            whileTap={{ scale: showFeedback ? 1 : 0.98 }}
                                            className={`py-5 px-4 text-lg font-bold rounded-2xl transition-all ${showResult
                                                ? isCorrect
                                                    ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400'
                                                    : isSelected
                                                        ? 'bg-red-500/20 border-2 border-red-500 text-red-400'
                                                        : 'bg-slate-800/50 border border-white/5 text-slate-500'
                                                : 'bg-slate-800/50 border border-white/10 text-white hover:bg-slate-700/50 hover:border-emerald-500/50 active:scale-95'
                                                }`}
                                        >
                                            <div className="flex items-center justify-center gap-3">
                                                <span className="w-8 h-8 bg-slate-700/50 rounded-lg flex items-center justify-center text-sm uppercase">
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
                                                Yanlış! Doğru cevap: {currentQuestion.correctAnswer}
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
                            <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-3xl p-8">
                                <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                                <h2 className="text-3xl font-black text-white mb-2">
                                    {lives <= 0 ? 'Oyun Bitti! 💔' : totalTime <= 0 ? 'Süre Doldu! ⏰' : 'Tebrikler! 🎉'}
                                </h2>

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
                                        <p className="text-2xl font-black text-teal-400">{correctCount}/{currentQuestionIndex + 1}</p>
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
                                    <span className="text-slate-600">|</span>
                                    <Heart className="w-4 h-4 text-red-400" />
                                    <span>{lives} Can Kaldı</span>
                                </div>

                                <div className="flex justify-center gap-4">
                                    <button
                                        onClick={startGame}
                                        className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl hover:from-emerald-400 hover:to-teal-400 transition-all flex items-center gap-2"
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

export default KnowledgeCardGame;
