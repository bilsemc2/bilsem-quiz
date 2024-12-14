import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { PuzzleData, getPuzzles } from '@/lib/puzzleService';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import Link from 'next/link';

const HomePage = () => {
  const [recentPuzzles, setRecentPuzzles] = useState<PuzzleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPuzzles = async () => {
      try {
        const puzzles = await getPuzzles();
        setRecentPuzzles(puzzles.slice(0, 6)); // Son 6 bulmacayı göster
      } catch (err) {
        setError('Bulmacalar yüklenirken bir hata oluştu');
        console.error('Error loading puzzles:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPuzzles();
  }, []);

  const renderPuzzlePreview = (grid: any[][]) => {
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
                  {cell.svg}
                </div>
              )}
            </div>
          ))
        ))}
      </div>
    );
  };

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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Mantık Bulmacaları</h1>
        <Link
          href="/create"
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Yeni Bulmaca Oluştur
        </Link>
      </div>

      {recentPuzzles.length === 0 ? (
        <div className="text-center text-gray-500 p-8">
          Henüz hiç bulmaca oluşturulmamış.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentPuzzles.map((puzzle) => (
            <Link key={puzzle.id} href={`/puzzle/${puzzle.id}`}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <h2 className="text-xl font-semibold truncate">{puzzle.title}</h2>
                  <p className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(puzzle.created_at!), { 
                      addSuffix: true,
                      locale: tr 
                    })}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center">
                    {renderPuzzlePreview(puzzle.grid)}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default HomePage;
