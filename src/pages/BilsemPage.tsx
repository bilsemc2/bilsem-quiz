import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, Palette, Music, ChevronRight, Sparkles } from 'lucide-react';

// ═══════════════════════════════════════════════
// 📚 BilsemPage — Kid-UI Çocuk Dostu Tasarım
// ═══════════════════════════════════════════════

const categories = [
    {
        title: 'Genel Yetenek',
        description: 'Mantık, uzamsal düşünme, problem çözme ve analitik düşünce becerileri',
        icon: Brain,
        path: '/atolyeler/genel-yetenek',
        color: 'bg-cyber-blue',
        accentColor: 'bg-cyber-blue',
        features: ['Eksik Parça', 'Küp Açınımları', 'Simetri', 'Hafıza Oyunları'],
        emoji: '🧠',
    },
    {
        title: 'Resim',
        description: 'Görsel sanatlar, renk teorisi, perspektif ve yaratıcı tasarım',
        icon: Palette,
        path: '/atolyeler/resim',
        color: 'bg-cyber-pink',
        accentColor: 'bg-cyber-pink',
        features: ['Şekil Tanıma', 'Renk Karışımı', 'Perspektif', 'Desen Tasarımı'],
        emoji: '🎨',
    },
    {
        title: 'Müzik',
        description: 'Ritim, melodi, nota okuma ve müzikal zeka geliştirme',
        icon: Music,
        path: '/atolyeler/muzik-sinav',
        color: 'bg-cyber-gold',
        accentColor: 'bg-cyber-gold',
        features: ['Ritim Atölyesi', 'Nota Okuma', 'Melodi Eşleştirme', 'Enstrüman Tanıma'],
        emoji: '🎵',
    },
];

const BilsemPage = () => {
    return (
        <div className="min-h-screen overflow-hidden transition-colors duration-300">
            {/* Background pattern — dots */}
            <div className="fixed inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(0,0,0,0.15)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

            <div className="relative z-10 container mx-auto px-6 py-24 md:py-32">
                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, type: 'spring', bounce: 0.5 }}
                    className="text-center mb-20 relative"
                >
                    <motion.div
                        whileHover={{ scale: 1.05, rotate: 2 }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyber-gold text-black font-nunito font-extrabold border-3 border-black/10 shadow-neo-sm rounded-xl text-sm uppercase tracking-widest mb-8"
                    >
                        <Sparkles className="w-4 h-4" />
                        Yeteneklerini Keşfet
                    </motion.div>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-nunito font-black text-black dark:text-white mb-6 uppercase tracking-tight leading-none">
                        BİLSEM
                    </h1>
                    <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-lg mx-auto font-nunito font-bold">
                        Üç farklı alanda yeteneklerini test et ve geliştir 🚀
                    </p>
                </motion.div>

                {/* Category Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
                    {categories.map((category, index) => {
                        const Icon = category.icon;
                        return (
                            <motion.div
                                key={category.title}
                                initial={{ opacity: 0, scale: 0.9, y: 40 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ delay: index * 0.12, duration: 0.5, type: 'spring', bounce: 0.4 }}
                                className="h-full"
                            >
                                <Link to={category.path} className="block h-full group outline-none">
                                    <div className="h-full bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl overflow-hidden shadow-neo-lg hover:-translate-y-2 hover:shadow-neo-xl transition-all duration-300 flex flex-col relative">
                                        {/* Accent Strip */}
                                        <div className={`h-2.5 ${category.accentColor}`} />

                                        <div className="p-7 flex flex-col flex-grow">
                                            {/* Icon + Emoji */}
                                            <div className="flex items-center gap-3 mb-5">
                                                <div className={`w-16 h-16 ${category.color} border-3 border-black/10 rounded-2xl flex items-center justify-center shadow-neo-sm group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300`}>
                                                    <Icon className="w-8 h-8 text-black" strokeWidth={2.5} />
                                                </div>
                                                <span className="text-3xl">{category.emoji}</span>
                                            </div>

                                            {/* Content */}
                                            <h2 className="text-2xl font-nunito font-black text-black dark:text-white mb-2 uppercase tracking-wide">
                                                {category.title}
                                            </h2>
                                            <p className="text-slate-600 dark:text-slate-400 mb-5 font-nunito font-bold leading-relaxed text-sm flex-grow">
                                                {category.description}
                                            </p>

                                            {/* Feature Tags */}
                                            <div className="flex flex-wrap gap-2 mb-6">
                                                {category.features.map((feature) => (
                                                    <span
                                                        key={feature}
                                                        className="px-3 py-1 bg-gray-50 dark:bg-slate-700 border-2 border-black/15 dark:border-white/10 rounded-lg text-xs font-nunito font-bold text-slate-700 dark:text-slate-300"
                                                    >
                                                        {feature}
                                                    </span>
                                                ))}
                                            </div>

                                            {/* CTA Button */}
                                            <motion.div
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                className={`inline-flex items-center justify-between px-5 py-3 border-3 border-black/10 ${category.color} text-black font-nunito font-extrabold uppercase tracking-wider text-sm rounded-xl shadow-neo-sm group-hover:shadow-neo-md transition-all`}
                                            >
                                                <span>Keşfet</span>
                                                <ChevronRight className="w-5 h-5 stroke-[3px] group-hover:translate-x-1 transition-transform" />
                                            </motion.div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Footer Message */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="text-center mt-24"
                >
                    <p className="font-nunito font-extrabold text-lg md:text-2xl text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                        Her alan için özel tasarlanmış <span className="text-cyber-pink">etkinliklerle</span> potansiyelini ortaya çıkar! 🚀
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default BilsemPage;
