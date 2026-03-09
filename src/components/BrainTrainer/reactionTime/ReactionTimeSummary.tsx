import React from "react";

interface ReactionTimeSummaryProps {
  averageReaction: number;
  bestReaction: number;
  correctAnswers: number;
  wrongAnswers: number;
}

export const ReactionTimeSummary: React.FC<ReactionTimeSummaryProps> = ({
  averageReaction,
  bestReaction,
  correctAnswers,
  wrongAnswers,
}) => {
  return (
    <div className="mt-3 grid grid-cols-3 gap-2">
      <div className="overflow-hidden rounded-xl border-2 border-slate-200 bg-slate-50 p-2 text-center dark:border-slate-600 dark:bg-slate-700/50">
        <p className="mb-0.5 font-nunito text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 sm:text-[10px]">
          Ortalama
        </p>
        <p className="truncate text-base font-black text-cyber-purple sm:text-lg">
          {averageReaction}
          <span className="ml-0.5 text-[9px]">ms</span>
        </p>
      </div>
      <div className="overflow-hidden rounded-xl border-2 border-slate-200 bg-slate-50 p-2 text-center dark:border-slate-600 dark:bg-slate-700/50">
        <p className="mb-0.5 font-nunito text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 sm:text-[10px]">
          En İyi
        </p>
        <p className="truncate text-base font-black text-cyber-green sm:text-lg">
          {bestReaction > 0 ? bestReaction : "-"}
          <span className="ml-0.5 text-[9px]">ms</span>
        </p>
      </div>
      <div className="overflow-hidden rounded-xl border-2 border-slate-200 bg-slate-50 p-2 text-center dark:border-slate-600 dark:bg-slate-700/50">
        <p className="mb-0.5 font-nunito text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 sm:text-[10px]">
          Doğru/Yanlış
        </p>
        <p className="truncate text-base font-black text-black dark:text-white sm:text-lg">
          <span className="text-cyber-green">{correctAnswers}</span>
          <span className="mx-0.5 text-slate-300 dark:text-slate-600">/</span>
          <span className="text-cyber-pink">{wrongAnswers}</span>
        </p>
      </div>
    </div>
  );
};
