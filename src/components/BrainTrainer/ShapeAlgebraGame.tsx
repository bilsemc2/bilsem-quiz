import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer, Target,
    XCircle, ChevronLeft, Zap, Heart, Equal, Plus, Delete, Check, Brain
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useExam } from '../../contexts/ExamContext';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';

// ─── Constants ───────────────────────────────────────────────
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;
const GAME_ID = 'sekil-cebiri';

type Phase = 'welcome' | 'playing' | 'feedback' | 'game_over' | 'victory';

// ─── Types ───────────────────────────────────────────────────
type ShapeType = 'square' | 'triangle' | 'circle' | 'star' | 'diamond' | 'pentagon' | 'hexagon';
type ColorType = 'red' | 'green' | 'blue' | 'yellow' | 'purple' | 'orange' | 'teal';

interface GameVariable {
    id: string;
    shape: ShapeType;
    color: ColorType;
    value: number;
    dotted?: boolean;
}

interface EquationItem {
    variableId: string;
    count: number;
}

interface Equation {
    id: string;
    items: EquationItem[];
    result: number;
}

interface Question {
    text: string;
    items: EquationItem[];
    answer: number;
}

interface LevelData {
    level: number;
    variables: GameVariable[];
    equations: Equation[];
    question: Question;
}

// ─── Game Logic ──────────────────────────────────────────────
const SHAPES: ShapeType[] = ['square', 'triangle', 'circle', 'star', 'diamond', 'pentagon', 'hexagon'];
const COLORS: ColorType[] = ['red', 'green', 'blue', 'yellow', 'purple', 'orange', 'teal'];

const getRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const generateId = () => Math.random().toString(36).substr(2, 9);

const generateLevel = (level: number): LevelData => {
    let numVariables = 2;
    if (level >= 3) numVariables = 3;
    if (level >= 6) numVariables = 4;
    if (level >= 10) numVariables = 5;

    // Level 5+: noktalı şekiller devreye girer
    const allowDotted = level >= 5;
    // Level 8+: noktalı şekil olma ihtimali artar
    const dottedChance = level >= 12 ? 0.5 : level >= 8 ? 0.35 : 0.25;

    const maxVarValue = 5 + Math.floor(level / 2);

    const usedCombos = new Set<string>();
    const variables: GameVariable[] = [];

    while (variables.length < numVariables) {
        const shape = getRandom(SHAPES);
        const color = getRandom(COLORS);
        const dotted = allowDotted && Math.random() < dottedChance;
        const key = `${shape}-${color}-${dotted ? 'd' : 'n'}`;

        if (!usedCombos.has(key)) {
            usedCombos.add(key);
            variables.push({
                id: generateId(),
                shape,
                color,
                value: Math.floor(Math.random() * maxVarValue) + 1,
                dotted,
            });
        }
    }

    const equations: Equation[] = [];
    const varsInOrder = [...variables];

    for (let i = 0; i < numVariables; i++) {
        const items: EquationItem[] = [];
        let currentSum = 0;
        const rowLength = Math.floor(Math.random() * 2) + 2;

        for (let k = 0; k < rowLength; k++) {
            const possibleVars = varsInOrder.slice(0, i + 1);
            const chosenVar = k === 0 ? varsInOrder[i] : getRandom(possibleVars);
            items.push({ variableId: chosenVar.id, count: 1 });
            currentSum += chosenVar.value;
        }

        equations.push({ id: generateId(), items, result: currentSum });
    }

    if (level > 2) equations.sort(() => Math.random() - 0.5);

    let questionItems: EquationItem[] = [];
    let answer = 0;
    let questionText = 'Aşağıdaki şekil kaç eder?';

    const isComplex = level >= 4 && Math.random() > 0.5;
    if (isComplex) {
        const v1 = getRandom(variables);
        const v2 = getRandom(variables);
        questionItems = [
            { variableId: v1.id, count: 1 },
            { variableId: v2.id, count: 1 },
        ];
        answer = v1.value + v2.value;
        questionText = 'İşlemin sonucu kaçtır?';
    } else {
        const target = getRandom(variables);
        questionItems = [{ variableId: target.id, count: 1 }];
        answer = target.value;
    }

    return { level, variables, equations, question: { text: questionText, items: questionItems, answer } };
};

// ─── Shape SVG Component ─────────────────────────────────────
const getColorHex = (color: ColorType) => {
    const map: Record<ColorType, string> = {
        red: '#ef4444', green: '#22c55e', blue: '#3b82f6', yellow: '#eab308',
        purple: '#a855f7', orange: '#f97316', teal: '#14b8a6',
    };
    return map[color] || '#9ca3af';
};

