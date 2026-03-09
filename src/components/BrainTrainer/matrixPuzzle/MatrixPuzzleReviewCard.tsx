import React from "react";

import { ShapeRenderer } from "../matrix/ShapeRenderer";
import type { QuestionHistoryEntry } from "./types";

interface MatrixPuzzleReviewCardProps {
  entry: QuestionHistoryEntry;
}

const MatrixPuzzleReviewCard: React.FC<MatrixPuzzleReviewCardProps> = ({
  entry,
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-6 sm:p-8 border-2 border-black/10 shadow-neo-sm relative">
      <div className="absolute top-0 right-6 -translate-y-1/2">
        <span className="px-4 py-2 bg-cyber-blue text-white rounded-xl text-sm font-nunito font-black border-2 border-black/10 shadow-neo-sm">
          Seviye {entry.level}
        </span>
      </div>

      <div className="text-left mb-6 pt-4">
        <span className="text-sm font-nunito font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          {entry.ruleName}
        </span>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-8 mb-6">
        <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-3xl border-2 border-black/10">
          {entry.grid.map((row, rowIndex) =>
            row.map((cell, columnIndex) => (
              <div
                key={`${rowIndex}-${columnIndex}`}
                className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center border-2 border-black/20 dark:border-white/10 rounded-2xl bg-white dark:bg-slate-800 shadow-sm"
              >
                {cell.isHidden ? (
                  <span className="text-2xl font-nunito font-black text-cyber-pink drop-shadow-neo-sm">
                    ?
                  </span>
                ) : (
                  <ShapeRenderer
                    shape={cell.shape}
                    size={48}
                    isHidden={cell.isHidden}
                  />
                )}
              </div>
            )),
          )}
        </div>

        <div className="flex-1 w-full bg-slate-50 dark:bg-slate-800 border-2 border-black/10 border-l-8 border-l-cyber-blue p-6 rounded-2xl text-left shadow-neo-sm">
          <p className="text-xs font-nunito font-black text-cyber-blue uppercase tracking-widest mb-2">
            Dusunme Yolu
          </p>
          <p className="text-base font-nunito font-medium text-slate-700 dark:text-slate-200">
            {entry.ruleDescription}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 sm:gap-8">
        <div className="text-center bg-cyber-pink/20 dark:bg-cyber-pink/10 rounded-3xl p-6 border-4 border-cyber-pink border-dashed">
          <p className="text-sm font-nunito font-black text-cyber-pink uppercase tracking-widest mb-4">
            Senin Secimin
          </p>
          <div className="inline-block p-4 bg-white dark:bg-slate-800 rounded-[2rem] border-2 border-black/10 shadow-neo-sm">
            <ShapeRenderer shape={entry.selectedAnswer} size={60} />
          </div>
        </div>

        <div className="text-center bg-cyber-green/20 dark:bg-cyber-green/10 rounded-3xl p-6 border-4 border-cyber-green border-dashed">
          <p className="text-sm font-nunito font-black text-cyber-green uppercase tracking-widest mb-4">
            Dogru Sekil
          </p>
          <div className="inline-block p-4 bg-white dark:bg-slate-800 rounded-[2rem] border-2 border-black/10 shadow-neo-sm">
            <ShapeRenderer shape={entry.correctAnswer} size={60} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatrixPuzzleReviewCard;
