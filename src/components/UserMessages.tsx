import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MailOpen,
  Trash2,
  CheckCircle2,
  Inbox,
  Calendar,
  Bell
} from 'lucide-react';

interface Message {
  id: string;
  message: string;
  sender_id: string;
  created_at: string;
  read: boolean;
  sender_name?: string;
}

interface UserMessagesProps {
  userId?: string;
}

const UserMessages: React.FC<UserMessagesProps> = ({ userId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState<'unread' | 'read'>('unread');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchMessages();

      const channel = supabase
        .channel(`user-messages-${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'admin_messages',
            filter: `receiver_id=eq.${userId}`
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
    if (!userId) return;

    try {
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

      if (error) throw error;

      if (data) {
        const formattedMessages = data.map(msg => ({
          id: msg.id,
          message: msg.message,
          sender_id: msg.sender_id,
          created_at: msg.created_at,
          read: msg.read,
          sender_name: (msg.sender as any)?.name || 'Admin'
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('admin_messages')
        .update({ read: true })
        .eq('id', messageId);

      if (error) throw error;

      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, read: true } : msg
        )
      );
      toast.success('Mesaj okundu olarak işaretlendi');
    } catch (error) {
      toast.error('Mesaj güncellenirken hata oluştu');
    }
  };

  const handleDelete = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('admin_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      toast.success('Mesaj silindi');
    } catch (error) {
      toast.error('Mesaj silinirken hata oluştu');
    }
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "d MMMM yyyy HH:mm", { locale: tr });
  };

  const unreadMessages = messages.filter(msg => !msg.read);
  const readMessages = messages.filter(msg => msg.read);
  const currentMessages = activeTab === 'unread' ? unreadMessages : readMessages;

  if (loading && messages.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-xl">
      {/* Tabs Header */}
      <div className="flex border-b border-white/5 bg-white/5">
        <button
          onClick={() => setActiveTab('unread')}
          className={`flex-1 py-4 px-6 flex items-center justify-center gap-2 text-sm font-bold transition-all relative ${activeTab === 'unread' ? 'text-white' : 'text-slate-400 hover:text-slate-300'
            }`}
        >
          <Inbox className={`w-4 h-4 ${activeTab === 'unread' ? 'text-indigo-400' : 'text-slate-500'}`} />
          Okunmamış
          {unreadMessages.length > 0 && (
            <span className="absolute top-3 right-4 w-5 h-5 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full shadow-lg border border-white/20">
              {unreadMessages.length}
            </span>
          )}
          {activeTab === 'unread' && (
            <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('read')}
          className={`flex-1 py-4 px-6 flex items-center justify-center gap-2 text-sm font-bold transition-all relative ${activeTab === 'read' ? 'text-white' : 'text-slate-400 hover:text-slate-300'
            }`}
        >
          <MailOpen className={`w-4 h-4 ${activeTab === 'read' ? 'text-indigo-400' : 'text-slate-500'}`} />
          Okunmuş
          {activeTab === 'read' && (
            <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
          )}
        </button>
      </div>

      {/* Messages List */}
      <div className="p-4 sm:p-6 min-h-[300px]">
        <AnimatePresence mode="wait">
          {currentMessages.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="w-16 h-16 bg-slate-700/50 rounded-2xl flex items-center justify-center mb-4 border border-white/5 text-slate-500">
                <Bell className="w-8 h-8" />
              </div>
              <p className="text-slate-400 font-medium">
                {activeTab === 'unread' ? 'Yeni mesajınız bulunmuyor' : 'Okunmuş mesajınız yok'}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {currentMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`group relative bg-slate-700/30 hover:bg-slate-700/50 border border-white/5 rounded-2xl p-4 sm:p-5 transition-all duration-300 ${!msg.read ? 'ring-1 ring-indigo-500/30' : ''
                    }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{msg.sender_name}</span>
                        {!msg.read && (
                          <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                        )}
                      </div>
                      <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                        {msg.message}
                      </p>
                      <div className="flex items-center gap-4 text-[11px] text-slate-500 font-medium pt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatDate(msg.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:self-start opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      {!msg.read && (
                        <button
                          onClick={() => handleMarkAsRead(msg.id)}
                          className="p-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-xl transition-all shadow-lg shadow-indigo-500/10"
                          title="Okundu olarak işaretle"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(msg.id)}
                        className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-lg shadow-red-500/10"
                        title="Sil"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default UserMessages;
