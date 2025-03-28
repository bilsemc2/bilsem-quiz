import { Question, Quiz, Answer } from '../types/quiz';
import { supabase } from '../lib/supabase';
import { playSound } from './soundPlayer';

interface QuizActions {
    setIsAnswered: (value: boolean) => void;
    setIsTimeout: (value: boolean) => void;
    setSelectedOption: (option: string | null) => void;
    addAnswer: (answer: Answer) => void;
    setCurrentQuestionIndex: (index: number) => void;
    setShowSolution: (value: boolean) => void;
    setScore: (value: number | ((prev: number) => number)) => void;
    setIsSubmitting: (value: boolean) => void;
    resetQuizState: () => void;
    getIsAnswered?: () => boolean;
}

// Zamanlayıcı kaldırıldı
// interface TimerActions {
//     resetTimer: (time?: number) => void;
//     stopTimer: () => void;
//     startTimer: () => void;
// }

interface FeedbackActions {
    showFeedback: (message: string, type: 'success' | 'error' | 'info', permanent?: boolean) => void;
}

// Ortak tip tanımları - kodun daha modüler olması için parametreleri bir araya topluyoruz
export interface QuizHandlerParams {
    currentQuestion: Question;
    currentQuestionIndex: number;
    isLastQuestion: boolean;
    quizActions: QuizActions;
    feedbackActions: FeedbackActions;
    handleNext: () => void;
}

export async function handleOptionSelection(
    optionId: string,
    currentQuestion: Question,
    currentQuestionIndex: number,
    isLastQuestion: boolean,
    quizActions: QuizActions,
    feedbackActions: FeedbackActions,
    handleNext: () => void
) {
    try {
        // Seçilen seçeneği bul
        const selectedOption = currentQuestion.options.find(option => option.id === optionId);
        if (!selectedOption) {
            throw new Error('Seçenek bulunamadı');
        }

        // Doğru cevabı bul
        const correctOption = currentQuestion.options.find(option => option.isCorrect);
        if (!correctOption) {
            throw new Error('Doğru cevap bulunamadı');
        }

        // Seçeneği işaretle
        quizActions.setSelectedOption(optionId);
        quizActions.setIsAnswered(true);
        // Zamanlayıcı kaldırıldı

        // Cevabı kaydet
        const answer: Answer = {
            questionId: currentQuestion.id,
            questionNumber: currentQuestionIndex + 1,
            selectedOption: optionId,
            correctOption: correctOption.id,
            questionImage: currentQuestion.questionImageUrl || '',
            isCorrect: selectedOption.isCorrect,
            isTimeout: false,
            timeSpent: 60,
            solutionVideo: null,
            timestamp: new Date().toISOString(),
            options: currentQuestion.options.map(option => ({
                id: option.id,
                text: option.text,
                imageUrl: option.imageUrl || '',
                isCorrect: option.isCorrect
            }))
        };

        quizActions.addAnswer(answer);

        // Doğru/yanlış geri bildirimi ve ses efekti
        if (selectedOption.isCorrect) {
            quizActions.setScore(prev => prev + currentQuestion.points);
            feedbackActions.showFeedback('Doğru cevap!', 'success');
            playSound('correct');
        } else {
            feedbackActions.showFeedback('Yanlış cevap.', 'error');
            playSound('incorrect');
        }

        // Son soru değilse 2 saniye sonra diğer soruya geç
        if (!isLastQuestion) {
            setTimeout(() => {
                // Sonraki soru için state'i sıfırla
                quizActions.setSelectedOption(null);
                quizActions.setIsAnswered(false);
                quizActions.setIsTimeout(false);
                // Zamanlayıcı kaldırıldı
                handleNext(); // Sonraki soruya geç
            }, 2000);
        } else {
            // Son soruda kullanıcıya testi bitirmesi için mesaj göster
            feedbackActions.showFeedback(
                selectedOption.isCorrect 
                    ? 'Doğru cevap! Testi bitirmek için "Testi Bitir" butonuna tıklayın.' 
                    : 'Yanlış cevap. Testi bitirmek için "Testi Bitir" butonuna tıklayın.',
                selectedOption.isCorrect ? 'success' : 'error'
            );
        }
    } catch (error) {
        console.error('Seçenek seçilirken hata:', error);
        feedbackActions.showFeedback('Bir hata oluştu.', 'error');
    }
};

