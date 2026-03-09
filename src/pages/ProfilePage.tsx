import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/auth/useAuth';
import EditProfileModal from '../components/EditProfileModal';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
    Gift, Zap, Sparkles, Ticket, Mail, BarChart3, Brain, ChevronRight, ShieldCheck, CheckCircle2, Lock as LockIcon, Languages
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile, QuizStats } from '@/types/profile';
import { calculateLevelInfo, getLevelBadge, getLevelTitle } from '@/utils/levelCalculator';
import ReferralSystem from '@/components/profile/ReferralSystem';
import { showXPEarn } from '@/components/xpToastService';
import UserMessages from '@/components/UserMessages';
import TimeXPGain from '@/components/profile/TimeXPGain';
import UserGameStats from '@/components/profile/UserGameStats';
import { loadProfilePageData, redeemPromoCode, refreshReferralCode } from '@/features/profile/model/profileUseCases';

// Extracted Sub-Components
import QuickAccessSection from '@/components/profile/QuickAccessSection';
import TalentWorkshopsSection from '@/components/profile/TalentWorkshopsSection';
import ExamResultSection from '@/components/profile/ExamResultSection';
import AchievementsSection from '@/components/profile/AchievementsSection';
import LiveLessonBooking from '@/components/profile/LiveLessonBooking';
import MusicReportCard from '@/components/profile/MusicReportCard';

