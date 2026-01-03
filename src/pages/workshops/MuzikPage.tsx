import React from 'react';
import { motion } from 'framer-motion';
import { Music, Radio, Mic2, Volume2, Rocket } from 'lucide-react';
import { Link } from 'react-router-dom';

const MuzikPage: React.FC = () => {
    const items = [
        { icon: <Radio />, title: "Ritim Algısı", desc: "Zamanlama ve tempoyu mükemmel şekilde hissetme." },
        { icon: <Mic2 />, title: "Ses Eğitimi", desc: "Doğru tonları duyma ve ses kontrolü geliştirme." },
        { icon: <Volume2 />, title: "Müzikal Kulak", desc: "Melodileri ve akorları anında tanıma becerisi." },
    ];

    return (
        <div className="min-h-screen bg-[#F0F7FF] pt-24 pb-12 px-6">
            <div className="container mx-auto max-w-6xl">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-8"
                >
                    <div className="inline-block p-4 bg-blue-100 rounded-3xl text-blue-500">
                        <Music size={48} />
                    </div>
                    <h1 className="text-5xl lg:text-7xl font-poppins font-black text-gray-900">
                        Bilsem <span className="text-blue-500">Müzik</span>Atölyesi
                    </h1>
                    <p className="text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-medium">
                        İçindeki melodiyi keşfettin mi? Müzik atölyemizde yeteneklerini profesyonel yöntemlerle şekillendiriyoruz.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
                    {items.map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.2 }}
                            className="bg-white p-10 rounded-[3rem] shadow-xl hover:shadow-2xl transition-all border-4 border-transparent hover:border-blue-200"
                        >
                            <div className="w-16 h-16 bg-blue-500 text-white rounded-2xl flex items-center justify-center mb-6 text-3xl">
                                {item.icon}
                            </div>
                            <h3 className="text-2xl font-black mb-4">{item.title}</h3>
                            <p className="text-gray-600 font-medium leading-relaxed">{item.desc}</p>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="mt-20 bg-blue-500 rounded-[4rem] p-12 lg:p-20 text-white text-center shadow-2xl"
                >
                    <h2 className="text-4xl lg:text-5xl font-black mb-8">Notaların Dünyasına Katıl</h2>
                    <Link
                        to="/contact"
                        className="inline-flex items-center gap-3 px-12 py-5 bg-white text-blue-500 font-black text-xl rounded-full hover:bg-gray-100 transition-all font-poppins"
                    >
                        Başvuru Yap <Rocket />
                    </Link>
                </motion.div>
            </div>
        </div>
    );
};

export default MuzikPage;
