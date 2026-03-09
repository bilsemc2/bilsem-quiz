import React from "react";
import { motion } from "framer-motion";

import type { RotationMatrixShape } from "./types";

interface RotationShapeSVGProps {
  shape: RotationMatrixShape;
  size: number;
}

const RotationShapeSVG: React.FC<RotationShapeSVGProps> = ({ shape, size }) => {
  const center = size / 2;
  const stickWidth = 8;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <motion.g animate={{ rotate: shape.rotation }} style={{ originX: "50%", originY: "50%" }}>
        {shape.sticks.map((stick, index) => (
          <rect
            key={index}
            x={center + stick.x - (stick.isVertical ? stickWidth / 2 : stick.length / 2)}
            y={center + stick.y - (stick.isVertical ? stick.length / 2 : stickWidth / 2)}
            width={stick.isVertical ? stickWidth : stick.length}
            height={stick.isVertical ? stick.length : stickWidth}
            fill={stick.color}
            rx={stickWidth / 2}
            stroke="black"
            strokeWidth="2"
          />
        ))}
        <circle cx={center} cy={center} r="4" fill="black" />
      </motion.g>
    </svg>
  );
};

export default RotationShapeSVG;
