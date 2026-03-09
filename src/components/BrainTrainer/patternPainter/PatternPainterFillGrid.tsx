import React from "react";
import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";

import { GAP_SIZE } from "./constants";
import type { PaintingGrid } from "./types";

const EMPTY_TILE_STYLE = {
  backgroundImage: "radial-gradient(#ddd 10%, transparent 10%)",
  backgroundSize: "10px 10px",
};

const getCornerRadius = (row: number, column: number) => {
  if (row === 0 && column === 0) {
    return "1rem 0 0 0";
  }

  if (row === 0 && column === GAP_SIZE - 1) {
    return "0 1rem 0 0";
  }

  if (row === GAP_SIZE - 1 && column === 0) {
    return "0 0 0 1rem";
  }

  if (row === GAP_SIZE - 1 && column === GAP_SIZE - 1) {
    return "0 0 1rem 0";
  }

  return "0";
};

interface PatternPainterFillGridProps {
  userPainting: PaintingGrid;
  onPaintTile: (row: number, column: number) => void;
}

const PatternPainterFillGrid: React.FC<PatternPainterFillGridProps> = ({
  userPainting,
  onPaintTile,
}) => {
  return (
    <div className="grid grid-cols-2 gap-1.5 w-36 h-36 mx-auto mb-4 bg-black p-1.5 rounded-xl border-2 border-black/10 shadow-neo-sm">
      {Array.from({ length: GAP_SIZE }, (_, rowIndex) =>
        Array.from({ length: GAP_SIZE }, (_, columnIndex) => {
          const paintedColor = userPainting[rowIndex]?.[columnIndex];

          return (
            <motion.button
              key={`${rowIndex}-${columnIndex}`}
              whileTap={{ scale: 0.9 }}
              onClick={() => onPaintTile(rowIndex, columnIndex)}
              className="w-full h-full flex items-center justify-center transition-all bg-white relative overflow-hidden"
              style={{
                ...(paintedColor
                  ? { backgroundColor: paintedColor }
                  : EMPTY_TILE_STYLE),
                borderRadius: getCornerRadius(rowIndex, columnIndex),
              }}
            >
              {!paintedColor ? (
                <HelpCircle
                  className="text-slate-300 dark:text-slate-500 absolute"
                  size={20}
                />
              ) : null}
            </motion.button>
          );
        }),
      )}
    </div>
  );
};

export default PatternPainterFillGrid;
