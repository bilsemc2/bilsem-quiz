import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import EditProfileModal from '../components/EditProfileModal';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
    Gift, Zap, ChevronRight, Sparkles, Trophy, Star, Flame, Crown, Lock, Brain, Tablet, Gamepad2, Mail, Music, Palette, Ticket, BarChart3, TrendingUp
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile, QuizStats, ClassStudent } from '@/types/profile';
import { calculateLevelInfo, getLevelBadge, getLevelTitle } from '@/utils/levelCalculator';
import ReferralSystem from '@/components/profile/ReferralSystem';
import { showXPEarn } from '@/components/XPToast';
import UserMessages from '@/components/UserMessages';
import TimeXPGain from '@/components/profile/TimeXPGain';
import UserGameStats from '@/components/profile/UserGameStats';


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
        id: 'arcade',
        title: 'BİLSEM Zeka',
        description: 'Jeton at, oyununa başla!',
        icon: Gamepad2,
        color: 'from-purple-500 to-indigo-500',
        link: '/bilsem-zeka'
    },
    /*{
        id: 'quizizz',
        title: 'Quizizz Kodları',
        description: 'VIP quiz kodları',
        icon: Ticket,
        color: 'from-amber-500 to-orange-500',
        link: '/quizizz-kodlari'
    },*/
];

