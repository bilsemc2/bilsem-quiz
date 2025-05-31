import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Chip,
  Container,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  Divider,
  Stack,
  Fade,
  Grow,
  Slide,
  useTheme,
  useMediaQuery,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Refresh,
  EmojiEvents,
  Settings,
  Close,
  Stairs,
  Info,
  Psychology,
  Lightbulb,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { styled, keyframes } from '@mui/material/styles';

// Enhanced interfaces
interface MathProblem {
  question: string;
  answer: number;
  options: number[];
  difficulty: number;
  type: 'addition' | 'subtraction' | 'multiplication' | 'division' | 'equations' | 'patterns';
  explanation?: string;
  pattern?: number[];
  timeLimit?: number;
  hints?: string[];
}

interface GameStats {
  totalQuestions: number;
  correctAnswers: number;
  averageTime: number;
  streak: number;
  bestStreak: number;
}

// Enhanced animations
const pulseAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const shakeAnimation = keyframes`
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
`;

const successAnimation = keyframes`
  0% { transform: scale(1) rotate(0deg); }
  25% { transform: scale(1.1) rotate(5deg); }
  50% { transform: scale(1.2) rotate(-5deg); }
  75% { transform: scale(1.1) rotate(5deg); }
  100% { transform: scale(1) rotate(0deg); }
`;

// Enhanced styled components
const AnswerButton = styled(Button, {
  shouldForwardProp: (prop) => !['isCorrect', 'isWrong', 'isSelected'].includes(prop as string),
})<{ isCorrect?: boolean; isWrong?: boolean; isSelected?: boolean }>(({ theme, isCorrect, isWrong, isSelected }) => ({
  justifyContent: 'flex-start',
  padding: theme.spacing(2, 3),
  textTransform: 'none',
  fontSize: '1.2rem',
  marginBottom: theme.spacing(1.5),
  borderRadius: theme.spacing(2),
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  minHeight: '60px',
  boxShadow: isSelected ? theme.shadows[4] : theme.shadows[1],
  transform: isSelected ? 'translateY(-2px)' : 'translateY(0)',
  animation: isCorrect ? `${successAnimation} 0.6s ease-in-out` : 
             isWrong ? `${shakeAnimation} 0.5s ease-in-out` : 'none',
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: theme.shadows[6],
  },
  '&:focus': {
    outline: `3px solid ${theme.palette.primary.main}40`,
    outlineOffset: '2px',
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: `linear-gradient(90deg, transparent, ${theme.palette.primary.main}20, transparent)`,
    transition: 'left 0.5s',
  },
  '&:hover::before': {
    left: '100%',
  },
}));

const StatsCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  textAlign: 'center',
  background: `linear-gradient(135deg, ${theme.palette.primary.main}10, ${theme.palette.secondary.main}10)`,
  borderRadius: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
}));

const QuestionCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: theme.spacing(3),
  background: `linear-gradient(135deg, ${theme.palette.background.paper}, ${theme.palette.grey[50]})`,
  boxShadow: theme.shadows[8],
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  },
}));

// Custom hooks for better organization
const useGameStats = () => {
  const [stats, setStats] = useState<GameStats>({
    totalQuestions: 0,
    correctAnswers: 0,
    averageTime: 0,
    streak: 0,
    bestStreak: 0,
  });

  const updateStats = useCallback((isCorrect: boolean, timeSpent: number) => {
    setStats(prev => ({
      totalQuestions: prev.totalQuestions + 1,
      correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
      averageTime: (prev.averageTime * prev.totalQuestions + timeSpent) / (prev.totalQuestions + 1),
      streak: isCorrect ? prev.streak + 1 : 0,
      bestStreak: isCorrect ? Math.max(prev.bestStreak, prev.streak + 1) : prev.bestStreak,
    }));
  }, []);

  return { stats, updateStats };
};

