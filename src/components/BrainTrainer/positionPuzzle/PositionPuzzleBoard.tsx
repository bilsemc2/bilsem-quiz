import React from "react";
import { motion } from "framer-motion";

import { OPTION_BUTTON_COLORS } from "./constants";
import ShapeRenderer from "./ShapeRenderer";
import type { PuzzleState } from "./types";

interface PositionPuzzleBoardProps {
  puzzle: PuzzleState;
  canvasSize: number;
  selectedId: number | null;
  isLocked: boolean;
  onAnswer: (optionId: number) => void;
}

const getOptionClasses = (
  optionId: number,
  correctOptionId: number,
  selectedId: number | null,
) => {
  const isSelected = selectedId === optionId;
  const isCorrectOption = optionId === correctOptionId;
  const hasSelection = selectedId !== null;

  let borderClass = "border-black/10";
  let backgroundClass = "bg-white dark:bg-slate-800";
  let extraClass = "";

  if (hasSelection) {
    if (isSelected && isCorrectOption) {
      borderClass = "border-cyber-green";
      backgroundClass = "bg-cyber-green/15";
      extraClass = "ring-2 ring-cyber-green shadow-none translate-y-1";
    } else if (isSelected) {
      borderClass = "border-cyber-pink";
      backgroundClass = "bg-cyber-pink/15";
      extraClass = "ring-2 ring-cyber-pink shadow-none translate-y-1";
    } else if (isCorrectOption) {
      borderClass = "border-cyber-green";
      backgroundClass = "bg-cyber-green/10";
      extraClass = "ring-2 ring-cyber-green";
    } else {
      extraClass = "opacity-40";
    }
  }

  return { borderClass, backgroundClass, extraClass };
};

const PositionPuzzleBoard: React.FC<PositionPuzzleBoardProps> = ({
  puzzle,
  canvasSize,
  selectedId,
  isLocked,
  onAnswer,
}) => {
  return (
    <motion.div
      key="game"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-4 w-full max-w-5xl mx-auto"
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border-2 border-black/10 shadow-neo-sm text-center relative w-full flex items-center justify-center flex-col">
        <span className="text-xs font-nunito font-black uppercase tracking-widest mb-3 flex items-center justify-center gap-2 bg-cyber-yellow text-black px-3 py-1.5 rounded-full border-2 border-black/10 shadow-neo-sm">
          Analiz Edilecek Konum
        </span>

        <div className="bg-[#FAF9F6] dark:bg-slate-700/50 rounded-xl p-2 border-2 border-black/10 shadow-inner inline-block aspect-square flex items-center justify-center w-full max-w-[280px]">
          <ShapeRenderer
            shapes={puzzle.shapes}
            dot={puzzle.targetPoint}
            size={Math.min(canvasSize * 0.55, 220)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
        {puzzle.options.map((option, index) => {
          const { borderClass, backgroundClass, extraClass } = getOptionClasses(
            option.id,
            puzzle.correctOptionId,
            selectedId,
          );

          return (
            <motion.button
              key={option.id}
              whileTap={!isLocked ? { scale: 0.95 } : {}}
              onClick={() => onAnswer(option.id)}
              disabled={isLocked}
              className={`relative aspect-square rounded-xl overflow-hidden border-2 ${borderClass} transition-all p-2 lg:p-3 ${backgroundClass} shadow-neo-sm disabled:cursor-not-allowed flex items-center justify-center active:translate-y-1 active:shadow-none ${extraClass}`}
            >
              <ShapeRenderer
                shapes={puzzle.shapes}
                dot={option.point}
                rotation={option.rotation}
                size={Math.min(canvasSize * 0.45, 180)}
              />

              <div
                className={`absolute top-1.5 left-1.5 w-7 h-7 ${OPTION_BUTTON_COLORS[index % OPTION_BUTTON_COLORS.length]} border-2 border-black/10 rounded-md flex items-center justify-center text-xs font-nunito font-black text-black shadow-neo-sm`}
              >
                {String.fromCharCode(65 + index)}
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default PositionPuzzleBoard;
