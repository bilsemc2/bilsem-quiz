import React, { useState, useEffect } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface PuzzleRatingProps {
    puzzleId: string;
}

export default function PuzzleRating({ puzzleId }: PuzzleRatingProps) {
    const { user } = useAuth();
    const [rating, setRating] = useState<number | null>(null);
    const [hoveredRating, setHoveredRating] = useState<number | null>(null);
    const [comment, setComment] = useState('');
    const [originalComment, setOriginalComment] = useState('');
    const [averageRating, setAverageRating] = useState<number | null>(null);
    const [totalRatings, setTotalRatings] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            fetchUserRating();
            fetchPuzzleStats();
        }
    }, [puzzleId, user]);

    const fetchUserRating = async () => {
        try {
            const { data, error } = await supabase
                .from('puzzle_ratings')
                .select('rating, comment')
                .eq('puzzle_id', puzzleId)
                .eq('user_id', user?.id)
                .maybeSingle();

            if (error) {
                console.error('Error fetching user rating:', error);
                return;
            }

            if (data) {
                setRating(data.rating);
                setComment(data.comment || '');
                setOriginalComment(data.comment || '');
            } else {
                setRating(null);
                setComment('');
                setOriginalComment('');
            }
        } catch (error) {
            console.error('Error fetching user rating:', error);
        }
    };

    const fetchPuzzleStats = async () => {
        try {
            const { data, error } = await supabase
                .from('puzzle_stats')
                .select('average_rating, total_ratings')
                .eq('id', puzzleId)
                .maybeSingle();

            if (error) {
                console.error('Error fetching puzzle stats:', error);
                return;
            }

            if (data) {
                setAverageRating(data.average_rating);
                setTotalRatings(data.total_ratings);
            } else {
                setAverageRating(null);
                setTotalRatings(0);
            }
        } catch (error) {
            console.error('Error fetching puzzle stats:', error);
        }
    };

    const handleRating = async (value: number) => {
        if (!user) {
            toast.error('Puanlama yapmak için giriş yapmalısınız');
            return;
        }

        setLoading(true);
        try {
            const { data: existingRating } = await supabase
                .from('puzzle_ratings')
                .select('id')
                .eq('puzzle_id', puzzleId)
                .eq('user_id', user.id)
                .maybeSingle();

            let error;
            if (existingRating) {
                const { error: updateError } = await supabase
                    .from('puzzle_ratings')
                    .update({
                        rating: value,
                        comment: comment,
                    })
                    .eq('puzzle_id', puzzleId)
                    .eq('user_id', user.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('puzzle_ratings')
                    .insert({
                        puzzle_id: puzzleId,
                        user_id: user.id,
                        rating: value,
                        comment: comment,
                    });
                error = insertError;
            }

            if (error) throw error;

            setRating(value);
            setOriginalComment(comment);
            await fetchPuzzleStats();
            toast.success(existingRating ? 'Puanınız güncellendi' : 'Puanınız kaydedildi');
        } catch (error) {
            console.error('Error saving rating:', error);
            toast.error('Puanlama kaydedilirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const handleCommentUpdate = async () => {
        if (!user || !rating) {
            toast.error('Önce puan vermelisiniz');
            return;
        }

        if (comment === originalComment) {
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase
                .from('puzzle_ratings')
                .update({
                    comment: comment,
                })
                .eq('puzzle_id', puzzleId)
                .eq('user_id', user.id);

            if (error) throw error;

            setOriginalComment(comment);
            toast.success('Yorumunuz güncellendi');
        } catch (error) {
            console.error('Error updating comment:', error);
            toast.error('Yorum güncellenirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="bg-white rounded-lg shadow p-6 mt-8">
                <p className="text-gray-600">Puanlama yapmak için giriş yapmalısınız.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow p-6 mt-8">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Bulmacayı Değerlendir</h3>
                {averageRating !== null && (
                    <div className="text-sm text-gray-600">
                        Ortalama: {averageRating.toFixed(1)} ({totalRatings} değerlendirme)
                    </div>
                )}
            </div>
            
            <div className="flex items-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((value) => (
                    <StarIcon
                        key={value}
                        className={`h-8 w-8 ${loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${
                            (hoveredRating || rating || 0) >= value
                                ? 'text-yellow-400'
                                : 'text-gray-300'
                        }`}
                        onMouseEnter={() => !loading && setHoveredRating(value)}
                        onMouseLeave={() => !loading && setHoveredRating(null)}
                        onClick={() => !loading && handleRating(value)}
                    />
                ))}
            </div>

            <div className="relative">
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Yorumunuzu buraya yazın (isteğe bağlı)"
                    className="w-full p-2 border rounded-lg mb-2"
                    rows={3}
                    disabled={loading}
                />
                {comment !== originalComment && (
                    <button
                        onClick={handleCommentUpdate}
                        disabled={loading || !rating}
                        className="absolute bottom-4 right-2 px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                        Yorumu Güncelle
                    </button>
                )}
            </div>

            {loading && (
                <div className="text-sm text-gray-600 mt-2">
                    İşleminiz gerçekleştiriliyor...
                </div>
            )}
        </div>
    );
}
