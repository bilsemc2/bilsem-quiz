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
  Tooltip,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  TablePagination,
  Grid,
  FormGroup,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SchoolIcon from '@mui/icons-material/School';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';

interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: Array<{
    number: number;
    correctAnswer: string;
  }>;
  is_active: boolean;
  status: 'pending' | 'completed';
  created_at: string;
  created_by: string;
  assigned_classes?: string[];
}

interface Class {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

export const QuizList: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewQuestions, setPreviewQuestions] = useState<Array<{
    number: number;
    questionImage: string;
    options: Array<{
      letter: string;
      optionImage: string;
      answerImage: string;
    }>;
    correctAnswer: string;
  }>>([]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setQuizzes(data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ödevler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

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
    }
  };

  useEffect(() => {
    fetchQuizzes();
    fetchClasses();
  }, []);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleEditClick = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setEditTitle(quiz.title);
    setEditDescription(quiz.description);
    setEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!selectedQuiz) return;

    try {
      const { error } = await supabase
        .from('assignments')
        .update({
          title: editTitle,
          description: editDescription
        })
        .eq('id', selectedQuiz.id);

      if (error) throw error;

      setQuizzes(quizzes.map(quiz =>
        quiz.id === selectedQuiz.id
          ? { ...quiz, title: editTitle, description: editDescription }
          : quiz
      ));
      setEditDialogOpen(false);
      setSelectedQuiz(null);
      toast.success('Ödev başarıyla güncellendi');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ödev güncellenirken bir hata oluştu');
      toast.error('Ödev güncellenirken bir hata oluştu');
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!window.confirm('Bu ödevi silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', quizId);

      if (error) throw error;

      setQuizzes(quizzes.filter(quiz => quiz.id !== quizId));
      toast.success('Ödev başarıyla silindi');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ödev silinirken bir hata oluştu');
      toast.error('Ödev silinirken bir hata oluştu');
    }
  };

  const handleToggleActive = async (quizId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('assignments')
        .update({ is_active: !currentStatus })
        .eq('id', quizId);

      if (error) throw error;

      setQuizzes(quizzes.map(quiz =>
        quiz.id === quizId ? { ...quiz, is_active: !currentStatus } : quiz
      ));
      toast.success('Ödev durumu güncellendi');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ödev durumu güncellenirken bir hata oluştu');
      toast.error('Ödev durumu güncellenirken bir hata oluştu');
    }
  };

  const handleAssignClick = async (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    const assignedClasses = await loadQuizAssignments(quiz.id);
    setSelectedClasses(assignedClasses);
    setAssignDialogOpen(true);
  };

  const handleAssignSave = async () => {
    if (!selectedQuiz) return;

    try {
      // Kullanıcı bilgisini al
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Kullanıcı bilgisi alınamadı:', userError);
        throw userError;
      }

      // Önce eski atamaları silelim
      const { error: deleteError } = await supabase
        .from('quiz_class_assignments')
        .delete()
        .eq('quiz_id', selectedQuiz.id);

      if (deleteError) {
        console.error('Eski atamalar silinemedi:', deleteError);
        throw deleteError;
      }

      // Yeni atamaları ekleyelim
      const assignments = selectedClasses.map(classId => ({
        quiz_id: selectedQuiz.id,
        class_id: classId,
        assigned_by: user?.id || '',
        assigned_at: new Date().toISOString()
      }));

      const { error: insertError } = await supabase
        .from('quiz_class_assignments')
        .insert(assignments);

      if (insertError) {
        console.error('Yeni atamalar eklenemedi:', insertError);
        throw insertError;
      }

      // UI'ı güncelleyelim
      setQuizzes(quizzes.map(quiz =>
        quiz.id === selectedQuiz.id
          ? { ...quiz, assigned_classes: selectedClasses }
          : quiz
      ));

      setAssignDialogOpen(false);
      setSelectedQuiz(null);
      toast.success('Ödev başarıyla sınıflara atandı');
    } catch (err) {
      console.error('Ödev atama hatası:', err);
      toast.error('Ödev sınıflara atanırken bir hata oluştu');
    }
  };

  // Quiz'in atandığı sınıfları yükle
  const loadQuizAssignments = async (quizId: string) => {
    try {
      const { data, error } = await supabase
        .from('quiz_class_assignments')
        .select('class_id')
        .eq('quiz_id', quizId);

      if (error) throw error;

      return data.map(assignment => assignment.class_id);
    } catch (err) {
      console.error('Sınıf atamaları yüklenirken hata:', err);
      return [];
    }
  };

  const handlePreviewClick = async (quiz: Quiz) => {
    try {
      // Quiz'deki her soru için detaylı bilgileri hazırla
      const questions = quiz.questions.map(q => ({
        number: q.number,
        questionImage: `/images/questions/Matris/Soru-${q.number}.webp`,
        correctAnswer: q.correctAnswer,
        options: ['A', 'B', 'C', 'D', 'E'].map(letter => ({
          letter,
          optionImage: `/images/options/Matris/${q.number}/Soru-${q.number}${letter}.webp`,
          answerImage: `/images/options/Matris/${q.number}/Soru-cevap-${q.number}${letter}.webp`
        }))
      }));

      setPreviewQuestions(questions);
      setPreviewDialogOpen(true);
    } catch (error) {
      console.error('Önizleme hazırlanırken hata:', error);
      setError('Önizleme hazırlanırken bir hata oluştu');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Ödev Listesi
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Başlık</TableCell>
              <TableCell>Açıklama</TableCell>
              <TableCell align="center">Soru Sayısı</TableCell>
              <TableCell align="center">Durum</TableCell>
              <TableCell align="center">Oluşturulma Tarihi</TableCell>
              <TableCell align="center">İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {quizzes
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((quiz) => (
                <TableRow key={quiz.id}>
                  <TableCell>{quiz.title}</TableCell>
                  <TableCell>{quiz.description}</TableCell>
                  <TableCell align="center">{quiz.questions.length}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={quiz.is_active ? 'Aktif' : 'Pasif'}
                      color={quiz.is_active ? 'success' : 'default'}
                      onClick={() => handleToggleActive(quiz.id, quiz.is_active)}
                    />
                  </TableCell>
                  <TableCell align="center">
                    {new Date(quiz.created_at).toLocaleDateString('tr-TR')}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                      <Tooltip title="Sınıflara Ata">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleAssignClick(quiz)}
                        >
                          <SchoolIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Düzenle">
                        <IconButton
                          size="small"
                          onClick={() => handleEditClick(quiz)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Önizle">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handlePreviewClick(quiz)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Sil">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteQuiz(quiz.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={quizzes.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Sayfa başına satır:"
        />
      </TableContainer>

      {/* Düzenleme Dialog'u */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Ödev Düzenle</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Ödev Başlığı"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
            <TextField
              fullWidth
              label="Ödev Açıklaması"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>İptal</Button>
          <Button onClick={handleEditSave} variant="contained" color="primary">
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sınıf Atama Dialog'u */}
      <Dialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Sınıflara Ata</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {selectedQuiz && (
              <Typography variant="subtitle1" gutterBottom>
                {selectedQuiz.title}
              </Typography>
            )}
            <FormGroup>
              {classes.map((cls) => (
                <FormControlLabel
                  key={cls.id}
                  control={
                    <Checkbox
                      checked={selectedClasses.includes(cls.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedClasses([...selectedClasses, cls.id]);
                        } else {
                          setSelectedClasses(selectedClasses.filter(id => id !== cls.id));
                        }
                      }}
                    />
                  }
                  label={cls.name}
                />
              ))}
            </FormGroup>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>İptal</Button>
          <Button onClick={handleAssignSave} variant="contained" color="primary">
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>

      {/* Quiz Önizleme Dialog'u */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Ödev Önizleme
          {selectedQuiz && (
            <Typography variant="subtitle1" color="text.secondary">
              {selectedQuiz.title}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            {previewQuestions.map((question, index) => (
              <Box key={question.number} sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Soru {index + 1}: #{question.number}
                </Typography>
                
                {/* Soru Görseli */}
                <Box sx={{ mb: 2 }}>
                  <img
                    src={question.questionImage}
                    alt={`Soru ${question.number}`}
                    style={{
                      width: '100%',
                      maxHeight: '400px',
                      objectFit: 'contain'
                    }}
                    onError={() => {
                      console.error(`Error loading question image: ${question.questionImage}`);
                    }}
                  />
                </Box>

                {/* Seçenekler */}
                <Typography variant="h6" gutterBottom>
                  Seçenekler
                </Typography>
                <Grid container spacing={2}>
                  {question.options.map((option) => {
                    const isCorrect = question.correctAnswer === option.letter;
                    
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
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>
            Kapat
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
