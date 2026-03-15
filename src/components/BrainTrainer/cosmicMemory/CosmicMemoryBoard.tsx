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

      <div className="w-full aspect-square max-w-[480px] bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-800/90 dark:to-slate-900 p-3 sm:p-4 rounded-2xl border-2 border-black/10 shadow-[inset_0_2px_6px_rgba(0,0,0,0.15),0_4px_12px_rgba(0,0,0,0.1)]" style={{ perspective: '800px' }}>
        <div
          className="grid gap-1.5 sm:gap-2 h-full"
          style={{
            gridTemplateColumns: `repeat(${round.gridSize}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${round.gridSize}, minmax(0, 1fr))`,
            transform: 'rotateX(2deg)',
            transformStyle: 'preserve-3d',
          }}
        >
          {Array.from({ length: round.gridSize * round.gridSize }).map(
            (_, index) => {
              const isDisplaying = displayedCell === index;
              const tapCount = userSequence.filter(i => i === index).length;
              const isUserInput = tapCount > 0;
              const isActive = isDisplaying || isUserInput;

              return (
                <motion.button
                  key={index}
                  whileHover={isWaitingForInput ? { scale: 1.05, translateZ: 8 } : {}}
                  whileTap={isWaitingForInput ? { scale: 0.92, translateZ: -4 } : {}}
                  animate={isUserInput ? { scale: [1, 1.12, 1] } : {}}
                  transition={isUserInput ? { duration: 0.25, key: tapCount } : {}}
                  onClick={() => onCellClick(index)}
                  disabled={!isWaitingForInput}
                  className={`w-full h-full rounded-lg sm:rounded-xl border-2 transition-all duration-200 flex items-center justify-center relative ${
                    isActive
                      ? isReverse
                        ? "bg-gradient-to-b from-cyber-pink to-pink-600 border-pink-700/30 shadow-[0_6px_0_0_rgba(190,24,93,0.5),0_8px_16px_rgba(190,24,93,0.3)] translate-y-[-2px]"
                        : "bg-gradient-to-b from-cyber-yellow to-amber-500 border-amber-600/30 shadow-[0_6px_0_0_rgba(180,140,0,0.5),0_8px_16px_rgba(180,140,0,0.3)] translate-y-[-2px]"
                      : "bg-gradient-to-b from-white to-slate-50 dark:from-slate-600 dark:to-slate-700 border-slate-300 dark:border-slate-500 shadow-[0_4px_0_0_rgba(0,0,0,0.1),0_6px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_5px_0_0_rgba(0,0,0,0.12),0_8px_16px_rgba(0,0,0,0.08)] active:shadow-[0_1px_0_0_rgba(0,0,0,0.1)] active:translate-y-[3px]"
                  }`}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <AnimatePresence>
                    {isActive ? (
                      <motion.div
                        key={`star-${index}-${tapCount}`}
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 45 }}
                        className="w-1/2 h-1/2 drop-shadow-md"
                      >
                        <Star
                          className="w-full h-full text-black fill-black"
                          strokeWidth={3}
                        />
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                  {tapCount > 1 && (
                    <motion.span
                      key={`count-${index}-${tapCount}`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-black text-white text-[10px] sm:text-xs font-nunito font-black rounded-full flex items-center justify-center border-2 border-white shadow-md z-10"
                    >
                      {tapCount}
                    </motion.span>
                  )}
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
