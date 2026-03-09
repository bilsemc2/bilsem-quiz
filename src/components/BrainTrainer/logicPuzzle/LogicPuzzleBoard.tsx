import React from "react";
import { motion } from "framer-motion";
import { FlaskConical } from "lucide-react";

import type { FeedbackState } from "../../../hooks/useGameFeedback";
import LogicPuzzleShape from "./LogicPuzzleShape";
import type { PuzzleData } from "./types";

interface LogicPuzzleBoardProps {
  puzzle: PuzzleData;
  selectedIndex: number | null;
  feedbackState: FeedbackState | null;
  onGuess: (index: number) => void;
}

const getOptionClassName = (
  isSelected: boolean,
  isCorrectOption: boolean,
  hasSelected: boolean,
) => {
  if (!hasSelected) {
    return "border-black/10 bg-white dark:bg-slate-800";
  }

  if (isSelected && isCorrectOption) {
    return "border-cyber-green bg-cyber-green/20 ring-2 ring-cyber-green shadow-none translate-y-1";
  }

  if (isSelected && !isCorrectOption) {
    return "border-cyber-pink bg-cyber-pink/20 ring-2 ring-cyber-pink shadow-none translate-y-1";
  }

  if (!isSelected && isCorrectOption) {
    return "border-cyber-green bg-cyber-green/10 ring-2 ring-cyber-green";
  }

  return "border-black/5 bg-slate-100 dark:bg-slate-700 opacity-40";
};

const LogicPuzzleBoard: React.FC<LogicPuzzleBoardProps> = ({
  puzzle,
  selectedIndex,
  feedbackState,
  onGuess,
}) => {
  return (
    <motion.div
      key="game"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-2xl"
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border-2 border-black/10 shadow-neo-sm mb-4">
        <h2 className="text-xs font-nunito font-black text-cyber-blue uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
          <FlaskConical size={16} className="stroke-[3]" />
          Referans Gruplar
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {puzzle.examples.map((example) => (
            <div
              key={example.id}
              className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border-2 border-black/10 flex items-center justify-center gap-3 shadow-[inset_0_4px_8px_rgba(0,0,0,0.1)]"
            >
              {example.shapes.map((shape) => (
                <LogicPuzzleShape key={shape.id} data={shape} size={42} />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {puzzle.options.map((option, index) => {
          const isSelected = selectedIndex === index;
          const hasSelected = selectedIndex !== null;
          const className = getOptionClassName(
            isSelected,
            option.isCorrect,
            hasSelected,
          );

          return (
            <motion.button
              key={option.group.id}
              whileTap={!feedbackState ? { scale: 0.98 } : {}}
              onClick={() => onGuess(index)}
              disabled={selectedIndex !== null || !!feedbackState}
              className={`p-4 sm:p-5 rounded-2xl flex flex-wrap items-center justify-center gap-3 transition-all duration-300 border-2 shadow-neo-sm active:translate-y-1 active:shadow-none ${className}`}
            >
              {option.group.shapes.map((shape) => (
                <LogicPuzzleShape key={shape.id} data={shape} size={42} />
              ))}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default LogicPuzzleBoard;
