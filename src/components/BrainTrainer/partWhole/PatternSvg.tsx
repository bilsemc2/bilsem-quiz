import React from "react";

import { PIECE_SIZE, SVG_SIZE } from "./constants";
import type { PatternLayer, TargetPosition } from "./types";

interface PatternSvgProps {
  pattern: PatternLayer[];
  size: number;
  targetPos?: TargetPosition | null;
  viewBox?: string;
}

const PatternSvg: React.FC<PatternSvgProps> = ({
  pattern,
  size,
  targetPos,
  viewBox,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox ?? `0 0 ${SVG_SIZE} ${SVG_SIZE}`}
      className="rounded-3xl overflow-hidden border-2 border-black/10"
    >
      {pattern.map((layer, index) => (
        <React.Fragment key={`${layer.id}-${index}`}>
          <defs dangerouslySetInnerHTML={{ __html: layer.defs }} />
          <rect
            x="0"
            y="0"
            width={SVG_SIZE}
            height={SVG_SIZE}
            fill={`url(#${layer.id})`}
            opacity={layer.opacity}
            transform={`rotate(${layer.rotation} ${SVG_SIZE / 2} ${SVG_SIZE / 2})`}
          />
        </React.Fragment>
      ))}

      {targetPos ? (
        <rect
          x={targetPos.x}
          y={targetPos.y}
          width={PIECE_SIZE}
          height={PIECE_SIZE}
          fill="white"
          stroke="black"
          strokeWidth="6"
          rx="16"
        />
      ) : null}
    </svg>
  );
};

export default PatternSvg;
