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
            case 'UP': return <ArrowUp className="w-8 h-8" />;
            case 'DOWN': return <ArrowDown className="w-8 h-8" />;
            case 'LEFT': return <ArrowLeft className="w-8 h-8" />;
            case 'RIGHT': return <ArrowRight className="w-8 h-8" />;
        }
    };

    return (
        <div className="w-full h-full flex flex-col lg:flex-row gap-6 items-center">
            {/* Grid World */}
            <div className="flex-1 w-full aspect-square max-w-[500px] bg-slate-900 border-4 border-slate-800 rounded-3xl p-4 relative grid grid-cols-8 grid-rows-8 gap-1 shadow-2xl overflow-hidden">
                {[...Array(GRID_SIZE * GRID_SIZE)].map((_, i) => (
                    <div key={i} className="border border-slate-800/20 rounded-md" />
                ))}

                {/* Target */}
                <div
                    className="absolute transition-all duration-500 ease-in-out flex items-center justify-center"
                    style={{
                        width: `${100 / GRID_SIZE}%`,
                        height: `${100 / GRID_SIZE}%`,
                        left: `${(targetPos.x / GRID_SIZE) * 100}%`,
                        top: `${(targetPos.y / GRID_SIZE) * 100}%`,
                        padding: '4px'
                    }}
                >
                    <div className="w-full h-full bg-emerald-500/20 border-2 border-emerald-500 rounded-lg flex items-center justify-center animate-pulse">
                        <Target className="text-emerald-400 w-2/3 h-2/3" />
                    </div>
                </div>

                {/* Player */}
                <div
                    className="absolute transition-all duration-300 ease-out flex items-center justify-center z-10"
                    style={{
                        width: `${100 / GRID_SIZE}%`,
                        height: `${100 / GRID_SIZE}%`,
                        left: `${(playerPos.x / GRID_SIZE) * 100}%`,
                        top: `${(playerPos.y / GRID_SIZE) * 100}%`,
                        padding: '4px'
                    }}
                >
                    <div className={`w-full h-full rounded-lg shadow-lg flex items-center justify-center transition-all duration-200 ${feedback === 'correct' ? 'bg-emerald-500 scale-110' : feedback === 'wrong' ? 'animate-shake bg-red-600 scale-90' : 'bg-indigo-600'}`}>
                        <Navigation2 className="text-white w-2/3 h-2/3 fill-current rotate-45" />
                    </div>
                </div>

                <div className="absolute top-4 left-4 flex items-center gap-2 bg-slate-950/90 px-3 py-1 rounded-full border border-slate-700 backdrop-blur-sm z-20">
                    <ChevronRight className="w-3 h-3 text-indigo-400" />
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Hedefe İlerle</span>
                </div>
            </div>

            {/* Controls */}
            <div className="flex-1 w-full max-w-sm flex flex-col items-center justify-center gap-8 py-6">
                <div className="text-center bg-slate-900/40 p-6 rounded-3xl border border-slate-800 w-full">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mb-4">GİTMEK İSTEDİĞİN YÖN</p>
                    <div className={`text-6xl font-black transition-all duration-300 ${feedback === 'wrong' ? 'text-red-500' : feedback === 'correct' ? 'text-emerald-500' : 'text-white'}`}>
                        {currentMove?.word}
                    </div>
                    <div className="mt-6 flex flex-col gap-2">
                        <span className="inline-block px-3 py-1 bg-red-500/10 text-red-400 text-[10px] font-bold rounded-full border border-red-500/20">
                            KURAL: OKLAR TERS ÇALIŞIR!
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full">
                    {currentMove?.buttons.map((btn, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleDirectionClick(btn.iconDirection)}
                            className={`group h-24 rounded-3xl border-2 transition-all flex items-center justify-center active:scale-90 shadow-xl
                ${feedback === 'wrong' ? 'border-red-600 bg-red-600/10' : 'border-slate-800 bg-slate-900 hover:border-indigo-500 hover:bg-indigo-500/10'}
              `}
                        >
                            <div className={`transition-colors ${feedback === 'wrong' ? 'text-red-500' : 'text-slate-400 group-hover:text-indigo-400'}`}>
                                {renderArrowIcon(btn.iconDirection)}
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
