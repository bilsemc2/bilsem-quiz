import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CircularProgress } from '../components/CircularProgress';

interface QuizResult {
    correctAnswers: number;
    totalQuestions: number;
    points: number;
    xp: number;
    answers: Array<{
        questionNumber: number;
        isCorrect: boolean;
        selectedOption: string | null;
        correctOption: string;
        questionImage: string;
        isTimeout: boolean;
        options: Array<{
            id: string;
            imageUrl: string;
            isSelected: boolean;
            isCorrect: boolean;
        }>;
    }>;
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
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {/* Özet Bilgiler */}
                    <div className="mb-12">
                        <h1 className="text-3xl font-bold text-gray-800 mb-8">Quiz Sonuçları</h1>
                        <div className="grid grid-cols-3 gap-6">
                            <div className="bg-emerald-50 rounded-xl p-4">
                                <div className="text-2xl font-bold text-emerald-600">{result.correctAnswers}</div>
                                <div className="text-sm text-emerald-600">Doğru</div>
                            </div>
                            <div className="bg-red-50 rounded-xl p-4">
                                <div className="text-2xl font-bold text-red-600">{wrongAnswers}</div>
                                <div className="text-sm text-red-600">Yanlış</div>
                            </div>
                            <div className="bg-blue-50 rounded-xl p-4">
                                <div className="text-2xl font-bold text-blue-600">%{Math.round(percentage)}</div>
                                <div className="text-sm text-blue-600">Başarı</div>
                            </div>
                        </div>
                    </div>

                    {/* Puan ve XP */}
                    <div className="grid grid-cols-2 gap-6 mb-12">
                        <div className="bg-indigo-50 p-6 rounded-lg text-center">
                            <h3 className="text-lg font-semibold text-indigo-900 mb-2">Kazanılan Puan</h3>
                            <div className="text-3xl font-bold text-indigo-600">{result.points}</div>
                        </div>
                        <div className="bg-purple-50 p-6 rounded-lg text-center">
                            <h3 className="text-lg font-semibold text-purple-900 mb-2">Kazanılan XP</h3>
                            <div className="text-3xl font-bold text-purple-600">{result.xp}</div>
                        </div>
                    </div>

                    {/* Soru Detayları */}
                    <div className="space-y-8">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Soru Detayları</h2>
                        {result.answers.map((answer, index) => (
                            <div key={index} className="bg-gray-50 rounded-xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold">Soru {answer.questionNumber}</h3>
                                    <div className={`px-4 py-2 rounded-full ${
                                        answer.isTimeout ? 'bg-yellow-100 text-yellow-800' :
                                        answer.isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                        {answer.isTimeout ? 'Süre Doldu' :
                                         answer.isCorrect ? 'Doğru' : 'Yanlış'}
                                    </div>
                                </div>

                                {/* Soru Resmi */}
                                <div className="mb-6">
                                    <img
                                        src={answer.questionImage}
                                        alt={`Soru ${answer.questionNumber}`}
                                        className="max-h-[250px] mx-auto object-contain rounded-lg"
                                    />
                                </div>

                                {/* Seçenekler */}
                                <div className="grid grid-cols-5 gap-4">
                                    {answer.options.map((option, optionIndex) => (
                                        <div
                                            key={optionIndex}
                                            className={`
                                                relative rounded-lg overflow-hidden transform scale-50
                                                ${option.isSelected && option.isCorrect ? 'ring-4 ring-emerald-500' :
                                                  option.isSelected && !option.isCorrect ? 'ring-4 ring-red-500' :
                                                  option.isCorrect ? 'ring-4 ring-emerald-500' : ''}
                                            `}
                                        >
                                            <img
                                                src={option.imageUrl}
                                                alt={`Seçenek ${optionIndex + 1}`}
                                                className={`w-full h-auto ${
                                                    !option.isSelected && !option.isCorrect ? 'opacity-50' : ''
                                                }`}
                                            />
                                            {option.isSelected && option.isCorrect && (
                                                <div className="absolute top-2 right-2 bg-emerald-500 text-white p-1 rounded-full">
                                                    ✓
                                                </div>
                                            )}
                                            {option.isSelected && !option.isCorrect && (
                                                <div className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full">
                                                    ✗
                                                </div>
                                            )}
                                            {!option.isSelected && option.isCorrect && (
                                                <div className="absolute top-2 right-2 bg-emerald-500 text-white p-1 rounded-full">
                                                    ✓
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Navigasyon Butonları */}
                    <div className="flex justify-center space-x-4 mt-12">
                        <button
                            onClick={() => navigate('/quiz')}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            Yeni Quiz Başlat
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                            Ana Sayfaya Dön
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResultPage;
