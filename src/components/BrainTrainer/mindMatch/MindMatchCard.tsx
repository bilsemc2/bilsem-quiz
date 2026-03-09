import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

import type { PuzzleItem } from "./types";

const getCardClass = (
  item: PuzzleItem,
  isSelected: boolean,
  isRevealed: boolean,
) => {
  if (isRevealed) {
    if (item.isMatch && isSelected) {
      return "bg-cyber-green text-black border-2 border-black/10 shadow-none translate-y-1";
    }

    if (item.isMatch && !isSelected) {
      return "bg-cyber-blue text-white border-2 border-dashed border-black/10 shadow-neo-sm opacity-50";
    }

    if (!item.isMatch && isSelected) {
      return "bg-cyber-pink text-black border-2 border-black/10 shadow-none translate-y-1 animate-pulse";
    }

    return "bg-white dark:bg-slate-800 text-black border-2 border-black/10 shadow-neo-sm opacity-30";
  }

  if (isSelected) {
    return "bg-cyber-yellow text-black border-2 border-black/10 shadow-neo-sm translate-y-0.5";
  }

  return "bg-white dark:bg-slate-800 text-slate-800 dark:text-white border-2 border-black/10 shadow-neo-sm";
};

interface MindMatchCardProps {
  item: PuzzleItem;
  index: number;
  isSelected: boolean;
  isRevealed: boolean;
  disabled: boolean;
  onToggle: (id: string) => void;
}

const MindMatchCard: React.FC<MindMatchCardProps> = ({
  item,
  index,
  isSelected,
  isRevealed,
  disabled,
  onToggle,
}) => {
  const className = getCardClass(item, isSelected, isRevealed);

  return (
    <motion.button
      whileTap={!disabled ? { scale: 0.95 } : {}}
      onClick={() => onToggle(item.id)}
      disabled={disabled}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`relative rounded-xl flex flex-col items-center justify-center p-3 sm:p-4 transition-all duration-200 active:translate-y-1 active:shadow-none ${className}`}
    >
      <span className="text-3xl sm:text-5xl select-none mb-1">{item.emoji}</span>
      <span className="text-xs sm:text-sm font-nunito font-black text-center leading-tight">
        {item.name}
      </span>

      {isSelected ? (
        <div className="absolute -top-2 -right-2 w-7 h-7 bg-cyber-green border-2 border-black/10 rounded-lg flex items-center justify-center shadow-neo-sm z-10">
          <Check size={14} className="text-black stroke-[3]" />
        </div>
      ) : null}
    </motion.button>
  );
};

export default MindMatchCard;
