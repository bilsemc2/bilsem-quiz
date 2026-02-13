import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer as TimerIcon,
    CheckCircle2, XCircle, ChevronLeft, Zap, Heart, Sparkles, Eye
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

// ─── Creature Types ─────────────────────────────────
type CreatureColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple';
type CreatureShape = 'fluff' | 'slime' | 'block' | 'spiky';
type CreatureAccessory = 'none' | 'hat' | 'glasses' | 'bowtie' | 'crown';
type CreatureEmotion = 'happy' | 'sad' | 'surprised' | 'sleepy' | 'angry';

interface Creature {
    id: number;
    color: CreatureColor;
    shape: CreatureShape;
    accessory: CreatureAccessory;
    emotion: CreatureEmotion;
}

const ALL_COLORS: CreatureColor[] = ['red', 'blue', 'green', 'yellow', 'purple'];
const ALL_SHAPES: CreatureShape[] = ['fluff', 'slime', 'block', 'spiky'];
const ALL_ACCESSORIES: CreatureAccessory[] = ['none', 'hat', 'glasses', 'bowtie', 'crown'];
const ALL_EMOTIONS: CreatureEmotion[] = ['happy', 'sad', 'surprised', 'sleepy', 'angry'];

const COLOR_VALUES: Record<CreatureColor, string> = { red: '#ef4444', blue: '#3b82f6', green: '#22c55e', yellow: '#f59e0b', purple: '#8b5cf6' };
const STROKE_VALUES: Record<CreatureColor, string> = { red: '#991b1b', blue: '#1e40af', green: '#166534', yellow: '#b45309', purple: '#6d28d9' };

const TR = {
    colors: { red: 'kırmızı', blue: 'mavi', green: 'yeşil', yellow: 'sarı', purple: 'mor' } as Record<CreatureColor, string>,
    colorsAcc: { red: 'kırmızıları', blue: 'mavileri', green: 'yeşilleri', yellow: 'sarıları', purple: 'morları' } as Record<CreatureColor, string>,
    shapes: { fluff: 'pofuduk', slime: 'jöle', block: 'köşeli', spiky: 'dikenli' } as Record<CreatureShape, string>,
    accessories: { none: 'aksesuarsız', hat: 'şapkalı', glasses: 'gözlüklü', bowtie: 'papyonlu', crown: 'taçlı' } as Record<CreatureAccessory, string>,
    emotions: { happy: 'mutlu', sad: 'üzgün', surprised: 'şaşkın', sleepy: 'uykulu', angry: 'kızgın' } as Record<CreatureEmotion, string>,
};

const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
const cap = (s: string) => s.charAt(0).toLocaleUpperCase('tr-TR') + s.slice(1);

// ─── Rule Engine ────────────────────────────────────
interface RuleResult { instruction: string; predicate: (c: Creature) => boolean; }

const easyRule = (): RuleResult => {
    const t = Math.floor(Math.random() * 4);
    if (t === 0) { const v = pick(ALL_COLORS); return { instruction: `${cap(TR.colors[v])} renkli tüm yaratıkları seç.`, predicate: c => c.color === v }; }
    if (t === 1) { const v = pick(ALL_SHAPES); return { instruction: `${cap(TR.shapes[v])} olan tüm yaratıkları seç.`, predicate: c => c.shape === v }; }
    if (t === 2) { const v = pick(ALL_ACCESSORIES); return { instruction: v === 'none' ? 'Aksesuarı olmayan tüm yaratıkları seç.' : `${cap(TR.accessories[v])} tüm yaratıkları seç.`, predicate: c => c.accessory === v }; }
    const v = pick(ALL_EMOTIONS); return { instruction: `${cap(TR.emotions[v])} görünen tüm yaratıkları seç.`, predicate: c => c.emotion === v };
};

const mediumRule = (): RuleResult => {
    if (Math.random() > 0.5) {
        const co = pick(ALL_COLORS); const ac = pick(ALL_ACCESSORIES);
        const acT = ac === 'none' ? 'aksesuarsız' : TR.accessories[ac];
        return { instruction: `${cap(TR.colors[co])} ve ${acT} olanları seç.`, predicate: c => c.color === co && c.accessory === ac };
    }
    const co = pick(ALL_COLORS); const sh = pick(ALL_SHAPES);
    return { instruction: `${cap(TR.colors[co])} olan ama ${TR.shapes[sh]} olmayanları seç.`, predicate: c => c.color === co && c.shape !== sh };
};

