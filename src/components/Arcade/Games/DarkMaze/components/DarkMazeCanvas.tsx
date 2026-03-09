import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Battery } from 'lucide-react';

import { drawMazeScene, getScaledCellSize } from '../canvasRendering';
import type { Cell, EnergyEffect, GridPosition } from '../types';
import IlluminationEffect from './IlluminationEffect';
import { LevelClearedOverlay } from './Overlays';

interface DarkMazeCanvasProps {
    maze: Cell[][];
    playerPos: GridPosition;
    isIlluminated: boolean;
    energy: number;
    gridSize: number;
    canvasSize: number;
    energyEffects: EnergyEffect[];
    showLevelUp: boolean;
    levelScore: number;
    onNextLevel: () => void;
    onTouchStart: (x: number, y: number) => void;
    onTouchEnd: (x: number, y: number) => void;
}

const DarkMazeCanvas: React.FC<DarkMazeCanvasProps> = ({
    maze,
    playerPos,
    isIlluminated,
    energy,
    gridSize,
    canvasSize,
    energyEffects,
    showLevelUp,
    levelScore,
    onNextLevel,
    onTouchStart,
    onTouchEnd
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;

        if (!canvas || maze.length === 0) {
            return;
        }

        drawMazeScene({
            canvas,
            maze,
            playerPos,
            isIlluminated,
            energy,
            gridSize,
            canvasSize
        });
    }, [canvasSize, energy, gridSize, isIlluminated, maze, playerPos]);

    const scaledCellSize = getScaledCellSize(canvasSize, gridSize);

    return (
        <div
            className="bg-zinc-800 rounded-[3rem] p-2 sm:p-4 border-2 border-black/10 shadow-neo-sm relative overflow-hidden transition-all duration-500 transform rotate-1"
            style={{ width: canvasSize + 16, height: canvasSize + 16 }}
        >
            <canvas
                ref={canvasRef}
                width={canvasSize}
                height={canvasSize}
                className="rounded-2xl touch-none border-2 border-black/10"
                onTouchStart={(event) => {
                    const touch = event.touches[0];
                    onTouchStart(touch.clientX, touch.clientY);
                }}
                onTouchEnd={(event) => {
                    const touch = event.changedTouches[0];
                    onTouchEnd(touch.clientX, touch.clientY);
                }}
            />

            <AnimatePresence>
                {isIlluminated && <IlluminationEffect isIlluminated={isIlluminated} />}
            </AnimatePresence>

            <AnimatePresence>
                {energyEffects.map((effect) => (
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
                ))}
            </AnimatePresence>

            <AnimatePresence>
                {showLevelUp && (
                    <LevelClearedOverlay
                        onNextLevel={onNextLevel}
                        scoreGain={levelScore}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default DarkMazeCanvas;
