import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface AssignmentResult {
    id: string;
    assignment_id: string;
    student_id: string;
    answers: {
        questionNumber: number;
        isCorrect: boolean;
        selectedOption: string;
        correctOption: string;
        questionImage: string;
        isTimeout: boolean;
        options: Array<{
            id: string;
            imageUrl: string;
            isSelected: boolean;
            isCorrect: boolean;
        }>;
    }[];
    score: number;
    total_questions: number;
    completed_at: string;
    status: 'completed' | 'pending';
}

export default function AssignmentResults() {
    const { assignmentId } = useParams<{ assignmentId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState<AssignmentResult | null>(null);

    useEffect(() => {
        if (user && assignmentId) {
            loadAssignmentResult();
        }
    }, [user, assignmentId]);

    const loadAssignmentResult = async () => {
        try {
            setLoading(true);
            
            // Ödev sonucunu getir - en son sonucu al
            const { data: resultData, error: resultError } = await supabase
                .from('assignment_results')
                .select('*')
                .eq('assignment_id', assignmentId)
                .eq('student_id', user?.id)
                .order('completed_at', { ascending: false }) // En son tamamlananı al
                .limit(1) // Sadece 1 sonuç
                .single();

            if (resultError) throw resultError;
            if (!resultData) {
                toast.error('Ödev sonucu bulunamadı!');
                navigate(-1);
                return;
            }

            console.log('Yüklenen sonuç:', resultData);
            setResult(resultData);
        } catch (error) {
            console.error('Ödev sonucu yüklenirken hata:', error);
            toast.error('Ödev sonucu yüklenirken bir hata oluştu');
            navigate(-1);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!result) {
        return null;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">Ödev Sonuçları</h1>
            
            {/* Özet Bilgiler */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <h2 className="text-lg font-semibold mb-2">Genel Bilgiler</h2>
                        <p>Toplam Soru: {result.total_questions}</p>
                        <p>Doğru Sayısı: {result.answers.filter(a => a.isCorrect).length}</p>
                        <p>Yanlış Sayısı: {result.answers.filter(a => !a.isCorrect).length}</p>
                        <p>Başarı Yüzdesi: %{Math.round((result.score / result.total_questions) * 100)}</p>
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold mb-2">Tamamlanma Bilgisi</h2>
                        <p>Tarih: {new Date(result.completed_at).toLocaleString('tr-TR')}</p>
                        <p>Durum: {result.status}</p>
                    </div>
                </div>
            </div>

            {/* Soru Detayları */}
            <div className="space-y-6">
                {result.answers.map((answer, index) => (
                    <div key={index} className="bg-white rounded-lg shadow p-4">
                        <div className="grid grid-cols-12 gap-4">
                            {/* Sol taraf - Soru */}
                            <div className="col-span-5 relative">
                                {/* Quiz sırasındaki numara (sol üst) */}
                                <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold z-10">
                                    Soru {index + 1}
                                </div>
                                
                                {/* Sorunun kendi numarası (sağ alt) */}
                                <div className="absolute bottom-2 right-2 bg-gray-800 text-white px-2 py-0.5 rounded-full text-xs font-semibold z-10">
                                    #{answer.questionNumber}
                                </div>
                                
                                <div className="max-w-[300px] mx-auto">
                                    <img 
                                        src={answer.questionImage} 
                                        alt={`Soru ${answer.questionNumber}`}
                                        className="w-full h-auto rounded-lg"
                                    />
                                </div>
                            </div>

                            {/* Sağ taraf - Seçenekler */}
                            <div className="col-span-7">
                                <div className="grid grid-cols-5 gap-2">
                                    {answer.options.map((option) => (
                                        <div 
                                            key={option.id}
                                            className={`relative rounded-lg overflow-hidden border-2 ${
                                                option.isSelected && option.isCorrect ? 'border-green-500' :
                                                option.isSelected && !option.isCorrect ? 'border-red-500' :
                                                option.isCorrect ? 'border-green-500' : 'border-gray-200'
                                            }`}
                                        >
                                            <div className="max-w-[120px] mx-auto">
                                                <img 
                                                    src={option.imageUrl} 
                                                    alt={`Seçenek ${option.id}`}
                                                    className="w-full h-auto"
                                                />
                                            </div>
                                            {option.isSelected && (
                                                <div className={`absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center ${
                                                    option.isCorrect ? 'bg-green-500' : 'bg-red-500'
                                                }`}>
                                                    {option.isCorrect ? (
                                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Sonuç Göstergesi */}
                                <div className={`mt-2 p-2 rounded-lg text-sm ${
                                    answer.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                    {answer.isTimeout ? (
                                        <p>Süre doldu! Doğru cevap: {answer.options.findIndex(opt => opt.isCorrect) + 1}. seçenek</p>
                                    ) : (
                                        <p>
                                            {answer.isCorrect ? 
                                                'Doğru cevap!' : 
                                                `Yanlış cevap. Doğru cevap: ${answer.options.findIndex(opt => opt.isCorrect) + 1}. seçenek`
                                            }
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
