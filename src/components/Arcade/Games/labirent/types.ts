
export enum AlgorithmType {
  DFS = 'Recursive Backtracker (DFS)',
  PRIM = 'Randomized Prim\'s',
  HUNT_AND_KILL = 'Hunt and Kill',
  BINARY_TREE = 'Binary Tree',
  SIDEWINDER = 'Sidewinder',
  WILSON = 'Wilson\'s Algorithm',
  ALDOUS_BRODER = 'Aldous-Broder',
  RECURSIVE_DIVISION = 'Recursive Division'
}

export interface Cell {
  row: number;
  col: number;
  walls: {
    top: boolean;
    right: boolean;
    bottom: boolean;
    left: boolean;
  };
  visited: boolean;
  isEntry?: boolean;
  isExit?: boolean;
}

export interface GeneratorConfig {
  rows: number;
  cols: number;
  algorithm: AlgorithmType;
  animate: boolean;
  speed: number;
}
