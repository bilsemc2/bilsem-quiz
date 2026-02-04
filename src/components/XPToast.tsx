import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Zap, TrendingDown, TrendingUp, Sparkles, AlertTriangle, Coins } from 'lucide-react';

interface XPToastOptions {
    amount: number;
    reason?: string;
    type: 'deduct' | 'earn' | 'error';
}

const XPToast = ({ amount, reason, type }: XPToastOptions) => {
    const isDeduct = type === 'deduct';
    const isError = type === 'error';

    return (
        <div className="flex items-center gap-4">
            {/* Animated Icon */}
            <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className={`
          relative flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center
          ${isError
                        ? 'bg-gradient-to-br from-red-500 to-red-600'
                        : isDeduct
                            ? 'bg-gradient-to-br from-orange-500 to-red-500'
                            : 'bg-gradient-to-br from-emerald-500 to-teal-500'
                    }
          shadow-lg ${isDeduct ? 'shadow-orange-500/40' : isError ? 'shadow-red-500/40' : 'shadow-emerald-500/40'}
        `}
            >
                {isError ? (
                    <AlertTriangle className="w-7 h-7 text-white" />
                ) : isDeduct ? (
                    <TrendingDown className="w-7 h-7 text-white" />
                ) : (
                    <TrendingUp className="w-7 h-7 text-white" />
                )}

                {/* Pulse ring */}
                <motion.div
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 1, repeat: 2 }}
                    className={`absolute inset-0 rounded-2xl ${isDeduct ? 'bg-orange-500' : isError ? 'bg-red-500' : 'bg-emerald-500'}`}
                />
            </motion.div>

            {/* Content */}
            <div className="flex-1">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center gap-2"
                >
                    <Zap className={`w-5 h-5 ${isError ? 'text-red-400' : isDeduct ? 'text-orange-400' : 'text-yellow-400'}`} fill="currentColor" />
                    <span className={`font-black text-2xl ${isError ? 'text-red-400' : isDeduct ? 'text-orange-400' : 'text-emerald-400'}`}>
                        {isDeduct ? '-' : '+'}{amount} XP
                    </span>
                </motion.div>

                {reason && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-white/70 text-sm mt-1 font-medium"
                    >
                        {reason}
                    </motion.p>
                )}
            </div>

            {/* Floating coins animation for deduct */}
            {isDeduct && (
                <div className="relative">
                    {[...Array(3)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 1, y: 0, x: 0 }}
                            animate={{ opacity: 0, y: -30, x: (i - 1) * 15 }}
                            transition={{ duration: 0.8, delay: i * 0.1 }}
                            className="absolute -top-2 right-0"
                        >
                            <Coins className="w-4 h-4 text-orange-400" />
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Sparkles for earn */}
            {!isDeduct && !isError && (
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                    <Sparkles className="w-6 h-6 text-yellow-400" />
                </motion.div>
            )}
        </div>
    );
};

// XP düşürme bildirimi - Daha dikkat çekici
export const showXPDeduct = (amount: number, reason?: string) => {
    toast.custom(
        () => (
            <motion.div
                initial={{ opacity: 0, scale: 0.8, y: -50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -50 }}
                className="max-w-sm w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl shadow-orange-500/20 rounded-3xl border border-orange-500/30 p-5 backdrop-blur-xl"
            >
                <XPToast amount={amount} reason={reason} type="deduct" />

                {/* Bottom glow effect */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent rounded-full" />
            </motion.div>
        ),
        { duration: 3500, position: 'top-center' }
    );
};

// XP kazanma bildirimi - Kutlama efekti
export const showXPEarn = (amount: number, reason?: string) => {
    toast.custom(
        () => (
            <motion.div
                initial={{ opacity: 0, scale: 0.8, y: -50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -50 }}
                className="max-w-sm w-full bg-gradient-to-br from-slate-900 via-emerald-900/30 to-slate-900 shadow-2xl shadow-emerald-500/20 rounded-3xl border border-emerald-500/30 p-5 backdrop-blur-xl relative overflow-hidden"
            >
                {/* Celebration particles */}
                {[...Array(8)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{
                            opacity: [0, 1, 0],
                            scale: [0, 1, 0],
                            x: Math.cos(i * 45 * Math.PI / 180) * 60,
                            y: Math.sin(i * 45 * Math.PI / 180) * 60
                        }}
                        transition={{ duration: 0.8, delay: i * 0.05 }}
                        className="absolute top-1/2 left-1/2 w-2 h-2 bg-emerald-400 rounded-full"
                    />
                ))}

                <XPToast amount={amount} reason={reason} type="earn" />

                {/* Bottom glow effect */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent rounded-full" />
            </motion.div>
        ),
        { duration: 3500, position: 'top-center' }
    );
};

// XP hata bildirimi
export const showXPError = (message: string) => {
    toast.custom(
        () => (
            <motion.div
                initial={{ opacity: 0, scale: 0.8, y: -50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -50 }}
                className="max-w-sm w-full bg-gradient-to-br from-slate-900 via-red-900/30 to-slate-900 shadow-2xl shadow-red-500/20 rounded-3xl border border-red-500/30 p-5 backdrop-blur-xl"
            >
                <div className="flex items-center gap-4">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring" }}
                        className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/40"
                    >
                        <AlertTriangle className="w-7 h-7 text-white" />
                    </motion.div>
                    <div>
                        <div className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-red-400" fill="currentColor" />
                            <span className="font-black text-xl text-red-400">XP Hatası</span>
                        </div>
                        <p className="text-white/70 text-sm mt-1 font-medium">{message}</p>
                    </div>
                </div>
            </motion.div>
        ),
        { duration: 4000, position: 'top-center' }
    );
};

export default XPToast;