const hardRule = (creatures: Creature[]): RuleResult => {
    if (Math.random() > 0.5) {
        const ck = pick(ALL_COLORS); const t1 = pick(ALL_COLORS); let t2 = pick(ALL_COLORS);
        while (t2 === t1) t2 = pick(ALL_COLORS);
        const exists = creatures.some(c => c.color === ck);
        return {
            instruction: `Eğer ekranda en az bir ${TR.colors[ck]} yaratık varsa ${TR.colorsAcc[t1]} seç, yoksa ${TR.colorsAcc[t2]} seç.`,
            predicate: c => exists ? c.color === t1 : c.color === t2,
        };
    }
    const c1 = pick(ALL_COLORS); const s1 = pick(ALL_SHAPES);
    let c2 = pick(ALL_COLORS); while (c2 === c1) c2 = pick(ALL_COLORS);
    const s2 = pick(ALL_SHAPES);
    return {
        instruction: `${cap(TR.colors[c1])} ${TR.shapes[s1]} VEYA ${TR.colors[c2]} ${TR.shapes[s2]} olanları seç.`,
        predicate: c => (c.color === c1 && c.shape === s1) || (c.color === c2 && c.shape === s2),
    };
};

const generateRound = (level: number): RoundData => {
    const count = level <= 5 ? 6 : level <= 12 ? 9 : 12;
    const diff = level <= 6 ? 'easy' : level <= 13 ? 'medium' : 'hard';
    let creatures: Creature[], rule: RuleResult, targetIds: number[];
    let attempts = 0;
    do {
        creatures = Array.from({ length: count }, (_, i) => ({
            id: i + 1, color: pick(ALL_COLORS), shape: pick(ALL_SHAPES), accessory: pick(ALL_ACCESSORIES), emotion: pick(ALL_EMOTIONS),
        }));
        rule = diff === 'hard' ? hardRule(creatures) : diff === 'medium' ? mediumRule() : easyRule();
        targetIds = creatures.filter(rule.predicate).map(c => c.id);
        attempts++;
    } while (targetIds.length === 0 && attempts < 10);
    return { creatures, instruction: rule.instruction, targetIds };
};

interface RoundData { creatures: Creature[]; instruction: string; targetIds: number[]; }

const SHAPE_PATHS: Record<CreatureShape, string> = {
    fluff: 'M25,50 C20,35 35,20 50,30 C60,15 80,25 85,45 C95,50 90,70 80,80 C70,90 30,90 20,80 C10,70 15,55 25,50 Z',
    slime: 'M50,15 C30,15 15,35 15,60 C15,85 25,90 30,85 C35,80 40,90 50,90 C60,90 65,80 70,85 C75,90 85,85 85,60 C85,35 70,15 50,15 Z',
    block: 'M20,25 C20,15 80,15 80,25 L85,75 C85,85 15,85 15,75 L20,25 Z',
    spiky: 'M50,15 L58,35 L80,30 L65,48 L85,65 L60,70 L50,90 L40,70 L15,65 L35,48 L20,30 L42,35 Z',
};

