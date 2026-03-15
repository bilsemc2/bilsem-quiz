import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Search, ChevronLeft, Languages, Brain, Check, X, Loader2, ChevronRight, Trophy, RotateCcw, Image, ZoomIn } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth/useAuth';
import { useGamePersistence } from '../hooks/useGamePersistence';
import { useViewportAnchor } from '../hooks/useViewportAnchor';
import {
    loadAllPublicDeyimler,
    loadPublicDeyimGallery,
    loadPublicDeyimList,
    type PublicDeyim as Deyim
} from '@/features/content/model/deyimUseCases';

type Mode = 'liste' | 'oyun' | 'galeri';

const R2_BASE = 'https://deyimler-images.bilsemc2-eth.workers.dev/idioms';
const FALLBACK_IMAGE = '/images/beyninikullan.webp';
const ITEMS_PER_PAGE = 12;
const GALLERY_PER_PAGE = 20;
const QUESTIONS_PER_GAME = 10;

// Lazy loaded image component
const LazyImage = ({ src, alt, onClick, onError }: { src: string; alt: string; onClick: () => void; onError: () => void }) => {
    const [loaded, setLoaded] = useState(false);
    const [useFallback, setUseFallback] = useState(false);
    const imgRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
            { rootMargin: '500px' }
        );
        if (imgRef.current) observer.observe(imgRef.current);
        return () => observer.disconnect();
    }, []);

    const currentSrc = useFallback ? FALLBACK_IMAGE : src;

    return (
        <div ref={imgRef} className="relative aspect-square bg-gray-100 dark:bg-slate-700/50 rounded-xl overflow-hidden cursor-pointer group" onClick={onClick}>
            {isVisible && (
                <img
                    src={currentSrc}
                    alt={alt}
                    loading="lazy"
                    decoding="async"
                    width={300}
                    height={300}
                    onLoad={() => setLoaded(true)}
                    onError={() => {
                        if (!useFallback) {
                            setUseFallback(true);
                            setLoaded(false);
                            onError();
                        }
                    }}
                    className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                />
            )}
            {isVisible && !loaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-3 border-purple-400 border-t-transparent rounded-full animate-spin" />
                </div>
            )}
            {loaded && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <ZoomIn size={28} className="text-white drop-shadow-lg" />
                </div>
            )}
        </div>
    );
};

