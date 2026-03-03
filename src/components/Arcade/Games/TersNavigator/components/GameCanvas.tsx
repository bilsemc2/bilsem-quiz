import React, { useState, useRef, useCallback, useEffect } from 'react';
import { DIRECTIONS, GRID_SIZE } from '../constants';
import { StroopMove, Position, Direction } from '../types';
import { ChevronRight, Target, Navigation2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface GameCanvasProps {
    onRoundComplete: (isCorrect: boolean, reactionTime: number) => void;
}

const getOpposite = (dir: Direction): Direction => {
    switch (dir) {
        case 'UP': return 'DOWN';
        case 'DOWN': return 'UP';
        case 'LEFT': return 'RIGHT';
        case 'RIGHT': return 'LEFT';
    }
};

const GameCanvas: React.FC<GameCanvasProps> = ({ onRoundComplete }) => {
    const [playerPos, setPlayerPos] = useState<Position>({ x: 0, y: GRID_SIZE - 1 });
    const [targetPos, setTargetPos] = useState<Position>({ x: GRID_SIZE - 1, y: 0 });
    const [currentMove, setCurrentMove] = useState<StroopMove | null>(null);
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
    const startTime = useRef<number>(Date.now());
    const moveIdCounter = useRef(0);

    const generateMove = useCallback((currentP: Position, targetP: Position) => {
        const possibleDirs: Direction[] = [];
        if (targetP.y < currentP.y) possibleDirs.push('UP');
        if (targetP.y > currentP.y) possibleDirs.push('DOWN');
        if (targetP.x < currentP.x) possibleDirs.push('LEFT');
        if (targetP.x > currentP.x) possibleDirs.push('RIGHT');

        const actualDir = possibleDirs.length > 0
            ? possibleDirs[Math.floor(Math.random() * possibleDirs.length)]
            : DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)].type;

        const targetDef = DIRECTIONS.find(d => d.type === actualDir)!;

        const buttons = DIRECTIONS.map(d => ({
            direction: d.type,
            iconDirection: d.type
        })).sort(() => Math.random() - 0.5);

        setCurrentMove({
            id: moveIdCounter.current++,
            word: targetDef.label,
            targetDirection: actualDir,
            buttons
        });

        startTime.current = Date.now();
    }, []);

    const resetPositions = useCallback(() => {
        const newP = { x: 0, y: GRID_SIZE - 1 };
        const newT = {
            x: Math.floor(Math.random() * (GRID_SIZE - 2)) + 2,
            y: Math.floor(Math.random() * (GRID_SIZE - 2))
        };
        setPlayerPos(newP);
        setTargetPos(newT);
        generateMove(newP, newT);
    }, [generateMove]);

    useEffect(() => {
        resetPositions();
    }, [resetPositions]);

    const handleDirectionClick = (clickedIconDir: Direction) => {
        if (!currentMove) return;

        const isCorrect = clickedIconDir === getOpposite(currentMove.targetDirection);
        const reactionTime = (Date.now() - startTime.current) / 1000;

        if (isCorrect) {
            setFeedback('correct');
            const moveDir = currentMove.targetDirection;

            setPlayerPos(prev => {
                let newX = prev.x;
                let newY = prev.y;
                if (moveDir === 'UP') newY = Math.max(0, prev.y - 1);
                if (moveDir === 'DOWN') newY = Math.min(GRID_SIZE - 1, prev.y + 1);
                if (moveDir === 'LEFT') newX = Math.max(0, prev.x - 1);
                if (moveDir === 'RIGHT') newX = Math.min(GRID_SIZE - 1, prev.x + 1);

                if (newX === targetPos.x && newY === targetPos.y) {
                    setTimeout(() => resetPositions(), 300);
                } else {
                    setTimeout(() => generateMove({ x: newX, y: newY }, targetPos), 150);
                }

                return { x: newX, y: newY };
            });

            onRoundComplete(true, reactionTime);
            setTimeout(() => setFeedback(null), 150);
        } else {
            setFeedback('wrong');
            onRoundComplete(false, reactionTime);
            setTimeout(() => setFeedback(null), 400);
        }
    };

    const renderArrowIcon = (dir: Direction) => {
        switch (dir) {
            case 'UP': return <ArrowUp className="w-6 h-6 sm:w-8 sm:h-8" />;
            case 'DOWN': return <ArrowDown className="w-6 h-6 sm:w-8 sm:h-8" />;
            case 'LEFT': return <ArrowLeft className="w-6 h-6 sm:w-8 sm:h-8" />;
            case 'RIGHT': return <ArrowRight className="w-6 h-6 sm:w-8 sm:h-8" />;
        }
    };

    return (
        <div className="w-full h-full flex flex-col lg:flex-row gap-4 sm:gap-6 items-center px-2 sm:px-0">
            {/* Grid World */}
            <div className="flex-shrink-0 w-full aspect-square max-w-[280px] sm:max-w-[400px] lg:max-w-[500px] bg-white dark:bg-slate-800 border-2 border-black/10 dark:border-slate-700 rounded-3xl p-2 sm:p-4 relative grid grid-cols-8 grid-rows-8 gap-0.5 sm:gap-1 shadow-neo-sm dark:shadow-[12px_12px_0_#0f172a] overflow-hidden -rotate-1 transition-colors duration-300">
                {[...Array(GRID_SIZE * GRID_SIZE)].map((_, i) => (
                    <div key={i} className="bg-sky-50 dark:bg-slate-700/50 border-2 border-black/10 dark:border-black/30 rounded-md transition-colors duration-300" />
                ))}

                {/* Target */}
                <div
                    className="absolute transition-all duration-500 ease-in-out flex items-center justify-center p-1"
                    style={{
                        width: `${100 / GRID_SIZE}%`,
                        height: `${100 / GRID_SIZE}%`,
                        left: `${(targetPos.x / GRID_SIZE) * 100}%`,
                        top: `${(targetPos.y / GRID_SIZE) * 100}%`
                    }}
                >
                    <div className="w-full h-full bg-emerald-200 border-2 border-black/10 dark:border-slate-800 rounded-xl flex items-center justify-center shadow-neo-sm rotate-3 animate-pulse transition-colors duration-300">
                        <Target className="text-black w-2/3 h-2/3" strokeWidth={3} />
                    </div>
                </div>

                {/* Player */}
                <div
                    className="absolute transition-all duration-300 ease-out flex items-center justify-center z-10 p-1"
                    style={{
                        width: `${100 / GRID_SIZE}%`,
                        height: `${100 / GRID_SIZE}%`,
                        left: `${(playerPos.x / GRID_SIZE) * 100}%`,
                        top: `${(playerPos.y / GRID_SIZE) * 100}%`
                    }}
                >
                    <div className={`w-full h-full border-2 border-black/10 dark:border-slate-800 rounded-xl flex items-center justify-center transition-all duration-200 shadow-neo-sm ${feedback === 'correct' ? 'bg-emerald-400 scale-110' : feedback === 'wrong' ? 'animate-shake bg-rose-500 scale-90' : 'bg-indigo-400 -rotate-3'}`}>
                        <Navigation2 className="text-black w-2/3 h-2/3 fill-current rotate-45" strokeWidth={3} />
                    </div>
                </div>

                <div className="absolute top-2 sm:top-4 left-2 sm:left-4 flex items-center gap-1 sm:gap-2 bg-yellow-300 dark:bg-yellow-500 px-3 py-1 rounded-xl border-2 border-black/10 dark:border-slate-800 shadow-neo-sm z-20 rotate-1 transition-colors duration-300">
                    <ChevronRight className="w-4 h-4 text-black dark:text-slate-900 transition-colors duration-300" strokeWidth={3} />
                    <span className="text-[10px] sm:text-xs font-black text-black dark:text-slate-900 uppercase tracking-widest transition-colors duration-300">Hedefe İlerle</span>
                </div>
            </div>

            {/* Controls */}
            <div className="flex-shrink-0 w-full max-w-xs sm:max-w-sm flex flex-col items-center justify-center gap-4 sm:gap-8 py-2 sm:py-6">
                <div className="text-center bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-3xl border-2 border-black/10 dark:border-slate-700 shadow-neo-sm dark:shadow-[12px_12px_0_#0f172a] w-full rotate-2 transition-colors duration-300">
                    <p className="inline-block bg-sky-200 dark:bg-slate-700 text-black dark:text-white border-2 border-black/10 dark:border-slate-800 shadow-neo-sm px-3 py-1 rounded-xl text-xs font-black uppercase tracking-[0.2em] mb-4 -rotate-2 transition-colors duration-300">GİTMEK İSTEDİĞİN YÖN</p>
                    <div className={`text-5xl sm:text-7xl font-black transition-all duration-300 uppercase drop-shadow-[4px_4px_0_rgba(0,0,0,0.1)] ${feedback === 'wrong' ? 'text-rose-500' : feedback === 'correct' ? 'text-emerald-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
                        {currentMove?.word}
                    </div>
                    <div className="mt-6 flex flex-col gap-2">
                        <span className="inline-block px-4 py-2 bg-rose-200 dark:bg-rose-900/50 text-black dark:text-white text-xs font-black rounded-xl border-2 border-black/10 dark:border-slate-800 shadow-neo-sm rotate-1 transition-colors duration-300">
                            AŞAĞIDAKİ OKLAR TERS ÇALIŞIR!
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
                    {currentMove?.buttons.map((btn, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleDirectionClick(btn.iconDirection)}
                            onTouchStart={(e) => {
                                e.preventDefault();
                                handleDirectionClick(btn.iconDirection);
                            }}
                            className={`group h-20 sm:h-28 rounded-3xl border-4 transition-all flex items-center justify-center active:translate-y-2 active:shadow-none shadow-neo-sm touch-none
                ${feedback === 'wrong' ? 'border-black/10 dark:border-slate-800 bg-rose-400' : 'border-black/10 dark:border-slate-800 bg-white dark:bg-slate-700 hover:-translate-y-1 hover:shadow-neo-sm dark:hover:shadow-[12px_12px_0_#0f172a]'}
              `}

                        >
                            <div className={`transition-colors duration-300 ${feedback === 'wrong' ? 'text-black dark:text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-black dark:group-hover:text-white'}`}>
                                {React.cloneElement(renderArrowIcon(btn.iconDirection) as React.ReactElement, { strokeWidth: 4 })}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.1s ease-in-out 3;
        }
      `}</style>
        </div>
    );
};

export default GameCanvas;
