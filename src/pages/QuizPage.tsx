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
    
    // Görsellerin yüklenme durumunu izlemek için state'ler
    const [totalImages, setTotalImages] = useState(0);
    const [loadedImages, setLoadedImages] = useState(0);

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
            // Yeni soru yüklenirken durumu sıfırla
            setLoadingQuestion(true);
            setLoadedImages(0);
            
            // Toplam görsel sayısını hesapla (soru görseli + seçenek görselleri)
            const optionImagesCount = quizState.currentQuestion.options?.length || 0;
            setTotalImages(optionImagesCount + 1); // +1 soru görseli için
            
            // Her zaman minimum 600ms yükleme göster - çok hızlı yüklendiğinde bile kul kullanıcı ne olduğunu anlayabilsin
            const minTimer = setTimeout(() => {
                // Eğer tüm görseller yüklendiyse ve minimum süre geçtiyse yükleme durumunu kapat
                if (loadedImages >= totalImages && totalImages > 0) {
                    setLoadingQuestion(false);
                }
            }, 600);
            
            return () => clearTimeout(minTimer);
        }
    }, [quizState.currentQuestionIndex, quizState.currentQuestion]);
    
    // Görsellerin yüklenme durumunu takip et
    useEffect(() => {
        // Görseller yüklendiyse ve minimum bir görsel varsa yükleme durumunu kapat
        if (loadedImages >= totalImages && totalImages > 0) {
            setLoadingQuestion(false);
        }
    }, [loadedImages, totalImages]);

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

                    <div className="relative">
                        {/* Yükleme göstergesi - soru yüklenirken gösterilir */}
                        {loadingQuestion && (
                            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white bg-opacity-70">
                                <div className="bg-white/90 rounded-full p-3 shadow-lg flex items-center space-x-2">
                                    <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span className="text-blue-600 font-medium">Yükleniyor</span>
                                </div>
                            </div>
                        )}
                        
                        {/* Soru içeriği - yüklenirken buğulu görünür, yüklendiğinde normal görünür */}
                        <div className={`transition-all duration-300 ${loadingQuestion ? 'filter blur-sm opacity-70' : ''}`}>
                            <QuizQuestionComponent
                                question={quizState.currentQuestion}
                                questionNumber={quizState.currentQuestionIndex + 1}
                                onImageLoad={() => setLoadedImages(prev => prev + 1)}
                            />

                            <QuizOptions
                                options={quizState.currentQuestion.options}
                                selectedOption={quizState.selectedOption}
                                isAnswered={quizState.isAnswered}
                                onOptionSelect={handleOptionSelect}
                                onImageLoad={() => setLoadedImages(prev => prev + 1)}
                            />
                        </div>
                    </div>

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