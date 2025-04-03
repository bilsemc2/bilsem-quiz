import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import QuestionCount from '../components/QuestionCount';
import GununSorusu from '../components/GununSorusu'; // Günün Sorusu bileşeni

interface LeaderUser {
    id: string;
    name: string;
    avatar_url: string;
    points: number;
    email: string;
    score?: number;
    performance?: {
        completed_at: string;
        title: string;
        score: number;
        completion_rate: number;
    }[];
}

// Slider verisi artık kullanılmayacak, isterseniz silebilirsiniz
// const slides = [ ... ];

export default function HomePage() {
    const [leaders, setLeaders] = useState<LeaderUser[]>([]);
    // currentSlide state'i artık kullanılmayacak, isterseniz silebilirsiniz
    // const [currentSlide, setCurrentSlide] = useState(0);
    const [activeStudentCount, setActiveStudentCount] = useState(0);
    const { user } = useAuth();

    useEffect(() => {
        const fetchLeaders = async () => {
            try {
                // Tüm sınıflar için liderlik tablosunu al
                const { data: classesData, error: classesError } = await supabase
                    .from('classes')
                    .select('id')
                    .limit(5); // En fazla 5 sınıf için liderlik tablosu al
                
                if (classesError) {
                    console.error('Sınıflar alınırken hata:', classesError);
                    return;
                }
                
                if (!classesData || classesData.length === 0) {
                    console.log('Hiç sınıf bulunamadı');
                    return;
                }
                
                // Tüm sınıflar için liderlik tablosunu al ve birleştir
                const leaderboardPromises = classesData.map(async (classItem) => {
                    const { data, error } = await supabase
                        .rpc('get_class_leaderboard', { class_id: classItem.id });
                        
                    if (error) {
                        console.error(`${classItem.id} sınıfı için liderlik tablosu alınırken hata:`, error);
                        return [];
                    }
                    
                    return data || [];
                });
                
                // Tüm liderlik tablolarını bekle ve birleştir
                const allLeaderboards = await Promise.all(leaderboardPromises);
                
                // Tüm liderlik tablolarını düzleştir ve birleştir
                const combinedLeaderboard = allLeaderboards.flat();
                
                // Öğrenci ID'sine göre en yüksek puanları al
                const studentMap = new Map();
                combinedLeaderboard.forEach(entry => {
                    if (!studentMap.has(entry.student_id) || 
                        studentMap.get(entry.student_id).total_score < entry.total_score) {
                        studentMap.set(entry.student_id, entry);
                    }
                });
                
                // En yüksek puanlı 10 öğrenciyi al
                const topLeaders = Array.from(studentMap.values())
                    .sort((a, b) => b.total_score - a.total_score)
                    .slice(0, 10);
                
                // İsimleri maskeleme fonksiyonu
                const maskName = (name: string) => {
                    if (!name) return '';
                    
                    // İsmi boşluklara göre böl
                    const nameParts = name.split(' ');
                    
                    // Her bir parçayı maskele
                    return nameParts.map(part => {
                        if (part.length <= 1) return part;
                        return part[0] + '*'.repeat(part.length - 1);
                    }).join(' ');
                };
                
                // Liderlik tablosunu LeaderUser formatına dönüştür
                const formattedLeaders = topLeaders.map(leader => {
                    // İsmi maskele
                    const maskedName = maskName(leader.student_name);
                    
                    return {
                        id: leader.student_id,
                        name: maskedName,
                        avatar_url: leader.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(leader.student_name)}`,
                        points: 0, // Bu alanı doldurabilirsiniz
                        email: '', // Bu alanı doldurabilirsiniz
                        score: leader.total_score,
                        performance: [{
                            completed_at: new Date().toISOString(),
                            title: 'Sınıf Performansı',
                            score: leader.completion_rate,
                            completion_rate: leader.completion_rate
                        }]
                    };
                });
                
                setLeaders(formattedLeaders);
            } catch (err) {
                console.error('Lider tablosu yüklenirken hata oluştu:', err);
            }

            // Toplam öğrenci sayısını al
            try {
                const { count, error: countError } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true });

                if (countError) {
                    console.error('Error fetching student count:', countError);
                    return;
                }

                setActiveStudentCount(count || 0);
            } catch (countErr) {
                console.error('Öğrenci sayısı alınırken hata:', countErr);
            }
        };

        fetchLeaders();
        const interval = setInterval(fetchLeaders, 30000);
        return () => clearInterval(interval);
    }, []);

    // Slider için olan useEffect artık gerekli değil, silebilirsiniz
    // useEffect(() => { ... }, []);

    // goToSlide fonksiyonu artık gerekli değil, silebilirsiniz
    // const goToSlide = (index: number) => { ... };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12"> {/* Padding ayarlandı */}
                {/* Header */}
                <div className="text-center mb-10">
                     {/* ... (Header içeriği - Değişiklik yok) ... */}
                     <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                        Bilsemc2 - Zeka Gelişim Platformu
                    </h1>
                    <p className="text-lg sm:text-xl text-gray-600 mb-6">
                        Öğrenmeyi Eğlenceye Dönüştürün!
                    </p>
                    {user ? (
                        <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4"> {/* Mobil için düzenleme */}
                            <Link
                                to="/quiz"
                                className="inline-block w-full sm:w-48 text-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                                Sınava Başla
                            </Link>
                            <Link
                                to="/duel"
                                className="inline-block w-full sm:w-48 text-center bg-gradient-to-r from-pink-600 to-red-600 text-white px-6 py-3 rounded-xl font-semibold text-lg hover:from-pink-700 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                                Düello Başlat
                            </Link>
                        </div>
                    ) : (
                         <div className="space-y-4">
                            {/* ... (Giriş yapmamış kullanıcı butonu - Değişiklik yok) ... */}
                            <div className="relative group inline-block">
                                <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
                                <Link
                                    to="/login"
                                    className="relative block bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105" // Biraz büyütüldü
                                >
                                    Maceraya Başla!
                                </Link>
                            </div>
                             <p className="text-sm text-indigo-600 font-medium animate-bounce">
                                🎮 Heyecan verici görevler ve düellolar için giriş yapın!
                            </p>
                         </div>
                    )}
                     <p className="text-sm text-gray-500 italic mt-3 max-w-md mx-auto">
                        Her girişte karışık 10 soru gelmektedir.
                    </p>
                </div>

                {/* --- Ana İçerik Alanı: Günün Sorusu ve Liderlik --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">

                    {/* --- Günün Sorusu Alanı (Ön Plana Alındı) --- */}
                    <div className="lg:col-span-2 bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 rounded-xl shadow-xl p-6 border-2 border-orange-200 flex flex-col"> {/* Dikkat çekici stil */}
                        <h2 className="text-2xl sm:text-3xl font-bold text-center text-orange-700 mb-5 pb-3 border-b border-orange-200">
                            💡 Günün Sorusu 💡
                        </h2>
                        <div className="flex-grow flex items-center justify-center">
                            {/* GununSorusu bileşeninin içeriği ortalayacağını varsayıyoruz */}
                            <GununSorusu />
                        </div>
                         {/* İsteğe bağlı: Çözüm veya tartışma linki
                         <div className="mt-4 text-center">
                             <Link to="/gunun-sorusu" className="text-sm text-orange-600 hover:underline font-medium">
                                 Çözümü Gör / Tartışmaya Katıl
                             </Link>
                         </div>
                         */}
                    </div>

                    {/* Liderlik Tablosu Alanı */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                           🏆 Lider Tablosu
                       </h3>
                        <div className="space-y-4">
                           {/* ... (Liderlik Tablosu içeriği - Değişiklik Yok) ... */}
                           {leaders.slice(0, 5).map((leader, index) => (
                                <div
                                    key={leader.id}
                                    className="flex items-center space-x-4 p-2 rounded-md hover:bg-gray-50"
                                >
                                    <span className="font-semibold text-indigo-600 w-5 text-right">{index + 1}.</span>
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
                                            {leader.score} puan
                                        </p>
                                        {leader.performance && leader.performance.length > 0 && (
                                            <p className="text-xs text-indigo-500 mt-1">
                                                Son test: {leader.performance[leader.performance.length - 1].score}%
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {leaders.length === 0 && <p className='text-sm text-gray-500 text-center py-4'>Liderlik tablosu yakında dolacak!</p>}
                        </div>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12 border-t border-gray-200 pt-10">
                    {/* ... (İstatistikler içeriği - Değişiklik Yok) ... */}
                    <QuestionCount />
                    <div className="bg-white rounded-lg shadow-lg p-6 text-center transform transition hover:scale-105 duration-300 border border-transparent hover:border-purple-300">
                        <div className="text-3xl font-bold text-purple-600 mb-2">
                            {activeStudentCount}
                        </div>
                        <div className="text-gray-600 text-sm font-medium">
                            Aktif Öğrenci
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-lg p-6 text-center transform transition hover:scale-105 duration-300 border border-transparent hover:border-pink-300">
                         <div className="text-3xl font-bold text-pink-600 mb-2">
                            {leaders.length > 0 ? leaders[0].score : 0}
                        </div>
                        <div className="text-gray-600 text-sm font-medium">
                            En Yüksek Puan
                        </div>
                    </div>
                </div>

                 {/* Quizizz Sürprizi gibi diğer içerikler buraya eklenebilir */}
                 {/*
                 <div className="container mx-auto px-4 py-8 border-t border-gray-200">
                      <h2 className="text-xl font-semibold text-gray-700 mb-4 text-center">Sürpriz Test</h2>
                     <QuizizzSurprise currentUser={user} />
                 </div>
                 */}

                 {/* Eski Günün Sorusu bölümü buradan kaldırıldı */}

            </div>
        </div>
    );
}