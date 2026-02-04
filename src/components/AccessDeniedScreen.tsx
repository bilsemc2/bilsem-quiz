// Ortak Erişim Kısıtlı Ekranı Component'i
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Lock, ShieldX, ChevronLeft } from 'lucide-react';

interface AccessDeniedScreenProps {
    /** Erişim reddedilen alan adı (Müzik, Genel Yetenek vb.) */
    requiredTalent: string;
    /** Geri dönüş linki */
    backLink: string;
    /** Geri dönüş butonu yazısı */
    backLabel: string;
    /** Kullanıcının mevcut yetenek alanları (opsiyonel, gösterilirse) */
    userTalents?: string[];
    /** İkon tipi: 'lock' veya 'shield' */
    iconType?: 'lock' | 'shield';
    /** Ek bilgi mesajı (opsiyonel) */
    additionalMessage?: string;
}

const AccessDeniedScreen: React.FC<AccessDeniedScreenProps> = ({
    requiredTalent,
    backLink,
    backLabel,
    userTalents,
    iconType = 'lock',
    additionalMessage
}) => {
    const Icon = iconType === 'shield' ? ShieldX : Lock;
    const iconBgColor = iconType === 'shield' ? 'from-red-500 to-rose-600' : 'from-amber-500 to-orange-600';

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 text-center shadow-2xl"
            >
                {/* İkon */}
                <div className={`w-20 h-20 mx-auto mb-6 bg-gradient-to-br ${iconBgColor} rounded-2xl flex items-center justify-center shadow-lg`}>
                    <Icon size={40} className="text-white" />
                </div>

                {/* Başlık */}
                <h1 className="text-2xl font-bold text-white mb-3">
                    Erişim Kısıtlı
                </h1>

                {/* Açıklama */}
                <p className="text-slate-400 mb-4 leading-relaxed">
                    Bu modüle erişim için <span className="text-indigo-400 font-semibold">{requiredTalent}</span> yetkisine sahip olmanız gerekmektedir.
                </p>

                {/* Kullanıcının mevcut yetenek alanları */}
                {userTalents && userTalents.length > 0 && (
                    <p className="text-slate-500 text-sm mb-4">
                        Sizin yetenek alanınız: <span className="text-amber-400 font-semibold">{userTalents.join(', ')}</span>
                    </p>
                )}

                {/* Ek mesaj */}
                {additionalMessage && (
                    <p className="text-slate-500 text-sm mb-6">
                        {additionalMessage}
                    </p>
                )}

                {/* Geri Butonu */}
                <Link
                    to={backLink}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-colors"
                >
                    <ChevronLeft size={18} />
                    {backLabel}
                </Link>
            </motion.div>
        </div>
    );
};

export default AccessDeniedScreen;
