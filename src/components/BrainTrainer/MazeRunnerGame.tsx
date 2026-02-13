import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer, Target,
    XCircle, ChevronLeft, ChevronRight, ChevronUp, ChevronDown,
    Zap, Heart, Compass
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
const GAME_ID = 'labirent';
const PLAYER_RADIUS = 4;
const START_PADDING = 10;

type Phase = 'welcome' | 'playing' | 'feedback' | 'level_complete' | 'game_over' | 'victory';

// ─── Maze Types ──────────────────────────────────────────────
interface Cell {
    x: number;
    y: number;
    walls: { top: boolean; right: boolean; bottom: boolean; left: boolean };
    visited: boolean;
}

interface WallSeed {
    midOffset: number;
    thick: number;
}

// ─── Maze Generator (Recursive Backtracking) ─────────────────
const rand = (min: number, max: number) => Math.random() * (max - min) + min;

const getUnvisitedNeighbors = (cell: Cell, grid: Cell[][], cols: number, rows: number) => {
    const neighbors: Cell[] = [];
    const { x, y } = cell;
    if (y > 0 && !grid[y - 1][x].visited) neighbors.push(grid[y - 1][x]);
    if (x < cols - 1 && !grid[y][x + 1].visited) neighbors.push(grid[y][x + 1]);
    if (y < rows - 1 && !grid[y + 1][x].visited) neighbors.push(grid[y + 1][x]);
    if (x > 0 && !grid[y][x - 1].visited) neighbors.push(grid[y][x - 1]);
    return neighbors;
};

const removeWalls = (a: Cell, b: Cell) => {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    if (dx === 1) { a.walls.left = false; b.walls.right = false; }
    else if (dx === -1) { a.walls.right = false; b.walls.left = false; }
    if (dy === 1) { a.walls.top = false; b.walls.bottom = false; }
    else if (dy === -1) { a.walls.bottom = false; b.walls.top = false; }
};

const generateMaze = (cols: number, rows: number): Cell[][] => {
    const grid: Cell[][] = [];
    for (let y = 0; y < rows; y++) {
        const row: Cell[] = [];
        for (let x = 0; x < cols; x++) {
            row.push({ x, y, walls: { top: true, right: true, bottom: true, left: true }, visited: false });
        }
        grid.push(row);
    }

    const stack: Cell[] = [];
    grid[0][0].visited = true;
    stack.push(grid[0][0]);

    while (stack.length > 0) {
        const current = stack[stack.length - 1];
        const neighbors = getUnvisitedNeighbors(current, grid, cols, rows);
        if (neighbors.length > 0) {
            const next = neighbors[Math.floor(Math.random() * neighbors.length)];
            removeWalls(current, next);
            next.visited = true;
            stack.push(next);
        } else {
            stack.pop();
        }
    }

    for (let y = 0; y < rows; y++)
        for (let x = 0; x < cols; x++)
            grid[y][x].visited = false;

    return grid;
};

const getConnectedNeighbors = (cell: Cell, grid: Cell[][]): Cell[] => {
    const neighbors: Cell[] = [];
    const { x, y, walls } = cell;
    if (!walls.top && y > 0) neighbors.push(grid[y - 1][x]);
    if (!walls.right && x < grid[0].length - 1) neighbors.push(grid[y][x + 1]);
    if (!walls.bottom && y < grid.length - 1) neighbors.push(grid[y + 1][x]);
    if (!walls.left && x > 0) neighbors.push(grid[y][x - 1]);
    return neighbors;
};

const solveMaze = (maze: Cell[][]): Set<string> => {
    const rows = maze.length;
    const cols = maze[0].length;
    const end = maze[rows - 1][cols - 1];
    const queue: { cell: Cell; path: string[] }[] = [];
    const visited = new Set<string>();

    queue.push({ cell: maze[0][0], path: [`0,0`] });
    visited.add('0,0');

    while (queue.length > 0) {
        const { cell, path } = queue.shift()!;
        if (cell.x === end.x && cell.y === end.y) return new Set(path);
        for (const neighbor of getConnectedNeighbors(cell, maze)) {
            const key = `${neighbor.x},${neighbor.y}`;
            if (!visited.has(key)) {
                visited.add(key);
                queue.push({ cell: neighbor, path: [...path, key] });
            }
        }
    }
    return new Set();
};

