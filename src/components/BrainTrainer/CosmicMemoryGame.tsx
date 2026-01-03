import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import {
    ChevronLeft, RotateCcw, Play, Trophy, Sparkles,
    Star, Zap, Brain, Rocket, Eye, FastForward
} from 'lucide-react';
import { useSound } from '../../hooks/useSound';

// ------------------ Tip Tanımları ------------------
type GameMode = 'NORMAL' | 'REVERSE';

interface GameState {
    level: number;
    score: number;
    sequence: number[];
    userSequence: number[];
    isDisplaying: number | null; // Şu an parlayan hücrenin indexi
    status: 'WAITING' | 'DISPLAYING' | 'INPUT' | 'SUCCESS' | 'FAILURE' | 'GAMEOVER';
    gridSize: number;
    mode: GameMode;
}

const CosmicMemoryGame: React.FC = () => {
    const { playSound } = useSound();
    const location = useLocation();
    const [gameStarted, setGameStarted] = useState(false);

    const [state, setState] = useState<GameState>({
        level: 1,
        score: 0,
        sequence: [],
        userSequence: [],
        isDisplaying: null,
        status: 'WAITING',
        gridSize: 3,
        mode: 'NORMAL'
    });

    // ------------------ Oyun Mantığı ------------------

    const generateSequence = useCallback((level: number, size: number) => {
        const length = level + 2; // Başlangıçta 3, her seviye +1
        const newSequence = [];
        for (let i = 0; i < length; i++) {
            newSequence.push(Math.floor(Math.random() * (size * size)));
        }
        return newSequence;
    }, []);

    const startLevel = useCallback(() => {
        const gridSize = state.level <= 3 ? 3 : state.level <= 7 ? 4 : 5;
        const newSequence = generateSequence(state.level, gridSize);
        const mode: GameMode = state.level > 5 ? (Math.random() > 0.5 ? 'REVERSE' : 'NORMAL') : 'NORMAL';

        setState(prev => ({
            ...prev,
            sequence: newSequence,
            userSequence: [],
            isDisplaying: null,
            status: 'DISPLAYING',
            gridSize,
            mode
        }));
    }, [state.level, generateSequence]);

    // Sekansı Göster
    useEffect(() => {
        if (state.status === 'DISPLAYING') {
            let i = 0;
            const interval = setInterval(() => {
                if (i >= state.sequence.length) {
                    clearInterval(interval);
                    setState(prev => ({ ...prev, status: 'INPUT', isDisplaying: null }));
                    return;
                }

                const currentIdx = state.sequence[i];
                setState(prev => ({ ...prev, isDisplaying: currentIdx }));
                playSound('cosmic_pop'); // Parlama sesi

                setTimeout(() => {
                    setState(prev => ({ ...prev, isDisplaying: null }));
                }, 600);

                i++;
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [state.status, state.sequence, playSound]);

    const handleCellClick = (idx: number) => {
        if (state.status !== 'INPUT' || state.isDisplaying !== null) return;

        const nextUserSequence = [...state.userSequence, idx];
        const currentStep = state.userSequence.length;

        // Doğrulama Mantığı
        let isCorrect = false;
        if (state.mode === 'NORMAL') {
            isCorrect = state.sequence[currentStep] === idx;
        } else {
            // REVERSE MOD: Sekansın sonundan başına doğru kontrol
            isCorrect = state.sequence[state.sequence.length - 1 - currentStep] === idx;
        }

        if (isCorrect) {
            playSound('cosmic_success');
            setState(prev => ({ ...prev, userSequence: nextUserSequence }));

            if (nextUserSequence.length === state.sequence.length) {
                // Seviye Tamamlandı
                setTimeout(() => {
                    if (state.level === 10) {
                        setState(prev => ({ ...prev, status: 'GAMEOVER', score: prev.score + 500 }));
                    } else {
                        setState(prev => ({
                            ...prev,
                            status: 'SUCCESS',
                            score: prev.score + (state.level * 100),
                        }));
                        setTimeout(() => {
                            setState(prev => ({ ...prev, level: prev.level + 1 }));
                        }, 1500);
                    }
                }, 500);
            }
        } else {
            playSound('cosmic_fail');
            setState(prev => ({ ...prev, status: 'FAILURE' }));
            setTimeout(() => {
                setState(prev => ({ ...prev, status: 'GAMEOVER' }));
            }, 1500);
        }
    };

    useEffect(() => {
        if (gameStarted && (state.status === 'WAITING' || state.status === 'SUCCESS')) {
            startLevel();
        }
    }, [gameStarted, state.status, startLevel]);

    const restartGame = useCallback(() => {
        setState({
            level: 1,
            score: 0,
            sequence: [],
            userSequence: [],
            isDisplaying: null,
            status: 'WAITING',
            gridSize: 3,
            mode: 'NORMAL'
        });
        setGameStarted(true);
    }, []);

    // Handle Auto Start from HUB
    useEffect(() => {
        if (location.state?.autoStart && !gameStarted) {
            restartGame();
        }
    }, [location.state, gameStarted, restartGame]);

    // ------------------ Render ------------------

    if (!gameStarted) {
        return (
            <div className="min-h-screen bg-[#050510] flex items-center justify-center p-6 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.15),transparent)] animate-pulse" />
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white/5 backdrop-blur-3xl p-12 rounded-[4rem] border-4 border-white/10 text-center max-w-2xl shadow-2xl relative z-10"
                >
                    <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl rotate-12">
                        <Star size={60} className="text-white fill-white animate-pulse" />
                    </div>
                    <h1 className="text-5xl font-black mb-6 tracking-tight bg-gradient-to-r from-indigo-200 to-purple-400 bg-clip-text text-transparent uppercase italic">KOZMİK HAFIZA</h1>

                    <div className="text-left space-y-6 mb-12 bg-black/20 p-8 rounded-3xl border border-white/5 shadow-inner">
                        <div className="flex gap-4 items-start">
                            <div className="w-8 h-8 rounded-full bg-indigo-500 flex-shrink-0 flex items-center justify-center font-black">1</div>
                            <p className="text-indigo-100 font-bold text-lg">Ekranda parlayan yıldızları ve sırasını takip et.</p>
                        </div>
                        <div className="flex gap-4 items-start">
                            <div className="w-8 h-8 rounded-full bg-purple-500 flex-shrink-0 flex items-center justify-center font-black">2</div>
                            <p className="text-indigo-100 font-bold text-lg">"NORMAL" modda aynı sırayla, "REVERSE" modda sondan başa dokun.</p>
                        </div>
                        <div className="flex gap-4 items-start">
                            <div className="w-8 h-8 rounded-full bg-pink-500 flex-shrink-0 flex items-center justify-center font-black">3</div>
                            <p className="text-indigo-100 font-bold text-lg">Seviye ilerledikçe uzay derinleşir ve ızgara büyür!</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setGameStarted(true)}
                        className="px-12 py-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black text-2xl rounded-3xl hover:scale-110 transition-all shadow-[0_10px_0_#4338ca] border-b-4 border-indigo-800 active:translate-y-2 active:shadow-none flex items-center gap-4 mx-auto group"
                    >
                        KEŞFE BAŞLA! <Rocket className="group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" />
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#02020a] p-6 pt-24 relative overflow-hidden flex flex-col items-center">
            {/* Kozmik Arka Plan */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30" />
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.15),transparent)] pointer-events-none" />

            <div className="container mx-auto max-w-6xl relative z-10 flex flex-col gap-10">
                {/* HUD */}
                <div className="flex items-center justify-between bg-white/5 backdrop-blur-md p-8 rounded-[3rem] shadow-2xl border-2 border-white/10 text-white">
                    <Link to="/atolyeler/tablet-degerlendirme" className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-black transition-all">
                        <ChevronLeft size={28} /> MERKEZ
                    </Link>
                    <div className="flex items-center gap-10">
                        <div className="flex flex-col items-center px-6 border-r border-white/10">
                            <span className="text-indigo-300/60 text-xs font-black uppercase tracking-widest mb-1">Sektör</span>
                            <div className="text-3xl font-black text-indigo-400">{state.level}<span className="text-indigo-900 text-lg">/10</span></div>
                        </div>
                        <div className="flex flex-col items-center px-6 border-r border-white/10">
                            <span className="text-purple-300/60 text-xs font-black uppercase tracking-widest mb-1">Veri</span>
                            <div className="text-3xl font-black text-purple-400">{state.score}</div>
                        </div>
                        <div className="min-w-[120px] text-center">
                            <span className="text-pink-300/60 text-xs font-black uppercase tracking-widest mb-1">Mod</span>
                            <div className={`text-xl font-black px-4 py-1 rounded-full border-2 transition-all ${state.mode === 'REVERSE'
                                ? 'bg-pink-500/20 border-pink-500 text-pink-400'
                                : 'bg-indigo-500/20 border-indigo-500 text-indigo-400'
                                }`}>
                                {state.mode}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={restartGame}
                        className="p-4 bg-white/5 text-indigo-300 hover:bg-white/10 rounded-2xl transition-all border border-white/10 active:scale-95"
                    >
                        <RotateCcw size={28} />
                    </button>
                </div>

                <div className="flex flex-col items-center justify-center gap-12 py-10">
                    {/* Oyun Izgarası */}
                    <div
                        className="grid gap-4 p-8 bg-white/5 backdrop-blur-xl rounded-[3rem] border-4 border-white/10 shadow-[0_0_80px_rgba(99,102,241,0.1)] relative"
                        style={{
                            gridTemplateColumns: `repeat(${state.gridSize}, 1fr)`,
                            width: state.gridSize === 3 ? '400px' : state.gridSize === 4 ? '500px' : '600px',
                            height: state.gridSize === 3 ? '400px' : state.gridSize === 4 ? '500px' : '600px'
                        }}
                    >
                        {Array.from({ length: state.gridSize * state.gridSize }).map((_, idx) => (
                            <motion.button
                                key={idx}
                                initial={false}
                                animate={state.isDisplaying === idx ? {
                                    scale: 1.15,
                                    backgroundColor: 'rgba(255,255,255,0.9)',
                                    boxShadow: '0 0 50px rgba(255,255,255,0.8)'
                                } : {
                                    scale: 1,
                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                    boxShadow: '0 0 0px rgba(255,255,255,0)'
                                }}
                                whileHover={state.status === 'INPUT' ? { scale: 1.05, backgroundColor: 'rgba(255,255,255,0.15)' } : {}}
                                whileTap={state.status === 'INPUT' ? { scale: 0.95 } : {}}
                                onClick={() => handleCellClick(idx)}
                                className={`rounded-2xl border-2 border-white/10 transition-colors ${state.status === 'INPUT' ? 'cursor-pointer' : 'cursor-default'
                                    }`}
                            >
                                <AnimatePresence>
                                    {(state.isDisplaying === idx || state.userSequence.includes(idx)) && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0 }}
                                            className="flex items-center justify-center h-full w-full"
                                        >
                                            <Star className={state.isDisplaying === idx ? "text-indigo-600 fill-indigo-600" : "text-indigo-400 opacity-30"} size={30} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.button>
                        ))}

                        {/* Durum Bildirimleri */}
                        <AnimatePresence>
                            {(state.status === 'DISPLAYING' || state.status === 'INPUT') && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute -top-20 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-indigo-500/20 border border-indigo-500/50 px-8 py-3 rounded-full text-indigo-200 font-black uppercase tracking-widest"
                                >
                                    {state.status === 'DISPLAYING' ? (
                                        <><Eye className="animate-pulse" /> TAKİP ET!</>
                                    ) : (
                                        <><Brain className="animate-bounce" /> {state.mode === 'REVERSE' ? 'TERS SIRALAYIN!' : 'SIRALAYIN!'}</>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Mesaj Overlays */}
                <AnimatePresence>
                    {state.status === 'SUCCESS' && (
                        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.5 }} className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                            <div className="bg-emerald-500 text-white px-12 py-6 rounded-full font-black text-4xl shadow-2xl flex items-center gap-6 border-4 border-white animate-bounce italic">
                                <Zap className="fill-white" /> MUHTEŞEM!
                            </div>
                        </motion.div>
                    )}

                    {state.status === 'GAMEOVER' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#050510]/95 backdrop-blur-3xl">
                            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white/5 rounded-[5rem] p-20 border-2 border-white/20 text-center max-w-2xl w-full shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                                <div className="w-40 h-40 bg-gradient-to-br from-indigo-400 to-purple-600 text-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-[0_0_50px_rgba(99,102,241,0.3)] rotate-12">
                                    <Trophy size={100} />
                                </div>
                                <h2 className="text-6xl font-black text-white mb-6 tracking-tighter italic uppercase">GÖREV BİTTİ</h2>
                                <p className="text-indigo-100 font-bold text-3xl mb-14 leading-relaxed italic">
                                    Uzay Hafızan Kanıtlandı! <br />
                                    <span className="text-7xl text-indigo-500 block font-black mt-8 not-italic">{state.score} <span className="text-2xl text-indigo-800">PUAN</span></span>
                                </p>
                                <div className="flex flex-col gap-6">
                                    <button onClick={restartGame} className="w-full py-8 bg-indigo-600 text-white font-black rounded-4xl flex items-center justify-center gap-6 shadow-[0_12px_0_#4338ca] border-b-4 border-indigo-800 hover:scale-105 transition-all text-3xl active:translate-y-3 active:shadow-none uppercase">YENİDEN DENE</button>
                                    <Link to="/atolyeler/tablet-degerlendirme" className="text-indigo-400 font-black text-2xl hover:text-indigo-300 transition-colors block mt-8 underline decoration-4 underline-offset-8">MERKEZE DÖN</Link>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default CosmicMemoryGame;
