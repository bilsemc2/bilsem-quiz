import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Zap } from "lucide-react";

import type { GameCardData } from "./types";

interface MathMagicCardProps {
  card: GameCardData;
  isVisible: boolean;
  isTarget?: boolean;
}

const MathMagicCard: React.FC<MathMagicCardProps> = ({
  card,
  isVisible,
  isTarget = false,
}) => {
  return (
    <motion.div
      className={`perspective-1000 w-24 h-32 sm:w-32 sm:h-44 transition-all duration-500 ${isTarget ? "scale-110 z-10" : ""}`}
      style={{ perspective: "1000px" }}
      animate={isTarget && !isVisible ? { scale: [1, 1.03, 1] } : {}}
      transition={{ repeat: Infinity, duration: 2 }}
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: isVisible ? 0 : 180 }}
        transition={{ duration: 0.6 }}
      >
        <div
          className="absolute w-full h-full rounded-2xl border-2 border-black/10 shadow-neo-sm flex flex-col items-center justify-center"
          style={{
            backfaceVisibility: "hidden",
            backgroundColor: card.color.hex,
          }}
        >
          <span className="text-black text-4xl sm:text-6xl font-nunito font-black drop-shadow-sm">
            {card.number}
          </span>
          <div className="mt-1 bg-white/90 px-2 py-0.5 rounded-lg border-2 border-black/10 shadow-neo-sm">
            <p className="text-black font-nunito font-bold text-[9px] sm:text-[10px] uppercase tracking-wider">
              {card.color.name}
            </p>
          </div>
        </div>

        <div
          className={`absolute w-full h-full rounded-2xl border-4 shadow-neo-sm overflow-hidden flex items-center justify-center bg-white dark:bg-slate-800 ${isTarget ? "border-cyber-green ring-4 ring-cyber-green/30" : "border-black"}`}
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <svg
            className="absolute inset-0 w-full h-full opacity-5 pointer-events-none"
            viewBox="0 0 100 100"
          >
            <line
              x1="50"
              y1="5"
              x2="50"
              y2="15"
              stroke="currentColor"
              strokeWidth="4"
            />
            <line
              x1="95"
              y1="50"
              x2="85"
              y2="50"
              stroke="currentColor"
              strokeWidth="4"
            />
            <line
              x1="50"
              y1="95"
              x2="50"
              y2="85"
              stroke="currentColor"
              strokeWidth="4"
            />
            <line
              x1="5"
              y1="50"
              x2="15"
              y2="50"
              stroke="currentColor"
              strokeWidth="4"
            />
            <circle cx="50" cy="50" r="3" fill="currentColor" />
          </svg>

          <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-700 border-2 border-black/10 flex items-center justify-center shadow-neo-sm">
            <Zap
              size={28}
              className="text-slate-400 dark:text-slate-500 fill-current"
            />
          </div>

          {isTarget ? (
            <motion.div
              className="absolute -top-3 -right-3 bg-cyber-green w-10 h-10 rounded-full flex items-center justify-center shadow-neo-sm border-2 border-black/10"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
            >
              <Sparkles size={18} className="text-black" />
            </motion.div>
          ) : null}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MathMagicCard;
