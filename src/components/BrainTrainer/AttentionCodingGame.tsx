import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Heart, Zap, ChevronLeft,
    CheckCircle2, XCircle, Code2,
    Timer as TimerIcon,
} from 'lucide-react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';
import { useExam } from '../../contexts/ExamContext';

// ─── Constants ──────────────────────────────────────
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;
const FEEDBACK_DURATION = 1200;


// ─── Types ──────────────────────────────────────────
type ShapeType = 'circle' | 'square' | 'triangle' | 'plus' | 'star' | 'diamond' | 'hexagon';

interface KeyMapping { number: number; shape: ShapeType; }
interface TestItem {
    id: string;
    targetNumber: number;
    userShape: ShapeType | null;
}

type Phase = 'welcome' | 'playing' | 'feedback' | 'game_over' | 'victory';

// ─── Shape Definitions ──────────────────────────────
const ALL_SHAPES: ShapeType[] = ['circle', 'square', 'triangle', 'plus', 'star', 'diamond', 'hexagon'];

const SHAPE_LABELS: Record<ShapeType, string> = {
    circle: 'Daire', square: 'Kare', triangle: 'Üçgen',
    plus: 'Artı', star: 'Yıldız', diamond: 'Elmas', hexagon: 'Altıgen',
};

// ─── Inline Shape Renderer ──────────────────────────
const ShapeIcon: React.FC<{ type: ShapeType; className?: string; size?: number; strokeWidth?: number }> = ({
    type, className = 'text-slate-300', size = 24, strokeWidth = 2,
}) => {
    const props = {
        width: size, height: size, stroke: 'currentColor',
        strokeWidth, fill: 'none',
        strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
        className,
    };
    switch (type) {
        case 'circle': return <svg viewBox="0 0 24 24" {...props}><circle cx="12" cy="12" r="10" /></svg>;
        case 'square': return <svg viewBox="0 0 24 24" {...props}><rect x="3" y="3" width="18" height="18" rx="2" /></svg>;
        case 'triangle': return <svg viewBox="0 0 24 24" {...props}><path d="M12 3L22 20H2L12 3Z" /></svg>;
        case 'plus': return <svg viewBox="0 0 24 24" {...props}><path d="M12 5V19M5 12H19" strokeWidth={strokeWidth + 1} /></svg>;
        case 'star': return <svg viewBox="0 0 24 24" {...props}><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>;
        case 'diamond': return <svg viewBox="0 0 24 24" {...props}><path d="M12 2L22 12L12 22L2 12L12 2Z" /></svg>;
        case 'hexagon': return <svg viewBox="0 0 24 24" {...props}><path d="M12 2L21.5 7.5V16.5L12 22L2.5 16.5V7.5L12 2Z" /></svg>;
        default: return null;
    }
};

// ─── Helpers ────────────────────────────────────────
const shuffle = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

const generateKeyMappings = (level: number): KeyMapping[] => {
    // Levels 1-5: 5 shapes, 6-10: 6 shapes, 11+: 7 shapes
    const shapeCount = level <= 5 ? 5 : level <= 10 ? 6 : 7;
    const shapes = shuffle(ALL_SHAPES).slice(0, shapeCount);
    return shapes.map((shape, i) => ({ number: i + 1, shape }));
};

const getItemCount = (level: number): number => {
    if (level <= 3) return 5;
    if (level <= 7) return 6;
    if (level <= 12) return 7;
    if (level <= 16) return 8;
    return 9;
};

// ─── Props ──────────────────────────────────────────
interface AttentionCodingGameProps {
    examMode?: boolean;
    examLevel?: number;
    examTimeLimit?: number;
}

