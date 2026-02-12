import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer, Target,
    XCircle, ChevronLeft, Zap, Heart, Scale, Eye, EyeOff, ArrowRight, HelpCircle
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
enum ShapeType {
    SQUARE = 'SQUARE',
    TRIANGLE = 'TRIANGLE',
    CIRCLE = 'CIRCLE',
    STAR = 'STAR',
    PENTAGON = 'PENTAGON',
}

type WeightMap = { [key in ShapeType]?: number };
type PanContent = { [key in ShapeType]?: number };

interface BalanceState {
    left: PanContent;
    right: PanContent;
}

interface LevelData {
    levelNumber: number;
    weights: WeightMap;
    referenceEquation: BalanceState;
    question: { left: PanContent };
    description: string;
    detailedExplanation?: string;
}

type Phase = 'welcome' | 'playing' | 'feedback' | 'game_over' | 'victory';

interface VisualAlgebraGameProps {
    examMode?: boolean;
    examLevel?: number;
    examTimeLimit?: number;
}

// ============== FEEDBACK MESSAGES ==============
// ============== GAME ENGINE ==============
const AVAILABLE_SHAPES = [ShapeType.SQUARE, ShapeType.TRIANGLE, ShapeType.CIRCLE, ShapeType.STAR];

function getShapesForLevel(level: number): ShapeType[] {
    if (level <= 3) return AVAILABLE_SHAPES.slice(0, 2);
    if (level <= 7) return AVAILABLE_SHAPES.slice(0, 3);
    return AVAILABLE_SHAPES;
}

function generateWeights(shapes: ShapeType[], level: number): WeightMap {
    const weights: WeightMap = {};
    const maxWeight = Math.min(3 + Math.floor(level / 3), 10);
    shapes.forEach(s => {
        weights[s] = Math.floor(Math.random() * maxWeight) + 1;
    });
    // Ensure at least two different weights for puzzle variety
    const vals = Object.values(weights) as number[];
    if (vals.every(v => v === vals[0]) && shapes.length > 1) {
        weights[shapes[1]] = (weights[shapes[0]]! % maxWeight) + 1;
    }
    return weights;
}

function calculateWeight(content: PanContent, weights: WeightMap): number {
    let total = 0;
    for (const [shape, count] of Object.entries(content)) {
        const w = weights[shape as ShapeType] || 0;
        total += w * (count as number);
    }
    return total;
}

function isBalanced(left: PanContent, right: PanContent, weights: WeightMap): boolean {
    const lw = calculateWeight(left, weights);
    const rw = calculateWeight(right, weights);
    return lw === rw && lw > 0;
}

function generateLevel(level: number): LevelData {
    const shapes = getShapesForLevel(level);
    const weights = generateWeights(shapes, level);

    // Generate reference equation (balanced)
    const refLeft: PanContent = {};
    const refRight: PanContent = {};
    const numRefShapes = Math.min(1 + Math.floor(level / 4), 3);

    for (let i = 0; i < numRefShapes; i++) {
        const shape = shapes[i % shapes.length];
        refLeft[shape] = (refLeft[shape] || 0) + 1;
    }

    // Make reference balanced by adding shapes to the right
    const leftWeight = calculateWeight(refLeft, weights);
    // Try to compose rightWeight using available shapes
    let remaining = leftWeight;
    const shuffled = [...shapes].sort(() => Math.random() - 0.5);
    for (const s of shuffled) {
        const w = weights[s]!;
        if (w > 0 && remaining >= w) {
            const count = Math.floor(remaining / w);
            if (count > 0) {
                const used = Math.min(count, Math.ceil(level / 5) + 1);
                refRight[s] = used;
                remaining -= used * w;
            }
        }
        if (remaining <= 0) break;
    }

    // If not perfectly balanced, adjust
    if (remaining > 0) {
        // Force balance by setting a shape weight to make it work
        const firstShape = shapes[0];
        refRight[firstShape] = (refRight[firstShape] || 0) + 1;
        weights[firstShape] = remaining + (weights[firstShape]! * ((refRight[firstShape] || 1) - 1));
        // Recalculate to ensure
        if (!isBalanced(refLeft, refRight, weights)) {
            // Fallback: simple 1:1 reference
            const s1 = shapes[0];
            const s2 = shapes[1] || shapes[0];
            const w1 = weights[s1]!;
            weights[s2] = w1;
            Object.keys(refLeft).forEach(k => delete refLeft[k as ShapeType]);
            Object.keys(refRight).forEach(k => delete refRight[k as ShapeType]);
            refLeft[s1] = 1;
            refRight[s2] = 1;
        }
    }

    // Generate question (left side given, right side for user to fill)
    const qLeft: PanContent = {};
    const numQShapes = Math.min(1 + Math.floor(level / 3), 4);
    for (let i = 0; i < numQShapes; i++) {
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        qLeft[shape] = (qLeft[shape] || 0) + 1;
    }

    // Generate the expected answer for explanation
    const qLeftWeight = calculateWeight(qLeft, weights);
    let explanation = `Referans teraziden şekillerin ağırlıklarını çıkar:\n`;
    for (const s of shapes) {
        if (weights[s]) {
            explanation += `• ${getShapeName(s)} = ${weights[s]}\n`;
        }
    }
    explanation += `\nSol kefe toplam ağırlığı: ${qLeftWeight}\n`;
    explanation += `Sağ kefeye ${qLeftWeight} birim ağırlık eklemelisin.`;

    return {
        levelNumber: level,
        weights,
        referenceEquation: { left: refLeft, right: refRight },
        question: { left: qLeft },
        description: level <= 2
            ? 'Referans teraziye bakarak şekillerin değerlerini çöz ve soru terazisini dengele!'
            : 'Referans ipucundan kuralı bul, soru terazisini dengele!',
        detailedExplanation: explanation,
    };
}

