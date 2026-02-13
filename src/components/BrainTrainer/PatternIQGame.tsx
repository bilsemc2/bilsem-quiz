import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer, Target,
    XCircle, ChevronLeft, Zap, Heart, Shapes
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
const WAGON_COUNT = 5;

// ============== TYPES ==============
enum ShapeType {
    LINE = 'LINE',
    CIRCLE = 'CIRCLE',
    SQUARE = 'SQUARE',
    TRIANGLE = 'TRIANGLE',
    ARROW = 'ARROW',
}

enum TransformationType {
    ROTATION = 'ROTATION',
    CLOCK_MOVE = 'CLOCK_MOVE',
    CORNER_MOVE = 'CORNER_MOVE',
}

interface LayerConfig {
    id: string;
    shape: ShapeType;
    color: string;
    transformation: TransformationType;
    startValue: number;
    stepChange: number;
    size?: number;
    offset?: number;
}

interface PatternData {
    id: string;
    difficulty: 'Kolay' | 'Orta' | 'Zor';
    layers: LayerConfig[];
    description: string;
}

interface WagonState {
    index: number;
    layerStates: {
        layerId: string;
        rotation: number;
        position: number;
        visible: boolean;
    }[];
}

type Phase = 'welcome' | 'playing' | 'feedback' | 'game_over' | 'victory';

interface PatternIQGameProps {
    examMode?: boolean;
}

// ============== FEEDBACK ==============
// ============== PATTERN ENGINE ==============
const COLORS = ['#818CF8', '#FB7185', '#34D399', '#FBBF24', '#A78BFA'];
const SHAPES = [ShapeType.LINE, ShapeType.CIRCLE, ShapeType.SQUARE, ShapeType.TRIANGLE, ShapeType.ARROW];

const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

function generatePattern(level: number): PatternData {
    // Layer count increases with level
    const maxLayers = level <= 5 ? 1 : level <= 12 ? 2 : 3;
    const layerCount = Math.min(getRandomInt(1, maxLayers), 3);
    const difficulty = layerCount === 1 ? 'Kolay' : layerCount === 2 ? 'Orta' : 'Zor';

    const layers: LayerConfig[] = [];
    const usedShapes = new Set<ShapeType>();

    for (let i = 0; i < layerCount; i++) {
        let shape = getRandomItem(SHAPES);
        while (usedShapes.has(shape) && usedShapes.size < SHAPES.length) {
            shape = getRandomItem(SHAPES);
        }
        usedShapes.add(shape);

        const transTypes = [TransformationType.ROTATION, TransformationType.CLOCK_MOVE, TransformationType.CORNER_MOVE];
        let transType = getRandomItem(transTypes);
        if (shape === ShapeType.LINE || shape === ShapeType.ARROW) {
            if (Math.random() > 0.3) transType = TransformationType.ROTATION;
        }

        let startValue = 0;
        let stepChange = 0;

        switch (transType) {
            case TransformationType.ROTATION:
                startValue = getRandomInt(0, 11) * 30;
                stepChange = getRandomItem([30, 45, 90, -30, -45, -90]);
                break;
            case TransformationType.CLOCK_MOVE:
                startValue = getRandomInt(1, 12);
                stepChange = getRandomItem([1, 2, 3, -1, -2]);
                break;
            case TransformationType.CORNER_MOVE:
                startValue = getRandomInt(0, 3);
                stepChange = getRandomItem([1, -1]);
                break;
        }

        layers.push({
            id: `layer-${i}`,
            shape,
            color: COLORS[i % COLORS.length],
            transformation: transType,
            startValue,
            stepChange,
            size: shape === ShapeType.LINE ? 40 : 15,
            offset: transType === TransformationType.ROTATION ? 0 : 30,
        });
    }

    const desc = layers.map(l => {
        const dir = l.stepChange > 0 ? 'saat yönünde' : 'saat yönünün tersine';
        const val = Math.abs(l.stepChange);
        return `${l.shape} (${l.transformation}): ${dir} ${val} birim`;
    }).join(' | ');

    return { id: Date.now().toString(), difficulty, layers, description: desc };
}