// ─── Canvas Game Component ───────────────────────────────────
interface MazeCanvasProps {
    level: number;
    lives: number;
    onCrash: () => void;
    onWrongPath: () => void;
    onWin: () => void;
    isPlaying: boolean;
    wrongTurnsLeft: number;
    onMoveReady?: (moveFn: (dr: number, dc: number) => void) => void;
}

const MazeCanvas: React.FC<MazeCanvasProps> = ({ level, lives, onCrash, onWrongPath, onWin, isPlaying, onMoveReady }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const wallCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [maze, setMaze] = useState<Cell[][] | null>(null);
    const [solutionSet, setSolutionSet] = useState<Set<string>>(new Set());
    const [cellSize, setCellSize] = useState(0);
    const [path, setPath] = useState<{ x: number; y: number }[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [cols, setCols] = useState(5);
    const [rows, setRows] = useState(5);
    const [lastLogicalCell, setLastLogicalCell] = useState<string>('0,0');
    // Joystick-mode player position (cell-based)
    const [playerPos, setPlayerPos] = useState<{ r: number; c: number }>({ r: 0, c: 0 });
    const [hasMovedWithJoystick, setHasMovedWithJoystick] = useState(false);
    const [wallSeeds, setWallSeeds] = useState<{ top: WallSeed; right: WallSeed; bottom: WallSeed; left: WallSeed }[]>([]);
    // Responsive canvas size
    const [canvasSize, setCanvasSize] = useState(0);

    // Responsive sizing — leave room for header (~60px) + joystick (~160px)
    useEffect(() => {
        const updateSize = () => {
            const maxWidth = Math.min(window.innerWidth - 32, 480);
            const maxHeight = window.innerHeight - 280; // header + joystick + padding
            const size = Math.min(maxWidth, maxHeight);
            setCanvasSize(Math.max(size, 200)); // minimum 200px
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    // Initialize Maze
    useEffect(() => {
        const baseSize = 4;
        const sizeMultiplier = Math.floor(level / 2);
        const newCols = Math.min(baseSize + Math.min(level, 8) + sizeMultiplier, 16);
        const newRows = Math.min(baseSize + Math.min(level, 8) + Math.floor(level * 0.3), 16);

        setCols(newCols);
        setRows(newRows);
        const newMaze = generateMaze(newCols, newRows);
        setMaze(newMaze);
        setSolutionSet(solveMaze(newMaze));

        const seeds: typeof wallSeeds = [];
        newMaze.forEach(row => {
            row.forEach(() => {
                const wallThick = rand(2, 2 + Math.min(level * 2, 20));
                seeds.push({
                    top: { midOffset: rand(-4, 4), thick: wallThick },
                    right: { midOffset: rand(-4, 4), thick: wallThick },
                    bottom: { midOffset: rand(-4, 4), thick: wallThick },
                    left: { midOffset: rand(-4, 4), thick: wallThick },
                });
            });
        });
        setWallSeeds(seeds);
        setPath([]);
        setIsDrawing(false);
        setLastLogicalCell('0,0');
        setPlayerPos({ r: 0, c: 0 });
        setHasMovedWithJoystick(false);
        wallCanvasRef.current = null;
    }, [level]);

    // Cell-based movement (for joystick / arrow keys)
    const movePlayer = useCallback((dr: number, dc: number) => {
        if (!maze || !isPlaying) return;
        setPlayerPos(prev => {
            const cell = maze[prev.r]?.[prev.c];
            if (!cell) return prev;

            const nr = prev.r + dr;
            const nc = prev.c + dc;
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) return prev;

            // Wall check
            if (dr === -1 && cell.walls.top) return prev;
            if (dr === 1 && cell.walls.bottom) return prev;
            if (dc === -1 && cell.walls.left) return prev;
            if (dc === 1 && cell.walls.right) return prev;

            setHasMovedWithJoystick(true);

            // Wrong path check
            const key = `${nc},${nr}`;
            if (!solutionSet.has(key)) {
                onWrongPath();
            }

            // Win check
            if (nr === rows - 1 && nc === cols - 1) {
                setTimeout(() => onWin(), 100);
            }

            return { r: nr, c: nc };
        });
    }, [maze, isPlaying, rows, cols, solutionSet, onWrongPath, onWin]);

    // Expose move function to parent for joystick
    useEffect(() => {
        if (onMoveReady) onMoveReady(movePlayer);
    }, [onMoveReady, movePlayer]);

    // Arrow key controls
    useEffect(() => {
        if (!isPlaying) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
            }
            switch (e.key) {
                case 'ArrowUp': movePlayer(-1, 0); break;
                case 'ArrowDown': movePlayer(1, 0); break;
                case 'ArrowLeft': movePlayer(0, -1); break;
                case 'ArrowRight': movePlayer(0, 1); break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPlaying, movePlayer]);

    const drawWobblyLine = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, seed: WallSeed) => {
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
            ctx.shadowBlur = 6;
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
        const size = canvasSize;

        if (!wallCanvasRef.current) wallCanvasRef.current = document.createElement('canvas');
        const wCanvas = wallCanvasRef.current;
        if (wCanvas.width !== size || wCanvas.height !== size) {
            wCanvas.width = size;
            wCanvas.height = size;
        }
        const wCtx = wCanvas.getContext('2d', { willReadFrequently: true });
        if (wCtx) drawMazeToContext(wCtx, size, size, true);
        return size;
    }, [drawMazeToContext, maze, canvasSize]);

    // Main Draw Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !maze) return;

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
        drawBlob(0, 0, '#22c55e');
        drawBlob((cols - 1) * cs, (rows - 1) * cs, '#f97316');

        // Player path
        if (path.length > 0) {
            ctx.beginPath();
            ctx.strokeStyle = lives > 2 ? '#818cf8' : lives > 1 ? '#f59e0b' : '#ef4444';
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
                    ctx.quadraticCurveTo(
                        path[path.length - 2].x, path[path.length - 2].y,
                        path[path.length - 1].x, path[path.length - 1].y
                    );
                } else {
                    ctx.lineTo(path[1].x, path[1].y);
                }
            }
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Head
            const head = path[path.length - 1];
            ctx.beginPath();
            ctx.fillStyle = '#ffffff';
            ctx.arc(head.x, head.y, PLAYER_RADIUS, 0, Math.PI * 2);
            ctx.fill();
        }

        // Joystick-mode player dot (cell-based)
        if (hasMovedWithJoystick || path.length === 0) {
            const px = playerPos.c * cs + cs / 2;
            const py = playerPos.r * cs + cs / 2;
            ctx.beginPath();
            ctx.fillStyle = '#818cf8';
            ctx.shadowColor = '#818cf8';
            ctx.shadowBlur = 12;
            ctx.arc(px, py, cs * 0.25, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }, [maze, wallSeeds, path, lives, updateWallCanvas, drawMazeToContext, cols, rows, playerPos, hasMovedWithJoystick, canvasSize]);

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
            if (!solutionSet.has(key)) onWrongPath();
        }
    };

    const handleInputStart = (clientX: number, clientY: number) => {
        if (!isPlaying || !canvasRef.current || cellSize === 0) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        if (x < cellSize && y < cellSize) {
            setIsDrawing(true);
            setPath([{ x, y }]);
            setLastLogicalCell('0,0');
        }
    };

    const handleInputMove = (clientX: number, clientY: number) => {
        if (!isDrawing || !isPlaying || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        if (checkPixelCollision(x, y)) {
            setIsDrawing(false);
            onCrash();
            setPath([]);
            return;
        }
        checkWrongPath(x, y);

        const endXStart = (cols - 1) * cellSize;
        const endYStart = (rows - 1) * cellSize;
        if (x > endXStart + START_PADDING && y > endYStart + START_PADDING) {
            setIsDrawing(false);
            onWin();
            return;
        }

        setPath(prev => {
            const last = prev[prev.length - 1];
            const dist = Math.hypot(x - last.x, y - last.y);
            if (dist > 3) return [...prev, { x, y }];
            return prev;
        });
    };

    const handleInputEnd = () => {
        setIsDrawing(false);
        setPath([]);
    };

    return (
        <div ref={containerRef} className="w-full mx-auto flex items-center justify-center relative touch-none" style={{ maxWidth: canvasSize, height: canvasSize }}>
            {!isDrawing && path.length === 0 && isPlaying && (
                <div className="absolute top-2 left-2 pointer-events-none text-emerald-400 text-xs animate-pulse font-bold z-10">
                    ← Buradan başla
                </div>
            )}
            <canvas
                ref={canvasRef}
                className="cursor-crosshair rounded-2xl border border-white/10"
                style={{ background: 'rgba(15, 10, 40, 0.8)' }}
                onMouseDown={(e) => handleInputStart(e.clientX, e.clientY)}
                onMouseMove={(e) => handleInputMove(e.clientX, e.clientY)}
                onMouseUp={handleInputEnd}
                onMouseLeave={handleInputEnd}
                onTouchStart={(e) => { e.preventDefault(); handleInputStart(e.touches[0].clientX, e.touches[0].clientY); }}
                onTouchMove={(e) => { e.preventDefault(); handleInputMove(e.touches[0].clientX, e.touches[0].clientY); }}
                onTouchEnd={handleInputEnd}
            />
        </div>
    );
};

