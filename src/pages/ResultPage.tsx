import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CircularProgress } from '../components/CircularProgress';

interface QuestionResult {
    questionNumber: number;
    isCorrect: boolean;
    selectedOption: string | null;
    correctOption: string;
    questionImage: string;
    isTimeout: boolean;
    solutionVideo?: {
        url: string;
        title: string;
    };
    options: Array<{
        id: string;
        imageUrl: string;
        isSelected: boolean;
        isCorrect: boolean;
    }>;
}

interface QuizResult {
    correctAnswers: number;
    totalQuestions: number;
    points: number;
    xp: number;
    answers: QuestionResult[];
}

export const ResultPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const result = location.state as QuizResult;

    if (!result) {
        navigate('/');
        return null;
    }

    const percentage = (result.correctAnswers / result.totalQuestions) * 100;
    const wrongAnswers = result.totalQuestions - result.correctAnswers;

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4">
                <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-8">
                    {/* Yeni Quiz Başlat Butonu */}
                    <div className="mb-8 text-center">
                        <button
                            onClick={() => navigate('/quiz')}
                            className="w-full sm:w-auto bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-all duration-300 active:scale-95"
                        >
                            Yeni Quiz Başlat
                        </button>
                    </div>

                    {/* Soru Numaraları */}
                    <div className="mb-8">
                        <div className="grid grid-cols-5 sm:flex sm:flex-wrap justify-center gap-2">
                            {result.answers.map((answer, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        const element = document.getElementById(`question-${index + 1}`);
                                        if (element) {
                                            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        }
                                    }}
                                    className={`
                                        w-full h-12 sm:w-12 sm:h-12 
                                        rounded-lg sm:rounded-xl 
                                        font-semibold text-white 
                                        flex items-center justify-center 
                                        transition-all duration-300
                                        transform hover:scale-105 hover:shadow-lg
                                        active:scale-95
                                        ${
                                            answer.isTimeout 
                                                ? 'bg-yellow-500 hover:bg-yellow-600' 
                                                : answer.isCorrect 
                                                    ? 'bg-emerald-500 hover:bg-emerald-600' 
                                                    : 'bg-red-500 hover:bg-red-600'
                                        }
                                    `}
                                    title={answer.isTimeout 
                                        ? 'Süre Doldu' 
                                        : answer.isCorrect 
                                            ? 'Doğru Cevap' 
                                            : 'Yanlış Cevap'
                                    }
                                >
                                    {index + 1}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Özet Bilgiler */}
                    <div className="mb-8 sm:mb-12">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 sm:mb-8">Quiz Sonuçları</h1>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                            <div className="bg-emerald-50 rounded-xl p-4">
                                <div className="text-xl sm:text-2xl font-bold text-emerald-600">{result.correctAnswers}</div>
                                <div className="text-sm text-emerald-600">Doğru</div>
                            </div>
                            <div className="bg-red-50 rounded-xl p-4">
                                <div className="text-xl sm:text-2xl font-bold text-red-600">{wrongAnswers}</div>
                                <div className="text-sm text-red-600">Yanlış</div>
                            </div>
                            <div className="bg-blue-50 rounded-xl p-4">
                                <div className="text-xl sm:text-2xl font-bold text-blue-600">%{Math.round(percentage)}</div>
                                <div className="text-sm text-blue-600">Başarı</div>
                            </div>
                        </div>
                    </div>

                    {/* Puan ve XP */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
                        <div className="bg-indigo-50 p-6 rounded-lg text-center">
                            <h3 className="text-lg sm:text-xl font-semibold text-indigo-900 mb-2">Kazanılan Puan</h3>
                            <div className="text-3xl sm:text-4xl font-bold text-indigo-600">{result.points}</div>
                        </div>
                        <div className="bg-purple-50 p-6 rounded-lg text-center">
                            <h3 className="text-lg sm:text-xl font-semibold text-purple-900 mb-2">Kazanılan XP</h3>
                            <div className="text-3xl sm:text-4xl font-bold text-purple-600">{result.xp}</div>
                        </div>
                    </div>

                    {/* Soru Detayları */}
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Soru Detayları</h2>
                        <div className="space-y-4 sm:space-y-8">
                            {result.answers?.map((answer, index) => (
                                <div key={index} id={`question-${index + 1}`} className="bg-gray-50 rounded-xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
                                                Soru {index + 1}
                                            </h3>
                                            {answer.solutionVideo && (
                                                <a
                                                    href={`https://www.youtube.com/watch?v=${answer.solutionVideo.url.split('/').pop()}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 text-red-600 hover:text-red-700"
                                                    title={answer.solutionVideo.title}
                                                >
                                                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                                                    </svg>
                                                    <span className="text-sm font-medium">Video Çözüm</span>
                                                </a>
                                            )}
                                        </div>
                                        <div className={`px-4 py-2 rounded-full ${
                                            answer.isTimeout ? 'bg-yellow-100 text-yellow-800' :
                                            answer.isCorrect ? 'bg-emerald-100 text-emerald-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                            {answer.isTimeout ? 'Süre Doldu' :
                                             answer.isCorrect ? 'Doğru' : 'Yanlış'}
                                        </div>
                                    </div>
                                    
                                    {/* Soru Resmi */}
                                    <div className="mb-6">
                                        <img
                                            src={answer.questionImage}
                                            alt={`Soru ${index + 1}`}
                                            className="max-h-[200px] object-contain mx-auto rounded-lg"
                                        />
                                    </div>

                                    {/* Seçenekler */}
                                    <div className="grid grid-cols-5 gap-4">
                                        {answer.options.map((option, optIndex) => (
                                            <div
                                                key={optIndex}
                                                className={`
                                                    relative p-4 rounded-lg transition-all duration-200
                                                    ${option.isCorrect ? 'border-4 border-emerald-500 bg-emerald-50' :
                                                      option.isSelected ? 'border-4 border-red-500 bg-red-50' :
                                                      'border border-gray-200 bg-white opacity-50'}
                                                `}
                                            >
                                                <img
                                                    src={option.imageUrl}
                                                    alt={`Seçenek ${optIndex + 1}`}
                                                    className="w-full h-auto rounded"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResultPage;