// ═══════════════════════════════════════════════
// 👤 ProfilePage — Kid-UI Çocuk Dostu Tasarım
// ═══════════════════════════════════════════════

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

    const fetchUserData = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const { userData: nextUserData, lastExamSession: nextExamSession } = await loadProfilePageData({
                userId: user.id,
                userEmail: user.email || ''
            });

            if (nextUserData) {
                const levelInfo = calculateLevelInfo(nextUserData.experience || 0);
                const levelBadge = getLevelBadge(levelInfo.currentLevel);
                const levelTitle = getLevelTitle(levelInfo.currentLevel);

                setUserData(nextUserData);
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

            if (nextExamSession) {
                setLastExamSession(nextExamSession);
            }
        } catch (err) {
            console.error('Exception in fetchUserData:', err);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

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

    const updateReferralCode = async () => {
        if (!user) return;
        const newCode = await refreshReferralCode({ userId: user.id });
        if (newCode) {
            setUserData(prev => ({ ...prev, referral_code: newCode }));
            toast.success('Yeni referans kodunuz oluşturuldu!');
        } else {
            toast.error('Referans kodu oluşturulamadı.');
        }
    };

    const handleRedeemCode = async () => {
        if (!user || !promoCode.trim()) return;
        setIsRedeeming(true);

        try {
            const result = await redeemPromoCode({
                userId: user.id,
                promoCode,
                currentExperience: profile?.experience || userData.experience || 0
            });

            if (result.status !== 'success') {
                if (result.status === 'not_found') {
                    toast.error('Bu kod galiba paralel evrenden gelmiş, bizim sistemde kaydı yok! 🛸');
                } else if (result.status === 'expired') {
                    toast.error('Tüh! Bu kodun son kullanma tarihi geçmiş, antika olmuş! 🏺');
                } else if (result.status === 'usage_limit') {
                    toast.error('Hızlı olan kazanır! Bu kodun tüm ödülleri çoktan kapışılmış... 🏃‍♂️💨');
                } else if (result.status === 'already_used') {
                    toast.error('Hafızan harika ama bu kodu zaten cebe indirdin! Başka maceralara yelken açma zamanı... 🏴‍☠️✨');
                } else if (result.status === 'error') {
                    toast.error('Kod kullanılırken bir teknik sorun oluştu. 🛠️');
                    console.error('Promo code redemption error:', result.message);
                } else {
                    toast.error('Kod kullanılırken bir teknik sorun oluştu. 🛠️');
                }
                return;
            }

            await refreshProfile();
            setUserData((prev) => ({ ...prev, experience: result.newXP }));

            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#6366f1', '#ec4899', '#8b5cf6', '#FACC15']
            });

            showXPEarn(result.xpReward, `${result.code} Promo Kodu Bonusunuz!`);
            setPromoCode('');
        } catch (error) {
            console.error('Promo code redemption error:', error);
            toast.error('Kod kullanılırken bir teknik sorun oluştu. 🛠️');
        } finally {
            setIsRedeeming(false);
        }
    };

    useEffect(() => { if (user) fetchUserData(); }, [fetchUserData, user]);

    /* ── Section header helper ── */
    const SectionHeader = ({ icon: Icon, iconBg, title, subtitle }: { icon: React.ElementType; iconBg: string; title: string; subtitle: string }) => (
        <div className="flex items-center gap-3 mb-5">
            <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>
                <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
                <h2 className="font-nunito text-xl font-extrabold text-black dark:text-white tracking-tight">{title}</h2>
                <p className="text-slate-500 dark:text-slate-400 font-nunito font-bold text-xs">{subtitle}</p>
            </div>
        </div>
    );

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center transition-colors duration-300">
                <div className="text-center space-y-3">
                    <div className="w-12 h-12 border-3 border-black/10 border-t-cyber-emerald rounded-full animate-spin mx-auto" />
                    <p className="text-black dark:text-white font-nunito font-extrabold text-sm">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-12 transition-colors duration-300">
            {/* Dot Pattern */}
            <div className="fixed inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(0,0,0,0.15)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

            {isEditModalOpen && (
                <EditProfileModal
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={fetchUserData}
                    userData={{ name: userData.name, grade: userData.grade, school: userData.school }}
                />
            )}

            <div className="container mx-auto px-4 py-8 max-w-6xl relative z-10">
                {/* Hero Section — XP Kartı */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl overflow-hidden mb-6 shadow-neo-lg"
                >
                    {/* Accent Strip */}
                    <div className="h-2.5 bg-cyber-pink" />

                    <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <img
                                    src={userData.avatar_url}
                                    alt="Avatar"
                                    className="w-16 h-16 rounded-2xl border-3 border-black/10 shadow-neo-sm bg-white object-cover"
                                />
                                <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-cyber-gold border-2 border-black/10 rounded-full flex items-center justify-center text-[10px] font-nunito font-extrabold text-black shadow-neo-sm">
                                    {quizStats.currentLevel}
                                </div>
                            </div>
                            <div>
                                <h1 className="font-nunito text-2xl md:text-3xl font-extrabold text-black dark:text-white mb-0.5 tracking-tight">
                                    {userData.name || 'Kullanıcı'}
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 font-nunito font-bold text-xs bg-black/5 dark:bg-white/5 inline-block px-2 py-0.5 rounded-md">{quizStats.levelTitle}</p>
                                <br />
                                <button
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="text-[10px] font-nunito font-extrabold uppercase tracking-widest text-slate-400 hover:text-cyber-blue mt-1.5 transition-colors"
                                >
                                    Profili Düzenle
                                </button>
                                {userData.yetenek_alani && (
                                    <div className="mt-3">
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <ShieldCheck className="w-3.5 h-3.5 text-cyber-emerald" />
                                            <span className="text-[10px] font-nunito font-extrabold text-cyber-emerald uppercase tracking-wider">Erişiminiz Olan Atölyeler</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
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
                                                    <span key={index} className="bg-cyber-emerald/10 text-cyber-emerald text-xs font-nunito font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-1.5 border-2 border-cyber-emerald/30 shadow-sm">
                                                        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                                                        {talent}
                                                    </span>
                                                ));
                                            })()}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="text-center md:text-right mt-2 md:mt-0">
                            <div className="flex items-center justify-center md:justify-end gap-1.5 mb-2">
                                <Zap className="w-6 h-6 text-cyber-gold" fill="currentColor" />
                                <span className="font-nunito text-4xl md:text-5xl font-extrabold text-cyber-gold">
                                    {userData.experience || 0}
                                </span>
                                <span className="text-base text-slate-400 font-nunito font-extrabold">XP</span>
                            </div>
                            <div className="w-56 mx-auto md:mx-0">
                                <div className="flex justify-between text-[9px] text-slate-400 font-nunito font-extrabold mb-1 uppercase tracking-wider">
                                    <span>Seviye {quizStats.currentLevel}</span>
                                    <span>Seviye {quizStats.currentLevel + 1}</span>
                                </div>
                                <div className="h-3 bg-gray-100 dark:bg-slate-700 border-2 border-black/10 dark:border-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${quizStats.levelProgress}%` }}
                                        transition={{ duration: 1, delay: 0.3 }}
                                        className="h-full bg-cyber-gold rounded-full"
                                    />
                                </div>
                                <p className="text-slate-400 font-nunito font-bold text-[9px] mt-1">
                                    {quizStats.nextLevelXP - quizStats.currentXP} XP kaldı
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* BeyniniKullan.com Banner */}
                <motion.a
                    href="https://beyninikullan.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="block mb-6 bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl overflow-hidden group cursor-pointer shadow-neo-md hover:-translate-y-0.5 transition-all"
                >
                    <div className="h-2 bg-cyber-emerald" />
                    <div className="p-5 flex items-center gap-4">
                        <img
                            src="/images/beyninikullan.webp"
                            alt="BeyniniKullan.com"
                            className="w-12 h-12 rounded-xl object-contain bg-white border-2 border-black/10 p-1 flex-shrink-0 group-hover:rotate-3 transition-transform"
                        />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-[9px] font-nunito font-extrabold uppercase tracking-widest bg-black text-white px-1.5 py-0.5 rounded-md">🧠 Yapay Zeka</span>
                            </div>
                            <h3 className="font-nunito text-sm font-extrabold text-black dark:text-white">Çocuğunuza Özel Zeka Kitabı Oluşturun</h3>
                            <p className="font-nunito text-slate-500 dark:text-slate-400 font-bold text-xs truncate">AI ile benzersiz mantık bulmacaları üretin, baskıya hazır PDF kitap oluşturun</p>
                        </div>
                        <div className="flex-shrink-0 hidden sm:flex items-center gap-1.5 bg-black text-white font-nunito font-extrabold px-4 py-2 rounded-xl border-2 border-black/10 text-xs shadow-neo-sm group-hover:shadow-neo-md transition-all">
                            Keşfet
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </div>
                    </div>
                </motion.a>

                {/* ── Hero Grid: En çok kullanılan 2 bölüm yan yana ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 }}
                    className="mb-6 space-y-4"
                >
                    {/* Üst satır: 2 featured kart */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Bireysel Değerlendirme */}
                        {(() => {
                            // Kullanıcının aktif aboneliği veya genel_yetenek yetkisi var mı kontrol et
                            const talentsInput = userData.yetenek_alani;
                            let talents: string[] = [];
                            if (Array.isArray(talentsInput)) talents = talentsInput;
                            else if (typeof talentsInput === 'string') talents = talentsInput.split(/[,,;]/).map(t => t.trim()).filter(Boolean);
                            const hasAccess = talents.some(t => t.toLowerCase().includes('genel yetenek') || t.toLowerCase().includes('genel_yetenek'));

                            if (hasAccess) {
                                return (
                                    <Link
                                        to="/atolyeler/bireysel-degerlendirme"
                                        className="group flex items-center gap-4 bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl p-5 transition-all shadow-neo-md hover:-translate-y-0.5 hover:shadow-neo-lg active:translate-y-0.5 active:shadow-neo-sm focus:outline-none"
                                    >
                                        <div className="w-14 h-14 bg-cyber-blue border-2 border-black/10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-neo-sm flex-shrink-0">
                                            <Brain className="w-7 h-7 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-nunito font-extrabold text-black dark:text-white text-lg tracking-tight">Bireysel Değerlendirme</h3>
                                            <p className="font-nunito font-bold text-slate-400 text-xs">2. Aşama simülasyonları</p>
                                        </div>
                                        <span className="bg-cyber-emerald text-white text-[9px] font-nunito font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-lg border-2 border-black/10 shadow-sm flex-shrink-0">Yetkili</span>
                                        <div className="bg-gray-50 dark:bg-slate-700 border-2 border-black/10 dark:border-white/10 rounded-xl p-2.5 group-hover:translate-x-1 transition-all flex-shrink-0">
                                            <ChevronRight className="w-5 h-5 text-black dark:text-white" />
                                        </div>
                                    </Link>
                                );
                            }

                            return (
                                <Link
                                    to="/atolyeler/bireysel-degerlendirme"
                                    className="group flex items-center gap-4 bg-gray-100 dark:bg-slate-800/50 border-2 border-black/5 dark:border-white/5 rounded-2xl p-5 opacity-60 transition-all shadow-none hover:opacity-80 hover:shadow-neo-sm focus:outline-none"
                                >
                                    <div className="w-14 h-14 bg-slate-300 dark:bg-slate-600 border-2 border-black/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <Brain className="w-7 h-7 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-nunito font-extrabold text-slate-400 dark:text-slate-500 text-lg tracking-tight">Bireysel Değerlendirme</h3>
                                        <p className="font-nunito font-bold text-slate-300 dark:text-slate-600 text-xs">Detayları incele</p>
                                    </div>
                                    <span className="bg-slate-300 dark:bg-slate-600 text-white text-[9px] font-nunito font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-lg border-2 border-black/5 flex-shrink-0 flex items-center gap-1">
                                        <LockIcon size={10} strokeWidth={3} /> Kilitli
                                    </span>
                                </Link>
                            );
                        })()}

                        {/* BİLSEM Zeka Oyunları */}
                        <QuickAccessSection />

                        {/* Deyimler Atölyesi */}
                        <Link
                            to="/deyimler"
                            className="group flex items-center gap-4 bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl p-5 transition-all shadow-neo-md hover:-translate-y-0.5 hover:shadow-neo-lg active:translate-y-0.5 active:shadow-neo-sm focus:outline-none"
                        >
                            <div className="w-14 h-14 bg-cyber-pink border-2 border-black/20 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-neo-sm flex-shrink-0">
                                <Languages className="w-7 h-7 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-nunito font-extrabold text-black dark:text-white text-lg tracking-tight">Deyimler Atölyesi</h3>
                                <p className="font-nunito font-bold text-slate-400 text-xs">Karikatürlerle deyim öğren!</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-slate-700 border-2 border-black/10 dark:border-white/10 rounded-xl p-2.5 group-hover:translate-x-1 transition-all flex-shrink-0">
                                <ChevronRight className="w-5 h-5 text-black dark:text-white" />
                            </div>
                        </Link>
                    </div>

                    {/* Alt satır: Müzik + Resim (varsa) */}
                    <TalentWorkshopsSection userData={userData} />
                </motion.div>

                {/* Extracted Sections */}
                <MusicReportCard />
                <ExamResultSection lastExamSession={lastExamSession} />
                <LiveLessonBooking />

                {/* Mesajlarım */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18 }}
                    className="mb-6"
                >
                    <SectionHeader icon={Mail} iconBg="bg-cyber-blue" title="Mesajlarım" subtitle="Öğretmenlerinden gelen önemli duyurular" />
                    <UserMessages userId={user?.id} />
                </motion.div>

                {/* XP Kazanma Bölümü */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-6"
                >
                    <SectionHeader icon={Sparkles} iconBg="bg-cyber-pink" title="XP Kazan" subtitle="Aktivitelere katıl, XP topla!" />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="lg:col-span-2">
                            <TimeXPGain />
                        </div>

                        {/* Promo Kodu */}
                        <div className="bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl overflow-hidden shadow-neo-sm">
                            <div className="h-1.5 bg-cyber-blue" />
                            <div className="p-5">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-9 h-9 bg-cyber-blue/10 border-2 border-cyber-blue/20 rounded-xl flex items-center justify-center">
                                        <Ticket className="w-5 h-5 text-cyber-blue" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-nunito text-sm font-extrabold text-black dark:text-white">Promo Kodu Gir</h3>
                                        <p className="text-slate-400 font-nunito font-bold text-[10px]">Hediye kodunu kullan</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={promoCode}
                                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                        placeholder="KODU BURAYA YAZIN"
                                        className="flex-1 bg-gray-50 dark:bg-slate-700/50 border-2 border-black/10 dark:border-white/10 rounded-xl px-3 py-2.5 text-black dark:text-white font-nunito font-extrabold text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyber-blue/30 transition-all uppercase"
                                    />
                                    <button
                                        onClick={handleRedeemCode}
                                        disabled={isRedeeming || !promoCode.trim()}
                                        className="bg-cyber-emerald text-black font-nunito font-extrabold border-2 border-black/10 px-5 py-2.5 rounded-xl shadow-neo-sm hover:shadow-neo-md transition-all disabled:opacity-50 text-xs uppercase tracking-wider"
                                    >
                                        {isRedeeming ? '...' : 'Gönder'}
                                    </button>
                                </div>
                                <p className="mt-2.5 text-[9px] font-nunito font-bold text-slate-400 text-center">
                                    Sosyal medya üzerinden paylaştığımız kodları burada değerlendirebilirsiniz.
                                </p>
                            </div>
                        </div>

                        {/* Arkadaş Davet */}
                        <div className="bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl overflow-hidden shadow-neo-sm">
                            <div className="h-1.5 bg-cyber-pink" />
                            <div className="p-5">
                                <button
                                    onClick={() => setShowReferral(!showReferral)}
                                    className="w-full text-left group focus:outline-none"
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-9 h-9 bg-cyber-pink/10 border-2 border-cyber-pink/20 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                                            <Gift className="w-5 h-5 text-cyber-pink" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-nunito text-sm font-extrabold text-black dark:text-white">Arkadaş Davet Et</h3>
                                            <p className="text-slate-400 font-nunito font-bold text-[10px]">Her davet için bonus</p>
                                        </div>
                                        <span className="text-cyber-emerald font-nunito font-extrabold text-xs flex items-center gap-1 bg-cyber-emerald/10 px-2 py-1 rounded-lg border border-cyber-emerald/20">
                                            <Zap className="w-3 h-3" /> +50 XP
                                        </span>
                                    </div>
                                </button>
                                {showReferral && (
                                    <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5">
                                        <ReferralSystem
                                            referralCode={userData.referral_code}
                                            referralCount={userData.referral_count}
                                            onGenerateCode={updateReferralCode}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Oyun İstatistiklerim */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="mb-6"
                >
                    <SectionHeader icon={BarChart3} iconBg="bg-cyber-gold" title="Oyun İstatistiklerim" subtitle="Zeka türü analizleri ve performans" />
                    <UserGameStats />
                </motion.div>

                {/* Başarımlar */}
                <AchievementsSection currentLevel={quizStats.currentLevel} />
            </div>
        </div>
    );
};

export default ProfilePage;
