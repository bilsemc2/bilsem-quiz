import { useEffect, useState } from 'react';
import { Box, Typography, Chip, Paper, List, ListItem, ListItemText, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import MessageIcon from '@mui/icons-material/Message';
import { toast } from 'sonner';
import { authRepository } from '@/server/repositories/authRepository';
import { adminMessageRepository } from '@/server/repositories/adminMessageRepository';
import { presenceRepository } from '@/server/repositories/presenceRepository';
import { toOnlineUsers, type OnlineUser } from '@/features/content/model/onlinePresenceUseCases';

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

const OnlineUsers = () => {
  const [users, setUsers] = useState<OnlineUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<OnlineUser | null>(null);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);

  useEffect(() => {
    void updateOnlineStatus();
    const interval = setInterval(updateOnlineStatus, 30000);

    const subscription = presenceRepository.subscribeProfilesChanges(() => {
      void updateOnlineStatus();
    });

    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, []);

  const updateOnlineStatus = async () => {
    const profiles = await presenceRepository.listProfilesPresence();
    setUsers(toOnlineUsers(profiles));
  };

  const handleSendMessage = async (message: string) => {
    if (!selectedUser) return;

    const user = await authRepository.getSessionUser();
    if (!user) return;

    const profile = await authRepository.getProfileByUserId(user.id);

    if (!profile?.is_admin) {
      toast.error('Sadece adminler mesaj gönderebilir');
      return;
    }

    try {
      await adminMessageRepository.sendAdminMessage({
        senderId: user.id,
        receiverId: selectedUser.id,
        message
      });
      toast.success('Mesaj gönderildi');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Mesaj gönderilemedi');
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
