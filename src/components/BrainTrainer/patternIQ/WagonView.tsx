import React, { useMemo } from "react";
import {
  ShapeType,
  TransformationType,
  type PatternData,
  type WagonState,
  type WagonStatus,
} from "./types";

interface WagonViewProps {
  state: WagonState;
  pattern: PatternData;
  isQuestion?: boolean;
  isRevealed?: boolean;
  status?: WagonStatus;
  onClick?: () => void;
}

const OrbitMarker = ({
  x,
  y,
  color,
}: {
  x: number;
  y: number;
  color: string;
}) => (
  <circle
    cx={x}
    cy={y}
    r={4}
    fill="white"
    stroke={color}
    strokeWidth={2}
  />
);

export const WagonView: React.FC<WagonViewProps> = ({
  state,
  pattern,
  isQuestion = false,
  isRevealed = false,
  status = "default",
  onClick,
}) => {
  const renderedLayers = useMemo(() => {
    return state.layerStates.map((layerState) => {
      const config = pattern.layers.find((layer) => layer.id === layerState.layerId);
      if (!config || !layerState.visible) {
        return null;
      }

      let translateX = 50;
      let translateY = 50;
      let rotation = 0;

      if (config.transformation === TransformationType.ROTATION) {
        rotation = layerState.rotation;
      } else if (config.transformation === TransformationType.CLOCK_MOVE) {
        const angle = (layerState.position - 3) * 30 * (Math.PI / 180);
        const radius = 35;
        translateX = 50 + radius * Math.cos(angle);
        translateY = 50 + radius * Math.sin(angle);
      } else if (config.transformation === TransformationType.CORNER_MOVE) {
        const margin = 20;
        switch (layerState.position) {
          case 0:
            translateX = margin;
            translateY = margin;
            break;
          case 1:
            translateX = 100 - margin;
            translateY = margin;
            break;
          case 2:
            translateX = 100 - margin;
            translateY = 100 - margin;
            break;
          case 3:
            translateX = margin;
            translateY = 100 - margin;
            break;
        }
      }

      const strokeWidth = pattern.layers.length >= 3 ? 4.5 : 5.5;
      const commonProps = {
        stroke: config.color,
        strokeWidth,
        fill:
          config.shape === ShapeType.CIRCLE || config.shape === ShapeType.SQUARE
            ? `${config.color}33`
            : "none",
      };
      const size = config.size || 20;
      const half = size / 2;

      let shapeSvg: React.ReactNode = null;

      switch (config.shape) {
        case ShapeType.CIRCLE:
          shapeSvg = (
            <g>
              <circle cx={0} cy={0} r={half} {...commonProps} />
              <OrbitMarker x={0} y={-half} color={config.color} />
            </g>
          );
          break;
        case ShapeType.SQUARE:
          shapeSvg = (
            <g>
              <rect x={-half} y={-half} width={size} height={size} {...commonProps} />
              <OrbitMarker x={half - 2} y={-half + 2} color={config.color} />
            </g>
          );
          break;
        case ShapeType.TRIANGLE: {
          const height = size * 0.866;
          shapeSvg = (
            <g>
              <polygon
                points={`0,-${height / 2} -${half},${height / 2} ${half},${height / 2}`}
                {...commonProps}
              />
              <OrbitMarker x={0} y={-height / 2} color={config.color} />
            </g>
          );
          break;
        }
        case ShapeType.LINE:
          shapeSvg = (
            <g>
              <line
                x1={0}
                y1={0}
                x2={0}
                y2={-38}
                stroke={config.color}
                strokeWidth={5}
                strokeLinecap="round"
              />
              <OrbitMarker x={0} y={-38} color={config.color} />
            </g>
          );
          break;
        case ShapeType.ARROW:
          shapeSvg = (
            <g>
              <line
                x1={0}
                y1={10}
                x2={0}
                y2={-32}
                stroke={config.color}
                strokeWidth={5}
                strokeLinecap="round"
              />
              <path
                d="M -12 -20 L 0 -36 L 12 -20"
                fill="none"
                stroke={config.color}
                strokeWidth={5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          );
          break;
      }

      return (
        <g
          key={config.id}
          transform={`translate(${translateX}, ${translateY}) rotate(${rotation})`}
        >
          {shapeSvg}
        </g>
      );
    });
  }, [state, pattern.layers]);

  if (isQuestion && !isRevealed) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-[2rem] border-4 border-dashed border-slate-400 bg-slate-100 shadow-neo-sm animate-pulse dark:border-slate-500 dark:bg-slate-700">
        <span className="font-nunito text-5xl font-black text-slate-400 dark:text-slate-500">
          ?
        </span>
      </div>
    );
  }

  let containerClasses =
    "relative overflow-hidden bg-white border-2 border-black/10 transition-all duration-300 dark:bg-slate-800";
  let wrapperClasses = "";

  if (status === "correct") {
    containerClasses =
      "relative z-10 overflow-hidden border-2 border-cyber-green bg-cyber-green/20 ring-2 ring-cyber-green shadow-none";
  } else if (status === "wrong") {
    containerClasses =
      "relative overflow-hidden border-2 border-cyber-pink bg-cyber-pink/20 opacity-80 ring-2 ring-cyber-pink";
  } else {
    containerClasses += " shadow-neo-sm";
    if (onClick) {
      wrapperClasses =
        "group block cursor-pointer transition-all hover:-translate-y-2 active:translate-y-1";
      containerClasses += " group-hover:shadow-neo-sm group-active:shadow-neo-sm";
    }
  }

  return (
    <div
      className={wrapperClasses}
      onClick={status === "default" && onClick ? onClick : undefined}
    >
      <div className={`aspect-square w-full rounded-[2rem] ${containerClasses}`}>
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-5 dark:opacity-20"
          viewBox="0 0 100 100"
          shapeRendering="geometricPrecision"
        >
          <line x1="50" y1="5" x2="50" y2="15" stroke="currentColor" strokeWidth="4" />
          <line x1="95" y1="50" x2="85" y2="50" stroke="currentColor" strokeWidth="4" />
          <line x1="50" y1="95" x2="50" y2="85" stroke="currentColor" strokeWidth="4" />
          <line x1="5" y1="50" x2="15" y2="50" stroke="currentColor" strokeWidth="4" />
          <circle cx="50" cy="50" r="3" fill="currentColor" />
        </svg>
        <svg
          className="h-full w-full p-2 sm:p-2.5"
          viewBox="0 0 100 100"
          shapeRendering="geometricPrecision"
        >
          {renderedLayers}
        </svg>
      </div>
    </div>
  );
};
