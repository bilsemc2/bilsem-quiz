import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, Sparkles, X, RefreshCw } from 'lucide-react';

const UpdatePrompt: React.FC = () => {
    const [show, setShow] = useState(false);
    const [updateFn, setUpdateFn] = useState<(() => void) | null>(null);

    useEffect(() => {
        const handleUpdate = (e: any) => {
            setUpdateFn(() => e.detail);
            setShow(true);
        };

        window.addEventListener('pwa-refresh-available', handleUpdate);
        return () => window.removeEventListener('pwa-refresh-available', handleUpdate);
    }, []);

    const handleUpdate = () => {
        if (updateFn) {
            updateFn();
        }
        setShow(false);
    };

    return (
        <AnimatePresence>
            {show && (
                <div className="fixed inset-x-0 top-0 z-[1000] flex justify-center p-4 pointer-events-none">
                    <motion.div
                        initial={{ y: -100, opacity: 0, scale: 0.9 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: -100, opacity: 0, scale: 0.9 }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        className="pointer-events-auto max-w-md w-full"
                    >
                        <div className="relative group">
                            {/* Glow Effect */}
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>

                            <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                                {/* Decorative Pattern */}
                                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                    <Sparkles className="w-12 h-12 text-indigo-500" />
                                </div>

                                <div className="p-5 flex items-center gap-4">
                                    {/* Icon Container */}
                                    <div className="relative flex-shrink-0">
                                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                            <Rocket className="w-6 h-6 text-white" />
                                        </div>
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            className="absolute -top-1 -right-1 w-3 h-3 bg-pink-500 rounded-full border-2 border-white dark:border-slate-900"
                                        />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            Modern Güncelleme Hazır!
                                            <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-500 text-[10px] rounded-full uppercase tracking-wider">v3.0</span>
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                                            Yeni özellikler ve performans iyileştirmelerini kaçırma.
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleUpdate}
                                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/25 active:scale-95 whitespace-nowrap"
                                        >
                                            <RefreshCw className="w-3.5 h-3.5" />
                                            Yükle
                                        </button>

                                        <button
                                            onClick={() => setShow(false)}
                                            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Bottom Progress Simulation (Visual only) */}
                                <div className="h-1 w-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                                    <motion.div
                                        initial={{ x: "-100%" }}
                                        animate={{ x: "100%" }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                        className="h-full w-1/3 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default UpdatePrompt;
