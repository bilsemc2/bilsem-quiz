import { Quiz, Question } from '../types/quiz';
import { playSound } from './soundPlayer';
import { supabase } from '../lib/supabase';
import { calculateScore } from './scoreCalculator';

interface QuizActions {
    setIsAnswered: (value: boolean) => void;
    setIsTimeout: (value: boolean) => void;
    setSelectedOption: (option: string | null) => void;
    addAnswer: (answer: any) => void;
    setCurrentQuestionIndex: (index: number) => void;
    setShowSolution: (value: boolean) => void;
    setScore: (value: number | ((prev: number) => number)) => void;
    setIsSubmitting: (value: boolean) => void;
}

interface TimerActions {
    resetTimer: () => void;
    stopTimer: () => void;
}

interface FeedbackActions {
    showFeedback: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const handleQuizEnd = async (
    type: 'timeout' | 'complete',
    quiz: Quiz,
    currentQuestion: Question,
    currentQuestionIndex: number,
    isLastQuestion: boolean,
    quizActions: QuizActions,
    timerActions: TimerActions,
    feedbackActions: FeedbackActions,
    handleNext: () => void,
    handleComplete: () => void
) => {
    if (type === 'timeout') {
        quizActions.setIsAnswered(true);
        quizActions.setIsTimeout(true);
        playSound('timeout');
        
        quizActions.addAnswer({
            questionNumber: currentQuestionIndex + 1,
            isCorrect: false,
            selectedOption: null,
            correctOption: currentQuestion.correctOptionId,
            questionImage: currentQuestion.questionImageUrl,
            isTimeout: true,
            solutionVideo: currentQuestion.solutionVideo,
            options: currentQuestion.options.map(opt => ({
                id: opt.id,
                imageUrl: opt.imageUrl,
                isSelected: false,
                isCorrect: opt.id === currentQuestion.correctOptionId
            }))
        });
    }

    setTimeout(() => {
        if (!isLastQuestion) {
            handleNext();
        } else {
            handleComplete();
        }
    }, 2000);
};

export const handleQuestionNavigation = (
    direction: 'next' | 'previous',
    currentQuestionIndex: number,
    quizActions: QuizActions,
    timerActions: TimerActions,
    feedbackActions: FeedbackActions
) => {
    // Aktif elementi blur yap
    if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
    }

    const newIndex = direction === 'next' 
        ? currentQuestionIndex + 1 
        : currentQuestionIndex - 1;
    
    quizActions.setCurrentQuestionIndex(newIndex);
    quizActions.setSelectedOption(null);
    quizActions.setIsAnswered(false);
    quizActions.setShowSolution(false);
    timerActions.resetTimer();
    quizActions.setIsTimeout(false);
    
    feedbackActions.showFeedback(
        direction === 'next' ? 'Sonraki soru!' : 'Önceki soru!',
        'info'
    );
};

export const handleOptionSelection = async (
    optionId: string,
    currentQuestion: Question,
    currentQuestionIndex: number,
    isLastQuestion: boolean,
    quizActions: QuizActions,
    timerActions: TimerActions,
    feedbackActions: FeedbackActions,
    handleNext: () => void
) => {
    quizActions.setSelectedOption(optionId);
    quizActions.setIsAnswered(true);
    quizActions.setIsTimeout(false);
    timerActions.stopTimer();

    const isCorrect = optionId === currentQuestion.correctOptionId;
    
    if (isCorrect) {
        playSound('correct');
        quizActions.setScore(prev => prev + 1);
        feedbackActions.showFeedback('Doğru! 🎉', 'success');
    } else {
        playSound('incorrect');
        feedbackActions.showFeedback('Yanlış cevap! 😔', 'error');
    }

    quizActions.addAnswer({
        questionNumber: currentQuestionIndex + 1,
        isCorrect,
        selectedOption: optionId,
        correctOption: currentQuestion.correctOptionId,
        questionImage: currentQuestion.questionImageUrl,
        isTimeout: false,
        solutionVideo: currentQuestion.solutionVideo,
        options: currentQuestion.options.map(opt => ({
            id: opt.id,
            imageUrl: opt.imageUrl,
            isSelected: opt.id === optionId,
            isCorrect: opt.id === currentQuestion.correctOptionId
        }))
    });

    if (!isLastQuestion) {
        setTimeout(() => {
            handleNext();
        }, 2000);
    } else {
        feedbackActions.showFeedback(
            'Son soruyu cevapladınız! Testi bitirmek için "Testi Bitir" butonuna tıklayın.',
            'success'
        );
    }
};

export const handleQuizComplete = async (
    quiz: Quiz,
    answers: any[],
    userId: string,
    isSubmitting: boolean,
    quizActions: QuizActions,
    feedbackActions: FeedbackActions,
    onComplete?: (score: number, totalQuestions: number) => void,
    onNavigate?: (path: string, state: any) => void
) => {
    if (!isSubmitting) {
        quizActions.setIsSubmitting(true);
        const correctAnswers = answers.filter(a => a.isCorrect).length;
        const { points, xp } = calculateScore(quiz.questions.length, correctAnswers);

        try {
            const { data: userData, error: fetchError } = await supabase
                .from('profiles')
                .select('points, experience')
                .eq('id', userId)
                .single();

            if (fetchError) throw fetchError;

            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    points: (userData?.points || 0) + points,
                    experience: (userData?.experience || 0) + xp
                })
                .eq('id', userId);

            if (updateError) throw updateError;

            const { error: resultError } = await supabase
                .from('quiz_results')
                .insert({
                    quiz_id: quiz.id,
                    user_id: userId,
                    score: correctAnswers,
                    questions_answered: quiz.questions.length,
                    correct_answers: correctAnswers,
                    completed_at: new Date().toISOString(),
                    title: quiz.title,
                    subject: quiz.subject,
                    grade: quiz.grade
                });

            if (resultError) throw resultError;

            feedbackActions.showFeedback('Quiz tamamlandı! 🎉', 'success');

            const stateData = {
                correctAnswers,
                totalQuestions: quiz.questions.length,
                points,
                xp,
                answers,
                quizId: quiz.id
            };

            if (onNavigate) {
                onNavigate('/result', stateData);
            }
            
            if (onComplete) {
                onComplete(correctAnswers, quiz.questions.length);
            }

        } catch (error) {
            console.error('Quiz sonuçları kaydedilirken hata:', error);
            feedbackActions.showFeedback('Bir hata oluştu!', 'error');
        } finally {
            quizActions.setIsSubmitting(false);
        }
    }
};
