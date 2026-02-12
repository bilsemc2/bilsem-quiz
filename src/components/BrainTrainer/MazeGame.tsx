import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer, Target, CheckCircle2, XCircle,
    Pencil, ChevronLeft, Heart, Zap, Sparkles, Eye
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';
import { useSound } from '../../hooks/useSound';

interface Cell {
    x: number;
    y: number;
    walls: { top: boolean; right: boolean; bottom: boolean; left: boolean };
    visited: boolean;
}

interface Point {
    x: number;
    y: number;
}

// Child-friendly messages


const MazeGame: React.FC = () => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const { feedbackState, showFeedback } = useGameFeedback();
    const location = useLocation();
    const [gameState, setGameState] = useState<'idle' | 'playing' | 'won' | 'lost'>('idle');
    const [maze, setMaze] = useState<Cell[][]>([]);
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [timeLeft, setTimeLeft] = useState(60);
    const [mazeSize, setMazeSize] = useState(5);
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawPath, setDrawPath] = useState<Point[]>([]);
    const [showCollision, setShowCollision] = useState(false);
    const [collisionPoint, setCollisionPoint] = useState<Point | null>(null);
    const [streak, setStreak] = useState(0);    const canvasRef = useRef<HTMLCanvasElement>(null);
    const startImageRef = useRef<HTMLImageElement | null>(null);
    const exitImageRef = useRef<HTMLImageElement | null>(null);
    const gameStartTimeRef = useRef<number>(0);
    const hasSavedRef = useRef<boolean>(false);
    const startPos = { x: 0, y: 0 };
    const [exitPos, setExitPos] = useState({ x: 4, y: 4 });

    // Back link
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    // Load images
    useEffect(() => {
        const startImg = new Image();
        startImg.src = '/images/beyni.webp';
        startImg.onload = () => {
            startImageRef.current = startImg;
        };

        const exitImg = new Image();
        exitImg.src = '/images/beyninikullan.webp';
        exitImg.onload = () => {
            exitImageRef.current = exitImg;
        };
    }, []);

    // Generate maze using Recursive Backtracking algorithm
    const generateMaze = useCallback((size: number): Cell[][] => {
        const grid: Cell[][] = [];

        for (let y = 0; y < size; y++) {
            grid[y] = [];
            for (let x = 0; x < size; x++) {
                grid[y][x] = {
                    x, y,
                    walls: { top: true, right: true, bottom: true, left: true },
                    visited: false
                };
            }
        }

        const stack: Cell[] = [];
        const startCell = grid[0][0];
        startCell.visited = true;
        stack.push(startCell);

        while (stack.length > 0) {
            const current = stack[stack.length - 1];
            const neighbors: Cell[] = [];

            const directions = [
                { dx: 0, dy: -1 },
                { dx: 1, dy: 0 },
                { dx: 0, dy: 1 },
                { dx: -1, dy: 0 }
            ];

            for (const dir of directions) {
                const nx = current.x + dir.dx;
                const ny = current.y + dir.dy;
                if (nx >= 0 && nx < size && ny >= 0 && ny < size && !grid[ny][nx].visited) {
                    neighbors.push(grid[ny][nx]);
                }
            }

            if (neighbors.length > 0) {
                const next = neighbors[Math.floor(Math.random() * neighbors.length)];
                const dx = next.x - current.x;
                const dy = next.y - current.y;

                if (dx === 1) {
                    current.walls.right = false;
                    next.walls.left = false;
                } else if (dx === -1) {
                    current.walls.left = false;
                    next.walls.right = false;
                } else if (dy === 1) {
                    current.walls.bottom = false;
                    next.walls.top = false;
                } else if (dy === -1) {
                    current.walls.top = false;
                    next.walls.bottom = false;
                }

                next.visited = true;
                stack.push(next);
            } else {
                stack.pop();
            }
        }

        return grid;
    }, []);

    // Check if a point is hitting a wall
    const checkWallCollision = useCallback((px: number, py: number): boolean => {
        const canvas = canvasRef.current;
        if (!canvas || maze.length === 0) return false;

        const cellSize = canvas.width / mazeSize;
        const wallThickness = 6;

        const cellX = Math.floor(px / cellSize);
        const cellY = Math.floor(py / cellSize);

        if (cellX < 0 || cellX >= mazeSize || cellY < 0 || cellY >= mazeSize) return true;

        const cell = maze[cellY]?.[cellX];
        if (!cell) return true;

        const localX = (px % cellSize) / cellSize;
        const localY = (py % cellSize) / cellSize;

        const edgeThreshold = wallThickness / cellSize;

        if (cell.walls.top && localY < edgeThreshold) return true;
        if (cell.walls.bottom && localY > 1 - edgeThreshold) return true;
        if (cell.walls.left && localX < edgeThreshold) return true;
        if (cell.walls.right && localX > 1 - edgeThreshold) return true;

        return false;
    }, [maze, mazeSize]);

    // Check if point reached exit
    const checkWin = useCallback((px: number, py: number): boolean => {
        const canvas = canvasRef.current;
        if (!canvas) return false;

        const cellSize = canvas.width / mazeSize;
        const exitCenterX = exitPos.x * cellSize + cellSize / 2;
        const exitCenterY = exitPos.y * cellSize + cellSize / 2;
        const distance = Math.sqrt((px - exitCenterX) ** 2 + (py - exitCenterY) ** 2);

        return distance < cellSize / 3;
    }, [exitPos, mazeSize]);

    // Draw maze and path on canvas
    const drawMaze = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || maze.length === 0) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const cellSize = canvas.width / mazeSize;
        const wallThickness = 4;

        // Clear canvas with gradient
        const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        bgGradient.addColorStop(0, '#0f172a');
        bgGradient.addColorStop(1, '#1e1b4b');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw exit
        const gradient = ctx.createRadialGradient(
            exitPos.x * cellSize + cellSize / 2,
            exitPos.y * cellSize + cellSize / 2,
            0,
            exitPos.x * cellSize + cellSize / 2,
            exitPos.y * cellSize + cellSize / 2,
            cellSize / 2
        );
        gradient.addColorStop(0, '#10b981');
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0.2)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(exitPos.x * cellSize + cellSize / 2, exitPos.y * cellSize + cellSize / 2, cellSize / 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Exit image
        if (exitImageRef.current) {
            const imgSize = cellSize * 0.5;
            ctx.drawImage(
                exitImageRef.current,
                exitPos.x * cellSize + (cellSize - imgSize) / 2,
                exitPos.y * cellSize + (cellSize - imgSize) / 2,
                imgSize,
                imgSize
            );
        }

        // Draw start point
        ctx.fillStyle = 'rgba(251, 191, 36, 0.3)';
        ctx.beginPath();
        ctx.arc(startPos.x * cellSize + cellSize / 2, startPos.y * cellSize + cellSize / 2, cellSize / 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Start image
        if (startImageRef.current) {
            const imgSize = cellSize * 0.5;
            ctx.drawImage(
                startImageRef.current,
                startPos.x * cellSize + (cellSize - imgSize) / 2,
                startPos.y * cellSize + (cellSize - imgSize) / 2,
                imgSize,
                imgSize
            );
        }

        // Draw walls with indigo/purple color scheme
        ctx.strokeStyle = showCollision ? '#ef4444' : '#818cf8';
        ctx.lineWidth = wallThickness;
        ctx.lineCap = 'round';

        for (let y = 0; y < mazeSize; y++) {
            for (let x = 0; x < mazeSize; x++) {
                const cell = maze[y][x];
                const px = x * cellSize;
                const py = y * cellSize;

                if (cell.walls.top) {
                    ctx.beginPath();
                    ctx.moveTo(px, py);
                    ctx.lineTo(px + cellSize, py);
                    ctx.stroke();
                }
                if (cell.walls.right) {
                    ctx.beginPath();
                    ctx.moveTo(px + cellSize, py);
                    ctx.lineTo(px + cellSize, py + cellSize);
                    ctx.stroke();
                }
                if (cell.walls.bottom) {
                    ctx.beginPath();
                    ctx.moveTo(px, py + cellSize);
                    ctx.lineTo(px + cellSize, py + cellSize);
                    ctx.stroke();
                }
                if (cell.walls.left) {
                    ctx.beginPath();
                    ctx.moveTo(px, py);
                    ctx.lineTo(px, py + cellSize);
                    ctx.stroke();
                }
            }
        }

        // Draw user's path
        if (drawPath.length > 1) {
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 8;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = 10;

            ctx.beginPath();
            ctx.moveTo(drawPath[0].x, drawPath[0].y);
            for (let i = 1; i < drawPath.length; i++) {
                ctx.lineTo(drawPath[i].x, drawPath[i].y);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Draw pen tip
            const lastPoint = drawPath[drawPath.length - 1];
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(lastPoint.x, lastPoint.y, 10, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw collision point
        if (collisionPoint) {
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(collisionPoint.x, collisionPoint.y, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.font = '20px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('✕', collisionPoint.x, collisionPoint.y);
        }
    }, [maze, mazeSize, exitPos, drawPath, showCollision, collisionPoint, startPos]);

    // Get coordinates from event
    const getEventCoords = (e: React.MouseEvent | React.TouchEvent): Point | null => {
        const canvas = canvasRef.current;
        if (!canvas) return null;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        if ('touches' in e) {
            const touch = e.touches[0];
            return {
                x: (touch.clientX - rect.left) * scaleX,
                y: (touch.clientY - rect.top) * scaleY
            };
        } else {
            return {
                x: (e.clientX - rect.left) * scaleX,
                y: (e.clientY - rect.top) * scaleY
            };
        }
    };

    // Check if starting from valid position
    const isNearStart = (point: Point): boolean => {
        const canvas = canvasRef.current;
        if (!canvas) return false;

        const cellSize = canvas.width / mazeSize;
        const startCenterX = startPos.x * cellSize + cellSize / 2;
        const startCenterY = startPos.y * cellSize + cellSize / 2;
        const distance = Math.sqrt((point.x - startCenterX) ** 2 + (point.y - startCenterY) ** 2);

        return distance < cellSize / 2;
    };

    // Handle drawing start
    const handleDrawStart = (e: React.MouseEvent | React.TouchEvent) => {
        if (gameState !== 'playing') return;
        e.preventDefault();

        const point = getEventCoords(e);
        if (!point) return;

        if (isNearStart(point)) {
            setIsDrawing(true);
            setDrawPath([point]);
            setCollisionPoint(null);
        }
    };

    // Handle drawing move
    const handleDrawMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || gameState !== 'playing') return;
        e.preventDefault();

        const point = getEventCoords(e);
        if (!point) return;

        // Check for wall collision
        if (checkWallCollision(point.x, point.y)) {
            setIsDrawing(false);
            setShowCollision(true);
            setCollisionPoint(point);
            setDrawPath([]);

            playSound('incorrect');
            showFeedback(false);
            setStreak(0);
            setLives(l => {
                if (l <= 1) {
                    setTimeout(() => setGameState('lost'), 1500);
                    return 0;
                }
                return l - 1;
            });

            setTimeout(() => {
                setShowCollision(false);
                setCollisionPoint(null);
            }, 1500);
            return;
        }

        // Check for win
        if (checkWin(point.x, point.y)) {
            setDrawPath(prev => [...prev, point]);
            playSound('correct');
            showFeedback(true);
            setStreak(prev => prev + 1);
            const timeBonus = timeLeft * 10;
            setScore(prev => prev + 100 + timeBonus + (streak * 20));
            setGameState('won');
            setIsDrawing(false);
            return;
        }

        setDrawPath(prev => [...prev, point]);
    };

    // Handle drawing end
    const handleDrawEnd = () => {
        setIsDrawing(false);
    };

    // Initialize game
    const startGame = useCallback(() => {
        const size = 4 + Math.floor(level / 2);
        const actualSize = Math.min(size, 10);
        setMazeSize(actualSize);
        const newMaze = generateMaze(actualSize);
        setMaze(newMaze);
        setExitPos({ x: actualSize - 1, y: actualSize - 1 });
        setDrawPath([]);
        setTimeLeft(90 + level * 15);
        setLives(3);
        setStreak(0);
        setGameState('playing');
        setShowCollision(false);
        setCollisionPoint(null);
        hasSavedRef.current = false;
        gameStartTimeRef.current = Date.now();
    }, [level, generateMaze]);

    // Timer
    useEffect(() => {
        if (gameState !== 'playing') return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    setGameState('lost');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [gameState]);

    // Oyun bittiğinde verileri kaydet
    useEffect(() => {
        if ((gameState === 'won' || gameState === 'lost') && gameStartTimeRef.current > 0 && !hasSavedRef.current) {
            hasSavedRef.current = true;
            const durationSeconds = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
            saveGamePlay({
                game_id: 'labirent',
                score_achieved: score,
                duration_seconds: durationSeconds,
                lives_remaining: lives,
                metadata: {
                    level_reached: level,
                    maze_size: mazeSize,
                    streak: streak,
                    game_name: 'Labirent Ustası',
                    result: gameState,
                }
            });
        }
    }, [gameState, score, level, lives, mazeSize, streak, saveGamePlay]);

    // Draw on canvas
    useEffect(() => {
        drawMaze();
    }, [drawMaze]);

    // Handle Auto Start from HUB
    useEffect(() => {
        if (location.state?.autoStart && gameState === 'idle') {
            startGame();
        }
    }, [location.state, gameState, startGame]);

    const nextLevel = () => {
        setLevel(prev => prev + 1);
        startGame();
    };

    const resetGame = () => {
        setLevel(1);
        setScore(0);
        setGameState('idle');
    };

    const retryLevel = () => {
        const size = 4 + Math.floor(level / 2);
        const actualSize = Math.min(size, 10);
        setMazeSize(actualSize);
        const newMaze = generateMaze(actualSize);
        setMaze(newMaze);
        setExitPos({ x: actualSize - 1, y: actualSize - 1 });
        setDrawPath([]);
        setShowCollision(false);
        setCollisionPoint(null);
    };

    // Welcome Screen
    if (gameState === 'idle') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 text-white">
                {/* Decorative Background */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
                </div>

                <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center max-w-xl"
                    >
                        {/* 3D Gummy Icon */}
                        <motion.div
                            className="w-28 h-28 rounded-[40%] flex items-center justify-center mx-auto mb-6"
                            style={{
                                background: 'linear-gradient(135deg, #818CF8 0%, #6366F1 100%)',
                                boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)'
                            }}
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <Pencil size={52} className="text-white drop-shadow-lg" />
                        </motion.div>

                        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                            ✏️ Labirent Ustası
                        </h1>

                        {/* Instructions */}
                        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                            <h3 className="text-lg font-bold text-indigo-300 mb-3 flex items-center gap-2">
                                <Eye size={20} /> Nasıl Oynanır?
                            </h3>
                            <ul className="space-y-2 text-slate-300 text-sm">
                                <li className="flex items-center gap-2">
                                    <Sparkles size={14} className="text-indigo-400" />
                                    <span>Beyin ikonundan <strong>başla</strong></span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Sparkles size={14} className="text-indigo-400" />
                                    <span>Parmağınla <strong>çiz</strong>, duvarlara değme!</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Sparkles size={14} className="text-indigo-400" />
                                    <span>Yeşil <strong>çıkışa</strong> ulaş!</span>
                                </li>
                            </ul>
                        </div>

                        {/* TUZÖ Badge */}
                        <div className="bg-indigo-500/10 text-indigo-300 text-xs px-4 py-2 rounded-full mb-6 inline-block border border-indigo-500/30">
                            TUZÖ 6.2.1 Motor Planlama
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.05, y: -4 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={startGame}
                            className="px-8 py-4 rounded-2xl font-bold text-lg"
                            style={{
                                background: 'linear-gradient(135deg, #818CF8 0%, #6366F1 100%)',
                                boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(129, 140, 248, 0.4)'
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <Play size={24} fill="currentColor" />
                                <span>Oyuna Başla</span>
                            </div>
                        </motion.button>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 text-white">
            {/* Decorative Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <div className="relative z-10 p-4 pt-20">
                <div className="max-w-4xl mx-auto flex items-center justify-between flex-wrap gap-4">
                    <Link
                        to={backLink}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft size={20} />
                        <span>{backLabel}</span>
                    </Link>

                    <div className="flex items-center gap-4 flex-wrap">
                        {/* Score */}
                        <div
                            className="flex items-center gap-2 px-4 py-2 rounded-xl"
                            style={{
                                background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)',
                                boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                                border: '1px solid rgba(251, 191, 36, 0.3)'
                            }}
                        >
                            <Star className="text-amber-400 fill-amber-400" size={18} />
                            <span className="font-bold text-amber-400">{score}</span>
                        </div>

                        {/* Lives */}
                        <div
                            className="flex items-center gap-2 px-4 py-2 rounded-xl"
                            style={{
                                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)',
                                boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)'
                            }}
                        >
                            {[...Array(3)].map((_, i) => (
                                <Heart
                                    key={i}
                                    size={18}
                                    className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-900'}
                                />
                            ))}
                        </div>

                        {/* Timer */}
                        {gameState === 'playing' && (
                            <div
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl ${timeLeft <= 15 ? 'animate-pulse' : ''}`}
                                style={{
                                    background: timeLeft <= 15
                                        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.2) 100%)'
                                        : 'linear-gradient(135deg, rgba(129, 140, 248, 0.2) 0%, rgba(99, 102, 241, 0.1) 100%)',
                                    boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                                    border: timeLeft <= 15 ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(129, 140, 248, 0.3)'
                                }}
                            >
                                <Timer className={timeLeft <= 15 ? 'text-red-400' : 'text-indigo-400'} size={18} />
                                <span className={`font-bold font-mono ${timeLeft <= 15 ? 'text-red-400' : 'text-indigo-400'}`}>
                                    {timeLeft}s
                                </span>
                            </div>
                        )}

                        {/* Level */}
                        <div
                            className="flex items-center gap-2 px-4 py-2 rounded-xl"
                            style={{
                                background: 'linear-gradient(135deg, rgba(129, 140, 248, 0.2) 0%, rgba(99, 102, 241, 0.1) 100%)',
                                boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                                border: '1px solid rgba(129, 140, 248, 0.3)'
                            }}
                        >
                            <Target className="text-indigo-400" size={18} />
                            <span className="font-bold text-indigo-400">Seviye {level}</span>
                        </div>

                        {/* Streak */}
                        {streak > 0 && (
                            <div
                                className="flex items-center gap-2 px-4 py-2 rounded-xl"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.3) 0%, rgba(245, 158, 11, 0.2) 100%)',
                                    boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(251, 191, 36, 0.5)'
                                }}
                            >
                                <Zap className="text-amber-400" size={18} />
                                <span className="font-bold text-amber-400">x{streak}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-4">
                <AnimatePresence mode="wait">
                    {/* Playing State */}
                    {gameState === 'playing' && (
                        <motion.div
                            key="playing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center gap-4"
                        >
                            <div
                                className={`relative rounded-2xl overflow-hidden ${showCollision ? 'ring-4 ring-red-500 animate-shake' : 'ring-4 ring-indigo-500/30'} transition-all`}
                                style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}
                            >
                                <canvas
                                    ref={canvasRef}
                                    width={400}
                                    height={400}
                                    className="bg-slate-900 touch-none"
                                    style={{ maxWidth: '90vw', maxHeight: '60vh', width: 'auto', height: 'auto' }}
                                    onMouseDown={handleDrawStart}
                                    onMouseMove={handleDrawMove}
                                    onMouseUp={handleDrawEnd}
                                    onMouseLeave={handleDrawEnd}
                                    onTouchStart={handleDrawStart}
                                    onTouchMove={handleDrawMove}
                                    onTouchEnd={handleDrawEnd}
                                />
                            </div>

                            <p className="text-slate-500 text-sm text-center">
                                Sarı noktadan başlayarak parmağınla çıkışa kadar çiz
                            </p>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={retryLevel}
                                className="px-4 py-2 rounded-xl font-medium flex items-center gap-2 text-sm"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                                    boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}
                            >
                                <RotateCcw size={16} />
                                Yeni Labirent
                            </motion.button>
                        </motion.div>
                    )}

                    {/* Won State */}
                    {gameState === 'won' && (
                        <motion.div
                            key="won"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center max-w-xl"
                        >
                            <motion.div
                                className="w-28 h-28 rounded-[40%] flex items-center justify-center mx-auto mb-6"
                                style={{
                                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                    boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)'
                                }}
                                animate={{ rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <CheckCircle2 size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h2 className="text-3xl font-black text-emerald-300 mb-2">
                                🎉 Tebrikler!
                            </h2>
                            <p className="text-slate-400 mb-6">
                                Labirenti başarıyla geçtin!
                            </p>

                            <div
                                className="rounded-2xl p-6 mb-8"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Skor</p>
                                        <p className="text-2xl font-bold text-amber-400">{score}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Seviye</p>
                                        <p className="text-2xl font-bold text-indigo-400">{level}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 justify-center flex-wrap">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={nextLevel}
                                    className="px-6 py-4 rounded-2xl font-bold text-lg"
                                    style={{
                                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                        boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(16, 185, 129, 0.4)'
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <Trophy size={24} />
                                        <span>Sonraki Seviye</span>
                                    </div>
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={resetGame}
                                    className="px-6 py-4 rounded-2xl font-bold"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                                        boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2)',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <RotateCcw size={24} />
                                        <span>Baştan Başla</span>
                                    </div>
                                </motion.button>
                            </div>
                        </motion.div>
                    )}

                    {/* Lost State */}
                    {gameState === 'lost' && (
                        <motion.div
                            key="lost"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center max-w-xl"
                        >
                            <motion.div
                                className="w-28 h-28 rounded-[40%] flex items-center justify-center mx-auto mb-6"
                                style={{
                                    background: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
                                    boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)'
                                }}
                                animate={{ rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <XCircle size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h2 className="text-3xl font-black text-amber-300 mb-2">
                                {lives === 0 ? 'Canlar Bitti!' : 'Süre Doldu!'}
                            </h2>
                            <p className="text-slate-400 mb-6">
                                Seviye {level}'e ulaştın
                            </p>

                            <div
                                className="rounded-2xl p-6 mb-8"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}
                            >
                                <div className="text-center">
                                    <p className="text-slate-400 text-sm">Toplam Skor</p>
                                    <p className="text-2xl font-bold text-amber-400">{score}</p>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={resetGame}
                                className="w-full px-6 py-4 rounded-2xl font-bold text-lg mb-4"
                                style={{
                                    background: 'linear-gradient(135deg, #818CF8 0%, #6366F1 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(129, 140, 248, 0.4)'
                                }}
                            >
                                <div className="flex items-center justify-center gap-3">
                                    <RotateCcw size={24} />
                                    <span>Tekrar Dene</span>
                                </div>
                            </motion.button>

                            <Link
                                to={backLink}
                                className="block text-slate-500 hover:text-white transition-colors"
                            >
                                {location.state?.arcadeMode ? 'Bilsem Zeka' : 'Geri Dön'}
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Feedback Overlay */}
                <GameFeedbackBanner feedback={feedbackState} />
            </div>

            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                    20%, 40%, 60%, 80% { transform: translateX(5px); }
                }
                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }
            `}</style>
        </div>
    );
};

export default MazeGame;