const MonsterSVG: React.FC<{ creature: Creature; size?: number }> = ({ creature, size = 80 }) => {
    const { color, shape, accessory, emotion } = creature;
    const fill = COLOR_VALUES[color];
    const stroke = STROKE_VALUES[color];
    const eyeC = '#1F2937';
    const path = SHAPE_PATHS[shape];

    const renderFace = () => {
        const normEyes = <><circle cx="35" cy="50" r="5" fill={eyeC} /><circle cx="65" cy="50" r="5" fill={eyeC} /><circle cx="37" cy="48" r="2" fill="white" /><circle cx="67" cy="48" r="2" fill="white" /></>;
        let eyes: React.ReactNode, mouth: React.ReactNode;
        switch (emotion) {
            case 'happy': eyes = <><path d="M30 50 Q35 45 40 50" fill="none" stroke={eyeC} strokeWidth="3" strokeLinecap="round" /><path d="M60 50 Q65 45 70 50" fill="none" stroke={eyeC} strokeWidth="3" strokeLinecap="round" /></>; mouth = <path d="M40 60 Q50 70 60 60" fill="none" stroke={eyeC} strokeWidth="3" strokeLinecap="round" />; break;
            case 'sad': eyes = normEyes; mouth = <path d="M40 68 Q50 60 60 68" fill="none" stroke={eyeC} strokeWidth="3" strokeLinecap="round" />; break;
            case 'surprised': eyes = normEyes; mouth = <ellipse cx="50" cy="65" rx="4" ry="6" fill={eyeC} />; break;
            case 'angry': eyes = <><path d="M30 45 L42 50" stroke={eyeC} strokeWidth="2.5" strokeLinecap="round" /><path d="M70 45 L58 50" stroke={eyeC} strokeWidth="2.5" strokeLinecap="round" /><circle cx="38" cy="52" r="4" fill={eyeC} /><circle cx="62" cy="52" r="4" fill={eyeC} /></>; mouth = <path d="M42 65 Q50 62 58 65" fill="none" stroke={eyeC} strokeWidth="3" strokeLinecap="round" />; break;
            case 'sleepy': eyes = <><path d="M30 52 Q35 52 40 52" fill="none" stroke={eyeC} strokeWidth="3" strokeLinecap="round" /><path d="M60 52 Q65 52 70 52" fill="none" stroke={eyeC} strokeWidth="3" strokeLinecap="round" /></>; mouth = <circle cx="50" cy="65" r="3" fill="none" stroke={eyeC} strokeWidth="2" />; break;
        }
        return <g>{eyes}{mouth}</g>;
    };

    const renderAccessory = () => {
        switch (accessory) {
            case 'hat': return <g transform="translate(0,-10) rotate(-10,50,20)"><polygon points="30,30 50,5 70,30" fill="#FCD34D" stroke="#D97706" strokeWidth="2" /><circle cx="50" cy="5" r="4" fill="#EF4444" /></g>;
            case 'glasses': return <g><circle cx="35" cy="50" r="10" fill="rgba(255,255,255,0.4)" stroke="#111827" strokeWidth="2" /><circle cx="65" cy="50" r="10" fill="rgba(255,255,255,0.4)" stroke="#111827" strokeWidth="2" /><line x1="45" y1="50" x2="55" y2="50" stroke="#111827" strokeWidth="2" /></g>;
            case 'bowtie': return <g transform="translate(0,35)"><path d="M50 55 L38 48 C35 45 35 55 38 60 L50 55 L62 60 C65 55 65 45 62 48 Z" fill="#EC4899" /><circle cx="50" cy="54" r="2" fill="#BE185D" /></g>;
            case 'crown': return <g transform="translate(0,-12)"><path d="M30 35 L30 20 L40 30 L50 15 L60 30 L70 20 L70 35 Z" fill="#FBBF24" stroke="#B45309" strokeWidth="2" /></g>;
            default: return null;
        }
    };

    return (
        <svg width={size} height={size} viewBox="0 0 100 100" className="overflow-visible">
            <ellipse cx="50" cy="90" rx="30" ry="5" fill="black" opacity="0.1" />
            <path d={path} fill={fill} stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" />
            {renderFace()}{renderAccessory()}
        </svg>
    );
};

type Phase = 'welcome' | 'playing' | 'feedback' | 'game_over' | 'victory';

