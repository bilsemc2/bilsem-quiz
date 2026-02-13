import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer as TimerIcon,
    CheckCircle2, XCircle, ChevronLeft, Zap, Heart, BrainCircuit, Sparkles, Eye
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import { useSound } from '../../hooks/useSound';
import GameFeedbackBanner from './shared/GameFeedbackBanner';
import { useExam } from '../../contexts/ExamContext';

// ─── Constants ──────────────────────────────────────
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;

// ─── Shape / Color Types ────────────────────────────
type ShapeType = 'Circle' | 'Square' | 'Triangle' | 'Star' | 'Diamond';
type ColorType = 'Red' | 'Blue' | 'Green' | 'Yellow' | 'Purple';

interface GameObject {
    id: string;
    shape: ShapeType;
    color: ColorType;
}

const SHAPES: ShapeType[] = ['Circle', 'Square', 'Triangle', 'Star', 'Diamond'];
const COLORS: ColorType[] = ['Red', 'Blue', 'Green', 'Yellow', 'Purple'];

const SHAPE_NAMES: Record<ShapeType, string> = {
    Circle: 'Daire', Square: 'Kare', Triangle: 'Üçgen', Star: 'Yıldız', Diamond: 'Elmas',
};
const COLOR_NAMES: Record<ColorType, string> = {
    Red: 'Kırmızı', Blue: 'Mavi', Green: 'Yeşil', Yellow: 'Sarı', Purple: 'Mor',
};

const COLOR_VALUES: Record<ColorType, string> = {
    Red: '#ef4444', Blue: '#3b82f6', Green: '#22c55e', Yellow: '#eab308', Purple: '#8b5cf6',
};

// ─── Round Generator ────────────────────────────────
interface RoundData {
    objects: GameObject[];
    instruction: string;
    targetId: string;
}

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const uid = () => Math.random().toString(36).substring(2, 8);

const generateRound = (level: number): RoundData => {
    const count = level <= 5 ? 4 : level <= 12 ? 6 : 8;
    const objects: GameObject[] = [];
    for (let i = 0; i < count; i++) {
        objects.push({ id: uid(), shape: pick(SHAPES), color: pick(COLORS) });
    }

    const comboCounts: Record<string, number> = {};
    objects.forEach(o => {
        const key = `${o.color}-${o.shape}`;
        comboCounts[key] = (comboCounts[key] || 0) + 1;
    });
    const singletons = objects.filter(o => comboCounts[`${o.color}-${o.shape}`] === 1);

    if (singletons.length < 2) return generateRound(level);

    const targetA = pick(singletons);
    let targetB = pick(singletons);
    while (targetB.id === targetA.id) targetB = pick(singletons);

    const logicType = Math.floor(Math.random() * (level < 5 ? 3 : 6));
    let condText = '';
    let condTrue = false;

    switch (logicType) {
        case 0: {
            const test = Math.random() > 0.5 ? pick(objects) : { color: pick(COLORS), shape: pick(SHAPES) };
            condTrue = objects.some(o => o.color === test.color && o.shape === test.shape);
            condText = `bir ${COLOR_NAMES[test.color]} ${SHAPE_NAMES[test.shape]} varsa`;
            break;
        }
        case 1: {
            const c = pick(COLORS);
            const n = objects.filter(o => o.color === c).length;
            const t = Math.max(0, n - 1 + Math.floor(Math.random() * 2));
            condTrue = n > t;
            condText = `${t} tadan fazla ${COLOR_NAMES[c]} nesne varsa`;
            break;
        }
        case 2: {
            const s = pick(SHAPES);
            const n = objects.filter(o => o.shape === s).length;
            const t = Math.max(1, n - 1 + Math.floor(Math.random() * 2));
            condTrue = n < t;
            condText = `${t} tadan az ${SHAPE_NAMES[s]} varsa`;
            break;
        }
        case 3: {
            const c = pick(COLORS);
            condTrue = objects.filter(o => o.color === c).length === 0;
            condText = `hiç ${COLOR_NAMES[c]} nesne yoksa`;
            break;
        }
        case 4: {
            const c1 = pick(COLORS);
            let c2 = pick(COLORS);
            while (c1 === c2) c2 = pick(COLORS);
            condTrue = objects.filter(o => o.color === c1).length > objects.filter(o => o.color === c2).length;
            condText = `${COLOR_NAMES[c1]} nesne sayısı ${COLOR_NAMES[c2]} olanlardan fazlaysa`;
            break;
        }
        case 5: {
            const s = pick(SHAPES);
            const c = pick(COLORS);
            condTrue = objects.filter(o => o.shape === s).length === objects.filter(o => o.color === c).length;
            condText = `${SHAPE_NAMES[s]} sayısı ${COLOR_NAMES[c]} nesne sayısına eşitse`;
            break;
        }
    }

    const finalTarget = condTrue ? targetA : targetB;
    const descA = `${COLOR_NAMES[targetA.color]} ${SHAPE_NAMES[targetA.shape]}`;
    const descB = `${COLOR_NAMES[targetB.color]} ${SHAPE_NAMES[targetB.shape]}`;
    const instruction = `Eğer ${condText}, ${descA} nesnesini seç, değilse ${descB} nesnesini seç.`;

    return { objects, instruction, targetId: finalTarget.id };
};

