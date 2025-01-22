import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Alert, Snackbar, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface AdminMessage {
  id: string;
  message: string;
  sender_id: string;
  created_at: string;
  sender_name?: string;
}

const AdminMessageNotification = () => {
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState<AdminMessage | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchMessages();
    
    const channel = supabase
      .channel('admin-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_messages'
        },
        (payload: any) => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (messages.length > 0 && !currentMessage) {
      showNextMessage();
    }
  }, [messages]);

  const fetchMessages = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('admin_messages')
      .select(`
        *,
        sender:sender_id(name)
      `)
      .eq('receiver_id', user.id)
      .eq('read', false)
      .order('created_at', { ascending: true });

    if (data) {
      const formattedMessages = data.map(msg => ({
        ...msg,
        sender_name: msg.sender?.name
      }));
      setMessages(formattedMessages);
    }
  };

  const showNextMessage = () => {
    if (messages.length > 0) {
      setCurrentMessage(messages[0]);
      setOpen(true);
    }
  };

  const handleClose = async () => {
    if (currentMessage) {
      // Mark message as read
      await supabase
        .from('admin_messages')
        .update({ read: true })
        .eq('id', currentMessage.id);

      // Remove from local state
      setMessages(prev => prev.filter(m => m.id !== currentMessage.id));
      setCurrentMessage(null);
      setOpen(false);

      // Show next message if available
      setTimeout(() => {
        showNextMessage();
      }, 500);
    }
  };

  if (!currentMessage) return null;

  return (
    <Snackbar
      open={open}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      autoHideDuration={10000}
      onClose={handleClose}
    >
      <Alert
        severity="info"
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={handleClose}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
        sx={{ width: '100%', maxWidth: '400px' }}
      >
        <div className="space-y-1">
          <div className="font-medium">{currentMessage.sender_name || 'Admin'}</div>
          <div>{currentMessage.message}</div>
        </div>
      </Alert>
    </Snackbar>
  );
};

export default AdminMessageNotification;
