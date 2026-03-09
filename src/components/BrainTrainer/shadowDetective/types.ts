export type ShapeId =
  | "circle"
  | "square"
  | "triangle"
  | "diamond"
  | "star"
  | "octagon"
  | "cross"
  | "moon"
  | "heart";

export interface PatternItem {
  id: string;
  shapeId: ShapeId;
  color: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

export interface ShadowDetectiveRound {
  correctPattern: PatternItem[];
  options: PatternItem[][];
  correctOptionIndex: number;
  previewSeconds: number;
}

export type RoundStatus = "preview" | "deciding";
