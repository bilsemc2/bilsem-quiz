import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { AlertTriangle, Zap } from 'lucide-react';
import XPToast from './XPToast';

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
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent rounded-full" />
            </motion.div>
        ),
        { duration: 3500, position: 'top-center' }
    );
};

export const showXPEarn = (amount: number, reason?: string) => {
    toast.custom(
        () => (
            <motion.div
                initial={{ opacity: 0, scale: 0.8, y: -50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -50 }}
                className="max-w-sm w-full bg-gradient-to-br from-slate-900 via-emerald-900/30 to-slate-900 shadow-2xl shadow-emerald-500/20 rounded-3xl border border-emerald-500/30 p-5 backdrop-blur-xl relative overflow-hidden"
            >
                {[...Array(8)].map((_, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{
                            opacity: [0, 1, 0],
                            scale: [0, 1, 0],
                            x: Math.cos(index * 45 * Math.PI / 180) * 60,
                            y: Math.sin(index * 45 * Math.PI / 180) * 60
                        }}
                        transition={{ duration: 0.8, delay: index * 0.05 }}
                        className="absolute top-1/2 left-1/2 w-2 h-2 bg-emerald-400 rounded-full"
                    />
                ))}

                <XPToast amount={amount} reason={reason} type="earn" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent rounded-full" />
            </motion.div>
        ),
        { duration: 3500, position: 'top-center' }
    );
};

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
                        transition={{ type: 'spring' }}
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
