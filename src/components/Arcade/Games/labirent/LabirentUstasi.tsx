import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useGamePersistence } from '../../../../hooks/useGamePersistence';
import ArcadeGameShell from '../../Shared/ArcadeGameShell';
import ArcadeFeedbackBanner from '../../Shared/ArcadeFeedbackBanner';
import { ARCADE_SCORE_FORMULA, ARCADE_SCORE_BASE, ARCADE_FEEDBACK_TEXTS } from '../../Shared/ArcadeConstants';
import {
    createEmptyGrid,
    generateDFSMaze,
    generatePrimsMaze,
    generateHuntAndKill,
    generateBinaryTree,
    solveMaze
} from './services/mazeGenerator';
import { Cell, AlgorithmType } from './types';
import MazeCanvas from './components/MazeCanvas';
import {
    ArrowUp,
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type GamePhase = 'idle' | 'playing' | 'finished';

const LEVELS = [
    { rows: 8, cols: 10, algorithm: AlgorithmType.DFS, name: "Kolay" },
    { rows: 12, cols: 15, algorithm: AlgorithmType.PRIM, name: "Orta" },
    { rows: 15, cols: 20, algorithm: AlgorithmType.HUNT_AND_KILL, name: "Zor" },
    { rows: 20, cols: 25, algorithm: AlgorithmType.BINARY_TREE, name: "Uzman" },
    { rows: 25, cols: 30, algorithm: AlgorithmType.DFS, name: "Efsane" }
];

const LabirentUstasi: React.FC = () => {
    const location = useLocation();
    const { saveGamePlay } = useGamePersistence();
    const gameStartTimeRef = useRef<number>(0);
    const levelStartTimeRef = useRef<number>(0);
    const isResolvingRef = useRef(false);
    const hasSavedRef = useRef(false);

    const [gamePhase, setGamePhase] = useState<GamePhase>('idle');
    const [currentLevel, setCurrentLevel] = useState(0);
    const [grid, setGrid] = useState<Cell[][]>([]);
    const [solution, setSolution] = useState<[number, number][]>([]);
    const [userPath, setUserPath] = useState<[number, number][]>([]);
    const [playerPosition, setPlayerPosition] = useState<[number, number] | null>(null);
    const [score, setScore] = useState(0);
    const [showLevelWin, setShowLevelWin] = useState(false);
    const [moves, setMoves] = useState(0);
    const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Joystick State
    const joystickRef = useRef<HTMLDivElement>(null);
    const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const lastMoveRef = useRef<number>(0);
    const JOYSTICK_RADIUS = 50;
    const MOVE_THRESHOLD = 25;
    const MOVE_COOLDOWN = 150;

    const startGame = useCallback(() => {
        window.scrollTo(0, 0);
        setGamePhase('playing');
        setCurrentLevel(0);
        setScore(0);
        setMoves(0);
        setFeedback(null);
        setShowLevelWin(false);
        hasSavedRef.current = false;
        isResolvingRef.current = false;
        gameStartTimeRef.current = Date.now();
        generateLevel(0);
    }, []);

    // Auto-start from Arcade Hub
    useEffect(() => {
        if (location.state?.autoStart && gamePhase === 'idle') {
            startGame();
        }
    }, [gamePhase, location.state, startGame]);

    const generateLevel = (levelIdx: number) => {
        const level = LEVELS[levelIdx];
        const initialGrid = createEmptyGrid(level.rows, level.cols);

        let generator;
        switch (level.algorithm) {
            case AlgorithmType.DFS: generator = generateDFSMaze(initialGrid); break;
            case AlgorithmType.PRIM: generator = generatePrimsMaze(initialGrid); break;
            case AlgorithmType.HUNT_AND_KILL: generator = generateHuntAndKill(initialGrid); break;
            case AlgorithmType.BINARY_TREE: generator = generateBinaryTree(initialGrid); break;
            default: generator = generateDFSMaze(initialGrid);
        }

        let lastValue;
        for (const step of generator) {
            lastValue = step;
        }

        if (lastValue) {
            setGrid(lastValue);
            setSolution([]);
            setUserPath([[0, 0]]);
            setPlayerPosition([0, 0]);
            levelStartTimeRef.current = Date.now();
        }
    };

    const movePlayer = useCallback((dr: number, dc: number) => {
        if (gamePhase !== 'playing' || !playerPosition || showLevelWin || isResolvingRef.current) return;

        const level = LEVELS[currentLevel];
        const [r, c] = playerPosition;
        const nr = r + dr;
        const nc = c + dc;

        if (nr < 0 || nr >= level.rows || nc < 0 || nc >= level.cols) return;

        const currentCell = grid[r][c];
        let canMove = false;

        if (dr === -1 && !currentCell.walls.top) canMove = true;
        if (dr === 1 && !currentCell.walls.bottom) canMove = true;
        if (dc === -1 && !currentCell.walls.left) canMove = true;
        if (dc === 1 && !currentCell.walls.right) canMove = true;

        if (canMove) {
            setPlayerPosition([nr, nc]);
            setMoves(m => m + 1);
            setUserPath(prev => {
                if (prev.length > 0) {
                    const [lr, lc] = prev[prev.length - 1];
                    if (lr === nr && lc === nc) return prev;
                }
                return [...prev, [nr, nc]];
            });

            // Check win condition
            if (nr === level.rows - 1 && nc === level.cols - 1) {
                isResolvingRef.current = true;
                const levelScore = ARCADE_SCORE_FORMULA(ARCADE_SCORE_BASE, currentLevel + 1);
                setScore(s => s + levelScore);

                const msgs = ARCADE_FEEDBACK_TEXTS.SUCCESS_MESSAGES;
                setFeedback({ message: msgs[Math.floor(Math.random() * msgs.length)], type: 'success' });

                setTimeout(() => {
                    setFeedback(null);
                    setShowLevelWin(true);
                    isResolvingRef.current = false;
                }, 1200);
            }
        }
    }, [currentLevel, gamePhase, grid, playerPosition, showLevelWin]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowUp': case 'w': movePlayer(-1, 0); break;
                case 'ArrowDown': case 's': movePlayer(1, 0); break;
                case 'ArrowLeft': case 'a': movePlayer(0, -1); break;
                case 'ArrowRight': case 'd': movePlayer(0, 1); break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [movePlayer]);

    // Joystick Handlers
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
                movePlayer(0, dx > 0 ? 1 : -1);
            } else {
                movePlayer(dy > 0 ? 1 : -1, 0);
            }
        }
    }, [isDragging, movePlayer]);

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

    const nextLevel = () => {
        setShowLevelWin(false);
        if (currentLevel >= LEVELS.length - 1) {
            finishGame();
        } else {
            setCurrentLevel(l => l + 1);
            setMoves(0);
            generateLevel(currentLevel + 1);
        }
    };

    const finishGame = () => {
        if (isResolvingRef.current) return;
        isResolvingRef.current = true;
        setGamePhase('finished');
        if (!hasSavedRef.current) {
            hasSavedRef.current = true;
            const duration = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
            saveGamePlay({
                game_id: 'arcade-labirent-ustasi',
                score_achieved: score,
                duration_seconds: duration,
                metadata: {
                    game_name: 'Labirent Ustası',
                    levels_completed: currentLevel + 1,
                    total_moves: moves
                }
            });
        }
    };

    const showSolutionToggle = () => {
        if (solution.length > 0) {
            setSolution([]);
        } else {
            const path = solveMaze(grid);
            setSolution(path);
            setScore(s => Math.max(0, s - 50));
            setFeedback({ message: 'Çözüm gösteriliyor... (-50 puan)', type: 'error' });
            setTimeout(() => setFeedback(null), 2000);
        }
    };

    // ─── Shell status mapping ────────────────────────────────────────────
    const shellStatus: 'START' | 'PLAYING' | 'GAME_OVER' =
        gamePhase === 'idle' ? 'START' :
            gamePhase === 'finished' ? 'GAME_OVER' : 'PLAYING';

    const level = LEVELS[currentLevel] ?? LEVELS[0];

    // ─── HUD Extras ──────────────────────────────────────────────────────
    const hudExtras = (
        <div className="flex items-center gap-2">
            <span className="bg-sky-200 dark:bg-sky-800 px-2 py-0.5 rounded-lg border-2 border-black/10 text-[10px] font-black uppercase">
                Hamle: <span className="text-sm">{moves}</span>
            </span>
            <span className="bg-amber-200 dark:bg-amber-800 px-2 py-0.5 rounded-lg border-2 border-black/10 text-[10px] font-black uppercase">
                {level.name}
            </span>
        </div>
    );

    return (
        <ArcadeGameShell
            gameState={{ score, level: currentLevel + 1, lives: 1, status: shellStatus }}
            gameMetadata={{
                id: 'arcade-labirent-ustasi',
                title: 'LABİRENT USTASI',
                description: (
                    <>
                        <p>🧭 Başlangıçtan bitişe ulaş! Yön tuşları veya joystick kullan.</p>
                        <p className="mt-2">🧠 Labirent navigasyonu ve yön bulma testi!</p>
                    </>
                ),
                tuzoCode: '3.1.1 Labirent Navigasyonu',
                icon: <Compass className="w-14 h-14 text-black" strokeWidth={3} />,
                iconBgColor: 'bg-indigo-400',
                containerBgColor: 'bg-indigo-200 dark:bg-slate-900'
            }}
            onStart={startGame}
            onRestart={startGame}
            showLevel={true}
            showLives={false}
            hudExtras={hudExtras}
            allowMobileScroll
        >
            <div className="flex-1 flex flex-col bg-indigo-200 dark:bg-slate-900 text-black dark:text-white font-sans transition-colors duration-300" style={{ WebkitTapHighlightColor: 'transparent' }}>

                {/* Feedback Banner */}
                <ArcadeFeedbackBanner message={feedback?.message ?? null} type={feedback?.type} />

                {/* Action buttons */}
                <div className="flex items-center justify-end gap-3 px-4 sm:px-8 pt-4">
                    <button
                        onClick={showSolutionToggle}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border-2 border-black/10 shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-sm active:translate-y-1 active:shadow-none transition-all ${solution.length > 0
                            ? 'bg-amber-300 text-black'
                            : 'bg-emerald-300 text-black'
                            }`}
                    >
                        {solution.length > 0 ? 'Gizle' : 'Çözüm (-50)'}
                    </button>
                    <button
                        onClick={finishGame}
                        className="px-4 py-2 bg-rose-400 text-black border-2 border-black/10 shadow-neo-sm rounded-xl text-xs font-black uppercase tracking-widest hover:-translate-y-1 hover:shadow-neo-sm active:translate-y-1 active:shadow-none transition-all"
                    >
                        Bitir
                    </button>
                </div>

                {/* Main Content */}
                <main className="flex-1 p-4 sm:p-8 flex items-start justify-center relative overflow-hidden">
                    <div className="flex flex-col xl:flex-row items-center xl:items-start justify-center gap-8 sm:gap-12 w-full max-w-7xl">
                        {/* Maze Canvas Wrapper */}
                        <div className="relative bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-[2rem] border-2 border-black/10 dark:border-slate-700 shadow-neo-sm dark:shadow-[16px_16px_0_#0f172a] flex items-center justify-center max-w-full overflow-hidden transition-colors duration-300">
                            <MazeCanvas
                                grid={grid}
                                solution={solution}
                                userPath={userPath}
                                playerPosition={playerPosition}
                                cellSize={Math.min(
                                    40,
                                    Math.min(
                                        (window.innerWidth - 200) / level.cols,
                                        (window.innerHeight - 250) / level.rows
                                    )
                                )}
                                onMoveRequest={movePlayer}
                            />
                        </div>

                        {/* Virtual Joystick */}
                        <div className="flex flex-col items-center gap-4 bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-[2rem] border-2 border-black/10 dark:border-slate-700 shadow-neo-sm dark:shadow-[12px_12px_0_#0f172a] transition-colors duration-300">
                            <div
                                ref={joystickRef}
                                className="relative w-32 h-32 sm:w-40 sm:h-40 xl:w-44 xl:h-44 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-black/10 dark:border-slate-600 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1)] touch-none cursor-pointer transition-colors duration-300"
                                onTouchStart={(e) => { e.preventDefault(); handleJoystickStart(); }}
                                onTouchMove={(e) => { e.preventDefault(); const touch = e.touches[0]; handleJoystickMove(touch.clientX, touch.clientY); }}
                                onTouchEnd={handleJoystickEnd}
                                onMouseDown={() => handleJoystickStart()}
                                onMouseMove={(e) => isDragging && handleJoystickMove(e.clientX, e.clientY)}
                                onMouseUp={handleJoystickEnd}
                                onMouseLeave={handleJoystickEnd}
                            >
                                <div className={`absolute top-2 left-1/2 -translate-x-1/2 transition-all duration-150 ${activeDirection === 'up' ? 'text-black dark:text-white scale-125' : 'text-slate-400 dark:text-slate-500'}`}>
                                    <ArrowUp size={24} strokeWidth={4} />
                                </div>
                                <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 transition-all duration-150 ${activeDirection === 'down' ? 'text-black dark:text-white scale-125' : 'text-slate-400 dark:text-slate-500'}`}>
                                    <ArrowDown size={24} strokeWidth={4} />
                                </div>
                                <div className={`absolute left-2 top-1/2 -translate-y-1/2 transition-all duration-150 ${activeDirection === 'left' ? 'text-black dark:text-white scale-125' : 'text-slate-400 dark:text-slate-500'}`}>
                                    <ArrowLeft size={24} strokeWidth={4} />
                                </div>
                                <div className={`absolute right-2 top-1/2 -translate-y-1/2 transition-all duration-150 ${activeDirection === 'right' ? 'text-black dark:text-white scale-125' : 'text-slate-400 dark:text-slate-500'}`}>
                                    <ArrowRight size={24} strokeWidth={4} />
                                </div>

                                {/* Joystick knob */}
                                <div
                                    className="absolute top-1/2 left-1/2 w-16 h-16 sm:w-20 sm:h-20 xl:w-24 xl:h-24 rounded-full bg-rose-500 shadow-neo-sm border-2 border-black/10 transition-transform duration-75 flex items-center justify-center"
                                    style={{
                                        transform: `translate(calc(-50% + ${joystickPos.x}px), calc(-50% + ${joystickPos.y}px)) scale(${isDragging ? 0.95 : 1})`,
                                    }}
                                >
                                    <div className="w-6 h-6 rounded-full bg-white/30 absolute top-2 left-3 blur-[1px]"></div>
                                </div>
                            </div>

                            <p className="text-black font-black uppercase text-center border-2 border-black/10 dark:border-slate-700 px-4 py-2 rounded-xl bg-yellow-300 shadow-neo-sm -rotate-2">
                                YÖNLENDİR!
                            </p>
                        </div>
                    </div>

                    {/* Level Win Overlay (mid-game transition) */}
                    <AnimatePresence>
                        {showLevelWin && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                            >
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.8, opacity: 0 }}
                                    className="bg-white dark:bg-slate-800 border-2 border-black/10 dark:border-slate-700 p-8 sm:p-12 rounded-[3rem] shadow-neo-sm dark:shadow-[16px_16px_0_#0f172a] text-center max-w-sm sm:max-w-md w-full transform rotate-2 transition-colors duration-300"
                                >
                                    <div className="text-6xl mb-4">🏆</div>
                                    <h2 className="text-3xl sm:text-4xl font-black text-emerald-500 mb-4 uppercase tracking-tighter">
                                        Seviye {currentLevel + 1} Tamam!
                                    </h2>
                                    <p className="text-xl font-black text-rose-500 mb-8 bg-slate-100 dark:bg-slate-700 border-2 border-black/10 inline-block px-6 py-2 rounded-xl shadow-neo-sm -rotate-2 transition-colors duration-300">
                                        +{ARCADE_SCORE_FORMULA(ARCADE_SCORE_BASE, currentLevel + 1)} puan
                                    </p>
                                    <button
                                        onClick={nextLevel}
                                        className="w-full px-8 py-5 bg-sky-400 text-black rounded-2xl font-black text-2xl active:translate-y-2 active:shadow-none hover:-translate-y-1 hover:shadow-neo-sm transition-all uppercase tracking-widest border-2 border-black/10 shadow-neo-sm"
                                    >
                                        {currentLevel >= LEVELS.length - 1 ? 'BİTİR' : 'SONRAKİ SEVİYE'}
                                    </button>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>
        </ArcadeGameShell>
    );
};

export default LabirentUstasi;
