import React from "react";
import {
  Circle,
  Cross,
  Diamond,
  Heart,
  Moon,
  Octagon,
  Square,
  Star,
  Triangle,
  type LucideIcon,
} from "lucide-react";

import type { PatternItem, ShapeId } from "./types";

const SHAPE_ICONS: Record<ShapeId, LucideIcon> = {
  circle: Circle,
  square: Square,
  triangle: Triangle,
  diamond: Diamond,
  star: Star,
  octagon: Octagon,
  cross: Cross,
  moon: Moon,
  heart: Heart,
};

const LIGHT_GRID_STYLE = {
  backgroundImage:
    "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)",
  backgroundSize: "20px 20px",
} as const;

const DARK_GRID_STYLE = {
  backgroundImage:
    "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
  backgroundSize: "20px 20px",
} as const;

interface ShadowPatternCanvasProps {
  items: PatternItem[];
}

const ShadowPatternCanvas: React.FC<ShadowPatternCanvasProps> = ({ items }) => {
  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border-2 border-black/10"
      style={{ width: "100%", paddingBottom: "100%" }}
    >
      <div
        className="absolute inset-0 opacity-10 dark:hidden pointer-events-none"
        style={LIGHT_GRID_STYLE}
      />
      <div
        className="absolute inset-0 hidden dark:block opacity-5 pointer-events-none"
        style={DARK_GRID_STYLE}
      />

      {items.map((item) => {
        const Icon = SHAPE_ICONS[item.shapeId];

        return (
          <div
            key={item.id}
            className="absolute"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              color: item.color,
              transform: `translate(-50%, -50%) rotate(${item.rotation}deg) scale(${item.scale})`,
              width: "18%",
              height: "18%",
            }}
          >
            <Icon className="w-full h-full" strokeWidth={3} />
          </div>
        );
      })}
    </div>
  );
};

export default ShadowPatternCanvas;
