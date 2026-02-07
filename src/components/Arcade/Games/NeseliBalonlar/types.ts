export type BalloonColor = {
    name: string;
    primary: string;
    secondary: string;
    highlight: string;
};

export type BalloonState = {
    id: number;
    displayValue: number;
    color: BalloonColor;
    isPopped: boolean;
    isVisible: boolean;
    position: number; // 0-indexed position from left
};

export type GamePhase = 'idle' | 'watching' | 'popping' | 'guessing' | 'result';

export enum QuestionType {
    COLOR = 'COLOR',
    NUMBER = 'NUMBER',
    POSITION = 'POSITION',
    ORDER = 'ORDER'
}
