import { ColorType } from './types';
import { ARCADE_PALETTE } from '../../Shared/ArcadeConstants';

export const GAME_CONFIG = {
    INITIAL_LIVES: 3,
    MAX_LEVEL: 10,
};

// Progressive Difficulty: Level -> Settings
export const LEVEL_CONFIG: Record<number, { gridSize: number; memorizeTime: number }> = {
    1: { gridSize: 3, memorizeTime: 5 },   // Easy: 3x3, 5 saniye
    2: { gridSize: 3, memorizeTime: 4 },
    3: { gridSize: 4, memorizeTime: 4 },   // Medium: 4x4
    4: { gridSize: 4, memorizeTime: 3 },
    5: { gridSize: 5, memorizeTime: 4 },   // Hard: 5x5
    6: { gridSize: 5, memorizeTime: 3 },
    7: { gridSize: 5, memorizeTime: 3 },
    8: { gridSize: 6, memorizeTime: 3 },   // Expert: 6x6
    9: { gridSize: 6, memorizeTime: 2 },
    10: { gridSize: 6, memorizeTime: 2 },
};

// Renkler artık ARCADE_PALETTE'den türetiliyor
export const COLORS: Record<ColorType, string> = {
    red: ARCADE_PALETTE.red.hex,
    blue: ARCADE_PALETTE.blue.hex,
    yellow: ARCADE_PALETTE.yellow.hex,
    green: ARCADE_PALETTE.green.hex,
};

export const COLOR_LABELS: Record<ColorType, string> = {
    red: ARCADE_PALETTE.red.name.toUpperCase(),
    blue: ARCADE_PALETTE.blue.name.toUpperCase(),
    yellow: ARCADE_PALETTE.yellow.name.toUpperCase(),
    green: ARCADE_PALETTE.green.name.toUpperCase(),
};
