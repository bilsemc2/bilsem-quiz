import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Shield, Eye, Timer, Trophy,
    RefreshCw, ChevronLeft, Rocket,
    Circle, Square, Triangle, Hexagon, Star, Pentagon,
    Cross, Moon, Heart, AlertCircle, Brain
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useSound } from '../../hooks/useSound';
import { useGamePersistence } from '../../hooks/useGamePersistence';

// --- Şekil ve Renk Havuzu ---
const SHAPE_ICONS = [Circle, Square, Triangle, Hexagon, Star, Pentagon, Cross, Moon, Heart];
const COLORS = ['#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#EC4899', '#8B5CF6', '#FFFFFF'];

const SUCCESS_MESSAGES = [
    "Harika Gözlem!",
    "Tebrikler Dedektif!",
    "İpucu Yakalandı!",
    "Keskin Bir Bakış!",
    "Hedef Tam İsabet!",
    "Kusursuz Analiz!"
];

const FAILURE_MESSAGES = [
    "İpucu Kaçırıldı!",
    "Dikkatli Bak!",
    "Hedef Şaştı!",
    "Gözden Kaçtı!",
    "Yanlış İz!",
    "Soruşturma Sürüyor..."
];

interface PatternItem {
    id: string;
    iconIdx: number;
    color: string;
    x: number;
    y: number;
    rotation: number;
    scale: number;
}

type GameStatus = 'waiting' | 'preview' | 'deciding' | 'result' | 'gameover';

