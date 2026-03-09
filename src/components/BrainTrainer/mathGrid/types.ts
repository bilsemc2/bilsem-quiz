export interface CellData {
  value: number;
  row: number;
  col: number;
  isMissing: boolean;
  userValue?: string;
}

export type GridMatrix = CellData[][];

export type Operator = "+" | "-" | "*" | "/";

export interface ActiveCell {
  r: number;
  c: number;
}

export interface PuzzleData {
  grid: GridMatrix;
  operator: Operator;
  ruleDescription: string;
}

export interface PuzzleValidation {
  allCorrect: boolean;
  anyFilled: boolean;
  anyWrong: boolean;
}
