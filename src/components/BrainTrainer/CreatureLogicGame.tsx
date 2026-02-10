import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer, Target,
    CheckCircle2, XCircle, ChevronLeft, Zap, Heart, Sparkles
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useExam } from '../../contexts/ExamContext';

// ─── Constants ──────────────────────────────────────
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;

const CORRECT_MESSAGES = [
    "Harikasın! 🎨", "Süpersin! ⭐", "Muhteşem! 🌟",
    "Bravo! 🎉", "Tam isabet! 🎯",
];
const WRONG_MESSAGES = [
    "Tekrar dene! 💪", "Düşün ve bul! 🧐", "Biraz daha dikkat! 🎯",
];

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

const COLOR_VALUES: Record<CreatureColor, string> = { red: '#ef4444', blue: '#3b82f6', green: '#22c55e', yellow: '#eab308', purple: '#a855f7' };
const STROKE_VALUES: Record<CreatureColor, string> = { red: '#991b1b', blue: '#1e40af', green: '#166534', yellow: '#854d0e', purple: '#6b21a8' };

const TR = {
    colors: { red: 'kırmızı', blue: 'mavi', green: 'yeşil', yellow: 'sarı', purple: 'mor' } as Record<CreatureColor, string>,
    colorsAcc: { red: 'kırmızıları', blue: 'mavileri', green: 'yeşilleri', yellow: 'sarıları', purple: 'morları' } as Record<CreatureColor, string>,
    shapes: { fluff: 'pofuduk', slime: 'jöle', block: 'köşeli', spiky: 'dikenli' } as Record<CreatureShape, string>,
    accessories: { none: 'aksesuarsız', hat: 'şapkalı', glasses: 'gözlüklü', bowtie: 'papyonlu', crown: 'taçlı' } as Record<CreatureAccessory, string>,
    emotions: { happy: 'mutlu', sad: 'üzgün', surprised: 'şaşkın', sleepy: 'uykulu', angry: 'kızgın' } as Record<CreatureEmotion, string>,
};

// ─── Helpers ────────────────────────────────────────
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
const cap = (s: string) => s.charAt(0).toLocaleUpperCase('tr-TR') + s.slice(1);

const getCreatureCount = (level: number): number => {
    if (level <= 7) return 6;
    if (level <= 14) return 9;
    return 12;
};

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
            instruction: `Eğer ekranda ${TR.colors[ck]} yaratık varsa ${TR.colorsAcc[t1]} seç, yoksa ${TR.colorsAcc[t2]} seç.`,
            predicate: c => exists ? c.color === t1 : c.color === t2,
        };
    }
    const c1 = pick(ALL_COLORS); const s1 = pick(ALL_SHAPES);
    let c2 = pick(ALL_COLORS); while (c2 === c1) c2 = pick(ALL_COLORS);
    const s2 = pick(ALL_SHAPES);
    return {
        instruction: `${cap(TR.colors[c1])} ${TR.shapes[s1]} veya ${TR.colors[c2]} ${TR.shapes[s2]} olanları seç.`,
        predicate: c => (c.color === c1 && c.shape === s1) || (c.color === c2 && c.shape === s2),
    };
};

type Difficulty = 'easy' | 'medium' | 'hard';
const getDifficulty = (level: number): Difficulty => level <= 7 ? 'easy' : level <= 14 ? 'medium' : 'hard';

interface RoundData { creatures: Creature[]; instruction: string; targetIds: number[]; }

