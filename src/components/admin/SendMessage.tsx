import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  SelectChangeEvent
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
}

const SendMessage: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [openUserSearch, setOpenUserSearch] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUserSearchOpen = async () => {
    setOpenUserSearch(true);
    await loadUsers();
  };

  const loadUsers = async () => {
    setUserSearchLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email')
        .ilike('name', `%${userSearch}%`)
        .order('name');

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Kullanıcılar yüklenirken hata:', err);
      setError('Kullanıcılar yüklenemedi');
    } finally {
      setUserSearchLoading(false);
    }
  };

  const loadAllUsers = async () => {
    setUserSearchLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email')
        .order('name');

      if (error) throw error;
      setUsers(data || []);
      // Tüm kullanıcıların ID'lerini selectedUsers'a ekle
      setSelectedUsers(data?.map(user => user.id) || []);
      toast.success(`${data?.length || 0} öğrenci seçildi`);
    } catch (err) {
      console.error('Tüm kullanıcılar yüklenirken hata:', err);
      setError('Kullanıcılar yüklenemedi');
    } finally {
      setUserSearchLoading(false);
      setOpenUserSearch(false); // Dialog'u kapat
    }
  };

  const handleUserSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUserSearch(event.target.value);
  };

  const handleUserSelectChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSelectedUsers(typeof value === 'string' ? value.split(',') : value);
  };

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast.error('Mesaj içeriği boş olamaz');
      return;
    }

    if (selectedUsers.length === 0) {
      toast.error('En az bir alıcı seçmelisiniz');
      return;
    }

    setSending(true);
    setError(null);

    try {
      // Her bir seçili kullanıcı için mesaj gönder
      const messages = selectedUsers.map(receiverId => ({
        message: message,
        sender_id: user?.id,
        receiver_id: receiverId,
        read: false
      }));

      const { error } = await supabase
        .from('admin_messages')
        .insert(messages);

      if (error) throw error;

      toast.success('Mesaj başarıyla gönderildi');
      // Formu sıfırla
      setSelectedUsers([]);
      setSubject('');
      setMessage('');
    } catch (err: any) {
      console.error('Mesaj gönderilirken hata:', err);
      setError('Mesaj gönderilemedi: ' + err.message);
      toast.error('Mesaj gönderilemedi');
    } finally {
      setSending(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Öğrencilere Mesaj Gönder
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <Button
              variant="outlined"
              onClick={handleUserSearchOpen}
              sx={{ mb: 1 }}
            >
              Alıcı Seç
            </Button>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {selectedUsers.length > 0 ? (
                selectedUsers.map(userId => {
                  const selectedUser = users.find(u => u.id === userId);
                  return (
                    <Chip
                      key={userId}
                      label={selectedUser ? selectedUser.name : userId}
                      onDelete={() => setSelectedUsers(selectedUsers.filter(id => id !== userId))}
                    />
                  );
                })
              ) : (
                <Typography color="text.secondary">Alıcı seçilmedi</Typography>
              )}
            </Box>
          </Box>

          <TextField
            label="Konu"
            variant="outlined"
            fullWidth
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />

          <TextField
            label="Mesaj"
            variant="outlined"
            multiline
            rows={6}
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          <Button
            variant="contained"
            color="primary"
            startIcon={sending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
            onClick={handleSendMessage}
            disabled={sending || !message.trim() || selectedUsers.length === 0}
          >
            {sending ? 'Gönderiliyor...' : 'Mesaj Gönder'}
          </Button>
        </Box>
      </Paper>

      {/* Kullanıcı Arama Dialogu */}
      <Dialog open={openUserSearch} onClose={() => setOpenUserSearch(false)} maxWidth="md" fullWidth>
        <DialogTitle>Alıcı Seç</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2, mt: 1 }}>
            <TextField
              autoFocus
              label="İsim Ara"
              variant="outlined"
              fullWidth
              value={userSearch}
              onChange={handleUserSearchChange}
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="contained" onClick={loadUsers} disabled={userSearchLoading}>
                {userSearchLoading ? <CircularProgress size={24} /> : 'Ara'}
              </Button>
              <Button 
                variant="outlined" 
                color="secondary" 
                onClick={loadAllUsers} 
                disabled={userSearchLoading}
              >
                Tüm Öğrencileri Seç
              </Button>
            </Box>
          </Box>

          <FormControl fullWidth sx={{ mt: 3 }}>
            <InputLabel id="user-select-label">Öğrenciler</InputLabel>
            <Select
              labelId="user-select-label"
              multiple
              value={selectedUsers}
              onChange={handleUserSelectChange}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const selectedUser = users.find(u => u.id === value);
                    return (
                      <Chip key={value} label={selectedUser ? selectedUser.name : value} />
                    );
                  })}
                </Box>
              )}
            >
              {userSearchLoading ? (
                <MenuItem disabled>
                  <CircularProgress size={24} />
                </MenuItem>
              ) : (
                users.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUserSearch(false)}>İptal</Button>
          <Button onClick={() => setOpenUserSearch(false)} variant="contained">
            Tamam
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SendMessage;
