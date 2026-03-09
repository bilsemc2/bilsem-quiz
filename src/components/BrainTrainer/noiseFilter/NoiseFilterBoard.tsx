import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Headphones, XCircle } from "lucide-react";

import type { FeedbackState } from "../../../hooks/useGameFeedback";
import { IMAGE_BASE_PATH, type SoundItem } from "../noiseFilterData";

interface NoiseFilterBoardProps {
  options: SoundItem[];
  selectedOptionName: string | null;
  targetSoundName: string | null;
  feedbackState: FeedbackState | null;
  canReplay: boolean;
  isLocked: boolean;
  onOptionSelect: (sound: SoundItem) => void;
  onReplayTarget: () => void;
}

const NoiseFilterBoard: React.FC<NoiseFilterBoardProps> = ({
  canReplay,
  feedbackState,
  isLocked,
  onOptionSelect,
  onReplayTarget,
  options,
  selectedOptionName,
  targetSoundName,
}) => {
  return (
    <div className="w-full max-w-6xl flex flex-col items-center gap-8">
      <div className="text-center relative">
        <p className="text-black dark:text-white font-nunito font-black uppercase text-xl sm:text-2xl mb-6 bg-cyber-blue text-white px-6 py-2 border-2 border-black/10 rounded-full shadow-neo-sm rotate-1 inline-block">
          Duyduğun Sesi Seç 🎧
        </p>

        <motion.button
          whileTap={canReplay ? { scale: 0.95 } : undefined}
          onClick={onReplayTarget}
          disabled={!canReplay}
          className="px-8 py-4 bg-cyber-purple text-black dark:text-white border-2 border-black/10 font-nunito font-black text-lg uppercase tracking-widest shadow-neo-sm hover:shadow-neo-sm active:translate-y-[4px] active:translate-x-[4px] active:shadow-none rounded-[2rem] flex items-center gap-3 transition-all mx-auto disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-x-0 disabled:active:translate-y-0"
        >
          <Headphones size={28} className="stroke-[3]" />
          <span>Sesi Tekrar Dinle</span>
        </motion.button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8 w-full">
        {options.map((sound) => {
          const isSelected = sound.name === selectedOptionName;
          const isTarget = sound.name === targetSoundName;
          const showCorrect = Boolean(feedbackState) && isTarget;
          const showIncorrect = Boolean(feedbackState) && isSelected && !isTarget;

          let bgColor = "bg-white dark:bg-slate-800";

          if (showCorrect) {
            bgColor = "bg-cyber-green";
          } else if (showIncorrect) {
            bgColor = "bg-cyber-pink";
          } else if (isSelected) {
            bgColor = "bg-cyber-blue";
          }

          return (
            <motion.button
              key={sound.name}
              whileTap={!isLocked ? { scale: 0.95 } : undefined}
              onClick={() => onOptionSelect(sound)}
              disabled={isLocked}
              className={`relative aspect-square rounded-[2rem] overflow-hidden border-2 border-black/10 transition-all group ${bgColor} ${isSelected ? "shadow-[8px_8px_0_rgba(0,0,0,1)]" : "shadow-neo-sm hover:shadow-neo-sm"} disabled:cursor-not-allowed`}
            >
              <img
                src={IMAGE_BASE_PATH + sound.image}
                alt={sound.name}
                className={`w-full h-full object-cover p-2 ${feedbackState && !isTarget && !isSelected ? "opacity-30 grayscale" : ""}`}
              />

              {showCorrect ? (
                <div className="absolute inset-0 bg-cyber-green/40 flex items-center justify-center backdrop-blur-[2px]">
                  <CheckCircle2
                    size={64}
                    className="text-black drop-shadow-[4px_4px_0_rgba(255,255,255,1)]"
                    strokeWidth={3}
                  />
                </div>
              ) : null}

              {showIncorrect ? (
                <div className="absolute inset-0 bg-cyber-pink/40 flex items-center justify-center backdrop-blur-[2px]">
                  <XCircle
                    size={64}
                    className="text-black drop-shadow-[4px_4px_0_rgba(255,255,255,1)]"
                    strokeWidth={3}
                  />
                </div>
              ) : null}

              <div className="absolute inset-x-0 bottom-0 bg-black/90 p-2 border-t-4 border-black/10">
                <p className="text-xs sm:text-sm font-nunito font-black text-white truncate text-center uppercase">
                  {sound.name}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default NoiseFilterBoard;
