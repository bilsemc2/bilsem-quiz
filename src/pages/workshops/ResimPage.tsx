import React from 'react';
import { motion } from 'framer-motion';
import { Palette, Eye, Layout, PenTool, Rocket } from 'lucide-react';
import { Link } from 'react-router-dom';

const ResimPage: React.FC = () => {
    const steps = [
        { icon: <Eye />, title: "Görsel Algı", desc: "Detayları fark etme ve görsel hafızayı güçlendirme." },
        { icon: <Layout />, title: "Kompozisyon", desc: "Dengeli ve etkileyici sahneler kurgulama yeteneği." },
        { icon: <PenTool />, title: "Yaratıcı Çizim", desc: "Hayal gücünü kağıda dökme ve özgünlük geliştirme." },
    ];

    return (
        <div className="min-h-screen bg-[#FFF5F8] pt-24 pb-12 px-6">
            <div className="container mx-auto max-w-6xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-8"
                >
                    <div className="inline-block p-4 bg-pink-100 rounded-3xl text-pink-500">
                        <Palette size={48} />
                    </div>
                    <h1 className="text-5xl lg:text-7xl font-poppins font-black text-gray-900">
                        Bilsem <span className="text-pink-500">Resim</span>Atölyesi
                    </h1>
                    <p className="text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-medium">
                        Sanatsal yaratıcılığını keşfet! Görsel zekanı geliştirerek dünyayı farklı bir bakış açısıyla görmeye başla.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
                    {steps.map((step, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.2 }}
                            className="bg-white p-10 rounded-[3rem] shadow-xl hover:shadow-2xl transition-all border-4 border-transparent hover:border-pink-200"
                        >
                            <div className="w-16 h-16 bg-pink-500 text-white rounded-2xl flex items-center justify-center mb-6 text-3xl">
                                {step.icon}
                            </div>
                            <h3 className="text-2xl font-black mb-4">{step.title}</h3>
                            <p className="text-gray-600 font-medium leading-relaxed">{step.desc}</p>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="mt-20 bg-pink-500 rounded-[4rem] p-12 lg:p-20 text-white text-center shadow-2xl"
                >
                    <h2 className="text-4xl lg:text-5xl font-black mb-8">Sanat Yolculuğuna Başla</h2>
                    <Link
                        to="/contact"
                        className="inline-flex items-center gap-3 px-12 py-5 bg-white text-pink-500 font-black text-xl rounded-full hover:bg-gray-100 transition-all"
                    >
                        Bize Ulaşın <Rocket />
                    </Link>
                </motion.div>
            </div>
        </div>
    );
};

export default ResimPage;
