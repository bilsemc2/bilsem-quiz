import React from "react";
import { motion } from "framer-motion";

import type { FeedbackState } from "../../../hooks/useGameFeedback";
import GameOptionButton from "../shared/GameOptionButton";
import type { FeedbackResult } from "../shared/GameOptionButton";
import type { KnowledgeQuestion } from "./types";

interface KnowledgeCardBoardProps {
  feedbackState: FeedbackState | null;
  level: number;
  onAnswer: (answer: string) => void;
  question: KnowledgeQuestion;
}

const KnowledgeCardBoard = ({
  feedbackState,
  level,
  onAnswer,
  question,
}: KnowledgeCardBoardProps) => {
  return (
    <motion.div
      key="game"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-3xl space-y-4"
    >
      <div className="w-full p-5 sm:p-6 bg-white dark:bg-slate-800 rounded-2xl border-2 border-black/10 shadow-neo-sm text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-cyber-pink text-white px-4 py-1.5 rounded-full font-nunito font-black uppercase tracking-widest text-xs border-2 border-black/10 shadow-neo-sm">
          Cümleyi Tamamla
        </div>
        <motion.h2
          key={level}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-xl lg:text-2xl font-nunito font-medium leading-relaxed text-slate-800 dark:text-slate-100 mt-4"
        >
          {question.displayText.split("_____").map((part, index, parts) => (
            <React.Fragment key={index}>
              {part}
              {index < parts.length - 1 ? (
                <span className="inline-block px-2 py-0.5 rounded-lg mx-1.5 border-2 border-dashed bg-slate-100 dark:bg-slate-700 border-slate-400 text-slate-400 font-nunito font-bold">
                  .....
                </span>
              ) : null}
            </React.Fragment>
          ))}
        </motion.h2>
      </div>

      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
        {question.options.map((option, index) => {
          const isCorrect =
            option.toLowerCase() === question.correctAnswer.toLowerCase();
          const showResult = Boolean(feedbackState);
          const feedbackResult: FeedbackResult = showResult
            ? isCorrect
              ? "correct"
              : "dimmed"
            : null;

          return (
            <GameOptionButton
              key={`${question.id}-${option}-${index}`}
              variant="text"
              label={option}
              optionLetter={String.fromCharCode(65 + index)}
              onClick={() => onAnswer(option)}
              disabled={showResult}
              feedbackResult={feedbackResult}
              animationDelay={index * 0.1}
            />
          );
        })}
      </div>
    </motion.div>
  );
};

export default KnowledgeCardBoard;
