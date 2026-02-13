import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer, Target, XCircle, ChevronLeft, Zap, Heart, Grid3X3,
    Delete, Check,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useExam } from '../../contexts/ExamContext';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';

// ──────────── Constants ────────────
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;

type Phase = 'welcome' | 'playing' | 'feedback' | 'game_over' | 'victory';



// ──────────── Types ────────────
interface CellData {
    value: number;
    row: number;
    col: number;
    isMissing: boolean;
    userValue?: string;
}

type GridMatrix = CellData[][];
type Operator = '+' | '-' | '*' | '/';

// ──────────── Cell Colors (Gummy Style) ────────────
const CELL_GRADIENTS = [
    'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)', // teal
    'linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)', // rose
    'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', // amber
    'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', // indigo
    'linear-gradient(135deg, #10B981 0%, #059669 100%)', // emerald
    'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)', // violet
    'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)', // cyan
    'linear-gradient(135deg, #F97316 0%, #EA580C 100%)', // orange
    'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)', // pink
];

// ──────────── Feedback Messages ────────────
// ──────────── Puzzle Generator ────────────
const getRandomInt = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

const generatePuzzle = (level: number): { grid: GridMatrix; ruleDescription: string } => {
    const gridSize = 3;
    const grid: GridMatrix = [];

    // Operator progression across 20 levels
    let availableOps: Operator[] = ['+'];
    if (level >= 3) availableOps.push('-');
    if (level >= 5) availableOps.push('*');
    if (level >= 8) availableOps.push('/');

    const selectedOp: Operator = level <= 2 ? '+'
        : level <= 4 ? '-'
            : level <= 7 ? (level <= 5 ? '*' : availableOps[getRandomInt(0, availableOps.length - 1)])
                : availableOps[getRandomInt(0, availableOps.length - 1)];

    let ruleDesc = '';
    switch (selectedOp) {
        case '+': ruleDesc = 'A + B = C'; break;
        case '-': ruleDesc = 'A - B = C'; break;
        case '*': ruleDesc = 'A × B = C'; break;
        case '/': ruleDesc = 'A ÷ B = C'; break;
    }

    const difficultyFactor = Math.ceil(level / 3);

    for (let r = 0; r < gridSize; r++) {
        let a: number, b: number, c: number;

        if (selectedOp === '+') {
            const max = 10 + difficultyFactor * 10;
            a = getRandomInt(1, max);
            b = getRandomInt(1, max);
            c = a + b;
        } else if (selectedOp === '-') {
            const max = 10 + difficultyFactor * 10;
            b = getRandomInt(1, max);
            c = getRandomInt(1, max);
            a = b + c;
        } else if (selectedOp === '*') {
            const maxFactor = 3 + difficultyFactor;
            a = getRandomInt(2, maxFactor);
            b = getRandomInt(2, maxFactor);
            c = a * b;
        } else {
            const maxDivisor = 2 + Math.floor(difficultyFactor / 2);
            const maxResult = 5 + difficultyFactor * 2;
            b = getRandomInt(2, maxDivisor + 3);
            c = getRandomInt(2, maxResult);
            a = b * c;
        }

        const rowValues = [a, b, c];
        const rowCells = rowValues.map((val, cIndex) => ({
            value: val,
            row: r,
            col: cIndex,
            isMissing: false,
        }));
        grid.push(rowCells);
    }

    // Hide cells based on level
    const rowIndices = [0, 1, 2];
    for (let i = rowIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rowIndices[i], rowIndices[j]] = [rowIndices[j], rowIndices[i]];
    }

    let rowsToHideCount = 1;
    if (level >= 5) rowsToHideCount = 2;
    if (level >= 16) rowsToHideCount = 3;

    for (let i = 0; i < rowsToHideCount; i++) {
        const rowIndex = rowIndices[i];
        const colIndex = getRandomInt(0, 2);
        grid[rowIndex][colIndex].isMissing = true;
    }

    return { grid, ruleDescription: ruleDesc };
};

// ══════════════════════════════════════════════════
// MathGridGame Component
// ══════════════════════════════════════════════════

