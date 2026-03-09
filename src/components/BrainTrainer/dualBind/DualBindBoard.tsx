import React from "react";
import { motion } from "framer-motion";

import { getColorHexByName } from "./logic";
import type {
  DualBindQuestion,
  LocalPhase,
  SymbolColor,
} from "./types";

interface DualBindBoardProps {
  countdown: number;
  currentQuestion: DualBindQuestion | null;
  isLocked: boolean;
  localPhase: LocalPhase;
  onAnswer: (answer: string) => void;
  symbolColors: SymbolColor[];
}

const DualBindBoard: React.FC<DualBindBoardProps> = ({
  countdown,
  currentQuestion,
  isLocked,
  localPhase,
  onAnswer,
  symbolColors,
}) => {
  if (localPhase === "memorize") {
    return (
      <motion.div
        key="memorize"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg space-y-4 text-center"
      >
        <div className="mb-3 flex flex-col items-center gap-1">
          <span className="rounded-lg border-2 border-black/10 bg-cyber-yellow px-3 py-1.5 text-xs font-nunito font-black uppercase tracking-widest text-black shadow-neo-sm">
            Ezberle
          </span>
          <span className="mt-1 font-nunito text-5xl font-black text-black drop-shadow-sm dark:text-white md:text-6xl">
            {countdown}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-2xl border-2 border-black/10 bg-white p-4 shadow-neo-sm dark:bg-slate-800 sm:grid-cols-3 sm:gap-3 sm:p-6">
          {symbolColors.map((symbolColor, index) => (
            <motion.div
              key={`${symbolColor.symbol}-${symbolColor.colorName}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="flex flex-col items-center gap-3 rounded-xl border-2 border-black/10 bg-slate-50 p-4 shadow-neo-sm dark:bg-slate-700/50 sm:p-6"
            >
              <div
                className="h-20 w-20 rounded-xl border-2 border-black/10 shadow-neo-sm sm:h-28 sm:w-28"
                style={{ backgroundColor: symbolColor.color }}
              />
              <span
                className="text-6xl font-black drop-shadow-[2px_2px_0_rgba(0,0,0,0.3)] sm:text-7xl"
                style={{ color: symbolColor.color }}
              >
                {symbolColor.symbol}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  return (
    <motion.div
      key="question"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-md space-y-4 text-center"
    >
      <div className="mb-1 flex justify-center">
        <span
          className={`rounded-xl border-2 border-black/10 px-4 py-1.5 text-xs font-nunito font-black tracking-widest shadow-neo-sm ${currentQuestion.type === "color-to-symbol" ? "bg-cyber-blue text-white" : "bg-cyber-pink text-black"}`}
        >
          {currentQuestion.type === "color-to-symbol" ? "RENK ➤ ŞEKİL" : "ŞEKİL ➤ RENK"}
        </span>
      </div>

      <div className="mb-4 rounded-2xl border-2 border-black/10 bg-white p-5 shadow-neo-sm dark:bg-slate-800 sm:p-6">
        <p className="mb-4 font-nunito text-lg font-black uppercase tracking-wide text-slate-800 dark:text-slate-200 sm:text-xl">
          {currentQuestion.query}
        </p>

        {currentQuestion.type === "color-to-symbol" ? (
          <div
            className="mx-auto h-28 w-28 rounded-xl border-2 border-black/10 shadow-neo-sm sm:h-32 sm:w-32"
            style={{ backgroundColor: currentQuestion.hint }}
          />
        ) : (
          <div className="mb-2 text-7xl drop-shadow-[3px_3px_0_rgba(0,0,0,0.3)] sm:text-8xl">
            {currentQuestion.hint}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {currentQuestion.options.map((option, index) => {
          const colorHex = getColorHexByName(option);
          const isColorAnswer = currentQuestion.type === "symbol-to-color" && colorHex;

          return (
            <motion.button
              key={`${option}-${index}`}
              whileTap={!isLocked ? { scale: 0.95 } : {}}
              onClick={() => onAnswer(option)}
              disabled={isLocked}
              className="flex items-center justify-center gap-2 rounded-xl border-2 border-black/10 bg-white p-5 font-nunito text-4xl font-black text-black shadow-neo-sm transition-all active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-700 dark:text-white sm:p-6 sm:text-5xl"
              style={isColorAnswer ? { backgroundColor: colorHex, color: "#000" } : undefined}
            >
              <span
                className={`relative z-10 ${isColorAnswer ? "text-white drop-shadow-neo-sm" : ""}`}
              >
                {option}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default DualBindBoard;
