import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Brain, Target, Zap, Rocket, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

const GenelYetenekPage: React.FC = () => {
    const features = [
        { icon: <Brain />, title: "Mantık ve Muhakeme", desc: "Karmaşık problemleri çözme yeteneğinizi geliştirin." },
        { icon: <Target />, title: "Stratejik Düşünme", desc: "Oyunlar ve bulmacalarla strateji kurmayı öğrenin." },
        { icon: <Zap />, title: "Hızlı Analiz", desc: "Verileri hızla işleme ve sonuç çıkarma becerisi kazanın." },
    ];

    return (
        <div className="min-h-screen bg-[#F8F6FF] pt-24 pb-12 px-6">
            <div className="container mx-auto max-w-6xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-8"
                >
                    <div className="inline-block p-4 bg-purple-100 rounded-3xl text-purple-brand">
                        <Lightbulb size={48} />
                    </div>
                    <h1 className="text-5xl lg:text-7xl font-poppins font-black text-gray-900">
                        Bilsem <span className="text-purple-brand">Genel Yetenek</span>
                    </h1>
                    <p className="text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-medium">
                        Zekanı keşfetmeye hazır mısın? Genel yetenek atölyemizde mantık, analiz ve problem çözme becerilerini en üst seviyeye taşıyoruz.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
                    {features.map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.2 }}
                            className="bg-white p-10 rounded-[3rem] shadow-xl hover:shadow-2xl transition-all border-4 border-transparent hover:border-purple-brand/20"
                        >
                            <div className="w-16 h-16 bg-purple-brand text-white rounded-2xl flex items-center justify-center mb-6 text-3xl">
                                {feature.icon}
                            </div>
                            <h3 className="text-2xl font-black mb-4">{feature.title}</h3>
                            <p className="text-gray-600 font-medium leading-relaxed">{feature.desc}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Değerlendirme Aşamaları */}
                <div className="mt-32 space-y-16">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="bg-white rounded-[4rem] p-12 shadow-2xl border border-white flex flex-col md:flex-row items-center gap-12 group"
                    >
                        <div className="w-full md:w-1/3 aspect-square bg-purple-50 rounded-[3rem] flex items-center justify-center text-purple-brand group-hover:scale-105 transition-transform duration-500">
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ repeat: Infinity, duration: 4 }}
                            >
                                <Zap size={120} className="drop-shadow-2xl" />
                            </motion.div>
                        </div>
                        <div className="flex-1 space-y-6">
                            <div className="inline-block px-4 py-1 bg-purple-100 text-purple-700 rounded-full font-bold text-sm uppercase tracking-wider">
                                1. Aşama
                            </div>
                            <h2 className="text-4xl font-black text-gray-900 leading-tight">Ön Değerlendirme <span className="text-purple-brand">(Tablet Uygulaması)</span></h2>
                            <p className="text-lg text-gray-600 font-medium leading-relaxed">
                                Bilsem sürecinin ilk adımı olan tablet uygulaması, öğrencilerin zindi yeteneklerini, görsel algılarını ve mantık yürütme hızlarını ölçer. Atölyemizde binlerce benzer soru tipiyle bu sürece en iyi şekilde hazırlanıyoruz.
                            </p>
                            <div className="flex flex-wrap gap-4 pt-4">
                                <Link
                                    to="/atolyeler/tablet-degerlendirme"
                                    className="px-8 py-3 bg-purple-brand text-white font-black rounded-2xl shadow-lg hover:scale-105 transition-all flex items-center gap-2 group"
                                >
                                    Sınav Simülatörü <Play size={18} fill="currentColor" className="group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <div className="flex-1 grid grid-cols-2 gap-4">
                                    {["Bilişsel Testler", "Görsel Hafıza", "Matematiksel Mantık", "Hızlı Düşünme"].map(tag => (
                                        <div key={tag} className="flex items-center gap-2 text-gray-500 font-bold">
                                            <div className="w-2 h-2 bg-purple-brand rounded-full" /> {tag}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="bg-gray-900 rounded-[4rem] p-12 shadow-2xl border border-gray-800 flex flex-col md:flex-row-reverse items-center gap-12 group text-white"
                    >
                        <div className="w-full md:w-1/3 aspect-square bg-white/10 rounded-[3rem] flex items-center justify-center text-white group-hover:scale-105 transition-transform duration-500 backdrop-blur-3xl">
                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ repeat: Infinity, duration: 5 }}
                            >
                                <Brain size={120} className="drop-shadow-2xl" />
                            </motion.div>
                        </div>
                        <div className="flex-1 space-y-6">
                            <div className="inline-block px-4 py-1 bg-white/10 text-white/80 rounded-full font-bold text-sm uppercase tracking-wider">
                                2. Aşama
                            </div>
                            <h2 className="text-4xl font-black text-gray-900 leading-tight">Bireysel Değerlendirme <span className="text-purple-brand">(Zeka Ölçeği)</span></h2>
                            <p className="text-lg text-gray-600 font-medium leading-relaxed">
                                İkinci aşama olan bireysel değerlendirmede uluslararası standartlardaki zeka testleri uygulanır. Öğrencilerimizin sözsel, sayısal ve performans tabanlı yeteneklerini parlatıyor, mülakat heyecanını yenmelerini sağlıyoruz.
                            </p>
                            <div className="flex flex-wrap gap-4 pt-4">
                                <Link
                                    to="/atolyeler/bireysel-degerlendirme"
                                    className="px-8 py-3 bg-white/10 text-white font-black rounded-2xl shadow-lg hover:bg-white/20 border border-white/20 transition-all flex items-center gap-2 group backdrop-blur-xl"
                                >
                                    Hazırlık Merkezi <Rocket size={18} fill="currentColor" className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                </Link>
                                <div className="flex-1 grid grid-cols-2 gap-4">
                                    {["WISC-R Hazırlık", "ASIS Analizi", "Sözsel Yetenek", "Performans Görevleri"].map(tag => (
                                        <div key={tag} className="flex items-center gap-2 text-white/60 font-bold">
                                            <div className="w-2 h-2 bg-purple-400 rounded-full" /> {tag}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-20 bg-purple-brand rounded-[4rem] p-12 lg:p-20 text-white relative overflow-hidden text-center"
                >
                    <div className="relative z-10 space-y-8">
                        <h2 className="text-4xl lg:text-5xl font-black">Hemen Antremanlara Başla!</h2>
                        <p className="text-xl opacity-90 max-w-2xl mx-auto">Binlerce özgün soru ve interaktif içerikle Bilsem sınavlarına en iyi şekilde hazırlan.</p>
                        <Link
                            to="/beyin-antrenoru-merkezi"
                            className="inline-flex items-center gap-3 px-12 py-5 bg-white text-purple-brand font-black text-xl rounded-full hover:bg-gray-100 transition-all transform hover:scale-105"
                        >
                            Beyin Antrenörü'ne Git <Rocket />
                        </Link>
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                </motion.div>
            </div>
        </div>
    );
};

export default GenelYetenekPage;
