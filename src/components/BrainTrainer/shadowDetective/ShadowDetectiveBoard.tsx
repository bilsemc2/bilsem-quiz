import React from "react";
import { motion } from "framer-motion";
import { Eye, Search } from "lucide-react";

import type { FeedbackState } from "../../../hooks/useGameFeedback";
import ShadowPatternCanvas from "./ShadowPatternCanvas";
import type { RoundStatus, ShadowDetectiveRound } from "./types";

interface ShadowDetectiveBoardProps {
  round: ShadowDetectiveRound;
  roundStatus: RoundStatus;
  previewTimer: number;
  selectedIndex: number | null;
  feedbackState: FeedbackState | null;
  onSelect: (index: number) => void;
}

const getOptionClasses = (
  index: number,
  selectedIndex: number | null,
  correctOptionIndex: number,
  feedbackState: FeedbackState | null,
) => {
  if (!feedbackState) {
    return {
      buttonClass:
        index % 2 === 0
          ? "bg-white dark:bg-slate-800 border-2 border-black/10 shadow-neo-sm hover:translate-y-1 hover:translate-x-1 hover:shadow-neo-sm rotate-1"
          : "bg-white dark:bg-slate-800 border-2 border-black/10 shadow-neo-sm hover:translate-y-1 hover:translate-x-1 hover:shadow-neo-sm -rotate-1",
      badgeClass: "bg-cyber-yellow text-black border-2 border-black/10",
    };
  }

  if (selectedIndex === index) {
    if (index === correctOptionIndex) {
      return {
        buttonClass:
          "bg-cyber-green border-2 border-black/10 shadow-neo-sm translate-y-1 translate-x-1 scale-105 z-10",
        badgeClass: "bg-white text-black border-2 border-black/10",
      };
    }

    return {
      buttonClass:
        "bg-cyber-pink border-2 border-black/10 shadow-neo-sm translate-y-1 translate-x-1",
      badgeClass: "bg-white text-black border-2 border-black/10",
    };
  }

  if (index === correctOptionIndex) {
    return {
      buttonClass:
        "bg-cyber-green border-2 border-black/10 shadow-neo-sm animate-pulse",
      badgeClass: "bg-white text-black border-2 border-black/10",
    };
  }

  const wrongColors = [
    "bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-300/50",
    "bg-slate-200 dark:bg-slate-700 border-2 border-slate-300/50",
    "bg-violet-100 dark:bg-violet-900/30 border-2 border-violet-300/50",
    "bg-sky-100 dark:bg-sky-900/30 border-2 border-sky-300/50",
  ];

  return {
    buttonClass: `${wrongColors[index % wrongColors.length]} shadow-neo-sm opacity-60`,
    badgeClass:
      "bg-white/80 dark:bg-slate-600 text-black border-2 border-black/10",
  };
};

const ShadowDetectiveBoard: React.FC<ShadowDetectiveBoardProps> = ({
  round,
  roundStatus,
  previewTimer,
  selectedIndex,
  feedbackState,
  onSelect,
}) => {
  if (roundStatus === "preview") {
    return (
      <motion.div
        key="preview"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md flex flex-col items-center gap-8"
      >
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-10 border-2 border-black/10 shadow-neo-sm w-full text-center relative rotate-1">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-cyber-purple text-black dark:text-white px-6 py-2 rounded-full font-nunito font-black uppercase tracking-widest border-2 border-black/10 shadow-neo-sm flex items-center gap-2">
            <Eye size={18} className="stroke-[3]" /> Ezberle: {previewTimer}s
          </div>

          <div className="mt-4 mb-8">
            <div className="w-full max-w-[320px] mx-auto">
              <ShadowPatternCanvas items={round.correctPattern} />
            </div>
          </div>

          <div className="w-full bg-slate-200 dark:bg-slate-700 h-6 rounded-full border-2 border-black/10 overflow-hidden relative">
            <motion.div
              className="absolute inset-y-0 left-0 bg-cyber-pink"
              animate={{
                width: `${(previewTimer / round.previewSeconds) * 100}%`,
              }}
              transition={{ duration: 1, ease: "linear" }}
            />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="deciding"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-5xl space-y-8"
    >
      <h2 className="text-2xl sm:text-3xl font-nunito font-black text-center text-black dark:text-white uppercase tracking-tight mb-2 flex items-center justify-center gap-4">
        Hangi Desen Doğru?
        <Search size={32} className="text-cyber-blue" strokeWidth={3} />
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {round.options.map((option, index) => {
          const { buttonClass, badgeClass } = getOptionClasses(
            index,
            selectedIndex,
            round.correctOptionIndex,
            feedbackState,
          );

          return (
            <motion.button
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileTap={!feedbackState ? { scale: 0.95 } : {}}
              onClick={() => onSelect(index)}
              disabled={!!feedbackState}
              className={`p-4 sm:p-6 rounded-2xl transition-all flex flex-col items-center gap-4 ${buttonClass}`}
            >
              <div className="w-full">
                <ShadowPatternCanvas items={option} />
              </div>
              <div
                className={`px-6 py-2 rounded-xl text-sm font-nunito font-black uppercase tracking-widest shadow-neo-sm ${badgeClass}`}
              >
                Seçenek {index + 1}
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default ShadowDetectiveBoard;
