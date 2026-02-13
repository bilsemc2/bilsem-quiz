import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer, Target,
    XCircle, ChevronLeft, Zap, Palette, Heart, Home,
    Sparkles, CheckCircle2, HelpCircle
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useExam } from '../../contexts/ExamContext';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';

// Game Constants - Rule of Three
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;

// High Contrast Candy Color Palette - More Distinct Colors
const COLORS = [
    '#FF3366', // Vivid Pink
    '#00BFFF', // Deep Sky Blue
    '#00FF7F', // Spring Green
    '#FFD700', // Gold
    '#9B59B6', // Purple
    '#FF6B35', // Orange Red
    '#00CED1', // Dark Turquoise
    '#E91E63', // Pink
];

const PATTERN_TYPES = ['checkered', 'stripes', 'diagonal', 'center-out', 'random-repeating'] as const;
type PatternType = typeof PATTERN_TYPES[number];
type Phase = 'welcome' | 'playing' | 'feedback' | 'game_over' | 'victory';

interface GameLevel {
    size: number;
    patternType: PatternType;
    gapPos: { r: number; c: number };
    grid: string[][];
    correctOption: string[][];
}

// Pattern Generation
const generatePattern = (size: number, type: PatternType): string[][] => {
    const grid: string[][] = Array.from({ length: size }, () => Array(size).fill(''));
    const palette = [...COLORS].sort(() => Math.random() - 0.5).slice(0, 4);

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            switch (type) {
                case 'checkered':
                    grid[r][c] = palette[(r + c) % 2];
                    break;
                case 'stripes':
                    grid[r][c] = palette[r % 2];
                    break;
                case 'diagonal':
                    grid[r][c] = palette[(r + c) % palette.length];
                    break;
                case 'center-out':
                    const dist = Math.max(Math.abs(r - Math.floor(size / 2)), Math.abs(c - Math.floor(size / 2)));
                    grid[r][c] = palette[dist % palette.length];
                    break;
                case 'random-repeating':
                default:
                    const blockR = Math.floor(r / 2);
                    const blockC = Math.floor(c / 2);
                    grid[r][c] = palette[(blockR + blockC) % palette.length];
                    break;
            }
        }
    }
    return grid;
};

const createLevel = (levelIdx: number): GameLevel => {
    const size = levelIdx < 5 ? 6 : levelIdx < 10 ? 7 : levelIdx < 15 ? 8 : 9;
    const patternType = PATTERN_TYPES[levelIdx % PATTERN_TYPES.length];
    const grid = generatePattern(size, patternType);

    const gapSize = 2;
    const gapR = Math.floor(Math.random() * (size - gapSize));
    const gapC = Math.floor(Math.random() * (size - gapSize));

    const correctOption: string[][] = [];
    for (let r = 0; r < gapSize; r++) {
        correctOption[r] = [];
        for (let c = 0; c < gapSize; c++) {
            correctOption[r][c] = grid[gapR + r][gapC + c];
        }
    }

    return { size, patternType, gapPos: { r: gapR, c: gapC }, grid, correctOption };
};

