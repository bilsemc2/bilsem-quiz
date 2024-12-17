import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { PuzzleData, getRecentPuzzles, subscribeToNewPuzzles } from '@/lib/puzzleService';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import Link from 'next/link';
import PuzzlePreview from '@/components/PuzzlePreview';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const HomePage = () => {
  const [recentPuzzles, setRecentPuzzles] = useState<PuzzleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalQuestions: 100,
    activeUsers: 203,
    highestScore: 11360
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

    // Cleanup subscription
    return () => {
      unsubscribe();
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
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-white">
      {/* Hero Section - Now at the top */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h1 className="text-5xl font-bold text-gray-900">Bilsem Quiz</h1>
          <p className="text-xl text-gray-600">Öğrenmeyi Eğlenceli Hale Getirin</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/quiz">
              <Button className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-full text-lg font-medium transition-colors">
                Quiz'e Başla
              </Button>
            </Link>
            <Link href="/duello">
              <Button className="w-full sm:w-auto bg-pink-600 hover:bg-pink-700 text-white px-8 py-3 rounded-full text-lg font-medium transition-colors">
                Düello Başlat
              </Button>
            </Link>
          </div>
          <p className="text-sm text-gray-500 italic max-w-2xl mx-auto">
            Her girişte karışık 10 soru gelmektedir. Soru sayısı arttıkça benzer soruların gelme olasılığı düşecektir.
          </p>
        </div>
      </div>

      {/* Stats Section - In the middle */}
      <div className="container mx-auto px-4 py-16 border-t border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">{stats.totalQuestions}</div>
            <div className="text-gray-600">Toplam Soru</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-pink-600 mb-2">{stats.activeUsers}</div>
            <div className="text-gray-600">Aktif Kullanıcı</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">{stats.highestScore}</div>
            <div className="text-gray-600">En Yüksek Skor</div>
          </div>
        </div>
      </div>

      {/* Recent Puzzles Section - Now at the bottom */}
      <div className="container mx-auto px-4 py-12 border-t border-gray-100">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Son Eklenen Bulmacalar
            </h2>
            <p className="mt-2 text-gray-600">En son eklenen bulmacaları keşfedin ve çözün</p>
          </div>
          <Link href="/puzzles" className="text-purple-600 hover:text-purple-700 text-sm font-medium transition-colors">
            Tümünü Gör →
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {recentPuzzles.map((puzzle) => (
            <Link key={puzzle.id} href={`/puzzle/${puzzle.id}`}>
              <Card className="group overflow-hidden bg-white hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-purple-200">
                <div className="relative">
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-gray-600 font-medium">
                    {formatDistanceToNow(new Date(puzzle.created_at!), { 
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
              </Card>
            </Link>
          ))}
          
          <Link href="/create">
            <Card className="group h-full bg-white hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="h-full relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus className="w-8 h-8 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-gray-800 mb-2">Sen de Oluştur!</p>
                    <p className="text-gray-600">Kendi bulmacalarını oluşturmaya başla</p>
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
