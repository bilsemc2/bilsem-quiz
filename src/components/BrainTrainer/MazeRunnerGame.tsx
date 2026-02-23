import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer, Compass,
    ChevronLeft, Zap, Heart, Sparkles
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
const GAME_ID = 'labirent';
const PLAYER_RADIUS = 4;
const START_PADDING = 10;

type Phase = 'welcome' | 'playing' | 'feedback' | 'game_over' | 'victory';

// ============== MAZE GENERATOR ==============
interface MazeCell {
    x: number;
    y: number;
    walls: { top: boolean; right: boolean; bottom: boolean; left: boolean };
    visited: boolean;
}

interface WallSeedSide {
    midOffset: number;
    thick: number;
}

interface WallSeed {
    top: WallSeedSide;
    right: WallSeedSide;
    bottom: WallSeedSide;
    left: WallSeedSide;
}

const generateMaze = (cols: number, rows: number): MazeCell[][] => {
    const grid: MazeCell[][] = [];
    for (let y = 0; y < rows; y++) {
        const row: MazeCell[] = [];
        for (let x = 0; x < cols; x++) {
            row.push({ x, y, walls: { top: true, right: true, bottom: true, left: true }, visited: false });
        }
        grid.push(row);
    }
    const stack: MazeCell[] = [];
    const startCell = grid[0][0];
    startCell.visited = true;
    stack.push(startCell);
    while (stack.length > 0) {
        const current = stack[stack.length - 1];
        const { x, y } = current;
        const neighbors: MazeCell[] = [];
        if (y > 0 && !grid[y - 1][x].visited) neighbors.push(grid[y - 1][x]);
        if (x < cols - 1 && !grid[y][x + 1].visited) neighbors.push(grid[y][x + 1]);
        if (y < rows - 1 && !grid[y + 1][x].visited) neighbors.push(grid[y + 1][x]);
        if (x > 0 && !grid[y][x - 1].visited) neighbors.push(grid[y][x - 1]);
        if (neighbors.length > 0) {
            const next = neighbors[Math.floor(Math.random() * neighbors.length)];
            const dx = current.x - next.x;
            const dy = current.y - next.y;
            if (dx === 1) { current.walls.left = false; next.walls.right = false; }
            else if (dx === -1) { current.walls.right = false; next.walls.left = false; }
            if (dy === 1) { current.walls.top = false; next.walls.bottom = false; }
            else if (dy === -1) { current.walls.bottom = false; next.walls.top = false; }
            next.visited = true;
            stack.push(next);
        } else {
            stack.pop();
        }
    }
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) grid[y][x].visited = false;
    return grid;
};

const solveMaze = (maze: MazeCell[][]): Set<string> => {
    const rows = maze.length;
    const cols = maze[0].length;
    const end = maze[rows - 1][cols - 1];
    const queue: { cell: MazeCell; path: string[] }[] = [{ cell: maze[0][0], path: ['0,0'] }];
    const visited = new Set<string>(['0,0']);
    while (queue.length > 0) {
        const { cell, path } = queue.shift()!;
        if (cell.x === end.x && cell.y === end.y) return new Set(path);
        const { x, y, walls } = cell;
        const adj: MazeCell[] = [];
        if (!walls.top && y > 0) adj.push(maze[y - 1][x]);
        if (!walls.right && x < cols - 1) adj.push(maze[y][x + 1]);
        if (!walls.bottom && y < rows - 1) adj.push(maze[y + 1][x]);
        if (!walls.left && x > 0) adj.push(maze[y][x - 1]);
        for (const n of adj) {
            const key = `${n.x},${n.y}`;
            if (!visited.has(key)) { visited.add(key); queue.push({ cell: n, path: [...path, key] }); }
        }
    }
    return new Set();
};

const rand = (min: number, max: number) => Math.random() * (max - min) + min;

