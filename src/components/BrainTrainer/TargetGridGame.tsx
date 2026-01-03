import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, RefreshCw, Trophy, Rocket, Timer,
    Activity, Plus,
    AlertCircle, CheckCircle2, LayoutGrid, EyeOff, Search
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useSound } from '../../hooks/useSound';

// --- Types ---
interface Card {
    id: string;
    value: number;
    isRevealed: boolean;
    isSolved: boolean;
}

type GameStatus = 'waiting' | 'preview' | 'playing' | 'solved' | 'gameover';

const TargetGridGame: React.FC = () => {
    const { playSound } = useSound();
    const location = useLocation();
    const [status, setStatus] = useState<GameStatus>('waiting');
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [cards, setCards] = useState<Card[]>([]);
    const [targetSum, setTargetSum] = useState(0);
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
    const [currentSum, setCurrentSum] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);
    const [previewTimer, setPreviewTimer] = useState(3);
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

    // --- Grid Generation Logic ---
    const generateGrid = useCallback((lvl: number) => {
        const gridSize = 16; // 4x4
        const newCards: Card[] = [];

        // Generate random values between 1-9
        for (let i = 0; i < gridSize; i++) {
            newCards.push({
                id: Math.random().toString(36).substr(2, 9),
                value: Math.floor(Math.random() * 9) + 1,
                isRevealed: true,
                isSolved: false
            });
        }

        // Determine target sum (pick 2-3 unique random cards to guarantee a solution)
        const numToCombine = Math.random() > 0.7 && lvl > 3 ? 3 : 2;
        const targetIndices: number[] = [];
        while (targetIndices.length < numToCombine) {
            const idx = Math.floor(Math.random() * gridSize);
            if (!targetIndices.includes(idx)) targetIndices.push(idx);
        }

        const sum = targetIndices.reduce((acc, idx) => acc + newCards[idx].value, 0);

        setCards(newCards);
        setTargetSum(sum);
        setSelectedIndices([]);
        setCurrentSum(0);
        setPreviewTimer(Math.max(2, 4 - Math.floor(lvl / 5)));
        setFeedback(null);
    }, []);

    const startLevel = useCallback((lvl: number) => {
        generateGrid(lvl);
        setStatus('preview');
        playSound('signal_appear');
    }, [generateGrid, playSound]);

    const startApp = useCallback(() => {
        setLevel(1);
        setScore(0);
        setTimeLeft(60);
        startLevel(1);
    }, [startLevel]);

    // Handle Auto Start from HUB
    useEffect(() => {
        if (location.state?.autoStart && status === 'waiting') {
            startApp();
        }
    }, [location.state, status, startApp]);

    // --- Timers ---
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (status === 'preview' && previewTimer > 0) {
            interval = setInterval(() => setPreviewTimer(prev => prev - 1), 1000);
        } else if (status === 'preview' && previewTimer === 0) {
            setStatus('playing');
            setCards(prev => prev.map(c => ({ ...c, isRevealed: false })));
            playSound('signal_disappear');
        }
        return () => clearInterval(interval);
    }, [status, previewTimer, playSound]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (status === 'playing' && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0 && status === 'playing') {
            setStatus('gameover');
        }
        return () => clearInterval(interval);
    }, [status, timeLeft]);

    // --- Interaction ---
    const handleCardClick = (idx: number) => {
        if (status !== 'playing' || cards[idx].isRevealed || cards[idx].isSolved || feedback) return;

        const card = cards[idx];
        const newSelected = [...selectedIndices, idx];
        const newSum = currentSum + card.value;

        setSelectedIndices(newSelected);
        setCurrentSum(newSum);

        setCards(prev => prev.map((c, i) => i === idx ? { ...c, isRevealed: true } : c));
        playSound('grid_flip');

        if (newSum === targetSum) {
            setFeedback('correct');
            playSound('grid_match');
            setScore(prev => prev + (level * 200) + (timeLeft * 5));
            setTimeout(() => {
                setLevel(prev => prev + 1);
                startLevel(level + 1);
            }, 1500);
        } else if (newSum > targetSum) {
            setFeedback('wrong');
            playSound('grid_fail');
            setTimeout(() => {
                setCards(prev => prev.map(c => ({ ...c, isRevealed: false })));
                setSelectedIndices([]);
                setCurrentSum(0);
                setFeedback(null);
            }, 1000);
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-6 relative overflow-hidden font-sans" style={{ background: 'radial-gradient(circle at center, #1e1b4b 0%, #020617 100%)' }}>
            {/* Background Decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <div className="container mx-auto max-w-6xl relative z-10">
                {/* Header HUD */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 border-b border-white/5 pb-8">
                    <div className="flex items-center gap-6">
                        <Link to="/atolyeler/bireysel-degerlendirme" className="p-4 bg-white/5 rounded-3xl hover:bg-white/10 transition-all text-white border border-white/10 shadow-2xl backdrop-blur-xl">
                            <ChevronLeft />
                        </Link>
                        <div>
                            <h1 className="text-4xl font-black tracking-tight text-white flex items-center gap-4">
                                HEDEF <span className="text-indigo-400">SAYI</span>
                            </h1>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.3em] mt-1 pl-1">Spectrum Memory / Phase 6</p>
                        </div>
                    </div>

                    <div className="flex gap-6">
                        <div className="bg-white/5 border border-white/10 px-10 py-4 rounded-[2rem] text-center shadow-2xl backdrop-blur-3xl">
                            <div className="text-[10px] uppercase text-slate-500 font-black mb-1 tracking-widest">LEVEL</div>
                            <div className="text-3xl font-black text-indigo-400">{level}</div>
                        </div>
                        <div className="bg-white/5 border border-white/10 px-10 py-4 rounded-[2rem] text-center shadow-2xl backdrop-blur-3xl">
                            <div className="text-[10px] uppercase text-slate-500 font-black mb-1 tracking-widest">XP SCORE</div>
                            <div className="text-3xl font-black text-white">{score}</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center min-h-[600px]">
                    {/* Left: Info & Controls */}
                    <div className="lg:col-span-4 space-y-8">
                        {status === 'waiting' ? (
                            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="space-y-8 bg-white/5 p-10 rounded-[3rem] border border-white/10 backdrop-blur-3xl shadow-2xl">
                                <div className="w-20 h-20 bg-indigo-500 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/40">
                                    <LayoutGrid size={40} />
                                </div>
                                <div className="space-y-4">
                                    <h2 className="text-3xl font-black text-white leading-none">Bak ve Bul</h2>
                                    <p className="text-slate-400 font-medium leading-relaxed italic">
                                        Izgaradaki sayıları hafızana al. Kartlar kapandığında verdiğimiz **Hedef Sayı**'ya ulaşmak için doğru kombinasyonu bul!
                                    </p>
                                </div>
                                <button onClick={startApp} className="group w-full py-6 bg-indigo-500 text-white font-black text-xl rounded-2xl hover:bg-indigo-400 transition-all flex items-center justify-center gap-4 shadow-xl">
                                    BAŞLAT <Rocket fill="currentColor" />
                                </button>
                            </motion.div>
                        ) : (
                            <div className="space-y-6">
                                <div className="bg-indigo-500/10 border-2 border-indigo-500/30 p-10 rounded-[3rem] backdrop-blur-3xl shadow-2xl text-center relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
                                    <div className="text-[12px] uppercase text-indigo-400 font-black mb-4 tracking-[0.4em]">HEDEF SAYI</div>
                                    <motion.div
                                        key={targetSum}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="text-8xl font-black text-white tracking-tighter drop-shadow-2xl"
                                    >
                                        {targetSum}
                                    </motion.div>
                                    <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-center gap-4 text-slate-400 font-bold">
                                        <Plus size={20} className="text-indigo-400" /> TOPLAM: <span className="text-2xl text-white font-black">{currentSum}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between px-10 py-6 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-xl">
                                    <div className="flex items-center gap-4">
                                        <Timer className={`text-${timeLeft < 10 ? 'rose' : 'indigo'}-400 animate-pulse`} />
                                        <span className="text-2xl font-black text-white">{timeLeft}s</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500 font-black text-[10px] tracking-widest uppercase">
                                        <Activity size={12} /> Sync Active
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Grid */}
                    <div className="lg:col-span-8 flex justify-center">
                        {status !== 'waiting' && status !== 'gameover' ? (
                            <div className="grid grid-cols-4 gap-4 md:gap-6 p-8 bg-white/5 rounded-[4rem] border border-white/10 backdrop-blur-3xl shadow-[0_30px_100px_rgba(0,0,0,0.5)]">
                                {cards.map((card, i) => (
                                    <motion.button
                                        key={card.id}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: i * 0.05 }}
                                        onClick={() => handleCardClick(i)}
                                        className={`w-16 h-16 md:w-24 md:h-24 rounded-3xl md:rounded-[2rem] flex items-center justify-center text-3xl md:text-5xl font-black transition-all transform hover:scale-105 active:scale-95 relative overflow-hidden group
                                            ${card.isRevealed
                                                ? 'bg-white text-slate-900 shadow-[0_0_30px_rgba(255,255,255,0.3)]'
                                                : 'bg-white/10 border-2 border-white/10 text-transparent hover:border-indigo-500/50 hover:bg-white/15'
                                            }`}
                                    >
                                        {card.isRevealed ? card.value : <EyeOff className="text-white/20 group-hover:text-white/40 transition-colors" />}
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                                    </motion.button>
                                ))}
                            </div>
                        ) : status === 'gameover' ? (
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full text-center space-y-12 bg-white/5 p-20 rounded-[4rem] border border-white/10 backdrop-blur-3xl shadow-2xl">
                                <div className="relative mx-auto w-40 h-40 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-[3rem] flex items-center justify-center shadow-2xl rotate-12 border-4 border-white/20">
                                    <Trophy size={100} />
                                </div>
                                <div className="space-y-4">
                                    <h2 className="text-6xl font-black text-white italic tracking-tighter uppercase leading-none">ANALİZ BİTTİ</h2>
                                    <p className="text-3xl font-black text-indigo-400 uppercase tracking-tight">TOPLAM XP: {score}</p>
                                </div>
                                <div className="space-y-4 max-w-sm mx-auto">
                                    <button onClick={startApp} className="w-full py-6 bg-indigo-500 text-white font-black text-2xl rounded-2xl hover:bg-indigo-400 transition-all flex items-center justify-center gap-4 shadow-xl active:translate-y-1">
                                        TEKRAR DENE <RefreshCw />
                                    </button>
                                    <Link to="/atolyeler/bireysel-degerlendirme" className="text-slate-500 hover:text-white font-bold block transition-colors tracking-widest uppercase text-xs">Atölyeye Dön</Link>
                                </div>
                            </motion.div>
                        ) : null}
                    </div>
                </div>

                {/* Feedback Overlay */}
                <AnimatePresence>
                    {feedback && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.2 }}
                            className="fixed inset-0 flex items-center justify-center pointer-events-none z-[100] px-6"
                        >
                            <div className={`flex flex-col items-center gap-6 px-16 py-10 rounded-[4rem] border-4 shadow-2xl backdrop-blur-3xl ${feedback === 'correct' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-rose-500/20 border-rose-500 text-rose-400'}`}>
                                {feedback === 'correct' ? <CheckCircle2 size={80} strokeWidth={3} /> : <AlertCircle size={80} strokeWidth={3} />}
                                <span className="text-5xl font-black uppercase italic tracking-tighter">{feedback === 'correct' ? 'MÜKEMMEL TOPLAM' : 'HATALI SEÇİM'}</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Preview Overlay */}
                {status === 'preview' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed top-8 left-1/2 -translate-x-1/2 z-50">
                        <div className="bg-indigo-500 px-10 py-4 rounded-full text-white font-black tracking-[0.2em] shadow-2xl flex items-center gap-4">
                            <Search size={24} className="animate-bounce" /> Ezberle: {previewTimer}s
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default TargetGridGame;
