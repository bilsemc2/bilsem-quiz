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
  const [loading, setLoading] = useState(false);
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

  const loadQuestionsForPage = async (pageNum: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const startIndex = (pageNum - 1) * questionsPerPage;
      const endIndex = Math.min(startIndex + questionsPerPage, MAX_QUESTION_NUMBER);
      const pageQuestions: Question[] = [];
      
      for (let i = startIndex + 1; i <= endIndex; i++) {
        try {
          const questionImagePath = `/images/questions/Matris/Soru-${i}.webp`;
          const questionResponse = await fetch(questionImagePath);
          
          if (!questionResponse.ok) {
            continue;
          }

          const correctAnswer = await findCorrectAnswer(i);
          if (!correctAnswer) {
            continue;
          }
          
          pageQuestions.push({
            id: i.toString(),
            text: `Soru ${i}`,
            number: i,
            options: ['A', 'B', 'C', 'D', 'E'],
            correct_option: correctAnswer,
            points: 10,
            type: 'multiple_choice',
            difficulty: 2,
          });

          setLoadingProgress(((i - startIndex) / questionsPerPage) * 100);
        } catch (error) {
          console.error(`Soru ${i} yüklenirken hata:`, error);
        }
      }

      setQuestions(pageQuestions);
    } catch (error) {
      console.error('Sorular yüklenirken hata:', error);
      setError('Sorular yüklenirken hata oluştu. Lütfen sayfayı yenileyin.');
    } finally {
      setLoading(false);
      setLoadingProgress(0);
    }
  };

  const calculateTotalQuestions = async () => {
    let count = 0;
    for (let i = 1; i <= MAX_QUESTION_NUMBER; i++) {
      const questionImagePath = `/images/questions/Matris/Soru-${i}.webp`;
      try {
        const response = await fetch(questionImagePath);
        if (response.ok) {
          count++;
        }
      } catch {
        continue;
      }
    }
    setTotalQuestions(count);
  };

  useEffect(() => {
    calculateTotalQuestions();
  }, []);

  useEffect(() => {
    loadQuestionsForPage(page);
  }, [page]);

  const findCorrectAnswer = async (questionNumber: number): Promise<string | null> => {
    try {
      const optionFiles = await Promise.all(['A', 'B', 'C', 'D', 'E'].map(async letter => {
        const normalPath = `/images/options/Matris/${questionNumber}/Soru-${questionNumber}${letter}.webp`;
        const correctPath = `/images/options/Matris/${questionNumber}/Soru-cevap-${questionNumber}${letter}.webp`;
        
        try {
          const correctResponse = await fetch(correctPath);
          if (correctResponse.ok) {
            return { letter, isCorrect: true };
          }
          
          const normalResponse = await fetch(normalPath);
          if (normalResponse.ok) {
            return { letter, isCorrect: false };
          }
          
          return null;
        } catch {
          return null;
        }
      }));
      
      const correctOption = optionFiles.find(option => option?.isCorrect);
      return correctOption ? correctOption.letter : null;
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
            {filteredQuestions.map((question) => (
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
              count={Math.ceil(totalQuestions / questionsPerPage)}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
            />
          </Box>
        </>
      )}

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
