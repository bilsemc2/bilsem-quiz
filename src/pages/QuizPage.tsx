import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useQuizState } from '../hooks/useQuizState';
import { useTimer } from '../hooks/useTimer';
import { useFeedback } from '../hooks/useFeedback';
import QuizQuestionComponent from '../components/QuizQuestion';
import QuizOptions from '../components/QuizOptions';
import QuizFooter from '../components/QuizFooter';
import CircularProgress from '../components/CircularProgress';
import XPWarning from '../components/XPWarning';
import { Feedback } from '../components/Feedback';
import { handleOptionSelection, handleQuizEnd, handleQuizComplete as handleQuizCompleteUtil, handleQuestionNavigation } from '../utils/quizHandlers';
import { supabase } from '../lib/supabase';

interface QuizPageProps {
    onComplete?: (score: number, totalQuestions: number) => void;
}

export default function QuizPage({ onComplete }: QuizPageProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [loading, setLoading] = React.useState(true);
    const [userXP, setUserXP] = React.useState(0);
    const [requiredXP, setRequiredXP] = React.useState(0);

    const [quizState, quizActions] = useQuizState();
    const [feedbackState, feedbackActions] = useFeedback();
    const [timerState, timerActions] = useTimer(60);

    // Quiz başladığında bildirim göster
    React.useEffect(() => {
        if (quizState.quiz && !loading) {
            feedbackActions.showFeedback('Quiz başladı! Her soruyu dikkatlice okuyun.', 'info');
        }
    }, [quizState.quiz, loading]);

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

    // XP gereksinimini kontrol et
    React.useEffect(() => {
        const checkXPRequirement = async () => {
            try {
                // Ödev quizleri için XP kontrolü yapmıyoruz
                if (location.pathname.includes('/assignments/')) {
                    setLoading(false);
                    return;
                }

                const { data: requirement, error } = await supabase
                    .from('xp_requirements')
                    .select('required_xp')
                    .eq('page_path', location.pathname)
                    .single();

                if (error) {
                    console.error('XP gereksinimi alınırken hata:', error);
                    return;
                }

                if (requirement) {
                    setRequiredXP(requirement.required_xp);
                }
            } catch (error) {
                console.error('XP gereksinimi kontrolünde hata:', error);
            }
        };

        checkXPRequirement();
    }, [location.pathname]);

    // Kullanıcı XP'sini kontrol et
    React.useEffect(() => {
        if (user?.id) {
            const checkUserXP = async () => {
                try {
                    // Ödev quizleri için XP kontrolü yapmıyoruz
                    if (location.pathname.includes('/assignments/')) {
                        setLoading(false);
                        return;
                    }

                    const { data: profile, error } = await supabase
                        .from('profiles')
                        .select('experience')
                        .eq('id', user.id)
                        .single();

                    if (error) throw error;

                    if (profile) {
                        setUserXP(profile.experience || 0);
                        if (profile.experience < requiredXP) {
                            navigate('/');
                        } else {
                            setLoading(false);
                        }
                    }
                } catch (error) {
                    console.error('XP kontrolü sırasında hata:', error);
                    navigate('/');
                }
            };

            checkUserXP();
        }
    }, [user?.id, navigate, requiredXP, location.pathname]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <CircularProgress 
                    timeLeft={60} 
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
                
                <div className="max-w-6xl mx-auto">
                    {/* Soru ve Timer */}
                    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">
                                {quizState.currentQuestionIndex + 1}/{quizState.quiz.questions.length}
                            </h2>
                            <CircularProgress 
                                timeLeft={timerState.timeLeft} 
                                progress={(timerState.timeLeft / 60) * 100}
                            />
                        </div>

                        <QuizQuestionComponent
                            question={quizState.currentQuestion}
                            questionNumber={quizState.currentQuestionIndex + 1}
                        />
                    </div>

                    {/* Seçenekler ve Footer */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <QuizOptions
                            options={quizState.currentQuestion.options}
                            selectedOption={quizState.selectedOption}
                            isAnswered={quizState.isAnswered}
                            onOptionSelect={handleOptionSelect}
                        />

                        <div className="mt-6">
                            <QuizFooter
                                isLastQuestion={quizState.isLastQuestion}
                                isAnswered={quizState.isAnswered}
                                onFinishQuiz={handleFinishQuiz}
                            />
                        </div>
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