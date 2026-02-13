import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer, Target, XCircle, ChevronLeft, Zap, Heart, Type
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';
import { useExam } from '../../contexts/ExamContext';

// ─── Constants ──────────────────────────────────────
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;


// ─── Word Pool ──────────────────────────────────────
interface WordItem { text: string; emoji: string; }

const ITEM_POOL: WordItem[] = [
    // Eşyalar & Okul
    { text: "Kitap", emoji: "📕" }, { text: "Masa", emoji: "🪑" }, { text: "Kalem", emoji: "✏️" },
    { text: "Silgi", emoji: "🧼" }, { text: "Defter", emoji: "📓" }, { text: "Çanta", emoji: "🎒" },
    { text: "Makas", emoji: "✂️" }, { text: "Cetvel", emoji: "📏" }, { text: "Ataş", emoji: "📎" },
    { text: "Harita", emoji: "🗺️" }, { text: "Büyüteç", emoji: "🔎" }, { text: "Saat", emoji: "⏰" },
    // Meyve & Sebze
    { text: "Elma", emoji: "🍎" }, { text: "Armut", emoji: "🍐" }, { text: "Muz", emoji: "🍌" },
    { text: "Çilek", emoji: "🍓" }, { text: "Limon", emoji: "🍋" }, { text: "Karpuz", emoji: "🍉" },
    { text: "Üzüm", emoji: "🍇" }, { text: "Kiraz", emoji: "🍒" }, { text: "Ananas", emoji: "🍍" },
    { text: "Havuç", emoji: "🥕" }, { text: "Mısır", emoji: "🌽" }, { text: "Patlıcan", emoji: "🍆" },
    // Hayvanlar
    { text: "Kedi", emoji: "🐱" }, { text: "Köpek", emoji: "🐶" }, { text: "Balık", emoji: "🐟" },
    { text: "Kuş", emoji: "🐦" }, { text: "Fil", emoji: "🐘" }, { text: "Aslan", emoji: "🦁" },
    { text: "Kaplan", emoji: "🐅" }, { text: "Maymun", emoji: "🐒" }, { text: "At", emoji: "🐎" },
    { text: "İnek", emoji: "🐄" }, { text: "Koyun", emoji: "🐑" }, { text: "Tavuk", emoji: "🐔" },
    { text: "Arı", emoji: "🐝" }, { text: "Kelebek", emoji: "🦋" }, { text: "Uğur Böceği", emoji: "🐞" },
    // Taşıtlar
    { text: "Araba", emoji: "🚗" }, { text: "Uçak", emoji: "✈️" }, { text: "Gemi", emoji: "🚢" },
    { text: "Tren", emoji: "🚂" }, { text: "Otobüs", emoji: "🚌" }, { text: "Bisiklet", emoji: "🚲" },
    { text: "Motosiklet", emoji: "🏍️" }, { text: "Roket", emoji: "🚀" }, { text: "Helikopter", emoji: "🚁" },
    // Doğa & Hava Durumu
    { text: "Güneş", emoji: "☀️" }, { text: "Ay", emoji: "🌙" }, { text: "Yıldız", emoji: "⭐" },
    { text: "Bulut", emoji: "☁️" }, { text: "Yağmur", emoji: "🌧️" }, { text: "Kar", emoji: "❄️" },
    { text: "Ağaç", emoji: "🌳" }, { text: "Çiçek", emoji: "🌸" }, { text: "Gül", emoji: "🌹" },
    { text: "Ateş", emoji: "🔥" }, { text: "Su", emoji: "💧" }, { text: "Gökkuşağı", emoji: "🌈" },
    // Ev & Yaşam
    { text: "Yatak", emoji: "🛏️" }, { text: "Koltuk", emoji: "🛋️" }, { text: "Lamba", emoji: "💡" },
    { text: "Kapı", emoji: "🚪" }, { text: "Anahtar", emoji: "🔑" }, { text: "Hediye", emoji: "🎁" },
    { text: "Balon", emoji: "🎈" }, { text: "Top", emoji: "⚽" }, { text: "Kupa", emoji: "🏆" },
    { text: "Telefon", emoji: "📱" }, { text: "Bilgisayar", emoji: "💻" }, { text: "Kamera", emoji: "📷" },
    { text: "Şemsiye", emoji: "☂️" }, { text: "Gözlük", emoji: "👓" }, { text: "Şapka", emoji: "🧢" },
];

