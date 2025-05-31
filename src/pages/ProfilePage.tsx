import React, { useState, useEffect } from 'react';
import { useSound } from '../contexts/SoundContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import ModernProgress from '../components/ModernProgress';
import EditProfileModal from '../components/EditProfileModal';
import UserMessages from '@/components/UserMessages';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Trophy, 
    Target, 
    TrendingUp, 
    Users, 
    Star, 
    Gift,
    MessageCircle,
    Award,
    BookOpen,
    Calendar,
    Zap
} from 'lucide-react';

// Profilden yeni tip importları
import { UserProfile, QuizStats, DailyStats, ClassStudent } from '@/types/profile';

// Seviye hesaplama fonksiyonlarını import et
import { calculateLevelInfo, getLevelBadge, getLevelTitle } from '@/utils/levelCalculator';

// Yeni komponentler
import ProfileHeader from '@/components/profile/ProfileHeader';
import ClassList from '@/components/profile/ClassList';
import StatsSummary from '@/components/profile/StatsSummary';
import WeeklyChart from '@/components/profile/WeeklyChart';
import ReferralSystem from '@/components/profile/ReferralSystem';

export const ProfilePage: React.FC = () => {
    const { } = useSound();
    const { user } = useAuth();
    const [weeklyStats, setWeeklyStats] = useState<DailyStats[]>([]);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
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
        classes: []
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

    const [unreadCount, setUnreadCount] = useState(0);

    // Haftalık istatistikleri işleyen yardımcı fonksiyon
    const processWeeklyStats = (quizData: any[]) => {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const weeklyData = quizData.filter(
            result => new Date(result.completed_at) >= oneWeekAgo
        );

        const dailyStats = new Map<string, DailyStats>();
        
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            dailyStats.set(dateStr, {
                date: dateStr,
                correct: 0,
                wrong: 0
            });
        }

        weeklyData.forEach(result => {
            const dateStr = new Date(result.completed_at).toISOString().split('T')[0];
            const existing = dailyStats.get(dateStr) || { date: dateStr, correct: 0, wrong: 0 };
            const wrongAnswers = result.questions_answered - result.correct_answers;
            
            dailyStats.set(dateStr, {
                date: dateStr,
                correct: existing.correct + (result.correct_answers || 0),
                wrong: existing.wrong + wrongAnswers
            });
        });

        const statsArray = Array.from(dailyStats.values())
            .sort((a, b) => a.date.localeCompare(b.date));

        setWeeklyStats(statsArray);
    };

    // Tüm kullanıcı verilerini çeken birleştirilmiş fonksiyon
    const fetchUserData = async () => {
        if (!user) return;
        
        setIsLoading(true);
        try {
            const [profileResponse, quizResultsResponse] = await Promise.all([
                supabase
                    .from('profiles')
                    .select(`
                        *,
                        class_students!left (
                            classes:class_id (
                                id,
                                name,
                                grade
                            )
                        )
                    `)
                    .eq('id', user.id)
                    .single(),
                    
                supabase
                    .from('quiz_results')
                    .select('correct_answers, questions_answered, completed_at')
                    .eq('user_id', user.id)
            ]);
            
            const { data: profileData, error: profileError } = profileResponse;
            if (profileError) {
                console.error('Error fetching profile:', profileError);
                return;
            }
            
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
                
                setUserData({
                    ...profileData,
                    avatar_url,
                    classes
                });

                setQuizStats(prev => ({
                    ...prev,
                    currentLevel: levelInfo.currentLevel,
                    levelProgress: levelInfo.levelProgress,
                    currentXP: levelInfo.currentXP,
                    nextLevelXP: levelInfo.nextLevelXP,
                    levelBadge,
                    levelTitle
                }));
                
                if (avatar_url !== profileData.avatar_url) {
                    const { error: updateError } = await supabase
                        .from('profiles')
                        .update({ avatar_url })
                        .eq('id', user.id);

                    if (updateError) {
                        console.error('Error updating avatar_url:', updateError);
                    }
                }
            }
            
            const { data: quizData, error: quizError } = quizResultsResponse;
            if (quizError) {
                console.error('Error fetching quiz stats:', quizError);
                return;
            }
            
            if (quizData && quizData.length > 0) {
                const totalQuizzes = quizData.length;
                const totalCorrect = quizData.reduce((sum, quiz) => sum + quiz.correct_answers, 0);
                const totalQuestions = quizData.reduce((sum, quiz) => sum + quiz.questions_answered, 0);
                const totalWrong = totalQuestions - totalCorrect;
                const averageScore = (totalCorrect / totalQuestions) * 100;
                
                setQuizStats(prev => ({
                    ...prev,
                    totalQuizzes,
                    totalCorrect,
                    totalWrong,
                    averageScore
                }));
                
                processWeeklyStats(quizData);
            }
        } catch (err) {
            console.error('Exception in fetchUserData:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Referans kodu oluşturma işlemi
    const generateReferralCode = () => {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    };

    const updateReferralCode = async () => {
        if (!user) return;
        
        try {
            const newCode = generateReferralCode();
            
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ referral_code: newCode })
                .eq('id', user.id);

            if (updateError) throw updateError;

            setUserData(prev => ({ ...prev, referral_code: newCode }));
            toast.success('Yeni referans kodunuz oluşturuldu!');

        } catch (error: any) {
            console.error('Referans kodu oluşturulurken hata:', error);
            toast.error('Referans kodu oluşturulamadı. Lütfen tekrar deneyin.');
        }
    };

    useEffect(() => {
        if (user) {
            fetchUserData();
        }
    }, [user]);

    useEffect(() => {
        if (!user) return;
        
        const fetchUnreadCount = async () => {
            try {
                const { data } = await supabase
                    .from('admin_messages')
                    .select('id', { count: 'exact' })
                    .eq('receiver_id', user.id)
                    .eq('read', false);
                
                setUnreadCount(data?.length || 0);
            } catch (error) {
                console.error('Error fetching unread messages:', error);
            }
        };
        
        fetchUnreadCount();
        
        const channel = supabase
            .channel('messages-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'admin_messages'
                },
                () => {
                    fetchUnreadCount();
                }
            )
            .subscribe();
        
        return () => {
            channel.unsubscribe();
        };
    }, [user]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
                <div className="text-center space-y-6">
                    <div className="relative">
                        <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                        <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-r-purple-600 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Profil Yükleniyor</h3>
                        <p className="text-gray-500 dark:text-gray-400">Verileriniz hazırlanıyor...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            <div className="container mx-auto px-4 py-8">
                <AnimatePresence>
                    {isEditModalOpen && (
                        <EditProfileModal
                            onClose={() => setIsEditModalOpen(false)}
                            onSave={fetchUserData}
                            userData={{
                                name: userData.name,
                                grade: userData.grade,
                                school: userData.school,
                            }}
                        />
                    )}
                </AnimatePresence>

                <div className="max-w-6xl mx-auto space-y-6">
                    {/* Header Section */}
                    <motion.div 
                        className="text-center mb-8"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                            Profilim
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Gelişiminizi takip edin ve başarılarınızı görün
                        </p>
                    </motion.div>

                    {/* Profile Header Card */}
                    <motion.div
                        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 overflow-hidden"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                    >
                        <div className="relative bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-8">
                            <div className="absolute inset-0 bg-black/20"></div>
                            <div className="relative z-10">
                                <ProfileHeader 
                                    userData={userData} 
                                    unreadCount={unreadCount} 
                                    onEditClick={() => setIsEditModalOpen(true)} 
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { icon: Trophy, label: 'Toplam Quiz', value: quizStats.totalQuizzes, color: 'from-yellow-500 to-orange-500' },
                            { icon: Target, label: 'Doğru Cevap', value: quizStats.totalCorrect, color: 'from-green-500 to-emerald-500' },
                            { icon: TrendingUp, label: 'Ortalama Skor', value: `%${Math.round(quizStats.averageScore)}`, color: 'from-blue-500 to-cyan-500' },
                            { icon: Star, label: 'Seviye', value: quizStats.currentLevel, color: 'from-purple-500 to-pink-500' }
                        ].map((stat, index) => (
                            <motion.div
                                key={stat.label}
                                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 dark:border-gray-700/20 p-6"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                                whileHover={{ scale: 1.02 }}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
                                        <p className="text-2xl font-bold text-gray-800 dark:text-white">{stat.value}</p>
                                    </div>
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center`}>
                                        <stat.icon className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Level Progress */}
                            <motion.div 
                                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 p-6"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, delay: 0.3 }}
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                                            <Award className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Seviye İlerlemesi</h2>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {quizStats.levelTitle}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-3xl mb-1">{quizStats.levelBadge}</div>
                                        <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                                            Seviye {quizStats.currentLevel}
                                        </div>
                                    </div>
                                </div>
                                
                                <ModernProgress 
                                    value={quizStats.levelProgress} 
                                    label="Seviye İlerlemesi"
                                    color="#8B5CF6"
                                    icon="⭐"
                                    description={`${quizStats.currentXP} / ${quizStats.nextLevelXP} XP`}
                                />
                                
                                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-3">
                                    <span className="flex items-center gap-1">
                                        <Zap className="w-4 h-4" />
                                        {quizStats.currentXP} XP
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Target className="w-4 h-4" />
                                        {quizStats.nextLevelXP} XP
                                    </span>
                                </div>
                            </motion.div>

                            {/* Weekly Performance */}
                            <motion.div 
                                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 p-6"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, delay: 0.4 }}
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                                        <Calendar className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Haftalık Performans</h2>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Son 7 günlük performansınız</p>
                                    </div>
                                </div>
                                <WeeklyChart weeklyStats={weeklyStats} />
                            </motion.div>

                            {/* Stats Summary */}
                            <motion.div 
                                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 overflow-hidden"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, delay: 0.5 }}
                            >
                                <div className="p-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                                            <BookOpen className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Detaylı İstatistikler</h2>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Genel performans özetiniz</p>
                                        </div>
                                    </div>
                                </div>
                                <StatsSummary userData={userData} quizStats={quizStats} />
                            </motion.div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                            {/* Classes */}
                            <motion.div 
                                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 p-6"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, delay: 0.3 }}
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                                        <Users className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Sınıflarım</h2>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Kayıtlı olduğum sınıflar</p>
                                    </div>
                                </div>
                                <ClassList classes={userData.classes} />
                            </motion.div>

                            {/* Referral System */}
                            <motion.div 
                                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 p-6"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, delay: 0.4 }}
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center">
                                        <Gift className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Arkadaşlarını Davet Et</h2>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Referans kodunla puan kazan</p>
                                    </div>
                                </div>
                                <ReferralSystem 
                                    referralCode={userData.referral_code} 
                                    referralCount={userData.referral_count} 
                                    onGenerateCode={updateReferralCode} 
                                />
                            </motion.div>

                            {/* Messages */}
                            <motion.div 
                                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 p-6"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, delay: 0.5 }}
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center relative">
                                        <MessageCircle className="w-5 h-5 text-white" />
                                        {unreadCount > 0 && (
                                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                                                <span className="text-xs text-white font-bold">{unreadCount}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Mesajlarım</h2>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {unreadCount > 0 ? `${unreadCount} okunmamış mesaj` : 'Tüm mesajlar okundu'}
                                        </p>
                                    </div>
                                </div>
                                <UserMessages userId={user?.id} />
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
