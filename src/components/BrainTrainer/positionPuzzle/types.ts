export type ShapeType = "circle" | "rect" | "triangle";

export interface Point {
  x: number;
  y: number;
}

interface BaseShape {
  id: string;
  type: ShapeType;
  color: string;
  rotation: number;
}

export interface CircleShape extends BaseShape {
  type: "circle";
  cx: number;
  cy: number;
  r: number;
}

export interface RectShape extends BaseShape {
  type: "rect";
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TriangleShape extends BaseShape {
  type: "triangle";
  p1: Point;
  p2: Point;
  p3: Point;
}

export type Shape = CircleShape | RectShape | TriangleShape;

export interface PuzzleOption {
  id: number;
  rotation: number;
  point: Point;
}

export interface PuzzleState {
  shapes: Shape[];
  targetPoint: Point;
  options: PuzzleOption[];
  correctOptionId: number;
}
