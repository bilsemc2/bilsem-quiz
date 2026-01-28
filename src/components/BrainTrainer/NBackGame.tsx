import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap, Timer, Trophy, Play, RefreshCw, ChevronLeft,
    Rocket, Terminal, Radio, Target, Brain, AlertCircle,
    Square, Circle, Triangle, Pentagon, Star, Hexagon
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useSound } from '../../hooks/useSound';
import { useGamePersistence } from '../../hooks/useGamePersistence';

interface Shape {
    id: string;
    icon: React.ReactNode;
    color: string;
}

// Şekil tanımlamaları
const SHAPES = [
    { id: 'square', icon: <Square />, color: '#6366f1' },
    { id: 'circle', icon: <Circle />, color: '#10b981' },
    { id: 'triangle', icon: <Triangle />, color: '#f59e0b' },
    { id: 'star', icon: <Star />, color: '#ef4444' },
    { id: 'hexagon', icon: <Hexagon />, color: '#8b5cf6' },
    { id: 'pentagon', icon: <Pentagon />, color: '#ec4899' }
];

type GameState = 'waiting' | 'playing' | 'result' | 'gameover';

const NBackGame: React.FC = () => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();
    const [gameState, setGameState] = useState<GameState>('waiting');
    const [history, setHistory] = useState<Shape[]>([]);
    const [currentShape, setCurrentShape] = useState<Shape | null>(null);
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [nValue, setNValue] = useState(1);
    const [timeLeft, setTimeLeft] = useState(30);
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
    const [trials, setTrials] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const gameStartTimeRef = useRef<number>(0);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const shapeIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Yeni şekil üret
    const generateNewShape = useCallback(() => {
        // %30 ihtimalle n-geri ile aynı şekli üret (test için)
        const shouldBeMatch = Math.random() < 0.3 && history.length >= nValue;

        let nextShape;
        if (shouldBeMatch) {
            nextShape = history[history.length - nValue];
        } else {
            // Farklı bir şekil seç (n-geri ile kesin farklı olsun)
            const availableShapes = SHAPES.filter(s =>
                history.length < nValue || s.id !== history[history.length - nValue]?.id
            );
            nextShape = availableShapes[Math.floor(Math.random() * availableShapes.length)];
        }

        setCurrentShape(null); // Geçici boşluk efekti
        setTimeout(() => {
            setCurrentShape(nextShape);
            setHistory(prev => [...prev, nextShape]);
            setTrials(prev => prev + 1);
            setFeedback(null);
            playSound('radar_scan');
        }, 300);
    }, [history, nValue, playSound]);

    // Oyunu başlat
    const startGame = useCallback(() => {
        setGameState('playing');
        setScore(0);
        setLevel(1);
        setNValue(1);
        setHistory([]);
        setTrials(0);
        setCorrectCount(0);
        setTimeLeft(45);
        setFeedback(null);
        generateNewShape();
    }, [generateNewShape]);

    // Handle Auto Start from HUB
    useEffect(() => {
        if (location.state?.autoStart && gameState === 'waiting') {
            startGame();
        }
    }, [location.state, gameState, startGame]);

    // Zamanlayıcı
    useEffect(() => {
        if (gameState === 'playing' && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setGameState('gameover');
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [gameState, timeLeft]);

    // Oyun başladığında süre başlat
    useEffect(() => {
        if (gameState === 'playing') {
            gameStartTimeRef.current = Date.now();
        }
    }, [gameState]);

    // Oyun bittiğinde verileri kaydet
    useEffect(() => {
        if (gameState === 'gameover' && gameStartTimeRef.current > 0) {
            const durationSeconds = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
            saveGamePlay({
                game_id: 'n-geri-sifresi',
                score_achieved: score,
                duration_seconds: durationSeconds,
                metadata: {
                    n_value: nValue,
                    level: level,
                    correct_count: correctCount,
                    trials: trials,
                    game_name: 'N-Geri Şifresi',
                }
            });
        }
    }, [gameState, score, nValue, level, correctCount, trials, saveGamePlay]);

    // Otomatik şekil akışı
    useEffect(() => {
        if (gameState === 'playing') {
            shapeIntervalRef.current = setInterval(() => {
                if (!feedback && trials > nValue) {
                    // Kullanıcı karar vermediyse ve şekil n-geri ile AYNIYSA bu bir "kaçırdın" durumudur
                    const isActuallyMatch = history[history.length - 1]?.id === history[history.length - (nValue + 1)]?.id;
                    if (isActuallyMatch) {
                        setFeedback('wrong');
                        playSound('radar_incorrect');
                    }
                }
                generateNewShape();
            }, 3000 - (level * 100)); // Seviye arttıkça hızlanır
        }
        return () => {
            if (shapeIntervalRef.current) clearInterval(shapeIntervalRef.current);
        };
    }, [gameState, level, generateNewShape, history, nValue, trials, feedback, playSound]);

    // Karar ver
    const handleDecision = (isMatch: boolean) => {
        if (gameState !== 'playing' || feedback || history.length <= nValue) return;

        const actualMatch = history[history.length - 1].id === history[history.length - (nValue + 1)].id;

        if (isMatch === actualMatch) {
            setFeedback('correct');
            setScore(prev => prev + (10 * nValue * level));
            setCorrectCount(prev => prev + 1);
            playSound('radar_correct');

            // Seviye atlama mantığı
            if (correctCount + 1 >= level * 5) {
                setLevel(prev => prev + 1);
                if (level % 2 === 0 && nValue < 3) {
                    setNValue(prev => prev + 1);
                    playSound('complete');
                }
            }
        } else {
            setFeedback('wrong');
            playSound('radar_incorrect');
        }

        // Bir sonraki şekle geçmek için kısa bekleme
        if (shapeIntervalRef.current) clearInterval(shapeIntervalRef.current);
        setTimeout(generateNewShape, 1000);
    };

    return (
        <div className="min-h-screen bg-[#050505] text-emerald-500 font-mono pt-24 pb-12 px-6 relative overflow-hidden">
            {/* Radar Arka Plan Efekti */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-emerald-500/10 rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-emerald-500/20 rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-emerald-500/30 rounded-full" />

                {/* Scanning Line */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute top-1/2 left-1/2 w-[400px] h-[2px] bg-gradient-to-r from-transparent to-emerald-500/40 origin-left -translate-y-1/2 z-0"
                />
            </div>

            <div className="container mx-auto max-w-4xl relative z-10">
                {/* Terminal Header */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 border-b border-emerald-500/30 pb-6">
                    <div className="flex items-center gap-4">
                        <Link to="/atolyeler/bireysel-degerlendirme" className="p-3 bg-emerald-500/10 rounded-xl hover:bg-emerald-500/20 transition-all text-emerald-400">
                            <ChevronLeft />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-black tracking-tighter flex items-center gap-3">
                                <Radio className="animate-pulse" /> N-GERİ ŞİFRESİ
                            </h1>
                            <p className="text-xs text-emerald-600 font-bold uppercase tracking-widest">Çalışma Belleği / Terminal-02</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-emerald-950/50 border border-emerald-500/30 px-6 py-2 rounded-xl text-center">
                            <div className="text-[10px] uppercase opacity-50">N-Level</div>
                            <div className="text-2xl font-black text-white">{nValue}</div>
                        </div>
                        <div className="bg-emerald-950/50 border border-emerald-500/30 px-6 py-2 rounded-xl text-center">
                            <div className="text-[10px] uppercase opacity-50">Skor</div>
                            <div className="text-2xl font-black text-white">{score}</div>
                        </div>
                        <div className="bg-emerald-950/50 border border-emerald-500/30 px-6 py-2 rounded-xl text-center">
                            <div className="text-[10px] uppercase opacity-50">Zaman</div>
                            <div className={`text-2xl font-black ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{timeLeft}s</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                    {/* Yan Panel: Log */}
                    <div className="lg:col-span-1 space-y-4 hidden lg:block">
                        <div className="bg-emerald-950/30 border border-emerald-500/10 p-4 rounded-2xl h-[400px] overflow-hidden relative">
                            <div className="text-[10px] font-black mb-4 flex items-center gap-2 opacity-50">
                                <Terminal size={12} /> SİSTEM LOGLARI
                            </div>
                            <div className="space-y-2 text-[10px]">
                                {history.slice(-10).reverse().map((item, i) => (
                                    <div key={i} className="flex items-center gap-2 opacity-40">
                                        <span className="text-emerald-500/50">[{trials - i}]</span>
                                        <span>Obje saptandı: {item.id.toUpperCase()}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-[#050505] to-transparent pointer-events-none" />
                        </div>
                    </div>

                    {/* Ana Oyun Ekranı: Radar */}
                    <div className="lg:col-span-2 flex flex-col items-center justify-center space-y-12">
                        {gameState === 'waiting' ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center space-y-8 py-20"
                            >
                                <div className="p-8 bg-emerald-500/10 rounded-full border-2 border-dashed border-emerald-500/30 inline-block relative">
                                    <Brain size={80} className="text-emerald-500 animate-pulse" />
                                    <div className="absolute -top-2 -right-2 bg-emerald-500 text-black px-3 py-1 rounded-full text-xs font-black">N=1</div>
                                </div>
                                <div className="space-y-4 max-w-sm mx-auto">
                                    <h2 className="text-2xl font-black text-white">SİSTEME GİRİŞ YAP</h2>
                                    <p className="text-sm text-emerald-600/80 leading-relaxed">
                                        Ekranda beliren şeklin <strong>{nValue} adım önceki</strong> şekil ile aynı olup olmadığını kontrol et.
                                        Dikkatini topla ve belleğini zorla!
                                    </p>
                                </div>
                                <button
                                    onClick={startGame}
                                    className="px-12 py-4 bg-emerald-500 text-black font-black text-xl rounded-2xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-3 w-full group"
                                >
                                    SİMÜLASYONU BAŞLAT <Rocket fill="currentColor" className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </motion.div>
                        ) : gameState === 'playing' ? (
                            <div className="relative flex flex-col items-center">
                                {/* Feedback Rings */}
                                <AnimatePresence>
                                    {feedback && (
                                        <motion.div
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1.5, opacity: 1 }}
                                            exit={{ scale: 2, opacity: 0 }}
                                            className={`absolute inset-0 rounded-full border-4 ${feedback === 'correct' ? 'border-emerald-500' : 'border-red-500'} pointer-events-none`}
                                        />
                                    )}
                                </AnimatePresence>

                                {/* Main Shape Display */}
                                <div className="w-[300px] h-[300px] rounded-full border-2 border-emerald-500/30 flex items-center justify-center relative bg-emerald-500/5 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                                    <AnimatePresence mode="wait">
                                        {currentShape ? (
                                            <motion.div
                                                key={currentShape.id}
                                                initial={{ scale: 0, opacity: 0, rotate: -45 }}
                                                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                                exit={{ scale: 1.2, opacity: 0, rotate: 45 }}
                                                style={{ color: currentShape.color }}
                                                className="text-8xl drop-shadow-[0_0_20px_currentColor]"
                                            >
                                                {currentShape.icon}
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="loader"
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                className="text-emerald-500/20"
                                            >
                                                <RefreshCw size={40} />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Radar UI Overlays */}
                                    <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[8px] font-black text-emerald-500/40 uppercase tracking-[0.5em]">Scanning Active</div>
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[8px] font-black text-emerald-500/40 uppercase tracking-[0.5em]">Object Detected</div>
                                </div>

                                {/* Controls */}
                                <div className="grid grid-cols-2 gap-6 w-full mt-12">
                                    <button
                                        disabled={history.length <= nValue}
                                        onClick={() => handleDecision(true)}
                                        className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 group
                                            ${history.length <= nValue ? 'border-emerald-500/10 opacity-20 cursor-not-allowed' : 'border-emerald-500/40 hover:bg-emerald-500 hover:text-black hover:scale-105'}
                                        `}
                                    >
                                        <Target size={32} />
                                        <span className="font-black text-xs uppercase tracking-widest">AYNI</span>
                                    </button>
                                    <button
                                        disabled={history.length <= nValue}
                                        onClick={() => handleDecision(false)}
                                        className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 group
                                            ${history.length <= nValue ? 'border-red-500/10 opacity-20 cursor-not-allowed' : 'border-red-500/40 hover:bg-red-500 hover:text-white hover:scale-105'}
                                        `}
                                    >
                                        <AlertCircle size={32} />
                                        <span className="font-black text-xs uppercase tracking-widest">FARKLI</span>
                                    </button>
                                </div>

                                {history.length <= nValue && (
                                    <div className="mt-4 text-[10px] text-emerald-500/40 animate-pulse text-center">
                                        Veri toplanıyor... {history.length}/{nValue + 1}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center space-y-8 py-10 w-full"
                            >
                                <div className="p-8 bg-red-500/10 rounded-[3rem] border border-red-500/20">
                                    <h2 className="text-4xl font-black text-red-500 mb-2">OPERASYON TAMAMLANDI</h2>
                                    <p className="text-emerald-600 font-bold uppercase tracking-widest text-xs">Simülasyon Verileri Derlendi</p>

                                    <div className="grid grid-cols-2 gap-4 mt-8 text-left">
                                        <div className="bg-black/50 p-4 rounded-xl border border-emerald-500/10">
                                            <div className="text-[10px] uppercase opacity-50">Toplam Skor</div>
                                            <div className="text-2xl font-black text-white">{score}</div>
                                        </div>
                                        <div className="bg-black/50 p-4 rounded-xl border border-emerald-500/10">
                                            <div className="text-[10px] uppercase opacity-50">Doğruluk</div>
                                            <div className="text-2xl font-black text-white">%{Math.round((correctCount / (trials - nValue || 1)) * 100)}</div>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={startGame}
                                    className="px-12 py-4 bg-emerald-500 text-black font-black text-xl rounded-2xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-3 w-full group"
                                >
                                    YENİDEN BAŞLAT <Play fill="currentColor" />
                                </button>
                            </motion.div>
                        )}
                    </div>

                    {/* Yan Panel: Gövde */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-emerald-950/30 border border-emerald-500/10 p-6 rounded-2xl space-y-6">
                            <div className="flex items-center gap-3 text-white">
                                <Trophy className="text-emerald-500" />
                                <div className="text-sm font-black uppercase">Başarılar</div>
                            </div>
                            <div className="space-y-4">
                                <div className={`flex items-center gap-3 ${level >= 3 ? 'text-emerald-500' : 'text-emerald-500/20'}`}>
                                    <Zap size={16} /> <span className="text-[10px] font-bold">N-LEVEL 2 ULAŞILDI</span>
                                </div>
                                <div className={`flex items-center gap-3 ${score >= 1000 ? 'text-emerald-500' : 'text-emerald-500/20'}`}>
                                    <Trophy size={16} /> <span className="text-[10px] font-bold">1000+ PUAN KLÜBÜ</span>
                                </div>
                                <div className={`flex items-center gap-3 ${correctCount >= 10 ? 'text-emerald-500' : 'text-emerald-500/20'}`}>
                                    <Target size={16} /> <span className="text-[10px] font-bold">KESKİN ODAK (10+ DOĞRU)</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-emerald-950/30 border border-emerald-500/10 p-6 rounded-2xl">
                            <div className="flex items-center gap-3 text-white mb-4">
                                <Timer className="text-emerald-500" />
                                <div className="text-sm font-black uppercase">Performans</div>
                            </div>
                            <div className="w-full bg-emerald-500/10 h-1.5 rounded-full overflow-hidden">
                                <motion.div
                                    className="bg-emerald-500 h-full"
                                    animate={{ width: `${(timeLeft / 45) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .text-glow {
                    text-shadow: 0 0 15px rgba(16, 185, 129, 0.4);
                }
                @keyframes pulse-emerald {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                .animate-pulse-slow {
                    animation: pulse-emerald 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            `}</style>
        </div>
    );
};

export default NBackGame;
