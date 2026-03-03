import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ChevronLeft, Sparkles, Shield, Award, Users, Clock,
    CheckCircle, Star, Brain, TrendingUp, Zap
} from 'lucide-react';

// ═══════════════════════════════════════════════
// 🎯 ServicesPage — Kid-UI Çocuk Dostu Tasarım
// ═══════════════════════════════════════════════

const highlights = [
    {
        icon: Brain,
        title: "Bilimsel Yaklaşım",
        description: "Tüm içerikler MEB müfredatı ve BİLSEM sınav formatına uygun, uzman eğitimciler tarafından hazırlandı.",
        color: "bg-cyber-blue",
        emoji: "🔬",
    },
    {
        icon: TrendingUp,
        title: "Kanıtlanmış Başarı",
        description: "Platformumuzu kullanan öğrencilerin %87'si BİLSEM sınavlarında başarılı oldu.",
        color: "bg-cyber-emerald",
        emoji: "📈",
    },
    {
        icon: Shield,
        title: "Güvenli Ortam",
        description: "Çocuklar için tasarlanmış, reklamsız ve güvenli öğrenme platformu.",
        color: "bg-cyber-pink",
        emoji: "🛡️",
    },
    {
        icon: Clock,
        title: "7/24 Erişim",
        description: "İstediğiniz zaman, istediğiniz cihazdan kesintisiz erişim imkanı.",
        color: "bg-cyber-gold",
        emoji: "⏰",
    },
];

const features = [
    "Farklı soru tipleri ve kurallar",
    "Gerçek sınav formatına uygun sorular",
    "Seviye ve XP sistemi ile motivasyon",
    "Tablet ve telefon uyumlu tasarım",
    "Öğretmen onaylı içerikler",
];

const testimonials = [
    {
        text: "Oğlum bu platformla çalışarak BİLSEM sınavını kazandı. Sorular gerçek sınava çok benziyor.",
        author: "Ayşe H.",
        role: "Veli, İstanbul",
    },
    {
        text: "Çocuğum oyun oynar gibi öğreniyor. Ekran başında geçirdiği süre artık verimli.",
        author: "Mehmet K.",
        role: "Veli, Ankara",
    },
    {
        text: "3 çocuğum da bu platformu kullanıyor. Her biri kendi seviyesinde ilerliyor.",
        author: "Fatma Y.",
        role: "Veli, İzmir",
    },
];

const stats = [
    { value: "35", label: "Argem Öğrencisi", color: "bg-cyber-gold" },
    { value: "82%", label: "Başarı Oranı", color: "bg-cyber-emerald" },
    { value: "Bilsem", label: "Soru Tipleri", color: "bg-cyber-blue" },
    { value: "11 Yıl", label: "Deneyim", color: "bg-cyber-pink" },
];

