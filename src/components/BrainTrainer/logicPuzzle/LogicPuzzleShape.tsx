import React from "react";

import { COLORS_MAP } from "./constants";
import type { ShapeData, ShapeType } from "./types";

const getShapePath = (shapeType: ShapeType) => {
  switch (shapeType) {
    case "circle":
      return "M 50,50 m -45,0 a 45,45 0 1,0 90,0 a 45,45 0 1,0 -90,0";
    case "square":
      return "M 10,10 H 90 V 90 H 10 Z";
    case "triangle":
      return "M 50,10 L 90,90 H 10 Z";
    case "diamond":
      return "M 50,5 L 95,50 L 50,95 L 5,50 Z";
    case "pentagon":
      return "M 50,5 L 95,38 L 78,90 H 22 L 5,38 Z";
    case "hexagon":
      return "M 25,5 L 75,5 L 95,50 L 75,95 L 25,95 L 5,50 Z";
    case "star":
      return "M 50,5 L 63,35 L 95,38 L 70,58 L 78,90 L 50,75 L 22,90 L 30,58 L 5,38 L 37,35 Z";
    default:
      return "";
  }
};

interface LogicPuzzleShapeProps {
  data: ShapeData;
  size?: number;
}

const LogicPuzzleShape: React.FC<LogicPuzzleShapeProps> = ({
  data,
  size = 50,
}) => {
  const colorHex = COLORS_MAP[data.color];
  const fill =
    data.fill === "solid"
      ? colorHex
      : data.fill === "striped"
        ? `url(#stripe-${data.id})`
        : "none";

  return (
    <div
      className="inline-flex items-center justify-center"
      style={{
        width: size,
        height: size,
        transform: `rotate(${data.rotation}deg)`,
      }}
    >
      <svg
        viewBox="0 0 100 100"
        width="100%"
        height="100%"
        className="overflow-visible"
      >
        <defs>
          <pattern
            id={`stripe-${data.id}`}
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="10"
              stroke={colorHex}
              strokeWidth="4"
            />
          </pattern>
        </defs>
        <path
          d={getShapePath(data.type)}
          fill={fill}
          stroke={colorHex}
          strokeWidth={4}
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

export default LogicPuzzleShape;
