export type ShapeType = 'square' | 'triangle' | 'circle' | 'star' | 'diamond' | 'pentagon' | 'hexagon';
export type ColorType = 'red' | 'green' | 'blue' | 'yellow' | 'purple' | 'orange' | 'teal';

export interface GameVariable {
  id: string;
  shape: ShapeType;
  color: ColorType;
  value: number;
}

export interface EquationItem {
  variableId: string;
  count: number; // e.g., 2 red squares
}

export interface Equation {
  id: string;
  items: EquationItem[];
  result: number;
}

export interface Question {
  text: string;
  items: EquationItem[]; // The expression to solve (e.g., Square + Triangle)
  answer: number;
}

export interface LevelData {
  level: number;
  variables: GameVariable[];
  equations: Equation[];
  question: Question; // Replaces targetVariableId
}

export enum GameState {
  MENU,
  PLAYING,
  SUCCESS,
  GAME_OVER
}