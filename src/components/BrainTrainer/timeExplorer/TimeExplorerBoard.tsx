import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { formatClockTime } from "./logic";
import TimeExplorerClock from "./TimeExplorerClock";
import type { ClockTime } from "./types";

interface TimeExplorerBoardProps {
  displayHour: number;
  feedbackState: { correct: boolean; message: string } | null;
  questionTime: ClockTime;
  targetOffset: number;
  userMinutes: number;
  onCheck: () => void;
  onMinuteChange: (newMinutes: number) => void;
}

const TimeExplorerBoard: React.FC<TimeExplorerBoardProps> = ({
  displayHour,
  feedbackState,
  questionTime,
  targetOffset,
  userMinutes,
  onCheck,
  onMinuteChange,
}) => {
  const isForward = targetOffset >= 0;
  const OffsetIcon = isForward ? ArrowRight : ArrowLeft;

  return (
    <motion.div
      key={`time-explorer-${formatClockTime(questionTime)}-${targetOffset}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-4xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-3 sm:gap-5 items-center">
        <div className="flex flex-col items-center gap-2">
          <TimeExplorerClock
            hours={displayHour}
            minutes={userMinutes}
            isInteractive={!feedbackState}
            onMinuteChange={onMinuteChange}
          />
          <p className="text-slate-500 dark:text-slate-400 font-nunito font-medium text-xs sm:text-sm text-center">
            {!feedbackState ? "Yelkovani surukle." : "Degerlendiriliyor..."}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-2 border-black/10 shadow-neo-sm">
            <p className="text-slate-400 dark:text-slate-500 font-nunito font-bold uppercase tracking-widest text-[10px] sm:text-xs mb-2 text-center">
              Gorev
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <span className="text-3xl sm:text-4xl font-nunito font-black text-black dark:text-white drop-shadow-sm">
                {formatClockTime(questionTime)}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 font-nunito font-black px-3 py-1.5 text-sm sm:text-base text-black border-2 border-black/10 rounded-xl shadow-neo-sm ${
                  isForward ? "bg-cyber-green" : "bg-cyber-pink"
                }`}
              >
                <OffsetIcon size={16} strokeWidth={3} />
                {Math.abs(targetOffset)} dk
              </span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl px-4 py-3 sm:px-6 sm:py-4 border-2 border-black/10 shadow-neo-sm flex items-center justify-between">
            <span className="text-xs sm:text-sm font-nunito font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Cevabin
            </span>
            <span className="text-2xl sm:text-3xl font-nunito font-black text-cyber-blue drop-shadow-sm">
              {formatClockTime({ hours: displayHour, minutes: userMinutes })}
            </span>
          </div>

          {!feedbackState ? (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onCheck}
              className="w-full px-6 py-4 sm:py-5 bg-cyber-green text-black font-nunito font-black text-base sm:text-lg uppercase tracking-widest border-2 border-black/10 shadow-neo-sm rounded-2xl hover:-translate-y-1 active:translate-y-1 active:shadow-none transition-all"
            >
              Kontrol Et
            </motion.button>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
};

export default TimeExplorerBoard;
