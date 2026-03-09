import {
  Circle,
  Diamond,
  Heart,
  Hexagon,
  Octagon,
  Pentagon,
  Square,
  Star,
  Triangle,
  type LucideIcon,
} from "lucide-react";

import type { ShapeKey } from "./types";

export const SHAPE_ICON_MAP: Record<ShapeKey, LucideIcon> = {
  star: Star,
  circle: Circle,
  square: Square,
  triangle: Triangle,
  hexagon: Hexagon,
  diamond: Diamond,
  pentagon: Pentagon,
  octagon: Octagon,
  heart: Heart,
};
