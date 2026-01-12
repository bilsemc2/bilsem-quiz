import { DirectionDefinition } from './types';

export const DIRECTIONS: DirectionDefinition[] = [
    { type: 'UP', label: 'YUKARI', icon: '↑' },
    { type: 'DOWN', label: 'AŞAĞI', icon: '↓' },
    { type: 'LEFT', label: 'SOL', icon: '←' },
    { type: 'RIGHT', label: 'SAĞ', icon: '→' }
];

export const GRID_SIZE = 8;
export const GAME_DURATION = 60;