function calculateWagonState(pattern: PatternData, wagonIndex: number): WagonState {
    const layerStates = pattern.layers.map(layer => {
        let rotation = 0;
        let position = 0;

        if (layer.transformation === TransformationType.ROTATION) {
            rotation = layer.startValue + (layer.stepChange * wagonIndex);
        } else if (layer.transformation === TransformationType.CLOCK_MOVE) {
            const rawPos = layer.startValue + (layer.stepChange * wagonIndex);
            position = ((rawPos - 1) % 12);
            if (position < 0) position += 12;
            position += 1;
        } else if (layer.transformation === TransformationType.CORNER_MOVE) {
            const rawPos = layer.startValue + (layer.stepChange * wagonIndex);
            position = rawPos % 4;
            if (position < 0) position += 4;
        }

        return { layerId: layer.id, rotation, position, visible: true };
    });

    return { index: wagonIndex, layerStates };
}

function generateOptions(pattern: PatternData, correctIndex: number): WagonState[] {
    const correctState = calculateWagonState(pattern, correctIndex);

    const cloneState = (s: WagonState): WagonState => ({
        ...s,
        layerStates: s.layerStates.map(ls => ({ ...ls })),
    });

    const areStatesEqual = (s1: WagonState, s2: WagonState): boolean => {
        if (s1.layerStates.length !== s2.layerStates.length) return false;
        return s1.layerStates.every((l1, i) => {
            const l2 = s2.layerStates[i];
            const r1 = (l1.rotation % 360 + 360) % 360;
            const r2 = (l2.rotation % 360 + 360) % 360;
            return l1.layerId === l2.layerId && Math.abs(r1 - r2) < 0.1 && l1.position === l2.position && l1.visible === l2.visible;
        });
    };

    const options: WagonState[] = [correctState];
    let attempts = 0;

    while (options.length < 4 && attempts < 50) {
        attempts++;
        const fake = cloneState(correctState);

        if (fake.layerStates.length > 0) {
            const layerToMod = getRandomItem(fake.layerStates);
            const config = pattern.layers.find(l => l.id === layerToMod.layerId);

            if (config) {
                if (config.transformation === TransformationType.ROTATION) {
                    layerToMod.rotation += getRandomItem([90, 180, 270, 45, -45]);
                } else if (config.transformation === TransformationType.CLOCK_MOVE) {
                    let offset = getRandomItem([1, 2, 3, 4, 5, 6]);
                    if (Math.random() > 0.5) offset *= -1;
                    let newPos = layerToMod.position + offset;
                    newPos = ((newPos - 1) % 12);
                    if (newPos < 0) newPos += 12;
                    layerToMod.position = newPos + 1;
                } else if (config.transformation === TransformationType.CORNER_MOVE) {
                    layerToMod.position = (layerToMod.position + getRandomItem([1, 2, 3])) % 4;
                }
            }
        }

        if (!options.some(opt => areStatesEqual(opt, fake))) {
            options.push(fake);
        }
    }

    return options.sort(() => Math.random() - 0.5);
}

function checkAnswer(selected: WagonState, correct: WagonState): boolean {
    if (selected.layerStates.length !== correct.layerStates.length) return false;
    for (let i = 0; i < selected.layerStates.length; i++) {
        const s1 = selected.layerStates[i];
        const s2 = correct.layerStates[i];
        const r1 = (s1.rotation % 360 + 360) % 360;
        const r2 = (s2.rotation % 360 + 360) % 360;
        if (Math.abs(r1 - r2) > 0.1 || s1.position !== s2.position) return false;
    }
    return true;
}

