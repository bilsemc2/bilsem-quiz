import { motion } from "framer-motion";

import GameOptionButton from "../shared/GameOptionButton";
import type { FeedbackResult } from "../shared/GameOptionButton";
import type { FeedbackState } from "../../../hooks/useGameFeedback";
import type { DeyimlerQuestion } from "./types";

interface DeyimlerBoardProps {
  currentQuestion: DeyimlerQuestion | null;
  feedbackState: FeedbackState | null;
  level: number;
  onAnswer: (answer: string) => void;
  selectedAnswer: string | null;
  showExplanation: boolean;
}

const DeyimlerBoard = ({
  currentQuestion,
  feedbackState,
  level,
  onAnswer,
  selectedAnswer,
  showExplanation,
}: DeyimlerBoardProps) => {
  if (!currentQuestion) {
    return null;
  }

  return (
    <div className="relative z-10 flex w-full flex-1 flex-col items-center justify-center p-2">
      <motion.div
        key={`q-${level}`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl space-y-4"
      >
        <div className="relative rounded-2xl border-2 border-black/10 bg-white p-5 text-center shadow-neo-sm dark:bg-slate-800 sm:p-6">
          <div className="absolute top-0 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-black/10 bg-cyber-pink px-4 py-1.5 text-xs font-nunito font-black uppercase tracking-widest text-white shadow-neo-sm">
            Eksik Kelimeyi Bul
          </div>

          <h2 className="mt-4 mb-2 text-xl font-nunito font-black leading-relaxed text-black dark:text-white sm:text-2xl">
            {selectedAnswer ? currentQuestion.deyim.deyim : currentQuestion.displayText}
          </h2>

          {showExplanation && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 border-t-2 border-black/5 pt-4 dark:border-white/10"
            >
              <p className="mb-1 text-xs font-nunito font-black uppercase tracking-widest text-cyber-pink">
                Açıklama
              </p>
              <p className="text-sm font-nunito leading-relaxed text-slate-600 dark:text-slate-300">
                {currentQuestion.deyim.aciklama}
              </p>
            </motion.div>
          )}
        </div>

        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === option;
            const isCorrect = option === currentQuestion.missingWord;
            const showResult = selectedAnswer !== null;

            let result: FeedbackResult = null;
            if (showResult) {
              result = isCorrect ? "correct" : isSelected ? "wrong" : "dimmed";
            }

            return (
              <GameOptionButton
                key={`${option}-${index}`}
                variant="text"
                label={option}
                optionLetter={["A", "B", "C", "D"][index]}
                onClick={() => onAnswer(option)}
                disabled={selectedAnswer !== null || feedbackState !== null}
                feedbackResult={result}
                animationDelay={index * 0.1}
              />
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default DeyimlerBoard;
