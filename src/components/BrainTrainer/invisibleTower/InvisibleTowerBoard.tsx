import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Zap } from "lucide-react";

import type { LocalPhase, TowerSegment } from "./types";

interface InvisibleTowerBoardProps {
  currentIndex: number;
  isLocked: boolean;
  localPhase: LocalPhase;
  onSelect: (value: number) => void;
  options: number[];
  tower: TowerSegment[];
}

const InvisibleTowerBoard: React.FC<InvisibleTowerBoardProps> = ({
  currentIndex,
  isLocked,
  localPhase,
  onSelect,
  options,
  tower,
}) => {
  const totalRows =
    tower.length > 0 ? Math.max(...tower.map((segment) => segment.row)) + 1 : 0;

  return (
    <div className="relative z-10 flex flex-1 w-full max-w-2xl mx-auto flex-col items-center justify-center p-2">
      <motion.div
        key="game"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex w-full max-w-lg flex-col items-center gap-4"
      >
        <div className="relative flex flex-col-reverse items-center gap-1 pt-8 sm:gap-1.5">
          {localPhase === "flashing" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute -top-4 z-20 flex animate-pulse items-center gap-1.5 rounded-xl border-2 border-black/10 bg-cyber-green px-3 py-1.5 text-xs font-nunito font-black uppercase tracking-widest text-black shadow-neo-sm"
            >
              <Zap size={12} fill="currentColor" />
              Tarama: {currentIndex + 1}/{tower.length}
            </motion.div>
          )}

          {Array.from({ length: totalRows }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex gap-1 sm:gap-1.5">
              {tower
                .filter((segment) => segment.row === rowIndex)
                .map((segment) => {
                  const segmentIndex = tower.findIndex((item) => item.id === segment.id);
                  const isActive = segmentIndex === currentIndex;
                  const isPast = segmentIndex < currentIndex;
                  const isQuestionPhase = localPhase === "question";

                  return (
                    <motion.div
                      key={segment.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{
                        opacity: isQuestionPhase && !isPast ? 0.3 : 1,
                        scale: isActive ? 1.15 : 1,
                      }}
                      className={`relative flex h-10 w-14 items-center justify-center rounded-xl border-3 transition-all duration-300 sm:h-12 sm:w-16 ${isActive ? "z-10 border-black/10 bg-cyber-yellow shadow-neo-sm" : "border-black/80 bg-white opacity-90 shadow-neo-sm dark:bg-slate-700"}`}
                    >
                      {isActive ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex flex-col items-center"
                        >
                          <span
                            className={`font-nunito text-xl font-black drop-shadow-sm sm:text-2xl ${segment.isNegative ? "text-cyber-pink" : "text-black"}`}
                          >
                            {segment.isNegative ? "-" : ""}
                            {segment.value}
                          </span>
                        </motion.div>
                      ) : null}

                      {isQuestionPhase && isPast ? (
                        <CheckCircle2
                          className="absolute text-cyber-green opacity-50"
                          size={20}
                        />
                      ) : null}
                    </motion.div>
                  );
                })}
            </div>
          ))}
        </div>

        {localPhase === "question" ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-2xl border-2 border-black/10 bg-white p-5 text-center shadow-neo-sm dark:bg-slate-800 sm:p-6"
          >
            <h3 className="mb-4 font-nunito text-lg font-black uppercase tracking-widest text-slate-800 dark:text-slate-100 sm:text-xl">
              Kulenin Toplam Degeri?
            </h3>

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {options.map((option, index) => (
                <motion.button
                  key={`${option}-${index}`}
                  whileTap={!isLocked ? { scale: 0.95 } : {}}
                  onClick={() => onSelect(option)}
                  disabled={isLocked}
                  className="rounded-xl border-2 border-black/10 bg-slate-50 py-3 font-nunito text-2xl font-black text-black shadow-neo-sm transition-all duration-300 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-700 dark:text-white sm:py-4 sm:text-3xl"
                >
                  {option}
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : null}
      </motion.div>
    </div>
  );
};

export default InvisibleTowerBoard;
