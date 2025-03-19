import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  LinearProgress,
} from '@mui/material';
import { MAX_QUESTION_NUMBER, ITEMS_PER_PAGE } from '../../config/constants';

interface Question {
  id: string;
  text: string;
  number: number;
  options: string[]; // Options artık bir dizi
  correct_option: string;
  points: number;
  type: 'multiple_choice' | 'true_false';
  difficulty: 1 | 2 | 3;
}

interface QuestionSelectorProps {
  onQuestionsSelected: (questions: Question[]) => void; // Dizi olarak güncellendi
  initialSelectedQuestions?: Question[]; // Dizi olarak güncellendi
}

const QuestionSelector: React.FC<QuestionSelectorProps> = ({
  onQuestionsSelected,
  initialSelectedQuestions = [],
}) => {
  const [questions, setQuestions] = useState<Question[]>([]); // Başlangıçta boş bir dizi
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>(
    initialSelectedQuestions
  );
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const questionsPerPage = ITEMS_PER_PAGE;

    // onQuestionsSelected fonksiyonu için useRef hook'u
    const onQuestionsSelectedRef = useRef(onQuestionsSelected);

    // onQuestionsSelected değiştiğinde ref'i güncelle
    useEffect(() => {
        onQuestionsSelectedRef.current = onQuestionsSelected;
    }, [onQuestionsSelected]);


  const getQuestionImagePath = useCallback((questionNumber: number) => {
    return `/images/questions/Matris/Soru-${questionNumber}.webp`;
  }, []);

  // Doğru cevabı bulan fonksiyon (useCallback ile optimize edildi)
  const findCorrectAnswer = useCallback(async (questionNumber: number): Promise<string | null> => {
    const letters = ['A', 'B', 'C', 'D', 'E'];
    for (const letter of letters) {
      try {
        const correctPath = `/images/options/Matris/${questionNumber}/Soru-cevap-${questionNumber}${letter}.webp`;
        const correctResponse = await fetch(correctPath);
        if (correctResponse.ok) {
          return letter;
        }
        //Eğer cevaplı görsel yoksa cevapsız görseli de kontrol ediyoruz.
        const normalPath = `/images/options/Matris/${questionNumber}/Soru-${questionNumber}${letter}.webp`;
        const normalResponse = await fetch(normalPath);
        if(normalResponse.ok){
            continue;
        }

      } catch (error) {
          console.error(`Error fetching option ${letter} for question ${questionNumber}:`, error);

      }
    }
    return null; // Hiçbir doğru cevap bulunamazsa null döndür
  }, []);


    // Sayfa için soruları yükleyen fonksiyon (useCallback ile optimize edildi)
    const loadQuestionsForPage = useCallback(async (pageNum: number) => {
        setLoading(true);
        setError(null);
        setLoadingProgress(0); // Yükleme başlamadan önce progress'i sıfırla

        const newQuestions: Question[] = [];
        const startIndex = (pageNum - 1) * questionsPerPage;
        const endIndex = Math.min(startIndex + questionsPerPage, MAX_QUESTION_NUMBER);

        try {
            for (let i = startIndex + 1; i <= endIndex; i++) {
                const questionImagePath = getQuestionImagePath(i);
                const questionResponse = await fetch(questionImagePath);

                if (!questionResponse.ok) {
                    // Eğer dosya yoksa, bu soruyu atla ve devam et
                    console.warn(`Question image not found for question number ${i}`);
                    continue;
                }

                const correctAnswer = await findCorrectAnswer(i);
                if (!correctAnswer) {
                    // Eğer doğru cevap bulunamazsa, bu soruyu atla
                    console.warn(`Correct answer not found for question number ${i}`);
                    continue;
                }

                newQuestions.push({
                    id: i.toString(),
                    text: `Soru ${i}`,
                    number: i,
                    options: ['A', 'B', 'C', 'D', 'E'],
                    correct_option: correctAnswer,
                    points: 10,
                    type: 'multiple_choice',
                    difficulty: 2,
                });

                // İlerleme çubuğunu güncelle
                setLoadingProgress(((i - startIndex) / questionsPerPage) * 100);
            }

            setQuestions(newQuestions);
        } catch (error) {
            setError('Sorular yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
            console.error('Error loading questions:', error);
        } finally {
            setLoading(false);
            setLoadingProgress(100); // Yükleme bitince 100 yap
        }
    }, [questionsPerPage, getQuestionImagePath, findCorrectAnswer]); // Bağımlılıkları doğru şekilde belirt


  // Toplam soru sayısını hesaplayan fonksiyon (useCallback ile optimize edildi)
    const calculateTotalQuestions = useCallback(async () => {
        let count = 0;
        for (let i = 1; i <= MAX_QUESTION_NUMBER; i++) {
            const questionImagePath = getQuestionImagePath(i);
            try {
                const response = await fetch(questionImagePath);
                if (response.ok) {
                    count++;
                }
            } catch {
                // Hata durumunda sayacı artırma, devam et
            }
        }
        setTotalQuestions(count);
    }, [getQuestionImagePath]);


  // useEffect hook'ları
  useEffect(() => {
    calculateTotalQuestions();
  }, [calculateTotalQuestions]);

  useEffect(() => {
    loadQuestionsForPage(page);
  }, [page, loadQuestionsForPage]);



  // Soru seçimi (useCallback ile optimize edildi)
  const handleQuestionSelect = useCallback(
    (question: Question) => {
      setSelectedQuestions((prevSelectedQuestions) => {
        const isAlreadySelected = prevSelectedQuestions.some((q) => q.id === question.id);

        if (isAlreadySelected) {
          // Eğer soru zaten seçiliyse, listeden çıkar
          return prevSelectedQuestions.filter((q) => q.id !== question.id);
        } else {
          // Seçili değilse, listeye ekle
          return [...prevSelectedQuestions, question];
        }
      });
    },
    []
  ); // Bağımlılık dizisi boş, çünkü fonksiyon içinde state'e bağlı bir değişiklik yok.

//   useEffect(() => {
//       onQuestionsSelected(selectedQuestions);
//   }, [selectedQuestions, onQuestionsSelected]);

  // selectedQuestions değiştiğinde onQuestionsSelectedRef.current'i çağır
    useEffect(() => {
        onQuestionsSelectedRef.current(selectedQuestions);
    }, [selectedQuestions]);


  // Soru önizlemesi (useCallback ile optimize edildi)
  const handlePreview = useCallback(
    (question: Question) => {
      setPreviewQuestion(question);
      setShowPreview(true);
    },
    []
  );

  // Filtrelenmiş sorular (useMemo ile optimize edildi)
  const filteredQuestions = useMemo(() => {
    return questions.filter((question) =>
      question.text.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [questions, searchTerm]);

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
                    border: selectedQuestions.some((q) => q.id === question.id)
                      ? '2px solid #1976d2'
                      : '1px solid #e0e0e0',
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
                    <Typography variant="subtitle1">{question.text}</Typography>
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

      <Dialog open={showPreview} onClose={() => setShowPreview(false)} maxWidth="md" fullWidth>
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