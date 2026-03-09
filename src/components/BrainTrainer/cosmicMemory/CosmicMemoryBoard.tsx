import { AnimatePresence, motion } from "framer-motion";
import { Star } from "lucide-react";

import type { LocalPhase, CosmicMemoryRound } from "./types";

interface CosmicMemoryBoardProps {
  displayedCell: number | null;
  level: number;
  localPhase: LocalPhase;
  onCellClick: (index: number) => void;
  round: CosmicMemoryRound;
  userSequence: number[];
}

const STATUS_LABELS: Partial<Record<LocalPhase, string>> = {
  displaying: "IZLE!",
  input: "TEKRARLA!",
};

const CosmicMemoryBoard = ({
  displayedCell,
  level,
  localPhase,
  onCellClick,
  round,
  userSequence,
}: CosmicMemoryBoardProps) => {
  const isReverse = round.mode === "REVERSE";
  const isWaitingForInput = localPhase === "input" && displayedCell === null;
  const statusLabel = STATUS_LABELS[localPhase];

  return (
    <motion.div
      key={`level-${level}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-2xl flex flex-col items-center gap-3"
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`px-4 py-2 rounded-xl border-2 border-black/10 shadow-neo-sm font-nunito font-black text-lg sm:text-xl uppercase tracking-widest ${
          isReverse ? "bg-cyber-pink text-black" : "bg-cyber-blue text-white"
        }`}
      >
        {isReverse ? "Ters Sıra" : "Düz Sıra"}
      </motion.div>

      {statusLabel ? (
        <div
          className={`absolute top-0 right-2 px-4 py-1.5 rounded-xl text-sm font-nunito font-black tracking-widest border-2 border-black/10 uppercase shadow-neo-sm z-20 ${
            localPhase === "displaying"
              ? "bg-white dark:bg-slate-800 text-black dark:text-white"
              : "bg-cyber-green text-black"
          }`}
        >
          {statusLabel}
        </div>
      ) : null}

      <div className="w-full aspect-square max-w-[480px] bg-slate-100 dark:bg-slate-800/80 p-3 sm:p-4 rounded-2xl border-2 border-black/10 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1)]">
        <div
          className="grid gap-1.5 sm:gap-2 h-full"
          style={{
            gridTemplateColumns: `repeat(${round.gridSize}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${round.gridSize}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: round.gridSize * round.gridSize }).map(
            (_, index) => {
              const isDisplaying = displayedCell === index;
              const isUserInput = userSequence.includes(index);
              const isActive = isDisplaying || isUserInput;

              return (
                <motion.button
                  key={index}
                  whileTap={isWaitingForInput ? { scale: 0.95 } : {}}
                  onClick={() => onCellClick(index)}
                  disabled={!isWaitingForInput}
                  className={`w-full h-full rounded-lg sm:rounded-xl border-2 transition-all duration-200 flex items-center justify-center shadow-neo-sm ${
                    isActive
                      ? isReverse
                        ? "bg-cyber-pink border-black/10 scale-105"
                        : "bg-cyber-yellow border-black/10 scale-105"
                      : "bg-white dark:bg-slate-700 border-black/20 dark:border-white/20"
                  }`}
                >
                  <AnimatePresence>
                    {isActive ? (
                      <motion.div
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 45 }}
                        className="w-1/2 h-1/2"
                      >
                        <Star
                          className="w-full h-full text-black fill-black"
                          strokeWidth={3}
                        />
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </motion.button>
              );
            },
          )}
        </div>
      </div>

      <div className="flex gap-1.5 sm:gap-2 p-2 sm:p-3 bg-white dark:bg-slate-800 rounded-xl border-2 border-black/10 shadow-neo-sm">
        {round.sequence.map((_, index) => (
          <div
            key={index}
            className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-black/10 transition-colors ${
              index < userSequence.length
                ? isReverse
                  ? "bg-cyber-pink"
                  : "bg-cyber-yellow"
                : "bg-slate-200 dark:bg-slate-700"
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default CosmicMemoryBoard;
