import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { PuzzleData, getRecentPuzzles, subscribeToNewPuzzles } from '@/lib/puzzleService';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import PuzzlePreview from '@/components/PuzzlePreview';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { MAX_QUESTION_NUMBER } from '@/config/constants';
import { supabase } from '@/lib/supabase';

const HomePage = () => {
  const [recentPuzzles, setRecentPuzzles] = useState<PuzzleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalQuestions: MAX_QUESTION_NUMBER,
    activeUsers: 0,
    highestScore: 0
  });

  useEffect(() => {
    const loadPuzzles = async () => {
      try {
        const puzzles = await getRecentPuzzles();
        setRecentPuzzles(puzzles);
      } catch (err) {
        setError('Bulmacalar yüklenirken bir hata oluştu');
        console.error('Error loading puzzles:', err);
      } finally {
        setLoading(false);
      }
    };

    const loadStats = async () => {
      try {
        // Aktif kullanıcı sayısını al (son 30 gün içinde giriş yapmış)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const { count: activeUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('last_seen', thirtyDaysAgo.toISOString());

        // En yüksek skoru al
        const { data: highestScoreData } = await supabase
          .from('profiles')
          .select('points')
          .order('points', { ascending: false })
          .limit(1);

        setStats(prev => ({
          ...prev,
          activeUsers: activeUsers || 0,
          highestScore: highestScoreData?.[0]?.points || 0
        }));
      } catch (err) {
        console.error('Error loading stats:', err);
      }
    };

    // Initial load
    loadPuzzles();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToNewPuzzles((newPuzzle) => {
      setRecentPuzzles(prev => {
        // Add new puzzle at the beginning and keep only 6 puzzles
        const updated = [newPuzzle, ...prev].slice(0, 6);
        return updated;
      });
    });

    loadStats();
    const interval = setInterval(loadStats, 30000); // Her 30 saniyede bir güncelle

    // Cleanup subscription
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Hero Section - Modern and Playful */}
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left side - Logo and Text */}
            <div className="text-center md:text-left space-y-6 order-2 md:order-1">
              {/* Logo Image */}
              <div className="inline-block">
                <img
                  src="/images/beyninikullan.png"
                  alt="Beynini Kullan"
                  className="w-72 md:w-96 mx-auto md:mx-0 animate-bounce-slow"
                />
              </div>

              <p className="text-xl md:text-2xl text-gray-700 font-medium">
                Öğrenmeyi Eğlenceli Hale Getirin! 🎯
              </p>

              <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-4">
                <Link to="/quiz" className="transform hover:scale-105 transition-transform">
                  <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-10 py-4 rounded-2xl text-lg font-bold shadow-lg hover:shadow-xl transition-all">
                    🎮 Quiz'e Başla
                  </Button>
                </Link>
                <Link to="/duello" className="transform hover:scale-105 transition-transform">
                  <Button className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white px-10 py-4 rounded-2xl text-lg font-bold shadow-lg hover:shadow-xl transition-all">
                    ⚔️ Düello Başlat
                  </Button>
                </Link>
              </div>

              <p className="text-sm text-gray-600 italic max-w-lg mx-auto md:mx-0 bg-white/50 backdrop-blur-sm p-3 rounded-lg">
                💡 Her girişte karışık 10 soru gelmektedir. Soru sayısı arttıkça benzer soruların gelme olasılığı düşecektir.
              </p>
            </div>

            {/* Right side - Character */}
            <div className="flex justify-center order-1 md:order-2">
              <div className="relative">
                {/* Decorative circles */}
                <div className="absolute -top-4 -left-4 w-24 h-24 bg-blue-300 rounded-full opacity-50 animate-pulse"></div>
                <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-pink-300 rounded-full opacity-50 animate-pulse" style={{ animationDelay: '0.5s' }}></div>

                {/* Character Image */}
                <img
                  src="/images/beyni.png"
                  alt="Beyin Karakteri"
                  className="w-64 md:w-80 relative z-10 animate-float"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section - Colorful Cards */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Total Questions Card */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-6 text-white shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 hover:-rotate-1">
            <div className="flex items-center justify-between mb-4">
              <div className="text-5xl">📚</div>
              <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold">
                Sorular
              </div>
            </div>
            <div className="text-4xl font-bold mb-2">{stats.totalQuestions}</div>
            <div className="text-blue-100 font-medium">Toplam Soru</div>
          </div>

          {/* Active Users Card */}
          <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-3xl p-6 text-white shadow-xl hover:shadow-2xl transition-all transform hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <div className="text-5xl">👥</div>
              <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold">
                Aktif
              </div>
            </div>
            <div className="text-4xl font-bold mb-2">{stats.activeUsers}</div>
            <div className="text-pink-100 font-medium">Aktif Kullanıcı</div>
          </div>

          {/* Highest Score Card */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl p-6 text-white shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 hover:rotate-1">
            <div className="flex items-center justify-between mb-4">
              <div className="text-5xl">🏆</div>
              <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold">
                Rekor
              </div>
            </div>
            <div className="text-4xl font-bold mb-2">{stats.highestScore}</div>
            <div className="text-purple-100 font-medium">En Yüksek Skor</div>
          </div>
        </div>
      </div>

      {/* Recent Puzzles Section - Playful Design */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
            🧩 Son Eklenen Bulmacalar
          </h2>
          <p className="text-lg text-gray-600">En son eklenen bulmacaları keşfedin ve çözün</p>
          <Link to="/puzzles" className="inline-block mt-4 text-purple-600 hover:text-purple-700 font-semibold transition-colors bg-purple-50 px-6 py-2 rounded-full hover:bg-purple-100">
            Tümünü Gör →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {recentPuzzles.map((puzzle, index) => (
            <Link key={puzzle.id} to={`/puzzle/${puzzle.id}`}>
              <Card className="group overflow-hidden bg-white hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-purple-300 rounded-2xl transform hover:-translate-y-2">
                <div className="relative">
                  <div className="absolute top-3 right-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg z-10">
                    {formatDistanceToNow(new Date(puzzle.created_at!), {
                      addSuffix: true,
                      locale: tr
                    })}
                  </div>
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-700 z-10">
                    {index === 0 ? '🆕 Yeni' : `#${index + 1}`}
                  </div>
                  <div className="p-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
                    <PuzzlePreview grid={puzzle.grid} size="sm" />
                  </div>
                </div>
                <div className="p-5 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-green-500 rounded-full animate-pulse"></div>
                      <p className="text-sm font-bold text-gray-800">Bulmaca #{puzzle.id.slice(-4)}</p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                      <span className="inline-flex items-center text-purple-600 font-bold text-sm bg-purple-50 px-3 py-1 rounded-full">
                        Çöz
                        <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}

          <Link to="/create">
            <Card className="group h-full bg-gradient-to-br from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 hover:shadow-2xl transition-all duration-300 overflow-hidden rounded-2xl border-2 border-dashed border-purple-300 hover:border-solid transform hover:-translate-y-2">
              <div className="h-full relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative h-full flex flex-col items-center justify-center p-8 text-center space-y-4 min-h-[280px]">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                    <Plus className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-800 mb-2">✨ Sen de Oluştur!</p>
                    <p className="text-gray-700 font-medium">Kendi bulmacalarını oluşturmaya başla</p>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
