import React from 'react';
import { motion } from 'framer-motion';

const Cloud: React.FC<{ top: string; delay: number; duration: number }> = ({ top, delay, duration }) => {
    return (
        <motion.div
            initial={{ x: '-20vw' }}
            animate={{ x: '110vw' }}
            transition={{
                duration,
                repeat: Infinity,
                delay,
                ease: "linear"
            }}
            className="absolute z-0 opacity-80"
            style={{ top }}
        >
            <div className="relative drop-shadow-[2px_2px_0_rgba(0,0,0,0.08)]">
                <div className="w-24 h-8 bg-white rounded-full border-2 border-black/10"></div>
                <div className="w-12 h-12 bg-white rounded-full absolute -top-5 left-4 border-2 border-black/10 border-b-transparent"></div>
                <div className="w-16 h-16 bg-white rounded-full absolute -top-8 left-10 border-2 border-black/10 border-b-transparent"></div>
            </div>
        </motion.div>
    );
};

export default Cloud;
