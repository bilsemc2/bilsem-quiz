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
        originalQuestionNumber: number;
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

const ResultCard: React.FC<{ title: string; value: number | string; color: string }> = ({ title, value, color }) => (
    <div className={`bg-${color}-50 rounded-xl p-4 transform transition-transform duration-200 hover:scale-105`}>
        <div className={`text-2xl font-bold text-${color}-600`}>{value}</div>
        <div className={`text-sm text-${color}-600`}>{title}</div>
    </div>
);

const QuestionCard: React.FC<{ answer: QuizResult['answers'][0] }> = ({ answer }) => {
    const getStatusColor = () => {
        if (answer.isTimeout) return 'yellow';
        return answer.isCorrect ? 'emerald' : 'red';
    };

    const getStatusText = () => {
        if (answer.isTimeout) return 'Süre Doldu';
        return answer.isCorrect ? 'Doğru' : 'Yanlış';
    };

    return (
        <div className="bg-gray-50 rounded-xl p-6 transform transition-all duration-200 hover:shadow-lg">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Soru {answer.questionNumber}</h3>
                <div className={`px-4 py-2 rounded-full bg-${getStatusColor()}-100 text-${getStatusColor()}-800`}>
                    {getStatusText()}
                </div>
            </div>

            <div className="mb-6">
                <img
                    src={answer.questionImage}
                    alt={`Soru ${answer.questionNumber}`}
                    className="max-h-[250px] mx-auto object-contain rounded-lg shadow-md"
                />
            </div>

            <div className="grid grid-cols-5 gap-4">
                {answer.options.map((option, optionIndex) => (
                    <div
                        key={optionIndex}
                        className={`
                            relative rounded-lg overflow-hidden transform scale-50 transition-all duration-200
                            hover:shadow-xl
                            ${option.isSelected && option.isCorrect ? 'ring-4 ring-emerald-500' :
                              option.isSelected && !option.isCorrect ? 'ring-4 ring-red-500' :
                              option.isCorrect ? 'ring-4 ring-emerald-500' : ''}
                        `}
                    >
                        <img
                            src={option.imageUrl}
                            alt={`Seçenek ${optionIndex + 1}`}
                            className={`w-full h-auto ${!option.isSelected && !option.isCorrect ? 'opacity-50' : ''}`}
                        />
                        {option.isSelected && option.isCorrect && (
                            <div className="absolute top-2 right-2 bg-emerald-500 text-white p-1 rounded-full">✓</div>
                        )}
                        {option.isSelected && !option.isCorrect && (
                            <div className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full">✗</div>
                        )}
                        {!option.isSelected && option.isCorrect && (
                            <div className="absolute top-2 right-2 bg-emerald-500 text-white p-1 rounded-full">✓</div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export const ResultPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const result = location.state as QuizResult;

    if (!result) {
        navigate('/');
        return null;
    }

    const percentage = (result.correctAnswers / result.totalQuestions) * 100;
    const timeoutAnswers = result.answers.filter(answer => answer.isTimeout).length;
    const incorrectAnswers = result.totalQuestions - result.correctAnswers - timeoutAnswers;

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {/* Özet Bilgiler */}
                    <div className="mb-12">
                        <h1 className="text-3xl font-bold text-gray-800 mb-8">Quiz Sonuçları</h1>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <ResultCard title="Doğru" value={result.correctAnswers} color="emerald" />
                            <ResultCard title="Yanlış" value={incorrectAnswers} color="red" />
                            <ResultCard title="Süre Doldu" value={timeoutAnswers} color="yellow" />
                            <ResultCard title="Başarı" value={`%${Math.round(percentage)}`} color="blue" />
                        </div>
                    </div>

                    {/* Puan ve XP */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                        <div className="bg-indigo-50 p-6 rounded-lg text-center transform transition-transform duration-200 hover:scale-105">
                            <h3 className="text-lg font-semibold text-indigo-900 mb-2">Kazanılan Puan</h3>
                            <div className="text-3xl font-bold text-indigo-600">{result.points}</div>
                        </div>
                        <div className="bg-purple-50 p-6 rounded-lg text-center transform transition-transform duration-200 hover:scale-105">
                            <h3 className="text-lg font-semibold text-purple-900 mb-2">Kazanılan XP</h3>
                            <div className="text-3xl font-bold text-purple-600">{result.xp}</div>
                        </div>
                    </div>

                    {/* Soru Detayları */}
                    <div className="space-y-8">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Soru Detayları</h2>
                        {result.answers.map((answer, index) => (
                            <QuestionCard key={index} answer={answer} />
                        ))}
                    </div>

                    {/* Navigasyon Butonları */}
                    <div className="flex justify-center space-x-4 mt-12">
                        <button
                            onClick={() => navigate('/quiz')}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors transform hover:scale-105 duration-200"
                        >
                            Yeni Quiz Başlat
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors transform hover:scale-105 duration-200"
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
