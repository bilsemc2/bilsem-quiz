export enum Difficulty {
    EASY = 'EASY',
    MEDIUM = 'MEDIUM',
    HARD = 'HARD'
}

export interface Pattern {
    sequence: (number | string)[];
    answer: number;
    options: number[];
    rule: string;
    targetColor: string;
}

export interface FloatingBalloon {
    id: string;
    value: number;
    color: string;
    x: number;
    speed: number;
    startTime: number;
    isHighlighted?: boolean;
}

export interface GameState {
    score: number;
    level: number;
    lives: number;
    status: 'START' | 'PLAYING' | 'GAME_OVER' | 'WIN';
}
