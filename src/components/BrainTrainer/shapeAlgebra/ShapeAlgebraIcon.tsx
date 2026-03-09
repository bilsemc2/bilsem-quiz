import React from "react";

import { COLOR_MAP } from "./constants";
import type { ColorType, ShapeType } from "./types";

interface ShapeAlgebraIconProps {
  shape: ShapeType;
  color: ColorType;
  dotted: boolean;
  size: number;
}

const ShapeAlgebraIcon: React.FC<ShapeAlgebraIconProps> = ({
  shape,
  color,
  dotted,
  size,
}) => {
  const getPath = () => {
    switch (shape) {
      case "circle":
        return <circle cx="50" cy="50" r="45" />;
      case "square":
        return <rect x="5" y="5" width="90" height="90" rx="15" />;
      case "triangle":
        return <polygon points="50,5 95,95 5,95" strokeLinejoin="round" />;
      case "star":
        return (
          <polygon
            points="50,5 61,35 95,35 68,55 78,85 50,65 22,85 32,55 5,35 39,35"
            strokeLinejoin="round"
          />
        );
      case "hexagon":
        return (
          <polygon
            points="25,5 75,5 95,50 75,95 25,95 5,50"
            strokeLinejoin="round"
          />
        );
      case "diamond":
        return (
          <polygon points="50,5 95,50 50,95 5,50" strokeLinejoin="round" />
        );
    }
  };

  return (
    <div
      style={{ width: size, height: size }}
      className="filter drop-shadow-[4px_4px_0_rgba(0,0,0,1)]"
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        style={{ overflow: "visible" }}
      >
        <g stroke="#000" strokeWidth="6" fill={COLOR_MAP[color]}>
          {getPath()}
        </g>
        <g
          stroke={dotted ? "rgba(0,0,0,0.8)" : "none"}
          strokeWidth="4"
          fill="none"
          strokeDasharray="6 6"
        >
          {getPath()}
        </g>
        <circle
          cx="35"
          cy="30"
          r="8"
          fill="white"
          opacity="0.8"
          style={{ filter: "blur(2px)" }}
        />
        <circle
          cx="45"
          cy="25"
          r="4"
          fill="white"
          opacity="0.6"
          style={{ filter: "blur(1px)" }}
        />
      </svg>
    </div>
  );
};

export default ShapeAlgebraIcon;
