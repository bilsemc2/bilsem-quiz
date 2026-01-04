import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import EditProfileModal from '../components/EditProfileModal';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
    Gift, Zap, ChevronRight, Sparkles, Trophy, Star, Flame, Crown, Lock, Brain, Tablet, Gamepad2, Mail, Music, Palette
} from 'lucide-react';
import { UserProfile, QuizStats, ClassStudent } from '@/types/profile';
import { calculateLevelInfo, getLevelBadge, getLevelTitle } from '@/utils/levelCalculator';
import ReferralSystem from '@/components/profile/ReferralSystem';
import UserMessages from '@/components/UserMessages';
import TimeXPGain from '@/components/profile/TimeXPGain';


// Hızlı Erişim Butonları
const QUICK_ACCESS_BUTTONS = [
    {
        id: 'tablet',
        title: 'Tablet Değerlendirme',
        description: 'Hazırlık oyunları',
        icon: Tablet,
        color: 'from-blue-500 to-cyan-500',
        link: '/atolyeler/tablet-degerlendirme'
    },
    {
        id: 'quizizz',
        title: 'Quizizz Kodları',
        description: 'VIP quiz kodları',
        icon: Gamepad2,
        color: 'from-amber-500 to-orange-500',
        link: '/quizizz-kodlari'
    },
];

