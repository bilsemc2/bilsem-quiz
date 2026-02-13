import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer as TimerIcon, ChevronLeft, Zap, Heart, Grid3X3,
    Delete, Check, Sparkles, Eye
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useExam } from '../../contexts/ExamContext';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import { useSound } from '../../hooks/useSound';
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
const CELL_COLORS = [
    '#14B8A6', // teal
    '#F43F5E', // rose
    '#F59E0B', // amber
    '#6366F1', // indigo
    '#10B981', // emerald
    '#8B5CF6', // violet
    '#06B6D4', // cyan
    '#F97316', // orange
    '#EC4899', // pink
];

// ──────────── Puzzle Generator ────────────
const getRandomInt = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

const generatePuzzle = (level: number): { grid: GridMatrix; ruleDescription: string } => {
    const gridSize = 3;
    const grid: GridMatrix = [];

    // Operator progression across 20 levels
    let availableOps: Operator[] = ['+'];
    if (level >= 3) availableOps.push('-');
    if (level >= 6) availableOps.push('*');
    if (level >= 10) availableOps.push('/');

    const selectedOp: Operator = availableOps[Math.floor(Math.random() * availableOps.length)];

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
            const maxFactor = 2 + Math.floor(difficultyFactor / 2);
            a = getRandomInt(2, maxFactor);
            b = getRandomInt(2, maxFactor + 2);
            c = a * b;
        } else {
            const maxDivisor = 2 + Math.floor(difficultyFactor / 3);
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
    const rowIndices = [0, 1, 2].sort(() => Math.random() - 0.5);
    let rowsToHideCount = level < 5 ? 1 : level < 12 ? 2 : 3;

    for (let i = 0; i < rowsToHideCount; i++) {
        const rowIndex = rowIndices[i];
        const colIndex = getRandomInt(0, 2);
        grid[rowIndex][colIndex].isMissing = true;
    }

    return { grid, ruleDescription: ruleDesc };
};

