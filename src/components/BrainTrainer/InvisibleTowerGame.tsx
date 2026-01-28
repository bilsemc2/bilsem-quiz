import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, RefreshCw, Trophy, Rocket, Timer,
    Shield, Activity, Hash, Zap, AlertCircle,
    CheckCircle2, LayoutGrid, TrendingDown, TrendingUp
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useSound } from '../../hooks/useSound';
import { useGamePersistence } from '../../hooks/useGamePersistence';

// --- Tipler ---
interface TowerSegment {
    id: string;
    value: number;
    multiplier?: number;
    isNegative: boolean;
    row: number;
    col: number;
}

type GameStatus = 'waiting' | 'building' | 'flashing' | 'question' | 'result' | 'gameover';

const InvisibleTowerGame: React.FC = () => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();
    const [status, setStatus] = useState<GameStatus>('waiting');
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [tower, setTower] = useState<TowerSegment[]>([]);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [correctAnswer, setCorrectAnswer] = useState(0);
    const [options, setOptions] = useState<number[]>([]);
    const [timeLeft, setTimeLeft] = useState(45);
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
    const gameStartTimeRef = useRef<number>(0);

    // --- Kule Verisi Üretme ---
    const generateTower = useCallback((lvl: number) => {
        const rows = Math.min(6, 2 + Math.floor(lvl / 2));
        const newTower: TowerSegment[] = [];
        let totalSum = 0;

        // Her sıra için blok üret (Aşağıdan yukarıya)
        for (let r = 0; r < rows; r++) {
            const colsInRow = rows - r;
            for (let c = 0; c < colsInRow; c++) {
                const isNegative = lvl > 3 && Math.random() < 0.2;
                const multiplier = lvl > 5 && Math.random() < 0.15 ? (Math.random() < 0.7 ? 2 : 3) : undefined;
                let val = Math.floor(Math.random() * 9) + 1;

                if (isNegative) val = -val;
                const effectiveVal = val * (multiplier || 1);
                totalSum += effectiveVal;

                newTower.push({
                    id: Math.random().toString(36).substr(2, 9),
                    value: Math.abs(val),
                    multiplier,
                    isNegative,
                    row: r,
                    col: c
                });
            }
        }

        // Şıklar
        const opts = [totalSum];
        while (opts.length < 4) {
            const fake = totalSum + (Math.floor(Math.random() * 20) - 10);
            if (!opts.includes(fake)) opts.push(fake);
        }

        setTower(newTower);
        setCorrectAnswer(totalSum);
        setOptions(opts.sort(() => Math.random() - 0.5));
    }, []);

    const startLevel = useCallback((lvl: number) => {
        generateTower(lvl);
        setCurrentIndex(-1);
        setStatus('building');
        setFeedback(null);
        playSound('detective_mystery'); // Kule inşa sesi olarak gizemli bir ton
    }, [generateTower, playSound]);

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

    // --- Animasyon Dizini ---
    useEffect(() => {
        if (status === 'building') {
            const timer = setTimeout(() => setStatus('flashing'), 1000);
            return () => clearTimeout(timer);
        }

        if (status === 'flashing') {
            if (currentIndex < tower.length - 1) {
                const timer = setTimeout(() => {
                    setCurrentIndex(prev => prev + 1);
                    playSound('radar_scan'); // Her sayı parladığında 'ping' sesi
                }, 1200);
                return () => clearTimeout(timer);
            } else {
                const timer = setTimeout(() => {
                    setStatus('question');
                    playSound('complete'); // Dizilim bitti sesi
                }, 1500);
                return () => clearTimeout(timer);
            }
        }
    }, [status, currentIndex, tower.length, playSound]);

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

    // Oyun başladığında süre başlat
    useEffect(() => {
        if (status === 'building') {
            gameStartTimeRef.current = Date.now();
        }
    }, [status]);

    // Oyun bittiğinde verileri kaydet
    useEffect(() => {
        if (status === 'gameover' && gameStartTimeRef.current > 0) {
            const durationSeconds = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
            saveGamePlay({
                game_id: 'gorunmez-kule',
                score_achieved: score,
                duration_seconds: durationSeconds,
                metadata: {
                    level_reached: level,
                    game_name: 'Görünmez Kule',
                }
            });
        }
    }, [status, score, level, saveGamePlay]);

    const handleSelect = (val: number) => {
        if (status !== 'question' || feedback) return;

        if (val === correctAnswer) {
            setFeedback('correct');
            playSound('detective_correct');
            setScore(prev => prev + (level * 200) + (timeLeft * 5));
            setTimeout(() => {
                setLevel(prev => prev + 1);
                startLevel(level + 1);
            }, 2000);
        } else {
            setFeedback('wrong');
            playSound('detective_incorrect');
            setTimeout(() => setStatus('gameover'), 2000);
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-6 relative overflow-hidden font-mono" style={{ background: '#0a0a0f' }}>
            {/* Arka Plan Efekti */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-amber-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-amber-600/5 rounded-full blur-[100px]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(245,158,11,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
            </div>

            <div className="container mx-auto max-w-5xl relative z-10">
                {/* HUD */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 border-b border-amber-500/20 pb-8">
                    <div className="flex items-center gap-5">
                        <Link to="/atolyeler/bireysel-degerlendirme" className="p-3 bg-amber-500/5 rounded-2xl hover:bg-amber-500/10 transition-all text-amber-500 border border-amber-500/20">
                            <ChevronLeft />
                        </Link>
                        <div>
                            <h1 className="text-4xl font-black tracking-tighter text-white flex items-center gap-3 italic">
                                GÖRÜNMEZ <span className="text-amber-500">KULE</span>
                            </h1>
                            <p className="text-[10px] text-amber-500/60 font-bold uppercase tracking-[0.4em] mt-1 pl-1">Protocol: Sequential Memory / V.4.0</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-amber-950/30 border border-amber-500/20 px-8 py-3 rounded-2xl text-center shadow-2xl backdrop-blur-xl">
                            <div className="text-[10px] uppercase text-amber-400/40 font-black mb-1">KAT SEVİYE</div>
                            <div className="text-2xl font-black text-amber-400">{level}</div>
                        </div>
                        <div className="bg-amber-950/30 border border-amber-500/20 px-8 py-3 rounded-2xl text-center shadow-2xl backdrop-blur-xl">
                            <div className="text-[10px] uppercase text-white/40 font-black mb-1">XP KAZANIMI</div>
                            <div className="text-2xl font-black text-white">{score}</div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center min-h-[600px]">
                    {status === 'waiting' && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-10 bg-slate-900/40 p-16 rounded-[4rem] border border-amber-500/10 backdrop-blur-3xl max-w-2xl">
                            <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
                                <LayoutGrid size={100} className="text-amber-500/20 absolute animate-pulse rotate-45" />
                                <TrendingUp size={80} className="text-amber-400" />
                                <Shield className="absolute bottom-0 right-0 text-amber-300" size={32} />
                            </div>
                            <div className="space-y-6">
                                <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">Kule Veri Analizi</h2>
                                <p className="text-amber-500/60 font-medium leading-relaxed italic">
                                    Kulenin katmanlarında beliren sayıları takip et. Dikkat et! Çarpanlar ve negatif sayılar hafızadaki toplamı dinamik olarak değiştirir.
                                </p>
                            </div>
                            <button onClick={startApp} className="group relative px-12 py-5 bg-amber-500 text-slate-950 font-black text-xl rounded-3xl hover:bg-amber-400 transition-all transform hover:scale-105 active:scale-95 shadow-[0_10px_30px_rgba(245,158,11,0.3)] flex items-center gap-4 mx-auto uppercase italic">
                                TIRMANIŞI BAŞLAT <Rocket fill="currentColor" />
                            </button>
                        </motion.div>
                    )}

                    {(status === 'building' || status === 'flashing' || status === 'question') && (
                        <div className="w-full flex flex-col items-center gap-12">
                            {/* Piramit Yapısı */}
                            <div className="flex flex-col-reverse items-center gap-1 relative pt-20">
                                {Array.from({ length: Math.max(...tower.map(t => t.row)) + 1 }).map((_, rIdx) => (
                                    <div key={rIdx} className="flex gap-1">
                                        {tower.filter(t => t.row === rIdx).map((segment) => {
                                            const globalIndex = tower.findIndex(t => t.id === segment.id);
                                            const isActive = globalIndex === currentIndex;
                                            const isPast = globalIndex < currentIndex;
                                            const isQuestionMode = status === 'question';

                                            return (
                                                <motion.div
                                                    key={segment.id}
                                                    initial={{ scale: 0.8, opacity: 0 }}
                                                    animate={{
                                                        scale: (isActive && !isQuestionMode) ? 1.1 : 1,
                                                        opacity: (isQuestionMode && !isPast) ? 0.3 : 1,
                                                        backgroundColor: (isActive && !isQuestionMode)
                                                            ? 'rgba(245,158,11,0.9)'
                                                            : isQuestionMode
                                                                ? 'rgba(245,158,11,0.05)'
                                                                : 'rgba(245,158,11,0.1)'
                                                    }}
                                                    className={`w-28 h-20 rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-300 relative
                                                        ${(isActive && !isQuestionMode) ? 'border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.5)] z-20' : 'border-amber-500/20'}
                                                    `}
                                                >
                                                    <AnimatePresence>
                                                        {(isActive && !isQuestionMode) && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                exit={{ opacity: 0, scale: 2 }}
                                                                className="flex flex-col items-center justify-center"
                                                            >
                                                                <span className={`text-4xl font-black ${segment.isNegative ? 'text-red-900' : 'text-slate-950'}`}>
                                                                    {segment.isNegative ? '-' : ''}{segment.value}
                                                                </span>
                                                                {segment.multiplier && (
                                                                    <span className="absolute -top-3 -right-3 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-full border border-white/20 animate-bounce">
                                                                        x{segment.multiplier}
                                                                    </span>
                                                                )}
                                                                {segment.isNegative && (
                                                                    <TrendingDown size={14} className="text-red-900 absolute top-2 left-2" />
                                                                )}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>

                                                    {!isQuestionMode && !isActive && (
                                                        <Activity size={16} className="text-amber-500/20" />
                                                    )}
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                ))}

                                <AnimatePresence>
                                    {status === 'flashing' && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute -top-10 left-1/2 -translate-x-1/2 bg-amber-500/20 border border-amber-500/30 px-6 py-2 rounded-full text-amber-500 text-xs font-black tracking-widest flex items-center gap-3 backdrop-blur-md"
                                        >
                                            <Zap size={14} className="animate-pulse" /> SİNYAL ANALİZ EDİLİYOR: {currentIndex + 1}/{tower.length}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {status === 'question' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="w-full max-w-3xl space-y-12 bg-slate-900/40 p-12 rounded-[3.5rem] border border-amber-500/20 backdrop-blur-xl"
                                >
                                    <div className="text-center space-y-4">
                                        <div className="flex justify-center gap-4 mb-6">
                                            <Hash className="text-amber-500" size={32} />
                                        </div>
                                        <h3 className="text-3xl font-black text-white italic">
                                            Kulenin toplam <span className="text-amber-500">veri değeri</span> nedir?
                                        </h3>
                                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Hesaplamalara çarpanlar ve negatifler dahil edildi.</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 mt-12">
                                        {options.map((opt, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleSelect(opt)}
                                                className="py-8 bg-slate-800/20 border-2 border-slate-700 hover:border-amber-500/50 hover:bg-amber-500/5 rounded-3xl text-3xl font-black text-white transition-all transform hover:scale-105 active:scale-95 shadow-xl"
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="mt-8 flex items-center justify-center gap-4 text-amber-500/40 font-bold uppercase tracking-widest text-xs">
                                        <Timer size={14} /> GİRİŞ SÜRESİ: {timeLeft}s
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
                                        {feedback === 'correct' ? 'VERİ DOĞRULANDI' : 'HATALI HESAPLAMA'}
                                    </span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {status === 'gameover' && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-10 w-full max-w-2xl bg-slate-900/80 p-16 rounded-[4rem] border-2 border-amber-500/20 shadow-2xl backdrop-blur-3xl">
                            <div className="relative mx-auto w-40 h-40 bg-gradient-to-br from-amber-500 to-amber-700 text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl rotate-12 mb-10 border-4 border-white/10">
                                <Trophy size={100} />
                            </div>
                            <div className="space-y-4">
                                <h2 className="text-6xl font-black text-white italic uppercase tracking-tighter leading-none">TIRMANIŞ SONLANDI</h2>
                                <p className="text-amber-400 font-black text-4xl uppercase tracking-tight">KAZANILAN: {score} XP</p>
                            </div>

                            <div className="space-y-4">
                                <button onClick={startApp} className="w-full py-6 bg-amber-500 text-slate-950 font-black text-2xl rounded-3xl hover:bg-amber-400 transition-all flex items-center justify-center gap-4 shadow-[0_8px_0_#92400e] active:translate-y-2 active:shadow-none mb-4 uppercase italic">
                                    YENİ KULE İNŞA ET <RefreshCw />
                                </button>
                                <Link to="/atolyeler/bireysel-degerlendirme" className="text-amber-500/40 hover:text-amber-500 font-bold block transition-colors tracking-widest uppercase text-sm underline underline-offset-8">Merkez Ofise Dön</Link>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            <style>{`
                .italic { font-style: italic; }
            `}</style>
        </div>
    );
};

export default InvisibleTowerGame;
