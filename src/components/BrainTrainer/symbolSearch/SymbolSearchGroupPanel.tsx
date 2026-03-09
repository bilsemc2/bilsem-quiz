import { AnimatePresence, motion } from "framer-motion";

import { getFeedbackAccent } from "./logic";
import type { RoundData } from "./types";

interface SymbolSearchGroupPanelProps {
  feedbackCorrect: boolean | null;
  round: RoundData;
}

const BACKGROUND_COLORS = [
  "bg-white",
  "bg-cyber-pink",
  "bg-cyber-yellow",
  "bg-cyber-blue",
  "bg-cyber-green",
] as const;

const SymbolSearchGroupPanel = ({
  feedbackCorrect,
  round,
}: SymbolSearchGroupPanelProps) => (
  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl border-2 border-black/10 p-5 sm:p-6 flex flex-col items-center justify-center relative shadow-neo-sm h-full">
    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
      <span className="bg-cyber-blue text-white px-4 py-1.5 rounded-full text-xs font-nunito font-black uppercase tracking-widest border-2 border-black/10 shadow-neo-sm whitespace-nowrap">
        Arama Grubu
      </span>
    </div>

    <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mt-3 w-full">
      <AnimatePresence mode="popLayout">
        {round.group.map((icon, index) => {
          const IconComponent = icon.component;
          const backgroundColor = BACKGROUND_COLORS[index % BACKGROUND_COLORS.length];
          const textColor =
            backgroundColor === "bg-cyber-blue" ? "text-white" : "text-black";
          const accent = getFeedbackAccent(icon, round, feedbackCorrect, false);

          let itemClass = `w-14 h-14 sm:w-16 sm:h-16 ${backgroundColor} ${textColor} rounded-xl border-2 border-black/10 shadow-neo-sm flex items-center justify-center`;

          if (accent === "success") {
            itemClass =
              "w-14 h-14 sm:w-16 sm:h-16 bg-cyber-green text-black rounded-xl border-2 border-black/10 shadow-neo-sm flex items-center justify-center scale-110 z-10 animate-bounce";
          } else if (accent === "muted") {
            itemClass += " opacity-30 grayscale";
          }

          return (
            <motion.div
              key={`${round.target.id}-${icon.id}-${index}`}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                type: "spring",
                damping: 15,
                delay: index * 0.04,
              }}
              className={itemClass}
            >
              <IconComponent className="w-7 h-7 sm:w-9 sm:h-9" strokeWidth={2.5} />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  </div>
);

export default SymbolSearchGroupPanel;
