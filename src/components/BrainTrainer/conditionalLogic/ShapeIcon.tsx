import React from "react";

import { COLOR_VALUES } from "./constants";
import type { ColorType, ShapeType } from "./types";

interface ShapeIconProps {
  shape: ShapeType;
  color: ColorType;
  size?: number;
}

const ShapeIcon: React.FC<ShapeIconProps> = ({
  shape,
  color,
  size = 64,
}) => {
  const fill = COLOR_VALUES[color];

  if (shape === "Circle") {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="42" fill={fill} stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
        <ellipse cx="40" cy="35" rx="14" ry="8" fill="rgba(255,255,255,0.25)" transform="rotate(-20 40 35)" />
      </svg>
    );
  }

  if (shape === "Square") {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <rect x="12" y="12" width="76" height="76" rx="12" fill={fill} stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
        <rect x="20" y="18" width="28" height="12" rx="4" fill="rgba(255,255,255,0.2)" />
      </svg>
    );
  }

  if (shape === "Triangle") {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <polygon points="50,10 90,85 10,85" fill={fill} stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
        <polygon points="50,24 36,55 50,55" fill="rgba(255,255,255,0.2)" />
      </svg>
    );
  }

  if (shape === "Star") {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <polygon
          points="50,5 61,35 95,35 68,55 79,88 50,68 21,88 32,55 5,35 39,35"
          fill={fill}
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="3"
        />
        <polygon points="50,18 55,33 45,33" fill="rgba(255,255,255,0.2)" />
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <polygon points="50,8 92,50 50,92 8,50" fill={fill} stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
      <polygon points="50,20 38,50 50,50" fill="rgba(255,255,255,0.2)" />
    </svg>
  );
};

export default ShapeIcon;
