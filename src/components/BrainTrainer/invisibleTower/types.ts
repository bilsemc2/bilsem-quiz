export interface TowerSegment {
  col: number;
  id: string;
  isNegative: boolean;
  multiplier?: number;
  row: number;
  value: number;
}

export interface InvisibleTowerRound {
  correctAnswer: number;
  options: number[];
  tower: TowerSegment[];
}

export type LocalPhase = "building" | "flashing" | "question";
