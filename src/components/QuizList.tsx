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
  TablePagination
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { supabase } from '../lib/supabase';

interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: Array<{
    number: number;
    correctAnswer: string;
  }>;
  is_active: boolean;
  created_at: string;
  created_by: string;
}

export const QuizList: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setQuizzes(data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Quizler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
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
        .from('quizzes')
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Quiz güncellenirken bir hata oluştu');
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!window.confirm('Bu quizi silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId);

      if (error) throw error;

      setQuizzes(quizzes.filter(quiz => quiz.id !== quizId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Quiz silinirken bir hata oluştu');
    }
  };

  const handleToggleActive = async (quizId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('quizzes')
        .update({ is_active: !currentStatus })
        .eq('id', quizId);

      if (error) throw error;

      setQuizzes(quizzes.map(quiz =>
        quiz.id === quizId ? { ...quiz, is_active: !currentStatus } : quiz
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Quiz durumu güncellenirken bir hata oluştu');
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
        Quiz Listesi
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
        <DialogTitle>Quiz Düzenle</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Quiz Başlığı"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
            <TextField
              fullWidth
              label="Quiz Açıklaması"
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
    </Box>
  );
};
