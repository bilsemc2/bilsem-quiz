import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Avatar,
  IconButton,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  userData: {
    name: string;
    email: string;
    school: string;
    grade: string;
    avatar_url: string;
  };
  onUpdate: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  open,
  onClose,
  userData,
  onUpdate,
}) => {
  const [formData, setFormData] = useState({
    name: userData.name || '',
    school: userData.school || '',
    grade: userData.grade || '',
    avatar_url: userData.avatar_url || '',
  });

  // Modal açıldığında form verilerini güncelle
  useEffect(() => {
    if (open) {
      setFormData({
        name: userData.name || '',
        school: userData.school || '',
        grade: userData.grade || '',
        avatar_url: userData.avatar_url || ''
      });
    }
  }, [open, userData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Kullanıcı oturumu bulunamadı');
        return;
      }

      // Önce avatar güncellemesi yapılıyor mu kontrol et
      if (formData.avatar_url !== userData.avatar_url) {
        const { error: avatarError } = await supabase
          .from('profiles')
          .update({ avatar_url: formData.avatar_url })
          .eq('id', user.id);

        if (avatarError) {
          console.error('Avatar güncelleme hatası:', avatarError);
          toast.error('Avatar güncellenirken bir hata oluştu');
          return;
        }
      }

      // Diğer profil bilgilerini güncelle
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          school: formData.school,
          grade: formData.grade,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Profil başarıyla güncellendi');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Profil güncellenirken bir hata oluştu');
    }
  };

  const generateNewAvatar = async () => {
    try {
      const seed = Math.random().toString(36).substring(7);
      const newAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
      setFormData(prev => ({ ...prev, avatar_url: newAvatar }));
      
      // Avatar önizleme yüklemesi için kısa bir bekleme
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast.success('Yeni avatar oluşturuldu! Kaydetmek için "Kaydet" butonuna tıklayın.');
    } catch (error) {
      console.error('Avatar oluşturma hatası:', error);
      toast.error('Yeni avatar oluşturulurken bir hata oluştu');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Profili Düzenle</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              src={formData.avatar_url}
              sx={{ width: 80, height: 80 }}
            />
            <IconButton onClick={generateNewAvatar} color="primary">
              <EditIcon />
            </IconButton>
          </Box>

          <TextField
            label="İsim"
            name="name"
            value={formData.name}
            onChange={handleChange}
            fullWidth
          />

          <TextField
            label="Okul"
            name="school"
            value={formData.school}
            onChange={handleChange}
            fullWidth
          />

          <TextField
            label="Sınıf"
            name="grade"
            value={formData.grade}
            onChange={handleChange}
            fullWidth
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>İptal</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Kaydet
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditProfileModal;
