import { AnimatePresence, motion } from "framer-motion";
import { EyeOff } from "lucide-react";

import type { Card } from "./types";

interface TargetGridCardProps {
  card: Card;
  feedbackCorrect: boolean | null;
  index: number;
  isPreview: boolean;
  isSelected: boolean;
  onSelect: (index: number) => void;
}

const TargetGridCard = ({
  card,
  feedbackCorrect,
  index,
  isPreview,
  isSelected,
  onSelect,
}: TargetGridCardProps) => {
  const isSuccessSelection = feedbackCorrect === true && isSelected;
  const isWrongSelection = feedbackCorrect === false && isSelected;

  let backgroundClass =
    "bg-white dark:bg-slate-800 text-black dark:text-white border-black/10 shadow-neo-sm";

  if (card.isRevealed || isPreview) {
    if (isSuccessSelection) {
      backgroundClass = "bg-cyber-green text-black border-black/10 shadow-neo-sm";
    } else if (isWrongSelection) {
      backgroundClass = "bg-cyber-pink text-black border-black/10 shadow-neo-sm";
    } else if (isSelected) {
      backgroundClass = "bg-cyber-blue text-white border-black/10 shadow-neo-sm";
    }
  } else {
    backgroundClass = "bg-slate-300 dark:bg-slate-600 border-black/10 shadow-neo-sm";
  }

  return (
    <motion.button
      whileTap={!isPreview && !card.isRevealed && feedbackCorrect === null ? { scale: 0.95 } : {}}
      onClick={() => onSelect(index)}
      disabled={isPreview || card.isRevealed || feedbackCorrect !== null}
      className={`w-full h-full rounded-2xl sm:rounded-xl border-4 flex items-center justify-center text-3xl sm:text-5xl font-nunito font-black transition-all overflow-hidden ${backgroundClass} ${
        card.isRevealed || isPreview ? "translate-y-1 translate-x-1" : ""
      }`}
    >
      <AnimatePresence mode="popLayout">
        {card.isRevealed || isPreview ? (
          <motion.span
            key="value"
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", bounce: 0.5 }}
          >
            {card.value}
          </motion.span>
        ) : (
          <motion.span key="hidden" initial={{ scale: 0 }} animate={{ scale: 1 }}>
            <EyeOff
              className="text-slate-400/50 w-8 h-8 sm:w-12 sm:h-12"
              strokeWidth={3}
            />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export default TargetGridCard;
