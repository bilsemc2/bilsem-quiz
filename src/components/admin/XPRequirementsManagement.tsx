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
  const [editingRequirement, setEditingRequirement] = useState<XPRequirement | null>(null);

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
      // Sayfa yolu kontrolü
      if (!newRequirement.page_path.startsWith('/')) {
        toast.error('Sayfa yolu "/" ile başlamalıdır');
        return;
      }

      // XP değeri kontrolü
      if (newRequirement.required_xp < 0) {
        toast.error('XP değeri 0 veya daha büyük olmalıdır');
        return;
      }

      const { data, error } = await supabase
        .from('xp_requirements')
        .insert([{
          page_path: newRequirement.page_path,
          required_xp: newRequirement.required_xp,
          description: newRequirement.description
        }]);

      if (error) {
        if (error.code === '23505') {
          toast.error('Bu sayfa yolu için zaten bir XP gereksinimi var');
        } else {
          throw error;
        }
        return;
      }

      toast.success('XP gereksinimi başarıyla eklendi');
      await fetchRequirements();
      
      // Formu temizle
      setNewRequirement({
        page_path: '',
        required_xp: 0,
        description: ''
      });
    } catch (error) {
      console.error('XP gereksinimi eklenirken hata:', error);
      toast.error('XP gereksinimi eklenemedi');
    }
  };

  // Gereksinimi sil
  const handleDeleteRequirement = async (id: string) => {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) return;

    try {
      const { error } = await supabase
        .from('xp_requirements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('XP gereksinimi başarıyla silindi');
      await fetchRequirements();
    } catch (error) {
      console.error('XP gereksinimi silinirken hata:', error);
      toast.error('XP gereksinimi silinemedi');
    }
  };

  // Gereksinimi güncelle
  const handleUpdateRequirement = async (id: string) => {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) return;

    try {
      const { error } = await supabase
        .from('xp_requirements')
        .update({
          required_xp: editingRequirement?.required_xp,
          description: editingRequirement?.description
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('XP gereksinimi başarıyla güncellendi');
      setEditingRequirement(null);
      await fetchRequirements();
    } catch (error) {
      console.error('XP gereksinimi güncellenirken hata:', error);
      toast.error('XP gereksinimi güncellenemedi');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography>Yükleniyor...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box mb={4}>
        <Typography variant="h5" gutterBottom>
          XP Gereksinimleri Yönetimi
        </Typography>
        
        {/* Yeni Gereksinim Formu */}
        <Paper elevation={2} sx={{ p: 2, mb: 4 }}>
          <form onSubmit={handleAddRequirement}>
            <Box display="flex" gap={2} alignItems="flex-start">
              <TextField
                label="Sayfa Yolu"
                value={newRequirement.page_path}
                onChange={(e) => setNewRequirement(prev => ({ ...prev, page_path: e.target.value }))}
                placeholder="/sayfa-yolu"
                required
                size="small"
              />
              <TextField
                label="Gereken XP"
                type="number"
                value={newRequirement.required_xp}
                onChange={(e) => setNewRequirement(prev => ({ ...prev, required_xp: parseInt(e.target.value) || 0 }))}
                required
                size="small"
              />
              <TextField
                label="Açıklama"
                value={newRequirement.description}
                onChange={(e) => setNewRequirement(prev => ({ ...prev, description: e.target.value }))}
                placeholder="XP gereksinimi açıklaması"
                size="small"
              />
              <Button type="submit" variant="contained" color="primary">
                Ekle
              </Button>
            </Box>
          </form>
        </Paper>

        {/* Gereksinimler Tablosu */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Sayfa Yolu</TableCell>
                <TableCell>Gereken XP</TableCell>
                <TableCell>Açıklama</TableCell>
                <TableCell>İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requirements.map((req) => (
                <TableRow key={req.id}>
                  <TableCell>{req.page_path}</TableCell>
                  <TableCell>
                    {editingRequirement?.id === req.id ? (
                      <TextField
                        type="number"
                        value={editingRequirement.required_xp}
                        onChange={(e) => setEditingRequirement(prev => ({ ...prev!, required_xp: parseInt(e.target.value) || 0 }))}
                        size="small"
                      />
                    ) : (
                      req.required_xp
                    )}
                  </TableCell>
                  <TableCell>
                    {editingRequirement?.id === req.id ? (
                      <TextField
                        value={editingRequirement.description}
                        onChange={(e) => setEditingRequirement(prev => ({ ...prev!, description: e.target.value }))}
                        size="small"
                      />
                    ) : (
                      req.description
                    )}
                  </TableCell>
                  <TableCell>
                    {editingRequirement?.id === req.id ? (
                      <Box display="flex" gap={1}>
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          onClick={() => handleUpdateRequirement(req.id)}
                        >
                          Kaydet
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => setEditingRequirement(null)}
                        >
                          İptal
                        </Button>
                      </Box>
                    ) : (
                      <Box display="flex" gap={1}>
                        <IconButton
                          size="small"
                          onClick={() => setEditingRequirement(req)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteRequirement(req.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    )}
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
