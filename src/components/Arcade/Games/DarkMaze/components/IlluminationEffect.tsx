import React from 'react';
import { motion } from 'framer-motion';

interface IlluminationEffectProps {
    isIlluminated: boolean;
}

const IlluminationEffect: React.FC<IlluminationEffectProps> = ({ isIlluminated }) => {
    if (!isIlluminated) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center"
        >
            {/* Dramatic Flash */}
            <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 bg-white"
            />

            {/* Floating non-blocking logo */}
            <motion.div
                initial={{ y: 0, opacity: 1 }}
                animate={{ y: -200, opacity: 0 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="flex flex-col items-center"
            >
                <img
                    src="/images/beyninikullan.webp"
                    className="w-48 h-48 object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]"
                    alt="Power Up"
                />
                <h2 className="text-4xl font-black text-white italic tracking-tighter mt-4 shadow-lg uppercase">BEYNİNİ KULLAN!</h2>
            </motion.div>
        </motion.div>
    );
};

export default IlluminationEffect;
