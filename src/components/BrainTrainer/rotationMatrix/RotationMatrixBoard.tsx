import React from "react";
import { motion } from "framer-motion";
import { Eye } from "lucide-react";

import { OPTION_BADGE_CLASSES } from "./constants";
import RotationShapeSVG from "./RotationShapeSVG";
import type { RotationMatrixOption, RotationMatrixRound } from "./types";

interface RotationMatrixBoardProps {
  isLocked: boolean;
  onSelect: (option: RotationMatrixOption) => void;
  round: RotationMatrixRound | null;
}

const RotationMatrixBoard: React.FC<RotationMatrixBoardProps> = ({
  isLocked,
  onSelect,
  round,
}) => {
  if (!round) {
    return null;
  }

  return (
    <div className="relative z-10 flex flex-1 w-full flex-col items-center justify-center p-2">
      <motion.div
        key="game"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid w-full max-w-4xl grid-cols-1 items-center gap-4 lg:grid-cols-2 lg:gap-6"
      >
        <div className="rounded-2xl border-2 border-black/10 bg-white p-4 text-center shadow-neo-sm dark:bg-slate-800 sm:p-6">
          <span className="mb-4 inline-flex items-center justify-center gap-2 rounded-full border-2 border-black/10 bg-cyber-yellow px-3 py-1.5 text-xs font-black uppercase tracking-widest text-black shadow-neo-sm">
            <Eye size={14} className="stroke-[3]" /> Matrisi Analiz Et
          </span>

          <div className="mx-auto grid w-full max-w-[300px] grid-cols-3 gap-2 rounded-xl border-2 border-black/10 bg-[#FAF9F6] p-3 shadow-inner dark:bg-slate-700/50">
            {round.sequence.map((shape, index) => (
              <div
                key={shape.id}
                className={`relative flex aspect-square items-center justify-center rounded-xl border-2 border-black/10 shadow-neo-sm transition-colors ${index === round.targetIndex ? "bg-cyber-purple/20" : "bg-white dark:bg-slate-800"}`}
              >
                <span className="absolute left-1.5 top-0.5 select-none font-nunito text-[9px] font-bold text-slate-400">
                  {index + 1}
                </span>
                {index === round.targetIndex ? (
                  <div className="animate-pulse font-nunito text-3xl font-black text-black dark:text-white">
                    ?
                  </div>
                ) : (
                  <RotationShapeSVG shape={shape} size={55} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border-2 border-black/10 bg-white p-4 shadow-neo-sm dark:bg-slate-800 sm:p-6">
          <h2 className="mb-4 flex items-center justify-center gap-2 text-center font-nunito text-xl font-black uppercase tracking-tight text-black dark:text-white">
            Doğru Seçeneği Bul
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {round.options.map((option, index) => (
              <motion.button
                key={option.shape.id}
                whileTap={!isLocked ? { scale: 0.95 } : {}}
                onClick={() => onSelect(option)}
                disabled={isLocked}
                className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl border-2 border-black/10 bg-white shadow-neo-sm transition-all active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-800"
              >
                <div
                  className={`absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-md border-2 border-black/10 ${OPTION_BADGE_CLASSES[index % OPTION_BADGE_CLASSES.length]} text-xs font-black text-black shadow-neo-sm`}
                >
                  {String.fromCharCode(65 + index)}
                </div>
                <RotationShapeSVG shape={option.shape} size={70} />
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RotationMatrixBoard;
