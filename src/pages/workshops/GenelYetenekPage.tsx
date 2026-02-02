import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Lightbulb, Brain, Target, Zap, Rocket, Tablet, ChevronRight, Trophy, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const GenelYetenekPage: React.FC = () => {
    const features = [
        { icon: <Brain />, title: "Mantık ve Muhakeme", desc: "Karmaşık problemleri çözme yeteneğinizi geliştirin.", color: "purple" },
        { icon: <Target />, title: "Stratejik Düşünme", desc: "Oyunlar ve bulmacalarla strateji kurmayı öğrenin.", color: "blue" },
        { icon: <Zap />, title: "Hızlı Analiz", desc: "Verileri hızla işleme ve sonuç çıkarma becerisi kazanın.", color: "amber" },
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
            icon: <Tablet size={48} />,
            color: "purple"
        },
        {
            stage: "2. Aşama",
            title: "Bireysel Değerlendirme",
            highlight: "Zeka Ölçeği",
            desc: "İkinci aşamada uluslararası standartlardaki zeka testleri uygulanır. Sözsel, sayısal ve performans tabanlı yetenekler değerlendirilir.",
            tags: ["Bilsem Mülakat", "Bireysel Değerlendirme", "Zeka Ölçeği", "Performans Görevleri"],
            link: "/atolyeler/bireysel-degerlendirme",
            btnText: "Hazırlık Merkezi",
            icon: <Brain size={48} />,
            color: "indigo"
        }
    ];

    const stats = [
        { value: "2.5k+", label: "Aktif Öğrenci" },
        { value: "Gelecekte 50+", label: "Simülasyon" },
        { value: "4.9", label: "Kullanıcı Puanı" }
    ];

    return (
        <div className="min-h-screen bg-slate-950 pt-24 pb-16 px-6 overflow-hidden relative">
            {/* SEO Meta Tags */}
            <Helmet>
                <title>BİLSEM Genel Yetenek Testi | Tablet ve Bireysel Değerlendirme Hazırlık</title>
                <meta name="description" content="BİLSEM genel yetenek sınavına hazırlık. Tablet değerlendirme simülatörü ve bireysel değerlendirme hazırlık merkezi. Mantık, uzamsal düşünme ve problem çözme becerileri." />
                <meta name="keywords" content="BİLSEM genel yetenek, tablet değerlendirme, bireysel değerlendirme, zeka testi, mantık testi, uzamsal düşünme" />
                <link rel="canonical" href="https://bilsemc2.com/atolyeler/genel-yetenek" />

                {/* Open Graph */}
                <meta property="og:type" content="website" />
                <meta property="og:title" content="BİLSEM Genel Yetenek Testi | Hazırlık Merkezi" />
                <meta property="og:description" content="Tablet ve bireysel değerlendirme simülatörleri ile BİLSEM sınavına hazırlan." />
                <meta property="og:url" content="https://bilsemc2.com/atolyeler/genel-yetenek" />
                <meta property="og:image" content="https://bilsemc2.com/og-genel-yetenek.jpg" />

                {/* Twitter Card */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="BİLSEM Genel Yetenek | Hazırlık" />
                <meta name="twitter:description" content="Tablet ve bireysel değerlendirme hazırlık merkezi" />

                {/* Structured Data */}
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "EducationalOccupationalProgram",
                        "name": "BİLSEM Genel Yetenek Hazırlık",
                        "description": "BİLSEM genel yetenek sınavına hazırlık programı - Tablet ve bireysel değerlendirme simülatörleri",
                        "provider": {
                            "@type": "Organization",
                            "name": "BİLSEM C2",
                            "url": "https://bilsemc2.com"
                        },
                        "educationalProgramMode": "online",
                        "occupationalCategory": "Eğitim / Zeka Geliştirme"
                    })}
                </script>
            </Helmet>
            {/* Arka Plan Efektleri */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/15 rounded-full blur-[150px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] bg-indigo-600/10 rounded-full blur-[100px]" />
            </div>

            <div className="container mx-auto max-w-6xl relative z-10">
                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-8 mb-20"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-sm font-bold uppercase tracking-widest">
                        <Sparkles size={16} /> Premium Atölye
                    </div>

                    <div className="flex items-center justify-center gap-6">
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 4 }}
                            className="p-6 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-3xl border border-purple-500/30 backdrop-blur-xl"
                        >
                            <Lightbulb size={48} className="text-purple-400" />
                        </motion.div>
                    </div>

                    <h1 className="text-5xl lg:text-7xl font-black text-white leading-tight">
                        Bilsem <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400">Genel Yetenek</span>
                    </h1>

                    <p className="text-xl lg:text-2xl text-slate-400 max-w-3xl mx-auto leading-relaxed font-medium">
                        Zekanı keşfetmeye hazır mısın? Mantık, analiz ve problem çözme becerilerini en üst seviyeye taşıyoruz.
                    </p>

                    {/* Stats */}
                    <div className="flex items-center justify-center gap-12 pt-8">
                        {stats.map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + i * 0.1 }}
                                className="text-center"
                            >
                                <div className="text-3xl font-black text-white">{stat.value}</div>
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
                    {features.map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 + i * 0.1 }}
                            className="group bg-slate-900/50 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-800/50 hover:border-purple-500/30 transition-all duration-500 relative overflow-hidden"
                        >
                            <div className={`absolute top-0 right-0 w-24 h-24 bg-${feature.color}-500/10 rounded-full blur-2xl group-hover:bg-${feature.color}-500/20 transition-colors`} />

                            <div className="relative z-10 space-y-4">
                                <div className={`w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-${feature.color}-400 text-2xl group-hover:bg-${feature.color}-500 group-hover:text-white transition-all duration-500`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-black text-white">{feature.title}</h3>
                                <p className="text-slate-500 font-medium leading-relaxed">{feature.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Değerlendirme Aşamaları */}
                <div className="space-y-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl lg:text-4xl font-black text-white mb-4">
                            Değerlendirme <span className="text-purple-400">Aşamaları</span>
                        </h2>
                        <p className="text-slate-500 font-medium max-w-2xl mx-auto">
                            Bilsem sınavı iki aşamadan oluşur. Her aşama için özel hazırlık simülatörlerimiz mevcut.
                        </p>
                    </div>

                    {stages.map((stage, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className={`bg-slate-900/40 backdrop-blur-xl rounded-[3rem] p-10 border border-slate-800/50 hover:border-${stage.color}-500/30 transition-all duration-500 relative overflow-hidden group`}
                        >
                            {/* Glow Effect */}
                            <div className={`absolute top-0 ${i % 2 === 0 ? 'right-0' : 'left-0'} w-64 h-64 bg-${stage.color}-500/10 rounded-full blur-[100px] group-hover:bg-${stage.color}-500/20 transition-colors`} />

                            <div className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-10 relative z-10`}>
                                {/* Icon Section */}
                                <div className={`w-full md:w-1/4 aspect-square bg-gradient-to-br from-${stage.color}-500/20 to-${stage.color}-600/10 rounded-[2rem] flex items-center justify-center text-${stage.color}-400 border border-${stage.color}-500/20 group-hover:scale-105 transition-transform duration-500`}>
                                    <motion.div
                                        animate={{ y: [0, -8, 0] }}
                                        transition={{ repeat: Infinity, duration: 3 }}
                                    >
                                        {stage.icon}
                                    </motion.div>
                                </div>

                                {/* Content Section */}
                                <div className="flex-1 space-y-6">
                                    <div className={`inline-block px-4 py-1.5 bg-${stage.color}-500/10 text-${stage.color}-400 rounded-full font-bold text-xs uppercase tracking-widest border border-${stage.color}-500/20`}>
                                        {stage.stage}
                                    </div>

                                    <h3 className="text-3xl lg:text-4xl font-black text-white leading-tight">
                                        {stage.title} <span className={`text-${stage.color}-400`}>({stage.highlight})</span>
                                    </h3>

                                    <p className="text-lg text-slate-400 font-medium leading-relaxed">
                                        {stage.desc}
                                    </p>

                                    <div className="flex flex-wrap gap-6 pt-2">
                                        <Link
                                            to={stage.link}
                                            className={`px-8 py-3 bg-${stage.color}-500 text-white font-black rounded-2xl hover:bg-${stage.color}-400 transition-all flex items-center gap-2 group/btn shadow-[0_0_30px_rgba(147,51,234,0.3)]`}
                                        >
                                            {stage.btnText} <Rocket size={18} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                                        </Link>

                                        <div className="flex-1 grid grid-cols-2 gap-3">
                                            {stage.tags.map(tag => (
                                                <div key={tag} className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                                                    <div className={`w-2 h-2 bg-${stage.color}-500 rounded-full`} /> {tag}
                                                </div>
                                            ))}
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
                    className="mt-24 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-[3rem] p-12 lg:p-16 text-white relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-10" />
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/3" />

                    <div className="relative z-10 text-center space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-white/80 text-sm font-bold uppercase tracking-widest border border-white/20">
                            <Trophy size={16} /> Hemen Başla
                        </div>

                        <h2 className="text-4xl lg:text-5xl font-black">
                            Beynini Antrenmana Al!
                        </h2>

                        <p className="text-xl text-white/80 max-w-2xl mx-auto">
                            Binlerce özgün soru ve interaktif içerikle Bilsem sınavlarına en iyi şekilde hazırlan.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                            <Link
                                to="/atolyeler/tablet-degerlendirme"
                                className="px-10 py-4 bg-white text-purple-600 font-black text-lg rounded-2xl hover:bg-white/90 transition-all flex items-center gap-3 shadow-2xl"
                            >
                                1. Aşama Simülatörü <ChevronRight size={20} />
                            </Link>
                            <Link
                                to="/atolyeler/bireysel-degerlendirme"
                                className="px-10 py-4 bg-white/10 text-white font-black text-lg rounded-2xl hover:bg-white/20 transition-all flex items-center gap-3 border border-white/20 backdrop-blur-xl"
                            >
                                2. Aşama Hazırlık <ChevronRight size={20} />
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Global Glow Style */}
            <style>{`
                .text-glow {
                    text-shadow: 0 0 20px rgba(168, 85, 247, 0.4);
                }
            `}</style>
        </div>
    );
};

export default GenelYetenekPage;
