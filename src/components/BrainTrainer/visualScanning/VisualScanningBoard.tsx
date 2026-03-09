import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

import { getRemainingTargetCount } from "./logic";
import type { VisualScanningRound } from "./types";

interface VisualScanningBoardProps {
  round: VisualScanningRound | null;
  streak: number;
  isFeedbackActive: boolean;
  onCellClick: (index: number) => void;
}

const VisualScanningBoard: React.FC<VisualScanningBoardProps> = ({
  isFeedbackActive,
  onCellClick,
  round,
  streak,
}) => {
  if (!round) {
    return null;
  }

  const remaining = getRemainingTargetCount(round.cells);

  return (
    <div className="relative z-10 flex flex-col items-center justify-center p-2 flex-1 w-full max-w-xl mx-auto">
      <motion.div
        key={`game-${round.targetSymbol}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full space-y-3"
      >
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 border-2 border-black/10 shadow-neo-sm flex items-center justify-center gap-6 relative overflow-hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-nunito font-black uppercase text-slate-400 tracking-widest">
              HEDEF:
            </span>
            <div className="w-12 h-12 bg-cyber-pink border-2 border-black/10 rounded-xl flex items-center justify-center shadow-neo-sm">
              <span className="text-3xl text-black font-black">
                {round.targetSymbol}
              </span>
            </div>
          </div>

          <div className="h-10 w-1 bg-black rounded-full" />

          <div className="flex items-center gap-2">
            <span className="text-xs font-nunito font-black uppercase text-slate-400 tracking-widest">
              KALAN:
            </span>
            <div className="text-3xl font-nunito font-black text-cyber-blue">
              {remaining}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-8 gap-1 sm:gap-1.5 p-2 sm:p-3 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border-2 border-black/10 shadow-neo-sm">
          {round.cells.map((cell, index) => (
            <motion.button
              key={`${index}-${cell.symbol}`}
              whileTap={!isFeedbackActive ? { scale: 0.9 } : undefined}
              onClick={() => onCellClick(index)}
              disabled={isFeedbackActive}
              className={`aspect-square rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-200 relative overflow-hidden border-2 ${cell.isClicked ? "bg-cyber-green border-black/10 scale-95 shadow-none" : cell.isWrongClick ? "bg-cyber-pink border-black/10 scale-95 shadow-none" : "bg-white dark:bg-slate-800 border-black/10 shadow-neo-sm"} disabled:cursor-not-allowed`}
            >
              <span
                className={`text-xl sm:text-2xl font-black ${cell.isClicked || cell.isWrongClick ? "text-black" : "text-slate-800 dark:text-slate-100"}`}
              >
                {cell.symbol}
              </span>
              {cell.isClicked ? (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute inset-0 flex items-center justify-center bg-transparent"
                >
                  <CheckCircle2 className="text-black" size={20} strokeWidth={3} />
                </motion.div>
              ) : null}
            </motion.button>
          ))}
        </div>

        {streak > 1 ? (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center"
          >
            <span className="px-4 py-1.5 bg-cyber-pink border-2 border-black/10 rounded-xl text-black font-nunito font-black text-sm uppercase tracking-widest shadow-neo-sm inline-block">
              KOMBO x{streak} 🔥
            </span>
          </motion.div>
        ) : null}
      </motion.div>
    </div>
  );
};

export default VisualScanningBoard;
