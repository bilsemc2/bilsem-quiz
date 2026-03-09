import React from "react";
import { AnimatePresence, motion } from "framer-motion";

import { SHAPE_ICON_MAP } from "./shapeIcons";
import type { ShapeData } from "./types";

interface NBackShapeDisplayProps {
  currentShape: ShapeData | null;
  missingCount: number;
}

const NBackShapeDisplay: React.FC<NBackShapeDisplayProps> = ({
  currentShape,
  missingCount,
}) => {
  const ShapeIcon = currentShape ? SHAPE_ICON_MAP[currentShape.key] : null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-8 w-full aspect-square max-w-[400px] flex items-center justify-center border-2 border-black/10 shadow-neo-sm relative mx-auto my-2 transition-colors duration-300">
      <AnimatePresence mode="popLayout">
        {currentShape && ShapeIcon ? (
          <motion.div
            key={currentShape.id}
            initial={{ scale: 0, opacity: 0, rotate: -30 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.5, opacity: 0, rotate: 30 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
            }}
            className="flex flex-col items-center gap-6"
          >
            <div
              className="w-32 h-32 sm:w-48 sm:h-48 flex items-center justify-center border-2 border-black/10 shadow-neo-sm rounded-[2rem] bg-white"
              style={{
                color: currentShape.color,
                background: "linear-gradient(135deg, white 0%, #f1f5f9 100%)",
              }}
            >
              <ShapeIcon size={80} strokeWidth={3} className="drop-shadow-sm" />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {missingCount > 0 ? (
        <div className="absolute inset-x-6 bottom-6 text-center text-slate-500 font-nunito font-black uppercase tracking-widest text-sm bg-slate-100 dark:bg-slate-900/50 p-3 border-2 border-black/10 border-dashed rounded-xl">
          Bellekte {missingCount} şekil eksik...
        </div>
      ) : null}
    </div>
  );
};

export default NBackShapeDisplay;
