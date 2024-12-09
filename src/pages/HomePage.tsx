import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import MobileMenu from '../components/MobileMenu';

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
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <Link to="/" className="text-3xl sm:text-4xl md:text-6xl font-bold">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                            BilsemC2
                        </span>
                    </Link>

                    {/* Mobile Menu */}
                    <div className="flex md:hidden items-center">
                        <MobileMenu />
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-4">
                        <Link
                            to="/quiz"
                            className="inline-flex items-center justify-center px-6 py-2 text-base font-medium rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                            <span className="mr-2">🎯</span>
                            Quiz'e Başla
                        </Link>
                        <Link
                            to="/signup"
                            className="inline-flex items-center justify-center px-6 py-2 text-base font-medium rounded-xl text-indigo-600 bg-white border-2 border-indigo-100 hover:bg-indigo-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                            <span className="mr-2">✍️</span>
                            Kayıt Ol
                        </Link>
                        <Link
                            to="/profile"
                            className="inline-flex items-center justify-center px-6 py-2 text-base font-medium rounded-xl text-indigo-600 bg-white border-2 border-indigo-100 hover:bg-indigo-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                            <span className="mr-2">👤</span>
                            Profilim
                        </Link>
                    </div>
                </div>

                {/* Description */}
                <div className="text-center mb-16">
                    <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto space-y-2">
                        <span className="block">Bilsem Sınavları için eğlenceli denemeler.</span>
                        <span className="block text-gray-500">Bu site bilsemc2 - yetenekvezeka tarafından geliştirilmektedir.</span>
                        <span className="block font-medium text-indigo-600">Şimdilik sadece öğretmenler için ve ücretsizdir.</span>
                    </p>
                </div>

                {/* Main Content */}
                <div className="grid lg:grid-cols-2 gap-8 sm:gap-16 items-center">
                    {/* Left Column */}
                    <div className="space-y-6 sm:space-y-8">
                        {/* Action Buttons */}
                        <div className="flex flex-col gap-4 justify-center lg:justify-start">
                            <Link
                                to="/quiz"
                                className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-medium rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                                <span className="mr-2">🎯</span>
                                Quiz'e Başla
                            </Link>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link
                                    to="/signup"
                                    className="flex-1 inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-medium rounded-xl text-indigo-600 bg-white border-2 border-indigo-100 hover:bg-indigo-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                                >
                                    <span className="mr-2">✍️</span>
                                    Kayıt Ol
                                </Link>
                                <Link
                                    to="/profile"
                                    className="flex-1 inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-medium rounded-xl text-indigo-600 bg-white border-2 border-indigo-100 hover:bg-indigo-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                                >
                                    <span className="mr-2">👤</span>
                                    Profilim
                                </Link>
                            </div>
                        </div>

                        {/* Leader Section */}
                        {leader && (
                            <div className="bg-white p-6 rounded-2xl shadow-lg border border-indigo-50">
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
                                    🏆 Lider
                                </h3>
                                <div className="flex items-center space-x-4">
                                    <img
                                        src={leader.avatar_url}
                                        alt={leader.name}
                                        className="w-12 h-12 sm:w-16 sm:h-16 rounded-full"
                                    />
                                    <div>
                                        <p className="text-base sm:text-lg font-medium text-gray-900">{leader.name}</p>
                                        <p className="text-sm sm:text-base text-indigo-600">{leader.points} puan</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Slider */}
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                        <div
                            className="flex transition-transform duration-500 ease-in-out"
                            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                        >
                            {slides.map((slide) => (
                                <img
                                    key={slide.id}
                                    src={slide.image}
                                    alt={slide.alt}
                                    className="w-full h-full object-cover flex-shrink-0"
                                />
                            ))}
                        </div>
                        {/* Slider Controls */}
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                            {slides.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => goToSlide(index)}
                                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                                        currentSlide === index
                                            ? 'bg-white w-4'
                                            : 'bg-white/50'
                                    }`}
                                    aria-label={`Go to slide ${index + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default HomePage;
