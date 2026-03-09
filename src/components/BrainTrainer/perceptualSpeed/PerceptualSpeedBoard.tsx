import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Eye, XCircle } from "lucide-react";

import DigitSequence from "./DigitSequence";
import type { Challenge } from "./types";

interface PerceptualSpeedBoardProps {
  challenge: Challenge | null;
  correctInLevel: number;
  isFeedbackActive: boolean;
  onAnswer: (isSame: boolean) => void;
}

const PerceptualSpeedBoard: React.FC<PerceptualSpeedBoardProps> = ({
  challenge,
  correctInLevel,
  isFeedbackActive,
  onAnswer,
}) => {
  if (!challenge) {
    return null;
  }

  return (
    <div className="relative z-10 flex flex-col items-center justify-center p-2 flex-1 w-full">
      <motion.div
        key={`${challenge.left}-${challenge.right}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl mx-auto"
      >
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-6 border-2 border-black/10 shadow-neo-sm mb-4 text-center relative overflow-hidden">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-nunito font-black uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
            <Eye size={16} className="text-cyber-blue" strokeWidth={2.5} />
            Sayı Dizilerini Karşılaştır
          </p>

          <div className="space-y-6">
            <div className="flex flex-col items-center gap-1">
              <span className="text-[9px] font-nunito font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Birinci Dizi
              </span>
              <DigitSequence value={challenge.left} />
            </div>

            <div className="w-24 h-1 bg-black border-none mx-auto rounded-full opacity-20 dark:opacity-50" />

            <div className="flex flex-col items-center gap-1">
              <span className="text-[9px] font-nunito font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                İkinci Dizi
              </span>
              <DigitSequence value={challenge.right} />
            </div>
          </div>

          <div className="mt-4 text-center flex justify-center">
            <span className="px-4 py-1.5 rounded-lg text-[10px] font-nunito font-black uppercase tracking-widest bg-cyber-pink border-2 border-black/10 shadow-neo-sm text-black">
              {correctInLevel}/3 tamamlandı
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto w-full">
          <motion.button
            whileTap={!isFeedbackActive ? { scale: 0.95 } : undefined}
            onClick={() => onAnswer(true)}
            disabled={isFeedbackActive}
            className="flex flex-col items-center justify-center min-h-[90px] bg-cyber-green border-2 border-black/10 rounded-xl shadow-neo-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-1 active:shadow-none"
          >
            <CheckCircle2
              className="text-black mb-1"
              size={28}
              strokeWidth={2.5}
            />
            <span className="text-xl font-nunito font-black text-black uppercase tracking-widest">
              AYNI
            </span>
            <span className="text-[9px] font-bold font-nunito text-black/60 mt-1 uppercase bg-black/5 px-2 py-0.5 rounded-full border border-black/10">
              Klavye: Sol Ok
            </span>
          </motion.button>

          <motion.button
            whileTap={!isFeedbackActive ? { scale: 0.95 } : undefined}
            onClick={() => onAnswer(false)}
            disabled={isFeedbackActive}
            className="flex flex-col items-center justify-center min-h-[90px] bg-cyber-pink border-2 border-black/10 rounded-xl shadow-neo-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-1 active:shadow-none"
          >
            <XCircle className="text-black mb-1" size={28} strokeWidth={2.5} />
            <span className="text-xl font-nunito font-black text-black uppercase tracking-widest">
              FARKLI
            </span>
            <span className="text-[9px] font-bold font-nunito text-black/60 mt-1 uppercase bg-black/5 px-2 py-0.5 rounded-full border border-black/10">
              Klavye: Sağ Ok
            </span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default PerceptualSpeedBoard;
