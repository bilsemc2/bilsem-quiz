import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CircularProgress } from '../components/CircularProgress';
import { Feedback } from '../components/Feedback';
import { useQuizState } from '../hooks/useQuizState';
import { useQuizTimer } from '../hooks/useQuizTimer';
import { useQuizFeedback } from '../hooks/useQuizFeedback';
import { handleQuizEnd, handleQuestionNavigation, handleOptionSelection, handleQuizComplete } from '../utils/quizHandlers';
import { supabase } from '../lib/supabase';
import XPWarning from '../components/XPWarning';

interface QuizPageProps {
    onComplete?: (score: number, totalQuestions: number) => void;
}

export default function QuizPage({ onComplete }: QuizPageProps) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [userXP, setUserXP] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const requiredXP = 10;
    
    const [quizState, quizActions] = useQuizState();
    
    const handleNext = () => {
        handleQuestionNavigation(
            'next',
            quizState.currentQuestionIndex,
            quizActions,
            timerActions,
            feedbackActions
        );
    };

    const handleTimeout = () => {
        if (!quizState.isAnswered && quizState.currentQuestion && quizState.quiz) {
            handleQuizEnd(
                'timeout',
                quizState.quiz,
                quizState.currentQuestion,
                quizState.currentQuestionIndex,
                quizState.isLastQuestion,
                quizActions,
                timerActions,
                feedbackActions,
                handleNext,
                () => handleQuizComplete(
                    quizState.quiz!,
                    quizState.answers,
                    user!.id,
                    quizState.isSubmitting,
                    quizActions,
                    feedbackActions,
                    onComplete,
                    (path, state) => navigate(path, { state })
                )
            );
        }
    };

    const [timerState, timerActions] = useQuizTimer(60, handleTimeout);
    const [feedbackState, feedbackActions] = useQuizFeedback();

    useEffect(() => {
        const checkXP = async () => {
            if (!user?.id) return;

            try {
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('experience')
                    .eq('id', user.id)
                    .single();

                if (error) throw error;
                setUserXP(profile.experience || 0);
            } catch (error) {
                console.error('XP kontrolü yapılırken hata:', error);
            } finally {
                setLoading(false);
            }
        };

        checkXP();
    }, [user]);

    useEffect(() => {
        if (!quizState.isAnswered && !timerState.isRunning) {
            timerActions.startTimer();
        }
    }, [quizState.isAnswered, timerState.isRunning, timerActions]);

    const handleOptionSelect = async (optionId: string) => {
        if (!quizState.isAnswered && quizState.currentQuestion) {
            handleOptionSelection(
                optionId,
                quizState.currentQuestion,
                quizState.currentQuestionIndex,
                quizState.isLastQuestion,
                quizActions,
                timerActions,
                feedbackActions,
                handleNext
            );
        }
    };

    const onQuizComplete = () => {
        if (quizState.quiz && user) {
            handleQuizComplete(
                quizState.quiz,
                quizState.answers,
                user.id,
                quizState.isSubmitting,
                quizActions,
                feedbackActions,
                onComplete,
                (path, state) => navigate(path, { state })
            );
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <CircularProgress />
            </div>
        );
    }

    if (userXP < requiredXP) {
        return (
            <div className="flex justify-center items-center min-h-screen p-4">
                <XPWarning
                    requiredXP={requiredXP}
                    currentXP={userXP}
                    title="Quiz'e Başlamak İçin XP Gerekiyor"
                />
            </div>
        );
    }

    if (!quizState.quiz || !quizState.currentQuestion) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <CircularProgress indeterminate size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] pt-16 sm:pt-20 pb-4 sm:pb-8">
            <div className="max-w-7xl mx-auto px-3 sm:px-4">
                {/* Progress Bar */}
                <div className="mb-4 sm:mb-8">
                    <div className="flex justify-between items-center mb-2">
                        <div className="text-base sm:text-lg font-semibold text-gray-700">
                            Soru {quizState.currentQuestionIndex + 1}/{quizState.quiz.questions.length}
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className={`
                                relative w-12 h-12 sm:w-14 sm:h-14
                                flex items-center justify-center
                                rounded-full border-4
                                ${timerState.timeLeft <= 10 ? 'border-red-500 text-red-500 animate-pulse' : 'border-gray-300 text-gray-700'}
                                transition-colors duration-300
                            `}>
                                <span className="text-lg sm:text-xl font-bold">
                                    {timerState.timeLeft}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-indigo-500 transition-all duration-300"
                            style={{ width: `${((quizState.currentQuestionIndex + 1) / quizState.quiz.questions.length) * 100}%` }}
                        ></div>
                    </div>
                </div>

                <div className="w-full bg-white rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-6 mb-4 sm:mb-8">
                    {/* Soru */}
                    <div className="mb-4 sm:mb-8">
                        <div className="bg-gray-50 rounded-lg p-3 sm:p-6">
                            {quizState.currentQuestion.questionImageUrl && (
                                <div className="flex justify-center">
                                    <img
                                        src={quizState.currentQuestion.questionImageUrl}
                                        alt="Soru"
                                        className="max-h-[200px] sm:max-h-[300px] w-full object-contain rounded-lg transition-transform duration-300 hover:scale-105"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Seçenekler */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-4">
                        {quizState.currentQuestion.options.map((option, index) => (
                            <button
                                key={index}
                                onClick={() => handleOptionSelect(option.id)}
                                disabled={quizState.isAnswered}
                                className={`
                                    w-full p-2 sm:p-4 text-center rounded-lg transition-all duration-200 relative
                                    ${quizState.isAnswered && !quizState.isTimeout
                                        ? option.id === quizState.currentQuestion!.correctOptionId
                                            ? 'border-4 border-emerald-500 bg-emerald-50 shadow-emerald-100 scale-105'
                                            : option.id === quizState.selectedOption
                                                ? 'border-4 border-red-500 bg-red-50 shadow-red-100'
                                                : 'border border-gray-100 bg-white opacity-50'
                                        : quizState.isTimeout && option.id === quizState.currentQuestion!.correctOptionId
                                            ? 'border-4 border-yellow-500 bg-yellow-50 shadow-yellow-100'
                                            : 'border border-gray-100 hover:border-indigo-400 bg-white hover:shadow-lg'
                                    }
                                    ${!quizState.isAnswered && 'hover:scale-[1.02] hover:-translate-y-1'}
                                    transform transition-all duration-300 shadow-md hover:shadow-xl
                                `}
                            >
                                <img
                                    src={option.imageUrl}
                                    alt={`Seçenek ${index + 1}`}
                                    className="w-full h-auto rounded transition-transform duration-300"
                                />
                            </button>
                        ))}
                    </div>

                    {/* Butonlar */}
                    <div className="mt-4 sm:mt-8 flex justify-end space-x-4">
                        {quizState.isAnswered && quizState.isLastQuestion && (
                            <button
                                onClick={onQuizComplete}
                                className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-lg font-semibold
                                         hover:bg-green-700 transition-all duration-200
                                         transform hover:scale-105 shadow-md hover:shadow-lg
                                         flex items-center justify-center space-x-2"
                            >
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Testi Bitir</span>
                            </button>
                        )}
                    </div>
                </div>

                <Feedback 
                    message={feedbackState.message} 
                    type={feedbackState.type} 
                    show={feedbackState.show} 
                />
            </div>
        </div>
    );
}