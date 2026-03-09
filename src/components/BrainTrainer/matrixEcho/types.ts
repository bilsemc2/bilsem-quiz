export interface MatrixEchoCell {
  gridIndex: number;
  value: number;
}

export interface MatrixEchoQuestion {
  text: string;
  answer: number;
  options: number[];
}

export type MatrixEchoSubPhase =
  | "idle"
  | "memorize"
  | "hidden"
  | "question";

export type MatrixEchoQuestionKind =
  | "value-by-position"
  | "position-by-value"
  | "max-position"
  | "min-position"
  | "sum-by-position"
  | "difference-by-position";