// Ortak QuizEnd parametresi tanımı - parametreleri bir arada tutar
export interface QuizEndParams {
    type: 'timeout' | 'complete';
    currentQuestion: Question;
    currentQuestionIndex: number;
    isLastQuestion: boolean;
    quizActions: QuizActions;
    feedbackActions: FeedbackActions;
    handleNext: () => void;
    timeSpent: number;
}

// Süre aşımı için cevap oluşturma yardımcı fonksiyonu
const createTimeoutAnswer = (params: QuizEndParams): Answer => {
    const { currentQuestion, currentQuestionIndex, timeSpent, type } = params;
    
    return {
        questionId: currentQuestion.id,
        questionNumber: currentQuestionIndex + 1,
        selectedOption: '',
        correctOption: currentQuestion.correctOptionId || '',
        questionImage: currentQuestion.questionImageUrl || '',
        isCorrect: false,
        isTimeout: type === 'timeout',
        timeSpent: timeSpent,
        solutionVideo: null,
        timestamp: new Date().toISOString(),
        options: currentQuestion.options.map(option => ({
            id: option.id,
            text: option.text,
            imageUrl: option.imageUrl || '',
            isCorrect: option.isCorrect
        }))
    };
};

// Son soruyu işleme - tekrarlanan kodu modülerleştirdik
const handleLastQuestion = (params: QuizEndParams) => {
    const { feedbackActions, handleNext } = params;
    
    // Zamanlayıcı kaldırıldı
    feedbackActions.showFeedback('Quiz tamamlanıyor...', 'info', true);
    
    // Quiz tamamlama işlemi için gecikme
    setTimeout(() => {
        handleNext(); // Bu, QuizPage'deki onQuizComplete'i çağıracak
    }, 2000);
};

// Normal soruları işleme - tekrarlanan kodu modülerleştirdik
const handleNonLastQuestion = (params: QuizEndParams) => {
    const { quizActions, handleNext } = params;
    
    setTimeout(() => {
        quizActions.setSelectedOption(null);
        quizActions.setIsAnswered(false);
        quizActions.setIsTimeout(false);
        quizActions.setShowSolution(false);
        // Zamanlayıcı kaldırıldı
        handleNext();
    }, 2000);
};

export const handleQuizEnd = async (
    type: 'timeout' | 'complete',
    currentQuestion: Question,
    currentQuestionIndex: number,
    isLastQuestion: boolean,
    quizActions: QuizActions,
    feedbackActions: FeedbackActions,
    handleNext: () => void,
    timeSpent: number
): Promise<void> => {
    try {
        // Tüm parametreleri tek bir nesne olarak organize ediyoruz
        const params: QuizEndParams = {
            type,
            currentQuestion,
            currentQuestionIndex,
            isLastQuestion,
            quizActions,
    
            feedbackActions,
            handleNext,
            timeSpent
        };
        
        quizActions.setIsAnswered(true);

        if (type === 'timeout') {
            quizActions.setIsTimeout(true);

            // Modüler yardımcı fonksiyon kullanarak cevap oluşturuyoruz
            const answer = createTimeoutAnswer(params);
            quizActions.addAnswer(answer);
            
            // Bildirim ve ses oynatma
            feedbackActions.showFeedback('Süre doldu!', 'error');
            playSound('timeout');
        }

        // Zamanlayıcı kaldırıldı

        // Son soru veya normal sorular için modüler yardımcı fonksiyonları kullanıyoruz
        if (isLastQuestion) {
            handleLastQuestion({
                type,
                currentQuestion,
                currentQuestionIndex,
                isLastQuestion,
                quizActions,
        
                feedbackActions,
                handleNext,
                timeSpent
            });
        } else {
            handleNonLastQuestion({
                type,
                currentQuestion,
                currentQuestionIndex,
                isLastQuestion,
                quizActions,
        
                feedbackActions,
                handleNext,
                timeSpent
            });
        }
    } catch (error) {
        console.error('Quiz sonlandırma hatası:', error);
        feedbackActions.showFeedback('Bir hata oluştu, lütfen tekrar deneyin.', 'error');
    }
};

