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
import QuizHeader from '../components/QuizHeader';
import QuizQuestion from '../components/QuizQuestion';
import QuizOptions from '../components/QuizOptions';
import QuizFooter from '../components/QuizFooter';

interface QuizPageProps {
    onComplete?: (score: number, totalQuestions: number) => void;
}

export default function QuizPage({ onComplete }: QuizPageProps) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [userXP, setUserXP] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const requiredXP = 10;

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

    const [quizState, quizActions] = useQuizState();
    const [timerState, timerActions] = useQuizTimer(60, handleTimeout);
    const [feedbackState, feedbackActions] = useQuizFeedback();

    const handleNext = () => {
        handleQuestionNavigation(
            'next',
            quizState.currentQuestionIndex,
            quizActions,
            timerActions,
            feedbackActions
        );
    };

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
                <QuizHeader
                    currentQuestionIndex={quizState.currentQuestionIndex}
                    totalQuestions={quizState.quiz.questions.length}
                    timeLeft={timerState.timeLeft}
                />

                <QuizQuestion
                    question={quizState.currentQuestion}
                    isAnswered={quizState.isAnswered}
                    isTimeout={quizState.isTimeout}
                />

                <QuizOptions
                    options={quizState.currentQuestion.options}
                    isAnswered={quizState.isAnswered}
                    isTimeout={quizState.isTimeout}
                    correctOptionId={quizState.currentQuestion.correctOptionId}
                    selectedOption={quizState.selectedOption}
                    onOptionSelect={handleOptionSelect}
                />

                <QuizFooter
                    isAnswered={quizState.isAnswered}
                    isLastQuestion={quizState.isLastQuestion}
                    onComplete={onQuizComplete}
                />

                <Feedback
                    message={feedbackState.message}
                    type={feedbackState.type}
                    show={feedbackState.show}
                />
            </div>
        </div>
    );
}