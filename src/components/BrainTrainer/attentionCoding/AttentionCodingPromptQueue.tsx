import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

import type { TestItem } from "./types";

interface AttentionCodingPromptQueueProps {
  currentIndex: number;
  items: TestItem[];
}

const AttentionCodingPromptQueue = ({
  currentIndex,
  items,
}: AttentionCodingPromptQueueProps) => {
  return (
    <div className="relative rounded-2xl border-2 border-black/10 bg-white p-5 shadow-neo-sm dark:bg-slate-800">
      <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border-2 border-black/10 bg-cyber-pink px-4 py-1.5 font-nunito text-xs font-black uppercase tracking-widest text-white shadow-neo-sm">
        Sıradaki Soru
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        {items.map((item, index) => {
          const isCurrent = index === currentIndex;
          const isCompleted = index < currentIndex;

          return (
            <motion.div
              key={item.id}
              animate={isCurrent ? { scale: 1.1 } : { scale: 1 }}
              className={`flex h-14 w-14 flex-col items-center justify-center rounded-xl border-2 transition-colors duration-300 sm:h-16 sm:w-16 ${
                isCurrent
                  ? "z-10 border-black/10 bg-cyber-pink shadow-neo-sm"
                  : isCompleted
                    ? "border-black/10 bg-cyber-green shadow-neo-sm"
                    : "border-dashed border-slate-300 bg-slate-100 dark:border-slate-500 dark:bg-slate-700"
              }`}
            >
              <span
                className={`font-nunito text-xl font-black ${
                  isCurrent
                    ? "text-white"
                    : isCompleted
                      ? "text-black"
                      : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {item.targetNumber}
              </span>
              {isCompleted ? (
                <CheckCircle2 size={14} className="text-black" strokeWidth={3} />
              ) : null}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default AttentionCodingPromptQueue;
