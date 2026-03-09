import { motion } from "framer-motion";

import { getQuestionTypeLabel } from "./logic";
import type { Question } from "./types";

interface NumberCipherBoardProps {
  currentQuestion: Question;
  feedbackActive: boolean;
  onAnswer: (value: number) => void;
  selectedAnswer: number | null;
}

const NumberCipherBoard = ({
  currentQuestion,
  feedbackActive,
  onAnswer,
  selectedAnswer,
}: NumberCipherBoardProps) => {
  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-4">
      <div className="w-full rounded-[2rem] border-2 border-black/10 bg-white p-5 shadow-neo-sm dark:bg-slate-800 sm:p-6">
        <div className="mb-4 text-center">
          <span className="inline-block rotate-1 rounded-full border-2 border-black/10 bg-cyber-purple px-5 py-1.5 font-nunito text-xs font-black uppercase tracking-widest text-white shadow-neo-sm">
            {getQuestionTypeLabel(currentQuestion.type)}
          </span>
        </div>

        <div className="mb-4 space-y-2">
          {currentQuestion.display.map((line, index) => (
            <motion.div
              key={line}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-2xl border-2 border-black/10 bg-slate-50 p-3 text-center font-mono text-xl font-bold text-black shadow-neo-sm dark:bg-slate-700/50 dark:text-white sm:p-4 sm:text-2xl"
            >
              {line}
            </motion.div>
          ))}
        </div>

        <div className="mb-4 rotate-1 rounded-[1.5rem] border-2 border-black/10 bg-cyber-yellow p-4 text-center shadow-neo-sm sm:p-5">
          <p className="mb-1 font-nunito text-xs font-black uppercase tracking-widest text-black/70">
            Sıra Sende
          </p>
          <h2 className="font-mono text-4xl font-black tracking-tighter text-black sm:text-5xl">
            {currentQuestion.question}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {currentQuestion.options.map((option) => {
            const isSelected = selectedAnswer === option;
            const isCorrect = option === currentQuestion.answer;
            const revealCorrect = selectedAnswer !== null && isCorrect;

            let buttonClass =
              "bg-white text-black dark:bg-slate-700 dark:text-white";
            if (isSelected && isCorrect) {
              buttonClass = "bg-cyber-green text-black";
            } else if (isSelected && !isCorrect) {
              buttonClass = "bg-cyber-pink text-black";
            } else if (revealCorrect) {
              buttonClass = "bg-cyber-green text-black";
            }

            return (
              <motion.button
                key={option}
                whileTap={
                  selectedAnswer === null && !feedbackActive
                    ? { scale: 0.95 }
                    : {}
                }
                onClick={() => onAnswer(option)}
                disabled={selectedAnswer !== null || feedbackActive}
                className={`rounded-[1.5rem] border-2 border-black/10 py-5 font-mono text-3xl font-black shadow-neo-sm transition-colors hover:shadow-neo-sm sm:py-6 sm:text-4xl ${buttonClass}`}
              >
                {option}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default NumberCipherBoard;
