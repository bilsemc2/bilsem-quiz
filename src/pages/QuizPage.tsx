import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useQuizState } from '../hooks/useQuizState';
import { useFeedback } from '../hooks/useFeedback';
import { useXPCheck } from '../hooks/useXPCheck';
import XPWarning from '../components/XPWarning';
import QuizQuestionComponent from '../components/QuizQuestion';
import QuizOptions from '../components/QuizOptions';
import QuizFooter from '../components/QuizFooter';
import { Feedback } from '../components/Feedback';
import { handleOptionSelection, handleQuizComplete as handleQuizCompleteUtil, handleQuestionNavigation } from '../utils/quizHandlers';
import { useSwipeable } from 'react-swipeable';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    CheckCircle, 
    BookOpen, 
    ArrowLeft, 
    ArrowRight, 
    Home, 
    Trophy,
    Brain,
    Zap,
    Target
} from 'lucide-react';

interface QuizPageProps {
    onComplete?: (score: number, totalQuestions: number) => void;
}

export default function QuizPage({ onComplete }: QuizPageProps) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [quizState, quizActions] = useQuizState();
    const [feedbackState, feedbackActions] = useFeedback();

    const [loadingQuestion, setLoadingQuestion] = useState(true);
    const [totalImages, setTotalImages] = useState(0);
    const [loadedImages, setLoadedImages] = useState(0);
    const { loading, userXP, requiredXP } = useXPCheck();
    
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

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

    const progressPercentage = useMemo(() => {
        if (!quizState.quiz) return 0;
        return Math.round((quizState.currentQuestionIndex / quizState.quiz.questions.length) * 100);
    }, [quizState.currentQuestionIndex, quizState.quiz?.questions.length]);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
            const questionImageCount = quizState.currentQuestion.questionImageUrl ? 1 : 0;
            const calculatedTotalImages = optionImagesCount + questionImageCount;
            setTotalImages(calculatedTotalImages);

            if (calculatedTotalImages === 0) {
                setLoadingQuestion(false);
                return;
            }

            // Minimum loading time ile smooth transition sağla
            const minTimer = setTimeout(() => {
                setLoadingQuestion(false);
            }, 600);

            // Safety timeout - maksimum bekleme süresi
            const safetyTimeout = setTimeout(() => {
                setLoadingQuestion(false);
            }, 5000);

            return () => {
                clearTimeout(minTimer);
                clearTimeout(safetyTimeout);
            };
        }
    }, [quizState.currentQuestion?.id]);

    useEffect(() => {
        if (totalImages > 0 && loadedImages >= totalImages) {
            setLoadingQuestion(false);
        }
    }, [loadedImages, totalImages]);

    const handleNext = useCallback(() => {
        const nextIndex = quizState.isLastQuestion
            ? quizState.currentQuestionIndex
            : quizState.currentQuestionIndex + 1;

        if (navigator.vibrate) {
            navigator.vibrate(50);
        }

        handleQuestionNavigation(
            nextIndex,
            quizActions,
            feedbackActions
        );
    }, [quizState.isLastQuestion, quizState.currentQuestionIndex, quizActions, feedbackActions]);
    
    const handlePrevious = useCallback(() => {
        if (quizState.currentQuestionIndex > 0) {
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
            
            handleQuestionNavigation(
                quizState.currentQuestionIndex - 1,
                quizActions,
                feedbackActions
            );
        }
    }, [quizState.currentQuestionIndex, quizActions, feedbackActions]);

    const calculateQuizScore = (correct: number, total: number): number => {
        if (total === 0) return 0;
        return Math.round((correct / total) * 100);
    };

    const potentialScore = useMemo(() => {
        if (!quizState.quiz) return 0;
        return calculateQuizScore(correctAnswerCount, quizState.quiz.questions.length);
    }, [quizState.quiz?.questions.length, correctAnswerCount]);

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
    }, [quizState.quiz, quizState.answers, user?.id, quizActions, feedbackActions, onComplete, navigate, potentialScore]);

    const handleOptionSelect = useCallback((optionId: string) => {
        if (!quizState.currentQuestion || quizState.isAnswered) {
            return;
        }

        if (navigator.vibrate) {
            navigator.vibrate(50);
        }

        const params = {
            optionId,
            currentQuestion: quizState.currentQuestion,
            currentQuestionIndex: quizState.currentQuestionIndex,
            isLastQuestion: quizState.isLastQuestion,
            quizActions,
            feedbackActions,
            handleNext
        };

        handleOptionSelection(
            params.optionId,
            params.currentQuestion,
            params.currentQuestionIndex,
            params.isLastQuestion,
            params.quizActions,
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
    
    const swipeHandlers = useSwipeable({
        onSwipedLeft: () => {
            if (!quizState.isLastQuestion && quizState.isAnswered) {
                handleNext();
            }
        },
        onSwipedRight: () => {
            if (quizState.currentQuestionIndex > 0) {
                handlePrevious();
            }
        },
        trackMouse: false
    });

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
                <div className="text-center space-y-6">
                    <div className="relative">
                        <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                        <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-r-purple-600 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Quiz Hazırlanıyor</h3>
                        <p className="text-gray-500 dark:text-gray-400">Lütfen bekleyin...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
                <div className="text-center space-y-6 p-8">
                    <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto">
                        <Home className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Giriş Gerekli</h3>
                    <p className="text-gray-600 dark:text-gray-400">Quiz'e katılmak için giriş yapmanız gerekiyor</p>
                    <button 
                        onClick={() => navigate('/login')}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:scale-105 transform transition-all duration-300 shadow-lg"
                    >
                        Giriş Yap
                    </button>
                </div>
            </div>
        );
    }

    if (!quizState.quiz || loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
                <div className="text-center space-y-6">
                    <BookOpen className="w-16 h-16 text-blue-500 mx-auto animate-pulse" />
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Quiz Yükleniyor</h3>
                </div>
            </div>
        );
    }

    if (!loading && userXP < requiredXP) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                <div className="container mx-auto px-6 py-12">
                    <div className="max-w-2xl mx-auto">
                        <XPWarning
                            requiredXP={requiredXP}
                            currentXP={userXP}
                            title="Bu quize katılmak için yeterli XP'ye sahip değilsiniz."
                        />
                        <div className="text-center mt-8">
                            <button 
                                onClick={() => navigate('/')} 
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:scale-105 transform transition-all duration-300 shadow-lg"
                            >
                                <Home className="w-5 h-5" />
                                Ana Sayfaya Dön
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!quizState.currentQuestion) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
                <div className="text-center space-y-6">
                    <Brain className="w-16 h-16 text-purple-500 mx-auto" />
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Soru Bulunamadı</h3>
                    <p className="text-gray-500 dark:text-gray-400">Quiz yükleniyor veya soru bulunamadı</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            <div className="container mx-auto px-4 py-6">
                {/* Header Section */}
                <div className="max-w-4xl mx-auto mb-6">
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/20 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                    <Brain className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                        Quiz
                                    </h1>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Soru {quizState.currentQuestionIndex + 1} / {quizState.quiz.questions.length}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <div className="text-sm text-gray-600 dark:text-gray-400">İlerleme</div>
                                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                        %{progressPercentage}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="relative">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                                <motion.div 
                                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercentage}%` }}
                                    exit={{ width: 0 }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                            
                            {/* Question Dots for Desktop */}
                            <div className="hidden md:flex justify-between absolute -bottom-6 w-full">
                                {quizState.quiz && quizState.quiz.questions.map((_, index) => (
                                    <motion.div 
                                        key={`progress-${index}`}
                                        className={`w-4 h-4 rounded-full border-2 shadow-sm ${
                                            index === quizState.currentQuestionIndex 
                                                ? 'bg-blue-500 border-blue-500 scale-125' 
                                                : index < quizState.currentQuestionIndex 
                                                    ? 'bg-green-500 border-green-500' 
                                                    : 'bg-white border-gray-300 dark:bg-gray-700 dark:border-gray-600'
                                        }`}
                                        whileHover={{ scale: 1.2 }}
                                        transition={{ type: "spring", stiffness: 300 }}
                                    >
                                        {index < quizState.currentQuestionIndex && (
                                            <CheckCircle className="w-3 h-3 text-white absolute -top-0.5 -left-0.5" />
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Quiz Content */}
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 overflow-hidden">
                        {/* Question Area */}
                        <div className="relative p-6 md:p-8 min-h-[600px]" {...swipeHandlers}> 
                            {loadingQuestion && (
                                <motion.div 
                                    className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                > 
                                    <div className="relative z-20 bg-white dark:bg-gray-700 rounded-2xl p-6 shadow-2xl flex items-center space-x-4">
                                        <div className="relative">
                                            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                                            <div className="absolute inset-0 w-8 h-8 border-4 border-transparent border-r-purple-600 rounded-full animate-spin" style={{ animationDirection: 'reverse' }}></div>
                                        </div>
                                        <div>
                                            <span className="text-gray-700 dark:text-gray-300 font-medium">Yükleniyor</span>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">Soru hazırlanıyor...</div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                            
                            <div className="relative min-h-[500px]">
                                <AnimatePresence mode="wait">
                                    <motion.div 
                                        key={quizState.currentQuestionIndex}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ 
                                            duration: 0.3, 
                                            ease: "easeInOut",
                                            layout: { duration: 0.3 }
                                        }}
                                        layout
                                        className={`relative z-15 transition-all duration-200 ${loadingQuestion ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}
                                    >
                                        <QuizQuestionComponent
                                            question={quizState.currentQuestion}
                                            questionNumber={quizState.currentQuestionIndex + 1}
                                            onImageLoad={() => setLoadedImages(prev => prev + 1)}
                                        />
                                        
                                        <div className="mt-8">
                                            <QuizOptions
                                                options={quizState.currentQuestion.options}
                                                selectedOption={quizState.selectedOption}
                                                isAnswered={quizState.isAnswered}
                                                onOptionSelect={handleOptionSelect}
                                                onImageLoad={() => setLoadedImages(prev => prev + 1)}
                                            />
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* Mobile Swipe Hint */}
                            {isMobile && quizState.isAnswered && !quizState.isLastQuestion && (
                                <motion.div 
                                    className="absolute bottom-0 left-0 right-0 mx-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    transition={{ delay: 0.5, duration: 0.3 }}
                                >
                                    <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400">
                                        <span className="text-sm font-medium">Sonraki soru için sola kaydırın</span>
                                        <motion.div
                                            animate={{ x: [0, 10, 0] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                        >
                                            <ArrowRight className="w-4 h-4" />
                                        </motion.div>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="relative z-30 border-t border-gray-200 dark:border-gray-700 bg-gray-50/90 dark:bg-gray-800/90 backdrop-blur-sm p-6">
                            <div className="flex items-center justify-between">
                                {/* Navigation Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={handlePrevious}
                                        disabled={quizState.currentQuestionIndex === 0}
                                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 z-40 ${
                                            quizState.currentQuestionIndex === 0
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:scale-105 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 shadow-lg'
                                        }`}
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        <span className="hidden sm:inline">Önceki</span>
                                    </button>

                                    {!quizState.isLastQuestion && quizState.isAnswered && (
                                        <button
                                            onClick={handleNext}
                                            className="relative z-40 inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:scale-105 transform transition-all duration-300 shadow-lg hover:shadow-xl"
                                        >
                                            <span>Sonraki</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Quiz Footer Component - Testi Bitir Butonu */}
                                <div className="relative z-40">
                                    <QuizFooter
                                        isLastQuestion={quizState.isLastQuestion}
                                        isAnswered={quizState.isAnswered}
                                        onFinishQuiz={handleFinishQuiz}
                                    />
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <Target className="w-4 h-4 text-green-500" />
                                    <span>Doğru: {correctAnswerCount}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <Trophy className="w-4 h-4 text-yellow-500" />
                                    <span>Skor: %{potentialScore}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <Zap className="w-4 h-4 text-blue-500" />
                                    <span>Kalan: {quizState.quiz.questions.length - quizState.currentQuestionIndex - 1}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Feedback Component */}
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