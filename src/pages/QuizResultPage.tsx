import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import LoadingSpinner from '../components/LoadingSpinner';
import { Answer } from '../types/quiz';

interface QuizResult {
    id: string;
    quiz_id: string;
    user_id: string;
    score: number;
    questions_answered: number;
    correct_answers: number;
    completed_at: string;
    title: string;
    subject: string;
    grade: number;
    user_answers: Answer[];
}

export default function QuizResultPage() {
    const { quizId } = useParams<{ quizId: string }>();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState<QuizResult | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        const loadResult = async () => {
            if (!user || !quizId) return;

            try {
                // Önce quiz_results'dan kontrol et
                const { data: quizData, error: quizError } = await supabase
                    .from('quiz_results')
                    .select('*')
                    .eq('quiz_id', quizId)
                    .eq('user_id', user.id)
                    .order('completed_at', { ascending: false })
                    .limit(1);

                if (quizError) {
                    console.error('Quiz sonucu yüklenirken hata:', quizError);
                    return;
                }

                if (quizData && quizData.length > 0) {
                    setResult(quizData[0]);
                    setLoading(false);
                    return;
                }

                // Quiz sonucu bulunamadıysa assignment_results'dan kontrol et
                const { data: assignmentData, error: assignmentError } = await supabase
                    .from('assignment_results')
                    .select(`
                        id,
                        assignment_id,
                        student_id,
                        score,
                        total_questions,
                        completed_at,
                        answers,
                        status,
                        assignments (
                            title,
                            description
                        )
                    `)
                    .eq('assignment_id', quizId)
                    .eq('student_id', user.id)
                    .order('completed_at', { ascending: false })
                    .limit(1);

                if (assignmentError) {
                    console.error('Ödev sonucu yüklenirken hata:', assignmentError);
                    return;
                }

                if (assignmentData && assignmentData.length > 0) {
                    const assignmentResult = assignmentData[0];
                    if (!assignmentResult.assignments || assignmentResult.assignments.length === 0) {
                        console.error('Ödev bilgisi bulunamadı');
                        return;
                    }
                    
                    setResult({
                        id: assignmentResult.id,
                        quiz_id: assignmentResult.assignment_id,
                        user_id: assignmentResult.student_id,
                        score: assignmentResult.score,
                        questions_answered: assignmentResult.total_questions,
                        correct_answers: assignmentResult.score,
                        completed_at: assignmentResult.completed_at,
                        title: assignmentResult.assignments[0]?.title || 'Başlık bulunamadı',
                        subject: '',
                        grade: 0,
                        user_answers: assignmentResult.answers
                    });
                }
            } catch (error) {
                console.error('Sonuç yüklenirken hata:', error);
            } finally {
                setLoading(false);
            }
        };

        loadResult();
    }, [user, quizId]);

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!result) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 14h.01M12 16h.01M12 18h.01M12 20h.01M12 22h.01" />
                    </svg>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Quiz Sonucu Bulunamadı</h2>
                    <p className="text-gray-600 mb-4">
                        Bu quiz için henüz bir sonuç kaydedilmemiş veya quiz henüz tamamlanmamış olabilir.
                    </p>
                    <button
                        onClick={() => window.history.back()}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                    >
                        Geri Dön
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="max-w-3xl mx-auto px-4">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="p-6">
                        <h1 className="text-2xl font-bold text-gray-800 mb-4">
                            {result.title}
                        </h1>
                        
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">Toplam Soru</p>
                                <p className="text-2xl font-bold text-blue-600">{result.questions_answered}</p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">Doğru Cevap</p>
                                <p className="text-2xl font-bold text-green-600">{result.correct_answers}</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {result.user_answers.map((answer, index) => (
                                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                                    {/* Soru Başlığı */}
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-base font-semibold text-gray-800">
                                            Soru {index + 1}
                                        </h3>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            answer.isCorrect 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {answer.isCorrect ? 'Doğru' : 'Yanlış'}
                                        </span>
                                    </div>

                                    {/* Soru Resmi */}
                                    <div className="mb-4">
                                        <div 
                                            className="max-w-xs mx-auto bg-white rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity relative"
                                            onClick={() => setSelectedImage(answer.questionImage)}
                                        >
                                            <img 
                                                src={answer.questionImage} 
                                                alt={`Soru ${index + 1}`}
                                                className="object-contain w-full h-auto"
                                            />
                                            {answer.questionImage.match(/Soru-(\d+)\.webp/) && (
                                                <div className="absolute bottom-2 right-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                                                    Soru {answer.questionImage.match(/Soru-(\d+)\.webp/)![1]}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Seçenekler */}
                                    <div className="flex justify-center gap-4 overflow-x-auto pb-2">
                                        {answer.options.map((option) => (
                                            <div 
                                                key={option.id}
                                                className={`relative rounded-lg overflow-hidden border flex-shrink-0 ${
                                                    option.id === answer.selectedOption && option.isCorrect
                                                        ? 'border-green-500 bg-green-50'
                                                        : option.id === answer.selectedOption
                                                        ? 'border-red-500 bg-red-50'
                                                        : option.isCorrect
                                                        ? 'border-green-500 bg-green-50'
                                                        : 'border-gray-200'
                                                }`}
                                            >
                                                <div className="w-24 h-24">
                                                    <img 
                                                        src={option.imageUrl} 
                                                        alt={`Seçenek ${option.id}`}
                                                        className="object-contain w-full h-full p-2"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Çözüm Videosu */}
                                    {answer.solutionVideo && (
                                        <div className="mt-4">
                                            <h4 className="text-sm font-semibold text-gray-800 mb-2">
                                                Çözüm Videosu
                                            </h4>
                                            <div className="max-w-sm mx-auto rounded-lg overflow-hidden">
                                                <video 
                                                    src={answer.solutionVideo} 
                                                    controls 
                                                    className="w-full"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Resim Modalı */}
            {selectedImage && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                    onClick={() => setSelectedImage(null)}
                >
                    <div 
                        className="max-w-4xl w-full bg-white rounded-lg p-4 shadow-xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="relative">
                            <button
                                className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                                onClick={() => setSelectedImage(null)}
                            >
                                ×
                            </button>
                            <img 
                                src={selectedImage} 
                                alt="Büyük Soru Resmi"
                                className="w-full h-auto object-contain rounded-lg"
                            />
                            {selectedImage.match(/Soru-(\d+)\.webp/) && (
                                <div className="absolute bottom-4 right-4 bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-lg">
                                    Soru {selectedImage.match(/Soru-(\d+)\.webp/)![1]}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
