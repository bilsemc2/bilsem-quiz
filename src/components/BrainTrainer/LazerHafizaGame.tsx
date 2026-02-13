import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer, Target,
    XCircle, ChevronLeft, Zap, Heart, Crosshair
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
const GAME_ID = 'lazer-hafiza';

type Phase = 'welcome' | 'playing' | 'feedback' | 'game_over' | 'victory';
type SubPhase = 'preview' | 'input';

interface Coordinate {
    row: number;
    col: number;
}

// ─── Path Generator ──────────────────────────────────────────
const generateRandomPath = (size: number, length: number, allowDiagonals: boolean): Coordinate[] => {
    let bestPath: Coordinate[] = [];

    for (let attempt = 0; attempt < 50; attempt++) {
        const path: Coordinate[] = [];
        let r = Math.floor(Math.random() * size);
        let c = Math.floor(Math.random() * size);
        path.push({ row: r, col: c });

        let stuck = false;
        for (let i = 1; i < length; i++) {
            const moves = [
                { r: -1, c: 0 }, { r: 1, c: 0 }, { r: 0, c: -1 }, { r: 0, c: 1 }
            ];
            if (allowDiagonals) {
                moves.push(
                    { r: -1, c: -1 }, { r: -1, c: 1 }, { r: 1, c: -1 }, { r: 1, c: 1 }
                );
            }
            const valid = moves.filter(m => {
                const nr = r + m.r;
                const nc = c + m.c;
                if (nr < 0 || nr >= size || nc < 0 || nc >= size) return false;
                return !path.some(p => p.row === nr && p.col === nc);
            });
            if (valid.length === 0) { stuck = true; break; }
            const move = valid[Math.floor(Math.random() * valid.length)];
            r += move.r;
            c += move.c;
            path.push({ row: r, col: c });
        }

        if (!stuck && path.length === length) return path;
        if (path.length > bestPath.length) bestPath = path;
    }
    return bestPath;
};

const THEMES = [
    "PROTOCOL_ALPHA", "NEON_SNAKE", "VECTOR_LOCK", "CYBER_TRACE",
    "DATA_STREAM", "SYNTH_WAVE", "MATRIX_ROOT", "VOID_LINK"
];

// ─── Level Config ────────────────────────────────────────────
const getLevelConfig = (level: number) => {
    const gridSize = Math.min(6, 3 + Math.floor((level - 1) / 3));
    const pathLength = Math.min(gridSize * gridSize - 1, 3 + Math.floor((level - 1) * 0.8));
    const allowDiagonals = level >= 5;
    return { gridSize, pathLength, allowDiagonals };
};

// ─── Component ───────────────────────────────────────────────
interface LazerHafizaGameProps {
    examMode?: boolean;
}

