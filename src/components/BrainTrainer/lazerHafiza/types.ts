export interface Coordinate {
  row: number;
  col: number;
}

export interface LevelConfig {
  gridSize: number;
  pathLength: number;
  allowDiagonals: boolean;
}

export type LocalPhase = "preview" | "playing";
