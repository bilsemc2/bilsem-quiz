import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useXP } from '@/contexts/XPContext';

interface TimeXPGainProps {
    onGain?: (newXP: number) => void;
}

const TimeXPGain = ({ onGain }: TimeXPGainProps) => {
    const { profile } = useAuth();
    const { secondsActive, lastXPGainAt } = useXP();
    const [showAnimation, setShowAnimation] = useState(false);
    const XP_INTERVAL = 60;

    const prevLastGain = useRef(lastXPGainAt);

    useEffect(() => {
        if (lastXPGainAt > 0 && lastXPGainAt > prevLastGain.current) {
            setShowAnimation(true);
            const timer = setTimeout(() => setShowAnimation(false), 2000);
            if (onGain && profile?.experience) onGain(profile.experience);
            prevLastGain.current = lastXPGainAt;
            return () => clearTimeout(timer);
        } else {
            prevLastGain.current = lastXPGainAt;
        }
    }, [lastXPGainAt, onGain, profile?.experience]);

    const progress = (secondsActive / XP_INTERVAL) * 100;

    return (
        <div className="bg-slate-800/50 border border-emerald-500/20 rounded-2xl p-5 relative overflow-hidden group">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors" />

            <div className="flex items-center gap-4 relative z-10">
                {/* Circular Progress */}
                <div className="relative w-16 h-16 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90">
                        <circle
                            cx="32"
                            cy="32"
                            r="28"
                            fill="transparent"
                            stroke="currentColor"
                            strokeWidth="4"
                            className="text-slate-700"
                        />
                        <motion.circle
                            cx="32"
                            cy="32"
                            r="28"
                            fill="transparent"
                            stroke="currentColor"
                            strokeWidth="4"
                            strokeDasharray={176}
                            initial={{ strokeDashoffset: 176 }}
                            animate={{ strokeDashoffset: 176 - (176 * progress) / 100 }}
                            className="text-emerald-500"
                            transition={{ duration: 1, ease: "linear" }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Clock className="w-6 h-6 text-emerald-400" />
                    </div>
                </div>

                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-white">Sitede Kal, Kazan!</h3>
                        <div className="px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-tighter">Aktif</span>
                        </div>
                    </div>
                    <p className="text-white/50 text-sm leading-tight pr-4">
                        Her 1 dakika için <span className="text-emerald-400 font-bold">+1 XP</span> kazanırsın.
                    </p>
                </div>

                <div className="text-right">
                    <div className="text-2xl font-black text-white leading-none">
                        {Math.floor((XP_INTERVAL - secondsActive) / 60)}:
                        {String((XP_INTERVAL - secondsActive) % 60).padStart(2, '0')}
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                        {progress >= 100 ? 'Kazanılıyor...' : 'Kalan Süre'}
                    </div>
                </div>
            </div>

            {/* Floating XP Animation */}
            <AnimatePresence>
                {showAnimation && (
                    <motion.div
                        initial={{ opacity: 0, y: 0, scale: 0.5 }}
                        animate={{ opacity: 1, y: -50, scale: 1.2 }}
                        exit={{ opacity: 0, y: -100, scale: 1.5 }}
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                    >
                        <div className="flex flex-col items-center">
                            <div className="bg-emerald-500 text-white font-black px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-2 border-2 border-white/20">
                                <Sparkles className="w-5 h-5 fill-white" />
                                +1 XP
                            </div>
                            <motion.div
                                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.8, 0] }}
                                transition={{ duration: 1, repeat: Infinity }}
                                className="w-12 h-12 bg-emerald-500/30 rounded-full blur-xl -mt-4"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Progress Bar Footer (Compact fallback) */}
            <div className="mt-4 h-1 bg-slate-700/50 rounded-full overflow-hidden">
                <motion.div
                    animate={{ x: `${progress - 100}%` }}
                    className="w-full h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                    transition={{ duration: 1, ease: "linear" }}
                />
            </div>
        </div>
    );
};

export default TimeXPGain;
