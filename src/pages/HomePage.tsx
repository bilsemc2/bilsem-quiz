import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface LeaderUser {
    id: string;
    name: string;
    avatar_url: string;
    points: number;
    email: string;
}

const slides = [
    { id: 1, image: '/images/hero-kids.png', alt: 'Bilsem Quiz Hero' },
    { id: 2, image: '/images/hero-2.png', alt: 'Bilsem Quiz Learning' },
    { id: 3, image: '/images/hero-3.png', alt: 'Bilsem Quiz Success' },
];

export default function HomePage() {
    const [leaders, setLeaders] = useState<LeaderUser[]>([]);
    const [currentSlide, setCurrentSlide] = useState(0);
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
        };

        fetchLeaders();
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                            Bilsem Quiz
                        </span>
                    </h1>
                    <p className="mt-4 text-xl text-gray-600">
                        Öğrenmeyi Eğlenceli Hale Getirin
                    </p>
                </div>

                {/* Hero Section with Slider and Leaderboard */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
                    {/* Slider */}
                    <div className="lg:col-span-2 relative h-[400px] overflow-hidden rounded-2xl shadow-2xl">
                        <div
                            className="absolute inset-0 flex transition-transform duration-500 ease-in-out"
                            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                        >
                            {slides.map((slide) => (
                                <div key={slide.id} className="min-w-full">
                                    <img
                                        src={slide.image}
                                        alt={slide.alt}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                            {slides.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => goToSlide(index)}
                                    className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                                        currentSlide === index ? 'bg-white' : 'bg-white/50'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Leaderboard */}
                    <div className="bg-white rounded-2xl shadow-xl p-4 h-[400px] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4 text-gray-800 sticky top-0 bg-white pb-2">🏆 Lider Tablosu</h2>
                        <div className="grid gap-2">
                            {leaders.map((leader, index) => (
                                <div
                                    key={leader.id}
                                    className="flex items-center p-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg"
                                >
                                    <div className="flex-shrink-0 w-8 h-8 mr-2">
                                        <img
                                            src={leader.avatar_url}
                                            alt={leader.name}
                                            className="w-full h-full rounded-full"
                                        />
                                    </div>
                                    <div className="flex-grow">
                                        <h3 className="font-medium text-sm text-gray-800">{leader.name}</h3>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="text-base font-bold text-indigo-600">{leader.points}</span>
                                        <span className="ml-1 text-xs text-gray-500">puan</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center space-x-4 mb-12">
                    {user ? (
                        <Link
                            to="/quiz"
                            className="px-8 py-3 text-lg font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                            Quiz'e Başla
                        </Link>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className="px-8 py-3 text-lg font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                                Giriş Yap
                            </Link>
                            <Link
                                to="/signup"
                                className="px-8 py-3 text-lg font-semibold text-indigo-600 bg-white border-2 border-indigo-100 rounded-xl hover:bg-indigo-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                                Kayıt Ol
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