// ============== WAGON COMPONENT ==============
const WagonView: React.FC<{
    state: WagonState;
    pattern: PatternData;
    isQuestion?: boolean;
    isRevealed?: boolean;
    status?: 'default' | 'correct' | 'wrong';
    onClick?: () => void;
}> = ({ state, pattern, isQuestion, isRevealed, status = 'default', onClick }) => {
    const renderedLayers = useMemo(() => {
        return state.layerStates.map((ls) => {
            const config = pattern.layers.find(l => l.id === ls.layerId);
            if (!config || !ls.visible) return null;

            let translateX = 50;
            let translateY = 50;
            let rotation = 0;

            if (config.transformation === TransformationType.ROTATION) {
                rotation = ls.rotation;
            } else if (config.transformation === TransformationType.CLOCK_MOVE) {
                const angleRad = ((ls.position - 3) * 30) * (Math.PI / 180);
                const radius = 35;
                translateX = 50 + radius * Math.cos(angleRad);
                translateY = 50 + radius * Math.sin(angleRad);
            } else if (config.transformation === TransformationType.CORNER_MOVE) {
                const margin = 20;
                switch (ls.position) {
                    case 0: translateX = margin; translateY = margin; break;
                    case 1: translateX = 100 - margin; translateY = margin; break;
                    case 2: translateX = 100 - margin; translateY = 100 - margin; break;
                    case 3: translateX = margin; translateY = 100 - margin; break;
                }
            }

            const commonProps = {
                stroke: config.color,
                strokeWidth: 4,
                fill: config.shape === ShapeType.CIRCLE || config.shape === ShapeType.SQUARE ? config.color : 'none',
            };

            let shapeSvg = null;
            const size = config.size || 20;
            const half = size / 2;

            // Orientation marker — a small white dot that breaks rotational symmetry
            const orientationMarker = (x: number, y: number) => (
                <circle cx={x} cy={y} r={3} fill="white" stroke={config.color} strokeWidth={1.5} />
            );

            switch (config.shape) {
                case ShapeType.CIRCLE:
                    // Circle + dot at top edge to break 360° symmetry
                    shapeSvg = (
                        <g>
                            <circle cx={0} cy={0} r={half} {...commonProps} />
                            {orientationMarker(0, -half)}
                        </g>
                    );
                    break;
                case ShapeType.SQUARE:
                    // Square + dot at top-right corner to break 90° symmetry
                    shapeSvg = (
                        <g>
                            <rect x={-half} y={-half} width={size} height={size} {...commonProps} />
                            {orientationMarker(half - 2, -half + 2)}
                        </g>
                    );
                    break;
                case ShapeType.TRIANGLE: {
                    // Triangle + dot at top vertex (already asymmetric but makes direction clearer)
                    const h = size * 0.866;
                    shapeSvg = (
                        <g>
                            <polygon points={`0,-${h / 2} -${size / 2},${h / 2} ${size / 2},${h / 2}`} {...commonProps} />
                            {orientationMarker(0, -h / 2)}
                        </g>
                    );
                    break;
                }
                case ShapeType.LINE:
                    // Line + dot at end to show direction
                    shapeSvg = (
                        <g>
                            <line x1={0} y1={0} x2={0} y2={-35} stroke={config.color} strokeWidth={5} strokeLinecap="round" />
                            {orientationMarker(0, -35)}
                        </g>
                    );
                    break;
                case ShapeType.ARROW:
                    shapeSvg = (
                        <g>
                            <line x1={0} y1={10} x2={0} y2={-30} stroke={config.color} strokeWidth={4} strokeLinecap="round" />
                            <path d="M -10 -20 L 0 -35 L 10 -20" fill="none" stroke={config.color} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
                        </g>
                    );
                    break;
            }

            return (
                <g key={config.id} transform={`translate(${translateX}, ${translateY}) rotate(${rotation})`}>
                    {shapeSvg}
                </g>
            );
        });
    }, [state, pattern.layers]);

    // Question placeholder
    if (isQuestion && !isRevealed) {
        return (
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-xl bg-white/10 backdrop-blur-sm border-2 border-dashed border-indigo-400/60 flex items-center justify-center transition-all">
                <span className="text-3xl text-indigo-300/60 font-bold select-none animate-pulse">?</span>
            </div>
        );
    }

    let borderClass = 'border-white/20';
    let extraClass = '';
    if (status === 'correct') {
        borderClass = 'border-emerald-400 ring-2 ring-emerald-400/40';
        extraClass = 'scale-105';
    } else if (status === 'wrong') {
        borderClass = 'border-red-400 opacity-50';
    }

    return (
        <div
            className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-xl bg-white/10 backdrop-blur-sm border-2 ${borderClass} ${extraClass} relative overflow-hidden transition-all duration-300 ${onClick && status === 'default' ? 'cursor-pointer hover:scale-105 hover:border-indigo-400/60 active:scale-95' : ''}`}
            onClick={onClick}
            style={{ boxShadow: 'inset 0 -3px 8px rgba(0,0,0,0.2), inset 0 3px 8px rgba(255,255,255,0.1)' }}
        >
            {/* Background ticks */}
            <svg className="absolute inset-0 w-full h-full opacity-15 pointer-events-none" viewBox="0 0 100 100">
                <line x1="50" y1="5" x2="50" y2="15" stroke="white" strokeWidth="2" />
                <line x1="95" y1="50" x2="85" y2="50" stroke="white" strokeWidth="2" />
                <line x1="50" y1="95" x2="50" y2="85" stroke="white" strokeWidth="2" />
                <line x1="5" y1="50" x2="15" y2="50" stroke="white" strokeWidth="2" />
                <circle cx="50" cy="50" r="1.5" fill="white" />
            </svg>

            {/* Content */}
            <svg className="w-full h-full" viewBox="0 0 100 100">
                {renderedLayers}
            </svg>
        </div>
    );
};

// ============== MAIN COMPONENT ==============
const PatternIQGame: React.FC<PatternIQGameProps> = ({ examMode = false }) => {
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;
    const navigate = useNavigate();
    const { submitResult } = useExam();

    // Shared Feedback System
    const { feedbackState, showFeedback } = useGameFeedback();

    const hasSavedRef = useRef(false);

    // Core State
    const [phase, setPhase] = useState<Phase>('welcome');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [level, setLevel] = useState(1);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);

    // Game State
    const [currentPattern, setCurrentPattern] = useState<PatternData | null>(null);
    const [options, setOptions] = useState<WagonState[]>([]);
    const [revealed, setRevealed] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

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

    const initLevel = useCallback((lvl: number) => {
        const pat = generatePattern(lvl);
        setCurrentPattern(pat);
        const opts = generateOptions(pat, WAGON_COUNT - 1);
        setOptions(opts);
        setRevealed(false);
        setSelectedIndex(null);
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
        if ((location.state?.autoStart || examMode) && phase === 'welcome') {
            handleStart();
        }
    }, [location.state, examMode, phase, handleStart]);

    const handleGameOver = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        setPhase('game_over');
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

        if (examMode) {
            await submitResult(level >= 5, score, 1000, duration);
            setTimeout(() => navigate('/atolyeler/sinav-simulasyonu/devam'), 1500);
            return;
        }

        await saveGamePlay({
            game_id: 'patterniq-express',
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
            await submitResult(true, score, 1000, duration);
            setTimeout(() => navigate('/atolyeler/sinav-simulasyonu/devam'), 1500);
            return;
        }

        await saveGamePlay({
            game_id: 'patterniq-express',
            score_achieved: score,
            duration_seconds: duration,
            metadata: { levels_completed: MAX_LEVEL, victory: true },
        });
    }, [saveGamePlay, score, examMode, submitResult, navigate]);

    const handleOptionClick = (index: number) => {
        if (phase !== 'playing' || revealed || !currentPattern) return;

        const correctState = calculateWagonState(currentPattern, WAGON_COUNT - 1);
        const selected = options[index];
        const correct = checkAnswer(selected, correctState);

        setSelectedIndex(index);
        setRevealed(true);

        if (correct) {
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
            }, 1200);
        } else {
            // feedbackState managed by useGameFeedback
            showFeedback(correct);
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
            }, 1200);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 text-white">
            {/* Decorative */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
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
                            <div className="mb-6 inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full">
                                <span className="text-[9px] font-black text-indigo-300 uppercase tracking-wider">TUZÖ</span>
                                <span className="text-[9px] font-bold text-indigo-400">5.5.1 Örüntü Analizi</span>
                            </div>

                            <motion.div
                                className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-indigo-400 to-cyan-600 rounded-[40%] flex items-center justify-center"
                                style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }}
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Shapes size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                                PatternIQ Express
                            </h1>
                            <p className="text-slate-400 mb-8">
                                Vagon dizisindeki örüntüyü çöz! Şekillerin dönüşüm kuralını bul ve sıradaki vagonu seç.
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
                                className="px-10 py-5 bg-gradient-to-r from-indigo-500 to-cyan-600 rounded-2xl font-bold text-xl"
                                style={{ boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)' }}>
                                <div className="flex items-center gap-3">
                                    <Play size={28} className="fill-white" />
                                    <span>Başla</span>
                                </div>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* PLAYING */}
                    {(phase === 'playing' || phase === 'feedback') && currentPattern && (
                        <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-3xl">
                            {/* Sequence */}
                            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-5 sm:p-6 mb-5 border border-white/10">
                                <h2 className="text-xs font-bold text-slate-400 mb-4 text-center uppercase tracking-wider">
                                    Sıradaki Vagon Hangisi?
                                </h2>
                                <div className="flex justify-center items-center gap-2 sm:gap-3 md:gap-4 overflow-x-auto py-2">
                                    {Array.from({ length: WAGON_COUNT }).map((_, index) => {
                                        const state = calculateWagonState(currentPattern, index);
                                        const isLast = index === WAGON_COUNT - 1;
                                        return (
                                            <div key={index} className="flex items-center shrink-0">
                                                <WagonView
                                                    state={state}
                                                    pattern={currentPattern}
                                                    isQuestion={isLast}
                                                    isRevealed={revealed}
                                                    status={isLast && revealed ? 'correct' : 'default'}
                                                />
                                                {!isLast && (
                                                    <div className="h-0.5 w-2 sm:w-3 md:w-4 bg-white/20 rounded-full ml-2 sm:ml-3 md:ml-4" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                {currentPattern.difficulty && (
                                    <div className="text-center mt-3">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${currentPattern.difficulty === 'Kolay' ? 'bg-emerald-500/20 text-emerald-400' :
                                            currentPattern.difficulty === 'Orta' ? 'bg-amber-500/20 text-amber-400' :
                                                'bg-red-500/20 text-red-400'
                                            }`}>
                                            {currentPattern.difficulty}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Options */}
                            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-5 sm:p-6 border border-white/10">
                                <h2 className="text-xs font-bold text-slate-400 mb-4 text-center uppercase tracking-wider">
                                    Seçenekler
                                </h2>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 justify-items-center">
                                    {options.map((optState, idx) => {
                                        let status: 'default' | 'correct' | 'wrong' = 'default';
                                        if (revealed) {
                                            const correctState = calculateWagonState(currentPattern, WAGON_COUNT - 1);
                                            const isThisCorrect = checkAnswer(optState, correctState);
                                            if (isThisCorrect) status = 'correct';
                                            else if (idx === selectedIndex) status = 'wrong';
                                        }
                                        return (
                                            <div key={idx} className="flex flex-col items-center gap-2">
                                                <WagonView
                                                    state={optState}
                                                    pattern={currentPattern}
                                                    onClick={phase === 'playing' ? () => handleOptionClick(idx) : undefined}
                                                    status={status}
                                                />
                                                <span className="text-xs font-bold text-slate-500">{String.fromCharCode(65 + idx)}</span>
                                            </div>
                                        );
                                    })}
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
                                className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-cyan-600 rounded-2xl font-bold text-lg"
                                style={{ boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)' }}>
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

export default PatternIQGame;
