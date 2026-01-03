import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, RefreshCw, Trophy, Rocket, Timer,
    Shield, Cpu, Zap, Activity, Grid, Target,
    Circle, Square, Triangle, Hexagon, Star, Pentagon,
    Cross, Moon, Heart
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useSound } from '../../hooks/useSound';

// --- Sabitler ---
const SHAPE_ICONS = [Circle, Square, Triangle, Hexagon, Star, Pentagon, Cross, Moon, Heart];
const COLORS = [
    { name: 'Emerald', value: '#10B981', bg: 'bg-emerald-500/20', border: 'border-emerald-500' },
    { name: 'Amber', value: '#F59E0B', bg: 'bg-amber-500/20', border: 'border-amber-500' },
    { name: 'Blue', value: '#3B82F6', bg: 'bg-blue-500/20', border: 'border-blue-500' },
    { name: 'Rose', value: '#F43F5E', bg: 'bg-rose-500/20', border: 'border-rose-500' },
    { name: 'Violet', value: '#8B5CF6', bg: 'bg-violet-500/20', border: 'border-violet-500' },
];

const SUCCESS_MESSAGES = ["MÜKEMMEL!", "TAM İSABET!", "VERİ EŞLEŞTİ!", "HARİKA!", "KUSURSUZ!"];

interface Card {
    id: string;
    symbolIdx: number;
    colorIdx: number;
    isFlipped: boolean;
    isMatched: boolean;
    position: number;
}

type GameStatus = 'waiting' | 'preview' | 'playing' | 'shuffling' | 'gameover';

