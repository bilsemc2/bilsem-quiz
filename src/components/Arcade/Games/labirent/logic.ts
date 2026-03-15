// LabirentUstasi — Game logic constants and helpers

import { AlgorithmType } from './types.ts';

export type GamePhase = 'idle' | 'playing' | 'finished';

export const LEVELS = [
    { rows: 8, cols: 10, algorithm: AlgorithmType.DFS, name: 'Kolay' },
    { rows: 12, cols: 15, algorithm: AlgorithmType.PRIM, name: 'Orta' },
    { rows: 15, cols: 20, algorithm: AlgorithmType.HUNT_AND_KILL, name: 'Zor' },
    { rows: 20, cols: 25, algorithm: AlgorithmType.BINARY_TREE, name: 'Uzman' },
    { rows: 25, cols: 30, algorithm: AlgorithmType.DFS, name: 'Efsane' },
] as const;

export const PREVIEW_ROUTE = new Set(['0-0', '0-1', '1-1', '2-1', '2-2', '2-3', '3-3', '3-4', '3-5']);

export const getMazeCellSize = (rows: number, cols: number) => {
    const viewportWidth = typeof window === 'undefined' ? 1280 : window.innerWidth;
    const viewportHeight = typeof window === 'undefined' ? 900 : window.innerHeight;

    return Math.min(
        40,
        Math.min(
            (viewportWidth - 200) / cols,
            (viewportHeight - 250) / rows,
        ),
    );
};

export const JOYSTICK_RADIUS = 50;
export const MOVE_THRESHOLD = 25;
export const MOVE_COOLDOWN = 150;
