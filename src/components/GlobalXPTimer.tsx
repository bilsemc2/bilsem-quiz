import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useXP } from '../contexts/XPContext';

const GlobalXPTimer = () => {
    const { user } = useAuth();
    const { secondsActive, lastXPGainAt } = useXP();
    const [showGainAnim, setShowGainAnim] = useState(false);
    const XP_INTERVAL = 60;

    useEffect(() => {
        if (lastXPGainAt > 0) {
            setShowGainAnim(true);
            const timer = setTimeout(() => setShowGainAnim(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [lastXPGainAt]);

    if (!user) return null;

    const progress = (secondsActive / XP_INTERVAL) * 100;

    return (
        <div className="fixed bottom-28 right-6 z-[90] flex flex-col items-end pointer-events-none">
            {/* Floating XP Gain Animation */}
            <AnimatePresence>
                {showGainAnim && (
                    <motion.div
                        initial={{ opacity: 0, y: 0, scale: 0.5 }}
                        animate={{ opacity: 1, y: -40, scale: 1.2 }}
                        exit={{ opacity: 0, y: -80, scale: 1.5 }}
                        className="mb-2"
                    >
                        <div className="bg-emerald-500 text-white font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 border border-white/20">
                            <Sparkles className="w-3.5 h-3.5 fill-white" />
                            <span className="text-sm">+1 XP</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mini Timer Bubble */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8, x: 50 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                className="pointer-events-auto bg-slate-900/80 backdrop-blur-md border border-white/10 p-1.5 rounded-full shadow-xl flex items-center gap-2 pr-3 group hover:border-emerald-500/50 transition-colors"
            >
                <div className="relative w-8 h-8 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90">
                        <circle
                            cx="16"
                            cy="16"
                            r="14"
                            fill="transparent"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            className="text-slate-800"
                        />
                        <motion.circle
                            cx="16"
                            cy="16"
                            r="14"
                            fill="transparent"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeDasharray={88}
                            initial={{ strokeDashoffset: 88 }}
                            animate={{ strokeDashoffset: 88 - (88 * progress) / 100 }}
                            className="text-emerald-500"
                            transition={{ duration: 1, ease: "linear" }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                </div>

                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white leading-none uppercase tracking-tighter">
                        {Math.floor((XP_INTERVAL - secondsActive) / 60)}:
                        {String((XP_INTERVAL - secondsActive) % 60).padStart(2, '0')}
                    </span>
                    <span className="text-[8px] font-bold text-slate-500 leading-none mt-0.5">XP SÜRESİ</span>
                </div>
            </motion.div>
        </div>
    );
};

export default GlobalXPTimer;
