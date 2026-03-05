// Ortak Erişim Kısıtlı Modal — Kid-UI Neo-Brutalism Tasarım
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Lock, X } from 'lucide-react';

interface AccessDeniedModalProps {
    /** Modal görünürlüğü */
    isOpen: boolean;
    /** Modal'ı kapatma fonksiyonu */
    onClose: () => void;
    /** Erişim reddedilen atölye adı (Müzik, Resim vb.) */
    workshopName: string;
    /** Gerekli yetenek alanı */
    requiredTalent: string;
    /** Kullanıcının mevcut yetenek alanları (opsiyonel) */
    userTalents?: string[];
    /** Primary renk (kullanılmıyor artık, uyumluluk için tutuldu) */
    accentColor?: 'pink' | 'indigo' | 'amber' | 'emerald' | 'purple';
}

const AccessDeniedModal: React.FC<AccessDeniedModalProps> = ({
    isOpen,
    onClose,
    workshopName,
    requiredTalent,
    userTalents,
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                        className="relative max-w-md w-full"
                    >
                        <div className="bg-white dark:bg-slate-800 border-3 border-black/10 rounded-2xl overflow-hidden shadow-neo-lg">
                            {/* Accent strip */}
                            <div className="h-2.5 bg-gradient-to-r from-red-400 via-rose-400 to-red-500" />

                            <div className="p-8 text-center">
                                {/* Kapat Butonu */}
                                <button
                                    onClick={onClose}
                                    className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-slate-700 border-2 border-black/10 rounded-lg text-slate-400 hover:text-red-500 hover:-translate-y-0.5 transition-all"
                                >
                                    <X size={16} strokeWidth={3} />
                                </button>

                                {/* İkon */}
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                                    className="w-20 h-20 mx-auto mb-6 bg-red-50 dark:bg-red-900/20 border-3 border-red-200 dark:border-red-800/40 rounded-2xl flex items-center justify-center"
                                >
                                    <Lock size={36} className="text-red-500" strokeWidth={2.5} />
                                </motion.div>

                                {/* Başlık */}
                                <h2 className="text-xl font-nunito font-extrabold text-black dark:text-white uppercase tracking-tight mb-3">
                                    Bu Atölye Profilinize Uygun Değil
                                </h2>

                                {/* Açıklama */}
                                <p className="text-slate-500 dark:text-slate-400 font-nunito font-bold text-sm leading-relaxed mb-4">
                                    {workshopName} sadece yetenek alanı{' '}
                                    <span className="inline-flex items-center px-2.5 py-0.5 bg-cyber-blue/10 border-2 border-cyber-blue/20 rounded-lg text-cyber-blue font-extrabold text-xs uppercase tracking-wider">
                                        {requiredTalent}
                                    </span>{' '}
                                    olan öğrencilerimiz içindir.
                                </p>

                                {/* Kullanıcının yetenek alanları */}
                                {userTalents && userTalents.length > 0 && (
                                    <div className="bg-gray-50 dark:bg-slate-700/50 border-2 border-black/5 dark:border-white/5 rounded-xl p-3 mb-5">
                                        <p className="text-slate-400 font-nunito font-bold text-[10px] uppercase tracking-widest mb-2">
                                            Sizin Yetenek Alanınız
                                        </p>
                                        <div className="flex flex-wrap gap-2 justify-center">
                                            {userTalents.map((talent) => (
                                                <span
                                                    key={talent}
                                                    className="px-3 py-1 bg-cyber-gold/10 border-2 border-cyber-gold/20 rounded-lg text-cyber-gold font-nunito font-extrabold text-xs uppercase tracking-wider"
                                                >
                                                    {talent}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Butonlar */}
                                <div className="flex flex-col gap-2.5">
                                    <button
                                        onClick={onClose}
                                        className="w-full py-3 bg-gray-100 dark:bg-slate-700 text-black dark:text-white font-nunito font-extrabold uppercase tracking-wider text-sm border-2 border-black/10 rounded-xl hover:-translate-y-0.5 hover:shadow-neo-sm transition-all"
                                    >
                                        Anladım, Sayfada Kalayım
                                    </button>
                                    <Link
                                        to="/profile"
                                        className="w-full py-3 bg-black dark:bg-white text-white dark:text-black font-nunito font-extrabold uppercase tracking-wider text-sm border-3 border-black/10 rounded-xl shadow-neo-sm hover:-translate-y-0.5 hover:shadow-neo-md transition-all text-center"
                                    >
                                        Profilimi Görüntüle
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AccessDeniedModal;