const CrossMatchGame: React.FC = () => {
    const { playSound } = useSound();
    const location = useLocation();
    const [status, setStatus] = useState<GameStatus>('waiting');
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [cards, setCards] = useState<Card[]>([]);
    const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
    const [timeLeft, setTimeLeft] = useState(60);
    const [feedback, setFeedback] = useState<string | null>(null);
    const shuffleIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // --- Kart Üretme ---
    const generateCards = useCallback((lvl: number) => {
        const pairCount = Math.min(8, 2 + Math.floor(lvl / 2)); // 2'den başla, her 2 seviyede bir artır (max 8 çift = 16 kart)
        const selectedPairs: { s: number, c: number }[] = [];

        while (selectedPairs.length < pairCount) {
            const s = Math.floor(Math.random() * SHAPE_ICONS.length);
            const c = Math.floor(Math.random() * COLORS.length);
            // Aynı sembol+renk kombinasyonunun daha önce seçilmediğinden emin ol
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
                isFlipped: true, // Başta önizleme için açık
                isMatched: false,
                position: idx
            });
        });

        return newCards.sort(() => Math.random() - 0.5);
    }, []);

    // --- Karıştırma (Shuffle) Mantığı ---
    const shufflePositions = useCallback(() => {
        if (status !== 'playing') return;

        playSound('memory_shuffle');
        setCards(prev => {
            const newPositions = [...prev.map((_, i) => i)].sort(() => Math.random() - 0.5);
            return prev.map((card, idx) => ({
                ...card,
                position: newPositions[idx]
            }));
        });
    }, [status, playSound]);

    // --- Oyunu Başlat/Seviye Geç ---
    const startLevel = useCallback((lvl: number) => {
        const newCards = generateCards(lvl);
        setCards(newCards);
        setFlippedIndices([]);
        setFeedback(null);
        setStatus('preview');
        setTimeLeft(60);

        // 3 saniye önizleme
        setTimeout(() => {
            setCards(prev => prev.map(c => ({ ...c, isFlipped: false })));
            setStatus('playing');
        }, 3000);
    }, [generateCards]);

    const startApp = useCallback(() => {
        setLevel(1);
        setScore(0);
        startLevel(1);
    }, [startLevel]);

    // Handle Auto Start from HUB
    useEffect(() => {
        if (location.state?.autoStart && status === 'waiting') {
            startApp();
        }
    }, [location.state, status, startApp]);

    // --- Shuffle Zamanlayıcısı ---
    useEffect(() => {
        if (status === 'playing' && level > 2) {
            const intervalTime = Math.max(3000, 8000 - (level * 500)); // Seviye arttıkça sıklaşır
            shuffleIntervalRef.current = setInterval(shufflePositions, intervalTime);
        }
        return () => {
            if (shuffleIntervalRef.current) clearInterval(shuffleIntervalRef.current);
        };
    }, [status, level, shufflePositions]);

    // --- Zamanlayıcı ---
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (status === 'playing' && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0 && status === 'playing') {
            setStatus('gameover');
        }
        return () => clearInterval(interval);
    }, [status, timeLeft]);

    // --- Kart Tıklama ---
    const handleCardClick = (idx: number) => {
        if (status !== 'playing' || cards[idx].isFlipped || cards[idx].isMatched || flippedIndices.length >= 2) return;

        playSound('memory_flip');
        const newFlipped = [...flippedIndices, idx];
        setFlippedIndices(newFlipped);

        setCards(prev => prev.map((c, i) => i === idx ? { ...c, isFlipped: true } : c));

        if (newFlipped.length === 2) {
            const [firstIdx, secondIdx] = newFlipped;
            const first = cards[firstIdx];
            const second = cards[secondIdx];

            if (first.symbolIdx === second.symbolIdx && first.colorIdx === second.colorIdx) {
                // EŞLEŞME BAŞARILI
                setTimeout(() => {
                    playSound('memory_match');
                    setFeedback(SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)]);
                    setCards(prev => prev.map((c, i) =>
                        (i === firstIdx || i === secondIdx) ? { ...c, isMatched: true } : c
                    ));
                    setFlippedIndices([]);
                    setScore(prev => prev + (level * 50));
                    setFeedback(null);

                    // Bölüm bitti mi kontrol et
                    setCards(currentCards => {
                        const allMatched = currentCards.every(c =>
                            (c.id === first.id || c.id === second.id) ? true : c.isMatched
                        );
                        if (allMatched) {
                            setTimeout(() => {
                                setLevel(prev => prev + 1);
                                startLevel(level + 1);
                            }, 1000);
                        }
                        return currentCards;
                    });
                }, 500);
            } else {
                // HATALI EŞLEŞME
                setTimeout(() => {
                    playSound('memory_fail');
                    setCards(prev => prev.map((c, i) =>
                        (i === firstIdx || i === secondIdx) ? { ...c, isFlipped: false } : c
                    ));
                    setFlippedIndices([]);
                }, 1000);
            }
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-6 relative overflow-hidden font-mono" style={{ background: '#020617' }}>
            {/* Siber Arka Plan */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent" />
            </div>

            <div className="container mx-auto max-w-5xl relative z-10">
                {/* HUD */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 border-b border-emerald-500/20 pb-8">
                    <div className="flex items-center gap-5">
                        <Link to="/atolyeler/bireysel-degerlendirme" className="p-3 bg-emerald-500/5 rounded-2xl hover:bg-emerald-500/10 transition-all text-emerald-500 border border-emerald-500/20">
                            <ChevronLeft />
                        </Link>
                        <div>
                            <h1 className="text-4xl font-black tracking-tighter text-white flex items-center gap-3">
                                ÇAPRAZ <span className="text-emerald-500">EŞLEŞME</span>
                            </h1>
                            <p className="text-[10px] text-emerald-500/60 font-bold uppercase tracking-[0.4em] mt-1 pl-1">Protocol: Symbolic Memory / V.2.0</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-emerald-950/30 border border-emerald-500/20 px-8 py-3 rounded-2xl text-center shadow-2xl backdrop-blur-xl">
                            <div className="text-[10px] uppercase text-emerald-500/40 font-black mb-1">CORE LVL</div>
                            <div className="text-2xl font-black text-emerald-500">{level}</div>
                        </div>
                        <div className="bg-emerald-950/30 border border-emerald-500/20 px-8 py-3 rounded-2xl text-center shadow-2xl backdrop-blur-xl">
                            <div className="text-[10px] uppercase text-emerald-500/40 font-black mb-1">XP EARNED</div>
                            <div className="text-2xl font-black text-white">{score}</div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center min-h-[500px]">
                    {status === 'waiting' && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-10 bg-slate-900/40 p-16 rounded-[4rem] border border-emerald-500/10 backdrop-blur-3xl">
                            <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
                                <Grid size={100} className="text-emerald-500/20 absolute animate-pulse" />
                                <Cpu size={80} className="text-emerald-500" />
                                <Shield className="absolute bottom-0 right-0 text-amber-500 flex" size={32} />
                            </div>
                            <div className="max-w-md mx-auto space-y-6">
                                <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Sistem Girişi</h2>
                                <p className="text-emerald-500/60 font-medium leading-relaxed italic">
                                    Sadece şekli değil, rengi de hatırla. Kartlar yer değiştirebilir, veri akışını takip etmeyi unutma dedektif.
                                </p>
                                <div className="grid grid-cols-3 gap-4 py-6 text-emerald-500/40 text-[10px] font-black uppercase tracking-widest">
                                    <div className="flex flex-col items-center gap-2"><Target size={20} /> ANALİZ</div>
                                    <div className="flex flex-col items-center gap-2"><Zap size={20} /> REFLEKS</div>
                                    <div className="flex flex-col items-center gap-2"><Activity size={20} /> ODAK</div>
                                </div>
                            </div>
                            <button onClick={startApp} className="group relative px-12 py-5 bg-emerald-500 text-slate-950 font-black text-xl rounded-3xl hover:bg-emerald-400 transition-all transform hover:scale-105 active:scale-95 shadow-[0_10px_30px_rgba(16,185,129,0.3)] flex items-center gap-4 mx-auto uppercase">
                                PROTOKOLÜ BAŞLAT <Rocket fill="currentColor" />
                            </button>
                        </motion.div>
                    )}

                    {(status === 'preview' || status === 'playing' || status === 'shuffling') && (
                        <div className="w-full space-y-12">
                            <div className="flex items-center justify-center gap-12">
                                <div className="flex items-center gap-4 bg-emerald-950/40 border border-emerald-500/20 px-8 py-3 rounded-2xl shadow-xl">
                                    <Timer className={timeLeft < 10 ? 'text-rose-500 animate-pulse' : 'text-emerald-500'} />
                                    <span className={`text-2xl font-black ${timeLeft < 10 ? 'text-rose-500' : 'text-white'}`}>{timeLeft}s</span>
                                </div>
                                <div className="text-emerald-500/40 font-black text-sm uppercase tracking-[0.3em] animate-pulse">
                                    {status === 'preview' ? 'VERİLER YÜKLENİYOR...' : 'EŞLEŞTİRME AKTİF'}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 perspective-1000">
                                {cards.map((card, idx) => {
                                    const Icon = SHAPE_ICONS[card.symbolIdx];
                                    const color = COLORS[card.colorIdx];

                                    return (
                                        <motion.div
                                            key={card.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{
                                                opacity: 1,
                                                scale: 1,
                                                rotateY: card.isFlipped || card.isMatched ? 0 : 180
                                            }}
                                            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                                            onClick={() => handleCardClick(idx)}
                                            className={`relative h-44 cursor-pointer preserve-3d transition-shadow hover:shadow-[0_0_30px_rgba(16,185,129,0.2)] ${card.isMatched ? 'opacity-40 grayscale pointer-events-none' : ''}`}
                                        >
                                            {/* Ön Yüz */}
                                            <div className={`absolute inset-0 backface-hidden rounded-3xl border-2 flex flex-col items-center justify-center gap-3 ${color.bg} ${color.border} shadow-inner`}>
                                                <Icon size={52} color={color.value} strokeWidth={3} />
                                                <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: color.value }}>
                                                    {color.name}
                                                </div>
                                            </div>

                                            {/* Arka Yüz */}
                                            <div className="absolute inset-0 backface-hidden rounded-3xl bg-slate-900 border-2 border-emerald-500/10 flex items-center justify-center rotate-y-180">
                                                <Cpu size={40} className="text-emerald-500/10" />
                                                <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_center,rgba(16,185,129,1)_0%,transparent_70%)]" />
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Geri Bildirim Overlay */}
                            <AnimatePresence>
                                {feedback && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 1.2 }}
                                        className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 px-10 py-3 rounded-full font-black text-xl shadow-2xl z-[100] uppercase tracking-tighter"
                                    >
                                        {feedback}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {status === 'gameover' && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8 w-full max-w-2xl bg-slate-900/80 p-16 rounded-[4rem] border-2 border-rose-500/20 shadow-2xl backdrop-blur-3xl">
                            <div className="relative mx-auto w-40 h-40 bg-gradient-to-br from-rose-500 to-rose-700 text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl rotate-12 mb-10 border-4 border-white/10">
                                <Trophy size={100} />
                            </div>
                            <h2 className="text-6xl font-black text-white italic uppercase tracking-tighter">SİSTEM ÇÖKTÜ</h2>
                            <p className="text-emerald-500 font-black text-4xl mb-12">VERİ KAZANIMI: {score}</p>

                            <div className="space-y-4">
                                <button onClick={startApp} className="w-full py-6 bg-emerald-500 text-slate-950 font-black text-2xl rounded-3xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-4 shadow-[0_8px_0_#065f46] active:translate-y-2 active:shadow-none mb-4 uppercase">
                                    BAĞLANTIYI YENİLE <RefreshCw />
                                </button>
                                <Link to="/atolyeler/bireysel-degerlendirme" className="text-emerald-500/40 hover:text-emerald-500 font-bold block transition-colors tracking-widest uppercase text-sm">Merkez Ofise Dön</Link>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            <style>{`
                .perspective-1000 { perspective: 1000px; }
                .preserve-3d { transform-style: preserve-3d; }
                .backface-hidden { backface-visibility: hidden; }
                .rotate-y-180 { transform: rotateY(180deg); }
                .backface-hidden { backface-visibility: hidden; }
            `}</style>
        </div>
    );
};

export default CrossMatchGame;
