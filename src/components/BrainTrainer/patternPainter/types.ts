export type PatternType =
  | "checkered"
  | "stripes"
  | "diagonal"
  | "center-out"
  | "random-repeating";

export interface GapPosition {
  row: number;
  column: number;
}

export interface PatternPainterLevel {
  size: number;
  patternType: PatternType;
  gapPos: GapPosition;
  grid: string[][];
  correctOption: string[][];
}

export type PaintingGrid = (string | null)[][];
