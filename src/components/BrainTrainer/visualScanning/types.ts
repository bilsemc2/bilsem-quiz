export interface CellData {
  symbol: string;
  isTarget: boolean;
  isClicked: boolean;
  isWrongClick: boolean;
}

export interface VisualScanningRound {
  targetSymbol: string;
  cells: CellData[];
}

export interface CellSelectionResult {
  nextCells: CellData[];
  isCorrect: boolean;
  isIgnored: boolean;
}
