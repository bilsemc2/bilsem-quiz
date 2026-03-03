/**
 * LandingPage — BİLSEM Müzik Yetenek Sınavı landing/intro page.
 * Tactile Cyber-Pop aesthetic with dark/light mode.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Music, Headphones, Mic, Sparkles, Shield, ChevronRight, ChevronLeft, AlertTriangle, Zap, Play } from 'lucide-react';

// 🎬 YouTube Video ID — buraya kendi video ID'ni yapıştır
const YOUTUBE_VIDEO_ID = 'G-wMP3NRU4M';

const sections = [
    {
        title: 'İşitme Bölümü',
        points: 60,
        accent: 'cyber-blue',
        icon: <Headphones className="w-7 h-7" strokeWidth={2.5} />,
        items: [
            { name: 'Tek Ses Tekrarı', points: 10 },
            { name: 'Çift Ses Tekrarı', points: 6 },
            { name: 'Ezgi Tekrarı', points: 20 },
            { name: 'Ritim Tekrarı', points: 24 },
        ],
    },
    {
        title: 'Şarkı Söyleme',
        points: 25,
        accent: 'cyber-pink',
        icon: <Mic className="w-7 h-7" strokeWidth={2.5} />,
        items: [
            { name: 'Ses Rengi/Gürlük', points: 5 },
            { name: 'Doğru Seslendirme', points: 10 },
            { name: 'Ton Aktarımı', points: 10 },
        ],
    },
    {
        title: 'Müzikal Üretkenlik',
        points: 15,
        accent: 'cyber-gold',
        icon: <Sparkles className="w-7 h-7" strokeWidth={2.5} />,
        items: [
            { name: 'Yaratıcılık & Doğaçlama', points: 15 },
        ],
    },
];

export default function LandingPage() {
    const navigate = useNavigate();
    const [showDetails, setShowDetails] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pt-24 pb-12 px-6 relative overflow-hidden transition-colors duration-300">
            {/* Background dots */}
            <div className="fixed inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(0,0,0,0.15)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

            <div className="relative z-10 container mx-auto max-w-5xl">

                {/* Back link */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
                    <Link to="/"
                        className="inline-flex items-center gap-2 text-black dark:text-white font-nunito font-extrabold uppercase text-xs tracking-widest bg-white dark:bg-slate-800 border-3 border-black/10 rounded-xl px-4 py-2 shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-md transition-all">
                        <ChevronLeft size={14} strokeWidth={3} /> Ana Sayfa
                    </Link>
                </motion.div>

                {/* Hero */}
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                    className="bg-white dark:bg-slate-800 border-3 border-black/10 rounded-2xl shadow-neo-lg p-8 md:p-14 text-center relative overflow-hidden mb-12">
                    {/* Top accent bar */}
                    <div className="absolute top-0 left-0 w-full h-4 bg-cyber-blue border-b-2 border-black/10" />

                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
                        className="w-20 h-20 mx-auto bg-cyber-blue/10 border-3 border-cyber-blue/30 rounded-2xl flex items-center justify-center shadow-neo-sm mb-6 mt-4">
                        <Music className="w-10 h-10 text-cyber-blue" strokeWidth={2.5} />
                    </motion.div>

                    <div className="flex items-center justify-center mb-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyber-gold/10 border-2 border-cyber-gold/20 rounded-xl font-nunito font-extrabold uppercase tracking-widest text-cyber-gold text-xs">
                            <Zap className="w-4 h-4" strokeWidth={3} />
                            100 Puanlık Simülasyon
                        </div>
                    </div>

                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-nunito font-extrabold text-black dark:text-white uppercase tracking-tight leading-none mb-4">
                        BİLSEM Müzik
                        <br />
                        <span className="text-cyber-blue">Yetenek Sınavı</span>
                    </h1>

                    <p className="text-slate-600 dark:text-slate-400 font-nunito font-bold text-lg md:text-xl max-w-2xl mx-auto mb-8">
                        Gerçek BİLSEM formatına uygun, 100 puanlık müzik yetenek sınavı simülasyonu.
                        Ses analizi, ritim takibi ve jüri puanlaması ile hazırlığını test et.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button onClick={() => navigate('/atolyeler/muzik-sinav/tek-ses')}
                            className="group inline-flex items-center gap-3 px-10 py-4 bg-cyber-blue text-black border-3 border-black/10 font-nunito font-extrabold text-lg uppercase tracking-widest rounded-xl shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-md transition-all">
                            Sınava Başla
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" strokeWidth={3} />
                        </button>
                        <button onClick={() => setShowDetails(!showDetails)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-slate-700 border-2 border-black/10 text-slate-600 dark:text-slate-300 font-nunito font-extrabold text-sm uppercase tracking-widest rounded-xl hover:-translate-y-0.5 transition-all">
                            {showDetails ? 'Kapat' : 'Sınav Detayları'}
                        </button>
                    </div>

                    {/* AI Usage Limits — prominent banner */}
                    <div className="mt-6 mx-auto max-w-lg bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/20 border-2 border-red-200 dark:border-red-800/40 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Shield className="w-4 h-4 text-red-500" strokeWidth={2.5} />
                            <h4 className="font-nunito font-extrabold text-red-600 dark:text-red-400 text-xs uppercase tracking-widest">AI Kullanım Hakları</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs font-nunito font-bold text-red-700/80 dark:text-red-300/80">
                            <span>🎯 Günde <strong className="text-red-700 dark:text-red-300">1 tam sınav</strong></span>
                            <span>⚡ Saatte <strong className="text-red-700 dark:text-red-300">15 AI analiz</strong></span>
                            <span>📊 Günde toplam <strong className="text-red-700 dark:text-red-300">50 analiz</strong></span>
                            <span>🎤 <strong className="text-red-700 dark:text-red-300">Gerçek ses analizi</strong></span>
                        </div>
                        <p className="mt-2 text-[10px] text-red-400 dark:text-red-500 font-nunito font-bold leading-relaxed">
                            Adil kullanım için uygulanır • Her saat/gün başı otomatik sıfırlanır
                        </p>
                    </div>
                </motion.div>

                {/* Exam Details (Collapsible) — right after hero for visibility */}
                {showDetails && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        className="bg-white dark:bg-slate-800 border-3 border-black/10 rounded-2xl p-6 md:p-8 shadow-neo-sm space-y-6 mb-12">
                        <h2 className="font-nunito font-extrabold text-black dark:text-white text-xl uppercase tracking-wider flex items-center gap-2">
                            <Shield className="w-5 h-5 text-cyber-blue" strokeWidth={2.5} /> BİLSEM Sınav Bilgileri
                        </h2>
                        <div className="grid md:grid-cols-3 gap-6 text-slate-600 dark:text-slate-400 font-nunito font-bold text-sm leading-relaxed">
                            <div className="space-y-4">
                                <h3 className="font-extrabold text-black dark:text-white text-sm uppercase tracking-wider">Değerlendirme Kriterleri</h3>
                                <ul className="space-y-2 list-disc list-inside">
                                    <li>Doğuştan gelen müzikal potansiyel ölçülür</li>
                                    <li>Enstrüman çalma beklenmez, ek puan verilmez</li>
                                    <li>5 uzman jüriden oluşan komisyon değerlendirir</li>
                                    <li>100 üzerinden puanlama (MEB rubriği)</li>
                                </ul>
                            </div>
                            <div className="space-y-4">
                                <h3 className="font-extrabold text-black dark:text-white text-sm uppercase tracking-wider">Adil Puanlama Formülü</h3>
                                <ul className="space-y-2 list-disc list-inside">
                                    <li>5 jüri birbirinden bağımsız puan verir</li>
                                    <li>En yüksek ve en düşük puan silinir</li>
                                    <li>Kalan 3 puanın ortalaması = nihai puan</li>
                                    <li>MEB barajını geçen öğrenciler kabul edilir</li>
                                </ul>
                            </div>
                            <div className="space-y-4">
                                <h3 className="font-extrabold text-black dark:text-white text-sm uppercase tracking-wider flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-cyber-gold" strokeWidth={3} /> AI Kullanım Hakları
                                </h3>
                                <ul className="space-y-2 list-disc list-inside">
                                    <li>Günde <strong className="text-black dark:text-white">1 tam sınav</strong> (6 modül)</li>
                                    <li>Saatte en fazla <strong className="text-black dark:text-white">15 AI değerlendirme</strong></li>
                                    <li>Günde toplamda <strong className="text-black dark:text-white">50 AI analiz</strong> hakkı</li>
                                    <li>Ses kaydı ile <strong className="text-black dark:text-white">gerçek ses analizi</strong></li>
                                </ul>
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                    Limitler, adil kullanım ve performans kalitesi için uygulanır. Sıfırlama her saat/gün başı otomatik yapılır.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* 🎬 Video Tanıtım */}
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                    className="bg-white dark:bg-slate-800 border-3 border-black/10 rounded-2xl shadow-neo-sm overflow-hidden mb-12">
                    <div className="flex items-center gap-3 px-6 py-4 border-b-2 border-black/5 dark:border-white/5">
                        <div className="w-8 h-8 bg-red-500/10 border-2 border-red-500/20 rounded-lg flex items-center justify-center">
                            <Play className="w-4 h-4 text-red-500 fill-red-500" strokeWidth={2} />
                        </div>
                        <h2 className="font-nunito font-extrabold text-black dark:text-white text-sm uppercase tracking-wider">
                            Sınav Nasıl İşliyor?
                        </h2>
                    </div>
                    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                        <iframe
                            className="absolute inset-0 w-full h-full"
                            src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?rel=0`}
                            title="BİLSEM Müzik Yetenek Sınavı Tanıtım"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                </motion.div>

                {/* Section Cards */}
                <div className="grid md:grid-cols-3 gap-5 mb-12">
                    {sections.map((section, i) => (
                        <motion.div key={section.title}
                            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + i * 0.1 }}
                            className="bg-white dark:bg-slate-800 border-3 border-black/10 rounded-2xl p-6 shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-md transition-all">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 bg-${section.accent}/10 border-2 border-${section.accent}/20 rounded-xl flex items-center justify-center text-${section.accent}`}>
                                    {section.icon}
                                </div>
                                <span className={`text-3xl font-nunito font-extrabold text-${section.accent}`}>
                                    {section.points}<span className="text-slate-400 text-sm ml-1">puan</span>
                                </span>
                            </div>
                            <h3 className="font-nunito font-extrabold text-black dark:text-white text-lg uppercase tracking-wider mb-3">{section.title}</h3>
                            <div className="space-y-2">
                                {section.items.map((item) => (
                                    <div key={item.name} className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500 dark:text-slate-400 font-nunito font-bold">{item.name}</span>
                                        <span className="text-slate-400 font-nunito font-extrabold">{item.points}p</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Simulation Warning */}
                <div className="bg-white dark:bg-slate-800 border-3 border-cyber-gold/30 rounded-2xl p-5 flex gap-4 items-start shadow-neo-sm">
                    <div className="w-10 h-10 bg-cyber-gold/10 border-2 border-cyber-gold/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-5 h-5 text-cyber-gold" strokeWidth={2.5} />
                    </div>
                    <div>
                        <h4 className="font-nunito font-extrabold text-sm text-cyber-gold uppercase tracking-wider mb-1">Hazırlık Simülasyonu</h4>
                        <p className="text-slate-500 dark:text-slate-400 font-nunito font-bold text-xs leading-relaxed">
                            Bu uygulama BİLSEM müzik yetenek sınavına hazırlık amaçlı bir simülasyondur.
                            Tarayıcı üzerinden yapılan ses analizi, gerçek sınav ortamındaki jüri değerlendirmesinin yerini tutmaz.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
