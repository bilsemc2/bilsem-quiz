export type ShapeType =
  | "circle"
  | "square"
  | "triangle"
  | "plus"
  | "star"
  | "diamond"
  | "hexagon";

export interface KeyMapping {
  number: number;
  shape: ShapeType;
}

export interface TestItem {
  id: string;
  targetNumber: number;
}

export interface AttentionCodingRound {
  keyMappings: KeyMapping[];
  items: TestItem[];
}