export const ProfilePage: React.FC = () => {
    const { user, profile, refreshProfile } = useAuth();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showReferral, setShowReferral] = useState(false);
    const [promoCode, setPromoCode] = useState('');
    const [isRedeeming, setIsRedeeming] = useState(false);

    // Son tamamlanmış sınav - Supabase'den çekilir
    const [lastExamSession, setLastExamSession] = useState<{
        bzp_score: number | null;
        final_score: number;
        results: Array<{ passed: boolean; score: number; maxScore: number; level: number; moduleTitle?: string; moduleId?: string }>;
        completed_at: string;
    } | null>(null);
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
                .select(`*, class_students!left(classes: class_id(id, name, grade))`)
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

            // Son tamamlanmış sınavı çek
            const { data: examData } = await supabase
                .from('exam_sessions')
                .select('bzp_score, final_score, results, completed_at')
                .eq('user_id', user.id)
                .not('completed_at', 'is', null)
                .order('completed_at', { ascending: false })
                .limit(1)
                .single();

            if (examData) {
                setLastExamSession(examData);
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
        } catch {
            toast.error('Referans kodu oluşturulamadı.');
        }
    };

    const handleRedeemCode = async () => {
        if (!user || !promoCode.trim()) return;
        setIsRedeeming(true);

        try {
            // 1. Kodu kontrol et
            const { data: codeData, error: codeError } = await supabase
                .from('promo_codes')
                .select('*')
                .eq('code', promoCode.trim().toUpperCase())
                .maybeSingle();

            if (codeError || !codeData) {
                toast.error('Bu kod galiba paralel evrenden gelmiş, bizim sistemde kaydı yok! 🛸');
                return;
            }
            // 2. Süre kontrolü
            if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
                toast.error('Tüh! Bu kodun son kullanma tarihi geçmiş, antika olmuş! 🏺');
                return;
            }
            // 3. Kullanım limiti kontrolü
            if (codeData.current_uses >= codeData.max_uses) {
                toast.error('Hızlı olan kazanır! Bu kodun tüm ödülleri çoktan kapışılmış... 🏃‍♂️💨');
                return;
            }
            // 4. Daha önce kullanılmış mı kontrol et
            const { data: usageData } = await supabase
                .from('promo_code_usage')
                .select('*')
                .eq('promo_code_id', codeData.id)
                .eq('student_id', user.id)
                .maybeSingle();

            if (usageData) {
                toast.error('Hafızan harika ama bu kodu zaten cebe indirdin! Başka maceralara yelken açma zamanı... 🏴‍☠️✨');
                return;
            }
            // 5. İşlemi gerçekleştir
            // Transaction benzeri bir akış (yetenek_alani'na göre XP ekleme)
            const { error: usageError } = await supabase
                .from('promo_code_usage')
                .insert([{ promo_code_id: codeData.id, student_id: user.id }]);

            if (usageError) throw usageError;

            // XP'yi güncelle
            const newXP = (profile?.experience || 0) + codeData.xp_reward;
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ experience: newXP })
                .eq('id', user.id);

            if (profileError) throw profileError;

            // Kullanım sayısını artır
            await supabase
                .from('promo_codes')
                .update({ current_uses: codeData.current_uses + 1 })
                .eq('id', codeData.id);

            // Global state'i tazele
            await refreshProfile();

            // Eğlenceli geri bildirim: Konfeti patlat!
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#6366f1', '#ec4899', '#8b5cf6', '#FACC15']
            });

            // Gerçek XP miktarını gösteren şık toast
            showXPEarn(codeData.xp_reward, `${codeData.code} Promo Kodu Bonusunuz!`);

            setPromoCode('');
            // local state update triggers level animation etc if handled by context
        } catch (error) {
            console.error('Promo code redemption error:', error);
            toast.error('Kod kullanılırken bir teknik sorun oluştu. 🛠️');
        } finally {
            setIsRedeeming(false);
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
                                <span className="text-4xl md:text-5xl font-black bg-gradient-to-r from-yellow-300 via-orange-400 to-pink-500 bg-clip-text text-transparent">
                                    {userData.experience || 0}
                                </span>
                                <span className="text-xl text-yellow-300/80 font-medium">XP</span>
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

                {/* Hızlı Erişim Butonları - ÖNCELİKLİ */}
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
                            className="group flex items-center gap-4 bg-gradient-to-br from-slate-800/90 to-slate-900/90 hover:from-slate-700/90 hover:to-slate-800/90 border border-white/10 hover:border-white/20 rounded-2xl p-5 transition-all shadow-lg"
                        >
                            <div className={`w-14 h-14 bg-gradient-to-r ${btn.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg`}>
                                <btn.icon className="w-7 h-7 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-white text-lg">{btn.title}</h3>
                                <p className="text-white/60 text-sm">{btn.description}</p>
                            </div>
                            <ChevronRight className="w-6 h-6 text-white/30 group-hover:text-white/60 group-hover:translate-x-1 transition-all" />
                        </Link>
                    ))}
                </motion.div>

                {/* Yetenek Alanına Göre Atölye Kısayolları */}
                {(userData.yetenek_alani) && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="mb-8"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
                                <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <h2 className="text-lg font-bold bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">Yetenek Atölyelerim</h2>
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
                                                className="group flex items-center gap-4 bg-slate-800/90 hover:bg-slate-700/90 border border-indigo-500/40 rounded-2xl p-5 transition-all"
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
                                                className="group flex items-center gap-4 bg-slate-800/90 hover:bg-slate-700/90 border border-emerald-500/40 rounded-2xl p-5 transition-all"
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
                                                className="group flex items-center gap-4 bg-slate-800/90 hover:bg-slate-700/90 border border-pink-500/40 rounded-2xl p-5 transition-all"
                                            >
                                                <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-pink-500/20">
                                                    <Palette className="w-7 h-7 text-white" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-white text-lg">Resim Atölyesi</h3>
                                                    <p className="text-pink-400/70 text-sm">Yaratıcılığını sergile</p>
                                                </div>
                                                {/* Analiz Hakkı Göstergesi */}
                                                {'resim_analiz_hakki' in userData && typeof userData.resim_analiz_hakki === 'number' && (
                                                    <div className="bg-pink-500/20 px-3 py-1.5 rounded-xl border border-pink-500/30">
                                                        <span className="text-xs text-pink-300">Analiz: </span>
                                                        <span className={`font-bold ${(userData as UserProfile & { resim_analiz_hakki?: number }).resim_analiz_hakki! > 0 ? 'text-pink-400' : 'text-rose-400'}`}>
                                                            {(userData as UserProfile & { resim_analiz_hakki?: number }).resim_analiz_hakki}
                                                        </span>
                                                    </div>
                                                )}
                                                <ChevronRight className="w-6 h-6 text-pink-500/50 group-hover:text-pink-400 group-hover:translate-x-1 transition-all" />
                                            </Link>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </motion.div>
                )}

                {/* Son Simülasyon Sonucum - Mesajların Üstünde */}
                {lastExamSession && lastExamSession.results.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="mb-8"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/30">
                                <TrendingUp className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold bg-gradient-to-r from-pink-300 to-rose-400 bg-clip-text text-transparent">Son Simülasyon Sonucum</h2>
                                <p className="text-pink-300/60 text-sm">Sınav Simülasyonu performansı</p>
                            </div>
                        </div>

                        <Link
                            to="/atolyeler/sinav-simulasyonu/sonuc"
                            className="block bg-gradient-to-r from-rose-600 to-red-700 rounded-2xl p-6 hover:shadow-xl hover:shadow-rose-500/20 transition-all group"
                        >
                            <div className="flex items-center gap-6">
                                {/* BZP Score - Veritabanından */}
                                <div className="text-center">
                                    <div className="text-5xl font-black text-white">
                                        {lastExamSession.bzp_score || lastExamSession.final_score}
                                    </div>
                                    <div className="text-rose-200 text-xs font-bold uppercase tracking-wider">
                                        {lastExamSession.bzp_score ? 'BZP' : 'Skor'}
                                    </div>
                                </div>

                                <div className="w-px h-16 bg-white/20" />

                                {/* Stats */}
                                <div className="flex-1 grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <div className="text-2xl font-black text-white">
                                            {lastExamSession.results.filter((r: { passed: boolean }) => r.passed).length}
                                        </div>
                                        <div className="text-rose-200 text-xs">Başarılı</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-black text-white">{lastExamSession.results.length}</div>
                                        <div className="text-rose-200 text-xs">Modül</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-black text-white">
                                            {lastExamSession.final_score}%
                                        </div>
                                        <div className="text-rose-200 text-xs">Başarı</div>
                                    </div>
                                </div>

                                {/* Arrow */}
                                <ChevronRight className="w-8 h-8 text-white/50 group-hover:text-white group-hover:translate-x-2 transition-all" />
                            </div>

                            {/* Gayret Gösterilecek Modüller */}
                            {lastExamSession.results.filter((r: { passed: boolean }) => !r.passed).length > 0 && (
                                <div className="mt-4 pt-4 border-t border-white/20">
                                    <p className="text-rose-200/80 text-xs font-medium mb-2">💪 Gayret Gösterilecek Modüller:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {lastExamSession.results
                                            .map((r, idx: number) => ({ ...r, idx }))
                                            .filter((r) => !r.passed)
                                            .map((r) => (
                                                <span key={r.idx} className="bg-white/20 text-white text-xs px-2 py-1 rounded-lg">
                                                    {r.moduleTitle || `Modül ${r.level}`}
                                                </span>
                                            ))}
                                    </div>
                                </div>
                            )}
                        </Link>
                    </motion.div>
                )}

                {/* Mesajlarım Bölümü */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18 }}
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

                        {/* Promo Kodu Gir Kartı */}
                        <div className="bg-slate-800/50 border border-violet-500/20 rounded-2xl p-5">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center">
                                    <Ticket className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-white">Promo Kodu Gir</h3>
                                    <p className="text-white/50 text-sm">Hediye kodunu kullan</p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={promoCode}
                                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                    placeholder="KODU BURAYA YAZIN"
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500 transition-colors uppercase"
                                />
                                <button
                                    onClick={handleRedeemCode}
                                    disabled={isRedeeming || !promoCode.trim()}
                                    className="bg-gradient-to-r from-violet-500 to-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100"
                                >
                                    {isRedeeming ? '...' : 'Gönder'}
                                </button>
                            </div>
                            <p className="mt-3 text-[10px] text-white/30 text-center">
                                Sosyal medya üzerinden paylaştığımız kodları burada değerlendirebilirsiniz.
                            </p>
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
                    </div>
                </motion.div>

                {/* Oyun İstatistiklerim */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                            <BarChart3 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">Oyun İstatistiklerim</h2>
                            <p className="text-cyan-300/60 text-sm">Zeka türü analizleri ve performans</p>
                        </div>
                    </div>
                    <UserGameStats />
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
                            <div className="w-10 h-10 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                                <Trophy className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">Başarımlar</h2>
                                <p className="text-amber-300/60 text-sm">XP kazan, rozet aç!</p>
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
