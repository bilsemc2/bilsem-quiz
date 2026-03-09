import { motion } from "framer-motion";
import { Plus, Timer as TimerIcon } from "lucide-react";

interface TargetGridStatusPanelProps {
  currentSum: number;
  isPreview: boolean;
  previewTimer: number;
  targetSum: number;
}

const TargetGridStatusPanel = ({
  currentSum,
  isPreview,
  previewTimer,
  targetSum,
}: TargetGridStatusPanelProps) => (
  <div className="w-full md:w-1/3 flex flex-col items-center p-6 sm:p-10 bg-white dark:bg-slate-800 rounded-2xl border-2 border-black/10 shadow-neo-sm -rotate-1 shrink-0">
    {isPreview ? (
      <>
        <span className="bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400 border-2 border-black/10 px-6 py-2 rounded-xl text-xs sm:text-sm font-nunito font-black uppercase tracking-widest shadow-neo-sm mb-6 rotate-2">
          Sayilari Ezberle!
        </span>
        <div className="text-6xl sm:text-7xl font-black font-nunito text-slate-300 dark:text-slate-600 drop-shadow-sm mb-6 select-none">
          ?
        </div>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-2 px-6 py-3 bg-cyber-pink border-2 border-black/10 text-black rounded-2xl font-nunito font-black shadow-neo-sm rotate-2"
        >
          <TimerIcon size={20} className="animate-spin-slow" />
          <span className="text-lg">Ezberle: {previewTimer}</span>
        </motion.div>
      </>
    ) : (
      <>
        <span className="bg-cyber-yellow text-black border-2 border-black/10 px-6 py-2 rounded-xl text-xs sm:text-sm font-nunito font-black uppercase tracking-widest shadow-neo-sm mb-6 rotate-2">
          Hedef Sayi
        </span>
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.4 }}
          className="text-6xl sm:text-7xl font-black font-nunito text-black dark:text-white drop-shadow-sm mb-6"
        >
          {targetSum}
        </motion.div>

        <div className="w-full bg-slate-100 dark:bg-slate-700 p-4 rounded-2xl border-2 border-black/10 shadow-inner flex flex-col items-center">
          <span className="text-xs font-nunito font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
            Mevcut Toplam
          </span>
          <div
            className={`text-4xl font-black font-nunito flex items-center gap-3 transition-colors ${
              currentSum > targetSum
                ? "text-cyber-pink"
                : currentSum === targetSum
                  ? "text-cyber-green"
                  : "text-cyber-blue"
            }`}
          >
            <Plus size={24} strokeWidth={4} />
            {currentSum}
          </div>
        </div>
      </>
    )}
  </div>
);

export default TargetGridStatusPanel;