// ─── Main Component ──────────────────────────────────────────


const MazeRunnerGame: React.FC = () => {
    const { saveGamePlay } = useGamePersistence();
    const hasSavedRef = useRef(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { submitResult } = useExam();

    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;
    const examMode = location.state?.examMode || false;

    // State
    const [phase, setPhase] = useState<Phase>('welcome');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [level, setLevel] = useState(1);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const [wrongTurnsLeft, setWrongTurnsLeft] = useState(3);
    const [warning, setWarning] = useState<string | null>(null);

    // Refs
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef(0);

    // Body scroll lock during gameplay
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

    // Timer
    useEffect(() => {
        if (phase === 'playing' && timeLeft > 0) {
            timerRef.current = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0 && phase === 'playing') {
            handleGameOver();
        }
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [phase, timeLeft]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Start
    const handleStart = useCallback(() => {
        setPhase('playing');
        setScore(0);
        setLives(INITIAL_LIVES);
        setLevel(1);
        setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
        setWrongTurnsLeft(3);
        setWarning(null);
        startTimeRef.current = Date.now();
        hasSavedRef.current = false;
    }, [examMode, examTimeLimit]);

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
            (async () => {
                await submitResult(level >= 5, score, 1000, duration);
                navigate('/atolyeler/sinav-simulasyonu/devam');
            })();
            return;
        }

        await saveGamePlay({
            game_id: GAME_ID,
            score_achieved: score,
            duration_seconds: duration,
            metadata: { levels_completed: level, final_lives: lives },
        });
    }, [saveGamePlay, score, level, lives, examMode, submitResult, navigate]);

    // Victory
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
            game_id: GAME_ID,
            score_achieved: score,
            duration_seconds: duration,
            metadata: { levels_completed: MAX_LEVEL, victory: true },
        });
    }, [saveGamePlay, score, examMode, submitResult, navigate]);

    // Feedback Hook
    const { feedbackState, showFeedback, isFeedbackActive } = useGameFeedback({
        duration: 1500,
        onFeedbackEnd: (correct) => {
            if (correct) {
                const bonus = (level * 100) + (lives * 50) + (wrongTurnsLeft * 30);
                setScore(prev => prev + bonus);
                if (level >= MAX_LEVEL) {
                    handleVictory();
                } else {
                    const nextLevel = level + 1;
                    setLevel(nextLevel);
                    setWrongTurnsLeft(3);
                    setPhase('playing');
                }
            } else {
                const newLives = lives - 1;
                setLives(newLives);
                if (newLives <= 0) {
                    handleGameOver();
                } else {
                    setPhase('playing');
                }
            }
        },
    });

    // Canvas Callbacks
    const handleCrash = useCallback(() => {
        if (navigator.vibrate) navigator.vibrate(200);
        setPhase('feedback');
        showFeedback(false, 'Duvara çarptın! 💥');
    }, [showFeedback]);

    const handleWrongPath = useCallback(() => {
        if (navigator.vibrate) navigator.vibrate(100);
        setWarning('YANLIŞ YOL!');
        setTimeout(() => setWarning(null), 1000);
        setWrongTurnsLeft(prev => {
            const newVal = prev - 1;
            if (newVal < 0) {
                handleGameOver();
                return 0;
            }
            return newVal;
        });
    }, [handleGameOver]);

    const handleWin = useCallback(() => {
        setPhase('feedback');
        showFeedback(true, ['Harika geçiş! 🎯', 'Labirenti aştın! 🌟', 'Muhteşem! 🧠', 'Ustasın! ⭐'][Math.floor(Math.random() * 4)]);
    }, [showFeedback]);

    // ─── Virtual Joystick ────────────────────────────────────
    const joystickRef = useRef<HTMLDivElement>(null);
    const moveFnRef = useRef<((dr: number, dc: number) => void) | null>(null);
    const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
    const [joystickDragging, setJoystickDragging] = useState(false);
    const lastJoystickMoveRef = useRef(0);
    const JOYSTICK_RADIUS = 50;
    const MOVE_THRESHOLD = 25;
    const MOVE_COOLDOWN = 150;

    const handleJoystickStart = useCallback(() => {
        setJoystickDragging(true);
    }, []);

    const handleJoystickMove = useCallback((clientX: number, clientY: number) => {
        if (!joystickRef.current || !joystickDragging) return;
        const rect = joystickRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        let dx = clientX - centerX;
        let dy = clientY - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > JOYSTICK_RADIUS) {
            dx = (dx / distance) * JOYSTICK_RADIUS;
            dy = (dy / distance) * JOYSTICK_RADIUS;
        }
        setJoystickPos({ x: dx, y: dy });

        const now = Date.now();
        if (now - lastJoystickMoveRef.current > MOVE_COOLDOWN && distance > MOVE_THRESHOLD && moveFnRef.current) {
            lastJoystickMoveRef.current = now;
            if (Math.abs(dx) > Math.abs(dy)) {
                moveFnRef.current(0, dx > 0 ? 1 : -1);
            } else {
                moveFnRef.current(dy > 0 ? 1 : -1, 0);
            }
        }
    }, [joystickDragging]);

    const handleJoystickEnd = useCallback(() => {
        setJoystickDragging(false);
        setJoystickPos({ x: 0, y: 0 });
    }, []);

    const getActiveDirection = () => {
        const { x, y } = joystickPos;
        const distance = Math.sqrt(x * x + y * y);
        if (distance < MOVE_THRESHOLD) return null;
        if (Math.abs(x) > Math.abs(y)) return x > 0 ? 'right' : 'left';
        return y > 0 ? 'down' : 'up';
    };
    const activeDirection = getActiveDirection();

    const isActive = phase === 'playing' || phase === 'feedback';

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
                            <div className="flex items-center gap-2 bg-amber-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-amber-500/30" title="Yanlış yol hakkı">
                                <Compass className="text-amber-400" size={14} />
                                <span className={`font-bold text-sm ${wrongTurnsLeft <= 1 ? 'text-red-400' : 'text-amber-400'}`}>{Math.max(0, wrongTurnsLeft)}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center flex-1 p-4">
                {/* Warning Popup */}
                <AnimatePresence>
                    {warning && (
                        <motion.div
                            key="warning"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            className="fixed top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
                        >
                            <div className="text-4xl font-black text-red-500 drop-shadow-lg animate-bounce">{warning}</div>
                        </motion.div>
                    )}
                </AnimatePresence>

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
                            <div className="mb-6 inline-flex items-center gap-1.5 px-3 py-1 bg-violet-500/20 border border-violet-500/30 rounded-full">
                                <span className="text-[9px] font-black text-violet-300 uppercase tracking-wider">TUZÖ</span>
                                <span className="text-[9px] font-bold text-violet-400">5.3.3 Uzamsal İlişki Çözümleme</span>
                            </div>

                            <motion.div
                                className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-teal-400 to-emerald-600 rounded-[40%] flex items-center justify-center"
                                style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }}
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            >
                                <Compass size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                                Labirent Koşusu
                            </h1>

                            <p className="text-slate-400 mb-8 leading-relaxed">
                                Yeşil noktadan başla, parmağını sürükleyerek turuncu noktaya ulaş!
                                Duvarlara değme, yanlış yollara sapma.
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

                    {/* Playing / Feedback */}
                    {(phase === 'playing' || phase === 'feedback') && (
                        <motion.div
                            key="playing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full max-w-lg"
                        >
                            <div className="relative">
                                <MazeCanvas
                                    level={level}
                                    lives={lives}
                                    onCrash={handleCrash}
                                    onWrongPath={handleWrongPath}
                                    onWin={handleWin}
                                    isPlaying={phase === 'playing' && !isFeedbackActive}
                                    wrongTurnsLeft={wrongTurnsLeft}
                                    onMoveReady={(fn) => { moveFnRef.current = fn; }}
                                />
                                <GameFeedbackBanner feedback={feedbackState} />
                            </div>

                            {/* Virtual Joystick */}
                            {phase === 'playing' && (
                                <div className="flex flex-col items-center gap-2 mt-4">
                                    <div
                                        ref={joystickRef}
                                        className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-slate-800/60 backdrop-blur-md border-2 border-slate-700/50 shadow-2xl touch-none cursor-pointer"
                                        style={{ WebkitTapHighlightColor: 'transparent' }}
                                        onTouchStart={(e) => { e.preventDefault(); handleJoystickStart(); }}
                                        onTouchMove={(e) => { e.preventDefault(); handleJoystickMove(e.touches[0].clientX, e.touches[0].clientY); }}
                                        onTouchEnd={handleJoystickEnd}
                                        onMouseDown={() => handleJoystickStart()}
                                        onMouseMove={(e) => joystickDragging && handleJoystickMove(e.clientX, e.clientY)}
                                        onMouseUp={handleJoystickEnd}
                                        onMouseLeave={handleJoystickEnd}
                                    >
                                        {/* Direction indicators */}
                                        <div className={`absolute top-2 left-1/2 -translate-x-1/2 transition-all duration-150 ${activeDirection === 'up' ? 'text-teal-400 scale-125' : 'text-slate-600'}`}>
                                            <ChevronUp size={20} strokeWidth={3} />
                                        </div>
                                        <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 transition-all duration-150 ${activeDirection === 'down' ? 'text-teal-400 scale-125' : 'text-slate-600'}`}>
                                            <ChevronDown size={20} strokeWidth={3} />
                                        </div>
                                        <div className={`absolute left-2 top-1/2 -translate-y-1/2 transition-all duration-150 ${activeDirection === 'left' ? 'text-teal-400 scale-125' : 'text-slate-600'}`}>
                                            <ChevronLeft size={20} strokeWidth={3} />
                                        </div>
                                        <div className={`absolute right-2 top-1/2 -translate-y-1/2 transition-all duration-150 ${activeDirection === 'right' ? 'text-teal-400 scale-125' : 'text-slate-600'}`}>
                                            <ChevronRight size={20} strokeWidth={3} />
                                        </div>

                                        {/* Joystick knob */}
                                        <motion.div
                                            className="absolute top-1/2 left-1/2 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg border-2 border-white/20"
                                            style={{
                                                x: joystickPos.x - 24,
                                                y: joystickPos.y - 24,
                                            }}
                                            animate={{
                                                scale: joystickDragging ? 1.1 : 1,
                                                boxShadow: joystickDragging
                                                    ? '0 0 20px rgba(20, 184, 166, 0.6), 0 4px 12px rgba(0,0,0,0.3)'
                                                    : '0 4px 12px rgba(0,0,0,0.3)'
                                            }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                        />
                                    </div>
                                    <p className="text-slate-500 text-xs font-medium text-center">
                                        Joystick ile veya parmağınla çiz
                                    </p>
                                </div>
                            )}
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
                                className="px-8 py-4 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-2xl font-bold text-lg"
                                style={{ boxShadow: '0 8px 32px rgba(20, 184, 166, 0.3)' }}
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

export default MazeRunnerGame;
