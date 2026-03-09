import React from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Sparkles, Target, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { REACTION_TUZO_CODE } from "./constants";
import type { GameMode } from "./types";

interface ReactionTimeWelcomeScreenProps {
  backLink: string;
  backLabel: string;
  onSelectMode: (mode: GameMode) => void;
}

export const ReactionTimeWelcomeScreen: React.FC<
  ReactionTimeWelcomeScreenProps
> = ({ backLink, backLabel, onSelectMode }) => {
  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-[#FAF9F6] p-4 transition-colors duration-300 dark:bg-slate-900 sm:p-6">
      <div className="relative z-10 w-full max-w-xl">
        <div className="-ml-2 mb-6 flex w-full items-center justify-start">
          <Link
            to={backLink}
            className="flex items-center gap-2 rounded-xl border-2 border-black/10 bg-white px-4 py-2 font-nunito font-bold text-slate-500 shadow-neo-sm transition-colors hover:text-black active:translate-x-[2px] active:translate-y-[2px] active:shadow-none dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white"
          >
            <ChevronLeft size={20} className="stroke-[3]" />
            <span>{backLabel}</span>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border-2 border-black/10 bg-white p-5 text-center shadow-neo-sm dark:bg-slate-800 sm:p-6"
        >
          <motion.div
            className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-black/10 bg-cyber-yellow shadow-neo-sm sm:h-24 sm:w-24"
            animate={{ y: [0, -8, 0], rotate: [3, 8, 3] }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Zap size={56} className="fill-black text-black" strokeWidth={2.5} />
          </motion.div>

          <h1 className="mb-4 text-4xl font-black uppercase tracking-tight text-black drop-shadow-sm dark:text-white sm:text-5xl">
            Tepki Süresi
          </h1>

          <div className="mb-6 rounded-xl border-2 border-black/10 bg-slate-50 p-4 text-left shadow-neo-sm dark:bg-slate-700/50">
            <h3 className="mb-4 flex items-center gap-2 font-nunito text-xl font-black uppercase text-cyber-blue">
              <Sparkles size={24} className="stroke-[3]" />
              Mod Seçimi
            </h3>

            <div className="space-y-4">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectMode("simple")}
                className="flex w-full items-center gap-3 rounded-xl border-2 border-black/10 bg-white p-3 shadow-neo-sm transition-colors dark:bg-slate-800"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-black/10 bg-cyber-green">
                  <Zap size={24} className="fill-black/50 text-black" />
                </div>
                <div className="text-left font-nunito">
                  <h3 className="text-lg font-bold text-black transition-colors group-hover:text-cyber-green dark:text-white">
                    Basit Tepki
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Yeşil görünce hemen tıkla!
                  </p>
                </div>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectMode("selective")}
                className="flex w-full items-center gap-3 rounded-xl border-2 border-black/10 bg-white p-3 shadow-neo-sm transition-colors dark:bg-slate-800"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-black/10 bg-cyber-pink">
                  <Target size={24} className="text-black" strokeWidth={2.5} />
                </div>
                <div className="text-left font-nunito">
                  <h3 className="text-lg font-bold text-black transition-colors group-hover:text-cyber-pink dark:text-white">
                    Seçmeli Tepki
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Sadece yeşile tıkla, diğerlerinde bekle!
                  </p>
                </div>
              </motion.button>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-lg border-2 border-black/10 bg-cyber-yellow px-3 py-1.5 text-black shadow-neo-sm">
            <span className="font-nunito text-xs font-black uppercase tracking-widest text-black">
              {REACTION_TUZO_CODE}
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
