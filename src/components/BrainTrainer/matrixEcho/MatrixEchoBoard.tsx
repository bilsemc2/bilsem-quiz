import React from "react";
import { motion } from "framer-motion";

import type {
  MatrixEchoCell,
  MatrixEchoQuestion,
  MatrixEchoSubPhase,
} from "./types";

interface MatrixEchoBoardProps {
  cells: MatrixEchoCell[];
  isLocked: boolean;
  onAnswer: (selected: number) => void;
  question: MatrixEchoQuestion | null;
  subPhase: MatrixEchoSubPhase;
}

const phaseBadgeClassNames: Record<Exclude<MatrixEchoSubPhase, "idle">, string> = {
  memorize: "bg-cyber-blue text-white",
  hidden: "bg-cyber-yellow text-black",
  question: "bg-cyber-pink text-black",
};

const phaseLabels: Record<Exclude<MatrixEchoSubPhase, "idle">, string> = {
  memorize: "SAYILARI EZBERLE",
  hidden: "HAZIR OL...",
  question: "CEVAPLA!",
};

const MatrixEchoBoard: React.FC<MatrixEchoBoardProps> = ({
  cells,
  isLocked,
  onAnswer,
  question,
  subPhase,
}) => {
  if (subPhase === "idle") {
    return null;
  }

  const showNumbers = subPhase === "memorize";

  return (
    <div className="relative z-10 flex w-full max-w-lg flex-1 flex-col items-center justify-center p-2 mx-auto">
      <motion.div
        key="game"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex w-full flex-col items-center gap-4"
      >
        <div className="flex w-full flex-col items-center gap-4 rounded-2xl border-2 border-black/10 bg-white p-4 shadow-neo-sm dark:bg-slate-800 sm:p-6">
          <div className="w-full text-center">
            <h2
              className={`inline-block rounded-xl border-2 border-black/10 px-4 py-2 font-nunito text-lg font-black uppercase tracking-widest shadow-neo-sm sm:text-xl ${phaseBadgeClassNames[subPhase]}`}
            >
              {phaseLabels[subPhase]}
            </h2>
          </div>

          <div className="grid aspect-square w-full max-w-[280px] grid-cols-3 gap-2 rounded-xl border-2 border-black/10 bg-slate-50 p-3 dark:bg-slate-700 sm:gap-3 sm:p-4">
            {Array.from({ length: 9 }).map((_, index) => {
              const cell = cells.find((item) => item.gridIndex === index);

              return (
                <div
                  key={index}
                  className={`relative flex aspect-square items-center justify-center rounded-xl border-2 border-black/10 transition-all duration-300 ${cell ? (showNumbers ? "bg-cyber-green text-black shadow-neo-sm" : "bg-cyber-blue shadow-neo-sm") : "border-dashed border-black/50 bg-slate-200 dark:bg-slate-600"}`}
                >
                  {cell && (
                    <span
                      className={`font-nunito text-2xl font-black sm:text-3xl ${showNumbers ? "text-black" : "opacity-0"}`}
                    >
                      {showNumbers ? cell.value : ""}
                    </span>
                  )}

                  {!showNumbers && cell && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-nunito text-2xl font-bold text-white opacity-50">
                        ?
                      </span>
                    </div>
                  )}

                  <div className="absolute right-1.5 top-1 text-[10px] font-nunito font-black text-black/40">
                    {index + 1}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {subPhase === "question" && question && (
          <div className="flex w-full flex-col gap-3">
            <div className="rounded-xl border-2 border-black/10 bg-white p-4 text-center shadow-neo-sm dark:bg-slate-800">
              <h3 className="font-nunito text-lg font-black tracking-tight sm:text-xl">
                {question.text}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {question.options.map((option, index) => (
                <motion.button
                  key={`${option}-${index}`}
                  whileTap={!isLocked ? { scale: 0.98 } : {}}
                  onClick={() => onAnswer(option)}
                  disabled={isLocked}
                  className="rounded-xl border-2 border-black/10 bg-cyber-yellow py-3 font-nunito text-2xl font-black text-black shadow-neo-sm transition-all duration-300 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-50 sm:py-4 sm:text-3xl"
                >
                  {option}
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default MatrixEchoBoard;
