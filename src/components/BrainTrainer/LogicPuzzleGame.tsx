import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer, Target,
    XCircle, ChevronLeft, Zap, Heart, FlaskConical
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useExam } from '../../contexts/ExamContext';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';

// ============== CONSTANTS ==============
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;

// ============== TYPES ==============
type ShapeType = 'circle' | 'square' | 'triangle' | 'pentagon' | 'hexagon' | 'star' | 'diamond';
type ShapeColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange' | 'cyan';
type ShapeFill = 'solid' | 'outline' | 'striped';

interface ShapeData {
    id: string;
    type: ShapeType;
    color: ShapeColor;
    fill: ShapeFill;
    rotation: number;
}

interface ShapeGroupData {
    id: string;
    shapes: ShapeData[];
}

interface PuzzleData {
    ruleName: string;
    ruleDescription: string;
    examples: ShapeGroupData[];
    options: { group: ShapeGroupData; isCorrect: boolean }[];
}

type Phase = 'welcome' | 'playing' | 'feedback' | 'game_over' | 'victory';

interface LogicPuzzleGameProps { examMode?: boolean; }

// ============== FEEDBACK ==============
// ============== SHAPE CONSTANTS ==============
const AVAILABLE_SHAPES: ShapeType[] = ['circle', 'square', 'triangle', 'pentagon', 'hexagon', 'star', 'diamond'];
const AVAILABLE_COLORS: ShapeColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'cyan'];

const COLORS_MAP: Record<ShapeColor, string> = {
    red: '#ef4444', blue: '#60a5fa', green: '#34d399', yellow: '#fbbf24',
    purple: '#a78bfa', orange: '#fb923c', cyan: '#22d3ee',
};

// ============== HELPERS ==============
const generateId = () => Math.random().toString(36).substr(2, 9);
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = <T,>(arr: T[]): T => arr[randomInt(0, arr.length - 1)];
const shuffle = <T,>(array: T[]): T[] => [...array].sort(() => Math.random() - 0.5);
const randomFill = (): ShapeFill => randomItem(['solid', 'outline', 'striped']);

const generateShape = (overrides: Partial<ShapeData> = {}): ShapeData => ({
    id: generateId(),
    type: randomItem(AVAILABLE_SHAPES),
    color: randomItem(AVAILABLE_COLORS),
    fill: randomFill(),
    rotation: randomInt(0, 360),
    ...overrides
});

const generateGroup = (count: number, constraintFn: (index: number) => Partial<ShapeData>): ShapeGroupData => {
    const shapes: ShapeData[] = [];
    for (let i = 0; i < count; i++) {
        const base = generateShape();
        const forced = constraintFn(i);
        shapes.push({ ...base, ...forced });
    }
    return { id: generateId(), shapes };
};

const translateColor = (c: string) => {
    const map: Record<string, string> = {
        red: 'Kırmızı', blue: 'Mavi', green: 'Yeşil', yellow: 'Sarı',
        purple: 'Mor', orange: 'Turuncu', cyan: 'Turkuaz'
    };
    return map[c] || c;
};

const translateType = (t: string) => {
    const map: Record<string, string> = {
        circle: 'Daire', square: 'Kare', triangle: 'Üçgen',
        pentagon: 'Beşgen', hexagon: 'Altıgen', star: 'Yıldız', diamond: 'Eşkenar Dörtgen'
    };
    return map[t] || t;
};

// ============== PUZZLE GENERATORS ==============

// Rule 1: All shapes share a specific color
const puzzleSameColor = (): PuzzleData => {
    const targetColor = randomItem(AVAILABLE_COLORS);
    const otherColors = AVAILABLE_COLORS.filter(c => c !== targetColor);
    const ruleFn = () => ({ color: targetColor });
    const wrongFn = () => ({ color: randomItem(otherColors) });

    return {
        ruleName: "Renk Uyumu",
        ruleDescription: `Bu gruptaki tüm şekiller ${translateColor(targetColor)} rengindedir.`,
        examples: [generateGroup(randomInt(2, 3), ruleFn), generateGroup(randomInt(2, 3), ruleFn)],
        options: shuffle([
            { group: generateGroup(randomInt(2, 3), ruleFn), isCorrect: true },
            { group: generateGroup(randomInt(2, 3), wrongFn), isCorrect: false },
            { group: generateGroup(randomInt(2, 3), () => ({ color: Math.random() > 0.5 ? targetColor : randomItem(otherColors) })), isCorrect: false },
            { group: generateGroup(randomInt(2, 3), wrongFn), isCorrect: false },
        ])
    };
};

