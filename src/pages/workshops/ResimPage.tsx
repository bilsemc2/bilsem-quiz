import React from 'react';
import { motion } from 'framer-motion';
import { Palette, Eye, Layout, PenTool, Rocket, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import './resim/resim.css';

const ResimPage: React.FC = () => {
    const steps = [
        { icon: <Eye />, title: "Görsel Algı", desc: "Detayları fark etme ve görsel hafızayı güçlendirme." },
        { icon: <Layout />, title: "Kompozisyon", desc: "Dengeli ve etkileyici sahneler kurgulama yeteneği." },
        { icon: <PenTool />, title: "Yaratıcı Çizim", desc: "Hayal gücünü kağıda dökme ve özgünlük geliştirme." },
    ];

    return (
        <div className="resim-workshop-container pt-24 pb-12 px-6">
            {/* Background Blobs */}
            <div className="resim-bg-blobs">
                <div className="resim-blob resim-blob-1" />
                <div className="resim-blob resim-blob-2" />
                <div className="resim-blob resim-blob-3" />
            </div>

            <div className="container mx-auto max-w-6xl relative z-10">
                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-8 mb-20"
                >
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-pink-400 font-bold hover:text-pink-300 transition-colors mb-4 uppercase text-xs tracking-widest"
                    >
                        <ChevronLeft size={16} />
                        Ana Sayfa
                    </Link>

                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        className="inline-block p-6 bg-gradient-to-br from-pink-500 to-purple-600 rounded-[2.5rem] text-white shadow-2xl shadow-pink-500/20"
                    >
                        <Palette size={56} />
                    </motion.div>

                    <h1 className="text-6xl lg:text-8xl font-poppins font-black text-white tracking-tight">
                        Resim <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">Atölyesi</span>
                    </h1>

                    <p className="text-xl lg:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-medium">
                        Sanatsal yaratıcılığını keşfet! Görsel zekanı geliştirerek dünyayı farklı bir bakış açısıyla görmeye başla.
                    </p>
                </motion.div>

                {/* Feature Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
                    {steps.map((step, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            whileHover={{ y: -10 }}
                            className="bg-white/5 backdrop-blur-xl p-10 rounded-[3.5rem] border border-white/10 shadow-2xl hover:border-pink-500/30 transition-all duration-500 group"
                        >
                            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 text-white rounded-2xl flex items-center justify-center mb-8 text-3xl shadow-lg shadow-pink-500/20 group-hover:scale-110 transition-transform">
                                {step.icon}
                            </div>
                            <h3 className="text-2xl font-black mb-4 text-white">{step.title}</h3>
                            <p className="text-slate-400 font-medium leading-relaxed">{step.desc}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Call to Action Section */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="p-[1px] rounded-[4rem] bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 shadow-2xl overflow-hidden"
                >
                    <div className="bg-slate-900/90 backdrop-blur-3xl rounded-[3.9rem] p-12 lg:p-24 text-center relative">
                        {/* Decorative Circles */}
                        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>

                        <div className="relative z-10 space-y-10">
                            <h2 className="text-4xl lg:text-6xl font-black text-white tracking-tight leading-tight">
                                Sanat Yolculuğuna <br className="hidden md:block" />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500">Hemen Başla</span>
                            </h2>

                            <p className="text-slate-400 text-lg max-w-2xl mx-auto font-medium">
                                Hayal gücünü gerçeğe dönüştürmek için ihtiyacın olan her şey burada.
                                Uzman eğitmenlerimizle sanatsal gelişimini destekliyoruz.
                            </p>

                            <Link
                                to="/contact"
                                className="group relative inline-flex items-center justify-center gap-4 px-16 py-6 bg-gradient-to-r from-pink-600 to-purple-700 text-white font-black text-2xl rounded-full hover:shadow-2xl hover:shadow-pink-500/40 transition-all duration-300 transform hover:-translate-y-1 active:scale-95 overflow-hidden"
                            >
                                <span className="relative flex items-center gap-3">
                                    Bize Ulaşın <Rocket className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                </span>
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default ResimPage;
