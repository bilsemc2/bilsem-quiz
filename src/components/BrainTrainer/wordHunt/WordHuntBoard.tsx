import React from "react";
import { motion } from "framer-motion";
import { AlertCircle, Search } from "lucide-react";

import type { FeedbackState } from "../../../hooks/useGameFeedback";
import {
  CARD_COLORS,
  GRID_BACKGROUND_STYLE,
} from "./constants";
import WordHuntCard from "./WordHuntCard";
import type { InternalPhase, WordHuntRound } from "./types";

interface WordHuntBoardProps {
  round: WordHuntRound;
  selectedIds: Set<string>;
  roundTimeLeft: number;
  internalPhase: InternalPhase;
  feedbackState: FeedbackState | null;
  onToggle: (id: string) => void;
}

const WordHuntBoard: React.FC<WordHuntBoardProps> = ({
  round,
  selectedIds,
  roundTimeLeft,
  internalPhase,
  feedbackState,
  onToggle,
}) => {
  const progress = Math.max(
    0,
    Math.min(100, (roundTimeLeft / round.config.roundDur) * 100),
  );
  const hintText =
    internalPhase === "exposure"
      ? "DIKKATLE INCELE!"
      : `ICINDE "${round.target}" OLANLARI SEC!`;
  const cardDisabled = internalPhase === "exposure" || !!feedbackState;

  return (
    <motion.div
      key="game"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl flex flex-col items-center"
    >
      <div className="flex items-center gap-3 sm:gap-6 mb-4 sm:mb-6 w-full">
        <div className="bg-white dark:bg-slate-800 border-2 border-black/10 px-5 sm:px-8 py-3 sm:py-5 rounded-2xl shadow-neo-sm flex flex-col items-center shrink-0">
          <span className="text-[10px] sm:text-xs font-nunito font-black text-black/50 dark:text-white/50 uppercase tracking-widest mb-0.5 flex items-center gap-1">
            <Search size={12} /> HEDEF
          </span>
          <span className="text-4xl sm:text-5xl font-black font-nunito text-cyber-blue tracking-widest">
            {round.target}
          </span>
        </div>

        <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl p-2.5 sm:p-3 border-2 border-black/10 shadow-neo-sm">
          <div className="w-full h-3 sm:h-5 bg-slate-100 dark:bg-slate-700 rounded-xl overflow-hidden relative">
            <motion.div
              className={`h-full ${progress < 30 ? "bg-cyber-pink" : "bg-cyber-green"} transition-colors`}
              style={{ width: `${progress}%`, transformOrigin: "left" }}
              transition={{ duration: 0.1, ease: "linear" }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/30" />
            </motion.div>
          </div>
          <div className="flex justify-between items-center px-1 mt-1">
            <span className="text-[10px] sm:text-xs font-nunito font-black text-slate-400 uppercase tracking-widest">
              Zaman
            </span>
            <span
              className={`text-xs sm:text-sm font-nunito font-black ${progress < 30 ? "text-cyber-pink animate-pulse" : "text-black dark:text-white"}`}
            >
              {roundTimeLeft.toFixed(1)}s
            </span>
          </div>
        </div>
      </div>

      <div className="w-full bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-2 border-black/10 shadow-neo-sm relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10 dark:opacity-5 pointer-events-none"
          style={GRID_BACKGROUND_STYLE}
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 relative z-10">
          {round.items.map((item, index) => (
            <WordHuntCard
              key={item.id}
              item={item}
              index={index}
              internalPhase={internalPhase}
              cardColor={CARD_COLORS[index % CARD_COLORS.length]}
              isSelected={selectedIds.has(item.id)}
              disabled={cardDisabled}
              onToggle={onToggle}
            />
          ))}
        </div>
      </div>

      <div className="mt-3 sm:mt-4 flex items-center gap-2 px-4 sm:px-6 py-2.5 bg-cyber-pink border-2 border-black/10 rounded-2xl shadow-neo-sm">
        <AlertCircle
          size={18}
          className="text-black fill-white shrink-0"
        />
        <p className="text-xs sm:text-sm font-nunito font-black text-black uppercase tracking-widest break-words">
          {hintText}
        </p>
      </div>
    </motion.div>
  );
};

export default WordHuntBoard;
