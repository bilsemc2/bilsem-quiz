import { motion } from "framer-motion";
import { Volume2 } from "lucide-react";

import { GAME_COLORS } from "../shared/gameColors";

interface NumberMemoryListeningViewProps {
  currentPlayIndex: number;
  numberSequence: number[];
}

const NumberMemoryListeningView = ({
  currentPlayIndex,
  numberSequence,
}: NumberMemoryListeningViewProps) => {
  return (
    <motion.div
      key="listening"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex w-full max-w-sm flex-col items-center gap-6"
    >
      <div className="flex w-full flex-col items-center gap-4 rounded-2xl border-2 border-black/10 bg-white p-6 shadow-neo-sm dark:bg-slate-800 sm:p-8">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
          className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-black/10 bg-cyber-purple shadow-neo-sm"
        >
          <Volume2 size={44} className="text-white" strokeWidth={3} />
        </motion.div>

        <h2 className="mt-2 text-center font-nunito text-2xl font-black uppercase tracking-tight text-black dark:text-white sm:text-3xl">
          DİKKATLE DİNLE!
        </h2>

        <div className="mt-3 flex gap-3">
          {numberSequence.map((_, index) => (
            <motion.div
              key={index}
              animate={
                index === currentPlayIndex
                  ? { scale: 1.4, backgroundColor: GAME_COLORS.blue }
                  : {}
              }
              className={`h-5 w-5 rounded-full border-2 border-black/10 shadow-neo-sm transition-colors ${
                index < currentPlayIndex
                  ? "bg-cyber-purple"
                  : "bg-slate-200 dark:bg-slate-700"
              }`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default NumberMemoryListeningView;
