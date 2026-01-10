import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, RefreshCw, Trophy, Rocket, Timer,
    Hash, Plus, Zap,
    AlertCircle, CheckCircle2, TrendingUp, Key
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useSound } from '../../hooks/useSound';
import { useGamePersistence } from '../../hooks/useGamePersistence';

// --- Types ---
type GameStatus = 'waiting' | 'playing' | 'gameover';

const StreamSumGame: React.FC = () => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();
    const [status, setStatus] = useState<GameStatus>('waiting');
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [currentNumber, setCurrentNumber] = useState<number | null>(null);
    const [previousNumber, setPreviousNumber] = useState<number | null>(null);
    const [inputValue, setInputValue] = useState('');
    const [timeLeft, setTimeLeft] = useState(60);
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
    const [combo, setCombo] = useState(0);
    const gameStartTimeRef = useRef<number>(0);

    // Config
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const flowSpeed = Math.max(800, 2000 - (level * 100)); // Speed increases with level

    // --- Core Logic ---
    const nextNumber = useCallback(() => {
        const nextNum = Math.floor(Math.random() * 9) + 1;
        setPreviousNumber(currentNumber);
        setCurrentNumber(nextNum);
        setInputValue('');
        setFeedback(null);
        playSound('flow_next');
    }, [currentNumber, playSound]);

    const startApp = useCallback(() => {
        setLevel(1);
        setScore(0);
        setCombo(0);
        setTimeLeft(60);
        setPreviousNumber(null);
        setCurrentNumber(null);
        setInputValue('');
        setFeedback(null);
        setStatus('playing');

        // Initial delay before first numbers
        setTimeout(() => {
            const first = Math.floor(Math.random() * 9) + 1;
            setCurrentNumber(first);
            playSound('flow_next');
        }, 500);
    }, [playSound]);

    // Handle Auto Start from HUB
    useEffect(() => {
        if (location.state?.autoStart && status === 'waiting') {
            startApp();
        }
    }, [location.state, status, startApp]);

    // Game Loop
    useEffect(() => {
        if (status === 'playing') {
            const timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        setStatus('gameover');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [status]);

    // Oyun başladığında süre başlat
    useEffect(() => {
        if (status === 'playing') {
            gameStartTimeRef.current = Date.now();
        }
    }, [status]);

    // Oyun bittiğinde verileri kaydet
    useEffect(() => {
        if (status === 'gameover' && gameStartTimeRef.current > 0) {
            const durationSeconds = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
            saveGamePlay({
                game_id: 'akiskan-toplam',
                score_achieved: score,
                duration_seconds: durationSeconds,
                metadata: {
                    level_reached: level,
                    combo: combo,
                    game_name: 'Akışkan Toplam',
                }
            });
        }
    }, [status, score, level, combo, saveGamePlay]);

    // Stream Loop
    useEffect(() => {
        if (status === 'playing' && currentNumber !== null) {
            intervalRef.current = setInterval(() => {
                // If it's the first number, just move to next
                if (previousNumber === null) {
                    nextNumber();
                } else {
                    // Force miss if no input in time
                    if (feedback === null) {
                        setFeedback('wrong');
                        playSound('flow_wrong');
                        setCombo(0);
                        setTimeout(nextNumber, 500);
                    } else {
                        nextNumber();
                    }
                }
            }, flowSpeed + 500); // Buffer for animation
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [status, currentNumber, previousNumber, flowSpeed, nextNumber, feedback, playSound]);

    // Input Handling
    const handleInput = (val: string) => {
        if (status !== 'playing' || feedback || previousNumber === null) return;

        const correctSum = previousNumber + (currentNumber || 0);
        const currentInput = inputValue + val;
        setInputValue(currentInput);

        if (parseInt(currentInput) === correctSum) {
            setFeedback('correct');
            playSound('flow_correct');
            setCombo(prev => prev + 1);
            setScore(prev => prev + (level * 50) + (combo * 10));

            // Speed up to next number on success
            if (intervalRef.current) clearInterval(intervalRef.current);
            setTimeout(nextNumber, 400);
        } else if (currentInput.length >= correctSum.toString().length) {
            setFeedback('wrong');
            playSound('flow_wrong');
            setCombo(0);

            if (intervalRef.current) clearInterval(intervalRef.current);
            setTimeout(nextNumber, 600);
        }
    };

    const Numpad = () => (
        <div className="grid grid-cols-3 gap-3 w-full max-w-[300px] mx-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((n) => (
                <button
                    key={n}
                    onClick={() => handleInput(n.toString())}
                    className={`py-5 rounded-2xl text-2xl font-black transition-all transform active:scale-95 shadow-lg
                        ${n === 0 ? 'col-span-3' : ''}
                        ${feedback === 'correct' ? 'bg-emerald-500 text-white' :
                            feedback === 'wrong' ? 'bg-rose-500 text-white' :
                                'bg-white/10 hover:bg-white/20 text-white border border-white/10'}`}
                >
                    {n}
                </button>
            ))}
        </div>
    );

    return (
        <div className="min-h-screen pt-24 pb-12 px-6 relative overflow-hidden font-mono" style={{ background: '#082f49' }}>
            {/* Water Flow Animation Arka Plan */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-sky-500/10 to-transparent animate-[pulse_4s_infinite]" />
                <svg className="w-full h-full">
                    <filter id="water">
                        <feTurbulence type="fractalNoise" baseFrequency="0.01 0.01" numOctaves="3" result="noise" />
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale="20" />
                    </filter>
                    <rect width="100%" height="100%" filter="url(#water)" fill="none" strokeWidth="2" stroke="rgba(14, 165, 233, 0.2)" />
                </svg>
            </div>

            <div className="container mx-auto max-w-5xl relative z-10">
                {/* HUD */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 border-b border-sky-400/20 pb-8">
                    <div className="flex items-center gap-5">
                        <Link to="/atolyeler/bireysel-degerlendirme" className="p-3 bg-sky-500/10 rounded-2xl hover:bg-sky-500/20 transition-all text-sky-400 border border-sky-400/20">
                            <ChevronLeft />
                        </Link>
                        <div>
                            <h1 className="text-4xl font-black tracking-tighter text-white flex items-center gap-3 italic">
                                AKIŞKAN <span className="text-sky-400">TOPLAM</span>
                            </h1>
                            <p className="text-[10px] text-sky-400/60 font-bold uppercase tracking-[0.4em] mt-1 pl-1">Protocol: Dynamic Updates / V.7.0</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-sky-950/40 border border-sky-400/20 px-8 py-3 rounded-2xl text-center backdrop-blur-xl">
                            <div className="text-[10px] uppercase text-sky-400/40 font-black mb-1">COMBO</div>
                            <div className="text-2xl font-black text-sky-400">x{combo}</div>
                        </div>
                        <div className="bg-sky-950/40 border border-sky-400/20 px-8 py-3 rounded-2xl text-center backdrop-blur-xl">
                            <div className="text-[10px] uppercase text-sky-400/40 font-black mb-1">SCORE</div>
                            <div className="text-2xl font-black text-white">{score}</div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center min-h-[500px]">
                    {status === 'waiting' && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-10 bg-sky-950/40 p-16 rounded-[4rem] border border-sky-400/10 backdrop-blur-3xl">
                            <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
                                <TrendingUp size={100} className="text-sky-400/20 absolute animate-pulse" />
                                <Hash size={80} className="text-sky-400" />
                                <Zap className="absolute bottom-0 right-0 text-amber-400" size={32} />
                            </div>
                            <div className="max-w-md mx-auto space-y-6">
                                <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Seri Aritmetik</h2>
                                <p className="text-sky-300/60 font-medium leading-relaxed italic">
                                    Sayılar birer birer akacak. Her yeni gelen sayıyı, **bir önceki sayı** ile toplayıp sonucu anında gir. Hız hiç kesilmeyecek!
                                </p>
                            </div>
                            <button onClick={startApp} className="group relative px-12 py-5 bg-sky-500 text-sky-950 font-black text-xl rounded-3xl hover:bg-sky-400 transition-all transform hover:scale-105 active:scale-95 shadow-[0_10px_30px_rgba(14,165,233,0.3)] flex items-center gap-4 mx-auto uppercase">
                                AKIŞI BAŞLAT <Rocket fill="currentColor" />
                            </button>
                        </motion.div>
                    )}

                    {status === 'playing' && (
                        <div className="w-full max-w-4xl grid md:grid-cols-2 gap-12 items-center">
                            {/* Display Area */}
                            <div className="space-y-8 text-center md:text-left">
                                <div className="relative h-64 flex items-center justify-center bg-sky-950/30 rounded-[3rem] border border-sky-400/10 shadow-inner overflow-hidden">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={currentNumber}
                                            initial={{ y: 50, opacity: 0, scale: 0.5 }}
                                            animate={{ y: 0, opacity: 1, scale: 1 }}
                                            exit={{ y: -50, opacity: 0, scale: 1.5 }}
                                            className="text-9xl font-black text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                                        >
                                            {currentNumber}
                                        </motion.div>
                                    </AnimatePresence>

                                    {/* Sub-label for memory */}
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 text-sky-400/40 text-xs font-black tracking-widest uppercase">
                                        <Timer size={14} /> Kalan Süre: {timeLeft}s
                                    </div>
                                </div>

                                <div className="bg-sky-500/5 p-8 rounded-[2rem] border border-sky-400/10 backdrop-blur-lg">
                                    <div className="text-[10px] text-sky-400/40 font-black mb-4 tracking-[0.3em] uppercase underline decoration-sky-500/20 underline-offset-8">Giriş Bekleniyor</div>
                                    <div className="text-6xl font-black text-white min-h-[1.2em] flex items-center justify-center md:justify-start gap-4">
                                        <Plus className="text-sky-400/40" size={40} />
                                        <span className="text-sky-400/40 italic text-4xl mr-2">({previousNumber ?? '?'})</span>
                                        = {inputValue}
                                        {status === 'playing' && !inputValue && (
                                            <motion.span animate={{ opacity: [0, 1] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1 h-12 bg-sky-400 ml-2 shadow-[0_0_10px_#38bdf8]" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Input Area */}
                            <div className="space-y-8 bg-sky-950/20 p-10 rounded-[3.5rem] border border-sky-400/20 backdrop-blur-2xl">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-[10px] text-sky-300 font-black uppercase tracking-widest flex items-center gap-2">
                                        <Key size={14} /> Quick Entry
                                    </div>
                                    <div className="px-3 py-1 bg-sky-400/10 rounded-full text-[10px] text-sky-400 font-bold tracking-tighter">LVL {level}</div>
                                </div>
                                <Numpad />
                            </div>
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
                                <div className={`flex flex-col items-center gap-4 px-12 py-8 rounded-[3rem] border-4 shadow-2xl backdrop-blur-3xl ${feedback === 'correct' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-rose-500/20 border-rose-500 text-rose-400'}`}>
                                    {feedback === 'correct' ? <CheckCircle2 size={64} /> : <AlertCircle size={64} />}
                                    <span className="text-4xl font-black uppercase italic tracking-tighter">{feedback === 'correct' ? 'VERİ EŞLENDİ' : 'SİSTEM HATASI'}</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {status === 'gameover' && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8 w-full max-w-2xl bg-sky-950/80 p-16 rounded-[4rem] border-2 border-sky-400/20 shadow-2xl backdrop-blur-3xl">
                            <div className="relative mx-auto w-40 h-40 bg-gradient-to-br from-sky-400 to-sky-600 text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl rotate-12 mb-10 border-4 border-white/10">
                                <Trophy size={100} />
                            </div>
                            <h2 className="text-6xl font-black text-white italic uppercase tracking-tighter leading-none">AKIŞ KESİLDİ</h2>
                            <p className="text-sky-400 font-black text-4xl mb-12 uppercase tracking-tight">KAZANIM: {score} XP</p>

                            <div className="space-y-4">
                                <button onClick={startApp} className="w-full py-6 bg-sky-500 text-sky-950 font-black text-2xl rounded-3xl hover:bg-sky-400 transition-all flex items-center justify-center gap-4 shadow-[0_8px_0_#075985] active:translate-y-2 active:shadow-none mb-4 uppercase">
                                    YENİDEN BAĞLAN <RefreshCw />
                                </button>
                                <Link to="/atolyeler/bireysel-degerlendirme" className="text-sky-400/40 hover:text-sky-400 font-bold block transition-colors tracking-widest uppercase text-sm">Merkez Ofise Dön</Link>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StreamSumGame;
