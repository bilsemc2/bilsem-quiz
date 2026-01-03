import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ChevronLeft, Sparkles, Shield, Award, Users, Clock,
    CheckCircle, Star, Brain, TrendingUp, Zap
} from 'lucide-react';

const ServicesPage: React.FC = () => {
    const highlights = [
        {
            icon: Brain,
            title: "Bilimsel Yaklaşım",
            description: "Tüm içerikler MEB müfredatı ve BİLSEM sınav formatına uygun, uzman eğitimciler tarafından hazırlandı.",
            color: "from-purple-500 to-indigo-600"
        },
        {
            icon: TrendingUp,
            title: "Kanıtlanmış Başarı",
            description: "Platformumuzu kullanan öğrencilerin %87'si BİLSEM sınavlarında başarılı oldu.",
            color: "from-emerald-500 to-teal-600"
        },
        {
            icon: Shield,
            title: "Güvenli Ortam",
            description: "Çocuklar için tasarlanmış, reklamsız ve güvenli öğrenme platformu.",
            color: "from-blue-500 to-cyan-600"
        },
        {
            icon: Clock,
            title: "7/24 Erişim",
            description: "İstediğiniz zaman, istediğiniz cihazdan kesintisiz erişim imkanı.",
            color: "from-amber-500 to-orange-600"
        }
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
            role: "Veli, İstanbul"
        },
        {
            text: "Çocuğum oyun oynar gibi öğreniyor. Ekran başında geçirdiği süre artık verimli.",
            author: "Mehmet K.",
            role: "Veli, Ankara"
        },
        {
            text: "3 çocuğum da bu platformu kullanıyor. Her biri kendi seviyesinde ilerliyor.",
            author: "Fatma Y.",
            role: "Veli, İzmir"
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 pt-24 pb-12 px-6">
            <div className="container mx-auto max-w-5xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-indigo-400 font-bold hover:text-indigo-300 transition-colors mb-4 uppercase text-xs tracking-widest"
                    >
                        <ChevronLeft size={16} />
                        Ana Sayfa
                    </Link>
                    <h1 className="text-4xl lg:text-5xl font-black text-white mb-4">
                        Çocuğunuzun <span className="text-indigo-400">Geleceğine</span> Yatırım
                    </h1>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                        Türkiye'nin en kapsamlı BİLSEM hazırlık platformu ile çocuğunuzun potansiyelini keşfedin.
                    </p>
                </motion.div>

                {/* Trust Badge */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-wrap justify-center gap-6 mb-16"
                >
                    {[
                        { value: "35", label: "Argem Öğrencisi" },
                        { value: "82%", label: "Başarı Oranı" },
                        { value: "Bilsem", label: "Soru Tipleri" },
                        { value: "11 Yıl", label: "Deneyim" },
                    ].map((stat) => (
                        <div key={stat.label} className="text-center px-6">
                            <div className="text-3xl font-black text-white">{stat.value}</div>
                            <div className="text-slate-400 text-sm">{stat.label}</div>
                        </div>
                    ))}
                </motion.div>

                {/* Highlights */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                    {highlights.map((item, index) => (
                        <motion.div
                            key={item.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + index * 0.05 }}
                            className="bg-slate-800/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all"
                        >
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white mb-4`}>
                                <item.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                            <p className="text-slate-400">{item.description}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Features List */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-3xl p-8 mb-16"
                >
                    <h2 className="text-2xl font-bold text-white mb-6 text-center">
                        Neden BilsemC2?
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {features.map((feature) => (
                            <div key={feature} className="flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                                <span className="text-slate-300">{feature}</span>
                            </div>
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
                    <h2 className="text-2xl font-bold text-white mb-8 text-center">
                        Velilerimiz Ne Diyor?
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {testimonials.map((testimonial, index) => (
                            <div
                                key={index}
                                className="bg-slate-800/50 border border-white/5 rounded-2xl p-6"
                            >
                                <div className="flex gap-1 mb-4">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star key={star} className="w-4 h-4 text-amber-400 fill-amber-400" />
                                    ))}
                                </div>
                                <p className="text-slate-300 mb-4 italic">"{testimonial.text}"</p>
                                <div>
                                    <p className="text-white font-medium">{testimonial.author}</p>
                                    <p className="text-slate-500 text-sm">{testimonial.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-center"
                >
                    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-10 max-w-2xl mx-auto">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/30">
                            <Zap className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                            Ücretsiz Deneyin
                        </h2>
                        <p className="text-slate-400 mb-6">
                            Kredi kartı gerekmez. Hemen kayıt olun ve tüm özellikleri keşfedin.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link
                                to="/signup"
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all hover:scale-105"
                            >
                                <Sparkles className="w-5 h-5" />
                                Ücretsiz Başla
                            </Link>
                            <Link
                                to="/contact"
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-slate-700/50 border border-white/10 text-white font-bold rounded-xl hover:bg-slate-700 transition-all"
                            >
                                <Users className="w-5 h-5" />
                                Bize Ulaşın
                            </Link>
                        </div>
                    </div>
                </motion.div>

                {/* Trust Badges */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-12 flex flex-wrap justify-center gap-8 text-slate-500 text-sm"
                >
                    <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        <span>SSL Güvenli</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Award className="w-4 h-4" />
                        <span>MEB Uyumlu</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>Uzman Eğitimciler</span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default ServicesPage;
