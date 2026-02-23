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
    let targetLength = length;
    const minLength = 2;

    // Try with decreasing target lengths if generation keeps failing
    while (targetLength >= minLength) {
        for (let attempts = 0; attempts < 200; attempts++) {
            const path: Coordinate[] = [];
            let currentRow = Math.floor(Math.random() * size);
            let currentCol = Math.floor(Math.random() * size);
            path.push({ row: currentRow, col: currentCol });

            let stuck = false;
            for (let i = 1; i < targetLength; i++) {
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
            if (!stuck && path.length === targetLength) return path;
        }
        targetLength--; // Fallback: try a shorter path
    }

    // Ultimate fallback: return a simple 2-cell path
    return [{ row: 0, col: 0 }, { row: 0, col: 1 }];
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
                    // Hold final state briefly, then transition to playing
                    previewTimerRef.current = window.setTimeout(() => {
                        setVisiblePathIndex(-1);
                        setPhase('playing');
                    }, 1000);
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
            <div className="min-h-screen bg-[#FAF9F6] dark:bg-slate-900 transition-colors duration-300 flex items-center justify-center p-6 text-black dark:text-white relative overflow-hidden">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl relative z-10">
                    <motion.div
                        className="w-24 h-24 sm:w-32 sm:h-32 bg-cyber-green border-8 border-black shadow-[8px_8px_0_#000] rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 -rotate-3"

                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <Crosshair size={52} className="text-black" strokeWidth={2.5} />
                    </motion.div>
                    <h1 className="text-4xl sm:text-5xl font-syne font-black mb-4 uppercase tracking-tight drop-shadow-sm">
                        Lazer Hafıza
                    </h1>
                    <p className="text-slate-600 dark:text-slate-300 font-chivo font-medium mb-8 text-base sm:text-lg">
                        Noktalar arasındaki lazer yolunu izle ve hafızandan aynı yolu yeniden çiz!
                    </p>
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-5 mb-6 text-left border-2 border-slate-200 dark:border-slate-600 -rotate-1">
                        <h3 className="text-lg font-syne font-black tracking-widest uppercase mb-3 flex items-center gap-2">
                            <Eye size={20} /> Nasıl Oynanır?
                        </h3>
                        <ul className="space-y-3 text-sm sm:text-base font-chivo font-bold text-slate-700 dark:text-slate-300">
                            <li className="flex items-center gap-3">
                                <Sparkles size={20} className="text-cyber-green shrink-0" />
                                <span>Lazer ışını noktalar arasında bir yol çizer — dikkatle izle</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Sparkles size={20} className="text-cyber-green shrink-0" />
                                <span>Işın kaybolunca noktaları sırasıyla tıklayarak yolu yeniden oluştur</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Sparkles size={20} className="text-cyber-green shrink-0" />
                                <span>Seviye ilerledikçe grid büyür, yol uzar, çapraz geçişler eklenir!</span>
                            </li>
                        </ul>
                    </div>
                    <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 bg-cyber-blue/10 dark:bg-cyber-blue/20 border-2 border-cyber-blue text-cyber-blue rounded-xl shadow-[2px_2px_0_#000] dark:shadow-[2px_2px_0_#0f172a] rotate-2">
                        <span className="text-xs font-black uppercase tracking-widest">TUZÖ</span>
                        <span className="text-xs font-bold">5.4.2 Görsel Kısa Süreli Bellek</span>
                    </div>
                    <div>
                        <motion.button
                            whileHover={{ scale: 1.05, y: -4 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleStart}
                            className="w-full sm:w-auto px-10 py-5 bg-cyber-green text-black font-syne font-black text-xl uppercase tracking-widest border-4 border-black shadow-[8px_8px_0_#000] rounded-2xl hover:-translate-y-1 hover:shadow-[12px_12px_0_#000] active:translate-y-2 active:translate-x-1 active:shadow-none transition-all flex items-center justify-center gap-3 mx-auto group"
                        >
                            <Play size={24} className="fill-black group-hover:scale-110 transition-transform" />
                            <span>Başla</span>
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen bg-[#FAF9F6] dark:bg-slate-900 transition-colors duration-300 text-black dark:text-white relative overflow-hidden ${(phase === 'preview' || phase === 'playing' || phase === 'feedback') ? 'overflow-hidden h-screen' : ''}`}
            style={(phase === 'preview' || phase === 'playing' || phase === 'feedback') ? { touchAction: 'none', overscrollBehavior: 'none' } : {}}
        >
            {/* Header HUD */}
            <div className="relative z-10 p-4 mt-2">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link to={backLink} className="flex items-center gap-2 text-slate-500 hover:text-black dark:text-slate-400 dark:hover:text-white transition-colors bg-white dark:bg-slate-800 border-2 border-black px-4 py-2 rounded-xl shadow-[4px_4px_0_#000] active:translate-y-1 active:translate-x-1 active:shadow-none">
                        <ChevronLeft size={20} /><span>{backLabel}</span>
                    </Link>
                    {(phase !== 'game_over' && phase !== 'victory') && (
                        <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-end">
                            {/* Score */}
                            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-cyber-yellow border-4 border-black rounded-xl shadow-[4px_4px_0_#000] rotate-1"
                            >
                                <Star className="text-black fill-black drop-shadow-sm" size={18} />
                                <span className="font-syne font-black text-black">{score}</span>
                            </div>
                            {/* Lives */}
                            <div className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-cyber-pink border-4 border-black rounded-xl shadow-[4px_4px_0_#000] -rotate-1"
                            >
                                {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
                                    <Heart key={i} size={18} className={i < lives ? 'text-black fill-black' : 'text-black/20 fill-black/20'} strokeWidth={2.5} />
                                ))}
                            </div>
                            {/* Timer */}
                            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-cyber-blue border-4 border-black rounded-xl shadow-[4px_4px_0_#000] rotate-2"
                            >
                                <TimerIcon className={timeLeft < 30 ? 'text-white animate-pulse' : 'text-white'} size={18} />
                                <span className={`font-syne font-black ${timeLeft < 30 ? 'text-white drop-shadow-[0_0_8px_white]' : 'text-white'}`}>{formatTime(timeLeft)}</span>
                            </div>
                            {/* Level */}
                            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-cyber-green border-4 border-black rounded-xl shadow-[4px_4px_0_#000] -rotate-2"
                            >
                                <Zap className="text-black fill-black" size={18} />
                                <span className="font-syne font-black text-black text-sm whitespace-nowrap">Seviye {level}/{MAX_LEVEL}</span>
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
                                className={`mb-6 flex items-center gap-3 px-6 py-3 rounded-2xl font-syne font-black uppercase tracking-widest text-sm border-4 border-black shadow-[6px_6px_0_#000] rotate-1 ${phase === 'preview'
                                    ? 'bg-cyber-yellow text-black'
                                    : phase === 'feedback'
                                        ? feedbackState?.correct ? 'bg-cyber-green text-black' : 'bg-cyber-pink text-black'
                                        : 'bg-white dark:bg-slate-800 text-black dark:text-white'
                                    }`}
                            >
                                {phase === 'preview' ? <><Eye size={22} className="text-black" /> Lazer Yolunu İzle!</> :
                                    phase === 'feedback' ? (feedbackState?.correct ? <><Star size={22} className="text-black fill-black" /> Doğru!</> : <><Brain size={22} className="text-black" /> Yanlış Sıra!</>) :
                                        <><Brain size={22} className="text-black dark:text-white" /> Yolu Yeniden Çiz!</>}
                            </motion.div>

                            {/* Grid Container */}
                            <div
                                className="relative bg-[#FAF9F6] dark:bg-slate-800 rounded-3xl border-4 border-black shadow-[8px_8px_0_#000] dark:shadow-[8px_8px_0_#0f172a] p-4 sm:p-6"
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
                                            background: '#cbd5e1', // slate-300
                                            border: '4px solid #000',
                                            boxShadow: '4px 4px 0 #000'
                                        };

                                        if (active) {
                                            if (isWrongFeedback) {
                                                nodeStyle = {
                                                    background: '#ff2745', // cyber-pink
                                                    border: '4px solid #000',
                                                    boxShadow: '6px 6px 0 #000'
                                                };
                                            } else {
                                                nodeStyle = {
                                                    background: '#14f195', // cyber-green
                                                    border: '4px solid #000',
                                                    boxShadow: '6px 6px 0 #000'
                                                };
                                            }
                                        }

                                        if (isHead) {
                                            nodeStyle = {
                                                ...nodeStyle,
                                                background: isWrongFeedback
                                                    ? '#ff2745'
                                                    : '#fff',
                                                boxShadow: '8px 8px 0 #000',
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
                        <motion.div key="gameover" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl w-full">
                            <motion.div
                                className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 bg-cyber-pink border-8 border-black shadow-[12px_12px_0_#000] rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-center rotate-3"
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                            >
                                <Trophy size={56} className="text-black" strokeWidth={2.5} />
                            </motion.div>
                            <h2 className="text-4xl sm:text-5xl font-syne font-black text-black dark:text-white mb-4 uppercase tracking-tight">Oyun Bitti</h2>
                            <p className="text-slate-600 dark:text-slate-300 font-chivo font-medium text-lg mb-8">Lazer hafızan güçleniyor, tekrar dene!</p>

                            <div className="bg-white dark:bg-slate-800 border-4 border-black shadow-[8px_8px_0_#000] dark:shadow-[8px_8px_0_#0f172a] p-6 sm:p-8 rounded-2xl sm:rounded-3xl mb-8 -rotate-1">
                                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                                    <div className="text-center bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-600">
                                        <p className="text-slate-500 dark:text-slate-400 font-syne font-bold uppercase tracking-widest text-sm mb-2">Skor</p>
                                        <p className="text-4xl font-black text-cyber-blue drop-shadow-sm">{score}</p>
                                    </div>
                                    <div className="text-center bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-600">
                                        <p className="text-slate-500 dark:text-slate-400 font-syne font-bold uppercase tracking-widest text-sm mb-2">Seviye</p>
                                        <p className="text-4xl font-black text-cyber-green drop-shadow-sm">{level}/{MAX_LEVEL}</p>
                                    </div>
                                </div>
                            </div>

                            <motion.button whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={handleStart}
                                className="w-full sm:w-auto px-10 py-5 bg-cyber-green text-black font-syne font-black text-xl uppercase tracking-widest border-4 border-black shadow-[8px_8px_0_#000] rounded-2xl hover:-translate-y-1 hover:shadow-[12px_12px_0_#000] active:translate-y-2 active:translate-x-1 active:shadow-none transition-all flex items-center justify-center gap-3 mx-auto mb-6 group"
                            >
                                <RotateCcw size={24} className="text-black group-hover:-rotate-90 transition-transform duration-300" />
                                <span>Tekrar Oyna</span>
                            </motion.button>

                            <div><Link to={backLink} className="block font-chivo font-bold text-slate-500 hover:text-black dark:text-slate-400 dark:hover:text-white transition-colors underline decoration-2 underline-offset-4">{location.state?.arcadeMode ? 'Bilsem Zeka' : 'Geri Dön'}</Link></div>
                        </motion.div>
                    )}

                    {/* Victory */}
                    {phase === 'victory' && (
                        <motion.div key="victory" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl w-full">
                            <motion.div
                                className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 bg-cyber-yellow border-8 border-black shadow-[12px_12px_0_#000] rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-center -rotate-3"
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                            >
                                <Trophy size={56} className="text-black" strokeWidth={2.5} />
                            </motion.div>
                            <h2 className="text-4xl sm:text-5xl font-syne font-black text-black dark:text-white mb-4 uppercase tracking-tight">🎖️ Lazer Ustası!</h2>
                            <p className="text-slate-600 dark:text-slate-300 font-chivo font-medium text-lg mb-8">20 seviyeyi tamamladın! Hafızan müthiş!</p>

                            <div className="bg-white dark:bg-slate-800 border-4 border-black shadow-[8px_8px_0_#000] dark:shadow-[8px_8px_0_#0f172a] p-6 sm:p-8 rounded-2xl sm:rounded-3xl mb-8 rotate-1">
                                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                                    <div className="text-center bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-600">
                                        <p className="text-slate-500 dark:text-slate-400 font-syne font-bold uppercase tracking-widest text-sm mb-2">Skor</p>
                                        <p className="text-4xl font-black text-cyber-blue drop-shadow-sm">{score}</p>
                                    </div>
                                    <div className="text-center bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-600">
                                        <p className="text-slate-500 dark:text-slate-400 font-syne font-bold uppercase tracking-widest text-sm mb-2">Seviye</p>
                                        <p className="text-4xl font-black text-cyber-green drop-shadow-sm">{MAX_LEVEL}/{MAX_LEVEL}</p>
                                    </div>
                                </div>
                            </div>

                            <motion.button whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={handleStart}
                                className="w-full sm:w-auto px-10 py-5 bg-cyber-green text-black font-syne font-black text-xl uppercase tracking-widest border-4 border-black shadow-[8px_8px_0_#000] rounded-2xl hover:-translate-y-1 hover:shadow-[12px_12px_0_#000] active:translate-y-2 active:translate-x-1 active:shadow-none transition-all flex items-center justify-center gap-3 mx-auto mb-6 group"
                            >
                                <RotateCcw size={24} className="text-black group-hover:-rotate-90 transition-transform duration-300" />
                                <span>Tekrar Oyna</span>
                            </motion.button>

                            <div><Link to={backLink} className="block font-chivo font-bold text-slate-500 hover:text-black dark:text-slate-400 dark:hover:text-white transition-colors underline decoration-2 underline-offset-4">{location.state?.arcadeMode ? 'Bilsem Zeka' : 'Geri Dön'}</Link></div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <GameFeedbackBanner feedback={feedbackState} />
            </div>
        </div>
    );
};

export default LazerHafizaGame;
