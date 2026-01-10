import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, RefreshCw, Trophy, Rocket, Timer,
    Zap, AlertCircle, Activity,
    CheckCircle2, Calculator, ArrowLeftRight, FlipHorizontal
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useSound } from '../../hooks/useSound';
import { useGamePersistence } from '../../hooks/useGamePersistence';

// --- Tipler ---
type GameStatus = 'waiting' | 'display' | 'input_sequence' | 'input_sum' | 'result' | 'gameover';

const ReflectionSumGame: React.FC = () => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();
    const [status, setStatus] = useState<GameStatus>('waiting');
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [digits, setDigits] = useState<number[]>([]);
    const [userSequence, setUserSequence] = useState<number[]>([]);
    const [userSum, setUserSum] = useState<string>('');
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [timeLeft, setTimeLeft] = useState(30);
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
    const [isMirrored, setIsMirrored] = useState(false);
    const gameStartTimeRef = useRef<number>(0);

    // --- Oyun Mantığı ---
    const generateSequence = useCallback((lvl: number) => {
        const length = Math.min(10, 4 + Math.floor(lvl / 2));
        const newDigits = Array.from({ length }, () => Math.floor(Math.random() * 9) + 1);
        setDigits(newDigits);
        setUserSequence([]);
        setUserSum('');
        setCurrentIndex(-1);
        setFeedback(null);
        setIsMirrored(lvl > 2 && Math.random() < 0.4);
        setStatus('display');
        playSound('detective_mystery');
    }, [playSound]);

    const startLevel = useCallback((lvl: number) => {
        generateSequence(lvl);
    }, [generateSequence]);

    const startApp = useCallback(() => {
        setLevel(1);
        setScore(0);
        setTimeLeft(30);
        startLevel(1);
    }, [startLevel]);

    // Handle Auto Start from HUB
    useEffect(() => {
        if (location.state?.autoStart && status === 'waiting') {
            startApp();
        }
    }, [location.state, status, startApp]);

    // Görünüm Fazı
    useEffect(() => {
        if (status === 'display') {
            if (currentIndex < digits.length - 1) {
                const timer = setTimeout(() => {
                    setCurrentIndex(prev => prev + 1);
                    playSound('radar_scan');
                }, 1200);
                return () => clearTimeout(timer);
            } else {
                const timer = setTimeout(() => {
                    setCurrentIndex(-1);
                    setStatus('input_sequence');
                    playSound('complete');
                }, 1500);
                return () => clearTimeout(timer);
            }
        }
    }, [status, currentIndex, digits, playSound]);

    // Zamanlayıcı
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if ((status === 'input_sequence' || status === 'input_sum') && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0 && (status === 'input_sequence' || status === 'input_sum')) {
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
                game_id: 'yansima-toplami',
                score_achieved: score,
                duration_seconds: durationSeconds,
                metadata: {
                    level_reached: level,
                    game_name: 'Yansıma Toplamı',
                }
            });
        }
    }, [status, score, level, saveGamePlay]);

    const handleDigitClick = (digit: number) => {
        if (status !== 'input_sequence') return;

        const newSequence = [...userSequence, digit];
        setUserSequence(newSequence);
        playSound('detective_click');

        // Geriye doğru kontrol (backward check)
        const reversedDigits = [...digits].reverse();
        if (digit !== reversedDigits[newSequence.length - 1]) {
            setFeedback('wrong');
            playSound('detective_incorrect');
            setTimeout(() => setStatus('gameover'), 1500);
            return;
        }

        if (newSequence.length === digits.length) {
            setTimeout(() => {
                setStatus('input_sum');
                playSound('complete');
            }, 500);
        }
    };

    const handleSumSubmit = () => {
        const total = digits.reduce((a, b) => a + b, 0);
        if (parseInt(userSum) === total) {
            setFeedback('correct');
            playSound('detective_correct');
            setScore(prev => prev + (level * 300) + (timeLeft * 15));
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

    return (
        <div className="min-h-screen pt-24 pb-12 px-6 relative overflow-hidden font-mono text-purple-400" style={{ background: '#050110' }}>
            {/* Mirror Arka Plan */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-gradient-to-b from-transparent via-purple-500 to-transparent shadow-[0_0_20px_purple]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(147,51,234,0.1),transparent_70%)]" />
            </div>

            <div className="container mx-auto max-w-5xl relative z-10">
                {/* HUD */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 border-b border-purple-500/20 pb-8">
                    <div className="flex items-center gap-5">
                        <Link to="/atolyeler/bireysel-degerlendirme" className="p-3 bg-purple-500/5 rounded-2xl hover:bg-purple-500/10 transition-all text-purple-500 border border-purple-500/20">
                            <ChevronLeft />
                        </Link>
                        <div>
                            <h1 className="text-4xl font-black tracking-tighter text-white flex items-center gap-3 italic uppercase">
                                YANSIMA <span className="text-purple-500">TOPLAMI</span>
                            </h1>
                            <p className="text-[10px] text-purple-500/60 font-bold uppercase tracking-[0.4em] mt-1 pl-1">Protocol: Dual Processing / V.6.0</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-purple-950/30 border border-purple-500/20 px-8 py-3 rounded-2xl text-center shadow-2xl backdrop-blur-xl">
                            <div className="text-[10px] uppercase text-purple-400/40 font-black mb-1">DİZİ UZUNLUĞU</div>
                            <div className="text-2xl font-black text-purple-400">{digits.length > 0 ? digits.length : level + 3}</div>
                        </div>
                        <div className="bg-purple-950/30 border border-purple-500/20 px-8 py-3 rounded-2xl text-center shadow-2xl backdrop-blur-xl">
                            <div className="text-[10px] uppercase text-white/40 font-black mb-1">XP SKORU</div>
                            <div className="text-2xl font-black text-white">{score}</div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center min-h-[600px]">
                    {status === 'waiting' && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-10 bg-slate-900/40 p-16 rounded-[4rem] border border-purple-500/10 backdrop-blur-3xl max-w-2xl">
                            <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
                                <ArrowLeftRight size={100} className="text-purple-500/20 absolute animate-pulse" />
                                <FlipHorizontal size={80} className="text-purple-400" />
                                <Zap className="absolute bottom-0 right-0 text-purple-300" size={32} />
                            </div>
                            <div className="space-y-6">
                                <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">Bilişsel Yansıma</h2>
                                <p className="text-purple-500/60 font-medium leading-relaxed italic">
                                    Sayı dizisini dikkatle izle. Önce diziyi **tersinden** gir, ardından tüm sayıların **toplamını** hesapla. Görüntü bazen aynalanmış olabilir!
                                </p>
                            </div>
                            <button onClick={startApp} className="group relative px-12 py-5 bg-purple-500 text-slate-950 font-black text-xl rounded-3xl hover:bg-purple-400 transition-all transform hover:scale-105 active:scale-95 shadow-[0_10px_30px_rgba(168,85,247,0.3)] flex items-center gap-4 mx-auto uppercase italic">
                                ANALİZİ BAŞLAT <Rocket fill="currentColor" />
                            </button>
                        </motion.div>
                    )}

                    {status === 'display' && (
                        <div className="flex flex-col items-center gap-12">
                            <div className="relative w-64 h-64 flex items-center justify-center">
                                <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full animate-spin-slow shadow-[0_0_50px_rgba(168,85,247,0.1)]" />
                                <AnimatePresence mode="wait">
                                    {currentIndex >= 0 && (
                                        <motion.div
                                            key={currentIndex}
                                            initial={{ scale: 0.5, opacity: 0, rotateY: isMirrored ? 180 : 0 }}
                                            animate={{ scale: 1.5, opacity: 1, rotateY: isMirrored ? 180 : 0 }}
                                            exit={{ scale: 2, opacity: 0 }}
                                            className="text-9xl font-black text-white italic drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]"
                                        >
                                            {digits[currentIndex]}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            <div className="flex gap-2">
                                {digits.map((_, i) => (
                                    <div key={i} className={`w-3 h-3 rounded-full border-2 border-purple-500/50 ${i <= currentIndex ? 'bg-purple-500 shadow-[0_0_10px_purple]' : ''}`} />
                                ))}
                            </div>
                        </div>
                    )}

                    {status === 'input_sequence' && (
                        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl space-y-12">
                            <div className="text-center space-y-4">
                                <h3 className="text-3xl font-black text-white italic">
                                    Diziyi <span className="text-purple-500 underline decoration-purple-500/50 underline-offset-8 uppercase">Geriye Doğru</span> girin:
                                </h3>
                                <div className="flex justify-center gap-4 min-h-[80px]">
                                    <AnimatePresence>
                                        {userSequence.map((d, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ scale: 0.5, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                className="w-16 h-20 bg-purple-500/20 border-2 border-purple-500/50 rounded-2xl flex items-center justify-center text-4xl font-black text-white shadow-xl"
                                            >
                                                {d}
                                            </motion.div>
                                        ))}
                                        {Array.from({ length: digits.length - userSequence.length }).map((_, i) => (
                                            <div key={i + 100} className="w-16 h-20 border-2 border-dashed border-purple-500/20 rounded-2xl flex items-center justify-center text-purple-500/10 text-4xl font-black">?</div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>

                            <div className="grid grid-cols-5 gap-4 max-w-2xl mx-auto">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(n => (
                                    <button
                                        key={n}
                                        onClick={() => handleDigitClick(n)}
                                        className="py-6 bg-slate-900/40 border-2 border-purple-500/10 hover:border-purple-500/50 hover:bg-purple-500/10 rounded-3xl text-3xl font-black text-white transition-all transform hover:scale-105 active:scale-95 shadow-xl"
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {status === 'input_sum' && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-12 bg-slate-900/60 p-16 rounded-[4rem] border border-purple-500/20 backdrop-blur-2xl shadow-2xl max-w-xl w-full">
                            <div className="space-y-6">
                                <Calculator className="mx-auto text-purple-500" size={64} />
                                <h3 className="text-3xl font-black text-white italic">Tüm sayıların <span className="text-purple-500 uppercase">Toplamı</span> nedir?</h3>
                            </div>

                            <input
                                type="number"
                                value={userSum}
                                onChange={(e) => setUserSum(e.target.value)}
                                autoFocus
                                onKeyPress={(e) => e.key === 'Enter' && handleSumSubmit()}
                                className="w-full bg-slate-950/50 border-4 border-purple-500/30 text-center text-7xl font-black text-white py-8 rounded-3xl focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-500/20 transition-all shadow-inner placeholder-purple-900/20"
                                placeholder="00"
                            />

                            <button
                                onClick={handleSumSubmit}
                                className="w-full py-6 bg-purple-500 text-slate-950 font-black text-2xl rounded-3xl hover:bg-purple-400 transition-all flex items-center justify-center gap-4 shadow-[0_10px_30px_rgba(168,85,247,0.3)]"
                            >
                                SONUCU ONAYLA <CheckCircle2 />
                            </button>
                        </motion.div>
                    )}

                    {status === 'gameover' && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-10 w-full max-w-2xl bg-slate-900/80 p-16 rounded-[4rem] border-2 border-purple-500/20 shadow-2xl backdrop-blur-3xl">
                            <div className="relative mx-auto w-40 h-40 bg-gradient-to-br from-purple-500 to-indigo-700 text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl rotate-12 mb-10 border-4 border-white/10">
                                <Trophy size={100} />
                            </div>
                            <div className="space-y-4">
                                <h2 className="text-6xl font-black text-white italic uppercase tracking-tighter leading-none">ANALİZ SONLANDI</h2>
                                <p className="text-purple-400 font-black text-4xl uppercase tracking-tight">TOPLAM XP: {score}</p>
                            </div>

                            <div className="space-y-4">
                                <button onClick={startApp} className="w-full py-6 bg-purple-500 text-slate-950 font-black text-2xl rounded-3xl hover:bg-purple-400 transition-all flex items-center justify-center gap-4 shadow-[0_8px_0_#581c87] active:translate-y-2 active:shadow-none mb-4 uppercase italic">
                                    YENİDEN BAŞLAT <RefreshCw />
                                </button>
                                <Link to="/atolyeler/bireysel-degerlendirme" className="text-purple-500/40 hover:text-purple-500 font-bold block transition-colors tracking-widest uppercase text-sm underline underline-offset-8">Merkez Ofise Dön</Link>
                            </div>
                        </motion.div>
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
                                        {feedback === 'correct' ? 'VERİ DOĞRULANDI' : 'HAFIZA HATASI'}
                                    </span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {status === 'input_sequence' || status === 'input_sum' ? (
                    <div className="mt-12 flex items-center justify-center gap-6">
                        <div className="flex items-center gap-3 px-6 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-sm font-black">
                            <Timer size={14} className="animate-pulse" /> SÜRE: {timeLeft}s
                        </div>
                        <div className="flex items-center gap-3 px-6 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-sm font-black">
                            <Activity size={14} /> ADIM: {level}
                        </div>
                    </div>
                ) : null}
            </div>

            <style>{`
                .animate-spin-slow { animation: spin 12s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default ReflectionSumGame;
