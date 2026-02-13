import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer, Target,
    CheckCircle2, XCircle, ChevronLeft, Zap, Heart, Puzzle, Check
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useExam } from '../../contexts/ExamContext';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';

// ============== CONSTANTS ==============
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;

// ============== TYPES ==============
interface EmojiDef { emoji: string; name: string; }
interface PuzzleItem extends EmojiDef { id: string; isMatch: boolean; }
interface PuzzleData { category: string; description: string; items: PuzzleItem[]; }

type Phase = 'welcome' | 'playing' | 'checking' | 'feedback' | 'game_over' | 'victory';

interface MindMatchGameProps { examMode?: boolean; }

// ============== FEEDBACK ==============
// ============== CATEGORIES (Türkçe) ==============
const CATEGORIES: Record<string, { description: string; items: EmojiDef[] }> = {
    "Meyveler": {
        description: "Ağaçlarda ve bitkilerde yetişen tatlı yiyecekler",
        items: [
            { emoji: "🍎", name: "Elma" }, { emoji: "🍌", name: "Muz" },
            { emoji: "🍇", name: "Üzüm" }, { emoji: "🍓", name: "Çilek" },
            { emoji: "🍒", name: "Kiraz" }, { emoji: "🍑", name: "Şeftali" },
            { emoji: "🍍", name: "Ananas" }, { emoji: "🥝", name: "Kivi" },
            { emoji: "🍉", name: "Karpuz" }, { emoji: "🍊", name: "Portakal" },
            { emoji: "🍐", name: "Armut" }, { emoji: "🍋", name: "Limon" }
        ]
    },
    "Taşıtlar": {
        description: "İnsanları veya yükleri taşıyan makineler",
        items: [
            { emoji: "🚗", name: "Araba" }, { emoji: "🚕", name: "Taksi" },
            { emoji: "🚙", name: "Cip" }, { emoji: "🚌", name: "Otobüs" },
            { emoji: "🏎️", name: "Yarış Arabası" }, { emoji: "🚓", name: "Polis Arabası" },
            { emoji: "🚑", name: "Ambulans" }, { emoji: "🚒", name: "İtfaiye" },
            { emoji: "✈️", name: "Uçak" }, { emoji: "🚁", name: "Helikopter" },
            { emoji: "🚢", name: "Gemi" }, { emoji: "🚂", name: "Lokomotif" }
        ]
    },
    "Hayvanlar": {
        description: "Doğada veya evde yaşayan canlılar",
        items: [
            { emoji: "🐶", name: "Köpek" }, { emoji: "🐱", name: "Kedi" },
            { emoji: "🐭", name: "Fare" }, { emoji: "🐹", name: "Hamster" },
            { emoji: "🐰", name: "Tavşan" }, { emoji: "🦊", name: "Tilki" },
            { emoji: "🐻", name: "Ayı" }, { emoji: "🐼", name: "Panda" },
            { emoji: "🐨", name: "Koala" }, { emoji: "🐯", name: "Kaplan" },
            { emoji: "🦁", name: "Aslan" }, { emoji: "🐮", name: "İnek" }
        ]
    },
    "Spor Topları": {
        description: "Spor ve oyunlarda kullanılan yuvarlak nesneler",
        items: [
            { emoji: "⚽", name: "Futbol Topu" }, { emoji: "🏀", name: "Basketbol" },
            { emoji: "🏈", name: "Amerikan Futbolu" }, { emoji: "⚾", name: "Beyzbol" },
            { emoji: "🎾", name: "Tenis Topu" }, { emoji: "🏐", name: "Voleybol" },
            { emoji: "🏉", name: "Ragbi Topu" }, { emoji: "🎱", name: "Bilardo" },
            { emoji: "🥎", name: "Softbol" }, { emoji: "🎳", name: "Bovling" }
        ]
    },
    "Fast Food": {
        description: "Hızlı hazırlanan lezzetli yiyecekler",
        items: [
            { emoji: "🍔", name: "Hamburger" }, { emoji: "🍟", name: "Patates Kızartması" },
            { emoji: "🍕", name: "Pizza" }, { emoji: "🌭", name: "Sosisli" },
            { emoji: "🥪", name: "Sandviç" }, { emoji: "🌮", name: "Taco" },
            { emoji: "🌯", name: "Dürüm" }, { emoji: "🥙", name: "Lavaş" },
            { emoji: "🍿", name: "Patlamış Mısır" }, { emoji: "🍩", name: "Donut" }
        ]
    },
    "Hava Durumu": {
        description: "Atmosferin farklı halleri",
        items: [
            { emoji: "☀️", name: "Güneş" }, { emoji: "🌤️", name: "Güneşli Bulutlu" },
            { emoji: "☁️", name: "Bulut" }, { emoji: "🌧️", name: "Yağmur" },
            { emoji: "⛈️", name: "Fırtına" }, { emoji: "🌩️", name: "Şimşek" },
            { emoji: "🌨️", name: "Kar" }, { emoji: "❄️", name: "Kar Tanesi" },
            { emoji: "🌪️", name: "Kasırga" }, { emoji: "🌈", name: "Gökkuşağı" }
        ]
    },
    "Aletler": {
        description: "Tamir ve inşaat için kullanılan araçlar",
        items: [
            { emoji: "🔨", name: "Çekiç" }, { emoji: "🪓", name: "Balta" },
            { emoji: "⛏️", name: "Kazma" }, { emoji: "🛠️", name: "Anahtar" },
            { emoji: "🔧", name: "İngiliz Anahtarı" }, { emoji: "🪛", name: "Tornavida" },
            { emoji: "📏", name: "Cetvel" }, { emoji: "🪚", name: "Testere" },
            { emoji: "🧲", name: "Mıknatıs" }, { emoji: "📐", name: "Gönye" }
        ]
    },
    "Deniz Canlıları": {
        description: "Suda yaşayan hayvanlar",
        items: [
            { emoji: "🐙", name: "Ahtapot" }, { emoji: "🦑", name: "Kalamar" },
            { emoji: "🦐", name: "Karides" }, { emoji: "🦞", name: "Istakoz" },
            { emoji: "🦀", name: "Yengeç" }, { emoji: "🐡", name: "Balon Balığı" },
            { emoji: "🐠", name: "Tropikal Balık" }, { emoji: "🐟", name: "Balık" },
            { emoji: "🐬", name: "Yunus" }, { emoji: "🐳", name: "Balina" }
        ]
    },
    "Sebzeler": {
        description: "Toprakta yetişen sağlıklı besinler",
        items: [
            { emoji: "🥦", name: "Brokoli" }, { emoji: "🥬", name: "Marul" },
            { emoji: "🥒", name: "Salatalık" }, { emoji: "🌽", name: "Mısır" },
            { emoji: "🥕", name: "Havuç" }, { emoji: "🥔", name: "Patates" },
            { emoji: "🍆", name: "Patlıcan" }, { emoji: "🧄", name: "Sarımsak" },
            { emoji: "🧅", name: "Soğan" }, { emoji: "🍄", name: "Mantar" }
        ]
    },
    "Giysiler": {
        description: "Giydiğimiz kıyafetler",
        items: [
            { emoji: "👕", name: "Tişört" }, { emoji: "👖", name: "Pantolon" },
            { emoji: "🧣", name: "Atkı" }, { emoji: "🧤", name: "Eldiven" },
            { emoji: "🧥", name: "Mont" }, { emoji: "🧦", name: "Çorap" },
            { emoji: "👗", name: "Elbise" }, { emoji: "👘", name: "Kimono" },
            { emoji: "🩳", name: "Şort" }, { emoji: "👔", name: "Kravat" }
        ]
    },
    "Müzik Aletleri": {
        description: "Müzik yapımında kullanılan aletler",
        items: [
            { emoji: "🎹", name: "Piyano" }, { emoji: "🎸", name: "Gitar" },
            { emoji: "🎺", name: "Trompet" }, { emoji: "🎻", name: "Keman" },
            { emoji: "🥁", name: "Davul" }, { emoji: "🪗", name: "Akordeon" },
            { emoji: "🎷", name: "Saksafon" }, { emoji: "🪘", name: "Darbuka" },
            { emoji: "🎵", name: "Nota" }, { emoji: "🎶", name: "Müzik" }
        ]
    },
    "Çiçekler": {
        description: "Doğanın renkli güzellikleri",
        items: [
            { emoji: "🌸", name: "Kiraz Çiçeği" }, { emoji: "🌹", name: "Gül" },
            { emoji: "🌻", name: "Ayçiçeği" }, { emoji: "🌺", name: "Çarkıfelek" },
            { emoji: "🌷", name: "Lale" }, { emoji: "🌼", name: "Papatya" },
            { emoji: "💐", name: "Buket" }, { emoji: "🌿", name: "Yaprak" },
            { emoji: "🍀", name: "Yonca" }, { emoji: "🪻", name: "Sümbül" }
        ]
    }
};

