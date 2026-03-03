import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BalloonProps {
    value: string | number;
    color: string;
    onClick?: (event: React.MouseEvent) => void;
    isPopping?: boolean;
    isHighlighted?: boolean;
    className?: string;
}

const Balloon: React.FC<BalloonProps> = ({ value, color, onClick, isPopping, isHighlighted, className }) => {
    return (
        <AnimatePresence>
            {!isPopping && (
                <motion.div
                    initial={{ y: 50, opacity: 0, scale: 0.5 }}
                    animate={{
                        y: 0,
                        opacity: 1,
                        scale: isHighlighted ? 1.25 : 1,
                        zIndex: isHighlighted ? 50 : 1
                    }}
                    exit={{ scale: 2, opacity: 0, transition: { duration: 0.2 } }}
                    whileHover={{ scale: 1.1 }}
                    onClick={onClick}
                    onTouchStart={(e) => {
                        e.preventDefault();
                        if (onClick) onClick(e as unknown as React.MouseEvent);
                    }}
                    className={`relative cursor-pointer flex flex-col items-center select-none touch-none ${className}`}
                >
                    {isHighlighted && (
                        <motion.div
                            animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            className="absolute inset-0 bg-yellow-400 rounded-full -z-10 blur-xl"
                        />
                    )}

                    <div
                        className={`w-16 h-20 sm:w-20 sm:h-24 rounded-[40%_40%_50%_50%] flex items-center justify-center text-black text-xl sm:text-2xl font-black border-2 border-black/10 relative transition-all duration-300 ${isHighlighted ? 'border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.8)]' : ''}`}
                        style={{ backgroundColor: color }}
                    >
                        <div className="absolute top-1 left-2 w-3 h-4 sm:top-2 sm:left-4 sm:w-4 sm:h-6 bg-white/60 rounded-full transform rotate-[20deg]"></div>
                        <span className="z-10 bg-white/30 px-2 rounded-lg">{value}</span>
                    </div>

                    <div
                        className="w-4 h-2 -mt-1 rounded-b-md border-2 border-t-0 border-black/10"
                        style={{ backgroundColor: color }}
                    ></div>

                    <div className="w-1 h-12 bg-black/30 rounded-full"></div>

                    {isHighlighted && (
                        <motion.div
                            initial={{ y: -10, opacity: 0 }}
                            animate={{ y: -30, opacity: 1 }}
                            className="absolute -top-12 text-black font-black text-sm bg-yellow-400 px-3 py-1.5 rounded-xl shadow-neo-xs border-2 border-black/10 whitespace-nowrap"
                        >
                            HEDEF BURADA! 👇
                        </motion.div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Balloon;