// Rule 2: All shapes share a specific type
const puzzleSameType = (): PuzzleData => {
    const targetType = randomItem(AVAILABLE_SHAPES);
    const otherTypes = AVAILABLE_SHAPES.filter(t => t !== targetType);
    const ruleFn = () => ({ type: targetType });
    const wrongFn = () => ({ type: randomItem(otherTypes) });

    return {
        ruleName: "Şekil Benzerliği",
        ruleDescription: `Bu gruptaki tüm şekiller birer ${translateType(targetType)}.`,
        examples: [generateGroup(randomInt(2, 3), ruleFn), generateGroup(randomInt(2, 3), ruleFn)],
        options: shuffle([
            { group: generateGroup(randomInt(2, 3), ruleFn), isCorrect: true },
            { group: generateGroup(randomInt(2, 3), wrongFn), isCorrect: false },
            { group: generateGroup(randomInt(2, 3), () => ({ type: Math.random() > 0.5 ? targetType : randomItem(otherTypes) })), isCorrect: false },
            { group: generateGroup(randomInt(2, 3), wrongFn), isCorrect: false },
        ])
    };
};

// Rule 3: Contains exactly one specific item
const puzzleSpecificItem = (): PuzzleData => {
    const targetType = randomItem(AVAILABLE_SHAPES);
    const targetColor = randomItem(AVAILABLE_COLORS);

    const createValidGroup = () => {
        const count = randomInt(2, 4);
        const shapes: ShapeData[] = [generateShape({ type: targetType, color: targetColor })];
        for (let i = 1; i < count; i++) {
            let s = generateShape();
            while (s.type === targetType && s.color === targetColor) s = generateShape();
            shapes.push(s);
        }
        return { id: generateId(), shapes: shuffle(shapes) };
    };

    const createInvalidGroup = () => {
        const hasTarget = Math.random() > 0.5;
        const count = randomInt(2, 4);
        const shapes: ShapeData[] = [];
        if (!hasTarget) {
            for (let i = 0; i < count; i++) {
                let s = generateShape();
                while (s.type === targetType && s.color === targetColor) s = generateShape();
                shapes.push(s);
            }
        } else {
            shapes.push(generateShape({ type: targetType, color: targetColor }));
            shapes.push(generateShape({ type: targetType, color: targetColor }));
            for (let i = 2; i < count; i++) shapes.push(generateShape());
        }
        return { id: generateId(), shapes: shuffle(shapes) };
    };

    return {
        ruleName: "Gizli Nesne",
        ruleDescription: `Her grupta en az bir tane ${translateColor(targetColor)} ${translateType(targetType)} bulunmalıdır.`,
        examples: [createValidGroup(), createValidGroup()],
        options: shuffle([
            { group: createValidGroup(), isCorrect: true },
            { group: createInvalidGroup(), isCorrect: false },
            { group: createInvalidGroup(), isCorrect: false },
            { group: createInvalidGroup(), isCorrect: false },
        ])
    };
};

// Rule 4: Count Match
const puzzleCountMatch = (): PuzzleData => {
    const targetCount = randomInt(1, 4);
    const createValid = () => generateGroup(targetCount, () => ({}));
    const createInvalid = () => {
        let c = randomInt(1, 4);
        while (c === targetCount) c = randomInt(1, 4);
        return generateGroup(c, () => ({}));
    };

    return {
        ruleName: "Sayı Kuralı",
        ruleDescription: `Her grupta tam olarak ${targetCount} adet şekil bulunmalıdır.`,
        examples: [createValid(), createValid()],
        options: shuffle([
            { group: createValid(), isCorrect: true },
            { group: createInvalid(), isCorrect: false },
            { group: createInvalid(), isCorrect: false },
            { group: createInvalid(), isCorrect: false },
        ])
    };
};

// Rule 5: All same fill
const puzzleSameFill = (): PuzzleData => {
    const targetFill = randomFill();
    const otherFills: ShapeFill[] = (['solid', 'outline', 'striped'] as ShapeFill[]).filter(f => f !== targetFill);
    const fillNames: Record<ShapeFill, string> = { solid: 'Dolu', outline: 'Çerçeve', striped: 'Çizgili' };

    return {
        ruleName: "Dolgu Uyumu",
        ruleDescription: `Bu gruptaki tüm şekiller ${fillNames[targetFill]} dolgudadır.`,
        examples: [
            generateGroup(randomInt(2, 3), () => ({ fill: targetFill })),
            generateGroup(randomInt(2, 3), () => ({ fill: targetFill })),
        ],
        options: shuffle([
            { group: generateGroup(randomInt(2, 3), () => ({ fill: targetFill })), isCorrect: true },
            { group: generateGroup(randomInt(2, 3), () => ({ fill: randomItem(otherFills) })), isCorrect: false },
            { group: generateGroup(randomInt(2, 3), () => ({ fill: randomItem(otherFills) })), isCorrect: false },
            { group: generateGroup(randomInt(2, 3), () => ({ fill: randomItem(otherFills) })), isCorrect: false },
        ])
    };
};

