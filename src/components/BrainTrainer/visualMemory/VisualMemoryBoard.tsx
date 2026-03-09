import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Zap } from "lucide-react";

import type { FeedbackState } from "../../../hooks/useGameFeedback";
import VisualMemoryCell from "./VisualMemoryCell";
import type { InternalPhase, VisualMemoryRound } from "./types";

const LIGHT_GRID_STYLE = {
  backgroundImage:
    "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)",
  backgroundSize: "20px 20px",
} as const;

const DARK_GRID_STYLE = {
  backgroundImage:
    "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
  backgroundSize: "20px 20px",
} as const;

const getPhaseTitle = (internalPhase: InternalPhase) => {
  if (internalPhase === "memorize") {
    return "Aklında Tut!";
  }

  if (internalPhase === "transition") {
    return "Hazır Ol...";
  }

  return "Hangisi Değişti?";
};

interface VisualMemoryBoardProps {
  level: number;
  round: VisualMemoryRound;
  internalPhase: InternalPhase;
  memTimeLeft: number;
  memTimeMax: number;
  userSelectedId: string | null;
  feedbackState: FeedbackState | null;
  onSelectCell: (id: string) => void;
}

const VisualMemoryBoard: React.FC<VisualMemoryBoardProps> = ({
  level,
  round,
  internalPhase,
  memTimeLeft,
  memTimeMax,
  userSelectedId,
  feedbackState,
  onSelectCell,
}) => {
  const displayGrid =
    internalPhase === "memorize" ? round.gridBefore : round.gridAfter;
  const showResult = !!feedbackState && internalPhase === "recall";

  return (
    <motion.div
      key={`lvl-${level}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-2xl flex flex-col items-center"
    >
      <div className="mb-4 sm:mb-8 text-center bg-white dark:bg-slate-800 border-2 border-black/10 px-4 sm:px-8 py-3 sm:py-4 rounded-xl shadow-neo-sm rotate-1">
        <h2 className="text-xl sm:text-2xl font-nunito font-black uppercase text-black dark:text-white tracking-widest">
          {getPhaseTitle(internalPhase)}
        </h2>

        {internalPhase === "memorize" ? (
          <div className="w-48 sm:w-64 h-3 bg-slate-200 dark:bg-slate-700 rounded-full mt-3 sm:mt-4 mx-auto overflow-hidden border-2 border-black/10">
            <motion.div
              className="h-full bg-cyber-pink"
              animate={{
                width: `${memTimeMax > 0 ? (memTimeLeft / memTimeMax) * 100 : 0}%`,
              }}
              transition={{ duration: 0.1, ease: "linear" }}
            />
          </div>
        ) : null}
      </div>

      <div className="bg-slate-200 dark:bg-slate-700 p-2 sm:p-4 rounded-xl border-2 border-black/10 shadow-neo-sm -rotate-1 relative">
        <div
          className="grid gap-2 sm:gap-3 p-3 sm:p-5 bg-white dark:bg-slate-800 rounded-2xl relative overflow-hidden"
          style={{
            gridTemplateColumns: `repeat(${round.gridSize}, 1fr)`,
          }}
        >
          <div
            className="absolute inset-0 opacity-10 dark:hidden pointer-events-none"
            style={LIGHT_GRID_STYLE}
          />
          <div
            className="absolute inset-0 hidden dark:block opacity-5 pointer-events-none"
            style={DARK_GRID_STYLE}
          />

          {internalPhase === "transition" ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-cyber-blue z-20 flex items-center justify-center border-2 border-black/10 rounded-xl m-1 sm:m-2"
            >
              <Zap size={48} className="text-white animate-pulse" />
            </motion.div>
          ) : null}

          <AnimatePresence>
            {internalPhase !== "transition" ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="contents"
              >
                {displayGrid.map((cell) => (
                  <VisualMemoryCell
                    key={cell.id}
                    cell={cell}
                    gridSize={round.gridSize}
                    internalPhase={internalPhase}
                    isSelected={userSelectedId === cell.id}
                    isTarget={cell.id === round.targetCellId}
                    showResult={showResult}
                    onSelect={onSelectCell}
                  />
                ))}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default VisualMemoryBoard;
