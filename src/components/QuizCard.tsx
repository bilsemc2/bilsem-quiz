import { useState, useEffect } from 'react';
import { QuizQuestion } from '../types/quiz';
import { useSound } from '../hooks/useSound';

// Timer Bileşeni
interface TimerProps {
    timeLeft: number;
}

const Timer = ({ timeLeft }: TimerProps) => {
    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    };

    return (
        <div className="flex justify-between items-center mb-6">
            <div className="flex flex-col items-end">
                <div className="w-[150px]">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-600">Kalan Süre</span>
                        <span className={`text-sm font-bold ${timeLeft <= 10 ? 'text-red-500' : 'text-gray-700'}`}>
                            {formatTime(timeLeft)}
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                                timeLeft <= 10
                                    ? 'bg-red-500'
                                    : timeLeft <= 30
                                        ? 'bg-yellow-500'
                                        : 'bg-green-500'
                            }`}
                            style={{
                                width: `${(timeLeft / 60) * 100}%`,
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

// Option Bileşeni
interface OptionProps {
    option: { id: string; imageUrl: string; text?: string };
    isSelected: boolean;
    isCorrect: boolean;
    showResult: boolean;
    onClick: () => void;
}

const Option = ({ option, isSelected, isCorrect, showResult, onClick }: OptionProps) => {
    return (
        <div
            onClick={onClick}
            className={`relative p-4 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg flex-1 max-w-[300px] ${
                !showResult && isSelected
                    ? 'ring-2 ring-primary-500 bg-primary-50'
                    : showResult && isCorrect
                        ? 'ring-2 ring-green-500 bg-green-50'
                        : showResult && isSelected
                            ? 'ring-2 ring-red-500 bg-red-50'
                            : 'hover:bg-gray-50 border border-gray-200'
            }`}
        >
            <img
                src={option.imageUrl}
                alt={option.text || 'Seçenek'}
                className="w-full h-[160px] object-contain rounded-lg mb-2"
            />
            {showResult && (
                <div className="absolute top-2 right-2">
                    {isCorrect ? (
                        <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            Doğru Cevap
                        </div>
                    ) : isSelected && (
                        <div className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                            Yanlış Cevap
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// EnlargedImageModal Bileşeni
interface EnlargedImageModalProps {
    imageUrl: string;
    onClose: () => void;
}

const EnlargedImageModal = ({ imageUrl, onClose }: EnlargedImageModalProps) => {
    return (
        <div 
            className="fixed inset-0 bg-white z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div className="relative w-full h-full flex items-center justify-center">
                <img 
                    src={imageUrl} 
                    alt="Büyütülmüş görüntü" 
                    className="max-w-full max-h-full object-contain"
                    style={{ transform: 'scale(1.15)' }}
                />
                <button 
                    className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200"
                    onClick={onClose}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

// QuizCard Bileşeni
interface QuizCardProps {
    question: QuizQuestion;
    onAnswer: (isCorrect: boolean, timeLeft: number, selectedOptionId: string) => void;
}

export const QuizCard = ({ question, onAnswer }: QuizCardProps) => {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [timeLeft, setTimeLeft] = useState(60); // Başlangıç değeri 60 saniye
    const [showEnlargedImage, setShowEnlargedImage] = useState(false);
    const { playSound } = useSound();

    useEffect(() => {
        // Zamanlayıcıyı başlat
        const timer = setInterval(() => {
            setTimeLeft((prevTime) => {
                if (prevTime <= 0) {
                    clearInterval(timer);
                    if (!showResult) {
                        const randomWrongOption = question.options.find(opt => opt.id !== question.correctOptionId)?.id || '';
                        handleTimeOut(randomWrongOption);
                    }
                    return 0;
                }

                if (prevTime <= 6) playSound('tick');
                if (prevTime === 10) playSound('timeWarning');

                return prevTime - 1;
            });
        }, 1000);

        // Zamanlayıcıyı temizle
        return () => clearInterval(timer);
    }, [showResult, playSound, question]);

    const handleTimeOut = (optionId: string) => {
        setShowResult(true);
        playSound('incorrect');
        setTimeout(() => {
            onAnswer(false, 0, optionId);
            resetQuizCard();
        }, 1000);
    };

    const handleOptionClick = (optionId: string) => {
        if (!showResult) setSelectedOption(optionId);
    };

    const handleSubmit = () => {
        if (!showResult && selectedOption) {
            setShowResult(true);
            const isCorrect = selectedOption === question.correctOptionId;
            playSound(isCorrect ? 'correct' : 'incorrect');
            setTimeout(() => {
                onAnswer(isCorrect, timeLeft, selectedOption);
                resetQuizCard();
            }, 1000);
        }
    };

    const resetQuizCard = () => {
        setSelectedOption(null);
        setShowResult(false);
        setTimeLeft(60); // Zamanlayıcıyı sıfırla
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            {/* Zamanlayıcıyı göster */}
            <Timer timeLeft={timeLeft} />

            {/* Soru Görseli */}
            <div className="mb-8">
                <div className="relative group">
                    <img
                        src={question.questionImageUrl}
                        alt="Soru"
                        className="w-full h-[300px] object-contain rounded-lg shadow-md cursor-zoom-in"
                        onClick={() => setShowEnlargedImage(true)}
                    />
                    <button 
                        className="absolute top-2 right-2 p-2 bg-white bg-opacity-75 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-opacity-100"
                        onClick={() => setShowEnlargedImage(true)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Büyütülmüş Görsel Modal */}
            {showEnlargedImage && (
                <EnlargedImageModal 
                    imageUrl={question.questionImageUrl} 
                    onClose={() => setShowEnlargedImage(false)} 
                />
            )}

            {/* Seçenekler */}
            <div className="flex justify-center gap-6 px-4">
                {question.options.map((option) => (
                    <Option
                        key={option.id}
                        option={option}
                        isSelected={selectedOption === option.id}
                        isCorrect={option.id === question.correctOptionId}
                        showResult={showResult}
                        onClick={() => handleOptionClick(option.id)}
                    />
                ))}
            </div>

            {/* Gönder Butonu */}
            <div className="mt-8 flex justify-center">
                <button
                    onClick={handleSubmit}
                    disabled={!selectedOption || showResult}
                    className={`px-8 py-3 rounded-full text-white font-semibold text-lg transition-all duration-300 transform hover:scale-105 ${
                        !selectedOption || showResult
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-primary-500 hover:bg-primary-600 hover:shadow-lg'
                    }`}
                >
                    Cevabı Onayla
                </button>
            </div>
        </div>
    );
};