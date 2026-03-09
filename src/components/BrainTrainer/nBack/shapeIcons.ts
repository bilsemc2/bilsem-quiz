import {
  Circle,
  Hexagon,
  Pentagon,
  Square,
  Triangle,
  type LucideIcon,
} from "lucide-react";

import type { ShapeKey } from "./types";

export const SHAPE_ICON_MAP: Record<ShapeKey, LucideIcon> = {
  square: Square,
  circle: Circle,
  triangle: Triangle,
  pentagon: Pentagon,
  hexagon: Hexagon,
};
