import React from "react";
import { motion } from "framer-motion";

import { ShapeRenderer } from "../matrix/ShapeRenderer";
import type { GameOption, MatrixCell } from "../../../types/matrixRules";

interface MatrixPuzzleBoardProps {
  grid: MatrixCell[][];
  options: GameOption[];
  selectedOption: string | null;
  onOptionSelect: (option: GameOption) => void;
}

const MatrixPuzzleBoard: React.FC<MatrixPuzzleBoardProps> = ({
  grid,
  options,
  selectedOption,
  onOptionSelect,
}) => {
  const showResult = selectedOption !== null;

  return (
    <>
      <div className="flex justify-center mb-2 w-full max-w-lg">
        <div className="grid grid-cols-3 gap-3 sm:gap-4 p-4 sm:p-6 bg-slate-50 dark:bg-slate-700 rounded-2xl border-2 border-black/10 shadow-neo-sm w-full aspect-square">
          {grid.map((row, rowIndex) =>
            row.map((cell, columnIndex) => (
              <motion.div
                key={`${rowIndex}-${columnIndex}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: (rowIndex * 3 + columnIndex) * 0.05 }}
                className="aspect-square flex items-center justify-center border-2 border-black/10 shadow-neo-sm rounded-2xl bg-white dark:bg-slate-800"
              >
                {cell.isHidden ? (
                  <span className="text-3xl sm:text-5xl font-nunito font-black text-cyber-pink">
                    ?
                  </span>
                ) : (
                  <ShapeRenderer
                    shape={cell.shape}
                    size={90}
                    isHidden={cell.isHidden}
                  />
                )}
              </motion.div>
            )),
          )}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-7 w-full max-w-4xl mx-auto">
        {options.map((option, index) => {
          const isSelected = selectedOption === option.id;
          const buttonClass = isSelected
            ? option.isCorrect
              ? "bg-cyber-green/15 border-cyber-green ring-2 ring-cyber-green shadow-none"
              : "bg-cyber-pink/15 border-cyber-pink ring-2 ring-cyber-pink shadow-none"
            : showResult && option.isCorrect
              ? "bg-cyber-green/15 border-cyber-green ring-2 ring-cyber-green shadow-none"
              : showResult
                ? "opacity-40 bg-white dark:bg-slate-700 border-black/10 shadow-neo-sm"
                : "bg-white dark:bg-slate-700 border-black/10 shadow-neo-sm hover:shadow-neo-sm hover:bg-cyber-yellow dark:hover:bg-cyber-yellow active:translate-y-2 active:shadow-none";

          return (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileTap={!showResult ? { scale: 0.95 } : {}}
              onClick={() => onOptionSelect(option)}
              disabled={showResult}
              className={`aspect-square w-[88px] sm:w-[104px] md:w-[118px] lg:w-[128px] flex items-center justify-center p-2 sm:p-3 rounded-2xl border-2 transition-all duration-300 flex-shrink-0 ${buttonClass}`}
            >
              <ShapeRenderer shape={option.shape} size={72} />
            </motion.button>
          );
        })}
      </div>
    </>
  );
};

export default MatrixPuzzleBoard;
