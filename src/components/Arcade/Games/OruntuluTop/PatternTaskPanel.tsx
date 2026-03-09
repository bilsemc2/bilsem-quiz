import React from 'react';
import { HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { COLOR_CONFIG } from './constants';
import type { BubbleColor } from './types';

interface PatternTaskPanelProps {
    currentPattern: BubbleColor[];
}

const PatternTaskPanel: React.FC<PatternTaskPanelProps> = ({
    currentPattern
}) => {
    return (
        <div className="absolute top-28 sm:top-20 lg:top-16 left-1/2 z-20 w-full max-w-xl -translate-x-1/2 px-4 pointer-events-none">
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="pointer-events-auto rotate-1 rounded-[2rem] border-2 border-black/10 bg-white p-4 shadow-neo-sm transition-colors duration-300 dark:bg-slate-800 dark:shadow-[8px_8px_0_#0f172a] sm:p-6"
            >
                <div className="flex flex-col items-center gap-3 sm:gap-5">
                    <span className="transform -rotate-1 rounded-lg border-2 border-black/10 bg-sky-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-black shadow-neo-sm transition-colors duration-300 dark:bg-slate-700 dark:text-white">
                        Örüntü Görevi
                    </span>
                    <div className="flex items-center gap-2 sm:gap-4">
                        {currentPattern.map((color, index) => (
                            <React.Fragment key={`${color}-${index}`}>
                                <div
                                    className="relative h-10 w-10 rounded-full border-2 border-black/10 sm:h-12 sm:w-12"
                                    style={{ backgroundColor: COLOR_CONFIG[color].hex }}
                                >
                                    <div className="absolute top-1 left-2 h-3 w-3 rounded-full bg-white/60" />
                                </div>
                                <div className="h-1 w-2 rounded-full bg-black" />
                            </React.Fragment>
                        ))}
                        <div className="flex h-10 w-10 animate-pulse items-center justify-center rounded-full border-4 border-dashed border-black/10 bg-slate-100 transition-colors duration-300 dark:bg-slate-700 sm:h-12 sm:w-12">
                            <HelpCircle className="h-6 w-6 text-black dark:text-white" strokeWidth={3} />
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default PatternTaskPanel;
