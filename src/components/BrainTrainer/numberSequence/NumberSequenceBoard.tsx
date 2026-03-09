import React from "react";
import { motion } from "framer-motion";

import { OPTION_COLORS } from "./constants";
import type { NumberSequenceQuestion } from "./types";

interface NumberSequenceBoardProps {
  currentQuestion: NumberSequenceQuestion | null;
  isLocked: boolean;
  onAnswer: (value: number) => void;
  selectedAnswer: number | null;
}

const NumberSequenceBoard: React.FC<NumberSequenceBoardProps> = ({
  currentQuestion,
  isLocked,
  onAnswer,
  selectedAnswer,
}) => {
  if (!currentQuestion) {
    return null;
  }

  return (
    <div className="w-full max-w-2xl space-y-12">
      <div className="flex flex-col items-center gap-8">
        <span className="rounded-xl border-2 border-black/10 bg-white px-4 py-2 text-sm font-nunito font-black uppercase tracking-widest text-black shadow-neo-sm dark:bg-slate-800 dark:text-white">
          Oruntuyu Tamamla
        </span>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5">
          {currentQuestion.sequence.map((value, index) => (
            <div
              key={`${value}-${index}`}
              className="flex h-16 w-16 items-center justify-center rounded-3xl border-2 border-black/10 bg-white shadow-neo-sm dark:bg-slate-800 sm:h-24 sm:w-24"
            >
              <span className="font-nunito text-2xl font-black text-black dark:text-white sm:text-4xl">
                {value}
              </span>
            </div>
          ))}

          <div className="flex h-16 w-16 animate-[pulse_2s_infinite] items-center justify-center rounded-3xl border-2 border-black/10 bg-cyber-pink shadow-neo-sm sm:h-24 sm:w-24">
            <span className="font-nunito text-3xl font-black text-white sm:text-5xl">
              ?
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-12 grid w-full max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
        {currentQuestion.options.map((option, index) => {
          const isSelected = selectedAnswer === option;
          const isCorrectOption = option === currentQuestion.answer;

          let buttonClassName = `${OPTION_COLORS[index % OPTION_COLORS.length]} text-black`;

          if (isSelected) {
            buttonClassName = isCorrectOption
              ? "bg-cyber-green text-black"
              : "bg-cyber-pink text-white";
          }

          return (
            <motion.button
              key={`${option}-${index}`}
              whileTap={!isLocked ? { scale: 0.95 } : {}}
              onClick={() => onAnswer(option)}
              disabled={isLocked}
              className={`rounded-[2rem] border-2 border-black/10 p-6 shadow-neo-sm transition-all hover:-translate-y-1 hover:shadow-neo-sm active:translate-y-2 active:shadow-none disabled:cursor-not-allowed disabled:opacity-50 sm:p-8 ${buttonClassName}`}
            >
              <span className="font-nunito text-3xl font-black sm:text-4xl">
                {option}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default NumberSequenceBoard;