// ============== PUZZLE GENERATOR ==============
function generatePuzzle(level: number): PuzzleData {
    const categoryKeys = Object.keys(CATEGORIES);
    const targetKey = categoryKeys[Math.floor(Math.random() * categoryKeys.length)];
    const targetCategory = CATEGORIES[targetKey];

    // Progressive difficulty: more correct items at higher levels
    const correctCount = level <= 5 ? 4 : level <= 12 ? 5 : 6;
    const totalItems = 9;
    const distractorCount = totalItems - correctCount;

    // Pick correct items
    const shuffledTargets = [...targetCategory.items].sort(() => 0.5 - Math.random());
    const selectedTargets = shuffledTargets.slice(0, correctCount);

    // Pick distractors from other categories
    const otherItems: EmojiDef[] = [];
    categoryKeys.forEach(key => {
        if (key !== targetKey) otherItems.push(...CATEGORIES[key].items);
    });
    const selectedDistractors = otherItems
        .sort(() => 0.5 - Math.random())
        .slice(0, distractorCount);

    // Combine, shuffle, assign IDs
    const items: PuzzleItem[] = [
        ...selectedTargets.map(item => ({ ...item, isMatch: true, id: '' })),
        ...selectedDistractors.map(item => ({ ...item, isMatch: false, id: '' })),
    ]
        .sort(() => 0.5 - Math.random())
        .map((item, index) => ({ ...item, id: `item-${Date.now()}-${index}` }));

    return { category: targetKey, description: targetCategory.description, items };
}