export const ProfilePage: React.FC = () => {
    const { user, profile } = useAuth();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showReferral, setShowReferral] = useState(false);
    const [userData, setUserData] = useState<UserProfile>({
        name: "",
        email: user?.email || "",
        school: "",
        grade: "",
        avatar_url: "",
        points: 0,
        experience: 0,
        referral_code: "",
        referral_count: 0,
        classes: [],
        yetenek_alani: ""
    });

    const [quizStats, setQuizStats] = useState<QuizStats>({
        totalQuizzes: 0,
        totalCorrect: 0,
        totalWrong: 0,
        averageScore: 0,
        levelProgress: 0,
        currentLevel: 1,
        nextLevelXP: 100,
        currentXP: 0,
        levelBadge: "",
        levelTitle: ""
    });

    const fetchUserData = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const { data: profileData } = await supabase
                .from('profiles')
                .select(`*, class_students!left (classes:class_id (id, name, grade))`)
                .eq('id', user.id)
                .single();

            if (profileData) {
                const avatar_url = profileData.avatar_url ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.email || '')}`;

                const classes = (profileData.class_students as ClassStudent[] | null)
                    ?.filter((cs: ClassStudent) => cs.classes)
                    .map((cs: ClassStudent) => ({
                        id: cs.classes.id,
                        name: cs.classes.name,
                        grade: cs.classes.grade
                    }));

                const levelInfo = calculateLevelInfo(profileData.experience || 0);
                const levelBadge = getLevelBadge(levelInfo.currentLevel);
                const levelTitle = getLevelTitle(levelInfo.currentLevel);

                setUserData({ ...profileData, avatar_url, classes });
                setQuizStats(prev => ({
                    ...prev,
                    currentLevel: levelInfo.currentLevel,
                    levelProgress: levelInfo.levelProgress,
                    currentXP: levelInfo.currentXP,
                    nextLevelXP: levelInfo.nextLevelXP,
                    levelBadge,
                    levelTitle
                }));
            }
        } catch (err) {
            console.error('Exception in fetchUserData:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Keep stats in sync with global profile XP (from AuthContext)
    useEffect(() => {
        if (profile?.experience !== undefined) {
            const levelInfo = calculateLevelInfo(profile.experience);
            const levelBadge = getLevelBadge(levelInfo.currentLevel);
            const levelTitle = getLevelTitle(levelInfo.currentLevel);

            setUserData(prev => ({ ...prev, experience: profile.experience }));
            setQuizStats(prev => ({
                ...prev,
                currentLevel: levelInfo.currentLevel,
                levelProgress: levelInfo.levelProgress,
                currentXP: levelInfo.currentXP,
                nextLevelXP: levelInfo.nextLevelXP,
                levelBadge,
                levelTitle
            }));
        }
    }, [profile?.experience]);

    const generateReferralCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

    const updateReferralCode = async () => {
        if (!user) return;
        try {
            const newCode = generateReferralCode();
            await supabase.from('profiles').update({ referral_code: newCode }).eq('id', user.id);
            setUserData(prev => ({ ...prev, referral_code: newCode }));
            toast.success('Yeni referans kodunuz oluşturuldu!');
        } catch (error) {
            toast.error('Referans kodu oluşturulamadı.');
        }
    };

    useEffect(() => { if (user) fetchUserData(); }, [user]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto" />
                    <p className="text-white/60">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
            {/* Edit Modal */}
            {isEditModalOpen && (
                <EditProfileModal
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={fetchUserData}
                    userData={{ name: userData.name, grade: userData.grade, school: userData.school }}
                />
            )}

            <div className="container mx-auto px-4 py-8 max-w-6xl">
                {/* Hero Section - XP Kartı */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-3xl p-8 mb-8 overflow-hidden"
                >
                    {/* Background effects */}
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl" />
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        {/* Sol - Profil Bilgisi */}
                        <div className="flex items-center gap-5">
                            <div className="relative">
                                <img
                                    src={userData.avatar_url}
                                    alt="Avatar"
                                    className="w-20 h-20 rounded-2xl border-4 border-white/30 shadow-xl"
                                />
                                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                                    {quizStats.currentLevel}
                                </div>
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                                    {userData.name || 'Kullanıcı'}
                                </h1>
                                <p className="text-white/70 text-sm">{quizStats.levelTitle}</p>
                                <button
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="text-white/60 text-xs hover:text-white transition-colors mt-1"
                                >
                                    Profili Düzenle
                                </button>
                                {userData.yetenek_alani && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {(() => {
                                            const talentsInput = userData.yetenek_alani;
                                            let talents: string[] = [];
                                            if (Array.isArray(talentsInput)) {
                                                talents = talentsInput;
                                            } else if (typeof talentsInput === 'string') {
                                                talents = talentsInput.split(/[,,;]/).map(t => t.trim()).filter(Boolean);
                                            } else if (talentsInput) {
                                                talents = [String(talentsInput)];
                                            }

                                            return talents.map((talent, index) => (
                                                <span key={index} className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-white/20">
                                                    <Sparkles className="w-3 h-3 text-yellow-300" />
                                                    {talent}
                                                </span>
                                            ));
                                        })()}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sağ - XP Göstergesi */}
                        <div className="text-center md:text-right">
                            <div className="flex items-center justify-center md:justify-end gap-2 mb-2">
                                <Zap className="w-8 h-8 text-yellow-400" fill="currentColor" />
                                <span className="text-4xl md:text-5xl font-black text-white">
                                    {userData.experience || 0}
                                </span>
                                <span className="text-xl text-white/70 font-medium">XP</span>
                            </div>

                            {/* Level Progress */}
                            <div className="w-64 mx-auto md:mx-0">
                                <div className="flex justify-between text-xs text-white/60 mb-1">
                                    <span>Seviye {quizStats.currentLevel}</span>
                                    <span>Seviye {quizStats.currentLevel + 1}</span>
                                </div>
                                <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${quizStats.levelProgress}%` }}
                                        transition={{ duration: 1, delay: 0.3 }}
                                        className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                                    />
                                </div>
                                <p className="text-white/60 text-xs mt-1">
                                    {quizStats.nextLevelXP - quizStats.currentXP} XP kaldı
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Yetenek Alanına Göre Atölye Kısayolları */}
                {(userData.yetenek_alani) && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mb-8"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-yellow-400" />
                            </div>
                            <h2 className="text-lg font-bold text-white">Yetenek Atölyelerim</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {(() => {
                                const talentsInput = userData.yetenek_alani;
                                let talents: string[] = [];
                                if (Array.isArray(talentsInput)) {
                                    talents = talentsInput;
                                } else if (typeof talentsInput === 'string') {
                                    talents = talentsInput.split(/[,,;]/).map(t => t.trim()).filter(Boolean);
                                } else if (talentsInput) {
                                    talents = [String(talentsInput)];
                                }

                                const hasMusic = talents.some(t => t.toLowerCase().includes('müzik'));
                                const hasArt = talents.some(t => t.toLowerCase().includes('resim'));
                                const hasGeneral = talents.some(t => t.toLowerCase().includes('genel yetenek') || t.toLowerCase().includes('genel zihinsel'));

                                return (
                                    <>
                                        {hasGeneral && (
                                            <Link
                                                to="/atolyeler/bireysel-degerlendirme"
                                                className="group flex items-center gap-4 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-2xl p-5 transition-all"
                                            >
                                                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/20">
                                                    <Brain className="w-7 h-7 text-white" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-white text-lg">Bireysel Değerlendirme</h3>
                                                    <p className="text-indigo-400/70 text-sm">2. Aşama simülasyonları</p>
                                                </div>
                                                <ChevronRight className="w-6 h-6 text-indigo-500/50 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                                            </Link>
                                        )}
                                        {hasMusic && (
                                            <Link
                                                to="/atolyeler/muzik"
                                                className="group flex items-center gap-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-2xl p-5 transition-all"
                                            >
                                                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/20">
                                                    <Music className="w-7 h-7 text-white" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-white text-lg">Müzik Atölyesi</h3>
                                                    <p className="text-emerald-400/70 text-sm">Yetenek parkuruna katıl</p>
                                                </div>
                                                <ChevronRight className="w-6 h-6 text-emerald-500/50 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                                            </Link>
                                        )}
                                        {hasArt && (
                                            <Link
                                                to="/atolyeler/resim"
                                                className="group flex items-center gap-4 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 rounded-2xl p-5 transition-all"
                                            >
                                                <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-pink-500/20">
                                                    <Palette className="w-7 h-7 text-white" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-white text-lg">Resim Atölyesi</h3>
                                                    <p className="text-pink-400/70 text-sm">Yaratıcılığını sergile</p>
                                                </div>
                                                <ChevronRight className="w-6 h-6 text-pink-500/50 group-hover:text-pink-400 group-hover:translate-x-1 transition-all" />
                                            </Link>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </motion.div>
                )}

                {/* Hızlı Erişim Butonları */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8"
                >
                    {QUICK_ACCESS_BUTTONS.map((btn) => (
                        <Link
                            key={btn.id}
                            to={btn.link}
                            className="group flex items-center gap-4 bg-slate-800/70 hover:bg-slate-800 border border-white/10 hover:border-white/20 rounded-2xl p-5 transition-all"
                        >
                            <div className={`w-14 h-14 bg-gradient-to-r ${btn.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg`}>
                                <btn.icon className="w-7 h-7 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-white text-lg">{btn.title}</h3>
                                <p className="text-white/50 text-sm">{btn.description}</p>
                            </div>
                            <ChevronRight className="w-6 h-6 text-white/30 group-hover:text-white/60 group-hover:translate-x-1 transition-all" />
                        </Link>
                    ))}
                </motion.div>

                {/* Mesajlarım Bölümü */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Mail className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Mesajlarım</h2>
                            <p className="text-white/50 text-sm">Öğretmenlerinden gelen önemli duyurular</p>
                        </div>
                    </div>
                    <UserMessages userId={user?.id} />
                </motion.div>

                {/* DersimVar.com Reklamı */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-8"
                >
                    <a
                        href="https://dersimvar.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 hover:shadow-xl hover:shadow-indigo-500/20 transition-all group overflow-hidden relative"
                    >
                        <div className="absolute inset-0 bg-[url('/images/logoDv.webp')] bg-right bg-no-repeat bg-contain opacity-20 group-hover:opacity-30 transition-opacity" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded-full">REKLAM</span>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Özel Ders mi Arıyorsunuz?</h3>
                            <p className="text-white/80 mb-4">
                                Türkiye'nin en iyi öğretmenleriyle birebir online ders imkanı!
                            </p>
                            <div className="flex items-center gap-2 text-white font-semibold">
                                <span>dersimvar.com'u ziyaret et</span>
                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </a>
                </motion.div>

                {/* XP Kazanma Bölümü */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">XP Kazan</h2>
                            <p className="text-white/50 text-sm">Aktivitelere katıl, XP topla!</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="lg:col-span-2">
                            <TimeXPGain />
                        </div>

                        {/* Arkadaş Davet Et Kartı */}
                        <div className="bg-slate-800/50 border border-pink-500/20 rounded-2xl p-5">
                            <button
                                onClick={() => setShowReferral(!showReferral)}
                                className="w-full text-left group"
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Gift className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-white">Arkadaş Davet Et</h3>
                                        <p className="text-white/50 text-sm">Her davet için bonus</p>
                                    </div>
                                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                                        <Zap className="w-4 h-4" /> +50 XP
                                    </span>
                                </div>
                            </button>
                            {showReferral && (
                                <div className="mt-4 pt-4 border-t border-white/10">
                                    <ReferralSystem
                                        referralCode={userData.referral_code}
                                        referralCount={userData.referral_count}
                                        onGenerateCode={updateReferralCode}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Sosyal Medyadan XP Kazan Kartı */}
                        <div className="bg-slate-800/50 border border-indigo-500/20 rounded-2xl p-5">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
                                    <Zap className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-white">Sosyal Medyadan XP Kazan</h3>
                                    <p className="text-white/50 text-sm">Takip et, beğen, paylaş</p>
                                </div>
                                <span className="text-emerald-400 font-bold flex items-center gap-1">
                                    <Zap className="w-4 h-4" /> +50 XP
                                </span>
                            </div>

                            <div className="space-y-3">
                                <a href="https://youtube.com/@bilsemce" target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl p-3 transition-all">
                                    <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                        </svg>
                                    </div>
                                    <span className="text-white font-medium">@bilsemce</span>
                                </a>
                                <a href="https://instagram.com/bilsemce" target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-3 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/20 rounded-xl p-3 transition-all">
                                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-lg flex items-center justify-center">
                                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                        </svg>
                                    </div>
                                    <span className="text-white font-medium">@bilsemc2</span>
                                </a>
                            </div>

                            <div className="mt-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                                <p className="text-white/70 text-xs">
                                    <strong className="text-emerald-400">Nasıl?</strong> Beğen → Telefon son 4 hane yorum yaz → Paylaş → WhatsApp <strong className="text-emerald-400">0541 615 07 21</strong>'e e-postanı bildir
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>




                {/* Başarımlar Önizleme */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-8 bg-slate-800/50 border border-white/10 rounded-2xl p-6"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-xl flex items-center justify-center">
                                <Trophy className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Başarımlar</h2>
                                <p className="text-white/50 text-sm">XP kazan, rozet aç!</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        {[
                            { icon: Star, unlocked: quizStats.currentLevel >= 1, name: 'İlk Adım' },
                            { icon: Flame, unlocked: quizStats.currentLevel >= 5, name: '5. Seviye' },
                            { icon: Crown, unlocked: quizStats.currentLevel >= 10, name: '10. Seviye' },
                            { icon: Trophy, unlocked: false, name: 'Şampiyon' },
                        ].map((badge, idx) => (
                            <div
                                key={idx}
                                className={`relative flex flex-col items-center p-4 rounded-xl ${badge.unlocked
                                    ? 'bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border border-yellow-500/30'
                                    : 'bg-slate-700/30 border border-white/5'
                                    }`}
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${badge.unlocked
                                    ? 'bg-gradient-to-r from-yellow-500 to-amber-500'
                                    : 'bg-slate-600'
                                    }`}>
                                    {badge.unlocked ? (
                                        <badge.icon className="w-6 h-6 text-white" />
                                    ) : (
                                        <Lock className="w-5 h-5 text-white/30" />
                                    )}
                                </div>
                                <span className={`text-xs mt-2 ${badge.unlocked ? 'text-yellow-400' : 'text-white/30'}`}>
                                    {badge.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default ProfilePage;
