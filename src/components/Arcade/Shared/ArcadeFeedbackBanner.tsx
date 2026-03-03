import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ArcadeFeedbackBannerProps {
    message: string | null;
    type?: 'success' | 'error' | 'warning';
}

const ArcadeFeedbackBanner: React.FC<ArcadeFeedbackBannerProps> = ({ message, type = 'success' }) => {
    const getStyles = () => {
        switch (type) {
            case 'success': return 'bg-emerald-400 dark:bg-emerald-500 border-black/10 text-black';
            case 'error': return 'bg-rose-400 dark:bg-rose-500 border-black/10 text-black';
            case 'warning': return 'bg-yellow-400 dark:bg-yellow-500 border-black/10 text-black';
            default: return 'bg-emerald-400 dark:bg-emerald-500 border-black/10 text-black';
        }
    };

    return (
        <AnimatePresence>
            {message && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.5 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.5 }}
                    className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] px-8 py-4 rounded-3xl font-black text-xl sm:text-2xl flex items-center gap-3 border-2 text-center uppercase tracking-widest shadow-neo-lg pointer-events-none transition-colors duration-300 ${getStyles()}`}
                >
                    {type === 'success' && <CheckCircle2 className="w-8 h-8 shrink-0" strokeWidth={3} />}
                    {type === 'error' && <ShieldAlert className="w-8 h-8 shrink-0" strokeWidth={3} />}
                    {type === 'warning' && <AlertTriangle className="w-8 h-8 shrink-0" strokeWidth={3} />}
                    {message}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ArcadeFeedbackBanner;
