export interface SymbolColor {
  color: string;
  colorName: string;
  symbol: string;
}

export interface DualBindQuestion {
  correctAnswer: string;
  hint: string;
  options: string[];
  query: string;
  type: "color-to-symbol" | "symbol-to-color";
}

export interface DualBindRound {
  countdown: number;
  questions: DualBindQuestion[];
  symbolColors: SymbolColor[];
}

export type LocalPhase = "memorize" | "question" | "feedback";
