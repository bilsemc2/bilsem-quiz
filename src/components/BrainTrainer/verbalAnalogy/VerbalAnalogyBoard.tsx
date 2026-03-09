import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, LoaderCircle } from "lucide-react";

import type { FeedbackState } from "../../../hooks/useGameFeedback";
import type { VerbalAnalogyQuestion, VerbalAnalogyPhase } from "./types";

interface VerbalAnalogyBoardProps {
  currentQuestion: VerbalAnalogyQuestion | null;
  feedbackState: FeedbackState | null;
  localPhase: VerbalAnalogyPhase;
  onAnswer: (answerId: string) => void;
}

const VerbalAnalogyBoard: React.FC<VerbalAnalogyBoardProps> = ({
  currentQuestion,
  feedbackState,
  localPhase,
  onAnswer,
}) => {
  if (localPhase === "loading") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-4 text-center">
        <LoaderCircle className="h-10 w-10 animate-spin text-cyber-blue" />
        <p className="font-nunito text-lg font-black uppercase tracking-widest text-black dark:text-white">
          Sorular yükleniyor
        </p>
      </div>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  const isResolved = feedbackState !== null;

  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-4">
      <motion.div
        key={`q-${currentQuestion.id}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl space-y-4"
      >
        <div className="relative rounded-2xl border-2 border-black/10 bg-white p-5 text-center shadow-neo-sm dark:bg-slate-800 sm:p-6">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-black/10 bg-cyber-blue px-4 py-1.5 text-xs font-black uppercase tracking-widest text-white shadow-neo-sm">
            İlişkiyi Bul
          </div>

          <motion.h2
            key={currentQuestion.id}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mt-4 break-words text-center font-nunito text-2xl font-black uppercase leading-relaxed tracking-widest text-black dark:text-white sm:text-4xl"
          >
            {currentQuestion.text}
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {currentQuestion.options.map((option, index) => {
            const isCorrectOption = option.id === currentQuestion.correctOptionId;
            let buttonClass =
              "bg-white dark:bg-slate-800 text-black dark:text-white";

            if (isResolved) {
              if (isCorrectOption) {
                buttonClass = "bg-cyber-green text-black animate-pulse";
              } else {
                buttonClass =
                  "bg-slate-200 text-slate-500 opacity-50 dark:bg-slate-700";
              }
            }

            return (
              <motion.button
                key={option.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => onAnswer(option.id)}
                disabled={isResolved}
                whileTap={!isResolved ? { scale: 0.95 } : {}}
                className={`flex items-center gap-3 rounded-xl border-2 border-black/10 p-4 font-nunito text-base font-black shadow-neo-sm transition-all active:translate-y-1 active:shadow-none sm:p-5 sm:text-lg ${buttonClass}`}
              >
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border-2 border-black/10 bg-slate-100 font-nunito text-sm font-black text-black dark:bg-slate-700 sm:h-10 sm:w-10">
                  {option.id}
                </span>
                <span className="flex-1 truncate text-left">{option.text}</span>
                {isResolved && isCorrectOption ? (
                  <CheckCircle2 className="stroke-[3] text-black" size={24} />
                ) : null}
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default VerbalAnalogyBoard;
