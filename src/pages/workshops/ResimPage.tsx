import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Palette, Eye, Layout, PenTool, Rocket, ChevronLeft, X, LogIn } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ResimGame from '../../components/Workshops/Resim/ResimGame';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import AccessDeniedScreen from '../../components/AccessDeniedScreen';

const ResimPage: React.FC = () => {
    const navigate = useNavigate();
    const [isActive, setIsActive] = useState(false);
    const { user } = useAuth();
    const [hasTalentAccess, setHasTalentAccess] = useState<boolean | null>(null);
    const [userTalents, setUserTalents] = useState<string[]>([]);
    const [analysisQuota, setAnalysisQuota] = useState<number | null>(null);
    const [isTeacher, setIsTeacher] = useState(false);
    const [showAccessDenied, setShowAccessDenied] = useState(false);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);

    useEffect(() => {
        const checkTalentAccess = async () => {
            if (!user) { setHasTalentAccess(false); return; }
            try {
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('yetenek_alani, role, is_admin, resim_analiz_hakki')
                    .eq('id', user.id)
                    .maybeSingle();

                if (error || !profile) { setHasTalentAccess(false); return; }
                if (profile.is_admin || profile.role === 'teacher') {
                    setHasTalentAccess(true); setIsTeacher(true); setAnalysisQuota(999); return;
                }

                setAnalysisQuota(profile.resim_analiz_hakki ?? 3);
                const talentsInput = profile.yetenek_alani;
                let talents: string[] = [];
                if (Array.isArray(talentsInput)) { talents = talentsInput; }
                else if (typeof talentsInput === 'string') { talents = talentsInput.split(/[,,;]/).map(t => t.trim()).filter(Boolean); }
                setUserTalents(talents);
                setHasTalentAccess(talents.some(t => t.toLowerCase() === 'resim'));
            } catch (error) {
                console.error('Yetenek kontrolü hatası:', error);
                setHasTalentAccess(false);
            }
        };
        checkTalentAccess();
    }, [user]);

    const steps = [
        { icon: <Eye strokeWidth={2.5} size={28} />, title: "Görsel Algı", desc: "Detayları fark etme ve görsel hafızayı güçlendirme.", color: "bg-cyber-blue/10 border-cyber-blue/20 text-cyber-blue" },
        { icon: <Layout strokeWidth={2.5} size={28} />, title: "Kompozisyon", desc: "Dengeli ve etkileyici sahneler kurgulama yeteneği.", color: "bg-cyber-gold/10 border-cyber-gold/20 text-cyber-gold" },
        { icon: <PenTool strokeWidth={2.5} size={28} />, title: "Yaratıcı Çizim", desc: "Hayal gücünü kağıda dökme ve özgünlük geliştirme.", color: "bg-cyber-emerald/10 border-cyber-emerald/20 text-cyber-emerald" },
    ];

    if (showAccessDenied) {
        return (
            <AccessDeniedScreen
                requiredTalent="Resim"
                backLink="/atolyeler/resim"
                backLabel="Resim Atölyesine Dön"
                userTalents={userTalents.length > 0 ? userTalents : undefined}
                requiredIncludes={['resim']}
                onBack={() => { setShowAccessDenied(false); window.scrollTo(0, 0); }}
            />
        );
    }

    if (isActive) {
        return (
            <div className="pt-24 pb-12 px-6 min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-800 transition-colors duration-300">
                <ResimGame onBack={() => setIsActive(false)} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-800 pt-24 pb-12 px-6 relative overflow-hidden transition-colors duration-300">
            <Helmet>
                <title>Resim AI Atölyesi | BİLSEM Görsel Sanatlar Yetenek Testi</title>
                <meta name="description" content="Yapay zeka destekli görsel sanatlar yetenek değerlendirmesi. AI tarafından üretilen natürmort analizi, kompozisyon ve yaratıcı çizim becerileri testi. BİLSEM hazırlık için ideal." />
                <link rel="canonical" href="https://bilsemc2.com/atolyeler/resim" />
            </Helmet>

            <div className="fixed inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(0,0,0,0.15)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

            <div className="container mx-auto max-w-6xl relative z-10">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-8 mb-20">
                    <Link to="/"
                        className="inline-flex items-center gap-2 text-black dark:text-white font-nunito font-extrabold uppercase text-xs tracking-widest bg-white dark:bg-slate-800 border-2 border-black/10 rounded-xl px-4 py-2 shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-md transition-all mb-6">
                        <ChevronLeft size={14} strokeWidth={3} /> Ana Sayfa
                    </Link>

                    <div className="flex items-center justify-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20 }}
                            className="p-5 bg-cyber-pink/10 border-3 border-cyber-pink/30 rounded-2xl"
                        >
                            <Palette size={56} className="text-cyber-pink" strokeWidth={2.5} />
                        </motion.div>
                    </div>

                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-nunito font-extrabold text-black dark:text-white tracking-tight uppercase leading-none">
                        Resim <span className="text-cyber-pink">Atölyesi</span>
                    </h1>

                    <p className="text-xl lg:text-2xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed font-nunito font-bold">
                        Sanatsal yaratıcılığını keşfet! Görsel zekanı geliştirerek dünyayı farklı bir bakış açısıyla görmeye başla.
                    </p>
                </motion.div>

                {/* Video */}
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-20">
                    <div className="bg-white dark:bg-slate-800 border-3 border-black/10 rounded-2xl overflow-hidden shadow-neo-md max-w-4xl mx-auto">
                        <div className="h-2 bg-cyber-pink" />
                        <div className="p-6 lg:p-8">
                            <h3 className="text-2xl font-nunito font-extrabold text-black dark:text-white mb-5 text-center uppercase tracking-tight">
                                🎨 Atölyemizi Tanıyın
                            </h3>
                            <div className="relative w-full aspect-video border-2 border-black/10 rounded-xl overflow-hidden">
                                <iframe src="https://www.youtube.com/embed/Xe-Fwr5t9Fg" title="Resim Atölyesi Tanıtım"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen className="absolute inset-0 w-full h-full" />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Features */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
                    {steps.map((step, i) => (
                        <motion.div key={i}
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            whileHover={{ y: -6 }}
                            className="bg-white dark:bg-slate-800 p-7 border-3 border-black/10 rounded-2xl shadow-neo-sm hover:shadow-neo-md transition-all duration-300 flex flex-col items-center text-center group">
                            <div className={`w-16 h-16 border-2 flex items-center justify-center mb-5 rounded-xl group-hover:scale-110 transition-transform ${step.color}`}>
                                {step.icon}
                            </div>
                            <h3 className="text-xl font-nunito font-extrabold mb-3 text-black dark:text-white uppercase tracking-tight">{step.title}</h3>
                            <p className="text-slate-500 dark:text-slate-400 font-nunito font-bold text-sm leading-relaxed">{step.desc}</p>
                        </motion.div>
                    ))}
                </div>

                {/* CTA */}
                <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    className="mt-16 bg-cyber-pink border-3 border-black/10 rounded-2xl overflow-hidden shadow-neo-lg relative">
                    <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(0,0,0,0.15)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
                    <div className="relative z-10 p-8 sm:p-12 lg:p-16 text-center space-y-8">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-nunito font-extrabold text-white uppercase tracking-tight leading-none">
                            Sanat Yolculuğuna <br className="hidden md:block" /> Hemen Başla
                        </h2>

                        <p className="text-lg lg:text-xl text-white/80 font-nunito font-bold max-w-2xl mx-auto">
                            Hayal gücünü gerçeğe dönüştürmek için ihtiyacın olan her şey burada.
                            Yapay zeka destekli öğretmenimizle sanatsal gelişimini destekliyoruz.
                        </p>

                        {hasTalentAccess === null ? (
                            <div className="flex items-center justify-center gap-3 py-4">
                                <div className="animate-spin rounded-full h-6 w-6 border-3 border-white border-b-transparent" />
                                <span className="text-white font-nunito font-extrabold text-sm uppercase">Kontrol ediliyor...</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-5">
                                {hasTalentAccess && !isTeacher && analysisQuota !== null && (
                                    <div className="bg-white border-2 border-black/10 px-5 py-2.5 rounded-xl shadow-neo-sm">
                                        <p className="text-black font-nunito font-extrabold text-sm uppercase">
                                            Kalan Analiz Hakkı:
                                            <span className={`ml-2 font-extrabold text-xl ${analysisQuota > 0 ? 'text-cyber-pink' : 'text-red-500'}`}>
                                                {analysisQuota}
                                            </span>
                                        </p>
                                    </div>
                                )}
                                <button
                                    onClick={() => {
                                        if (!user) { setShowLoginPrompt(true); }
                                        else if (hasTalentAccess) { setIsActive(true); window.scrollTo(0, 0); }
                                        else { window.scrollTo(0, 0); setShowAccessDenied(true); }
                                    }}
                                    className="group inline-flex items-center justify-center gap-3 px-10 py-5 bg-white text-black font-nunito font-extrabold text-xl uppercase tracking-wider border-2 border-black/10 rounded-xl shadow-neo-md hover:-translate-y-1 hover:shadow-neo-lg transition-all">
                                    Atölyeye Gir <Rocket strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" size={22} />
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>



            {showLoginPrompt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-4">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="bg-white dark:bg-slate-800 border-3 border-black/10 rounded-2xl overflow-hidden shadow-neo-lg p-8 max-w-md w-full text-center relative">
                        <div className="h-2 bg-cyber-pink -mx-8 -mt-8 mb-6" />
                        <button onClick={() => setShowLoginPrompt(false)}
                            className="absolute top-4 right-4 w-8 h-8 bg-gray-100 dark:bg-slate-700 border-2 border-black/10 rounded-lg flex items-center justify-center hover:scale-110 transition-transform">
                            <X size={16} strokeWidth={3} />
                        </button>

                        <div className="w-16 h-16 bg-cyber-pink/10 border-2 border-cyber-pink/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
                            <LogIn className="w-8 h-8 text-cyber-pink" strokeWidth={2.5} />
                        </div>

                        <h2 className="text-2xl font-nunito font-extrabold text-black dark:text-white mb-3 uppercase tracking-tight">
                            Giriş Yapmanız Gerekiyor
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-6 font-nunito font-bold text-sm leading-relaxed">
                            Resim Atölyesi'ne erişmek için lütfen giriş yapın veya yeni bir hesap oluşturun.
                        </p>

                        <div className="flex flex-col gap-3">
                            <button onClick={() => navigate('/login', { state: { from: '/atolyeler/resim' } })}
                                className="w-full py-3.5 bg-cyber-pink text-white font-nunito font-extrabold text-sm uppercase tracking-wider border-2 border-black/10 rounded-xl shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-md transition-all flex items-center justify-center gap-2">
                                <LogIn strokeWidth={2.5} size={18} /> Giriş Yap
                            </button>
                            <button onClick={() => navigate('/signup')}
                                className="w-full py-3.5 bg-gray-50 dark:bg-slate-700 text-black dark:text-white font-nunito font-extrabold text-sm uppercase tracking-wider border-2 border-black/10 rounded-xl shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-md transition-all">
                                Yeni Hesap Oluştur
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default ResimPage;
