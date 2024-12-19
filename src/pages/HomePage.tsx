import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import QuestionCount from '../components/QuestionCount';
import { PuzzleData, getPuzzles } from '../lib/puzzleService';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import PuzzlePreview from '../components/PuzzlePreview';

interface LeaderUser {
    id: string;
    name: string;
    avatar_url: string;
    points: number;
    email: string;
}

const slides = [
    { id: 1, image: '/images/k1.jpeg', alt: 'Bilsem Quiz Hero' },
    { id: 2, image: '/images/k2.jpeg', alt: 'Bilsem Quiz Learning' },
    { id: 3, image: '/images/k3.jpeg', alt: 'Bilsem Quiz Success' },
];

export default function HomePage() {
    const [leaders, setLeaders] = useState<LeaderUser[]>([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [currentPuzzleSlide, setCurrentPuzzleSlide] = useState(0);
    const [recentPuzzles, setRecentPuzzles] = useState<PuzzleData[]>([]);
    const [activeStudentCount, setActiveStudentCount] = useState(0);
    const { user } = useAuth();

    useEffect(() => {
        const fetchLeaders = async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, name, avatar_url, points, email')
                .order('points', { ascending: false })
                .limit(10);

            if (error) {
                console.error('Error fetching leaders:', error);
                return;
            }

            if (data) {
                const updatedLeaders = data.map(leader => ({
                    ...leader,
                    avatar_url: leader.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(leader.email)}`
                }));
                setLeaders(updatedLeaders);
            }

            // Toplam öğrenci sayısını al
            const { count, error: countError } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true });

            if (countError) {
                console.error('Error fetching student count:', countError);
                return;
            }

            setActiveStudentCount(count || 0);
        };

        const fetchPuzzles = async () => {
            try {
                const puzzles = await getPuzzles();
                setRecentPuzzles(puzzles.slice(0, 6));

                // Eğer birden fazla bulmaca varsa slayt zamanlayıcısını başlat
                if (puzzles.length > 1) {
                    const interval = setInterval(() => {
                        setCurrentPuzzleSlide(prev => (prev + 1) % Math.min(puzzles.length, 3));
                    }, 3000);
                    return () => clearInterval(interval);
                }
            } catch (err) {
                console.error('Error loading puzzles:', err);
            }
        };

        fetchLeaders();
        fetchPuzzles();
        const interval = setInterval(fetchLeaders, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);

        return () => clearInterval(timer);
    }, []);

    const goToSlide = (index: number) => {
        setCurrentSlide(index);
    };

    const goToPuzzleSlide = (index: number) => {
        setCurrentPuzzleSlide(index);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Bilsem Quiz
                    </h1>
                    <p className="text-xl text-gray-600 mb-6">
                        Öğrenmeyi Eğlenceli Hale Getirin
                    </p>
                    {user ? (
                        <div className="flex justify-center space-x-4">
                            <Link
                                to="/quiz"
                                className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 mb-4 w-48"
                            >
                                Quiz'e Başla
                            </Link>
                            <Link
                                to="/duel"
                                className="inline-block bg-gradient-to-r from-pink-600 to-red-600 text-white px-6 py-3 rounded-xl font-semibold text-lg hover:from-pink-700 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 mb-4 w-48"
                            >
                                Düello Başlat
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="relative group inline-block">
                                <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
                                <Link
                                    to="/login"
                                    className="relative block bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 w-48"
                                >
                                    Quiz'e Başla
                                </Link>
                            </div>
                            <p className="text-sm text-indigo-600 font-medium animate-bounce">
                                🎮 Heyecan verici quizlere başlamak için giriş yapın!
                            </p>
                        </div>
                    )}
                    <p className="text-sm text-gray-500 italic mt-3 max-w-md mx-auto">
                        Her girişte karışık 10 soru gelmektedir. Soru sayısı arttıkça benzer soruların gelme olasılığı düşecektir.
                    </p>
                </div>

                {/* Hero Section with Slider and Leaderboard */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                    {/* Slider */}
                    <div className="lg:col-span-2 relative">
                        <div className="relative h-[400px] overflow-hidden rounded-lg">
                            <div
                                className="flex h-full transition-transform duration-500 ease-out"
                                style={{
                                    transform: `translateX(-${currentSlide * 100}%)`,
                                }}
                            >
                                {slides.map((s) => (
                                    <div
                                        key={s.id}
                                        className="w-full h-full flex-shrink-0 relative p-4"
                                    >
                                        <img
                                            src={s.image}
                                            alt={s.alt}
                                            className="w-full h-full object-contain rounded-lg"
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                                {slides.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => goToSlide(index)}
                                        className={`w-2 h-2 rounded-full transition-colors ${
                                            index === currentSlide
                                                ? 'bg-white'
                                                : 'bg-white/50'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Leaderboard */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h3 className="text-lg font-semibold mb-4">Lider Tablosu</h3>
                        <div className="space-y-4">
                            {leaders.slice(0, 5).map((leader, index) => (
                                <div
                                    key={leader.id}
                                    className="flex items-center space-x-4"
                                >
                                    <div className="flex-shrink-0">
                                        <img
                                            src={leader.avatar_url}
                                            alt={leader.name}
                                            className="w-10 h-10 rounded-full"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {leader.name}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {leader.points} puan
                                        </p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                            #{index + 1}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12 border-t border-gray-100 pt-12">
                    <QuestionCount />
                    <div className="bg-white rounded-lg shadow-lg p-6 text-center transform hover:scale-105 transition-transform duration-200">
                        <div className="text-3xl font-bold text-purple-600 mb-2">
                            {activeStudentCount}
                        </div>
                        <div className="text-gray-600 text-sm">
                            Aktif Öğrenci
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-lg p-6 text-center transform hover:scale-105 transition-transform duration-200">
                        <div className="text-3xl font-bold text-pink-600 mb-2">
                            {leaders.length > 0 ? leaders[0].points : 0}
                        </div>
                        <div className="text-gray-600 text-sm">
                            En Yüksek Puan
                        </div>
                    </div>
                </div>

                {/* Recent Puzzles Section */}
                <div className="border-t border-gray-100 pt-12">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                    Son Eklenen Bulmacalar
                                </h2>
                                <p className="mt-2 text-gray-600">En son eklenen bulmacaları keşfedin ve çözün</p>
                            </div>
                            <Link 
                                to="/puzzle-ranking" 
                                className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium transition-colors"
                            >
                                Tüm Bulmacalar
                                <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {recentPuzzles.map((puzzle) => (
                                <Link key={puzzle.id} to={`/puzzle/${puzzle.id}`}>
                                    <div className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-purple-200">
                                        <div className="relative">
                                            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-gray-600 font-medium">
                                                {formatDistanceToNow(new Date(puzzle.created_at), { 
                                                    addSuffix: true,
                                                    locale: tr 
                                                })}
                                            </div>
                                            <div className="p-6 bg-gradient-to-br from-purple-50/50 to-pink-50/50">
                                                <PuzzlePreview grid={puzzle.grid} size="sm" />
                                            </div>
                                        </div>
                                        <div className="p-4 border-t border-gray-100">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                                    <p className="text-sm font-medium text-gray-700">Bulmaca #{puzzle.id.slice(-4)}</p>
                                                </div>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="inline-flex items-center text-purple-600 font-medium">
                                                        Çöz
                                                        <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                        </svg>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}

                            <Link to="/create" className="block">
                                <div className="group h-full bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
                                    <div className="h-full relative">
                                        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="relative h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
                                            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-xl font-semibold text-gray-800 mb-2">Sen de Oluştur!</p>
                                                <p className="text-gray-600">Kendi bulmacalarını oluşturmaya başla</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
