import React from 'react';
import { motion } from 'framer-motion';
import { Tablet, Brain, Layout, ChevronRight, Star, ChevronLeft, Box } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/auth/useAuth';
import AccessDeniedScreen from '../../components/AccessDeniedScreen';

// yetenek_alani erişim kontrolü
const hasTabletAccess = (yetenekAlani: string[] | string | null | undefined): boolean => {
    if (!yetenekAlani) return false;
    const skills = Array.isArray(yetenekAlani) ? yetenekAlani : [yetenekAlani];
    return skills.some(s => s === 'genel yetenek' || s === 'genel yetenek - tablet');
};

const TabletAssessmentPage: React.FC = () => {
    const { profile, loading } = useAuth();
    const canAccess = hasTabletAccess(profile?.yetenek_alani);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-cyber-emerald border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!canAccess) {
        return (
            <AccessDeniedScreen
                requiredTalent="Genel Yetenek - Tablet Değerlendirme"
                backLink="/atolyeler/bireysel-degerlendirme"
                backLabel="Bireysel Değerlendirme Sayfasına Dön"
                iconType="shield"
                requiredIncludes={['genel_yetenek']}
            />
        );
    }

    const gameCategories = [
        {
            id: 'logic',
            title: "Parça Bütün İlişkisi",
            desc: "Karmaşık örüntüleri ve eksik parçaları tamamla.",
            icon: <Brain strokeWidth={2.5} size={28} />,
            cyberColor: "cyber-emerald",
            count: 5,
            link: "/games/parca-butun"
        },
        {
            id: 'spatial',
            title: "Rotasyon Matrisi",
            desc: "Desenlerin dönüş kurallarını çöz ve eksik olanı bul.",
            icon: <Layout strokeWidth={2.5} size={28} />,
            cyberColor: "cyber-blue",
            count: 6,
            link: "/games/rotasyon-matrisi"
        },
        {
            id: '3d-cube',
            title: "3B Görselleştirme",
            desc: "Sihirli küpleri zihninde katla ve doğru açıyı bul.",
            icon: <Box strokeWidth={2.5} size={28} />,
            cyberColor: "cyber-gold",
            count: 4,
            link: "/games/sihirli-kupler"
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-800 pt-24 pb-12 px-6 relative overflow-hidden transition-colors duration-300">
            {/* Dot pattern */}
            <div className="fixed inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(0,0,0,0.15)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

            <div className="container mx-auto max-w-6xl relative z-10">
                {/* Header */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-14">
                    <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="space-y-5 w-full lg:flex-1">
                        <Link to="/atolyeler/bireysel-degerlendirme"
                            className="inline-flex items-center gap-2 text-black dark:text-white font-nunito font-extrabold uppercase text-xs tracking-widest bg-white dark:bg-slate-800 border-3 border-black/10 rounded-xl px-4 py-2 shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-md transition-all">
                            <ChevronLeft size={14} strokeWidth={3} /> Bireysel Değerlendirme
                        </Link>

                        <div className="flex items-center gap-5">
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                className="p-4 bg-cyber-purple/10 border-3 border-cyber-purple/30 rounded-2xl">
                                <Tablet size={40} className="text-cyber-purple" strokeWidth={2.5} />
                            </motion.div>
                            <div>
                                <h1 className="text-4xl lg:text-7xl font-nunito font-extrabold text-black dark:text-white leading-none tracking-tight uppercase">
                                    Tablet <span className="text-cyber-purple block sm:inline">Değerlendirme</span>
                                </h1>
                            </div>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-nunito font-bold text-sm max-w-xl leading-relaxed border-l-4 border-cyber-purple pl-4">
                            1. Aşama simülasyonları ile Bilsem tablet sınavına en gerçekçi şekilde hazırlan. Becerilerini seç ve hemen oynamaya başla!
                        </p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-slate-800 p-6 border-2 border-black/10 rounded-2xl flex items-center gap-6 shadow-neo-md">
                        <div className="text-center">
                            <div className="text-3xl font-nunito font-extrabold text-black dark:text-white">2.5k+</div>
                            <div className="text-slate-500 text-[10px] font-extrabold uppercase tracking-widest mt-1">Öğrenci</div>
                        </div>
                        <div className="w-0.5 h-12 bg-black/10 dark:bg-white/10" />
                        <div className="text-center">
                            <div className="text-3xl font-nunito font-extrabold text-cyber-purple">{gameCategories.reduce((sum, cat) => sum + cat.count, 0)}</div>
                            <div className="text-slate-500 text-[10px] font-extrabold uppercase tracking-widest mt-1">Simülasyon</div>
                        </div>
                    </motion.div>
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {gameCategories.map((cat, i) => (
                        <motion.div key={cat.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }} className="group h-full">
                            <div className="h-full bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl overflow-hidden shadow-neo-sm hover:shadow-neo-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
                                {/* Accent strip */}
                                <div className={`h-1.5 bg-${cat.cyberColor}`} />

                                <div className="p-7 space-y-5 flex-1">
                                    <div className="flex items-start justify-between">
                                        <div className={`w-14 h-14 bg-${cat.cyberColor}/10 border-2 border-${cat.cyberColor}/20 rounded-xl flex items-center justify-center text-${cat.cyberColor} group-hover:scale-110 transition-transform`}>
                                            {cat.icon}
                                        </div>
                                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700 px-3 py-1.5 border border-black/5 rounded-lg">
                                            <Star size={14} className="text-cyber-gold" strokeWidth={3} />
                                            <span className="text-[11px] font-nunito font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider">{cat.count} Oyun</span>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-nunito font-extrabold text-black dark:text-white mb-2 uppercase tracking-tight">{cat.title}</h3>
                                        <p className="text-slate-500 dark:text-slate-400 font-nunito font-bold text-sm leading-relaxed">{cat.desc}</p>
                                    </div>
                                </div>

                                <div className="px-7 pb-6 pt-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                                    <div className="text-slate-400 text-[10px] font-nunito font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                                        <div className={`w-1.5 h-1.5 bg-${cat.cyberColor} rounded-full animate-pulse`} /> Simülasyonlar
                                    </div>
                                    <Link to={cat.link}
                                        className="px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black font-nunito font-extrabold text-xs uppercase border-3 border-black/10 rounded-xl shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-md transition-all flex items-center gap-2 group/btn">
                                        Giriş Yap <ChevronRight size={16} strokeWidth={3} className="group-hover/btn:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TabletAssessmentPage;
