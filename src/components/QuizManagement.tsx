import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Pagination,
  IconButton,
  Chip,
} from '@mui/material';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import AddIcon from '@mui/icons-material/Add';
import PreviewIcon from '@mui/icons-material/Preview';
import { supabase } from '../lib/supabase';
import { QUESTIONS_CONFIG } from '../config/questions';

interface QuestionPreview {
  number: number;
  questionImage: string;
  options: {
    letter: string;
    optionImage: string;
    answerImage: string;
  }[];
  correctAnswer?: string;
}

export const QuizManagement: React.FC = () => {
  const [questions, setQuestions] = useState<QuestionPreview[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
  const [previewQuestion, setPreviewQuestion] = useState<QuestionPreview | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDescription, setQuizDescription] = useState('');
  const [totalQuestions, setTotalQuestions] = useState(0);
  const questionsPerPage = 12;

  // Soruları yükle
  useEffect(() => {
    loadQuestions();
  }, [page]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      // Toplam soru sayısını al (ilk kez yüklendiğinde)
      if (totalQuestions === 0) {
        setTotalQuestions(QUESTIONS_CONFIG.categories.Matris.totalQuestions);
      }

      // Sadece mevcut sayfa için soruları yükle
      const startIndex = (page - 1) * questionsPerPage + 1;
      const endIndex = Math.min(page * questionsPerPage, QUESTIONS_CONFIG.categories.Matris.totalQuestions);
      
      const loadedQuestions: QuestionPreview[] = [];
      
      for (let i = startIndex; i <= endIndex; i++) {
        const questionPreview: QuestionPreview = {
          number: i,
          questionImage: `/images/questions/Matris/Soru-${i}.webp`,
          options: ['A', 'B', 'C', 'D', 'E'].map(letter => ({
            letter,
            optionImage: `/images/options/Matris/${i}/Soru-${i}${letter}.webp`,
            answerImage: `/images/options/Matris/${i}/Soru-cevap-${i}${letter}.webp`
          }))
        };

        // Her seçenek için sırayla doğru cevap kontrolü yap
        let foundCorrectAnswer = false;
        
        for (const option of questionPreview.options) {
          try {
            // Fetch yerine img.onload/onerror kullanarak dosya varlığını kontrol et
            const checkImage = (src: string): Promise<boolean> => {
              return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                  console.log(`[Question ${i}] Image exists:`, src);
                  resolve(true);
                };
                img.onerror = () => {
                  console.log(`[Question ${i}] Image not found:`, src);
                  resolve(false);
                };
                img.src = src;  
              });
            };

            const exists = await checkImage(option.answerImage);
            
            if (exists) {
              console.log(`[Question ${i}] Found correct answer: ${option.letter}`);
              questionPreview.correctAnswer = option.letter;
              foundCorrectAnswer = true;
              break;
            }
          } catch (error) {
            console.error(`[Question ${i}] Error checking option ${option.letter}:`, error);
          }
        }

        if (!foundCorrectAnswer) {
          console.warn(`[Question ${i}] No correct answer found after checking all options`);
        } else {
          console.log(`[Question ${i}] Final correct answer:`, questionPreview.correctAnswer);
        }

        loadedQuestions.push(questionPreview);
      }
      console.log('All questions loaded:', loadedQuestions.map(q => ({
        number: q.number,
        correctAnswer: q.correctAnswer
      })));
      setQuestions(loadedQuestions);
    } catch (error) {
      console.error('Error loading questions:', error);
    }
    setLoading(false);
  };

  const handlePreview = (question: QuestionPreview) => {
    setPreviewQuestion(question);
    setShowPreview(true);
  };

  const handleQuestionSelect = (questionNumber: number) => {
    setSelectedQuestions(prev => 
      prev.includes(questionNumber)
        ? prev.filter(num => num !== questionNumber)
        : [...prev, questionNumber]
    );
  };

  const handleCreateQuiz = async () => {
    if (!quizTitle || selectedQuestions.length === 0) {
      alert('Quiz başlığı ve en az bir soru seçmelisiniz!');
      return;
    }

    try {
      const { data: quiz, error: quizError } = await supabase
        .from('assignments')
        .insert([
          {
            title: quizTitle,
            description: quizDescription,
            questions: selectedQuestions.map(num => ({
              number: num,
              correctAnswer: questions.find(q => q.number === num)?.correctAnswer
            })),
            is_active: true
          }
        ])
        .select()
        .single();

      if (quizError) throw quizError;

      alert('Quiz başarıyla oluşturuldu!');
      setQuizTitle('');
      setQuizDescription('');
      setSelectedQuestions([]);
    } catch (error) {
      console.error('Error creating quiz:', error);
      alert('Quiz oluşturulurken bir hata oluştu!');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const QuestionPreviewDialog = ({ question, onClose }: { question: QuestionPreview; onClose: () => void }) => {
    console.log('Question preview:', {
      number: question.number,
      correctAnswer: question.correctAnswer,
      options: question.options.map(o => o.letter)
    });

    return (
      <Box>
        <Box mb={2}>
          <img
            src={question.questionImage}
            alt={`Soru ${question.number}`}
            style={{
              width: '100%',
              maxHeight: '400px',
              objectFit: 'contain'
            }}
            onError={(e) => {
              console.error(`Error loading question image: ${question.questionImage}`);
            }}
          />
        </Box>
        <Typography variant="h6" gutterBottom>
          Seçenekler
        </Typography>
        <Grid container spacing={2}>
          {question.options.map((option) => {
            const isCorrect = question.correctAnswer === option.letter;
            console.log(`Option ${option.letter} isCorrect:`, isCorrect);
            
            return (
              <Grid item xs={12} sm={6} key={option.letter}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 1.5,
                    borderRadius: 1,
                    border: isCorrect
                      ? '2px solid #4caf50'
                      : '1px solid rgba(0, 0, 0, 0.12)',
                    bgcolor: isCorrect
                      ? 'rgba(76, 175, 80, 0.08)'
                      : 'transparent'
                  }}
                >
                  <Typography
                    sx={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: isCorrect
                        ? 'success.main'
                        : 'grey.200',
                      color: isCorrect
                        ? 'white'
                        : 'text.secondary'
                    }}
                  >
                    {option.letter}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <img
                      src={option.optionImage}
                      alt={`Seçenek ${option.letter}`}
                      style={{
                        width: '50px',
                        height: '50px',
                        objectFit: 'contain'
                      }}
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        if (img.src !== option.answerImage) {
                          img.src = option.answerImage;
                        }
                      }}
                    />
                  </Box>
                  {isCorrect && (
                    <Chip
                      label="Doğru Cevap"
                      color="success"
                      size="small"
                    />
                  )}
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    );
  };

  return (
    <Box p={3}>
      <Box mb={3}>
        <Typography variant="h5" gutterBottom>
          Quiz Oluştur
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Quiz Başlığı"
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Quiz Açıklaması"
              value={quizDescription}
              onChange={(e) => setQuizDescription(e.target.value)}
            />
          </Grid>
        </Grid>
      </Box>

      <Box mb={2}>
        <Typography variant="h6" gutterBottom>
          Sorular ({selectedQuestions.length} soru seçildi)
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {questions
          .map((question) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={question.number}>
              <Card 
                variant="outlined"
                sx={{
                  border: selectedQuestions.includes(question.number) 
                    ? '2px solid #4caf50' 
                    : '1px solid rgba(0, 0, 0, 0.12)'
                }}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Soru {question.number}
                  </Typography>
                  <Box
                    sx={{
                      position: 'relative',
                      paddingTop: '100%',
                      marginBottom: 1
                    }}
                  >
                    <LazyLoadImage
                      src={question.questionImage}
                      alt={`Soru ${question.number}`}
                      effect="blur"
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain'
                      }}
                    />
                  </Box>
                  {question.correctAnswer && (
                    <Chip 
                      label={`Doğru Cevap: ${question.correctAnswer}`}
                      color="success"
                      size="small"
                      sx={{ mb: 1 }}
                    />
                  )}
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => handleQuestionSelect(question.number)}
                  >
                    {selectedQuestions.includes(question.number) ? 'Çıkar' : 'Ekle'}
                  </Button>
                  <IconButton
                    size="small"
                    onClick={() => handlePreview(question)}
                  >
                    <PreviewIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
      </Grid>

      <Box mt={3} display="flex" justifyContent="center">
        <Pagination
          count={Math.ceil(totalQuestions / questionsPerPage)}
          page={page}
          onChange={(_, value) => setPage(value)}
          color="primary"
        />
      </Box>

      <Box mt={3} display="flex" justifyContent="flex-end">
        <Button
          variant="contained"
          color="primary"
          disabled={selectedQuestions.length === 0 || !quizTitle}
          onClick={handleCreateQuiz}
        >
          Quiz Oluştur ({selectedQuestions.length} soru)
        </Button>
      </Box>

      {/* Soru Önizleme Dialog'u */}
      <Dialog
        open={showPreview}
        onClose={() => setShowPreview(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Soru {previewQuestion?.number} Önizleme
        </DialogTitle>
        <DialogContent>
          {previewQuestion && (
            <QuestionPreviewDialog question={previewQuestion} onClose={() => setShowPreview(false)} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreview(false)}>
            Kapat
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuizManagement;
