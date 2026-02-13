import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Heart, ChevronLeft,
    Zap, Brain, Eye, Sparkles, Timer as TimerIcon, Crosshair
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useExam } from '../../contexts/ExamContext';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';

// ─── Constants ──────────────────────────────────────
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;

type Phase = 'welcome' | 'preview' | 'playing' | 'feedback' | 'game_over' | 'victory';

// ─── Coordinate Type ────────────────────────────────
interface Coordinate {
    row: number;
    col: number;
}

// ─── Path Generation ────────────────────────────────
const generateRandomPath = (size: number, length: number, allowDiagonals: boolean): Coordinate[] => {
    const path: Coordinate[] = [];
    let attempts = 0;
    const maxAttempts = 50;

    while (attempts < maxAttempts) {
        path.length = 0;
        let currentRow = Math.floor(Math.random() * size);
        let currentCol = Math.floor(Math.random() * size);
        path.push({ row: currentRow, col: currentCol });

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
            const validMoves = moves.filter(move => {
                const newR = currentRow + move.r;
                const newC = currentCol + move.c;
                if (newR < 0 || newR >= size || newC < 0 || newC >= size) return false;
                if (path.some(p => p.row === newR && p.col === newC)) return false;
                return true;
            });

            if (validMoves.length > 0) {
                const move = validMoves[Math.floor(Math.random() * validMoves.length)];
                currentRow += move.r;
                currentCol += move.c;
                path.push({ row: currentRow, col: currentCol });
            } else {
                stuck = true;
                break;
            }
        }
        if (!stuck && path.length === length) return path;
        attempts++;
    }
    return path;
};

// ─── Level Config ───────────────────────────────────
const getLevelConfig = (lvl: number) => {
    const gridSize = Math.min(6, 3 + Math.floor((lvl - 1) / 2));
    const pathLength = Math.min(gridSize * gridSize - 1, 3 + Math.floor((lvl - 1) * 0.8));
    const allowDiagonals = lvl >= 3;
    return { gridSize, pathLength, allowDiagonals };
};

