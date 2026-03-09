import { motion } from "framer-motion";

import type { Question } from "./types";

interface NumberMemoryQuestionViewProps {
  onAnswer: (value: number) => void;
  question: Question;
  selectedAnswer: number | null;
}

const NumberMemoryQuestionView = ({
  onAnswer,
  question,
  selectedAnswer,
}: NumberMemoryQuestionViewProps) => {
  return (
    <motion.div
      key="question"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex w-full max-w-md flex-col items-center gap-4"
    >
      <div className="w-full rounded-2xl border-2 border-black/10 bg-white p-5 text-center shadow-neo-sm dark:bg-slate-800 sm:p-6">
        <span className="mb-4 inline-block rounded-full border-2 border-black/10 bg-cyber-blue px-3 py-1.5 font-nunito text-xs font-black uppercase tracking-widest text-white shadow-neo-sm">
          SORU
        </span>
        <h3 className="font-nunito text-xl font-black leading-relaxed text-black dark:text-white sm:text-2xl">
          {question.text}
        </h3>
      </div>

      <div className="grid w-full grid-cols-2 gap-2 sm:gap-3">
        {question.options.map((option) => {
          const isSelected = selectedAnswer === option;
          const isCorrect = option === question.answer;
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
              whileTap={selectedAnswer === null ? { scale: 0.95 } : {}}
              onClick={() => onAnswer(option)}
              disabled={selectedAnswer !== null}
              className={`rounded-xl border-2 border-black/10 py-4 font-nunito text-3xl font-black shadow-neo-sm transition-colors active:translate-y-1 active:shadow-none sm:text-4xl ${buttonClass}`}
            >
              {option}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default NumberMemoryQuestionView;
