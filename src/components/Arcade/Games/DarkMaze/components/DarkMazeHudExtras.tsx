import React from 'react';
import { motion } from 'framer-motion';

interface DarkMazeHudExtrasProps {
    energy: number;
    timeLeft: number;
    lastCollectionTime: number;
}

const DarkMazeHudExtras: React.FC<DarkMazeHudExtrasProps> = ({
    energy,
    timeLeft,
    lastCollectionTime
}) => {
    return (
        <div className="flex items-center gap-2">
            <div className="flex flex-col items-center bg-emerald-200 px-3 py-1.5 rounded-xl border-2 border-black/10 shadow-neo-sm rotate-1">
                <span className="text-[9px] uppercase tracking-widest text-black font-black">
                    ENERJI
                </span>
                <div className="w-16 sm:w-20 h-3 bg-white rounded-full overflow-hidden border-2 border-black/10 relative">
                    <motion.div
                        className={`h-full border-r-2 border-black/10 ${
                            energy < 20 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-400'
                        }`}
                        animate={{
                            width: `${energy}%`,
                            backgroundColor:
                                Date.now() - lastCollectionTime < 500 ? '#4ade80' : undefined
                        }}
                    />
                </div>
            </div>
            <div className="flex flex-col items-center bg-rose-200 px-3 py-1.5 rounded-xl border-2 border-black/10 shadow-neo-sm -rotate-1">
                <span className="text-[9px] uppercase tracking-widest text-black font-black">
                    SURE
                </span>
                <span
                    className={`text-base font-black ${
                        timeLeft < 10 ? 'text-rose-600 animate-pulse' : 'text-black'
                    }`}
                >
                    {timeLeft}s
                </span>
            </div>
        </div>
    );
};

export default DarkMazeHudExtras;
