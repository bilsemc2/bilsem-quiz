import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { motion } from 'framer-motion';
import { Battery, Brain, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useGamePersistence } from '../../../../hooks/useGamePersistence';
import { Cell, EnergyEffect, GameState } from './types';
import { INITIAL_GRID_SIZE, CELL_SIZE } from './constants';
import { useMazeGenerator } from './hooks/useMazeGenerator';
import IlluminationEffect from './components/IlluminationEffect';
import ArcadeGameShell from '../../Shared/ArcadeGameShell';
import ArcadeFeedbackBanner from '../../Shared/ArcadeFeedbackBanner';
import { ARCADE_SCORE_FORMULA, ARCADE_SCORE_BASE, ARCADE_FEEDBACK_TEXTS } from '../../Shared/ArcadeConstants';

const DarkMaze: React.FC = () => {
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();
    const { generateMaze, getNextLevelSize } = useMazeGenerator();
    const isResolvingRef = useRef(false);
    const hasSavedRef = useRef(false);

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
    const [canvasSize, setCanvasSize] = useState(gridSize * CELL_SIZE);
    const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [showLevelUp, setShowLevelUp] = useState(false);
    const gameStartTimeRef = useRef<number>(0);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const touchStartRef = useRef<{ x: number; y: number } | null>(null);

    // Responsive canvas sizing
    useEffect(() => {
        const updateCanvasSize = () => {
            const maxWidth = Math.min(window.innerWidth - 48, 600);
            const idealSize = gridSize * CELL_SIZE;
            const newSize = Math.min(idealSize, maxWidth);
            setCanvasSize(newSize);
        };

        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);
        return () => window.removeEventListener('resize', updateCanvasSize);
    }, [gridSize]);

    const startGame = useCallback(() => {
        window.scrollTo(0, 0);
        setLevel(1);
        setGridSize(INITIAL_GRID_SIZE);
        const newMaze = generateMaze(INITIAL_GRID_SIZE, 1);
        setMaze(newMaze);
        setPlayerPos({ r: 0, c: 0 });
        setEnergy(100);
        setTimeLeft(90);
        setScore(0);
        setFeedback(null);
        setShowLevelUp(false);
        setGameState('playing');
        hasSavedRef.current = false;
        isResolvingRef.current = false;
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
        setShowLevelUp(false);
        setGameState('playing');
    }, [level, generateMaze, getNextLevelSize]);

    // Auto-start
    useEffect(() => {
        if (location.state?.autoStart && gameState === 'idle') {
            startGame();
        }
    }, [location.state, gameState, startGame]);

    // Movement logic
    const move = useCallback((dr: number, dc: number) => {
        if (gameState !== 'playing' || isResolvingRef.current) return;

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

            // Level cleared!
            if (nr === gridSize - 1 && nc === gridSize - 1) {
                isResolvingRef.current = true;
                const levelScore = ARCADE_SCORE_FORMULA(ARCADE_SCORE_BASE, level);
                setScore(s => s + levelScore);

                const msgs = ARCADE_FEEDBACK_TEXTS.SUCCESS_MESSAGES;
                setFeedback({ message: msgs[Math.floor(Math.random() * msgs.length)], type: 'success' });

                setTimeout(() => {
                    setFeedback(null);
                    setShowLevelUp(true);
                    setGameState('level_cleared');
                    isResolvingRef.current = false;
                }, 1500);
            }

            return { r: nr, c: nc };
        });
    }, [maze, gameState, level, gridSize]);

    // Keyboard controls
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

    // Touch/Swipe controls on canvas
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        const touch = e.touches[0];
        touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    }, []);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        if (!touchStartRef.current) return;
        const touch = e.changedTouches[0];
        const dx = touch.clientX - touchStartRef.current.x;
        const dy = touch.clientY - touchStartRef.current.y;
        const threshold = 30;

        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > threshold) move(0, 1);
            else if (dx < -threshold) move(0, -1);
        } else {
            if (dy > threshold) move(1, 0);
            else if (dy < -threshold) move(-1, 0);
        }
        touchStartRef.current = null;
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

        const scale = canvasSize / (gridSize * CELL_SIZE);
        const scaledCellSize = CELL_SIZE * scale;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2 * scale;
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const cell = maze[r][c];
                const x = c * scaledCellSize;
                const y = r * scaledCellSize;

                if (cell.walls[0]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + scaledCellSize, y); ctx.stroke(); }
                if (cell.walls[1]) { ctx.beginPath(); ctx.moveTo(x + scaledCellSize, y); ctx.lineTo(x + scaledCellSize, y + scaledCellSize); ctx.stroke(); }
                if (cell.walls[2]) { ctx.beginPath(); ctx.moveTo(x + scaledCellSize, y + scaledCellSize); ctx.lineTo(x, y + scaledCellSize); ctx.stroke(); }
                if (cell.walls[3]) { ctx.beginPath(); ctx.moveTo(x, y + scaledCellSize); ctx.lineTo(x, y); ctx.stroke(); }

                if (cell.hasBattery) {
                    ctx.fillStyle = '#10b981';
                    ctx.beginPath(); ctx.arc(x + scaledCellSize / 2, y + scaledCellSize / 2, 4 * scale, 0, Math.PI * 2); ctx.fill();
                }
                if (cell.hasLogo) {
                    ctx.fillStyle = '#f59e0b';
                    ctx.beginPath(); ctx.arc(x + scaledCellSize / 2, y + scaledCellSize / 2, 6 * scale, 0, Math.PI * 2); ctx.fill();
                }
            }
        }

        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        const px = playerPos.c * scaledCellSize + scaledCellSize / 2;
        const py = playerPos.r * scaledCellSize + scaledCellSize / 2;
        ctx.arc(px, py, 10 * scale, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#6366f1';
        ctx.fillRect((gridSize - 1) * scaledCellSize + 5 * scale, (gridSize - 1) * scaledCellSize + 5 * scale, scaledCellSize - 10 * scale, scaledCellSize - 10 * scale);

        if (!isIlluminated) {
            ctx.globalCompositeOperation = 'destination-in';
            const grad = ctx.createRadialGradient(px, py, 10 * scale, px, py, energy > 0 ? 80 * scale : 20 * scale);
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
    }, [maze, playerPos, isIlluminated, energy, gridSize, canvasSize]);

    // Save on game over
    useEffect(() => {
        if (gameState === 'finished' && !hasSavedRef.current) {
            hasSavedRef.current = true;
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

    // Virtual Joystick State
    const joystickRef = useRef<HTMLDivElement>(null);
    const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const lastMoveRef = useRef<number>(0);
    const JOYSTICK_RADIUS = 50;
    const KNOB_RADIUS = 24;
    const MOVE_THRESHOLD = 25;
    const MOVE_COOLDOWN = 150;

    const handleJoystickStart = useCallback(() => {
        if (!joystickRef.current) return;
        setIsDragging(true);
    }, []);

    const handleJoystickMove = useCallback((clientX: number, clientY: number) => {
        if (!joystickRef.current || !isDragging) return;

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
        if (now - lastMoveRef.current > MOVE_COOLDOWN && distance > MOVE_THRESHOLD) {
            lastMoveRef.current = now;
            if (Math.abs(dx) > Math.abs(dy)) {
                move(0, dx > 0 ? 1 : -1);
            } else {
                move(dy > 0 ? 1 : -1, 0);
            }
        }
    }, [isDragging, move]);

    const handleJoystickEnd = useCallback(() => {
        setIsDragging(false);
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

    // ─── Shell status mapping ────────────────────────────────────────────────
    const shellStatus: 'START' | 'PLAYING' | 'GAME_OVER' | 'SUCCESS' =
        gameState === 'idle' ? 'START' :
            gameState === 'finished' ? 'GAME_OVER' : 'PLAYING';

    // ─── Energy HUD extras ───────────────────────────────────────────────────
    const energyHud = (
        <div className="flex items-center gap-2">
            <div className="flex flex-col items-center bg-emerald-200 px-3 py-1.5 rounded-xl border-2 border-black/10 shadow-neo-sm rotate-1">
                <span className="text-[9px] uppercase tracking-widest text-black font-black">ENERJİ</span>
                <div className="w-16 sm:w-20 h-3 bg-white rounded-full overflow-hidden border-2 border-black/10 relative">
                    <motion.div
                        className={`h-full border-r-2 border-black/10 ${energy < 20 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-400'}`}
                        animate={{
                            width: `${energy}%`,
                            backgroundColor: Date.now() - lastCollectionTime < 500 ? '#4ade80' : undefined,
                        }}
                    />
                </div>
            </div>
            <div className="flex flex-col items-center bg-rose-200 px-3 py-1.5 rounded-xl border-2 border-black/10 shadow-neo-sm -rotate-1">
                <span className="text-[9px] uppercase tracking-widest text-black font-black">SÜRE</span>
                <span className={`text-base font-black ${timeLeft < 10 ? 'text-rose-600 animate-pulse' : 'text-black'}`}>{timeLeft}s</span>
            </div>
        </div>
    );

    return (
        <ArcadeGameShell
            gameState={{ score, level, lives: 1, status: shellStatus }}
            gameMetadata={{
                id: 'arcade-dark-maze',
                title: 'KARANLIK LABİRENT',
                description: (
                    <>
                        <p>🔦 Fenerinle çıkışı bul! Pilleri topla ve yolu aydınlat.</p>
                        <p className="mt-2">🧠 Karanlıkta navigasyon ve uzamsal bellek testi!</p>
                    </>
                ),
                tuzoCode: '5.5.1 Uzamsal Akıl Yürütme',
                icon: <Brain className="w-14 h-14 text-black" strokeWidth={3} />,
                iconBgColor: 'bg-amber-400',
                containerBgColor: 'bg-sky-200 dark:bg-slate-900'
            }}
            onStart={startGame}
            onRestart={startGame}
            showLevel={true}
            showLives={false}
            hudExtras={energyHud}
        >
            <div className="h-full bg-sky-200 dark:bg-slate-900 text-black dark:text-white pt-4 pb-6 overflow-hidden flex flex-col font-sans touch-none [-webkit-tap-highlight-color:transparent] transition-colors duration-300">

                {/* Feedback Banner */}
                <ArcadeFeedbackBanner message={feedback?.message ?? null} type={feedback?.type} />

                <AnimatePresence>
                    {isIlluminated && <IlluminationEffect isIlluminated={isIlluminated} />}
                </AnimatePresence>

                <div className="container mx-auto max-w-4xl relative z-10 px-4 sm:px-6 flex flex-col flex-1">

                    {/* Game Area - Canvas + Joystick */}
                    <div ref={containerRef} className="relative flex flex-col xl:flex-row items-center xl:items-start justify-center gap-6 mt-4">
                        {/* Canvas */}
                        <div
                            className="bg-zinc-800 rounded-[3rem] p-2 sm:p-4 border-2 border-black/10 shadow-neo-sm relative overflow-hidden transition-all duration-500 transform rotate-1"
                            style={{ width: canvasSize + 16, height: canvasSize + 16 }}
                        >
                            <canvas
                                ref={canvasRef}
                                width={canvasSize}
                                height={canvasSize}
                                className="rounded-2xl touch-none border-2 border-black/10"
                                onTouchStart={handleTouchStart}
                                onTouchEnd={handleTouchEnd}
                            />

                            <AnimatePresence>
                                {energyEffects.map(effect => {
                                    const scale = canvasSize / (gridSize * CELL_SIZE);
                                    const scaledCellSize = CELL_SIZE * scale;
                                    return (
                                        <motion.div
                                            key={effect.id}
                                            initial={{ opacity: 0, scale: 0.5, y: 0 }}
                                            animate={{ opacity: 1, scale: 1.2, y: -40 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute z-20 pointer-events-none flex flex-col items-center"
                                            style={{
                                                left: effect.c * scaledCellSize + scaledCellSize / 2 + 8,
                                                top: effect.r * scaledCellSize + scaledCellSize / 2 + 8,
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
                                    );
                                })}
                            </AnimatePresence>

                            {/* Level Cleared Overlay (mid-game transition) */}
                            <AnimatePresence>
                                {showLevelUp && gameState === 'level_cleared' && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-30 p-4"
                                    >
                                        <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-5 sm:p-6 max-w-sm w-full text-center border-2 border-black/10 shadow-neo-sm transform -rotate-1 transition-colors duration-300">
                                            <div className="text-5xl sm:text-6xl mb-3">🎉</div>
                                            <h2 className="text-2xl sm:text-3xl font-black text-emerald-500 mb-3 uppercase tracking-tighter">BÖLÜM TAMAM!</h2>
                                            <p className="text-black dark:text-white bg-sky-200 dark:bg-sky-900/30 border-2 border-black/10 shadow-neo-sm rounded-xl p-2 mb-4 uppercase tracking-widest text-xs font-black rotate-2 transition-colors duration-300">
                                                +{ARCADE_SCORE_FORMULA(ARCADE_SCORE_BASE, level)} Puan
                                            </p>
                                            <button
                                                onClick={nextLevel}
                                                className="w-full py-3 bg-emerald-400 text-black font-black text-lg sm:text-xl tracking-widest uppercase rounded-xl sm:rounded-2xl hover:-translate-y-1 hover:shadow-neo-sm active:translate-y-2 active:shadow-none transition-all border-2 border-black/10 shadow-neo-sm"
                                            >
                                                SONRAKİ SEVİYE
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Virtual Joystick */}
                        {gameState === 'playing' && (
                            <div className="flex flex-col items-center gap-3 transform -rotate-1">
                                <div
                                    ref={joystickRef}
                                    className="relative w-32 h-32 sm:w-40 sm:h-40 xl:w-44 xl:h-44 rounded-full bg-slate-100 border-2 border-black/10 shadow-neo-sm mt-4 xl:mt-0 touch-none cursor-pointer"
                                    onTouchStart={(e) => { e.preventDefault(); handleJoystickStart(); }}
                                    onTouchMove={(e) => { e.preventDefault(); const touch = e.touches[0]; handleJoystickMove(touch.clientX, touch.clientY); }}
                                    onTouchEnd={handleJoystickEnd}
                                    onMouseDown={() => handleJoystickStart()}
                                    onMouseMove={(e) => isDragging && handleJoystickMove(e.clientX, e.clientY)}
                                    onMouseUp={handleJoystickEnd}
                                    onMouseLeave={handleJoystickEnd}
                                >
                                    <div className={`absolute top-2 left-1/2 -translate-x-1/2 transition-all duration-150 ${activeDirection === 'up' ? 'text-black scale-125' : 'text-slate-400'}`}>
                                        <ChevronUp size={24} strokeWidth={4} />
                                    </div>
                                    <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 transition-all duration-150 ${activeDirection === 'down' ? 'text-black scale-125' : 'text-slate-400'}`}>
                                        <ChevronDown size={24} strokeWidth={4} />
                                    </div>
                                    <div className={`absolute left-2 top-1/2 -translate-y-1/2 transition-all duration-150 ${activeDirection === 'left' ? 'text-black scale-125' : 'text-slate-400'}`}>
                                        <ChevronLeft size={24} strokeWidth={4} />
                                    </div>
                                    <div className={`absolute right-2 top-1/2 -translate-y-1/2 transition-all duration-150 ${activeDirection === 'right' ? 'text-black scale-125' : 'text-slate-400'}`}>
                                        <ChevronRight size={24} strokeWidth={4} />
                                    </div>

                                    <motion.div
                                        className="absolute top-1/2 left-1/2 w-12 h-12 sm:w-14 sm:h-14 xl:w-16 xl:h-16 rounded-full bg-amber-400 border-2 border-black/10"
                                        style={{
                                            x: joystickPos.x - KNOB_RADIUS,
                                            y: joystickPos.y - KNOB_RADIUS,
                                        }}
                                        animate={{
                                            scale: isDragging ? 0.95 : 1,
                                            boxShadow: isDragging
                                                ? '2px 2px 0 #000 inset'
                                                : '4px 4px 0 #000'
                                        }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                    />
                                </div>

                                <p className="text-black bg-white border-2 border-black/10 rounded-lg px-3 py-1 text-xs font-black uppercase tracking-widest text-center hidden xl:block shadow-neo-sm rotate-2">
                                    Fare ile sürükle<br />veya klavye okları
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Legend */}
                    <div className="mt-8 mb-4 flex gap-4 justify-center items-center text-xs font-black uppercase tracking-widest text-black dark:text-white flex-wrap">
                        <div className="flex items-center gap-2 bg-emerald-100 border-2 border-black/10 px-4 py-2 rounded-xl shadow-neo-sm -rotate-2"><Battery size={18} className="text-emerald-500 fill-emerald-500 stroke-black stroke-2" /> PİL: ENERJİ VERİR</div>
                        <div className="flex items-center gap-2 bg-amber-100 border-2 border-black/10 px-4 py-2 rounded-xl shadow-neo-sm rotate-1"><Brain size={18} className="text-amber-500 fill-amber-500 stroke-black stroke-2" /> BEYİN: AYDINLATIR</div>
                    </div>

                    {/* Mobile hint */}
                    <p className="xl:hidden text-center bg-white dark:bg-slate-700 border-2 border-black/10 dark:border-slate-600 inline-block mx-auto rounded-xl px-4 py-2 text-xs font-black tracking-widest shadow-neo-sm rotate-1 mt-2 text-black dark:text-white">
                        Joystick'i kullan
                    </p>
                </div>
            </div>
        </ArcadeGameShell>
    );
};

export default DarkMaze;
