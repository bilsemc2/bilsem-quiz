import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, RefreshCw, Trophy, Rocket, Timer,
    Activity, Zap, AlertCircle,
    CheckCircle2, Search, Move
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useSound } from '../../hooks/useSound';

// --- Tipler ---
interface CellData {
    id: string;
    value: number | null;
    initialIndex: number;
    currentIndex: number;
}

type GameStatus = 'waiting' | 'display' | 'shuffle' | 'hide' | 'question' | 'result' | 'gameover';

const MatrixEchoGame: React.FC = () => {
    const { playSound } = useSound();
    const location = useLocation();
    const [status, setStatus] = useState<GameStatus>('waiting');
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [cells, setCells] = useState<CellData[]>([]);
    const [question, setQuestion] = useState<{ text: string; answer: number } | null>(null);
    const [options, setOptions] = useState<number[]>([]);
    const [timeLeft, setTimeLeft] = useState(30);
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
    const [isReveille, setIsReveille] = useState(false); // Shuffling sonrası sayıların açık olup olmadığı

    // --- Oyun Mantığı ---
    const generateGame = useCallback((lvl: number) => {
        // Rastgele 3 hücreye 3 farklı sayı yerleştir (3x3 grid: 0-8)
        const cellCount = Math.min(5, 3 + Math.floor(lvl / 4));
        const gridIndices = Array.from({ length: 9 }, (_, i) => i).sort(() => Math.random() - 0.5);
        const selectedIndices = gridIndices.slice(0, cellCount);

        const newCells: CellData[] = selectedIndices.map((idx, i) => ({
            id: `cell-${i}`,
            value: Math.floor(Math.random() * 19) + 1, // 1-20 arası
            initialIndex: idx,
            currentIndex: idx
        }));

        setCells(newCells);
        setIsReveille(true);
        setStatus('display');
        setFeedback(null);
        playSound('detective_click');
    }, [playSound]);

    const startLevel = useCallback((lvl: number) => {
        generateGame(lvl);
    }, [generateGame]);

    const startApp = useCallback(() => {
        setLevel(1);
        setScore(0);
        setTimeLeft(30);
        startLevel(1);
    }, [startLevel]);

    // Shuffling Algoritması
    const performShuffle = useCallback(() => {
        setStatus('shuffle');
        setIsReveille(false);
        playSound('radar_scan');

        setTimeout(() => {
            // HücrelerincurrentIndexlerini karıştır
            const newIndices = Array.from({ length: 9 }, (_, i) => i).sort(() => Math.random() - 0.5);
            setCells(prev => prev.map((cell, i) => ({
                ...cell,
                currentIndex: newIndices[i]
            })));

            // Shuffling bittiğinde soru üret
            setTimeout(() => {
                const updatedCells = cells.map((cell, i) => ({
                    ...cell,
                    currentIndex: newIndices[i]
                }));
                generateQuestion(updatedCells);
                setStatus('question');
                playSound('complete');
            }, 1000);
        }, 1000);
    }, [cells, playSound]);

    // Dinamik Soru Üretici
    const generateQuestion = (finalCells: CellData[]) => {
        // En büyük sayı
        const maxCell = [...finalCells].sort((a, b) => (b.value || 0) - (a.value || 0))[0];
        // Başlangıçta 1. kutu (en düşük indeksli başlangıç hücresi veya index 0'daki varsa)
        // Kullanıcı isteğine göre: "başlangıçta 1. kutuda duran sayı" (genelde index 0 kastedilir)
        const initialFirstCell = finalCells.find(c => c.initialIndex === 0) || finalCells[0];

        const answer = (maxCell.value || 0) + (initialFirstCell.value || 0);

        setQuestion({
            text: `En büyük sayının durduğu yerdeki değer ile başlangıçta en üst-sol (veya ilk) kutuda duran sayının toplamı kaçtır?`,
            answer
        });

        const opts = [answer];
        while (opts.length < 4) {
            const fake = answer + (Math.floor(Math.random() * 10) - 5);
            if (!opts.includes(fake) && fake > 0) opts.push(fake);
        }
        setOptions(opts.sort(() => Math.random() - 0.5));
    };

    // Otomatik Geçişler
    useEffect(() => {
        if (status === 'display') {
            const timer = setTimeout(() => {
                performShuffle();
            }, 2500); // 2 saniye görünüm
            return () => clearTimeout(timer);
        }
    }, [status, performShuffle]);

    // Zamanlayıcı
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (status === 'question' && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0 && status === 'question') {
            setStatus('gameover');
        }
        return () => clearInterval(interval);
    }, [status, timeLeft]);

    const handleSelect = (val: number) => {
        if (status !== 'question' || feedback) return;

        if (val === question?.answer) {
            setFeedback('correct');
            playSound('detective_correct');
            setScore(prev => prev + (level * 250) + (timeLeft * 10));
            setTimeout(() => {
                setLevel(prev => prev + 1);
                setTimeLeft(30);
                startLevel(level + 1);
            }, 2000);
        } else {
            setFeedback('wrong');
            playSound('detective_incorrect');
            setTimeout(() => setStatus('gameover'), 2000);
        }
    };

    // Handle Auto Start from HUB
    useEffect(() => {
        if (location.state?.autoStart && status === 'waiting') {
            startApp();
        }
    }, [location.state, status, startApp]);

    return (
        <div className="min-h-screen pt-24 pb-12 px-6 relative overflow-hidden font-mono text-blue-400" style={{ background: '#020617' }}>
            {/* Sonar Arka Plan */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-blue-500 rounded-full animate-pulse scale-150" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-blue-500/50 rounded-full animate-pulse" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:60px:60px]" />
            </div>

            <div className="container mx-auto max-w-5xl relative z-10">
                {/* HUD */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 border-b border-blue-500/20 pb-8">
                    <div className="flex items-center gap-5">
                        <Link to="/atolyeler/bireysel-degerlendirme" className="p-3 bg-blue-500/5 rounded-2xl hover:bg-blue-500/10 transition-all text-blue-500 border border-blue-500/20">
                            <ChevronLeft />
                        </Link>
                        <div>
                            <h1 className="text-4xl font-black tracking-tighter text-white flex items-center gap-3 italic uppercase">
                                MATRİS <span className="text-blue-500">YANKISI</span>
                            </h1>
                            <p className="text-[10px] text-blue-500/60 font-bold uppercase tracking-[0.4em] mt-1 pl-1">Protocol: Object Tracking / V.5.0</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-blue-950/30 border border-blue-500/20 px-8 py-3 rounded-2xl text-center shadow-2xl backdrop-blur-xl">
                            <div className="text-[10px] uppercase text-blue-400/40 font-black mb-1">ANALİZ DERİNLİĞİ</div>
                            <div className="text-2xl font-black text-blue-400">{level}</div>
                        </div>
                        <div className="bg-blue-950/30 border border-blue-500/20 px-8 py-3 rounded-2xl text-center shadow-2xl backdrop-blur-xl">
                            <div className="text-[10px] uppercase text-white/40 font-black mb-1">VERİ PUANI</div>
                            <div className="text-2xl font-black text-white">{score}</div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center min-h-[600px]">
                    {status === 'waiting' && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-10 bg-slate-900/40 p-16 rounded-[4rem] border border-blue-500/10 backdrop-blur-3xl max-w-2xl">
                            <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
                                <Move size={100} className="text-blue-500/20 absolute animate-spin-slow" />
                                <Search size={80} className="text-blue-400" />
                                <Zap className="absolute bottom-0 right-0 text-blue-300" size={32} />
                            </div>
                            <div className="space-y-6">
                                <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">Hücresel Takip</h2>
                                <p className="text-blue-500/60 font-medium leading-relaxed italic">
                                    Matristeki sayılar yer değiştirmeden önce konumlarını zihnine kazı. Shuffling sonrası sorulacak karmaşık soruyu çözmek için nesne takibi yapmalısın.
                                </p>
                            </div>
                            <button onClick={startApp} className="group relative px-12 py-5 bg-blue-500 text-slate-950 font-black text-xl rounded-3xl hover:bg-blue-400 transition-all transform hover:scale-105 active:scale-95 shadow-[0_10px_30px_rgba(59,130,246,0.3)] flex items-center gap-4 mx-auto uppercase italic">
                                SİNYALİ BAŞLAT <Rocket fill="currentColor" />
                            </button>
                        </motion.div>
                    )}

                    {(status === 'display' || status === 'shuffle' || status === 'question') && (
                        <div className="w-full flex flex-col items-center gap-16">
                            {/* 3x3 Matris */}
                            <div className="grid grid-cols-3 gap-4 p-6 bg-blue-900/10 rounded-[3rem] border border-blue-500/20 relative shadow-2xl backdrop-blur-sm">
                                {Array.from({ length: 9 }).map((_, idx) => {
                                    const cell = cells.find(c => c.currentIndex === idx);
                                    return (
                                        <div
                                            key={idx}
                                            className="w-32 h-32 rounded-3xl border-2 border-blue-500/10 bg-blue-950/20 flex items-center justify-center relative overflow-hidden"
                                        >
                                            <AnimatePresence mode="popLayout">
                                                {cell && (
                                                    <motion.div
                                                        key={cell.id}
                                                        layoutId={cell.id}
                                                        initial={{ scale: 0, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        exit={{ scale: 0, opacity: 0 }}
                                                        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                                                        className={`w-full h-full flex items-center justify-center text-5xl font-black italic
                                                            ${status === 'display' || (feedback && status === 'question') ? 'text-blue-400' : 'text-blue-500/0'}
                                                            bg-blue-500/5 shadow-inner
                                                        `}
                                                    >
                                                        {isReveille || (feedback && status === 'question') ? cell.value : '?'}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            {/* Grid Süsleri */}
                                            <div className="absolute top-2 left-2 w-1 h-1 bg-blue-500/20 rounded-full" />
                                            <div className="absolute bottom-2 right-2 w-1 h-1 bg-blue-500/20 rounded-full" />
                                        </div>
                                    );
                                })}

                                <AnimatePresence>
                                    {status === 'shuffle' && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                        >
                                            <div className="w-full h-full border-4 border-blue-500 rounded-[3rem] animate-ping opacity-20" />
                                            <div className="bg-blue-500/20 backdrop-blur-md px-8 py-3 rounded-full border border-blue-500/50 text-blue-400 text-sm font-black tracking-[0.5em] uppercase">
                                                SHUFFLING AKTİF...
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {status === 'question' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="w-full max-w-4xl space-y-10 bg-slate-900/60 p-12 rounded-[3.5rem] border border-blue-500/30 backdrop-blur-2xl shadow-2xl relative overflow-hidden"
                                >
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />

                                    <div className="text-center space-y-6">
                                        <div className="flex flex-col items-center gap-4">
                                            <Activity size={48} className="text-blue-500/40 animate-pulse" />
                                            <h3 className="text-3xl font-black text-white italic leading-tight max-w-2xl px-4">
                                                {question?.text}
                                            </h3>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
                                            {options.map((opt, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => handleSelect(opt)}
                                                    className="py-6 bg-blue-950/40 border-2 border-blue-900 hover:border-blue-400 hover:bg-blue-500/10 rounded-2xl text-3xl font-black text-white transition-all transform hover:scale-105 active:scale-95"
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="mt-10 flex items-center justify-center gap-4 text-blue-500/40 font-bold uppercase tracking-widest text-xs">
                                            <Timer size={14} /> KALAN ANALİZ SÜRESİ: {timeLeft}s
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    )}

                    <AnimatePresence>
                        {feedback && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.2 }}
                                className="fixed inset-0 flex items-center justify-center pointer-events-none z-[100] px-6"
                            >
                                <div className={`flex flex-col items-center gap-4 px-12 py-8 rounded-[3rem] border-4 shadow-2xl backdrop-blur-2xl ${feedback === 'correct' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-red-500/20 border-red-500 text-red-400'}`}>
                                    {feedback === 'correct' ? <CheckCircle2 size={64} /> : <AlertCircle size={64} />}
                                    <span className="text-4xl font-black uppercase italic tracking-tighter">
                                        {status === 'question' && feedback === 'correct' ? 'MANTIK DOĞRULANDI' : 'YANLIŞ ÇIKARIM'}
                                    </span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {status === 'gameover' && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-10 w-full max-w-2xl bg-slate-900/80 p-16 rounded-[4rem] border-2 border-blue-500/20 shadow-2xl backdrop-blur-3xl">
                            <div className="relative mx-auto w-40 h-40 bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl rotate-12 mb-10 border-4 border-white/10">
                                <Trophy size={100} />
                            </div>
                            <div className="space-y-4">
                                <h2 className="text-6xl font-black text-white italic uppercase tracking-tighter leading-none">ANALİZ KESİLDİ</h2>
                                <p className="text-blue-400 font-black text-4xl uppercase tracking-tight">VERİ KAZANIMI: {score} XP</p>
                            </div>

                            <div className="space-y-4">
                                <button onClick={startApp} className="w-full py-6 bg-blue-500 text-slate-950 font-black text-2xl rounded-3xl hover:bg-blue-400 transition-all flex items-center justify-center gap-4 shadow-[0_8px_0_#1e3a8a] active:translate-y-2 active:shadow-none mb-4 uppercase italic">
                                    SENSÖRÜ SIFIRLA <RefreshCw />
                                </button>
                                <Link to="/atolyeler/bireysel-degerlendirme" className="text-blue-500/40 hover:text-blue-500 font-bold block transition-colors tracking-widest uppercase text-sm underline underline-offset-8">Merkez Ofise Dön</Link>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            <style>{`
                .animate-spin-slow { animation: spin 8s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default MatrixEchoGame;