function getShapeName(type: ShapeType): string {
    switch (type) {
        case ShapeType.SQUARE: return 'Kare';
        case ShapeType.TRIANGLE: return 'Üçgen';
        case ShapeType.CIRCLE: return 'Daire';
        case ShapeType.STAR: return 'Yıldız';
        case ShapeType.PENTAGON: return 'Beşgen';
    }
}

// ============== SHAPE ICON COMPONENT ==============
const ShapeIcon: React.FC<{
    type: ShapeType;
    size?: number;
    weight?: number;
    className?: string;
}> = ({ type, size = 40, weight, className = '' }) => {
    const textEl = weight !== undefined ? (
        <text
            x="12" y="16" textAnchor="middle" fill="#1e293b"
            fontSize="11" fontWeight="900" stroke="white" strokeWidth="2.5"
            paintOrder="stroke" style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
            {weight}
        </text>
    ) : null;

    const svgClass = `transition-all duration-300 drop-shadow-lg ${className}`;

    switch (type) {
        case ShapeType.SQUARE:
            return (
                <svg viewBox="0 0 24 24" fill="#818CF8" className={svgClass} width={size} height={size}>
                    <rect x="3" y="3" width="18" height="18" rx="3" ry="3" />
                    {textEl}
                </svg>
            );
        case ShapeType.TRIANGLE:
            return (
                <svg viewBox="0 0 24 24" fill="#FB7185" className={svgClass} width={size} height={size}>
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    {weight !== undefined && (
                        <text x="12" y="17" textAnchor="middle" fill="#1e293b" fontSize="10" fontWeight="900" stroke="white" strokeWidth="2.5" paintOrder="stroke" style={{ pointerEvents: 'none' }}>
                            {weight}
                        </text>
                    )}
                </svg>
            );
        case ShapeType.CIRCLE:
            return (
                <svg viewBox="0 0 24 24" fill="#34D399" className={svgClass} width={size} height={size}>
                    <circle cx="12" cy="12" r="10" />
                    {weight !== undefined && (
                        <text x="12" y="16" textAnchor="middle" fill="#1e293b" fontSize="11" fontWeight="900" stroke="white" strokeWidth="2.5" paintOrder="stroke" style={{ pointerEvents: 'none' }}>
                            {weight}
                        </text>
                    )}
                </svg>
            );
        case ShapeType.STAR:
            return (
                <svg viewBox="0 0 24 24" fill="#FBBF24" className={svgClass} width={size} height={size}>
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    {weight !== undefined && (
                        <text x="12" y="16" textAnchor="middle" fill="#1e293b" fontSize="10" fontWeight="900" stroke="white" strokeWidth="2.5" paintOrder="stroke" style={{ pointerEvents: 'none' }}>
                            {weight}
                        </text>
                    )}
                </svg>
            );
        case ShapeType.PENTAGON:
            return (
                <svg viewBox="0 0 24 24" fill="#A78BFA" className={svgClass} width={size} height={size}>
                    <path d="M12 2L2 9l4 13h12l4-13L12 2z" />
                    {textEl}
                </svg>
            );
        default:
            return null;
    }
};

