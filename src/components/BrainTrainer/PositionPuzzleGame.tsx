import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer, Target,
    CheckCircle2, XCircle, ChevronLeft, Zap, Heart, MapPin
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useExam } from '../../contexts/ExamContext';

// ============== CONSTANTS ==============
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;
const CANVAS_SIZE = 300;

// ============== TYPES ==============
type ShapeType = 'circle' | 'rect' | 'triangle';
interface Point { x: number; y: number; }

interface BaseShape {
    id: string;
    type: ShapeType;
    color: string;
    rotation: number;
}

interface CircleShape extends BaseShape {
    type: 'circle';
    cx: number;
    cy: number;
    r: number;
}

interface RectShape extends BaseShape {
    type: 'rect';
    x: number;
    y: number;
    w: number;
    h: number;
}

interface TriangleShape extends BaseShape {
    type: 'triangle';
    p1: Point;
    p2: Point;
    p3: Point;
}

type Shape = CircleShape | RectShape | TriangleShape;

interface PuzzleOption {
    id: number;
    rotation: number;
    point: Point;
}

interface PuzzleState {
    shapes: Shape[];
    targetPoint: Point;
    options: PuzzleOption[];
    correctOptionId: number;
}

type Phase = 'welcome' | 'playing' | 'feedback' | 'game_over' | 'victory';

interface PositionPuzzleGameProps {
    examMode?: boolean;
}

// ============== FEEDBACK ==============
const CORRECT_MESSAGES = ["Harikasın! 📍", "Süpersin! ⭐", "Muhteşem! 🌟", "Bravo! 🎉", "Konumu buldun! 🎯", "Tam isabet! 🧠"];
const WRONG_MESSAGES = ["Tekrar dene! 💪", "Bölgelere dikkat! 🧐", "Biraz daha dikkat! 🎯"];

// ============== GEOMETRY ENGINE ==============
const SHAPE_COLORS_DARK = ['#818CF8', '#FB7185', '#34D399', '#FBBF24'];

function degreesToRadians(deg: number): number {
    return deg * (Math.PI / 180);
}

function rotatePoint(p: Point, center: Point, angleDeg: number): Point {
    const rad = degreesToRadians(angleDeg);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const dx = p.x - center.x;
    const dy = p.y - center.y;
    return { x: center.x + dx * cos - dy * sin, y: center.y + dx * sin + dy * cos };
}

function isPointInCircle(p: Point, circle: CircleShape): boolean {
    const dx = p.x - circle.cx;
    const dy = p.y - circle.cy;
    return dx * dx + dy * dy <= circle.r * circle.r;
}

function isPointInRect(p: Point, rect: RectShape): boolean {
    const centerX = rect.x + rect.w / 2;
    const centerY = rect.y + rect.h / 2;
    const unrotatedP = rotatePoint(p, { x: centerX, y: centerY }, -rect.rotation);
    return unrotatedP.x >= rect.x && unrotatedP.x <= rect.x + rect.w &&
        unrotatedP.y >= rect.y && unrotatedP.y <= rect.y + rect.h;
}

function isPointInTriangle(p: Point, tri: TriangleShape): boolean {
    const { p1, p2, p3 } = tri;
    const denominator = ((p2.y - p3.y) * (p1.x - p3.x) + (p3.x - p2.x) * (p1.y - p3.y));
    const a = ((p2.y - p3.y) * (p.x - p3.x) + (p3.x - p2.x) * (p.y - p3.y)) / denominator;
    const b = ((p3.y - p1.y) * (p.x - p3.x) + (p1.x - p3.x) * (p.y - p3.y)) / denominator;
    const c = 1 - a - b;
    return a >= 0 && a <= 1 && b >= 0 && b <= 1 && c >= 0 && c <= 1;
}

function isPointInShape(p: Point, shape: Shape): boolean {
    switch (shape.type) {
        case 'circle': return isPointInCircle(p, shape);
        case 'rect': return isPointInRect(p, shape);
        case 'triangle': return isPointInTriangle(p, shape);
        default: return false;
    }
}

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

function generateRandomShapes(count: number): Shape[] {
    const shapes: Shape[] = [];
    const padding = 60;
    const minSize = 80;
    const maxSize = 140;

    for (let i = 0; i < count; i++) {
        const typeIdx = getRandomInt(0, 2);
        const color = SHAPE_COLORS_DARK[i % SHAPE_COLORS_DARK.length];
        const rotation = getRandomInt(0, 360);
        const cx = getRandomInt(padding, CANVAS_SIZE - padding);
        const cy = getRandomInt(padding, CANVAS_SIZE - padding);

        if (typeIdx === 0) {
            shapes.push({
                id: `s-${i}`, type: 'circle', color, rotation: 0,
                cx, cy, r: getRandomInt(minSize / 2, maxSize / 2),
            });
        } else if (typeIdx === 1) {
            const w = getRandomInt(minSize, maxSize);
            const h = getRandomInt(minSize, maxSize);
            shapes.push({
                id: `s-${i}`, type: 'rect', color, rotation,
                x: cx - w / 2, y: cy - h / 2, w, h,
            });
        } else {
            const size = getRandomInt(minSize, maxSize);
            const height = (Math.sqrt(3) / 2) * size;
            const p1 = { x: cx, y: cy - (2 / 3) * height };
            const p2 = { x: cx - size / 2, y: cy + (1 / 3) * height };
            const p3 = { x: cx + size / 2, y: cy + (1 / 3) * height };
            const center = { x: cx, y: cy };
            shapes.push({
                id: `s-${i}`, type: 'triangle', color, rotation,
                p1: rotatePoint(p1, center, rotation),
                p2: rotatePoint(p2, center, rotation),
                p3: rotatePoint(p3, center, rotation),
            });
        }
    }
    return shapes;
}

