import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import QuestionCount from '../components/QuestionCount';
import { PuzzleData, getPuzzles } from '../lib/puzzleService';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface LeaderUser {
    id: string;
    name: string;
    avatar_url: string;
    points: number;
    email: string;
}

const slides = [
    { id: 1, image: '/images/k1.jpg', alt: 'Bilsem Quiz Hero' },
    { id: 2, image: '/images/k2.jpg', alt: 'Bilsem Quiz Learning' },
    { id: 3, image: '/images/k3.jpg', alt: 'Bilsem Quiz Success' },
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

    const renderPuzzlePreview = (grid: any[][]) => {
        // İngilizce-Türkçe eşleştirme tabloları
        const animalMap: { [key: string]: string } = {
            'Kedi': 'cat',
            'Köpek': 'dog',
            'Kuş': 'bird',
            'Balık': 'fish',
            'Tavşan': 'rabbit',
            'Kaplumbağa': 'turtle',
            'Fare': 'mouse',
            'At': 'horse'
        };

        const professionMap: { [key: string]: string } = {
            'Doktor': 'doctor',
            'Öğretmen': 'teacher',
            'Mühendis': 'engineer',
            'Aşçı': 'chef',
            'Avukat': 'lawyer',
            'Polis': 'police',
            'İtfaiyeci': 'firefighter',
            'Pilot': 'pilot'
        };

        const fruitMap: { [key: string]: string } = {
            'Elma': 'apple',
            'Muz': 'banana',
            'Portakal': 'orange',
            'Çilek': 'strawberry',
            'Üzüm': 'grape',
            'Armut': 'pear',
            'Kiraz': 'cherry',
            'Karpuz': 'watermelon'
        };

        const renderShape = (value: string) => {
            console.log('Shape value:', value); // Değeri kontrol et
            switch (value) {
                case '?':
                    return (
                        <svg viewBox="0 0 40 40" className="w-6 h-6">
                            <path
                                d="M20,30 L20,28 M20,25 L20,15 C25,15 28,13 28,10 C28,7 25,5 20,5 C15,5 12,7 12,10"
                                stroke="currentColor"
                                fill="none"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                        </svg>
                    );
                case 'Daire':
                    return (
                        <svg viewBox="0 0 40 40" className="w-6 h-6">
                            <circle cx="20" cy="20" r="15" stroke="currentColor" fill="none" strokeWidth="2" />
                        </svg>
                    );
                case 'Kare':
                    return (
                        <svg viewBox="0 0 40 40" className="w-6 h-6">
                            <rect x="5" y="5" width="30" height="30" stroke="currentColor" fill="none" strokeWidth="2" />
                        </svg>
                    );
                case 'Üçgen':
                    return (
                        <svg viewBox="0 0 40 40" className="w-6 h-6">
                            <polygon 
                                points="20,5 35,35 5,35" 
                                stroke="currentColor" 
                                fill="none" 
                                strokeWidth="2"
                            />
                        </svg>
                    );
                case 'Beşgen':
                    return (
                        <svg viewBox="0 0 40 40" className="w-6 h-6">
                            <polygon 
                                points="20,5 35,15 30,35 10,35 5,15"
                                stroke="currentColor" 
                                fill="none" 
                                strokeWidth="2"
                            />
                        </svg>
                    );
                default:
                    console.log('Shape not found:', value); // Eşleşmeyen değeri kontrol et
                    return (
                        <span className="text-lg font-bold text-gray-400">?</span>
                    );
            }
        };

        return (
            <div className="grid grid-cols-3 gap-1 w-24 h-24">
                {grid.map((row, rowIndex) => (
                    row.map((cell, colIndex) => (
                        <div
                            key={`${rowIndex}-${colIndex}`}
                            className="w-8 h-8 border rounded flex items-center justify-center bg-gray-50"
                        >
                            {cell && (
                                <div className="transform scale-75">
                                    {cell.type === 'animal' && (
                                        <img 
                                            src={`/images/animals/${animalMap[cell.value]}.png`}
                                            alt={cell.value}
                                            className="w-6 h-6 object-contain"
                                        />
                                    )}
                                    {cell.type === 'profession' && (
                                        <img 
                                            src={`/images/professions/${professionMap[cell.value]}.png`}
                                            alt={cell.value}
                                            className="w-6 h-6 object-contain"
                                        />
                                    )}
                                    {cell.type === 'fruit' && (
                                        <img 
                                            src={`/images/fruits/${fruitMap[cell.value]}.png`}
                                            alt={cell.value}
                                            className="w-6 h-6 object-contain"
                                        />
                                    )}
                                    {cell.type === 'shape' && renderShape(cell.value)}
                                    {cell.type === 'letter' && (
                                        <span className="text-lg font-bold">{cell.value}</span>
                                    )}
                                    {cell.type === 'number' && (
                                        <span className="text-lg font-bold">{cell.value}</span>
                                    )}
                                    {cell.type === 'color' && (
                                        <div 
                                            className="w-6 h-6 rounded-full" 
                                            style={{ backgroundColor: cell.value }}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                ))}
            </div>
        );
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

                {/* Recent Puzzles Section */}
                <div className="mb-16">
                    <div className="flex items-center mb-6">
                        <h2 className="text-2xl font-semibold text-gray-800">Son Eklenen Bulmacalar</h2>
                    </div>

                    {recentPuzzles.length === 0 ? (
                        <div className="text-center text-gray-500 p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                            <p className="text-base">Henüz hiç bulmaca oluşturulmamış.</p>
                            <Link
                                to="/create"
                                className="inline-block mt-2 text-indigo-600 hover:text-indigo-700 text-sm"
                            >
                                İlk bulmacayı siz oluşturun!
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {recentPuzzles.map((puzzle) => (
                                <Link key={puzzle.id} to={`/puzzle/${puzzle.id}`}>
                                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 hover:shadow-md transition-shadow relative group">
                                        <div className="flex justify-center mb-2">
                                            <div className="transform scale-100 group-hover:scale-110 transition-transform">
                                                {renderPuzzlePreview(puzzle.grid)}
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500 text-center">
                                            {formatDistanceToNow(new Date(puzzle.created_at!), {
                                                addSuffix: true,
                                                locale: tr
                                            })}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                            
                            {/* Sen de Oluştur Kartı */}
                            <Link to="/create">
                                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border-2 border-dashed border-indigo-200 p-3 hover:border-indigo-400 transition-colors h-full flex flex-col items-center justify-center group">
                                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mb-2 group-hover:bg-indigo-200 transition-colors">
                                        <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-medium text-indigo-600 group-hover:text-indigo-700 transition-colors text-center">
                                        Sen de Oluştur!
                                    </p>
                                </div>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Stats Section */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
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
                                    <div className="flex-shrink-0 w-8 text-center font-semibold">
                                        #{index + 1}
                                    </div>
                                    <div className="flex-shrink-0">
                                        <img
                                            src={leader.avatar_url}
                                            alt={leader.name}
                                            className="w-8 h-8 rounded-full"
                                        />
                                    </div>
                                    <div className="flex-1 truncate">{leader.name}</div>
                                    <div className="font-semibold text-purple-600">
                                        {leader.points}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center space-x-4 mb-12">
                    {!user && (
                        <>
                            <Link
                                to="/login"
                                className="px-8 py-3 text-lg font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                                Giriş Yap
                            </Link>
                            <Link
                                to="/signup"
                                className="px-8 py-3 text-lg font-semibold text-indigo-600 border-2 border-indigo-600 rounded-xl hover:bg-indigo-50 transition-all duration-200"
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
