import React, { useEffect, useState } from 'react';
import { PuzzleData, getAllPuzzles, approvePuzzle, rejectPuzzle } from '../../lib/puzzleService';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import PuzzlePreview from '../../components/PuzzlePreview';

export default function PuzzleManagement() {
    const [puzzles, setPuzzles] = useState<PuzzleData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPuzzles();
    }, []);

    const fetchPuzzles = async () => {
        try {
            const data = await getAllPuzzles();
            setPuzzles(data);
        } catch (error) {
            console.error('Error fetching puzzles:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        try {
            await approvePuzzle(id);
            await fetchPuzzles(); // Listeyi yenile
        } catch (error) {
            console.error('Error approving puzzle:', error);
        }
    };

    const handleReject = async (id: string) => {
        if (window.confirm('Bu bulmacayı silmek istediğinize emin misiniz?')) {
            try {
                await rejectPuzzle(id);
                await fetchPuzzles(); // Listeyi yenile
            } catch (error) {
                console.error('Error rejecting puzzle:', error);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-semibold text-gray-900">Bulmaca Yönetimi</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        Tüm bulmacaları görüntüleyin, onaylayın veya silin.
                    </p>
                </div>
            </div>

            <div className="mt-8 flex flex-col">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle">
                        <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 lg:pl-8">
                                            Önizleme
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Oluşturulma Tarihi
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Durum
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            İşlemler
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {puzzles.map((puzzle) => (
                                        <tr key={puzzle.id}>
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6 lg:pl-8">
                                                <div className="flex items-center">
                                                    <div className="h-24 w-24 flex-shrink-0">
                                                        <PuzzlePreview grid={puzzle.grid} scale="scale-100" />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                {formatDistanceToNow(new Date(puzzle.created_at), {
                                                    addSuffix: true,
                                                    locale: tr
                                                })}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                                    puzzle.approved
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {puzzle.approved ? 'Onaylı' : 'Beklemede'}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                {!puzzle.approved && (
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => handleApprove(puzzle.id)}
                                                            className="inline-flex items-center rounded bg-green-600 px-2 py-1 text-xs font-semibold text-white hover:bg-green-700"
                                                        >
                                                            Onayla
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(puzzle.id)}
                                                            className="inline-flex items-center rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700"
                                                        >
                                                            Sil
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
