import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Box, Typography, Chip, Paper, List, ListItem, ListItemText, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import MessageIcon from '@mui/icons-material/Message';
import { toast } from 'sonner';

interface OnlineUser {
  id: string;
  name: string;
  last_seen: string;
  online: boolean;
}

interface MessageDialogProps {
  open: boolean;
  onClose: () => void;
  user: OnlineUser | null;
  onSend: (message: string) => void;
}

const MessageDialog = ({ open, onClose, user, onSend }: MessageDialogProps) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      onSend(message);
      setMessage('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Mesaj Gönder: {user?.name}
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Mesajınız"
          type="text"
          fullWidth
          multiline
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>İptal</Button>
        <Button onClick={handleSend} variant="contained" color="primary">
          Gönder
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ONLINE_THRESHOLD = 5 * 60 * 1000; // 5 minutes in milliseconds

const OnlineUsers = () => {
  const [users, setUsers] = useState<OnlineUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<OnlineUser | null>(null);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);

  useEffect(() => {
    updateOnlineStatus();
    const interval = setInterval(updateOnlineStatus, 30000);
    
    const channel = supabase
      .channel('online-users')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          updateOnlineStatus();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      channel.unsubscribe();
    };
  }, []);

  const updateOnlineStatus = async () => {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, name, last_seen')
      .order('name');

    if (error) {
      console.error('Profil bilgileri alınamadı:', error);
      return;
    }

    if (profiles) {
      const now = new Date().getTime();
      const onlineUsers = profiles.map(profile => ({
        id: profile.id,
        name: profile.name,
        last_seen: profile.last_seen,
        online: profile.last_seen && (now - new Date(profile.last_seen).getTime()) < ONLINE_THRESHOLD
      }));
      setUsers(onlineUsers);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!selectedUser) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Admin kontrolü
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      toast.error('Sadece adminler mesaj gönderebilir');
      return;
    }

    console.log('Sending message:', {
      sender_id: user.id,
      receiver_id: selectedUser.id,
      message
    });

    const { data, error } = await supabase
      .from('admin_messages')
      .insert([
        {
          sender_id: user.id,
          receiver_id: selectedUser.id,
          message
        }
      ])
      .select();

    console.log('Insert result:', { data, error });

    if (error) {
      console.error('Error sending message:', error);
      toast.error('Mesaj gönderilemedi');
    } else {
      toast.success('Mesaj gönderildi');
    }
  };

  const onlineCount = users.filter(user => user.online).length;
  const onlineUsers = users.filter(user => user.online);

  return (
    <Paper elevation={0} sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Çevrimiçi Üyeler</Typography>
        <Chip
          label={`${onlineCount} Çevrimiçi`}
          color="success"
          size="small"
          sx={{ bgcolor: 'success.light', color: 'success.dark' }}
        />
      </Box>
      <List>
        {onlineUsers.map(user => (
          <ListItem
            key={user.id}
            sx={{
              borderRadius: 1,
              '&:hover': { bgcolor: 'action.hover' },
              mb: 0.5
            }}
          >
            <ListItemText 
              primary={user.name}
              sx={{ fontWeight: 500 }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FiberManualRecordIcon
                sx={{
                  fontSize: 12,
                  color: 'success.main'
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: 'success.main'
                }}
              >
                Çevrimiçi
              </Typography>
              <IconButton
                size="small"
                onClick={() => {
                  setSelectedUser(user);
                  setMessageDialogOpen(true);
                }}
                sx={{ ml: 1 }}
              >
                <MessageIcon fontSize="small" />
              </IconButton>
            </Box>
          </ListItem>
        ))}
        {onlineCount === 0 && (
          <Typography
            variant="body2"
            sx={{
              textAlign: 'center',
              color: 'text.secondary',
              py: 2
            }}
          >
            Şu anda çevrimiçi üye bulunmuyor
          </Typography>
        )}
      </List>

      <MessageDialog
        open={messageDialogOpen}
        onClose={() => {
          setMessageDialogOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onSend={handleSendMessage}
      />
    </Paper>
  );
};

export default OnlineUsers;
