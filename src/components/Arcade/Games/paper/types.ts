
export enum FoldDirection {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export enum PunchShape {
  CIRCLE = 'CIRCLE',
  HEART = 'HEART',
  STAR = 'STAR',
  SQUARE = 'SQUARE',
}

export interface Punch {
  x: number; // 0 to 1
  y: number; // 0 to 1
  shape: PunchShape;
}

export interface PaperState {
  folds: FoldDirection[];
  punches: Punch[];
  isUnfolded: boolean;
  paperColor: string;
}