const ALPHABET = "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ";

// ─── Helpers ────────────────────────────────────────
const shuffle = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

const calculateAnswer = (words: string[]): string =>
    words.map(w => w.trim().slice(-1).toLocaleUpperCase('tr-TR')).join('');

const generateDistractors = (correctAnswer: string): string[] => {
    const distractors = new Set<string>();
    distractors.add(correctAnswer);
    while (distractors.size < 4) {
        let fake = "";
        if (Math.random() > 0.4) {
            const idx = Math.floor(Math.random() * correctAnswer.length);
            let ch = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
            while (ch === correctAnswer[idx]) ch = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
            fake = correctAnswer.substring(0, idx) + ch + correctAnswer.substring(idx + 1);
        } else {
            for (let i = 0; i < correctAnswer.length; i++) fake += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
        }
        if (fake !== correctAnswer) distractors.add(fake);
    }
    return shuffle(Array.from(distractors));
};

const getWordCount = (level: number): number => {
    if (level <= 5) return 3;
    if (level <= 12) return 4;
    return 5;
};

// ─── Puzzle Generator ───────────────────────────────
interface Puzzle {
    items: WordItem[];
    correctAnswer: string;
    options: string[];
}

const generatePuzzle = (level: number): Puzzle => {
    const count = getWordCount(level);
    const items = shuffle(ITEM_POOL).slice(0, count);
    const answer = calculateAnswer(items.map(i => i.text));
    return { items, correctAnswer: answer, options: generateDistractors(answer) };
};

// ─── Types ──────────────────────────────────────────
type Phase = 'welcome' | 'playing' | 'feedback' | 'game_over' | 'victory';

interface LastLetterGameProps {
    examMode?: boolean;
    examLevel?: number;
    examTimeLimit?: number;
}

