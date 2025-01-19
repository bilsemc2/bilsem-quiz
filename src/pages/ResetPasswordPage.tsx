import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isValidReset, setIsValidReset] = useState(false);

  useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'recovery') {
      setIsValidReset(true);
    } else {
      setError('Geçersiz şifre sıfırlama bağlantısı. Lütfen tekrar şifre sıfırlama isteği gönderin.');
    }
  }, [searchParams]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Şifreleri kontrol et
      if (newPassword !== confirmPassword) {
        throw new Error('Şifreler eşleşmiyor');
      }

      if (newPassword.length < 6) {
        throw new Error('Şifre en az 6 karakter olmalıdır');
      }

      // Şifreyi güncelle
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setSuccess(true);
      
      // Session'ı temizle
      await supabase.auth.signOut();
      
      // 3 saniye sonra login sayfasına yönlendir
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Şifre güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
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
            Yeni Şifre Belirle
          </Typography>

          {success ? (
            <Alert severity="success" sx={{ mt: 2 }}>
              Şifreniz başarıyla güncellendi! Giriş sayfasına yönlendiriliyorsunuz...
            </Alert>
          ) : (
            <form onSubmit={handleResetPassword}>
              <TextField
                margin="normal"
                required
                fullWidth
                name="newPassword"
                label="Yeni Şifre"
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={!isValidReset}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Şifreyi Tekrar Girin"
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={!isValidReset}
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
                disabled={loading || !isValidReset}
              >
                {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
              </Button>

              {!isValidReset && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Bu sayfaya doğrudan erişemezsiniz. Lütfen email'inize gönderilen şifre sıfırlama bağlantısını kullanın.
                </Alert>
              )}
            </form>
          )}
        </Paper>
      </Box>
    </Container>
  );
}
