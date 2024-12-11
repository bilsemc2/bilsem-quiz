import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Box, Typography, Paper, Button, Grid, CircularProgress } from '@mui/material';

interface Quiz {
  id: string;
  title: string;
  description: string;
  grade: number;
  subject: string;
  questions: any[];
  is_active: boolean;
  created_at: string;
}

export default function HomeworkPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [userGrade, setUserGrade] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('grade, is_admin, email')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setUserGrade(data.grade);
        setIsAdmin(data.is_admin && data.email === 'yaprakyesili@msn.com');
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    };

    const loadQuizzes = async () => {
      try {
        const { data, error } = await supabase
          .from('quizzes')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Filter quizzes based on grade only for non-admin users
        const validQuizzes = (data || []).filter(quiz => 
          (isAdmin || quiz.grade === userGrade) && 
          quiz.title && 
          quiz.description && 
          Array.isArray(quiz.questions)
        );
        
        setQuizzes(validQuizzes);
      } catch (error) {
        console.error('Error loading quizzes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
    if (user) {
      loadQuizzes();
    }
  }, [user, userGrade, isAdmin]);

  const startQuiz = (quiz: Quiz) => {
    // Store the selected quiz in localStorage
    localStorage.setItem('currentQuiz', JSON.stringify(quiz));
    navigate('/quiz');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        Ödevlerim
      </Typography>
      
      {quizzes.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography>
            Şu anda sınıfınız için aktif ödev bulunmamaktadır.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {quizzes.map((quiz) => (
            <Grid item xs={12} sm={6} md={4} key={quiz.id}>
              <Paper 
                sx={{ 
                  p: 2, 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {quiz.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {quiz.description}
                  </Typography>
                  <Typography variant="caption" display="block">
                    Ders: {quiz.subject}
                  </Typography>
                  <Typography variant="caption" display="block">
                    Soru Sayısı: {quiz.questions.length}
                  </Typography>
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => startQuiz(quiz)}
                  >
                    Ödevi Başlat
                  </Button>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