const LazerHafizaGame: React.FC<LazerHafizaGameProps> = ({ examMode = false }) => {
    const { saveGamePlay } = useGamePersistence();
    const hasSavedRef = useRef(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { submitResult } = useExam();
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

    // Core state
    const [phase, setPhase] = useState<Phase>('welcome');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [level, setLevel] = useState(1);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);

    // Game-specific state
    const [subPhase, setSubPhase] = useState<SubPhase>('preview');
    const [path, setPath] = useState<Coordinate[]>([]);
    const [userPath, setUserPath] = useState<Coordinate[]>([]);
    const [visiblePathIndex, setVisiblePathIndex] = useState(-1);
    const [currentTheme, setCurrentTheme] = useState('');
    const [gridSize, setGridSize] = useState(3);
    const [wrongCell, setWrongCell] = useState<Coordinate | null>(null);

    // Refs
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);
    const previewTimerRef = useRef<number | null>(null);

    // Timer
    useEffect(() => {
        if (phase === 'playing' && timeLeft > 0) {
            timerRef.current = setTimeout(() => setTimeLeft(p => p - 1), 1000);
        } else if (timeLeft === 0 && phase === 'playing') {
            handleGameOver();
        }
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [phase, timeLeft]);

    // Generate level
    const generateLevel = useCallback((lvl: number) => {
        const config = getLevelConfig(lvl);
        setGridSize(config.gridSize);
        const newPath = generateRandomPath(config.gridSize, config.pathLength, config.allowDiagonals);
        setPath(newPath);
        setUserPath([]);
        setVisiblePathIndex(-1);
        setWrongCell(null);
        setSubPhase('preview');
        setCurrentTheme(THEMES[Math.floor(Math.random() * THEMES.length)]);
    }, []);

    // Show preview animation
    useEffect(() => {
        if (phase !== 'playing' || subPhase !== 'preview' || path.length === 0) return;

        let step = 0;
        setVisiblePathIndex(-1);

        const previewSpeed = Math.max(350, 700 - level * 15);

        const runPreview = () => {
            setVisiblePathIndex(step);
            step++;
            if (step < path.length) {
                previewTimerRef.current = window.setTimeout(runPreview, previewSpeed);
            } else {
                previewTimerRef.current = window.setTimeout(() => {
                    setSubPhase('input');
                    setVisiblePathIndex(-1);
                }, 800);
            }
        };

        previewTimerRef.current = window.setTimeout(runPreview, 400);
        return () => { if (previewTimerRef.current) clearTimeout(previewTimerRef.current); };
    }, [phase, subPhase, path, level]);

    // Start game
    const handleStart = useCallback(() => {
        setPhase('playing');
        setScore(0);
        setLives(INITIAL_LIVES);
        setLevel(1);
        setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
        startTimeRef.current = Date.now();
        hasSavedRef.current = false;
        generateLevel(1);
    }, [hasSavedRef, examMode, examTimeLimit, generateLevel]);

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

        if (examMode) {
            submitResult(level >= 5, score, 1000, duration);
            setTimeout(() => navigate('/atolyeler/sinav-simulasyonu/devam'), 1500);
            return;
        }

        await saveGamePlay({
            game_id: GAME_ID,
            score_achieved: score,
            duration_seconds: duration,
            metadata: { levels_completed: level, final_lives: lives },
        });
    }, [saveGamePlay, score, level, lives, examMode, submitResult, navigate, hasSavedRef]);

    // Victory
    const handleVictory = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        setPhase('victory');
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

        if (examMode) {
            submitResult(true, score, 1000, duration);
            setTimeout(() => navigate('/atolyeler/sinav-simulasyonu/devam'), 1500);
            return;
        }

        await saveGamePlay({
            game_id: GAME_ID,
            score_achieved: score,
            duration_seconds: duration,
            metadata: { levels_completed: MAX_LEVEL, victory: true },
        });
    }, [saveGamePlay, score, examMode, submitResult, navigate, hasSavedRef]);

    // Feedback hook
    const { feedbackState, showFeedback, isFeedbackActive } = useGameFeedback({
        onFeedbackEnd: (correct) => {
            if (correct) {
                setScore(prev => prev + 10 * level);
                if (level >= MAX_LEVEL) {
                    handleVictory();
                } else {
                    const nextLevel = level + 1;
                    setLevel(nextLevel);
                    setPhase('playing');
                    generateLevel(nextLevel);
                }
            } else {
                const newLives = lives - 1;
                setLives(newLives);
                if (newLives <= 0) {
                    handleGameOver();
                } else {
                    setPhase('playing');
                    generateLevel(level); // Retry same level
                }
            }
        },
    });

    // Cell click
    const handleCellClick = useCallback((row: number, col: number) => {
        if (phase !== 'playing' || subPhase !== 'input' || isFeedbackActive) return;

        const expectedIndex = userPath.length;
        const expected = path[expectedIndex];
        if (!expected) return;

        const isCorrect = expected.row === row && expected.col === col;

        if (isCorrect) {
            const newUserPath = [...userPath, { row, col }];
            setUserPath(newUserPath);

            // Level complete
            if (newUserPath.length === path.length) {
                setPhase('feedback');
                showFeedback(true, ['Süper hafıza! 🧠', 'Rotayı buldun! 🎯', 'Lazer hattı kuruldu! ⚡', 'Muhteşem! 🌟'][Math.floor(Math.random() * 4)]);
            }
        } else {
            setWrongCell({ row, col });
            setUserPath(prev => [...prev, { row, col }]);
            setPhase('feedback');
            showFeedback(false, 'Yanlış düğüm! Rotayı hatırla 💫');
            setTimeout(() => setWrongCell(null), 2000);
        }
    }, [phase, subPhase, userPath, path, isFeedbackActive, showFeedback]);

    // Format time
    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    // Body scroll lock + scroll to top
    const isActive = phase === 'playing' || phase === 'feedback';
    useEffect(() => {
        if (isActive) {
            window.scrollTo(0, 0);
            document.body.style.overflow = 'hidden';
            document.body.style.touchAction = 'none';
        }
        return () => {
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
        };
    }, [isActive]);

    // SVG helpers
    const getCellCenter = useCallback((row: number, col: number) => {
        const cs = 100 / gridSize;
        return { x: col * cs + cs / 2, y: row * cs + cs / 2 };
    }, [gridSize]);

    const previewSvgPath = useMemo(() => {
        if (subPhase !== 'preview' || visiblePathIndex < 1) return '';
        return path.slice(0, visiblePathIndex + 1).map((c, i) => {
            const { x, y } = getCellCenter(c.row, c.col);
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ');
    }, [path, visiblePathIndex, subPhase, getCellCenter]);

    const userSvgPath = useMemo(() => {
        if (userPath.length < 2) return '';
        return userPath.map((c, i) => {
            const { x, y } = getCellCenter(c.row, c.col);
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ');
    }, [userPath, getCellCenter]);

    // Node state
    const getNodeState = (r: number, c: number) => {
        const isPreview = subPhase === 'preview' && phase === 'playing' &&
            path.some((p, idx) => idx <= visiblePathIndex && p.row === r && p.col === c);
        const isUser = subPhase === 'input' &&
            userPath.some(p => p.row === r && p.col === c);
        const isWrong = wrongCell?.row === r && wrongCell?.col === c;

        let isHead = false;
        if (subPhase === 'preview' && phase === 'playing') {
            const h = path[visiblePathIndex];
            isHead = !!(h && h.row === r && h.col === c);
        } else if (subPhase === 'input') {
            const h = userPath[userPath.length - 1];
            isHead = !!(h && h.row === r && h.col === c);
        }

        // Show correct path during feedback if wrong
        const isCorrectReveal = isFeedbackActive && feedbackState?.correct === false &&
            path.some(p => p.row === r && p.col === c);

        return { active: isPreview || isUser, isHead, isWrong, isCorrectReveal };
    };

    const gridTemplate = `repeat(${gridSize}, minmax(0, 1fr))`;

    return (
        <div
            className={`min-h-screen flex flex-col bg-gradient-to-br from-violet-950 via-purple-950 to-slate-900 text-white ${isActive ? 'overflow-hidden h-screen' : ''}`}
            style={isActive ? { touchAction: 'none', overscrollBehavior: 'none' } : {}}
        >
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
                        <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-end">
                            <div className="flex items-center gap-2 bg-amber-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-amber-500/30">
                                <Star className="text-amber-400" size={14} />
                                <span className="font-bold text-amber-400 text-sm">{score}</span>
                            </div>
                            <div className="flex items-center gap-1 bg-red-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-red-500/30">
                                {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
                                    <Heart key={i} size={12} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-400/30'} />
                                ))}
                            </div>
                            <div className="flex items-center gap-2 bg-blue-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-blue-500/30">
                                <Timer className="text-blue-400" size={14} />
                                <span className={`font-bold text-sm ${timeLeft <= 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'}`}>
                                    {formatTime(timeLeft)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 bg-emerald-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-emerald-500/30">
                                <Zap className="text-emerald-400" size={14} />
                                <span className="font-bold text-emerald-400 text-sm">{level}/{MAX_LEVEL}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center flex-1 p-4">
                <AnimatePresence mode="wait">
                    {/* Welcome */}
                    {phase === 'welcome' && (
                        <motion.div
                            key="welcome"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center max-w-xl mt-8"
                        >
                            {/* TUZÖ Badge */}
                            <div className="mb-6 inline-flex items-center gap-1.5 px-3 py-1 bg-violet-500/20 border border-violet-500/30 rounded-full">
                                <span className="text-[9px] font-black text-violet-300 uppercase tracking-wider">TUZÖ</span>
                                <span className="text-[9px] font-bold text-violet-400">5.4.1 Kısa Süreli Görsel Bellek</span>
                            </div>

                            <motion.div
                                className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-cyan-400 to-teal-600 rounded-[40%] flex items-center justify-center"
                                style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }}
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Crosshair size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                                Lazer Hafıza
                            </h1>

                            <p className="text-slate-400 mb-8 leading-relaxed">
                                Lazer yolunu dikkatlice izle, sonra aynı sırayla düğümlere tıkla!
                                <br />
                                <span className="text-cyan-400 font-semibold">Her seviyede rota uzar, grid büyür.</span>
                            </p>

                            <div className="flex flex-wrap justify-center gap-4 mb-8">
                                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2">
                                    <Heart className="text-red-400" size={16} />
                                    <span className="text-sm text-slate-300">{INITIAL_LIVES} Can</span>
                                </div>
                                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2">
                                    <Timer className="text-blue-400" size={16} />
                                    <span className="text-sm text-slate-300">{TIME_LIMIT / 60} Dakika</span>
                                </div>
                                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2">
                                    <Target className="text-emerald-400" size={16} />
                                    <span className="text-sm text-slate-300">{MAX_LEVEL} Seviye</span>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleStart}
                                className="px-10 py-5 bg-gradient-to-r from-cyan-500 to-teal-600 rounded-2xl font-bold text-xl"
                                style={{ boxShadow: '0 8px 32px rgba(6, 182, 212, 0.4)' }}
                            >
                                <div className="flex items-center gap-3">
                                    <Play size={28} className="fill-white" />
                                    <span>Başla</span>
                                </div>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* Playing / Feedback */}
                    {(phase === 'playing' || phase === 'feedback') && (
                        <motion.div
                            key="playing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full max-w-md"
                        >
                            {/* Status bar */}
                            <div className="flex justify-between items-center text-xs mb-3 px-1">
                                <span className="text-cyan-400 font-mono font-bold tracking-wider">
                                    {subPhase === 'preview' ? '🔍 ROTAYI İZLE' : '🎯 DÜĞÜMLERE TIKLA'}
                                </span>
                                <span className="text-slate-500 font-mono">{currentTheme}</span>
                            </div>

                            {/* Grid */}
                            <div className="relative aspect-square w-full rounded-2xl bg-slate-800/50 backdrop-blur-xl p-4 sm:p-6 border border-white/10">
                                {/* Background grid lines */}
                                <div className="absolute inset-0 z-0 p-4 sm:p-6 grid gap-0" style={{ gridTemplateColumns: gridTemplate, gridTemplateRows: gridTemplate }}>
                                    {Array.from({ length: gridSize * gridSize }).map((_, i) => (
                                        <div key={i} className="border border-slate-700/20 w-full h-full" />
                                    ))}
                                </div>

                                {/* SVG laser lines */}
                                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 p-4 sm:p-6" viewBox="0 0 100 100" preserveAspectRatio="none">
                                    {subPhase === 'preview' && phase === 'playing' && (
                                        <path
                                            d={previewSvgPath}
                                            stroke="#06b6d4"
                                            strokeWidth="2.5"
                                            fill="none"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            style={{ filter: 'drop-shadow(0 0 6px #06b6d4)' }}
                                        />
                                    )}
                                    {subPhase === 'input' && userPath.length >= 2 && (
                                        <path
                                            d={userSvgPath}
                                            stroke={wrongCell ? '#ef4444' : '#22d3ee'}
                                            strokeWidth="2.5"
                                            fill="none"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            style={{ filter: `drop-shadow(0 0 6px ${wrongCell ? '#ef4444' : '#22d3ee'})` }}
                                        />
                                    )}
                                </svg>

                                {/* Interactive nodes */}
                                <div
                                    className="grid w-full h-full relative z-20"
                                    style={{ gridTemplateColumns: gridTemplate, gridTemplateRows: gridTemplate }}
                                >
                                    {Array.from({ length: gridSize * gridSize }).map((_, i) => {
                                        const r = Math.floor(i / gridSize);
                                        const c = i % gridSize;
                                        const { active, isHead, isWrong, isCorrectReveal } = getNodeState(r, c);

                                        let nodeStyle: React.CSSProperties = {
                                            width: '40%', height: '40%', borderRadius: '50%',
                                            transition: 'all 0.3s ease',
                                            background: 'rgba(100, 116, 139, 0.5)',
                                            transform: 'scale(0.6)',
                                        };

                                        if (isWrong) {
                                            nodeStyle = {
                                                ...nodeStyle,
                                                background: 'linear-gradient(135deg, #ef4444, #f97316)',
                                                boxShadow: '0 0 20px rgba(239, 68, 68, 0.8)',
                                                transform: 'scale(1)',
                                            };
                                        } else if (isCorrectReveal) {
                                            nodeStyle = {
                                                ...nodeStyle,
                                                background: 'linear-gradient(135deg, #22c55e, #10b981)',
                                                boxShadow: '0 0 12px rgba(34, 197, 94, 0.5)',
                                                transform: 'scale(0.85)',
                                            };
                                        } else if (isHead) {
                                            nodeStyle = {
                                                ...nodeStyle,
                                                background: 'white',
                                                boxShadow: '0 0 20px rgba(6, 182, 212, 1), 0 0 40px rgba(6, 182, 212, 0.4)',
                                                transform: 'scale(1)',
                                            };
                                        } else if (active) {
                                            nodeStyle = {
                                                ...nodeStyle,
                                                background: 'linear-gradient(135deg, #06b6d4, #14b8a6)',
                                                boxShadow: '0 0 10px rgba(6, 182, 212, 0.6)',
                                                transform: 'scale(0.85)',
                                            };
                                        }

                                        return (
                                            <div
                                                key={`${r}-${c}`}
                                                onClick={() => handleCellClick(r, c)}
                                                className={`flex items-center justify-center ${subPhase === 'input' && phase === 'playing' ? 'cursor-pointer' : 'cursor-default'}`}
                                                style={{ minHeight: '40px', minWidth: '40px' }}
                                            >
                                                <div style={nodeStyle} />
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Feedback banner */}
                                <GameFeedbackBanner feedback={feedbackState} />
                            </div>
                        </motion.div>
                    )}

                    {/* Game Over */}
                    {phase === 'game_over' && (
                        <motion.div
                            key="game_over"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center max-w-xl mt-8"
                        >
                            <motion.div
                                className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-red-500 to-rose-600 rounded-3xl flex items-center justify-center"
                                style={{ boxShadow: '0 8px 32px rgba(239, 68, 68, 0.3)' }}
                            >
                                <XCircle size={48} className="text-white" />
                            </motion.div>
                            <h2 className="text-3xl font-bold text-red-400 mb-4">Bağlantı Koptu!</h2>
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
                                className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl font-bold text-lg"
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
                            className="text-center max-w-xl mt-8"
                        >
                            <motion.div
                                className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-3xl flex items-center justify-center"
                                style={{ boxShadow: '0 8px 32px rgba(245, 158, 11, 0.3)' }}
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

export default LazerHafizaGame;
