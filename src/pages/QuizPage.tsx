import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useQuizState } from '../hooks/useQuizState';
// Geri sayım zamanlayıcısı kaldırıldı
// import { useTimer } from '../hooks/useTimer';
import { useFeedback } from '../hooks/useFeedback';
import { useXPCheck } from '../hooks/useXPCheck';
import XPWarning from '../components/XPWarning';
import QuizQuestionComponent from '../components/QuizQuestion';
import QuizOptions from '../components/QuizOptions';
import QuizFooter from '../components/QuizFooter';
// import CircularProgress from '../components/CircularProgress';
import { Feedback } from '../components/Feedback';
import { handleOptionSelection, handleQuizComplete as handleQuizCompleteUtil, handleQuestionNavigation } from '../utils/quizHandlers';
// import { QUIZ_DURATION } from '../config/constants';

interface QuizPageProps {
    onComplete?: (score: number, totalQuestions: number) => void;
}

// Geri sayım zamanlayıcısı kaldırıldı
// const calculateProgress = (timeLeft: number, totalTime: number = QUIZ_DURATION): number => {
//     const validTimeLeft = isNaN(timeLeft) ? 0 : timeLeft;
//     return Math.max(0, Math.min(100, (validTimeLeft / totalTime) * 100));
// };

export default function QuizPage({ onComplete }: QuizPageProps) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [quizState, quizActions] = useQuizState();
    const [feedbackState, feedbackActions] = useFeedback();
    // Geri sayım zamanlayıcısı kaldırıldı
    // const [timerState, timerActions] = useTimer(QUIZ_DURATION);

    const [loadingQuestion, setLoadingQuestion] = useState(true);
    const [totalImages, setTotalImages] = useState(0);
    const [loadedImages, setLoadedImages] = useState(0);
    const { loading, userXP, requiredXP } = useXPCheck();

    const questionsMap = useMemo(() => {
        if (!quizState.quiz) return new Map();
        const map = new Map();
        quizState.quiz.questions.forEach(question => map.set(question.id, question));
        return map;
    }, [quizState.quiz]);

    const correctAnswerCount = useMemo(() => {
        if (!quizState.quiz || quizState.answers.length === 0) return 0;
        return quizState.answers.filter(answer => {
            const question = questionsMap.get(answer.questionId);
            return question?.correctOptionId === answer.selectedOption;
        }).length;
    }, [quizState.answers, questionsMap]);

    // --- Diğer useEffect'ler (Başlangıç, Soru/Görsel Yükleme) ---
    // (Önceki kodunuzdaki gibi, bir değişiklik önerilmiyor)
     useEffect(() => {
        if (quizState.quiz && !loading && !quizState.quizStarted) {
            feedbackActions.showFeedback('Quiz başladı! Her soruyu dikkatlice inceleyin.', 'info', true);
            quizActions.setQuizStarted(true);
        }
    }, [quizState.quiz, loading, quizState.quizStarted, feedbackActions, quizActions]);

    useEffect(() => {
        if (quizState.currentQuestion) {
            setLoadingQuestion(true);
            setLoadedImages(0);
            const optionImagesCount = quizState.currentQuestion.options?.length || 0;
            const questionImageCount = quizState.currentQuestion.questionImageUrl ? 1 : 0; // Soru resmi kontrolü
            const calculatedTotalImages = optionImagesCount + questionImageCount;
            setTotalImages(calculatedTotalImages);

            if (calculatedTotalImages === 0) {
                 setLoadingQuestion(false); // Resim yoksa hemen bitir
                 return;
            }

            const minTimer = setTimeout(() => {
                // Yüklenen resim sayısı toplamı geçtiyse (veya eşitse) ve en az 1 resim varsa
                if (loadedImages >= calculatedTotalImages && calculatedTotalImages > 0) {
                    setLoadingQuestion(false);
                }
            }, 600);

             // Güvenlik timeout'u (resimler takılırsa diye)
            const safetyTimeout = setTimeout(() => {
                 // console.warn("Image load safety timeout!");
                 setLoadingQuestion(false);
             }, 5000); // 5 saniye

            return () => {
                clearTimeout(minTimer);
                clearTimeout(safetyTimeout);
            }
        }
    }, [quizState.currentQuestion?.id]); // Sadece soru ID'si değiştiğinde çalışması yeterli

     useEffect(() => {
         // Bu effect sadece loadedImages veya totalImages değiştiğinde çalışır
         // Ve tüm resimler yüklendiyse loading'i kapatır
         if (totalImages > 0 && loadedImages >= totalImages) {
             setLoadingQuestion(false);
         }
     }, [loadedImages, totalImages]);


    // --- handleNext (Değişiklik yok) ---
    const handleNext = useCallback(() => {
        const nextIndex = quizState.isLastQuestion
            ? quizState.currentQuestionIndex
            : quizState.currentQuestionIndex + 1;

        handleQuestionNavigation(
            nextIndex,
            quizActions,
            feedbackActions
        );
    }, [quizState.isLastQuestion, quizState.currentQuestionIndex, quizActions, feedbackActions]);

    // Geri sayım zamanlayıcısı kaldırıldı

    // --- Skor Hesaplama (Değişiklik yok) ---
    const calculateQuizScore = (correct: number, total: number): number => {
        if (total === 0) return 0;
        return Math.round((correct / total) * 100);
    };

    const potentialScore = useMemo(() => {
        if (!quizState.quiz) return 0;
        return calculateQuizScore(correctAnswerCount, quizState.quiz.questions.length);
    }, [quizState.quiz?.questions.length, correctAnswerCount]);

    // --- handleFinishQuiz ---
    const handleFinishQuiz = useCallback(() => {
        if (quizState.quiz) {
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
        // *** DÜZELTME: timerActions bağımlılığı eklendi ***
    }, [quizState.quiz, quizState.answers, user?.id, quizActions, feedbackActions, onComplete, navigate, potentialScore]);

    // Geri sayım zamanlayıcısı kaldırıldı

    // --- handleOptionSelect (isAnswered kontrolü ve stopTimer eklendi) ---
    const handleOptionSelect = useCallback((optionId: string) => {
        // *** DÜZELTME: Eğer zaten cevaplanmışsa veya soru yoksa işlem yapma ***
        if (!quizState.currentQuestion || quizState.isAnswered) {
            return;
        }

        // Timer kaldırıldı

        // Parametreleri oluştur (nesne olarak göndermek iyi bir pratik)
        const params = {
            optionId,
            currentQuestion: quizState.currentQuestion,
            currentQuestionIndex: quizState.currentQuestionIndex,
            isLastQuestion: quizState.isLastQuestion,
            // handleOptionSelection'ın ihtiyaç duyduğu diğer parametreler
            quizActions,
            // Zamanlayıcı kaldırıldı
            feedbackActions,
            handleNext
        };

        handleOptionSelection(
            params.optionId,
            params.currentQuestion,
            params.currentQuestionIndex,
            params.isLastQuestion,
            params.quizActions,
            // Zamanlayıcı kaldırıldı
            params.feedbackActions,
            params.handleNext
        );
    }, [
        quizState.currentQuestion,
        quizState.isAnswered,
        quizState.currentQuestionIndex,
        quizState.isLastQuestion,
        quizActions,
        feedbackActions,
        handleNext
    ]);

    // --- Render Kısmı (Koşullar ve JSX) ---
    // (Önceki kodunuzdaki gibi, önemli bir değişiklik önerilmiyor)
    if (loading) {
        // ... Yükleme göstergesi ...
         return (
            <div className="flex justify-center items-center h-64">
                <div className="w-12 h-12 border-4 border-blue-500 rounded-full animate-pulse"></div>
            </div>
        );
    }

    if (!user) {
        // ... Giriş yap uyarısı ...
         return <div className="text-center py-10">Giriş yapmanız gerekiyor</div>;
    }

     if (!quizState.quiz || loading) { // XP yüklenirken de quiz'i gösterme
         return <div className="text-center py-10">Quiz bilgileri yükleniyor...</div>;
    }

    // XP Yetersizse farklı bir uyarı veya yönlendirme gösterilebilir
    if (!loading && userXP < requiredXP) {
         // ... Yetersiz XP uyarısı ...
          return (
            <div className="container mx-auto px-4 py-10">
                <XPWarning
                    requiredXP={requiredXP}
                    currentXP={userXP}
                    title="Bu quize katılmak için yeterli XP'ye sahip değilsiniz."
                />
                 <div className="text-center mt-4">
                    <button onClick={() => navigate('/')} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                        Ana Sayfaya Dön
                    </button>
                 </div>
            </div>
        );
    }

    if (!quizState.currentQuestion) {
         // ... Soru yok uyarısı ...
         return <div className="text-center py-10">Quiz yükleniyor veya soru bulunamadı...</div>;
    }

    // Ana Quiz Arayüzü
    return (
        <div className="min-h-screen bg-gray-100 py-4">
            <div className="container mx-auto px-4">
                {/* İsteğe bağlı XP Uyarısı */}
                {/* <XPWarning requiredXP={requiredXP} currentXP={userXP} title="Quiz XP Gereksinimi" /> */}

                <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-4">
                    {/* Header: Soru Sayısı ve Timer */}
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">
                            {quizState.currentQuestionIndex + 1}/{quizState.quiz.questions.length}
                        </h2>
                        {/* Zamanlayıcı kaldırıldı */}
                    </div>

                    {/* Soru Alanı (Yükleme Ekranı ile) */}
                    <div className="relative mb-4"> {/* Biraz boşluk ekledim */}
                        {loadingQuestion && (
                            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white bg-opacity-75 rounded-lg"> {/* Arka planı yuvarlat */}
                                <div className="bg-white/90 rounded-full p-3 shadow-lg flex items-center space-x-2">
                                    <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span className="text-blue-600 font-medium">Yükleniyor</span>
                                </div>
                            </div>
                        )}
                        <div className={`transition-opacity duration-300 ${loadingQuestion ? 'opacity-50 filter blur-sm pointer-events-none' : 'opacity-100'}`}>
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

                    {/* Footer: Bitir Butonu */}
                    <QuizFooter
                        isLastQuestion={quizState.isLastQuestion}
                        isAnswered={quizState.isAnswered}
                        onFinishQuiz={handleFinishQuiz}
                        // Eğer footer'da Sonraki butonu varsa:
                        // onNext={handleNext}
                    />
                </div>

                {/* Feedback Bileşeni */}
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