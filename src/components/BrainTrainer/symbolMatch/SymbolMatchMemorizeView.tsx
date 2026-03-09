import React from "react";
import { motion } from "framer-motion";
import { Eye } from "lucide-react";

import type { ShapeColorAssignment } from "./types";
import { SHAPE_ICON_MAP } from "./shapeIcons";

interface SymbolMatchMemorizeViewProps {
  memorizeCountdown: number;
  memorizeDuration: number;
  symbolColors: ShapeColorAssignment[];
}

const SymbolMatchMemorizeView: React.FC<SymbolMatchMemorizeViewProps> = ({
  memorizeCountdown,
  memorizeDuration,
  symbolColors,
}) => {
  return (
    <motion.div
      key="memorize"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center space-y-8 w-full max-w-4xl"
    >
      <div className="flex items-center justify-center gap-4 bg-white dark:bg-slate-800 px-6 py-3 border-2 border-black/10 shadow-neo-sm rounded-2xl rotate-1 w-fit mx-auto">
        <Eye className="w-8 h-8 text-cyber-blue" strokeWidth={3} />
        <span className="text-black dark:text-white text-xl font-nunito font-black uppercase tracking-wider">
          Ezberle:
        </span>
        <motion.span
          key={memorizeCountdown}
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-4xl font-black text-cyber-pink drop-shadow-neo-sm"
        >
          {memorizeCountdown}
        </motion.span>
      </div>

      <div className="bg-slate-50 dark:bg-slate-700 rounded-2xl p-6 sm:p-8 border-2 border-black/10 shadow-neo-sm -rotate-1 min-h-[200px] flex items-center justify-center">
        <div className="flex justify-center gap-8 sm:gap-12 flex-wrap">
          {symbolColors.map((shapeColor, index) => {
            const ShapeIcon = SHAPE_ICON_MAP[shapeColor.key];

            return (
              <motion.div
                key={`${shapeColor.shapeName}-${shapeColor.colorName}`}
                initial={{ opacity: 0, scale: 0, rotate: -180 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ delay: index * 0.1, type: "spring" }}
                className="flex flex-col items-center gap-3"
              >
                <ShapeIcon
                  size={96}
                  style={{
                    color: shapeColor.color,
                    filter: "drop-shadow(4px 4px 0px rgba(0,0,0,0.8))",
                  }}
                  fill={shapeColor.fill ? shapeColor.color : "none"}
                  strokeWidth={shapeColor.fill ? 1.5 : 2.5}
                />
                <span className="text-sm font-nunito font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-4 py-1.5 rounded-full border-2 border-black/10">
                  {shapeColor.shapeName}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="h-6 bg-white dark:bg-slate-800 rounded-full overflow-hidden border-2 border-black/10 p-0.5 shadow-neo-sm w-full max-w-xl mx-auto">
        <motion.div
          className="h-full rounded-full bg-cyber-pink shadow-[inset_0_-4px_0_rgba(0,0,0,0.2)]"
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: memorizeDuration, ease: "linear" }}
        />
      </div>
    </motion.div>
  );
};

export default SymbolMatchMemorizeView;