function getRegionSignature(p: Point, shapes: Shape[]): string {
    return shapes.map(s => isPointInShape(p, s) ? '1' : '0').join('');
}

function generatePuzzle(level: number): PuzzleState | null {
    let attempts = 0;
    const shapeCount = level <= 8 ? 2 : 3;

    while (attempts < 30) {
        attempts++;
        const shapes = generateRandomShapes(shapeCount);
        const regionMap = new Map<string, Point[]>();
        const samples = 600;

        for (let i = 0; i < samples; i++) {
            const p = { x: getRandomInt(0, CANVAS_SIZE), y: getRandomInt(0, CANVAS_SIZE) };
            const sig = getRegionSignature(p, shapes);
            if (sig.indexOf('1') === -1) continue;
            if (!regionMap.has(sig)) regionMap.set(sig, []);
            regionMap.get(sig)?.push(p);
        }

        const validRegions = Array.from(regionMap.entries()).filter(([, points]) => points.length > 10);
        if (validRegions.length < 2) continue;

        const intersectionRegions = validRegions.filter(([sig]) => sig.split('1').length - 1 >= 2);
        const targetRegionEntry = intersectionRegions.length > 0
            ? intersectionRegions[Math.floor(Math.random() * intersectionRegions.length)]
            : validRegions[Math.floor(Math.random() * validRegions.length)];

        const [targetSig, targetPoints] = targetRegionEntry;
        const targetPoint = targetPoints[Math.floor(Math.random() * targetPoints.length)];
        const correctPoint = targetPoints[Math.floor(Math.random() * targetPoints.length)];
        const distractorRegions = validRegions.filter(([sig]) => sig !== targetSig);
        if (distractorRegions.length === 0) continue;

        const options: PuzzleOption[] = [];
        const correctOptionId = getRandomInt(0, 3);

        for (let i = 0; i < 4; i++) {
            const viewRotation = [0, 90, 180, 270][getRandomInt(0, 3)];
            if (i === correctOptionId) {
                options.push({ id: i, rotation: viewRotation, point: correctPoint });
            } else {
                const [, dPoints] = distractorRegions[Math.floor(Math.random() * distractorRegions.length)];
                options.push({ id: i, rotation: viewRotation, point: dPoints[Math.floor(Math.random() * dPoints.length)] });
            }
        }

        return { shapes, targetPoint, options, correctOptionId };
    }
    return null;
}

// ============== SHAPE RENDERER ==============
const ShapeRendererView: React.FC<{
    shapes: Shape[];
    dot?: Point;
    rotation?: number;
    size?: number;
    showDot?: boolean;
}> = ({ shapes, dot, rotation = 0, size = 300, showDot = true }) => {
    const renderShape = (shape: Shape) => {
        const commonProps = {
            key: shape.id,
            fill: shape.color,
            fillOpacity: 0.25,
            stroke: shape.color,
            strokeWidth: 2.5,
        };

        switch (shape.type) {
            case 'circle':
                return <circle {...commonProps} cx={shape.cx} cy={shape.cy} r={shape.r} />;
            case 'rect':
                return (
                    <rect {...commonProps} x={shape.x} y={shape.y} width={shape.w} height={shape.h}
                        transform={`rotate(${shape.rotation}, ${shape.x + shape.w / 2}, ${shape.y + shape.h / 2})`}
                    />
                );
            case 'triangle':
                return <polygon {...commonProps} points={`${shape.p1.x},${shape.p1.y} ${shape.p2.x},${shape.p2.y} ${shape.p3.x},${shape.p3.y}`} />;
            default:
                return null;
        }
    };

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg viewBox="0 0 300 300" width="100%" height="100%"
                style={{ transform: `rotate(${rotation}deg)`, transition: 'transform 0.5s ease-in-out', overflow: 'visible' }}>
                {shapes.map(renderShape)}
                {showDot && dot && (
                    <circle cx={dot.x} cy={dot.y} r={6} fill="white" stroke="#1e293b" strokeWidth={2.5} />
                )}
            </svg>
        </div>
    );
};

