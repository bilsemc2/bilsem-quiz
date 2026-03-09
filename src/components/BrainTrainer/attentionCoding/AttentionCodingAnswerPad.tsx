import { motion } from "framer-motion";

import { SHAPE_LABELS } from "./constants";
import AttentionCodingShapeIcon from "./AttentionCodingShapeIcon";
import type { ShapeType } from "./types";

interface AttentionCodingAnswerPadProps {
  availableShapes: ShapeType[];
  onAnswer: (shape: ShapeType) => void;
}

const AttentionCodingAnswerPad = ({
  availableShapes,
  onAnswer,
}: AttentionCodingAnswerPadProps) => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
      {availableShapes.map((shape) => (
        <motion.button
          key={shape}
          whileTap={{ scale: 0.93 }}
          onClick={() => onAnswer(shape)}
          className="flex h-20 w-20 flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-black/10 bg-white shadow-neo-sm transition-all active:translate-y-1 active:shadow-none dark:bg-slate-800 sm:h-24 sm:w-24"
        >
          <AttentionCodingShapeIcon
            type={shape}
            className="text-black dark:text-white"
            size={32}
            strokeWidth={2.5}
          />
          <span className="font-nunito text-[10px] font-black uppercase tracking-tight text-slate-500 dark:text-slate-400 sm:text-xs">
            {SHAPE_LABELS[shape]}
          </span>
        </motion.button>
      ))}
    </div>
  );
};

export default AttentionCodingAnswerPad;
