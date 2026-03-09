import { motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";

interface SymbolSearchAnswerButtonsProps {
  feedbackCorrect: boolean | null;
  hasTarget: boolean;
  onAnswer: (answer: boolean) => void;
  userSelectedAnswer: boolean | null;
}

const SymbolSearchAnswerButtons = ({
  feedbackCorrect,
  hasTarget,
  onAnswer,
  userSelectedAnswer,
}: SymbolSearchAnswerButtonsProps) => (
  <div className="grid grid-cols-2 gap-4 w-full max-w-3xl mx-auto">
    <motion.button
      whileTap={feedbackCorrect === null ? { scale: 0.95 } : {}}
      onClick={() => onAnswer(false)}
      disabled={feedbackCorrect !== null}
      className={`py-5 sm:py-6 rounded-2xl font-nunito font-black text-xl sm:text-2xl uppercase tracking-widest border-2 border-black/10 transition-all ${
        feedbackCorrect !== null && userSelectedAnswer === false
          ? hasTarget === false
            ? "bg-cyber-green text-black shadow-neo-sm scale-105"
            : "bg-cyber-pink text-black shadow-neo-sm"
          : feedbackCorrect !== null
            ? "bg-slate-200 dark:bg-slate-700 text-slate-400 opacity-50 shadow-none border-slate-300 dark:border-slate-600"
            : "bg-white dark:bg-slate-800 text-black dark:text-white shadow-neo-sm active:translate-y-1 active:shadow-none"
      }`}
    >
      <div className="flex flex-col items-center gap-1">
        <XCircle size={28} strokeWidth={3} />
        <span>YOK</span>
        <span className="text-[10px] opacity-50 hidden sm:block font-nunito tracking-normal font-bold">
          ← Sol Ok
        </span>
      </div>
    </motion.button>

    <motion.button
      whileTap={feedbackCorrect === null ? { scale: 0.95 } : {}}
      onClick={() => onAnswer(true)}
      disabled={feedbackCorrect !== null}
      className={`py-5 sm:py-6 rounded-2xl font-nunito font-black text-xl sm:text-2xl uppercase tracking-widest border-2 border-black/10 transition-all ${
        feedbackCorrect !== null && userSelectedAnswer === true
          ? hasTarget === true
            ? "bg-cyber-green text-black shadow-neo-sm scale-105"
            : "bg-cyber-pink text-black shadow-neo-sm"
          : feedbackCorrect !== null
            ? "bg-slate-200 dark:bg-slate-700 text-slate-400 opacity-50 shadow-none border-slate-300 dark:border-slate-600"
            : "bg-cyber-green text-black shadow-neo-sm active:translate-y-1 active:shadow-none"
      }`}
    >
      <div className="flex flex-col items-center gap-1">
        <CheckCircle2 size={28} strokeWidth={3} />
        <span>VAR</span>
        <span className="text-[10px] opacity-50 hidden sm:block font-nunito tracking-normal font-bold">
          Sağ Ok →
        </span>
      </div>
    </motion.button>
  </div>
);

export default SymbolSearchAnswerButtons;
