import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CircularProgress } from '../components/CircularProgress';
import { Feedback } from '../components/Feedback';
import { useQuizState, Answer } from '../hooks/useQuizState';
import { useQuizTimer } from '../hooks/useQuizTimer';
import { useQuizFeedback } from '../hooks/useQuizFeedback';
import { handleQuizEnd, handleQuestionNavigation, handleOptionSelection, handleQuizComplete } from '../utils/quizHandlers';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface QuizOption {
    id: string;
    imageUrl: string;
    isCorrect?: boolean;
}

interface AssignmentQuizPageProps {
    onComplete?: (score: number, totalQuestions: number) => void;
}

interface AssignmentQuestion {
    number: number;
    correctAnswer: string;
}

interface Quiz {
    id: string;
    title: string;
    description: string;
    questions: any[];
    grade: number;
    subject: string;
    type: string;
}

export default function AssignmentQuizPage({ onComplete }: AssignmentQuizPageProps) {
    const navigate = useNavigate();
    const { assignmentId } = useParams<{ assignmentId: string }>();
    console.log('Assignment ID:', assignmentId);
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [quizState, quizActions] = useQuizState();
    const [shuffledQuestions, setShuffledQuestions] = useState<AssignmentQuestion[]>([]);
    const [shuffledOptions, setShuffledOptions] = useState<{ [key: number]: string[] }>({});
    const [startTime, setStartTime] = useState<Date | null>(null);

    // Fisher-Yates karıştırma algoritması
    const shuffleArray = <T,>(array: T[]): T[] => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    const [timerState, timerActions] = useQuizTimer(60, () => {
        if (!quizState.isAnswered && quizState.currentQuestion && quizState.quiz) {
            // Yanlış cevap olarak kaydet
            quizActions.addAnswer({
                questionNumber: quizState.currentQuestion.number,
                isCorrect: false,
                selectedOption: '',
                correctOption: quizState.currentQuestion.correctOption,
                questionImage: quizState.currentQuestion.imageUrl,
                isTimeout: true,
                solutionVideo: null,
                options: quizState.currentQuestion.options.map((opt: QuizOption) => ({
                    id: opt.id,
                    imageUrl: opt.imageUrl,
                    isSelected: false,
                    isCorrect: opt.id === quizState.currentQuestion.correctOption
                }))
            });

            // Son soru kontrolü
            if (!quizState.quiz) return;
            
            if (quizState.currentQuestionIndex === quizState.quiz.questions.length - 1) {
                handleAssignmentComplete(quizState.quiz, [...quizState.answers]);
            } else {
                // Sonraki soruya geç
                quizActions.setCurrentQuestionIndex(quizState.currentQuestionIndex + 1);
                quizActions.setSelectedOption(null);
                quizActions.setIsAnswered(false);
                timerActions.resetTimer(60);
                timerActions.startTimer();
            }
        }
    });
    const [feedbackState, feedbackActions] = useQuizFeedback();

    useEffect(() => {
        if (user && assignmentId) {
            loadAssignmentQuiz();
        }
    }, [user, assignmentId]);

    const loadAssignmentQuiz = async () => {
        try {
            setLoading(true);
            
            // Ödevi getir
            const { data: assignment, error: assignmentError } = await supabase
                .from('assignments')
                .select('*')
                .eq('id', assignmentId)
                .single();

            if (assignmentError) throw assignmentError;
            if (!assignment) throw new Error('Ödev bulunamadı');

            // Ödev durumunu kontrol et
            if (assignment.status === 'completed') {
                toast.error('Bu ödevi zaten tamamladınız!');
                navigate(-1);
                return;
            }

            // Soruları formatla ve karıştır
            const questions = assignment.questions as AssignmentQuestion[];
            

            // Soruları ve seçenekleri bir kez karıştır ve sakla
            const shuffled = shuffleArray(questions);
            setShuffledQuestions(shuffled);

            // Her soru için seçenekleri karıştır ve sakla
            const optionsMap: { [key: number]: string[] } = {};
            shuffled.forEach(q => {
                optionsMap[q.number] = shuffleArray(['A', 'B', 'C', 'D', 'E']);
            });
            setShuffledOptions(optionsMap);

            const formattedQuestions = shuffled.map(q => {
                console.log('Soru formatlanıyor:', q);
                
                return {
                    id: `q${q.number}`,
                    number: q.number,
                    text: '',
                    imageUrl: `/images/questions/Matris/Soru-${q.number}.webp`,
                    options: optionsMap[q.number].map(option => ({
                        id: option,
                        text: '',
                        imageUrl: `/images/options/Matris/${q.number}/Soru${option === q.correctAnswer ? '-cevap' : ''}-${q.number}${option}.webp`
                    })),
                    correctOption: q.correctAnswer
                };
            });

            console.log('Formatlanmış sorular:', formattedQuestions);

            // Quiz'i yükle
            const quiz: Quiz = {
                id: assignment.id,
                title: assignment.title || `${assignment.id} Numaralı Ödev`,
                description: assignment.description || '',
                questions: formattedQuestions,
                grade: assignment.grade || 0,
                subject: assignment.subject || '',
                type: 'assignment'
            };

            quizActions.setQuiz(quiz);
            console.log('Quiz yüklendi, süre başlatılıyor...');
            setStartTime(new Date());  // Quiz yüklendiğinde süreyi başlat
            setLoading(false);
            // Quiz yüklendiğinde süreyi başlat
            timerActions.resetTimer(60);
            timerActions.startTimer();
        } catch (error) {
            console.error('Ödev quiz yüklenirken hata:', error);
            toast.error('Ödev yüklenirken bir hata oluştu');
            navigate(-1);
        }
    };

    const handleNext = () => {
        handleQuestionNavigation(
            'next',
            quizState.currentQuestionIndex,
            quizActions,
            timerActions,
            feedbackActions
        );
    };

    const handleAssignmentComplete = async (quiz: Quiz, allAnswers: Answer[]) => {
        try {
            const score = allAnswers.filter(answer => answer.isCorrect).length;
            const totalQuestions = quiz.questions.length;

            // Süre hesaplama (saniye hassasiyetinde)
            const endTime = new Date();
            const durationInMs = startTime ? (endTime.getTime() - startTime.getTime()) : 0;
            const durationInSeconds = Math.ceil(durationInMs / 1000); // Yukarı yuvarlıyoruz
            const durationInMinutes = Math.ceil(durationInSeconds / 60); // Yukarı yuvarlıyoruz
            
            console.log('Süre hesaplama:', {
                startTime: startTime?.toISOString(),
                endTime: endTime.toISOString(),
                durationInMs,
                durationInSeconds,
                durationInMinutes
            });

            // Ödev sonucunu kaydet
            const { data: resultData, error: resultError } = await supabase
                .from('assignment_results')
                .insert({
                    assignment_id: assignmentId,
                    student_id: user?.id,
                    answers: allAnswers,
                    score,
                    total_questions: totalQuestions,
                    completed_at: endTime.toISOString(),
                    status: 'completed',
                    duration_minutes: durationInMinutes
                })
                .select()
                .single();

            if (resultError) throw resultError;

            console.log('Kaydedilen sonuç:', resultData);

            // Ödevi tamamlandı olarak işaretle
            const { error: updateError } = await supabase
                .from('assignments')
                .update({ status: 'completed' })
                .eq('id', assignmentId);

            if (updateError) throw updateError;

            toast.success('Ödev başarıyla tamamlandı!');
            
            // Sonuçlar sayfasına yönlendir
            navigate(`/assignments/${assignmentId}/results`);
        } catch (error: any) {
            console.error('Ödev tamamlanırken hata:', error);
            
            // Supabase hatası
            if (error?.code || error?.message) {
                toast.error(`Supabase hatası: ${error.message || 'Bilinmeyen hata'}`);
                return;
            }
            
            // Diğer hatalar
            toast.error('Ödev tamamlanırken bir hata oluştu');
        }
    };

    const handleOptionSelect = async (optionId: string) => {
        if (quizState.isAnswered) {
            console.log('Soru zaten cevaplanmış');
            return;
        }

        const currentQuestion = quizState.currentQuestion;
        if (!currentQuestion) {
            console.log('Geçerli soru bulunamadı');
            return;
        }


        
        const isCorrect = optionId === currentQuestion.correctOption;
       
        
        // UI'ı güncelle
        quizActions.setSelectedOption(optionId);
        quizActions.setIsAnswered(true);

        // Cevabı kaydet
        const answer: Answer = {
            questionNumber: currentQuestion.number,
            isCorrect,
            selectedOption: optionId,
            correctOption: currentQuestion.correctOption,
            questionImage: currentQuestion.imageUrl,
            isTimeout: false,
            solutionVideo: null,
            options: currentQuestion.options.map((opt: QuizOption) => ({
                id: opt.id,
                imageUrl: opt.imageUrl,
                isSelected: opt.id === optionId,
                isCorrect: opt.id === currentQuestion.correctOption
            }))
        };
        console.log('Kaydedilen cevap:', answer);
        quizActions.addAnswer(answer);

        // 1 saniye bekle
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Son soru kontrolü ve geçiş
        if (!quizState.quiz) return;
        
        if (quizState.currentQuestionIndex === quizState.quiz.questions.length - 1) {
            console.log('Son soru, quiz tamamlanıyor');
            // Son soru ise quizi tamamla
            await handleAssignmentComplete(quizState.quiz!, quizState.answers);
        } else {
            console.log('Sonraki soruya geçiliyor');
            // Sonraki soruya geç
            quizActions.setCurrentQuestionIndex(quizState.currentQuestionIndex + 1);
            quizActions.setSelectedOption(null);
            quizActions.setIsAnswered(false);
            // Süreyi sıfırla ve yeniden başlat
            timerActions.resetTimer(60);
            timerActions.startTimer();
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
            <div className="max-w-5xl mx-auto px-4">
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            {quizState.quiz?.title || 'Ödev Quiz'}
                        </h1>
                        <p className="text-gray-600">
                            Soruları dikkatle çözün ve zamanınızı iyi kullanın.
                        </p>
                    </div>

                    {quizState.currentQuestion && (
                        <>
                            {/* İlerleme Çubuğu */}
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700">
                                        Soru {quizState.currentQuestionIndex + 1} / {quizState.quiz?.questions.length}
                                    </span>
                                    <span className="text-sm font-medium text-gray-700">
                                        {Math.round((quizState.currentQuestionIndex + 1) / quizState.quiz!.questions.length * 100)}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div 
                                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                                        style={{ 
                                            width: `${((quizState.currentQuestionIndex + 1) / quizState.quiz!.questions.length) * 100}%` 
                                        }}
                                    ></div>
                                </div>
                            </div>

                            {/* Zamanlayıcı */}
                            <div className="flex justify-center mb-4">
                                <CircularProgress
                                    timeLeft={timerState.timeLeft}
                                    totalTime={60}
                                    onTimeout={() => {
                                        if (!quizState.isAnswered && quizState.currentQuestion && quizState.quiz) {
                                            // Yanlış cevap olarak kaydet
                                            quizActions.addAnswer({
                                                questionNumber: quizState.currentQuestion.number,
                                                isCorrect: false,
                                                selectedOption: '',
                                                correctOption: quizState.currentQuestion.correctOption,
                                                questionImage: quizState.currentQuestion.imageUrl,
                                                isTimeout: true,
                                                solutionVideo: null,
                                                options: quizState.currentQuestion.options.map((opt: QuizOption) => ({
                                                    id: opt.id,
                                                    imageUrl: opt.imageUrl,
                                                    isSelected: false,
                                                    isCorrect: opt.id === quizState.currentQuestion.correctOption
                                                }))
                                            });

                                            // Son soru kontrolü
                                            if (!quizState.quiz) return;
                                            
                                            if (quizState.currentQuestionIndex === quizState.quiz.questions.length - 1) {
                                                handleAssignmentComplete(quizState.quiz, [...quizState.answers]);
                                            } else {
                                                // Sonraki soruya geç
                                                quizActions.setCurrentQuestionIndex(quizState.currentQuestionIndex + 1);
                                                quizActions.setSelectedOption(null);
                                                quizActions.setIsAnswered(false);
                                                timerActions.resetTimer(60);
                                                timerActions.startTimer();
                                            }
                                        }
                                    }}
                                    size={80}
                                    strokeWidth={8}
                                    className="text-blue-600"
                                />
                            </div>
                            
                            <div className="mt-6">
                                {/* Soru resmi */}
                                <div className="mb-6">
                                    <div className="flex justify-center">
                                        <img 
                                            src={quizState.currentQuestion.imageUrl} 
                                            alt={`Soru ${quizState.currentQuestionIndex + 1}`}
                                            className="w-auto max-w-full h-auto max-h-[400px] rounded-lg shadow-md"
                                        />
                                    </div>
                                </div>

                                {/* Seçenekler */}
                                <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
                                    {quizState.currentQuestion.options.map((option: QuizOption) => (
                                        <button
                                            key={option.id}
                                            onClick={() => handleOptionSelect(option.id)}
                                            className={`
                                                flex-1 min-w-[150px] max-w-[200px] p-3 rounded-lg transition-all transform 
                                                ${!quizState.isAnswered ? 'hover:scale-105 hover:shadow-lg cursor-pointer' : ''}
                                                ${quizState.selectedOption === option.id
                                                    ? 'ring-2 ring-blue-500 shadow-lg'
                                                    : 'hover:shadow-md'
                                                }
                                                ${quizState.isAnswered && option.id === quizState.currentQuestion.correctOption
                                                    ? 'ring-2 ring-green-500'
                                                    : ''
                                                }
                                                ${quizState.isAnswered && quizState.selectedOption === option.id && 
                                                  option.id !== quizState.currentQuestion.correctOption
                                                    ? 'ring-2 ring-red-500'
                                                    : ''
                                                }
                                            `}
                                            disabled={quizState.isAnswered}
                                        >
                                            <div className="aspect-w-4 aspect-h-3">
                                                <img 
                                                    src={option.imageUrl} 
                                                    alt={`Seçenek ${option.id}`}
                                                    className="w-full h-full object-contain rounded-md"
                                                />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}