import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Assignment as AssignmentIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import QuestionSelector from './QuestionSelector';

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
                    onClick={() => {/* Quiz görüntüleme işlemi */}}
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
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedQuiz ? 'Quiz Düzenle' : 'Yeni Quiz Oluştur'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Quiz Başlığı"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Açıklama"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              sx={{ mb: 2 }}
            />
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Sınıf"
                  type="number"
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Ders"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />
              </Grid>
            </Grid>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Sınıf Seçimi
              </Typography>
              <Select
                fullWidth
                multiple
                value={formData.classIds}
                onChange={(e) => setFormData({ ...formData, classIds: e.target.value as string[] })}
              >
                {classes.map((classItem) => (
                  <MuiMenuItem key={classItem.id} value={classItem.id}>
                    {classItem.name}
                  </MuiMenuItem>
                ))}
              </Select>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Durum
              </Typography>
              <Select
                fullWidth
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'pending' | 'completed' })}
              >
                <MuiMenuItem value="pending">Beklemede</MuiMenuItem>
                <MuiMenuItem value="completed">Tamamlandı</MuiMenuItem>
              </Select>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Seçili Sorular ({formData.questions.length})
              </Typography>
              {formData.questions.length === 0 ? (
                <Alert severity="info">
                  Henüz soru seçilmedi. Soru seçmek için "Sorular" sekmesine geçin.
                </Alert>
              ) : (
                <Alert severity="success">
                  {formData.questions.length} soru seçildi
                </Alert>
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
    </Box>
  );
};

export default QuizManagement;