const PatternPainterGame: React.FC = () => {
    const { saveGamePlay } = useGamePersistence();
    const { submitResult } = useExam();

    // Shared Feedback System
    const { feedbackState, showFeedback } = useGameFeedback();

    const location = useLocation();
    const navigate = useNavigate();
    const hasSavedRef = useRef(false);

    // Exam Mode Props
    const examMode = location.state?.examMode || false;
    const examLevel = location.state?.examLevel || 1;
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

    // Core State
    const [phase, setPhase] = useState<Phase>(examMode ? 'playing' : 'welcome');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [level, setLevel] = useState(examLevel);
    const [timeLeft, setTimeLeft] = useState(examMode ? examTimeLimit : TIME_LIMIT);

    // Game State
    const [currentLevel, setCurrentLevel] = useState<GameLevel | null>(null);
    const [userPainting, setUserPainting] = useState<(string | null)[][]>([]);
    const [activeColor, setActiveColor] = useState<string | null>(null);



    // Refs
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(examMode ? Date.now() : 0);

    // Auto-start for exam mode
    useEffect(() => {
        if (examMode && phase === 'playing' && !currentLevel) {
            setupLevel(examLevel);
        }
    }, [examMode, examLevel, phase, currentLevel]);

    // Timer Effect
    useEffect(() => {
        if (phase === 'playing' && timeLeft > 0) {
            timerRef.current = setTimeout(() => setTimeLeft((prev: number) => prev - 1), 1000);
        } else if (timeLeft === 0 && phase === 'playing') {
            handleGameOver();
        }
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase, timeLeft]);

    // Available colors
    const availableColors = useMemo(() => {
        if (!currentLevel) return COLORS.slice(0, 4);
        return Array.from(new Set(currentLevel.grid.flat()));
    }, [currentLevel]);

    // Setup level
    const setupLevel = useCallback((lvl: number) => {
        const newLevel = createLevel(lvl - 1);
        setCurrentLevel(newLevel);
        setUserPainting(Array.from({ length: 2 }, () => Array(2).fill(null)));
        const colors = Array.from(new Set(newLevel.grid.flat()));
        setActiveColor(colors[0]);
    }, []);

    // Start Game
    const handleStart = useCallback(() => {
        window.scrollTo(0, 0);
        setPhase('playing');
        setScore(0);
        setLives(INITIAL_LIVES);
        setLevel(1);
        setTimeLeft(TIME_LIMIT);
        startTimeRef.current = Date.now();
        hasSavedRef.current = false;
        setupLevel(1);
    }, [setupLevel]);

    // Game Over Handler
    const handleGameOver = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;

        setPhase('game_over');

        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

        // Exam mode: submit result and redirect
        if (examMode) {
            await submitResult(score > 0, score, MAX_LEVEL * 10 * MAX_LEVEL, duration).then(() => {
                navigate("/atolyeler/sinav-simulasyonu/devam");
            });
            return;
        }

        await saveGamePlay({
            game_id: 'desen-boyama',
            score_achieved: score,
            duration_seconds: duration,
            metadata: { levels_completed: level, final_lives: lives }
        });
    }, [saveGamePlay, score, level, lives, examMode, submitResult, navigate]);

    // Victory Handler
    const handleVictory = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;

        setPhase('victory');

        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

        // Exam mode: submit result and redirect
        if (examMode) {
            await submitResult(true, score, MAX_LEVEL * 10 * MAX_LEVEL, duration).then(() => {
                navigate("/atolyeler/sinav-simulasyonu/devam");
            });
            return;
        }

        await saveGamePlay({
            game_id: 'desen-boyama',
            score_achieved: score,
            duration_seconds: duration,
            metadata: { levels_completed: MAX_LEVEL, victory: true }
        });
    }, [saveGamePlay, score, examMode, submitResult, navigate]);

    // Paint Tile
    const handlePaintTile = (r: number, c: number) => {
        if (!activeColor || phase !== 'playing') return;
        const newPainting = userPainting.map(row => [...row]);
        newPainting[r][c] = activeColor;
        setUserPainting(newPainting);
    };

    // Handle feedbackState and progression
    const handleFeedbackAndProgress = useCallback((isCorrect: boolean) => {
        showFeedback(isCorrect);

        setPhase('feedback');

        // Longer timeout for wrong answers to show correct solution
        const timeout = isCorrect ? 1500 : 3000;

        setTimeout(() => {

            if (isCorrect) {
                if (level >= MAX_LEVEL) {
                    handleVictory();
                } else {
                    const nextLevel = level + 1;
                    setLevel(nextLevel);
                    setupLevel(nextLevel);
                    setPhase('playing');
                }
            } else {
                const newLives = lives - 1;
                setLives(newLives);
                setUserPainting(Array.from({ length: 2 }, () => Array(2).fill(null)));

                if (newLives <= 0) {
                    handleGameOver();
                } else {
                    setPhase('playing');
                }
            }
        }, timeout);
    }, [level, lives, handleVictory, handleGameOver, setupLevel, showFeedback]);

    // Check Answer
    const handleCheck = useCallback(() => {
        if (!currentLevel || phase !== 'playing') return;

        const isComplete = userPainting.every(row => row.every(cell => cell !== null));
        if (!isComplete) return;

        const isCorrect = JSON.stringify(userPainting) === JSON.stringify(currentLevel.correctOption);

        if (isCorrect) {
            setScore(prev => prev + 10 * level);
        }

        handleFeedbackAndProgress(isCorrect);
    }, [currentLevel, userPainting, level, phase, handleFeedbackAndProgress]);

    // Reset Painting
    const handleReset = () => {
        setUserPainting(Array.from({ length: 2 }, () => Array(2).fill(null)));
    };

    // Format Time
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // 3D Gummy style for tiles
    const getTileStyle = (color: string, isGap: boolean = false) => ({
        backgroundColor: color,
        boxShadow: isGap
            ? 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.3)'
            : `inset 0 -6px 12px rgba(0,0,0,0.15), inset 0 6px 12px rgba(255,255,255,0.4), 0 4px 8px rgba(0,0,0,0.2)`,
        borderRadius: '35%',
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-950 via-fuchsia-950 to-slate-900 text-white">
            {/* Decorative Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-500/15 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/15 rounded-full blur-3xl" />
                <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <div className="relative z-10 p-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Link
                        to="/atolyeler/bireysel-degerlendirme"
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft size={20} />
                        <span>Geri</span>
                    </Link>

                    {(phase === 'playing' || phase === 'feedback') && (
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-amber-500/20 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-amber-500/30">
                                <Star className="text-amber-400" size={16} />
                                <span className="font-bold text-amber-400">{score}</span>
                            </div>
                            <div className="flex items-center gap-1 bg-red-500/20 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-red-500/30">
                                {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
                                    <Heart
                                        key={i}
                                        size={14}
                                        className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-400/30'}
                                    />
                                ))}
                            </div>
                            <div className="flex items-center gap-2 bg-blue-500/20 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-blue-500/30">
                                <Timer className="text-blue-400" size={16} />
                                <span className={`font-bold ${timeLeft <= 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'}`}>
                                    {formatTime(timeLeft)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 bg-emerald-500/20 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-emerald-500/30">
                                <Zap className="text-emerald-400" size={16} />
                                <span className="font-bold text-emerald-400">Lv.{level}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4">
                <AnimatePresence mode="wait">
                    {/* Welcome Screen */}
                    {phase === 'welcome' && (
                        <motion.div
                            key="welcome"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center max-w-xl"
                        >
                            <motion.div
                                className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-pink-400 to-violet-500 rounded-[40%] flex items-center justify-center"
                                style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }}
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Palette size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-pink-300 via-violet-300 to-cyan-300 bg-clip-text text-transparent">
                                Desen Boyama
                            </h1>

                            <p className="text-slate-300 mb-8 text-lg">
                                Örüntüdeki boşluğu doğru renklerle doldur! 🎨
                            </p>

                            <div className="flex flex-wrap justify-center gap-4 mb-8">
                                <div className="bg-white/10 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2 border border-white/20">
                                    <Heart className="text-red-400" size={16} />
                                    <span className="text-sm text-slate-200">{INITIAL_LIVES} Can</span>
                                </div>
                                <div className="bg-white/10 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2 border border-white/20">
                                    <Timer className="text-blue-400" size={16} />
                                    <span className="text-sm text-slate-200">{TIME_LIMIT / 60} Dakika</span>
                                </div>
                                <div className="bg-white/10 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2 border border-white/20">
                                    <Target className="text-emerald-400" size={16} />
                                    <span className="text-sm text-slate-200">{MAX_LEVEL} Seviye</span>
                                </div>
                            </div>

                            {/* TUZÖ Badge */}
                            <div className="mb-8 inline-flex items-center gap-1.5 px-3 py-1 bg-violet-500/20 border border-violet-500/30 rounded-full">
                                <span className="text-[9px] font-black text-violet-300 uppercase tracking-wider">TUZÖ</span>
                                <span className="text-[9px] font-bold text-violet-400">5.3.2 Desen Analizi</span>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleStart}
                                className="px-10 py-5 bg-gradient-to-r from-pink-500 to-violet-600 rounded-2xl font-bold text-xl shadow-lg shadow-pink-500/30"
                                style={{ boxShadow: '0 8px 32px rgba(236, 72, 153, 0.4)' }}
                            >
                                <div className="flex items-center gap-3">
                                    <Play size={28} className="fill-white" />
                                    <span>Başla</span>
                                </div>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* Game Board */}
                    {(phase === 'playing' || phase === 'feedback') && currentLevel && (
                        <motion.div
                            key="playing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full max-w-lg flex flex-col items-center"
                        >
                            {/* Shared Feedback Banner */}
                            <AnimatePresence>
                                {feedbackState && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="w-full flex justify-center mb-4"
                                    >
                                        <GameFeedbackBanner feedback={feedbackState} />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <h2 className="text-xl font-bold text-slate-200 mb-4">
                                Boşluğu Tamamla ✨
                            </h2>

                            {/* Pattern Grid - 3D Gummy Style */}
                            <div
                                className="grid gap-1.5 p-4 bg-white/10 backdrop-blur-xl rounded-3xl mb-6 border border-white/20"
                                style={{
                                    gridTemplateColumns: `repeat(${currentLevel.size}, 1fr)`,
                                    width: 'min(90vw, 400px)',
                                    aspectRatio: '1',
                                    boxShadow: 'inset 0 2px 16px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.3)'
                                }}
                            >
                                {currentLevel.grid.map((row, r) =>
                                    row.map((color, c) => {
                                        const gapR = r - currentLevel.gapPos.r;
                                        const gapC = c - currentLevel.gapPos.c;
                                        const isInGap = gapR >= 0 && gapR < 2 && gapC >= 0 && gapC < 2;
                                        const paintedColor = isInGap ? userPainting[gapR]?.[gapC] : null;

                                        return (
                                            <motion.div
                                                key={`${r}-${c}`}
                                                onClick={() => isInGap && handlePaintTile(gapR, gapC)}
                                                whileHover={isInGap ? { scale: 1.15, rotate: 5 } : {}}
                                                whileTap={isInGap ? { scale: 0.9 } : {}}
                                                className={`
                                                    w-full h-full transition-all relative
                                                    ${isInGap ? 'cursor-pointer z-10' : ''}
                                                `}
                                                style={isInGap && !paintedColor
                                                    ? {
                                                        backgroundColor: 'rgba(255,255,255,0.1)',
                                                        borderRadius: '35%',
                                                        boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.3)',
                                                        border: '2px dashed rgba(255,255,255,0.3)'
                                                    }
                                                    : getTileStyle(isInGap ? (paintedColor || color) : color, isInGap)
                                                }
                                            >
                                                {isInGap && !paintedColor && (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <HelpCircle className="text-white/40" size={16} />
                                                    </div>
                                                )}
                                            </motion.div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Color Palette - 3D Style */}
                            <div className="flex flex-wrap justify-center gap-4 mb-6 p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
                                {availableColors.map((color, idx) => (
                                    <motion.button
                                        key={idx}
                                        onClick={() => setActiveColor(color)}
                                        whileHover={{ scale: 1.15, y: -4 }}
                                        whileTap={{ scale: 0.9 }}
                                        className="relative"
                                        style={{
                                            width: 52,
                                            height: 52,
                                            ...getTileStyle(color),
                                            outline: activeColor === color ? '4px solid white' : 'none',
                                            outlineOffset: 3,
                                        }}
                                    >
                                        {activeColor === color && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                            >
                                                <Sparkles className="absolute -top-2 -right-2 text-yellow-300 drop-shadow-lg" size={18} />
                                            </motion.div>
                                        )}
                                    </motion.button>
                                ))}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-4">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleReset}
                                    className="px-6 py-3 bg-white/10 backdrop-blur-sm rounded-xl font-bold flex items-center gap-2 border border-white/20"
                                >
                                    <RotateCcw size={18} />
                                    Temizle
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleCheck}
                                    className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl font-bold flex items-center gap-2"
                                    style={{ boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)' }}
                                >
                                    <CheckCircle2 size={18} />
                                    Kontrol Et
                                </motion.button>
                            </div>
                        </motion.div>
                    )}

                    {/* Game Over Screen */}
                    {phase === 'game_over' && (
                        <motion.div
                            key="game_over"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center max-w-xl"
                        >
                            <motion.div
                                className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-orange-400 to-red-500 rounded-[40%] flex items-center justify-center"
                                style={{ boxShadow: 'inset 0 -6px 12px rgba(0,0,0,0.2), inset 0 6px 12px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }}
                            >
                                <XCircle size={48} className="text-white" />
                            </motion.div>

                            <h2 className="text-3xl font-black text-orange-300 mb-2">Süre Doldu!</h2>
                            <p className="text-slate-400 mb-6">Harika bir deneydi! 💪</p>

                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/20">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Skor</p>
                                        <p className="text-3xl font-black text-amber-400">{score}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Seviye</p>
                                        <p className="text-3xl font-black text-emerald-400">{level}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 justify-center">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleStart}
                                    className="px-8 py-4 bg-gradient-to-r from-pink-500 to-violet-600 rounded-2xl font-bold text-lg"
                                    style={{ boxShadow: '0 8px 32px rgba(236, 72, 153, 0.4)' }}
                                >
                                    <div className="flex items-center gap-3">
                                        <RotateCcw size={24} />
                                        <span>Tekrar Dene</span>
                                    </div>
                                </motion.button>
                                <Link
                                    to="/atolyeler/bireysel-degerlendirme"
                                    className="px-6 py-4 bg-white/10 backdrop-blur-sm rounded-2xl font-bold flex items-center gap-2 border border-white/20"
                                >
                                    <Home size={20} />
                                    <span>Çıkış</span>
                                </Link>
                            </div>
                        </motion.div>
                    )}

                    {/* Victory Screen */}
                    {phase === 'victory' && (
                        <motion.div
                            key="victory"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center max-w-xl"
                        >
                            <motion.div
                                className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-[40%] flex items-center justify-center"
                                style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.4), 0 8px 32px rgba(251, 191, 36, 0.5)' }}
                                animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                <Trophy size={56} className="text-white" />
                            </motion.div>

                            <h2 className="text-4xl font-black text-amber-300 mb-2">🎉 Şampiyon!</h2>
                            <p className="text-slate-300 mb-6">Tüm seviyeleri tamamladın!</p>

                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-amber-500/30">
                                <p className="text-5xl font-black text-amber-400">{score}</p>
                                <p className="text-slate-400">Toplam Puan</p>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleStart}
                                className="px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-2xl font-bold text-lg text-slate-900"
                                style={{ boxShadow: '0 8px 32px rgba(251, 191, 36, 0.5)' }}
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

export default PatternPainterGame;