// ─── ShapeIcon ──────────────────────────────────────
const ShapeIcon: React.FC<{ shape: ShapeType; color: ColorType; size?: number }> = ({ shape, color, size = 64 }) => {
    const fill = COLOR_VALUES[color];
    const s = size;

    switch (shape) {
        case 'Circle': return (<svg width={s} height={s} viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill={fill} stroke="rgba(255,255,255,0.3)" strokeWidth="3" /><ellipse cx="40" cy="35" rx="14" ry="8" fill="rgba(255,255,255,0.25)" transform="rotate(-20 40 35)" /></svg>);
        case 'Square': return (<svg width={s} height={s} viewBox="0 0 100 100"><rect x="12" y="12" width="76" height="76" rx="12" fill={fill} stroke="rgba(255,255,255,0.3)" strokeWidth="3" /><rect x="20" y="18" width="28" height="12" rx="4" fill="rgba(255,255,255,0.2)" /></svg>);
        case 'Triangle': return (<svg width={s} height={s} viewBox="0 0 100 100"><polygon points="50,10 90,85 10,85" fill={fill} stroke="rgba(255,255,255,0.3)" strokeWidth="3" /><polygon points="50,24 36,55 50,55" fill="rgba(255,255,255,0.2)" /></svg>);
        case 'Star': return (<svg width={s} height={s} viewBox="0 0 100 100"><polygon points="50,5 61,35 95,35 68,55 79,88 50,68 21,88 32,55 5,35 39,35" fill={fill} stroke="rgba(255,255,255,0.3)" strokeWidth="3" /><polygon points="50,18 55,33 45,33" fill="rgba(255,255,255,0.2)" /></svg>);
        case 'Diamond': return (<svg width={s} height={s} viewBox="0 0 100 100"><polygon points="50,8 92,50 50,92 8,50" fill={fill} stroke="rgba(255,255,255,0.3)" strokeWidth="3" /><polygon points="50,20 38,50 50,50" fill="rgba(255,255,255,0.2)" /></svg>);
        default: return null;
    }
};

type Phase = 'welcome' | 'playing' | 'feedback' | 'game_over' | 'victory';

