import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { FeedbackState } from '../../../hooks/useGameFeedback';

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
const GameFeedbackBanner: React.FC<GameFeedbackBannerProps> = ({ feedback, children }) => {
    return (
        <AnimatePresence>
            {feedback && (
                <motion.div
                    key="game-feedback-banner"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className={`absolute bottom-0 left-0 right-0 z-20 px-5 py-3 rounded-2xl flex items-center gap-3 backdrop-blur-md ${feedback.correct
                        ? 'bg-emerald-900/80 border border-emerald-500/40'
                        : 'bg-orange-900/80 border border-orange-500/40'
                        }`}
                >
                    <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.5 }}
                        className="flex-shrink-0"
                    >
                        {feedback.correct
                            ? <CheckCircle2 size={28} className="text-emerald-400" />
                            : <XCircle size={28} className="text-orange-400" />
                        }
                    </motion.div>
                    <div className="min-w-0">
                        <p className="font-bold text-sm">{feedback.message}</p>
                        {children}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default GameFeedbackBanner;
