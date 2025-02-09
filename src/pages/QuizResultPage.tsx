import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import LoadingSpinner from '../components/LoadingSpinner';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import DescriptionIcon from '@mui/icons-material/Description';
import { IconButton, Tooltip } from '@mui/material';

interface QuizResult {
    id: string;
    quiz_id: string;
    user_id: string;
    score: number;
    questions_answered: number;
    correct_answers: number;
    completed_at: string;
    subject: string;
    grade: number;
    user_answers: UserAnswer[];
}

interface UserAnswer {
    questionImage: string;
    selectedOption: string;
    isCorrect: boolean;
    options: {
        id: string;
        text: string;
        imageUrl: string;
        isCorrect: boolean;
    }[];
}

interface QuestionData {
    text: string;
    solution_video: {
        embed_code: string;
    } | null;
    image_url: string;
}

export default function QuizResultPage() {
    const { quizId } = useParams<{ quizId: string }>();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState<QuizResult | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [questionsData, setQuestionsData] = useState<QuestionData[] | null>(null);
    const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
    const [selectedQuestionForDescription, setSelectedQuestionForDescription] = useState<string | null>(null);


    useEffect(() => {
        const loadResult = async () => {
            if (!user || !quizId) return;

            setLoading(true);

            try {
                // Fetch quiz results
                const { data: quizData, error: quizError } = await supabase
                    .from('quiz_results')
                    .select('*')
                    .eq('quiz_id', quizId)
                    .eq('user_id', user.id)
                    .order('completed_at', { ascending: false })
                    .limit(1);

                if (quizError) {
                    console.error('Error fetching quiz result:', quizError);
                    return;
                }

                if (quizData && quizData.length > 0) {
                    setResult(quizData[0]);
                    await loadQuestionDetails(quizData[0].user_answers);
                    return;
                }

                // If no quiz result, fetch assignment results
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
                    console.error('Error fetching assignment result:', assignmentError);
                    return;
                }

                if (assignmentData && assignmentData.length > 0) {
                    const assignmentResult = assignmentData[0];
                    setResult({
                        id: assignmentResult.id,
                        quiz_id: assignmentResult.assignment_id,
                        user_id: assignmentResult.student_id,
                        score: assignmentResult.score,
                        questions_answered: assignmentResult.total_questions,
                        correct_answers: assignmentResult.score,
                        completed_at: assignmentResult.completed_at,
                        subject: '',
                        grade: 0,
                        user_answers: assignmentResult.answers
                    });
                    await loadQuestionDetails(assignmentResult.answers);
                }
            } catch (error) {
                console.error('Error loading result:', error);
            } finally {
                setLoading(false);
            }
        };

        const loadQuestionDetails = async (userAnswers: UserAnswer[]) => {
            const questionImages = userAnswers.map((answer: UserAnswer) => answer.questionImage);

            const { data: questionsData, error: questionsError } = await supabase
                .from('questions')
                .select('text, solution_video, image_url')
                .in('image_url', questionImages);

            if (questionsError) {
                console.error('Error fetching question details:', questionsError);
                return;
            }

            if (questionsData) {
                setQuestionsData(questionsData);
            }
        };


        loadResult();
    }, [user, quizId]);

    const getQuestionDataByImageUrl = (imageUrl: string): QuestionData | undefined => {
        const imageName = imageUrl.match(/Soru-(\d+)\.webp/)?.[0];
        return questionsData?.find((q: QuestionData) => q.image_url.includes(imageName!));
    };


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
                <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl w-full">
                    {/* Başlık */}
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">
                            Quiz Sonucu
                        </h1>
                        <p className="text-gray-600 mt-2">
                            {result.completed_at ? new Date(result.completed_at).toLocaleString('tr-TR') : ''}
                        </p>
                    </div>

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

                                {/* Soru */}
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
                                        <div className="absolute bottom-2 left-0 right-0 flex justify-between items-center px-2">
                                            {/* Sol Alt: Soru Numarası ve Açıklama İkonu */}
                                            <div className="flex items-center gap-2">
                                                <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                                                    Soru {answer.questionImage.match(/Soru-(\d+)\.webp/)![1]}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Seçenekler */}
                                <div className="mb-4">
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
                                </div>

                                {/* Description and Video */}
                                <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center space-x-2">
                                        {/* Video */}
                                        {getQuestionDataByImageUrl(answer.questionImage)?.solution_video && (
                                            <Tooltip title="Video Çözümü">
                                                <IconButton
                                                    size="small"
                                                    className="bg-blue-100 hover:bg-blue-200"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const video = getQuestionDataByImageUrl(answer.questionImage)?.solution_video;
                                                        setSelectedVideo(video?.embed_code || null);
                                                    }}
                                                >
                                                    <PlayCircleIcon className="text-blue-800" fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </div>

                                    {/* Açıklama */}
                                    {getQuestionDataByImageUrl(answer.questionImage)?.text && (
                                        <Tooltip title="Açıklama">
                                            <IconButton
                                                size="small"
                                                className="bg-green-100 hover:bg-green-200"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedQuestionForDescription(answer.questionImage);
                                                }}
                                            >
                                                <DescriptionIcon className="text-green-800" fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Video Modalı */}
            {selectedVideo && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                    onClick={() => setSelectedVideo(null)}
                >
                    <div
                        className="max-w-4xl w-full bg-white rounded-lg p-4 shadow-xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="relative">
                            <button
                                className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                                onClick={() => setSelectedVideo(null)}
                            >
                                ×
                            </button>
                            <div className="aspect-w-16 aspect-h-9">
                                <iframe
                                    src={`https://www.youtube.com/embed/${selectedVideo}`}
                                    title="Video Çözümü"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="w-full rounded-lg"
                                    style={{ aspectRatio: '16/9' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                                src={selectedImage || ''}
                                alt="Büyük Soru Resmi"
                                className="w-full h-auto object-contain rounded-lg"
                            />
                            {selectedImage?.match(/Soru-(\d+)\.webp/)?.[1] && (
                                <div className="absolute bottom-4 right-4 bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-lg">
                                    Soru {selectedImage?.match(/Soru-(\d+)\.webp/)?.[1]}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Açıklama Modalı */}
            {selectedQuestionForDescription && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                    onClick={() => setSelectedQuestionForDescription(null)}
                >
                    <div
                        className="max-w-4xl w-full bg-white rounded-lg p-4 shadow-xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="relative">
                            <button
                                className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                                onClick={() => setSelectedQuestionForDescription(null)}
                            >
                                ×
                            </button>
                            <h2 className="text-lg font-semibold mb-2">Soru Açıklaması</h2>
                            <p>
                                {getQuestionDataByImageUrl(selectedQuestionForDescription)?.text || 'Açıklama bulunamadı.'}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}