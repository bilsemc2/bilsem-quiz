import React from "react";
import { motion } from "framer-motion";
import {
  Circle,
  Cross,
  Eye,
  Grid3X3,
  Heart,
  Hexagon,
  Moon,
  Pentagon,
  Square,
  Star,
  Triangle,
  Zap,
} from "lucide-react";

import { COLORS } from "./constants";
import type { Card, LocalPhase } from "./types";

const SHAPE_ICONS = [
  Circle,
  Square,
  Triangle,
  Hexagon,
  Star,
  Pentagon,
  Cross,
  Moon,
  Heart,
];

interface CrossMatchBoardProps {
  cards: Card[];
  localPhase: LocalPhase;
  isFeedbackActive: boolean;
  onCardClick: (cardId: string) => void;
}

const CrossMatchBoard: React.FC<CrossMatchBoardProps> = ({
  cards,
  isFeedbackActive,
  localPhase,
  onCardClick,
}) => {
  if (cards.length === 0) {
    return null;
  }

  const orderedCards = [...cards].sort((left, right) => left.position - right.position);

  return (
    <div className="relative z-10 flex flex-col items-center justify-center flex-1 p-2 w-full max-w-3xl mx-auto">
      <motion.div
        key="game"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full relative flex flex-col items-center"
      >
        <motion.div
          className={`max-w-sm sm:max-w-xl w-full mx-auto text-center mb-3 border-2 border-black/10 px-4 py-2.5 rounded-xl shadow-neo-sm ${localPhase === "preview" ? "bg-cyber-yellow" : "bg-cyber-pink"}`}
        >
          <p className="text-lg sm:text-xl font-black font-nunito uppercase tracking-wider text-black flex items-center justify-center gap-2">
            {localPhase === "preview" ? (
              <>
                <Eye size={20} className="stroke-[3]" />
                KARTLARI EZBERLE!
              </>
            ) : (
              <>
                <Zap size={20} className="fill-black" />
                EŞLEŞTİR!
              </>
            )}
          </p>
        </motion.div>

        <div className="w-full bg-white dark:bg-slate-800 p-3 sm:p-5 rounded-2xl border-2 border-black/10 shadow-neo-sm">
          <div className={`grid gap-2 sm:gap-3 ${cards.length <= 12 ? "grid-cols-4" : "grid-cols-5"}`}>
            {orderedCards.map((card) => {
              const Icon = SHAPE_ICONS[card.symbolIdx];
              const color = COLORS[card.colorIdx];
              const isRevealed =
                card.isFlipped || card.isMatched || localPhase === "preview";

              return (
                <motion.button
                  key={card.id}
                  layout
                  whileTap={
                    !isRevealed && localPhase === "playing" && !isFeedbackActive
                      ? { scale: 0.95 }
                      : undefined
                  }
                  onClick={() => onCardClick(card.id)}
                  className={`aspect-square rounded-xl relative transition-all duration-300 flex items-center justify-center border-3 ${card.isMatched ? "opacity-30 scale-90 shadow-none grayscale" : isRevealed ? "shadow-none translate-y-1 bg-slate-50 dark:bg-slate-700" : "bg-slate-200 dark:bg-slate-600 border-black/10 shadow-neo-sm"}`}
                  style={{
                    borderColor: isRevealed ? color.hex : "#000",
                    backgroundColor: isRevealed ? `${color.hex}15` : undefined,
                  }}
                  disabled={
                    isRevealed || localPhase !== "playing" || isFeedbackActive
                  }
                >
                  {isRevealed ? (
                    <div className="flex items-center justify-center h-full w-full">
                      <Icon
                        size={Math.max(20, 40 - (cards.length > 12 ? 8 : 0))}
                        color={color.hex}
                        strokeWidth={3}
                        className="drop-shadow-sm"
                      />
                    </div>
                  ) : (
                    <div className="opacity-10 dark:opacity-20">
                      <Grid3X3
                        size={24}
                        className="text-black dark:text-white"
                        strokeWidth={3}
                      />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CrossMatchBoard;
