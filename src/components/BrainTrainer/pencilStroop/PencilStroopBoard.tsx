import React from "react";
import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import { Pencil } from "lucide-react";

import type { PencilStroopRound } from "./types";

interface PencilStroopBoardProps {
  currentRound: PencilStroopRound | null;
  selectedAnswer: string | null;
  isLocked: boolean;
  onAnswer: (answer: string) => void;
}

const PencilStroopBoard: React.FC<PencilStroopBoardProps> = ({
  currentRound,
  isLocked,
  onAnswer,
  selectedAnswer,
}) => {
  if (!currentRound) {
    return null;
  }

  return (
    <div className="relative z-10 flex flex-col items-center justify-center p-2 flex-1">
      <motion.div
        key="game"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md space-y-6"
      >
        <div className="flex flex-col items-center gap-4">
          <motion.div
            key={currentRound.pencilColorObj.hex}
            initial={{ rotate: -10, y: 20 }}
            animate={{ rotate: 5, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="relative"
          >
            <Pencil
              size={140}
              style={{
                color: currentRound.pencilColorObj.hex,
                fill: currentRound.pencilColorObj.hex,
              }}
              className="drop-shadow-[4px_4px_0_rgba(0,0,0,1)] dark:drop-shadow-[4px_4px_0_rgba(255,255,255,1)]"
              strokeWidth={1}
            />
            <div className="absolute inset-x-0 top-[25%] flex origin-center transform justify-center text-center pointer-events-none -rotate-45">
              <span
                className="rounded-md border-3 border-white/30 px-3 py-1.5 font-nunito text-2xl font-black uppercase tracking-widest shadow-[3px_3px_0_rgba(0,0,0,0.3)] sm:text-3xl"
                style={{
                  transform: "translateY(1.5rem)",
                  color: currentRound.labelTextColor.hex,
                  backgroundColor: "rgba(0,0,0,0.75)",
                  textShadow: `0 0 8px ${currentRound.labelTextColor.hex}40`,
                }}
              >
                {currentRound.wordObj.name}
              </span>
            </div>
          </motion.div>

          <div className="rounded-xl border-2 border-black/10 bg-white px-6 py-2.5 shadow-neo-sm dark:bg-slate-800">
            <span className="font-nunito text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 sm:text-sm">
              KALEMİN RENGİ NE?
            </span>
          </div>
        </div>

        <div className="relative z-20 grid w-full grid-cols-2 gap-3 px-2">
          {currentRound.options.map((option, index) => {
            const isSelected = selectedAnswer === option.name;
            const isCorrect = isSelected && option.name === currentRound.correctAnswer;
            const isWrong = isSelected && option.name !== currentRound.correctAnswer;
            const style = currentRound.optionStyles[index];

            let buttonClass: string;
            let textStyle: CSSProperties = {};

            if (isCorrect) {
              buttonClass = "bg-cyber-green text-black";
            } else if (isWrong) {
              buttonClass = "bg-cyber-pink text-black";
            } else if (
              selectedAnswer !== null &&
              option.name === currentRound.correctAnswer
            ) {
              buttonClass = "bg-cyber-green text-black";
            } else {
              buttonClass = `${style.bgColor.lightBg} border-2 border-black/10`;
              textStyle = { color: style.textColor.hex };
            }

            return (
              <motion.button
                key={option.name}
                whileTap={!selectedAnswer ? { scale: 0.95 } : {}}
                onClick={() => onAnswer(option.name)}
                disabled={isLocked}
                className={`relative overflow-hidden rounded-xl border-2 border-black/10 p-4 font-nunito text-xl font-black shadow-neo-sm transition-colors active:translate-y-1 active:shadow-none sm:text-2xl ${buttonClass}`}
              >
                <span className="relative z-10" style={textStyle}>
                  {option.name}
                </span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default PencilStroopBoard;