// ============== BALANCE SCALE COMPONENT ==============
const BalanceScaleView: React.FC<{
    leftContent: PanContent;
    rightContent: PanContent;
    weights: WeightMap;
    isInteractive?: boolean;
    onRemoveFromRight?: (shape: ShapeType) => void;
    showWeights?: boolean;
}> = ({ leftContent, rightContent, weights, isInteractive = false, onRemoveFromRight, showWeights = false }) => {
    const leftWeight = calculateWeight(leftContent, weights);
    const rightWeight = calculateWeight(rightContent, weights);

    const tiltAngle = useMemo(() => {
        if (leftWeight === rightWeight) return 0;
        const diff = rightWeight - leftWeight;
        const maxTilt = 15;
        const sensitivity = 5;
        const rawTilt = (diff / sensitivity) * maxTilt;
        return Math.max(Math.min(rawTilt, maxTilt), -maxTilt);
    }, [leftWeight, rightWeight]);

    const renderItems = (content: PanContent, side: 'left' | 'right') => {
        const items: React.ReactElement[] = [];
        Object.entries(content).forEach(([shape, count]) => {
            const shapeType = shape as ShapeType;
            const weightVal = weights[shapeType];
            for (let i = 0; i < count; i++) {
                items.push(
                    <div
                        key={`${shape}-${i}`}
                        className={`relative ${isInteractive && side === 'right' ? 'cursor-pointer hover:scale-110 active:scale-90' : ''} transition-transform`}
                        onClick={() => isInteractive && side === 'right' && onRemoveFromRight && onRemoveFromRight(shapeType)}
                    >
                        <ShapeIcon type={shapeType} size={28} weight={showWeights ? weightVal : undefined} />
                    </div>
                );
            }
        });
        return items;
    };

    const balanced = leftWeight === rightWeight && leftWeight > 0;

    return (
        <div className="flex flex-col items-center justify-center w-full py-3 select-none">
            <div className="relative w-64 h-36 sm:w-80 sm:h-44">
                {/* Stand */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-20 bg-slate-500 rounded-t-lg z-0" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-3 bg-slate-500 rounded-full z-0" />

                {/* Beam */}
                <div
                    className="absolute top-4 left-0 w-full h-full transition-transform duration-1000 ease-in-out z-10 origin-[50%_12px]"
                    style={{ transform: `rotate(${tiltAngle}deg)` }}
                >
                    <div className="absolute top-0 left-0 w-full h-2.5 bg-slate-400 rounded-full"
                        style={{ boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.2)' }} />

                    {/* Center pin */}
                    <div className="absolute top-[-4px] left-1/2 -translate-x-1/2 w-5 h-5 bg-amber-400 rounded-full border-2 border-slate-600 z-20 flex items-center justify-center"
                        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                        {balanced && <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />}
                    </div>

                    {/* Left Pan */}
                    <div className="absolute left-2 top-1 flex flex-col items-center origin-top" style={{ transform: `rotate(${-tiltAngle}deg)` }}>
                        <div className="h-14 w-0.5 bg-slate-500/60" />
                        <div className="w-24 h-3 bg-slate-400/80 border-b-4 border-slate-500/60 rounded-b-3xl relative flex justify-center"
                            style={{ boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2)' }}>
                            <div className="absolute bottom-full mb-1 flex flex-wrap justify-center items-end gap-1 w-28 min-h-[36px] pointer-events-none">
                                {renderItems(leftContent, 'left')}
                            </div>
                        </div>
                    </div>

                    {/* Right Pan */}
                    <div className="absolute right-2 top-1 flex flex-col items-center origin-top" style={{ transform: `rotate(${-tiltAngle}deg)` }}>
                        <div className="h-14 w-0.5 bg-slate-500/60" />
                        <div className={`w-24 h-3 border-b-4 rounded-b-3xl relative flex justify-center transition-colors ${isInteractive ? 'bg-indigo-400/40 border-indigo-500/50' : 'bg-slate-400/80 border-slate-500/60'}`}
                            style={{ boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2)' }}>
                            <div className="absolute bottom-full mb-1 flex flex-wrap justify-center items-end gap-1 w-28 min-h-[36px]">
                                {renderItems(rightContent, 'right')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============== MAIN COMPONENT ==============
const VisualAlgebraGame: React.FC<VisualAlgebraGameProps> = ({ examMode = false }) => {
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;
    const navigate = useNavigate();
    const { submitResult } = useExam();

    // Shared Feedback System
    const { feedbackState, showFeedback } = useGameFeedback();

    // Refs
    const hasSavedRef = useRef(false);

    // Core State
    const [phase, setPhase] = useState<Phase>('welcome');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [level, setLevel] = useState(1);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);

    // Game State
    const [levelData, setLevelData] = useState<LevelData | null>(null);
    const [userRightPan, setUserRightPan] = useState<PanContent>({});
    const [showWeights, setShowWeights] = useState(false);
    const [showExplanation, setShowExplanation] = useState(false);

    // Refs
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);

    // Timer Effect
    useEffect(() => {
        if (phase === 'playing' && timeLeft > 0) {
            timerRef.current = setTimeout(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && phase === 'playing') {
            handleGameOver();
        }
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [phase, timeLeft]);

    // Generate level data
    const initLevel = useCallback((lvl: number) => {
        const data = generateLevel(lvl);
        setLevelData(data);
        setUserRightPan({});
        setShowWeights(false);
        setShowExplanation(false);
    }, []);

    // Start game
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
    }, [hasSavedRef, initLevel]);

    // Auto-Start from HUB or Exam Mode
    useEffect(() => {
        if ((location.state?.autoStart || examMode) && phase === 'welcome') {
            handleStart();
        }
    }, [location.state, examMode, phase, handleStart]);

    // Game Over Handler
    const handleGameOver = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;

        setPhase('game_over');

        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

        if (examMode) {
            const passed = level >= 5;
            submitResult(passed, score, 1000, duration);
            setTimeout(() => navigate('/sinav-simulasyonu'), 1500);
            return;
        }

        await saveGamePlay({
            game_id: 'gorsel-cebir-dengesi',
            score_achieved: score,
            duration_seconds: duration,
            metadata: {
                levels_completed: level,
                final_lives: lives,
            }
        });
    }, [saveGamePlay, score, level, lives, hasSavedRef, examMode, submitResult, navigate]);

    // Victory Handler
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
            game_id: 'gorsel-cebir-dengesi',
            score_achieved: score,
            duration_seconds: duration,
            metadata: {
                levels_completed: MAX_LEVEL,
                victory: true,
            }
        });
    }, [saveGamePlay, score, hasSavedRef, examMode, submitResult, navigate]);

    // Add shape to user pan
    const addToPan = (shape: ShapeType) => {
        if (phase !== 'playing') return;
        setUserRightPan(prev => ({
            ...prev,
            [shape]: (prev[shape] || 0) + 1,
        }));
    };

    // Remove shape from user pan
    const removeFromPan = (shape: ShapeType) => {
        if (phase !== 'playing') return;
        setUserRightPan(prev => {
            const current = prev[shape] || 0;
            if (current <= 0) return prev;
            const newCount = current - 1;
            if (newCount === 0) {
                const { [shape]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [shape]: newCount };
        });
    };

    // Check answer
    const checkAnswer = () => {
        if (!levelData) return;

        const balanced = isBalanced(levelData.question.left, userRightPan, levelData.weights);

        if (balanced) {
            // feedbackState message handled by useGameFeedback hook
            // feedbackState managed by useGameFeedback
            showFeedback(true);
            setScore(prev => prev + 10 * level);
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
            }, 1200);
        } else {
            // feedbackState message handled by useGameFeedback hook
            // feedbackState managed by useGameFeedback
            showFeedback(false);
            setPhase('feedback');

            const newLives = lives - 1;
            setLives(newLives);

            setTimeout(() => {
                if (newLives <= 0) {
                    handleGameOver();
                } else {
                    setUserRightPan({});
                    setPhase('playing');
                }
            }, 1200);
        }
    };

    // Reset current pan
    const resetPan = () => {
        setUserRightPan({});
    };

    // Format time
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Available shapes for palette
    const availableShapes = levelData
        ? (Object.keys(levelData.weights) as ShapeType[]).filter(s => AVAILABLE_SHAPES.includes(s))
        : [];

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-950 to-slate-900 text-white">
            {/* Decorative Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
                <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <div className="relative z-10 p-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Link
                        to="/atolyeler/bireysel-degerlendirme"
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft size={20} />
                        <span className="hidden sm:inline">Geri</span>
                    </Link>

                    {(phase === 'playing' || phase === 'feedback') && (
                        <div className="flex items-center gap-3 sm:gap-6">
                            {/* Score */}
                            <div className="flex items-center gap-1.5 bg-amber-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-amber-500/30">
                                <Star className="text-amber-400" size={16} />
                                <span className="font-bold text-amber-400 text-sm">{score}</span>
                            </div>

                            {/* Lives */}
                            <div className="flex items-center gap-1 bg-red-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-red-500/30">
                                {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
                                    <Heart
                                        key={i}
                                        size={14}
                                        className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-400/30'}
                                    />
                                ))}
                            </div>

                            {/* Timer */}
                            <div className="flex items-center gap-1.5 bg-blue-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-blue-500/30">
                                <Timer className="text-blue-400" size={16} />
                                <span className={`font-bold text-sm ${timeLeft <= 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'}`}>
                                    {formatTime(timeLeft)}
                                </span>
                            </div>

                            {/* Level */}
                            <div className="flex items-center gap-1.5 bg-emerald-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-emerald-500/30">
                                <Zap className="text-emerald-400" size={16} />
                                <span className="font-bold text-emerald-400 text-sm">{level}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4">
                <AnimatePresence mode="wait">
                    {/* ==================== WELCOME ==================== */}
                    {phase === 'welcome' && (
                        <motion.div
                            key="welcome"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center max-w-xl"
                        >
                            {/* TUZÖ Badge */}
                            <div className="mb-6 inline-flex items-center gap-1.5 px-3 py-1 bg-violet-500/20 border border-violet-500/30 rounded-full">
                                <span className="text-[9px] font-black text-violet-300 uppercase tracking-wider">TUZÖ</span>
                                <span className="text-[9px] font-bold text-violet-400">5.5.2 Kural Çıkarsama</span>
                            </div>

                            {/* Icon */}
                            <motion.div
                                className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-[40%] flex items-center justify-center"
                                style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }}
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Scale size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                Görsel Cebir Dengesi
                            </h1>

                            <p className="text-slate-400 mb-8">
                                Referans terazideki şekillerin ağırlık ilişkisini çöz, soru terazisini dengele!
                                Görsel akıl yürütme ve kural çıkarsama becerini test et.
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

                            <motion.button
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleStart}
                                className="px-10 py-5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl font-bold text-xl"
                                style={{ boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)' }}
                            >
                                <div className="flex items-center gap-3">
                                    <Play size={28} className="fill-white" />
                                    <span>Başla</span>
                                </div>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* ==================== PLAYING ==================== */}
                    {(phase === 'playing' || phase === 'feedback') && levelData && (
                        <motion.div
                            key="playing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full max-w-3xl"
                        >
                            {/* Reference Scale */}
                            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-5 sm:p-6 mb-4 border border-white/10 relative overflow-hidden">
                                <div className="absolute top-0 left-0 bg-slate-700/80 px-3 py-1 rounded-br-xl text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                    <HelpCircle size={12} /> Referans (İpucu)
                                </div>
                                <BalanceScaleView
                                    leftContent={levelData.referenceEquation.left}
                                    rightContent={levelData.referenceEquation.right}
                                    weights={levelData.weights}
                                    showWeights={showWeights}
                                />
                                <p className="text-center text-xs text-slate-500 italic mt-1">
                                    Bu terazi dengede. Şekillerin ilişkisini incele.
                                </p>
                            </div>

                            {/* Question Scale */}
                            <div className={`bg-white/5 backdrop-blur-xl rounded-3xl p-5 sm:p-6 border-2 transition-colors duration-500 ${phase === 'feedback' && feedbackState?.correct ? 'border-emerald-500/50' :
                                phase === 'feedback' && feedbackState && !feedbackState.correct ? 'border-red-500/50' : 'border-indigo-500/40'
                                }`}>
                                <div className="flex justify-between items-center mb-2">
                                    <div className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                        Soru Terazisi
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setShowWeights(!showWeights)}
                                            className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
                                            title={showWeights ? 'Değerleri Gizle' : 'Değerleri Göster'}
                                        >
                                            {showWeights ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                        <button
                                            onClick={resetPan}
                                            className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
                                            title="Sıfırla"
                                        >
                                            <RotateCcw size={16} />
                                        </button>
                                    </div>
                                </div>

                                <BalanceScaleView
                                    leftContent={levelData.question.left}
                                    rightContent={userRightPan}
                                    weights={levelData.weights}
                                    isInteractive={phase === 'playing'}
                                    onRemoveFromRight={removeFromPan}
                                    showWeights={showWeights}
                                />

                                {/* Shape Palette + Check Button */}
                                <div className="mt-4 flex flex-col sm:flex-row items-center gap-4">
                                    {/* Shape palette */}
                                    <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm p-2.5 rounded-2xl border border-white/10 flex-wrap justify-center">
                                        {availableShapes.map(shape => {
                                            const w = levelData.weights[shape];
                                            return (
                                                <motion.button
                                                    key={shape}
                                                    whileHover={{ scale: 1.1, y: -2 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => addToPan(shape)}
                                                    disabled={phase !== 'playing'}
                                                    className="p-3 bg-white/10 rounded-xl border border-white/10 hover:border-indigo-400/50 hover:bg-white/15 transition-all disabled:opacity-40 disabled:pointer-events-none min-w-[56px] min-h-[56px] flex items-center justify-center"
                                                    style={{ boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)' }}
                                                >
                                                    <ShapeIcon type={shape} size={32} weight={showWeights ? w : undefined} />
                                                </motion.button>
                                            );
                                        })}
                                    </div>

                                    {/* Check Button */}
                                    <motion.button
                                        whileHover={{ scale: 1.05, y: -2 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={checkAnswer}
                                        disabled={phase !== 'playing' || Object.keys(userRightPan).length === 0}
                                        className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl font-bold text-lg disabled:opacity-40 disabled:pointer-events-none flex items-center gap-2 min-h-[56px]"
                                        style={{ boxShadow: '0 6px 24px rgba(99, 102, 241, 0.4)' }}
                                    >
                                        Kontrol Et <ArrowRight size={20} />
                                    </motion.button>
                                </div>

                                {/* Explanation (after feedbackState) */}
                                {phase === 'feedback' && levelData.detailedExplanation && (
                                    <div className="mt-4">
                                        <button
                                            onClick={() => setShowExplanation(!showExplanation)}
                                            className="text-xs text-indigo-300 hover:text-indigo-200 transition-colors flex items-center gap-1.5"
                                        >
                                            {showExplanation ? 'Çözümü Gizle' : 'Çözümü Göster'}
                                        </button>
                                        {showExplanation && (
                                            <div className="mt-2 p-3 bg-white/5 rounded-xl text-xs text-slate-300 whitespace-pre-wrap border border-white/10">
                                                {levelData.detailedExplanation}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* ==================== GAME OVER ==================== */}
                    {phase === 'game_over' && (
                        <motion.div
                            key="game_over"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center max-w-xl"
                        >
                            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-red-500 to-rose-600 rounded-3xl flex items-center justify-center"
                                style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.2), 0 8px 24px rgba(0,0,0,0.3)' }}>
                                <XCircle size={48} className="text-white" />
                            </div>

                            <h2 className="text-3xl font-bold text-red-400 mb-4">Oyun Bitti!</h2>

                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Skor</p>
                                        <p className="text-2xl font-bold text-amber-400">{score}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Seviye</p>
                                        <p className="text-2xl font-bold text-emerald-400">{level}</p>
                                    </div>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleStart}
                                className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl font-bold text-lg"
                                style={{ boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)' }}
                            >
                                <div className="flex items-center gap-3">
                                    <RotateCcw size={24} />
                                    <span>Tekrar Dene</span>
                                </div>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* ==================== VICTORY ==================== */}
                    {phase === 'victory' && (
                        <motion.div
                            key="victory"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center max-w-xl"
                        >
                            <motion.div
                                className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-3xl flex items-center justify-center"
                                style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }}
                                animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                <Trophy size={48} className="text-white" />
                            </motion.div>

                            <h2 className="text-3xl font-bold text-amber-400 mb-4">🎉 Şampiyon!</h2>

                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10">
                                <p className="text-4xl font-bold text-amber-400">{score}</p>
                                <p className="text-slate-400">Toplam Puan</p>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleStart}
                                className="px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-2xl font-bold text-lg"
                                style={{ boxShadow: '0 8px 32px rgba(245, 158, 11, 0.4)' }}
                            >
                                <div className="flex items-center gap-3">
                                    <RotateCcw size={24} />
                                    <span>Tekrar Oyna</span>
                                </div>
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

export default VisualAlgebraGame;
