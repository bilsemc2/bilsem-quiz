import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, RefreshCw, Trophy, Rocket, Timer,
    Shield, Activity, Hash,
    AlertCircle, CheckCircle2, LayoutGrid, EyeOff
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useSound } from '../../hooks/useSound';
import { useGamePersistence } from '../../hooks/useGamePersistence';

// --- Sabitler ---
const COLORS = [
    { name: 'SİYAN', value: '#06b6d4', bg: 'bg-cyan-500/20', border: 'border-cyan-500', shadow: 'shadow-cyan-500/50' },
    { name: 'AMBER', value: '#f59e0b', bg: 'bg-amber-500/20', border: 'border-amber-500', shadow: 'shadow-amber-500/50' },
    { name: 'ROSE', value: '#f43f5e', bg: 'bg-rose-500/20', border: 'border-rose-500', shadow: 'shadow-rose-500/50' },
    { name: 'ZÜMRÜT', value: '#10b981', bg: 'bg-emerald-500/20', border: 'border-emerald-500', shadow: 'shadow-emerald-500/50' },
];

interface SignalItem {
    id: string;
    value: number;
    colorIdx: number;
    x: number;
    y: number;
}

type GameStatus = 'waiting' | 'display' | 'question' | 'result' | 'gameover';

const SignalSumGame: React.FC = () => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();
    const [status, setStatus] = useState<GameStatus>('waiting');
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [signals, setSignals] = useState<SignalItem[]>([]);
    const [targetColorIdx, setTargetColorIdx] = useState(0);
    const [options, setOptions] = useState<number[]>([]);
    const [correctAnswer, setCorrectAnswer] = useState(0);
    const [timeLeft, setTimeLeft] = useState(45);
    const [displayTimer, setDisplayTimer] = useState(5);
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
    const gameStartTimeRef = useRef<number>(0);

    // --- Sinyal Üretme ---
    const generateSignals = useCallback((lvl: number) => {
        const count = Math.min(10, 3 + Math.floor(lvl / 2));
        const newSignals: SignalItem[] = [];
        const usedColors = new Set<number>();

        for (let i = 0; i < count; i++) {
            let x: number, y: number, isTooClose, attempts = 0;
            do {
                x = Math.random() * 70 + 15;
                y = Math.random() * 70 + 15;
                isTooClose = newSignals.some(s => Math.sqrt(Math.pow(s.x - x, 2) + Math.pow(s.y - y, 2)) < 15);
                attempts++;
            } while (isTooClose && attempts < 50);

            const colorIdx = Math.floor(Math.random() * COLORS.length);
            usedColors.add(colorIdx);

            newSignals.push({
                id: Math.random().toString(36).substr(2, 9),
                value: Math.floor(Math.random() * 9) + 1,
                colorIdx,
                x, y
            });
        }

        // En az bir renk seç ve onun toplamını hedefle
        const colorArray = Array.from(usedColors);
        const targetIdx = colorArray[Math.floor(Math.random() * colorArray.length)];
        const sum = newSignals.filter(s => s.colorIdx === targetIdx).reduce((acc, curr) => acc + curr.value, 0);

        // Şıklar
        const opts = [sum];
        while (opts.length < 4) {
            const fake = sum + (Math.floor(Math.random() * 10) - 5);
            if (fake > 0 && !opts.includes(fake)) opts.push(fake);
        }

        setSignals(newSignals);
        setTargetColorIdx(targetIdx);
        setCorrectAnswer(sum);
        setOptions(opts.sort(() => Math.random() - 0.5));
    }, []);

    const startLevel = useCallback((lvl: number) => {
        generateSignals(lvl);
        setStatus('display');
        setDisplayTimer(Math.max(2, 6 - Math.floor(lvl / 4)));
        setFeedback(null);
        playSound('signal_appear');
    }, [generateSignals, playSound]);

    const startApp = useCallback(() => {
        setLevel(1);
        setScore(0);
        setTimeLeft(45);
        startLevel(1);
    }, [startLevel]);

    // Handle Auto Start from HUB
    useEffect(() => {
        if (location.state?.autoStart && status === 'waiting') {
            startApp();
        }
    }, [location.state, status, startApp]);

    // --- Oyun Döngüsü ---
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (status === 'display' && displayTimer > 0) {
            interval = setInterval(() => setDisplayTimer(prev => prev - 1), 1000);
        } else if (status === 'display' && displayTimer === 0) {
            setStatus('question');
            playSound('signal_disappear');
        }
        return () => clearInterval(interval);
    }, [status, displayTimer, playSound]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (status === 'question' && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0 && status === 'question') {
            setStatus('gameover');
        }
        return () => clearInterval(interval);
    }, [status, timeLeft]);

    // Oyun başladığında süre başlat
    useEffect(() => {
        if (status === 'display') {
            gameStartTimeRef.current = Date.now();
        }
    }, [status]);

    // Oyun bittiğinde verileri kaydet
    useEffect(() => {
        if (status === 'gameover' && gameStartTimeRef.current > 0) {
            const durationSeconds = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
            saveGamePlay({
                game_id: 'sinyal-toplami',
                score_achieved: score,
                duration_seconds: durationSeconds,
                metadata: {
                    level_reached: level,
                    game_name: 'Sinyal Toplamı',
                }
            });
        }
    }, [status, score, level, saveGamePlay]);

    const handleSelect = (val: number) => {
        if (status !== 'question' || feedback) return;

        if (val === correctAnswer) {
            setFeedback('correct');
            playSound('signal_correct');
            setScore(prev => prev + (level * 100) + (timeLeft * 2));
            setTimeout(() => {
                setLevel(prev => prev + 1);
                startLevel(level + 1);
            }, 1500);
        } else {
            setFeedback('wrong');
            playSound('signal_wrong');
            setTimeout(() => setStatus('gameover'), 1500);
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-6 relative overflow-hidden font-mono" style={{ background: '#020617' }}>
            {/* Siber Izgara Arka Plan */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:50px_50px]" />
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-cyan-500/5 via-transparent to-rose-500/5" />
            </div>

            <div className="container mx-auto max-w-5xl relative z-10">
                {/* HUD */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 border-b border-cyan-500/20 pb-8">
                    <div className="flex items-center gap-5">
                        <Link to="/atolyeler/bireysel-degerlendirme" className="p-3 bg-cyan-500/5 rounded-2xl hover:bg-cyan-500/10 transition-all text-cyan-500 border border-cyan-500/20">
                            <ChevronLeft />
                        </Link>
                        <div>
                            <h1 className="text-4xl font-black tracking-tighter text-white flex items-center gap-3">
                                SİNYAL <span className="text-cyan-400">TOPLAMI</span>
                            </h1>
                            <p className="text-[10px] text-cyan-500/60 font-bold uppercase tracking-[0.4em] mt-1 pl-1">Protocol: Working Memory / V.3.1</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-cyan-950/30 border border-cyan-500/20 px-8 py-3 rounded-2xl text-center shadow-2xl backdrop-blur-xl">
                            <div className="text-[10px] uppercase text-cyan-400/40 font-black mb-1">LVL PKT</div>
                            <div className="text-2xl font-black text-cyan-400">{level}</div>
                        </div>
                        <div className="bg-cyan-950/30 border border-cyan-500/20 px-8 py-3 rounded-2xl text-center shadow-2xl backdrop-blur-xl">
                            <div className="text-[10px] uppercase text-white/40 font-black mb-1">TOTAL XP</div>
                            <div className="text-2xl font-black text-white">{score}</div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center min-h-[500px]">
                    {status === 'waiting' && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-10 bg-slate-900/40 p-16 rounded-[4rem] border border-cyan-500/10 backdrop-blur-3xl">
                            <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
                                <LayoutGrid size={100} className="text-cyan-500/20 absolute animate-pulse" />
                                <Hash size={80} className="text-cyan-400" />
                                <Shield className="absolute bottom-0 right-0 text-cyan-300" size={32} />
                            </div>
                            <div className="max-w-md mx-auto space-y-6">
                                <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Sinyal Filtreleme</h2>
                                <p className="text-cyan-500/60 font-medium leading-relaxed italic">
                                    Ekranda farklı renklerde rakamlar belirecek. Kaybolduktan sonra sadece sistemin istediği renkteki sayıların toplamını bulmalısın.
                                </p>
                            </div>
                            <button onClick={startApp} className="group relative px-12 py-5 bg-cyan-500 text-slate-950 font-black text-xl rounded-3xl hover:bg-cyan-400 transition-all transform hover:scale-105 active:scale-95 shadow-[0_10px_30px_rgba(6,182,212,0.3)] flex items-center gap-4 mx-auto uppercase">
                                ANALİZE BAŞLA <Rocket fill="currentColor" />
                            </button>
                        </motion.div>
                    )}

                    {status === 'display' && (
                        <div className="relative w-full aspect-[16/9] bg-slate-950/80 rounded-[3rem] border border-cyan-500/10 overflow-hidden shadow-inner">
                            <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-cyan-950/60 border border-cyan-500/20 px-6 py-2 rounded-full text-cyan-400 font-bold tracking-widest text-sm flex items-center gap-3">
                                <Activity size={16} className="animate-pulse" /> TARAMA AKTİF: {displayTimer}s
                            </div>
                            {signals.map((s) => (
                                <motion.div
                                    key={s.id}
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    style={{
                                        position: 'absolute',
                                        left: `${s.x}%`,
                                        top: `${s.y}%`,
                                        color: COLORS[s.colorIdx].value,
                                        textShadow: `0 0 20px ${COLORS[s.colorIdx].value}88`
                                    }}
                                    className="text-6xl font-black transform -translate-x-1/2 -translate-y-1/2"
                                >
                                    {s.value}
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {status === 'question' && (
                        <div className="w-full max-w-3xl space-y-12">
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-900/60 p-12 rounded-[3.5rem] border border-cyan-500/20 backdrop-blur-xl text-center space-y-8 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
                                <div className="flex flex-col items-center gap-6">
                                    <EyeOff size={48} className="text-cyan-500/40" />
                                    <h3 className="text-3xl font-black text-white leading-tight">
                                        Sadece <span className="px-4 py-1 rounded-xl mx-2" style={{ backgroundColor: COLORS[targetColorIdx].value + '33', color: COLORS[targetColorIdx].value, border: `1px solid ${COLORS[targetColorIdx].value}66` }}>
                                            {COLORS[targetColorIdx].name}
                                        </span> renkli olan rakamların toplamı kaçtır?
                                    </h3>
                                </div>

                                <div className="grid grid-cols-2 gap-6 mt-12">
                                    {options.map((opt, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSelect(opt)}
                                            className="py-8 bg-slate-800/40 border-2 border-slate-700 hover:border-cyan-500/50 hover:bg-cyan-500/5 rounded-3xl text-3xl font-black text-white transition-all transform hover:scale-105 active:scale-95 shadow-xl"
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                                <div className="mt-8 flex items-center justify-center gap-4 text-cyan-500/40 font-bold uppercase tracking-widest text-xs">
                                    <Timer size={14} /> KALAN SÜRE: {timeLeft}s
                                </div>
                            </motion.div>
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
                                <div className={`flex flex-col items-center gap-4 px-12 py-8 rounded-[3rem] border-4 shadow-2xl backdrop-blur-2xl ${feedback === 'correct' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-rose-500/20 border-rose-500 text-rose-400'}`}>
                                    {feedback === 'correct' ? <CheckCircle2 size={64} /> : <AlertCircle size={64} />}
                                    <span className="text-4xl font-black uppercase italic tracking-tighter">{feedback === 'correct' ? 'SİSTEM DOĞRULANDI' : 'HATALI VERİ'}</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {status === 'gameover' && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8 w-full max-w-2xl bg-slate-900/80 p-16 rounded-[4rem] border-2 border-rose-500/20 shadow-2xl backdrop-blur-3xl">
                            <div className="relative mx-auto w-40 h-40 bg-gradient-to-br from-cyan-500 to-cyan-700 text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl rotate-12 mb-10 border-4 border-white/10">
                                <Trophy size={100} />
                            </div>
                            <h2 className="text-6xl font-black text-white italic uppercase tracking-tighter leading-none">İŞLEM KESİLDİ</h2>
                            <p className="text-cyan-400 font-black text-4xl mb-12 uppercase tracking-tight">KAZANIM: {score} XP</p>

                            <div className="space-y-4">
                                <button onClick={startApp} className="w-full py-6 bg-cyan-500 text-slate-950 font-black text-2xl rounded-3xl hover:bg-cyan-400 transition-all flex items-center justify-center gap-4 shadow-[0_8px_0_#0891b2] active:translate-y-2 active:shadow-none mb-4 uppercase">
                                    SİNYALİ YENİLE <RefreshCw />
                                </button>
                                <Link to="/atolyeler/bireysel-degerlendirme" className="text-cyan-500/40 hover:text-cyan-500 font-bold block transition-colors tracking-widest uppercase text-sm">Merkez Ofise Dön</Link>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SignalSumGame;
