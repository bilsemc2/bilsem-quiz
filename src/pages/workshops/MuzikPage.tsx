import React from 'react';
import { motion } from 'framer-motion';
import { Music, Radio, Mic2, Volume2, Rocket, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAudio } from './muzik/contexts/AudioContext';

const MuzikPage: React.FC = () => {
    const items = [
        { icon: <Radio />, title: "Ritim Algısı", desc: "Zamanlama ve tempoyu mükemmel şekilde hissetme." },
        { icon: <Mic2 />, title: "Ses Eğitimi", desc: "Doğru tonları duyma ve ses kontrolü geliştirme." },
        { icon: <Volume2 />, title: "Müzikal Kulak", desc: "Melodileri ve akorları anında tanıma becerisi." },
    ];

    const navigate = useNavigate();
    const { startAudioContext, isLoading: isAudioLoading } = useAudio();

    const handleStart = async () => {
        try {
            // Audio context'i ve sampler'ı başlat
            const success = await startAudioContext();

            if (success) {
                // İstek üzerine tanıtım sesini çal
                const audio = new Audio('/ses/bilsemc2.mp3');
                audio.play().catch(err => console.warn("Intro audio failed:", err));

                // Kısa bir bekleme sonrası navigasyon
                setTimeout(() => {
                    navigate("/atolyeler/muzik/single-note");
                }, 200);
            } else {
                // Başarısız olsa bile devam et (belki ses olmadan oynar)
                navigate("/atolyeler/muzik/single-note");
            }
        } catch (err) {
            console.error("Failed to start audio workshop:", err);
            navigate("/atolyeler/muzik/single-note");
        }
    };

    return (
        <div className="flex-1 min-h-screen py-24 pb-20 px-6 relative z-10 overflow-x-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-40 -left-10 opacity-10 blur-sm pointer-events-none select-none">
                <Music size={200} className="rotate-12 text-white" />
            </div>
            <div className="absolute bottom-40 -right-20 opacity-10 blur-sm pointer-events-none select-none">
                <Radio size={300} className="-rotate-12 text-white" />
            </div>

            <div className="container mx-auto max-w-6xl relative">
                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-6 mb-16"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        className="inline-block p-5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2rem] text-white shadow-2xl shadow-emerald-500/20"
                    >
                        <Music size={48} />
                    </motion.div>
                    <h1 className="text-6xl lg:text-8xl font-poppins font-black text-white tracking-tight">
                        Müzik <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">Atölyesi</span>
                    </h1>
                    <p className="text-xl lg:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-medium">
                        Ritimleri hisset, notaları keşfet ve müzikal zekanı en üst seviyeye taşı. Profesyonel analiz sistemimizle yeteneğini şekillendir.
                    </p>
                </motion.div>

                {/* Info Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mb-20 bg-white/40 dark:bg-slate-800/20 backdrop-blur-2xl rounded-[3.5rem] p-10 lg:p-14 shadow-2xl border border-white/30 dark:border-white/5 max-w-4xl mx-auto overflow-hidden relative"
                >
                    <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-emerald-500 to-teal-600"></div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                        <div className="w-full md:w-1/3 text-center md:text-left">
                            <h2 className="text-3xl font-black text-white mb-4">Hoş Geldiniz</h2>
                            <p className="text-emerald-500 font-bold uppercase tracking-widest text-xs">Yetenek Keşfi</p>
                        </div>

                        <div className="flex-1 space-y-6 text-slate-300 font-medium leading-relaxed">
                            <p className="text-lg">
                                Bu özel atölyede müzikal yeteneklerini modern algoritmalarla test ediyoruz. Ritim, kulak, melodi ve performans odaklı etaplarla gerçek bir konservatuar sınavı deneyimi sunuyoruz.
                            </p>
                            <div className="bg-emerald-500/10 dark:bg-emerald-500/5 p-5 rounded-3xl border border-emerald-500/10">
                                <p className="text-emerald-300 font-bold flex items-center gap-3">
                                    <span className="text-2xl">🎹</span>
                                    En doğru analiz için testi bir müzik öğretmeni rehberliğinde uygulamanız tavsiye edilir.
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Feature Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
                    {items.map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + (i * 0.1) }}
                            whileHover={{ y: -10 }}
                            className="bg-white/5 backdrop-blur-xl p-10 rounded-[3.5rem] shadow-xl border border-white/10 hover:border-emerald-500/30 transition-all duration-500 group relative"
                        >
                            <div className="absolute top-6 right-8 text-5xl font-black text-emerald-500/5 group-hover:text-emerald-500/10 transition-colors pointer-events-none">
                                0{i + 1}
                            </div>
                            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-[1.5rem] flex items-center justify-center mb-8 text-3xl group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-emerald-500/20">
                                {item.icon}
                            </div>
                            <h3 className="text-2xl font-black mb-4 text-white">{item.title}</h3>
                            <p className="text-slate-400 font-medium leading-relaxed">{item.desc}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Call to Action */}
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    className="mt-24 p-[2px] rounded-[4.5rem] bg-gradient-to-r from-emerald-500 via-teal-500 to-slate-500 shadow-2xl relative"
                >
                    <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl rounded-[4.4rem] p-12 lg:p-20 text-center relative overflow-hidden">
                        {/* Decorative Circles */}
                        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>

                        <div className="relative z-10 space-y-10">
                            <div>
                                <h2 className="text-4xl lg:text-6xl font-black mb-6 text-white tracking-tight leading-tight">
                                    Notaların Dünyasına <br className="hidden md:block" />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">İlk Adımı At</span>
                                </h2>
                                <p className="text-slate-400 text-lg font-medium max-w-2xl mx-auto">
                                    Müzik yolculuğun burada başlıyor. Kulaklarını hazırla ve potansiyelini serbest bırak.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
                                <button
                                    onClick={handleStart}
                                    disabled={isAudioLoading}
                                    className="group relative inline-flex items-center justify-center gap-4 px-14 py-6 bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-black text-2xl rounded-full hover:shadow-2xl hover:shadow-emerald-500/40 transition-all duration-300 transform hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                    <span className="relative flex items-center gap-3">
                                        {isAudioLoading ? (
                                            <>Yükleniyor <Loader2 className="animate-spin" /></>
                                        ) : (
                                            <>Atölyeye Başla <Rocket className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /></>
                                        )}
                                    </span>
                                </button>

                                <Link
                                    to="/contact"
                                    className="px-10 py-5 text-slate-300 font-black text-xl hover:text-emerald-400 transition-colors"
                                >
                                    Daha Fazla Bilgi
                                </Link>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default MuzikPage;
