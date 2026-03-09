import React from "react";
import { motion } from "framer-motion";
import { Eye } from "lucide-react";

import { PIECE_SIZE, SVG_SIZE } from "./constants";
import PatternSvg from "./PatternSvg";
import type { GameOption, PatternLayer, TargetPosition } from "./types";

interface PartWholeBoardProps {
  feedbackState: { correct: boolean; message: string } | null;
  gamePattern: PatternLayer[];
  options: GameOption[];
  selectedAnswer: number | null;
  targetPos: TargetPosition;
  onAnswer: (option: GameOption, index: number) => void;
}

const PartWholeBoard: React.FC<PartWholeBoardProps> = ({
  feedbackState,
  gamePattern,
  options,
  selectedAnswer,
  targetPos,
  onAnswer,
}) => {
  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
      <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-5 sm:p-8 md:p-10 border-2 border-black/10 shadow-neo-sm dark:shadow-[16px_16px_0_#0f172a] text-center rotate-1 flex flex-col items-center">
        <span className="text-sm font-nunito font-black uppercase tracking-widest mb-6 flex items-center justify-center gap-2 bg-cyber-pink text-black px-4 py-2 rounded-full border-2 border-black/10 shadow-neo-sm">
          <Eye size={18} className="stroke-[3]" /> Deseni Incele
        </span>

        <div className="inline-block p-4 bg-slate-50 dark:bg-slate-700/50 rounded-[2rem] border-2 border-black/10 shadow-neo-sm">
          <PatternSvg
            pattern={gamePattern}
            size={SVG_SIZE}
            targetPos={targetPos}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-5 sm:p-8 md:p-10 border-2 border-black/10 shadow-neo-sm dark:shadow-[16px_16px_0_#0f172a] -rotate-1">
        <h2 className="text-3xl font-nunito font-black text-center mb-8 flex items-center justify-center gap-3 uppercase text-black dark:text-white">
          Eksik Parcayi Bul
        </h2>

        <div className="grid grid-cols-2 gap-4 sm:gap-6">
          {options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = isSelected && option.isCorrect;
            const isWrong = isSelected && !option.isCorrect;
            let buttonClass = "bg-white dark:bg-slate-700 text-black";

            if (isCorrect) {
              buttonClass = "bg-cyber-green text-black";
            } else if (isWrong) {
              buttonClass = "bg-cyber-pink text-black";
            } else if (selectedAnswer !== null && option.isCorrect) {
              buttonClass = "bg-cyber-green text-black";
            }

            return (
              <motion.button
                key={`${option.isCorrect}-${index}`}
                whileTap={
                  selectedAnswer === null && !feedbackState
                    ? { scale: 0.98 }
                    : {}
                }
                onClick={() => onAnswer(option, index)}
                disabled={selectedAnswer !== null || !!feedbackState}
                className={`p-4 rounded-3xl border-2 border-black/10 shadow-neo-sm hover:shadow-neo-sm flex items-center justify-center transition-colors ${buttonClass}`}
              >
                <PatternSvg
                  pattern={option.pattern}
                  size={120}
                  viewBox={`${targetPos.x} ${targetPos.y} ${PIECE_SIZE} ${PIECE_SIZE}`}
                />
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PartWholeBoard;
