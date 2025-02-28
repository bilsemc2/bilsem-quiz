import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Badge,
  Tabs,
  Tab,
  Box,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { toast } from 'sonner';

interface Message {
  id: string;
  message: string;
  sender_id: string;
  created_at: string;
  read: boolean;
  sender_name?: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`messages-tabpanel-${index}`}
      aria-labelledby={`messages-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

const UserMessages: React.FC<{ userId?: string }> = ({ userId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (userId) {
      fetchMessages();
      
      const channel = supabase
        .channel('user-messages')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'admin_messages'
          },
          () => {
            fetchMessages();
          }
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    }
  }, [userId]);

  const fetchMessages = async () => {
    if (!userId) {
      console.log('No user ID provided');
      return;
    }
    console.log('Current user ID:', userId);

    // Önce basit bir sorgu deneyelim
    const { data: simpleData } = await supabase
      .from('admin_messages')
      .select('*');
    
    console.log('All messages in table:', simpleData);

    // Şimdi asıl sorgumuzu yapalım
    const { data, error } = await supabase
      .from('admin_messages')
      .select(`
        id,
        message,
        sender_id,
        receiver_id,
        created_at,
        read,
        sender:profiles!admin_messages_sender_id_fkey(name)
      `)
      .eq('receiver_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    console.log('Filtered messages for user:', data);
    console.log('User ID we are filtering for:', userId);

    if (data) {
      const formattedMessages = data.map(msg => ({
        id: msg.id,
        message: msg.message,
        sender_id: msg.sender_id,
        created_at: msg.created_at,
        read: msg.read,
        sender_name: Array.isArray(msg.sender) && msg.sender[0] ? msg.sender[0].name : 'Admin'
      }));
      console.log('Formatted messages:', formattedMessages);
      setMessages(formattedMessages);
      setUnreadCount(formattedMessages.filter(msg => !msg.read).length);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    const { error } = await supabase
      .from('admin_messages')
      .update({ read: true })
      .eq('id', messageId);

    if (!error) {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, read: true } : msg
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast.success('Mesaj okundu olarak işaretlendi');
    }
  };

  const handleDelete = async (messageId: string) => {
    const { error } = await supabase
      .from('admin_messages')
      .delete()
      .eq('id', messageId);

    if (!error) {
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      toast.success('Mesaj silindi');
    }
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "d MMMM yyyy HH:mm", { locale: tr });
  };

  const unreadMessages = messages.filter(msg => !msg.read);
  const readMessages = messages.filter(msg => msg.read);

  return (
    <Paper elevation={0} sx={{ p: 0 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={tabValue} 
          onChange={(_, newValue) => setTabValue(newValue)}
          aria-label="message tabs"
        >
          <Tab 
            label={
              <Badge badgeContent={unreadCount} color="error">
                Okunmamış Mesajlar
              </Badge>
            } 
          />
          <Tab label="Okunmuş Mesajlar" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {unreadMessages.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={4}>
            Okunmamış mesajınız yok
          </Typography>
        ) : (
          <List>
            {unreadMessages.map((message, index) => (
              <React.Fragment key={message.id}>
                <ListItem
                  sx={{
                    bgcolor: 'action.hover',
                    borderRadius: 1,
                    mb: 1
                  }}
                  secondaryAction={
                    <Box>
                      <Tooltip title="Okundu olarak işaretle">
                        <IconButton
                          edge="end"
                          aria-label="mark as read"
                          onClick={() => handleMarkAsRead(message.id)}
                        >
                          <DoneAllIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Sil">
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => handleDelete(message.id)}
                        >
                          <DeleteOutlineIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" component="span">
                          {message.sender_name || 'Admin'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(message.created_at)}
                        </Typography>
                      </Box>
                    }
                    secondary={message.message}
                  />
                </ListItem>
                {index < unreadMessages.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {messages.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={4}>
            Henüz hiç mesajınız yok
          </Typography>
        ) : (
          <List>
            {readMessages.map((message, index) => (
              <React.Fragment key={message.id}>
                <ListItem
                  sx={{
                    bgcolor: message.read ? 'transparent' : 'action.hover',
                    borderRadius: 1,
                    mb: 1
                  }}
                  secondaryAction={
                    <Box>
                      {!message.read && (
                        <Tooltip title="Okundu olarak işaretle">
                          <IconButton
                            edge="end"
                            aria-label="mark as read"
                            onClick={() => handleMarkAsRead(message.id)}
                          >
                            <DoneAllIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Sil">
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => handleDelete(message.id)}
                        >
                          <DeleteOutlineIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" component="span">
                          {message.sender_name || 'Admin'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(message.created_at)}
                        </Typography>
                      </Box>
                    }
                    secondary={message.message}
                  />
                </ListItem>
                {index < messages.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </TabPanel>
    </Paper>
  );
};

export default UserMessages;