const MathGridGame: React.FC = () => {
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;
    const examMode = location.state?.examMode || false;
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

    // Game-Specific State
    const [grid, setGrid] = useState<GridMatrix>([]);
    const [ruleDesc, setRuleDesc] = useState('');
    const [activeCell, setActiveCell] = useState<{ r: number; c: number } | null>(null);
    const [showErrors, setShowErrors] = useState(false);

    // Refs
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef(0);

    // ──────────── Global Timer ────────────
    useEffect(() => {
        if (phase === 'playing') {
            if (timeLeft > 0) {
                timerRef.current = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
            } else {
                handleGameOver();
            }
        }
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [phase, timeLeft]);

    // ──────────── Start Level ────────────
    const startLevel = useCallback((lvl: number) => {
        const puzzle = generatePuzzle(lvl);
        setGrid(puzzle.grid);
        setRuleDesc(puzzle.ruleDescription);
        setShowErrors(false);

        const firstMissing = puzzle.grid.flat().find(c => c.isMissing);
        if (firstMissing) {
            setActiveCell({ r: firstMissing.row, c: firstMissing.col });
        } else {
            setActiveCell(null);
        }
    }, []);

    // ──────────── Start Game ────────────
    const handleStart = useCallback(() => {
        setScore(0);
        setLives(INITIAL_LIVES);
        setLevel(1);
        setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
        window.scrollTo(0, 0);
        setPhase('playing');
        startTimeRef.current = Date.now();
        hasSavedRef.current = false;
        startLevel(1);
    }, [startLevel]);

    // ──────────── Auto Start ────────────
    useEffect(() => {
        if ((location.state?.autoStart || examMode) && phase === 'welcome') {
            handleStart();
        }
    }, [location.state, examMode, phase, handleStart]);

    // ──────────── Game Over ────────────
    const handleGameOver = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        setPhase('game_over');

        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

        if (examMode) {
            const passed = level >= 5;
            (async () => {
                await submitResult(passed, score, 1000, duration);
                navigate('/atolyeler/sinav-simulasyonu/devam');
            })();
            return;
        }

        await saveGamePlay({
            game_id: 'matematik-grid',
            score_achieved: score,
            duration_seconds: duration,
            metadata: { levels_completed: level, final_lives: lives },
        });
    }, [saveGamePlay, score, level, lives, examMode, submitResult, navigate]);

    // ──────────── Victory ────────────
    const handleVictory = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        setPhase('victory');

        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

        if (examMode) {
            (async () => {
                await submitResult(true, score, 1000, duration);
                navigate('/atolyeler/sinav-simulasyonu/devam');
            })();
            return;
        }

        await saveGamePlay({
            game_id: 'matematik-grid',
            score_achieved: score,
            duration_seconds: duration,
            metadata: { levels_completed: MAX_LEVEL, victory: true },
        });
    }, [saveGamePlay, score, examMode, submitResult, navigate]);

    // ──────────── Cell Click ────────────
    const handleCellClick = (r: number, c: number) => {
        if (phase !== 'playing') return;
        const cell = grid[r]?.[c];
        if (cell?.isMissing) {
            setActiveCell({ r, c });
            setShowErrors(false);
        }
    };

    // ──────────── Number Input ────────────
    const handleNumberInput = (num: string) => {
        if (!activeCell || phase !== 'playing') return;
        setGrid(prev => {
            const newGrid = prev.map(row => row.map(cell => ({ ...cell })));
            const cell = newGrid[activeCell.r][activeCell.c];
            if ((cell.userValue || '').length < 3) {
                cell.userValue = (cell.userValue || '') + num;
            }
            return newGrid;
        });
        setShowErrors(false);
    };

    // ──────────── Delete ────────────
    const handleDelete = () => {
        if (!activeCell || phase !== 'playing') return;
        setGrid(prev => {
            const newGrid = prev.map(row => row.map(cell => ({ ...cell })));
            const cell = newGrid[activeCell.r][activeCell.c];
            cell.userValue = cell.userValue?.slice(0, -1) || '';
            return newGrid;
        });
        setShowErrors(false);
    };

    // ──────────── Submit / Check ────────────
    const handleSubmit = () => {
        if (phase !== 'playing') return;

        let allCorrect = true;
        let anyFilled = false;
        let anyWrong = false;

        grid.forEach(row =>
            row.forEach(cell => {
                if (cell.isMissing) {
                    if (!cell.userValue) {
                        allCorrect = false;
                    } else {
                        anyFilled = true;
                        if (parseInt(cell.userValue) !== cell.value) {
                            allCorrect = false;
                            anyWrong = true;
                        }
                    }
                }
            })
        );

        if (!anyFilled) return;

        if (allCorrect) {
            // Correct!
            showFeedback(true);
            setScore(prev => prev + 10 * level);

            setTimeout(() => {
                if (level >= MAX_LEVEL) {
                    handleVictory();
                } else {
                    const nextLevel = level + 1;
                    setLevel(nextLevel);
                    startLevel(nextLevel);
                }
            }, 1200);
        } else if (anyWrong) {
            // Wrong answer
            showFeedback(false);
            setShowErrors(true);
            const newLives = lives - 1;
            setLives(newLives);

            setTimeout(() => {
                if (newLives <= 0) {
                    handleGameOver();
                }
                // Stay on same level, user can retry
            }, 1200);
        }
    };

    // ──────────── Format Time ────────────
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // ══════════════════════════════════════════════════
    // RENDER
    // ══════════════════════════════════════════════════

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-teal-950 to-slate-900 text-white">
            {/* Decorative Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
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

                    {phase === 'playing' && (
                        <div className="flex items-center gap-3 sm:gap-5 flex-wrap justify-end">
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
                                <span className="font-bold text-emerald-400 text-sm">Seviye {level}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4">
                <AnimatePresence mode="wait">
                    {/* ──── Welcome Screen ──── */}
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
                                <span className="text-[9px] font-bold text-violet-400">5.2.1 Sayısal Akıl Yürütme</span>
                            </div>

                            <motion.div
                                className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center"
                                style={{
                                    borderRadius: '40%',
                                    boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)',
                                }}
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            >
                                <Grid3X3 size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                                Matematik Grid
                            </h1>

                            <p className="text-slate-400 mb-8 leading-relaxed">
                                3×3 sayı tablosundaki gizli sayıları bul!
                                Satırlar arasındaki matematiksel ilişkiyi keşfet.
                            </p>

                            <div className="flex flex-wrap justify-center gap-4 mb-8">
                                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2">
                                    <Heart className="text-red-400" size={16} />
                                    <span className="text-sm text-slate-300">{INITIAL_LIVES} Can</span>
                                </div>
                                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2">
                                    <Timer className="text-blue-400" size={16} />
                                    <span className="text-sm text-slate-300">{TIME_LIMIT / 60} Dakika</span>
                                </div>
                                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2">
                                    <Target className="text-emerald-400" size={16} />
                                    <span className="text-sm text-slate-300">{MAX_LEVEL} Seviye</span>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleStart}
                                className="px-10 py-5 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-2xl font-bold text-xl"
                                style={{ boxShadow: '0 8px 32px rgba(20, 184, 166, 0.4)' }}
                            >
                                <div className="flex items-center gap-3">
                                    <Play size={28} className="fill-white" />
                                    <span>Başla</span>
                                </div>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* ──── Playing Phase ──── */}
                    {phase === 'playing' && (
                        <motion.div
                            key="playing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full max-w-md flex flex-col items-center"
                        >
                            {/* Rule Hint */}
                            <div className="mb-4 text-center">
                                <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest">
                                    Kural: {showErrors ? ruleDesc : '???'}
                                </p>
                            </div>

                            {/* Grid */}
                            <div className="grid grid-cols-3 gap-3 p-4 bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/10 w-full max-w-xs mx-auto"
                                style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
                            >
                                {grid.map((row, rIndex) =>
                                    row.map((cell, cIndex) => {
                                        const colorIndex = (rIndex * 3 + cIndex) % CELL_GRADIENTS.length;
                                        const isSelected = activeCell?.r === rIndex && activeCell?.c === cIndex;
                                        const isCorrect = cell.isMissing && cell.userValue === cell.value.toString();
                                        const isWrong = showErrors && cell.isMissing && cell.userValue && cell.userValue !== cell.value.toString();

                                        return (
                                            <motion.div
                                                key={`${rIndex}-${cIndex}`}
                                                whileHover={cell.isMissing ? { scale: 1.05 } : undefined}
                                                whileTap={cell.isMissing ? { scale: 0.95 } : undefined}
                                                onClick={() => handleCellClick(rIndex, cIndex)}
                                                className={`aspect-square flex items-center justify-center rounded-xl text-3xl sm:text-4xl font-bold text-white relative transition-all duration-200 select-none
                          ${cell.isMissing ? 'cursor-pointer' : ''}
                          ${isSelected ? 'ring-4 ring-white/80 scale-105 z-10' : ''}
                          ${isWrong ? 'ring-4 ring-red-500 animate-pulse' : ''}
                          ${isCorrect ? 'ring-4 ring-green-400' : ''}
                        `}
                                                style={{
                                                    background: cell.isMissing
                                                        ? 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)'
                                                        : CELL_GRADIENTS[colorIndex],
                                                    boxShadow: cell.isMissing
                                                        ? 'inset 0 -3px 6px rgba(0,0,0,0.2), inset 0 3px 6px rgba(255,255,255,0.05)'
                                                        : 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.25), 0 4px 12px rgba(0,0,0,0.15)',
                                                    border: cell.isMissing ? '2px dashed rgba(255,255,255,0.2)' : 'none',
                                                }}
                                            >
                                                {cell.isMissing ? (
                                                    <span className={cell.userValue ? 'text-white' : 'text-slate-500'}>
                                                        {cell.userValue || '?'}
                                                    </span>
                                                ) : (
                                                    <span className="drop-shadow-md">{cell.value}</span>
                                                )}

                                                {cell.isMissing && !cell.userValue && !isSelected && (
                                                    <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-slate-500 rounded-full animate-pulse" />
                                                )}
                                            </motion.div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Numpad */}
                            <div className="w-full max-w-xs mx-auto mt-6">
                                <div className="grid grid-cols-3 gap-2.5">
                                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'DEL'].map((btn, idx) => {
                                        if (btn === 'DEL') {
                                            return (
                                                <motion.button
                                                    key={idx}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={handleDelete}
                                                    className="bg-slate-700/60 backdrop-blur-sm text-slate-300 hover:bg-slate-600/60 font-bold text-xl py-3.5 rounded-xl flex items-center justify-center border border-white/10 transition-colors"
                                                    style={{ boxShadow: 'inset 0 -3px 6px rgba(0,0,0,0.2)' }}
                                                >
                                                    <Delete size={22} />
                                                </motion.button>
                                            );
                                        }
                                        if (btn === '') return <div key={idx} />;
                                        return (
                                            <motion.button
                                                key={idx}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => handleNumberInput(btn)}
                                                className="bg-slate-800/60 backdrop-blur-sm text-white hover:bg-slate-700/60 font-bold text-2xl py-3.5 rounded-xl border border-white/10 transition-colors"
                                                style={{ boxShadow: 'inset 0 -3px 6px rgba(0,0,0,0.2), inset 0 3px 6px rgba(255,255,255,0.05)' }}
                                            >
                                                {btn}
                                            </motion.button>
                                        );
                                    })}
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleSubmit}
                                    className="w-full mt-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold text-xl py-4 rounded-xl flex items-center justify-center gap-2"
                                    style={{ boxShadow: '0 6px 24px rgba(20, 184, 166, 0.35)' }}
                                >
                                    <Check size={28} />
                                    KONTROL ET
                                </motion.button>
                            </div>
                        </motion.div>
                    )}

                    {/* ──── Game Over ──── */}
                    {phase === 'game_over' && (
                        <motion.div
                            key="game_over"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center max-w-xl"
                        >
                            <div
                                className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center"
                                style={{ borderRadius: '40%', boxShadow: 'inset 0 -6px 12px rgba(0,0,0,0.2), 0 8px 24px rgba(0,0,0,0.3)' }}
                            >
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
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleStart}
                                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl font-bold text-lg"
                                style={{ boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)' }}
                            >
                                <div className="flex items-center gap-3">
                                    <RotateCcw size={24} />
                                    <span>Tekrar Dene</span>
                                </div>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* ──── Victory ──── */}
                    {phase === 'victory' && (
                        <motion.div
                            key="victory"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center max-w-xl"
                        >
                            <motion.div
                                className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center"
                                style={{ borderRadius: '40%', boxShadow: 'inset 0 -6px 12px rgba(0,0,0,0.2), 0 8px 24px rgba(0,0,0,0.3)' }}
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
                                whileHover={{ scale: 1.05 }}
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

                {/* ──── Feedback Overlay ──── */}
                <AnimatePresence>
                    {feedbackState && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-end justify-center pb-24 pointer-events-none"
                        >
                            <div className="pointer-events-auto">
                                <GameFeedbackBanner feedback={feedbackState} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default MathGridGame;
