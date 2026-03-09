import React from "react";
import { Brain, Eye, Star } from "lucide-react";
import { motion } from "framer-motion";

import type { FeedbackState } from "../../../hooks/useGameFeedback";
import type { LocalPhase } from "./types";

interface LazerHafizaStatusProps {
  feedbackState: FeedbackState | null;
  localPhase: LocalPhase;
}

const LazerHafizaStatus: React.FC<LazerHafizaStatusProps> = ({
  feedbackState,
  localPhase,
}) => {
  const wrapperClass =
    localPhase === "preview"
      ? "bg-cyber-yellow text-black"
      : feedbackState
        ? feedbackState.correct
          ? "bg-cyber-green text-black"
          : "bg-cyber-pink text-black"
        : "bg-white dark:bg-slate-800 text-black dark:text-white";

  return (
    <motion.div
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 1.5, repeat: Infinity }}
      className={`mb-6 flex items-center gap-3 px-6 py-3 rounded-2xl font-nunito font-black uppercase tracking-widest text-sm border-2 border-black/10 shadow-neo-sm rotate-1 ${wrapperClass}`}
    >
      {localPhase === "preview" ? (
        <>
          <Eye size={22} className="text-black" /> Lazer Yolunu İzle!
        </>
      ) : feedbackState ? (
        feedbackState.correct ? (
          <>
            <Star size={22} className="text-black fill-black" /> Tam İsabet!
          </>
        ) : (
          <>
            <Brain size={22} className="text-black" /> Yanlış Sıra!
          </>
        )
      ) : (
        <>
          <Brain size={22} className="text-black dark:text-white" /> Yolu Yeniden
          Çiz!
        </>
      )}
    </motion.div>
  );
};

export default LazerHafizaStatus;
