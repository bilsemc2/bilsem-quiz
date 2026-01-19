import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Search, ChevronLeft, Languages, Brain, Check, X, Loader2, ChevronRight, Trophy, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useGamePersistence } from '../hooks/useGamePersistence';

interface Deyim {
    id: number;
    deyim: string;
    aciklama: string;
    ornek: string | null;
}

type Mode = 'liste' | 'oyun';

const ITEMS_PER_PAGE = 12;
const QUESTIONS_PER_GAME = 10;

const DeyimlerPage = () => {
    const { user } = useAuth();
    const { saveGamePlay } = useGamePersistence();
    const navigate = useNavigate();
    const gameStartTimeRef = useRef<number>(0);

    // State
    const [deyimler, setDeyimler] = useState<Deyim[]>([]);
    const [allDeyimler, setAllDeyimler] = useState<Deyim[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [mode, setMode] = useState<Mode>('liste');

    // Game State
    const [gameQuestion, setGameQuestion] = useState<Deyim | null>(null);
    const [gameOptions, setGameOptions] = useState<string[]>([]);
    const [missingWord, setMissingWord] = useState('');
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [score, setScore] = useState(0);
    const [questionNumber, setQuestionNumber] = useState(0);
    const [gameOver, setGameOver] = useState(false);

    // Kullanıcı kontrolü
    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [user, navigate]);

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setCurrentPage(1); // Reset to first page on search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Deyimleri yükle
    const fetchDeyimler = useCallback(async (abortController?: AbortController) => {
        try {
            let query = supabase
                .from('deyimler')
                .select('*', { count: 'exact' });

            if (debouncedSearchTerm) {
                query = query.ilike('deyim', `%${debouncedSearchTerm}%`);
            }

            let finalQuery = query
                .order('id')
                .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

            if (abortController?.signal) {
                finalQuery = finalQuery.abortSignal(abortController.signal);
            }

            const { data, count, error } = await finalQuery;

            if (error) throw error;

            setDeyimler(data || []);
            setTotalCount(count || 0);
        } catch (error: any) {
            // Silently ignore aborted requests
            if (error.name === 'AbortError' || error.message?.includes('aborted')) {
                return;
            }
            console.error('Deyimler yüklenirken hata:', error);
            toast.error('Deyimler yüklenemedi');
        }
    }, [debouncedSearchTerm, currentPage]);

    // Tüm deyimleri yükle (oyun için)
    const fetchAllDeyimler = async () => {
        const { data } = await supabase.from('deyimler').select('*');
        setAllDeyimler(data || []);
    };

    // İlk yükleme ve Arama değiştiğinde
    useEffect(() => {
        if (!user) return;

        const abortController = new AbortController();

        const loadData = async () => {
            if (allDeyimler.length === 0) {
                setLoading(true);
                await fetchAllDeyimler();
            }
            await fetchDeyimler(abortController);
            setLoading(false);
        };

        loadData();

        return () => abortController.abort();
    }, [user, debouncedSearchTerm, currentPage, fetchDeyimler]);

    // Oyun: Yeni soru oluştur
    const generateQuestion = useCallback(() => {
        if (allDeyimler.length < 4) return;

        const randomIndex = Math.floor(Math.random() * allDeyimler.length);
        const selectedDeyim = allDeyimler[randomIndex];

        // Deyimi kelimelere ayır
        const words = selectedDeyim.deyim.split(' ').filter(w => w.length > 2);
        if (words.length === 0) {
            generateQuestion();
            return;
        }

        const missingIndex = Math.floor(Math.random() * words.length);
        const missing = words[missingIndex];
        setMissingWord(missing);

        // Diğer deyimlerden yanlış seçenekler
        const otherWords = allDeyimler
            .filter(d => d.id !== selectedDeyim.id)
            .flatMap(d => d.deyim.split(' ').filter(w => w.length > 2))
            .filter(w => w !== missing);

        const shuffled = otherWords.sort(() => Math.random() - 0.5);
        const wrongOptions = shuffled.slice(0, 3);

        const options = [...wrongOptions, missing].sort(() => Math.random() - 0.5);

        setGameQuestion(selectedDeyim);
        setGameOptions(options);
        setSelectedAnswer(null);
    }, [allDeyimler]);

    // Oyunu başlat
    const startGame = () => {
        setScore(0);
        setQuestionNumber(1);
        setGameOver(false);
        setMode('oyun');
        gameStartTimeRef.current = Date.now();
        generateQuestion();
    };

    // Oyun bittiğinde verileri kaydet
    useEffect(() => {
        if (gameOver && gameStartTimeRef.current > 0) {
            const durationSeconds = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
            saveGamePlay({
                game_id: 'deyimler',
                score_achieved: score,
                duration_seconds: durationSeconds,
                metadata: {
                    correct_count: score,
                    total_questions: QUESTIONS_PER_GAME,
                    accuracy: Math.round((score / QUESTIONS_PER_GAME) * 100),
                    game_name: 'Deyimler - Kelime Tamamla',
                }
            });
        }
    }, [gameOver, score, saveGamePlay]);

    // Cevap seç
    const handleAnswer = (answer: string) => {
        if (selectedAnswer) return;

        setSelectedAnswer(answer);
        const isCorrect = answer === missingWord;

        if (isCorrect) {
            setScore(prev => prev + 1);
            toast.success('Doğru! ✅');
        } else {
            toast.error(`Yanlış! Doğru cevap: ${missingWord}`);
        }

        setTimeout(() => {
            if (questionNumber < QUESTIONS_PER_GAME) {
                setQuestionNumber(prev => prev + 1);
                generateQuestion();
            } else {
                setGameOver(true);
            }
        }, 3000);
    };

    // Deyimi göster (oyunda)
    const getDisplayDeyim = () => {
        if (!gameQuestion) return '';
        return gameQuestion.deyim.split(' ').map(word =>
            word === missingWord ? '______' : word
        ).join(' ');
    };

    // Yükleniyor
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
                    <p className="text-slate-400">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 pt-24 pb-12 px-6">
            <div className="container mx-auto max-w-6xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10"
                >
                    <div>
                        <Link
                            to="/bilsem"
                            className="inline-flex items-center gap-2 text-purple-400 font-bold hover:text-purple-300 transition-colors mb-4 uppercase text-xs tracking-widest"
                        >
                            <ChevronLeft size={16} />
                            Ana Sayfa
                        </Link>
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                                <Languages className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl lg:text-4xl font-black text-white">
                                    Deyimler <span className="text-purple-400">Atölyesi</span>
                                </h1>
                                <p className="text-slate-400 text-sm">Türkçe deyimleri öğren ve pratik yap</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Mode Tabs */}
                <div className="flex gap-3 mb-8">
                    <button
                        onClick={() => setMode('liste')}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${mode === 'liste'
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                            : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 border border-white/5'
                            }`}
                    >
                        <BookOpen className="w-5 h-5" />
                        Deyim Listesi
                    </button>
                    <button
                        onClick={startGame}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${mode === 'oyun'
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                            : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 border border-white/5'
                            }`}
                    >
                        <Brain className="w-5 h-5" />
                        Kelime Tamamla
                    </button>
                </div>

                {/* Liste Modu */}
                <AnimatePresence mode="wait">
                    {mode === 'liste' && (
                        <motion.div
                            key="liste"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            {/* Arama */}
                            <div className="relative mb-6">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Deyim ara..."
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            {/* Deyim Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                                {deyimler.map((deyim) => (
                                    <motion.div
                                        key={deyim.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="bg-slate-800/50 border border-white/5 rounded-2xl p-5 hover:border-purple-500/30 transition-all"
                                    >
                                        <h3 className="text-lg font-bold text-white mb-2">{deyim.deyim}</h3>
                                        <p className="text-slate-400 text-sm mb-3">{deyim.aciklama}</p>
                                        {deyim.ornek && (
                                            <p className="text-purple-400 text-xs italic">"{deyim.ornek}"</p>
                                        )}
                                    </motion.div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex justify-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="p-2 bg-slate-800/50 border border-white/10 rounded-lg disabled:opacity-50"
                                    >
                                        <ChevronLeft className="w-5 h-5 text-slate-400" />
                                    </button>
                                    <span className="px-4 py-2 text-slate-400">
                                        {currentPage} / {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="p-2 bg-slate-800/50 border border-white/10 rounded-lg disabled:opacity-50"
                                    >
                                        <ChevronRight className="w-5 h-5 text-slate-400" />
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Oyun Modu */}
                    {mode === 'oyun' && !gameOver && gameQuestion && (
                        <motion.div
                            key="oyun"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="max-w-2xl mx-auto"
                        >
                            {/* Progress */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="text-slate-400">
                                    Soru <span className="text-white font-bold">{questionNumber}</span> / {QUESTIONS_PER_GAME}
                                </div>
                                <div className="flex items-center gap-2 text-amber-400">
                                    <Trophy className="w-5 h-5" />
                                    <span className="font-bold">{score}</span>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="h-2 bg-slate-800 rounded-full mb-8 overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(questionNumber / QUESTIONS_PER_GAME) * 100}%` }}
                                />
                            </div>

                            {/* Question Card */}
                            <div className="bg-slate-800/50 border border-white/10 rounded-3xl p-8 mb-6">
                                <p className="text-slate-400 text-sm mb-4">Eksik kelimeyi tamamla:</p>
                                <h2 className="text-2xl lg:text-3xl font-bold text-white text-center mb-4">
                                    {selectedAnswer ? gameQuestion.deyim : getDisplayDeyim()}
                                </h2>

                                {/* Açıklama - cevap verildikten sonra göster */}
                                <AnimatePresence>
                                    {selectedAnswer && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-4 pt-4 border-t border-white/10"
                                        >
                                            <p className="text-purple-400 text-sm font-medium mb-1">Açıklama:</p>
                                            <p className="text-slate-300 text-center">{gameQuestion.aciklama}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Options */}
                            <div className="grid grid-cols-2 gap-4">
                                {gameOptions.map((option, idx) => {
                                    const isSelected = selectedAnswer === option;
                                    const isCorrect = option === missingWord;
                                    const showResult = selectedAnswer !== null;

                                    return (
                                        <motion.button
                                            key={idx}
                                            onClick={() => handleAnswer(option)}
                                            disabled={selectedAnswer !== null}
                                            whileHover={{ scale: selectedAnswer ? 1 : 1.02 }}
                                            whileTap={{ scale: selectedAnswer ? 1 : 0.98 }}
                                            className={`p-5 rounded-2xl font-medium text-lg transition-all ${showResult
                                                ? isCorrect
                                                    ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400'
                                                    : isSelected
                                                        ? 'bg-red-500/20 border-2 border-red-500 text-red-400'
                                                        : 'bg-slate-800/50 border border-white/5 text-slate-500'
                                                : 'bg-slate-800/50 border border-white/10 text-white hover:bg-slate-700/50 hover:border-purple-500/30'
                                                }`}
                                        >
                                            <div className="flex items-center justify-center gap-3">
                                                {showResult && isCorrect && <Check className="w-5 h-5" />}
                                                {showResult && isSelected && !isCorrect && <X className="w-5 h-5" />}
                                                {option}
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {/* Game Over */}
                    {mode === 'oyun' && gameOver && (
                        <motion.div
                            key="gameover"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="max-w-md mx-auto text-center"
                        >
                            <div className="bg-slate-800/50 border border-white/10 rounded-3xl p-10">
                                <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Trophy className="w-10 h-10 text-white" />
                                </div>
                                <h2 className="text-3xl font-black text-white mb-2">Oyun Bitti!</h2>
                                <p className="text-slate-400 mb-6">
                                    {QUESTIONS_PER_GAME} sorudan <span className="text-amber-400 font-bold">{score}</span> doğru
                                </p>
                                <div className="flex gap-3 justify-center">
                                    <button
                                        onClick={startGame}
                                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl"
                                    >
                                        <RotateCcw className="w-5 h-5" />
                                        Tekrar Oyna
                                    </button>
                                    <button
                                        onClick={() => setMode('liste')}
                                        className="px-6 py-3 bg-slate-700/50 border border-white/10 text-white font-medium rounded-xl"
                                    >
                                        Listeye Dön
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default DeyimlerPage;
