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
            className="absolute opacity-60 z-0"
            style={{ top }}
        >
            <div className="relative">
                <div className="w-24 h-8 bg-white rounded-full"></div>
                <div className="w-12 h-12 bg-white rounded-full absolute -top-6 left-4"></div>
                <div className="w-16 h-16 bg-white rounded-full absolute -top-8 left-10"></div>
            </div>
        </motion.div>
    );
};

export default Cloud;
