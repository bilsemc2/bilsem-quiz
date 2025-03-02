import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useQuizState } from '../hooks/useQuizState';
import { useTimer } from '../hooks/useTimer';
import { useFeedback } from '../hooks/useFeedback';
import { useXPCheck } from '../hooks/useXPCheck';
import XPWarning from '../components/XPWarning';
import QuizQuestionComponent from '../components/QuizQuestion';
import QuizOptions from '../components/QuizOptions';
import QuizFooter from '../components/QuizFooter';
import CircularProgress from '../components/CircularProgress';
import { Feedback } from '../components/Feedback';
import { handleOptionSelection, handleQuizEnd, handleQuizComplete as handleQuizCompleteUtil, handleQuestionNavigation } from '../utils/quizHandlers';

interface QuizPageProps {
    onComplete?: (score: number, totalQuestions: number) => void;
}

// Timer ilerleme hesaplama yardımcı fonksiyonu - hook içermeyen basit bir fonksiyon
const calculateProgress = (timeLeft: number, totalTime: number = 60): number => {
    return (timeLeft / totalTime) * 100;
};

export default function QuizPage({ onComplete }: QuizPageProps) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [quizState, quizActions] = useQuizState();
    const [feedbackState, feedbackActions] = useFeedback();
    const [timerState, timerActions] = useTimer(60);
    
    // Soru yükleme durumu için state
    const [loadingQuestion, setLoadingQuestion] = useState(true);

    // XP kontrolü
    const { loading, userXP, requiredXP } = useXPCheck();
    
    // Soru önbelleği oluştur - quiz soruları değişmediği için soruları id'lerine göre önbelleğe alıyoruz
    const questionsMap = useMemo(() => {
        if (!quizState.quiz) return new Map();
        
        const map = new Map();
        quizState.quiz.questions.forEach(question => {
            map.set(question.id, question);
        });
        return map;
    }, [quizState.quiz]);
    
    // Doğru cevap sayısını hesapla - pahalı işlem olabileceği için useMemo ve questionsMap ile optimize ediyoruz
    const correctAnswerCount = useMemo(() => {
        if (!quizState.quiz || quizState.answers.length === 0) return 0;
        
        return quizState.answers.filter(answer => {
            const question = questionsMap.get(answer.questionId);
            return question?.correctOptionId === answer.selectedOption;
        }).length;
    }, [quizState.answers, questionsMap]);

    // Quiz başladığında bildirim göster
    useEffect(() => {
        if (quizState.quiz && !loading && !quizState.quizStarted) {
            feedbackActions.showFeedback('Quiz başladı! Her soruyu dikkatlice inceleyin.', 'info', true);
            quizActions.setQuizStarted(true);
        }
    }, [quizState.quiz, loading, quizState.quizStarted, feedbackActions, quizActions]);
    
    // Soru yükleme durumunu kontrol et
    useEffect(() => {
        if (quizState.currentQuestion) {
            setLoadingQuestion(true);
            // Soru yükleme efekti için küçük gecikme (600ms)
            const timer = setTimeout(() => {
                setLoadingQuestion(false);
            }, 600);
            
            return () => clearTimeout(timer);
        }
    }, [quizState.currentQuestionIndex, quizState.currentQuestion]);

    // Soru navigasyonu için daha öz bir şekilde tanımladık
    const handleNext = useCallback(() => {
        // Tek bir koşul içinde bu işlemi yapabiliriz
        const nextIndex = quizState.isLastQuestion 
            ? quizState.currentQuestionIndex 
            : quizState.currentQuestionIndex + 1;
            
        handleQuestionNavigation(
            nextIndex,
            quizActions,
            timerActions,
            feedbackActions
        );
    }, [quizState.isLastQuestion, quizState.currentQuestionIndex, quizActions, timerActions, feedbackActions]);

    // Timeout işleme fonksiyonu - tekrar eden timeout işlevlerini tek bir şekilde ele alıyoruz
    const handleTimeout = useCallback((timeLeft: number) => {
        if (!quizState.currentQuestion || quizState.isAnswered) return;
        
        if (timeLeft === 0) {
            const timeSpent = 60 - timeLeft;
            
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
        }
    }, [
        quizState.currentQuestion, 
        quizState.currentQuestionIndex, 
        quizState.isLastQuestion, 
        quizState.isAnswered,
        quizActions, 
        timerActions, 
        feedbackActions, 
        handleNext
    ]);

    // Timer'ın timeout callback'ini kontrol et
    useEffect(() => {
        handleTimeout(timerState.timeLeft);
    }, [handleTimeout, timerState.timeLeft]);

    // Quiz skorunu hesaplama fonksiyonu - hook olmadan basit fonksiyon olarak tanımladık
    const calculateQuizScore = (correct: number, total: number): number => {
        if (total === 0) return 0;
        return Math.round((correct / total) * 100);
    };
    
    // Quiz tamamladığında kazanacağı puanları hesapla - useMemo ile optimize
    const potentialScore = useMemo(() => {
        if (!quizState.quiz) return 0;
        return calculateQuizScore(correctAnswerCount, quizState.quiz.questions.length);
    }, [quizState.quiz, correctAnswerCount, calculateQuizScore]);
    
    const handleFinishQuiz = useCallback(() => {
        if (quizState.quiz) {
            // useMemo ile hesapladığımız correctAnswerCount değişkenini kullanabiliriz
            feedbackActions.showFeedback(`Quiz tamamlandı! Skorunuz: ${potentialScore}`, 'success', true);
            
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
    }, [quizState.quiz, quizState.answers, user?.id, quizActions, feedbackActions, onComplete, navigate, potentialScore]);

    // Timer yönetim fonksiyonu - tekrar eden timer işlevlerini tek bir yerde topladık
    const manageTimer = useCallback((isAnswered: boolean, hasQuestion: boolean) => {
        if (!isAnswered && hasQuestion) {
            timerActions.resetTimer(60);
            timerActions.startTimer();
        } else {
            timerActions.stopTimer();
        }
    }, [timerActions]);
    
    // Timer'ı soru değiştiğinde veya cevap verildiğinde yönet
    useEffect(() => {
        // Soru varsa ve cevap verilmediyse timer'ı başlat
        manageTimer(quizState.isAnswered, !!quizState.currentQuestion);
        
        // Cleanup: komponentin unmount olması veya soru değişmesi durumunda timer'ı durdur
        return () => timerActions.stopTimer();
    }, [quizState.currentQuestion?.id, quizState.isAnswered, manageTimer, timerActions]);  // Soru değiştiğinde, cevap durumu değiştiğinde veya timer işlemleri değiştiğinde çalışsın

    // Seçenek seçme işlemini modülerleştiriyoruz
    const handleOptionSelect = useCallback((optionId: string) => {
        if (!quizState.currentQuestion) return;

        // Tüm parametreleri tek bir nesne halinde gönderebiliriz
        const params = {
            optionId,
            currentQuestion: quizState.currentQuestion,
            currentQuestionIndex: quizState.currentQuestionIndex,
            isLastQuestion: quizState.isLastQuestion,
            quizActions,
            timerActions,
            feedbackActions,
            handleNext
        };

        // Daha temiz bir fonksiyon çağrısı
        handleOptionSelection(
            params.optionId,
            params.currentQuestion,
            params.currentQuestionIndex,
            params.isLastQuestion,
            params.quizActions,
            params.timerActions,
            params.feedbackActions,
            params.handleNext
        );
    }, [quizState.currentQuestion, quizState.currentQuestionIndex, quizState.isLastQuestion, quizActions, timerActions, feedbackActions, handleNext]);



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
                
                <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">
                            {quizState.currentQuestionIndex + 1}/{quizState.quiz.questions.length}
                        </h2>
                        <CircularProgress 
                            timeLeft={timerState.timeLeft} 
                            progress={calculateProgress(timerState.timeLeft)}
                        />
                    </div>

                    {loadingQuestion ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="relative w-24 h-24 mb-4">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <svg className="w-16 h-16 text-blue-500" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                                        <circle className="opacity-25" cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="10" />
                                        <path className="opacity-75 animate-pulse" fill="currentColor" d="M50 15 L70 15 L60 5 L50 15" />
                                        <path className="opacity-75" fill="currentColor" d="M85 50 L85 70 L95 60 L85 50" />
                                        <path className="opacity-75 animate-pulse" fill="currentColor" d="M50 85 L30 85 L40 95 L50 85" />
                                        <path className="opacity-75" fill="currentColor" d="M15 50 L15 30 L5 40 L15 50" />
                                    </svg>
                                </div>
                                <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
                                    <svg className="w-24 h-24" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="50" cy="15" r="6" fill="#60A5FA" className="animate-pulse" />
                                        <circle cx="85" cy="50" r="6" fill="#3B82F6" />
                                        <circle cx="50" cy="85" r="6" fill="#2563EB" className="animate-pulse" />
                                        <circle cx="15" cy="50" r="6" fill="#1D4ED8" />
                                    </svg>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-blue-600 text-xl font-semibold animate-pulse">Soru hazırlanıyor</span>
                                <span className="text-blue-600 text-xl animate-bounce">.</span>
                                <span className="text-blue-600 text-xl animate-bounce delay-100">.</span>
                                <span className="text-blue-600 text-xl animate-bounce delay-200">.</span>
                            </div>
                        </div>
                    ) : (
                        <>
                            <QuizQuestionComponent
                                question={quizState.currentQuestion}
                                questionNumber={quizState.currentQuestionIndex + 1}
                            />

                            <QuizOptions
                                options={quizState.currentQuestion.options}
                                selectedOption={quizState.selectedOption}
                                isAnswered={quizState.isAnswered}
                                onOptionSelect={handleOptionSelect}
                            />
                        </>
                    )}

                    <QuizFooter
                        isLastQuestion={quizState.isLastQuestion}
                        isAnswered={quizState.isAnswered} 
                        onFinishQuiz={handleFinishQuiz}
                    />
                </div>

                {/* Feedback bileşeni */}
                <Feedback
                    message={feedbackState.message}
                    type={feedbackState.type}
                    show={feedbackState.show}
                    permanent={feedbackState.permanent}
                    onClose={feedbackActions.hideFeedback}
                />
            </div>
        </div>
    );
}