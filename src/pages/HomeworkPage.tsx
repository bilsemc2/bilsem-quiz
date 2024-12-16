import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSound } from '../contexts/SoundContext';
import { supabase } from '../lib/supabase';
import { calculateScore } from '../utils/scoreCalculator';
import { CircularProgress } from '../components/CircularProgress';
import { Feedback } from '../components/Feedback';
import YouTube from 'react-youtube';
import { playSound } from '../utils/soundPlayer';

interface Quiz {
  id: string;
  title: string;
  description: string;
  grade: number;
  subject: string;
  questions: any[];
  is_active: boolean;
  created_at: string;
}

export default function HomeworkPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [userGrade, setUserGrade] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isTimeout, setIsTimeout] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [feedback, setFeedback] = useState({ message: '', type: 'info' as const, show: false });

  const showFeedback = (message: string, type: 'success' | 'error' | 'info') => {
    setFeedback({ message, type, show: true });
    setTimeout(() => setFeedback(prev => ({ ...prev, show: false })), 2000);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        // Load user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        
        setUserGrade(profileData.grade);
        setIsAdmin(profileData.is_admin);

        // Load quizzes for user's grade
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('is_active', true)
          .eq('grade', profileData.grade)
          .order('created_at', { ascending: false });

        if (quizError) throw quizError;
        setQuizzes(quizData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        showFeedback('Veri yüklenirken bir hata oluştu', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeQuiz && timeLeft > 0 && !isAnswered) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);

      if (timeLeft === 0) {
        handleTimeUp();
      }
    }
    return () => clearInterval(timer);
  }, [timeLeft, isAnswered, activeQuiz]);

  const handleTimeUp = () => {
    setIsAnswered(true);
    setIsTimeout(true);
    showFeedback('Süre doldu!', 'error');
  };

  const startQuiz = (quiz: Quiz) => {
    console.log('Starting quiz:', quiz);
    
    // Soruları doğru resim yollarıyla güncelle
    const questionsWithImages = quiz.questions.map((question: any) => {
      // Soru numarasını al (sadece sayı)
      const questionNumber = question.id.replace(/[^0-9]/g, '');
      
      // Soru görseli
      const questionImageUrl = `/images/questions/Matris/Soru-${questionNumber}.webp`;
      
      // Seçenekleri güncelle
      const updatedOptions = question.options.map((option: any) => {
        // Seçenek harfini al (son karakter)
        const optionLetter = option.id.slice(-1);
        
        // Normal ve doğru cevap görsellerinin yollarını oluştur
        const normalPath = `/images/options/Matris/${questionNumber}/Soru-${questionNumber}${optionLetter}.webp`;
        const correctPath = `/images/options/Matris/${questionNumber}/Soru-cevap-${questionNumber}${optionLetter}.webp`;
        
        // Seçenek görseli - normal görseli kullan
        const imageUrl = normalPath;
        
        // Doğru cevap kontrolü - option.isCorrect ve dosya adı kontrolü
        const isCorrectOption = option.isCorrect === true || option.id === question.correctAnswer;
        
        console.log('Option details:', { 
          id: option.id,
          isCorrect: isCorrectOption,
          normalPath,
          correctPath,
          imageUrl
        });

        return {
          ...option,
          imageUrl,
          isCorrect: isCorrectOption
        };
      });

      return {
        ...question,
        questionImageUrl,
        options: updatedOptions
      };
    });

    const updatedQuiz = {
      ...quiz,
      questions: questionsWithImages
    };
    
    console.log('Updated quiz with correct paths:', updatedQuiz);
    
    setActiveQuiz(updatedQuiz);
    setCurrentQuestionIndex(0);
    setTimeLeft(60);
    setIsAnswered(false);
    setIsTimeout(false);
    setScore(0);
    setSelectedOption(null);
    setShowSolution(false);
  };

  const handleOptionSelect = (optionId: string) => {
    if (isAnswered) return;

    const currentQuestion = activeQuiz?.questions[currentQuestionIndex];
    const selectedOption = currentQuestion.options.find(opt => opt.id === optionId);
    const isCorrect = selectedOption?.isCorrect || false;
    
    if (isCorrect) {
      playSound('correct');
      setScore(prev => prev + 1);
      showFeedback('Doğru! 🎉', 'success');
    } else {
      playSound('incorrect');
      showFeedback('Yanlış cevap! 😔', 'error');
    }

    setSelectedOption(optionId);
    setIsAnswered(true);
    setShowSolution(true);
  };

  const handleNext = useCallback(async () => {
    if (!activeQuiz) return;

    if (currentQuestionIndex < activeQuiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setShowSolution(false);
      setTimeLeft(60);
      setIsTimeout(false);
      showFeedback('Sonraki soru!', 'info');
    } else {
      // Quiz completed
      try {
        const finalScore = Math.round((score / activeQuiz.questions.length) * 100);
        
        const { error } = await supabase.from('quiz_results').insert({
          user_id: user?.id,
          quiz_id: activeQuiz.id,
          score: finalScore,
          questions_answered: activeQuiz.questions.length,
          correct_answers: score,
          completed_at: new Date().toISOString()
        });

        if (error) throw error;

        // Navigate to result page with quiz results
        navigate('/result', {
          state: {
            correctAnswers: score,
            totalQuestions: activeQuiz.questions.length,
            points: finalScore,
            xp: Math.round(finalScore / 10),
            isHomework: true
          }
        });

        // Reset quiz state
        setActiveQuiz(null);
        setCurrentQuestionIndex(0);
        setScore(0);
        setTimeLeft(60);
        setIsAnswered(false);
        setIsTimeout(false);
        setSelectedOption(null);
        setShowSolution(false);
      } catch (error) {
        console.error('Error saving quiz results:', error);
        showFeedback('Bir hata oluştu!', 'error');
      }
    }
  }, [activeQuiz, currentQuestionIndex, score, user?.id, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <CircularProgress indeterminate size={48} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Lütfen giriş yapın</h2>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Giriş Yap
        </button>
      </div>
    );
  }

  if (quizzes.length === 0) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold">Henüz ödev bulunmuyor</h2>
      </div>
    );
  }

  const currentQuestion = activeQuiz?.questions[currentQuestionIndex];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {!activeQuiz ? (
          <>
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Ödevler</h1>
            {quizzes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">
                  Şu anda aktif ödev bulunmamaktadır.
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                {quizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                          {quiz.title}
                        </h2>
                        <p className="text-gray-600 mb-4">{quiz.description}</p>
                        <div className="flex gap-4 text-sm text-gray-500">
                          <span>Ders: {quiz.subject}</span>
                          <span>•</span>
                          <span>{quiz.questions.length} Soru</span>
                          <span>•</span>
                          <span>
                            {new Date(quiz.created_at).toLocaleDateString('tr-TR')}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => startQuiz(quiz)}
                        className="
                          px-6 py-2 rounded-lg
                          bg-indigo-600 hover:bg-indigo-700
                          text-white font-semibold
                          transition-all duration-200
                          hover:shadow-md hover:scale-105
                        "
                      >
                        Başla
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          // Active quiz view
          <>
            {/* Progress Bar */}
            <div className="mb-4 sm:mb-8">
              <div className="flex justify-between items-center mb-2">
                <div className="text-base sm:text-lg font-semibold text-gray-700">
                  Soru {currentQuestionIndex + 1}/{activeQuiz.questions.length}
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
                  <button
                    onClick={() => setActiveQuiz(null)}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {currentQuestion && (
              <div className="w-full bg-white rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-6 mb-4 sm:mb-8">
                {/* Soru */}
                <div className="mb-4 sm:mb-8">
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-6">
                    <div className="flex justify-center">
                      <img
                        src={currentQuestion.questionImageUrl}
                        alt={`Soru ${currentQuestionIndex + 1}`}
                        className="max-h-[200px] sm:max-h-[300px] w-full object-contain rounded-lg transition-transform duration-300 hover:scale-105"
                      />
                    </div>
                  </div>
                </div>

                {/* Seçenekler */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-4">
                  {currentQuestion.options.map((option: any) => (
                    <button
                      key={option.id}
                      onClick={() => handleOptionSelect(option.id)}
                      disabled={isAnswered || isTimeout}
                      className={`
                        w-full p-2 sm:p-4 text-center rounded-lg transition-all duration-200 relative
                        ${isAnswered && !isTimeout
                          ? option.isCorrect
                            ? 'border-4 border-emerald-500 bg-emerald-50 shadow-emerald-100 scale-105'
                            : option.id === selectedOption
                              ? 'border-4 border-red-500 bg-red-50 shadow-red-100'
                              : 'border border-gray-200 bg-white'
                          : selectedOption === option.id
                            ? 'border-4 border-blue-500 bg-blue-50 shadow-blue-100'
                            : 'border border-gray-200 bg-white hover:border-blue-500 hover:shadow-lg'
                        }
                        ${isAnswered || isTimeout ? 'cursor-default' : 'cursor-pointer hover:scale-105'}
                      `}
                    >
                      <img 
                        src={option.imageUrl} 
                        alt={`Seçenek ${option.id}`}
                        className="w-full h-auto rounded-md"
                      />
                      <div className="mt-2 text-sm font-medium">
                        {option.id}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Sonraki soru butonu */}
                {(isAnswered || isTimeout) && (
                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={handleNext}
                      className="
                        px-8 py-3 rounded-lg
                        bg-indigo-600 hover:bg-indigo-700
                        text-white font-semibold text-lg
                        transition-all duration-200
                        hover:shadow-lg hover:scale-105
                      "
                    >
                      {currentQuestionIndex < activeQuiz.questions.length - 1 ? 'Sonraki Soru' : 'Testi Bitir'}
                    </button>
                  </div>
                )}

                {/* Video çözüm */}
                {showSolution && currentQuestion.solutionVideo && (
                  <div className="mt-8">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                      Video Çözüm
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-center">
                        <YouTube
                          videoId={currentQuestion.solutionVideo.videoId}
                          opts={{
                            height: '390',
                            width: '640',
                            playerVars: {
                              autoplay: 0,
                            },
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
        <Feedback message={feedback.message} type={feedback.type} show={feedback.show} />
      </div>
    </div>
  );
}