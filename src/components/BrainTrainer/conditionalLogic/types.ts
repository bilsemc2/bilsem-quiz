export type ShapeType = "Circle" | "Square" | "Triangle" | "Star" | "Diamond";
export type ColorType = "Red" | "Blue" | "Green" | "Yellow" | "Purple";

export interface GameObject {
  id: string;
  shape: ShapeType;
  color: ColorType;
}

export interface RoundData {
  objects: GameObject[];
  instruction: string;
  targetId: string;
}