const ServicesPage: React.FC = () => {
    return (
        <div className="min-h-screen overflow-hidden transition-colors duration-300">
            {/* Background pattern — dots */}
            <div className="fixed inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(0,0,0,0.15)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

            <div className="container mx-auto max-w-6xl relative z-10 pt-24 pb-12 px-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-14"
                >
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-black dark:text-white font-nunito font-extrabold uppercase text-xs tracking-widest bg-white dark:bg-slate-800 border-3 border-black/10 rounded-xl px-4 py-2 shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-md transition-all mb-8"
                    >
                        <ChevronLeft size={14} strokeWidth={3} />
                        Ana Sayfa
                    </Link>
                    <h1 className="text-4xl lg:text-6xl font-nunito font-black text-black dark:text-white mb-5 uppercase tracking-tight leading-tight">
                        Çocuğunuzun{' '}
                        <span className="inline-block bg-cyber-gold text-black px-3 py-1 border-3 border-black/10 rounded-xl shadow-neo-sm -rotate-1">
                            Geleceğine
                        </span>{' '}
                        Yatırım
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 text-lg font-nunito font-bold max-w-2xl mx-auto">
                        Türkiye'nin en kapsamlı BİLSEM hazırlık platformu ile çocuğunuzun potansiyelini keşfedin.
                    </p>
                </motion.div>

                {/* Trust Stats */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-wrap justify-center gap-4 mb-16"
                >
                    {stats.map((stat) => (
                        <motion.div
                            key={stat.label}
                            whileHover={{ y: -3, scale: 1.03 }}
                            className={`text-center px-8 py-5 ${stat.color} border-3 border-black/10 rounded-2xl shadow-neo-sm hover:shadow-neo-md transition-all`}
                        >
                            <div className="text-3xl font-nunito font-black text-black mb-1">{stat.value}</div>
                            <div className="text-black font-nunito font-extrabold uppercase tracking-wider text-xs">{stat.label}</div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Highlights */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-16">
                    {highlights.map((item, index) => (
                        <motion.div
                            key={item.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + index * 0.05 }}
                            className="bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl overflow-hidden shadow-neo-md hover:-translate-y-1 hover:shadow-neo-lg transition-all group"
                        >
                            <div className={`h-2 ${item.color}`} />
                            <div className="p-7">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`w-13 h-13 ${item.color}/10 border-2 border-current/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                        <span className="text-2xl">{item.emoji}</span>
                                    </div>
                                    <h3 className="text-xl font-nunito font-extrabold text-black dark:text-white uppercase tracking-wide">{item.title}</h3>
                                </div>
                                <p className="text-slate-600 dark:text-slate-400 font-nunito font-bold text-sm leading-relaxed">{item.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Features — Neden BilsemC2 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-cyber-emerald border-2 border-black/10 rounded-2xl p-8 md:p-10 mb-16 shadow-neo-lg"
                >
                    <h2 className="text-2xl lg:text-3xl font-nunito font-black text-black mb-6 text-center uppercase tracking-wide">
                        Neden BilsemC2? 🤔
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {features.map((feature) => (
                            <motion.div
                                key={feature}
                                whileHover={{ y: -2 }}
                                className="flex items-center gap-3 bg-white border-3 border-black/10 rounded-xl p-4 shadow-neo-sm hover:shadow-neo-md transition-all"
                            >
                                <CheckCircle className="w-6 h-6 text-cyber-pink flex-shrink-0" strokeWidth={2.5} />
                                <span className="text-black font-nunito font-extrabold uppercase text-xs tracking-wide">{feature}</span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Testimonials */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mb-16"
                >
                    <h2 className="text-2xl lg:text-3xl font-nunito font-black text-black dark:text-white mb-8 text-center uppercase tracking-wide">
                        Velilerimiz Ne Diyor? 💬
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {testimonials.map((testimonial, index) => (
                            <motion.div
                                key={index}
                                whileHover={{ y: -4 }}
                                className="bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl overflow-hidden shadow-neo-md hover:shadow-neo-lg transition-all flex flex-col"
                            >
                                <div className="h-2 bg-cyber-gold" />
                                <div className="p-6 flex flex-col flex-grow">
                                    <div className="flex gap-1 mb-4">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star key={star} className="w-4 h-4 text-cyber-gold fill-cyber-gold" />
                                        ))}
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-400 font-nunito font-bold text-sm mb-6 italic flex-1">"{testimonial.text}"</p>
                                    <div className="pt-4 border-t-2 border-dashed border-black/10 dark:border-white/10">
                                        <p className="text-black dark:text-white font-nunito font-extrabold uppercase tracking-tight">{testimonial.author}</p>
                                        <p className="text-slate-500 dark:text-slate-400 font-nunito font-bold text-xs">{testimonial.role}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl overflow-hidden shadow-neo-lg max-w-4xl mx-auto"
                >
                    <div className="h-2.5 bg-cyber-blue" />
                    <div className="p-8 md:p-12 text-center">
                        <div className="w-16 h-16 bg-cyber-pink border-3 border-black/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-neo-sm">
                            <Zap className="w-8 h-8 text-white" fill="currentColor" />
                        </div>
                        <h2 className="text-3xl lg:text-4xl font-nunito font-black text-black dark:text-white uppercase mb-3 tracking-tight">
                            Ücretsiz Deneyin 🚀
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 font-nunito font-bold mb-8 max-w-lg mx-auto">
                            Kredi kartı gerekmez. Hemen kayıt olun ve tüm özellikleri keşfedin.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link to="/signup">
                                <motion.div
                                    whileHover={{ scale: 1.03, y: -2 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-cyber-gold text-black font-nunito font-extrabold uppercase tracking-wider border-3 border-black/10 rounded-xl shadow-neo-sm hover:shadow-neo-md transition-all"
                                >
                                    <Sparkles className="w-5 h-5" />
                                    Ücretsiz Başla
                                </motion.div>
                            </Link>
                            <Link to="/contact">
                                <motion.div
                                    whileHover={{ scale: 1.03, y: -2 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white dark:bg-slate-700 text-black dark:text-white font-nunito font-extrabold uppercase tracking-wider border-3 border-black/10 rounded-xl shadow-neo-sm hover:shadow-neo-md transition-all"
                                >
                                    <Users className="w-5 h-5" />
                                    Bize Ulaşın
                                </motion.div>
                            </Link>
                        </div>
                    </div>
                </motion.div>

                {/* Trust Badges */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-12 flex flex-wrap justify-center gap-4"
                >
                    {[
                        { icon: Shield, label: 'SSL Güvenli', color: 'text-cyber-pink' },
                        { icon: Award, label: 'MEB Uyumlu', color: 'text-cyber-emerald' },
                        { icon: Users, label: 'Uzman Eğitimciler', color: 'text-cyber-blue' },
                    ].map((badge) => (
                        <div key={badge.label} className="flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-slate-800/50 rounded-xl border-2 border-black/10 dark:border-white/10 font-nunito font-extrabold uppercase text-xs tracking-wider text-slate-500 dark:text-slate-400">
                            <badge.icon className={`w-4 h-4 ${badge.color}`} />
                            <span>{badge.label}</span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
};

export default ServicesPage;
