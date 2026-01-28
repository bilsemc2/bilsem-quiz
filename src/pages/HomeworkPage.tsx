import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import CircularProgress from '../components/CircularProgress';
import { Feedback } from '../components/Feedback';
import YouTube from 'react-youtube';
import { playSound } from '../utils/soundPlayer';

interface Quiz {
  id: string;
  title: string;
  description: string;
  grade: number;
  subject: string;
  questions: Question[];
  is_active: boolean;
  created_at: string;
}

interface Question {
  id: string;
  text: string;
  options: Option[];
  questionImageUrl?: string;
  solutionVideo?: {
    videoId: string;
  };
}

interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
  imageUrl?: string;
}

type FeedbackType = 'success' | 'error' | 'info';

export default function HomeworkPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isTimeout, setIsTimeout] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: FeedbackType; show: boolean }>({
    message: '',
    type: 'info',
    show: false
  });
  const [userAnswers, setUserAnswers] = useState<Array<{ questionId: string, selectedAnswer: string, isCorrect: boolean }>>([]);
  const [quizResults, setQuizResults] = useState<Array<{
    id: string;
    score: number;
    correct_answers: number;
    questions_answered: number;
    completed_at: string;
    quiz?: { id: string; title: string; description: string; questions: Question[] };
  }>>([]);

  const showFeedback = (message: string, type: FeedbackType) => {
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
        // setUserGrade(profileData.grade);
        // setIsAdmin(profileData.is_admin);

        // Load quizzes for user's grade
        const { data: quizData, error: quizError } = await supabase
          .from('assignments')
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
            .from('assignments')
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

  // Diziyi karıştırmak için yardımcı fonksiyon
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const startQuiz = async (quiz: Quiz) => {
    console.log('Starting quiz:', quiz);

    // Soruları doğru resim yollarıyla güncelle ve karıştır
    const questionsWithImages = shuffleArray(quiz.questions.map((question: Question) => {
      const questionNumber = question.id;

      // Soru görselinin yolunu oluştur
      const questionImageUrl = `/src/images/questions/Matris/Soru-${questionNumber}.webp`;

      // Seçenekleri güncelle ve karıştır
      const updatedOptions = shuffleArray(question.options.map((option: Option) => {
        // Normal ve doğru cevap görsellerinin yollarını oluştur
        const normalPath = `/src/images/options/Matris/${questionNumber}/Soru-${questionNumber}${option.id}.webp`;
        const correctPath = `/src/images/options/Matris/${questionNumber}/Soru-cevap-${questionNumber}${option.id}.webp`;

        // Doğru cevap kontrolü
        const isCorrectOption = option.isCorrect;

        // Seçenek görseli - doğru cevap için correctPath, diğerleri için normalPath kullan
        const imageUrl = isCorrectOption ? correctPath : normalPath;

        return {
          ...option,
          imageUrl
        };
      }));

      return {
        ...question,
        questionImageUrl,
        options: updatedOptions
      };
    }));

    setActiveQuiz({
      ...quiz,
      questions: questionsWithImages
    });
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
    if (isAnswered || !activeQuiz) return;

    const currentQuestion = activeQuiz.questions[currentQuestionIndex];
    if (!currentQuestion) return;

    const selectedOption = currentQuestion.options.find((opt: Option) => opt.id === optionId);
    const isCorrect = selectedOption?.isCorrect || false;

    if (isCorrect) {
      playSound('correct');
      setScore(prev => prev + 1);
      showFeedback('Doğru! 🎉', 'success');
    } else {
      playSound('incorrect');
      showFeedback('Yanlış cevap', 'error');
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
            answers: activeQuiz.questions.map((question: Question, index: number) => ({
              questionNumber: index + 1,
              isCorrect: userAnswers[index]?.isCorrect || false,
              selectedOption: userAnswers[index]?.selectedAnswer || null,
              correctOption: question.options.find(option => option.isCorrect)?.id,
              questionImage: question.questionImageUrl,
              isTimeout: false,
              options: question.options.map((option: Option) => ({
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

  const currentQuestion = activeQuiz?.questions[currentQuestionIndex];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <CircularProgress
          timeLeft={60}
          totalTime={60}
          progress={100}
        />
      </div>
    );
  }

  // Quiz sonuçlarını kontrol et
  if (quizResults.length > 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Quiz Sonuçları</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizResults.map((result) => (
            <div key={result.id} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-2">{result.quiz?.title}</h3>
              <div className="text-gray-600 mb-4">
                <p>Puan: {result.score}%</p>
                <p>Doğru Cevaplar: {result.correct_answers}/{result.questions_answered}</p>
                <p>Tamamlanma: {new Date(result.completed_at).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
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

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <CircularProgress
              timeLeft={60}
              totalTime={60}
              progress={100}
            />
          </div>
        ) : (
          <>
            {!activeQuiz ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200"
                  >
                    <h3 className="text-xl font-semibold mb-2">{quiz.title}</h3>
                    <p className="text-gray-600 mb-4">{quiz.description}</p>
                    <button
                      onClick={() => startQuiz(quiz)}
                      className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Başla
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
                {currentQuestion && (
                  <>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold">
                        Soru {currentQuestionIndex + 1}/{activeQuiz.questions.length}
                      </h2>
                      <CircularProgress
                        timeLeft={timeLeft}
                        totalTime={60}
                        progress={(timeLeft / 60) * 100}
                      />
                    </div>

                    <div className="w-full bg-white rounded-lg sm:rounded-2xl shadow-lg p-3 sm:p-6 mb-4 sm:mb-8">
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
                        {currentQuestion.options.map((option: Option) => (
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
                  </>
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