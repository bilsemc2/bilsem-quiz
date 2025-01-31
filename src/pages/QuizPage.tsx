import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useQuizState } from '../hooks/useQuizState';
import { useTimer } from '../hooks/useTimer';
import { useFeedback } from '../hooks/useFeedback';
import { useXPCheck } from '../hooks/useXPCheck';
import QuizQuestionComponent from '../components/QuizQuestion';
import QuizOptions from '../components/QuizOptions';
import QuizFooter from '../components/QuizFooter';
import CircularProgress from '../components/CircularProgress';
import XPWarning from '../components/XPWarning';
import { Feedback } from '../components/Feedback';
import { handleOptionSelection, handleQuizEnd, handleQuizComplete as handleQuizCompleteUtil, handleQuestionNavigation } from '../utils/quizHandlers';

interface QuizPageProps {
    onComplete?: (score: number, totalQuestions: number) => void;
}

export default function QuizPage({ onComplete }: QuizPageProps) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [quizState, quizActions] = useQuizState();
    const [feedbackState, feedbackActions] = useFeedback();
    const [timerState, timerActions] = useTimer(60);

    // XP kontrolü
    const { loading, userXP, requiredXP } = useXPCheck();

    // Quiz başladığında bildirim göster
    React.useEffect(() => {
        if (quizState.quiz && !loading && !quizState.quizStarted) {
            feedbackActions.showFeedback('Quiz başladı! Her soruyu dikkatlice okuyun.', 'info');
            quizActions.setQuizStarted(true);
        }
    }, [quizState.quiz, loading, quizState.quizStarted, feedbackActions, quizActions]);

    const handleNext = React.useCallback(() => {
        if (quizState.isLastQuestion) {
            handleQuestionNavigation(
                quizState.currentQuestionIndex,
                quizActions,
                timerActions,
                feedbackActions
            );
        } else {
            handleQuestionNavigation(
                quizState.currentQuestionIndex + 1,
                quizActions,
                timerActions,
                feedbackActions
            );
        }
    }, [quizState.isLastQuestion, quizState.currentQuestionIndex, quizActions, timerActions, feedbackActions]);

    // Timer'ın timeout callback'ini güncelle
    React.useEffect(() => {
        const handleTimeout = (timeSpent: number) => {
            if (!quizState.currentQuestion) return;

            handleQuizEnd(
                'timeout',
                quizState.currentQuestion,
                quizState.currentQuestionIndex,
                quizState.isLastQuestion,
                quizActions,
                timerActions,
                feedbackActions,
                handleNext,
                timeSpent
            );
        };

        // Timer süresi bittiğinde handleTimeout çağrılsın
        if (timerState.timeLeft === 0 && !quizState.isAnswered) {
            handleTimeout(60 - timerState.timeLeft);
        }
    }, [quizState.currentQuestion, quizState.currentQuestionIndex, quizState.isLastQuestion, quizActions, timerActions, feedbackActions, handleNext, timerState.timeLeft, quizState.isAnswered]);

    const handleFinishQuiz = React.useCallback(() => {
        if (quizState.quiz) {
            handleQuizCompleteUtil(
                quizState.quiz,
                quizState.answers,
                user?.id || '',
                quizActions,
                feedbackActions,
                (score, totalQuestions) => {
                    if (onComplete) {
                        onComplete(score, totalQuestions);
                    }
                    if (quizState.quiz) {
                        const resultPath = `/quiz/${quizState.quiz.id}/results`;
                        navigate(resultPath);
                    }
                }
            );
        }
    }, [quizState.quiz, quizState.answers, user?.id, quizActions, feedbackActions, onComplete, navigate]);

    // Timer'ı soru değiştiğinde veya cevap verildiğinde yönet
    React.useEffect(() => {
        if (!quizState.isAnswered && quizState.currentQuestion) {
            timerActions.resetTimer(60);
            timerActions.startTimer();
        }
        // Cleanup: komponentin unmount olması veya soru değişmesi durumunda timer'ı durdur
        return () => {
            timerActions.stopTimer();
        };
    }, [quizState.currentQuestion?.id]);  // Sadece soru değiştiğinde çalışsın

    const handleOptionSelect = React.useCallback((optionId: string) => {
        if (!quizState.currentQuestion) return;

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
    }, [quizState.currentQuestion, quizState.currentQuestionIndex, quizState.isLastQuestion, quizActions, timerActions, feedbackActions, handleNext]);



    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <CircularProgress 
                    timeLeft={60} 
                    totalTime={60} 
                    progress={100}
                />
            </div>
        );
    }

    if (!user) {
        return <div>Giriş yapmanız gerekiyor</div>;
    }

    if (!quizState.quiz || !quizState.currentQuestion) {
        return <div>Quiz yüklenemedi</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 py-4">
            <div className="container mx-auto px-4">
                <XPWarning 
                    requiredXP={requiredXP} 
                    currentXP={userXP} 
                    title="Quiz'e başlamak için gereken XP" 
                />
                
                <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">
                            {quizState.currentQuestionIndex + 1}/{quizState.quiz.questions.length}
                        </h2>
                        <CircularProgress 
                            timeLeft={timerState.timeLeft} 
                            totalTime={60}
                            progress={(timerState.timeLeft / 60) * 100}
                        />
                    </div>

                    <QuizQuestionComponent
                        question={quizState.currentQuestion}
                        questionNumber={quizState.currentQuestionIndex + 1}
                        totalQuestions={quizState.quiz.questions.length}
                    />

                    <QuizOptions
                        options={quizState.currentQuestion.options}
                        selectedOption={quizState.selectedOption}
                        isAnswered={quizState.isAnswered}
                        onOptionSelect={handleOptionSelect}
                    />

                    <QuizFooter
                        isLastQuestion={quizState.isLastQuestion}
                        isAnswered={quizState.isAnswered}
                        onFinishQuiz={handleFinishQuiz}
                    />
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