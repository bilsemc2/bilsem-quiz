import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer as TimerIcon,
    ChevronLeft, Zap, Heart, FlaskConical, Eye, Sparkles
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useExam } from '../../contexts/ExamContext';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';
import { useSound } from '../../hooks/useSound';

// ============== CONSTANTS ==============
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;

type ShapeType = 'circle' | 'square' | 'triangle' | 'pentagon' | 'hexagon' | 'star' | 'diamond';
type ShapeColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange' | 'cyan';
type ShapeFill = 'solid' | 'outline' | 'striped';

interface ShapeData { id: string; type: ShapeType; color: ShapeColor; fill: ShapeFill; rotation: number; }
interface ShapeGroupData { id: string; shapes: ShapeData[]; }
interface PuzzleData { ruleName: string; ruleDescription: string; examples: ShapeGroupData[]; options: { group: ShapeGroupData; isCorrect: boolean }[]; }

type Phase = 'welcome' | 'playing' | 'feedback' | 'game_over' | 'victory';

const AVAILABLE_SHAPES: ShapeType[] = ['circle', 'square', 'triangle', 'pentagon', 'hexagon', 'star', 'diamond'];
const AVAILABLE_COLORS: ShapeColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'cyan'];
const COLORS_MAP: Record<ShapeColor, string> = { red: '#ef4444', blue: '#60a5fa', green: '#34d399', yellow: '#fbbf24', purple: '#a78bfa', orange: '#fb923c', cyan: '#22d3ee' };

const generateId = () => Math.random().toString(36).substr(2, 9);
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = <T,>(arr: T[]): T => arr[randomInt(0, arr.length - 1)];
const shuffle = <T,>(array: T[]): T[] => [...array].sort(() => Math.random() - 0.5);

const generateShape = (overrides: Partial<ShapeData> = {}): ShapeData => ({
    id: generateId(), type: randomItem(AVAILABLE_SHAPES), color: randomItem(AVAILABLE_COLORS),
    fill: randomItem(['solid', 'outline', 'striped']), rotation: randomInt(0, 360), ...overrides
});

const generateGroup = (count: number, constraintFn: (i: number) => Partial<ShapeData>): ShapeGroupData => {
    const shapes: ShapeData[] = [];
    for (let i = 0; i < count; i++) shapes.push({ ...generateShape(), ...constraintFn(i) });
    return { id: generateId(), shapes };
};

const translateColor = (c: string) => ({ red: 'Kırmızı', blue: 'Mavi', green: 'Yeşil', yellow: 'Sarı', purple: 'Mor', orange: 'Turuncu', cyan: 'Turkuaz' }[c] || c);
const translateType = (t: string) => ({ circle: 'Daire', square: 'Kare', triangle: 'Üçgen', pentagon: 'Beşgen', hexagon: 'Altıgen', star: 'Yıldız', diamond: 'Eşkenar Dörtgen' }[t] || t);

const puzzleSameColor = (): PuzzleData => {
    const target = randomItem(AVAILABLE_COLORS);
    const others = AVAILABLE_COLORS.filter(c => c !== target);
    return {
        ruleName: "Renk Uyumu", ruleDescription: `Tüm şekiller ${translateColor(target)}.`,
        examples: [generateGroup(2, () => ({ color: target })), generateGroup(2, () => ({ color: target }))],
        options: shuffle([{ group: generateGroup(2, () => ({ color: target })), isCorrect: true }, { group: generateGroup(2, () => ({ color: randomItem(others) })), isCorrect: false }, { group: generateGroup(2, () => ({ color: randomItem(others) })), isCorrect: false }, { group: generateGroup(2, () => ({ color: randomItem(others) })), isCorrect: false }])
    };
};

