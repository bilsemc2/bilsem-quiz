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

export default function QuizPage({ onComplete }: QuizPageProps) {
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
        solutionVideo: string | null; // Video çözüm bilgisini ekle
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
                // Check if there's a homework quiz in localStorage
                const savedQuiz = localStorage.getItem('currentQuiz');
                if (savedQuiz) {
                    const parsedQuiz = JSON.parse(savedQuiz);
                    setQuiz(parsedQuiz);
                    // Clear the saved quiz
                    localStorage.removeItem('currentQuiz');
                } else {
                    // If no homework quiz, generate a regular quiz
                    const quizData = generateQuiz();
                    setQuiz(quizData);
                }
            } catch (error) {
                console.error('Quiz yüklenirken hata:', error);
                showFeedback('Quiz yüklenirken bir hata oluştu', 'error');
            }
        };
        loadQuiz();
    }, []);

    const handleTimeout = () => {
        if (!isAnswered) {
            handleTimeUp();
            // Record timeout answer
            setAnswers(prev => [...prev, {
                questionNumber: currentQuestionIndex + 1,
                isCorrect: false,
                selectedOption: null,
                correctOption: currentQuestion.correctOptionId,
                questionImage: currentQuestion.questionImageUrl,
                isTimeout: true,
                solutionVideo: currentQuestion.solutionVideo,  // Video çözüm bilgisini ekle
                options: currentQuestion.options.map(opt => ({
                    id: opt.id,
                    imageUrl: opt.imageUrl,
                    isSelected: false,
                    isCorrect: opt.id === currentQuestion.correctOptionId
                }))
            }]);
        }
    };

    useEffect(() => {
        if (!isAnswered && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 10 && prev > 1) {
                        playTimeWarning(); // time.warning.mp3 çal
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
        setIsTimeout(true);
        showFeedback('Süre doldu!', 'error');
        
        // Timeout durumunda otomatik olarak sonraki soruya geç
        setTimeout(() => {
            if (currentQuestionIndex < (quiz?.questions.length || 0) - 1) {
                // Seçeneklerin durumunu sıfırla
                const nextQuestion = quiz?.questions[currentQuestionIndex + 1];
                if (nextQuestion) {
                    nextQuestion.options = nextQuestion.options.map(opt => ({
                        ...opt,
                        isSelected: false,
                        isCorrect: false
                    }));
                }
                handleNext();
            } else {
                handleQuizComplete();
            }
        }, 2000);
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
                solutionVideo: currentQuestion.solutionVideo,  // Video çözüm bilgisini ekle
                options: currentQuestion.options.map(opt => ({
                    id: opt.id,
                    imageUrl: opt.imageUrl,
                    isSelected: opt.id === optionId,
                    isCorrect: opt.id === currentQuestion.correctOptionId
                }))
            }]);

            // Son soru değilse otomatik olarak sonraki soruya geç
            if (currentQuestionIndex < quiz.questions.length - 1) {
                setTimeout(() => {
                    playSound('next'); // Sonraki soruya geçerken next.mp3 sesini çal
                    setCurrentQuestionIndex(prev => prev + 1);
                    setTimeLeft(60);
                    setIsAnswered(false);
                    setIsTimeout(false);
                    setSelectedOption(null);
                }, 2000);
            } else {
                // Son soruda kullanıcının "Testi Bitir" butonuna tıklamasını bekle
                showFeedback('Son soruyu cevapladınız! Testi bitirmek için "Testi Bitir" butonuna tıklayın.', 'success');
            }
        }
    };

    const handleQuizComplete = async () => {
        if (quiz && !isSubmitting) {
            setIsSubmitting(true);
            const correctAnswers = answers.filter(a => a.isCorrect).length;
            const { points, xp } = calculateScore(quiz.questions.length, correctAnswers);

            try {
                // Update user stats in database
                if (user) {
                    const { data: userData, error: fetchError } = await supabase
                        .from('profiles')
                        .select('points, experience')
                        .eq('id', user.id)
                        .single();

                    if (fetchError) throw fetchError;

                    // Kullanıcı puanlarını güncelle
                    const { error: updateError } = await supabase
                        .from('profiles')
                        .update({
                            points: (userData?.points || 0) + points,
                            experience: (userData?.experience || 0) + xp
                        })
                        .eq('id', user.id);

                    if (updateError) throw updateError;

                    // Quiz sonuçlarını kaydet
                    const { error: resultError } = await supabase
                        .from('quiz_results')
                        .insert({
                            user_id: user.id,
                            score: correctAnswers,
                            questions_answered: quiz.questions.length,
                            correct_answers: correctAnswers,
                            completed_at: new Date().toISOString()
                        });

                    if (resultError) throw resultError;
                }

                // Başarılı mesajı göster
                showFeedback('Quiz tamamlandı! 🎉', 'success');

                // Result sayfasına yönlendir
                navigate('/result', {
                    state: {
                        correctAnswers,
                        totalQuestions: quiz.questions.length,
                        points,
                        xp,
                        answers: answers.map(answer => {
                            const question = quiz.questions[answer.questionNumber - 1];
                            return {
                                ...answer,
                                questionImage: question?.questionImageUrl || '',
                                solutionVideo: question?.solutionVideo || null,
                                options: question?.options.map(opt => ({
                                    ...opt,
                                    isSelected: opt.id === answer.selectedOption,
                                    isCorrect: opt.id === answer.correctOption
                                })) || []
                            };
                        })
                    }
                });
                
                // Callback'i çağır
                if (onComplete) onComplete(correctAnswers, quiz.questions.length);

            } catch (error) {
                console.error('Quiz sonuçları kaydedilirken hata:', error);
                showFeedback('Bir hata oluştu!', 'error');
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const handleEndQuiz = () => {
        handleQuizComplete();
    };

    const handleNext = async () => {
        if (currentQuestionIndex < (quiz?.questions.length || 0) - 1) {
            playSound('next'); // Sonraki soruya geçerken next.mp3 sesini çal
            setCurrentQuestionIndex((prev) => prev + 1);
            setSelectedOption(null);
            setIsAnswered(false);
            setShowSolution(false);
            setTimeLeft(60);
            setIsTimeout(false); // Timeout durumunu sıfırla
            // Seçeneklerin durumunu sıfırla
            const nextQuestion = quiz?.questions[currentQuestionIndex + 1];
            if (nextQuestion) {
                nextQuestion.options = nextQuestion.options.map(opt => ({
                    ...opt,
                    isSelected: false,
                    isCorrect: false
                }));
            }
            showFeedback('Sonraki soru!', 'info');
        } else {
            playSound('complete');
            showFeedback('Son soruyu cevapladınız! Testi bitirmek için "Testi Bitir" butonuna tıklayın.', 'success');
        }
    };

    const handleFinishQuiz = async () => {
        playSound('complete');
        showFeedback('Tebrikler! Quiz tamamlandı! 🎊', 'success');
        handleQuizComplete();
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    if (!quiz) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex justify-center items-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    const currentQuestion = quiz.questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

    return (
        <div className="min-h-screen bg-[#f8fafc] py-4 sm:py-8">
            <div className="max-w-7xl mx-auto px-3 sm:px-4">
                {/* Progress Bar */}
                <div className="mb-4 sm:mb-8">
                    <div className="flex justify-between items-center mb-2">
                        <div className="text-base sm:text-lg font-semibold text-gray-700">
                            Soru {currentQuestionIndex + 1}/{quiz.questions.length}
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className={`
                                relative w-12 h-12 sm:w-14 sm:h-14
                                flex items-center justify-center
                                rounded-full border-4
                                ${timeLeft <= 10 ? 'border-red-500 text-red-500 animate-pulse' : 'border-gray-300 text-gray-700'}
                                transition-colors duration-300
                            `}>
                                <span className="text-lg sm:text-xl font-bold">{timeLeft}</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-indigo-500 transition-all duration-300"
                            style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
                        ></div>
                    </div>
                </div>

                <div className="w-full bg-white rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-6 mb-4 sm:mb-8">
                    {/* Soru */}
                    <div className="mb-4 sm:mb-8">
                        <div className="bg-gray-50 rounded-lg p-3 sm:p-6">
                            {currentQuestion.questionImageUrl && (
                                <div className="flex justify-center">
                                    <img
                                        src={currentQuestion.questionImageUrl}
                                        alt="Soru"
                                        className="max-h-[200px] sm:max-h-[300px] w-full object-contain rounded-lg transition-transform duration-300 hover:scale-105"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Seçenekler */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-4">
                        {currentQuestion.options.map((option, index) => (
                            <button
                                key={index}
                                onClick={() => handleOptionSelect(option.id)}
                                disabled={isAnswered}
                                className={`
                                    w-full p-2 sm:p-4 text-center rounded-lg transition-all duration-200 relative
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
                        {isAnswered && isLastQuestion && (
                            <button
                                onClick={handleFinishQuiz}
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

                <Feedback message={feedback.message} type={feedback.type} show={feedback.show} />
            </div>
        </div>
    );
}