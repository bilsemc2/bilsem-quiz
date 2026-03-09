export type PatternType =
  | "arithmetic"
  | "geometric"
  | "fibonacci"
  | "square"
  | "cube"
  | "prime"
  | "alternating"
  | "doubleStep";

export interface NumberSequenceQuestion {
  answer: number;
  options: number[];
  patternDescription: string;
  patternType: PatternType;
  sequence: number[];
}