// ============== MAIN COMPONENT ==============
const MindMatchGame: React.FC<MindMatchGameProps> = ({ examMode = false }) => {
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;
    const navigate = useNavigate();
    const { submitResult } = useExam();

    // Shared Feedback System
    const { feedbackState, showFeedback } = useGameFeedback();

    const hasSavedRef = useRef(false);

    // Core State
    const [phase, setPhase] = useState<Phase>('welcome');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [level, setLevel] = useState(1);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);

    // Game State
    const [puzzle, setPuzzle] = useState<PuzzleData | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);

    // Timer
    useEffect(() => {
        if ((phase === 'playing' || phase === 'checking') && timeLeft > 0) {
            timerRef.current = setTimeout(() => setTimeLeft(p => p - 1), 1000);
        } else if (timeLeft === 0 && (phase === 'playing' || phase === 'checking')) {
            handleGameOver();
        }
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [phase, timeLeft]);

    const initLevel = useCallback((lvl: number) => {
        const newPuzzle = generatePuzzle(lvl);
        setPuzzle(newPuzzle);
        setSelectedIds(new Set());
    }, []);

    const handleStart = useCallback(() => {
        window.scrollTo(0, 0);
        setPhase('playing');
        setScore(0);
        setLives(INITIAL_LIVES);
        setLevel(1);
        setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
        startTimeRef.current = Date.now();
        hasSavedRef.current = false;
        initLevel(1);
    }, [initLevel]);

    useEffect(() => {
        if ((location.state?.autoStart || examMode) && phase === 'welcome') {
            handleStart();
        }
    }, [location.state, examMode, phase, handleStart]);

    const handleGameOver = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        setPhase('game_over');
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

        if (examMode) {
            submitResult(level >= 5, score, 1000, duration);
            setTimeout(() => navigate('/atolyeler/sinav-simulasyonu/devam'), 1500);
            return;
        }

        await saveGamePlay({
            game_id: 'mindmatch-oruntu',
            score_achieved: score,
            duration_seconds: duration,
            metadata: { levels_completed: level, final_lives: lives },
        });
    }, [saveGamePlay, score, level, lives, examMode, submitResult, navigate]);

    const handleVictory = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        setPhase('victory');
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

        if (examMode) {
            submitResult(true, score, 1000, duration);
            setTimeout(() => navigate('/atolyeler/sinav-simulasyonu/devam'), 1500);
            return;
        }

        await saveGamePlay({
            game_id: 'mindmatch-oruntu',
            score_achieved: score,
            duration_seconds: duration,
            metadata: { levels_completed: MAX_LEVEL, victory: true },
        });
    }, [saveGamePlay, score, examMode, submitResult, navigate]);

    const toggleCard = (id: string) => {
        if (phase !== 'playing') return;
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const checkAnswer = () => {
        if (!puzzle || phase !== 'playing') return;
        setPhase('checking');

        const correctIds = new Set(puzzle.items.filter(i => i.isMatch).map(i => i.id));
        const missed = Array.from(correctIds).filter(id => !selectedIds.has(id));
        const wrong = Array.from(selectedIds).filter(id => !correctIds.has(id));

        const isCorrect = missed.length === 0 && wrong.length === 0;

        if (isCorrect) {
            // feedbackState managed by useGameFeedback
            setScore(prev => prev + 10 * level);
            showFeedback(true);
            setPhase('feedback');

            setTimeout(() => {
                if (level >= MAX_LEVEL) {
                    handleVictory();
                } else {
                    const newLevel = level + 1;
                    setLevel(newLevel);
                    initLevel(newLevel);
                    setPhase('playing');
                }
            }, 1200);
        } else {
            // feedbackState managed by useGameFeedback
            showFeedback(isCorrect);
            setPhase('feedback');
            const newLives = lives - 1;
            setLives(newLives);

            setTimeout(() => {
                if (newLives <= 0) {
                    handleGameOver();
                } else {
                    // Same puzzle, cleared selection
                    setSelectedIds(new Set());
                    setPhase('playing');
                }
            }, 1500);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getCardStyle = (item: PuzzleItem) => {
        const isSelected = selectedIds.has(item.id);
        const isRevealed = phase === 'checking' || phase === 'feedback';

        if (isRevealed) {
            if (item.isMatch && isSelected) {
                return {
                    bg: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
                    shadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.3), 0 0 20px rgba(52, 211, 153, 0.4)',
                    border: 'border-emerald-400',
                    ring: 'ring-2 ring-emerald-400/60',
                };
            }
            if (item.isMatch && !isSelected) {
                return {
                    bg: 'linear-gradient(135deg, rgba(52,211,153,0.3) 0%, rgba(16,185,129,0.2) 100%)',
                    shadow: 'inset 0 -3px 6px rgba(0,0,0,0.2), inset 0 3px 6px rgba(255,255,255,0.1)',
                    border: 'border-emerald-500/50',
                    ring: 'ring-1 ring-emerald-400/30',
                };
            }
            if (!item.isMatch && isSelected) {
                return {
                    bg: 'linear-gradient(135deg, rgba(239,68,68,0.4) 0%, rgba(220,38,38,0.3) 100%)',
                    shadow: 'inset 0 -3px 6px rgba(0,0,0,0.2), inset 0 3px 6px rgba(255,255,255,0.1)',
                    border: 'border-red-400',
                    ring: 'ring-2 ring-red-400/60',
                };
            }
            return {
                bg: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                shadow: 'inset 0 -3px 6px rgba(0,0,0,0.2), inset 0 3px 6px rgba(255,255,255,0.05)',
                border: 'border-white/10',
                ring: '',
            };
        }

        if (isSelected) {
            return {
                bg: 'linear-gradient(135deg, #818CF8 0%, #A78BFA 100%)',
                shadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.3), 0 0 30px rgba(129, 140, 248, 0.6)',
                border: 'border-indigo-400',
                ring: 'ring-2 ring-indigo-400/60',
            };
        }

        return {
            bg: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
            shadow: 'inset 0 -3px 6px rgba(0,0,0,0.2), inset 0 3px 6px rgba(255,255,255,0.1)',
            border: 'border-white/20',
            ring: '',
        };
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950 to-purple-950 text-white">
            {/* Decorative */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <div className="relative z-10 p-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Link to="/atolyeler/bireysel-degerlendirme" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                        <ChevronLeft size={20} />
                        <span className="hidden sm:inline">Geri</span>
                    </Link>

                    {(phase === 'playing' || phase === 'checking' || phase === 'feedback') && (
                        <div className="flex items-center gap-3 sm:gap-6">
                            <div className="flex items-center gap-1.5 bg-amber-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-amber-500/30">
                                <Star className="text-amber-400" size={16} />
                                <span className="font-bold text-amber-400 text-sm">{score}</span>
                            </div>
                            <div className="flex items-center gap-1 bg-red-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-red-500/30">
                                {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
                                    <Heart key={i} size={14} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-400/30'} />
                                ))}
                            </div>
                            <div className="flex items-center gap-1.5 bg-blue-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-blue-500/30">
                                <Timer className="text-blue-400" size={16} />
                                <span className={`font-bold text-sm ${timeLeft <= 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'}`}>{formatTime(timeLeft)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-emerald-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-emerald-500/30">
                                <Zap className="text-emerald-400" size={16} />
                                <span className="font-bold text-emerald-400 text-sm">{level}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4">
                <AnimatePresence mode="wait">
                    {/* WELCOME */}
                    {phase === 'welcome' && (
                        <motion.div key="welcome" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
                            <div className="mb-6 inline-flex items-center gap-1.5 px-3 py-1 bg-violet-500/20 border border-violet-500/30 rounded-full">
                                <span className="text-[9px] font-black text-violet-300 uppercase tracking-wider">TUZÖ</span>
                                <span className="text-[9px] font-bold text-violet-400">5.5.4 Kategori Analizi</span>
                            </div>

                            <motion.div
                                className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-violet-400 to-purple-600 rounded-[40%] flex items-center justify-center"
                                style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }}
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Puzzle size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                                MindMatch Örüntü
                            </h1>
                            <p className="text-slate-400 mb-8">
                                Kategoriye ait tüm öğeleri bul ve seç! Kalıbı çöz, eşleşmeyenleri ayır.
                            </p>

                            <div className="flex flex-wrap justify-center gap-4 mb-8">
                                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2 border border-white/10">
                                    <Heart className="text-red-400" size={16} />
                                    <span className="text-sm text-slate-300">{INITIAL_LIVES} Can</span>
                                </div>
                                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2 border border-white/10">
                                    <Timer className="text-blue-400" size={16} />
                                    <span className="text-sm text-slate-300">{TIME_LIMIT / 60} Dakika</span>
                                </div>
                                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2 border border-white/10">
                                    <Target className="text-emerald-400" size={16} />
                                    <span className="text-sm text-slate-300">{MAX_LEVEL} Seviye</span>
                                </div>
                            </div>

                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart}
                                className="px-10 py-5 bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl font-bold text-xl"
                                style={{ boxShadow: '0 8px 32px rgba(139, 92, 246, 0.4)' }}>
                                <div className="flex items-center gap-3">
                                    <Play size={28} className="fill-white" />
                                    <span>Başla</span>
                                </div>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* PLAYING */}
                    {(phase === 'playing' || phase === 'checking' || phase === 'feedback') && puzzle && (
                        <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-xl">
                            {/* Category hint */}
                            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-5 mb-5 border border-white/10 text-center">
                                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Kategori</h2>
                                <div className="inline-block bg-violet-500/20 text-violet-300 px-6 py-3 rounded-2xl text-xl font-bold border border-violet-500/30">
                                    ✨ {puzzle.category} ✨
                                </div>
                                <p className="mt-3 text-slate-400 text-sm">
                                    Bu kategoriye ait <strong className="text-white">{puzzle.items.filter(i => i.isMatch).length}</strong> öğeyi bul
                                </p>
                            </div>

                            {/* Grid */}
                            <div className="grid grid-cols-3 gap-3 mb-5">
                                {puzzle.items.map(item => {
                                    const style = getCardStyle(item);
                                    const isSelected = selectedIds.has(item.id);
                                    return (
                                        <motion.button
                                            key={item.id}
                                            whileHover={phase === 'playing' ? { scale: 1.05, y: -2 } : {}}
                                            whileTap={phase === 'playing' ? { scale: 0.95 } : {}}
                                            onClick={() => toggleCard(item.id)}
                                            disabled={phase !== 'playing'}
                                            className={`relative aspect-square rounded-2xl border-2 flex flex-col items-center justify-center p-2 transition-all duration-200 ${style.border} ${style.ring} ${phase === 'playing' ? 'cursor-pointer' : 'cursor-default'}`}
                                            style={{
                                                background: style.bg,
                                                boxShadow: style.shadow,
                                                minHeight: '80px',
                                            }}
                                        >
                                            <span className="text-4xl sm:text-5xl select-none mb-1">{item.emoji}</span>
                                            <span className="text-[10px] sm:text-xs font-medium text-slate-300 text-center leading-tight">{item.name}</span>

                                            {isSelected && phase === 'playing' && (
                                                <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-indigo-400 rounded-full flex items-center justify-center">
                                                    <Check size={12} className="text-white" strokeWidth={3} />
                                                </div>
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </div>

                            {/* Check button */}
                            {phase === 'playing' && (
                                <motion.button
                                    whileHover={selectedIds.size > 0 ? { scale: 1.03, y: -2 } : {}}
                                    whileTap={selectedIds.size > 0 ? { scale: 0.97 } : {}}
                                    onClick={checkAnswer}
                                    disabled={selectedIds.size === 0}
                                    className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${selectedIds.size > 0
                                        ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white'
                                        : 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/10'
                                        }`}
                                    style={selectedIds.size > 0 ? { boxShadow: '0 8px 32px rgba(139, 92, 246, 0.4)' } : {}}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <CheckCircle2 size={22} />
                                        <span>Kontrol Et ({selectedIds.size} seçili)</span>
                                    </div>
                                </motion.button>
                            )}
                        </motion.div>
                    )}

                    {/* GAME OVER */}
                    {phase === 'game_over' && (
                        <motion.div key="game_over" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
                            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-red-500 to-rose-600 rounded-3xl flex items-center justify-center"
                                style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.2), 0 8px 24px rgba(0,0,0,0.3)' }}>
                                <XCircle size={48} className="text-white" />
                            </div>
                            <h2 className="text-3xl font-bold text-red-400 mb-4">Oyun Bitti!</h2>
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center"><p className="text-slate-400 text-sm">Skor</p><p className="text-2xl font-bold text-amber-400">{score}</p></div>
                                    <div className="text-center"><p className="text-slate-400 text-sm">Seviye</p><p className="text-2xl font-bold text-emerald-400">{level}</p></div>
                                </div>
                            </div>
                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart}
                                className="px-8 py-4 bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl font-bold text-lg"
                                style={{ boxShadow: '0 8px 32px rgba(139, 92, 246, 0.4)' }}>
                                <div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Dene</span></div>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* VICTORY */}
                    {phase === 'victory' && (
                        <motion.div key="victory" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
                            <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-3xl flex items-center justify-center"
                                style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }}
                                animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}>
                                <Trophy size={48} className="text-white" />
                            </motion.div>
                            <h2 className="text-3xl font-bold text-amber-400 mb-4">🎉 Şampiyon!</h2>
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10">
                                <p className="text-4xl font-bold text-amber-400">{score}</p>
                                <p className="text-slate-400">Toplam Puan</p>
                            </div>
                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart}
                                className="px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-2xl font-bold text-lg"
                                style={{ boxShadow: '0 8px 32px rgba(245, 158, 11, 0.4)' }}>
                                <div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Oyna</span></div>
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Feedback Overlay */}


                <GameFeedbackBanner feedback={feedbackState} />
            </div>
        </div>
    );
};

export default MindMatchGame;
