import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface LeaderUser {
    id: string;
    name: string;
    avatar_url: string;
    points: number;
}

const slides = [
    { id: 1, image: '/images/hero-kids.png', alt: 'Bilsem Quiz Hero' },
    { id: 2, image: '/images/hero-2.png', alt: 'Bilsem Quiz Learning' },
    { id: 3, image: '/images/hero-3.png', alt: 'Bilsem Quiz Success' },
];

export const HomePage: React.FC = () => {
    const [leader, setLeader] = useState<LeaderUser | null>(null);
    const [currentSlide, setCurrentSlide] = useState(0);

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

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000); 

        return () => clearInterval(timer);
    }, []);

    const goToSlide = (index: number) => {
        setCurrentSlide(index);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                {/* Header Section */}
                <div className="text-center mb-16">
                    <h1 className="text-6xl font-bold mb-6">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                            BilsemC2 Quiz
                        </span>
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto space-y-2">
                        <span className="block">Bilsem Sınavları için eğlenceli denemeler.</span>
                        <span className="block text-gray-500">Bu site bilsemc2 - yetenekvezeka tarafından geliştirilmektedir.</span>
                        <span className="block font-medium text-indigo-600">Şimdilik sadece öğretmenler için ve ücretsizdir.</span>
                    </p>
                </div>

                {/* Main Content */}
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Left Column */}
                    <div className="space-y-8">
                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <Link
                                to="/quiz"
                                className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                                <span className="mr-2">🎯</span>
                                Quiz'e Başla
                            </Link>
                            <Link
                                to="/signup"
                                className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium rounded-xl text-indigo-600 bg-white border-2 border-indigo-100 hover:bg-indigo-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                                <span className="mr-2">✍️</span>
                                Kayıt Ol
                            </Link>
                            <Link
                                to="/profile"
                                className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium rounded-xl text-indigo-600 bg-white border-2 border-indigo-100 hover:bg-indigo-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                                <span className="mr-2">👤</span>
                                Profilim
                            </Link>
                        </div>

                        {/* Feature Cards */}
                        <div className="flex flex-row gap-3 w-full mx-auto">
                            <div className="group relative flex-1 overflow-hidden bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 p-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                                <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                                <div className="relative z-10 flex items-center space-x-3">
                                    <div className="relative">
                                        <div className="absolute inset-0 animate-pulse bg-white/30 rounded-md"></div>
                                        <span className="relative text-2xl bg-gradient-to-br from-yellow-300 to-yellow-600 p-2 rounded-md backdrop-blur-sm shadow-inner inline-block">
                                            ⭐
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base font-bold text-white mb-0.5 whitespace-nowrap">Puan Kazan</h3>
                                        <p className="text-white/90 text-sm leading-relaxed truncate">
                                            Her doğru cevap için puan kazan!
                                        </p>
                                        <div className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded-full bg-white/20 text-white/90 text-xs backdrop-blur-sm">
                                            <span className="mr-1 animate-bounce">🎯</span>
                                            İlerle
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="group relative flex-1 overflow-hidden bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 p-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                                <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                                <div className="relative z-10 flex items-center space-x-3">
                                    <div className="relative">
                                        <div className="absolute inset-0 animate-pulse bg-white/30 rounded-md"></div>
                                        <span className="relative text-2xl bg-gradient-to-br from-blue-300 to-purple-600 p-2 rounded-md backdrop-blur-sm shadow-inner inline-block">
                                            📊
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base font-bold text-white mb-0.5 whitespace-nowrap">İlerlemeni Takip Et</h3>
                                        <p className="text-white/90 text-sm leading-relaxed truncate">
                                            Gelişimini grafiklerle gör!
                                        </p>
                                        <div className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded-full bg-white/20 text-white/90 text-xs backdrop-blur-sm">
                                            <span className="mr-1 animate-bounce">📈</span>
                                            Geliş
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="relative">
                        {/* Carousel */}
                        <div className="relative mx-auto max-w-md">
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-2xl transform rotate-2"></div>
                            
                            {/* Slides */}
                            <div className="relative overflow-hidden rounded-2xl">
                                <div 
                                    className="flex transition-transform duration-500 ease-out"
                                    style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                                >
                                    {slides.map((slide) => (
                                        <img
                                            key={slide.id}
                                            src={slide.image}
                                            alt={slide.alt}
                                            className="w-full h-auto object-cover flex-shrink-0 rounded-2xl shadow-xl"
                                        />
                                    ))}
                                </div>

                                {/* Navigation Dots */}
                                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                                    {slides.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => goToSlide(index)}
                                            className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                                index === currentSlide 
                                                    ? 'bg-white w-4' 
                                                    : 'bg-white/50 hover:bg-white/75'
                                            }`}
                                            aria-label={`Go to slide ${index + 1}`}
                                        />
                                    ))}
                                </div>
                            </div>
                            
                            {/* Leader Card */}
                            {leader && (
                                <div className="absolute -top-6 -right-6 w-64">
                                    <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-indigo-50 transform hover:scale-105 transition-all duration-300">
                                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                                                👑 Lider
                                            </div>
                                        </div>
                                        <div className="flex items-center pt-3">
                                            <img
                                                src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${leader.name}&backgroundColor=b6e3f4,c0aede,d1d4f9&mood=happy`}
                                                alt={`${leader.name} avatar`}
                                                className="w-12 h-12 rounded-full border-2 border-yellow-400 shadow-lg"
                                            />
                                            <div className="ml-3">
                                                <h3 className="font-semibold text-gray-800">{leader.name}</h3>
                                                <div className="flex items-center text-sm">
                                                    <span className="text-yellow-500 mr-1">⭐</span>
                                                    <span className="font-medium text-gray-600">{leader.points} puan</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default HomePage;
