import { motion } from "framer-motion";
import { Plus } from "lucide-react";

import type { FeedbackState } from "../../../hooks/useGameFeedback";
import GameNumpad from "../shared/GameNumpad";
import { NUMPAD_MAX_LENGTH } from "./constants";

interface StreamSumBoardProps {
  current: number;
  feedbackState: FeedbackState | null;
  input: string;
  onDelete: () => void;
  onDigit: (digit: string) => void;
  previous: number | null;
  waitingForInput: boolean;
}

const StreamSumBoard = ({
  current,
  feedbackState,
  input,
  onDelete,
  onDigit,
  previous,
  waitingForInput,
}: StreamSumBoardProps) => {
  return (
    <motion.div
      key="play-area"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md relative"
    >
      <div className="bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl p-4 shadow-neo-sm mb-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-100 to-transparent dark:from-slate-700/50 opacity-50" />

        <div className="relative flex flex-col items-center justify-center min-h-[120px]">
          {previous !== null ? (
            <div className="flex items-center justify-center gap-3 sm:gap-4 w-full relative z-10">
              <motion.div
                key="prev-hidden"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="w-16 h-20 sm:w-20 sm:h-24 bg-slate-200 dark:bg-slate-700 border-2 border-black/10 rounded-xl flex items-center justify-center"
              >
                <span className="text-3xl sm:text-4xl font-nunito font-black text-slate-400 dark:text-slate-500">
                  ?
                </span>
              </motion.div>

              <Plus size={24} className="text-black dark:text-white" strokeWidth={3} />

              <motion.div
                key={`curr-${current}`}
                initial={{ scale: 0.5, opacity: 0, x: 20 }}
                animate={{ scale: 1, opacity: 1, x: 0 }}
                className="w-20 h-24 sm:w-24 sm:h-28 bg-cyber-pink border-2 border-black/10 shadow-neo-sm rounded-xl flex items-center justify-center z-20"
              >
                <span className="text-5xl sm:text-6xl font-nunito font-black text-black">
                  {current}
                </span>
              </motion.div>
            </div>
          ) : (
            <motion.div
              key={`init-${current}`}
              initial={{ scale: 0.5, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="w-24 h-28 bg-cyber-blue border-2 border-black/10 shadow-neo-sm rounded-xl flex items-center justify-center"
            >
              <span className="text-6xl font-nunito font-black text-white">
                {current}
              </span>
            </motion.div>
          )}
        </div>

        {previous === null ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute bottom-3 left-0 right-0 text-center"
          >
            <span className="bg-white dark:bg-slate-700 border-2 border-black/10 px-2 py-0.5 rounded-full text-[10px] font-nunito font-bold text-slate-500 shadow-sm uppercase tracking-wider">
              Aklında Tut
            </span>
          </motion.div>
        ) : null}
      </div>

      {previous !== null ? (
        <div
          className={`h-16 sm:h-20 mb-4 border-2 rounded-xl flex items-center justify-center transition-colors relative overflow-hidden shadow-neo-sm ${
            feedbackState
              ? feedbackState.correct
                ? "bg-cyber-green/15 border-cyber-green ring-2 ring-cyber-green"
                : "bg-cyber-pink/15 border-cyber-pink ring-2 ring-cyber-pink"
              : "bg-white dark:bg-slate-800 border-black/10"
          }`}
        >
          {feedbackState ? (
            <span
              className={`text-3xl sm:text-4xl font-nunito font-black uppercase tracking-widest ${
                feedbackState.correct ? "text-cyber-green" : "text-cyber-pink"
              }`}
            >
              {feedbackState.correct ? "Harika!" : previous + current}
            </span>
          ) : input ? (
            <span className="text-4xl sm:text-5xl font-nunito font-black text-black dark:text-white tracking-widest">
              {input}
            </span>
          ) : (
            <span className="text-3xl font-nunito font-black text-slate-300 dark:text-slate-600 animate-pulse">
              ?
            </span>
          )}
        </div>
      ) : null}

      <GameNumpad
        value={input}
        onDigit={onDigit}
        onDelete={onDelete}
        disabled={Boolean(feedbackState) || !waitingForInput}
        hideDisplay
        maxLength={NUMPAD_MAX_LENGTH}
      />
    </motion.div>
  );
};

export default StreamSumBoard;
