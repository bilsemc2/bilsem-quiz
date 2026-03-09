export interface MazeCell {
  x: number;
  y: number;
  walls: { top: boolean; right: boolean; bottom: boolean; left: boolean };
  visited: boolean;
}

export interface WallSeedSide {
  midOffset: number;
  thick: number;
}

export interface WallSeed {
  top: WallSeedSide;
  right: WallSeedSide;
  bottom: WallSeedSide;
  left: WallSeedSide;
}

export interface MazeLevelData {
  maze: MazeCell[][];
  solutionSet: Set<string>;
  cols: number;
  rows: number;
  wallSeeds: WallSeed[];
}

export interface PathPoint {
  x: number;
  y: number;
}
