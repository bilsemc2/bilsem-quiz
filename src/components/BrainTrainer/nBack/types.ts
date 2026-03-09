export type ShapeKey =
  | "square"
  | "circle"
  | "triangle"
  | "pentagon"
  | "hexagon";

export interface ShapeData {
  id: string;
  key: ShapeKey;
  color: string;
}
