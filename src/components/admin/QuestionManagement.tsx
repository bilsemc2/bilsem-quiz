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
  TablePagination,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  CircularProgress,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/Info';
import EditIcon from '@mui/icons-material/Edit';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

type MessageType = {
  type: 'success' | 'error' | 'warning' | 'info';
  text: string;
};

type OptionLetter = 'A' | 'B' | 'C' | 'D' | 'E';

interface Option {
  id: OptionLetter;
  text: string;
  imageUrl: string;
}

interface SolutionVideo {
  embed_code: string;
}

interface Question {
  id: string;
  text: string | null;
  image_url: string | null;
  options: Option[];
  correct_option_id: OptionLetter;
  created_at: string;
  created_by: string | null;
  solution_video: SolutionVideo | null;
}

const QuestionManagement: React.FC = () => {
  // Form için state'ler
  const { user } = useAuth();
  const [questionNumber, setQuestionNumber] = useState('');
  const [solutionVideo, setSolutionVideo] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [message, setMessage] = useState<MessageType | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  // Güncelleme için state'ler
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editQuestionNumber, setEditQuestionNumber] = useState('');
  const [editVideoId, setEditVideoId] = useState('');
  const [editText, setEditText] = useState('');

  // Sayfalama ve filtreleme için state'ler
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Sayfalama işlemleri
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  const [filterNumber, setFilterNumber] = useState('');
  const [filterText, setFilterText] = useState('');

  useEffect(() => {
    fetchQuestions();
  }, []);

  // Supabase'den soruları çek
  const fetchQuestions = async () => {
    setMessage(null); // Önceki mesajları temizle
    try {
      setLoading(true);
      console.log('Sorular çekiliyor...');

      let allQuestions: any[] = [];
      let start = 0;
      const pageSize = 1000; // Supabase'in maksimum limit değeri
      
      while (true) {
        const { data, error } = await supabase
          .from('questions')
          .select('*')
          .range(start, start + pageSize - 1);

        if (error) throw error;
        if (!data || data.length === 0) break;

        allQuestions = [...allQuestions, ...data];
        console.log(`${start}-${start + data.length} arası sorular yüklendi`);

        if (data.length < pageSize) break;
        start += pageSize;
      }

      console.log('Toplam soru sayısı:', allQuestions.length);
      
      // Soru numaralarına göre sırala (büyükten küçüğe)
      allQuestions.sort((a, b) => {
        const numA = getNumericQuestionNumber(a.image_url);
        const numB = getNumericQuestionNumber(b.image_url);
        return numB - numA; // Büyükten küçüğe sıralama için b-a kullanıyoruz
      });

      setQuestions(allQuestions);
    } catch (error) {
      console.error('Error fetching questions:', error);
      setMessage({ 
        type: 'error', 
        text: `Sorular yüklenirken bir hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}` 
      });
    } finally {
      setLoading(false);
    }
  };

  // Soru numarasına göre option nesnelerini oluştur
  const generateOptions = (qNumber: string): Option[] => {
    return ['A', 'B', 'C', 'D', 'E'].map((letter): Option => {
      const optionLetter = letter as OptionLetter; // Bu harfler zaten OptionLetter tipine uygun
      // Soru numarasını 5 haneli olacak şekilde dolduruyoruz
      const padded = qNumber.padStart(5, '0');
      return {
        id: optionLetter,
        text: '',
        imageUrl: `/images/options/Matris/Soru-${padded}${letter}.webp`,
      };
    });
  };

  // image_url içinden soru numarasını çıkartır
  const getQuestionNumber = (url: string | null): string => {
    if (!url) return 'N/A';
    const match = url.match(/Soru-(\d+)\.webp/);
    if (!match) return 'N/A';
    // Sayıyı 4 basamaklı yap (sıralama için)
    return match[1].padStart(4, '0');
  };

  // Soru numarasını sayısal değere çevir
  const getNumericQuestionNumber = (url: string | null): number => {
    const strNum = getQuestionNumber(url);
    return strNum === 'N/A' ? -1 : parseInt(strNum, 10);
  };

  // Yeni soru oluşturma işlemi
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionNumber) {
      setMessage({ type: 'error', text: 'Lütfen soru numarası giriniz.' });
      return;
    }

    const newQuestion = {
      image_url: `/images/questions/Matris/Soru-${questionNumber}.webp`,
      options: generateOptions(questionNumber),
      correct_option_id: 'A', // Varsayılan doğru seçenek
      solution_video: solutionVideo ? { embed_code: solutionVideo } : null,
      text: questionText ? questionText : null,
      created_by: user?.id,
    };

    try {
      const { error } = await supabase.from('questions').insert([newQuestion]);
      if (error) {
        throw error;
      }
      setMessage({ type: 'success', text: 'Soru başarıyla eklendi!' });
      // Formu sıfırla
      setQuestionNumber('');
      setSolutionVideo('');
      setQuestionText('');
      fetchQuestions();
    } catch (error) {
      console.error('Error creating question:', error);
      setMessage({ 
        type: 'error', 
        text: `Soru eklenirken bir hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}` 
      });
    }
  };

  // Soru silme işlemi
  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('questions').delete().eq('id', id);
      if (error) throw error;
      setMessage({ type: 'success', text: 'Soru başarıyla silindi!' });
      fetchQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      setMessage({ 
        type: 'error', 
        text: `Soru silinirken bir hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}` 
      });
    }
  };

  // Güncelleme için düzenleme dialog'unu açar
  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    const qNum = getQuestionNumber(question.image_url);
    setEditQuestionNumber(qNum);
    setEditVideoId(question.solution_video?.embed_code || '');
    setEditText(question.text || '');
    setEditDialogOpen(true);
  };

  // Soru güncelleme işlemi
  const handleUpdate = async () => {
    if (!editingQuestion || !editingQuestion.id) {
      setMessage({ type: 'error', text: 'Düzenlenecek soru seçilmedi.' });
      return;
    }

    // Mevcut soru numarasını al
    const currentNumber = getQuestionNumber(editingQuestion.image_url);
    let updateData: Partial<Question> = {
      text: editText ? editText : null,
      solution_video: editVideoId ? { embed_code: editVideoId } : null,
    };

    // Eğer soru numarası değiştiyse, image_url ve options alanlarını da güncelle
    if (editQuestionNumber !== currentNumber) {
      updateData.image_url = `/images/questions/Matris/Soru-${editQuestionNumber}.webp`;
      updateData.options = generateOptions(editQuestionNumber);
    }

    try {
      const { error } = await supabase
        .from('questions')
        .update(updateData)
        .eq('id', editingQuestion.id);
      if (error) {
        throw error;
      }
      setMessage({ type: 'success', text: 'Soru başarıyla güncellendi!' });
      setEditDialogOpen(false);
      fetchQuestions();
    } catch (error) {
      console.error('Error updating question:', error);
      setMessage({ 
        type: 'error', 
        text: `Soru güncellenirken bir hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}` 
      });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Typography variant="h6" sx={{ mr: 2 }}>Yükleniyor</Typography>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        Soru Yönetimi
      </Typography>

      {/* Soru Oluşturma Formu */}
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, mb: 6 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Soru Numarası"
              type="number"
              value={questionNumber}
              onChange={(e) => setQuestionNumber(e.target.value)}
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
              helperText="Örnek: https://www.youtube.com/watch?v=ABC123 linkinde sadece ABC123 kısmını girin."
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
              helperText="İsteğe bağlı soru açıklaması ekleyin."
            />
          </Grid>
          {message && (
            <Grid item xs={12}>
              <Alert severity={message.type}>{message.text}</Alert>
            </Grid>
          )}
          <Grid item xs={12}>
            <Button type="submit" variant="contained" color="primary" fullWidth>
              Kaydet
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Mevcut Sorular Tablosu */}
      <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Mevcut Sorular
      </Typography>

      {/* Filtreleme */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
        <TextField
          label="Soru Numarası ile Filtrele"
          value={filterNumber}
          onChange={(e) => {
            setFilterNumber(e.target.value);
            setPage(0); // Filtreleme yapıldığında ilk sayfaya dön
          }}
          size="small"
        />
        <TextField
          label="Açıklama ile Filtrele"
          value={filterText}
          onChange={(e) => {
            setFilterText(e.target.value);
            setPage(0); // Filtreleme yapıldığında ilk sayfaya dön
          }}
          size="small"
        />
      </Box>
      <TableContainer>
        {questions.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography color="text.secondary">
              {loading ? 'Yükleniyor...' : 'Hiç soru bulunamadı.'}
            </Typography>
          </Box>
        ) : null}
        <Table size="small">
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
            {[...questions]
              // Önce filtrele
              .filter(question => {
                // Soru numarası kontrolü
                let numberMatch = true;
                if (filterNumber) {
                  const qNum = getQuestionNumber(question.image_url);
                  if (qNum === 'N/A') {
                    numberMatch = false;
                  } else {
                    // Soru numarasının içinde arama metni geçiyor mu diye bak
                    numberMatch = qNum.includes(filterNumber);
                  }
                }

                // Metin kontrolü - hem açıklamada hem soru numarasında ara
                const searchText = filterText.toLowerCase();
                const textMatch = !searchText || 
                  (question.text?.toLowerCase() || '').includes(searchText) ||
                  getQuestionNumber(question.image_url).toLowerCase().includes(searchText);

                return numberMatch && textMatch;
              })
              // Sonra sırala (büyükten küçüğe)
              .sort((a, b) => {
                const numA = getNumericQuestionNumber(a.image_url);
                const numB = getNumericQuestionNumber(b.image_url);
                return numB - numA; // Büyükten küçüğe sıralama
              })
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((question) => (
              <TableRow key={question.id}>
                <TableCell>{getQuestionNumber(question.image_url)}</TableCell>
                <TableCell>
                  {question.image_url ? (
                    <img
                      src={question.image_url}
                      alt={`Soru ${getQuestionNumber(question.image_url)}`}
                      style={{
                        width: 100,
                        height: 100,
                        objectFit: 'contain',
                        border: '1px solid #ddd',
                        borderRadius: 4,
                        padding: 4,
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 100,
                        height: 100,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #ddd',
                        borderRadius: 4,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Resim yok
                      </Typography>
                    </Box>
                  )}
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
                <TableCell>{new Date(question.created_at).toLocaleString('tr-TR')}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Düzenle">
                      <IconButton onClick={() => handleEdit(question)} color="primary" size="small">
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Sil">
                      <IconButton onClick={() => handleDelete(question.id)} color="error" size="small">
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
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
      <TablePagination
        component="div"
        count={questions.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
        labelRowsPerPage="Sayfa başına soru"
        labelDisplayedRows={({ from, to, count }: { from: number; to: number; count: number }) => (
          `${from}-${to} / ${count}`
        )}
      />

      {/* Video Çözüm Dialog'u */}
      <Dialog open={!!selectedVideo} onClose={() => setSelectedVideo(null)} maxWidth="md" fullWidth>
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
            <Box
              sx={{
                width: '100%',
                height: 600,
                '& iframe': { width: '100%', height: '100%', border: 'none' },
              }}
            >
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo}`}
                title="Video Çözüm"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Soru Düzenleme Dialog'u */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            Soru Düzenle
            <IconButton onClick={() => setEditDialogOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box
            component="form"
            sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <TextField
              fullWidth
              label="Soru Numarası"
              type="number"
              value={editQuestionNumber}
              onChange={(e) => setEditQuestionNumber(e.target.value)}
              required
            />
            <TextField
              fullWidth
              label="Video ID"
              value={editVideoId}
              onChange={(e) => setEditVideoId(e.target.value)}
              multiline
              rows={2}
              helperText="YouTube video ID'sini girin"
            />
            <TextField
              fullWidth
              label="Açıklama"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              multiline
              rows={3}
            />
            <Button variant="contained" color="primary" onClick={handleUpdate} fullWidth>
              Güncelle
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Paper>
  );
};

export default QuestionManagement;