const CreatureLogicGame: React.FC = () => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const { feedbackState, showFeedback, dismissFeedback } = useGameFeedback({ duration: 1000 });
    const { submitResult } = useExam();
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
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);
    const hasSavedRef = useRef(false);

    useEffect(() => {
        if (phase === 'playing' && timeLeft > 0) {
            timerRef.current = setTimeout(() => setTimeLeft(p => p - 1), 1000);
        } else if (timeLeft === 0 && phase === 'playing') {
            handleGameOver();
        }
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [phase, timeLeft]);

    useEffect(() => {
        if (phase === 'playing' && selectedIds.length === 0) {
            setRound(generateRound(level));
        }
    }, [phase, level, selectedIds]);

    const handleStart = useCallback(() => {
        window.scrollTo(0, 0);
        setPhase('playing');
        setScore(0);
        setLives(INITIAL_LIVES);
        setLevel(1);
        setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
        startTimeRef.current = Date.now();
        hasSavedRef.current = false;
        setSelectedIds([]);
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
            game_id: 'yaratik-mantigi',
            score_achieved: score,
            duration_seconds: duration,
            metadata: { levels_completed: level, final_lives: lives, game_name: 'Yaratık Mantığı' },
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
            game_id: 'yaratik-mantigi',
            score_achieved: score,
            duration_seconds: duration,
            metadata: { levels_completed: MAX_LEVEL, victory: true, game_name: 'Yaratık Mantığı' },
        });
    }, [saveGamePlay, score, examMode, submitResult, navigate]);

    const handleCreatureClick = (id: number) => {
        if (phase !== 'playing') return;
        playSound('pop');
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const handleSubmit = () => {
        if (!round || phase !== 'playing' || selectedIds.length === 0) return;
        const correct = selectedIds.length === round.targetIds.length &&
            selectedIds.every(id => round.targetIds.includes(id));

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
                setLives(l => {
                    const nl = l - 1;
                    if (nl <= 0) handleGameOver();
                    else setRound(generateRound(level));
                    return nl;
                });
            }
            setSelectedIds([]);
            if (lives > 0 && level < MAX_LEVEL) setPhase('playing');
        }, 1200);
    };

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-white">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" /><div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
            </div>
            <div className="relative z-10 p-4 pt-20">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link to={backLink} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"><ChevronLeft size={20} /><span>{backLabel}</span></Link>
                    {(phase === 'playing' || phase === 'feedback') && (
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)', border: '1px solid rgba(251, 191, 36, 0.3)' }}><Star className="text-amber-400 fill-amber-400" size={18} /><span className="font-bold text-amber-400">{score}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>{Array.from({ length: INITIAL_LIVES }).map((_, i) => (<Heart key={i} size={18} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-900'} />))}</div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.1) 100%)', border: '1px solid rgba(59, 130, 246, 0.3)' }}><TimerIcon className={timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'} size={18} /><span className={`font-bold ${timeLeft < 30 ? 'text-red-400' : 'text-blue-400'}`}>{formatTime(timeLeft)}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)', border: '1px solid rgba(16, 185, 129, 0.3)' }}><Zap className="text-emerald-400" size={18} /><span className="font-bold text-emerald-400">{level}/{MAX_LEVEL}</span></div>
                        </div>
                    )}
                </div>
            </div>
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-4">
                <AnimatePresence mode="wait">
                    {phase === 'welcome' && (
                        <motion.div key="welcome" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
                            <motion.div className="w-28 h-28 rounded-[40%] flex items-center justify-center mx-auto mb-6" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }} animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}><Sparkles size={52} className="text-white drop-shadow-lg" /></motion.div>
                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Yaratık Mantığı</h1>
                            <p className="text-slate-400 mb-8">Yaramaz yaratıkları özelliklerine göre Grupla! Mantık yönergesini oku ve şartları sağlayan tüm yaratıkları seç.</p>
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                                <h3 className="text-lg font-bold text-emerald-300 mb-3 flex items-center gap-2"><Eye size={20} /> Nasıl Oynanır?</h3>
                                <ul className="space-y-2 text-slate-300 text-sm">
                                    <li className="flex items-center gap-2"><Sparkles size={14} className="text-emerald-400" /><span>Üstteki yeşil renkli yönergeyi dikkatle oku</span></li>
                                    <li className="flex items-center gap-2"><Sparkles size={14} className="text-emerald-400" /><span>Yaratıklardan şartı sağlayanların hepsine tıkla</span></li>
                                    <li className="flex items-center gap-2"><Sparkles size={14} className="text-emerald-400" /><span>Tüm seçimlerini yaptıktan sonra onayla butonuna bas!</span></li>
                                </ul>
                            </div>
                            <div className="bg-emerald-500/10 text-emerald-300 text-[10px] px-4 py-2 rounded-full mb-6 inline-block border border-emerald-500/30 font-bold uppercase tracking-widest">TUZÖ 5.5.3 Yönerge Takibi</div>
                            <motion.button whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 rounded-2xl font-bold text-xl" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', boxShadow: '0 8px 32px rgba(16, 185, 129, 0.4)' }}><div className="flex items-center gap-3"><Play size={28} className="fill-white" /><span>Başla</span></div></motion.button>
                        </motion.div>
                    )}
                    {(phase === 'playing' || phase === 'feedback') && round && (
                        <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-4xl">
                            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="p-6 sm:p-8 rounded-[32px] bg-gradient-to-br from-emerald-600/80 to-teal-700/80 backdrop-blur-2xl border border-white/20 shadow-2xl mb-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles size={100} /></div>
                                <div className="relative z-10 flex items-start gap-4 text-white">
                                    <Zap className="text-amber-400 flex-shrink-0 mt-1" size={24} />
                                    <p className="text-lg sm:text-2xl font-black leading-tight drop-shadow-md">{round.instruction}</p>
                                </div>
                            </motion.div>
                            <div className={`grid gap-4 sm:gap-6 mb-8 ${round.creatures.length <= 6 ? 'grid-cols-2 sm:grid-cols-3' : round.creatures.length <= 9 ? 'grid-cols-3' : 'grid-cols-4'}`}>
                                {round.creatures.map((creature, idx) => {
                                    const isSelected = selectedIds.includes(creature.id);
                                    const showResults = phase === 'feedback';
                                    const isTarget = round.targetIds.includes(creature.id);
                                    return (<motion.button key={creature.id} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: idx * 0.05 }} disabled={phase !== 'playing'} onClick={() => handleCreatureClick(creature.id)} className={`aspect-square rounded-[32px] border-2 flex flex-col items-center justify-center relative transition-all duration-300 ${isSelected ? 'ring-4 ring-white shadow-[0_0_30px_rgba(255,255,255,0.4)] scale-105' : 'shadow-xl'} ${showResults && isTarget && !isSelected ? 'ring-4 ring-emerald-400/50 scale-105' : ''}`} style={{ background: isSelected ? (showResults ? (isTarget ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)') : 'rgba(16, 185, 129, 0.15)') : 'rgba(255,255,255,0.05)', borderColor: isSelected ? (showResults ? (isTarget ? '#10B981' : '#EF4444') : '#10B981') : 'rgba(255,255,255,0.1)' }} whileHover={phase === 'playing' ? { scale: 1.05, y: -4 } : {}} whileTap={phase === 'playing' ? { scale: 0.95 } : {}}><MonsterSVG creature={creature} size={round.creatures.length > 9 ? 60 : 80} />{showResults && isSelected && (<div className="absolute top-3 right-3">{isTarget ? <CheckCircle2 className="text-emerald-400" size={24} /> : <XCircle className="text-red-400" size={24} />}</div>)}</motion.button>);
                                })}
                            </div>
                            {phase === 'playing' && (
                                <motion.button initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} onClick={handleSubmit} disabled={selectedIds.length === 0} className={`w-full max-w-sm mx-auto flex items-center justify-center gap-3 py-5 rounded-[24px] font-black text-xl shadow-2xl transition-all ${selectedIds.length > 0 ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:scale-105' : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'}`}>{selectedIds.length} Yaratığı Seçtim <Play size={24} className="fill-current" /></motion.button>
                            )}
                        </motion.div>
                    )}
                    {(phase === 'game_over' || phase === 'victory') && (
                        <motion.div key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
                            <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><Trophy size={48} className="text-white" /></motion.div>
                            <h2 className="text-3xl font-bold text-amber-400 mb-2">{phase === 'victory' ? '🎖️ Doğa Dostu!' : 'Harika Bir İş Çıkardın!'}</h2>
                            <p className="text-slate-400 mb-6">{phase === 'victory' ? 'Tüm yaratıkları türlerine göre kusursuz ayırdın!' : 'Yeni rekorlar kırmak için tekrar deneyebilirsin!'}</p>
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10"><div className="grid grid-cols-2 gap-4"><div className="text-center"><p className="text-slate-400 text-sm">Skor</p><p className="text-2xl font-bold text-amber-400">{score}</p></div><div className="text-center"><p className="text-slate-400 text-sm">Seviye</p><p className="text-2xl font-bold text-emerald-400">{level}/{MAX_LEVEL}</p></div></div></div>
                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl font-bold text-xl mb-4" style={{ boxShadow: '0 8px 32px rgba(16, 185, 129, 0.4)' }}><div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Oyna</span></div></motion.button>
                            <Link to={backLink} className="block text-slate-500 hover:text-white transition-colors">{location.state?.arcadeMode ? 'Bilsem Zeka' : 'Geri Dön'}</Link>
                        </motion.div>
                    )}
                </AnimatePresence>
                <GameFeedbackBanner feedback={feedbackState} />
            </div>
        </div>
    );
};

export default CreatureLogicGame;
