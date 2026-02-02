import { ColorType } from './types';

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

// Soft Candy Colors - Pastel Palette
export const COLORS: Record<ColorType, string> = {
    RED: '#FF8FAB',      // Soft Pink
    BLUE: '#7DD3FC',     // Sky Blue
    YELLOW: '#FDE68A',   // Lemon Cream
    GREEN: '#86EFAC',    // Mint
};

export const COLOR_LABELS: Record<ColorType, string> = {
    RED: 'KIRMIZI',
    BLUE: 'MAVİ',
    YELLOW: 'SARI',
    GREEN: 'YEŞİL',
};
