import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useGamePersistence } from '../../../../hooks/useGamePersistence';
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
    Play,
    Trophy,
    ArrowLeft,
    ArrowUp,
    ArrowDown,
    Compass
} from 'lucide-react';

type GameState = 'idle' | 'playing' | 'finished';

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

    const [gameState, setGameState] = useState<GameState>('idle');
    const [currentLevel, setCurrentLevel] = useState(0);
    const [grid, setGrid] = useState<Cell[][]>([]);
    const [solution, setSolution] = useState<[number, number][]>([]);
    const [userPath, setUserPath] = useState<[number, number][]>([]);
    const [playerPosition, setPlayerPosition] = useState<[number, number] | null>(null);
    const [score, setScore] = useState(0);
    const [showLevelWin, setShowLevelWin] = useState(false);
    const [moves, setMoves] = useState(0);

    // Auto-start from Arcade Hub
    useEffect(() => {
        if (location.state?.autoStart && gameState === 'idle') {
            startGame();
        }
    }, [location.state]);

    const startGame = useCallback(() => {
        setGameState('playing');
        setCurrentLevel(0);
        setScore(0);
        setMoves(0);
        gameStartTimeRef.current = Date.now();
        generateLevel(0);
    }, []);

    const generateLevel = async (levelIdx: number) => {
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
        if (gameState !== 'playing' || !playerPosition || showLevelWin) return;

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
                const levelTime = Math.floor((Date.now() - levelStartTimeRef.current) / 1000);
                const levelScore = Math.max(100, 500 - levelTime * 5 - moves * 2);
                setScore(s => s + levelScore);
                setShowLevelWin(true);
            }
        }
    }, [playerPosition, grid, gameState, currentLevel, showLevelWin, moves]);

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
        setGameState('finished');
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
    };

    const showSolution = () => {
        if (solution.length > 0) {
            setSolution([]);
        } else {
            const path = solveMaze(grid);
            setSolution(path);
            setScore(s => Math.max(0, s - 50)); // Penalty for showing solution
        }
    };

    // Start Overlay
    if (gameState === 'idle') {
        return (
            <div className="min-h-screen bg-slate-950 text-white pt-24 pb-12 flex flex-col items-center justify-center">
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-10 max-w-md w-full text-center border border-white/20 mx-4">
                    <div
                        className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-[40%] flex items-center justify-center mx-auto mb-6"
                        style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }}
                    >
                        <Compass size={48} className="text-white" />
                    </div>
                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400 tracking-tight mb-4">
                        Labirent Ustası
                    </h1>
                    <p className="text-slate-400 font-medium text-lg mb-4 max-w-md mx-auto">
                        Labirentten çıkış yolunu bul! Klavye okları veya ekrandaki butonları kullan.
                    </p>
                    <div className="bg-indigo-500/20 text-indigo-300 text-xs px-4 py-2 rounded-full mb-6 inline-block border border-indigo-500/30">
                        TUZÖ 3.1.1 Labirent Navigasyonu / Yön Bulma
                    </div>
                    <button
                        onClick={startGame}
                        className="w-full px-12 py-4 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-2xl font-black text-xl active:scale-95 transition-all flex items-center gap-3 justify-center mx-auto"
                        style={{ boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)' }}
                    >
                        <Play size={24} /> BAŞLA
                    </button>
                    <Link
                        to="/bilsem-zeka"
                        className="mt-4 inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors font-bold text-sm"
                    >
                        <ArrowLeft size={16} /> BİLSEM Zeka'ya Dön
                    </Link>
                </div>
            </div>
        );
    }

    // Finished Overlay
    if (gameState === 'finished') {
        return (
            <div className="min-h-screen bg-slate-950 text-white pt-24 pb-12 flex flex-col items-center justify-center">
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-10 max-w-md w-full text-center border border-white/20 mx-4">
                    <div
                        className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-[40%] flex items-center justify-center mx-auto mb-6"
                        style={{ boxShadow: 'inset 0 -6px 12px rgba(0,0,0,0.2), inset 0 6px 12px rgba(255,255,255,0.4), 0 6px 16px rgba(0,0,0,0.3)' }}
                    >
                        <Trophy size={40} className="text-white" />
                    </div>
                    <h2 className="text-4xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                        Tebrikler!
                    </h2>
                    <p className="text-2xl text-white mb-2">Skor: <span className="text-indigo-400 font-black">{score}</span></p>
                    <p className="text-slate-400 mb-2">Tamamlanan Seviye: {currentLevel + 1}/{LEVELS.length}</p>
                    <button
                        onClick={startGame}
                        className="w-full mt-8 px-12 py-4 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-2xl font-black text-xl active:scale-95 transition-all"
                        style={{ boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)' }}
                    >
                        TEKRAR OYNA
                    </button>
                    <Link
                        to="/bilsem-zeka"
                        className="mt-4 inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors font-bold text-sm"
                    >
                        <ArrowLeft size={16} /> BİLSEM Zeka'ya Dön
                    </Link>
                </div>
            </div>
        );
    }

    const level = LEVELS[currentLevel];

    return (
        <div className="min-h-screen bg-slate-950 text-white pt-20 flex flex-col">
            {/* Header */}
            <header className="px-6 py-3 flex items-center justify-between bg-slate-900/80 border-b border-slate-800">
                <div className="flex items-center gap-4">
                    <Link
                        to="/bilsem-zeka"
                        className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={18} />
                    </Link>
                    <div className="p-2 bg-indigo-500 rounded-xl">
                        <Compass className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-sm font-black text-indigo-400 uppercase tracking-widest">
                            Labirent Ustası
                        </h1>
                        <p className="text-[10px] text-white/40 font-bold">
                            Seviye {currentLevel + 1}: {level.name}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="px-3 py-1 bg-slate-800 rounded-full text-sm">
                        <span className="text-slate-400 mr-2">Skor:</span>
                        <span className="text-indigo-400 font-bold">{score}</span>
                    </div>
                    <div className="px-3 py-1 bg-slate-800 rounded-full text-sm">
                        <span className="text-slate-400 mr-2">Hamle:</span>
                        <span className="text-white font-bold">{moves}</span>
                    </div>
                    <button
                        onClick={showSolution}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${solution.length > 0
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}
                    >
                        {solution.length > 0 ? 'Gizle' : 'Çözüm (-50)'}
                    </button>
                    <button
                        onClick={finishGame}
                        className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-xs font-bold"
                    >
                        Bitir
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-4 flex items-center justify-center relative overflow-hidden">
                <div className="relative">
                    <MazeCanvas
                        grid={grid}
                        solution={solution}
                        userPath={userPath}
                        playerPosition={playerPosition}
                        cellSize={Math.min(25, 600 / level.rows)}
                        onMoveRequest={movePlayer}
                    />
                </div>

                {/* Level Win Overlay */}
                {showLevelWin && (
                    <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/80 backdrop-blur-md">
                        <div className="bg-slate-900 border-2 border-indigo-500 p-8 rounded-3xl shadow-2xl text-center max-w-sm">
                            <Trophy size={60} className="text-indigo-400 mx-auto mb-4" />
                            <h2 className="text-2xl font-black text-white mb-2">
                                Seviye {currentLevel + 1} Tamam!
                            </h2>
                            <p className="text-slate-400 mb-6">
                                {currentLevel < LEVELS.length - 1
                                    ? 'Sonraki seviyeye geçmeye hazır mısın?'
                                    : 'Tüm seviyeleri tamamladın!'}
                            </p>
                            <button
                                onClick={nextLevel}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl"
                            >
                                {currentLevel < LEVELS.length - 1 ? 'Sonraki Seviye' : 'Bitir'}
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {/* Mobile Controls */}
            <div className="md:hidden fixed bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-10">
                <button
                    className="w-14 h-14 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center active:bg-indigo-600"
                    onTouchStart={(e) => { e.preventDefault(); movePlayer(-1, 0); }}
                >
                    <ArrowUp size={24} />
                </button>
                <div className="flex gap-3">
                    <button
                        className="w-14 h-14 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center active:bg-indigo-600"
                        onTouchStart={(e) => { e.preventDefault(); movePlayer(0, -1); }}
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <button
                        className="w-14 h-14 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center active:bg-indigo-600"
                        onTouchStart={(e) => { e.preventDefault(); movePlayer(1, 0); }}
                    >
                        <ArrowDown size={24} />
                    </button>
                    <button
                        className="w-14 h-14 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center active:bg-indigo-600"
                        onTouchStart={(e) => { e.preventDefault(); movePlayer(0, 1); }}
                    >
                        <ArrowLeft size={24} className="rotate-180" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LabirentUstasi;
