import React from "react";
import { Shapes, Sparkles } from "lucide-react";
import type { FeedbackState } from "../../../hooks/useGameFeedback";
import { areWagonStatesEqual, calculateWagonState } from "./logic";
import type { PatternData, WagonState } from "./types";
import { WagonView } from "./WagonView";

interface PatternIQBoardProps {
  pattern: PatternData;
  options: WagonState[];
  revealed: boolean;
  selectedIndex: number | null;
  feedbackState: FeedbackState | null;
  wagonCount: number;
  onAnswer: (index: number) => void;
}

export const PatternIQBoard: React.FC<PatternIQBoardProps> = ({
  pattern,
  options,
  revealed,
  selectedIndex,
  feedbackState,
  wagonCount,
  onAnswer,
}) => {
  const targetState = calculateWagonState(pattern, wagonCount - 1);

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="relative mb-3 overflow-hidden rounded-2xl border-2 border-black/10 bg-white p-4 text-center shadow-neo-sm dark:bg-slate-800 sm:p-5">
        <p className="mb-6 flex items-center justify-center gap-3 font-nunito text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
          <Shapes size={20} className="text-cyber-green" strokeWidth={2.5} />
          Örüntüyü Çöz
        </p>

        <div className="mx-auto grid w-full max-w-7xl grid-cols-5 items-center gap-2 pl-2 pr-2 sm:gap-4 lg:gap-5">
          {Array.from({ length: wagonCount }).map((_, index) => {
            const state = calculateWagonState(pattern, index);
            const isLastWagon = index === wagonCount - 1;

            return (
              <div key={index} className="flex items-center gap-1 sm:gap-2">
                <div className="w-full">
                  <WagonView
                    state={state}
                    pattern={pattern}
                    isQuestion={isLastWagon}
                    isRevealed={revealed}
                    status={
                      isLastWagon && revealed
                        ? feedbackState?.correct
                          ? "correct"
                          : "wrong"
                        : "default"
                    }
                  />
                </div>
                {!isLastWagon && (
                  <div className="h-2 w-2 shrink-0 rounded-full border-2 border-transparent bg-black dark:bg-white sm:w-6" />
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex justify-center text-center">
          <span
            className={`rounded-full border-2 border-black/10 px-4 py-1.5 font-nunito text-xs font-black uppercase tracking-widest text-black shadow-neo-sm ${
              pattern.difficulty === "Kolay"
                ? "bg-cyber-green"
                : pattern.difficulty === "Orta"
                  ? "bg-cyber-yellow"
                  : "bg-cyber-pink"
            }`}
          >
            {pattern.difficulty}
          </span>
        </div>
      </div>

      <div className="mx-auto mb-3 max-w-6xl rounded-2xl border-2 border-black/10 bg-slate-50 p-4 shadow-neo-sm dark:bg-slate-800 sm:p-5 xl:max-w-7xl">
        <h2 className="mb-4 flex items-center justify-center gap-2 font-nunito text-xs font-black uppercase tracking-widest text-cyber-pink">
          <Sparkles size={16} className="stroke-[3]" />
          Sıradaki Vagon Hangisi?
        </h2>

        <div className="grid grid-cols-2 gap-3 px-2 md:grid-cols-4 sm:gap-4">
          {options.map((option, index) => (
            <div key={index} className="flex flex-col items-center gap-2">
              <div className="w-full max-w-[160px] lg:max-w-[200px] xl:max-w-[220px]">
                <WagonView
                  state={option}
                  pattern={pattern}
                  onClick={() => onAnswer(index)}
                  status={
                    revealed
                      ? index === selectedIndex
                        ? feedbackState?.correct
                          ? "correct"
                          : "wrong"
                        : areWagonStatesEqual(option, targetState)
                          ? "correct"
                          : "default"
                      : "default"
                  }
                />
              </div>
              <span className="rounded-full border-2 border-black/10 bg-slate-200 px-5 py-2 font-nunito text-xs font-black uppercase tracking-widest text-black shadow-neo-sm dark:bg-slate-700 dark:text-white sm:text-sm">
                SEÇENEK {String.fromCharCode(65 + index)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
