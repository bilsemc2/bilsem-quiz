import type { LucideIcon } from "lucide-react";

export type FaceName =
  | "FRONT"
  | "BACK"
  | "LEFT"
  | "RIGHT"
  | "TOP"
  | "BOTTOM";

export interface FaceContent {
  color: string;
  icon: LucideIcon;
  name: string;
}

export interface CubeNet {
  name: string;
  grid: (FaceName | null)[][];
}

export interface Rotation3D {
  x: number;
  y: number;
}

export interface GameOption {
  rotation: Rotation3D;
  isCorrect: boolean;
  id: string;
}

export interface MagicCubeLevelData {
  net: CubeNet;
  facesData: Record<FaceName, FaceContent>;
  options: GameOption[];
}

export interface PaletteColor {
  name: string;
  hex: string;
}

export interface IconPaletteItem {
  icon: LucideIcon;
  name: string;
}

export interface FacePose {
  rx: number;
  ry: number;
  rz: number;
  tx: number;
  ty: number;
  tz: number;
}

export interface NetFacePlacement {
  row: number;
  col: number;
  relativeRow: number;
  relativeCol: number;
}
