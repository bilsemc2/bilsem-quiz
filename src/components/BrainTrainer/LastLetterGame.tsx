import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer as TimerIcon, ChevronLeft, Zap, Heart, Type, Eye, Sparkles
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';
import { useExam } from '../../contexts/ExamContext';
import { useSound } from '../../hooks/useSound';

// ─── Constants ──────────────────────────────────────
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;

const ITEM_POOL = [
    { text: "Kitap", emoji: "📕" }, { text: "Masa", emoji: "🪑" }, { text: "Kalem", emoji: "✏️" },
    { text: "Silgi", emoji: "🧼" }, { text: "Defter", emoji: "📓" }, { text: "Çanta", emoji: "🎒" },
    { text: "Makas", emoji: "✂️" }, { text: "Cetvel", emoji: "📏" }, { text: "Ataş", emoji: "📎" },
    { text: "Harita", emoji: "🗺️" }, { text: "Büyüteç", emoji: "🔎" }, { text: "Saat", emoji: "⏰" },
    { text: "Elma", emoji: "🍎" }, { text: "Armut", emoji: "🍐" }, { text: "Muz", emoji: "🍌" },
    { text: "Çilek", emoji: "🍓" }, { text: "Limon", emoji: "🍋" }, { text: "Karpuz", emoji: "🍉" },
    { text: "Üzüm", emoji: "🍇" }, { text: "Kiraz", emoji: "🍒" }, { text: "Ananas", emoji: "🍍" },
    { text: "Havuç", emoji: "🥕" }, { text: "Mısır", emoji: "🌽" }, { text: "Patlıcan", emoji: "🍆" },
    { text: "Kedi", emoji: "🐱" }, { text: "Köpek", emoji: "🐶" }, { text: "Balık", emoji: "🐟" },
    { text: "Kuş", emoji: "🐦" }, { text: "Fil", emoji: "🐘" }, { text: "Aslan", emoji: "🦁" },
    { text: "Kaplan", emoji: "🐅" }, { text: "Maymun", emoji: "🐒" }, { text: "At", emoji: "🐎" },
    { text: "İnek", emoji: "🐄" }, { text: "Koyun", emoji: "🐑" }, { text: "Tavuk", emoji: "🐔" },
    { text: "Arı", emoji: "🐝" }, { text: "Kelebek", emoji: "🦋" }, { text: "Uğur Böceği", emoji: "🐞" },
    { text: "Araba", emoji: "🚗" }, { text: "Uçak", emoji: "✈️" }, { text: "Gemi", emoji: "🚢" },
    { text: "Tren", emoji: "🚂" }, { text: "Otobüs", emoji: "🚌" }, { text: "Bisiklet", emoji: "🚲" },
    { text: "Motosiklet", emoji: "🏍️" }, { text: "Roket", emoji: "🚀" }, { text: "Helikopter", emoji: "🚁" },
    { text: "Güneş", emoji: "☀️" }, { text: "Ay", emoji: "🌙" }, { text: "Yıldız", emoji: "⭐" },
    { text: "Bulut", emoji: "☁️" }, { text: "Yağmur", emoji: "🌧️" }, { text: "Kar", emoji: "❄️" },
    { text: "Ağaç", emoji: "🌳" }, { text: "Çiçek", emoji: "🌸" }, { text: "Gül", emoji: "🌹" },
    { text: "Ateş", emoji: "🔥" }, { text: "Su", emoji: "💧" }, { text: "Gökkuşağı", emoji: "🌈" },
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

const calcAnswer = (words: string[]): string => words.map(w => w.trim().slice(-1).toLocaleUpperCase('tr-TR')).join('');

const generateDistractors = (cor: string): string[] => {
    const list = new Set<string>(); list.add(cor);
    while (list.size < 4) {
        let fake = "";
        if (Math.random() > 0.4) {
            const idx = Math.floor(Math.random() * cor.length);
            let ch = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
            while (ch === cor[idx]) ch = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
            fake = cor.substring(0, idx) + ch + cor.substring(idx + 1);
        } else {
            for (let i = 0; i < cor.length; i++) fake += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
        }
        if (fake !== cor) list.add(fake);
    }
    return shuffle(Array.from(list));
};

interface Puzzle { items: { text: string; emoji: string }[]; correctAnswer: string; options: string[]; }

const generatePuzzle = (lvl: number): Puzzle => {
    const count = lvl <= 5 ? 3 : lvl <= 12 ? 4 : 5;
    const items = shuffle(ITEM_POOL).slice(0, count);
    const ans = calcAnswer(items.map(i => i.text));
    return { items, correctAnswer: ans, options: generateDistractors(ans) };
};

type Phase = 'welcome' | 'playing' | 'feedback' | 'game_over' | 'victory';

const LastLetterGame: React.FC = () => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const { feedbackState, showFeedback, dismissFeedback } = useGameFeedback({ duration: 1500 });
    const { submitResult } = useExam();
    const location = useLocation();
    const navigate = useNavigate();

    const [phase, setPhase] = useState<Phase>('welcome');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [level, setLevel] = useState(1);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
    const [revealWords, setRevealWords] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef(0);
    const hasSavedRef = useRef(false);

    const examMode = location.state?.examMode || false;
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

    const startPuzzle = useCallback(() => {
        setPuzzle(generatePuzzle(level));
        setRevealWords(false);
        setPhase('playing');
        playSound('detective_mystery');
    }, [level, playSound]);

    const handleStart = useCallback(() => {
        window.scrollTo(0, 0);
        setScore(0); setLives(INITIAL_LIVES); setLevel(1);
        setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
        startTimeRef.current = Date.now(); hasSavedRef.current = false;
        startPuzzle();
    }, [startPuzzle, examMode, examTimeLimit]);

    useEffect(() => {
        if ((location.state?.autoStart || examMode) && phase === 'welcome') handleStart();
    }, [location.state, phase, handleStart, examMode]);

    useEffect(() => {
        if (phase === 'playing' && timeLeft > 0) {
            timerRef.current = setInterval(() => setTimeLeft(p => {
                if (p <= 1) { clearInterval(timerRef.current!); setPhase('game_over'); return 0; }
                return p - 1;
            }), 1000);
            return () => clearInterval(timerRef.current!);
        }
    }, [phase, timeLeft]);

    const handleFinish = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const victory = phase === 'victory';

        if (examMode) {
            await submitResult(victory || level >= 5, score, MAX_LEVEL * 100, duration);
            navigate("/atolyeler/sinav-simulasyonu/devam");
            return;
        }

        await saveGamePlay({
            game_id: 'son-harf-ustasi', score_achieved: score, duration_seconds: duration,
            metadata: { level_reached: level, victory }
        });
    }, [phase, score, level, saveGamePlay, examMode, submitResult, navigate]);

    useEffect(() => {
        if (phase === 'game_over' || phase === 'victory') handleFinish();
    }, [phase, handleFinish]);

    const handleGuess = (opt: string) => {
        if (!puzzle || phase !== 'playing') return;
        const ok = opt === puzzle.correctAnswer;
        setRevealWords(true);
        showFeedback(ok);
        playSound(ok ? 'correct' : 'incorrect');
        setPhase('feedback');

        if (ok) { setScore(p => p + 10 * level); }
        else { setLives(l => l - 1); }

        setTimeout(() => {
            dismissFeedback();
            if (!ok && lives <= 1) { setPhase('game_over'); return; }
            if (ok && level >= MAX_LEVEL) { setPhase('victory'); return; }
            if (ok) setLevel(l => l + 1);
            startPuzzle();
        }, 1500);
    };

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    if (phase === 'welcome') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-950 to-slate-900 flex items-center justify-center p-6 text-white relative overflow-hidden">
                <div className="fixed inset-0 pointer-events-none"><div className="absolute top-1/4 left-1/4 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl animate-pulse" /><div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" /></div>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl relative z-10">
                    <motion.div className="w-28 h-28 rounded-[40%] flex items-center justify-center mx-auto mb-6" style={{ background: 'linear-gradient(135deg, #A855F7 0%, #9333EA 100%)', boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }} animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}><Type size={52} className="text-white drop-shadow-lg" /></motion.div>
                    <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-fuchsia-400 to-violet-400 bg-clip-text text-transparent">Son Harf Ustası</h1>
                    <p className="text-slate-400 mb-8 text-lg">Kelimelerin son harflerini birleştirerek gizli şifreyi bul! Sözel analiz ve hafıza gücünü test et.</p>
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                        <h3 className="text-lg font-bold text-fuchsia-300 mb-3 flex items-center gap-2"><Eye size={20} /> Nasıl Oynanır?</h3>
                        <ul className="space-y-2 text-slate-300 text-sm">
                            <li className="flex items-center gap-2"><Sparkles size={14} className="text-fuchsia-400" /><span>Ekranda görünen eşyaların adlarını zihninden geçir</span></li>
                            <li className="flex items-center gap-2"><Sparkles size={14} className="text-fuchsia-400" /><span>Her kelimenin <strong>son harfini</strong> bir kenara not et</span></li>
                            <li className="flex items-center gap-2"><Sparkles size={14} className="text-fuchsia-400" /><span>Birleşen harflerle oluşan gizli kelimeyi seç!</span></li>
                        </ul>
                    </div>
                    <div className="bg-violet-500/10 text-violet-300 text-[10px] px-4 py-2 rounded-full mb-6 inline-block border border-violet-500/30 font-bold uppercase tracking-widest">TUZÖ 5.1.3 Sözel Analiz</div>
                    <motion.button whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-fuchsia-500 to-violet-600 rounded-2xl font-bold text-xl shadow-2xl"><div className="flex items-center gap-3"><Play size={28} className="fill-white" /><span>Başla</span></div></motion.button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-950 to-slate-900 text-white relative overflow-hidden">
            <div className="relative z-10 p-4 pt-20">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link to={backLink} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"><ChevronLeft size={20} /><span>{backLabel}</span></Link>
                    {(phase !== 'game_over' && phase !== 'victory') && (
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)', border: '1px solid rgba(251, 191, 36, 0.3)' }}><Star className="text-amber-400 fill-amber-400" size={18} /><span className="font-bold text-amber-400">{score}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>{Array.from({ length: INITIAL_LIVES }).map((_, i) => (<Heart key={i} size={18} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-900'} />))}</div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.1) 100%)', border: '1px solid rgba(59, 130, 246, 0.3)' }}><TimerIcon className={timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'} size={18} /><span className={`font-bold ${timeLeft < 30 ? 'text-red-400' : 'text-blue-400'}`}>{formatTime(timeLeft)}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(147, 51, 234, 0.1) 100%)', border: '1px solid rgba(168, 85, 247, 0.3)' }}><Zap className="text-fuchsia-400" size={18} /><span className="font-bold text-fuchsia-400">Seviye {level}</span></div>
                        </div>
                    )}
                </div>
            </div>
            <div className="relative z-10 flex flex-col items-center justify-center p-4 min-h-[calc(100vh-120px)]">
                <AnimatePresence mode="wait">
                    {(phase === 'playing' || phase === 'feedback') && puzzle && (
                        <motion.div key="game" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="w-full max-w-4xl text-center">
                            <p className="text-slate-400 font-bold mb-8 text-lg tracking-wide uppercase">SON HARFLERİ BİRLEŞTİR</p>
                            <div className={`grid gap-6 mb-12 ${puzzle.items.length <= 3 ? 'grid-cols-3' : puzzle.items.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3 sm:grid-cols-5'}`}>
                                {puzzle.items.map((item, idx) => (
                                    <motion.div key={idx} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: idx * 0.1 }} className="p-6 bg-white/5 backdrop-blur-3xl rounded-[32px] border border-white/10 shadow-2xl flex flex-col items-center gap-3">
                                        <span className="text-6xl filter drop-shadow-xl">{item.emoji}</span>
                                        <div className={`transition-all duration-500 overflow-hidden ${revealWords ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
                                            <p className="text-lg font-black tracking-widest">{item.text.toLocaleUpperCase('tr-TR').split('').map((char, ci) => (<span key={ci} className={ci === item.text.length - 1 ? 'text-fuchsia-400 text-2xl underline' : 'opacity-40'}>{char}</span>))}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                            <div className="max-w-xl mx-auto grid grid-cols-2 gap-4">
                                {puzzle.options.map((opt, i) => {
                                    const isCor = opt === puzzle.correctAnswer; const showR = feedbackState !== null;
                                    return (
                                        <motion.button key={i} whileHover={!showR ? { scale: 1.05, y: -2 } : {}} whileTap={!showR ? { scale: 0.95 } : {}} onClick={() => handleGuess(opt)} disabled={showR} className={`py-6 rounded-3xl font-black text-2xl tracking-[0.2em] shadow-xl transition-all duration-300 ${showR ? (isCor ? 'bg-emerald-500 border-2 border-white' : 'bg-slate-800 opacity-20') : 'bg-slate-800/80 border border-white/10 hover:border-fuchsia-500/50 hover:text-fuchsia-400'}`}>{opt}</motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                    {(phase === 'game_over' || phase === 'victory') && (
                        <motion.div key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-xl">
                            <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-fuchsia-500 to-purple-700 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><Trophy size={48} className="text-white" /></motion.div>
                            <h2 className="text-3xl font-bold text-amber-400 mb-2">{phase === 'victory' ? '🎖️ Kelime Ustası!' : 'Tebrikler!'}</h2>
                            <p className="text-slate-400 mb-6">{phase === 'victory' ? 'Kelimelerin ruhunu ve harflerin gücünü gerçekten biliyorsun!' : 'Daha fazla analizle kelime becerini geliştirebilirsin.'}</p>
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10"><div className="grid grid-cols-2 gap-4"><div className="text-center"><p className="text-slate-400 text-sm">Skor</p><p className="text-2xl font-bold text-amber-400">{score}</p></div><div className="text-center"><p className="text-slate-400 text-sm">Seviye</p><p className="text-2xl font-bold text-fuchsia-400">{level}/{MAX_LEVEL}</p></div></div></div>
                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-fuchsia-500 to-violet-600 rounded-2xl font-bold text-xl mb-4 shadow-2xl"><div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Oyna</span></div></motion.button>
                            <Link to={backLink} className="block text-slate-500 hover:text-white transition-colors">Geri Dön</Link>
                        </motion.div>
                    )}
                </AnimatePresence>
                <GameFeedbackBanner feedback={feedbackState} />
            </div>
        </div>
    );
};

export default LastLetterGame;
