import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, ShieldAlert, type LucideIcon } from 'lucide-react';

type KidGameFeedbackType = 'success' | 'error' | 'warning';

interface KidGameFeedbackBannerProps {
    message: React.ReactNode | null;
    type?: KidGameFeedbackType;
}

const toneClasses: Record<KidGameFeedbackType, string> = {
    success: 'bg-cyber-emerald text-black',
    error: 'bg-cyber-pink text-white',
    warning: 'bg-cyber-yellow text-black',
};

const toneIcons: Record<KidGameFeedbackType, LucideIcon> = {
    success: CheckCircle2,
    error: ShieldAlert,
    warning: AlertTriangle,
};

const KidGameFeedbackBanner: React.FC<KidGameFeedbackBannerProps> = ({
    message,
    type = 'success',
}) => {
    const Icon = toneIcons[type];

    return (
        <AnimatePresence>
            {message && (
                <motion.div
                    initial={{ opacity: 0, y: 40, scale: 0.86 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.08 }}
                    aria-live="polite"
                    className="pointer-events-none fixed inset-x-4 top-1/2 z-[9999] flex -translate-y-1/2 justify-center"
                >
                    <div
                        className={[
                            'flex max-w-[min(90vw,36rem)] items-center gap-3 rounded-[2rem] border-2 border-black/10 px-6 py-4',
                            'text-center font-black uppercase tracking-[0.18em] shadow-neo-lg backdrop-blur-sm',
                            'text-base sm:text-xl',
                            toneClasses[type],
                        ].join(' ')}
                    >
                        <Icon className="h-7 w-7 shrink-0 stroke-[2.5]" />
                        <span>{message}</span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default KidGameFeedbackBanner;
