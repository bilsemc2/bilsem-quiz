import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
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
import {
  loadSystemStatsSummary,
  type SystemQuizStats,
  type SystemUserStats
} from '@/features/admin/model/systemStatsUseCases';

export const StatsManagement: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizStats, setQuizStats] = useState<SystemQuizStats | null>(null);
  const [userStats, setUserStats] = useState<SystemUserStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const stats = await loadSystemStatsSummary();
        setQuizStats(stats.quizStats);
        setUserStats(stats.userStats);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'İstatistikler yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

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
                  Toplam Kullanıcı: {userStats?.totalUsers}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ortalama Puan: {userStats?.averagePoints.toFixed(2)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Toplam Deneyim Puanı: {userStats?.totalExperience}
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
