import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";

interface ReflectionSumSequenceStageProps {
  digits: number[];
  onDigitClick: (digit: number) => void;
  userSequence: number[];
}

const ReflectionSumSequenceStage = ({
  digits,
  onDigitClick,
  userSequence,
}: ReflectionSumSequenceStageProps) => (
  <motion.div
    key="sequence"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="w-full max-w-3xl flex flex-col gap-4"
  >
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 border-2 border-black/10 shadow-neo-sm text-center relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-cyber-blue border-2 border-black/10 text-white px-4 py-1.5 rounded-full font-nunito font-black uppercase tracking-widest text-xs shadow-neo-sm flex items-center gap-1.5">
        <RotateCcw size={14} className="stroke-[3]" /> Tersine Tuşla
      </div>

      <div className="flex justify-center gap-2 flex-wrap mt-4">
        {userSequence.map((digit, index) => (
          <motion.div
            key={index}
            initial={{ scale: 0, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="w-10 h-12 sm:w-14 sm:h-16 bg-cyber-yellow border-2 border-black/10 rounded-xl flex items-center justify-center text-2xl sm:text-3xl font-nunito font-black text-black shadow-neo-sm"
          >
            {digit}
          </motion.div>
        ))}

        {Array.from({ length: digits.length - userSequence.length }).map((_, index) => (
          <div
            key={index + 100}
            className="w-10 h-12 sm:w-14 sm:h-16 border-3 border-dashed border-slate-300 dark:border-slate-600 rounded-xl flex items-center justify-center text-slate-300 dark:text-slate-600 text-2xl sm:text-3xl font-nunito font-black"
          >
            ?
          </div>
        ))}
      </div>
    </div>

    <div className="grid grid-cols-5 gap-2 sm:gap-3 mt-2">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((digit) => (
        <motion.button
          key={digit}
          whileTap={{ scale: 0.95 }}
          onClick={() => onDigitClick(digit)}
          className="aspect-square sm:aspect-auto sm:py-4 rounded-xl text-xl sm:text-3xl font-nunito font-black bg-white dark:bg-slate-800 border-2 border-black/10 transition-colors shadow-neo-sm text-black dark:text-white flex items-center justify-center active:translate-y-1 active:shadow-none"
        >
          {digit}
        </motion.button>
      ))}
    </div>
  </motion.div>
);

export default ReflectionSumSequenceStage;
