import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Award, Brain, Sparkles, Building2, Vote, Users, Lightbulb } from 'lucide-react';

const AboutPage: React.FC = () => {
    const experiences = [
        { icon: Building2, title: 'Eski Bankacı', color: 'from-emerald-500 to-teal-500' },
        { icon: Vote, title: '2015 MV Adayı', color: 'from-blue-500 to-indigo-500' },
        { icon: Users, title: 'Bilsem Velisi', color: 'from-purple-500 to-pink-500' },
        { icon: Lightbulb, title: 'İçerik Üreticisi', color: 'from-amber-500 to-orange-500' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 pt-24 pb-12 px-6">
            <div className="container mx-auto max-w-4xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-blue-400 font-bold hover:text-blue-300 transition-colors mb-4 uppercase text-xs tracking-widest"
                    >
                        <ChevronLeft size={16} />
                        Ana Sayfa
                    </Link>
                    <h1 className="text-4xl lg:text-5xl font-black text-white mb-4">
                        👋 <span className="text-blue-400">Hakkımda</span>
                    </h1>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                        BilsemC2'nin arkasındaki hikaye ve eğitim metodolojisi.
                    </p>
                </motion.div>

                {/* Main Introduction Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 mb-8"
                >
                    <div className="flex flex-col md:flex-row gap-8 items-center">
                        {/* Avatar Section */}
                        <div className="relative flex-shrink-0">
                            <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/30">
                                <span className="text-5xl font-black text-white">Eİ</span>
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                                <Award className="w-5 h-5 text-white" />
                            </div>
                        </div>

                        {/* Bio Section */}
                        <div className="text-center md:text-left">
                            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                                Ersan İçöz
                            </h2>
                            <p className="text-blue-400 font-medium mb-4">
                                10 Yıllık Tecrübeli Eğitimci
                            </p>
                            <p className="text-slate-300 leading-relaxed">
                                Merhaba, ben Ersan İçöz. 10 yıllık tecrübeye sahip bir eğitimciyim.
                                Geçmişte Ziraat Bankası'nda görev aldım ve 2015 yılında Afyonkarahisar
                                Milletvekili adayı oldum.
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Story Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-slate-800/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 mb-8"
                >
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-pink-500/30">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white mb-2">Hikayem</h3>
                            <p className="text-slate-300 leading-relaxed italic">
                                "Bu yolculuk, kendi kızımı BİLSEM'e yerleştirmek için yaptığım çalışmalarla başladı.
                                Sürece olan tutkum ve ilgim sayesinde, kendimi tamamen bu alanda geliştirdim ve
                                şimdi yüzlerce öğrenciye rehberlik ediyorum."
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Education Method */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <Brain className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Eğitim Metodu</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        {/* AI Content Card */}
                        <div className="bg-slate-800/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 hover:border-blue-500/30 transition-all group">
                            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
                                <span className="text-2xl">🤖</span>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">
                                Yapay Zeka Destekli İçerik
                            </h3>
                            <p className="text-slate-400 leading-relaxed">
                                Kullandığınız bu siteleri ve binlerce soruyu bizzat ben tasarlıyorum.
                                Soruların mantık kurallarını (algoritmalarını) ben belirliyorum,
                                Yapay Zeka ile üretiyorum.
                            </p>
                        </div>

                        {/* Visual Analysis Card */}
                        <div className="bg-slate-800/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 hover:border-cyan-500/30 transition-all group">
                            <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-transform">
                                <span className="text-2xl">🧠</span>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">
                                Görsel & Mantıksal Analiz
                            </h3>
                            <p className="text-slate-400 leading-relaxed">
                                Ezberden uzak, tamamen görsel hafıza ve mantık yürütme becerilerini
                                geliştirmeye odaklıyım.
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Experience Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mb-8"
                >
                    <h2 className="text-2xl font-bold text-white mb-6 text-center">Deneyim</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {experiences.map((exp, index) => {
                            const Icon = exp.icon;
                            return (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.5 + index * 0.1 }}
                                    className="bg-slate-800/50 backdrop-blur-sm border border-white/5 rounded-2xl p-5 text-center hover:border-white/20 transition-all hover:scale-105"
                                >
                                    <div className={`w-12 h-12 bg-gradient-to-br ${exp.color} rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg`}>
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <p className="text-white font-medium text-sm">{exp.title}</p>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* CTA Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl border border-blue-500/30 rounded-3xl p-8 text-center"
                >
                    <h2 className="text-2xl font-bold text-white mb-3">
                        Birlikte Çalışalım!
                    </h2>
                    <p className="text-slate-300 mb-6 max-w-lg mx-auto">
                        Çocuğunuzun BİLSEM sınavına en iyi şekilde hazırlanması için
                        size yardımcı olmaktan mutluluk duyarım.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Link
                            to="/contact"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all hover:scale-105"
                        >
                            İletişime Geçin
                        </Link>
                        <Link
                            to="/pricing"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-700/50 text-white font-medium rounded-xl border border-white/10 hover:bg-slate-600/50 transition-all"
                        >
                            Paketleri İncele
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default AboutPage;