const ShadowDetectiveGame: React.FC = () => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();
    const [status, setStatus] = useState<GameStatus>('waiting');
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [correctPattern, setCorrectPattern] = useState<PatternItem[]>([]);
    const [options, setOptions] = useState<PatternItem[][]>([]);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState(45);
    const [previewTimer, setPreviewTimer] = useState(3);
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
    const [feedbackMsg, setFeedbackMsg] = useState("");
    const gameStartTimeRef = useRef<number>(0);

    // --- Uniklik İmzası Üretme ---
    const getPatternSignature = (items: PatternItem[]) => {
        return items
            .map(i => {
                let normalizedRotation = i.rotation;
                switch (i.iconIdx) {
                    case 0: normalizedRotation = 0; break;
                    case 1:
                    case 6: normalizedRotation = i.rotation % 90; break;
                    case 2: normalizedRotation = i.rotation % 120; break;
                    case 3: normalizedRotation = i.rotation % 60; break;
                    case 4:
                    case 5: normalizedRotation = i.rotation % 72; break;
                }
                return `${i.iconIdx}-${i.color}-${Math.round(i.x)}-${Math.round(i.y)}-${normalizedRotation}`;
            })
            .sort()
            .join('|');
    };

    // --- Desen Üretme Mantığı ---
    const generatePattern = useCallback((count: number) => {
        const pattern: PatternItem[] = [];
        const MIN_DIST = 25;

        for (let i = 0; i < count; i++) {
            let x: number, y: number, isTooClose: boolean, attempts = 0;
            do {
                x = Math.random() * 70 + 15;
                y = Math.random() * 70 + 15;
                isTooClose = pattern.some(p => Math.sqrt(Math.pow(p.x - x, 2) + Math.pow(p.y - y, 2)) < MIN_DIST);
                attempts++;
            } while (isTooClose && attempts < 50);

            pattern.push({
                id: Math.random().toString(36).substr(2, 9),
                iconIdx: Math.floor(Math.random() * SHAPE_ICONS.length),
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                x, y,
                rotation: Math.floor(Math.random() * 8) * 45,
                scale: 0.9 + Math.random() * 0.5
            });
        }
        return pattern;
    }, []);

    const generateDistractor = (base: PatternItem[]) => {
        const distractor: PatternItem[] = JSON.parse(JSON.stringify(base));
        const targetIdx = Math.floor(Math.random() * distractor.length);
        const mutationType = Math.floor(Math.random() * 4);

        switch (mutationType) {
            case 0:
                const otherColors = COLORS.filter(c => c !== distractor[targetIdx].color);
                distractor[targetIdx].color = otherColors[Math.floor(Math.random() * otherColors.length)];
                break;
            case 1:
                if (distractor[targetIdx].iconIdx === 0) {
                    distractor[targetIdx].iconIdx = (distractor[targetIdx].iconIdx + 2) % SHAPE_ICONS.length;
                } else {
                    distractor[targetIdx].rotation = (distractor[targetIdx].rotation + 180) % 360;
                }
                break;
            case 2:
                distractor[targetIdx].iconIdx = (distractor[targetIdx].iconIdx + 3) % SHAPE_ICONS.length;
                break;
            case 3:
                const moveX = distractor[targetIdx].x > 50 ? -25 : 25;
                const moveY = distractor[targetIdx].y > 50 ? -25 : 25;
                distractor[targetIdx].x = Math.max(15, Math.min(85, distractor[targetIdx].x + moveX));
                distractor[targetIdx].y = Math.max(15, Math.min(85, distractor[targetIdx].y + moveY));
                break;
        }
        return distractor;
    };

    const startNewLevel = useCallback(() => {
        const shapeCount = Math.min(6, 2 + Math.floor(level / 3));
        const correct = generatePattern(shapeCount);
        const correctSig = getPatternSignature(correct);
        const opts = [correct];
        const sigs = new Set([correctSig]);

        let attempts = 0;
        while (opts.length < 4 && attempts < 20) {
            const dist = generateDistractor(correct);
            const sig = getPatternSignature(dist);
            if (!sigs.has(sig)) {
                opts.push(dist);
                sigs.add(sig);
            }
            attempts++;
        }

        setCorrectPattern(correct);
        setOptions(opts.sort(() => Math.random() - 0.5));
        setSelectedIndex(null);
        setPreviewTimer(3);
        setStatus('preview');
        playSound('detective_click');
    }, [level, generatePattern, playSound]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (status === 'preview' && previewTimer > 0) {
            interval = setInterval(() => setPreviewTimer(prev => prev - 1), 1000);
        } else if (status === 'preview' && previewTimer === 0) {
            setStatus('deciding');
            playSound('detective_mystery');
        }
        return () => clearInterval(interval);
    }, [status, previewTimer, playSound]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (status === 'deciding' && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0 && status === 'deciding') {
            setStatus('gameover');
        }
        return () => clearInterval(interval);
    }, [status, timeLeft]);

    const handleSelect = (idx: number) => {
        if (status !== 'deciding') return;
        setSelectedIndex(idx);
        const isCorrect = getPatternSignature(options[idx]) === getPatternSignature(correctPattern);

        if (isCorrect) {
            setFeedback('correct');
            setFeedbackMsg(SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)]);
            setScore(prev => prev + (level * 100));
            playSound('detective_correct');
            setStatus('result');
            setTimeout(() => {
                setLevel(prev => prev + 1);
                setFeedback(null);
                startNewLevel();
            }, 1500);
        } else {
            setFeedback('wrong');
            setFeedbackMsg(FAILURE_MESSAGES[Math.floor(Math.random() * FAILURE_MESSAGES.length)]);
            playSound('detective_incorrect');
            setTimeout(() => {
                setFeedback(null);
                setStatus('gameover');
            }, 1500);
        }
    };

    const startApp = useCallback(() => {
        setLevel(1);
        setScore(0);
        setTimeLeft(60);
        setFeedback(null);
        startNewLevel();
    }, [startNewLevel]);

    // Handle Auto Start from HUB
    useEffect(() => {
        if (location.state?.autoStart && status === 'waiting') {
            startApp();
        }
    }, [location.state, status, startApp]);

    // Oyun başladığında süre başlat
    useEffect(() => {
        if (status === 'preview') {
            gameStartTimeRef.current = Date.now();
        }
    }, [status]);

    // Oyun bittiğinde verileri kaydet
    useEffect(() => {
        if (status === 'gameover' && gameStartTimeRef.current > 0) {
            const durationSeconds = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
            saveGamePlay({
                game_id: 'golge-dedektifi',
                score_achieved: score,
                duration_seconds: durationSeconds,
                metadata: {
                    level_reached: level,
                    game_name: 'Gölge Dedektifi',
                }
            });
        }
    }, [status, score, level, saveGamePlay]);

    const renderPattern = (items: PatternItem[], size: number = 300) => (
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 shadow-inner border border-white/5" style={{ width: size, height: size }}>
            {items.map((item) => {
                const Icon = SHAPE_ICONS[item.iconIdx];
                return (
                    <motion.div
                        key={item.id}
                        initial={status === 'preview' ? { scale: 0, opacity: 0 } : false}
                        animate={{ scale: item.scale, opacity: 1 }}
                        style={{
                            position: 'absolute',
                            left: `${item.x}%`,
                            top: `${item.y}%`,
                            color: item.color,
                            transform: `translate(-50%, -50%) rotate(${item.rotation}deg)`
                        }}
                    >
                        <Icon size={size / 10} strokeWidth={3} />
                    </motion.div>
                );
            })}
        </div>
    );

    return (
        <div className="min-h-screen pt-24 pb-12 px-6 relative overflow-hidden font-sans" style={{ background: '#0F172A' }}>
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]" />
            </div>

            <div className="container mx-auto max-w-5xl relative z-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 border-b border-amber-500/20 pb-8">
                    <div className="flex items-center gap-5">
                        <Link to="/atolyeler/bireysel-degerlendirme" className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all text-amber-500 border border-amber-500/20">
                            <ChevronLeft />
                        </Link>
                        <div>
                            <h1 className="text-4xl font-black tracking-tighter text-white flex items-center gap-3">
                                GÖLGE <span className="text-amber-500 italic">DEDEKTİFİ</span>
                            </h1>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em] mt-1 pl-1">Vaka Dosyası - 003 / Görsel Kanıt</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-slate-900/80 border border-amber-500/20 px-8 py-3 rounded-2xl text-center shadow-2xl backdrop-blur-xl">
                            <div className="text-[10px] uppercase text-white/40 font-black mb-1">Vaka Seviyesi</div>
                            <div className="text-2xl font-black text-amber-500">{level}</div>
                        </div>
                        <div className="bg-slate-900/80 border border-amber-500/20 px-8 py-3 rounded-2xl text-center shadow-2xl backdrop-blur-xl">
                            <div className="text-[10px] uppercase text-white/40 font-black mb-1">Puan</div>
                            <div className="text-2xl font-black text-white">{score}</div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center min-h-[500px]">
                    {status === 'waiting' && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-10">
                            <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
                                <Search size={100} className="text-amber-500 animate-pulse" />
                                <Shield className="absolute bottom-0 right-0 text-amber-400" size={40} />
                            </div>
                            <div className="max-w-md mx-auto space-y-4">
                                <h2 className="text-3xl font-black text-white">SIRRI ÇÖZMEYE HAZIR MISIN?</h2>
                                <p className="text-slate-400 font-medium leading-relaxed italic">
                                    Karmaşık bir desen 3 saniye boyunca gösterilecek. Tüm detayları zihnine kazı ve seçenekler arasından "tıpatıp aynısını" bul.
                                </p>
                            </div>
                            <button onClick={startApp} className="px-12 py-5 bg-amber-500 text-slate-950 font-black text-xl rounded-3xl hover:bg-amber-400 transition-all transform hover:scale-105 active:scale-95 shadow-[0_10px_30px_rgba(245,158,11,0.3)] flex items-center gap-4 mx-auto uppercase">
                                SORUŞTURMAYI BAŞLAT <Rocket fill="currentColor" />
                            </button>
                        </motion.div>
                    )}

                    {status === 'preview' && (
                        <div className="text-center space-y-12">
                            <div className="flex items-center justify-center gap-4 text-amber-500 font-bold uppercase tracking-widest text-xl mb-4">
                                <Eye className="animate-pulse" /> Kanıtı İncele: {previewTimer}s
                            </div>
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="p-8 bg-amber-500/10 rounded-[4rem] border-4 border-amber-500/20 shadow-[0_0_100px_rgba(245,158,11,0.15)]"
                            >
                                {renderPattern(correctPattern, 400)}
                            </motion.div>
                            <div className="w-full bg-slate-800 h-2 rounded-full max-w-sm mx-auto overflow-hidden">
                                <motion.div
                                    className="bg-amber-500 h-full"
                                    initial={{ width: "100%" }}
                                    animate={{ width: "0%" }}
                                    transition={{ duration: 3, ease: "linear" }}
                                />
                            </div>
                        </div>
                    )}

                    {(status === 'deciding' || status === 'result') && (
                        <div className="w-full space-y-12">
                            <div className="flex items-center justify-center gap-8">
                                <div className="flex items-center gap-4 bg-slate-900 border border-amber-500/20 px-8 py-3 rounded-2xl shadow-xl">
                                    <Timer className={timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-amber-500'} />
                                    <span className={`text-2xl font-black ${timeLeft < 10 ? 'text-red-500' : 'text-white'}`}>{timeLeft}s</span>
                                </div>
                                <div className="text-white/60 font-black text-sm uppercase tracking-widest italic">Hangisi Az Önceki Kanıtla Aynıydı?</div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {options.map((item, idx) => {
                                    const isSelected = selectedIndex === idx;
                                    const isItemCorrect = getPatternSignature(item) === getPatternSignature(correctPattern);
                                    let borderColor = 'border-white/5 hover:border-amber-500/40';
                                    if (selectedIndex !== null) {
                                        if (isSelected) {
                                            borderColor = isItemCorrect ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_40px_rgba(16,185,129,0.3)]' : 'border-red-500 bg-red-500/10 shadow-[0_0_40px_rgba(239,68,68,0.3)]';
                                        } else if (isItemCorrect && feedback === 'wrong') {
                                            borderColor = 'border-emerald-500/50 bg-emerald-500/5';
                                        }
                                    }
                                    return (
                                        <motion.button
                                            key={idx}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            onClick={() => handleSelect(idx)}
                                            disabled={selectedIndex !== null}
                                            className={`group relative p-4 bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] border-2 transition-all active:scale-95 ${borderColor} ${selectedIndex !== null ? 'cursor-default' : 'cursor-pointer'}`}
                                        >
                                            <div className="flex flex-col items-center">
                                                {renderPattern(item, 200)}
                                                <div className="mt-4 text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-amber-500 transition-colors">Seçenek {idx + 1}</div>
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <AnimatePresence>
                        {feedback && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                                className="fixed inset-0 flex items-center justify-center pointer-events-none z-[110] px-6"
                            >
                                <div className={`px-10 py-6 rounded-[2.5rem] border-4 shadow-2xl backdrop-blur-2xl ${feedback === 'correct' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-red-500/20 border-red-500 text-red-500'}`}>
                                    <div className="flex flex-col items-center gap-3">
                                        <motion.div animate={{ rotate: feedback === 'correct' ? [0, 10, -10, 0] : [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 0.5 }}>
                                            {feedback === 'correct' ? <Brain size={48} className="drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" /> : <AlertCircle size={48} className="drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />}
                                        </motion.div>
                                        <h3 className="text-3xl font-black text-center uppercase tracking-tighter italic">{feedbackMsg}</h3>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {status === 'gameover' && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8 w-full max-w-2xl bg-slate-900/80 p-16 rounded-[4rem] border-2 border-red-500/20 shadow-2xl backdrop-blur-3xl">
                            <div className="relative mx-auto w-40 h-40 bg-gradient-to-br from-red-500 to-amber-700 text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl rotate-12 mb-10 border-4 border-white/10">
                                <Trophy size={100} />
                            </div>
                            <h2 className="text-6xl font-black text-white italic uppercase tracking-tighter">DOSYA KAPANDI</h2>
                            <p className="text-amber-500 font-black text-4xl mb-12">TOPLAM PUAN: {score}</p>
                            <div className="space-y-4">
                                <button onClick={startApp} className="w-full py-6 bg-amber-500 text-slate-950 font-black text-2xl rounded-3xl hover:bg-amber-400 transition-all flex items-center justify-center gap-4 shadow-[0_8px_0_#92400E] active:translate-y-2 active:shadow-none mb-4 uppercase">
                                    SORUŞTURMAYI YENİLE <RefreshCw />
                                </button>
                                <Link to="/atolyeler/bireysel-degerlendirme" className="text-slate-500 hover:text-amber-500 font-bold block transition-colors tracking-widest uppercase text-sm">Merkez Ofise Dön</Link>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
            <style>{`.italic { font-style: italic; }`}</style>
        </div>
    );
};

export default ShadowDetectiveGame;
