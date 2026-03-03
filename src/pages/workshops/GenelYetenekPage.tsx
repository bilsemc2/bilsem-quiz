import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Lightbulb, Brain, Target, Zap, Rocket, Tablet, ChevronRight, Trophy, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const GenelYetenekPage: React.FC = () => {
    const features = [
        { icon: <Brain strokeWidth={2.5} size={32} />, title: "Mantık ve Muhakeme", desc: "Karmaşık problemleri çözme yeteneğinizi geliştirin.", color: "bg-cyber-purple/10 border-cyber-purple/20 text-cyber-purple" },
        { icon: <Target strokeWidth={2.5} size={32} />, title: "Stratejik Düşünme", desc: "Oyunlar ve bulmacalarla strateji kurmayı öğrenin.", color: "bg-cyber-blue/10 border-cyber-blue/20 text-cyber-blue" },
        { icon: <Zap strokeWidth={2.5} size={32} />, title: "Hızlı Analiz", desc: "Verileri hızla işleme ve sonuç çıkarma becerisi kazanın.", color: "bg-cyber-gold/10 border-cyber-gold/20 text-cyber-gold" },
    ];

    const stages = [
        {
            stage: "1. Aşama",
            title: "Tablet Değerlendirme",
            highlight: "Ön Eleme",
            desc: "Bilsem sürecinin ilk adımı olan tablet uygulaması, öğrencilerin zihinsel yeteneklerini, görsel algılarını ve mantık yürütme hızlarını ölçer.",
            tags: ["Bilişsel Testler", "Görsel Hafıza", "Matematiksel Mantık", "Hızlı Düşünme"],
            link: "/atolyeler/tablet-degerlendirme",
            btnText: "Simülatöre Git",
            icon: <Tablet size={48} strokeWidth={2} />,
            colorClass: "bg-cyber-pink",
            accentColor: "cyber-pink"
        },
        {
            stage: "2. Aşama",
            title: "Bireysel Değerlendirme",
            highlight: "Zeka Ölçeği",
            desc: "İkinci aşamada uluslararası standartlardaki zeka testleri uygulanır. Sözsel, sayısal ve performans tabanlı yetenekler değerlendirilir.",
            tags: ["Bilsem Mülakat", "Bireysel Değerlendirme", "Zeka Ölçeği", "Performans Görevleri"],
            link: "/atolyeler/bireysel-degerlendirme",
            btnText: "Hazırlık Merkezi",
            icon: <Brain size={48} strokeWidth={2} />,
            colorClass: "bg-cyber-blue",
            accentColor: "cyber-blue"
        }
    ];

    const stats = [
        { value: "2.5k+", label: "Aktif Öğrenci" },
        { value: "50+", label: "Simülasyon" },
        { value: "4.9", label: "Kullanıcı Puanı" }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-800 pt-24 pb-16 px-6 relative overflow-hidden transition-colors duration-300">
            {/* Background pattern — dots */}
            <div className="fixed inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(0,0,0,0.15)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

            <Helmet>
                <title>BİLSEM Genel Yetenek Testi | Tablet ve Bireysel Değerlendirme Hazırlık</title>
                <meta name="description" content="BİLSEM genel yetenek sınavına hazırlık. Tablet değerlendirme simülatörü ve bireysel değerlendirme hazırlık merkezi. Mantık, uzamsal düşünme ve problem çözme becerileri." />
                <link rel="canonical" href="https://bilsemc2.com/atolyeler/genel-yetenek" />
            </Helmet>

            <div className="container mx-auto max-w-6xl relative z-10">
                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-8 mb-20"
                >
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-black dark:text-white font-nunito font-extrabold uppercase text-xs tracking-widest bg-white dark:bg-slate-800 border-3 border-black/10 rounded-xl px-4 py-2 shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-md transition-all mb-6"
                    >
                        <ChevronLeft size={14} strokeWidth={3} /> Ana Sayfa
                    </Link>

                    <div className="flex items-center justify-center gap-6">
                        <motion.div
                            animate={{ rotate: [0, -5, 5, 0] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="p-5 bg-cyber-gold/10 border-3 border-cyber-gold/30 rounded-2xl"
                        >
                            <Lightbulb size={56} className="text-cyber-gold" strokeWidth={2.5} />
                        </motion.div>
                    </div>

                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-nunito font-extrabold text-black dark:text-white leading-none uppercase tracking-tight">
                        Genel <span className="text-cyber-blue dark:text-cyber-pink">Yetenek</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed font-nunito font-bold">
                        Zekanı keşfetmeye hazır mısın? Mantık, analiz ve problem çözme becerilerini en üst seviyeye taşıyoruz.
                    </p>

                    {/* Stats */}
                    <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-8 pt-8">
                        {stats.map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3 + i * 0.1 }}
                                className="bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl p-6 shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-md transition-all"
                            >
                                <div className="text-4xl font-nunito font-extrabold text-black dark:text-white mb-1">{stat.value}</div>
                                <div className="text-[10px] font-nunito font-extrabold text-slate-400 uppercase tracking-widest">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
                    {features.map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 + i * 0.1 }}
                            className="bg-white dark:bg-slate-800 p-7 border-2 border-black/10 rounded-2xl shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-md transition-all duration-300 flex flex-col items-center text-center group"
                        >
                            <div className={`w-16 h-16 mb-5 flex items-center justify-center border-2 rounded-xl ${feature.color} group-hover:scale-110 transition-transform`}>
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-nunito font-extrabold text-black dark:text-white uppercase mb-3 tracking-tight">{feature.title}</h3>
                            <p className="text-slate-500 dark:text-slate-400 font-nunito font-bold text-sm leading-relaxed">{feature.desc}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Değerlendirme Aşamaları */}
                <div className="space-y-10">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-nunito font-extrabold text-black dark:text-white uppercase tracking-tight">
                            Değerlendirme{' '}
                            <span className="bg-cyber-pink text-white px-4 py-1 border-3 border-black/10 rounded-xl inline-block shadow-neo-sm">Aşamaları</span>
                        </h2>
                    </div>

                    {stages.map((stage, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl overflow-hidden shadow-neo-md hover:-translate-y-1 hover:shadow-neo-lg transition-all duration-300"
                        >
                            <div className={`h-2 ${stage.colorClass}`} />
                            <div className="p-6 sm:p-8 lg:p-10">
                                <div className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center text-center md:text-left gap-8 md:gap-10`}>
                                    {/* Icon */}
                                    <div className={`w-32 sm:w-40 aspect-square flex-shrink-0 flex items-center justify-center border-3 border-black/10 rounded-2xl ${stage.colorClass}/10`}>
                                        <div className="text-black dark:text-white transform hover:scale-110 transition-all">
                                            {stage.icon}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 space-y-4 flex flex-col items-center md:items-start">
                                        <span className="inline-block px-3 py-1.5 border-2 border-black/10 dark:border-white/10 font-nunito font-extrabold uppercase tracking-widest bg-gray-50 dark:bg-slate-700 text-black dark:text-white rounded-lg text-xs">
                                            {stage.stage}
                                        </span>

                                        <h3 className="text-2xl sm:text-3xl md:text-4xl font-nunito font-extrabold text-black dark:text-white uppercase tracking-tight leading-none">
                                            {stage.title}
                                        </h3>
                                        <div className={`text-lg font-nunito font-extrabold text-${stage.accentColor} uppercase`}>
                                            {stage.highlight}
                                        </div>

                                        <p className="text-base md:text-lg text-slate-600 dark:text-slate-300 font-nunito font-bold leading-relaxed">
                                            {stage.desc}
                                        </p>

                                        <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
                                            {stage.tags.map(tag => (
                                                <span key={tag} className="px-3 py-1.5 bg-gray-50 dark:bg-slate-700 border border-black/5 dark:border-white/5 font-nunito font-extrabold text-xs text-slate-600 dark:text-slate-300 rounded-lg">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="pt-4">
                                            <Link
                                                to={stage.link}
                                                className="inline-flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-nunito font-extrabold text-sm uppercase tracking-wider border-3 border-black/10 rounded-xl shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-md transition-all group"
                                            >
                                                {stage.btnText} <Rocket className="group-hover:translate-x-1 transition-transform" size={18} />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* CTA Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-20 bg-cyber-blue border-2 border-black/10 rounded-2xl overflow-hidden shadow-neo-lg relative"
                >
                    <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(0,0,0,0.15)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

                    <div className="relative z-10 p-8 sm:p-12 lg:p-16 text-center space-y-8">
                        <div className="inline-flex items-center gap-2 px-5 py-2 bg-white border-3 border-black/10 text-black font-nunito font-extrabold uppercase tracking-widest rounded-xl shadow-neo-sm text-sm">
                            <Trophy size={18} className="text-cyber-gold" strokeWidth={2.5} /> Hemen Başla
                        </div>

                        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-nunito font-extrabold text-white uppercase tracking-tight leading-none">
                            Beynini Antrenmana Al!
                        </h2>

                        <p className="text-xl text-white/80 font-nunito font-bold max-w-2xl mx-auto">
                            Binlerce özgün soru ve interaktif içerikle Bilsem sınavlarına en iyi şekilde hazırlan.
                        </p>

                        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                            <Link
                                to="/atolyeler/tablet-degerlendirme"
                                className="px-6 py-4 bg-white text-black font-nunito font-extrabold text-lg uppercase tracking-wider border-3 border-black/10 rounded-xl shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-md transition-all flex items-center justify-center gap-2"
                            >
                                1. Aşama Simülatörü <ChevronRight strokeWidth={3} size={20} />
                            </Link>
                            <Link
                                to="/atolyeler/bireysel-degerlendirme"
                                className="px-6 py-4 bg-black text-white font-nunito font-extrabold text-lg uppercase tracking-wider border-3 border-black/10 rounded-xl shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-md transition-all flex items-center justify-center gap-2"
                            >
                                2. Aşama Hazırlık <ChevronRight strokeWidth={3} size={20} />
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default GenelYetenekPage;
