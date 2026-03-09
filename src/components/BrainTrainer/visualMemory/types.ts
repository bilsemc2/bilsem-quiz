export type InternalPhase = "memorize" | "transition" | "recall";

export type IconType =
  | "Star"
  | "Circle"
  | "Square"
  | "Triangle"
  | "Hexagon"
  | "Diamond"
  | "Heart"
  | "Cloud"
  | "Sun"
  | "Moon"
  | "Zap"
  | "Anchor"
  | "Music"
  | "Ghost"
  | "Flower"
  | "Crown";

export interface GridCell {
  id: string;
  icon: IconType | null;
  color: string;
}

export interface LevelConfig {
  gridSize: number;
  items: number;
  memorizeMs: number;
}

export interface VisualMemoryRound {
  gridSize: number;
  memorizeMs: number;
  gridBefore: GridCell[];
  gridAfter: GridCell[];
  targetCellId: string;
}
