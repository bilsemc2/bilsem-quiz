import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { calculateScore } from '../utils/scoreCalculator';
import { Question } from '../types/quiz';
import { Quiz, Question as QuizQuestion, generateQuiz } from '../utils/quizGenerator';
import { CircularProgress } from '../components/CircularProgress';
import { playSound, playTimeWarning } from '../utils/sounds';
import { Feedback } from '../components/Feedback';
import YouTube from 'react-youtube';

interface QuizPageProps {
    onComplete?: (score: number, totalQuestions: number) => void;
}

export const QuizPage: React.FC<QuizPageProps> = ({ onComplete }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [isTimeout, setIsTimeout] = useState(false);
    const [showSolution, setShowSolution] = useState(false);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);
    const [feedback, setFeedback] = useState({ message: '', type: 'info' as const, show: false });
    const [answers, setAnswers] = useState<Array<{
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
    }>>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const showFeedback = (message: string, type: 'success' | 'error' | 'info') => {
        setFeedback({ message, type, show: true });
        setTimeout(() => setFeedback(prev => ({ ...prev, show: false })), 2000);
    };

    useEffect(() => {
        const loadQuiz = async () => {
            try {
                const quizData = generateQuiz();
                setQuiz(quizData);
            } catch (error) {
                console.error('Quiz yüklenirken hata:', error);
            }
        };
        loadQuiz();
    }, []);

    const handleTimeout = () => {
        playSound('timeout');
        setIsTimeout(true);
        setIsAnswered(true);

        // Record timeout answer
        setAnswers(prev => [...prev, {
            questionNumber: currentQuestionIndex + 1,
            isCorrect: false,
            selectedOption: null,
            correctOption: currentQuestion.correctOptionId,
            questionImage: currentQuestion.questionImageUrl,
            isTimeout: true,
            options: currentQuestion.options.map(opt => ({
                id: opt.id,
                imageUrl: opt.imageUrl,
                isSelected: false,
                isCorrect: opt.id === currentQuestion.correctOptionId
            }))
        }]);

        setTimeout(() => {
            if (currentQuestionIndex < quiz.questions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
                setTimeLeft(60);
                setIsAnswered(false);
                setIsTimeout(false);
                setSelectedOption(null);
            } else {
                handleQuizComplete();
            }
        }, 2000);
    };

    useEffect(() => {
        if (!isAnswered && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 6 && prev > 1) { 
                        playTimeWarning();
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        } else if (timeLeft === 0 && !isAnswered) {
            handleTimeout();
        }
    }, [timeLeft, isAnswered]);

    const handleTimeUp = () => {
        playSound('timeout');
        setIsAnswered(true);
        setShowSolution(true);
        showFeedback('Süre doldu!', 'error');
    };

    const handleOptionSelect = (optionId: string) => {
        if (!isAnswered) {
            setSelectedOption(optionId);
            setIsAnswered(true);
            setIsTimeout(false);

            const isCorrect = optionId === currentQuestion.correctOptionId;
            
            if (isCorrect) {
                playSound('correct');
                setScore(prev => prev + 1);
                showFeedback('Doğru! 🎉', 'success');
            } else {
                playSound('incorrect');
                showFeedback('Yanlış cevap! 😔', 'error');
            }

            // Record answer with detailed option information
            setAnswers(prev => [...prev, {
                questionNumber: currentQuestionIndex + 1,
                isCorrect,
                selectedOption: optionId,
                correctOption: currentQuestion.correctOptionId,
                questionImage: currentQuestion.questionImageUrl,
                isTimeout: false,
                options: currentQuestion.options.map(opt => ({
                    id: opt.id,
                    imageUrl: opt.imageUrl,
                    isSelected: opt.id === optionId,
                    isCorrect: opt.id === currentQuestion.correctOptionId
                }))
            }]);

            setTimeout(() => {
                if (currentQuestionIndex < quiz.questions.length - 1) {
                    setCurrentQuestionIndex(prev => prev + 1);
                    setTimeLeft(60);
                    setIsAnswered(false);
                    setIsTimeout(false);
                    setSelectedOption(null);
                } else {
                    handleQuizComplete();
                }
            }, 2000);
        }
    };

    const handleQuizComplete = async () => {
        if (!user) return;

        setIsSubmitting(true);

        try {
            const correctAnswers = answers.filter(a => a.isCorrect).length;
            const finalScore = calculateScore(correctAnswers, quiz.questions.length);
            const experiencePoints = Math.round(finalScore * 10);

            // Get current user stats
            const { data: currentStats, error: statsError } = await supabase
                .from('profiles')
                .select('points, experience')
                .eq('id', user.id)
                .single();

            if (statsError) {
                console.error('Error fetching stats:', statsError);
                showFeedback('Sonuçlar kaydedilirken bir hata oluştu', 'error');
                return;
            }

            // Convert values to integers
            const currentPoints = parseInt(currentStats?.points?.toString() || '0');
            const currentExperience = parseInt(currentStats?.experience?.toString() || '0');
            const newPoints = currentPoints + parseInt(finalScore.toString());
            const newExperience = currentExperience + parseInt(experiencePoints.toString());

            // Update user stats with new values
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    points: newPoints,
                    experience: newExperience
                })
                .eq('id', user.id);

            if (updateError) {
                console.error('Error updating stats:', updateError);
                showFeedback('Sonuçlar kaydedilirken bir hata oluştu', 'error');
                return;
            }

            // Prepare detailed answers for result page
            const detailedAnswers = answers.map((answer, index) => {
                const question = quiz.questions[index];
                return {
                    questionNumber: index + 1,
                    isCorrect: answer.isCorrect,
                    selectedOption: answer.selectedOption,
                    correctOption: question.correctOptionId,
                    questionImage: question.questionImageUrl,
                    isTimeout: answer.isTimeout,
                    options: question.options.map(opt => ({
                        id: opt.id,
                        imageUrl: opt.imageUrl,
                        isSelected: opt.id === answer.selectedOption,
                        isCorrect: opt.id === question.correctOptionId
                    }))
                };
            });

            // Navigate to results page with detailed information
            navigate('/result', {
                state: {
                    correctAnswers,
                    totalQuestions: quiz.questions.length,
                    points: finalScore,
                    xp: experiencePoints,
                    answers: detailedAnswers
                }
            });

        } catch (error) {
            console.error('Error in quiz completion:', error);
            showFeedback('Bir hata oluştu', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEndQuiz = () => {
        handleQuizComplete();
    };

    const handleNext = () => {
        if (currentQuestionIndex < (quiz?.questions.length || 0) - 1) {
            playSound('next');
            setCurrentQuestionIndex((prev) => prev + 1);
            setSelectedOption(null);
            setIsAnswered(false);
            setShowSolution(false);
            setTimeLeft(60);
            showFeedback('Sonraki soru!', 'info');
        } else {
            playSound('complete');
            showFeedback('Tebrikler! Quiz tamamlandı! 🎊', 'success');
            if (onComplete && quiz) {
                onComplete(score, quiz.questions.length);
            }
            setTimeout(() => navigate('/profile'), 2000);
        }
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    if (!quiz) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex justify-center items-center">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-xl text-indigo-600 font-medium">
                        Quiz Yükleniyor...
                    </div>
                </div>
            </div>
        );
    }

    const currentQuestion = quiz.questions[currentQuestionIndex];
    const totalQuestions = quiz.questions.length;

    return (
        <div className="min-h-screen bg-gray-100 py-6">
            <div className="flex flex-col items-center w-full max-w-7xl mx-auto px-4 py-8">
                {/* Progress and Timer Section */}
                <div className="w-full flex items-center justify-between mb-8">
                    <div className="flex-1 max-w-3xl">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                                style={{ width: `${(currentQuestionIndex / totalQuestions) * 100}%` }}
                            />
                        </div>
                        <div className="flex justify-end mt-1 text-sm text-gray-600">
                            <span>{currentQuestionIndex + 1}/{totalQuestions}</span>
                        </div>
                    </div>
                    <div className="ml-8">
                        <CircularProgress
                            percentage={(timeLeft / 60) * 100}
                            size={60}
                            strokeWidth={4}
                            circleColor={timeLeft <= 10 ? 'rgb(239 68 68)' : 'rgb(37 99 235)'}
                            text={timeLeft.toString()}
                        />
                    </div>
                </div>

                {/* Question Section */}
                <div className="w-full bg-white rounded-2xl shadow-lg p-6 mb-8">
                    {/* Soru */}
                    <div className="mb-8">
                        <div className="bg-gray-50 rounded-lg p-6">
                            {currentQuestion.questionImageUrl && (
                                <div className="flex justify-center">
                                    <img
                                        src={currentQuestion.questionImageUrl}
                                        alt="Soru"
                                        className="max-h-[300px] object-contain rounded-lg transition-transform duration-300 hover:scale-105"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Seçenekler */}
                    <div className="grid grid-cols-5 gap-4">
                        {currentQuestion.options.map((option, index) => (
                            <button
                                key={index}
                                onClick={() => handleOptionSelect(option.id)}
                                disabled={isAnswered}
                                className={`
                                    w-full p-4 text-center rounded-lg transition-all duration-200 relative
                                    ${isAnswered && !isTimeout
                                        ? option.id === currentQuestion.correctOptionId
                                            ? 'border-4 border-emerald-500 bg-emerald-50 shadow-emerald-100 scale-105'
                                            : option.id === selectedOption
                                                ? 'border-4 border-red-500 bg-red-50 shadow-red-100'
                                                : 'border border-gray-100 bg-white opacity-50'
                                        : isTimeout && option.id === currentQuestion.correctOptionId
                                            ? 'border-4 border-yellow-500 bg-yellow-50 shadow-yellow-100'
                                            : 'border border-gray-100 hover:border-indigo-400 bg-white hover:shadow-lg'
                                    }
                                    ${!isAnswered && 'hover:scale-[1.02] hover:-translate-y-1'}
                                    transform transition-all duration-300 shadow-md hover:shadow-xl
                                    min-h-[140px] flex flex-col items-center justify-center group
                                `}
                            >
                                {option.imageUrl && (
                                    <div className="w-32 h-32 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center p-3 transition-transform duration-300 group-hover:scale-105 mb-4">
                                        <img
                                            src={option.imageUrl}
                                            alt={option.text}
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                )}
                                {isAnswered && !isTimeout && option.id === currentQuestion.correctOptionId && (
                                    <div className="absolute -top-3 -right-3 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
                                {isTimeout && option.id === currentQuestion.correctOptionId && (
                                    <div className="absolute -top-3 -right-3 w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
                                        </svg>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};