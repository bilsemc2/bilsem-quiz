import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSound } from '../contexts/SoundContext';
import { Box, Typography, Paper, Button, Grid, CircularProgress, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { calculateScore } from '../utils/scoreCalculator';
import YouTube from 'react-youtube';

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

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Load user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('grade, is_admin, email')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        console.log('Profile data:', profileData);
        const grade = Number(profileData.grade);
        setUserGrade(grade);
        // Admin kontrolünü kaldırdık, sadece email kontrolü yapıyoruz
        setIsAdmin(profileData.email === 'yaprakyesili@msn.com');

        // Load quizzes
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (quizError) throw quizError;

        console.log('Quiz data before filter:', quizData);
        // Filter quizzes based on grade
        const validQuizzes = quizData.filter(quiz => {
          const quizGrade = Number(quiz.grade);
          console.log('Checking quiz:', quiz.title, 'quiz grade:', quizGrade, 'user grade:', grade);
          return quiz && 
            (profileData.email === 'yaprakyesili@msn.com' || quizGrade === grade) &&
            quiz.title &&
            quiz.description &&
            Array.isArray(quiz.questions) &&
            quiz.questions.length > 0;
        });

        console.log('Valid quizzes after filter:', validQuizzes);
        setQuizzes(validQuizzes);
      } catch (error) {
        console.error('Error loading data:', error);
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
  };

  const startQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setCurrentQuestionIndex(0);
    setTimeLeft(60);
    setIsAnswered(false);
    setIsTimeout(false);
    setScore(0);
    setSelectedOption(null);
    setShowSolution(false);
  };

  const handleOptionSelect = async (optionId: string) => {
    if (isAnswered || !activeQuiz) return;

    setSelectedOption(optionId);
    const currentQuestion = activeQuiz.questions[currentQuestionIndex];
    const isCorrect = optionId === currentQuestion.correctOptionId;
    
    if (isCorrect) {
      setScore(prev => prev + 1);
    }

    setIsAnswered(true);
    setShowSolution(true);
  };

  const handleNext = async () => {
    if (!activeQuiz) return;

    if (currentQuestionIndex < activeQuiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setIsTimeout(false);
      setTimeLeft(60);
      setShowSolution(false);
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
            xp: Math.round(finalScore / 10), // XP hesaplaması
            isHomework: true, // Homework'den geldiğini belirtmek için flag ekledik
            answers: activeQuiz.questions.map((question, index) => ({
              questionNumber: index + 1,
              isCorrect: index < score, // Basitleştirilmiş doğru/yanlış bilgisi
              selectedOption: null,
              correctOption: question.correctOptionId,
              questionImage: question.questionImageUrl,
              isTimeout: false,
              solutionVideo: question.solutionVideo,
              options: question.options
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
      } catch (error) {
        console.error('Error saving quiz results:', error);
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Lütfen giriş yapın
        </Typography>
        <Button variant="contained" onClick={() => navigate('/login')}>
          Giriş Yap
        </Button>
      </Paper>
    );
  }

  if (quizzes.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Henüz ödev bulunmuyor
        </Typography>
      </Paper>
    );
  }

  const currentQuestion = activeQuiz?.questions[currentQuestionIndex];

  return (
    <Box>
      {!activeQuiz ? (
        // Quiz list view
        <Box sx={{ maxWidth: 1200, margin: '0 auto', padding: 3 }}>
          <Typography variant="h4" gutterBottom sx={{ mb: 4, textAlign: 'center' }}>
            Ödevlerim
          </Typography>
          
          <Grid container spacing={3}>
            {quizzes.map((quiz) => (
              <Grid item xs={12} md={6} key={quiz.id}>
                <Paper
                  elevation={3}
                  sx={{
                    p: 3,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: 2,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 6,
                    },
                  }}
                >
                  {/* Renkli üst şerit */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: 'linear-gradient(90deg, #2196F3 0%, #4CAF50 100%)',
                    }}
                  />

                  <Typography 
                    variant="h5" 
                    component="h2"
                    sx={{ 
                      mb: 2,
                      color: 'primary.main',
                      fontWeight: 'bold'
                    }}
                  >
                    {quiz.title}
                  </Typography>

                  <Typography 
                    sx={{ 
                      mb: 2,
                      color: 'text.secondary',
                      flex: 1
                    }}
                  >
                    {quiz.description}
                  </Typography>

                  <Box sx={{ 
                    display: 'flex', 
                    gap: 2, 
                    mb: 2,
                    flexWrap: 'wrap'
                  }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      bgcolor: 'primary.main',
                      color: 'white',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: '0.875rem'
                    }}>
                      {quiz.grade}. Sınıf
                    </Box>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      bgcolor: 'secondary.main',
                      color: 'white',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: '0.875rem'
                    }}>
                      {quiz.subject}
                    </Box>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      bgcolor: 'success.main',
                      color: 'white',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: '0.875rem'
                    }}>
                      {quiz.questions.length} Soru
                    </Box>
                  </Box>

                  <Box sx={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1
                  }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Sorular:
                    </Typography>
                    <Box sx={{ 
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 0.5,
                      mb: 2
                    }}>
                      {quiz.questions.map((question: any) => (
                        <Box
                          key={question.id}
                          sx={{
                            width: 24,
                            height: 24,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'grey.100',
                            borderRadius: '50%',
                            fontSize: '0.75rem',
                            color: 'text.secondary'
                          }}
                        >
                          {question.id}
                        </Box>
                      ))}
                    </Box>
                  </Box>

                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => startQuiz(quiz)}
                    sx={{
                      mt: 'auto',
                      textTransform: 'none',
                      borderRadius: 2,
                      py: 1
                    }}
                    fullWidth
                  >
                    Ödevi Başlat
                  </Button>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      ) : (
        // Active quiz view
        <div className="min-h-screen bg-[#f8fafc] py-4 sm:py-8">
          <div className="max-w-7xl mx-auto px-3 sm:px-4">
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
                  <IconButton 
                    onClick={() => setActiveQuiz(null)}
                    sx={{ 
                      bgcolor: 'grey.100',
                      '&:hover': {
                        bgcolor: 'grey.200'
                      }
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
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
                  {currentQuestion.options.map((option: any, index: number) => (
                    <button
                      key={index}
                      onClick={() => handleOptionSelect(option.id)}
                      disabled={isAnswered || isTimeout}
                      className={`
                        w-full p-2 sm:p-4 text-center rounded-lg transition-all duration-200 relative
                        ${isAnswered && !isTimeout
                          ? option.id === currentQuestion.correctOptionId
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
          </div>
        </div>
      )}
    </Box>
  );
}
