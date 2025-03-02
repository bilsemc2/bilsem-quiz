import React from 'react';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { UserStats } from '../types/user';

interface StatisticsCardProps {
    stats: UserStats;
}

export const StatisticsCard: React.FC<StatisticsCardProps> = ({ stats }) => {
    // Son 7 günlük performans verileri
    const performanceData = stats.quizHistory.map(quiz => ({
        date: new Date(quiz.date).toLocaleDateString('tr-TR', { weekday: 'short' }),
        score: quiz.score,
        questions: quiz.totalQuestions
    })).reverse();

    // Doğru/Yanlış oranı için pasta grafik verileri
    const accuracyData = [
        { name: 'Doğru', value: stats.correctAnswers },
        { name: 'Yanlış', value: stats.totalQuestionsAnswered - stats.correctAnswers }
    ];

    const COLORS = ['#4ade80', '#f87171'];

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Quiz İstatistikleri</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Skor Gelişimi Grafiği */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-600 mb-4">Skor Gelişimi</h4>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={performanceData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="date" stroke="#6b7280" />
                                <YAxis stroke="#6b7280" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                    }}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="score"
                                    name="Skor"
                                    stroke="#6366f1"
                                    strokeWidth={2}
                                    dot={{ fill: '#6366f1' }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Doğru/Yanlış Oranı */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-600 mb-4">Doğru/Yanlış Oranı</h4>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={accuracyData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, value, percent }) => 
                                        `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                                    }
                                >
                                    {accuracyData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Seviye İlerleme Çubuğu */}
                <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                    <h4 className="text-sm font-medium text-gray-600 mb-4">Seviye İlerlemesi</h4>
                    <div className="h-20">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[{ 
                                name: 'XP',
                                current: stats.experience,
                                remaining: stats.nextLevelExperience - stats.experience
                            }]}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="current" name="Mevcut XP" stackId="a" fill="#6366f1" />
                                <Bar dataKey="remaining" name="Kalan XP" stackId="a" fill="#e5e7eb" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-2 text-sm text-gray-600 text-center">
                        {stats.experience} / {stats.nextLevelExperience} XP
                    </div>
                </div>
            </div>

            {/* Özet İstatistikler */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-indigo-600">{stats.totalQuizzes}</div>
                    <div className="text-sm text-gray-600">Toplam Quiz</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-indigo-600">{stats.averageScore}</div>
                    <div className="text-sm text-gray-600">Ortalama Skor</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-indigo-600">{stats.bestScore}</div>
                    <div className="text-sm text-gray-600">En İyi Skor</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-indigo-600">{stats.level}</div>
                    <div className="text-sm text-gray-600">Seviye</div>
                </div>
            </div>
        </div>
    );
};
