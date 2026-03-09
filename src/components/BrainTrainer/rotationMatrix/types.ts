export interface RotationMatrixStick {
  color: string;
  isVertical: boolean;
  x: number;
  y: number;
  length: number;
}

export interface RotationMatrixShape {
  id: string;
  type: "sticks";
  rotation: number;
  sticks: RotationMatrixStick[];
}

export interface RotationMatrixOption {
  shape: RotationMatrixShape;
  isCorrect: boolean;
}

export interface RotationMatrixRound {
  sequence: RotationMatrixShape[];
  targetIndex: number;
  options: RotationMatrixOption[];
}
