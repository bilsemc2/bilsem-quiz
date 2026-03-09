export interface Cell {
    r: number;
    c: number;
    walls: [boolean, boolean, boolean, boolean]; // top, right, bottom, left
    visited: boolean;
    hasBattery: boolean;
    hasLogo: boolean;
}

export interface EnergyEffect {
    id: number;
    r: number;
    c: number;
}

export type GameState = 'idle' | 'playing' | 'level_cleared' | 'finished';

export interface GridPosition {
    r: number;
    c: number;
}

export interface Point2D {
    x: number;
    y: number;
}

export type MoveDirection = 'up' | 'down' | 'left' | 'right';
