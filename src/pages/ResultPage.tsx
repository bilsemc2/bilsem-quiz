import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, Tooltip, Button } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import { useAuth } from '../contexts/AuthContext';

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
    isHomework?: boolean;
    quizId?: string;
}

export default function ResultPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    // State'i doğrudan location.state'den al
    const result = location.state;

    console.log('ResultPage state:', location.state);

    useEffect(() => {
        if (!result || !result.correctAnswers) {
            console.log('Invalid result state:', result);
            navigate('/', { replace: true });
            return;
        }
    }, [result, navigate]);

    if (!result || !result.correctAnswers) return null;

    const percentage = (result.correctAnswers / result.totalQuestions) * 100;
    const wrongAnswers = result.totalQuestions - result.correctAnswers;
    const canPlayBallGame = result.correctAnswers >= 1;

    // Oyun butonuna tıklama işleyicisi
    const handlePlayGame = () => {
        if (canPlayBallGame) {
            navigate('/ball-game', { 
                state: { 
                    fromResult: true,
                    previousState: result // Mevcut state'i BallGame'e gönder
                } 
            });
        }
    };

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

                    {/* BallGame Butonu */}
                    <div className="mb-12 text-center">
                        <Tooltip title={
                            canPlayBallGame 
                                ? "Top oyununu oynamaya hazırsın!" 
                                : "Top oyununu oynamak için en az 10 doğru cevap gerekiyor"
                        } arrow>
                            <span>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<SportsEsportsIcon />}
                                    onClick={handlePlayGame}
                                    disabled={!canPlayBallGame}
                                    className={`px-6 py-3 rounded-full transform transition-all duration-300 ${
                                        canPlayBallGame 
                                            ? 'hover:scale-105 bg-gradient-to-r from-primary-500 to-primary-600' 
                                            : 'opacity-50 cursor-not-allowed'
                                    }`}
                                >
                                    {canPlayBallGame ? 'Top Oyununu Oyna!' : 'Top Oyunu Kilitli'}
                                </Button>
                            </span>
                        </Tooltip>
                        {!canPlayBallGame && (
                            <p className="mt-2 text-sm text-gray-500">
                                {1 - result.correctAnswers} doğru cevap verirsen top oyununu oynayabilirsin!
                            </p>
                        )}
                    </div>

                    {/* Soru Detayları */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Soru Detayları</h2>
                        <div className="space-y-8">
                            {result.answers?.map((answer, index) => (
                                <div key={index} className="bg-gray-50 rounded-xl p-6 relative">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <h3 className="text-lg font-semibold text-gray-800">
                                                Soru {index + 1}
                                            </h3>
                                            {answer.solutionVideo && (
                                                <a
                                                    href={answer.solutionVideo.url.replace('/embed/', '/watch?v=')}
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
                                    <div className="mb-6 relative">
                                        <img
                                            src={answer.questionImage}
                                            alt={`Soru ${index + 1}`}
                                            className="w-full h-[400px] object-contain bg-gray-50 rounded-lg border border-gray-200"
                                        />
                                        
                                        {/* Soru Numarası ve Bilgi İkonu */}
                                        <div className="absolute bottom-2 right-2 flex items-center gap-2">
                                            <span className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium">
                                                {answer.questionImage.match(/Soru-(\d+)\.webp/)?.[1] || index + 1}
                                            </span>
                                            <Tooltip title="Hatalı olduğunu düşündüğünüz sorunun ID'sini yöneticiye bildirin" arrow placement="top">
                                                <InfoOutlinedIcon 
                                                    className="text-gray-600 hover:text-blue-600 cursor-pointer"
                                                    sx={{ fontSize: '1.2rem' }}
                                                />
                                            </Tooltip>
                                        </div>
                                    </div>

                                    {/* Seçenekler */}
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                        {answer.options.map((option, optionIndex) => (
                                            <div key={optionIndex} className={`relative rounded-lg border ${
                                                answer.selectedOption === option.id
                                                    ? option.isCorrect
                                                        ? 'border-green-500 bg-green-50' 
                                                        : 'border-red-500 bg-red-50'
                                                    : option.isCorrect
                                                        ? 'border-green-500 bg-green-50'
                                                        : 'border-gray-200'
                                            }`}>
                                                <img
                                                    src={option.imageUrl}
                                                    alt={`Seçenek ${optionIndex + 1}`}
                                                    className="w-full h-[200px] md:h-[180px] object-contain bg-gray-50 rounded-lg p-2"
                                                />
                                                <div className="absolute top-2 left-2 bg-white/50 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm text-gray-700">
                                                    {optionIndex + 1}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Yanlış Cevaplar */}
                    {result.answers.filter(answer => !answer.isCorrect).length > 0 && (
                        <div className="mt-12">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">Yanlış Cevaplarınız</h2>
                            <div className="grid grid-cols-1 gap-6">
                                {result.answers.filter(answer => !answer.isCorrect).map((answer, index) => (
                                    <div key={index} className="bg-white rounded-xl shadow-lg p-6">
                                        <div className="flex flex-col space-y-4">
                                            {/* Soru Görseli */}
                                            {answer.questionImage && (
                                                <div className="flex justify-center">
                                                    <img
                                                        src={answer.questionImage}
                                                        alt={`Soru ${answer.questionNumber}`}
                                                        className="max-h-[200px] object-contain rounded-lg"
                                                    />
                                                </div>
                                            )}
                                            
                                            {/* Soru Numarası ve Durum */}
                                            <div className="flex justify-between items-center">
                                                <div className="text-lg font-semibold text-gray-700">
                                                    Soru {answer.questionNumber}
                                                </div>
                                                <div className="flex space-x-2">
                                                    <Button
                                                        variant="contained"
                                                        color="primary"
                                                        onClick={() => navigate('/ogretmenim', { 
                                                            state: { 
                                                                wrongAnswer: answer,
                                                                quizId: result.quizId
                                                            }
                                                        })}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                                                    >
                                                        <SchoolIcon className="w-5 h-5" />
                                                        <span>Ersan Öğretmene Sor</span>
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Seçenekler */}
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                                                {answer.options.map((option, optionIndex) => (
                                                    <div
                                                        key={optionIndex}
                                                        className={`
                                                            relative rounded-lg overflow-hidden
                                                            ${option.isCorrect ? 'border-4 border-emerald-500' : 
                                                              option.isSelected ? 'border-4 border-red-500' : 'border border-gray-200'}
                                                        `}
                                                    >
                                                        <img
                                                            src={option.imageUrl}
                                                            alt={`Seçenek ${optionIndex + 1}`}
                                                            className="w-full h-auto"
                                                        />
                                                        {(option.isCorrect || option.isSelected) && (
                                                            <div className={`
                                                                absolute top-2 right-2 rounded-full p-1
                                                                ${option.isCorrect ? 'bg-emerald-500' : 'bg-red-500'}
                                                            `}>
                                                                {option.isCorrect ? (
                                                                    <CheckCircleIcon className="w-5 h-5 text-white" />
                                                                ) : (
                                                                    <BlockOutlinedIcon className="w-5 h-5 text-white" />
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Yeni Quiz Başlat Butonu */}
                    <div className="mt-12 text-center">
                        <button
                            onClick={() => navigate(result.isHomework ? '/homework' : '/quiz')}
                            className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200"
                        >
                            {result.isHomework ? 'Ödevlere Geri Dön' : 'Yeni Quiz Başlat'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
