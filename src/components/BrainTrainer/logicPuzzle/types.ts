export type ShapeType =
  | "circle"
  | "square"
  | "triangle"
  | "pentagon"
  | "hexagon"
  | "star"
  | "diamond";

export type ShapeColor =
  | "red"
  | "blue"
  | "green"
  | "yellow"
  | "purple"
  | "orange"
  | "cyan";

export type ShapeFill = "solid" | "outline" | "striped";

export interface ShapeData {
  id: string;
  type: ShapeType;
  color: ShapeColor;
  fill: ShapeFill;
  rotation: number;
}

export interface ShapeGroupData {
  id: string;
  shapes: ShapeData[];
}

export interface PuzzleOption {
  group: ShapeGroupData;
  isCorrect: boolean;
}

export interface PuzzleData {
  ruleName: string;
  ruleDescription: string;
  examples: ShapeGroupData[];
  options: PuzzleOption[];
}