const ShapeIcon: React.FC<{ shape: ShapeType; color: ColorType; size?: number; className?: string; dotted?: boolean }> = ({
    shape, color, size = 40, className = '', dotted = false,
}) => {
    const fill = getColorHex(color);
    const props = {
        width: size, height: size, viewBox: '0 0 24 24', fill,
        stroke: 'rgba(255,255,255,0.5)', strokeWidth: 1.5,
        strokeLinejoin: 'round' as const,
        className: `drop-shadow-lg ${className}`,
    };

    const paths: Record<ShapeType, React.ReactNode> = {
        square: <rect x="4" y="4" width="16" height="16" rx="2" />,
        circle: <circle cx="12" cy="12" r="9" />,
        triangle: <path d="M12 3l9 16H3z" />,
        diamond: <path d="M12 2L2 12l10 10 10-10z" />,
        pentagon: <path d="M12 2l9.5 6.9-3.6 11.1h-11.8l-3.6-11.1z" />,
        hexagon: <path d="M12 2l8.7 5v10l-8.7 5-8.7-5v-10z" />,
        star: <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />,
    };

    // Noktalı şekiller: şeklin ortasında beyaz nokta
    const dotCenter = shape === 'triangle' ? { cx: 12, cy: 13 } : { cx: 12, cy: 12 };

    return (
        <svg {...props}>
            {paths[shape]}
            {dotted && (
                <circle
                    cx={dotCenter.cx}
                    cy={dotCenter.cy}
                    r={2.5}
                    fill="white"
                    stroke="none"
                    opacity={0.9}
                />
            )}
        </svg>
    );
};

// ─── Sub-Components ──────────────────────────────────────────
const VisualExpressionComp: React.FC<{
    items: EquationItem[]; variables: GameVariable[]; iconSize?: number; animate?: boolean;
}> = ({ items, variables, iconSize = 40, animate = false }) => {
    const visualItems: GameVariable[] = [];
    items.forEach(item => {
        const variable = variables.find(v => v.id === item.variableId);
        if (variable) {
            for (let i = 0; i < item.count; i++) visualItems.push(variable);
        }
    });

    return (
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {visualItems.map((v, idx) => (
                <React.Fragment key={`expr-${idx}`}>
                    {idx > 0 && <Plus className="text-slate-500 w-5 h-5 sm:w-6 sm:h-6" strokeWidth={3} />}
                    <motion.div
                        animate={animate ? { y: [0, -4, 0] } : {}}
                        transition={{ duration: 1.5, repeat: Infinity, delay: idx * 0.2 }}
                    >
                        <ShapeIcon shape={v.shape} color={v.color} size={iconSize} dotted={v.dotted} />
                    </motion.div>
                </React.Fragment>
            ))}
        </div>
    );
};

const EquationRowComp: React.FC<{ equation: Equation; variables: GameVariable[]; index: number }> = ({
    equation, variables, index,
}) => (
    <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
        className="flex items-center justify-center bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 w-full"
    >
        <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
            <VisualExpressionComp items={equation.items} variables={variables} iconSize={44} />
            <Equal className="text-slate-500 w-6 h-6 sm:w-8 sm:h-8 mx-1 sm:mx-2" strokeWidth={3} />
            <span className="text-3xl sm:text-4xl font-black text-white">{equation.result}</span>
        </div>
    </motion.div>
);

const KeypadComp: React.FC<{
    onKeyPress: (k: string) => void; onDelete: () => void; onSubmit: () => void; disabled?: boolean;
}> = ({ onKeyPress, onDelete, onSubmit, disabled }) => {
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
    return (
        <div className="grid grid-cols-3 gap-2 w-full max-w-sm mx-auto mt-4">
            {keys.map(k => (
                <motion.button
                    key={k}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onKeyPress(k)}
                    disabled={disabled}
                    className="bg-white/10 backdrop-blur-sm hover:bg-white/20 active:bg-white/30 border border-white/10 text-white text-2xl font-bold py-4 rounded-2xl transition-all disabled:opacity-30 min-h-[56px]"
                    style={{ boxShadow: 'inset 0 -3px 6px rgba(0,0,0,0.2), inset 0 3px 6px rgba(255,255,255,0.05)' }}
                >
                    {k}
                </motion.button>
            ))}
            <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onDelete}
                disabled={disabled}
                className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 py-4 rounded-2xl transition-all flex items-center justify-center disabled:opacity-30 min-h-[56px]"
            >
                <Delete size={28} />
            </motion.button>
            <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onSubmit}
                disabled={disabled}
                className="col-span-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-4 rounded-2xl font-bold transition-all flex items-center justify-center disabled:opacity-30 min-h-[56px]"
                style={{ boxShadow: '0 4px 20px rgba(99, 102, 241, 0.3)' }}
            >
                <Check size={32} />
            </motion.button>
        </div>
    );
};

