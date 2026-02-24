import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";
import type { FeedbackState } from "../../../hooks/useGameFeedback";

interface GameFeedbackBannerProps {
  /** feedbackState from useGameFeedback hook */
  feedback: FeedbackState | null;
  /** Opsiyonel ek bilgi (ör. "Fark: Açıklık") */
  children?: React.ReactNode;
}

/**
 * BrainTrainer oyunları için paylaşılan feedback banner component'i.
 * Grid'in `relative` wrapper'ı içine yerleştirilir.
 * Layout shift oluşturmaz (absolute positioned).
 *
 * Kullanım:
 * ```tsx
 * <div className="relative">
 *   {/* oyun grid'i * /}
 *   <GameFeedbackBanner feedback={feedbackState}>
 *     <p className="text-xs text-slate-400">Fark: Açıklık</p>
 *   </GameFeedbackBanner>
 * </div>
 * ```
 */
const GameFeedbackBanner: React.FC<GameFeedbackBannerProps> = ({
  feedback,
  children,
}) => {
  return (
    <AnimatePresence>
      {feedback && (
        <motion.div
          key="game-feedback-banner-wrapper"
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="absolute bottom-6 left-0 right-0 z-50 flex justify-center px-6 pointer-events-none"
        >
          <motion.div
            animate={{ rotate: feedback.correct ? 2 : -2 }}
            className={`px-6 py-4 rounded-[2rem] flex items-center justify-center gap-4 border-4 border-black shadow-[8px_8px_0_#000] pointer-events-auto w-full max-w-sm ${feedback.correct
                ? "bg-cyber-green text-black"
                : "bg-cyber-pink text-black"
              }`}
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, 10, 0] }}
              transition={{ duration: 0.5 }}
              className="flex-shrink-0 bg-white border-4 border-black rounded-full p-2 shadow-[2px_2px_0_#000]"
            >
              {feedback.correct ? (
                <CheckCircle2 size={32} strokeWidth={3} className="text-black" />
              ) : (
                <XCircle size={32} strokeWidth={3} className="text-black" />
              )}
            </motion.div>
            <div className="min-w-0 text-center sm:text-left flex-1">
              <p className="font-syne font-black text-xl sm:text-2xl uppercase tracking-widest leading-none drop-shadow-sm">{feedback.message}</p>
              {children && (
                <div className="font-chivo font-bold text-sm sm:text-base text-black/80 mt-1">
                  {children}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GameFeedbackBanner;
