import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { motion } from 'framer-motion';
import { Battery, Brain } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useGamePersistence } from '../../../../hooks/useGamePersistence';
import { Cell, EnergyEffect, GameState } from './types';
import { INITIAL_GRID_SIZE, CELL_SIZE } from './constants';
import { useMazeGenerator } from './hooks/useMazeGenerator';
import GameHUD from './components/GameHUD';
import { StartOverlay, LevelClearedOverlay, GameOverOverlay } from './components/Overlays';
import IlluminationEffect from './components/IlluminationEffect';
import TouchControls from './components/TouchControls';

const DarkMaze: React.FC = () => {
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();
    const { generateMaze, getNextLevelSize } = useMazeGenerator();

    const [gameState, setGameState] = useState<GameState>('idle');
    const [level, setLevel] = useState(1);
    const [gridSize, setGridSize] = useState(INITIAL_GRID_SIZE);
    const [maze, setMaze] = useState<Cell[][]>([]);
    const [playerPos, setPlayerPos] = useState({ r: 0, c: 0 });
    const [energy, setEnergy] = useState(100);
    const [timeLeft, setTimeLeft] = useState(90);
    const [isIlluminated, setIsIlluminated] = useState(false);
    const [score, setScore] = useState(0);
    const [energyEffects, setEnergyEffects] = useState<EnergyEffect[]>([]);
    const [lastCollectionTime, setLastCollectionTime] = useState(0);
    const gameStartTimeRef = useRef<number>(0);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const startGame = useCallback(() => {
        setLevel(1);
        setGridSize(INITIAL_GRID_SIZE);
        const newMaze = generateMaze(INITIAL_GRID_SIZE, 1);
        setMaze(newMaze);
        setPlayerPos({ r: 0, c: 0 });
        setEnergy(100);
        setTimeLeft(90);
        setScore(0);
        setGameState('playing');
        gameStartTimeRef.current = Date.now();
    }, [generateMaze]);

    const nextLevel = useCallback(() => {
        const nextLvl = level + 1;
        const nextSize = getNextLevelSize(nextLvl);
        setLevel(nextLvl);
        setGridSize(nextSize);
        const newMaze = generateMaze(nextSize, nextLvl);
        setMaze(newMaze);
        setPlayerPos({ r: 0, c: 0 });
        setEnergy(e => Math.min(100, e + 30));
        setTimeLeft(t => t + 45);
        setGameState('playing');
    }, [level, generateMaze, getNextLevelSize]);

    // Handle Auto-start from Arcade
    useEffect(() => {
        if (location.state?.autoStart && gameState === 'idle') {
            startGame();
        }
    }, [location.state, gameState, startGame]);

    // Movement logic
    const move = useCallback((dr: number, dc: number) => {
        if (gameState !== 'playing') return;

        setPlayerPos(prev => {
            const currentCell = maze[prev.r][prev.c];
            const nr = prev.r + dr;
            const nc = prev.c + dc;

            if (nr < 0 || nr >= gridSize || nc < 0 || nc >= gridSize) return prev;

            if (dr === -1 && currentCell.walls[0]) return prev;
            if (dr === 1 && currentCell.walls[2]) return prev;
            if (dc === -1 && currentCell.walls[3]) return prev;
            if (dc === 1 && currentCell.walls[1]) return prev;

            const nextCell = maze[nr][nc];

            if (nextCell.hasBattery) {
                setEnergy(e => Math.min(100, e + 25));
                const effectId = Date.now();
                setEnergyEffects(prev => [...prev, { id: effectId, r: nr, c: nc }]);
                setLastCollectionTime(effectId);
                setTimeout(() => {
                    setEnergyEffects(prev => prev.filter(e => e.id !== effectId));
                }, 1000);
                nextCell.hasBattery = false;
            }
            if (nextCell.hasLogo) {
                setIsIlluminated(true);
                setTimeout(() => setIsIlluminated(false), 2000);
                nextCell.hasLogo = false;
            }

            if (nr === gridSize - 1 && nc === gridSize - 1) {
                const levelScore = timeLeft * 10 + Math.floor(energy * 5);
                setScore(s => s + levelScore);
                setGameState('level_cleared');
            }

            return { r: nr, c: nc };
        });
    }, [maze, gameState, timeLeft, energy, gridSize]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
            }
            switch (e.key) {
                case 'ArrowUp': move(-1, 0); break;
                case 'ArrowDown': move(1, 0); break;
                case 'ArrowLeft': move(0, -1); break;
                case 'ArrowRight': move(0, 1); break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [move]);

    // Energy and Timer loop
    useEffect(() => {
        if (gameState !== 'playing') return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    setGameState('finished');
                    return 0;
                }
                return prev - 1;
            });
            setEnergy(prev => {
                const next = prev - 0.5;
                if (next <= 0) return 0;
                return next;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [gameState]);

    // Canvas Rendering
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || maze.length === 0) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const cell = maze[r][c];
                const x = c * CELL_SIZE;
                const y = r * CELL_SIZE;

                if (cell.walls[0]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + CELL_SIZE, y); ctx.stroke(); }
                if (cell.walls[1]) { ctx.beginPath(); ctx.moveTo(x + CELL_SIZE, y); ctx.lineTo(x + CELL_SIZE, y + CELL_SIZE); ctx.stroke(); }
                if (cell.walls[2]) { ctx.beginPath(); ctx.moveTo(x + CELL_SIZE, y + CELL_SIZE); ctx.lineTo(x, y + CELL_SIZE); ctx.stroke(); }
                if (cell.walls[3]) { ctx.beginPath(); ctx.moveTo(x, y + CELL_SIZE); ctx.lineTo(x, y); ctx.stroke(); }

                if (cell.hasBattery) {
                    ctx.fillStyle = '#10b981';
                    ctx.beginPath(); ctx.arc(x + CELL_SIZE / 2, y + CELL_SIZE / 2, 4, 0, Math.PI * 2); ctx.fill();
                }
                if (cell.hasLogo) {
                    ctx.fillStyle = '#f59e0b';
                    ctx.beginPath(); ctx.arc(x + CELL_SIZE / 2, y + CELL_SIZE / 2, 6, 0, Math.PI * 2); ctx.fill();
                }
            }
        }

        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        const px = playerPos.c * CELL_SIZE + CELL_SIZE / 2;
        const py = playerPos.r * CELL_SIZE + CELL_SIZE / 2;
        ctx.arc(px, py, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#6366f1';
        ctx.fillRect((gridSize - 1) * CELL_SIZE + 5, (gridSize - 1) * CELL_SIZE + 5, CELL_SIZE - 10, CELL_SIZE - 10);

        if (!isIlluminated) {
            ctx.globalCompositeOperation = 'destination-in';
            const grad = ctx.createRadialGradient(px, py, 10, px, py, energy > 0 ? 80 : 20);
            grad.addColorStop(0, 'rgba(0,0,0,1)');
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalCompositeOperation = 'source-over';

            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const tempCtx = tempCanvas.getContext('2d')!;
            tempCtx.fillStyle = 'rgba(0, 0, 0, 0.95)';
            tempCtx.fillRect(0, 0, canvas.width, canvas.height);
            tempCtx.globalCompositeOperation = 'destination-out';
            tempCtx.fillStyle = grad;
            tempCtx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.drawImage(tempCanvas, 0, 0);
        }
    }, [maze, playerPos, isIlluminated, energy, gridSize]);

    useEffect(() => {
        if (gameState === 'finished' && gameStartTimeRef.current > 0) {
            const duration = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
            saveGamePlay({
                game_id: 'arcade-dark-maze',
                score_achieved: score,
                duration_seconds: duration,
                metadata: {
                    game_name: 'Karanlık Labirent',
                    remaining_energy: energy,
                    remaining_time: timeLeft,
                    level_reached: level
                }
            });
        }
    }, [gameState, score, saveGamePlay, energy, timeLeft, level]);

    return (
        <div className="min-h-screen bg-[#050505] text-white pt-24 pb-12 overflow-hidden flex flex-col items-center">

            <AnimatePresence>
                {isIlluminated && <IlluminationEffect isIlluminated={isIlluminated} />}
            </AnimatePresence>

            <div className="container mx-auto max-w-4xl relative z-10 px-6">
                <GameHUD
                    energy={energy}
                    timeLeft={timeLeft}
                    level={level}
                    score={score}
                    lastCollectionTime={lastCollectionTime}
                />

                <div className="relative flex justify-center">
                    <div
                        className="bg-slate-900/50 rounded-[2rem] p-4 border-4 border-white/5 shadow-2xl relative overflow-hidden transition-all duration-500"
                        style={{ width: gridSize * CELL_SIZE + 32, height: gridSize * CELL_SIZE + 32 }}
                    >
                        <canvas
                            ref={canvasRef}
                            width={gridSize * CELL_SIZE}
                            height={gridSize * CELL_SIZE}
                            className="rounded-xl"
                        />

                        <AnimatePresence>
                            {energyEffects.map(effect => (
                                <motion.div
                                    key={effect.id}
                                    initial={{ opacity: 0, scale: 0.5, y: 0 }}
                                    animate={{ opacity: 1, scale: 1.2, y: -40 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute z-20 pointer-events-none flex flex-col items-center"
                                    style={{
                                        left: effect.c * CELL_SIZE + CELL_SIZE / 2 + 16,
                                        top: effect.r * CELL_SIZE + CELL_SIZE / 2 + 16,
                                        transform: 'translate(-50%, -50%)'
                                    }}
                                >
                                    <div className="bg-green-500 text-white font-black text-xs px-2 py-1 rounded-lg shadow-lg flex items-center gap-1 border border-green-300">
                                        <Battery size={12} /> +25
                                    </div>
                                    <motion.div
                                        animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                                        className="w-8 h-8 rounded-full border-2 border-green-500 absolute top-0"
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {gameState === 'idle' && <StartOverlay onStart={startGame} />}
                        {gameState === 'level_cleared' && <LevelClearedOverlay onNextLevel={nextLevel} />}
                        {gameState === 'finished' && <GameOverOverlay score={score} level={level} onRestart={startGame} />}
                    </div>

                    <TouchControls onMove={move} />
                </div>

                <div className="mt-20 flex gap-8 justify-center items-start text-xs font-black uppercase tracking-widest text-slate-500">
                    <div className="flex items-center gap-2"><Battery size={16} className="text-green-500" /> PİL: ENERJİ VERİR</div>
                    <div className="flex items-center gap-2"><Brain size={16} className="text-yellow-500" /> BEYİN: AYDINLATIR</div>
                </div>
            </div>
        </div>
    );
};

export default DarkMaze;