// ─── Component ──────────────────────────────────────
const AttentionCodingGame: React.FC<AttentionCodingGameProps> = ({ examMode = false }) => {
    const { saveGamePlay } = useGamePersistence();
    const hasSavedRef = useRef(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { submitResult } = useExam();
    const { feedbackState, showFeedback } = useGameFeedback();

    const [phase, setPhase] = useState<Phase>('welcome');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [level, setLevel] = useState(1);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const [totalReactions, setTotalReactions] = useState<number[]>([]);
    const [avgReaction, setAvgReaction] = useState(0);

    const [keyMappings, setKeyMappings] = useState<KeyMapping[]>([]);
    const [items, setItems] = useState<TestItem[]>([]);
    const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
    const [roundStartTime, setRoundStartTime] = useState(0);

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

    // Generate items for current level
    const generateItems = useCallback((lvl: number, mappings: KeyMapping[]) => {
        const count = getItemCount(lvl);
        const maxNum = mappings.length;
        const newItems: TestItem[] = Array.from({ length: count }).map((_, i) => ({
            id: `item-${Date.now()}-${i}`,
            targetNumber: Math.floor(Math.random() * maxNum) + 1,
            userShape: null,
        }));
        setItems(newItems);
        setSelectedSlotId(null);
        setRoundStartTime(Date.now());
    }, []);

    // Start
    const handleStart = useCallback(() => {
        setPhase('playing');
        setScore(0);
        setLives(INITIAL_LIVES);
        setLevel(1);
        setTimeLeft(TIME_LIMIT);
        setTotalReactions([]);
        setAvgReaction(0);
        startTimeRef.current = Date.now();
        hasSavedRef.current = false;

        const mappings = generateKeyMappings(1);
        setKeyMappings(mappings);
        generateItems(1, mappings);
    }, [generateItems]);

    // Auto-start
    useEffect(() => {
        if ((location.state?.autoStart || examMode) && phase === 'welcome') handleStart();
    }, [location.state, examMode, phase, handleStart]);

    // Game Over handler
    const handleGameOver = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        setPhase('game_over');

        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const avg = totalReactions.length > 0 ? Math.round(totalReactions.reduce((a, b) => a + b, 0) / totalReactions.length) : 0;
        setAvgReaction(avg);

        if (examMode) {
            const passed = level >= 5;
            submitResult(passed, score, 1000, duration);
            setTimeout(() => navigate('/sinav-simulasyonu'), 1500);
            return;
        }

        await saveGamePlay({
            game_id: 'dikkat-ve-kodlama',
            score_achieved: score,
            duration_seconds: duration,
            metadata: { levels_completed: level, final_lives: lives, avg_reaction_ms: avg },
        });
    }, [saveGamePlay, score, level, lives, examMode, submitResult, navigate, totalReactions]);

    // Victory handler
    const handleVictory = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        setPhase('victory');

        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const avg = totalReactions.length > 0 ? Math.round(totalReactions.reduce((a, b) => a + b, 0) / totalReactions.length) : 0;
        setAvgReaction(avg);

        if (examMode) {
            submitResult(true, score, 1000, duration);
            setTimeout(() => navigate('/sinav-simulasyonu'), 1500);
            return;
        }

        await saveGamePlay({
            game_id: 'dikkat-ve-kodlama',
            score_achieved: score,
            duration_seconds: duration,
            metadata: { levels_completed: MAX_LEVEL, victory: true, avg_reaction_ms: avg },
        });
    }, [saveGamePlay, score, examMode, submitResult, navigate, totalReactions]);

    // Handle shape selection for a slot
    const handleShapeSelect = useCallback((shape: ShapeType) => {
        if (!selectedSlotId || phase !== 'playing') return;
        setItems(prev => prev.map(item =>
            item.id === selectedSlotId ? { ...item, userShape: shape } : item
        ));
        setSelectedSlotId(null);
    }, [selectedSlotId, phase]);

    // Check all items — submit the round
    const submitRound = useCallback(() => {
        if (phase !== 'playing') return;

        const reaction = Date.now() - roundStartTime;
        const allCorrect = items.every(item => {
            const correctShape = keyMappings.find(k => k.number === item.targetNumber)?.shape;
            return item.userShape === correctShape;
        });

        showFeedback(allCorrect);

        setPhase('feedback');
        setTotalReactions(prev => [...prev, reaction]);

        const newScore = allCorrect ? score + 10 * level : score;
        const newLives = allCorrect ? lives : lives - 1;
        if (allCorrect) setScore(newScore);
        else setLives(newLives);

        setTimeout(() => {
            if (!allCorrect && newLives <= 0) { handleGameOver(); return; }
            if (allCorrect && level >= MAX_LEVEL) { handleVictory(); return; }

            const nextLevel = allCorrect ? level + 1 : level;
            if (allCorrect) setLevel(nextLevel);

            // Re-shuffle key mappings every 3 levels
            const newMappings = nextLevel % 3 === 1 ? generateKeyMappings(nextLevel) : keyMappings;
            if (nextLevel % 3 === 1) setKeyMappings(newMappings);

            generateItems(nextLevel, newMappings);
            setPhase('playing');
        }, FEEDBACK_DURATION);
    }, [phase, items, keyMappings, score, lives, level, roundStartTime, handleGameOver, handleVictory, generateItems]);

    // Keyboard shortcut: Enter to submit
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Enter' && phase === 'playing' && items.every(i => i.userShape)) {
                submitRound();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [phase, items, submitRound]);

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    const allFilled = items.every(i => i.userShape !== null);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950 to-slate-900 text-white">
            {/* Decorative */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <div className="relative z-10 p-4">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <RouterLink to="/atolyeler/bireysel-degerlendirme" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                        <ChevronLeft size={20} /><span>Geri</span>
                    </RouterLink>
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
                                <TimerIcon className="text-blue-400" size={18} />
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
                                <span className="text-[9px] font-bold text-violet-400">5.6.1 İşleme Hızı</span>
                            </div>

                            <motion.div className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-violet-400 to-amber-500 rounded-[40%] flex items-center justify-center"
                                style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }}
                                animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}>
                                <Code2 size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-violet-400 to-amber-400 bg-clip-text text-transparent">Dikkat ve Kodlama</h1>
                            <p className="text-slate-400 mb-6">Anahtardaki sayı-şekil eşleşmelerini ezberle, test maddelerini <span className="font-bold text-white">en hızlı</span> şekilde doldur!</p>

                            <div className="grid grid-cols-3 gap-3 mb-8">
                                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-3 rounded-xl flex flex-col items-center gap-1 border border-white/10">
                                    <Zap className="text-amber-400" size={18} />
                                    <span className="text-xs font-bold text-slate-300">Hız</span>
                                    <span className="text-[10px] text-slate-500">Hızlı kodlama</span>
                                </div>
                                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-3 rounded-xl flex flex-col items-center gap-1 border border-white/10">
                                    <Code2 className="text-violet-400" size={18} />
                                    <span className="text-xs font-bold text-slate-300">Kodlama</span>
                                    <span className="text-[10px] text-slate-500">Sayı-şekil eşle</span>
                                </div>
                                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-3 rounded-xl flex flex-col items-center gap-1 border border-white/10">
                                    <Star className="text-emerald-400" size={18} />
                                    <span className="text-xs font-bold text-slate-300">Hafıza</span>
                                    <span className="text-[10px] text-slate-500">Anahtarı hatırla</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap justify-center gap-4 mb-8">
                                <div className="bg-slate-800/50 px-4 py-2 rounded-xl flex items-center gap-2"><Heart className="text-red-400" size={16} /><span className="text-sm text-slate-300">{INITIAL_LIVES} Can</span></div>
                                <div className="bg-slate-800/50 px-4 py-2 rounded-xl flex items-center gap-2"><TimerIcon className="text-blue-400" size={16} /><span className="text-sm text-slate-300">{TIME_LIMIT / 60} Dakika</span></div>
                                <div className="bg-slate-800/50 px-4 py-2 rounded-xl flex items-center gap-2"><Zap className="text-emerald-400" size={16} /><span className="text-sm text-slate-300">{MAX_LEVEL} Seviye</span></div>
                            </div>

                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart}
                                className="px-10 py-5 bg-gradient-to-r from-violet-500 to-amber-500 rounded-2xl font-bold text-xl"
                                style={{ boxShadow: '0 8px 32px rgba(139,92,246,0.4)' }}>
                                <div className="flex items-center gap-3"><Play size={28} className="fill-white" /><span>Başla</span></div>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* ── Playing ── */}
                    {(phase === 'playing' || phase === 'feedback') && (
                        <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-5xl">
                            {/* Progress */}
                            <div className="w-full bg-white/10 h-3 rounded-full mb-6 overflow-hidden">
                                <motion.div className="h-full bg-gradient-to-r from-violet-500 to-amber-500 rounded-full"
                                    initial={{ width: 0 }} animate={{ width: `${(level / MAX_LEVEL) * 100}%` }} transition={{ duration: 0.5 }} />
                            </div>

                            {/* Key Table */}
                            <div className="mb-6">
                                <div className="text-center mb-2">
                                    <span className="bg-violet-500/20 text-violet-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-violet-500/30">
                                        ANAHTAR
                                    </span>
                                </div>
                                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-violet-500/30 overflow-hidden"
                                    style={{ boxShadow: 'inset 0 -4px 12px rgba(0,0,0,0.15), 0 8px 32px rgba(139,92,246,0.15)' }}>
                                    <div className="grid" style={{ gridTemplateColumns: `repeat(${keyMappings.length}, 1fr)` }}>
                                        {/* Numbers row */}
                                        {keyMappings.map(k => (
                                            <div key={`num-${k.number}`} className="p-3 sm:p-4 border-b border-r border-white/10 flex items-center justify-center text-xl sm:text-2xl font-bold text-white">
                                                {k.number}
                                            </div>
                                        ))}
                                        {/* Shapes row */}
                                        {keyMappings.map(k => (
                                            <div key={`shape-${k.number}`} className="p-3 sm:p-4 border-r border-white/10 flex items-center justify-center min-h-[50px] sm:min-h-[64px]">
                                                <ShapeIcon type={k.shape} size={32} strokeWidth={2.5} className="text-violet-300 w-8 h-8 sm:w-10 sm:h-10" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Test Items */}
                            <div className="mb-6">
                                <div className="text-center mb-3">
                                    <span className="bg-white/10 text-slate-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
                                        TEST MADDELERİ
                                    </span>
                                </div>
                                <div className="flex justify-center gap-2 sm:gap-4 flex-wrap">
                                    {items.map(item => (
                                        <div key={item.id} className="flex flex-col items-center gap-2">
                                            <span className="text-2xl sm:text-3xl font-bold text-white font-mono">{item.targetNumber}</span>
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => { if (phase === 'playing') setSelectedSlotId(item.id); }}
                                                className={`
                                                    w-16 h-14 sm:w-20 sm:h-16 rounded-xl border-2 transition-all duration-200
                                                    flex items-center justify-center
                                                    ${selectedSlotId === item.id
                                                        ? 'border-violet-400 ring-4 ring-violet-500/30 scale-105 bg-violet-500/20'
                                                        : item.userShape
                                                            ? 'border-white/20 bg-white/10'
                                                            : 'border-white/10 bg-white/5 hover:border-violet-400/50'}
                                                `}
                                                style={{ boxShadow: selectedSlotId === item.id ? '0 4px 16px rgba(139,92,246,0.3)' : 'none' }}
                                            >
                                                {item.userShape ? (
                                                    <ShapeIcon type={item.userShape} size={28} className="text-amber-400 w-7 h-7 sm:w-8 sm:h-8" strokeWidth={2} />
                                                ) : (
                                                    <span className="text-white/20 text-2xl">?</span>
                                                )}
                                            </motion.button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Shape Selection Modal */}
                            <AnimatePresence>
                                {selectedSlotId && phase === 'playing' && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 flex items-center justify-center p-4"
                                        onClick={() => setSelectedSlotId(null)}
                                    >
                                        <motion.div
                                            initial={{ scale: 0.8, y: 40 }}
                                            animate={{ scale: 1, y: 0 }}
                                            exit={{ scale: 0.8, y: 40 }}
                                            className="bg-slate-800/90 backdrop-blur-xl rounded-2xl p-6 w-full max-w-lg border border-violet-500/30"
                                            style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}
                                            onClick={e => e.stopPropagation()}
                                        >
                                            <div className="text-center mb-4 font-bold text-violet-300 text-sm uppercase tracking-wider">Bir Şekil Seçin</div>
                                            <div className="flex flex-wrap justify-center gap-3">
                                                {keyMappings.map(mapping => (
                                                    <motion.button
                                                        key={mapping.shape}
                                                        whileHover={{ scale: 1.1, y: -2 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => handleShapeSelect(mapping.shape)}
                                                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 border-white/10 hover:border-violet-400 bg-white/5 hover:bg-violet-500/20 flex flex-col items-center justify-center gap-1 transition-colors"
                                                    >
                                                        <ShapeIcon type={mapping.shape} size={28} className="text-amber-400 w-7 h-7 sm:w-8 sm:h-8" />
                                                        <span className="text-[9px] text-slate-400 font-medium">{SHAPE_LABELS[mapping.shape]}</span>
                                                    </motion.button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Submit Button */}
                            {phase === 'playing' && (
                                <div className="flex justify-center mt-4">
                                    <motion.button
                                        whileHover={allFilled ? { scale: 1.05, y: -2 } : {}}
                                        whileTap={allFilled ? { scale: 0.95 } : {}}
                                        onClick={submitRound}
                                        disabled={!allFilled}
                                        className={`px-10 py-4 rounded-2xl font-bold text-lg transition-all ${allFilled
                                                ? 'bg-gradient-to-r from-violet-500 to-amber-500 text-white cursor-pointer'
                                                : 'bg-white/10 text-white/30 cursor-not-allowed'
                                            }`}
                                        style={allFilled ? { boxShadow: '0 8px 32px rgba(139,92,246,0.35)' } : {}}
                                    >
                                        <div className="flex items-center gap-3">
                                            <CheckCircle2 size={24} />
                                            <span>Kontrol Et</span>
                                            <span className="text-xs opacity-60 hidden sm:block">(Enter)</span>
                                        </div>
                                    </motion.button>
                                </div>
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
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center"><p className="text-slate-400 text-sm">Skor</p><p className="text-2xl font-bold text-amber-400">{score}</p></div>
                                    <div className="text-center"><p className="text-slate-400 text-sm">Seviye</p><p className="text-2xl font-bold text-emerald-400">{level}</p></div>
                                    <div className="text-center"><p className="text-slate-400 text-sm">Ort. Tepki</p><p className="text-2xl font-bold text-cyan-400">{avgReaction}ms</p></div>
                                </div>
                            </div>
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleStart}
                                className="px-10 py-5 bg-gradient-to-r from-violet-500 to-amber-500 rounded-2xl font-bold text-xl" style={{ boxShadow: '0 8px 32px rgba(139,92,246,0.4)' }}>
                                <div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Dene</span></div>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* ── Victory ── */}
                    {phase === 'victory' && (
                        <motion.div key="victory" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
                            <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-[40%] flex items-center justify-center"
                                style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3)' }}
                                animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }} transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}>
                                <Trophy size={48} className="text-white" />
                            </motion.div>
                            <h2 className="text-3xl font-bold text-amber-400 mb-4">🎉 Şampiyon!</h2>
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10">
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="text-center"><p className="text-slate-400 text-sm">Skor</p><p className="text-3xl font-bold text-amber-400">{score}</p></div>
                                    <div className="text-center"><p className="text-slate-400 text-sm">Ort. Tepki</p><p className="text-3xl font-bold text-cyan-400">{avgReaction}ms</p></div>
                                </div>
                            </div>
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleStart}
                                className="px-10 py-5 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-2xl font-bold text-xl" style={{ boxShadow: '0 8px 32px rgba(245,158,11,0.4)' }}>
                                <div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Oyna</span></div>
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Feedback Overlay */}
                <GameFeedbackBanner feedback={feedbackState} />
            </div>
        </div>
    );
};

export default AttentionCodingGame;