// ─── Main Component ─────────────────────────────────
const LazerHafizaGame: React.FC = () => {
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();
    const navigate = useNavigate();
    const { submitResult } = useExam();

    const examMode = location.state?.examMode || false;
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

    const { feedbackState, showFeedback } = useGameFeedback();
    const hasSavedRef = useRef(false);

    // Core State
    const [phase, setPhase] = useState<Phase>('welcome');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [level, setLevel] = useState(1);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);

    // Game-specific state
    const [path, setPath] = useState<Coordinate[]>([]);
    const [userPath, setUserPath] = useState<Coordinate[]>([]);
    const [visiblePathIndex, setVisiblePathIndex] = useState(-1);
    const previewTimerRef = useRef<number | null>(null);

    // Responsive sizing
    const [canvasSize, setCanvasSize] = useState(0);
    useEffect(() => {
        const updateSize = () => {
            setCanvasSize(Math.min(window.innerWidth - 32, 480));
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    // Body scroll lock
    useEffect(() => {
        const isActive = phase === 'preview' || phase === 'playing' || phase === 'feedback';
        if (isActive) {
            window.scrollTo(0, 0);
            document.body.style.overflow = 'hidden';
            document.body.style.touchAction = 'none';
            document.documentElement.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
            document.documentElement.style.overflow = '';
        };
    }, [phase]);

    // Global timer
    useEffect(() => {
        if ((phase === 'preview' || phase === 'playing' || phase === 'feedback') && timeLeft > 0) {
            timerRef.current = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0 && (phase === 'preview' || phase === 'playing' || phase === 'feedback')) {
            handleGameOver();
        }
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [phase, timeLeft]);

    const config = getLevelConfig(level);

    // ─── Init Level (start preview) ─────────────────
    const initLevel = useCallback((lvl: number) => {
        const cfg = getLevelConfig(lvl);
        const newPath = generateRandomPath(cfg.gridSize, cfg.pathLength, cfg.allowDiagonals);
        setPath(newPath);
        setUserPath([]);
        setVisiblePathIndex(-1);
        setPhase('preview');
    }, []);

    // ─── Preview Animation ──────────────────────────
    useEffect(() => {
        if (phase === 'preview' && path.length > 0) {
            let step = 0;
            setVisiblePathIndex(-1);

            const previewSpeed = Math.max(350, 700 - level * 20);

            const runPreview = () => {
                setVisiblePathIndex(step);
                step++;
                if (step < path.length) {
                    previewTimerRef.current = window.setTimeout(runPreview, previewSpeed);
                } else {
                    previewTimerRef.current = window.setTimeout(() => {
                        setVisiblePathIndex(-1);
                        setPhase('playing');
                    }, 800);
                }
            };
            previewTimerRef.current = window.setTimeout(runPreview, 400);
        }
        return () => {
            if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
        };
    }, [phase, path, level]);

    // ─── Start / Restart ────────────────────────────
    const handleStart = useCallback(() => {
        window.scrollTo(0, 0);
        setScore(0);
        setLives(INITIAL_LIVES);
        setLevel(1);
        setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
        startTimeRef.current = Date.now();
        hasSavedRef.current = false;
        initLevel(1);
    }, [examMode, examTimeLimit, initLevel]);

    // Auto-start
    useEffect(() => {
        if ((location.state?.autoStart || examMode) && phase === 'welcome') {
            handleStart();
        }
    }, [location.state, examMode, phase, handleStart]);

    // ─── Game Over ──────────────────────────────────
    const handleGameOver = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        setPhase('game_over');
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

        if (examMode) {
            const passed = level >= 5;
            await submitResult(passed, score, 1000, duration);
            navigate('/atolyeler/sinav-simulasyonu/devam');
            return;
        }

        await saveGamePlay({
            game_id: 'lazer-hafiza',
            score_achieved: score,
            duration_seconds: duration,
            metadata: { levels_completed: level, final_lives: lives },
        });
    }, [saveGamePlay, score, level, lives, examMode, submitResult, navigate]);

    // ─── Victory ────────────────────────────────────
    const handleVictory = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        setPhase('victory');
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

        if (examMode) {
            await submitResult(true, score, 1000, duration);
            navigate('/atolyeler/sinav-simulasyonu/devam');
            return;
        }

        await saveGamePlay({
            game_id: 'lazer-hafiza',
            score_achieved: score,
            duration_seconds: duration,
            metadata: { levels_completed: MAX_LEVEL, victory: true },
        });
    }, [saveGamePlay, score, examMode, submitResult, navigate]);

    // ─── Cell Click (User Input) ────────────────────
    const handleCellClick = (row: number, col: number) => {
        if (phase !== 'playing' || feedbackState) return;

        const expectedIndex = userPath.length;
        const expectedCoord = path[expectedIndex];
        if (!expectedCoord) return;

        const isCorrect = expectedCoord.row === row && expectedCoord.col === col;
        const newUserPath = [...userPath, { row, col }];
        setUserPath(newUserPath);

        if (isCorrect) {
            // Check if level complete
            if (newUserPath.length === path.length) {
                showFeedback(true);
                setScore(prev => prev + level * 100 + path.length * 10);
                setPhase('feedback');

                setTimeout(() => {
                    if (level >= MAX_LEVEL) {
                        handleVictory();
                    } else {
                        const newLevel = level + 1;
                        setLevel(newLevel);
                        initLevel(newLevel);
                    }
                }, 1500);
            }
            // If not complete, just continue (partial correct — no feedback yet)
        } else {
            // Wrong move
            showFeedback(false);
            const newLives = lives - 1;
            setLives(newLives);
            setPhase('feedback');

            setTimeout(() => {
                if (newLives <= 0) {
                    handleGameOver();
                } else {
                    initLevel(level); // Retry same level
                }
            }, 1500);
        }
    };

    // ─── Node Visual State ──────────────────────────
    const getNodeState = (r: number, c: number) => {
        const isPreview = phase === 'preview' &&
            path.some((p, index) => index <= visiblePathIndex && p.row === r && p.col === c);

        const isUserActive = (phase === 'playing' || phase === 'feedback') &&
            userPath.some(p => p.row === r && p.col === c);

        let isHead = false;
        if (phase === 'preview') {
            const currentHead = path[visiblePathIndex];
            isHead = !!(currentHead && currentHead.row === r && currentHead.col === c);
        } else if (phase === 'playing') {
            const lastUserMove = userPath[userPath.length - 1];
            isHead = !!(lastUserMove && lastUserMove.row === r && lastUserMove.col === c);
        }

        return { active: isPreview || isUserActive, isHead };
    };

    // ─── SVG Path Computation ───────────────────────
    const getCellCenter = (row: number, col: number) => {
        const cellSize = 100 / config.gridSize;
        return {
            x: col * cellSize + cellSize / 2,
            y: row * cellSize + cellSize / 2
        };
    };

    const previewSvgPath = useMemo(() => {
        if (phase !== 'preview' || visiblePathIndex < 1) return '';
        return path.slice(0, visiblePathIndex + 1).map((coord, i) => {
            const { x, y } = getCellCenter(coord.row, coord.col);
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ');
    }, [path, visiblePathIndex, phase, config.gridSize]);

    const userSvgPath = useMemo(() => {
        if (userPath.length < 2) return '';
        return userPath.map((coord, i) => {
            const { x, y } = getCellCenter(coord.row, coord.col);
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ');
    }, [userPath, config.gridSize]);

    // ─── Helpers ────────────────────────────────────
    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";
    const gridTemplate = `repeat(${config.gridSize}, minmax(0, 1fr))`;

    // Determine if wrong feedback to show correct path
    const isWrongFeedback = phase === 'feedback' && feedbackState && !feedbackState.correct;

    // ─── JSX ────────────────────────────────────────

    // Welcome Screen
    if (phase === 'welcome') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-950 to-slate-900 flex items-center justify-center p-6 text-white relative overflow-hidden">
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl" />
                </div>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl relative z-10">
                    <motion.div
                        className="w-28 h-28 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-[40%] flex items-center justify-center mx-auto mb-6"
                        style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }}
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <Crosshair size={52} className="text-white drop-shadow-lg" />
                    </motion.div>
                    <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                        Lazer Hafıza
                    </h1>
                    <p className="text-slate-300 mb-8 text-lg">
                        Noktalar arasındaki lazer yolunu izle ve hafızandan aynı yolu yeniden çiz!
                    </p>
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                        <h3 className="text-lg font-bold text-emerald-300 mb-3 flex items-center gap-2">
                            <Eye size={20} /> Nasıl Oynanır?
                        </h3>
                        <ul className="space-y-2 text-slate-300 text-sm">
                            <li className="flex items-center gap-2">
                                <Sparkles size={14} className="text-emerald-400 shrink-0" />
                                <span>Lazer ışını noktalar arasında bir yol çizer — dikkatle izle</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Sparkles size={14} className="text-emerald-400 shrink-0" />
                                <span>Işın kaybolunca noktaları sırasıyla tıklayarak yolu yeniden oluştur</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Sparkles size={14} className="text-emerald-400 shrink-0" />
                                <span>Seviye ilerledikçe grid büyür, yol uzar, çapraz geçişler eklenir!</span>
                            </li>
                        </ul>
                    </div>
                    <div className="mb-6 inline-flex items-center gap-1.5 px-3 py-1 bg-violet-500/20 border border-violet-500/30 rounded-full">
                        <span className="text-[9px] font-black text-violet-300 uppercase tracking-wider">TUZÖ</span>
                        <span className="text-[9px] font-bold text-violet-400">5.4.2 Görsel Kısa Süreli Bellek</span>
                    </div>
                    <div>
                        <motion.button
                            whileHover={{ scale: 1.05, y: -4 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleStart}
                            className="px-10 py-5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl font-bold text-xl"
                            style={{ boxShadow: '0 8px 32px rgba(16, 185, 129, 0.4)' }}
                        >
                            <div className="flex items-center gap-3">
                                <Play size={28} className="fill-white" />
                                <span>Başla</span>
                            </div>
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen bg-gradient-to-br from-violet-950 via-purple-950 to-slate-900 text-white relative overflow-hidden ${(phase === 'preview' || phase === 'playing' || phase === 'feedback') ? 'overflow-hidden h-screen' : ''}`}
            style={(phase === 'preview' || phase === 'playing' || phase === 'feedback') ? { touchAction: 'none', overscrollBehavior: 'none' } : {}}
        >
            {/* Background Decoration */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl" />
            </div>

            {/* Header HUD */}
            <div className="relative z-10 p-4 pt-20">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link to={backLink} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                        <ChevronLeft size={20} /><span>{backLabel}</span>
                    </Link>
                    {(phase !== 'game_over' && phase !== 'victory') && (
                        <div className="flex items-center gap-4 flex-wrap">
                            {/* Score */}
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
                                style={{ background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
                                <Star className="text-amber-400 fill-amber-400" size={18} />
                                <span className="font-bold text-amber-400">{score}</span>
                            </div>
                            {/* Lives */}
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
                                style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                                {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
                                    <Heart key={i} size={18} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-900'} />
                                ))}
                            </div>
                            {/* Timer */}
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
                                style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.1) 100%)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                                <TimerIcon className={timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'} size={18} />
                                <span className={`font-bold ${timeLeft < 30 ? 'text-red-400' : 'text-blue-400'}`}>{formatTime(timeLeft)}</span>
                            </div>
                            {/* Level */}
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
                                style={{ background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)', border: '1px solid rgba(167, 139, 250, 0.3)' }}>
                                <Zap className="text-purple-400" size={18} />
                                <span className="font-bold text-purple-400">{level}/{MAX_LEVEL}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-4">
                <AnimatePresence mode="wait">
                    {/* Playing Phase (preview + input + feedback) */}
                    {(phase === 'preview' || phase === 'playing' || phase === 'feedback') && (
                        <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full flex flex-col items-center">
                            {/* Phase Indicator */}
                            <motion.div
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className={`mb-6 flex items-center gap-3 px-6 py-3 rounded-3xl font-black text-lg shadow-2xl ${phase === 'preview'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : phase === 'feedback'
                                        ? feedbackState?.correct ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
                                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    }`}
                            >
                                {phase === 'preview' ? <><Eye size={22} /> Lazer Yolunu İzle!</> :
                                    phase === 'feedback' ? (feedbackState?.correct ? <><Star size={22} /> Doğru!</> : <><Brain size={22} /> Yanlış Sıra!</>) :
                                        <><Brain size={22} /> Yolu Yeniden Çiz!</>}
                            </motion.div>

                            {/* Grid Container */}
                            <div
                                className="relative bg-white/5 backdrop-blur-2xl rounded-[32px] border border-white/10 shadow-[0_32px_64px_rgba(0,0,0,0.4)] p-6"
                                style={{ width: canvasSize, height: canvasSize }}
                            >
                                {/* SVG Overlay for Laser Lines */}
                                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 p-6" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                                    {/* Glow filter */}
                                    <defs>
                                        <filter id="laserGlow" x="-50%" y="-50%" width="200%" height="200%">
                                            <feGaussianBlur stdDeviation="2" result="blur" />
                                            <feMerge>
                                                <feMergeNode in="blur" />
                                                <feMergeNode in="SourceGraphic" />
                                            </feMerge>
                                        </filter>
                                    </defs>

                                    {/* Preview Laser */}
                                    {phase === 'preview' && previewSvgPath && (
                                        <path
                                            d={previewSvgPath}
                                            stroke="#10b981"
                                            strokeWidth="3"
                                            fill="none"
                                            filter="url(#laserGlow)"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    )}

                                    {/* User Laser */}
                                    {(phase === 'playing' || phase === 'feedback') && userSvgPath && (
                                        <path
                                            d={userSvgPath}
                                            stroke={isWrongFeedback ? "#ef4444" : "#10b981"}
                                            strokeWidth="3"
                                            fill="none"
                                            filter="url(#laserGlow)"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    )}
                                </svg>

                                {/* Interactive Nodes Layer */}
                                <div
                                    className="grid w-full h-full relative z-20"
                                    style={{ gridTemplateColumns: gridTemplate, gridTemplateRows: gridTemplate }}
                                >
                                    {Array.from({ length: config.gridSize * config.gridSize }).map((_, i) => {
                                        const r = Math.floor(i / config.gridSize);
                                        const c = i % config.gridSize;
                                        const { active, isHead } = getNodeState(r, c);

                                        // Determine dot visual size based on grid
                                        const dotSize = config.gridSize <= 4 ? 'w-5 h-5' : 'w-4 h-4';

                                        let nodeStyle: React.CSSProperties = {
                                            background: 'rgba(255,255,255,0.15)',
                                            boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)'
                                        };

                                        if (active) {
                                            if (isWrongFeedback) {
                                                nodeStyle = {
                                                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                                    boxShadow: '0 0 12px rgba(239, 68, 68, 0.8), inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.3)'
                                                };
                                            } else {
                                                nodeStyle = {
                                                    background: 'linear-gradient(135deg, #10b981, #059669)',
                                                    boxShadow: '0 0 12px rgba(16, 185, 129, 0.8), inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.3)'
                                                };
                                            }
                                        }

                                        if (isHead) {
                                            nodeStyle = {
                                                ...nodeStyle,
                                                background: isWrongFeedback
                                                    ? 'linear-gradient(135deg, #f87171, #ef4444)'
                                                    : 'linear-gradient(135deg, #ffffff, #d1fae5)',
                                                boxShadow: isWrongFeedback
                                                    ? '0 0 24px rgba(239, 68, 68, 1), 0 0 48px rgba(239, 68, 68, 0.5)'
                                                    : '0 0 24px rgba(16, 185, 129, 1), 0 0 48px rgba(16, 185, 129, 0.5)',
                                                transform: 'scale(1.3)'
                                            };
                                        }

                                        return (
                                            <div
                                                key={`${r}-${c}`}
                                                onClick={() => handleCellClick(r, c)}
                                                className="flex items-center justify-center cursor-pointer group min-w-[40px] min-h-[40px]"
                                            >
                                                <motion.div
                                                    className={`${dotSize} rounded-full transition-all duration-300`}
                                                    style={nodeStyle}
                                                    whileHover={phase === 'playing' ? { scale: 1.4, boxShadow: '0 0 16px rgba(16, 185, 129, 0.6)' } : {}}
                                                    whileTap={phase === 'playing' ? { scale: 0.9 } : {}}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Diagonal indicator */}
                            {config.allowDiagonals && (
                                <div className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold tracking-wider">
                                    <Zap size={14} /> ÇAPRAZ GEÇİŞLER AKTİF
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Game Over */}
                    {phase === 'game_over' && (
                        <motion.div key="gameover" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
                            <motion.div
                                className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[40%] flex items-center justify-center shadow-2xl"
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                <Trophy size={48} className="text-white" />
                            </motion.div>
                            <h2 className="text-3xl font-bold text-amber-400 mb-2">Tebrikler!</h2>
                            <p className="text-slate-400 mb-6">Lazer hafızan güçleniyor, tekrar dene!</p>
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center"><p className="text-slate-400 text-sm">Skor</p><p className="text-2xl font-bold text-amber-400">{score}</p></div>
                                    <div className="text-center"><p className="text-slate-400 text-sm">Seviye</p><p className="text-2xl font-bold text-emerald-400">{level}/{MAX_LEVEL}</p></div>
                                </div>
                            </div>
                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart}
                                className="px-10 py-5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl font-bold text-xl mb-4"
                                style={{ boxShadow: '0 8px 32px rgba(16, 185, 129, 0.4)' }}>
                                <div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Oyna</span></div>
                            </motion.button>
                            <div><Link to={backLink} className="block text-slate-500 hover:text-white transition-colors">{location.state?.arcadeMode ? 'Bilsem Zeka' : 'Geri Dön'}</Link></div>
                        </motion.div>
                    )}

                    {/* Victory */}
                    {phase === 'victory' && (
                        <motion.div key="victory" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
                            <motion.div
                                className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-[40%] flex items-center justify-center shadow-2xl"
                                animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                <Trophy size={48} className="text-white" />
                            </motion.div>
                            <h2 className="text-3xl font-bold text-amber-400 mb-2">🎖️ Lazer Ustası!</h2>
                            <p className="text-slate-400 mb-6">20 seviyeyi tamamladın! Hafızan müthiş!</p>
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center"><p className="text-slate-400 text-sm">Skor</p><p className="text-2xl font-bold text-amber-400">{score}</p></div>
                                    <div className="text-center"><p className="text-slate-400 text-sm">Seviye</p><p className="text-2xl font-bold text-emerald-400">{MAX_LEVEL}/{MAX_LEVEL}</p></div>
                                </div>
                            </div>
                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart}
                                className="px-10 py-5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl font-bold text-xl mb-4"
                                style={{ boxShadow: '0 8px 32px rgba(16, 185, 129, 0.4)' }}>
                                <div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Oyna</span></div>
                            </motion.button>
                            <div><Link to={backLink} className="block text-slate-500 hover:text-white transition-colors">{location.state?.arcadeMode ? 'Bilsem Zeka' : 'Geri Dön'}</Link></div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <GameFeedbackBanner feedback={feedbackState} />
            </div>
        </div>
    );
};

export default LazerHafizaGame;
