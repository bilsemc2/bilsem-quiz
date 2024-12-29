import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider
} from '@mui/material';
import { supabase } from '../lib/supabase';

interface QuizStats {
  totalQuizzes: number;
  averageScore: number;
  totalQuestionsAnswered: number;
  totalCorrectAnswers: number;
  accuracyRate: number;
  quizzesByDay: { [key: string]: number };
  topScorers: {
    name: string;
    email: string;
    score: number;
    date: string;
  }[];
}

interface UserStats {
  totalQuizzes: number;
  averageScore: number;
  totalQuestionsAnswered: number;
  totalCorrectAnswers: number;
  accuracyRate: number;
  quizzesByDay: { [key: string]: number };
  recentQuizzes: Array<{
    score: number;
    questions_answered: number;
    correct_answers: number;
    completed_at: string;
  }>;
}

export const StatsManagement: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizStats, setQuizStats] = useState<QuizStats | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Quiz İstatistikleri
      const { data: quizData, error: quizError } = await supabase
        .from('quiz_results')
        .select('score, questions_answered, correct_answers, completed_at, profiles(full_name, email)');

      if (quizError) throw quizError;

      // İstatistikleri hesapla
      const stats = calculateQuizStats(quizData || []);
      setQuizStats(stats);

      // Kullanıcı İstatistikleri
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('points, experience');

      if (userError) throw userError;

      const userStatsData = calculateUserStats(userData || []);
      setUserStats(userStatsData);

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İstatistikler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const calculateQuizStats = (quizData: any[]): QuizStats => {
    const totalQuizzes = quizData.length;
    const totalQuestionsAnswered = quizData.reduce((sum, quiz) => sum + quiz.questions_answered, 0);
    const totalCorrectAnswers = quizData.reduce((sum, quiz) => sum + quiz.correct_answers, 0);
    const totalScore = quizData.reduce((sum, quiz) => sum + quiz.score, 0);

    // Günlük quiz sayıları
    const quizzesByDay = quizData.reduce((acc: { [key: string]: number }, quiz) => {
      const date = new Date(quiz.completed_at).toLocaleDateString('tr-TR');
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    // En yüksek skorlar
    const topScorers = quizData
      .map(quiz => ({
        name: quiz.profiles?.full_name || 'İsimsiz',
        email: quiz.profiles?.email || '',
        score: quiz.score,
        date: new Date(quiz.completed_at).toLocaleDateString('tr-TR')
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return {
      totalQuizzes,
      averageScore: totalQuizzes ? totalScore / totalQuizzes : 0,
      totalQuestionsAnswered,
      totalCorrectAnswers,
      accuracyRate: totalQuestionsAnswered ? (totalCorrectAnswers / totalQuestionsAnswered) * 100 : 0,
      quizzesByDay,
      topScorers
    };
  };

  const calculateUserStats = (userData: any[]): UserStats => {
    const totalPoints = userData.reduce((sum, user) => sum + (user.points || 0), 0);
    const totalExperience = userData.reduce((sum, user) => sum + (user.experience || 0), 0);
    const averagePoints = userData.length ? totalPoints / userData.length : 0;

    return {
      totalQuizzes: userData.length,
      averageScore: averagePoints,
      totalQuestionsAnswered: totalExperience,
      totalCorrectAnswers: totalPoints,
      accuracyRate: totalExperience ? (totalPoints / totalExperience) * 100 : 0,
      quizzesByDay: {},
      recentQuizzes: []
    };
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
        Sistem İstatistikleri
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Quiz İstatistikleri */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quiz İstatistikleri
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Toplam Quiz Sayısı: {quizStats?.totalQuizzes}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ortalama Skor: {quizStats?.averageScore.toFixed(2)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Doğruluk Oranı: %{quizStats?.accuracyRate.toFixed(2)}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" gutterBottom>
                En Yüksek Skorlar
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>İsim</TableCell>
                      <TableCell align="right">Skor</TableCell>
                      <TableCell align="right">Tarih</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {quizStats?.topScorers.map((scorer, index) => (
                      <TableRow key={index}>
                        <TableCell>{scorer.name}</TableCell>
                        <TableCell align="right">{scorer.score}</TableCell>
                        <TableCell align="right">{scorer.date}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Kullanıcı İstatistikleri */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Kullanıcı İstatistikleri
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Toplam Kullanıcı: {userStats?.totalQuizzes}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ortalama Puan: {userStats?.averageScore.toFixed(2)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Toplam Deneyim Puanı: {userStats?.totalQuestionsAnswered}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" gutterBottom>
                Son 7 Günlük Quiz Aktivitesi
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Tarih</TableCell>
                      <TableCell align="right">Quiz Sayısı</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(quizStats?.quizzesByDay || {})
                      .slice(-7)
                      .map(([date, count]) => (
                        <TableRow key={date}>
                          <TableCell>{date}</TableCell>
                          <TableCell align="right">{count}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