// ============== MAIN COMPONENT ==============
const PositionPuzzleGame: React.FC<PositionPuzzleGameProps> = ({ examMode = false }) => {
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();
    const navigate = useNavigate();
    const { submitResult } = useExam();
    const hasSavedRef = useRef(false);

    // Core State
    const [phase, setPhase] = useState<Phase>('welcome');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [level, setLevel] = useState(1);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);

    // Game State
    const [puzzle, setPuzzle] = useState<PuzzleState | null>(null);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
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

    const initLevel = useCallback((lvl: number) => {
        let newPuzzle = generatePuzzle(lvl);
        let retries = 0;
        while (!newPuzzle && retries < 5) {
            newPuzzle = generatePuzzle(lvl);
            retries++;
        }
        if (newPuzzle) {
            setPuzzle(newPuzzle);
            setSelectedOption(null);
        }
    }, []);

    const handleStart = useCallback(() => {
        setPhase('playing');
        setScore(0);
        setLives(INITIAL_LIVES);
        setLevel(1);
        setTimeLeft(TIME_LIMIT);
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
            submitResult(level >= 5, score, 1000, duration);
            setTimeout(() => navigate('/sinav-simulasyonu'), 1500);
            return;
        }

        await saveGamePlay({
            game_id: 'konum-bulmaca',
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
            game_id: 'konum-bulmaca',
            score_achieved: score,
            duration_seconds: duration,
            metadata: { levels_completed: MAX_LEVEL, victory: true },
        });
    }, [saveGamePlay, score, examMode, submitResult, navigate]);

    const handleOptionClick = (optionId: number) => {
        if (phase !== 'playing' || selectedOption !== null || !puzzle) return;

        setSelectedOption(optionId);
        const correct = optionId === puzzle.correctOptionId;

        if (correct) {
            const msg = CORRECT_MESSAGES[Math.floor(Math.random() * CORRECT_MESSAGES.length)];
            setFeedbackCorrect(true);
            setFeedbackMessage(msg);
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
            const msg = WRONG_MESSAGES[Math.floor(Math.random() * WRONG_MESSAGES.length)];
            setFeedbackCorrect(false);
            setFeedbackMessage(msg);
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

    const getOptionBorderClass = (optionId: number) => {
        if (phase === 'playing' && selectedOption === null) {
            return 'border-white/20 hover:border-indigo-400/60 cursor-pointer hover:scale-105 active:scale-95';
        }
        if (optionId === puzzle?.correctOptionId) {
            return 'border-emerald-400 ring-2 ring-emerald-400/40 scale-105';
        }
        if (optionId === selectedOption && selectedOption !== puzzle?.correctOptionId) {
            return 'border-red-400 opacity-50';
        }
        return 'border-white/10 opacity-40';
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
                                <span className="text-[9px] font-bold text-indigo-400">5.5.3 Uzamsal İlişki</span>
                            </div>

                            <motion.div
                                className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-cyan-400 to-indigo-600 rounded-[40%] flex items-center justify-center"
                                style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }}
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <MapPin size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                                Konum Bulmaca
                            </h1>
                            <p className="text-slate-400 mb-8">
                                Şekillerin kesişim bölgelerinde noktanın konumunu bul! Aynı mantıksal bölgedeki seçeneği seç.
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
                                className="px-10 py-5 bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-2xl font-bold text-xl"
                                style={{ boxShadow: '0 8px 32px rgba(6, 182, 212, 0.4)' }}>
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
                            {/* Target */}
                            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-5 sm:p-6 mb-5 border border-white/10">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hedef</h2>
                                    <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded-full font-bold">
                                        Noktanın konumuna dikkat et
                                    </span>
                                </div>
                                <div className="flex justify-center">
                                    <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                                        <ShapeRendererView shapes={puzzle.shapes} dot={puzzle.targetPoint} size={200} />
                                    </div>
                                </div>
                                <p className="mt-4 text-center text-slate-400 text-xs">
                                    Aynı <strong className="text-white">mantıksal bölgedeki</strong> seçeneği bul
                                    <br /><span className="text-slate-500">(Seçenekler döndürülmüş olabilir)</span>
                                </p>
                            </div>

                            {/* Options */}
                            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-5 sm:p-6 border border-white/10">
                                <h2 className="text-xs font-bold text-slate-400 mb-4 text-center uppercase tracking-wider">Seçenekler</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 justify-items-center">
                                    {puzzle.options.map((option) => (
                                        <div key={option.id} className="flex flex-col items-center gap-2">
                                            <div
                                                onClick={() => handleOptionClick(option.id)}
                                                className={`bg-white/5 rounded-2xl p-3 border-2 transition-all duration-300 ${getOptionBorderClass(option.id)}`}
                                                style={{ boxShadow: 'inset 0 -3px 8px rgba(0,0,0,0.2), inset 0 3px 8px rgba(255,255,255,0.05)' }}
                                            >
                                                <ShapeRendererView
                                                    shapes={puzzle.shapes}
                                                    dot={option.point}
                                                    rotation={option.rotation}
                                                    size={120}
                                                />
                                            </div>
                                            <span className="text-xs font-bold text-slate-500">{String.fromCharCode(65 + option.id)}</span>
                                        </div>
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
                                className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-2xl font-bold text-lg"
                                style={{ boxShadow: '0 8px 32px rgba(6, 182, 212, 0.4)' }}>
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

                {/* FEEDBACK OVERLAY */}
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

export default PositionPuzzleGame;
