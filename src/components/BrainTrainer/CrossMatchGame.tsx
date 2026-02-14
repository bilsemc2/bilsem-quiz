import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, RotateCcw, Trophy, Timer as TimerIcon, Play,
    Circle, Square, Triangle, Hexagon, Star, Pentagon,
    Cross, Moon, Heart, Zap, Eye, Sparkles, Grid3X3
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSound } from '../../hooks/useSound';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useExam } from '../../contexts/ExamContext';

// ─── Constants ──────────────────────────────────────
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;

const SHAPE_ICONS = [Circle, Square, Triangle, Hexagon, Star, Pentagon, Cross, Moon, Heart];
const COLORS = [
    { name: 'Yeşil', hex: '#6BCB77' },
    { name: 'Turuncu', hex: '#FFA500' },
    { name: 'Mavi', hex: '#4ECDC4' },
    { name: 'Pembe', hex: '#FF6B6B' },
    { name: 'Mor', hex: '#9B59B6' },
];

interface Card {
    id: string;
    symbolIdx: number;
    colorIdx: number;
    isFlipped: boolean;
    isMatched: boolean;
    position: number;
}

type Phase = 'welcome' | 'preview' | 'playing' | 'game_over' | 'victory';

const CrossMatchGame: React.FC = () => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const { submitResult } = useExam();
    const { feedbackState, showFeedback, dismissFeedback } = useGameFeedback({ duration: 1000 });
    const location = useLocation();
    const navigate = useNavigate();

    const [phase, setPhase] = useState<Phase>('welcome');
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [cards, setCards] = useState<Card[]>([]);
    const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);

    const shuffleIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const gameStartTimeRef = useRef<number>(0);
    const hasSavedRef = useRef<boolean>(false);

    const examMode = location.state?.examMode || false;
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

    const generateCards = useCallback((lvl: number) => {
        const pairCount = Math.min(8, 2 + Math.floor(lvl / 2.5));
        const selectedPairs: { s: number, c: number }[] = [];

        while (selectedPairs.length < pairCount) {
            const s = Math.floor(Math.random() * SHAPE_ICONS.length);
            const c = Math.floor(Math.random() * COLORS.length);
            if (!selectedPairs.some(p => p.s === s && p.c === c)) {
                selectedPairs.push({ s, c });
            }
        }

        const newCards: Card[] = [];
        [...selectedPairs, ...selectedPairs].forEach((pair, idx) => {
            newCards.push({
                id: Math.random().toString(36).substr(2, 9),
                symbolIdx: pair.s,
                colorIdx: pair.c,
                isFlipped: true,
                isMatched: false,
                position: idx
            });
        });

        return newCards.sort(() => Math.random() - 0.5);
    }, []);

    const shufflePositions = useCallback(() => {
        if (phase !== 'playing') return;
        playSound('pop');
        setCards(prev => {
            const newPositions = [...prev.map((_, i) => i)].sort(() => Math.random() - 0.5);
            return prev.map((card, idx) => ({ ...card, position: newPositions[idx] }));
        });
    }, [phase, playSound]);

    const startLevel = useCallback((lvl: number) => {
        const newCards = generateCards(lvl);
        setCards(newCards);
        setFlippedIndices([]);
        setPhase('preview');

        setTimeout(() => {
            setCards(prev => prev.map(c => ({ ...c, isFlipped: false })));
            setPhase('playing');
        }, 3000);
    }, [generateCards]);

    const handleStart = useCallback(() => {
        window.scrollTo(0, 0);
        hasSavedRef.current = false;
        gameStartTimeRef.current = Date.now();
        setLevel(1);
        setScore(0);
        setLives(INITIAL_LIVES);
        setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
        startLevel(1);
    }, [startLevel, examMode, examTimeLimit]);

    useEffect(() => {
        if ((location.state?.autoStart || examMode) && phase === 'welcome') handleStart();
    }, [location.state, phase, handleStart, examMode]);

    useEffect(() => {
        if (phase === 'playing' && level > 3) {
            const intervalTime = Math.max(3000, 8000 - (level * 400));
            shuffleIntervalRef.current = setInterval(shufflePositions, intervalTime);
        }
        return () => { if (shuffleIntervalRef.current) clearInterval(shuffleIntervalRef.current); };
    }, [phase, level, shufflePositions]);

    useEffect(() => {
        if (phase === 'playing' && timeLeft > 0) {
            const timer = setInterval(() => setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setPhase('game_over');
                    return 0;
                }
                return prev - 1;
            }), 1000);
            return () => clearInterval(timer);
        }
    }, [phase, timeLeft]);

    const handleFinish = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        const duration = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
        const isVictory = phase === 'victory';

        if (examMode) {
            await submitResult(isVictory || level >= 5, score, MAX_LEVEL * 50, duration);
            navigate("/atolyeler/sinav-simulasyonu/devam");
            return;
        }

        await saveGamePlay({
            game_id: 'capraz-eslesme',
            score_achieved: score,
            duration_seconds: duration,
            metadata: { level_reached: level, game_name: 'Çapraz Eşleşme', victory: isVictory }
        });
    }, [phase, score, level, saveGamePlay, examMode, submitResult, navigate]);

    useEffect(() => {
        if (phase === 'game_over' || phase === 'victory') handleFinish();
    }, [phase, handleFinish]);

    const handleCardClick = (idx: number) => {
        if (phase !== 'playing' || cards[idx].isFlipped || cards[idx].isMatched || flippedIndices.length >= 2) return;

        playSound('pop');
        const newFlipped = [...flippedIndices, idx];
        setFlippedIndices(newFlipped);
        setCards(prev => prev.map((c, i) => i === idx ? { ...c, isFlipped: true } : c));

        if (newFlipped.length === 2) {
            const [firstIdx, secondIdx] = newFlipped;
            const first = cards[firstIdx];
            const second = cards[secondIdx];

            if (first.symbolIdx === second.symbolIdx && first.colorIdx === second.colorIdx) {
                setTimeout(() => {
                    playSound('correct');
                    showFeedback(true);
                    setCards(prev => prev.map((c, i) => (i === firstIdx || i === secondIdx) ? { ...c, isMatched: true } : c));
                    setFlippedIndices([]);
                    setScore(prev => prev + (level * 10));

                    setCards(currentCards => {
                        const allMatched = currentCards.every(c => (c.id === first.id || c.id === second.id) ? true : c.isMatched);
                        if (allMatched) {
                            setTimeout(() => {
                                dismissFeedback();
                                if (level >= MAX_LEVEL) {
                                    setPhase('victory');
                                } else {
                                    setLevel(prev => prev + 1);
                                    startLevel(level + 1);
                                }
                            }, 1000);
                        }
                        return currentCards;
                    });
                }, 500);
            } else {
                setTimeout(() => {
                    playSound('incorrect');
                    showFeedback(false);
                    setLives(l => {
                        const nl = l - 1;
                        if (nl <= 0) setPhase('game_over');
                        return nl;
                    });
                    setCards(prev => prev.map((c, i) => (i === firstIdx || i === secondIdx) ? { ...c, isFlipped: false } : c));
                    setFlippedIndices([]);
                    setTimeout(dismissFeedback, 1000);
                }, 1000);
            }
        }
    };

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    if (phase === 'welcome') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-950 flex items-center justify-center p-6 text-white relative overflow-hidden">
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" /><div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
                </div>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl relative z-10">
                    <motion.div className="w-28 h-28 rounded-[40%] flex items-center justify-center mx-auto mb-6 shadow-[inset_0_-8px_16px_rgba(0,0,0,0.2),inset_0_8px_16px_rgba(255,255,255,0.3),0_8px_24px_rgba(0,0,0,0.3)] shadow-[inset_0_-8px_16px_rgba(0,0,0,0.2),inset_0_8px_16px_rgba(255,255,255,0.3)]" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }} animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}><Grid3X3 size={52} className="text-white drop-shadow-lg" /></motion.div>
                    <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">Çapraz Eşleşme</h1>
                    <p className="text-slate-400 mb-8 text-lg">Hem renkleri hem şekilleri hatırla! Dikkat et, kartlar yer değiştirebilir.</p>
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                        <h3 className="text-lg font-bold text-emerald-300 mb-3 flex items-center gap-2"><Eye size={20} /> Nasıl Oynanır?</h3>
                        <ul className="space-y-2 text-slate-300 text-sm">
                            <li className="flex items-center gap-2"><Sparkles size={14} className="text-emerald-400" /><span>Kartları 3 saniye boyunca ezberle</span></li>
                            <li className="flex items-center gap-2"><Sparkles size={14} className="text-emerald-400" /><span>Aynı renk ve şekle sahip kartları eşleştir</span></li>
                            <li className="flex items-center gap-2"><Sparkles size={14} className="text-emerald-400" /><span>İleri seviyelerde kartların yer değişimini takip et!</span></li>
                        </ul>
                    </div>
                    <div className="bg-emerald-500/10 text-emerald-300 text-[10px] px-4 py-2 rounded-full mb-6 inline-block border border-emerald-500/30 font-bold uppercase tracking-widest">TUZÖ 5.4.2 Görsel Kısa Süreli Bellek</div>
                    <motion.button whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl font-bold text-xl" style={{ boxShadow: '0 8px 32px rgba(16, 185, 129, 0.4)' }}><div className="flex items-center gap-3"><Play size={28} className="fill-white" /><span>Başla</span></div></motion.button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-950 text-white relative overflow-hidden">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" /><div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
            </div>
            <div className="relative z-10 p-4 pt-20">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link to={backLink} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"><ChevronLeft size={20} /><span>{backLabel}</span></Link>
                    {(phase === 'preview' || phase === 'playing') && (
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30"><Star className="text-amber-400 fill-amber-400" size={18} /><span className="font-bold text-amber-400">{score}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30">{Array.from({ length: INITIAL_LIVES }).map((_, i) => (<Heart key={i} size={18} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-900'} />))}</div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 border border-blue-500/30"><TimerIcon className={timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'} size={18} /><span className={`font-bold ${timeLeft < 30 ? 'text-red-400' : 'text-blue-400'}`}>{formatTime(timeLeft)}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30"><Zap className="text-emerald-400" size={18} /><span className="font-bold text-emerald-400">{level}/{MAX_LEVEL}</span></div>
                        </div>
                    )}
                </div>
            </div>
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-4">
                <AnimatePresence mode="wait">
                    {(phase === 'preview' || phase === 'playing') && (
                        <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-lg">
                            <div className="text-center mb-8"><p className="text-2xl font-black text-emerald-300 tracking-wider drop-shadow-lg">{phase === 'preview' ? '👀 KARTLARI EZBERLE!' : '🃏 EŞLEŞTİR!'}</p></div>
                            <div className="grid grid-cols-4 gap-4 p-8 bg-white/5 backdrop-blur-3xl rounded-[48px] border border-white/10 shadow-3xl">
                                {cards.map((card, idx) => {
                                    const Icon = SHAPE_ICONS[card.symbolIdx];
                                    const color = COLORS[card.colorIdx];
                                    return (
                                        <motion.button key={card.id} layout initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} whileHover={!card.isFlipped && !card.isMatched && phase === 'playing' ? { scale: 0.95, y: -2 } : {}} whileTap={!card.isFlipped && !card.isMatched && phase === 'playing' ? { scale: 0.9 } : {}} onClick={() => handleCardClick(idx)} className={`aspect-square rounded-2xl relative transition-all duration-300 ${card.isMatched ? 'opacity-20 scale-90' : 'shadow-lg'}`} style={{ background: card.isFlipped || card.isMatched ? `linear-gradient(135deg, ${color.hex}50 0%, ${color.hex}20 100%)` : 'rgba(255,255,255,0.05)', boxShadow: card.isFlipped || card.isMatched ? `inset 0 -4px 8px rgba(0,0,0,0.3), 0 0 20px ${color.hex}40` : 'inset 0 4px 8px rgba(255,255,255,0.05), inset 0 -4px 8px rgba(0,0,0,0.2)', border: card.isFlipped || card.isMatched ? `2px solid ${color.hex}` : '1px solid rgba(255,255,255,0.1)' }} disabled={card.isFlipped || card.isMatched || phase !== 'playing'}>
                                            {(card.isFlipped || card.isMatched) && (<div className="flex items-center justify-center h-full"><Icon size={32} color={color.hex} strokeWidth={3} className="drop-shadow-sm" /></div>)}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                    {(phase === 'game_over' || phase === 'victory') && (
                        <motion.div key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
                            <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><Trophy size={48} className="text-white" /></motion.div>
                            <h2 className="text-3xl font-bold text-amber-400 mb-2">{phase === 'victory' ? '🎖️ Hafıza Ustası!' : 'Tebrikler!'}</h2>
                            <p className="text-slate-400 mb-6">{phase === 'victory' ? 'Kozmik bir hafızaya sahipsin, tüm eşleşmeleri buldun!' : 'Harika! Hafızanı daha da güçlendirmek için tekrar dene.'}</p>
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10"><div className="grid grid-cols-2 gap-4"><div className="text-center"><p className="text-slate-400 text-sm">Skor</p><p className="text-2xl font-bold text-amber-400">{score}</p></div><div className="text-center"><p className="text-slate-400 text-sm">Seviye</p><p className="text-2xl font-bold text-emerald-400">{level}/{MAX_LEVEL}</p></div></div></div>
                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl font-bold text-xl mb-4" style={{ boxShadow: '0 8px 32px rgba(16, 185, 129, 0.4)' }}><div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Oyna</span></div></motion.button>
                            <Link to={backLink} className="block text-slate-500 hover:text-white transition-colors">{location.state?.arcadeMode ? 'Bilsem Zeka' : 'Geri Dön'}</Link>
                        </motion.div>
                    )}
                </AnimatePresence>
                <GameFeedbackBanner feedback={feedbackState} />
            </div>
        </div>
    );
};

export default CrossMatchGame;
