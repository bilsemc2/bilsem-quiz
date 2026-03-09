import React, { useId } from "react";

import { INTERNAL_SIZE } from "./constants";
import type { Point, Shape } from "./types";

interface ShapeRendererProps {
  shapes: Shape[];
  dot?: Point;
  rotation?: number;
  size?: number;
  showDot?: boolean;
}

const ShapeRenderer: React.FC<ShapeRendererProps> = ({
  shapes,
  dot,
  rotation = 0,
  size = 300,
  showDot = true,
}) => {
  const filterId = useId().replace(/:/g, "");

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        viewBox={`0 0 ${INTERNAL_SIZE} ${INTERNAL_SIZE}`}
        width="100%"
        height="100%"
        className="transition-transform duration-500 ease-in-out"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <filter id={filterId}>
          <feDropShadow
            dx="2"
            dy="2"
            stdDeviation="0"
            floodColor="#000"
            floodOpacity="1"
          />
        </filter>

        {shapes.map((shape) => {
          const baseProps = {
            fill: shape.color,
            fillOpacity: 0.8,
            stroke: "#000",
            strokeWidth: 4,
            filter: `url(#${filterId})`,
          };

          if (shape.type === "circle") {
            return (
              <circle
                key={shape.id}
                {...baseProps}
                cx={shape.cx}
                cy={shape.cy}
                r={shape.r}
              />
            );
          }

          if (shape.type === "rect") {
            return (
              <rect
                key={shape.id}
                {...baseProps}
                x={shape.x}
                y={shape.y}
                width={shape.w}
                height={shape.h}
                transform={`rotate(${shape.rotation}, ${shape.x + shape.w / 2}, ${shape.y + shape.h / 2})`}
              />
            );
          }

          return (
            <polygon
              key={shape.id}
              {...baseProps}
              points={`${shape.p1.x},${shape.p1.y} ${shape.p2.x},${shape.p2.y} ${shape.p3.x},${shape.p3.y}`}
            />
          );
        })}

        {showDot && dot ? (
          <circle
            cx={dot.x}
            cy={dot.y}
            r={8}
            fill="black"
            stroke="white"
            strokeWidth={4}
            filter={`url(#${filterId})`}
          />
        ) : null}
      </svg>
    </div>
  );
};

export default ShapeRenderer;
