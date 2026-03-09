export const ShapeType = {
  SQUARE: "SQUARE",
  TRIANGLE: "TRIANGLE",
  CIRCLE: "CIRCLE",
  STAR: "STAR",
  PENTAGON: "PENTAGON",
} as const;

export type ShapeType = (typeof ShapeType)[keyof typeof ShapeType];

export type WeightMap = Partial<Record<ShapeType, number>>;
export type PanContent = Partial<Record<ShapeType, number>>;

export interface BalanceState {
  left: PanContent;
  right: PanContent;
}

export interface LevelData {
  levelNumber: number;
  weights: WeightMap;
  referenceEquation: BalanceState;
  question: { left: PanContent };
  description: string;
  detailedExplanation?: string;
}
