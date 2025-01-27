import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Pagination,
  TextField,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  LinearProgress
} from '@mui/material';
import { MAX_QUESTION_NUMBER, ITEMS_PER_PAGE } from '../../config/constants';

// Question tipi
interface Question {
  id: string;
  text: string;
  number: number;
  options: string[];
  correct_option: string;
  points: number;
  type: 'multiple_choice' | 'true_false';
  difficulty: 1 | 2 | 3;
}

interface QuestionSelectorProps {
  onQuestionsSelected: (questions: Question[]) => void;
  initialSelectedQuestions?: Question[];
}

const QuestionSelector: React.FC<QuestionSelectorProps> = ({
  onQuestionsSelected,
  initialSelectedQuestions = [],
}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>(initialSelectedQuestions);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const questionsPerPage = ITEMS_PER_PAGE;

  const getQuestionImagePath = (questionNumber: number) => {
    return `/images/questions/Matris/Soru-${questionNumber}.webp`;
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Tüm soru dosyalarını al
      const questionFiles = Array.from({ length: MAX_QUESTION_NUMBER }, (_, i) => i + 1);
      const questions: Question[] = [];
      let loadedCount = 0;

      // Her soru için
      for (const questionNumber of questionFiles) {
        try {
          // Soru resminin varlığını kontrol et
          const questionImagePath = `/images/questions/Matris/Soru-${questionNumber}.webp`;
          const questionResponse = await fetch(questionImagePath);
          
          if (!questionResponse.ok) {
            continue;
          }

          // Doğru cevabı bul
          const correctAnswer = await findCorrectAnswer(questionNumber);
          if (!correctAnswer) {
            continue;
          }
          
          questions.push({
            id: questionNumber.toString(),
            text: `Soru ${questionNumber}`,
            number: questionNumber,
            options: ['A', 'B', 'C', 'D', 'E'],
            correct_option: correctAnswer,
            points: 10,
            type: 'multiple_choice',
            difficulty: 2,
          });

          loadedCount++;
          setLoadingProgress((loadedCount / MAX_QUESTION_NUMBER) * 100);
        } catch (error) {
          console.error(`Soru ${questionNumber} yüklenirken hata:`, error);
        }
      }

      if (questions.length === 0) {
        throw new Error('Hiç soru yüklenemedi');
      }

      setQuestions(questions);
      setTotalQuestions(questions.length);
    } catch (error) {
      console.error('Sorular yüklenirken hata:', error);
      setError('Sorular yüklenirken hata oluştu. Lütfen sayfayı yenileyin.');
    } finally {
      setLoading(false);
    }
  };

  const findCorrectAnswer = async (questionNumber: number): Promise<string | null> => {
    try {
      // Önce tüm seçenek dosyalarını kontrol et
      const optionFiles = await Promise.all(['A', 'B', 'C', 'D', 'E'].map(async letter => {
        const normalPath = `/images/options/Matris/${questionNumber}/Soru-${questionNumber}${letter}.webp`;
        const correctPath = `/images/options/Matris/${questionNumber}/Soru-cevap-${questionNumber}${letter}.webp`;
        
        try {
          // Doğru cevap dosyasını kontrol et
          const correctResponse = await fetch(correctPath);
          if (correctResponse.ok) {
            return { letter, isCorrect: true };
          }
          
          // Normal dosyayı kontrol et
          const normalResponse = await fetch(normalPath);
          if (normalResponse.ok) {
            return { letter, isCorrect: false };
          }
          
          return null;
        } catch {
          return null;
        }
      }));
      
      // Doğru cevabı bul
      const correctOption = optionFiles.find(option => option?.isCorrect);
      if (correctOption) {
        return correctOption.letter;
      }
      
      return null;
    } catch (err) {
      console.error(`Soru ${questionNumber} için hata:`, err);
      return null;
    }
  };

  const handleQuestionSelect = (question: Question) => {
    setSelectedQuestions(prev => {
      const isSelected = prev.some(q => q.id === question.id);
      const newSelectedQuestions = isSelected
        ? prev.filter(q => q.id !== question.id)
        : [...prev, question];
      
      // Seçili soruları parent komponente bildir
      onQuestionsSelected(newSelectedQuestions);
      return newSelectedQuestions;
    });
  };

  const handlePreview = (question: Question) => {
    setPreviewQuestion(question);
    setShowPreview(true);
  };

  const filteredQuestions = questions.filter(question =>
    question.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedQuestions = filteredQuestions.slice(
    (page - 1) * questionsPerPage,
    page * questionsPerPage
  );

  return (
    <Box sx={{ p: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" gutterBottom>
          Soru Seçici
        </Typography>
        <Typography color="text.secondary" gutterBottom>
          {totalQuestions} soru bulundu, {selectedQuestions.length} soru seçildi
        </Typography>
        
        <TextField
          fullWidth
          label="Soru Ara"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 2 }}
        />
      </Box>

      {loading ? (
        <Box sx={{ width: '100%' }}>
          <LinearProgress variant="determinate" value={loadingProgress} />
          <Typography align="center" sx={{ mt: 1 }}>
            Sorular yükleniyor... ({Math.round(loadingProgress)}%)
          </Typography>
        </Box>
      ) : (
        <>
          <Grid container spacing={2}>
            {paginatedQuestions.map((question) => (
              <Grid item xs={12} sm={6} md={4} key={question.id}>
                <Card 
                  sx={{ 
                    p: 2,
                    cursor: 'pointer',
                    border: selectedQuestions.some(q => q.id === question.id) 
                      ? '2px solid #1976d2' 
                      : '1px solid #e0e0e0'
                  }}
                  onClick={() => handleQuestionSelect(question)}
                  onDoubleClick={() => handlePreview(question)}
                >
                  <CardMedia
                    component="img"
                    image={getQuestionImagePath(question.number)}
                    alt={`Soru ${question.number}`}
                    sx={{ height: 200, objectFit: 'contain' }}
                  />
                  <CardContent>
                    <Typography variant="subtitle1">
                      {question.text}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Doğru Cevap: {question.correct_option}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <Pagination
              count={Math.ceil(filteredQuestions.length / questionsPerPage)}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
            />
          </Box>
        </>
      )}

      {/* Soru Önizleme Dialog'u */}
      <Dialog
        open={showPreview}
        onClose={() => setShowPreview(false)}
        maxWidth="md"
        fullWidth
      >
        {previewQuestion && (
          <DialogContent>
            <Box sx={{ textAlign: 'center' }}>
              <img
                src={getQuestionImagePath(previewQuestion.number)}
                alt={`Soru ${previewQuestion.number}`}
                style={{ maxWidth: '100%', height: 'auto' }}
              />
              <Typography variant="h6" sx={{ mt: 2 }}>
                {previewQuestion.text}
              </Typography>
              <Typography color="text.secondary">
                Doğru Cevap: {previewQuestion.correct_option}
              </Typography>
            </Box>
          </DialogContent>
        )}
        <DialogActions>
          <Button onClick={() => setShowPreview(false)}>Kapat</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuestionSelector;
