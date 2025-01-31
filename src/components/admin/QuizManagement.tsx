import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  CircularProgress,
  Alert,
  Switch,
  Chip,
  Select,
  MenuItem as MuiMenuItem,
  Grid,
  Tab,
  Tabs,
  Card,
  CardMedia,
  CardContent,
  Skeleton,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  VisibilityOff as VisibilityOffIcon,
  Assignment as AssignmentIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
} from '@mui/icons-material';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import QuestionSelector from './QuestionSelector';
import { MAX_QUESTION_NUMBER } from '../../config/constants';

export interface Question {
  id: string;
  text: string;
  options: string[];
  correct_option: string;
  explanation?: string;
  points: number;
  type: 'multiple_choice' | 'true_false';
  difficulty: 1 | 2 | 3;
  number: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  grade: number;
  subject: string;
  questions: Question[];
  is_active: boolean;
  status: 'pending' | 'completed';
  created_at?: string;
  created_by?: string;
}

interface QuizResult {
  id: string;
  quiz_id: string;
  student_id: string;
  score: number;
  total_questions: number;
  completed_at: string;
  student?: {
    name: string;
    email: string;
  };
}

const QuizManagement: React.FC = () => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [classes, setClasses] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    grade: '',
    subject: '',
    questions: [] as Question[],
    status: 'pending' as 'pending' | 'completed',
    classIds: [] as string[],
  });
  const [newQuestionNumber, setNewQuestionNumber] = useState('');
  const [previewQuiz, setPreviewQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');

  // Resim önbelleği için Map
  const imageCache = useMemo(() => new Map<string, string>(), []);

  // Resim URL'sini önbellekten al veya yükle
  const getImageUrl = useCallback(async (path: string): Promise<string> => {
    if (imageCache.has(path)) {
      return imageCache.get(path)!;
    }

    try {
      const response = await fetch(path);
      if (!response.ok) return '';
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      imageCache.set(path, url);
      return url;
    } catch (error) {
      console.error('Resim yüklenirken hata:', error);
      return '';
    }
  }, [imageCache]);

  // Component unmount olduğunda önbelleği temizle
  useEffect(() => {
    return () => {
      imageCache.forEach(url => URL.revokeObjectURL(url));
      imageCache.clear();
    };
  }, [imageCache]);

  // Resim yükleme durumunu takip et
  const [loadingImages, setLoadingImages] = useState(false);

  // Mevcut soru için resimleri yükle
  useEffect(() => {
    if (!previewQuiz) return;

    const loadImages = async () => {
      setLoadingImages(true);
      const currentQuestion = previewQuiz.questions[currentQuestionIndex];
      
      // Soru resmini yükle
      await getImageUrl(`/images/questions/Matris/Soru-${currentQuestion.number}.webp`);
      
      // Seçenek resimlerini yükle
      for (const option of ['A', 'B', 'C', 'D', 'E']) {
        const isCorrect = option === currentQuestion.correct_option;
        await getImageUrl(getOptionImagePath(currentQuestion.number, option, isCorrect));
      }
      
      setLoadingImages(false);
    };

    loadImages();
  }, [previewQuiz, currentQuestionIndex, getImageUrl]);

  useEffect(() => {
    fetchQuizzes();
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('name');

      if (error) throw error;
      setClasses(data || []);
    } catch (err) {
      console.error('Sınıflar yüklenirken hata:', err);
      toast.error('Sınıflar yüklenirken bir hata oluştu');
    }
  };

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const { data: quizData, error: quizError } = await supabase
        .from('assignments')
        .select('*')
        .order('created_at', { ascending: false });

      if (quizError) throw quizError;

      // Quiz sonuçlarını da çekelim
      const { data: resultData, error: resultError } = await supabase
        .from('assignment_results')
        .select('*, student:profiles(name, email)')
        .order('completed_at', { ascending: false });

      if (resultError) throw resultError;

      setQuizzes(quizData || []);
      setResults(resultData || []);
      setError(null);
    } catch (err) {
      console.error('Veriler yüklenirken hata:', err);
      setError('Veriler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      if (!formData.title || !formData.description || !formData.grade || !formData.subject || formData.questions.length === 0) {
        toast.error('Lütfen tüm alanları doldurun ve en az bir soru seçin');
        return;
      }

      // Önce quiz'i oluştur
      const { data: quizData, error: quizError } = await supabase
        .from('assignments')
        .insert([
          {
            title: formData.title,
            description: formData.description,
            grade: parseInt(formData.grade),
            subject: formData.subject,
            questions: formData.questions,
            status: formData.status,
            created_by: user?.id,
            is_active: true,
          },
        ])
        .select();

      if (quizError) throw quizError;

      // Seçili sınıflara quiz'i ata
      if (formData.classIds.length > 0 && quizData?.[0]?.id) {
        const { error: assignError } = await supabase
          .from('quiz_class_assignments')
          .insert(
            formData.classIds.map(classId => ({
              class_id: classId,
              quiz_id: quizData[0].id,
              assigned_by: user?.id,
              assigned_at: new Date().toISOString(),
            }))
          );

        if (assignError) throw assignError;
      }

      setQuizzes([...(quizData || []), ...quizzes]);
      setDialogOpen(false);
      resetForm();
      toast.success('Quiz başarıyla oluşturuldu ve sınıflara atandı');
    } catch (err) {
      console.error('Quiz oluşturulurken hata:', err);
      toast.error('Quiz oluşturulurken bir hata oluştu');
    }
  };

  const handleEdit = async () => {
    try {
      if (!selectedQuiz || !formData.title || !formData.description || !formData.grade || !formData.subject || formData.questions.length === 0) {
        toast.error('Lütfen tüm alanları doldurun ve en az bir soru seçin');
        return;
      }

      // Quiz'i güncelle
      const { error: quizError } = await supabase
        .from('assignments')
        .update({
          title: formData.title,
          description: formData.description,
          grade: parseInt(formData.grade),
          subject: formData.subject,
          questions: formData.questions,
          status: formData.status,
        })
        .eq('id', selectedQuiz.id);

      if (quizError) throw quizError;

      // Mevcut sınıf atamalarını sil
      const { error: deleteError } = await supabase
        .from('quiz_class_assignments')
        .delete()
        .eq('quiz_id', selectedQuiz.id);

      if (deleteError) throw deleteError;

      // Yeni sınıf atamalarını ekle
      if (formData.classIds.length > 0) {
        const { error: assignError } = await supabase
          .from('quiz_class_assignments')
          .insert(
            formData.classIds.map(classId => ({
              class_id: classId,
              quiz_id: selectedQuiz.id,
              assigned_by: user?.id,
              assigned_at: new Date().toISOString(),
            }))
          );

        if (assignError) throw assignError;
      }

      setQuizzes(quizzes.map((quiz) =>
        quiz.id === selectedQuiz.id
          ? {
              ...quiz,
              title: formData.title,
              description: formData.description,
              grade: parseInt(formData.grade),
              subject: formData.subject,
              questions: formData.questions,
              status: formData.status,
            }
          : quiz
      ));
      setDialogOpen(false);
      resetForm();
      toast.success('Quiz başarıyla güncellendi');
    } catch (err) {
      console.error('Quiz güncellenirken hata:', err);
      toast.error('Quiz güncellenirken bir hata oluştu');
    }
  };

  const handleDelete = async (quizId: string) => {
    if (!window.confirm('Bu quizi silmek istediğinizden emin misiniz?')) return;

    try {
      // Önce quiz sonuçlarını silelim
      const { error: resultError } = await supabase
        .from('assignment_results')
        .delete()
        .eq('quiz_id', quizId);

      if (resultError) throw resultError;

      // Sonra quiz'i silelim
      const { error: quizError } = await supabase
        .from('assignments')
        .delete()
        .eq('id', quizId);

      if (quizError) throw quizError;

      setQuizzes(quizzes.filter((quiz) => quiz.id !== quizId));
      setResults(results.filter((result) => result.quiz_id !== quizId));
      toast.success('Quiz başarıyla silindi');
    } catch (err) {
      console.error('Quiz silinirken hata:', err);
      toast.error('Quiz silinirken bir hata oluştu');
    }
  };

  const handleToggleActive = async (quizId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('assignments')
        .update({ is_active: !currentStatus })
        .eq('id', quizId);

      if (error) throw error;

      setQuizzes(quizzes.map((quiz) =>
        quiz.id === quizId ? { ...quiz, is_active: !currentStatus } : quiz
      ));
      toast.success('Quiz durumu güncellendi');
    } catch (err) {
      console.error('Quiz durumu güncellenirken hata:', err);
      toast.error('Quiz durumu güncellenirken bir hata oluştu');
    }
  };

  const handleEditClick = async (quiz: Quiz) => {
    try {
      // Önce quiz'e atanmış sınıfları al
      const { data: assignedClasses, error: assignError } = await supabase
        .from('quiz_class_assignments')
        .select('class_id')
        .eq('quiz_id', quiz.id);

      if (assignError) throw assignError;

      // Form verilerini ayarla
      setSelectedQuiz(quiz);
      setFormData({
        title: quiz.title,
        description: quiz.description,
        grade: quiz.grade.toString(),
        subject: quiz.subject,
        questions: quiz.questions,
        status: quiz.status,
        classIds: assignedClasses?.map(ac => ac.class_id) || [],
      });
      setDialogOpen(true);
    } catch (err) {
      console.error('Sınıf atamaları yüklenirken hata:', err);
      toast.error('Sınıf atamaları yüklenirken bir hata oluştu');
    }
  };

  const resetForm = () => {
    setSelectedQuiz(null);
    setFormData({
      title: '',
      description: '',
      grade: '',
      subject: '',
      questions: [],
      status: 'pending',
      classIds: [],
    });
  };

  const handleAddQuestion = async () => {
    try {
      setLoading(true);
      const questionNumber = parseInt(newQuestionNumber);
      
      if (isNaN(questionNumber) || questionNumber < 1 || questionNumber > MAX_QUESTION_NUMBER) {
        setError('Lütfen geçerli bir soru numarası girin');
        return;
      }

      // Soru zaten seçili mi kontrol et
      if (formData.questions.some(q => q.number === questionNumber)) {
        setError('Bu soru zaten seçili');
        return;
      }

      // Soru resminin varlığını kontrol et
      const questionImagePath = `/images/questions/Matris/Soru-${questionNumber}.webp`;
      const questionResponse = await fetch(questionImagePath);
      
      if (!questionResponse.ok) {
        setError('Bu soru numarası bulunamadı');
        return;
      }

      // Doğru cevabı bul
      const correctAnswer = await findCorrectAnswer(questionNumber);
      if (!correctAnswer) {
        setError('Bu soru için doğru cevap bulunamadı');
        return;
      }

      // Yeni soruyu ekle
      const newQuestion = {
        id: questionNumber.toString(),
        text: `Soru ${questionNumber}`,
        number: questionNumber,
        options: ['A', 'B', 'C', 'D', 'E'],
        correct_option: correctAnswer,
        points: 10,
        type: 'multiple_choice' as const,
        difficulty: 2 as const,
      };

      setFormData(prev => ({
        ...prev,
        questions: [...prev.questions, newQuestion]
      }));
      
      setNewQuestionNumber('');
      setError(null);
    } catch (err) {
      console.error('Soru eklenirken hata:', err);
      setError('Soru eklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

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

  const handlePreviewQuiz = (quiz: Quiz) => {
    setPreviewQuiz(quiz);
    setCurrentQuestionIndex(0);
    setShowCorrectAnswer(false);
  };

  const handleNextQuestion = () => {
    if (!previewQuiz) return;
    setSlideDirection('left');
    setTimeout(() => {
      setCurrentQuestionIndex((prev) => 
        prev < previewQuiz.questions.length - 1 ? prev + 1 : prev
      );
      setSlideDirection('right');
    }, 300);
  };

  const handlePrevQuestion = () => {
    if (!previewQuiz) return;
    setSlideDirection('right');
    setTimeout(() => {
      setCurrentQuestionIndex((prev) => (prev > 0 ? prev - 1 : prev));
      setSlideDirection('left');
    }, 300);
  };

  const handleKeyPress = (event: KeyboardEvent) => {
    if (!previewQuiz) return;

    if (event.key === 'ArrowRight' || event.key === ' ') {
      handleNextQuestion();
    } else if (event.key === 'ArrowLeft') {
      handlePrevQuestion();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [previewQuiz, currentQuestionIndex]);

  const getOptionImagePath = (questionNumber: number, option: string, isCorrect: boolean) => {
    if (isCorrect) {
      return `/images/options/Matris/${questionNumber}/Soru-cevap-${questionNumber}${option}.webp`;
    }
    return `/images/options/Matris/${questionNumber}/Soru-${questionNumber}${option}.webp`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  const renderQuizzes = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Quiz Adı</TableCell>
            <TableCell>Açıklama</TableCell>
            <TableCell align="right">Sınıf</TableCell>
            <TableCell>Ders</TableCell>
            <TableCell align="center">Durum</TableCell>
            <TableCell align="right">Soru Sayısı</TableCell>
            <TableCell align="center">Aktif/Pasif</TableCell>
            <TableCell align="center">İşlemler</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {quizzes.map((quiz) => (
            <TableRow key={quiz.id}>
              <TableCell>{quiz.title}</TableCell>
              <TableCell>{quiz.description}</TableCell>
              <TableCell align="right">{quiz.grade}. Sınıf</TableCell>
              <TableCell>{quiz.subject}</TableCell>
              <TableCell align="center">
                <Chip
                  label={quiz.status === 'completed' ? 'Tamamlandı' : 'Beklemede'}
                  color={quiz.status === 'completed' ? 'success' : 'warning'}
                  size="small"
                />
              </TableCell>
              <TableCell align="right">
                <Chip
                  label={`${quiz.questions?.length || 0} soru`}
                  color={quiz.questions?.length > 0 ? 'primary' : 'default'}
                  size="small"
                />
              </TableCell>
              <TableCell align="center">
                <Switch
                  checked={quiz.is_active}
                  onChange={() => handleToggleActive(quiz.id, quiz.is_active)}
                  color="primary"
                />
              </TableCell>
              <TableCell align="center">
                <Tooltip title="Görüntüle">
                  <IconButton
                    onClick={() => handlePreviewQuiz(quiz)}
                    size="small"
                  >
                    <ViewIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Düzenle">
                  <IconButton
                    onClick={() => handleEditClick(quiz)}
                    size="small"
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Sil">
                  <IconButton
                    onClick={() => handleDelete(quiz.id)}
                    size="small"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderResults = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Öğrenci</TableCell>
            <TableCell>Quiz</TableCell>
            <TableCell align="right">Puan</TableCell>
            <TableCell align="right">Toplam Soru</TableCell>
            <TableCell>Tamamlanma Tarihi</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {results.map((result) => (
            <TableRow key={result.id}>
              <TableCell>{result.student?.name || 'Bilinmeyen Öğrenci'}</TableCell>
              <TableCell>
                {quizzes.find(q => q.id === result.quiz_id)?.title || 'Silinmiş Quiz'}
              </TableCell>
              <TableCell align="right">
                <Chip
                  label={`${result.score}/${result.total_questions}`}
                  color={result.score >= result.total_questions / 2 ? 'success' : 'error'}
                  size="small"
                />
              </TableCell>
              <TableCell align="right">{result.total_questions}</TableCell>
              <TableCell>
                {new Date(result.completed_at).toLocaleDateString('tr-TR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="Quizler" icon={<AssignmentIcon />} iconPosition="start" />
            <Tab label="Sorular" icon={<ViewIcon />} iconPosition="start" />
            <Tab label="Sonuçlar" icon={<CheckIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        {tabValue === 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">
              Quiz Yönetimi
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => {
                resetForm();
                setDialogOpen(true);
              }}
            >
              Yeni Quiz
            </Button>
          </Box>
        )}

        {tabValue === 1 && (
          <Typography variant="h5" sx={{ mb: 2 }}>
            Soru Yönetimi
          </Typography>
        )}

        {tabValue === 2 && (
          <Typography variant="h5" sx={{ mb: 2 }}>
            Quiz Sonuçları
          </Typography>
        )}
      </Box>

      {tabValue === 0 && renderQuizzes()}
      {tabValue === 1 && (
        <QuestionSelector
          onQuestionsSelected={(selectedQuestions) => {
            setFormData(prev => ({
              ...prev,
              questions: selectedQuestions
            }));
          }}
          initialSelectedQuestions={formData.questions}
        />
      )}
      {tabValue === 2 && renderResults()}

      {/* Quiz Ekleme/Düzenleme Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {selectedQuiz ? 'Quiz Düzenle' : 'Yeni Quiz Oluştur'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {/* Sol taraf - Soru seçici */}
            <Box sx={{ flex: '1 1 60%' }}>
              <QuestionSelector
                onQuestionsSelected={(questions) => {
                  setFormData(prev => ({ ...prev, questions }));
                }}
                initialSelectedQuestions={formData.questions}
              />
            </Box>

            {/* Sağ taraf - Quiz bilgileri */}
            <Box sx={{ flex: '1 1 40%' }}>
              <TextField
                fullWidth
                label="Quiz Başlığı"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Açıklama"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                multiline
                rows={4}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Sınıf"
                type="number"
                value={formData.grade}
                onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Ders"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                sx={{ mb: 2 }}
              />
              
              {/* Sınıf seçimi */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Sınıf Seçimi
                </Typography>
                <Select
                  fullWidth
                  multiple
                  value={formData.classIds}
                  onChange={(e) => setFormData(prev => ({ ...prev, classIds: e.target.value as string[] }))}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => {
                        const classItem = classes.find(c => c.id === value);
                        return (
                          <Chip 
                            key={value} 
                            label={classItem?.name || value}
                            size="small"
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {classes.map((classItem) => (
                    <MuiMenuItem key={classItem.id} value={classItem.id}>
                      {classItem.name}
                    </MuiMenuItem>
                  ))}
                </Select>
              </Box>
              
              {/* Seçili sorular listesi */}
              {formData.questions.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Seçili Sorular ({formData.questions.length})
                  </Typography>
                  <Grid container spacing={1}>
                    {formData.questions.map((question) => (
                      <Grid item xs={6} key={question.id}>
                        <Card sx={{ display: 'flex', alignItems: 'center', p: 1 }}>
                          <Typography variant="body2" sx={{ flex: 1 }}>
                            Soru {question.number}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                questions: prev.questions.filter(q => q.id !== question.id)
                              }));
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>İptal</Button>
          <Button
            onClick={selectedQuiz ? handleEdit : handleCreate}
            variant="contained"
            disabled={!formData.title || !formData.description || !formData.grade || !formData.subject || formData.questions.length === 0}
          >
            {selectedQuiz ? 'Güncelle' : 'Oluştur'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!previewQuiz}
        onClose={() => setPreviewQuiz(null)}
        maxWidth="lg"
        fullWidth
      >
        {previewQuiz && previewQuiz.questions.length > 0 && (
          <>
            <DialogTitle>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">
                  {previewQuiz.title} - Soru {currentQuestionIndex + 1}/{previewQuiz.questions.length}
                </Typography>
                <IconButton onClick={() => setPreviewQuiz(null)} size="small">
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box 
                sx={{ 
                  display: 'flex', 
                  gap: 2,
                  opacity: loadingImages ? 0.5 : 1,
                  transition: 'opacity 0.3s ease-in-out'
                }}
              >
                {/* Sol taraf - Soru */}
                <Box 
                  sx={{ 
                    flex: '0 0 300px',
                    animation: `${slideDirection === 'left' ? 'slideLeft' : 'slideRight'} 0.3s ease-in-out`,
                    '@keyframes slideLeft': {
                      '0%': { transform: 'translateX(0)' },
                      '100%': { transform: 'translateX(-100%)' }
                    },
                    '@keyframes slideRight': {
                      '0%': { transform: 'translateX(-100%)' },
                      '100%': { transform: 'translateX(0)' }
                    }
                  }}
                >
                  {loadingImages ? (
                    <Skeleton variant="rectangular" width="100%" height={300} />
                  ) : (
                    <img
                      src={imageCache.get(`/images/questions/Matris/Soru-${previewQuiz.questions[currentQuestionIndex].number}.webp`) || ''}
                      alt={`Soru ${previewQuiz.questions[currentQuestionIndex].number}`}
                      style={{ 
                        width: '100%',
                        height: 'auto',
                        marginBottom: '1rem',
                        border: '1px solid #e0e0e0',
                        borderRadius: '4px'
                      }}
                    />
                  )}
                </Box>

                {/* Sağ taraf - Seçenekler */}
                <Box 
                  sx={{ 
                    flex: 1,
                    animation: `${slideDirection === 'left' ? 'slideLeft' : 'slideRight'} 0.3s ease-in-out`,
                    '@keyframes slideLeft': {
                      '0%': { transform: 'translateX(0)' },
                      '100%': { transform: 'translateX(-100%)' }
                    },
                    '@keyframes slideRight': {
                      '0%': { transform: 'translateX(-100%)' },
                      '100%': { transform: 'translateX(0)' }
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6">
                      Seçenekler
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => setShowCorrectAnswer(prev => !prev)}
                      startIcon={showCorrectAnswer ? <VisibilityOffIcon /> : <ViewIcon />}
                    >
                      {showCorrectAnswer ? 'Cevabı Gizle' : 'Cevabı Göster'}
                    </Button>
                  </Box>
                  <Grid container spacing={1}>
                    {['A', 'B', 'C', 'D', 'E'].map((option) => {
                      const isCorrect = option === previewQuiz.questions[currentQuestionIndex].correct_option;
                      const imagePath = getOptionImagePath(
                        previewQuiz.questions[currentQuestionIndex].number,
                        option,
                        isCorrect
                      );
                      
                      return (
                        <Grid item xs={12} key={option}>
                          <Card 
                            sx={{ 
                              p: 1,
                              border: (showCorrectAnswer && isCorrect)
                                ? '2px solid #4caf50' 
                                : '1px solid #e0e0e0',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,
                              height: '80px'
                            }}
                          >
                            <Typography 
                              variant="h6" 
                              color={(showCorrectAnswer && isCorrect) ? 'success' : 'inherit'}
                              sx={{ minWidth: '30px' }}
                            >
                              {option}
                            </Typography>
                            {loadingImages ? (
                              <Skeleton variant="rectangular" width={200} height={70} />
                            ) : (
                              <CardMedia
                                component="img"
                                image={imageCache.get(imagePath) || ''}
                                alt={`Seçenek ${option}`}
                                sx={{ 
                                  height: '70px', 
                                  width: '200px',
                                  objectFit: 'contain'
                                }}
                              />
                            )}
                            {showCorrectAnswer && isCorrect && (
                              <Typography 
                                variant="subtitle2" 
                                color="success"
                                sx={{ ml: 'auto' }}
                              >
                                Doğru Cevap
                              </Typography>
                            )}
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={handlePrevQuestion}
                disabled={currentQuestionIndex === 0 || loadingImages}
                startIcon={<NavigateBeforeIcon />}
                sx={{ 
                  transition: 'all 0.3s ease-in-out',
                  '&:not(:disabled):hover': {
                    transform: 'translateX(-5px)'
                  }
                }}
              >
                Önceki Soru
              </Button>
              <Button
                onClick={handleNextQuestion}
                disabled={!previewQuiz || currentQuestionIndex === previewQuiz.questions.length - 1 || loadingImages}
                endIcon={<NavigateNextIcon />}
                sx={{ 
                  transition: 'all 0.3s ease-in-out',
                  '&:not(:disabled):hover': {
                    transform: 'translateX(5px)'
                  }
                }}
              >
                Sonraki Soru
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default QuizManagement;
