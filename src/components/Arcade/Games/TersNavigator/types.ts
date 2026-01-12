export enum GameState {
    MENU = 'MENU',
    PLAYING = 'PLAYING',
    GAME_OVER = 'GAME_OVER'
}

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface DirectionDefinition {
    type: Direction;
    label: string;
    icon: string;
}

export interface StroopMove {
    id: number;
    word: string;
    targetDirection: Direction;
    buttons: {
        direction: Direction;
        iconDirection: Direction;
    }[];
}

export interface Position {
    x: number;
    y: number;
}

export interface PerformanceStats {
    score: number;
    accuracy: number;
    averageTime: number;
    rounds: number;
}
