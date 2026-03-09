export interface PatternProps {
  points?: number;
  sides?: number;
  lines?: number;
  pathData?: string;
}

export type PatternType =
  | "dots"
  | "stripes"
  | "zigzag"
  | "waves"
  | "checkerboard"
  | "crosshatch"
  | "star"
  | "polygon"
  | "scribble"
  | "burst";

export interface PatternLayer {
  defs: string;
  type: PatternType;
  backgroundColor: string;
  foregroundColor: string;
  size: number;
  rotation: number;
  opacity: number;
  id: string;
  props?: PatternProps;
}

export interface GameOption {
  pattern: PatternLayer[];
  isCorrect: boolean;
}

export interface TargetPosition {
  x: number;
  y: number;
}

export interface PartWholeRound {
  gamePattern: PatternLayer[];
  options: GameOption[];
  targetPos: TargetPosition;
}
