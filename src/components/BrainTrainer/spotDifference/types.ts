export type DiffType =
  | "lightness"
  | "hue"
  | "radius"
  | "scale"
  | "rotation"
  | "shape";

export interface ShapeData {
  id: string;
  path: string;
}

export interface TileStyle {
  hue: number;
  sat: number;
  light: number;
  radius: number;
  rotate: number;
  scale: number;
}

export interface TileDecor {
  d1x: number;
  d1y: number;
  d1s: number;
  d2x: number;
  d2y: number;
  d2s: number;
}

export interface TileData {
  index: number;
  style: TileStyle;
  shape: ShapeData;
  decor: TileDecor;
}

export interface RoundData {
  size: number;
  total: number;
  oddIndex: number;
  diffType: DiffType;
  baseShape: ShapeData;
  oddShape: ShapeData;
  base: TileStyle;
  odd: TileStyle;
  perRoundTime: number;
}
