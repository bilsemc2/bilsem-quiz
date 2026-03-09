import { motion } from "framer-motion";

import { isCellWrong } from "./logic";
import type { ActiveCell, GridMatrix } from "./types";

interface MathGridMatrixProps {
  activeCell: ActiveCell | null;
  grid: GridMatrix;
  onCellClick: (row: number, col: number) => void;
  showErrors: boolean;
}

const MathGridMatrix = ({
  activeCell,
  grid,
  onCellClick,
  showErrors,
}: MathGridMatrixProps) => (
  <div className="grid grid-cols-3 gap-2 sm:gap-3 p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-700 border-2 border-black/10 shadow-neo-sm w-full transition-all">
    {grid.map((row, rowIndex) =>
      row.map((cell, colIndex) => {
        const isSelected = activeCell?.r === rowIndex && activeCell?.c === colIndex;
        const wrongCell = showErrors && isCellWrong(cell);

        return (
          <motion.div
            key={`${rowIndex}-${colIndex}`}
            whileTap={cell.isMissing ? { scale: 0.95 } : {}}
            onClick={() => onCellClick(rowIndex, colIndex)}
            className={`aspect-square rounded-xl flex items-center justify-center text-2xl sm:text-3xl font-nunito font-black relative transition-all duration-200 border-2 border-black/10 shadow-neo-sm ${
              cell.isMissing ? "cursor-pointer" : ""
            } ${
              isSelected
                ? "border-cyber-pink shadow-none translate-y-1 bg-cyber-pink text-white"
                : wrongCell
                  ? "bg-cyber-pink text-black animate-pulse"
                  : cell.isMissing
                    ? "bg-white dark:bg-slate-800 text-cyber-yellow"
                    : "bg-cyber-yellow text-black"
            }`}
          >
            {cell.isMissing ? <span>{cell.userValue || "?"}</span> : <span>{cell.value}</span>}
          </motion.div>
        );
      }),
    )}
  </div>
);

export default MathGridMatrix;
