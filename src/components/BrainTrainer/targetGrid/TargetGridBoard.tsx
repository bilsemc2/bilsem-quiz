import { motion } from "framer-motion";

import TargetGridCard from "./TargetGridCard";
import TargetGridStatusPanel from "./TargetGridStatusPanel";
import type { Card } from "./types";

interface TargetGridBoardProps {
  cards: Card[];
  currentSum: number;
  feedbackCorrect: boolean | null;
  isPreview: boolean;
  onSelectCard: (index: number) => void;
  previewTimer: number;
  selectedIndices: number[];
  targetSum: number;
}

const TargetGridBoard = ({
  cards,
  currentSum,
  feedbackCorrect,
  isPreview,
  onSelectCard,
  previewTimer,
  selectedIndices,
  targetSum,
}: TargetGridBoardProps) => (
  <motion.div
    key="target-grid"
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col md:flex-row items-center justify-center gap-8 w-full max-w-4xl"
  >
    <TargetGridStatusPanel
      currentSum={currentSum}
      isPreview={isPreview}
      previewTimer={previewTimer}
      targetSum={targetSum}
    />

    <div className="w-full md:w-2/3 flex-1 relative">
      <div
        className={`grid grid-cols-4 gap-2 sm:gap-4 p-4 sm:p-6 bg-slate-200 dark:bg-slate-700 rounded-2xl border-2 border-black/10 shadow-neo-sm aspect-square transition-all ${
          isPreview ? "border-cyber-green" : ""
        }`}
      >
        {cards.map((card, index) => (
          <TargetGridCard
            key={card.id}
            card={card}
            feedbackCorrect={feedbackCorrect}
            index={index}
            isPreview={isPreview}
            isSelected={selectedIndices.includes(index)}
            onSelect={onSelectCard}
          />
        ))}
      </div>
    </div>
  </motion.div>
);

export default TargetGridBoard;