// ─── Main Component ──────────────────────────────────────────
interface ShapeAlgebraGameProps {
    examMode?: boolean;
    examLevel?: number;
    examTimeLimit?: number;
}

const ShapeAlgebraGame: React.FC<ShapeAlgebraGameProps> = ({ examMode = false }) => {
    const { saveGamePlay } = useGamePersistence();
    const hasSavedRef = useRef(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { submitResult } = useExam();

    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

    // State
    const [phase, setPhase] = useState<Phase>('welcome');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [level, setLevel] = useState(1);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const [levelData, setLevelData] = useState<LevelData | null>(null);
    const [userAnswer, setUserAnswer] = useState('');

    // Refs
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef(0);

    // Timer
    useEffect(() => {
        if (phase === 'playing' && timeLeft > 0) {
            timerRef.current = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0 && phase === 'playing') {
            handleGameOver();
        }
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [phase, timeLeft]);

    // Format Time
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Start Game
    const handleStart = useCallback(() => {
        const data = generateLevel(1);
        setLevelData(data);
        window.scrollTo(0, 0);
        setPhase('playing');
        setScore(0);
        setLives(INITIAL_LIVES);
        setLevel(1);
        setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
        setUserAnswer('');
        startTimeRef.current = Date.now();
        hasSavedRef.current = false;
    }, [hasSavedRef, examMode, examTimeLimit]);

    // Auto Start
    useEffect(() => {
        if ((location.state?.autoStart || examMode) && phase === 'welcome') {
            handleStart();
        }
    }, [location.state, examMode, phase, handleStart]);

    // Game Over
    const handleGameOver = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        setPhase('game_over');

        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

        if (examMode) {
            const passed = level >= 5;
            await submitResult(passed, score, 1000, duration);
            setTimeout(() => navigate('/atolyeler/sinav-simulasyonu/devam'), 1500);
            return;
        }

        await saveGamePlay({
            game_id: GAME_ID,
            score_achieved: score,
            duration_seconds: duration,
            metadata: { levels_completed: level, final_lives: lives },
        });
    }, [saveGamePlay, score, level, lives, hasSavedRef, examMode, submitResult, navigate]);

    // Victory
    const handleVictory = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        setPhase('victory');

        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

        if (examMode) {
            await submitResult(true, score, 1000, duration);
            setTimeout(() => navigate('/atolyeler/sinav-simulasyonu/devam'), 1500);
            return;
        }

        await saveGamePlay({
            game_id: GAME_ID,
            score_achieved: score,
            duration_seconds: duration,
            metadata: { levels_completed: MAX_LEVEL, victory: true },
        });
    }, [saveGamePlay, score, hasSavedRef, examMode, submitResult, navigate]);

    // Feedback Hook
    const { feedbackState, showFeedback, isFeedbackActive } = useGameFeedback({
        onFeedbackEnd: (correct) => {
            if (correct) {
                setScore(prev => prev + 10 * level);
                if (level >= MAX_LEVEL) {
                    handleVictory();
                } else {
                    const nextLevel = level + 1;
                    setLevel(nextLevel);
                    setLevelData(generateLevel(nextLevel));
                    setUserAnswer('');
                    setPhase('playing');
                }
            } else {
                const newLives = lives - 1;
                setLives(newLives);
                if (newLives <= 0) {
                    handleGameOver();
                } else {
                    setUserAnswer('');
                    setPhase('playing');
                }
            }
        },
    });

    // Keypad Handlers
    const handleKeyPress = (key: string) => {
        if (isFeedbackActive || userAnswer.length >= 3) return;
        setUserAnswer(prev => prev + key);
    };

    const handleDelete = () => {
        if (isFeedbackActive) return;
        setUserAnswer(prev => prev.slice(0, -1));
    };

    const handleSubmit = () => {
        if (!levelData || !userAnswer || isFeedbackActive) return;
        const num = parseInt(userAnswer, 10);
        const correct = levelData.question.answer === num;

        setPhase('feedback');
        if (correct) {
            showFeedback(true, ['Harikasın! 🧠', 'Doğru! ⭐', 'Muhteşem! 🌟', 'Tam isabet! 🎯'][Math.floor(Math.random() * 4)]);
        } else {
            showFeedback(false, `Doğru cevap: ${levelData.question.answer}`);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-950 to-slate-900 text-white">
            {/* Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
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
                            <div className="flex items-center gap-2 bg-amber-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-amber-500/30">
                                <Star className="text-amber-400" size={16} />
                                <span className="font-bold text-amber-400 text-sm">{score}</span>
                            </div>
                            <div className="flex items-center gap-1 bg-red-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-red-500/30">
                                {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
                                    <Heart key={i} size={14} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-400/30'} />
                                ))}
                            </div>
                            <div className="flex items-center gap-2 bg-blue-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-blue-500/30">
                                <Timer className="text-blue-400" size={16} />
                                <span className={`font-bold text-sm ${timeLeft <= 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'}`}>
                                    {formatTime(timeLeft)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 bg-emerald-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-emerald-500/30">
                                <Zap className="text-emerald-400" size={16} />
                                <span className="font-bold text-emerald-400 text-sm">{level}/{MAX_LEVEL}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4">
                <AnimatePresence mode="wait">
                    {/* Welcome */}
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

                            <motion.div
                                className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-[40%] flex items-center justify-center"
                                style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }}
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            >
                                <Brain size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                Şekil Cebiri
                            </h1>

                            <p className="text-slate-400 mb-8 leading-relaxed">
                                Her şeklin bir sayısal değeri var! Görsel denklemleri çözerek
                                şekillerin değerlerini bul ve soruların cevabını yaz.
                                <br /><span className="text-indigo-400 text-sm">💡 İçinde nokta olan şekillerin değeri farklıdır!</span>
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

                    {/* Playing / Feedback */}
                    {(phase === 'playing' || phase === 'feedback') && levelData && (
                        <motion.div
                            key="playing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full max-w-lg"
                        >
                            <div className="relative">
                                {/* Equations */}
                                <div className="space-y-3 w-full mb-5">
                                    {levelData.equations.map((eq, idx) => (
                                        <EquationRowComp key={eq.id} equation={eq} variables={levelData.variables} index={idx} />
                                    ))}
                                </div>

                                {/* Question Area */}
                                <div className="bg-indigo-500/10 border-2 border-indigo-500/30 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 mb-2"
                                    style={{ boxShadow: '0 4px 24px rgba(99, 102, 241, 0.15)' }}>
                                    <span className="text-slate-400 font-medium uppercase tracking-wide text-xs">{levelData.question.text}</span>

                                    <div className="flex items-center gap-4">
                                        <VisualExpressionComp
                                            items={levelData.question.items}
                                            variables={levelData.variables}
                                            iconSize={56}
                                            animate={true}
                                        />
                                        <Equal className="text-indigo-400 w-8 h-8" strokeWidth={3} />
                                        <div className={`h-16 w-24 rounded-xl border-2 flex items-center justify-center text-4xl font-bold transition-all ${isFeedbackActive
                                            ? feedbackState?.correct
                                                ? 'border-emerald-400 bg-emerald-500/20 text-emerald-400'
                                                : 'border-red-400 bg-red-500/20 text-red-400'
                                            : 'border-indigo-500/50 bg-white/5 text-white'
                                            }`}>
                                            {userAnswer || '?'}
                                        </div>
                                    </div>
                                </div>

                                {/* Feedback Banner */}
                                <GameFeedbackBanner feedback={feedbackState} />
                            </div>

                            {/* Keypad */}
                            <KeypadComp
                                onKeyPress={handleKeyPress}
                                onDelete={handleDelete}
                                onSubmit={handleSubmit}
                                disabled={isFeedbackActive}
                            />
                        </motion.div>
                    )}

                    {/* Game Over */}
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
                            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10">
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
                                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl font-bold text-lg"
                                style={{ boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3)' }}
                            >
                                <div className="flex items-center gap-3">
                                    <RotateCcw size={24} />
                                    <span>Tekrar Dene</span>
                                </div>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* Victory */}
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
                            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10">
                                <p className="text-4xl font-bold text-amber-400">{score}</p>
                                <p className="text-slate-400">Toplam Puan</p>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleStart}
                                className="px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-2xl font-bold text-lg"
                                style={{ boxShadow: '0 8px 32px rgba(245, 158, 11, 0.3)' }}
                            >
                                <div className="flex items-center gap-3">
                                    <RotateCcw size={24} />
                                    <span>Tekrar Oyna</span>
                                </div>
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ShapeAlgebraGame;