// Progressive difficulty puzzle selection
function generatePuzzleForLevel(level: number): PuzzleData {
    if (level <= 5) {
        // Easy: simple single-rule puzzles
        return randomItem([puzzleSameColor, puzzleSameType, puzzleCountMatch])();
    } else if (level <= 12) {
        // Medium: includes fill and specific item rules
        return randomItem([puzzleSameColor, puzzleSameType, puzzleSpecificItem, puzzleCountMatch, puzzleSameFill])();
    } else {
        // Hard: weighted toward harder rules
        return randomItem([puzzleSpecificItem, puzzleSameFill, puzzleSpecificItem, puzzleCountMatch])();
    }
}

// ============== SVG SHAPE RENDERER ==============
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
    let fillStyle = 'none';
    if (data.fill === 'solid') fillStyle = colorHex;
    else if (data.fill === 'striped') fillStyle = `url(#stripe-${data.id})`;

    return (
        <div className="inline-flex items-center justify-center"
            style={{ width: size, height: size, transform: `rotate(${data.rotation}deg)` }}>
            <svg viewBox="0 0 100 100" width="100%" height="100%" className="overflow-visible">
                <defs>
                    <pattern id={`stripe-${data.id}`} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                        <line x1="0" y1="0" x2="0" y2="10" stroke={colorHex} strokeWidth="4" />
                    </pattern>
                </defs>
                <path d={getShapePath(data.type)} fill={fillStyle} stroke={colorHex} strokeWidth={3} strokeLinejoin="round" />
            </svg>
        </div>
    );
};

