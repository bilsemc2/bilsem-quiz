import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { StarIcon } from '@heroicons/react/24/solid';
import { Link } from 'react-router-dom';

interface PuzzleStats {
    id: string;
    title: string;
    created_by: string;
    created_at: string;
    average_rating: number;
    total_ratings: number;
    creator_name: string;
}

export default function PuzzleRankingPage() {
    const [puzzles, setPuzzles] = useState<PuzzleStats[]>([]);
    const [sortBy, setSortBy] = useState<'rating' | 'newest'>('rating');

    useEffect(() => {
        fetchPuzzles();
    }, [sortBy]);

    const fetchPuzzles = async () => {
        const { data, error } = await supabase
            .from('puzzle_stats')
            .select('*')
            .order(sortBy === 'rating' ? 'average_rating' : 'created_at', { ascending: false });

        if (error) {
            console.error('Error fetching puzzles:', error);
            return;
        }

        setPuzzles(data || []);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Bulmaca Sıralaması</h1>
            
            <div className="mb-6">
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'rating' | 'newest')}
                    className="block w-full md:w-48 px-4 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                    <option value="rating">En Çok Beğenilenler</option>
                    <option value="newest">En Yeniler</option>
                </select>
            </div>

            <div className="grid gap-4">
                {puzzles.map((puzzle, index) => (
                    <Link
                        key={puzzle.id}
                        to={`/puzzle/${puzzle.id}`}
                        className="block bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold">{puzzle.title}</h2>
                                <p className="text-gray-600">Oluşturan: {puzzle.creator_name}</p>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center justify-end mb-1">
                                    <StarIcon className="h-5 w-5 text-yellow-400 mr-1" />
                                    <span className="font-medium">
                                        {puzzle.average_rating ? puzzle.average_rating.toFixed(1) : 'Henüz puanlanmadı'}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500">
                                    {puzzle.total_ratings} değerlendirme
                                </p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
