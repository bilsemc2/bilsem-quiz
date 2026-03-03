import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Award, Brain, Sparkles, Building2, Vote, Users, Lightbulb } from 'lucide-react';

// ═══════════════════════════════════════════════
// 🏫 AboutPage — Kid-UI Çocuk Dostu Tasarım
// ═══════════════════════════════════════════════

const experiences = [
    { icon: Building2, title: 'Eski Bankacı', color: 'bg-cyber-blue', emoji: '🏦' },
    { icon: Vote, title: '2015 MV Adayı', color: 'bg-cyber-pink', emoji: '🗳️' },
    { icon: Users, title: 'Bilsem Velisi', color: 'bg-cyber-gold', emoji: '👨‍👧' },
    { icon: Lightbulb, title: 'İçerik Üreticisi', color: 'bg-[#FF9B71]', emoji: '💡' },
];

const AboutPage: React.FC = () => {
    return (
        <div className="min-h-screen overflow-hidden transition-colors duration-300">
            {/* Background pattern — dots */}
            <div className="fixed inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(0,0,0,0.15)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

            <div className="container mx-auto max-w-4xl relative z-10 pt-24 pb-12 px-6">
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
                    <h1 className="text-5xl lg:text-7xl font-nunito font-black text-black dark:text-white mb-5 uppercase tracking-tight leading-none">
                        👋 <span className="text-cyber-blue dark:text-cyber-pink">Hakkımda</span>
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 text-lg md:text-xl max-w-xl mx-auto font-nunito font-bold">
                        BilsemC2'nin arkasındaki hikaye ve eğitim metodolojisi.
                    </p>
                </motion.div>

                {/* Main Introduction Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl p-8 md:p-10 mb-8 shadow-neo-lg overflow-hidden"
                >
                    <div className="flex flex-col md:flex-row gap-8 items-center">
                        {/* Avatar Section */}
                        <div className="relative flex-shrink-0 group">
                            <div className="w-36 h-36 bg-cyber-gold border-2 border-black/10 rounded-2xl flex items-center justify-center shadow-neo-md group-hover:scale-105 transition-transform">
                                <span className="text-5xl font-nunito font-black text-black">Eİ</span>
                            </div>
                            <motion.div
                                whileHover={{ rotate: 0 }}
                                className="absolute -bottom-3 -right-3 w-12 h-12 bg-cyber-pink border-3 border-black/10 rounded-xl flex items-center justify-center shadow-neo-sm rotate-12"
                            >
                                <Award className="w-6 h-6 text-black" strokeWidth={2.5} />
                            </motion.div>
                        </div>

                        {/* Bio Section */}
                        <div className="text-center md:text-left">
                            <h2 className="text-3xl lg:text-4xl font-nunito font-black text-black dark:text-white mb-2 uppercase tracking-tight">
                                Ersan İçöz
                            </h2>
                            <div className="inline-block px-4 py-1.5 bg-cyber-blue text-black font-nunito font-extrabold uppercase tracking-wider text-xs border-2 border-black/10 rounded-lg shadow-neo-sm mb-5">
                                10 Yıllık Tecrübeli Eğitimci
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-nunito font-bold">
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
                    className="bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl overflow-hidden mb-12 shadow-neo-md"
                >
                    <div className="h-2.5 bg-cyber-pink" />
                    <div className="p-8 md:p-10 flex flex-col md:flex-row items-center md:items-start gap-5">
                        <div className="w-14 h-14 bg-cyber-pink/10 border-2 border-cyber-pink/30 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-7 h-7 text-cyber-pink" strokeWidth={2.5} />
                        </div>
                        <div className="text-center md:text-left">
                            <h3 className="text-2xl font-nunito font-extrabold text-black dark:text-white mb-3 uppercase">Hikayem</h3>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-nunito font-bold italic text-lg">
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
                    className="mb-12"
                >
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-11 h-11 bg-cyber-blue border-3 border-black/10 rounded-xl flex items-center justify-center shadow-neo-sm">
                            <Brain className="w-5 h-5 text-black" strokeWidth={2.5} />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-nunito font-black text-black dark:text-white uppercase tracking-tight">Eğitim Metodu</h2>
                        <div className="flex-1 h-1 bg-black/5 dark:bg-white/5 rounded-full hidden md:block" />
                    </div>

                    <div className="grid md:grid-cols-2 gap-5">
                        {/* AI Content Card */}
                        <div className="bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl overflow-hidden shadow-neo-md hover:-translate-y-1 transition-transform group">
                            <div className="h-2 bg-cyber-gold" />
                            <div className="p-7">
                                <div className="w-14 h-14 bg-cyber-gold/10 border-2 border-cyber-gold/30 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                    <span className="text-2xl">🤖</span>
                                </div>
                                <h3 className="text-xl font-nunito font-extrabold text-black dark:text-white mb-3 uppercase">
                                    Yapay Zeka Destekli İçerik
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-nunito font-bold text-sm">
                                    Kullandığınız bu siteleri ve binlerce soruyu bizzat ben tasarlıyorum.
                                    Soruların mantık kurallarını (algoritmalarını) ben belirliyorum,
                                    Yapay Zeka ile üretiyorum.
                                </p>
                            </div>
                        </div>

                        {/* Visual Analysis Card */}
                        <div className="bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl overflow-hidden shadow-neo-md hover:-translate-y-1 transition-transform group">
                            <div className="h-2 bg-cyber-pink" />
                            <div className="p-7">
                                <div className="w-14 h-14 bg-cyber-pink/10 border-2 border-cyber-pink/30 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                    <span className="text-2xl">🧠</span>
                                </div>
                                <h3 className="text-xl font-nunito font-extrabold text-black dark:text-white mb-3 uppercase">
                                    Görsel & Mantıksal Analiz
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-nunito font-bold text-sm">
                                    Ezberden uzak, tamamen görsel hafıza ve mantık yürütme becerilerini
                                    geliştirmeye odaklıyım.
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Experience Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mb-12"
                >
                    <h2 className="text-2xl md:text-3xl font-nunito font-black text-black dark:text-white uppercase tracking-tight mb-8 text-center md:text-left">Deneyim</h2>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {experiences.map((exp, index) => {
                            const Icon = exp.icon;
                            return (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.5 + index * 0.08 }}
                                    whileHover={{ y: -4 }}
                                    className="bg-white dark:bg-slate-800 border-3 border-black/10 rounded-2xl p-5 text-center shadow-neo-sm hover:shadow-neo-md transition-all group"
                                >
                                    <div className={`w-14 h-14 ${exp.color} border-3 border-black/10 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-neo-sm group-hover:scale-110 transition-transform`}>
                                        <Icon className="w-7 h-7 text-black" strokeWidth={2.5} />
                                    </div>
                                    <p className="text-black dark:text-white font-nunito font-extrabold text-sm uppercase tracking-wide">{exp.title}</p>
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
                    className="bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl overflow-hidden shadow-neo-lg"
                >
                    <div className="h-2.5 bg-cyber-gold" />
                    <div className="p-8 md:p-12 text-center">
                        <h2 className="text-3xl md:text-4xl font-nunito font-black text-black dark:text-white mb-4 uppercase tracking-tight">
                            Birlikte Çalışalım! 🤝
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-lg mx-auto font-nunito font-bold">
                            Çocuğunuzun BİLSEM sınavına en iyi şekilde hazırlanması için
                            size yardımcı olmaktan mutluluk duyarım.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link to="/contact">
                                <motion.div
                                    whileHover={{ scale: 1.03, y: -2 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-cyber-emerald text-black font-nunito font-extrabold uppercase tracking-wider border-3 border-black/10 rounded-xl shadow-neo-sm hover:shadow-neo-md transition-all"
                                >
                                    İletişime Geçin
                                </motion.div>
                            </Link>
                            <Link to="/pricing">
                                <motion.div
                                    whileHover={{ scale: 1.03, y: -2 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white dark:bg-slate-700 text-black dark:text-white font-nunito font-extrabold uppercase tracking-wider border-3 border-black/10 rounded-xl shadow-neo-sm hover:shadow-neo-md transition-all"
                                >
                                    Paketleri İncele
                                </motion.div>
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default AboutPage;