const ConditionalLogicGame: React.FC = () => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const { submitResult } = useExam();
    const { feedbackState, showFeedback, dismissFeedback } = useGameFeedback({ duration: 1000 });
    const location = useLocation();
    const navigate = useNavigate();

    const examMode = location.state?.examMode || false;
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

    const [phase, setPhase] = useState<Phase>('welcome');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [level, setLevel] = useState(1);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const [round, setRound] = useState<RoundData | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);
    const hasSavedRef = useRef(false);

    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    useEffect(() => {
        if (phase === 'playing' && timeLeft > 0) {
            timerRef.current = setTimeout(() => setTimeLeft(p => p - 1), 1000);
        } else if (timeLeft === 0 && phase === 'playing') {
            handleGameOver();
        }
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [phase, timeLeft]);

    useEffect(() => {
        if (phase === 'playing' && !selectedId) {
            setRound(generateRound(level));
        }
    }, [phase, level, selectedId]);

    const handleStart = useCallback(() => {
        window.scrollTo(0, 0);
        setPhase('playing');
        setScore(0);
        setLives(INITIAL_LIVES);
        setLevel(1);
        setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
        startTimeRef.current = Date.now();
        hasSavedRef.current = false;
        setSelectedId(null);
    }, [examMode, examTimeLimit]);

    useEffect(() => {
        if ((location.state?.autoStart || examMode) && phase === 'welcome') handleStart();
    }, [location.state, examMode, phase, handleStart]);

    const handleGameOver = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        setPhase('game_over');
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (examMode) {
            await submitResult(level >= 5, score, MAX_LEVEL * 100, duration);
            navigate('/atolyeler/sinav-simulasyonu/devam');
            return;
        }
        await saveGamePlay({
            game_id: 'kosullu-yonerge',
            score_achieved: score,
            duration_seconds: duration,
            metadata: { levels_completed: level, final_lives: lives, game_name: 'Koşullu Yönerge' },
        });
    }, [saveGamePlay, score, level, lives, examMode, submitResult, navigate]);

    const handleVictory = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        setPhase('victory');
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (examMode) {
            await submitResult(true, score, MAX_LEVEL * 100, duration);
            navigate('/atolyeler/sinav-simulasyonu/devam');
            return;
        }
        await saveGamePlay({
            game_id: 'kosullu-yonerge',
            score_achieved: score,
            duration_seconds: duration,
            metadata: { levels_completed: MAX_LEVEL, victory: true, game_name: 'Koşullu Yönerge' },
        });
    }, [saveGamePlay, score, examMode, submitResult, navigate]);

    const handleObjectClick = useCallback((id: string) => {
        if (!round || phase !== 'playing' || selectedId) return;
        const correct = id === round.targetId;
        setSelectedId(id);
        showFeedback(correct);
        setPhase('feedback');
        playSound(correct ? 'correct' : 'incorrect');

        setTimeout(() => {
            dismissFeedback();
            if (correct) {
                setScore(s => s + 10 * level);
                if (level >= MAX_LEVEL) handleVictory();
                else setLevel(l => l + 1);
            } else {
                const nl = lives - 1;
                setLives(nl);
                if (nl <= 0) handleGameOver();
                else setRound(generateRound(level));
            }
            setSelectedId(null);
            if (lives > 0 && level < MAX_LEVEL) setPhase('playing');
        }, 1200);
    }, [round, phase, selectedId, score, lives, level, handleGameOver, handleVictory, playSound, showFeedback, dismissFeedback]);

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" /><div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
            </div>
            <div className="relative z-10 p-4 pt-20">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link to={backLink} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"><ChevronLeft size={20} /><span>{backLabel}</span></Link>
                    {(phase === 'playing' || phase === 'feedback') && (
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)', border: '1px solid rgba(251, 191, 36, 0.3)' }}><Star className="text-amber-400 fill-amber-400" size={18} /><span className="font-bold text-amber-400">{score}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>{Array.from({ length: INITIAL_LIVES }).map((_, i) => (<Heart key={i} size={18} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-900'} />))}</div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.1) 100%)', border: '1px solid rgba(59, 130, 246, 0.3)' }}><TimerIcon className={timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'} size={18} /><span className={`font-bold ${timeLeft < 30 ? 'text-red-400' : 'text-blue-400'}`}>{formatTime(timeLeft)}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(79, 70, 229, 0.1) 100%)', border: '1px solid rgba(99, 102, 241, 0.3)' }}><Zap className="text-indigo-400" size={18} /><span className="font-bold text-indigo-400">{level}/{MAX_LEVEL}</span></div>
                        </div>
                    )}
                </div>
            </div>
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-4">
                <AnimatePresence mode="wait">
                    {phase === 'welcome' && (
                        <motion.div key="welcome" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
                            <motion.div className="w-28 h-28 rounded-[40%] flex items-center justify-center mx-auto mb-6" style={{ background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }} animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}><BrainCircuit size={52} className="text-white drop-shadow-lg" /></motion.div>
                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">Koşullu Yönerge</h1>
                            <p className="text-slate-400 mb-8">Mantık yönergesini oku, koşulu değerlendir ve doğru nesneyi seç! Hızlı ve hatasız düşünerek puan kazan.</p>
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                                <h3 className="text-lg font-bold text-indigo-300 mb-3 flex items-center gap-2"><Eye size={20} /> Nasıl Oynanır?</h3>
                                <ul className="space-y-2 text-slate-300 text-sm">
                                    <li className="flex items-center gap-2"><Sparkles size={14} className="text-indigo-400" /><span>Üstteki mavi renkli yönergeyi dikkatle oku</span></li>
                                    <li className="flex items-center gap-2"><Sparkles size={14} className="text-indigo-400" /><span>Yönergeye göre hangi nesneyi seçmen gerektiğini bul</span></li>
                                    <li className="flex items-center gap-2"><Sparkles size={14} className="text-indigo-400" /><span>Aşağıdaki nesnelerden doğru olanına tıkla!</span></li>
                                </ul>
                            </div>
                            <div className="bg-indigo-500/10 text-indigo-300 text-[10px] px-4 py-2 rounded-full mb-6 inline-block border border-indigo-500/30 font-bold uppercase tracking-widest">TUZÖ 5.5.2 Koşullu Çıkarım</div>
                            <motion.button whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 rounded-2xl font-bold text-xl" style={{ background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)' }}><div className="flex items-center gap-3"><Play size={28} className="fill-white" /><span>Başla</span></div></motion.button>
                        </motion.div>
                    )}
                    {(phase === 'playing' || phase === 'feedback') && round && (
                        <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-4xl">
                            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="p-6 sm:p-8 rounded-[32px] bg-gradient-to-br from-indigo-600/80 to-blue-700/80 backdrop-blur-2xl border border-white/20 shadow-2xl mb-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10"><BrainCircuit size={100} /></div>
                                <div className="relative z-10 flex items-start gap-4 text-white">
                                    <Zap className="text-amber-400 flex-shrink-0 mt-1" size={24} />
                                    <p className="text-lg sm:text-2xl font-black leading-tight drop-shadow-md">{round.instruction}</p>
                                </div>
                            </motion.div>
                            <div className={`grid gap-4 sm:gap-6 ${round.objects.length <= 4 ? 'grid-cols-2 lg:grid-cols-4' : round.objects.length <= 6 ? 'grid-cols-3 lg:grid-cols-3' : 'grid-cols-4 lg:grid-cols-4'}`}>
                                {round.objects.map((obj, idx) => {
                                    const isSelected = selectedId === obj.id;
                                    const showResults = phase === 'feedback';
                                    const isTarget = obj.id === round.targetId;
                                    return (<motion.button key={obj.id} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: idx * 0.05 }} disabled={phase !== 'playing'} onClick={() => handleObjectClick(obj.id)} className={`aspect-square rounded-[32px] border-2 flex flex-col items-center justify-center relative transition-all duration-300 ${isSelected ? 'ring-4 ring-white shadow-[0_0_30px_rgba(255,255,255,0.4)]' : 'shadow-xl'} ${showResults && isTarget && !isSelected ? 'ring-4 ring-emerald-400/50 scale-105' : ''}`} style={{ background: isSelected ? (feedbackState?.correct ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)') : 'rgba(255,255,255,0.05)', borderColor: isSelected ? (feedbackState?.correct ? '#10B981' : '#EF4444') : 'rgba(255,255,255,0.1)' }} whileHover={phase === 'playing' ? { scale: 1.05, y: -4 } : {}} whileTap={phase === 'playing' ? { scale: 0.95 } : {}}><ShapeIcon shape={obj.shape} color={obj.color} size={round.objects.length > 6 ? 56 : 72} />{showResults && isSelected && (<div className="absolute top-3 right-3">{feedbackState?.correct ? <CheckCircle2 className="text-emerald-400" size={24} /> : <XCircle className="text-red-400" size={24} />}</div>)}</motion.button>);
                                })}
                            </div>
                        </motion.div>
                    )}
                    {(phase === 'game_over' || phase === 'victory') && (
                        <motion.div key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
                            <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><Trophy size={48} className="text-white" /></motion.div>
                            <h2 className="text-3xl font-bold text-amber-400 mb-2">{phase === 'victory' ? '🎖️ Mantık Ustası!' : 'Harika Deneme!'}</h2>
                            <p className="text-slate-400 mb-6">{phase === 'victory' ? 'Tüm mantık yönergelerini kusursuz takip ettin!' : 'Daha fazla odaklanarak rekorunu tazeleyebilirsin!'}</p>
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10"><div className="grid grid-cols-2 gap-4"><div className="text-center"><p className="text-slate-400 text-sm">Skor</p><p className="text-2xl font-bold text-amber-400">{score}</p></div><div className="text-center"><p className="text-slate-400 text-sm">Seviye</p><p className="text-2xl font-bold text-emerald-400">{level}/{MAX_LEVEL}</p></div></div></div>
                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-indigo-500 to-indigo-700 rounded-2xl font-bold text-xl mb-4" style={{ boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)' }}><div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Oyna</span></div></motion.button>
                            <Link to={backLink} className="block text-slate-500 hover:text-white transition-colors">{location.state?.arcadeMode ? 'Bilsem Zeka' : 'Geri Dön'}</Link>
                        </motion.div>
                    )}
                </AnimatePresence>
                <GameFeedbackBanner feedback={feedbackState} />
            </div>
        </div>
    );
};

export default ConditionalLogicGame;
