import { motion } from "framer-motion";

import type { RoundData } from "./types";

interface SymbolSearchTargetPanelProps {
  round: RoundData;
}

const SymbolSearchTargetPanel = ({ round }: SymbolSearchTargetPanelProps) => {
  const TargetIcon = round.target.component;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-black/10 p-5 sm:p-6 flex flex-col items-center justify-center relative shadow-neo-sm h-full">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        <span className="bg-cyber-purple text-white px-4 py-1.5 rounded-full text-xs font-nunito font-black uppercase tracking-widest border-2 border-black/10 shadow-neo-sm whitespace-nowrap">
          Hedef Sembol
        </span>
      </div>

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="w-24 h-24 sm:w-28 sm:h-28 bg-cyber-yellow border-2 border-black/10 rounded-2xl flex items-center justify-center shadow-neo-sm mt-3"
      >
        <TargetIcon className="w-14 h-14 sm:w-16 sm:h-16 text-black" strokeWidth={2.5} />
      </motion.div>

      <p className="mt-4 text-lg sm:text-xl font-black font-nunito text-black dark:text-white bg-slate-100 dark:bg-slate-700 px-5 py-1.5 rounded-xl border-2 border-black/10">
        {round.target.name}
      </p>
    </div>
  );
};

export default SymbolSearchTargetPanel;
