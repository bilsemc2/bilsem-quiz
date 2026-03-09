import React from 'react';
import { motion } from 'framer-motion';

import type { GamePhase } from '../types';

interface PhaseStatusPanelProps {
    phase: Extract<GamePhase, 'watching' | 'popping'>;
    watchDurationMs: number;
}

const PhaseStatusPanel: React.FC<PhaseStatusPanelProps> = ({
    phase,
    watchDurationMs
}) => {
    if (phase === 'watching') {
        return (
            <motion.div
                key="watching"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3 sm:gap-4"
            >
                <div className="text-lg sm:text-2xl font-black text-black bg-purple-300 px-5 sm:px-8 py-2 sm:py-3 rounded-2xl border-2 border-black/10 shadow-neo-sm -rotate-1">
                    Balonlari Aklinda Tut! 🧠
                </div>
                <div className="w-48 sm:w-64 h-3 sm:h-4 bg-gray-200 dark:bg-slate-700 border-2 border-black/10 dark:border-slate-950 rounded-full overflow-hidden shadow-[inset_0_4px_4px_rgba(0,0,0,0.1)]">
                    <motion.div
                        initial={{ width: '100%' }}
                        animate={{ width: '0%' }}
                        transition={{ duration: watchDurationMs / 1000, ease: 'linear' }}
                        className="h-full bg-rose-500 rounded-full"
                    />
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            key="popping"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-lg sm:text-2xl font-black text-black bg-rose-400 animate-pulse px-5 sm:px-8 py-2 sm:py-3 rounded-2xl border-2 border-black/10 shadow-neo-sm rotate-1"
        >
            Dikkat! Patliyorlar! 💥
        </motion.div>
    );
};

export default PhaseStatusPanel;
