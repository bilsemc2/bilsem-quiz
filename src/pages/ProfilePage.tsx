import React, { useState, useEffect } from 'react';
import { useSound } from '../contexts/SoundContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import ModernProgress from '../components/ModernProgress';
import MobileMenu from '../components/MobileMenu';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import UserMessages from '@/components/UserMessages';
import { Badge } from '@mui/material';
import MailIcon from '@mui/icons-material/Mail';
import { useNavigate } from 'react-router-dom';

interface QuizStats {
    totalQuizzes: number;
    totalCorrect: number;
    totalWrong: number;
    averageScore: number;
    levelProgress: number;
    currentLevel: number;
}

interface UserProfile {
    name: string;
    email: string;
    school: string;
    grade: string;
    avatar_url: string;
    points: number;
    experience: number;
    referral_code?: string;
    referral_count?: number;
    class_id?: string;
}

interface DailyStats {
    date: string;
    correct: number;
    wrong: number;
}

export const ProfilePage: React.FC = () => {
    const { volume, setVolume, isMuted, setIsMuted } = useSound();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [weeklyStats, setWeeklyStats] = useState<DailyStats[]>([]);
    const [userData, setUserData] = useState<UserProfile>({
        name: "",
        email: user?.email || "",
        school: "",
        grade: "",
        avatar_url: "",
        points: 0,
        experience: 0,
        referral_code: "",
        referral_count: 0
    });

    const [quizStats, setQuizStats] = useState<QuizStats>({
        totalQuizzes: 0,
        totalCorrect: 0,
        totalWrong: 0,
        averageScore: 0,
        levelProgress: 0,
        currentLevel: 1
    });

    const [copySuccess, setCopySuccess] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchWeeklyStats = async () => {
        if (!user) return;

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const { data, error } = await supabase
            .from('quiz_results')
            .select('correct_answers, questions_answered, completed_at')
            .eq('user_id', user.id)
            .gte('completed_at', oneWeekAgo.toISOString())
            .order('completed_at', { ascending: true });

        if (error) {
            console.error('Error fetching weekly stats:', error);
            return;
        }

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
        data?.forEach(result => {
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

    const fetchUserProfile = async () => {
        if (!user) return;

        try {
            // Profil ve sınıf bilgilerini tek sorguda alalım
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select(`
                    *,
                    class_students!left (
                        class_id,
                        classes!inner (
                            id,
                            name,
                            grade
                        )
                    )
                `)
                .eq('id', user.id)
                .single();

            if (profileError) {
                console.error('Error fetching profile:', profileError);
                return;
            }

            if (profileData) {
                // Avatar URL'sini kontrol et ve gerekirse güncelle
                const avatar_url = profileData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.email || '')}`;
                
                // Sınıf bilgisini çıkart
                const class_id = profileData.class_students?.[0]?.class_id;
                
                // State'i tek seferde güncelle
                setUserData({
                    ...profileData,
                    avatar_url,
                    class_id
                });

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
        } catch (err) {
            console.error('Exception in fetchUserProfile:', err);
        }
    };

    useEffect(() => {
        console.log('useEffect triggered with user:', user);
        if (user) {
            fetchUserProfile();
            fetchQuizStats();
            fetchWeeklyStats();
        }
    }, [user]);

    useEffect(() => {
        console.log('Current userData:', userData);
    }, [userData]);

    useEffect(() => {
        const fetchUnreadCount = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from('admin_messages')
                .select('id', { count: 'exact' })
                .eq('receiver_id', user.id)
                .eq('read', false);

            setUnreadCount(data?.length || 0);
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
    }, []);

    const calculateLevel = (experience: number) => {
        // Her 1000 XP'de bir level atlama
        const level = Math.floor(experience / 1000) + 1;
        const progress = (experience % 1000) / 10; // 0-100 arası progress
        return { level, progress };
    };

    const fetchQuizStats = async () => {
        try {
            const { data, error } = await supabase
                .from('quiz_results')
                .select('correct_answers, questions_answered')
                .eq('user_id', user?.id);

            if (error) {
                console.error('Error fetching quiz stats:', error);
                return;
            }

            if (data && data.length > 0) {
                const totalQuizzes = data.length;
                const totalCorrect = data.reduce((sum, quiz) => sum + quiz.correct_answers, 0);
                const totalQuestions = data.reduce((sum, quiz) => sum + quiz.questions_answered, 0);
                const totalWrong = totalQuestions - totalCorrect;
                const averageScore = (totalCorrect / totalQuestions) * 100;

                setQuizStats(prev => ({
                    ...prev,
                    totalQuizzes,
                    totalCorrect,
                    totalWrong,
                    averageScore
                }));
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

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

    const copyReferralLink = async () => {
        if (!userData.referral_code) {
            toast.error('Önce referans kodu oluşturmanız gerekiyor.');
            return;
        }

        const referralLink = `${window.location.origin}/signup?ref=${userData.referral_code}`;
        try {
            await navigator.clipboard.writeText(referralLink);
            setCopySuccess(true);
            toast.success('Davet linki kopyalandı!');
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
            toast.error('Kopyalama başarısız oldu. Lütfen tekrar deneyin.');
        }
    };

    const handleClassroomEntry = async () => {
        try {
            // Kullanıcının sınıf kaydını kontrol et
            const { data: classData, error: classError } = await supabase
                .from('class_students')
                .select(`
                    class:classes (
                        id,
                        grade
                    )
                `)
                .eq('student_id', user?.id)
                .single();

            if (classError || !classData?.class) {
                toast.error('Sınıf bilginiz bulunamadı. Lütfen profilinizi güncelleyin.');
                return;
            }

            // Sınıf sayfasına yönlendir
            navigate(`/classroom/${classData.class.grade}`);
        } catch (error) {
            console.error('Sınıf bilgisi alınırken hata:', error);
            toast.error('Bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
               

                {/* Profile Card */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                    <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
                        {/* Avatar */}
                        <div className="relative">
                            <img
                                src={userData.avatar_url}
                                alt={userData.name}
                                className="w-32 h-32 rounded-full object-cover border-4 border-indigo-100"
                            />
                            {unreadCount > 0 && (
                                <div className="absolute -top-2 -right-2">
                                    <Badge 
                                        badgeContent={unreadCount} 
                                        color="error"
                                        overlap="circular"
                                    >
                                        <MailIcon color="action" />
                                    </Badge>
                                </div>
                            )}
                        </div>

                        {/* User Info */}
                        <div className="flex-1 text-center md:text-left">
                            <h2 className="text-2xl font-bold text-gray-900">{userData.name}</h2>
                            <p className="text-gray-600">{userData.email}</p>
                            <p className="text-gray-600">{userData.school}</p>
                            <p className="text-gray-600">{userData.grade}. Sınıf</p>
                            <div className="mt-2">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                                    <span className="mr-1">⭐</span>
                                    {userData.points} Puan
                                </span>
                            </div>
                        </div>
                        <div className="mb-8 flex justify-center">
                    {userData.class_id ? (
                        <button
                            onClick={() => navigate(`/classroom/${userData.class_id}`)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-300 flex items-center space-x-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            <span>Sınıfıma Git</span>
                        </button>
                    ) : (
                        <p className="text-sm text-gray-500">Henüz bir sınıfa atanmadınız.</p>
                    )}
                </div>
                    </div>
                </div>

          

                {/* Points and XP */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="bg-indigo-50 p-6 rounded-lg text-center">
                        <h3 className="text-lg font-semibold text-indigo-900 mb-2">Toplam Puan</h3>
                        <p className="text-3xl font-bold text-indigo-600">{userData.points}</p>
                    </div>
                    <div className="bg-purple-50 p-6 rounded-lg text-center">
                        <h3 className="text-lg font-semibold text-purple-900 mb-2">Seviye {quizStats.currentLevel}</h3>
                        <p className="text-3xl font-bold text-purple-600">{userData.experience} XP</p>
                    </div>
                </div>

                {/* Quiz Statistics */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Quiz İstatistikleri</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg text-center">
                            <h3 className="text-sm font-semibold text-blue-900 mb-1">Toplam Quiz</h3>
                            <p className="text-2xl font-bold text-blue-600">{quizStats.totalQuizzes}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg text-center">
                            <h3 className="text-sm font-semibold text-green-900 mb-1">Doğru</h3>
                            <p className="text-2xl font-bold text-green-600">{quizStats.totalCorrect}</p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg text-center">
                            <h3 className="text-sm font-semibold text-red-900 mb-1">Yanlış</h3>
                            <p className="text-2xl font-bold text-red-600">{quizStats.totalWrong}</p>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg text-center">
                            <h3 className="text-sm font-semibold text-yellow-900 mb-1">Başarı</h3>
                            <p className="text-2xl font-bold text-yellow-600">%{quizStats.averageScore.toFixed(1)}</p>
                        </div>
                    </div>
                </div>

                {/* Weekly Performance Chart */}
                <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
                    <h2 className="text-2xl font-bold mb-4">Son 7 Gün Performansı</h2>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={weeklyStats}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="date" 
                                    tickFormatter={(date) => {
                                        const d = new Date(date);
                                        return `${d.getDate()}/${d.getMonth() + 1}`;
                                    }}
                                />
                                <YAxis />
                                <Tooltip 
                                    labelFormatter={(date) => {
                                        const d = new Date(date);
                                        return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
                                    }}
                                />
                                <Legend />
                                <Line 
                                    type="monotone" 
                                    dataKey="correct" 
                                    stroke="#4CAF50" 
                                    name="Doğru"
                                    strokeWidth={2}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="wrong" 
                                    stroke="#f44336" 
                                    name="Yanlış"
                                    strokeWidth={2}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* İlerleme Grafikleri */}
                <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-xl font-bold text-gray-900">İlerleme Grafikleri</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <ModernProgress
                            value={quizStats.averageScore}
                            color="#4F46E5"
                            label="Başarı Oranı"
                            icon="🎯"
                            description="Tüm quizlerdeki başarı yüzdeniz"
                        />
                        <ModernProgress
                            value={(quizStats.totalCorrect / (quizStats.totalCorrect + quizStats.totalWrong)) * 100 || 0}
                            color="#10B981"
                            label="Doğru Oranı"
                            icon="✅"
                            description="Doğru cevaplarınızın oranı"
                        />
                        <ModernProgress
                            value={quizStats.levelProgress}
                            color="#8B5CF6"
                            label={`Seviye ${quizStats.currentLevel}`}
                            icon="⭐"
                            description={`${userData.experience} XP / ${quizStats.currentLevel * 1000} XP`}
                        />
                    </div>
                </div>

                {/* Mesajlar Bölümü */}
                <div>
                    <h2 className="text-2xl font-bold mb-4">Mesajlarım</h2>
                    <UserMessages />
                </div>

                {/* Arkadaş Davet Bölümü */}
                <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Arkadaşlarını Davet Et</h2>
                            <p className="text-gray-600 mt-1">
                                Her başarılı davet için 50 XP kazanın!
                            </p>
                        </div>
                        <div className="bg-purple-100 rounded-full px-4 py-2">
                            <span className="text-purple-600 font-medium">
                                {userData.referral_count || 0} Davet
                            </span>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex-1 mr-4">
                            <p className="text-sm text-gray-600 mb-1">Davet Kodunuz</p>
                            <div className="flex">
                                <input
                                    type="text"
                                    readOnly
                                    value={userData.referral_code || ''}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg bg-gray-50"
                                />
                                {userData.referral_code ? (
                                    <button
                                        onClick={copyReferralLink}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-r-lg hover:bg-purple-700 transition duration-200"
                                    >
                                        {copySuccess ? 'Kopyalandı!' : 'Kopyala'}
                                    </button>
                                ) : (
                                    <button
                                        onClick={updateReferralCode}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-r-lg hover:bg-purple-700 transition duration-200"
                                    >
                                        Oluştur
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between text-gray-600">
                        <span>Toplam Davet: {userData.referral_count || 0}</span>
                        <span>Kazanılan XP: {(userData.referral_count || 0) * 50}</span>
                    </div>
                </div>
                
            </div>
        </div>
    );
};

export default ProfilePage;
