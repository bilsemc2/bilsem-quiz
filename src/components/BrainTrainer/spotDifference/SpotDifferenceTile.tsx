import React from "react";
import { motion } from "framer-motion";

import { GHOST_PATH } from "./constants";
import { clamp } from "./logic";
import type { TileData } from "./types";

interface SpotDifferenceTileProps {
  tile: TileData;
  isOdd: boolean;
  isSelected: boolean;
  isRevealed: boolean;
  onClick: () => void;
  disabled: boolean;
}

const SpotDifferenceTile: React.FC<SpotDifferenceTileProps> = ({
  tile,
  isOdd,
  isSelected,
  isRevealed,
  onClick,
  disabled,
}) => {
  const { style, decor } = tile;
  const isBrightTile = style.light >= 60;
  const innerHue = (style.hue + (isBrightTile ? 190 : 170) + 360) % 360;
  const innerSat = clamp(style.sat + 10, 45, 98);
  const innerLight = isBrightTile ? 22 : 88;
  const innerStroke = isBrightTile
    ? "rgba(0,0,0,0.78)"
    : "rgba(255,255,255,0.9)";
  const ghostLight = clamp(style.light + 22, 20, 94);
  const bgHighlightLight = clamp(style.light + 14, 12, 92);
  const bgBaseLight = clamp(style.light, 8, 86);

  return (
    <motion.button
      whileTap={disabled ? {} : { scale: 0.95 }}
      animate={
        isRevealed && isOdd
          ? {
              scale: [1, 1.08, 1],
              boxShadow: [
                "0 0 0 4px rgba(52,211,153,0.3)",
                "0 0 0 8px rgba(52,211,153,0.5)",
                "0 0 0 4px rgba(52,211,153,0.3)",
              ],
            }
          : {}
      }
      transition={isRevealed && isOdd ? { duration: 1, repeat: Infinity } : {}}
      onClick={onClick}
      disabled={disabled}
      className="aspect-square relative overflow-hidden grid place-items-center rounded-2xl"
      style={{
        background: `radial-gradient(circle at 25% 20%, hsl(${style.hue} ${style.sat}% ${bgHighlightLight}%), hsl(${style.hue} ${style.sat}% ${bgBaseLight}%))`,
        borderRadius: `${style.radius}%`,
        transform: `rotate(${style.rotate}deg) scale(${style.scale})`,
        border:
          isRevealed && isOdd
            ? "4px solid #14f195"
            : isSelected
              ? "4px solid #ff2745"
              : "4px solid #000",
        boxShadow:
          isRevealed && isOdd
            ? "0 0 0 4px rgba(20,241,149,0.3), inset 0 -6px 12px rgba(0,0,0,0.15)"
            : isSelected
              ? "0 0 0 4px rgba(255,39,69,0.3), inset 0 -6px 12px rgba(0,0,0,0.15)"
              : "4px 4px 0 #000, inset 0 -4px 8px rgba(255,255,255,0.2)",
        cursor: disabled ? "default" : "pointer",
      }}
    >
      <span
        className="absolute rounded-full pointer-events-none"
        style={{
          width: `${decor.d1s}%`,
          height: `${decor.d1s}%`,
          top: `${decor.d1y}%`,
          left: `${decor.d1x}%`,
          opacity: 0.45,
          background: `radial-gradient(circle at 30% 30%, hsla(${style.hue + 28}, ${style.sat}%, ${style.light + 26}%, 0.7), transparent 70%)`,
          filter: "blur(0.4px)",
        }}
      />

      <span
        className="absolute rounded-full pointer-events-none"
        style={{
          width: `${decor.d2s}%`,
          height: `${decor.d2s}%`,
          top: `${decor.d2y}%`,
          left: `${decor.d2x}%`,
          opacity: 0.35,
          background: `radial-gradient(circle at 70% 30%, hsla(${style.hue - 22}, ${style.sat}%, ${style.light + 22}%, 0.6), transparent 70%)`,
          filter: "blur(0.4px)",
        }}
      />

      <svg
        className="absolute pointer-events-none"
        style={{
          inset: "8%",
          fill: `hsl(${(style.hue + 36 + 360) % 360} ${style.sat}% ${ghostLight}%)`,
          opacity: 0.18,
        }}
        viewBox="0 0 100 100"
      >
        <path d={GHOST_PATH} />
      </svg>

      <svg
        className="absolute pointer-events-none"
        style={{
          inset: "18%",
          filter: isBrightTile
            ? "drop-shadow(0 2px 2px rgba(255,255,255,0.25))"
            : "drop-shadow(0 2px 2px rgba(0,0,0,0.35))",
          opacity: 0.98,
        }}
        viewBox="0 0 100 100"
      >
        <path
          d={tile.shape.path}
          fill={`hsl(${innerHue} ${innerSat}% ${innerLight}%)`}
          stroke={innerStroke}
          strokeWidth={4.5}
          strokeLinejoin="round"
        />
      </svg>
    </motion.button>
  );
};

export default SpotDifferenceTile;
