import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import PuzzleRating from '../components/PuzzleRating';
import PuzzlePreview from '../components/PuzzlePreview';

interface Puzzle {
  id: string;
  title: string;
  created_at: string;
  grid: any[][];
  created_by: string;
  updated_at: string;
  approved: boolean;
}

export default function PuzzlePage() {
  const { id } = useParams<{ id: string }>();
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPuzzle();
  }, [id]);

  const fetchPuzzle = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('puzzles')
        .select('id, title, created_at, grid, created_by, updated_at, approved')
        .eq('id', id)
        .single();

      if (error) throw error;
      setPuzzle(data);
    } catch (error) {
      console.error('Error fetching puzzle:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!puzzle) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-red-600">Bulmaca bulunamadı</h1>
      </div>
    );
  }

  if (!puzzle.approved) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-yellow-600">Bu bulmaca henüz onaylanmamış</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold mb-4">{puzzle.title}</h1>
        <div className="mb-6">
          <p className="text-gray-500 text-sm">
            Oluşturulma: {new Date(puzzle.created_at).toLocaleDateString('tr-TR')}
          </p>
          {puzzle.updated_at && puzzle.updated_at !== puzzle.created_at && (
            <p className="text-gray-500 text-sm">
              Güncelleme: {new Date(puzzle.updated_at).toLocaleDateString('tr-TR')}
            </p>
          )}
        </div>

        <div className="mb-8">
          {puzzle.grid && (
            <PuzzlePreview
              grid={puzzle.grid}
              scale="scale-100"
            />
          )}
        </div>

        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">Bulmacayı Değerlendir</h2>
          <PuzzleRating puzzleId={puzzle.id} />
        </div>
      </div>
    </div>
  );
}
