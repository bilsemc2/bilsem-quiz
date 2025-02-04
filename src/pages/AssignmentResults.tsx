import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardMedia,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  CircularProgress,
  Divider,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  PlayArrow as PlayArrowIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';

// ---------- Types ----------
interface AssignmentResult {
  id: string;
  assignment_id: string;
  student_id: string;
  answers: {
    questionNumber: number;
    isCorrect: boolean;
    selectedOption: string;
    correctOption: string;
    questionImage: string;
    isTimeout: boolean;
    options: Array<{
      id: string;
      imageUrl: string;
      isSelected: boolean;
      isCorrect: boolean;
    }>;
  }[];
  score: number;
  total_questions: number;
  completed_at: string;
  status: 'completed' | 'pending';
}

interface QuestionDetails {
  text: string | null;
  solution_video: { embed_code: string } | null;
}

// ---------- VideoModal Component ----------
interface VideoModalProps {
  embedCode: string;
  onClose: () => void;
}

function VideoModal({ embedCode, onClose }: VideoModalProps) {
  return (
    <Dialog open onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Video Çözümü
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ position: 'relative', pt: '56.25%' /* 16:9 ratio */ }}>
          <iframe
            src={`https://www.youtube.com/embed/${embedCode}`}
            title="Video Çözümü"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 0,
            }}
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
}

// ---------- AnswerCard Component ----------
interface AnswerCardProps {
  answer: AssignmentResult['answers'][0];
  index: number;
  questionDetail?: QuestionDetails;
}

function AnswerCard({ answer, index, questionDetail }: AnswerCardProps) {
  const theme = useTheme();
  const correctOptionIndex = answer.options.findIndex(opt => opt.isCorrect) + 1;

  return (
    <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
      <Grid container spacing={2}>
        {/* Sol: Soru Resmi */}
        <Grid item xs={12} sm={4} sx={{ position: 'relative' }}>
          <Box
            sx={{
              position: 'absolute',
              top: theme.spacing(1),
              left: theme.spacing(1),
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              px: 1,
              py: 0.5,
              borderRadius: '16px',
              fontSize: '0.75rem',
            }}
          >
            Soru {index + 1}
          </Box>
          <Box
            component="img"
            src={answer.questionImage}
            alt={`Soru ${answer.questionNumber}`}
            sx={{
              width: '100%',
              borderRadius: 1,
              boxShadow: 1,
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: theme.spacing(1),
              right: theme.spacing(1),
              bgcolor: 'grey.800',
              color: 'common.white',
              px: 1,
              py: 0.5,
              borderRadius: '16px',
              fontSize: '0.75rem',
            }}
          >
            #{answer.questionNumber}
          </Box>
        </Grid>

        {/* Sağ: Cevap Detayları */}
        <Grid item xs={12} sm={8}>
          <Grid container spacing={1}>
            {answer.options.map((option) => (
              <Grid item xs={6} key={option.id}>
                <Card
                  sx={{
                    border:
                      option.isSelected && option.isCorrect
                        ? '2px solid green'
                        : option.isSelected && !option.isCorrect
                        ? '2px solid red'
                        : option.isCorrect
                        ? '2px solid green'
                        : '1px solid grey',
                    borderRadius: 2,
                    p: 1,
                    textAlign: 'center',
                  }}
                >
                  <CardMedia
                    component="img"
                    image={option.imageUrl}
                    alt={`Seçenek ${option.id}`}
                    sx={{ height: 120, objectFit: 'contain', mb: 1 }}
                  />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{option.id}</Typography>
                  {option.isSelected && (
                    <Box sx={{ mt: 0.5 }}>
                      {option.isCorrect ? (
                        <CheckCircleIcon color="success" fontSize="small" />
                      ) : (
                        <CancelIcon color="error" fontSize="small" />
                      )}
                    </Box>
                  )}
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: answer.isCorrect ? 'success.light' : 'error.light' }}>
            <Typography variant="body1" sx={{ color: answer.isCorrect ? 'success.dark' : 'error.dark' }}>
              {answer.isTimeout
                ? `Süre doldu! Doğru cevap: ${correctOptionIndex}. seçenek`
                : answer.isCorrect
                ? 'Doğru cevap!'
                : `Yanlış cevap. Doğru cevap: ${correctOptionIndex}. seçenek`}
            </Typography>
          </Box>

          {questionDetail?.text && (
            <Box sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: 'info.light' }}>
              <Typography variant="body2" sx={{ color: 'info.dark' }}>
                {questionDetail.text}
              </Typography>
            </Box>
          )}

          {questionDetail?.solution_video && (
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<PlayArrowIcon />}
                onClick={() =>
                  // Video embed code'yu ana bileşene iletir (VideoModal için)
                  // Bu buton, dışarıdan selectedVideo state'ini güncellemek için kullanılabilir.
                  window.dispatchEvent(new CustomEvent('openVideo', { detail: questionDetail.solution_video?.embed_code || '' }))
                }
              >
                Video Çözümünü İzle
              </Button>
            </Box>
          )}
        </Grid>
      </Grid>
    </Paper>
  );
}

