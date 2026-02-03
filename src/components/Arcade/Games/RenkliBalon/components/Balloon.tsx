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
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                    {isHighlighted && (
                        <motion.div
                            animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            className="absolute inset-0 bg-yellow-400 blur-xl rounded-full -z-10"
                        />
                    )}

                    <div
                        className={`w-20 h-24 rounded-[50%_50%_50%_50%/40%_40%_60%_60%] flex items-center justify-center text-white text-2xl font-bold shadow-lg transition-all duration-300 ${isHighlighted ? 'ring-4 ring-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.8)]' : ''}`}
                        style={{ backgroundColor: color }}
                    >
                        {value}
                        <div className="absolute top-2 left-4 w-4 h-6 bg-white opacity-30 rounded-full rotate-[15deg]"></div>
                    </div>

                    <div
                        className="w-4 h-2 -mt-1 rounded-sm"
                        style={{ backgroundColor: color }}
                    ></div>

                    <div className="w-0.5 h-12 bg-gray-400 opacity-50"></div>

                    {isHighlighted && (
                        <motion.div
                            initial={{ y: -10, opacity: 0 }}
                            animate={{ y: -30, opacity: 1 }}
                            className="absolute -top-12 text-yellow-500 font-black text-sm bg-white px-2 py-1 rounded-lg shadow-md border-2 border-yellow-400 whitespace-nowrap"
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
