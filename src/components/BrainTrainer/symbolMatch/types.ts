export type ShapeKey =
  | "star"
  | "circle"
  | "square"
  | "triangle"
  | "hexagon"
  | "diamond"
  | "pentagon"
  | "octagon"
  | "heart";

export type SymbolMatchPhase = "memorize" | "question";
export type QuestionType = "color" | "symbol";

export interface ShapeDefinition {
  key: ShapeKey;
  name: string;
  fill: boolean;
}

export interface ShapeColorAssignment {
  key: ShapeKey;
  shapeName: string;
  fill: boolean;
  color: string;
  colorName: string;
}

export interface QuestionData {
  type: QuestionType;
  query: string;
  correctAnswer: string;
  options: string[];
  targetShapeName?: string;
}
