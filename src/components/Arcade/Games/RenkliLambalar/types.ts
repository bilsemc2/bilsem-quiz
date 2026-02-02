export type ColorType = 'RED' | 'BLUE' | 'YELLOW' | 'GREEN';

export interface Cell {
    id: number;
    color: ColorType;
    hex: string;
    isRevealed: boolean;
    isError: boolean;
}

export type GamePhase = 'idle' | 'memorizing' | 'playing' | 'revealing' | 'game_over' | 'victory';
