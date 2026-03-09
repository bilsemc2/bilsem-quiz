import { motion } from "framer-motion";
import { Calculator, CheckCircle2 } from "lucide-react";

interface ReflectionSumSumStageProps {
  onSubmit: () => void;
  onUserSumChange: (value: string) => void;
  userSum: string;
}

const ReflectionSumSumStage = ({
  onSubmit,
  onUserSumChange,
  userSum,
}: ReflectionSumSumStageProps) => (
  <motion.div
    key="sum"
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="w-full max-w-md flex flex-col gap-4 mx-auto"
  >
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 border-2 border-black/10 shadow-neo-sm text-center relative">
      <div className="w-16 h-16 mx-auto bg-cyber-pink border-2 border-black/10 rounded-xl flex items-center justify-center shadow-neo-sm mb-4">
        <Calculator className="text-black" size={32} strokeWidth={2.5} />
      </div>

      <p className="text-black dark:text-white text-lg sm:text-xl font-nunito font-black uppercase tracking-tight mb-4">
        Toplamı Nedir?
      </p>

      <div className="relative">
        <input
          type="number"
          value={userSum}
          onChange={(event) => onUserSumChange(event.target.value)}
          autoFocus
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onSubmit();
            }
          }}
          className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-black/10 text-center text-4xl sm:text-5xl font-nunito font-black text-black dark:text-white py-4 rounded-xl focus:border-cyber-blue focus:outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700 shadow-inner"
          placeholder="0"
        />
      </div>
    </div>

    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onSubmit}
      className="w-full py-4 bg-cyber-green text-black border-2 border-black/10 rounded-xl font-nunito font-black text-xl uppercase tracking-widest shadow-neo-sm active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
    >
      <CheckCircle2 size={24} className="stroke-[3]" />
      <span>Onayla</span>
    </motion.button>
  </motion.div>
);

export default ReflectionSumSumStage;