const DeyimlerPage = () => {
    const { user } = useAuth();
    const { saveGamePlay } = useGamePersistence();
    const navigate = useNavigate();
    const gameStartTimeRef = useRef<number>(0);
    const { anchorRef: pageTopRef, scrollToAnchor: scrollToPageTop } = useViewportAnchor();

    // State
    const [deyimler, setDeyimler] = useState<Deyim[]>([]);
    const [allDeyimler, setAllDeyimler] = useState<Deyim[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [mode, setMode] = useState<Mode>('galeri');

    // Gallery State
    const [galleryDeyimler, setGalleryDeyimler] = useState<Deyim[]>([]);
    const [galleryPage, setGalleryPage] = useState(1);
    const [galleryTotal, setGalleryTotal] = useState(0);
    const [galleryLoading, setGalleryLoading] = useState(false);
    const [lightboxDeyim, setLightboxDeyim] = useState<Deyim | null>(null);
    const [failedImages, setFailedImages] = useState<Set<number>>(new Set());

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
        if (!user) { navigate('/login'); }
    }, [user, navigate]);

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setCurrentPage(1);
            setGalleryPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Deyimleri yükle (liste)
    const fetchDeyimler = useCallback(async (abortController?: AbortController) => {
        try {
            const { deyimler: nextDeyimler, totalCount: nextTotalCount } = await loadPublicDeyimList({
                searchTerm: debouncedSearchTerm,
                page: currentPage,
                pageSize: ITEMS_PER_PAGE,
                signal: abortController?.signal
            });
            setDeyimler(nextDeyimler);
            setTotalCount(nextTotalCount);
        } catch (error: unknown) {
            if (error instanceof Error && (error.name === 'AbortError' || error.message?.includes('aborted'))) return;
            toast.error('Deyimler yüklenemedi');
        }
    }, [debouncedSearchTerm, currentPage]);

    // Galeri deyimlerini yükle (child_safe=true)
    const fetchGalleryDeyimler = useCallback(async () => {
        setGalleryLoading(true);
        try {
            const { deyimler: nextDeyimler, totalCount: nextTotalCount } = await loadPublicDeyimGallery({
                searchTerm: debouncedSearchTerm,
                page: galleryPage,
                pageSize: GALLERY_PER_PAGE
            });
            setGalleryDeyimler(nextDeyimler);
            setGalleryTotal(nextTotalCount);
        } catch {
            toast.error('Karikatürler yüklenemedi');
        } finally {
            setGalleryLoading(false);
        }
    }, [debouncedSearchTerm, galleryPage]);

    // Tüm deyimleri yükle (oyun için)
    const fetchAllDeyimler = useCallback(async () => {
        try {
            const data = await loadAllPublicDeyimler();
            setAllDeyimler(data);
        } catch {
            setAllDeyimler([]);
        }
    }, []);

    // İlk yükleme ve mod değiştiğinde
    useEffect(() => {
        if (!user) return;
        const abortController = new AbortController();
        const loadData = async () => {
            if (allDeyimler.length === 0) { setLoading(true); await fetchAllDeyimler(); }
            if (mode === 'liste') { await fetchDeyimler(abortController); }
            if (mode === 'galeri') { await fetchGalleryDeyimler(); }
            setLoading(false);
        };
        loadData();
        return () => abortController.abort();
    }, [user, mode, debouncedSearchTerm, currentPage, galleryPage, allDeyimler.length, fetchDeyimler, fetchGalleryDeyimler, fetchAllDeyimler]);

    // R2 image URL — NFC normalize + slash temizleme + çift alt çizgi düzeltme
    const getImageUrl = (deyim: Deyim) => {
        let filename = deyim.image_filename || deyim.deyim.toLowerCase().replace(/ /g, '_') + '.png';
        // R2 dosya adları NFC formunda, slash içermiyor ve çift alt çizgi yok
        filename = filename.normalize('NFC').replace(/\//g, '').replace(/_+/g, '_');
        return `${R2_BASE}/${filename}`;
    };

    // Oyun: Yeni soru oluştur
    const generateQuestion = useCallback(() => {
        if (allDeyimler.length < 4) return;
        const randomIndex = Math.floor(Math.random() * allDeyimler.length);
        const selectedDeyim = allDeyimler[randomIndex];
        const words = selectedDeyim.deyim.split(' ').filter(w => w.length > 2);
        if (words.length === 0) { generateQuestion(); return; }
        const missingIndex = Math.floor(Math.random() * words.length);
        const missing = words[missingIndex];
        setMissingWord(missing);
        const otherWords = allDeyimler.filter(d => d.id !== selectedDeyim.id).flatMap(d => d.deyim.split(' ').filter(w => w.length > 2)).filter(w => w !== missing);
        const shuffled = otherWords.sort(() => Math.random() - 0.5);
        const wrongOptions = shuffled.slice(0, 3);
        const options = [...wrongOptions, missing].sort(() => Math.random() - 0.5);
        setGameQuestion(selectedDeyim);
        setGameOptions(options);
        setSelectedAnswer(null);
    }, [allDeyimler]);

    const startGame = () => {
        setScore(0); setQuestionNumber(1); setGameOver(false); setMode('oyun');
        gameStartTimeRef.current = Date.now();
        generateQuestion();
        scrollToPageTop();
    };

    useEffect(() => {
        if (gameOver && gameStartTimeRef.current > 0) {
            const durationSeconds = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
            saveGamePlay({ game_id: 'deyimler', score_achieved: score, duration_seconds: durationSeconds, metadata: { correct_count: score, total_questions: QUESTIONS_PER_GAME, accuracy: Math.round((score / QUESTIONS_PER_GAME) * 100), game_name: 'Deyimler - Kelime Tamamla' } });
        }
    }, [gameOver, score, saveGamePlay]);

    const handleAnswer = (answer: string) => {
        if (selectedAnswer) return;
        setSelectedAnswer(answer);
        const isCorrect = answer === missingWord;
        if (isCorrect) { setScore(prev => prev + 1); toast.success('Doğru! ✅'); }
        else { toast.error(`Yanlış! Doğru cevap: ${missingWord}`); }
        setTimeout(() => {
            if (questionNumber < QUESTIONS_PER_GAME) { setQuestionNumber(prev => prev + 1); generateQuestion(); }
            else { setGameOver(true); }
        }, 3000);
    };

    const getDisplayDeyim = () => {
        if (!gameQuestion) return '';
        return gameQuestion.deyim.split(' ').map(word => word === missingWord ? '______' : word).join(' ');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center transition-colors duration-300">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-cyber-pink animate-spin mx-auto mb-4" />
                    <p className="text-slate-500 dark:text-slate-400 font-nunito font-bold">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
    const galleryTotalPages = Math.ceil(galleryTotal / GALLERY_PER_PAGE);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pt-24 pb-12 px-4 sm:px-6 relative overflow-hidden transition-colors duration-300">
            <div className="fixed inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(0,0,0,0.15)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

            <div ref={pageTopRef} className="container mx-auto max-w-6xl relative z-10">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-6 mb-12">
                    <Link to="/" className="inline-flex items-center gap-2 text-black dark:text-white font-nunito font-extrabold uppercase text-xs tracking-widest bg-white dark:bg-slate-800 border-2 border-black/10 rounded-xl px-4 py-2 shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-md transition-all">
                        <ChevronLeft size={14} strokeWidth={3} /> Ana Sayfa
                    </Link>

                    <div className="flex items-center justify-center">
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}
                            className="p-5 bg-cyber-pink/10 border-3 border-cyber-pink/30 rounded-2xl">
                            <Languages size={48} className="text-cyber-pink" strokeWidth={2.5} />
                        </motion.div>
                    </div>

                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-nunito font-extrabold text-black dark:text-white tracking-tight uppercase leading-none">
                        Deyimler <span className="text-cyber-pink">Atölyesi</span>
                    </h1>
                    <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-nunito font-bold">
                        Türkçe deyimleri karikatürlerle öğren, kelime oyunuyla pekiştir!
                    </p>
                </motion.div>

                {/* Mode Tabs */}
                <div className="flex flex-wrap gap-3 mb-8 justify-center">
                    <button onClick={() => { setMode('galeri'); scrollToPageTop(); }}
                        className={`flex items-center gap-2 px-5 py-3 font-nunito font-extrabold text-sm uppercase tracking-wider rounded-xl border-2 transition-all ${mode === 'galeri'
                            ? 'bg-cyber-pink text-white border-black/10 shadow-neo-md -translate-y-0.5'
                            : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-black/10 shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-md'}`}>
                        <Image size={18} strokeWidth={2.5} /> Karikatürler
                    </button>
                    <button onClick={() => { setMode('liste'); scrollToPageTop(); }}
                        className={`flex items-center gap-2 px-5 py-3 font-nunito font-extrabold text-sm uppercase tracking-wider rounded-xl border-2 transition-all ${mode === 'liste'
                            ? 'bg-cyber-blue text-white border-black/10 shadow-neo-md -translate-y-0.5'
                            : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-black/10 shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-md'}`}>
                        <BookOpen size={18} strokeWidth={2.5} /> Deyim Listesi
                    </button>
                    <button onClick={startGame}
                        className={`flex items-center gap-2 px-5 py-3 font-nunito font-extrabold text-sm uppercase tracking-wider rounded-xl border-2 transition-all ${mode === 'oyun'
                            ? 'bg-cyber-gold text-white border-black/10 shadow-neo-md -translate-y-0.5'
                            : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-black/10 shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-md'}`}>
                        <Brain size={18} strokeWidth={2.5} /> Kelime Tamamla
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {/* ═══ GALERİ MODU ═══ */}
                    {mode === 'galeri' && (
                        <motion.div key="galeri" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                            {/* Arama */}
                            <div className="relative mb-6 max-w-md mx-auto">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input type="text" placeholder="Karikatür ara..." value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setGalleryPage(1); }}
                                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border-2 border-black/10 rounded-xl text-black dark:text-white placeholder-slate-400 font-nunito font-bold focus:outline-none focus:ring-2 focus:ring-cyber-pink shadow-neo-sm" />
                            </div>

                            {/* Sonuç sayısı */}
                            <p className="text-center text-slate-400 font-nunito font-bold text-sm mb-6">
                                {galleryTotal} karikatür bulundu
                                {failedImages.size > 0 && <span className="text-amber-400 ml-2">({failedImages.size} resim bulunamadı)</span>}
                            </p>

                            {galleryLoading ? (
                                <div className="flex justify-center py-20">
                                    <Loader2 className="w-10 h-10 text-cyber-pink animate-spin" />
                                </div>
                            ) : (
                                <>
                                    {/* Karikatür Grid */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                                        {galleryDeyimler.map((deyim) => (
                                            <motion.div key={deyim.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                                className="bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl overflow-hidden shadow-neo-sm hover:shadow-neo-md hover:-translate-y-1 transition-all">
                                                <LazyImage
                                                    src={getImageUrl(deyim)}
                                                    alt={deyim.deyim}
                                                    onClick={() => setLightboxDeyim(deyim)}
                                                    onError={() => {
                                                        setFailedImages(prev => new Set(prev).add(deyim.id));
                                                    }}
                                                />
                                                <div className="p-3">
                                                    <h3 className="text-sm font-nunito font-extrabold text-black dark:text-white leading-tight line-clamp-2">
                                                        {deyim.deyim}
                                                    </h3>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Pagination */}
                                    {galleryTotalPages > 1 && (
                                        <div className="flex items-center justify-center gap-3">
                                            <button onClick={() => { setGalleryPage(p => Math.max(1, p - 1)); scrollToPageTop(); }}
                                                disabled={galleryPage === 1}
                                                className="p-3 bg-white dark:bg-slate-800 border-2 border-black/10 rounded-xl shadow-neo-sm disabled:opacity-40 hover:-translate-y-0.5 hover:shadow-neo-md transition-all">
                                                <ChevronLeft size={20} className="text-black dark:text-white" strokeWidth={3} />
                                            </button>
                                            <span className="px-5 py-2.5 bg-white dark:bg-slate-800 border-2 border-black/10 rounded-xl shadow-neo-sm font-nunito font-extrabold text-sm text-black dark:text-white">
                                                {galleryPage} / {galleryTotalPages}
                                            </span>
                                            <button onClick={() => { setGalleryPage(p => Math.min(galleryTotalPages, p + 1)); scrollToPageTop(); }}
                                                disabled={galleryPage === galleryTotalPages}
                                                className="p-3 bg-white dark:bg-slate-800 border-2 border-black/10 rounded-xl shadow-neo-sm disabled:opacity-40 hover:-translate-y-0.5 hover:shadow-neo-md transition-all">
                                                <ChevronRight size={20} className="text-black dark:text-white" strokeWidth={3} />
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </motion.div>
                    )}

                    {/* ═══ LİSTE MODU ═══ */}
                    {mode === 'liste' && (
                        <motion.div key="liste" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                            <div className="relative mb-6 max-w-md mx-auto">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input type="text" placeholder="Deyim ara..." value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border-2 border-black/10 rounded-xl text-black dark:text-white placeholder-slate-400 font-nunito font-bold focus:outline-none focus:ring-2 focus:ring-cyber-blue shadow-neo-sm" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                                {deyimler.map((deyim) => (
                                    <motion.div key={deyim.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                        className="bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl p-5 shadow-neo-sm hover:shadow-neo-md hover:-translate-y-1 transition-all">
                                        <h3 className="text-lg font-nunito font-extrabold text-black dark:text-white mb-2">{deyim.deyim}</h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm font-nunito font-bold mb-3">{deyim.aciklama}</p>
                                        {deyim.ornek && <p className="text-cyber-pink text-xs italic font-nunito font-bold">"{deyim.ornek}"</p>}
                                    </motion.div>
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-3">
                                    <button onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); scrollToPageTop(); }}
                                        disabled={currentPage === 1}
                                        className="p-3 bg-white dark:bg-slate-800 border-2 border-black/10 rounded-xl shadow-neo-sm disabled:opacity-40 hover:-translate-y-0.5 hover:shadow-neo-md transition-all">
                                        <ChevronLeft size={20} className="text-black dark:text-white" strokeWidth={3} />
                                    </button>
                                    <span className="px-5 py-2.5 bg-white dark:bg-slate-800 border-2 border-black/10 rounded-xl shadow-neo-sm font-nunito font-extrabold text-sm text-black dark:text-white">
                                        {currentPage} / {totalPages}
                                    </span>
                                    <button onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); scrollToPageTop(); }}
                                        disabled={currentPage === totalPages}
                                        className="p-3 bg-white dark:bg-slate-800 border-2 border-black/10 rounded-xl shadow-neo-sm disabled:opacity-40 hover:-translate-y-0.5 hover:shadow-neo-md transition-all">
                                        <ChevronRight size={20} className="text-black dark:text-white" strokeWidth={3} />
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ═══ OYUN MODU ═══ */}
                    {mode === 'oyun' && !gameOver && gameQuestion && (
                        <motion.div key="oyun" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-2xl mx-auto">
                            <div className="flex items-center justify-between mb-6">
                                <div className="bg-white dark:bg-slate-800 border-2 border-black/10 rounded-xl px-4 py-2 shadow-neo-sm font-nunito font-extrabold text-sm text-black dark:text-white">
                                    Soru <span className="text-cyber-pink">{questionNumber}</span> / {QUESTIONS_PER_GAME}
                                </div>
                                <div className="flex items-center gap-2 bg-cyber-gold/10 border-2 border-cyber-gold/30 rounded-xl px-4 py-2">
                                    <Trophy size={18} className="text-cyber-gold" strokeWidth={2.5} />
                                    <span className="font-nunito font-extrabold text-cyber-gold">{score}</span>
                                </div>
                            </div>

                            <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full mb-8 overflow-hidden border border-black/5">
                                <motion.div className="h-full bg-cyber-pink" initial={{ width: 0 }}
                                    animate={{ width: `${(questionNumber / QUESTIONS_PER_GAME) * 100}%` }} />
                            </div>

                            <div className="bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl p-8 mb-6 shadow-neo-md">
                                <p className="text-slate-400 font-nunito font-bold text-sm mb-4 uppercase tracking-wider">Eksik kelimeyi tamamla:</p>
                                <h2 className="text-2xl lg:text-3xl font-nunito font-extrabold text-black dark:text-white text-center mb-4">
                                    {selectedAnswer ? gameQuestion.deyim : getDisplayDeyim()}
                                </h2>
                                <AnimatePresence>
                                    {selectedAnswer && (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                            className="mt-4 pt-4 border-t-2 border-black/5">
                                            <p className="text-cyber-pink font-nunito font-extrabold text-sm mb-1 uppercase">Açıklama:</p>
                                            <p className="text-slate-500 dark:text-slate-400 text-center font-nunito font-bold">{gameQuestion.aciklama}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {gameOptions.map((option, idx) => {
                                    const isSelected = selectedAnswer === option;
                                    const isCorrect = option === missingWord;
                                    const showResult = selectedAnswer !== null;
                                    return (
                                        <motion.button key={idx} onClick={() => handleAnswer(option)} disabled={selectedAnswer !== null}
                                            whileHover={{ scale: selectedAnswer ? 1 : 1.02 }} whileTap={{ scale: selectedAnswer ? 1 : 0.98 }}
                                            className={`p-5 rounded-2xl font-nunito font-extrabold text-lg border-2 transition-all ${showResult
                                                ? isCorrect ? 'bg-cyber-emerald/10 border-cyber-emerald text-cyber-emerald shadow-neo-sm'
                                                    : isSelected ? 'bg-red-500/10 border-red-400 text-red-500'
                                                        : 'bg-gray-50 dark:bg-slate-700/50 border-black/5 text-slate-400'
                                                : 'bg-white dark:bg-slate-800 border-black/10 text-black dark:text-white shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-md'}`}>
                                            <div className="flex items-center justify-center gap-3">
                                                {showResult && isCorrect && <Check size={20} strokeWidth={3} />}
                                                {showResult && isSelected && !isCorrect && <X size={20} strokeWidth={3} />}
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
                        <motion.div key="gameover" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto text-center">
                            <div className="bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl p-10 shadow-neo-lg">
                                <div className="w-20 h-20 bg-cyber-gold/10 border-3 border-cyber-gold/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <Trophy size={40} className="text-cyber-gold" strokeWidth={2.5} />
                                </div>
                                <h2 className="text-3xl font-nunito font-extrabold text-black dark:text-white mb-2 uppercase">Oyun Bitti!</h2>
                                <p className="text-slate-500 dark:text-slate-400 mb-6 font-nunito font-bold">
                                    {QUESTIONS_PER_GAME} sorudan <span className="text-cyber-gold font-extrabold">{score}</span> doğru
                                </p>
                                <div className="flex gap-3 justify-center">
                                    <button onClick={startGame}
                                        className="flex items-center gap-2 px-6 py-3 bg-cyber-pink text-white font-nunito font-extrabold uppercase tracking-wider text-sm border-2 border-black/10 rounded-xl shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-md transition-all">
                                        <RotateCcw size={18} strokeWidth={2.5} /> Tekrar Oyna
                                    </button>
                                    <button onClick={() => setMode('galeri')}
                                        className="px-6 py-3 bg-white dark:bg-slate-700 text-black dark:text-white font-nunito font-extrabold uppercase tracking-wider text-sm border-2 border-black/10 rounded-xl shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-md transition-all">
                                        Galeriye Dön
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ═══ LIGHTBOX MODAL ═══ */}
            <AnimatePresence>
                {lightboxDeyim && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                        onClick={() => setLightboxDeyim(null)}>
                        <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
                            className="bg-white dark:bg-slate-800 border-3 border-black/10 rounded-2xl overflow-hidden shadow-neo-lg max-w-2xl w-full max-h-[90vh] flex flex-col"
                            onClick={(e) => e.stopPropagation()}>
                            <div className="h-2 bg-cyber-pink" />
                            <div className="p-2 sm:p-4 overflow-y-auto">
                                <img src={getImageUrl(lightboxDeyim)} alt={lightboxDeyim.deyim}
                                    onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                                    className="w-full rounded-xl border-2 border-black/10 mb-4" />
                                <h2 className="text-xl sm:text-2xl font-nunito font-extrabold text-black dark:text-white mb-2 uppercase tracking-tight">
                                    {lightboxDeyim.deyim}
                                </h2>
                                <p className="text-slate-500 dark:text-slate-400 font-nunito font-bold text-sm mb-3">
                                    {lightboxDeyim.aciklama}
                                </p>
                                {lightboxDeyim.ornek && (
                                    <p className="text-cyber-pink font-nunito font-bold text-sm italic">
                                        "{lightboxDeyim.ornek}"
                                    </p>
                                )}
                            </div>
                            <div className="p-4 border-t-2 border-black/5">
                                <button onClick={() => setLightboxDeyim(null)}
                                    className="w-full py-3 bg-black dark:bg-white text-white dark:text-black font-nunito font-extrabold uppercase tracking-widest text-sm border-2 border-black/10 rounded-xl shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-md transition-all">
                                    Kapat
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DeyimlerPage;
