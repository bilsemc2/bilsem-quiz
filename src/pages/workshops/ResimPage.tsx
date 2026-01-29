import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Palette, Eye, Layout, PenTool, Rocket, ChevronLeft, Lock, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import ResimGame from '../../components/Workshops/Resim/ResimGame';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import './resim/resim.css';

const ResimPage: React.FC = () => {
    const [isActive, setIsActive] = useState(false);
    const { user } = useAuth();
    const [hasTalentAccess, setHasTalentAccess] = useState<boolean | null>(null);
    const [userTalents, setUserTalents] = useState<string[]>([]);
    const [analysisQuota, setAnalysisQuota] = useState<number | null>(null);
    const [isTeacher, setIsTeacher] = useState(false);
    const [showTalentWarning, setShowTalentWarning] = useState(false);

    useEffect(() => {
        const checkTalentAccess = async () => {
            if (!user) {
                setHasTalentAccess(false);
                return;
            }

            try {
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('yetenek_alani, role, is_admin, resim_analiz_hakki')
                    .eq('id', user.id)
                    .maybeSingle();

                if (error || !profile) {
                    setHasTalentAccess(false);
                    return;
                }

                // Admin veya öğretmen ise direkt erişim ver
                if (profile.is_admin || profile.role === 'teacher') {
                    setHasTalentAccess(true);
                    setIsTeacher(true);
                    setAnalysisQuota(999); // Sınırsız
                    return;
                }

                // Analiz hakkını set et
                setAnalysisQuota(profile.resim_analiz_hakki ?? 3);

                // yetenek_alani kontrolü
                const talentsInput = profile.yetenek_alani;
                let talents: string[] = [];

                if (Array.isArray(talentsInput)) {
                    talents = talentsInput;
                } else if (typeof talentsInput === 'string') {
                    talents = talentsInput.split(/[,,;]/).map(t => t.trim()).filter(Boolean);
                }

                setUserTalents(talents);

                // Sadece "resim" yeteneği olması gerekiyor
                const hasAccess = talents.some(t =>
                    t.toLowerCase() === 'resim'
                );

                setHasTalentAccess(hasAccess);
            } catch (error) {
                console.error('Yetenek kontrolü hatası:', error);
                setHasTalentAccess(false);
            }
        };

        checkTalentAccess();
    }, [user]);

    const steps = [
        { icon: <Eye />, title: "Görsel Algı", desc: "Detayları fark etme ve görsel hafızayı güçlendirme." },
        { icon: <Layout />, title: "Kompozisyon", desc: "Dengeli ve etkileyici sahneler kurgulama yeteneği." },
        { icon: <PenTool />, title: "Yaratıcı Çizim", desc: "Hayal gücünü kağıda dökme ve özgünlük geliştirme." },
    ];

    if (isActive) {
        return (
            <div className="resim-workshop-container pt-24 pb-12 px-6 min-h-screen">
                <div className="resim-bg-blobs">
                    <div className="resim-blob resim-blob-1" />
                    <div className="resim-blob resim-blob-2" />
                    <div className="resim-blob resim-blob-3" />
                </div>
                <ResimGame onBack={() => setIsActive(false)} />
            </div>
        );
    }

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

                {/* YouTube Video Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-16"
                >
                    <div className="bg-white/5 backdrop-blur-xl p-6 lg:p-10 rounded-[3rem] border border-white/10 shadow-2xl max-w-4xl mx-auto">
                        <h3 className="text-2xl font-black text-white mb-6 text-center">
                            🎨 Atölyemizi Tanıyın
                        </h3>
                        <div className="relative w-full aspect-video rounded-2xl overflow-hidden">
                            <iframe
                                src="https://www.youtube.com/embed/Xe-Fwr5t9Fg"
                                title="Resim Atölyesi Tanıtım"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="absolute inset-0 w-full h-full"
                            />
                        </div>
                    </div>
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
                                Yapay zeka destekli öğretmenimizle sanatsal gelişimini destekliyoruz.
                            </p>

                            {hasTalentAccess === null ? (
                                <div className="flex items-center justify-center gap-3 py-6">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500"></div>
                                    <span className="text-slate-300">Kontrol ediliyor...</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-4">
                                    {/* Kalan Analiz Hakkı Göstergesi */}
                                    {hasTalentAccess && !isTeacher && analysisQuota !== null && (
                                        <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20">
                                            <p className="text-slate-300 text-sm">
                                                Kalan Analiz Hakkı:
                                                <span className={`ml-2 font-black text-xl ${analysisQuota > 0 ? 'text-pink-400' : 'text-rose-500'}`}>
                                                    {analysisQuota}
                                                </span>
                                            </p>
                                        </div>
                                    )}
                                    <button
                                        onClick={() => {
                                            if (hasTalentAccess) {
                                                setIsActive(true);
                                            } else {
                                                setShowTalentWarning(true);
                                            }
                                        }}
                                        className="group relative inline-flex items-center justify-center gap-4 px-16 py-6 bg-gradient-to-r from-pink-600 to-purple-700 text-white font-black text-2xl rounded-full hover:shadow-2xl hover:shadow-pink-500/40 transition-all duration-300 transform hover:-translate-y-1 active:scale-95 overflow-hidden"
                                    >
                                        <span className="relative flex items-center gap-3">
                                            Atölyeye Gir <Rocket className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                        </span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Yetenek Alanı Uyarı Modal */}
            {showTalentWarning && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl border border-white/10 shadow-2xl p-8 max-w-md w-full text-center relative"
                    >
                        <button
                            onClick={() => setShowTalentWarning(false)}
                            className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>

                        <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Lock className="w-10 h-10 text-rose-400" />
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-4">
                            Bu Atölye Profilinize Uygun Değil
                        </h2>

                        <p className="text-white/70 mb-6 leading-relaxed">
                            Resim Atölyesi sadece yetenek alanı <strong className="text-pink-400">Resim</strong> olan öğrencilerimiz içindir.
                            {userTalents.length > 0 && (
                                <span className="block mt-2">
                                    Sizin yetenek alanınız: <strong className="text-amber-400">{userTalents.join(', ')}</strong>
                                </span>
                            )}
                        </p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => setShowTalentWarning(false)}
                                className="w-full py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/10"
                            >
                                Anladım, Sayfada Kalayım
                            </button>
                            <Link
                                to="/profile"
                                className="w-full py-3 bg-pink-600 text-white font-semibold rounded-xl hover:bg-pink-700 transition-all text-center"
                            >
                                Profilimi Görüntüle
                            </Link>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default ResimPage;