const generateRound = (level: number): RoundData => {
    const count = getCreatureCount(level);
    const diff = getDifficulty(level);
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

// ─── Monster SVG ────────────────────────────────────
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
        const cheeks = <><ellipse cx="25" cy="58" rx="4" ry="2" fill="#F472B6" opacity="0.6" /><ellipse cx="75" cy="58" rx="4" ry="2" fill="#F472B6" opacity="0.6" /></>;
        const normEyes = <><circle cx="35" cy="50" r="5" fill={eyeC} /><circle cx="65" cy="50" r="5" fill={eyeC} /><circle cx="37" cy="48" r="2" fill="white" /><circle cx="67" cy="48" r="2" fill="white" /></>;
        let eyes: React.ReactNode, mouth: React.ReactNode;
        switch (emotion) {
            case 'happy':
                eyes = <><path d="M30 50 Q35 45 40 50" fill="none" stroke={eyeC} strokeWidth="3" strokeLinecap="round" /><path d="M60 50 Q65 45 70 50" fill="none" stroke={eyeC} strokeWidth="3" strokeLinecap="round" /></>;
                mouth = <path d="M40 60 Q50 70 60 60" fill="none" stroke={eyeC} strokeWidth="3" strokeLinecap="round" />; break;
            case 'sad': eyes = normEyes; mouth = <path d="M40 68 Q50 60 60 68" fill="none" stroke={eyeC} strokeWidth="3" strokeLinecap="round" />; break;
            case 'surprised': eyes = normEyes; mouth = <ellipse cx="50" cy="65" rx="4" ry="6" fill={eyeC} />; break;
            case 'angry':
                eyes = <><path d="M30 45 L42 50" stroke={eyeC} strokeWidth="2.5" strokeLinecap="round" /><path d="M70 45 L58 50" stroke={eyeC} strokeWidth="2.5" strokeLinecap="round" /><circle cx="38" cy="52" r="4" fill={eyeC} /><circle cx="62" cy="52" r="4" fill={eyeC} /></>;
                mouth = <path d="M42 65 Q50 62 58 65" fill="none" stroke={eyeC} strokeWidth="3" strokeLinecap="round" />; break;
            case 'sleepy':
                eyes = <><path d="M30 52 Q35 52 40 52" fill="none" stroke={eyeC} strokeWidth="3" strokeLinecap="round" /><path d="M60 52 Q65 52 70 52" fill="none" stroke={eyeC} strokeWidth="3" strokeLinecap="round" /><text x="75" y="40" fontSize="12" fill={eyeC}>z</text></>;
                mouth = <circle cx="50" cy="65" r="3" fill="none" stroke={eyeC} strokeWidth="2" />; break;
        }
        return <g>{cheeks}{eyes}{mouth}</g>;
    };

    const renderAccessory = () => {
        switch (accessory) {
            case 'hat': return <g transform="translate(0,-10) rotate(-10,50,20)"><polygon points="30,30 50,5 70,30" fill="#FCD34D" stroke="#D97706" strokeWidth="2" strokeLinejoin="round" /><circle cx="50" cy="5" r="4" fill="#EF4444" stroke="#B91C1C" strokeWidth="1" /></g>;
            case 'glasses': return <g><circle cx="35" cy="50" r="10" fill="rgba(255,255,255,0.4)" stroke="#111827" strokeWidth="2.5" /><circle cx="65" cy="50" r="10" fill="rgba(255,255,255,0.4)" stroke="#111827" strokeWidth="2.5" /><line x1="45" y1="50" x2="55" y2="50" stroke="#111827" strokeWidth="2.5" /></g>;
            case 'bowtie': return <g transform="translate(0,35)"><path d="M50 55 L38 48 C35 45 35 55 38 60 L50 55 L62 60 C65 55 65 45 62 48 Z" fill="#EC4899" stroke="#BE185D" strokeWidth="2" /><circle cx="50" cy="54" r="2" fill="#BE185D" /></g>;
            case 'crown': return <g transform="translate(0,-12)"><path d="M30 35 L30 20 L40 30 L50 15 L60 30 L70 20 L70 35 Z" fill="#FBBF24" stroke="#B45309" strokeWidth="2" strokeLinejoin="round" /><circle cx="30" cy="20" r="2" fill="#EF4444" /><circle cx="50" cy="15" r="2" fill="#3B82F6" /><circle cx="70" cy="20" r="2" fill="#EF4444" /></g>;
            default: return null;
        }
    };

    const uid = `hl-${creature.id}`;
    return (
        <svg width={size} height={size} viewBox="0 0 100 100" className="overflow-visible">
            <ellipse cx="50" cy="90" rx="30" ry="5" fill="black" opacity="0.1" />
            <path d={path} fill={fill} stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" />
            <path d={path} fill={`url(#${uid})`} opacity="0.3" stroke="none" transform="scale(0.8) translate(12,10)" />
            {renderFace()}
            {renderAccessory()}
            <defs><linearGradient id={uid} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="white" stopOpacity="0.8" /><stop offset="100%" stopColor="white" stopOpacity="0" /></linearGradient></defs>
        </svg>
    );
};

