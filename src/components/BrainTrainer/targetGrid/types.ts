export interface Card {
  id: string;
  value: number;
  isRevealed: boolean;
  isSolved: boolean;
}

export interface RoundData {
  cards: Card[];
  previewSeconds: number;
  solutionIndices: number[];
  targetSum: number;
}
