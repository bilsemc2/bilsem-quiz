import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Alert,
  Grid,
} from '@mui/material';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface Settings {
  allowRegistration: boolean;
  maintenanceMode: boolean;
  notificationEmail: string;
  maxClassSize: number;
  maxQuizAttempts: number;
  quizTimeLimit: number;
}

const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({
    allowRegistration: true,
    maintenanceMode: false,
    notificationEmail: '',
    maxClassSize: 30,
    maxQuizAttempts: 3,
    quizTimeLimit: 60,
  });

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('settings')
        .upsert([
          {
            id: 1,
            ...settings,
          },
        ]);

      if (error) throw error;

      toast.success('Ayarlar başarıyla kaydedildi');
    } catch (err) {
      console.error('Ayarlar kaydedilirken hata:', err);
      toast.error('Ayarlar kaydedilirken bir hata oluştu');
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Sistem Ayarları
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Genel Ayarlar
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.allowRegistration}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          allowRegistration: e.target.checked,
                        }))
                      }
                    />
                  }
                  label="Yeni Kayıtlara İzin Ver"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.maintenanceMode}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          maintenanceMode: e.target.checked,
                        }))
                      }
                    />
                  }
                  label="Bakım Modu"
                />
                <TextField
                  label="Bildirim E-postası"
                  type="email"
                  fullWidth
                  value={settings.notificationEmail}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      notificationEmail: e.target.value,
                    }))
                  }
                  helperText="Sistem bildirimleri bu e-posta adresine gönderilecek"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sınıf ve Quiz Ayarları
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Maksimum Sınıf Mevcudu"
                  type="number"
                  fullWidth
                  value={settings.maxClassSize}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      maxClassSize: parseInt(e.target.value) || 0,
                    }))
                  }
                  inputProps={{ min: 1 }}
                />
                <TextField
                  label="Maksimum Quiz Deneme Sayısı"
                  type="number"
                  fullWidth
                  value={settings.maxQuizAttempts}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      maxQuizAttempts: parseInt(e.target.value) || 0,
                    }))
                  }
                  inputProps={{ min: 1 }}
                />
                <TextField
                  label="Quiz Zaman Sınırı (dakika)"
                  type="number"
                  fullWidth
                  value={settings.quizTimeLimit}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      quizTimeLimit: parseInt(e.target.value) || 0,
                    }))
                  }
                  inputProps={{ min: 1 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
            >
              Ayarları Kaydet
            </Button>
          </Box>
        </Grid>
      </Grid>

      <Alert severity="info" sx={{ mt: 4 }}>
        Not: Bazı ayarlar değiştirildikten sonra sistemin yeniden başlatılması gerekebilir.
      </Alert>
    </Box>
  );
};

export default AdminSettings;
