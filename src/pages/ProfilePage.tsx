import React, { useState, useEffect } from 'react';
import { useSound } from '../contexts/SoundContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import ModernProgress from '../components/ModernProgress';
import MobileMenu from '../components/MobileMenu';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
}

interface DailyStats {
    date: string;
    correct: number;
    wrong: number;
}

export const ProfilePage: React.FC = () => {
    const { volume, setVolume, isMuted, setIsMuted } = useSound();
    const { user } = useAuth();
    const [weeklyStats, setWeeklyStats] = useState<DailyStats[]>([]);
    const [userData, setUserData] = useState<UserProfile>({
        name: "",
        email: user?.email || "",
        school: "",
        grade: "",
        avatar_url: "",
        points: 0,
        experience: 0
    });

    const [quizStats, setQuizStats] = useState<QuizStats>({
        totalQuizzes: 0,
        totalCorrect: 0,
        totalWrong: 0,
        averageScore: 0,
        levelProgress: 0,
        currentLevel: 1
    });

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

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return;

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
                return;
            }

            if (data) {
                // Avatar URL'sini kontrol et ve gerekirse güncelle
                const avatar_url = data.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.email || '')}`;
                
                // Eğer avatar_url değişmişse, veritabanını güncelle
                if (avatar_url !== data.avatar_url) {
                    const { error: updateError } = await supabase
                        .from('profiles')
                        .update({ avatar_url })
                        .eq('id', user.id);

                    if (updateError) {
                        console.error('Error updating avatar_url:', updateError);
                    }
                }

                setUserData({
                    ...data,
                    avatar_url
                });
            }
        };

        fetchProfile();
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchQuizStats();
            fetchWeeklyStats();
        }
    }, [user]);

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
            </div>
        </div>
    );
};

export default ProfilePage;
