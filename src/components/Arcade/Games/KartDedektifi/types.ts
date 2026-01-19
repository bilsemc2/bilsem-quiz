
export enum Color {
  Red = 'red',
  Blue = 'blue',
  Green = 'green',
  Yellow = 'yellow'
}

export enum Shape {
  Star = 'star',
  Heart = 'heart',
  Cloud = 'cloud',
  Moon = 'moon'
}

export enum RuleType {
  Color = 'color',
  Shape = 'shape',
  Number = 'number'
}

export interface CardData {
  id: string;
  color: Color;
  shape: Shape;
  number: number;
}

export interface GameState {
  currentRule: RuleType;
  score: number;
  totalAttempts: number;
  consecutiveCorrect: number;
  isGameOver: boolean;
  history: {
    isCorrect: boolean;
    ruleAtTime: RuleType;
  }[];
}

export type FeedbackType = 'correct' | 'incorrect' | null;

export type GamePhase = 'idle' | 'playing' | 'paused' | 'game_over' | 'victory';
