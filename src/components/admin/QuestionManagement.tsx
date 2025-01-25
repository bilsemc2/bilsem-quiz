import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Grid,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import DeleteIcon from '@mui/icons-material/Delete';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/Info';

interface Question {
  id: string;
  question_image_url: string;
  solution_video: { embed_code: string } | null;
  created_at: string;
  text: string | null;
}

export const QuestionManagement = () => {
  const { user } = useAuth();
  const [questionNumber, setQuestionNumber] = useState('');
  const [solutionVideo, setSolutionVideo] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
      setMessage({ type: 'error', text: 'Sorular yüklenirken bir hata oluştu.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Soru başarıyla silindi!' });
      fetchQuestions(); // Listeyi yenile
    } catch (error) {
      console.error('Error deleting question:', error);
      setMessage({ type: 'error', text: 'Soru silinirken bir hata oluştu.' });
    }
  };

  const getQuestionNumber = (url: string) => {
    const match = url.match(/Soru-(\d+)\.webp/);
    return match ? match[1] : 'N/A';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!questionNumber) {
        setMessage({ type: 'error', text: 'Lütfen soru numarası giriniz.' });
        return;
      }

      // Video ID'sini al
      const videoId = solutionVideo || '';

      const questionData = {
        question_image_url: `images/questions/Matris/Soru-${questionNumber}.webp`,
        options: generateOptions(questionNumber),
        correct_option_id: 'A', // Varsayılan olarak A seçeneği
        solution_video: videoId ? { embed_code: videoId } : null,
        text: questionText || null,
        created_by: user?.id
      };

      const { error } = await supabase
        .from('questions')
        .insert([questionData]);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Soru başarıyla eklendi!' });
      setQuestionNumber('');
      setSolutionVideo('');
      setQuestionText('');
      fetchQuestions(); // Yeni soruyu listeye ekle
    } catch (error) {
      console.error('Error:', error);
      setMessage({ type: 'error', text: 'Bir hata oluştu. Lütfen tekrar deneyin.' });
    }
  };

  const generateOptions = (questionNumber: string) => {
    return ['A', 'B', 'C', 'D', 'E'].map(letter => ({
      id: letter,
      text: '',
      imageUrl: `/images/options/Matris/Soru-${questionNumber}${letter}.webp`
    }));
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        Soru Yönetimi
      </Typography>
      
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, mb: 6 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Soru Numarası"
              value={questionNumber}
              onChange={(e) => setQuestionNumber(e.target.value)}
              type="number"
              required
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Video ID"
              value={solutionVideo}
              onChange={(e) => setSolutionVideo(e.target.value)}
              multiline
              rows={2}
              helperText="YouTube video ID'sini girin. Örnek: Bir video linki https://www.youtube.com/watch?v=ABC123 ise, sadece ABC123 kısmını girin."
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Açıklama"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              multiline
              rows={3}
              helperText="Soru için açıklama ekleyin (isteğe bağlı)"
            />
          </Grid>

          {message && (
            <Grid item xs={12}>
              <Alert severity={message.type}>
                {message.text}
              </Alert>
            </Grid>
          )}

          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
            >
              Kaydet
            </Button>
          </Grid>
        </Grid>
      </Box>

      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        Mevcut Sorular
      </Typography>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Soru No</TableCell>
              <TableCell>Soru</TableCell>
              <TableCell>Video Çözüm</TableCell>
              <TableCell>Açıklama</TableCell>
              <TableCell>Eklenme Tarihi</TableCell>
              <TableCell>İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {questions.map((question) => (
              <TableRow key={question.id}>
                <TableCell>{getQuestionNumber(question.question_image_url)}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <img 
                      src={question.question_image_url} 
                      alt={`Soru ${getQuestionNumber(question.question_image_url)}`}
                      style={{ 
                        width: '100px', 
                        height: '100px', 
                        objectFit: 'contain',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        padding: '4px'
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {question.question_image_url.split('/').pop()}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  {question.solution_video ? (
                    <Tooltip title="Video çözümü göster">
                      <IconButton
                        color="success"
                        onClick={() => setSelectedVideo(question.solution_video?.embed_code || null)}
                      >
                        <VideoLibraryIcon />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Tooltip title="Video çözüm yok">
                      <VideoLibraryIcon color="disabled" />
                    </Tooltip>
                  )}
                </TableCell>
                <TableCell>
                  {question.text ? (
                    <Tooltip title={question.text}>
                      <IconButton size="small">
                        <InfoIcon color="info" />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Tooltip title="Açıklama yok">
                      <InfoIcon color="disabled" />
                    </Tooltip>
                  )}
                </TableCell>
                <TableCell>
                  {new Date(question.created_at).toLocaleString('tr-TR')}
                </TableCell>
                <TableCell>
                  <Tooltip title="Sil">
                    <IconButton 
                      onClick={() => handleDelete(question.id)}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {questions.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  {loading ? 'Yükleniyor...' : 'Henüz soru eklenmemiş.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog 
        open={!!selectedVideo} 
        onClose={() => setSelectedVideo(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            Video Çözüm
            <IconButton onClick={() => setSelectedVideo(null)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedVideo && (
            <Box sx={{ 
              width: '100%',
              height: '600px',
              '& iframe': {
                width: '100%',
                height: '100%',
                border: 'none'
              }
            }}>
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${selectedVideo}`}
                title="Video Çözüm"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Paper>
  );
};

export default QuestionManagement;
