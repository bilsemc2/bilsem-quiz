export const ShapeType = {
  LINE: "LINE",
  CIRCLE: "CIRCLE",
  SQUARE: "SQUARE",
  TRIANGLE: "TRIANGLE",
  ARROW: "ARROW",
} as const;

export type ShapeType = (typeof ShapeType)[keyof typeof ShapeType];

export const TransformationType = {
  ROTATION: "ROTATION",
  CLOCK_MOVE: "CLOCK_MOVE",
  CORNER_MOVE: "CORNER_MOVE",
} as const;

export type TransformationType =
  (typeof TransformationType)[keyof typeof TransformationType];

export interface LayerConfig {
  id: string;
  shape: ShapeType;
  color: string;
  transformation: TransformationType;
  startValue: number;
  stepChange: number;
  size?: number;
  offset?: number;
}

export interface PatternData {
  id: string;
  difficulty: "Kolay" | "Orta" | "Zor";
  layers: LayerConfig[];
  description: string;
}

export interface WagonLayerState {
  layerId: string;
  rotation: number;
  position: number;
  visible: boolean;
}

export interface WagonState {
  index: number;
  layerStates: WagonLayerState[];
}

export type WagonStatus = "default" | "correct" | "wrong";
