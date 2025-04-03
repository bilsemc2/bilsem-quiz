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
import { ITEMS_PER_PAGE } from '../../config/constants';
import { supabase } from '../../lib/supabase';

export interface Question {
  id: string;
  text: string;
  question_number: number;
  options: any; // Supabase'den jsonb olarak geliyor
  correct_option_id: string;
  image_url?: string;
  solution_video?: any;
  is_active: boolean;
  created_at?: string;
  created_by?: string;
}

interface QuestionSelectorProps {
  onQuestionsSelected: (questions: Question[]) => void;
  initialSelectedQuestions?: Question[];
  saveMode?: 'auto' | 'manual'; // Yeni prop: kaydetme modu
  onSelectionChange?: (questions: Question[]) => void; // Yeni prop: seçim değişikliği için callback
}

const QuestionSelector: React.FC<QuestionSelectorProps> = ({
  onQuestionsSelected,
  initialSelectedQuestions = [],
  saveMode = 'manual', // Varsayılan olarak manual
  onSelectionChange,
}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
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
  const savedRef = useRef(false); // Kaydedilip edilmediğini takip eden ref

  // Sayfa değişiminde kaydetme işleminin gerçekleşmemesi için
  const hasInitializedRef = useRef(false);

  // Soru görüntüsü için URL oluşturan fonksiyon
  const getQuestionImageUrl = useCallback((question: Question) => {
    // Eğer soru için özel bir image_url varsa onu kullan
    if (question.image_url) {
      return question.image_url;
    }
    
    // Yoksa varsayılan bir görsel döndür
    return `/images/question-placeholder.png`;
  }, []);

  // Sayfa için soruları yükleyen fonksiyon
  const loadQuestionsForPage = useCallback(async (pageNum: number) => {
    setLoading(true);
    setError(null);
    setLoadingProgress(0);

    try {
      // Sayfa başına soru sayısı hesaplama
      const from = (pageNum - 1) * questionsPerPage;
      const to = from + questionsPerPage - 1;
      
      // Supabase'den soruları çekme
      const { data, error, count } = await supabase
        .from('questions')
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .order('question_number', { ascending: true })
        .range(from, to);
      
      if (error) {
        throw error;
      }
      
      // Toplam soru sayısını güncelle
      if (count !== null) {
        setTotalQuestions(count);
      }
      
      // Soruları ayarla
      setQuestions(data || []);
      setLoadingProgress(100);
    } catch (error: any) {
      setError(`Sorular yüklenirken bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`);
      console.error('Error loading questions:', error);
    } finally {
      setLoading(false);
    }
  }, [questionsPerPage]);

  // Toplam soru sayısını hesaplayan fonksiyon - artık loadQuestionsForPage içinde yapılıyor
  const calculateTotalQuestions = useCallback(async () => {
    try {
      const { count, error } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
      
      if (error) {
        throw error;
      }
      
      if (count !== null) {
        setTotalQuestions(count);
      }
    } catch (error) {
      console.error('Toplam soru sayısı hesaplanırken hata:', error);
    }
  }, []);

  // useEffect hook'ları
  useEffect(() => {
    calculateTotalQuestions();
  }, [calculateTotalQuestions]);

  useEffect(() => {
    loadQuestionsForPage(page);
  }, [page, loadQuestionsForPage]);

  // Component mount olduğunda
  useEffect(() => {
    hasInitializedRef.current = true;
    return () => {
      // Component unmount olduğunda, eğer saveMode 'manual' ise ve kaydetme işlemi yapılmadıysa
      // seçili soruları kaydetmez
      if (saveMode === 'manual' && !savedRef.current) {
        console.log("Component unmounting without saving selected questions");
      }
    };
  }, [saveMode]);

  // Soru seçimi
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
  );

  // Seçim değişikliğini bildiren fonksiyon - ancak sadece seçimi günceller, kaydetmez
  useEffect(() => {
    if (hasInitializedRef.current && onSelectionChange) {
      onSelectionChange(selectedQuestions);
    }
  }, [selectedQuestions, onSelectionChange]);

  // Manuel kaydetme işlemi için fonksiyon
  const saveSelectedQuestions = useCallback(() => {
    onQuestionsSelected(selectedQuestions);
    savedRef.current = true; // Kaydedildiğini işaretler
  }, [selectedQuestions, onQuestionsSelected]);

  // Soru önizlemesi
  const handlePreview = useCallback(
    (question: Question) => {
      setPreviewQuestion(question);
      setShowPreview(true);
    },
    []
  );

  // Filtrelenmiş sorular
  const filteredQuestions = useMemo(() => {
    if (!searchTerm) return questions;
    
    return questions.filter((question) =>
      question.text && question.text.toLowerCase().includes(searchTerm.toLowerCase())
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
                    image={getQuestionImageUrl(question)}
                    alt={`Soru ${question.question_number}`}
                    sx={{ height: 200, objectFit: 'contain' }}
                  />
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      Soru {question.question_number}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Doğru Cevap: {question.correct_option_id}
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
          
          {/* Manuel kaydetme modu etkinse, kaydetme butonu göster */}
          {saveMode === 'manual' && (
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
              <Button 
                variant="contained" 
                color="primary"
                onClick={saveSelectedQuestions}
                disabled={selectedQuestions.length === 0}
              >
                Soruları Kaydet ({selectedQuestions.length})
              </Button>
            </Box>
          )}
        </>
      )}

      <Dialog open={showPreview} onClose={() => setShowPreview(false)} maxWidth="md" fullWidth>
        {previewQuestion && (
          <DialogContent>
            <Box sx={{ textAlign: 'center' }}>
              <img
                src={getQuestionImageUrl(previewQuestion)}
                alt={`Soru ${previewQuestion.question_number}`}
                style={{ maxWidth: '100%', height: 'auto' }}
              />
              <Typography variant="h6" sx={{ mt: 2 }}>
                Soru {previewQuestion.question_number}
              </Typography>
              {previewQuestion.text && (
                <Typography variant="body1" sx={{ mt: 1, maxHeight: '150px', overflow: 'auto' }}>
                  {previewQuestion.text}
                </Typography>
              )}
              <Typography color="text.secondary">
                Doğru Cevap: {previewQuestion.correct_option_id}
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