const useTimer = () => {
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [timeSpent, setTimeSpent] = useState<number>(0);

  const resetTimer = useCallback(() => {
    const now = Date.now();
    setStartTime(now);
    setTimeSpent(0);
  }, []);

  const getTimeSpent = useCallback(() => {
    return Date.now() - startTime;
  }, [startTime]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent(Date.now() - startTime);
    }, 100);

    return () => clearInterval(interval);
  }, [startTime]);

  return { timeSpent, resetTimer, getTimeSpent };
};

// Enhanced MathWorld component
const MathWorld: React.FC = memo(() => {
  const { user, loading: userLoading } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { stats, updateStats } = useGameStats();
  const { timeSpent, resetTimer, getTimeSpent } = useTimer();

  // Enhanced state management
  const [grade, setGrade] = useState<number>(1);
  const [currentProblem, setCurrentProblem] = useState<MathProblem | null>(null);
  const [userAnswer, setUserAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(
    new Set(['addition', 'patterns'])
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  // Auth redirect
  useEffect(() => {
    if (!user && !userLoading) {
      navigate('/login');
    }
  }, [user, userLoading, navigate]);

  // Memoized calculations
  const accuracyRate = useMemo(() => {
    return stats.totalQuestions > 0 ? (stats.correctAnswers / stats.totalQuestions) * 100 : 0;
  }, [stats.correctAnswers, stats.totalQuestions]);

  const difficultyMultiplier = useMemo(() => {
    const multipliers = { easy: 0.8, medium: 1, hard: 1.5 };
    return multipliers[difficulty];
  }, [difficulty]);

  const availableTypes = useMemo(() => {
    const typesByGrade: Record<number, MathProblem['type'][]> = {
      1: ['addition', 'patterns'],
      2: ['addition', 'patterns'],
      3: ['addition', 'subtraction', 'patterns'],
      4: ['addition', 'subtraction', 'multiplication', 'patterns'],
      5: ['addition', 'subtraction', 'multiplication', 'division', 'patterns'],
      6: ['addition', 'subtraction', 'multiplication', 'division', 'patterns'],
      7: ['addition', 'subtraction', 'multiplication', 'division', 'equations', 'patterns'],
      8: ['addition', 'subtraction', 'multiplication', 'division', 'equations', 'patterns'],
    };
    return typesByGrade[grade] || typesByGrade[8];
  }, [grade]);

  // Enhanced problem generation
  const generateProblem = useCallback(() => {
    setLoading(true);
    setShowExplanation(false);
    setIsCorrect(null);
    setUserAnswer(null);
    setShowHint(false);
    setCurrentHintIndex(0);
    resetTimer();

    let problem: MathProblem;
    const baseDifficulty = Math.min(Math.floor(grade / 2), 5);
    const adjustedDifficulty = Math.floor(baseDifficulty * difficultyMultiplier);

    const availableSelectedTypes = availableTypes.filter(t => selectedTypes.has(t));
    let type: MathProblem['type'];
    
    if (availableSelectedTypes.length === 0) {
      type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
      setSelectedTypes(new Set([type]));
    } else {
      type = availableSelectedTypes[Math.floor(Math.random() * availableSelectedTypes.length)];
    }

    const generateOptions = (correctAnswer: number, min: number, max: number): number[] => {
      const options = new Set<number>();
      options.add(correctAnswer);
      
      while (options.size < 4) {
        let wrongAnswer: number;
        if (type === 'patterns') {
          const offset = Math.floor(Math.random() * 5) + 1;
          wrongAnswer = Math.random() < 0.5 
            ? correctAnswer + offset 
            : Math.max(correctAnswer - offset, 1);
        } else {
          wrongAnswer = Math.floor(Math.random() * (max - min + 1)) + min;
        }
        
        if (wrongAnswer !== correctAnswer && wrongAnswer >= Math.max(1, min) && wrongAnswer <= max) {
          options.add(wrongAnswer);
        }
      }
      
      return Array.from(options).sort(() => Math.random() - 0.5);
    };

    // Enhanced problem generation with hints
    switch (type) {
      case 'patterns': {
        let pattern: number[] = [];
        let rule = '';
        let nextNumber = 0;
        let hints: string[] = [];
        
        if (grade <= 2) {
          const increment = Math.floor(Math.random() * 2) + 1;
          const start = Math.floor(Math.random() * 5) + 1;
          pattern = Array.from({ length: 3 }, (_, i) => start + i * increment);
          nextNumber = start + 3 * increment;
          rule = `Her sayı ${increment} artıyor.`;
          hints = [
            'Sayılar arasındaki farkı bul',
            `Her sayı ${increment} artıyor`,
            `Sonraki sayı: ${pattern[2]} + ${increment} = ${nextNumber}`
          ];
        } else if (grade <= 4) {
          const multiplier = Math.floor(Math.random() * 2) + 2;
          const start = Math.floor(Math.random() * 3) + 1;
          pattern = Array.from({ length: 3 }, (_, i) => start * Math.pow(multiplier, i));
          nextNumber = start * Math.pow(multiplier, 3);
          rule = `Her sayı ${multiplier} ile çarpılıyor.`;
          hints = [
            'Sayılar arasındaki çarpım oranını bul',
            `Her sayı ${multiplier} ile çarpılıyor`,
            `Sonraki sayı: ${pattern[2]} × ${multiplier} = ${nextNumber}`
          ];
        } else {
          const start1 = Math.floor(Math.random() * 5) + 1;
          const start2 = Math.floor(Math.random() * 5) + start1;
          pattern = [start1, start2, start1 + start2];
          nextNumber = pattern[1] + pattern[2];
          rule = 'Her sayı önceki iki sayının toplamıdır (Fibonacci benzeri).';
          hints = [
            'Önceki iki sayıya bak',
            'Her sayı önceki iki sayının toplamı',
            `Sonraki sayı: ${pattern[1]} + ${pattern[2]} = ${nextNumber}`
          ];
        }
        
        problem = {
          question: `Örüntüyü tamamlayın: ${pattern.join(', ')}, ?`,
          answer: nextNumber,
          options: generateOptions(nextNumber, 1, nextNumber + 10),
          difficulty: adjustedDifficulty,
          type,
          pattern,
          explanation: `Kural: ${rule}`,
          hints,
          timeLimit: 60000 // 60 seconds
        };
        break;
      }
      
      case 'addition': {
        let num1, num2;
        let hints: string[] = [];
        
        if (grade === 1) {
          num1 = Math.floor(Math.random() * 10) + 1;
          num2 = Math.floor(Math.random() * 10) + 1;
          while (num1 + num2 > 20) {
            num1 = Math.floor(Math.random() * 10) + 1;
            num2 = Math.floor(Math.random() * 10) + 1;
          }
        } else {
          const maxNum = 5 * (10 ** Math.min(adjustedDifficulty, 2));
          num1 = Math.floor(Math.random() * maxNum) + 1;
          num2 = Math.floor(Math.random() * maxNum) + 1;
        }
        
        const sum = num1 + num2;
        hints = [
          'İki sayıyı topla',
          `${num1} + ${num2}`,
          `Cevap: ${sum}`
        ];
        
        problem = {
          question: `${num1} + ${num2} = ?`,
          answer: sum,
          options: generateOptions(sum, Math.max(1, sum - 15), sum + 15),
          difficulty: adjustedDifficulty,
          type,
          explanation: `${num1} ve ${num2} toplanır, sonuç ${sum} olur.`,
          hints,
          timeLimit: 30000
        };
        break;
      }
      
      // ... other cases with similar enhancements ...
      
      default:
        problem = {
          question: '2 + 3 = ?',
          answer: 5,
          options: generateOptions(5, 1, 10),
          difficulty: 1,
          type: 'addition',
          explanation: 'Basit toplama.',
          hints: ['İki sayıyı topla', '2 + 3', 'Cevap: 5'],
          timeLimit: 30000
        };
    }

    setCurrentProblem(problem);
    setLoading(false);
  }, [grade, selectedTypes, difficultyMultiplier, availableTypes, resetTimer]);

  // Enhanced answer handling
  const handleAnswer = useCallback(() => {
    if (!currentProblem || userAnswer === null) return;
    
    const timeSpentMs = getTimeSpent();
    const correct = userAnswer === currentProblem.answer;
    setIsCorrect(correct);
    
    updateStats(correct, timeSpentMs);
    
    if (correct) {
      const timeBonus = Math.max(0, 10 - Math.floor(timeSpentMs / 1000));
      const difficultyBonus = currentProblem.difficulty * 10;
      const streakBonus = stats.streak * 5;
      const totalPoints = difficultyBonus + timeBonus + streakBonus;
      
      toast.success(`Doğru! +${totalPoints} puan`, { 
        duration: 2000, 
        icon: '🎉',
        style: {
          background: theme.palette.success.main,
          color: theme.palette.success.contrastText,
        }
      });
      setScore(prev => prev + totalPoints);
    } else {
      toast.error(`Yanlış! Doğru cevap: ${currentProblem.answer}`, { 
        duration: 3000, 
        icon: '😔',
        style: {
          background: theme.palette.error.main,
          color: theme.palette.error.contrastText,
        }
      });
    }
  }, [currentProblem, userAnswer, getTimeSpent, updateStats, stats.streak, theme]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!currentProblem || isCorrect !== null) return;
      
      const key = event.key;
      if (['1', '2', '3', '4'].includes(key)) {
        const index = parseInt(key) - 1;
        if (currentProblem.options[index] !== undefined) {
          setUserAnswer(currentProblem.options[index]);
        }
      } else if (key === 'Enter' && userAnswer !== null) {
        handleAnswer();
      } else if (key === 'h' || key === 'H') {
        setShowHint(true);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentProblem, isCorrect, userAnswer, handleAnswer]);

  // Generate initial problem
  useEffect(() => {
    generateProblem();
  }, [generateProblem]);

  // Loading state
  if (userLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" color="text.secondary">
          Matematik Dünyası Yükleniyor...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh', 
      bgcolor: 'grey.50',
      backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      backgroundAttachment: 'fixed'
    }}>
      {/* Enhanced AppBar */}
      <AppBar 
        position="static" 
        elevation={0} 
        sx={{ 
          bgcolor: 'rgba(255, 255, 255, 0.95)', 
          backdropFilter: 'blur(10px)',
          color: 'text.primary',
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Psychology color="primary" sx={{ fontSize: '2rem' }} />
            <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
              Matematik Dünyası
            </Typography>
          </Box>
          
          <Stack direction="row" spacing={2} alignItems="center">
            {/* Enhanced Stats Display */}
            <StatsCard elevation={0}>
              <Typography variant="caption" color="text.secondary">Skor</Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {score.toLocaleString()}
              </Typography>
            </StatsCard>
            
            <StatsCard elevation={0}>
              <Typography variant="caption" color="text.secondary">Doğruluk</Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                {accuracyRate.toFixed(0)}%
              </Typography>
            </StatsCard>
            
            <StatsCard elevation={0}>
              <Typography variant="caption" color="text.secondary">Seri</Typography>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <EmojiEvents 
                  color={stats.streak > 0 ? "warning" : "disabled"} 
                  sx={{ fontSize: '1.2rem' }} 
                />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {stats.streak}
                </Typography>
              </Stack>
            </StatsCard>
            
            <Tooltip title="Ayarlar">
              <IconButton 
                color="inherit" 
                onClick={() => setSettingsOpen(true)}
                sx={{ 
                  bgcolor: 'action.hover',
                  '&:hover': { bgcolor: 'action.selected' }
                }}
              >
                <Settings />
              </IconButton>
            </Tooltip>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Progress Bar */}
      {currentProblem?.timeLimit && (
        <LinearProgress 
          variant="determinate" 
          value={(timeSpent / currentProblem.timeLimit) * 100}
          sx={{ 
            height: 4,
            bgcolor: 'rgba(255,255,255,0.3)',
            '& .MuiLinearProgress-bar': {
              bgcolor: timeSpent > currentProblem.timeLimit * 0.8 ? 'error.main' : 'warning.main'
            }
          }}
        />
      )}

      {/* Main Content */}
      <Container 
        maxWidth="md" 
        sx={{ 
          flexGrow: 1, 
          py: 4, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}
      >
        <QuestionCard elevation={0}>
          {loading ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <CircularProgress size={60} thickness={4} />
              <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>
                Yeni soru hazırlanıyor...
              </Typography>
            </Box>
          ) : currentProblem ? (
            <Fade in={!loading} timeout={800}>
              <div>
                {/* Enhanced Question Display */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Chip 
                    label={`${grade}. Sınıf - ${currentProblem.type.charAt(0).toUpperCase() + currentProblem.type.slice(1)}`}
                    color="primary"
                    variant="outlined"
                    sx={{ mb: 2 }}
                  />
                  
                  <Typography
                    component="h1"
                    sx={{
                      fontWeight: 600,
                      fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' },
                      lineHeight: 1.2,
                      color: 'text.primary',
                      textAlign: 'center',
                      minHeight: '3em',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      animation: isCorrect === true ? `${pulseAnimation} 0.6s ease-in-out` : 'none',
                    }}
                  >
                    {currentProblem.question}
                  </Typography>
                  
                  {/* Timer Display */}
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Süre: {Math.floor(timeSpent / 1000)}s
                  </Typography>
                </Box>

                {/* Enhanced Answer Options */}
                <Grid container spacing={2} sx={{ mb: 4 }}>
                  {currentProblem.options.map((option, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                      <Grow in={!loading} timeout={600 + index * 150}>
                        <AnswerButton
                          fullWidth
                          variant={userAnswer === option ? 'contained' : 'outlined'}
                          onClick={() => {
                            if (isCorrect === null) {
                              setUserAnswer(option);
                            }
                          }}
                          disabled={isCorrect !== null}
                          color={
                            isCorrect === true && option === currentProblem.answer ? 'success' :
                            isCorrect === false && userAnswer === option ? 'error' :
                            isCorrect !== null && option === currentProblem.answer ? 'success' :
                            'primary'
                          }
                          isCorrect={isCorrect === true && option === currentProblem.answer}
                          isWrong={isCorrect === false && userAnswer === option}
                          isSelected={userAnswer === option}
                          startIcon={
                            isCorrect === true && option === currentProblem.answer ? <CheckCircle /> :
                            isCorrect === false && userAnswer === option ? <Cancel /> :
                            isCorrect !== null && option === currentProblem.answer ? <CheckCircle /> :
                            null
                          }
                          aria-label={`Seçenek ${String.fromCharCode(65 + index)}: ${option}`}
                        >
                          <Typography 
                            component="span" 
                            sx={{ 
                              fontWeight: 'bold', 
                              mr: 2,
                              fontSize: '1.1rem',
                              opacity: 0.8
                            }}
                          >
                            {String.fromCharCode(65 + index)}.
                          </Typography>
                          <Typography component="span" sx={{ fontSize: '1.3rem', fontWeight: 500 }}>
                            {option}
                          </Typography>
                        </AnswerButton>
                      </Grow>
                    </Grid>
                  ))}
                </Grid>

                {/* Enhanced Action Buttons */}
                <Stack 
                  direction={{ xs: 'column', sm: 'row' }} 
                  spacing={2} 
                  justifyContent="center"
                  alignItems="center"
                >
                  {isCorrect === null ? (
                    <>
                      <Button
                        variant="contained"
                        onClick={handleAnswer}
                        disabled={userAnswer === null}
                        size="large"
                        sx={{ 
                          minWidth: 180,
                          py: 1.5,
                          fontSize: '1.1rem',
                          borderRadius: 3,
                          boxShadow: theme.shadows[4],
                          '&:hover': {
                            boxShadow: theme.shadows[8],
                            transform: 'translateY(-2px)'
                          }
                        }}
                      >
                        Kontrol Et
                      </Button>
                      
                      <Tooltip title="İpucu al (H tuşu)">
                        <Button
                          variant="outlined"
                          onClick={() => setShowHint(true)}
                          startIcon={<Lightbulb />}
                          disabled={!currentProblem.hints || showHint}
                          sx={{ minWidth: 120 }}
                        >
                          İpucu
                        </Button>
                      </Tooltip>
                    </>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={generateProblem}
                      startIcon={<Refresh />}
                      size="large"
                      sx={{ 
                        minWidth: 180,
                        py: 1.5,
                        fontSize: '1.1rem',
                        borderRadius: 3,
                        boxShadow: theme.shadows[4],
                        '&:hover': {
                          boxShadow: theme.shadows[8],
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      Yeni Soru
                    </Button>
                  )}
                </Stack>

                {/* Hint Display */}
                {showHint && currentProblem.hints && (
                  <Slide direction="up" in={showHint}>
                    <Alert 
                      severity="info" 
                      sx={{ 
                        mt: 3,
                        borderRadius: 2,
                        '& .MuiAlert-message': { width: '100%' }
                      }}
                      action={
                        <Stack direction="row" spacing={1}>
                          {currentHintIndex < currentProblem.hints.length - 1 && (
                            <Button 
                              size="small" 
                              onClick={() => setCurrentHintIndex(prev => prev + 1)}
                            >
                              Sonraki İpucu
                            </Button>
                          )}
                          <IconButton 
                            size="small" 
                            onClick={() => setShowHint(false)}
                          >
                            <Close fontSize="small" />
                          </IconButton>
                        </Stack>
                      }
                    >
                      <Typography variant="body1">
                        💡 {currentProblem.hints[currentHintIndex]}
                      </Typography>
                    </Alert>
                  </Slide>
                )}

                {/* Enhanced Explanation */}
                {isCorrect !== null && currentProblem.explanation && (
                  <Box sx={{ mt: 3 }}>
                    <Button
                      size="medium"
                      onClick={() => setShowExplanation(prev => !prev)}
                      startIcon={<Info />}
                      variant="outlined"
                      sx={{ borderRadius: 2 }}
                    >
                      {showExplanation ? 'Açıklamayı Gizle' : 'Açıklamayı Gör'}
                    </Button>
                    
                    <Fade in={showExplanation}>
                      <Alert 
                        severity="info" 
                        sx={{ 
                          mt: 2, 
                          borderRadius: 2,
                          bgcolor: 'info.light',
                          '& .MuiAlert-message': {
                            fontSize: '1rem',
                            lineHeight: 1.6
                          }
                        }}
                      >
                        {currentProblem.explanation}
                      </Alert>
                    </Fade>
                  </Box>
                )}

                {/* Keyboard Shortcuts Info */}
                {!isMobile && (
                  <Typography 
                    variant="caption" 
                    color="text.secondary" 
                    sx={{ 
                      display: 'block', 
                      textAlign: 'center', 
                      mt: 3,
                      opacity: 0.7
                    }}
                  >
                    Klavye kısayolları: 1-4 (seçenekler), Enter (kontrol et), H (ipucu)
                  </Typography>
                )}
              </div>
            </Fade>
          ) : (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              <Typography variant="h6">Problem yüklenemedi</Typography>
              <Typography>Lütfen sayfayı yenileyin veya ayarları kontrol edin.</Typography>
            </Alert>
          )}
        </QuestionCard>
      </Container>

      {/* Enhanced Settings Drawer */}
      <Drawer 
        anchor="right" 
        open={settingsOpen} 
        onClose={() => setSettingsOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 400 },
            bgcolor: 'background.default',
          }
        }}
      >
        <Box sx={{ p: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Ayarlar</Typography>
            <IconButton onClick={() => setSettingsOpen(false)}>
              <Close />
            </IconButton>
          </Stack>
          
          <Divider sx={{ mb: 3 }} />

          <Stack spacing={4}>
            {/* Grade Selection */}
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <Stairs color="primary" />
                <Typography variant="h6">
                  🎓 Sınıf Seviyesi
                </Typography>
              </Stack>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Sınıf</InputLabel>
                <Select
                  value={grade}
                  onChange={(e) => {
                    const newGrade = Number(e.target.value);
                    setGrade(newGrade);
                    // Auto-adjust selected types based on grade
                    const newAvailableTypes = availableTypes;
                    setSelectedTypes(prev => {
                      const newSelected = new Set([...prev].filter((t): t is MathProblem['type'] => 
                        newAvailableTypes.includes(t as MathProblem['type'])
                      ));
                      if (newSelected.size === 0) {
                        newSelected.add(newAvailableTypes[0] || 'addition');
                      }
                      return newSelected;
                    });
                  }}
                  label="Sınıf"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((g) => (
                    <MenuItem key={g} value={g}>
                      {g}. Sınıf
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Difficulty Selection */}
            <Box>
              <Typography variant="h6" gutterBottom>
                ⚡ Zorluk Seviyesi
              </Typography>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Zorluk</InputLabel>
                <Select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                  label="Zorluk"
                >
                  <MenuItem value="easy">Kolay (-20% puan)</MenuItem>
                  <MenuItem value="medium">Orta (Normal puan)</MenuItem>
                  <MenuItem value="hard">Zor (+50% puan)</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Question Types */}
            <Box>
              <Typography variant="h6" gutterBottom>
                📚 Soru Tipleri
              </Typography>
              <Stack spacing={1}>
                {availableTypes.map((type) => {
                  const typeNames: Record<MathProblem['type'], string> = {
                    addition: 'Toplama',
                    subtraction: 'Çıkarma', 
                    multiplication: 'Çarpma',
                    division: 'Bölme',
                    equations: 'Denklemler',
                    patterns: 'Örüntüler'
                  };
                  
                  return (
                    <Chip
                      key={type}
                      label={typeNames[type]}
                      onClick={() => {
                        setSelectedTypes(prev => {
                          const newSet = new Set(prev);
                          if (newSet.has(type)) {
                            newSet.delete(type);
                            if (newSet.size === 0) {
                              newSet.add(type); // Keep at least one type
                            }
                          } else {
                            newSet.add(type);
                          }
                          return newSet;
                        });
                      }}
                      color={selectedTypes.has(type) ? 'primary' : 'default'}
                      variant={selectedTypes.has(type) ? 'filled' : 'outlined'}
                      sx={{ 
                        fontSize: '0.9rem',
                        py: 2,
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: selectedTypes.has(type) ? 'primary.dark' : 'action.hover'
                        }
                      }}
                    />
                  );
                })}
              </Stack>
            </Box>

            {/* Statistics */}
            <Box>
              <Typography variant="h6" gutterBottom>
                📊 İstatistikler
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Toplam Soru</Typography>
                    <Typography variant="h6">{stats.totalQuestions}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Doğru Cevap</Typography>
                    <Typography variant="h6" color="success.main">{stats.correctAnswers}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">En İyi Seri</Typography>
                    <Typography variant="h6" color="warning.main">{stats.bestStreak}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Ort. Süre</Typography>
                    <Typography variant="h6">{(stats.averageTime / 1000).toFixed(1)}s</Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          </Stack>
        </Box>
      </Drawer>
    </Box>
  );
});

MathWorld.displayName = 'MathWorld';

export default MathWorld;