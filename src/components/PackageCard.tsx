import { motion } from 'framer-motion';
import { Check, Crown, Sparkles, Palette, Music, Brain, MessageCircle } from 'lucide-react';
import type { Package } from '../types/package';

// ═══════════════════════════════════════════════
// 💳 PackageCard — Kid-UI Çocuk Dostu Tasarım
// ═══════════════════════════════════════════════

interface PackageCardProps {
    pkg: Package;
    index: number;
    onContact: (pkg: Package) => void;
    xpInput?: number;
    onXpChange?: (value: number) => void;
}

const typeIcons = {
    bundle: Crown,
    xp_based: Brain,
    credit_based: Palette,
    time_based: Music,
};

const accentColors = {
    bundle: 'bg-cyber-pink',
    xp_based: 'bg-cyber-blue',
    credit_based: 'bg-cyber-gold',
    time_based: 'bg-cyber-emerald',
};

const iconBgColors = {
    bundle: 'bg-cyber-pink/10 border-cyber-pink/30',
    xp_based: 'bg-cyber-blue/10 border-cyber-blue/30',
    credit_based: 'bg-cyber-gold/10 border-cyber-gold/30',
    time_based: 'bg-cyber-emerald/10 border-cyber-emerald/30',
};

export default function PackageCard({ pkg, index, onContact, xpInput, onXpChange }: PackageCardProps) {
    const Icon = typeIcons[pkg.type];
    const accent = accentColors[pkg.type as keyof typeof accentColors] || 'bg-cyber-blue';
    const iconBg = iconBgColors[pkg.type as keyof typeof iconBgColors] || 'bg-cyber-blue/10 border-cyber-blue/30';

    const calculatedPrice = pkg.type === 'xp_based' && xpInput
        ? Math.ceil((xpInput / (pkg.xp_required || 10000)) * pkg.price)
        : pkg.price;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative flex ${pkg.is_recommended ? 'lg:-translate-y-3 z-20' : 'z-10'}`}
        >
            {/* Recommended Badge */}
            {pkg.is_recommended && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-30">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: 'spring' }}
                        className="inline-flex items-center gap-1.5 bg-cyber-gold border-3 border-black/10 rounded-xl shadow-neo-sm text-black font-nunito font-extrabold uppercase text-xs tracking-widest px-4 py-1.5"
                    >
                        <Sparkles strokeWidth={2.5} className="w-4 h-4" />
                        Tavsiye Edilen
                    </motion.div>
                </div>
            )}

            {/* Card */}
            <div className={`w-full bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl overflow-hidden shadow-neo-md hover:shadow-neo-lg hover:-translate-y-1 transition-all flex flex-col ${pkg.is_recommended ? 'ring-2 ring-cyber-gold/50' : ''}`}>
                {/* Accent Strip */}
                <div className={`h-2.5 ${accent}`} />

                <div className="p-6 flex-1 flex flex-col">
                    {/* Icon */}
                    <div className="flex justify-center mb-5">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2 + index * 0.1, type: 'spring' }}
                            className={`w-16 h-16 ${iconBg} border-2 rounded-2xl flex items-center justify-center`}
                        >
                            <Icon className={`w-8 h-8 ${accent.replace('bg-', 'text-')}`} strokeWidth={2} />
                        </motion.div>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-nunito font-extrabold text-center text-black dark:text-white mb-2 uppercase tracking-tight leading-tight">
                        {pkg.name}
                    </h3>

                    {/* Description */}
                    {pkg.description && (
                        <p className="text-center text-slate-500 dark:text-slate-400 font-nunito font-bold text-xs leading-relaxed mb-5">
                            {pkg.description}
                        </p>
                    )}

                    {/* Features */}
                    <div className="flex-1 mb-5 bg-gray-50 dark:bg-slate-700/50 border-2 border-black/5 dark:border-white/5 rounded-xl p-4">
                        <ul className="space-y-2.5">
                            {pkg.features.map((feature, i) => (
                                <motion.li
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 + i * 0.05 }}
                                    className="flex items-start gap-2"
                                >
                                    <Check strokeWidth={3} className="w-4 h-4 flex-shrink-0 mt-0.5 text-cyber-emerald" />
                                    <span className="text-slate-700 dark:text-slate-300 font-nunito font-bold text-xs leading-snug">{feature}</span>
                                </motion.li>
                            ))}
                        </ul>
                    </div>

                    {/* XP Input for Standard Package */}
                    {pkg.type === 'xp_based' && onXpChange && (
                        <div className="mb-5 bg-gray-50 dark:bg-slate-700/50 border-2 border-black/5 dark:border-white/5 rounded-xl p-4 text-center">
                            <label className="block font-nunito font-extrabold uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400 mb-2">
                                Almak istediğiniz XP
                            </label>
                            <input
                                type="number"
                                min={pkg.xp_required || 10000}
                                step={1000}
                                value={xpInput || pkg.xp_required || 10000}
                                onChange={(e) => onXpChange(Math.max(pkg.xp_required || 10000, parseInt(e.target.value) || 0))}
                                className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border-2 border-black/15 dark:border-white/15 rounded-lg text-center text-lg font-nunito font-extrabold text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-cyber-blue/50 transition-shadow"
                            />
                            <p className="font-nunito font-bold text-[10px] mt-2 text-slate-400 uppercase">
                                Min: {(pkg.xp_required || 10000).toLocaleString('tr-TR')} XP
                            </p>
                        </div>
                    )}

                    {/* Price */}
                    <div className="mt-auto">
                        <div className="text-center mb-4 bg-black dark:bg-slate-900 rounded-xl p-4 text-white">
                            <div className="flex flex-col items-center justify-center">
                                <span className="text-3xl font-nunito font-black mb-0.5">
                                    ₺{calculatedPrice.toLocaleString('tr-TR')}
                                </span>
                                <span className="font-nunito font-bold uppercase tracking-widest text-[10px] opacity-70">
                                    {pkg.type === 'bundle' && '/ Dönemlik'}
                                    {pkg.type === 'xp_based' && `/ ${(xpInput || pkg.xp_required || 10000).toLocaleString('tr-TR')} XP`}
                                    {pkg.type === 'credit_based' && `/ ${pkg.initial_credits} Hak`}
                                    {pkg.type === 'time_based' && (pkg.price_renewal ? '/ Aylık' : '/ Sınava Kadar')}
                                </span>
                            </div>

                            {pkg.type === 'credit_based' && pkg.price_renewal && (
                                <p className="font-nunito font-bold text-[10px] mt-2 uppercase text-cyber-gold">
                                    +10 Hak: ₺{pkg.price_renewal.toLocaleString('tr-TR')}
                                </p>
                            )}
                        </div>

                        {/* CTA Buttons */}
                        <div className="space-y-2.5">
                            {pkg.payment_url && (
                                <motion.a
                                    href={pkg.payment_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    whileHover={{ scale: 1.02, y: -1 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex w-full py-3.5 bg-cyber-emerald text-black font-nunito font-extrabold uppercase tracking-wider text-sm border-3 border-black/10 rounded-xl shadow-neo-sm hover:shadow-neo-md transition-all items-center justify-center gap-2"
                                >
                                    💳 Hemen Öde
                                </motion.a>
                            )}

                            <motion.a
                                href={pkg.whatsapp_url || `https://api.whatsapp.com/send/?phone=905416150721&text=${encodeURIComponent(`Merhaba, "${pkg.name}" paketi hakkında bilgi almak istiyorum.`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => onContact(pkg)}
                                whileHover={{ scale: 1.02, y: -1 }}
                                whileTap={{ scale: 0.98 }}
                                className={`flex w-full py-3.5 ${pkg.payment_url ? 'bg-white dark:bg-slate-700 text-black dark:text-white' : `${accent} text-black`} font-nunito font-extrabold uppercase tracking-wider text-sm border-3 border-black/10 rounded-xl shadow-neo-sm hover:shadow-neo-md transition-all items-center justify-center gap-2`}
                            >
                                <MessageCircle strokeWidth={2.5} className="w-5 h-5" />
                                Bilgi Al
                            </motion.a>
                        </div>

                        {/* QR Code */}
                        {pkg.qr_code_url && (
                            <div className="mt-4 flex flex-col items-center">
                                <span className="font-nunito font-extrabold uppercase tracking-wider text-[10px] text-slate-400 dark:text-slate-500 mb-2">
                                    📱 QR ile Öde
                                </span>
                                <div className="bg-white p-2 rounded-xl border-2 border-black/10 dark:border-white/10 shadow-neo-sm">
                                    {pkg.qr_code_url.includes('<img') ? (
                                        <div dangerouslySetInnerHTML={{ __html: pkg.qr_code_url }} style={{ maxWidth: '160px' }} />
                                    ) : (
                                        <img src={pkg.qr_code_url} alt={`${pkg.name} QR Kod`} className="w-40 h-auto" />
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Includes badges */}
                        {pkg.includes.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2 justify-center">
                                {pkg.includes.map((inc) => (
                                    <span
                                        key={inc}
                                        className="px-3 py-1 bg-gray-100 dark:bg-slate-700 border-2 border-black/10 dark:border-white/10 rounded-lg font-nunito font-bold uppercase text-[10px] tracking-wider text-slate-600 dark:text-slate-300"
                                    >
                                        {inc === 'genel_yetenek' && '🧠 Genel Yetenek'}
                                        {inc === 'resim' && '🎨 Resim'}
                                        {inc === 'muzik' && '🎵 Müzik'}
                                        {inc === 'ozel_ders' && '📚 Özel Ders'}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
