import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Music, Rocket, X, Brain, Sparkles, Waves, Headphones, Target, Zap, ChevronLeft, LogIn } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import AccessDeniedModal from '../../components/AccessDeniedModal';

const MuzikPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [hasMusicTalent, setHasMusicTalent] = useState<boolean | null>(null);
    const [userTalents, setUserTalents] = useState<string[]>([]);
    const [showTalentWarning, setShowTalentWarning] = useState(false);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);

    // AI Özellikleri
    const aiFeatures = [
        {
            icon: <Brain className="w-8 h-8" />,
            title: "Akıllı Pitch Algılama",
            desc: "Yapay zeka ile gerçek zamanlı nota tanıma ve frekans analizi",
            color: "from-violet-500 to-purple-600"
        },
        {
            icon: <Waves className="w-8 h-8" />,
            title: "Ritim Analizi",
            desc: "ML algoritmaları ile tempo ve ritim paterni değerlendirmesi",
            color: "from-cyan-500 to-blue-600"
        },
        {
            icon: <Target className="w-8 h-8" />,
            title: "Kişisel Geri Bildirim",
            desc: "Performansına özel AI destekli değerlendirme raporları",
            color: "from-emerald-500 to-teal-600"
        },
    ];

    // Test Modülleri
    const testModules = [
        { icon: "🎵", title: "Tek Nota", desc: "Temel nota tanıma" },
        { icon: "🎶", title: "İki Nota", desc: "Aralık algısı" },
        { icon: "🎼", title: "Üç Nota", desc: "Akor duyma" },
        { icon: "🥁", title: "Ritim", desc: "Tempo algısı" },
        { icon: "🎹", title: "Melodi", desc: "Melodi hafızası" },
        { icon: "🎤", title: "Şarkı", desc: "Performans" },
    ];

    // Kullanıcının yetenek alanını kontrol et
    useEffect(() => {
        const checkTalent = async () => {
            if (!user) return;

            const { data: profile } = await supabase
                .from('profiles')
                .select('yetenek_alani, is_admin, role')
                .eq('id', user.id)
                .single();

            if (profile) {
                if (profile.is_admin || profile.role === 'teacher') {
                    setHasMusicTalent(true);
                    return;
                }

                const talentsInput = profile.yetenek_alani;
                let talents: string[] = [];

                if (Array.isArray(talentsInput)) {
                    talents = talentsInput;
                } else if (typeof talentsInput === 'string') {
                    talents = talentsInput.split(/[,;]/).map(t => t.trim()).filter(Boolean);
                }

                setUserTalents(talents);
                const hasTalent = talents.some(t => t.toLowerCase() === 'müzik');
                setHasMusicTalent(hasTalent);
            }
        };

        checkTalent();
    }, [user]);

    const handleStart = () => {
        // Önce giriş kontrolü
        if (!user) {
            setShowLoginPrompt(true);
            return;
        }

        if (hasMusicTalent === false) {
            setShowTalentWarning(true);
            return;
        }

        // Doğrudan workshop'a yönlendir (AudioContext orada başlatılacak)
        navigate("/atolyeler/muzik/single-note");
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-[#0a0a1a]">
            {/* SEO Meta Tags */}
            <Helmet>
                <title>Müzik AI Atölyesi | BİLSEM Yetenek Testi - Yapay Zeka Destekli Değerlendirme</title>
                <meta name="description" content="Yapay zeka destekli müzik yetenek testi. Gerçek zamanlı pitch algılama, ritim analizi ve kişisel geri bildirim ile müzikal yeteneklerinizi keşfedin. BİLSEM hazırlık için ideal." />
                <meta name="keywords" content="müzik yetenek testi, BİLSEM müzik, pitch algılama, ritim testi, müzik eğitimi, yapay zeka müzik" />
                <link rel="canonical" href="https://bilsemc2.com/atolyeler/muzik" />

                {/* Open Graph */}
                <meta property="og:type" content="website" />
                <meta property="og:title" content="Müzik AI Atölyesi | BİLSEM Yetenek Testi" />
                <meta property="og:description" content="Yapay zeka destekli müzik yetenek değerlendirmesi. Pitch algılama, ritim analizi ve kişisel geri bildirim." />
                <meta property="og:url" content="https://bilsemc2.com/atolyeler/muzik" />
                <meta property="og:image" content="https://bilsemc2.com/og-muzik-atolyesi.jpg" />

                {/* Twitter Card */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Müzik AI Atölyesi | BİLSEM" />
                <meta name="twitter:description" content="AI destekli müzik yeteneği değerlendirmesi" />

                {/* Structured Data - Course Schema */}
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Course",
                        "name": "Müzik AI Atölyesi",
                        "description": "Yapay zeka destekli müzik yetenek değerlendirme programı. Pitch algılama, ritim analizi ve kişisel geri bildirim.",
                        "provider": {
                            "@type": "EducationalOrganization",
                            "name": "BilsemC2",
                            "url": "https://bilsemc2.com"
                        },
                        "educationalLevel": "İlkokul - Ortaokul",
                        "inLanguage": "tr",
                        "isAccessibleForFree": false,
                        "audience": {
                            "@type": "EducationalAudience",
                            "educationalRole": "student",
                            "audienceType": "BİLSEM adayları"
                        },
                        "hasCourseInstance": {
                            "@type": "CourseInstance",
                            "courseMode": "online",
                            "courseWorkload": "PT30M"
                        },
                        "teaches": ["Pitch algılama", "Ritim analizi", "Müzikal hafıza", "Nota tanıma"]
                    })}
                </script>
            </Helmet>
            {/* Animated Background */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/50 via-slate-950 to-purple-950/50" />
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-600/5 rounded-full blur-[150px]" />
            </div>

            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

            {/* Content */}
            <div className="relative z-10 py-20 px-6">
                <div className="max-w-6xl mx-auto">

                    {/* Back Link */}
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-indigo-400 font-bold hover:text-indigo-300 transition-colors mb-8 uppercase text-xs tracking-widest"
                    >
                        <ChevronLeft size={16} />
                        Ana Sayfa
                    </Link>

                    {/* Hero Section */}
                    <motion.div
                        initial={{ opacity: 0, y: -30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center space-y-8 mb-20"
                    >
                        {/* AI Badge */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                            className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-full border border-indigo-500/30 backdrop-blur-sm"
                        >
                            <Brain className="w-5 h-5 text-indigo-400" />
                            <span className="text-sm font-bold text-indigo-300 uppercase tracking-widest">
                                Yapay Zeka Destekli
                            </span>
                            <Sparkles className="w-5 h-5 text-purple-400" />
                        </motion.div>

                        {/* Title */}
                        <div className="space-y-4">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                                className="inline-block p-5 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl text-white shadow-2xl shadow-indigo-500/30"
                            >
                                <Music size={52} />
                            </motion.div>

                            <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tight">
                                Müzik <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">AI</span> Atölyesi
                            </h1>

                            <p className="text-xl lg:text-2xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
                                <span className="text-indigo-400 font-semibold">Yapay zeka</span> ile müzikal yeteneklerini keşfet.
                                Gerçek zamanlı ses analizi ve kişiselleştirilmiş geri bildirimlerle gelişimini takip et.
                            </p>
                        </div>
                    </motion.div>

                    {/* AI Features Grid */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
                    >
                        {aiFeatures.map((feature, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + i * 0.1 }}
                                whileHover={{ y: -8, scale: 1.02 }}
                                className="relative group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity blur-xl -z-10"
                                    style={{ background: `linear-gradient(to right, var(--tw-gradient-stops))` }} />
                                <div className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 hover:border-indigo-500/50 transition-all h-full">
                                    <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg`}>
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                                    <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Test Modules Preview */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mb-16"
                    >
                        <h2 className="text-2xl font-bold text-white text-center mb-8">
                            <Headphones className="inline-block w-6 h-6 mr-2 text-indigo-400" />
                            AI Test Modülleri
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {testModules.map((module, i) => (
                                <motion.div
                                    key={i}
                                    whileHover={{ scale: 1.05 }}
                                    className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 text-center hover:border-indigo-500/30 transition-all cursor-default"
                                >
                                    <span className="text-3xl block mb-2">{module.icon}</span>
                                    <h4 className="text-white font-bold text-sm">{module.title}</h4>
                                    <p className="text-slate-500 text-xs">{module.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* YouTube Video */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="mb-16"
                    >
                        <div className="bg-white/5 backdrop-blur-xl p-6 lg:p-8 rounded-3xl border border-white/10 max-w-4xl mx-auto">
                            <h3 className="text-xl font-bold text-white mb-6 text-center flex items-center justify-center gap-2">
                                <Zap className="w-5 h-5 text-yellow-400" />
                                Atölyemizi Tanıyın
                            </h3>
                            <div className="relative w-full aspect-video rounded-2xl overflow-hidden">
                                <iframe
                                    src="https://www.youtube.com/embed/eCBx2n-FOCg"
                                    title="Müzik AI Atölyesi Tanıtım"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="absolute inset-0 w-full h-full"
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* CTA Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20 rounded-[3rem] blur-3xl" />
                        <div className="relative bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl rounded-[3rem] border border-white/10 p-12 lg:p-16 text-center">
                            <div className="space-y-8">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/20 rounded-full border border-indigo-500/30">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    <span className="text-sm font-bold text-indigo-300">AI Motoru Aktif</span>
                                </div>

                                <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                                    Müzikal Zekanı <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                                        AI ile Keşfet
                                    </span>
                                </h2>

                                <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                                    Yapay zeka destekli ses analizi ile notaları algıla, ritimleri hisset ve
                                    performansını gerçek zamanlı değerlendir.
                                </p>

                                <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                                    <button
                                        onClick={handleStart}
                                        className="group relative inline-flex items-center justify-center gap-3 px-12 py-5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-black text-xl rounded-2xl hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 transform hover:-translate-y-1 active:scale-95 overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                        <span className="relative flex items-center gap-3">
                                            <Brain className="w-6 h-6" />
                                            AI Testi Başlat
                                            <Rocket className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                        </span>
                                    </button>

                                    <Link
                                        to="/contact"
                                        className="px-8 py-4 text-slate-400 font-bold hover:text-indigo-400 transition-colors"
                                    >
                                        Daha Fazla Bilgi →
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Yetenek Alanı Uyarı Modal */}
            <AccessDeniedModal
                isOpen={showTalentWarning}
                onClose={() => setShowTalentWarning(false)}
                workshopName="Müzik AI Atölyesi"
                requiredTalent="Müzik"
                userTalents={userTalents.length > 0 ? userTalents : undefined}
                accentColor="indigo"
            />

            {/* Giriş Yapma Uyarı Modal */}
            {showLoginPrompt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl border border-white/10 shadow-2xl p-8 max-w-md w-full text-center relative"
                    >
                        <button
                            onClick={() => setShowLoginPrompt(false)}
                            className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>

                        <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <LogIn className="w-10 h-10 text-indigo-400" />
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-4">
                            Giriş Yapmanız Gerekiyor
                        </h2>

                        <p className="text-white/70 mb-6 leading-relaxed">
                            Müzik AI Atölyesi'ne erişmek için lütfen giriş yapın veya yeni bir hesap oluşturun.
                        </p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => navigate('/login', { state: { from: '/atolyeler/muzik' } })}
                                className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                            >
                                <LogIn size={18} />
                                Giriş Yap
                            </button>
                            <button
                                onClick={() => navigate('/signup')}
                                className="w-full py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/10"
                            >
                                Yeni Hesap Oluştur
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default MuzikPage;
