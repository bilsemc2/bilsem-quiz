import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

import type { InternalPhase, WordHuntItem } from "./types";

interface WordHuntCardProps {
  item: WordHuntItem;
  index: number;
  internalPhase: InternalPhase;
  cardColor: string;
  isSelected: boolean;
  disabled: boolean;
  onToggle: (id: string) => void;
}

const WordHuntCard: React.FC<WordHuntCardProps> = ({
  item,
  index,
  internalPhase,
  cardColor,
  isSelected,
  disabled,
  onToggle,
}) => {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        delay: index * 0.03,
        type: "spring",
        stiffness: 400,
        damping: 20,
      }}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      onClick={() => onToggle(item.id)}
      disabled={disabled}
      className={`relative py-3.5 sm:py-5 px-3 rounded-xl sm:rounded-2xl font-nunito font-black text-lg sm:text-xl tracking-[0.08em] sm:tracking-[0.12em] transition-all duration-200 border-2 border-black/10 flex items-center justify-center overflow-hidden break-all ${
        internalPhase === "exposure"
          ? "text-black"
          : isSelected
            ? "bg-cyber-green text-black shadow-neo-sm"
            : "bg-[#FAF9F6] dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-600 shadow-neo-sm"
      }`}
      style={
        internalPhase === "exposure"
          ? { backgroundColor: cardColor }
          : undefined
      }
    >
      <span className="relative z-10">{item.text}</span>

      {isSelected && internalPhase === "playing" ? (
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          className="absolute -top-1 -right-1 w-7 h-7 bg-black rounded-bl-xl rounded-tr-xl flex items-center justify-center pointer-events-none z-20"
        >
          <CheckCircle2
            size={16}
            strokeWidth={3}
            className="text-cyber-green"
          />
        </motion.div>
      ) : null}
    </motion.button>
  );
};

export default WordHuntCard;
