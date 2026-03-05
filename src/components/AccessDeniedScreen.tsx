// Ortak Erişim Kısıtlı Ekranı — Kid-UI Neo-Brutalism + Paket Bilgileri
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Lock, ShieldX, ChevronLeft, Sparkles, Check, ExternalLink, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Package } from '../types/package';

interface AccessDeniedScreenProps {
    /** Erişim reddedilen alan adı (Müzik, Genel Yetenek vb.) */
    requiredTalent: string;
    /** Geri dönüş linki */
    backLink: string;
    /** Geri dönüş butonu yazısı */
    backLabel: string;
    /** Kullanıcının mevcut yetenek alanları (opsiyonel) */
    userTalents?: string[];
    /** İkon tipi: 'lock' veya 'shield' */
    iconType?: 'lock' | 'shield';
    /** Ek bilgi mesajı (opsiyonel) */
    additionalMessage?: string;
    /** Paketlerde filtrelenecek includes değeri (ör: 'genel_yetenek', 'muzik', 'resim') */
    requiredIncludes?: string[];
    /** Geri dönüş callback — verilirse Link yerine button render eder (aynı sayfa state reset için) */
    onBack?: () => void;
}

const AccessDeniedScreen: React.FC<AccessDeniedScreenProps> = ({
    requiredTalent,
    backLink,
    backLabel,
    userTalents,
    iconType = 'lock',
    additionalMessage,
    requiredIncludes,
    onBack,
}) => {
    const Icon = iconType === 'shield' ? ShieldX : Lock;
    const [packages, setPackages] = useState<Package[]>([]);
    const [loadingPkgs, setLoadingPkgs] = useState(false);

    useEffect(() => {
        if (!requiredIncludes || requiredIncludes.length === 0) return;

        const fetchRelevantPackages = async () => {
            setLoadingPkgs(true);
            try {
                const { data, error } = await supabase
                    .from('packages')
                    .select('*')
                    .eq('is_active', true)
                    .order('sort_order', { ascending: true });

                if (error) throw error;

                const parsed: Package[] = (data || []).map(pkg => ({
                    ...pkg,
                    features: typeof pkg.features === 'string' ? JSON.parse(pkg.features) : pkg.features || [],
                    includes: pkg.includes || [],
                }));

                // requiredIncludes'de belirtilen alanlardan herhangi birini içeren paketleri filtrele
                const filtered = parsed.filter(pkg =>
                    pkg.includes.some(inc => requiredIncludes.includes(inc))
                );

                setPackages(filtered);
            } catch (err) {
                console.error('Paketler yüklenirken hata:', err);
            } finally {
                setLoadingPkgs(false);
            }
        };

        fetchRelevantPackages();
    }, [requiredIncludes]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col items-center justify-center px-4 py-12 transition-colors duration-300">
            {/* Background pattern */}
            <div className="fixed inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(0,0,0,0.15)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

            {/* Access Denied Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
                className="max-w-md w-full relative z-10 mb-8"
            >
                <div className="bg-white dark:bg-slate-800 border-3 border-black/10 rounded-2xl overflow-hidden shadow-neo-md">
                    {/* Accent strip */}
                    <div className="h-2.5 bg-gradient-to-r from-red-400 via-rose-400 to-red-500" />

                    <div className="p-8 text-center">
                        {/* Icon */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                            className="w-20 h-20 mx-auto mb-6 bg-red-50 dark:bg-red-900/20 border-3 border-red-200 dark:border-red-800/40 rounded-2xl flex items-center justify-center"
                        >
                            <Icon size={36} className="text-red-500" strokeWidth={2.5} />
                        </motion.div>

                        {/* Title */}
                        <h1 className="text-2xl font-nunito font-extrabold text-black dark:text-white uppercase tracking-tight mb-3">
                            Erişim Kısıtlı
                        </h1>

                        {/* Description */}
                        <p className="text-slate-500 dark:text-slate-400 font-nunito font-bold text-sm leading-relaxed mb-5">
                            Bu modüle erişim için{' '}
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-cyber-blue/10 border-2 border-cyber-blue/20 rounded-lg text-cyber-blue font-extrabold text-xs uppercase tracking-wider">
                                {requiredTalent}
                            </span>{' '}
                            yetkisine sahip olmanız gerekmektedir.
                        </p>

                        {/* User talents */}
                        {userTalents && userTalents.length > 0 && (
                            <div className="bg-gray-50 dark:bg-slate-700/50 border-2 border-black/5 dark:border-white/5 rounded-xl p-4 mb-5">
                                <p className="text-slate-400 font-nunito font-bold text-xs uppercase tracking-wider mb-2">
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

                        {/* Additional message */}
                        {additionalMessage && (
                            <p className="text-slate-400 font-nunito font-bold text-xs leading-relaxed mb-5">
                                {additionalMessage}
                            </p>
                        )}

                        {/* Back button */}
                        {onBack ? (
                            <button
                                onClick={onBack}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-nunito font-extrabold uppercase tracking-widest text-sm border-3 border-black/10 rounded-xl shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-md transition-all"
                            >
                                <ChevronLeft size={16} strokeWidth={3} />
                                {backLabel}
                            </button>
                        ) : (
                            <Link
                                to={backLink}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-nunito font-extrabold uppercase tracking-widest text-sm border-3 border-black/10 rounded-xl shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-md transition-all"
                            >
                                <ChevronLeft size={16} strokeWidth={3} />
                                {backLabel}
                            </Link>
                        )}
                    </div>
                </div>

                {/* Help text */}
                <p className="text-center mt-4 text-slate-400 font-nunito font-bold text-xs">
                    Yardıma mı ihtiyacınız var?{' '}
                    <Link to="/contact" className="text-cyber-blue hover:underline font-extrabold">
                        İletişime geçin
                    </Link>
                </p>
            </motion.div>

            {/* ═══════════════════════════════════════════ */}
            {/* 💰 Paket Bilgileri                         */}
            {/* ═══════════════════════════════════════════ */}
            {packages.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="max-w-3xl w-full relative z-10"
                >
                    {/* Section header */}
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-cyber-emerald/10 border-2 border-cyber-emerald/20 rounded-xl mb-3">
                            <Sparkles size={14} className="text-cyber-emerald" />
                            <span className="font-nunito font-extrabold text-cyber-emerald text-xs uppercase tracking-widest">
                                Hemen Erişim Sağla
                            </span>
                        </div>
                        <h2 className="text-xl font-nunito font-extrabold text-black dark:text-white uppercase tracking-tight">
                            Uygun Paketler
                        </h2>
                        <p className="text-slate-400 font-nunito font-bold text-xs mt-1">
                            Aşağıdaki paketlerden birini satın alarak erişim kazanabilirsiniz
                        </p>
                    </div>

                    {/* Package cards */}
                    <div className={`grid gap-4 ${packages.length === 1 ? 'max-w-sm mx-auto' : packages.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
                        {packages.map((pkg, idx) => (
                            <motion.div
                                key={pkg.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 + idx * 0.1 }}
                            >
                                <div className={`bg-white dark:bg-slate-800 border-3 rounded-2xl overflow-hidden shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-md transition-all ${pkg.is_recommended ? 'border-cyber-emerald' : 'border-black/10'}`}>
                                    {/* Accent */}
                                    <div className={`h-2 ${pkg.is_recommended ? 'bg-cyber-emerald' : 'bg-cyber-blue'}`} />

                                    {pkg.is_recommended && (
                                        <div className="flex justify-center -mt-0">
                                            <span className="bg-cyber-emerald text-white text-[9px] font-nunito font-extrabold uppercase tracking-widest px-3 py-0.5 rounded-b-lg">
                                                ⭐ Önerilen
                                            </span>
                                        </div>
                                    )}

                                    <div className="p-5">
                                        {/* Name & description */}
                                        <h3 className="font-nunito font-extrabold text-black dark:text-white text-lg tracking-tight mb-1">
                                            {pkg.name}
                                        </h3>
                                        {pkg.description && (
                                            <p className="text-slate-400 font-nunito font-bold text-xs mb-4 line-clamp-2">
                                                {pkg.description}
                                            </p>
                                        )}

                                        {/* Price */}
                                        <div className="flex items-baseline gap-1 mb-4">
                                            <span className="text-3xl font-nunito font-extrabold text-black dark:text-white">
                                                {pkg.price.toLocaleString('tr-TR')}
                                            </span>
                                            <span className="text-sm font-nunito font-bold text-slate-400">₺</span>
                                            {pkg.price_renewal && (
                                                <span className="text-[10px] font-nunito font-bold text-slate-400 ml-1">
                                                    / aylık {pkg.price_renewal.toLocaleString('tr-TR')}₺
                                                </span>
                                            )}
                                        </div>

                                        {/* Features */}
                                        {pkg.features.length > 0 && (
                                            <ul className="space-y-1.5 mb-5">
                                                {pkg.features.slice(0, 4).map((f, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-xs font-nunito font-bold text-slate-500 dark:text-slate-400">
                                                        <Check size={14} className="text-cyber-emerald flex-shrink-0 mt-0.5" strokeWidth={3} />
                                                        {f}
                                                    </li>
                                                ))}
                                                {pkg.features.length > 4 && (
                                                    <li className="text-[10px] font-nunito font-bold text-slate-400 pl-5">
                                                        +{pkg.features.length - 4} özellik daha...
                                                    </li>
                                                )}
                                            </ul>
                                        )}

                                        {/* CTA buttons */}
                                        <div className="flex flex-col gap-2">
                                            {pkg.payment_url && (
                                                <a
                                                    href={pkg.payment_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`w-full flex items-center justify-center gap-2 py-2.5 font-nunito font-extrabold uppercase tracking-wider text-xs border-3 border-black/10 rounded-xl shadow-neo-sm hover:-translate-y-0.5 hover:shadow-neo-md transition-all ${pkg.is_recommended
                                                        ? 'bg-cyber-emerald text-black'
                                                        : 'bg-black dark:bg-white text-white dark:text-black'
                                                        }`}
                                                >
                                                    <Zap size={14} strokeWidth={3} />
                                                    Satın Al
                                                </a>
                                            )}
                                            {pkg.whatsapp_url && (
                                                <a
                                                    href={pkg.whatsapp_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-full flex items-center justify-center gap-2 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 font-nunito font-extrabold uppercase tracking-wider text-[10px] border-2 border-green-200 dark:border-green-800/40 rounded-xl hover:-translate-y-0.5 transition-all"
                                                >
                                                    <ExternalLink size={12} strokeWidth={3} />
                                                    WhatsApp ile İletişim
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* All packages link */}
                    <div className="text-center mt-6">
                        <Link
                            to="/pricing"
                            className="inline-flex items-center gap-2 text-cyber-blue font-nunito font-extrabold text-xs uppercase tracking-wider hover:underline"
                        >
                            Tüm paketleri gör
                            <ExternalLink size={12} />
                        </Link>
                    </div>
                </motion.div>
            )}

            {loadingPkgs && (
                <div className="flex items-center gap-2 text-slate-400 font-nunito font-bold text-xs">
                    <div className="w-4 h-4 border-2 border-black/10 border-t-cyber-blue rounded-full animate-spin" />
                    Paketler yükleniyor...
                </div>
            )}
        </div>
    );
};

export default AccessDeniedScreen;
