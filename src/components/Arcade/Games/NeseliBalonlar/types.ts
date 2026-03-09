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

export type GamePhase = 'idle' | 'watching' | 'popping' | 'guessing' | 'result' | 'gameover';

export const QuestionType = {
    COLOR: 'COLOR',
    NUMBER: 'NUMBER',
    POSITION: 'POSITION',
    ORDER: 'ORDER'
} as const;

export type QuestionType = (typeof QuestionType)[keyof typeof QuestionType];

export interface AnswerOption {
    id: number;
    label: string;
    colorDot?: string;
    isDistractor: boolean;
}

export interface QuestionText {
    main: string;
    highlight: string;
    rest: string;
}
