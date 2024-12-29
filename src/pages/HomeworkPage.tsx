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
  const [userAnswers, setUserAnswers] = useState<Array<{questionId: string, selectedAnswer: string, isCorrect: boolean}>>([]);
  const [quizResults, setQuizResults] = useState<any[]>([]);

  const showFeedback = (message: string, type: 'success' | 'error' | 'info') => {
    setFeedback({ message, type, show: true });
    setTimeout(() => setFeedback(prev => ({ ...prev, show: false })), 2000);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        console.log('Fetching data for user:', user.id);
        
        // Load user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Profile error:', profileError);
          throw profileError;
        }
        
        console.log('User profile:', profileData);
        setUserGrade(profileData.grade);
        setIsAdmin(profileData.is_admin);

        // Load quizzes for user's grade
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('*');

        if (quizError) {
          console.error('Quiz error:', quizError);
          throw quizError;
        }

        // Quiz verilerini detaylı logla
        console.log('Fetched quizzes:', quizData);
        quizData?.forEach(quiz => {
          if (quiz.id === '1d4c4e4d-d751-414e-9df4-6cb36bd375eb') {
            console.log('Target quiz found:', {
              id: quiz.id,
              questions: quiz.questions,
              questionCount: quiz.questions?.length
            });
          }
        });

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

  // Quiz sonuçlarını yükle
  useEffect(() => {
    if (user) {
      const loadQuizResults = async () => {
        // First get the quiz results
        const { data: resultsData, error: resultsError } = await supabase
          .from('quiz_results')
          .select('*')
          .eq('user_id', user.id);
        
        if (resultsError) {
          console.error('Error loading quiz results:', resultsError);
          return;
        }

        // Then fetch the associated quizzes
        if (resultsData && resultsData.length > 0) {
          const quizIds = resultsData.map(result => result.quiz_id);
          const { data: quizzesData, error: quizzesError } = await supabase
            .from('quizzes')
            .select('id, title, description, questions')
            .in('id', quizIds);

          if (quizzesError) {
            console.error('Error loading quizzes:', quizzesError);
            return;
          }

          // Combine the results with quiz data
          const combinedData = resultsData.map(result => ({
            ...result,
            quiz: quizzesData?.find(quiz => quiz.id === result.quiz_id)
          }));

          setQuizResults(combinedData);
        } else {
          setQuizResults([]);
        }
      };
      
      loadQuizResults();
    }
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
    const questionsWithImages = quiz.questions.map((question: any, index: number) => {
      // Soru numarasını question.number'dan al, yoksa index + 1 kullan
      const questionNumber = question.number?.toString() || (index + 1).toString();
      console.log('Processing question:', { 
        questionNumber, 
        question,
        originalNumber: question.number,
        index
      });
      
      // Soru görseli
      const questionImageUrl = `/src/images/questions/Matris/Soru-${questionNumber}.webp`;
      
      // Seçenekleri güncelle
      const updatedOptions = ['A', 'B', 'C', 'D', 'E'].map((optionLetter) => {
        // Normal ve doğru cevap görsellerinin yollarını oluştur
        const normalPath = `/src/images/options/Matris/${questionNumber}/Soru-${questionNumber}${optionLetter}.webp`;
        const correctPath = `/src/images/options/Matris/${questionNumber}/Soru-cevap-${questionNumber}${optionLetter}.webp`;
        
        // Doğru cevap kontrolü - question.correctAnswer ile karşılaştır
        const isCorrectOption = optionLetter === question.correctAnswer;
        
        // Seçenek görseli - doğru cevap için correctPath, diğerleri için normalPath kullan
        const imageUrl = isCorrectOption ? correctPath : normalPath;
        
        console.log('Option details:', { 
          questionNumber,
          optionLetter,
          isCorrect: isCorrectOption,
          normalPath,
          correctPath,
          imageUrl
        });

        return {
          id: optionLetter,
          imageUrl,
          isCorrect: isCorrectOption
        };
      });

      return {
        id: questionNumber,
        questionImageUrl,
        options: updatedOptions,
        correctAnswer: question.correctAnswer
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
    setUserAnswers([]);
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
    setUserAnswers(prev => [...prev, { questionId: currentQuestion.id, selectedAnswer: optionId, isCorrect }]);
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
          completed_at: new Date().toISOString(),
          user_answers: userAnswers
        });

        if (error) throw error;

        // Navigate to result page with quiz results
        navigate('/result', {
          state: {
            correctAnswers: score,
            totalQuestions: activeQuiz.questions.length,
            points: finalScore,
            xp: Math.round(finalScore / 10),
            isHomework: true,
            quizId: activeQuiz.id,
            answers: activeQuiz.questions.map((question: any, index: number) => ({
              questionNumber: index + 1,
              isCorrect: userAnswers[index]?.isCorrect || false,
              selectedOption: userAnswers[index]?.selectedAnswer || null,
              correctOption: question.correctAnswer,
              questionImage: question.questionImageUrl,
              isTimeout: false,
              options: question.options.map((option: any) => ({
                id: option.id,
                imageUrl: option.imageUrl,
                isSelected: userAnswers[index]?.selectedAnswer === option.id,
                isCorrect: option.isCorrect
              }))
            }))
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
        setUserAnswers([]);
      } catch (error) {
        console.error('Error saving quiz results:', error);
        showFeedback('Bir hata oluştu!', 'error');
      }
    }
  }, [activeQuiz, currentQuestionIndex, score, user?.id, navigate]);

  const renderQuizList = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quizzes.map((quiz) => {
          const quizAttempts = quizResults.filter(result => result.quiz_id === quiz.id);
          const latestQuizResult = quizAttempts[quizAttempts.length - 1];
          
          return (
          <div
            key={quiz.id}
            className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
          >
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">{quiz.title}</h3>
              <p className="text-gray-600 mb-4">{quiz.description}</p>
              
              {latestQuizResult && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-gray-800">Son Quiz Sonucunuz:</h4>
                    <span className="text-sm text-blue-600 font-medium">
                      {quizAttempts.length} kez çözüldü
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Puan:</span>
                      <span className="ml-2 font-medium">{latestQuizResult.score}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Doğru Cevap:</span>
                      <span className="ml-2 font-medium">{latestQuizResult.correct_answers}/{latestQuizResult.questions_answered}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-600">Tamamlanma:</span>
                      <span className="ml-2 font-medium">
                        {new Date(latestQuizResult.completed_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h5 className="font-medium text-gray-800 mb-2">Soru Detayları:</h5>
                    <div className="space-y-2">
                      {quiz.questions.map((question: any, index: number) => {
                        const userAnswer = latestQuizResult.user_answers?.[index];
                        return (
                          <div key={index} className="flex items-center space-x-2 text-sm">
                            <span className="font-medium">Soru {index + 1}:</span>
                            <span className={`${
                              userAnswer?.isCorrect 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {userAnswer?.isCorrect ? 'Doğru' : 'Yanlış'}
                            </span>
                            <span className="text-gray-600">
                              (Cevabınız: {userAnswer?.selectedAnswer || '-'})
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => startQuiz(quiz)}
                    className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    Tekrar Çöz
                  </button>
                </div>
              )}
              
              {!latestQuizResult && (
                <button
                  onClick={() => startQuiz(quiz)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  Ödevi Başlat
                </button>
              )}
            </div>
          </div>
        )})}
      </div>
    );
  };

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
            {renderQuizList()}
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