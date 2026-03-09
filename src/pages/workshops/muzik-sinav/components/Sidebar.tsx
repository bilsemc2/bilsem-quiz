/**
 * Sidebar — Progress-tracking sidebar for the Music Exam Workshop.
 * Tactile Cyber-Pop aesthetic, matches existing music workshop sidebar pattern.
 */

import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useExam } from '../contexts/exam/useExam';

const menuItems = [
    { path: 'tek-ses', label: 'Tek Ses', icon: '🎵', module: 'tek-ses' as const, maxPoints: 10 },
    { path: 'cift-ses', label: 'Çift Ses', icon: '🎶', module: 'cift-ses' as const, maxPoints: 6 },
    { path: 'ezgi', label: 'Ezgi Tekrarı', icon: '🎼', module: 'ezgi' as const, maxPoints: 20 },
    { path: 'ritim', label: 'Ritim Tekrarı', icon: '🥁', module: 'ritim' as const, maxPoints: 24 },
    { path: 'sarki', label: 'Şarkı Söyleme', icon: '🎤', module: 'sarki' as const, maxPoints: 25 },
    { path: 'uretkenlik', label: 'Müzikal Üretkenlik', icon: '✨', module: 'uretkenlik' as const, maxPoints: 15 },
];

interface SidebarProps {
    isMobileOpen?: boolean;
    onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onMobileClose }) => {
    const navigate = useNavigate();
    const { isModuleComplete, getModuleScore, allModulesComplete, resetExam } = useExam();
    const [showResetModal, setShowResetModal] = useState(false);

    const completedCount = menuItems.filter(item => isModuleComplete(item.module)).length;
    const totalScore = menuItems.reduce((total, item) => total + (getModuleScore(item.module)?.earnedPoints ?? 0), 0);
    const progress = (completedCount / menuItems.length) * 100;

    const handleReset = () => {
        resetExam();
        setShowResetModal(false);
    };

    return (
        <>
            {isMobileOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[50] md:hidden" onClick={onMobileClose} />
            )}

            <aside className={`bg-white dark:bg-slate-800 border-r-2 border-black/10 dark:border-white/10 p-5 overflow-y-auto transition-transform ${isMobileOpen
                ? 'fixed left-0 top-0 w-[280px] h-[100dvh] translate-x-0 z-[60]'
                : 'fixed left-0 top-[72px] w-64 h-[calc(100dvh-72px)] -translate-x-full z-40 md:sticky md:translate-x-0 md:block'
                }`}>

                {/* Mobile Header */}
                <div className="md:hidden flex justify-between items-center mb-6 pb-4 border-b border-black/10 dark:border-white/10">
                    <h3 className="font-nunito font-extrabold text-lg uppercase tracking-wider text-black dark:text-white">Modüller</h3>
                    <button onClick={onMobileClose}
                        className="w-9 h-9 bg-cyber-pink/10 border-2 border-cyber-pink/20 rounded-xl flex items-center justify-center text-cyber-pink font-extrabold text-sm active:scale-95 transition-transform">
                        ✕
                    </button>
                </div>

                {/* Title */}
                <div className="hidden md:flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-cyber-blue/10 border-2 border-cyber-blue/20 rounded-xl flex items-center justify-center text-lg">🎵</div>
                    <div>
                        <h3 className="font-nunito font-extrabold text-sm uppercase tracking-wider text-black dark:text-white">BİLSEM Müzik</h3>
                        <p className="text-[10px] font-nunito font-bold text-cyber-pink uppercase tracking-widest">Yetenek Sınavı</p>
                    </div>
                </div>

                {/* Score Summary */}
                <div className="mb-6 p-3 bg-cyber-gold/10 border-2 border-cyber-gold/20 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-nunito font-extrabold uppercase tracking-widest text-cyber-gold">Toplam Puan</span>
                        <span className="font-nunito font-extrabold text-black dark:text-white text-lg">{totalScore}<span className="text-slate-400 text-xs">/100</span></span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-slate-700 border border-black/5 h-2 rounded-full overflow-hidden">
                        <div className="bg-cyber-emerald h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>
                </div>

                {/* Module List */}
                <nav className="space-y-2">
                    {menuItems.map((item) => {
                        const completed = isModuleComplete(item.module);
                        const score = getModuleScore(item.module);
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={onMobileClose}
                                className={({ isActive }) =>
                                    `w-full flex items-center gap-3 px-4 py-3 border-2 rounded-xl font-nunito font-extrabold text-sm uppercase tracking-wider transition-all ${isActive
                                        ? 'bg-cyber-blue/10 text-cyber-blue border-cyber-blue/30 shadow-neo-sm'
                                        : 'bg-gray-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-transparent hover:border-black/10 hover:-translate-y-0.5'
                                    }`
                                }
                            >
                                <span className="text-lg">{item.icon}</span>
                                <div className="flex-1 min-w-0">
                                    <span className="block truncate">{item.label}</span>
                                    <span className="text-[9px] text-slate-400 font-bold normal-case tracking-normal">
                                        {score ? `${score.earnedPoints}/${item.maxPoints} puan` : `— /${item.maxPoints} puan`}
                                    </span>
                                </div>
                                {completed && (
                                    <span className="w-6 h-6 bg-cyber-emerald border border-black/10 rounded-lg flex items-center justify-center text-white text-xs font-black">✓</span>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                {/* Rapor button */}
                {allModulesComplete && (
                    <button onClick={() => { navigate('rapor'); onMobileClose?.(); }}
                        className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-cyber-gold text-black border-2 border-black/10 font-nunito font-extrabold text-sm uppercase tracking-widest rounded-xl shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-md transition-all animate-pulse">
                        🏆 Sınav Raporu
                    </button>
                )}

                {/* Reset */}
                {completedCount > 0 && (
                    <button onClick={() => setShowResetModal(true)}
                        className="mt-3 w-full py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 rounded-lg text-[10px] font-extrabold tracking-widest uppercase hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">
                        Testleri Sıfırla
                    </button>
                )}

                {/* Back link */}
                <NavLink to="/atolyeler/muzik-sinav" end onClick={onMobileClose}
                    className="mt-6 flex items-center justify-center gap-2 px-4 py-3 bg-cyber-pink/10 text-cyber-pink border-2 border-cyber-pink/20 font-nunito font-extrabold text-xs uppercase tracking-widest rounded-xl hover:-translate-y-1 transition-all group">
                    <span className="group-hover:-translate-x-1 transition-transform">←</span>
                    <span>Ana Sayfaya Dön</span>
                </NavLink>
            </aside>

            {/* ── Modern Reset Confirmation Modal ── */}
            <AnimatePresence>
                {showResetModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                        onClick={() => setShowResetModal(false)}
                    >
                        {/* Backdrop */}
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

                        {/* Modal Card */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-sm bg-white dark:bg-slate-800 border-2 border-black/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                        >
                            {/* Top accent bar */}
                            <div className="h-1.5 bg-gradient-to-r from-red-400 via-red-500 to-orange-400" />

                            <div className="p-6 space-y-5">
                                {/* Icon + Title */}
                                <div className="text-center space-y-3">
                                    <motion.div
                                        initial={{ rotate: -10 }}
                                        animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
                                        transition={{ duration: 0.6, delay: 0.2 }}
                                        className="w-16 h-16 mx-auto bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800/40 rounded-2xl flex items-center justify-center"
                                    >
                                        <span className="text-3xl">⚠️</span>
                                    </motion.div>
                                    <div>
                                        <h3 className="font-nunito font-extrabold text-lg text-black dark:text-white uppercase tracking-wider">
                                            Sınavı Sıfırla
                                        </h3>
                                        <p className="text-slate-500 dark:text-slate-400 font-nunito font-bold text-sm mt-1 leading-relaxed">
                                            Tüm test sonuçların ve puanların silinecek. Bu işlem geri alınamaz.
                                        </p>
                                    </div>
                                </div>

                                {/* Score being lost */}
                                {totalScore > 0 && (
                                    <div className="flex items-center justify-center gap-3 px-4 py-2.5 bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-800/30 rounded-xl">
                                        <span className="text-red-500 font-nunito font-extrabold text-xs uppercase tracking-widest">Silinecek:</span>
                                        <span className="font-nunito font-extrabold text-red-600 dark:text-red-400">
                                            {totalScore} puan & {completedCount} modül
                                        </span>
                                    </div>
                                )}

                                {/* Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowResetModal(false)}
                                        className="flex-1 py-3 bg-gray-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-2 border-black/5 dark:border-white/10 font-nunito font-extrabold text-xs uppercase tracking-widest rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 active:scale-[0.97] transition-all"
                                    >
                                        Vazgeç
                                    </button>
                                    <button
                                        onClick={handleReset}
                                        className="flex-1 py-3 bg-red-500 text-white border-2 border-red-600 font-nunito font-extrabold text-xs uppercase tracking-widest rounded-xl hover:bg-red-600 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.97] transition-all"
                                    >
                                        Sıfırla
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
