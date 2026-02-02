
export type ItemType = 'color' | 'number';

export interface SequenceItem {
  type: ItemType;
  value: string | number;
}

export interface Question {
  text: string;
  answer: string | number;
  options: (string | number)[];
}

export enum GameStage {
  START = 'START',
  MEMORIZE = 'MEMORIZE',
  QUESTION = 'QUESTION',
  DRAWING = 'DRAWING',
  ANIMATING = 'ANIMATING',
  RESULT = 'RESULT'
}

export interface Point {
  x: number;
  y: number;
}

export interface GridPos {
  row: number;
  col: number;
}
