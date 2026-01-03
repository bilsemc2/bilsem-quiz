import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, Palette, Music, ChevronRight, Sparkles } from 'lucide-react';

const categories = [
    {
        title: 'Bilsem Genel Yetenek',
        description: 'Mantık, uzamsal düşünme, problem çözme ve analitik düşünce becerileri',
        icon: Brain,
        path: '/atolyeler/genel-yetenek',
        color: 'from-blue-500 via-indigo-500 to-purple-600',
        bgGlow: 'bg-blue-500/20',
        features: ['Eksik Parça', 'Küp Açınımları', 'Simetri', 'Hafıza Oyunları'],
    },
    {
        title: 'Bilsem Resim',
        description: 'Görsel sanatlar, renk teorisi, perspektif ve yaratıcı tasarım',
        icon: Palette,
        path: '/atolyeler/resim',
        color: 'from-pink-500 via-rose-500 to-red-600',
        bgGlow: 'bg-pink-500/20',
        features: ['Şekil Tanıma', 'Renk Karışımı', 'Perspektif', 'Desen Tasarımı'],
    },
    {
        title: 'Bilsem Müzik',
        description: 'Ritim, melodi, nota okuma ve müzikal zeka geliştirme',
        icon: Music,
        path: '/atolyeler/muzik',
        color: 'from-purple-500 via-violet-500 to-indigo-600',
        bgGlow: 'bg-purple-500/20',
        features: ['Ritim Atölyesi', 'Nota Okuma', 'Melodi Eşleştirme', 'Enstrüman Tanıma'],
    },
];

const BilsemPage = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-3xl" />
            </div>

            <div className="relative container mx-auto px-6 py-16">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-20"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/80 text-sm mb-6">
                        <Sparkles className="w-4 h-4" />
                        Yeteneklerini Keşfet
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                        <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Bilsem
                        </span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                        Üç farklı alanda yeteneklerini test et ve geliştir
                    </p>
                </motion.div>

                {/* Category Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {categories.map((category, index) => {
                        const Icon = category.icon;
                        return (
                            <motion.div
                                key={category.title}
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.15, duration: 0.5 }}
                            >
                                <Link to={category.path} className="block h-full">
                                    <div className="group relative h-full">
                                        {/* Glow effect */}
                                        <div className={`absolute inset-0 ${category.bgGlow} rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                                        {/* Card */}
                                        <div className="relative h-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 
                                    hover:bg-white/10 hover:border-white/20 transition-all duration-500
                                    group-hover:scale-[1.02] group-hover:shadow-2xl">

                                            {/* Icon */}
                                            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${category.color} 
                                      flex items-center justify-center mb-6 shadow-lg
                                      group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}>
                                                <Icon className="w-10 h-10 text-white" />
                                            </div>

                                            {/* Content */}
                                            <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-transparent 
                                     group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/80 
                                     group-hover:bg-clip-text transition-all duration-300">
                                                {category.title}
                                            </h2>
                                            <p className="text-slate-400 mb-6 leading-relaxed">
                                                {category.description}
                                            </p>

                                            {/* Features */}
                                            <div className="flex flex-wrap gap-2 mb-8">
                                                {category.features.map((feature) => (
                                                    <span
                                                        key={feature}
                                                        className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-slate-300"
                                                    >
                                                        {feature}
                                                    </span>
                                                ))}
                                            </div>

                                            {/* CTA */}
                                            <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl 
                                      bg-gradient-to-r ${category.color} text-white font-medium
                                      group-hover:shadow-lg transition-all duration-300`}>
                                                Keşfet
                                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="text-center mt-20"
                >
                    <p className="text-slate-500">
                        Her alan için özel olarak tasarlanmış etkinliklerle potansiyelini ortaya çıkar! 🚀
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default BilsemPage;
