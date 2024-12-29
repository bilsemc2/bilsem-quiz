import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { XPRequirement } from '../../types/xpRequirements';
import { useAuth } from '../../contexts/AuthContext';
import {
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  IconButton,
  Container,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { toast } from 'react-toastify';

export default function XPRequirementsManagement() {
  const { user } = useAuth();
  const [requirements, setRequirements] = useState<XPRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRequirement, setNewRequirement] = useState({
    page_path: '',
    required_xp: 0,
    description: ''
  });

  // Admin kontrolü
  const checkIsAdmin = async () => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      
      if (!profile?.is_admin) {
        toast.error('Bu sayfaya erişim yetkiniz yok');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Admin kontrolü yapılırken hata:', error);
      toast.error('Yetki kontrolü yapılamadı');
      return false;
    }
  };

  // Gereksinimleri yükle
  const fetchRequirements = async () => {
    try {
      const { data, error } = await supabase
        .from('xp_requirements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequirements(data || []);
    } catch (error) {
      console.error('XP gereksinimleri yüklenirken hata:', error);
      toast.error('XP gereksinimleri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirements();
  }, []);

  // Yeni gereksinim ekle
  const handleAddRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Admin kontrolü yap
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) return;

    try {
      const { data, error } = await supabase
        .from('xp_requirements')
        .insert([{
          page_path: newRequirement.page_path,
          required_xp: newRequirement.required_xp,
          description: newRequirement.description
        }])
        .select()
        .single();

      if (error) throw error;

      setRequirements([data, ...requirements]);
      setNewRequirement({ page_path: '', required_xp: 0, description: '' });
      toast.success('XP gereksinimi eklendi');
    } catch (error) {
      console.error('XP gereksinimi eklenirken hata:', error);
      toast.error('XP gereksinimi eklenemedi');
    }
  };

  // Gereksinimi güncelle
  const handleUpdateRequirement = async (id: string, updates: Partial<XPRequirement>) => {
    // Admin kontrolü yap
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) return;

    try {
      const { error } = await supabase
        .from('xp_requirements')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setRequirements(requirements.map(req => 
        req.id === id ? { ...req, ...updates } : req
      ));
      toast.success('XP gereksinimi güncellendi');
    } catch (error) {
      console.error('XP gereksinimi güncellenirken hata:', error);
      toast.error('XP gereksinimi güncellenemedi');
    }
  };

  // Gereksinimi sil
  const handleDeleteRequirement = async (id: string) => {
    if (!window.confirm('Bu XP gereksinimini silmek istediğinizden emin misiniz?')) return;

    // Admin kontrolü yap
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) return;

    try {
      const { error } = await supabase
        .from('xp_requirements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRequirements(requirements.filter(req => req.id !== id));
      toast.success('XP gereksinimi silindi');
    } catch (error) {
      console.error('XP gereksinimi silinirken hata:', error);
      toast.error('XP gereksinimi silinemedi');
    }
  };

  if (loading) return <Typography>Yükleniyor...</Typography>;

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>XP Gereksinimleri Yönetimi</Typography>
        
        {/* Yeni Gereksinim Formu */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>Yeni XP Gereksinimi Ekle</Typography>
          <Box component="form" onSubmit={handleAddRequirement} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Sayfa Yolu"
              placeholder="/quiz, /profile gibi..."
              value={newRequirement.page_path}
              onChange={e => setNewRequirement(prev => ({ ...prev, page_path: e.target.value }))}
              required
              fullWidth
            />

            <TextField
              label="Gerekli XP"
              type="number"
              InputProps={{ inputProps: { min: 0 } }}
              value={newRequirement.required_xp}
              onChange={e => setNewRequirement(prev => ({ ...prev, required_xp: parseInt(e.target.value) }))}
              required
              fullWidth
            />

            <TextField
              label="Açıklama"
              multiline
              rows={3}
              placeholder="Bu sayfaya erişim için gerekli XP açıklaması..."
              value={newRequirement.description}
              onChange={e => setNewRequirement(prev => ({ ...prev, description: e.target.value }))}
              required
              fullWidth
            />

            <Button type="submit" variant="contained" color="primary">
              Ekle
            </Button>
          </Box>
        </Paper>

        {/* Gereksinimler Tablosu */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Sayfa Yolu</TableCell>
                <TableCell>Gerekli XP</TableCell>
                <TableCell>Açıklama</TableCell>
                <TableCell>İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requirements.map((req) => (
                <TableRow key={req.id}>
                  <TableCell>{req.page_path}</TableCell>
                  <TableCell>{req.required_xp}</TableCell>
                  <TableCell>{req.description}</TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => {
                        const newXP = window.prompt('Yeni XP değeri:', req.required_xp.toString());
                        if (newXP) {
                          handleUpdateRequirement(req.id, { required_xp: parseInt(newXP) });
                        }
                      }}
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDeleteRequirement(req.id)}
                      size="small"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Container>
  );
}
