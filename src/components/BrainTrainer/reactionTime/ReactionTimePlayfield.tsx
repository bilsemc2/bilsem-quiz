import React from "react";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Timer, XCircle, Zap } from "lucide-react";
import { TARGET_COLOR } from "./constants";
import {
  getReactionButtonClass,
  shouldWaitForTarget,
} from "./logic";
import type { GameMode, RoundState } from "./types";

interface ReactionTimePlayfieldProps {
  gameMode: GameMode;
  roundState: RoundState;
  currentColor: string;
  currentReactionTime: number | null;
  onClick: () => void;
}

export const ReactionTimePlayfield: React.FC<ReactionTimePlayfieldProps> = ({
  gameMode,
  roundState,
  currentColor,
  currentReactionTime,
  onClick,
}) => {
  const buttonClass = getReactionButtonClass({
    roundState,
    currentColor,
    gameMode,
    currentReactionTime,
  });

  return (
    <div className="relative z-10 flex w-full flex-1 flex-col items-center justify-center p-2">
      <motion.div
        key="playing"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl px-2"
      >
        {gameMode === "selective" && (
          <div className="mx-auto mb-4 flex max-w-[220px] items-center justify-center gap-3 rounded-xl border-2 border-black/10 bg-white p-3 text-center shadow-neo-sm dark:bg-slate-800">
            <span className="font-nunito text-sm font-bold uppercase tracking-widest text-slate-500">
              Hedef:
            </span>
            <div className="h-8 w-8 rounded-lg border-2 border-black/10 bg-cyber-green shadow-neo-sm" />
            <span className="font-nunito text-lg font-black uppercase tracking-wider text-black dark:text-white">
              YEŞİL
            </span>
          </div>
        )}

        <motion.button
          onClick={onClick}
          className={`relative flex aspect-[4/3] w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-black/10 shadow-neo-sm transition-colors duration-100 sm:aspect-video ${buttonClass}`}
          whileTap={{ scale: 0.98, y: 4 }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{
              backgroundImage: "radial-gradient(#000 10%, transparent 10%)",
              backgroundSize: "20px 20px",
            }}
          />

          {roundState === "waiting" && (
            <div className="relative z-10">
              <Timer className="mx-auto mb-4 h-16 w-16 text-slate-400 drop-shadow-sm" />
              <p className="font-nunito text-2xl font-black uppercase tracking-widest text-slate-500">
                Bekle...
              </p>
            </div>
          )}

          {roundState === "ready" && (
            <div className="relative z-10">
              <AlertCircle
                className="mx-auto mb-4 h-16 w-16 animate-pulse text-black"
                strokeWidth={2.5}
              />
              <p className="px-4 text-center font-nunito text-2xl font-black uppercase tracking-widest text-black sm:text-4xl">
                Hazırlan!
              </p>
            </div>
          )}

          {roundState === "go" && (
            <div className="relative z-10">
              <Zap
                className={`mx-auto mb-4 h-20 w-20 ${
                  currentColor === "yellow" ? "text-black" : "text-white"
                }`}
                strokeWidth={2.5}
              />
              <p
                className={`px-4 text-center font-nunito text-3xl font-black uppercase tracking-widest sm:text-5xl ${
                  currentColor === "yellow" ? "text-black" : "text-white"
                }`}
              >
                {shouldWaitForTarget(gameMode, currentColor, TARGET_COLOR)
                  ? "BEKLEME!"
                  : "TIKLA!"}
              </p>
            </div>
          )}

          {roundState === "early" && (
            <div className="relative z-10">
              <XCircle
                className="mx-auto mb-4 h-16 w-16 text-black"
                strokeWidth={2.5}
              />
              <p className="px-4 text-center font-nunito text-2xl font-black uppercase tracking-widest text-black sm:text-4xl">
                Çok Erken!
              </p>
            </div>
          )}

          {roundState === "result" && (
            <div className="relative z-10 text-center">
              {currentReactionTime !== null ? (
                <>
                  <CheckCircle2
                    className="mx-auto mb-4 h-16 w-16 text-black"
                    strokeWidth={2.5}
                  />
                  <p className="mb-1 px-2 font-nunito text-4xl font-black uppercase tracking-widest text-black sm:text-5xl">
                    {currentReactionTime}
                  </p>
                  <p className="font-nunito text-xs font-bold uppercase tracking-widest text-black">
                    Milisaniye
                  </p>
                </>
              ) : (
                <>
                  <CheckCircle2
                    className="mx-auto mb-4 h-16 w-16 text-black"
                    strokeWidth={2.5}
                  />
                  <p className="px-4 text-center font-nunito text-2xl font-black uppercase tracking-widest text-black sm:text-4xl">
                    Doğru Bekleme!
                  </p>
                </>
              )}
            </div>
          )}
        </motion.button>
      </motion.div>
    </div>
  );
};