const ShapeGroupView: React.FC<{
    group: ShapeGroupData;
    label?: string;
    onClick?: () => void;
    selected?: boolean;
    isCorrectReveal?: boolean | null;
    disabled?: boolean;
}> = ({ group, label, onClick, selected, isCorrectReveal, disabled }) => {
    let bgStyle = 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)';
    let shadow = 'inset 0 -3px 6px rgba(0,0,0,0.2), inset 0 3px 6px rgba(255,255,255,0.05)';
    let borderClass = 'border-white/15';
    let ringClass = '';

    if (isCorrectReveal === true) {
        bgStyle = 'linear-gradient(135deg, rgba(52,211,153,0.25) 0%, rgba(16,185,129,0.15) 100%)';
        shadow = 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 0 20px rgba(52,211,153,0.3)';
        borderClass = 'border-emerald-400';
        ringClass = 'ring-2 ring-emerald-400/50';
    } else if (isCorrectReveal === false && selected) {
        bgStyle = 'linear-gradient(135deg, rgba(239,68,68,0.25) 0%, rgba(220,38,38,0.15) 100%)';
        borderClass = 'border-red-400';
        ringClass = 'ring-2 ring-red-400/50';
    } else if (selected) {
        bgStyle = 'linear-gradient(135deg, #818CF8 0%, #6366F1 100%)';
        shadow = 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.3), 0 0 30px rgba(129,140,248,0.5)';
        borderClass = 'border-indigo-400';
        ringClass = 'ring-2 ring-indigo-400/50';
    } else if (!onClick) {
        // Example group
        borderClass = 'border-violet-500/30 border-dashed';
        bgStyle = 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(139,92,246,0.05) 100%)';
    }

    return (
        <div className="flex flex-col items-center gap-1.5">
            {label && <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">{label}</span>}
            <motion.button
                whileHover={!disabled && onClick ? { scale: 1.03, y: -2 } : {}}
                whileTap={!disabled && onClick ? { scale: 0.97 } : {}}
                onClick={onClick}
                disabled={disabled}
                className={`relative w-full p-4 rounded-2xl border-2 transition-all duration-200 flex flex-wrap items-center justify-center gap-3 min-h-[90px] ${borderClass} ${ringClass} ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
                style={{ background: bgStyle, boxShadow: shadow }}
            >
                {group.shapes.map(shape => <ShapeView key={shape.id} data={shape} size={44} />)}
            </motion.button>
        </div>
    );
};

// ============== MAIN COMPONENT ==============
const LogicPuzzleGame: React.FC<LogicPuzzleGameProps> = ({ examMode = false }) => {
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;
    const navigate = useNavigate();
    const { submitResult } = useExam();

    // Shared Feedback System
    const { feedbackState, showFeedback } = useGameFeedback();

    const hasSavedRef = useRef(false);

    const [phase, setPhase] = useState<Phase>('welcome');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [level, setLevel] = useState(1);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);

    const [puzzle, setPuzzle] = useState<PuzzleData | null>(null);
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);

    useEffect(() => {
        if (phase === 'playing' && timeLeft > 0) {
            timerRef.current = setTimeout(() => setTimeLeft(p => p - 1), 1000);
        } else if (timeLeft === 0 && phase === 'playing') {
            handleGameOver();
        }
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [phase, timeLeft]);

    const initLevel = useCallback((lvl: number) => {
        setPuzzle(generatePuzzleForLevel(lvl));
        setSelectedIdx(null);
    }, []);

    const handleStart = useCallback(() => {
        window.scrollTo(0, 0);
        setPhase('playing');
        setScore(0);
        setLives(INITIAL_LIVES);
        setLevel(1);
        setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
        startTimeRef.current = Date.now();
        hasSavedRef.current = false;
        initLevel(1);
    }, [initLevel]);

    useEffect(() => {
        if ((location.state?.autoStart || examMode) && phase === 'welcome') handleStart();
    }, [location.state, examMode, phase, handleStart]);

    const handleGameOver = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        setPhase('game_over');
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

        if (examMode) {
            submitResult(level >= 5, score, 1000, duration);
            setTimeout(() => navigate('/sinav-simulasyonu'), 1500);
            return;
        }

        await saveGamePlay({
            game_id: 'mantik-bulmacasi',
            score_achieved: score,
            duration_seconds: duration,
            metadata: { levels_completed: level, final_lives: lives },
        });
    }, [saveGamePlay, score, level, lives, examMode, submitResult, navigate]);

    const handleVictory = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        setPhase('victory');
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

        if (examMode) {
            submitResult(true, score, 1000, duration);
            setTimeout(() => navigate('/sinav-simulasyonu'), 1500);
            return;
        }

        await saveGamePlay({
            game_id: 'mantik-bulmacasi',
            score_achieved: score,
            duration_seconds: duration,
            metadata: { levels_completed: MAX_LEVEL, victory: true },
        });
    }, [saveGamePlay, score, examMode, submitResult, navigate]);

    const handleOptionClick = (index: number) => {
        if (phase !== 'playing' || selectedIdx !== null || !puzzle) return;
        setSelectedIdx(index);

        const isCorrect = puzzle.options[index].isCorrect;

        if (isCorrect) {
            // feedbackState managed by useGameFeedback
            setScore(prev => prev + 10 * level);
            showFeedback(true);
            setPhase('feedback');

            setTimeout(() => {
                if (level >= MAX_LEVEL) {
                    handleVictory();
                } else {
                    const newLevel = level + 1;
                    setLevel(newLevel);
                    initLevel(newLevel);
                    setPhase('playing');
                }
            }, 1500);
        } else {
            // feedbackState managed by useGameFeedback
            showFeedback(isCorrect);
            setPhase('feedback');
            const newLives = lives - 1;
            setLives(newLives);

            setTimeout(() => {
                if (newLives <= 0) {
                    handleGameOver();
                } else {
                    initLevel(level);
                    setPhase('playing');
                }
            }, 2000);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-white">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <div className="relative z-10 p-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Link to="/atolyeler/bireysel-degerlendirme" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                        <ChevronLeft size={20} />
                        <span className="hidden sm:inline">Geri</span>
                    </Link>

                    {(phase === 'playing' || phase === 'feedback') && (
                        <div className="flex items-center gap-3 sm:gap-6">
                            <div className="flex items-center gap-1.5 bg-amber-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-amber-500/30">
                                <Star className="text-amber-400" size={16} />
                                <span className="font-bold text-amber-400 text-sm">{score}</span>
                            </div>
                            <div className="flex items-center gap-1 bg-red-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-red-500/30">
                                {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
                                    <Heart key={i} size={14} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-400/30'} />
                                ))}
                            </div>
                            <div className="flex items-center gap-1.5 bg-blue-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-blue-500/30">
                                <Timer className="text-blue-400" size={16} />
                                <span className={`font-bold text-sm ${timeLeft <= 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'}`}>{formatTime(timeLeft)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-emerald-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-emerald-500/30">
                                <Zap className="text-emerald-400" size={16} />
                                <span className="font-bold text-emerald-400 text-sm">{level}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4">
                <AnimatePresence mode="wait">
                    {/* WELCOME */}
                    {phase === 'welcome' && (
                        <motion.div key="welcome" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
                            <div className="mb-6 inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full">
                                <span className="text-[9px] font-black text-blue-300 uppercase tracking-wider">TUZÖ</span>
                                <span className="text-[9px] font-bold text-blue-400">5.5.1 Kural Çıkarsama</span>
                            </div>

                            <motion.div
                                className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-[40%] flex items-center justify-center"
                                style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }}
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <FlaskConical size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                                Görsel Mantık Bulmacası
                            </h1>
                            <p className="text-slate-400 mb-8">
                                Referans gruplardaki gizli kuralı çöz ve seçeneklerden doğru olanı bul!
                            </p>

                            <div className="flex flex-wrap justify-center gap-4 mb-8">
                                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2 border border-white/10">
                                    <Heart className="text-red-400" size={16} />
                                    <span className="text-sm text-slate-300">{INITIAL_LIVES} Can</span>
                                </div>
                                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2 border border-white/10">
                                    <Timer className="text-blue-400" size={16} />
                                    <span className="text-sm text-slate-300">{TIME_LIMIT / 60} Dakika</span>
                                </div>
                                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2 border border-white/10">
                                    <Target className="text-emerald-400" size={16} />
                                    <span className="text-sm text-slate-300">{MAX_LEVEL} Seviye</span>
                                </div>
                            </div>

                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart}
                                className="px-10 py-5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl font-bold text-xl"
                                style={{ boxShadow: '0 8px 32px rgba(59, 130, 246, 0.4)' }}>
                                <div className="flex items-center gap-3">
                                    <Play size={28} className="fill-white" />
                                    <span>Başla</span>
                                </div>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* PLAYING */}
                    {(phase === 'playing' || phase === 'feedback') && puzzle && (
                        <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-3xl">
                            {/* Examples */}
                            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-5 sm:p-6 mb-5 border border-white/10">
                                <h2 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <FlaskConical size={14} />
                                    Referans Gruplar (Mantığı Çöz)
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {puzzle.examples.map((ex, i) => (
                                        <ShapeGroupView key={ex.id} group={ex} label={`Örnek ${i + 1}`} />
                                    ))}
                                </div>
                            </div>

                            {/* Options */}
                            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-5 sm:p-6 border border-white/10">
                                <h2 className="text-xs font-bold text-purple-400 mb-4 text-center uppercase tracking-wider">
                                    Hangisi kurala uyuyor?
                                </h2>
                                <div className="grid grid-cols-2 gap-4">
                                    {puzzle.options.map((opt, i) => (
                                        <ShapeGroupView
                                            key={opt.group.id}
                                            group={opt.group}
                                            onClick={() => handleOptionClick(i)}
                                            selected={selectedIdx === i}
                                            isCorrectReveal={phase === 'feedback' ? opt.isCorrect : null}
                                            disabled={phase === 'feedback'}
                                        />
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* GAME OVER */}
                    {phase === 'game_over' && (
                        <motion.div key="game_over" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
                            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-red-500 to-rose-600 rounded-3xl flex items-center justify-center"
                                style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.2), 0 8px 24px rgba(0,0,0,0.3)' }}>
                                <XCircle size={48} className="text-white" />
                            </div>
                            <h2 className="text-3xl font-bold text-red-400 mb-4">Oyun Bitti!</h2>
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center"><p className="text-slate-400 text-sm">Skor</p><p className="text-2xl font-bold text-amber-400">{score}</p></div>
                                    <div className="text-center"><p className="text-slate-400 text-sm">Seviye</p><p className="text-2xl font-bold text-emerald-400">{level}</p></div>
                                </div>
                            </div>
                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart}
                                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl font-bold text-lg"
                                style={{ boxShadow: '0 8px 32px rgba(59, 130, 246, 0.4)' }}>
                                <div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Dene</span></div>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* VICTORY */}
                    {phase === 'victory' && (
                        <motion.div key="victory" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
                            <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-3xl flex items-center justify-center"
                                style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }}
                                animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}>
                                <Trophy size={48} className="text-white" />
                            </motion.div>
                            <h2 className="text-3xl font-bold text-amber-400 mb-4">🎉 Şampiyon!</h2>
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10">
                                <p className="text-4xl font-bold text-amber-400">{score}</p>
                                <p className="text-slate-400">Toplam Puan</p>
                            </div>
                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart}
                                className="px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-2xl font-bold text-lg"
                                style={{ boxShadow: '0 8px 32px rgba(245, 158, 11, 0.4)' }}>
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

export default LogicPuzzleGame;
