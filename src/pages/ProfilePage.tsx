import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import EditProfileModal from '../components/EditProfileModal';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
    Gift, Zap, Sparkles, Ticket, Mail, BarChart3
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile, QuizStats, ClassStudent } from '@/types/profile';
import { calculateLevelInfo, getLevelBadge, getLevelTitle } from '@/utils/levelCalculator';
import ReferralSystem from '@/components/profile/ReferralSystem';
import { showXPEarn } from '@/components/XPToast';
import UserMessages from '@/components/UserMessages';
import TimeXPGain from '@/components/profile/TimeXPGain';
import UserGameStats from '@/components/profile/UserGameStats';

// Extracted Sub-Components
import QuickAccessSection from '@/components/profile/QuickAccessSection';
import TalentWorkshopsSection from '@/components/profile/TalentWorkshopsSection';
import ExamResultSection from '@/components/profile/ExamResultSection';
import AchievementsSection from '@/components/profile/AchievementsSection';
import LiveLessonBooking from '@/components/profile/LiveLessonBooking';

export const ProfilePage: React.FC = () => {
    const { user, profile, refreshProfile } = useAuth();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showReferral, setShowReferral] = useState(false);
    const [promoCode, setPromoCode] = useState('');
    const [isRedeeming, setIsRedeeming] = useState(false);

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
            const { data: codeData, error: codeError } = await supabase
                .from('promo_codes')
                .select('*')
                .eq('code', promoCode.trim().toUpperCase())
                .maybeSingle();

            if (codeError || !codeData) {
                toast.error('Bu kod galiba paralel evrenden gelmiş, bizim sistemde kaydı yok! 🛸');
                return;
            }
            if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
                toast.error('Tüh! Bu kodun son kullanma tarihi geçmiş, antika olmuş! 🏺');
                return;
            }
            if (codeData.current_uses >= codeData.max_uses) {
                toast.error('Hızlı olan kazanır! Bu kodun tüm ödülleri çoktan kapışılmış... 🏃‍♂️💨');
                return;
            }
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
            const { error: usageError } = await supabase
                .from('promo_code_usage')
                .insert([{ promo_code_id: codeData.id, student_id: user.id }]);

            if (usageError) throw usageError;

            const newXP = (profile?.experience || 0) + codeData.xp_reward;
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ experience: newXP })
                .eq('id', user.id);

            if (profileError) throw profileError;

            await supabase
                .from('promo_codes')
                .update({ current_uses: codeData.current_uses + 1 })
                .eq('id', codeData.id);

            await refreshProfile();

            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#6366f1', '#ec4899', '#8b5cf6', '#FACC15']
            });

            showXPEarn(codeData.xp_reward, `${codeData.code} Promo Kodu Bonusunuz!`);
            setPromoCode('');
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
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl" />
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
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

                        <div className="text-center md:text-right">
                            <div className="flex items-center justify-center md:justify-end gap-2 mb-2">
                                <Zap className="w-8 h-8 text-yellow-400" fill="currentColor" />
                                <span className="text-4xl md:text-5xl font-black bg-gradient-to-r from-yellow-300 via-orange-400 to-pink-500 bg-clip-text text-transparent">
                                    {userData.experience || 0}
                                </span>
                                <span className="text-xl text-yellow-300/80 font-medium">XP</span>
                            </div>
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

                {/* Extracted Sections */}
                <LiveLessonBooking />
                <QuickAccessSection />
                <TalentWorkshopsSection userData={userData} />
                <ExamResultSection lastExamSession={lastExamSession} />

                {/* Mesajlarım */}
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

                {/* Canlı Ders Al */}


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

                        {/* Promo Kodu */}
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

                        {/* Arkadaş Davet */}
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

                {/* Başarımlar */}
                <AchievementsSection currentLevel={quizStats.currentLevel} />
            </div>
        </div>
    );
};

export default ProfilePage;