const puzzleSameType = (): PuzzleData => {
    const target = randomItem(AVAILABLE_SHAPES);
    const others = AVAILABLE_SHAPES.filter(t => t !== target);
    return {
        ruleName: "Şekil Benzerliği", ruleDescription: `Tüm şekiller birer ${translateType(target)}.`,
        examples: [generateGroup(2, () => ({ type: target })), generateGroup(2, () => ({ type: target }))],
        options: shuffle([{ group: generateGroup(2, () => ({ type: target })), isCorrect: true }, { group: generateGroup(2, () => ({ type: randomItem(others) })), isCorrect: false }, { group: generateGroup(2, () => ({ type: randomItem(others) })), isCorrect: false }, { group: generateGroup(2, () => ({ type: randomItem(others) })), isCorrect: false }])
    };
};

const puzzleCountMatch = (): PuzzleData => {
    const target = randomInt(1, 4);
    return {
        ruleName: "Sayı Kuralı", ruleDescription: `Grupta tam olarak ${target} adet şekil var.`,
        examples: [generateGroup(target, () => ({})), generateGroup(target, () => ({}))],
        options: shuffle([{ group: generateGroup(target, () => ({})), isCorrect: true }, { group: generateGroup(target === 1 ? 2 : 1, () => ({})), isCorrect: false }, { group: generateGroup(target === 4 ? 3 : 4, () => ({})), isCorrect: false }, { group: generateGroup(target === 2 ? 3 : 2, () => ({})), isCorrect: false }])
    };
};

const getShapePath = (t: ShapeType): string => {
    switch (t) {
        case 'circle': return "M 50,50 m -45,0 a 45,45 0 1,0 90,0 a 45,45 0 1,0 -90,0";
        case 'square': return "M 10,10 H 90 V 90 H 10 Z";
        case 'triangle': return "M 50,10 L 90,90 H 10 Z";
        case 'diamond': return "M 50,5 L 95,50 L 50,95 L 5,50 Z";
        case 'pentagon': return "M 50,5 L 95,38 L 78,90 H 22 L 5,38 Z";
        case 'hexagon': return "M 25,5 L 75,5 L 95,50 L 75,95 L 25,95 L 5,50 Z";
        case 'star': return "M 50,5 L 63,35 L 95,38 L 70,58 L 78,90 L 50,75 L 22,90 L 30,58 L 5,38 L 37,35 Z";
        default: return "";
    }
};

const ShapeView: React.FC<{ data: ShapeData; size?: number }> = ({ data, size = 50 }) => {
    const colorHex = COLORS_MAP[data.color];
    let fillStyle = data.fill === 'solid' ? colorHex : data.fill === 'striped' ? `url(#stripe-${data.id})` : 'none';
    return (
        <div className="inline-flex items-center justify-center" style={{ width: size, height: size, transform: `rotate(${data.rotation}deg)` }}>
            <svg viewBox="0 0 100 100" width="100%" height="100%" className="overflow-visible">
                <defs><pattern id={`stripe-${data.id}`} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="10" stroke={colorHex} strokeWidth="4" /></pattern></defs>
                <path d={getShapePath(data.type)} fill={fillStyle} stroke={colorHex} strokeWidth={4} strokeLinejoin="round" />
            </svg>
        </div>
    );
};

