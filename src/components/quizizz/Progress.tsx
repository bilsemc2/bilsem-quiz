import React from 'react';
import { motion } from 'framer-motion';

interface ProgressProps {
    completedCount: number;
    totalCodes: number;
    completionPercentage: number;
}

export const Progress: React.FC<ProgressProps> = ({ completedCount, totalCodes, completionPercentage }) => {
    if (totalCodes === 0) {
        return null;
    }

    return (
        <div className="w-full max-w-md">
            <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">İlerleme</span>
                <span className="text-emerald-400 font-bold">{completedCount}/{totalCodes} (%{completionPercentage})</span>
            </div>
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${completionPercentage}%` }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full"
                />
            </div>
        </div>
    );
};
