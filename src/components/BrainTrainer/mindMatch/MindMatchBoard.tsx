import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

import type { FeedbackState } from "../../../hooks/useGameFeedback";
import MindMatchCard from "./MindMatchCard";
import type { PuzzleData } from "./types";

interface MindMatchBoardProps {
  puzzle: PuzzleData;
  selectedIds: Set<string>;
  isChecking: boolean;
  feedbackState: FeedbackState | null;
  onToggle: (id: string) => void;
  onCheck: () => void;
}

const MindMatchBoard: React.FC<MindMatchBoardProps> = ({
  puzzle,
  selectedIds,
  isChecking,
  feedbackState,
  onToggle,
  onCheck,
}) => {
  const selectedCount = selectedIds.size;
  const isRevealed = isChecking || !!feedbackState;
  const controlsEnabled = !isChecking && !feedbackState;

  return (
    <div className="w-full max-w-3xl flex flex-col items-center gap-4">
      <div className="w-full bg-white dark:bg-slate-800 rounded-2xl p-5 border-2 border-black/10 shadow-neo-sm relative text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-cyber-blue text-white px-4 py-1.5 rounded-full font-nunito font-black uppercase tracking-widest text-xs border-2 border-black/10 shadow-neo-sm">
          Kategori
        </div>
        <h2 className="text-2xl sm:text-3xl font-nunito font-black text-black dark:text-white mt-3 mb-2">
          {puzzle.category}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 font-nunito font-medium text-sm">
          Bu kategoriye ait{" "}
          <strong className="text-black dark:text-white font-black">
            {puzzle.items.filter((item) => item.isMatch).length}
          </strong>{" "}
          öğeyi bul
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 w-full">
        {puzzle.items.map((item, index) => (
          <MindMatchCard
            key={item.id}
            item={item}
            index={index}
            isSelected={selectedIds.has(item.id)}
            isRevealed={isRevealed}
            disabled={isChecking || !!feedbackState}
            onToggle={onToggle}
          />
        ))}
      </div>

      {controlsEnabled ? (
        <motion.button
          whileTap={selectedCount > 0 ? { scale: 0.95 } : {}}
          onClick={onCheck}
          disabled={selectedCount === 0}
          className={`w-full max-w-sm py-4 rounded-xl font-nunito font-black text-lg uppercase tracking-widest transition-all border-2 flex items-center justify-center gap-3 active:translate-y-1 active:shadow-none ${
            selectedCount > 0
              ? "bg-cyber-yellow text-black border-black/10 shadow-neo-sm"
              : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-300 dark:border-slate-700 shadow-none cursor-not-allowed"
          }`}
        >
          <CheckCircle2
            size={22}
            className={selectedCount > 0 ? "stroke-[3]" : ""}
          />
          <span>Kontrol Et ({selectedCount})</span>
        </motion.button>
      ) : null}
    </div>
  );
};

export default MindMatchBoard;
