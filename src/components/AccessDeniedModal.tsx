// Ortak Erişim Kısıtlı Modal Component'i - Tanıtım sayfaları için
import React from 'react';
import { motion } from 'framer-motion';
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
    /** Primary renk - gradient ve buton için (pink, indigo vb.) */
    accentColor?: 'pink' | 'indigo' | 'amber' | 'emerald' | 'purple';
}

const colorClasses = {
    pink: {
        talent: 'text-pink-400',
        button: 'bg-pink-600 hover:bg-pink-700'
    },
    indigo: {
        talent: 'text-indigo-400',
        button: 'bg-indigo-600 hover:bg-indigo-700'
    },
    amber: {
        talent: 'text-amber-400',
        button: 'bg-amber-600 hover:bg-amber-700'
    },
    emerald: {
        talent: 'text-emerald-400',
        button: 'bg-emerald-600 hover:bg-emerald-700'
    },
    purple: {
        talent: 'text-purple-400',
        button: 'bg-purple-600 hover:bg-purple-700'
    }
};

const AccessDeniedModal: React.FC<AccessDeniedModalProps> = ({
    isOpen,
    onClose,
    workshopName,
    requiredTalent,
    userTalents,
    accentColor = 'pink'
}) => {
    if (!isOpen) return null;

    const colors = colorClasses[accentColor];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl border border-white/10 shadow-2xl p-8 max-w-md w-full text-center relative"
            >
                {/* Kapat Butonu */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>

                {/* İkon */}
                <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Lock className="w-10 h-10 text-rose-400" />
                </div>

                {/* Başlık */}
                <h2 className="text-2xl font-bold text-white mb-4">
                    Bu Atölye Profilinize Uygun Değil
                </h2>

                {/* Açıklama */}
                <p className="text-white/70 mb-6 leading-relaxed">
                    {workshopName} sadece yetenek alanı <strong className={colors.talent}>{requiredTalent}</strong> olan öğrencilerimiz içindir.
                    {userTalents && userTalents.length > 0 && (
                        <span className="block mt-2">
                            Sizin yetenek alanınız: <strong className="text-amber-400">{userTalents.join(', ')}</strong>
                        </span>
                    )}
                </p>

                {/* Butonlar */}
                <div className="flex flex-col gap-3">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/10"
                    >
                        Anladım, Sayfada Kalayım
                    </button>
                    <Link
                        to="/profile"
                        className={`w-full py-3 ${colors.button} text-white font-semibold rounded-xl transition-all text-center`}
                    >
                        Profilimi Görüntüle
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default AccessDeniedModal;