export const handleQuestionNavigation = (
    newIndex: number,
    quizActions: QuizActions,
    feedbackActions: FeedbackActions
) => {
    try {
        // Yeni soruya geç
        quizActions.setCurrentQuestionIndex(newIndex);
        quizActions.setSelectedOption(null);
        quizActions.setIsAnswered(false);
        quizActions.setIsTimeout(false);
    } catch (error) {
        console.error('Soru değiştirilirken hata:', error);
        feedbackActions.showFeedback('Bir hata oluştu', 'error');
    }
};

export const handleQuizComplete = async (
    quiz: Quiz,
    answers: Answer[],
    userId: string,
    quizActions: QuizActions,
    feedbackActions: FeedbackActions,
    onComplete?: (score: number, totalQuestions: number) => void
) => {
    try {
        // Son sorunun cevabını bekle
        await new Promise(resolve => setTimeout(resolve, 500));

        const score = answers.filter(answer => answer.isCorrect).length;
        const totalQuestions = quiz.questions.length;

        // Ödev quizi ise sonuçları assignment_results tablosuna kaydet
        if (quiz.isAssignment) {
            const startTime = answers[0]?.timestamp;
            const endTime = answers[answers.length - 1]?.timestamp;
            const durationMinutes = startTime && endTime 
                ? Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60))
                : null;

            const { error } = await supabase.from('assignment_results').insert({
                assignment_id: quiz.id,
                student_id: userId,
                answers: answers,
                score: score,
                total_questions: totalQuestions,
                completed_at: new Date().toISOString(),
                status: 'completed',
                duration_minutes: durationMinutes
            });

            if (error) {
                console.error('Quiz sonuçları kaydedilirken hata:', error);
                feedbackActions.showFeedback('Quiz sonuçları kaydedilirken hata oluştu', 'error');
                return;
            }

            feedbackActions.showFeedback('Quiz başarıyla tamamlandı!', 'success', true);
        } else {
            // Normal quiz sonuçlarını quiz_results tablosuna kaydet
            const { error } = await supabase.from('quiz_results').insert({
                quiz_id: quiz.id,
                user_id: userId,
                user_answers: answers,
                score: score,
                questions_answered: totalQuestions,
                correct_answers: score,
                completed_at: new Date().toISOString(),
                title: quiz.title
            });

            if (error) {
                console.error('Quiz sonuçları kaydedilirken hata:', error);
                feedbackActions.showFeedback('Quiz sonuçları kaydedilirken hata oluştu', 'error');
                return;
            }
        }

        if (onComplete) {
            onComplete(score, totalQuestions);
        }

        quizActions.resetQuizState();
        feedbackActions.showFeedback('Quiz tamamlandı!', 'success', true);
    } catch (error) {
        console.error('Quiz tamamlanırken hata:', error);
        feedbackActions.showFeedback('Quiz tamamlanırken bir hata oluştu', 'error', true);
    }
};

export const handleAssignmentQuizComplete = async (
    assignmentId: string,
    answers: Answer[],
    userId: string,
    score: number,
    totalQuestions: number,
    startTime: Date,
    onComplete?: (score: number, totalQuestions: number) => void,
    onNavigate?: (path: string) => void
): Promise<void> => {
    try {
        const endTime = new Date();
        const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

        // Sonuçları kaydet
        const { error: resultError } = await supabase
            .from('assignment_results')
            .insert({
                assignment_id: assignmentId,
                student_id: userId,
                score,
                total_questions: totalQuestions,
                completed_at: endTime.toISOString(),
                duration,
                answers
            });

        if (resultError) throw resultError;

        // Ödevi tamamlandı olarak işaretle
        const { error: updateError } = await supabase
            .from('assignments')
            .update({ status: 'completed' })
            .eq('id', assignmentId);

        if (updateError) throw updateError;

        // Callback fonksiyonlarını çağır
        if (onComplete) {
            onComplete(score, totalQuestions);
        }

        // Sonuç sayfasına yönlendir
        if (onNavigate) {
            onNavigate(`/assignment-results/${assignmentId}`);
        }
    } catch (error) {
        console.error('Ödev tamamlanırken hata:', error);
        throw error;
    }
};
