import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Typography,
  IconButton,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { CloudUpload, Delete, ZoomIn } from '@mui/icons-material';
import { supabase } from '../lib/supabase';
import { analyzeImage } from '../api/analyze-image';

interface DetectedObject {
  name: string;
  score: number;
  boundingBox: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

interface ImageAnalysisResult {
  objects: DetectedObject[];
  text: string;
  labels: string[];
}

export const ImageAnalyzer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<ImageAnalysisResult | null>(null);
  const [showFullImage, setShowFullImage] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        setError('Dosya boyutu 4MB\'dan küçük olmalıdır');
        return;
      }

      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
      setAnalysisResult(null);
    }
  };

  const analyzeImage = async () => {
    if (!selectedFile) return;

    try {
      setLoading(true);
      setError('');

      // Dosyayı Supabase'e yükle
      const fileName = `analyze_${Date.now()}_${selectedFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('image-analysis')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Yüklenen dosyanın public URL'ini al
      const { data: { publicUrl } } = supabase.storage
        .from('image-analysis')
        .getPublicUrl(fileName);

      // Görseli analiz et
      const result = await analyzeImage(publicUrl);
      setAnalysisResult(result);

      // Analiz sonuçlarını veritabanına kaydet
      const { error: dbError } = await supabase
        .from('image_analyses')
        .insert([
          {
            image_url: publicUrl,
            analysis_result: result,
            created_by: (await supabase.auth.getUser()).data.user?.id
          }
        ]);

      if (dbError) throw dbError;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Görsel analiz edilirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const renderAnalysisResults = () => {
    if (!analysisResult) return null;

    return (
      <Box mt={3}>
        <Typography variant="h6" gutterBottom>
          Analiz Sonuçları
        </Typography>

        {/* Tespit edilen nesneler */}
        {analysisResult.objects.length > 0 && (
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Tespit Edilen Nesneler
            </Typography>
            {analysisResult.objects.map((obj, index) => (
              <Box key={index} sx={{ mb: 1 }}>
                <Typography variant="body2">
                  {obj.name} ({Math.round(obj.score * 100)}% güven)
                </Typography>
              </Box>
            ))}
          </Paper>
        )}

        {/* Tespit edilen metin */}
        {analysisResult.text && (
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Tespit Edilen Metin
            </Typography>
            <Typography variant="body2">
              {analysisResult.text}
            </Typography>
          </Paper>
        )}

        {/* Etiketler */}
        {analysisResult.labels.length > 0 && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Etiketler
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {analysisResult.labels.map((label, index) => (
                <Typography
                  key={index}
                  variant="body2"
                  sx={{
                    bgcolor: 'primary.light',
                    color: 'white',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1
                  }}
                >
                  {label}
                </Typography>
              ))}
            </Box>
          </Paper>
        )}
      </Box>
    );
  };

  return (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" flexDirection="column" alignItems="center">
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              id="image-upload"
              onChange={handleFileSelect}
            />
            <label htmlFor="image-upload">
              <Button
                component="span"
                variant="contained"
                startIcon={<CloudUpload />}
                disabled={loading}
              >
                Görsel Seç
              </Button>
            </label>

            {error && (
              <Typography color="error" sx={{ mt: 2 }}>
                {error}
              </Typography>
            )}

            {previewUrl && (
              <Box mt={3} position="relative">
                <img
                  src={previewUrl}
                  alt="Seçilen görsel"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '300px',
                    objectFit: 'contain'
                  }}
                />
                <Box
                  position="absolute"
                  top={8}
                  right={8}
                  sx={{ display: 'flex', gap: 1 }}
                >
                  <IconButton
                    onClick={() => setShowFullImage(true)}
                    sx={{ bgcolor: 'white', '&:hover': { bgcolor: 'grey.100' } }}
                  >
                    <ZoomIn />
                  </IconButton>
                  <IconButton
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl('');
                      setAnalysisResult(null);
                    }}
                    sx={{ bgcolor: 'white', '&:hover': { bgcolor: 'grey.100' } }}
                  >
                    <Delete />
                  </IconButton>
                </Box>
              </Box>
            )}

            {selectedFile && !loading && (
              <Button
                variant="contained"
                onClick={analyzeImage}
                sx={{ mt: 2 }}
              >
                Görseli Analiz Et
              </Button>
            )}

            {loading && (
              <Box mt={3} display="flex" alignItems="center">
                <CircularProgress size={24} sx={{ mr: 1 }} />
                <Typography>Görsel analiz ediliyor...</Typography>
              </Box>
            )}

            {renderAnalysisResults()}
          </Box>
        </CardContent>
      </Card>

      {/* Tam ekran görsel dialogu */}
      <Dialog
        open={showFullImage}
        onClose={() => setShowFullImage(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Görsel Önizleme
        </DialogTitle>
        <DialogContent>
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Tam ekran görsel"
              style={{
                width: '100%',
                height: 'auto',
                objectFit: 'contain'
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowFullImage(false)}>
            Kapat
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
