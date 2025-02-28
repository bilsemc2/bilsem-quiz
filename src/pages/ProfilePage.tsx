import React, { useState, useEffect } from 'react';
import { useSound } from '../contexts/SoundContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import ModernProgress from '../components/ModernProgress';
import EditProfileModal from '../components/EditProfileModal';
import UserMessages from '@/components/UserMessages';
import { toast } from 'sonner';

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
    const { } = useSound(); // Sound context'i ileride kullanılabilir
    const { user } = useAuth();
    const [weeklyStats, setWeeklyStats] = useState<DailyStats[]>([]);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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
        // Son 7 gün içindeki verileri filtrele
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const weeklyData = quizData.filter(
            result => new Date(result.completed_at) >= oneWeekAgo
        );

        // Group results by date
        const dailyStats = new Map<string, DailyStats>();
        
        // Initialize last 7 days with 0 values
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

        // Aggregate results by date
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

        // Convert to array and sort by date
        const statsArray = Array.from(dailyStats.values())
            .sort((a, b) => a.date.localeCompare(b.date));

        setWeeklyStats(statsArray);
    };

    // Tüm kullanıcı verilerini çeken birleştirilmiş fonksiyon
    const fetchUserData = async () => {
        if (!user) return;
        
        try {
            // Profil, sınıf ve quiz sonuçlarını paralel olarak çekelim
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
            
            // Profil verilerini işle
            const { data: profileData, error: profileError } = profileResponse;
            if (profileError) {
                console.error('Error fetching profile:', profileError);
                return;
            }
            
            if (profileData) {
                // Avatar URL kontrolü
                const avatar_url = profileData.avatar_url || 
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.email || '')}`;
                
                // Sınıf bilgilerini düzenle
                const classes = (profileData.class_students as ClassStudent[] | null)
                    ?.filter((cs: ClassStudent) => cs.classes)
                    .map((cs: ClassStudent) => ({
                        id: cs.classes.id,
                        name: cs.classes.name,
                        grade: cs.classes.grade
                    }));

                // Seviye bilgilerini hesapla
                const levelInfo = calculateLevelInfo(profileData.experience || 0);
                const levelBadge = getLevelBadge(levelInfo.currentLevel);
                const levelTitle = getLevelTitle(levelInfo.currentLevel);
                
                // State'i güncelle
                setUserData({
                    ...profileData,
                    avatar_url,
                    classes
                });

                // Seviye bilgilerini güncelle
                setQuizStats(prev => ({
                    ...prev,
                    currentLevel: levelInfo.currentLevel,
                    levelProgress: levelInfo.levelProgress,
                    currentXP: levelInfo.currentXP,
                    nextLevelXP: levelInfo.nextLevelXP,
                    levelBadge,
                    levelTitle
                }));
                
                // Avatar URL güncellenmesi gerekiyorsa güncelle
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
            
            // Quiz verilerini işle
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
                
                // Haftalık istatistikleri işle
                processWeeklyStats(quizData);
            }
        } catch (err) {
            console.error('Exception in fetchUserData:', err);
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
            
            // Kodu güncelle
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ referral_code: newCode })
                .eq('id', user.id);

            if (updateError) throw updateError;

            // State'i güncelle
            setUserData(prev => ({ ...prev, referral_code: newCode }));
            toast.success('Yeni referans kodunuz oluşturuldu!');

        } catch (error: any) {
            console.error('Referans kodu oluşturulurken hata:', error);
            toast.error('Referans kodu oluşturulamadı. Lütfen tekrar deneyin.');
        }
    };

    // Ana veri çekme işlemi için useEffect
    useEffect(() => {
        if (user) {
            fetchUserData();
        }
    }, [user]);

    // Debug amaçlı useEffect
    useEffect(() => {
        console.log('Current userData:', userData);
    }, [userData]);

    // Okunmamış mesajlar için ayrı useEffect
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
        
        // Realtime subscription for new messages
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

    return (
        <div className="container mx-auto px-4 py-8">
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

            <div className="max-w-5xl mx-auto">
                {/* Profil Bilgileri ve Avatar */}
                <ProfileHeader 
                    userData={userData} 
                    unreadCount={unreadCount} 
                    onEditClick={() => setIsEditModalOpen(true)} 
                />

                {/* Sınıflarım */}
                <ClassList classes={userData.classes} />

                {/* İstatistikler */}
                <StatsSummary userData={userData} quizStats={quizStats} />

                {/* Haftalık Performans */}
                <WeeklyChart weeklyStats={weeklyStats} />

                {/* Arkadaşlarını Davet Et Bölümü */}
                <ReferralSystem 
                    referralCode={userData.referral_code} 
                    referralCount={userData.referral_count} 
                    onGenerateCode={updateReferralCode} 
                />

                {/* Kullanıcı Mesajları */}
                <div className="my-8">
                    <UserMessages userId={user?.id} />
                </div>

                {/* Gelişim İzleme */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold">Seviye İlerlemesi</h2>
                        <div className="text-lg flex items-center gap-2">
                            <span className="text-2xl" title="Seviye Rozeti">{quizStats.levelBadge}</span>
                            <span className="text-purple-600 font-bold">Seviye {quizStats.currentLevel}</span>
                            <span className="text-gray-500 text-sm">({quizStats.levelTitle})</span>
                        </div>
                    </div>
                    
                    <ModernProgress 
                        value={quizStats.levelProgress} 
                        label="Seviye İlerlemesi"
                        color="#8B5CF6"
                        icon="⭐"
                        description={`${quizStats.currentXP} / ${quizStats.nextLevelXP} XP`}
                    />
                    
                    <div className="flex justify-between text-sm text-gray-600 mt-2">
                        <span>{quizStats.currentXP} XP</span>
                        <span>{quizStats.nextLevelXP} XP</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
