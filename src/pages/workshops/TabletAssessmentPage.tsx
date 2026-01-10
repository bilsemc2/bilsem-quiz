import React from 'react';
import { motion } from 'framer-motion';
import { Tablet, Brain, Layout, ChevronRight, Star, ChevronLeft, Box, ShieldX } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// yetenek_alani erişim kontrolü
const hasTabletAccess = (yetenekAlani: string[] | string | null | undefined): boolean => {
    if (!yetenekAlani) return false;
    const skills = Array.isArray(yetenekAlani) ? yetenekAlani : [yetenekAlani];
    // 'genel yetenek' tüm alt kategorilere erişim sağlar
    // 'genel yetenek - tablet' sadece tablet'e erişim sağlar
    return skills.some(s => s === 'genel yetenek' || s === 'genel yetenek - tablet');
};

const TabletAssessmentPage: React.FC = () => {
    const { profile, loading } = useAuth();
    const navigate = useNavigate();

    // Erişim kontrolü
    const canAccess = hasTabletAccess(profile?.yetenek_alani);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!canAccess) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-slate-900/80 backdrop-blur-xl rounded-3xl p-12 border border-red-500/30 max-w-lg text-center"
                >
                    <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldX className="w-10 h-10 text-red-400" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-4">Erişim İzni Gerekli</h2>
                    <p className="text-slate-400 mb-8 leading-relaxed">
                        Bu modüle erişim için <strong className="text-purple-400">Genel Yetenek - Tablet Değerlendirme</strong> yetkisine sahip olmanız gerekmektedir.
                    </p>
                    <button
                        onClick={() => navigate('/atolyeler/genel-yetenek')}
                        className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors"
                    >
                        Genel Yetenek Sayfasına Dön
                    </button>
                </motion.div>
            </div>
        );
    }

    const gameCategories = [
        {
            id: 'logic',
            title: "Parça Bütün İlişkisi",
            desc: "Karmaşık örüntüleri ve eksik parçaları tamamla.",
            icon: <Brain />,
            color: "emerald",
            count: 5,
            link: "/games/parca-butun"
        },
        {
            id: 'spatial',
            title: "Rotasyon Matrisi",
            desc: "Desenlerin dönüş kurallarını çöz ve eksik olanı bul.",
            icon: <Layout />,
            color: "blue",
            count: 6,
            link: "/games/rotasyon-matrisi"
        },
        {
            id: '3d-cube',
            title: "3B Görselleştirme",
            desc: "Sihirli küpleri zihninde katla ve doğru açıyı bul.",
            icon: <Box />,
            color: "amber",
            count: 4,
            link: "/games/sihirli-kupler"
        }
    ];

    return (
        <div className="min-h-screen bg-slate-950 pt-24 pb-12 px-6 overflow-hidden relative">
            {/* Arka Plan Efektleri */}
            <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
            </div>

            <div className="container mx-auto max-w-6xl relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-4"
                    >
                        <Link to="/atolyeler/genel-yetenek" className="inline-flex items-center gap-2 text-purple-400 font-bold hover:text-purple-300 transition-colors mb-4 uppercase text-xs tracking-widest">
                            <ChevronLeft size={16} /> Genel Yetenek Atölyesi
                        </Link>
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-purple-500/20 rounded-2xl text-purple-400 border border-purple-500/30">
                                <Tablet size={32} />
                            </div>
                            <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight">
                                Tablet <span className="text-purple-400">Değerlendirme</span>
                            </h1>
                        </div>
                        <p className="text-slate-400 text-lg font-medium max-w-xl leading-relaxed">
                            1. Aşama simülasyonları ile Bilsem tablet sınavına en gerçekçi şekilde hazırlan. Becerilerini seç ve hemen oynamaya başla!
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-900/50 backdrop-blur-xl p-8 rounded-[3rem] border border-slate-800 shadow-2xl flex items-center gap-8"
                    >
                        <div className="text-center">
                            <div className="text-3xl font-black text-white">2.5k+</div>
                            <div className="text-slate-500 text-xs font-bold uppercase tracking-widest">Öğrenci</div>
                        </div>
                        <div className="w-px h-12 bg-slate-800" />
                        <div className="text-center">
                            <div className="text-3xl font-black text-purple-400">{gameCategories.reduce((sum, cat) => sum + cat.count, 0)}</div>
                            <div className="text-slate-500 text-xs font-bold uppercase tracking-widest">Simülasyon</div>
                        </div>
                    </motion.div>
                </div>

                {/* Kategoriler Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {gameCategories.map((cat, i) => (
                        <motion.div
                            key={cat.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="group"
                        >
                            <div className="bg-slate-900/40 backdrop-blur-md rounded-[3rem] p-8 border border-slate-800/50 hover:border-purple-500/30 transition-all duration-500 relative overflow-hidden h-full flex flex-col justify-between">
                                {/* Arka plan hover efekti */}
                                <div className={`absolute top-0 right-0 w-32 h-32 bg-${cat.color}-500/5 rounded-full blur-3xl group-hover:bg-${cat.color}-500/10 transition-colors`} />

                                <div className="space-y-6 relative z-10">
                                    <div className="flex items-center justify-between">
                                        <div className={`w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-white text-2xl group-hover:bg-${cat.color}-500 group-hover:text-white transition-all duration-500 shadow-xl`}>
                                            {cat.icon}
                                        </div>
                                        <div className="flex items-center gap-1 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700">
                                            <Star size={12} className="text-amber-500" fill="currentColor" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{cat.count} Oyun</span>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-2xl font-black text-white mb-2">{cat.title}</h3>
                                        <p className="text-slate-500 font-medium leading-relaxed">{cat.desc}</p>
                                    </div>
                                </div>

                                <div className="mt-8 pt-8 border-t border-slate-800/50 flex items-center justify-between relative z-10">
                                    <div className="text-slate-600 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full bg-${cat.color}-500`} /> Aktif Simülasyonlar
                                    </div>
                                    <Link
                                        to={cat.link}
                                        className={`flex items-center gap-2 text-white font-black hover:text-${cat.color}-400 transition-colors group/btn`}
                                    >
                                        Giriş Yap <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Footer / Call to Action */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-20 text-center"
                >

                </motion.div>
            </div>
        </div>
    );
};

export default TabletAssessmentPage;
