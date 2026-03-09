import React from "react";
import { Eye } from "lucide-react";

import { GAP_SIZE } from "./constants";
import type { PaintingGrid, PatternPainterLevel } from "./types";

const EMPTY_TILE_STYLE = {
  backgroundColor: "#fff",
  backgroundImage: "radial-gradient(#ddd 10%, transparent 10%)",
  backgroundSize: "10px 10px",
};

const getTileStyle = (color: string) => ({
  backgroundColor: color,
});

const getCornerRadius = (row: number, column: number, size: number) => {
  if (row === 0 && column === 0) {
    return "1rem 0 0 0";
  }

  if (row === 0 && column === size - 1) {
    return "0 1rem 0 0";
  }

  if (row === size - 1 && column === 0) {
    return "0 0 0 1rem";
  }

  if (row === size - 1 && column === size - 1) {
    return "0 0 1rem 0";
  }

  return "0";
};

interface PatternPainterPreviewProps {
  currentLevel: PatternPainterLevel;
  userPainting: PaintingGrid;
}

const PatternPainterPreview: React.FC<PatternPainterPreviewProps> = ({
  currentLevel,
  userPainting,
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-6 border-2 border-black/10 shadow-neo-sm text-center flex flex-col items-center">
      <span className="text-xs font-nunito font-black uppercase tracking-widest mb-3 flex items-center justify-center gap-2 bg-cyber-yellow text-black px-3 py-1.5 rounded-full border-2 border-black/10 shadow-neo-sm">
        <Eye size={14} className="stroke-[3]" /> Deseni Incele
      </span>

      <div
        className="grid gap-[2px] p-1.5 bg-black rounded-xl border-2 border-black/10 shadow-neo-sm mx-auto mb-3"
        style={{
          gridTemplateColumns: `repeat(${currentLevel.size}, 1fr)`,
          width: "min(60vw, 280px)",
          aspectRatio: "1",
        }}
      >
        {currentLevel.grid.map((row, rowIndex) =>
          row.map((color, columnIndex) => {
            const gapRow = rowIndex - currentLevel.gapPos.row;
            const gapColumn = columnIndex - currentLevel.gapPos.column;
            const isInGap =
              gapRow >= 0 &&
              gapRow < GAP_SIZE &&
              gapColumn >= 0 &&
              gapColumn < GAP_SIZE;
            const paintedColor = isInGap
              ? userPainting[gapRow]?.[gapColumn] ?? null
              : null;
            const borderRadius = getCornerRadius(
              rowIndex,
              columnIndex,
              currentLevel.size,
            );

            return (
              <div
                key={`${rowIndex}-${columnIndex}`}
                className="w-full h-full relative"
                style={{
                  ...(isInGap && !paintedColor
                    ? EMPTY_TILE_STYLE
                    : getTileStyle(paintedColor ?? color)),
                  borderRadius,
                }}
              >
                {isInGap && !paintedColor ? (
                  <div
                    className="absolute inset-0 border-2 border-dashed border-slate-300 dark:border-slate-500 pointer-events-none"
                    style={{ borderRadius }}
                  />
                ) : null}
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
};

export default PatternPainterPreview;
