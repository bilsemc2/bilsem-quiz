import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface LeaderUser {
    id: string;
    name: string;
    avatar_url: string;
    points: number;
}

interface Leader {
    name: string;
    points: number;
    email: string;
}

export const HomePage: React.FC = () => {
    const [leader, setLeader] = useState<Leader | null>(null);
    const [topLeaders, setTopLeaders] = useState<Leader[]>([]);

    useEffect(() => {
        const fetchLeaders = async () => {
            try {
                const { data: leaders, error } = await supabase
                    .from('profiles')
                    .select('name, points, email')
                    .order('points', { ascending: false })
                    .limit(3);

                if (error) {
                    console.error('Error fetching leaders:', error);
                    return;
                }

                if (leaders && leaders.length > 0) {
                    setLeader(leaders[0]);
                    setTopLeaders(leaders);
                }
            } catch (error) {
                console.error('Error:', error);
            }
        };

        fetchLeaders();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
                <div className="flex flex-col lg:flex-row items-start justify-between">
                    {/* Left Content - Hero Section */}
                    <div className="flex-1 lg:pr-8">
                        <div className="flex flex-col md:flex-row items-center justify-between">
                            <div className="flex-1 text-center md:text-left md:pr-8">
                                <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-8">
                                    Bilsem Quiz
                                    <span className="block text-2xl sm:text-3xl text-blue-600 mt-2">
                                        Öğrenmeyi Eğlenceli Hale Getirin
                                    </span>
                                </h1>
                                <p className="text-xl text-gray-600 mb-12 max-w-2xl">
                                    Bilsem Sınavları için eğlenceli denemeler. Bu site bilsemc2 - yetenekvezeka tarafından geliştirilmektedir.
                                </p>

                                <div className="flex flex-col sm:flex-row justify-start space-y-4 sm:space-y-0 sm:space-x-4">
                                    <Link
                                        to="/quiz"
                                        className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl
                                                 hover:from-indigo-700 hover:to-purple-700 transition-all duration-200
                                                 transform hover:scale-105 shadow-lg hover:shadow-xl
                                                 flex items-center justify-center space-x-2 text-lg font-semibold"
                                    >
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                        <span>Quiz'e Başla</span>
                                    </Link>
                                    <Link
                                        to="/profile"
                                        className="px-8 py-4 bg-white text-gray-800 rounded-xl
                                                 hover:bg-gray-50 transition-all duration-200
                                                 transform hover:scale-105 shadow-lg hover:shadow-xl
                                                 flex items-center justify-center space-x-2 text-lg font-semibold
                                                 border-2 border-gray-200"
                                    >
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        <span>Profilim</span>
                                    </Link>
                                </div>
                            </div>
                            <div className="flex-1 mt-8 md:mt-0">
                                <img 
                                    src="/images/hero-kids.png" 
                                    alt="Bilsem Quiz Hero" 
                                    className="w-full max-w-md mx-auto rounded-lg shadow-2xl transform hover:scale-105 transition-transform duration-300"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Content - Leaderboard */}
                    <div className="lg:w-80 mt-12 lg:mt-0">
                        <div className="bg-white rounded-2xl shadow-xl p-6">
                            <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">🏆 Lider Tablosu</h2>
                            <div className="space-y-4">
                                {topLeaders.map((leader, index) => (
                                    <div key={index} className="relative bg-gradient-to-r from-gray-50 to-white p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
                                        <div className="flex items-center space-x-4">
                                            <div className="relative">
                                                <img
                                                    src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${leader.email}&backgroundColor=b6e3f4,c0aede,d1d4f9&mood=happy`}
                                                    alt={`${leader.name} avatar`}
                                                    className="w-16 h-16 rounded-full border-2 shadow-md"
                                                    style={{
                                                        borderColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32'
                                                    }}
                                                />
                                                <div className="absolute -top-2 -right-2">
                                                    {index === 0 ? '👑' : index === 1 ? '🥈' : '🥉'}
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-800">{leader.name}</h3>
                                                <div className="flex items-center space-x-1">
                                                    <span className="text-yellow-500">⭐</span>
                                                    <span className="text-sm font-semibold text-gray-700">{leader.points} puan</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto mt-12">
                    <div className="group bg-gradient-to-br from-indigo-500 to-purple-600 p-1 rounded-2xl hover:scale-105 transition-all duration-300">
                        <div className="bg-white p-6 rounded-xl h-full">
                            <div className="mb-4 transform group-hover:scale-110 transition-transform duration-300 flex justify-center">
                                <div className="text-6xl bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full p-4 shadow-lg">
                                    🎯
                                </div>
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                Kendini Test Et
                            </h3>
                            <p className="text-gray-600 text-center leading-relaxed">
                                Bilgilerini test et, yeni şeyler öğren ve kendini geliştir.
                            </p>
                        </div>
                    </div>

                    <div className="group bg-gradient-to-br from-amber-400 to-orange-500 p-1 rounded-2xl hover:scale-105 transition-all duration-300">
                        <div className="bg-white p-6 rounded-xl h-full">
                            <div className="mb-4 transform group-hover:scale-110 transition-transform duration-300 flex justify-center">
                                <div className="text-6xl bg-gradient-to-r from-amber-400 to-orange-500 rounded-full p-4 shadow-lg">
                                    ⭐
                                </div>
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-center bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                                Puan Kazan
                            </h3>
                            <p className="text-gray-600 text-center leading-relaxed">
                                Her doğru cevap için puan kazan ve seviye atla.
                            </p>
                        </div>
                    </div>

                    <div className="group bg-gradient-to-br from-emerald-400 to-teal-500 p-1 rounded-2xl hover:scale-105 transition-all duration-300">
                        <div className="bg-white p-6 rounded-xl h-full">
                            <div className="mb-4 transform group-hover:scale-110 transition-transform duration-300 flex justify-center">
                                <div className="text-6xl bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full p-4 shadow-lg">
                                    📊
                                </div>
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-center bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                                İlerlemeni Takip Et
                            </h3>
                            <p className="text-gray-600 text-center leading-relaxed">
                                Gelişimini grafiklerle takip et ve başarını gör.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
