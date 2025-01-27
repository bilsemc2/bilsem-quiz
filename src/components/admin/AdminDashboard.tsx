import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
} from '@mui/material';
import {
  People as PeopleIcon,
  School as SchoolIcon,
  QuestionAnswer as QuizIcon,
  TrendingUp as TrendingUpIcon,
  Person as PersonIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { supabase } from '../../lib/supabase';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalClasses: number;
  totalQuizzes: number;
  recentUsers: any[];
  recentQuizzes: any[];
}

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalClasses: 0,
    totalQuizzes: 0,
    recentUsers: [],
    recentQuizzes: [],
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);

      // Kullanıcı istatistikleri
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('*');

      if (usersError) throw usersError;

      // Aktif kullanıcılar
      const activeUsers = users?.filter(user => user.is_active).length || 0;

      // Son kayıt olan kullanıcılar
      const recentUsers = users
        ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5) || [];

      // Sınıf sayısı
      const { count: classCount, error: classError } = await supabase
        .from('classes')
        .select('*', { count: 'exact' });

      if (classError) throw classError;

      // Quiz istatistikleri
      const { data: quizzes, error: quizError } = await supabase
        .from('assignments')
        .select('*')
        .order('created_at', { ascending: false });

      if (quizError) throw quizError;

      setStats({
        totalUsers: users?.length || 0,
        activeUsers,
        totalClasses: classCount || 0,
        totalQuizzes: quizzes?.length || 0,
        recentUsers,
        recentQuizzes: quizzes?.slice(0, 5) || [],
      });

      setError(null);
    } catch (err) {
      console.error('Dashboard istatistikleri alınırken hata:', err);
      setError('İstatistikler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
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

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Dashboard
      </Typography>

      {/* İstatistik Kartları */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: 'primary.light',
              color: 'white',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PeopleIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Toplam Kullanıcı</Typography>
            </Box>
            <Typography variant="h3" component="div">
              {stats.totalUsers}
            </Typography>
            <Typography variant="body2" sx={{ mt: 'auto' }}>
              {stats.activeUsers} aktif kullanıcı
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: 'secondary.light',
              color: 'white',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <SchoolIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Toplam Sınıf</Typography>
            </Box>
            <Typography variant="h3" component="div">
              {stats.totalClasses}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: 'success.light',
              color: 'white',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <QuizIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Toplam Quiz</Typography>
            </Box>
            <Typography variant="h3" component="div">
              {stats.totalQuizzes}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: 'warning.light',
              color: 'white',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TrendingUpIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Aktif Oran</Typography>
            </Box>
            <Typography variant="h3" component="div">
              {stats.totalUsers ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Son Aktiviteler */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Son Kayıt Olan Kullanıcılar
            </Typography>
            <List>
              {stats.recentUsers.map((user, index) => (
                <React.Fragment key={user.id}>
                  <ListItem>
                    <PersonIcon sx={{ mr: 2 }} />
                    <ListItemText
                      primary={user.name || user.email}
                      secondary={new Date(user.created_at).toLocaleDateString('tr-TR')}
                    />
                    <ListItemSecondaryAction>
                      {user.is_active && (
                        <IconButton edge="end" color="success">
                          <CheckIcon />
                        </IconButton>
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < stats.recentUsers.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Son Eklenen Quizler
            </Typography>
            <List>
              {stats.recentQuizzes.map((quiz, index) => (
                <React.Fragment key={quiz.id}>
                  <ListItem>
                    <QuizIcon sx={{ mr: 2 }} />
                    <ListItemText
                      primary={quiz.title}
                      secondary={`${quiz.grade}. Sınıf - ${quiz.subject}`}
                    />
                    <ListItemSecondaryAction>
                      {quiz.is_active && (
                        <IconButton edge="end" color="success">
                          <CheckIcon />
                        </IconButton>
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < stats.recentQuizzes.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