const MathGridGame: React.FC = () => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const { submitResult } = useExam();
    const { feedbackState, showFeedback, dismissFeedback } = useGameFeedback({ duration: 1000 });
    const location = useLocation();
    const navigate = useNavigate();

    const examMode = location.state?.examMode || false;
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

    const [phase, setPhase] = useState<Phase>('welcome');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [level, setLevel] = useState(1);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const [grid, setGrid] = useState<GridMatrix>([]);
    const [ruleDesc, setRuleDesc] = useState('');
    const [activeCell, setActiveCell] = useState<{ r: number; c: number } | null>(null);
    const [showErrors, setShowErrors] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);
    const hasSavedRef = useRef(false);

    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    useEffect(() => {
        if (phase === 'playing' && timeLeft > 0) {
            timerRef.current = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0 && phase === 'playing') {
            handleGameOver();
        }
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [phase, timeLeft]);

    const startLevel = useCallback((lvl: number) => {
        const puzzle = generatePuzzle(lvl);
        setGrid(puzzle.grid);
        setRuleDesc(puzzle.ruleDescription);
        setShowErrors(false);
        const firstMissing = puzzle.grid.flat().find(c => c.isMissing);
        if (firstMissing) setActiveCell({ r: firstMissing.row, c: firstMissing.col });
    }, []);

    const handleStart = useCallback(() => {
        window.scrollTo(0, 0);
        setScore(0);
        setLives(INITIAL_LIVES);
        setLevel(1);
        setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
        startTimeRef.current = Date.now();
        hasSavedRef.current = false;
        setPhase('playing');
        startLevel(1);
    }, [startLevel, examMode, examTimeLimit]);

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
            game_id: 'matematik-grid',
            score_achieved: score,
            duration_seconds: duration,
            metadata: { levels_completed: level, final_lives: lives, game_name: 'Matematik Grid' },
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
            game_id: 'matematik-grid',
            score_achieved: score,
            duration_seconds: duration,
            metadata: { levels_completed: MAX_LEVEL, victory: true, game_name: 'Matematik Grid' },
        });
    }, [saveGamePlay, score, examMode, submitResult, navigate]);

    const handleCellClick = (r: number, c: number) => {
        if (phase !== 'playing') return;
        const cell = grid[r]?.[c];
        if (cell?.isMissing) {
            setActiveCell({ r, c });
            setShowErrors(false);
            playSound('select');
        }
    };

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
        playSound('pop');
    };

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

    const handleSubmit = () => {
        if (phase !== 'playing') return;

        let allCorrect = true;
        let anyFilled = false;
        let anyWrong = false;

        grid.forEach(row => row.forEach(cell => {
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
        }));

        if (!anyFilled) return;

        if (allCorrect) {
            playSound('correct');
            showFeedback(true);
            setScore(s => s + 10 * level);
            setTimeout(() => {
                dismissFeedback();
                if (level >= MAX_LEVEL) { handleVictory(); }
                else { setLevel(l => l + 1); startLevel(level + 1); }
            }, 1200);
        } else if (anyWrong) {
            playSound('incorrect');
            showFeedback(false);
            setShowErrors(true);
            setLives(l => l - 1);
            setTimeout(() => {
                dismissFeedback();
                if (lives - 1 <= 0) handleGameOver();
            }, 1200);
        }
    };

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-teal-950 to-slate-900 text-white">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" /><div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
            </div>
            <div className="relative z-10 p-4 pt-20">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link to={backLink} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"><ChevronLeft size={20} /><span>{backLabel}</span></Link>
                    {(phase === 'playing' || phase === 'feedback') && (
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)', border: '1px solid rgba(251, 191, 36, 0.3)' }}><Star className="text-amber-400 fill-amber-400" size={18} /><span className="font-bold text-amber-400">{score}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>{Array.from({ length: INITIAL_LIVES }).map((_, i) => (<Heart key={i} size={18} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-900'} />))}</div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.1) 100%)', border: '1px solid rgba(59, 130, 246, 0.3)' }}><TimerIcon className={timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'} size={18} /><span className={`font-bold ${timeLeft < 30 ? 'text-red-400' : 'text-blue-400'}`}>{formatTime(timeLeft)}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.2) 0%, rgba(13, 148, 136, 0.1) 100%)', border: '1px solid rgba(20, 184, 166, 0.3)' }}><Zap className="text-teal-400" size={18} /><span className="font-bold text-teal-400">{level}/{MAX_LEVEL}</span></div>
                        </div>
                    )}
                </div>
            </div>
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-4">
                <AnimatePresence mode="wait">
                    {phase === 'welcome' && (
                        <motion.div key="welcome" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
                            <motion.div className="w-28 h-28 rounded-[40%] flex items-center justify-center mx-auto mb-6" style={{ background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)', boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }} animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}><Grid3X3 size={52} className="text-white drop-shadow-lg" /></motion.div>
                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">Matematik Grid</h1>
                            <p className="text-slate-400 mb-8">3x3 tablodaki gizli sayıları bul! Satırlar arasındaki matematiksel bağı keşfet ve boşlukları doldur.</p>
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                                <h3 className="text-lg font-bold text-teal-300 mb-3 flex items-center gap-2"><Eye size={20} /> Nasıl Oynanır?</h3>
                                <ul className="space-y-2 text-slate-300 text-sm">
                                    <li className="flex items-center gap-2"><Sparkles size={14} className="text-teal-400" /><span>Satırlardaki sayıların birbirine nasıl dönüştüğünü bul</span></li>
                                    <li className="flex items-center gap-2"><Sparkles size={14} className="text-teal-400" /><span>Soru işareti olan hücrelere tıkla ve doğru sayıyı gir</span></li>
                                    <li className="flex items-center gap-2"><Sparkles size={14} className="text-teal-400" /><span>Tüm hücreleri doldurduktan sonra Kontrol Et butonuna bas!</span></li>
                                </ul>
                            </div>
                            <div className="bg-teal-500/10 text-teal-300 text-[10px] px-4 py-2 rounded-full mb-6 inline-block border border-teal-500/30 font-bold uppercase tracking-widest">TUZÖ 5.2.1 Sayısal Akıl Yürütme</div>
                            <motion.button whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 rounded-2xl font-bold text-xl" style={{ background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)', boxShadow: '0 8px 32px rgba(20, 184, 166, 0.4)' }}><div className="flex items-center gap-3"><Play size={28} className="fill-white" /><span>Başla</span></div></motion.button>
                        </motion.div>
                    )}
                    {(phase === 'playing' || phase === 'feedback') && (
                        <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-md flex flex-col items-center">
                            <div className="mb-6 text-center"><p className="text-xs text-slate-500 font-black tracking-[0.2em] uppercase">{showErrors ? `İlişki: ${ruleDesc}` : 'Tablodaki Boşlukları Doldur'}</p></div>
                            <div className="grid grid-cols-3 gap-4 p-6 rounded-[40px] bg-slate-900/50 backdrop-blur-xl border border-white/10 shadow-2xl w-full max-w-sm">
                                {grid.map((row, r) => row.map((cell, c) => {
                                    const isSelected = activeCell?.r === r && activeCell?.c === c;
                                    const isWrong = showErrors && cell.isMissing && cell.userValue && parseInt(cell.userValue) !== cell.value;
                                    return (<motion.div key={`${r}-${c}`} whileHover={cell.isMissing ? { scale: 1.05 } : {}} whileTap={cell.isMissing ? { scale: 0.95 } : {}} onClick={() => handleCellClick(r, c)} className={`aspect-square rounded-3xl flex items-center justify-center text-3xl sm:text-4xl font-black relative transition-all duration-300 ${cell.isMissing ? 'cursor-pointer' : ''} ${isSelected ? 'ring-4 ring-white shadow-[0_0_30px_rgba(255,255,255,0.3)]' : ''} ${isWrong ? 'ring-4 ring-red-500 animate-pulse' : ''}`} style={{ background: cell.isMissing ? 'rgba(255,255,255,0.05)' : CELL_COLORS[(r * 3 + c) % CELL_COLORS.length], border: cell.isMissing ? '2px dashed rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.2)', boxShadow: cell.isMissing ? 'inset 0 4px 8px rgba(0,0,0,0.2)' : 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.3)' }}>{cell.isMissing ? <span>{cell.userValue || '?'}</span> : <span className="drop-shadow-lg">{cell.value}</span>}</motion.div>);
                                }))}
                            </div>
                            <div className="w-full max-w-xs mt-8">
                                <div className="grid grid-cols-3 gap-2.5">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'DEL', 0, '✓'].map((btn, i) => {
                                        if (btn === 'DEL') return (<motion.button key={i} whileTap={{ scale: 0.9 }} onClick={handleDelete} className="h-16 rounded-2xl bg-white/5 border border-white/10 text-slate-400 flex items-center justify-center hover:bg-white/10"><Delete size={24} /></motion.button>);
                                        if (btn === '✓') return (<motion.button key={i} whileTap={{ scale: 0.95 }} onClick={handleSubmit} className="h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center shadow-lg"><Check size={28} /></motion.button>);
                                        return (<motion.button key={i} whileTap={{ scale: 0.9 }} onClick={() => handleNumberInput(btn.toString())} className="h-16 rounded-2xl bg-white/5 border border-white/10 text-white text-2xl font-black hover:bg-white/10">{btn}</motion.button>);
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    )}
                    {(phase === 'game_over' || phase === 'victory') && (
                        <motion.div key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
                            <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-teal-400 to-emerald-600 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><Trophy size={48} className="text-white" /></motion.div>
                            <h2 className="text-3xl font-bold text-amber-400 mb-2">{phase === 'victory' ? '🎖️ Matematik Dahisi!' : 'Tebrikler!'}</h2>
                            <p className="text-slate-400 mb-6">{phase === 'victory' ? 'Tüm gridleri kusursuz çözdün!' : 'Harika bir performans sergiledin!'}</p>
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10"><div className="grid grid-cols-2 gap-4"><div className="text-center"><p className="text-slate-400 text-sm">Skor</p><p className="text-2xl font-bold text-amber-400">{score}</p></div><div className="text-center"><p className="text-slate-400 text-sm">Seviye</p><p className="text-2xl font-bold text-emerald-400">{level}/{MAX_LEVEL}</p></div></div></div>
                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-2xl font-bold text-xl mb-4" style={{ boxShadow: '0 8px 32px rgba(20, 184, 166, 0.4)' }}><div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Oyna</span></div></motion.button>
                            <Link to={backLink} className="block text-slate-500 hover:text-white transition-colors">{location.state?.arcadeMode ? 'Bilsem Zeka' : 'Geri Dön'}</Link>
                        </motion.div>
                    )}
                </AnimatePresence>
                <GameFeedbackBanner feedback={feedbackState} />
            </div>
        </div>
    );
};

export default MathGridGame;