// ─── Types ──────────────────────────────────────────
type Phase = 'welcome' | 'playing' | 'feedback' | 'game_over' | 'victory';

interface CreatureLogicGameProps {
    examMode?: boolean;
    examLevel?: number;
    examTimeLimit?: number;
}

// ─── Component ──────────────────────────────────────
const CreatureLogicGame: React.FC<CreatureLogicGameProps> = ({ examMode = false }) => {
    const { saveGamePlay } = useGamePersistence();
    const hasSavedRef = useRef(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { submitResult } = useExam();

    const [phase, setPhase] = useState<Phase>('welcome');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [level, setLevel] = useState(1);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const [round, setRound] = useState<RoundData | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [feedbackCorrect, setFeedbackCorrect] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState('');

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);

    // Timer
    useEffect(() => {
        if (phase === 'playing' && timeLeft > 0) {
            timerRef.current = setTimeout(() => setTimeLeft(p => p - 1), 1000);
        } else if (timeLeft === 0 && phase === 'playing') {
            handleGameOver();
        }
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [phase, timeLeft]);

    // Generate round
    useEffect(() => {
        if (phase === 'playing') {
            setRound(generateRound(level));
            setSelectedIds([]);
        }
    }, [phase, level]);

    // Start
    const handleStart = useCallback(() => {
        setPhase('playing');
        setScore(0);
        setLives(INITIAL_LIVES);
        setLevel(1);
        setTimeLeft(TIME_LIMIT);
        startTimeRef.current = Date.now();
        hasSavedRef.current = false;
    }, []);

    // Auto-start
    useEffect(() => {
        if ((location.state?.autoStart || examMode) && phase === 'welcome') handleStart();
    }, [location.state, examMode, phase, handleStart]);

    // Game Over
    const handleGameOver = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        setPhase('game_over');
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (examMode) { submitResult(level >= 5, score, 1000, duration); setTimeout(() => navigate('/sinav-simulasyonu'), 1500); return; }
        await saveGamePlay({ game_id: 'yaratik-mantigi', score_achieved: score, duration_seconds: duration, metadata: { levels_completed: level, final_lives: lives } });
    }, [saveGamePlay, score, level, lives, examMode, submitResult, navigate]);

    // Victory
    const handleVictory = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        setPhase('victory');
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (examMode) { submitResult(true, score, 1000, duration); setTimeout(() => navigate('/sinav-simulasyonu'), 1500); return; }
        await saveGamePlay({ game_id: 'yaratik-mantigi', score_achieved: score, duration_seconds: duration, metadata: { levels_completed: MAX_LEVEL, victory: true } });
    }, [saveGamePlay, score, examMode, submitResult, navigate]);

    // Toggle creature selection
    const handleCreatureClick = useCallback((id: number) => {
        if (phase !== 'playing') return;
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    }, [phase]);

    // Submit selection
    const handleSubmit = useCallback(() => {
        if (!round || phase !== 'playing' || selectedIds.length === 0) return;
        const correct = selectedIds.length === round.targetIds.length &&
            selectedIds.every(id => round.targetIds.includes(id)) &&
            round.targetIds.every(id => selectedIds.includes(id));

        setFeedbackCorrect(correct);
        setFeedbackMessage(correct
            ? CORRECT_MESSAGES[Math.floor(Math.random() * CORRECT_MESSAGES.length)]
            : WRONG_MESSAGES[Math.floor(Math.random() * WRONG_MESSAGES.length)]
        );
        setPhase('feedback');

        const newScore = correct ? score + 10 * level : score;
        const newLives = correct ? lives : lives - 1;
        if (correct) setScore(newScore);
        else setLives(newLives);

        setTimeout(() => {
            if (!correct && newLives <= 0) { handleGameOver(); return; }
            if (correct && level >= MAX_LEVEL) { handleVictory(); return; }
            if (correct) setLevel(l => l + 1);
            else { setRound(generateRound(level)); setSelectedIds([]); }
            setPhase('playing');
        }, 2000);
    }, [round, phase, selectedIds, score, lives, level, handleGameOver, handleVictory]);

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    // Legend creatures for welcome screen
    const legendCreatures: { label: string; creature: Creature }[] = [
        { label: 'Jöle', creature: { id: 101, color: 'blue', shape: 'slime', accessory: 'none', emotion: 'happy' } },
        { label: 'Pofuduk', creature: { id: 102, color: 'red', shape: 'fluff', accessory: 'none', emotion: 'happy' } },
        { label: 'Köşeli', creature: { id: 103, color: 'green', shape: 'block', accessory: 'none', emotion: 'happy' } },
        { label: 'Dikenli', creature: { id: 104, color: 'yellow', shape: 'spiky', accessory: 'none', emotion: 'happy' } },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-white">
            {/* Decorative */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <div className="relative z-10 p-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Link to="/atolyeler/bireysel-degerlendirme" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                        <ChevronLeft size={20} /><span>Geri</span>
                    </Link>
                    {(phase === 'playing' || phase === 'feedback') && (
                        <div className="flex items-center gap-3 sm:gap-6 flex-wrap justify-end">
                            <div className="flex items-center gap-2 bg-amber-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-amber-500/30">
                                <Star className="text-amber-400" size={18} />
                                <span className="font-bold text-amber-400 text-sm">{score}</span>
                            </div>
                            <div className="flex items-center gap-1 bg-red-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-red-500/30">
                                {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
                                    <Heart key={i} size={14} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-400/30'} />
                                ))}
                            </div>
                            <div className="flex items-center gap-2 bg-blue-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-blue-500/30">
                                <Timer className="text-blue-400" size={18} />
                                <span className={`font-bold text-sm ${timeLeft <= 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'}`}>{formatTime(timeLeft)}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-emerald-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-emerald-500/30">
                                <Zap className="text-emerald-400" size={18} />
                                <span className="font-bold text-emerald-400 text-sm">Seviye {level}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4">
                <AnimatePresence mode="wait">

                    {/* ── Welcome ── */}
                    {phase === 'welcome' && (
                        <motion.div key="welcome" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
                            <div className="mb-6 inline-flex items-center gap-1.5 px-3 py-1 bg-violet-500/20 border border-violet-500/30 rounded-full">
                                <span className="text-[9px] font-black text-violet-300 uppercase tracking-wider">TUZÖ</span>
                                <span className="text-[9px] font-bold text-violet-400">5.5.3 Yönerge Takibi</span>
                            </div>

                            <motion.div className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-[40%] flex items-center justify-center"
                                style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }}
                                animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
                                <Sparkles size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Yaratık Mantığı</h1>
                            <p className="text-slate-400 mb-6">Kuralları oku, koşulları değerlendir ve <span className="font-bold text-white">doğru yaratıkları</span> seç!</p>

                            {/* Legend */}
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 mb-6 border border-white/10">
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-4 text-center">Yaratık Rehberi</p>
                                <div className="grid grid-cols-4 gap-3">
                                    {legendCreatures.map(lc => (
                                        <div key={lc.label} className="flex flex-col items-center">
                                            <MonsterSVG creature={lc.creature} size={56} />
                                            <span className="text-xs font-bold text-slate-400 mt-1">{lc.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-wrap justify-center gap-4 mb-8">
                                <div className="bg-slate-800/50 px-4 py-2 rounded-xl flex items-center gap-2"><Heart className="text-red-400" size={16} /><span className="text-sm text-slate-300">{INITIAL_LIVES} Can</span></div>
                                <div className="bg-slate-800/50 px-4 py-2 rounded-xl flex items-center gap-2"><Timer className="text-blue-400" size={16} /><span className="text-sm text-slate-300">{TIME_LIMIT / 60} Dakika</span></div>
                                <div className="bg-slate-800/50 px-4 py-2 rounded-xl flex items-center gap-2"><Target className="text-emerald-400" size={16} /><span className="text-sm text-slate-300">{MAX_LEVEL} Seviye</span></div>
                            </div>

                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart}
                                className="px-10 py-5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl font-bold text-xl"
                                style={{ boxShadow: '0 8px 32px rgba(16, 185, 129, 0.4)' }}>
                                <div className="flex items-center gap-3"><Play size={28} className="fill-white" /><span>Başla</span></div>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* ── Playing ── */}
                    {(phase === 'playing' || phase === 'feedback') && round && (
                        <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-4xl">
                            {/* Instruction */}
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                                className="bg-gradient-to-r from-emerald-600/80 to-teal-600/80 backdrop-blur-xl rounded-2xl p-5 sm:p-6 mb-6 border border-emerald-400/20"
                                style={{ boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)' }}>
                                <div className="flex items-center gap-2 mb-2 opacity-80">
                                    <Zap size={14} /><p className="text-xs font-bold uppercase tracking-wider">Yönerge</p>
                                </div>
                                <p className="text-lg sm:text-xl font-medium leading-relaxed">{round.instruction}</p>
                            </motion.div>

                            {/* Creature Grid */}
                            <div className={`grid gap-3 sm:gap-4 mb-6 ${round.creatures.length <= 6 ? 'grid-cols-3' : round.creatures.length <= 9 ? 'grid-cols-3' : 'grid-cols-4'}`}>
                                {round.creatures.map((creature, idx) => {
                                    const isSelected = selectedIds.includes(creature.id);
                                    const showResults = phase === 'feedback';
                                    const isTarget = round.targetIds.includes(creature.id);

                                    let borderColor = 'border-white/10';
                                    let bg = 'bg-white/5';
                                    let extra = 'cursor-pointer hover:bg-white/10 hover:border-white/20';

                                    if (isSelected && !showResults) {
                                        borderColor = 'border-emerald-400';
                                        bg = 'bg-emerald-500/20';
                                        extra = 'ring-2 ring-emerald-400/50 cursor-pointer';
                                    } else if (showResults) {
                                        if (isSelected && isTarget) { borderColor = 'border-emerald-400'; bg = 'bg-emerald-500/20'; extra = 'ring-2 ring-emerald-400/50'; }
                                        else if (isSelected && !isTarget) { borderColor = 'border-red-400'; bg = 'bg-red-500/20'; extra = 'ring-2 ring-red-400/50'; }
                                        else if (isTarget) { borderColor = 'border-emerald-400/50'; bg = 'bg-emerald-500/10'; extra = 'opacity-60'; }
                                        else { extra = 'opacity-30 cursor-default'; }
                                    }

                                    return (
                                        <motion.button key={creature.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.04 }}
                                            disabled={phase !== 'playing'} onClick={() => handleCreatureClick(creature.id)}
                                            className={`relative aspect-square rounded-2xl border-2 ${borderColor} ${bg} ${extra} transition-all duration-300 flex items-center justify-center p-2`}
                                            style={{ boxShadow: 'inset 0 -3px 6px rgba(0,0,0,0.2), inset 0 3px 6px rgba(255,255,255,0.05)' }}
                                            whileHover={phase === 'playing' ? { scale: 1.05, y: -4 } : {}} whileTap={phase === 'playing' ? { scale: 0.95 } : {}}>
                                            <MonsterSVG creature={creature} size={round.creatures.length > 9 ? 56 : 72} />
                                            {isSelected && !showResults && (
                                                <div className="absolute top-1.5 right-1.5 bg-emerald-500 text-white rounded-full p-0.5"><CheckCircle2 size={16} /></div>
                                            )}
                                            {showResults && isSelected && (
                                                <div className="absolute top-1.5 right-1.5">
                                                    {isTarget ? <CheckCircle2 size={18} className="text-emerald-400" /> : <XCircle size={18} className="text-red-400" />}
                                                </div>
                                            )}
                                            {showResults && isTarget && !isSelected && (
                                                <div className="absolute top-1.5 right-1.5"><CheckCircle2 size={18} className="text-emerald-400/60" /></div>
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </div>

                            {/* Submit Button */}
                            {phase === 'playing' && (
                                <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                    onClick={handleSubmit} disabled={selectedIds.length === 0}
                                    className={`w-full max-w-md mx-auto block py-4 rounded-2xl font-bold text-lg transition-all ${selectedIds.length > 0 ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:scale-[1.02]' : 'bg-white/10 text-white/30 cursor-not-allowed'}`}
                                    style={selectedIds.length > 0 ? { boxShadow: '0 8px 32px rgba(16,185,129,0.4)' } : {}}>
                                    Seçimi Onayla ({selectedIds.length})
                                </motion.button>
                            )}
                        </motion.div>
                    )}

                    {/* ── Game Over ── */}
                    {phase === 'game_over' && (
                        <motion.div key="game_over" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
                            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-red-500 to-rose-600 rounded-[40%] flex items-center justify-center"
                                style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }}>
                                <XCircle size={48} className="text-white" />
                            </div>
                            <h2 className="text-3xl font-bold text-red-400 mb-4">Oyun Bitti!</h2>
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center"><p className="text-slate-400 text-sm">Skor</p><p className="text-2xl font-bold text-amber-400">{score}</p></div>
                                    <div className="text-center"><p className="text-slate-400 text-sm">Seviye</p><p className="text-2xl font-bold text-emerald-400">{level}</p></div>
                                </div>
                            </div>
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleStart}
                                className="px-10 py-5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl font-bold text-xl" style={{ boxShadow: '0 8px 32px rgba(16,185,129,0.4)' }}>
                                <div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Dene</span></div>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* ── Victory ── */}
                    {phase === 'victory' && (
                        <motion.div key="victory" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
                            <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-[40%] flex items-center justify-center"
                                style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3)' }}
                                animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                                <Trophy size={48} className="text-white" />
                            </motion.div>
                            <h2 className="text-3xl font-bold text-amber-400 mb-4">🎉 Şampiyon!</h2>
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10">
                                <p className="text-4xl font-bold text-amber-400">{score}</p>
                                <p className="text-slate-400">Toplam Puan</p>
                            </div>
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleStart}
                                className="px-10 py-5 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-2xl font-bold text-xl" style={{ boxShadow: '0 8px 32px rgba(245,158,11,0.4)' }}>
                                <div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Oyna</span></div>
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Feedback Overlay ── */}
                <AnimatePresence>
                    {phase === 'feedback' && (
                        <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none">
                            <motion.div initial={{ y: 50 }} animate={{ y: 0 }}
                                className={`px-12 py-8 rounded-3xl text-center ${feedbackCorrect ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-orange-500 to-amber-600'}`}
                                style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}>
                                <motion.div animate={{ scale: [1, 1.2, 1], rotate: feedbackCorrect ? [0, 10, -10, 0] : [0, -5, 5, 0] }} transition={{ duration: 0.5 }}>
                                    {feedbackCorrect ? <CheckCircle2 size={64} className="mx-auto mb-4 text-white" /> : <XCircle size={64} className="mx-auto mb-4 text-white" />}
                                </motion.div>
                                <p className="text-3xl font-black text-white">{feedbackMessage}</p>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default CreatureLogicGame;