// ---------- SummarySection Component ----------
interface SummarySectionProps {
  totalQuestions: number;
  correctCount: number;
  score: number;
  completedAt: string;
  status: string;
}

function SummarySection({ totalQuestions, correctCount, score, completedAt, status }: SummarySectionProps) {
  const percentage = Math.round((score / totalQuestions) * 100);
  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Typography variant="h6">Genel Bilgiler</Typography>
          <Divider sx={{ my: 1 }} />
          <Typography>Total Soru: {totalQuestions}</Typography>
          <Typography>Doğru: {correctCount}</Typography>
          <Typography>Yanlış: {totalQuestions - correctCount}</Typography>
          <Typography>Başarı: %{percentage}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="h6">Tamamlanma Bilgisi</Typography>
          <Divider sx={{ my: 1 }} />
          <Typography>Tarih: {new Date(completedAt).toLocaleString('tr-TR')}</Typography>
          <Typography>Durum: {status}</Typography>
        </Grid>
      </Grid>
    </Paper>
  );
}

// ---------- Main Component: AssignmentResults ----------
export default function AssignmentResults() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<AssignmentResult | null>(null);
  const [questionDetails, setQuestionDetails] = useState<Record<string, QuestionDetails>>({});
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  // Ortak hata işleme fonksiyonu
  const handleError = (context: string, error: any) => {
    console.error(`${context}:`, error);
    toast.error(`${context} hatası oluştu`);
  };

  // VideoModal dinlemek için global event listener (AnswerCard'daki butondan gönderiliyor)
  useEffect(() => {
    const openVideoHandler = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setSelectedVideo(customEvent.detail);
    };
    window.addEventListener('openVideo', openVideoHandler);
    return () => window.removeEventListener('openVideo', openVideoHandler);
  }, []);

  const loadAssignmentResult = async () => {
    try {
      setLoading(true);
      // Ödev sonucunu al (en son tamamlanmış olanı)
      const { data: resultData, error: resultError } = await supabase
        .from('assignment_results')
        .select('*')
        .eq('assignment_id', assignmentId)
        .eq('student_id', user?.id)
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();

      if (resultError) throw resultError;
      if (!resultData) {
        toast.error('Ödev sonucu bulunamadı!');
        navigate(-1);
        return;
      }

      // Soru resimlerinden benzersiz liste oluştur
      const questionImages = Array.from(
        new Set(resultData.answers.map((ans: { questionImage: string }) => ans.questionImage))
      );

      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('text, solution_video, image_url')
        .in('image_url', questionImages);

      if (questionsError) {
        console.error('Questions error:', questionsError);
      }
      if (questionsData) {
        const details: Record<string, QuestionDetails> = {};
        questionsData.forEach((q: { text: string | null; solution_video: { embed_code: string } | null; image_url: string }) => {
          details[q.image_url] = { text: q.text, solution_video: q.solution_video };
        });
        setQuestionDetails(details);
      }
      setResult(resultData);
    } catch (error) {
      handleError('Ödev sonucu yüklenirken', error);
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && assignmentId) {
      loadAssignmentResult();
    }
  }, [user, assignmentId]);

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!result) return null;

  const correctCount = result.answers.filter(a => a.isCorrect).length;

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Ödev Sonuçları
      </Typography>

      <SummarySection
        totalQuestions={result.total_questions}
        correctCount={correctCount}
        score={result.score}
        completedAt={result.completed_at}
        status={result.status}
      />

      <Box>
        {result.answers.map((answer, index) => (
          <AnswerCard
            key={index}
            answer={answer}
            index={index}
            questionDetail={questionDetails[answer.questionImage]}
          />
        ))}
      </Box>

      {selectedVideo && (
        <VideoModal embedCode={selectedVideo} onClose={() => setSelectedVideo(null)} />
      )}
    </Container>
  );
}