// ─── Component ──────────────────────────────────────
const LastLetterGame: React.FC<LastLetterGameProps> = ({ examMode = false }) => {
    const { saveGamePlay } = useGamePersistence();
    const hasSavedRef = useRef(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { submitResult } = useExam();
    const { feedbackState, showFeedback } = useGameFeedback();

    // Core State
    const [phase, setPhase] = useState<Phase>('welcome');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [level, setLevel] = useState(1);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
    const [revealWords, setRevealWords] = useState(false);

    // Refs
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);

    // Timer
    useEffect(() => {
        if (phase === 'playing' && timeLeft > 0) {
            timerRef.current = setTimeout(() => setTimeLeft(p => p - 1), 1000);
        } else if (timeLeft === 0 && phase === 'playing') {
            handleGameOver();
        }
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [phase, timeLeft]);

    // Generate puzzle on level change
    useEffect(() => {
        if (phase === 'playing') {
            setPuzzle(generatePuzzle(level));
            setRevealWords(false);
        }
    }, [phase, level]);

    // Start
    const handleStart = useCallback(() => {
        window.scrollTo(0, 0);
        setPhase('playing');
        setScore(0);
        setLives(INITIAL_LIVES);
        setLevel(1);
        setTimeLeft(TIME_LIMIT);
        startTimeRef.current = Date.now();
        hasSavedRef.current = false;
    }, []);

    // Auto-start
    useEffect(() => {
        if ((location.state?.autoStart || examMode) && phase === 'welcome') handleStart();
    }, [location.state, examMode, phase, handleStart]);

    // Game Over
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
            game_id: 'son-harf-ustasi',
            score_achieved: score,
            duration_seconds: duration,
            metadata: { levels_completed: level, final_lives: lives },
        });
    }, [saveGamePlay, score, level, lives, examMode, submitResult, navigate]);

    // Victory
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
            game_id: 'son-harf-ustasi',
            score_achieved: score,
            duration_seconds: duration,
            metadata: { levels_completed: MAX_LEVEL, victory: true },
        });
    }, [saveGamePlay, score, examMode, submitResult, navigate]);

    // Option select
    const handleOptionClick = useCallback((option: string) => {
        if (!puzzle || phase !== 'playing') return;
        const correct = option === puzzle.correctAnswer;
        setRevealWords(true);
        showFeedback(correct);

        setPhase('feedback');

        const newScore = correct ? score + 10 * level : score;
        const newLives = correct ? lives : lives - 1;
        if (correct) setScore(newScore);
        else setLives(newLives);

        setTimeout(() => {
            if (!correct && newLives <= 0) {
                handleGameOver();
                return;
            }
            if (correct && level >= MAX_LEVEL) {
                handleVictory();
                return;
            }
            if (correct) setLevel(l => l + 1);
            setPhase('playing');
        }, 2000);
    }, [puzzle, phase, score, lives, level, handleGameOver, handleVictory]);

    // Format time
    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-950 to-slate-900 text-white">
            {/* Decorative BG */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <div className="relative z-10 p-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Link to="/atolyeler/bireysel-degerlendirme" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                        <ChevronLeft size={20} /><span>Geri</span>
                    </Link>
                    {phase === 'playing' && (
                        <div className="flex items-center gap-3 sm:gap-6 flex-wrap justify-end">
                            <div className="flex items-center gap-2 bg-amber-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-amber-500/30">
                                <Star className="text-amber-400" size={18} />
                                <span className="font-bold text-amber-400 text-sm">{score}</span>
                            </div>
                            <div className="flex items-center gap-1 bg-red-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-red-500/30">
                                {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
                                    <Heart key={i} size={14} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-400/30'} />
                                ))}
                            </div>
                            <div className="flex items-center gap-2 bg-blue-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-blue-500/30">
                                <Timer className="text-blue-400" size={18} />
                                <span className={`font-bold text-sm ${timeLeft <= 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'}`}>
                                    {formatTime(timeLeft)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 bg-emerald-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-emerald-500/30">
                                <Zap className="text-emerald-400" size={18} />
                                <span className="font-bold text-emerald-400 text-sm">Seviye {level}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4">
                <AnimatePresence mode="wait">
                    {/* ── Welcome ── */}
                    {phase === 'welcome' && (
                        <motion.div key="welcome" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
                            {/* TUZÖ Badge */}
                            <div className="mb-6 inline-flex items-center gap-1.5 px-3 py-1 bg-violet-500/20 border border-violet-500/30 rounded-full">
                                <span className="text-[9px] font-black text-violet-300 uppercase tracking-wider">TUZÖ</span>
                                <span className="text-[9px] font-bold text-violet-400">5.1.3 Sözel Analiz</span>
                            </div>

                            <motion.div
                                className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-fuchsia-400 to-violet-600 rounded-[40%] flex items-center justify-center"
                                style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }}
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Type size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-fuchsia-400 to-violet-400 bg-clip-text text-transparent">
                                Son Harf Ustası
                            </h1>
                            <p className="text-slate-400 mb-6">
                                Kelimelerin <span className="font-bold text-white">son harflerini</span> birleştirerek gizli şifreyi bul!
                            </p>

                            {/* Example */}
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 mb-6 border border-white/10">
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-3">Örnek</p>
                                <div className="flex justify-center items-center gap-4 mb-3">
                                    {[{ e: "📕", t: "Kitap" }, { e: "🪑", t: "Masa" }, { e: "⛓️", t: "Demir" }].map((w, i) => (
                                        <div key={i} className="flex flex-col items-center">
                                            <span className="text-3xl mb-1">{w.e}</span>
                                            <span className="text-xs text-slate-300 font-mono">
                                                {w.t.slice(0, -1)}<span className="text-fuchsia-400 font-black">{w.t.slice(-1)}</span>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-sm text-slate-400">
                                    Cevap: <span className="font-bold text-fuchsia-400 tracking-widest">PAR</span>
                                </p>
                            </div>

                            <div className="flex flex-wrap justify-center gap-4 mb-8">
                                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2">
                                    <Heart className="text-red-400" size={16} /><span className="text-sm text-slate-300">{INITIAL_LIVES} Can</span>
                                </div>
                                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2">
                                    <Timer className="text-blue-400" size={16} /><span className="text-sm text-slate-300">{TIME_LIMIT / 60} Dakika</span>
                                </div>
                                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2">
                                    <Target className="text-emerald-400" size={16} /><span className="text-sm text-slate-300">{MAX_LEVEL} Seviye</span>
                                </div>
                            </div>

                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart}
                                className="px-10 py-5 bg-gradient-to-r from-fuchsia-500 to-violet-600 rounded-2xl font-bold text-xl"
                                style={{ boxShadow: '0 8px 32px rgba(168, 85, 247, 0.4)' }}
                            >
                                <div className="flex items-center gap-3">
                                    <Play size={28} className="fill-white" /><span>Başla</span>
                                </div>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* ── Playing ── */}
                    {(phase === 'playing' || phase === 'feedback') && puzzle && (
                        <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-4xl">
                            {/* Instruction */}
                            <div className="text-center mb-6">
                                <p className="text-slate-400 text-sm">Kelimelerin <span className="text-white font-bold">son harflerini</span> birleştirerek şifreyi bul</p>
                            </div>

                            {/* Word Cards */}
                            <div className={`grid gap-4 mb-8 ${puzzle.items.length <= 3 ? 'grid-cols-3' : puzzle.items.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3 sm:grid-cols-5'}`}>
                                {puzzle.items.map((item, idx) => (
                                    <motion.div
                                        key={`${level}-${idx}`}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="flex flex-col items-center p-5 rounded-3xl border border-white/10"
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
                                            boxShadow: 'inset 0 -3px 6px rgba(0,0,0,0.2), inset 0 3px 6px rgba(255,255,255,0.1)',
                                        }}
                                    >
                                        <span className="text-5xl sm:text-6xl filter drop-shadow-md mb-2">{item.emoji}</span>
                                        {/* Reveal word text after answer */}
                                        <div className={`transition-all duration-500 overflow-hidden ${revealWords ? 'max-h-20 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                                            <p className="text-lg font-bold font-mono text-center">
                                                {item.text.split('').map((ch, ci) => (
                                                    <span key={ci} className={ci === item.text.length - 1 ? 'text-fuchsia-400 font-black text-xl' : 'text-slate-300'}>
                                                        {ch}
                                                    </span>
                                                ))}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Options */}
                            <div className="max-w-2xl mx-auto">
                                <p className="text-center text-xs text-slate-500 uppercase tracking-widest mb-4 font-bold">Gizli Şifreyi Bul</p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {puzzle.options.map((option, idx) => (
                                        <motion.button
                                            key={idx}
                                            whileHover={phase === 'playing' ? { scale: 1.05, y: -2 } : {}}
                                            whileTap={phase === 'playing' ? { scale: 0.95 } : {}}
                                            disabled={phase !== 'playing'}
                                            onClick={() => handleOptionClick(option)}
                                            className="min-h-[80px] rounded-2xl border-2 text-xl sm:text-2xl font-bold tracking-widest transition-all flex items-center justify-center bg-white/5 border-white/10 hover:bg-white/10 hover:border-fuchsia-500/50 disabled:cursor-default"
                                            style={{
                                                boxShadow: 'inset 0 -3px 6px rgba(0,0,0,0.2), inset 0 3px 6px rgba(255,255,255,0.05)',
                                            }}
                                        >
                                            {option}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ── Game Over ── */}
                    {phase === 'game_over' && (
                        <motion.div key="game_over" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
                            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-red-500 to-rose-600 rounded-[40%] flex items-center justify-center"
                                style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }}>
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
                                className="px-10 py-5 bg-gradient-to-r from-fuchsia-500 to-violet-600 rounded-2xl font-bold text-xl"
                                style={{ boxShadow: '0 8px 32px rgba(168, 85, 247, 0.4)' }}>
                                <div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Dene</span></div>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* ── Victory ── */}
                    {phase === 'victory' && (
                        <motion.div key="victory" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
                            <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-[40%] flex items-center justify-center"
                                style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }}
                                animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                                <Trophy size={48} className="text-white" />
                            </motion.div>
                            <h2 className="text-3xl font-bold text-amber-400 mb-4">🎉 Şampiyon!</h2>
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10">
                                <p className="text-4xl font-bold text-amber-400">{score}</p>
                                <p className="text-slate-400">Toplam Puan</p>
                            </div>
                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart}
                                className="px-10 py-5 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-2xl font-bold text-xl"
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

export default LastLetterGame;

