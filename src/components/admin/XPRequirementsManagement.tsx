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

  // XP gereksinimlerini getir
  useEffect(() => {
    const fetchRequirements = async () => {
      try {
        const { data, error } = await supabase
          .from('xp_requirements')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          toast.error('XP gereksinimleri yüklenirken hata oluştu');
          throw error;
        }

        setRequirements(data || []);
        setLoading(false);
      } catch (error) {
        console.error('XP gereksinimleri yüklenirken hata:', error);
        setLoading(false);
      }
    };

    fetchRequirements();
  }, []);

  // Yeni XP gereksinimi ekle
  const handleAddRequirement = async () => {
    try {
      if (!newRequirement.page_path || newRequirement.required_xp <= 0) {
        toast.warning('Lütfen tüm alanları doldurun');
        return;
      }

      const { data, error } = await supabase
        .from('xp_requirements')
        .insert([{
          page_path: newRequirement.page_path,
          required_xp: newRequirement.required_xp,
          description: newRequirement.description || null
        }])
        .select()
        .single();

      if (error) {
        toast.error('XP gereksinimi eklenirken hata oluştu');
        throw error;
      }

      setRequirements([data, ...requirements]);
      setNewRequirement({
        page_path: '',
        required_xp: 0,
        description: ''
      });
      toast.success('XP gereksinimi başarıyla eklendi');
    } catch (error) {
      console.error('XP gereksinimi eklenirken hata:', error);
    }
  };

  // XP gereksinimini sil
  const handleDeleteRequirement = async (id: string) => {
    try {
      const { error } = await supabase
        .from('xp_requirements')
        .delete()
        .eq('id', id);

      if (error) {
        toast.error('XP gereksinimi silinirken hata oluştu');
        throw error;
      }

      setRequirements(requirements.filter(req => req.id !== id));
      toast.success('XP gereksinimi başarıyla silindi');
    } catch (error) {
      console.error('XP gereksinimi silinirken hata:', error);
    }
  };

  // XP gereksinimini güncelle
  const handleUpdateRequirement = async (requirement: XPRequirement) => {
    try {
      const { error } = await supabase
        .from('xp_requirements')
        .update({
          page_path: requirement.page_path,
          required_xp: requirement.required_xp,
          description: requirement.description
        })
        .eq('id', requirement.id);

      if (error) {
        toast.error('XP gereksinimi güncellenirken hata oluştu');
        throw error;
      }

      setRequirements(requirements.map(req => 
        req.id === requirement.id ? requirement : req
      ));
      toast.success('XP gereksinimi başarıyla güncellendi');
    } catch (error) {
      console.error('XP gereksinimi güncellenirken hata:', error);
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
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          XP Gereksinimleri Yönetimi
        </Typography>

        <Box sx={{ mb: 4 }}>
          <TextField
            label="Sayfa Yolu"
            value={newRequirement.page_path}
            onChange={(e) => setNewRequirement({ ...newRequirement, page_path: e.target.value })}
            fullWidth
            margin="normal"
            helperText="Örnek: /quiz/123"
          />
          <TextField
            label="Gereken XP"
            type="number"
            value={newRequirement.required_xp}
            onChange={(e) => setNewRequirement({ ...newRequirement, required_xp: parseInt(e.target.value) || 0 })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Açıklama"
            value={newRequirement.description}
            onChange={(e) => setNewRequirement({ ...newRequirement, description: e.target.value })}
            fullWidth
            margin="normal"
            multiline
            rows={2}
          />
          <Button
            variant="contained"
            onClick={handleAddRequirement}
            sx={{ mt: 2 }}
          >
            Yeni Gereksinim Ekle
          </Button>
        </Box>

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
              {requirements.map((requirement) => (
                <TableRow key={requirement.id}>
                  <TableCell>{requirement.page_path}</TableCell>
                  <TableCell>{requirement.required_xp}</TableCell>
                  <TableCell>{requirement.description}</TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => handleDeleteRequirement(requirement.id)}
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
