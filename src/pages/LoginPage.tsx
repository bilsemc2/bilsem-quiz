import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Link,
} from '@mui/material';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Giriş sonucu:', { data, error });

      if (error) {
        console.error('Giriş hatası:', error);
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Email veya şifre hatalı');
        }
        throw new Error('Giriş yapılamadı: ' + error.message);
      }

      // Kullanıcı bilgilerini kontrol et
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('Kullanıcı bilgileri:', user);
      
      if (userError) {
        console.error('Kullanıcı bilgileri hatası:', userError);
        throw userError;
      }

      navigate('/profile');
    } catch (error: any) {
      console.error('Yakalanan hata:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setLoading(true);
    setError(null);
    setResetSuccess(false);

    try {
      const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${siteUrl}/reset-password?type=recovery`
      });

      if (error) throw error;

      setResetSuccess(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Şifre sıfırlama isteği gönderilemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseResetDialog = () => {
    setResetDialogOpen(false);
    setResetEmail('');
    setResetSuccess(false);
    setError(null);
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Giriş Yap
          </Typography>

          <form onSubmit={handleLogin}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Şifre"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 1 }}>
              <Link
                component="button"
                variant="body2"
                onClick={() => setResetDialogOpen(true)}
                sx={{ cursor: 'pointer' }}
              >
                Şifremi Unuttum
              </Link>
            </Box>
          </form>
        </Paper>
      </Box>

      {/* Şifre Sıfırlama Dialog */}
      <Dialog open={resetDialogOpen} onClose={handleCloseResetDialog}>
        <DialogTitle>Şifre Sıfırlama</DialogTitle>
        <DialogContent>
          {resetSuccess ? (
            <Alert severity="success" sx={{ mt: 2 }}>
              Şifre sıfırlama bağlantısı email adresinize gönderildi. Lütfen email kutunuzu kontrol edin.
            </Alert>
          ) : (
            <>
              <Typography variant="body1" sx={{ mt: 2 }}>
                Email adresinizi girin. Size şifre sıfırlama bağlantısı göndereceğiz.
              </Typography>
              <TextField
                autoFocus
                margin="dense"
                id="resetEmail"
                label="Email"
                type="email"
                fullWidth
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />
              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResetDialog}>Kapat</Button>
          {!resetSuccess && (
            <Button onClick={handlePasswordReset} disabled={loading || !resetEmail}>
              {loading ? 'Gönderiliyor...' : 'Gönder'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
}