const LogicPuzzleGame: React.FC = () => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();
    const navigate = useNavigate();
    const { submitResult } = useExam();
    const { feedbackState, showFeedback, dismissFeedback } = useGameFeedback({ duration: 1500 });

    const [phase, setPhase] = useState<Phase>('welcome');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [level, setLevel] = useState(1);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const [puzzle, setPuzzle] = useState<PuzzleData | null>(null);
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef(0);
    const hasSavedRef = useRef(false);

    const examMode = location.state?.examMode || false;
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

    const initLevel = useCallback((_lvl: number) => {
        const gens = [puzzleSameColor, puzzleSameType, puzzleCountMatch];
        setPuzzle(randomItem(gens)()); setSelectedIdx(null);
    }, []);

    const handleStart = useCallback(() => {
        window.scrollTo(0, 0);
        setPhase('playing'); setScore(0); setLives(INITIAL_LIVES); setLevel(1);
        setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
        startTimeRef.current = Date.now(); hasSavedRef.current = false;
        initLevel(1); playSound('slide');
    }, [initLevel, playSound, examMode, examTimeLimit]);

    useEffect(() => {
        if ((location.state?.autoStart || examMode) && phase === 'welcome') handleStart();
    }, [location.state, phase, handleStart, examMode]);

    useEffect(() => {
        if (phase === 'playing' && timeLeft > 0) {
            timerRef.current = setInterval(() => setTimeLeft(p => {
                if (p <= 1) { clearInterval(timerRef.current!); setPhase('game_over'); return 0; }
                return p - 1;
            }), 1000);
            return () => clearInterval(timerRef.current!);
        }
    }, [phase, timeLeft]);

    const handleFinish = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (examMode) {
            await submitResult(phase === 'victory' || level >= 5, score, MAX_LEVEL * 100, duration);
            navigate("/atolyeler/sinav-simulasyonu/devam"); return;
        }
        await saveGamePlay({ game_id: 'mantik-bulmacasi', score_achieved: score, duration_seconds: duration, metadata: { level_reached: level, victory: phase === 'victory' } });
    }, [phase, score, level, saveGamePlay, examMode, submitResult, navigate]);

    useEffect(() => { if (phase === 'game_over' || phase === 'victory') handleFinish(); }, [phase, handleFinish]);

    const handleGuess = (i: number) => {
        if (phase !== 'playing' || selectedIdx !== null || !puzzle) return;
        setSelectedIdx(i); const ok = puzzle.options[i].isCorrect;
        showFeedback(ok); playSound(ok ? 'correct' : 'incorrect');

        if (ok) {
            setScore(p => p + 10 * level);
            setTimeout(() => { dismissFeedback(); if (level >= MAX_LEVEL) setPhase('victory'); else { setLevel(l => l + 1); initLevel(level + 1); } }, 1500);
        } else {
            setLives(l => {
                const nl = l - 1;
                if (nl <= 0) setTimeout(() => setPhase('game_over'), 1500);
                else setTimeout(() => { dismissFeedback(); initLevel(level); }, 1500);
                return nl;
            });
        }
    };

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    if (phase === 'welcome') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 flex items-center justify-center p-6 text-white relative overflow-hidden">
                <div className="fixed inset-0 pointer-events-none"><div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" /><div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" /></div>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl relative z-10">
                    <motion.div className="w-28 h-28 rounded-[40%] flex items-center justify-center mx-auto mb-6 shadow-[inset_0_-8px_16px_rgba(0,0,0,0.2),inset_0_8px_16px_rgba(255,255,255,0.3),0_8px_24px_rgba(0,0,0,0.3)] shadow-[inset_0_-8px_16px_rgba(0,0,0,0.2),inset_0_8px_16px_rgba(255,255,255,0.3)]" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #4F46E5 100%)', boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }} animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}><FlaskConical size={52} className="text-white drop-shadow-lg" /></motion.div>
                    <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Mantık Bulmacası</h1>
                    <p className="text-slate-400 mb-8 text-lg">Örnek gruplardaki gizli kuralları keşfet ve aynı kurala uyan yeni grubu bul! Analitik düşünme becerini kanıtla.</p>
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                        <h3 className="text-lg font-bold text-blue-300 mb-3 flex items-center gap-2"><Eye size={20} /> Nasıl Oynanır?</h3>
                        <ul className="space-y-2 text-slate-300 text-sm">
                            <li className="flex items-center gap-2"><Sparkles size={14} className="text-blue-400" /><span>Üstteki örneklerin ortak özelliğini <strong>bul</strong></span></li>
                            <li className="flex items-center gap-2"><Sparkles size={14} className="text-blue-400" /><span>Aynı özelliğe sahip olan seçeneği <strong>işaretle</strong></span></li>
                            <li className="flex items-center gap-2"><Sparkles size={14} className="text-blue-400" /><span>Renk, şekil veya sayı kurallarına dikkat et!</span></li>
                        </ul>
                    </div>
                    <div className="bg-blue-500/10 text-blue-300 text-[10px] px-4 py-2 rounded-full mb-6 inline-block border border-blue-500/30 font-bold uppercase tracking-widest">TUZÖ 5.5.1 Kural Çıkarsama</div>
                    <motion.button whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl font-bold text-xl shadow-2xl"><div className="flex items-center gap-3"><Play size={28} className="fill-white" /><span>Başla</span></div></motion.button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-white relative overflow-hidden">
            <div className="relative z-10 p-4 pt-20">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link to={backLink} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"><ChevronLeft size={20} /><span>{backLabel}</span></Link>
                    {(phase !== 'game_over' && phase !== 'victory') && (
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30"><Star className="text-amber-400 fill-amber-400" size={18} /><span className="font-bold text-amber-400">{score}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30">{Array.from({ length: INITIAL_LIVES }).map((_, i) => (<Heart key={i} size={18} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-900'} />))}</div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 border border-blue-500/30"><TimerIcon className={timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'} size={18} /><span className={`font-bold ${timeLeft < 30 ? 'text-red-400' : 'text-blue-400'}`}>{formatTime(timeLeft)}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(129, 140, 248, 0.2) 0%, rgba(99, 102, 241, 0.1) 100%)', border: '1px solid rgba(129, 140, 248, 0.3)' }}><Zap className="text-indigo-400" size={18} /><span className="font-bold text-indigo-400">Seviye {level}</span></div>
                        </div>
                    )}
                </div>
            </div>
            <div className="relative z-10 flex flex-col items-center justify-center p-4 min-h-[calc(100vh-120px)]">
                <AnimatePresence mode="wait">
                    {(phase === 'playing' || phase === 'feedback') && puzzle && (
                        <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-3xl">
                            <div className="bg-white/5 backdrop-blur-3xl rounded-[32px] p-6 border border-white/10 shadow-3xl mb-6">
                                <h2 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2"><FlaskConical size={16} />REFERANS GRUPLAR</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    {puzzle.examples.map((ex, i) => (
                                        <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center gap-3">
                                            {ex.shapes.map(s => <ShapeView key={s.id} data={s} size={44} />)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {puzzle.options.map((opt, i) => {
                                    const showR = feedbackState !== null; const isSel = selectedIdx === i; const isCor = opt.isCorrect;
                                    return (
                                        <motion.button key={i} whileHover={!showR ? { scale: 1.02, y: -2 } : {}} whileTap={!showR ? { scale: 0.98 } : {}} onClick={() => handleGuess(i)} disabled={showR} className={`p-6 rounded-[32px] flex items-center justify-center gap-3 border transition-all duration-300 ${showR ? (isCor ? 'bg-emerald-500 border-white' : isSel ? 'bg-red-500 border-white' : 'opacity-20 bg-slate-800') : 'bg-white/5 border-white/10 hover:border-blue-400 hover:bg-white/10'}`}>
                                            {opt.group.shapes.map(s => <ShapeView key={s.id} data={s} size={44} />)}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                    {(phase === 'game_over' || phase === 'victory') && (
                        <motion.div key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-xl">
                            <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-indigo-700 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><Trophy size={48} className="text-white" /></motion.div>
                            <h2 className="text-3xl font-bold text-amber-400 mb-2">{phase === 'victory' ? '🎖️ Mantık Ustası!' : 'Tebrikler!'}</h2>
                            <p className="text-slate-400 mb-6">{phase === 'victory' ? 'Soyut düşünme ve kural çözümleme yeteneğin mükemmel!' : 'Daha fazla analizle mantık kurgulama becerini güçlendirebilirsin.'}</p>
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10"><div className="grid grid-cols-2 gap-4"><div className="text-center"><p className="text-slate-400 text-sm">Skor</p><p className="text-2xl font-bold text-amber-400">{score}</p></div><div className="text-center"><p className="text-slate-400 text-sm">Seviye</p><p className="text-2xl font-bold text-indigo-400">{level}/{MAX_LEVEL}</p></div></div></div>
                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl font-bold text-xl mb-4 shadow-2xl"><div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Oyna</span></div></motion.button>
                            <Link to={backLink} className="block text-slate-500 hover:text-white transition-colors">Geri Dön</Link>
                        </motion.div>
                    )}
                </AnimatePresence>
                <GameFeedbackBanner feedback={feedbackState} />
            </div>
        </div>
    );
};

export default LogicPuzzleGame;
