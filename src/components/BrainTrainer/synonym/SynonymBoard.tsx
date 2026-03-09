import { motion } from "framer-motion";

import type { FeedbackState } from "../../../hooks/useGameFeedback";
import GameQuestionCard from "../shared/GameQuestionCard";
import GameOptionButton from "../shared/GameOptionButton";
import type { FeedbackResult } from "../shared/GameOptionButton";
import type { SynonymPhase, SynonymQuestion } from "./types";

interface SynonymBoardProps {
  currentQuestion: SynonymQuestion | null;
  feedbackState: FeedbackState | null;
  localPhase: SynonymPhase;
  onAnswer: (answerId: string) => void;
}

const SynonymBoard = ({
  currentQuestion,
  feedbackState,
  localPhase,
  onAnswer,
}: SynonymBoardProps) => {
  if (localPhase !== "ready" || !currentQuestion) {
    return null;
  }

  const hasFeedback = feedbackState !== null;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4">
      <motion.div
        key={`q-${currentQuestion.id}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl space-y-4"
      >
        <GameQuestionCard
          badge="Eş Anlamlısı Nedir?"
          badgeColor="cyber-pink"
          question={currentQuestion.word}
          animationKey={currentQuestion.id}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {currentQuestion.options.map((option, index) => {
            const feedbackResult: FeedbackResult = hasFeedback
              ? option.id === currentQuestion.correctOptionId
                ? "correct"
                : "dimmed"
              : null;

            return (
              <GameOptionButton
                key={option.id}
                variant="text"
                label={option.text}
                optionLetter={option.id.toUpperCase()}
                onClick={() => onAnswer(option.id)}
                disabled={hasFeedback}
                feedbackResult={feedbackResult}
                animationDelay={index * 0.1}
              />
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default SynonymBoard;
