import { motion } from 'framer-motion';
import { Check, Crown, Sparkles, Palette, Music, Brain, MessageCircle } from 'lucide-react';
import type { Package } from '../types/package';

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

const typeColors = {
    bundle: 'from-purple-600 via-indigo-600 to-purple-700',
    xp_based: 'from-blue-600 via-cyan-600 to-blue-700',
    credit_based: 'from-rose-600 via-pink-600 to-rose-700',
    time_based: 'from-emerald-600 via-teal-600 to-emerald-700',
};

const typeBadgeColors = {
    bundle: 'from-amber-400 to-yellow-500',
    xp_based: 'from-cyan-400 to-blue-500',
    credit_based: 'from-pink-400 to-rose-500',
    time_based: 'from-teal-400 to-emerald-500',
};

export default function PackageCard({ pkg, index, onContact, xpInput, onXpChange }: PackageCardProps) {
    const Icon = typeIcons[pkg.type];
    const gradientClass = typeColors[pkg.type];
    const badgeGradient = typeBadgeColors[pkg.type];

    const calculatedPrice = pkg.type === 'xp_based' && xpInput
        ? Math.ceil((xpInput / (pkg.xp_required || 10000)) * pkg.price)
        : pkg.price;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative ${pkg.is_recommended ? 'scale-105 z-10' : ''}`}
        >
            {/* Recommended Badge */}
            {pkg.is_recommended && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: 'spring' }}
                        className={`bg-gradient-to-r ${badgeGradient} text-slate-900 text-sm font-black px-6 py-2 rounded-full shadow-lg flex items-center gap-2`}
                    >
                        <Sparkles className="w-4 h-4" />
                        Tavsiye Edilen
                    </motion.div>
                </div>
            )}

            {/* Card */}
            <div className={`bg-gradient-to-br ${gradientClass} rounded-3xl p-6 lg:p-8 border border-white/20 shadow-2xl overflow-hidden relative h-full flex flex-col`}>
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent pointer-events-none" />

                {/* Icon */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 + index * 0.1, type: 'spring' }}
                    className={`w-16 h-16 bg-gradient-to-br ${badgeGradient} rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl`}
                >
                    <Icon className="w-8 h-8 text-slate-900" />
                </motion.div>

                {/* Title */}
                <h3 className="text-xl lg:text-2xl font-black text-white text-center mb-2">
                    {pkg.name}
                </h3>

                {/* Description */}
                {pkg.description && (
                    <p className="text-white/80 text-sm text-center mb-4 line-clamp-2">
                        {pkg.description}
                    </p>
                )}

                {/* XP Input for Standard Package */}
                {pkg.type === 'xp_based' && onXpChange && (
                    <div className="mb-4 bg-white/10 rounded-xl p-4">
                        <label className="block text-white/80 text-sm mb-2 text-center">
                            Almak istediğiniz XP miktarı
                        </label>
                        <input
                            type="number"
                            min={pkg.xp_required || 10000}
                            step={1000}
                            value={xpInput || pkg.xp_required || 10000}
                            onChange={(e) => onXpChange(Math.max(pkg.xp_required || 10000, parseInt(e.target.value) || 0))}
                            className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-white/50"
                        />
                        <p className="text-white/60 text-xs text-center mt-2">
                            Min: {(pkg.xp_required || 10000).toLocaleString('tr-TR')} XP
                        </p>
                    </div>
                )}

                {/* Price */}
                <div className="text-center mb-4">
                    <div className="flex items-center justify-center gap-1">
                        <span className="text-4xl lg:text-5xl font-black text-white">
                            ₺{calculatedPrice.toLocaleString('tr-TR')}
                        </span>
                    </div>
                    <span className="text-white/70 text-sm">
                        {pkg.type === 'bundle' && '/Dönemlik'}
                        {pkg.type === 'xp_based' && `/ ${(xpInput || pkg.xp_required || 10000).toLocaleString('tr-TR')} XP`}
                        {pkg.type === 'credit_based' && `/ ${pkg.initial_credits} Analiz Hakkı`}
                        {pkg.type === 'time_based' && '/ Sınav Tarihine Kadar'}
                    </span>

                    {/* Renewal price for credit-based */}
                    {pkg.type === 'credit_based' && pkg.price_renewal && (
                        <p className="text-white/60 text-xs mt-1">
                            Sonraki 10 hak: ₺{pkg.price_renewal.toLocaleString('tr-TR')}
                        </p>
                    )}
                </div>

                {/* Features */}
                <div className="flex-1 mb-6">
                    <ul className="space-y-2">
                        {pkg.features.map((feature, i) => (
                            <motion.li
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 + i * 0.05 }}
                                className="flex items-start gap-2"
                            >
                                <Check className="w-5 h-5 text-white/80 flex-shrink-0 mt-0.5" />
                                <span className="text-white/90 text-sm">{feature}</span>
                            </motion.li>
                        ))}
                    </ul>
                </div>

                {/* CTA Buttons */}
                <div className="space-y-3">
                    {/* Direct Payment Button - if payment_url exists */}
                    {pkg.payment_url && (
                        <motion.a
                            href={pkg.payment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="block w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-black text-lg rounded-xl shadow-lg transition-all text-center"
                        >
                            💳 Hemen Öde
                        </motion.a>
                    )}

                    {/* WhatsApp Button */}
                    <motion.a
                        href={pkg.whatsapp_url || `https://api.whatsapp.com/send/?phone=905416150721&text=${encodeURIComponent(`Merhaba, "${pkg.name}" paketi hakkında bilgi almak istiyorum.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => onContact(pkg)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className={`block w-full py-4 bg-gradient-to-r ${badgeGradient} text-slate-900 font-black text-lg rounded-xl shadow-lg transition-all text-center`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <MessageCircle className="w-5 h-5" />
                            Bilgi Al
                        </div>
                    </motion.a>
                </div>

                {/* Includes badges */}
                {pkg.includes.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2 justify-center">
                        {pkg.includes.map((inc) => (
                            <span
                                key={inc}
                                className="px-3 py-1 bg-white/10 rounded-full text-white/70 text-xs font-medium"
                            >
                                {inc === 'genel_yetenek' && '🧠 Genel Yetenek'}
                                {inc === 'resim' && '🎨 Resim'}
                                {inc === 'muzik' && '🎵 Müzik'}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
