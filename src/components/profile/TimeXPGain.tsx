import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/auth/useAuth';
import { useXP } from '@/contexts/xp/useXP';
import { TIMED_XP_INTERVAL_SECONDS } from '@/features/xp/model/timedXPSessionModel';

interface TimeXPGainProps {
    onGain?: (newXP: number) => void;
}

const TimeXPGain = ({ onGain }: TimeXPGainProps) => {
    const { profile } = useAuth();
    const { secondsActive, lastXPGainAt } = useXP();
    const [showAnimation, setShowAnimation] = useState(false);
    const XP_INTERVAL = TIMED_XP_INTERVAL_SECONDS;

    const prevLastGain = useRef(lastXPGainAt);

    useEffect(() => {
        if (lastXPGainAt > 0 && lastXPGainAt > prevLastGain.current) {
            setShowAnimation(true);
            const timer = setTimeout(() => setShowAnimation(false), 2000);
            if (onGain && profile?.experience !== undefined) onGain(profile.experience);
            prevLastGain.current = lastXPGainAt;
            return () => clearTimeout(timer);
        } else {
            prevLastGain.current = lastXPGainAt;
        }
    }, [lastXPGainAt, onGain, profile?.experience]);

    const progress = (secondsActive / XP_INTERVAL) * 100;

    return (
        <div className="bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl p-5 relative overflow-hidden group shadow-neo-sm transition-all">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-emerald/10 rounded-full blur-3xl transition-colors" />

            <div className="flex items-center gap-4 relative z-10">
                {/* Circular Progress */}
                <div className="relative w-14 h-14 flex items-center justify-center flex-shrink-0">
                    <svg className="w-full h-full -rotate-90">
                        <circle
                            cx="28"
                            cy="28"
                            r="24"
                            fill="transparent"
                            stroke="currentColor"
                            strokeWidth="3"
                            className="text-gray-200 dark:text-slate-700"
                        />
                        <motion.circle
                            cx="28"
                            cy="28"
                            r="24"
                            fill="transparent"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeDasharray={151}
                            initial={{ strokeDashoffset: 151 }}
                            animate={{ strokeDashoffset: 151 - (151 * progress) / 100 }}
                            className="text-cyber-emerald"
                            transition={{ duration: 1, ease: "linear" }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-black dark:text-cyber-emerald" />
                    </div>
                </div>

                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-nunito font-extrabold text-black dark:text-white text-sm">Sitede Kal, Kazan!</h3>
                        <div className="px-1.5 py-0.5 bg-cyber-emerald/10 rounded-md border border-cyber-emerald/20">
                            <span className="text-[8px] font-nunito font-extrabold text-cyber-emerald uppercase tracking-wider">Aktif</span>
                        </div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-nunito font-bold text-xs leading-tight pr-4">
                        Her 1 dakika için <span className="text-cyber-emerald font-extrabold">+1 XP</span> kazanırsın.
                    </p>
                </div>

                <div className="text-right flex-shrink-0">
                    <div className="text-xl font-nunito font-extrabold text-black dark:text-white leading-none">
                        {Math.floor((XP_INTERVAL - secondsActive) / 60)}:
                        {String((XP_INTERVAL - secondsActive) % 60).padStart(2, '0')}
                    </div>
                    <div className="text-[9px] font-nunito font-extrabold text-slate-400 uppercase tracking-widest mt-0.5">
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
                            <div className="bg-cyber-emerald text-black font-nunito font-extrabold px-3 py-1.5 rounded-xl shadow-neo-sm flex items-center gap-1.5 border-2 border-black/10 text-sm">
                                <Sparkles className="w-4 h-4 fill-current" />
                                +1 XP
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Progress Bar Footer */}
            <div className="mt-3 h-1.5 bg-gray-100 dark:bg-slate-700/50 rounded-full overflow-hidden border border-black/5 dark:border-white/5">
                <motion.div
                    animate={{ x: `${progress - 100}%` }}
                    className="w-full h-full bg-cyber-emerald"
                    transition={{ duration: 1, ease: "linear" }}
                />
            </div>
        </div>
    );
};

export default TimeXPGain;
