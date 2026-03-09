import type { BaseShape, GameOption, MatrixCell } from "../../../types/matrixRules";

export interface MatrixPuzzleQuestionState {
  grid: MatrixCell[][];
  options: GameOption[];
  correctAnswer: BaseShape;
  ruleName: string;
  ruleDescription: string;
}

export interface QuestionHistoryEntry {
  level: number;
  ruleName: string;
  ruleDescription: string;
  grid: MatrixCell[][];
  correctAnswer: BaseShape;
  selectedAnswer: BaseShape;
  isCorrect: boolean;
}
