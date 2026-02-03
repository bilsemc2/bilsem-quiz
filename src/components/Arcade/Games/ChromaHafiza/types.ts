export type Point = [number, number];

export interface PuzzlePiece {
    id: string;
    points: Point[];
    targetColor: string;
    depth: number;
    isSelected: boolean;
    isCorrect: boolean;
}

export type GamePhase = 'idle' | 'preview' | 'playing' | 'reveal' | 'success' | 'game_over';

export interface LevelConfig {
    id: number;
    pieceCount: number;
    colorCount: number;
    previewDuration: number; // ms
}