// ============== COMPONENT ==============
const MazeRunnerGame: React.FC = () => {
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();
    const navigate = useNavigate();
    const { submitResult } = useExam();
    const examMode = location.state?.examMode || false;
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;
    const { feedbackState, showFeedback } = useGameFeedback();
    const hasSavedRef = useRef(false);
    const backLink = examMode ? '/atolyeler/sinav-simulasyonu' : '/atolyeler/bireysel-degerlendirme';
    const backLabel = examMode ? 'Sınav' : 'Geri';

    // Core State
    const [phase, setPhase] = useState<Phase>('welcome');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [level, setLevel] = useState(1);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);

    // Canvas State
    const [canvasSize, setCanvasSize] = useState(0);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const wallCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Maze State
    const [maze, setMaze] = useState<MazeCell[][] | null>(null);
    const [solutionSet, setSolutionSet] = useState<Set<string>>(new Set());
    const [cellSize, setCellSize] = useState(0);
    const [path, setPath] = useState<{ x: number; y: number }[]>([]);
    const isDrawingRef = useRef(false);
    const [cols, setCols] = useState(5);
    const [rows, setRows] = useState(5);
    const [lastLogicalCell, setLastLogicalCell] = useState('0,0');
    const [wallSeeds, setWallSeeds] = useState<WallSeed[]>([]);
    const [wrongTurnsLeft, setWrongTurnsLeft] = useState(3);
    const [warning, setWarning] = useState<string | null>(null);
    const [shake, setShake] = useState(false);
    const livesRef = useRef(INITIAL_LIVES);

    // ============== RESPONSIVE SIZE ==============
    useEffect(() => {
        const updateSize = () => {
            const maxWidth = Math.min(window.innerWidth - 32, 480);
            setCanvasSize(maxWidth);
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    // ============== BODY SCROLL LOCK ==============
    useEffect(() => {
        const isActive = phase === 'playing' || phase === 'feedback';
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

    // ============== TIMER ==============
    useEffect(() => {
        if (phase === 'playing' && timeLeft > 0) {
            timerRef.current = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0 && phase === 'playing') {
            handleGameOver();
        }
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [phase, timeLeft]);

    // ============== MAZE INIT ==============
    const initLevel = useCallback((lvl: number) => {
        const baseSize = 4;
        const sizeMultiplier = Math.floor(lvl / 2);
        const newCols = baseSize + Math.min(lvl, 8) + sizeMultiplier;
        const newRows = baseSize + Math.min(lvl, 8) + Math.floor(lvl * 0.3);
        setCols(newCols);
        setRows(newRows);
        const newMaze = generateMaze(newCols, newRows);
        setMaze(newMaze);
        setSolutionSet(solveMaze(newMaze));
        const seeds: WallSeed[] = [];
        newMaze.forEach(row => {
            row.forEach(() => {
                seeds.push({
                    top: { midOffset: rand(-5, 5), thick: rand(2, 2 + Math.min(lvl * 2.5, 25)) },
                    right: { midOffset: rand(-5, 5), thick: rand(2, 2 + Math.min(lvl * 2.5, 25)) },
                    bottom: { midOffset: rand(-5, 5), thick: rand(2, 2 + Math.min(lvl * 2.5, 25)) },
                    left: { midOffset: rand(-5, 5), thick: rand(2, 2 + Math.min(lvl * 2.5, 25)) },
                });
            });
        });
        setWallSeeds(seeds);
        setPath([]);
        setLastLogicalCell('0,0');
        setWrongTurnsLeft(3);
        wallCanvasRef.current = null;
    }, []);

    // ============== GAME LIFECYCLE ==============
    const handleStart = useCallback(() => {
        window.scrollTo(0, 0);
        setPhase('playing');
        setScore(0);
        setLives(INITIAL_LIVES);
        livesRef.current = INITIAL_LIVES;
        setLevel(1);
        setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
        startTimeRef.current = Date.now();
        hasSavedRef.current = false;
        initLevel(1);
    }, [examMode, examTimeLimit, initLevel]);

    useEffect(() => {
        if ((location.state?.autoStart || examMode) && phase === 'welcome') handleStart();
    }, [location.state, examMode, phase, handleStart]);

    const handleGameOver = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        setPhase('game_over');
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (examMode) {
            const passed = level >= 5;
            (async () => { await submitResult(passed, score, 1000, duration); navigate('/atolyeler/sinav-simulasyonu/devam'); })();
            return;
        }
        await saveGamePlay({ game_id: GAME_ID, score_achieved: score, duration_seconds: duration, metadata: { levels_completed: level, final_lives: lives } });
    }, [saveGamePlay, score, level, lives, examMode, submitResult, navigate]);

    const handleVictory = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        setPhase('victory');
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (examMode) {
            (async () => { await submitResult(true, score, 1000, duration); navigate('/atolyeler/sinav-simulasyonu/devam'); })();
            return;
        }
        await saveGamePlay({ game_id: GAME_ID, score_achieved: score, duration_seconds: duration, metadata: { levels_completed: MAX_LEVEL, victory: true } });
    }, [saveGamePlay, score, examMode, submitResult, navigate]);

    const handleLevelComplete = useCallback(() => {
        showFeedback(true);
        setPhase('feedback');
        const levelScore = 10 * level;
        setScore(prev => prev + levelScore);
        setTimeout(() => {
            if (level >= MAX_LEVEL) {
                handleVictory();
            } else {
                const newLevel = level + 1;
                setLevel(newLevel);
                initLevel(newLevel);
                setPhase('playing');
            }
        }, 1500);
    }, [level, handleVictory, initLevel, showFeedback]);

    const triggerShake = useCallback(() => {
        if (navigator.vibrate) navigator.vibrate(200);
        setShake(true);
        setTimeout(() => setShake(false), 500);
    }, []);

    const handleCrash = useCallback(() => {
        triggerShake();
        showFeedback(false);
        const newLives = livesRef.current - 1;
        livesRef.current = newLives;
        setLives(newLives);
        if (newLives <= 0) {
            handleGameOver();
        }
    }, [triggerShake, showFeedback, handleGameOver]);

    const handleWrongPath = useCallback(() => {
        if (phase !== 'playing') return;
        triggerShake();
        setWarning('YANLIŞ YOL!');
        setTimeout(() => setWarning(null), 1000);
        setWrongTurnsLeft(prev => {
            const newVal = prev - 1;
            if (newVal < 0) handleGameOver();
            return Math.max(0, newVal);
        });
    }, [phase, triggerShake, handleGameOver]);

    // ============== CANVAS DRAWING ==============
    const drawWobblyLine = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, seed: WallSeedSide) => {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const cx = midX + (y2 - y1) * 0.1 + seed.midOffset;
        const cy = midY + (x2 - x1) * 0.1 + seed.midOffset;
        ctx.quadraticCurveTo(cx, cy, x2, y2);
        ctx.lineWidth = seed.thick;
        ctx.stroke();
    };

    const drawMazeToContext = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, isCollisionCanvas: boolean) => {
        if (!maze || !wallSeeds.length) return;
        const cs = width / Math.max(cols, rows);
        if (isCollisionCanvas) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, width, height);
            ctx.strokeStyle = '#FFFFFF';
        } else {
            ctx.clearRect(0, 0, width, height);
            ctx.strokeStyle = '#a78bfa';
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.shadowBlur = 5;
            ctx.shadowColor = '#c084fc';
        }
        maze.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                const x = cell.x * cs;
                const y = cell.y * cs;
                const seedIndex = rowIndex * cols + colIndex;
                const seed = wallSeeds[seedIndex];
                if (!seed) return;
                if (cell.walls.top) drawWobblyLine(ctx, x - 2, y, x + cs + 2, y, seed.top);
                if (cell.walls.right) drawWobblyLine(ctx, x + cs, y - 2, x + cs, y + cs + 2, seed.right);
                if (cell.walls.bottom) drawWobblyLine(ctx, x + cs + 2, y + cs, x - 2, y + cs, seed.bottom);
                if (cell.walls.left) drawWobblyLine(ctx, x, y + cs + 2, x, y - 2, seed.left);
            });
        });
        return cs;
    }, [maze, wallSeeds, cols, rows]);

    const updateWallCanvas = useCallback(() => {
        if (!maze || canvasSize === 0) return;
        if (!wallCanvasRef.current) wallCanvasRef.current = document.createElement('canvas');
        const wCanvas = wallCanvasRef.current;
        if (wCanvas.width !== canvasSize || wCanvas.height !== canvasSize) {
            wCanvas.width = canvasSize;
            wCanvas.height = canvasSize;
        }
        const wCtx = wCanvas.getContext('2d', { willReadFrequently: true });
        if (wCtx) drawMazeToContext(wCtx, canvasSize, canvasSize, true);
        return canvasSize;
    }, [drawMazeToContext, maze, canvasSize]);

    // Main Draw Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !maze || canvasSize === 0) return;
        const size = updateWallCanvas();
        if (!size) return;
        canvas.width = size;
        canvas.height = size;
        const cs = size / Math.max(cols, rows);
        setCellSize(cs);
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        drawMazeToContext(ctx, size, size, false);
        // Start/End blobs
        const drawBlob = (bx: number, by: number, color: string) => {
            ctx.fillStyle = color;
            ctx.shadowColor = color;
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(bx + cs / 2, by + cs / 2, cs * 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        };
        drawBlob(0, 0, '#34d399');
        drawBlob((cols - 1) * cs, (rows - 1) * cs, '#f472b6');
        // Player path
        if (path.length > 0) {
            ctx.beginPath();
            ctx.strokeStyle = livesRef.current > 1 ? '#818CF8' : '#ef4444';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.shadowColor = ctx.strokeStyle;
            ctx.shadowBlur = 10;
            if (path.length > 1) {
                ctx.moveTo(path[0].x, path[0].y);
                for (let i = 1; i < path.length - 2; i++) {
                    const xc = (path[i].x + path[i + 1].x) / 2;
                    const yc = (path[i].y + path[i + 1].y) / 2;
                    ctx.quadraticCurveTo(path[i].x, path[i].y, xc, yc);
                }
                if (path.length > 2) {
                    ctx.quadraticCurveTo(path[path.length - 2].x, path[path.length - 2].y, path[path.length - 1].x, path[path.length - 1].y);
                } else {
                    ctx.lineTo(path[1].x, path[1].y);
                }
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
            const head = path[path.length - 1];
            ctx.beginPath();
            ctx.fillStyle = '#ffffff';
            ctx.arc(head.x, head.y, PLAYER_RADIUS, 0, Math.PI * 2);
            ctx.fill();
        }
    }, [maze, wallSeeds, path, updateWallCanvas, drawMazeToContext, cols, rows, canvasSize]);

    // ============== INPUT HANDLING ==============
    const checkPixelCollision = (x: number, y: number) => {
        if (!wallCanvasRef.current) return false;
        const ctx = wallCanvasRef.current.getContext('2d');
        if (!ctx) return false;
        const r = PLAYER_RADIUS - 1;
        const points = [{ x, y }, { x: x + r, y }, { x: x - r, y }, { x, y: y + r }, { x, y: y - r }];
        for (const p of points) {
            try {
                if (p.x < 0 || p.y < 0 || p.x >= wallCanvasRef.current.width || p.y >= wallCanvasRef.current.height) return true;
                const pixel = ctx.getImageData(p.x, p.y, 1, 1).data;
                if (pixel[0] > 100) return true;
            } catch { return false; }
        }
        return false;
    };

    const checkWrongPath = (x: number, y: number) => {
        if (cellSize === 0) return;
        const lx = Math.floor(x / cellSize);
        const ly = Math.floor(y / cellSize);
        const key = `${lx},${ly}`;
        if (key !== lastLogicalCell) {
            setLastLogicalCell(key);
            if (!solutionSet.has(key)) handleWrongPath();
        }
    };

    const handleInputStart = (clientX: number, clientY: number) => {
        if (phase !== 'playing' || !canvasRef.current || cellSize === 0) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        if (x < cellSize && y < cellSize) {
            isDrawingRef.current = true;
            setPath([{ x, y }]);
            setLastLogicalCell('0,0');
        }
    };

    const handleInputMove = (clientX: number, clientY: number) => {
        if (!isDrawingRef.current || phase !== 'playing' || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        if (checkPixelCollision(x, y)) {
            isDrawingRef.current = false;
            handleCrash();
            setPath([]);
            return;
        }
        checkWrongPath(x, y);
        const endXStart = (cols - 1) * cellSize;
        const endYStart = (rows - 1) * cellSize;
        if (x > endXStart + START_PADDING && y > endYStart + START_PADDING) {
            isDrawingRef.current = false;
            handleLevelComplete();
            return;
        }
        setPath(prev => {
            if (prev.length === 0) return prev;
            const last = prev[prev.length - 1];
            const dist = Math.hypot(x - last.x, y - last.y);
            if (dist > 3) return [...prev, { x, y }];
            return prev;
        });
    };

    const handleInputEnd = () => {
        isDrawingRef.current = false;
        setPath([]);
    };

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    // ============== JSX ==============
    if (phase === 'welcome') {
        return (
            <div className="min-h-screen bg-[#FAF9F6] dark:bg-slate-900 transition-colors duration-300 flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden relative">
                <div className="relative z-10 w-full max-w-xl">
                    <div className="w-full flex items-center justify-start mb-6 -ml-2">
                        <Link to={backLink} className="flex items-center gap-2 text-slate-500 hover:text-black dark:text-slate-400 dark:hover:text-white transition-colors bg-white dark:bg-slate-800 border-2 border-black px-4 py-2 rounded-xl shadow-[4px_4px_0_#000] active:translate-y-1 active:translate-x-1 active:shadow-none">
                            <ChevronLeft size={20} /><span>{backLabel}</span>
                        </Link>
                    </div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center bg-white dark:bg-slate-800 p-8 rounded-[3rem] border-4 border-black shadow-[12px_12px_0_#000] dark:shadow-[12px_12px_0_#0f172a] rotate-1">
                        <motion.div
                            className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 bg-cyber-pink border-8 border-black shadow-[8px_8px_0_#000] rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-center -rotate-3"
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        >
                            <Compass size={56} className="text-black" strokeWidth={2.5} />
                        </motion.div>

                        <h1 className="text-4xl sm:text-5xl font-syne font-black mb-4 uppercase text-black dark:text-white tracking-tight drop-shadow-sm">
                            Labirent Koşusu
                        </h1>

                        <p className="text-slate-600 dark:text-slate-300 font-chivo font-medium mb-8 text-base sm:text-lg">
                            Parmağınla yolu çiz, duvarlara dokunmadan çıkışa ulaş! Uzamsal ilişki çözümleme ve görsel-motor koordinasyon.
                        </p>

                        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-5 mb-8 border-2 border-slate-200 dark:border-slate-600 text-left -rotate-1">
                            <ul className="space-y-3 text-sm sm:text-base font-chivo font-bold text-slate-700 dark:text-slate-300">
                                <li className="flex items-center gap-3">
                                    <span className="flex-shrink-0 w-8 h-8 bg-cyber-green text-black border-2 border-black rounded-full flex items-center justify-center text-sm shadow-[2px_2px_0_#000]">1</span>
                                    <span>Yeşil noktadan <strong>başla</strong></span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <span className="flex-shrink-0 w-8 h-8 bg-cyber-yellow text-black border-2 border-black rounded-full flex items-center justify-center text-sm shadow-[2px_2px_0_#000]">2</span>
                                    <span>Duvarlara <strong>dokunmadan</strong> çiz</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <span className="flex-shrink-0 w-8 h-8 bg-cyber-pink text-black border-2 border-black rounded-full flex items-center justify-center text-sm shadow-[2px_2px_0_#000]">3</span>
                                    <span>Pembe noktaya <strong>ulaş</strong></span>
                                </li>
                            </ul>
                        </div>

                        <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 bg-cyber-blue/10 dark:bg-cyber-blue/20 border-2 border-cyber-blue text-cyber-blue rounded-xl shadow-[2px_2px_0_#000] dark:shadow-[2px_2px_0_#0f172a] rotate-2">
                            <span className="text-xs font-black uppercase tracking-widest">TUZÖ</span>
                            <span className="text-xs font-bold">5.3.3 Uzamsal İlişki Çözümleme</span>
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
            </div>
        );
    }

    return (
        <div className={`min-h-[100dvh] bg-[#FAF9F6] dark:bg-slate-900 transition-colors duration-300 flex flex-col items-center p-4 sm:p-6 ${(phase === 'playing' || phase === 'feedback') ? 'overflow-hidden' : 'overflow-auto'} ${shake ? 'animate-[shake_0.5s_cubic-bezier(.36,.07,.19,.97)_both]' : ''}`} style={(phase === 'playing' || phase === 'feedback') ? { touchAction: 'none', overscrollBehavior: 'none' } : {}}>
            {/* Header */}
            <div className="w-full max-w-5xl flex items-center justify-between mb-4 mt-2">
                <Link to={backLink} className="flex items-center gap-2 text-slate-500 hover:text-black dark:text-slate-400 dark:hover:text-white transition-colors bg-white dark:bg-slate-800 border-2 border-black px-4 py-2 rounded-xl shadow-[4px_4px_0_#000] active:translate-y-1 active:translate-x-1 active:shadow-none">
                    <ChevronLeft size={20} /><span>{backLabel}</span>
                </Link>
                {(phase !== 'game_over' && phase !== 'victory') && (
                    <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-end">
                        <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-cyber-yellow border-4 border-black rounded-xl shadow-[4px_4px_0_#000] rotate-1">
                            <Star className="text-black fill-black drop-shadow-sm" size={18} />
                            <span className="font-syne font-black text-black">{score}</span>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-cyber-pink border-4 border-black rounded-xl shadow-[4px_4px_0_#000] -rotate-1">
                            {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
                                <Heart key={i} size={18} className={i < lives ? 'text-black fill-black' : 'text-black/20 fill-black/20'} strokeWidth={2.5} />
                            ))}
                        </div>
                        <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-cyber-blue border-4 border-black rounded-xl shadow-[4px_4px_0_#000] rotate-2">
                            <Timer className={timeLeft < 30 ? 'text-white animate-pulse' : 'text-white'} size={18} />
                            <span className={`font-syne font-black ${timeLeft < 30 ? 'text-white drop-shadow-[0_0_8px_white]' : 'text-white'}`}>{formatTime(timeLeft)}</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-cyber-green border-4 border-black rounded-xl shadow-[4px_4px_0_#000] -rotate-2">
                            <Zap className="text-black fill-black" size={18} />
                            <span className="font-syne font-black text-black text-sm whitespace-nowrap">Seviye {level}/{MAX_LEVEL}</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-slate-800 border-4 border-black rounded-xl shadow-[4px_4px_0_#000] rotate-1">
                            <Compass className={wrongTurnsLeft === 0 ? 'text-red-500 animate-pulse' : 'text-slate-800 dark:text-slate-200'} size={18} strokeWidth={2.5} />
                            <span className={`font-syne font-black ${wrongTurnsLeft < 2 ? 'text-red-500' : 'text-slate-800 dark:text-slate-200'}`}>{wrongTurnsLeft} Hata Payı</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Game Area */}
            <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-lg flex-1 mt-2">
                <AnimatePresence mode="wait">
                    {(phase === 'playing' || phase === 'feedback') && maze && (
                        <motion.div key="game" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col items-center w-full relative">
                            {/* Warning popup */}
                            {warning && (
                                <motion.div initial={{ opacity: 0, y: -20, rotate: -2 }} animate={{ opacity: 1, y: 0, rotate: 2 }} className="absolute -top-12 z-40 pointer-events-none">
                                    <span className="text-2xl font-syne font-black text-white px-6 py-3 bg-cyber-pink border-4 border-black rounded-2xl shadow-[6px_6px_0_#000] uppercase tracking-widest">{warning}</span>
                                </motion.div>
                            )}

                            <div ref={containerRef} className="relative touch-none mt-4 bg-white dark:bg-slate-800 p-2 sm:p-4 rounded-[2rem] border-4 border-black shadow-[8px_8px_0_#000] dark:shadow-[8px_8px_0_#0f172a]" style={{ width: canvasSize + 32, height: canvasSize + 32 }}>
                                <canvas
                                    ref={canvasRef}
                                    className="cursor-crosshair rounded-xl"
                                    onClick={() => { }} // prevents default click behaviors causing issues
                                    style={{ background: 'transparent' }}
                                    onMouseDown={(e) => handleInputStart(e.clientX, e.clientY)}
                                    onMouseMove={(e) => handleInputMove(e.clientX, e.clientY)}
                                    onMouseUp={handleInputEnd}
                                    onMouseLeave={handleInputEnd}
                                    onTouchStart={(e) => { e.preventDefault(); handleInputStart(e.touches[0].clientX, e.touches[0].clientY); }}
                                    onTouchMove={(e) => { e.preventDefault(); handleInputMove(e.touches[0].clientX, e.touches[0].clientY); }}
                                    onTouchEnd={handleInputEnd}
                                />
                            </div>
                        </motion.div>
                    )}

                    {phase === 'game_over' && (
                        <motion.div key="gameover" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-xl w-full">
                            <motion.div
                                className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 bg-cyber-pink border-8 border-black shadow-[12px_12px_0_#000] rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-center rotate-3"
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                            >
                                <Trophy size={56} className="text-black" strokeWidth={2.5} />
                            </motion.div>
                            <h2 className="text-4xl sm:text-5xl font-syne font-black text-black dark:text-white mb-4 uppercase tracking-tight">Oyun Bitti</h2>
                            <p className="text-slate-600 dark:text-slate-300 font-chivo font-medium text-lg mb-8">Uzamsal zekanı geliştirmek için labirentleri çözmeye devam et.</p>

                            <div className="bg-white dark:bg-slate-800 border-4 border-black shadow-[8px_8px_0_#000] dark:shadow-[8px_8px_0_#0f172a] p-6 sm:p-8 rounded-2xl sm:rounded-3xl mb-8 -rotate-1">
                                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                                    <div className="text-center bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-600">
                                        <p className="text-slate-500 dark:text-slate-400 font-syne font-bold uppercase tracking-widest text-sm mb-2">Skor</p>
                                        <p className="text-4xl font-black text-cyber-blue drop-shadow-sm">{score}</p>
                                    </div>
                                    <div className="text-center bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-600">
                                        <p className="text-slate-500 dark:text-slate-400 font-syne font-bold uppercase tracking-widest text-sm mb-2">Seviye</p>
                                        <p className="text-4xl font-black text-cyber-pink drop-shadow-sm">{level}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <motion.button whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="w-full sm:w-auto px-10 py-5 bg-cyber-blue text-white font-syne font-black text-xl uppercase tracking-widest border-4 border-black shadow-[8px_8px_0_#000] hover:-translate-y-1 hover:shadow-[12px_12px_0_#000] active:translate-y-2 active:translate-x-1 active:shadow-none transition-all flex items-center justify-center gap-3">
                                    <RotateCcw size={24} />Tekrar Dene
                                </motion.button>
                                <Link to={backLink} className="w-full sm:w-auto px-10 py-5 bg-white dark:bg-slate-800 text-black dark:text-white font-syne font-black text-xl uppercase tracking-widest border-4 border-black shadow-[8px_8px_0_#000] dark:shadow-[8px_8px_0_#0f172a] hover:-translate-y-1 hover:shadow-[12px_12px_0_#000] dark:hover:shadow-[12px_12px_0_#0f172a] active:translate-y-2 active:translate-x-1 active:shadow-none transition-all text-center">
                                    Geri Dön
                                </Link>
                            </div>
                        </motion.div>
                    )}

                    {phase === 'victory' && (
                        <motion.div key="victory" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-xl w-full">
                            <motion.div
                                className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 bg-cyber-yellow border-8 border-black shadow-[12px_12px_0_#000] rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-center -rotate-3"
                                animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                <Trophy size={56} className="text-black" strokeWidth={2.5} />
                            </motion.div>
                            <h2 className="text-4xl sm:text-5xl font-syne font-black text-black dark:text-white mb-4 uppercase tracking-tight">🎖️ Labirent Fatihi!</h2>
                            <p className="text-slate-600 dark:text-slate-300 font-chivo font-medium text-lg mb-8">Tüm {MAX_LEVEL} seviyeyi tamamladın!</p>

                            <div className="bg-white dark:bg-slate-800 border-4 border-black shadow-[8px_8px_0_#000] dark:shadow-[8px_8px_0_#0f172a] p-6 sm:p-8 rounded-2xl sm:rounded-3xl mb-8 rotate-1">
                                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                                    <div className="text-center bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-600">
                                        <p className="text-slate-500 dark:text-slate-400 font-syne font-bold uppercase tracking-widest text-sm mb-2">Skor</p>
                                        <p className="text-4xl font-black text-cyber-yellow drop-shadow-sm">{score}</p>
                                    </div>
                                    <div className="text-center bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-600">
                                        <p className="text-slate-500 dark:text-slate-400 font-syne font-bold uppercase tracking-widest text-sm mb-2">Seviye</p>
                                        <p className="text-4xl font-black text-cyber-green drop-shadow-sm">{level}/{MAX_LEVEL}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <motion.button whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="w-full sm:w-auto px-10 py-5 bg-cyber-green text-black font-syne font-black text-xl uppercase tracking-widest border-4 border-black shadow-[8px_8px_0_#000] hover:-translate-y-1 hover:shadow-[12px_12px_0_#000] active:translate-y-2 active:translate-x-1 active:shadow-none transition-all flex items-center justify-center gap-3">
                                    <Sparkles size={24} className="fill-black" />Tekrar Oyna
                                </motion.button>
                                <Link to={backLink} className="w-full sm:w-auto px-10 py-5 bg-white dark:bg-slate-800 text-black dark:text-white font-syne font-black text-xl uppercase tracking-widest border-4 border-black shadow-[8px_8px_0_#000] dark:shadow-[8px_8px_0_#0f172a] hover:-translate-y-1 hover:shadow-[12px_12px_0_#000] dark:hover:shadow-[12px_12px_0_#0f172a] active:translate-y-2 active:translate-x-1 active:shadow-none transition-all text-center">
                                    Geri Dön
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <GameFeedbackBanner feedback={feedbackState} />
            </div>
        </div>
    );
};

export default MazeRunnerGame;
