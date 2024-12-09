import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface LeaderUser {
    id: string;
    name: string;
    avatar_url: string;
    points: number;
}

export const HomePage: React.FC = () => {
    const [leader, setLeader] = useState<LeaderUser | null>(null);

    useEffect(() => {
        const fetchLeader = async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, name, avatar_url, points')
                .order('points', { ascending: false })
                .limit(1)
                .single();

            if (error) {
                console.error('Error fetching leader:', error);
                return;
            }

            if (data) {
                setLeader(data);
            }
        };

        fetchLeader();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
                <div className="flex flex-col lg:flex-row items-start justify-between mb-16">
                    {/* Left Content */}
                    <div className="lg:w-1/2 lg:pr-12">
                        <div className="text-left">
                            <h1 className="text-5xl font-bold text-gray-900 mb-8">
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                                    BilsemC2 Quiz
                                </span>
                            </h1>
                            <p className="text-xl text-gray-600 mb-12 max-w-2xl">
                                Bilsem Sınavları için eğlenceli denemeler. Bu site bilsemc2 - yetenekvezeka tarafından geliştirilmektedir.
                    .
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
                    </div>

                    {/* Right Content - Leader Section */}
                    <div className="lg:w-1/2 mt-12 lg:mt-0">
                        <div className="relative w-full max-w-md ml-auto">
                            {leader && (
                                <div className="bg-white p-6 rounded-2xl shadow-xl transform hover:scale-[1.02] transition-all duration-300">
                                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                        <div className="bg-yellow-400 text-white px-4 py-1 rounded-full font-bold shadow-lg">
                                            👑 Lider
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <img
                                            src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${leader.name}&backgroundColor=b6e3f4,c0aede,d1d4f9&mood=happy`}
                                            alt={`${leader.name} avatar`}
                                            className="w-32 h-32 rounded-full mb-4 border-4 border-yellow-400 shadow-lg"
                                        />
                                        <h3 className="text-xl font-bold text-gray-800 mb-2">{leader.name}</h3>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-yellow-500">⭐</span>
                                            <span className="text-lg font-semibold text-gray-700">{leader.points} puan</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Features Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
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
