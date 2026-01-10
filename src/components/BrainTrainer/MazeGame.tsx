import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Trophy, RotateCcw, Play, Star, Timer, Target, CheckCircle2, XCircle, Pencil, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';

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

const MazeGame: React.FC = () => {
    const { saveGamePlay } = useGamePersistence();
    const [gameState, setGameState] = useState<'idle' | 'playing' | 'won' | 'lost'>('idle');
    const [maze, setMaze] = useState<Cell[][]>([]);
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);
    const [mazeSize, setMazeSize] = useState(5);
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawPath, setDrawPath] = useState<Point[]>([]);
    const [showCollision, setShowCollision] = useState(false);
    const [collisionPoint, setCollisionPoint] = useState<Point | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const startImageRef = useRef<HTMLImageElement | null>(null);
    const exitImageRef = useRef<HTMLImageElement | null>(null);
    const gameStartTimeRef = useRef<number>(0);
    const startPos = { x: 0, y: 0 };
    const [exitPos, setExitPos] = useState({ x: 4, y: 4 });

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

        // Get cell coordinates
        const cellX = Math.floor(px / cellSize);
        const cellY = Math.floor(py / cellSize);

        if (cellX < 0 || cellX >= mazeSize || cellY < 0 || cellY >= mazeSize) return true;

        const cell = maze[cellY]?.[cellX];
        if (!cell) return true;

        // Position within cell (0-1)
        const localX = (px % cellSize) / cellSize;
        const localY = (py % cellSize) / cellSize;

        const edgeThreshold = wallThickness / cellSize;

        // Check each wall
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

        // Clear canvas
        ctx.fillStyle = '#0f172a';
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

        // Draw walls
        ctx.strokeStyle = showCollision ? '#ef4444' : '#6366f1';
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
            ctx.fillText('✕', collisionPoint.x, collisionPoint.y);
        }
    }, [maze, mazeSize, exitPos, drawPath, showCollision, collisionPoint]);

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

            setTimeout(() => {
                setShowCollision(false);
                setCollisionPoint(null);
            }, 1500);
            return;
        }

        // Check for win
        if (checkWin(point.x, point.y)) {
            setDrawPath(prev => [...prev, point]);
            const timeBonus = timeLeft * 10;
            setScore(prev => prev + 100 + timeBonus);
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
        setGameState('playing');
        setShowCollision(false);
        setCollisionPoint(null);
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

    // Oyun başladığında süre başlat
    useEffect(() => {
        if (gameState === 'playing') {
            gameStartTimeRef.current = Date.now();
        }
    }, [gameState]);

    // Oyun bittiğinde verileri kaydet
    useEffect(() => {
        if ((gameState === 'won' || gameState === 'lost') && gameStartTimeRef.current > 0) {
            const durationSeconds = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
            saveGamePlay({
                game_id: 'labirent',
                score_achieved: score,
                duration_seconds: durationSeconds,
                metadata: {
                    level_reached: level,
                    maze_size: mazeSize,
                    game_name: 'Labirent Ustası',
                    result: gameState,
                }
            });
        }
    }, [gameState, score, level, mazeSize, saveGamePlay]);

    // Draw on canvas
    useEffect(() => {
        drawMaze();
    }, [drawMaze]);

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
        startGame();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 pt-24 pb-12 px-6">
            <div className="container mx-auto max-w-4xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <Link
                        to="/atolyeler/bireysel-degerlendirme"
                        className="inline-flex items-center gap-2 text-indigo-400 font-bold hover:text-indigo-300 transition-colors mb-4 uppercase text-xs tracking-widest"
                    >
                        <ChevronLeft size={16} />
                        Bireysel Değerlendirme
                    </Link>
                    <h1 className="text-4xl lg:text-5xl font-black text-white mb-2">
                        ✏️ <span className="text-indigo-400">Labirent</span> Ustası
                    </h1>
                    <p className="text-slate-400">Parmağınla veya kalemle çıkışa giden yolu çiz!</p>
                </motion.div>

                {/* Stats */}
                <div className="flex justify-center gap-4 mb-8 flex-wrap">
                    <div className="bg-slate-800/50 border border-white/10 rounded-xl px-5 py-2 flex items-center gap-2">
                        <Star className="w-5 h-5 text-amber-400" />
                        <span className="text-white font-bold">{score}</span>
                    </div>
                    <div className="bg-slate-800/50 border border-white/10 rounded-xl px-5 py-2 flex items-center gap-2">
                        <Target className="w-5 h-5 text-purple-400" />
                        <span className="text-white font-bold">Seviye {level}</span>
                    </div>
                    {gameState === 'playing' && (
                        <div className={`bg-slate-800/50 border border-white/10 rounded-xl px-5 py-2 flex items-center gap-2 ${timeLeft <= 15 ? 'animate-pulse border-red-500/50' : ''}`}>
                            <Timer className={`w-5 h-5 ${timeLeft <= 15 ? 'text-red-400' : 'text-emerald-400'}`} />
                            <span className={`font-bold ${timeLeft <= 15 ? 'text-red-400' : 'text-white'}`}>{timeLeft}s</span>
                        </div>
                    )}
                </div>

                {/* Game Area */}
                <div className="flex flex-col items-center">
                    {gameState === 'idle' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center space-y-6"
                        >
                            <div className="bg-slate-800/50 border border-white/10 rounded-3xl p-8 max-w-md">
                                <div className="text-6xl mb-4">✏️</div>
                                <h2 className="text-2xl font-bold text-white mb-4">Labirent Çizim Oyunu</h2>
                                <ul className="text-slate-400 text-sm space-y-2 text-left mb-6">
                                    <li className="flex items-center gap-2">
                                        <Pencil className="w-4 h-4 text-amber-400" />
                                        Beyin ikonundan başla, parmağınla çiz
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Pencil className="w-4 h-4 text-amber-400" />
                                        Duvarlara değmeden çıkışa ulaş
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Pencil className="w-4 h-4 text-amber-400" />
                                        Duvara değersen tekrar dene
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Pencil className="w-4 h-4 text-amber-400" />
                                        Her seviyede labirent büyür
                                    </li>
                                </ul>
                                <button
                                    onClick={startGame}
                                    className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-xl hover:from-indigo-400 hover:to-purple-400 transition-all flex items-center gap-3 mx-auto"
                                >
                                    <Play className="w-5 h-5" />
                                    Oyuna Başla
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {gameState === 'playing' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center gap-4"
                        >
                            <div className={`relative rounded-2xl overflow-hidden shadow-2xl ${showCollision ? 'ring-4 ring-red-500 animate-shake' : 'ring-4 ring-indigo-500/30'} transition-all`}>
                                <canvas
                                    ref={canvasRef}
                                    width={400}
                                    height={400}
                                    className="bg-slate-900 touch-none"
                                    onMouseDown={handleDrawStart}
                                    onMouseMove={handleDrawMove}
                                    onMouseUp={handleDrawEnd}
                                    onMouseLeave={handleDrawEnd}
                                    onTouchStart={handleDrawStart}
                                    onTouchMove={handleDrawMove}
                                    onTouchEnd={handleDrawEnd}
                                />
                            </div>

                            {showCollision && (
                                <motion.p
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-red-400 font-bold"
                                >
                                    ⚠️ Duvara değdin! Tekrar dene.
                                </motion.p>
                            )}

                            <p className="text-slate-500 text-sm text-center">
                                Beyin ikonundan başlayarak parmağınla çıkışa kadar çiz
                            </p>

                            <button
                                onClick={retryLevel}
                                className="px-4 py-2 bg-slate-700 text-white font-medium rounded-lg hover:bg-slate-600 transition-all flex items-center gap-2 text-sm"
                            >
                                <RotateCcw className="w-4 h-4" />
                                Yeni Labirent
                            </button>
                        </motion.div>
                    )}

                    {gameState === 'won' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center space-y-6"
                        >
                            <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-3xl p-8">
                                <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                                <h2 className="text-3xl font-black text-white mb-2">Tebrikler! 🎉</h2>
                                <p className="text-emerald-400 font-bold mb-4">Labirenti başarıyla geçtin!</p>
                                <div className="flex justify-center gap-4">
                                    <button
                                        onClick={nextLevel}
                                        className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl hover:from-emerald-400 hover:to-teal-400 transition-all flex items-center gap-2"
                                    >
                                        <Trophy className="w-5 h-5" />
                                        Sonraki Seviye
                                    </button>
                                    <button
                                        onClick={resetGame}
                                        className="px-6 py-3 bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-600 transition-all flex items-center gap-2"
                                    >
                                        <RotateCcw className="w-5 h-5" />
                                        Baştan Başla
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {gameState === 'lost' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center space-y-6"
                        >
                            <div className="bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-3xl p-8">
                                <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                                <h2 className="text-3xl font-black text-white mb-2">Süre Doldu! ⏰</h2>
                                <p className="text-slate-400 mb-4">Toplam Skor: <span className="text-white font-bold">{score}</span></p>
                                <button
                                    onClick={resetGame}
                                    className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-xl hover:from-indigo-400 hover:to-purple-400 transition-all flex items-center gap-2 mx-auto"
                                >
                                    <RotateCcw className="w-5 h-5" />
                                    Tekrar Dene
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>
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
