import React, { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { MailOpen, Trash2, CheckCircle2, Inbox, Calendar, Bell } from 'lucide-react';
import { adminMessageRepository } from '@/server/repositories/adminMessageRepository';
import { toUserMessageItems, type UserMessageItem } from '@/features/content/model/adminMessagingUseCases';

interface UserMessagesProps {
  userId?: string;
}

const UserMessages: React.FC<UserMessagesProps> = ({ userId }) => {
  const [messages, setMessages] = useState<UserMessageItem[]>([]);
  const [activeTab, setActiveTab] = useState<'unread' | 'read'>('unread');
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!userId) return;

    try {
      const data = await adminMessageRepository.listMessagesByReceiverId(userId);
      setMessages(toUserMessageItems(data));
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    void fetchMessages();
    const subscription = adminMessageRepository.subscribeMessageChanges(() => {
      void fetchMessages();
    }, userId);

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, fetchMessages]);

  const handleMarkAsRead = async (messageId: string) => {
    try {
      await adminMessageRepository.markMessageAsRead(messageId);
      setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, read: true } : msg));
      toast.success('Mesaj okundu olarak işaretlendi');
    } catch { toast.error('Mesaj güncellenirken hata oluştu'); }
  };

  const handleDelete = async (messageId: string) => {
    try {
      await adminMessageRepository.deleteMessage(messageId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      toast.success('Mesaj silindi');
    } catch { toast.error('Mesaj silinirken hata oluştu'); }
  };

  const formatDate = (date: string) => format(new Date(date), "d MMMM yyyy HH:mm", { locale: tr });
  const unreadMessages = messages.filter(msg => !msg.read);
  const readMessages = messages.filter(msg => msg.read);
  const currentMessages = activeTab === 'unread' ? unreadMessages : readMessages;

  if (loading && messages.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-3 border-black/10 border-t-cyber-blue rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl overflow-hidden shadow-neo-sm">
      {/* Tabs */}
      <div className="flex border-b-2 border-black/10 dark:border-white/10">
        <button onClick={() => setActiveTab('unread')}
          className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 font-nunito font-extrabold text-sm transition-all relative ${activeTab === 'unread' ? 'text-black dark:text-white bg-cyber-gold/10' : 'text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
          <Inbox className={`w-4 h-4 ${activeTab === 'unread' ? 'text-cyber-gold' : 'text-slate-400'}`} />
          Okunmamış
          {unreadMessages.length > 0 && (
            <span className="w-5 h-5 bg-red-500 text-white text-[9px] font-extrabold flex items-center justify-center rounded-full">
              {unreadMessages.length}
            </span>
          )}
          {activeTab === 'unread' && <motion.div layoutId="msg-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyber-gold" />}
        </button>
        <button onClick={() => setActiveTab('read')}
          className={`flex-1 flex items-center justify-center gap-2 font-nunito font-extrabold text-sm transition-all relative border-l border-black/5 dark:border-white/5 ${activeTab === 'read' ? 'text-black dark:text-white bg-cyber-emerald/10' : 'text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
          <MailOpen className={`w-4 h-4 ${activeTab === 'read' ? 'text-cyber-emerald' : 'text-slate-400'}`} />
          Okunmuş
          {activeTab === 'read' && <motion.div layoutId="msg-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyber-emerald" />}
        </button>
      </div>

      {/* Messages */}
      <div className="p-4 sm:p-5 min-h-[200px]">
        <AnimatePresence mode="wait">
          {currentMessages.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 bg-gray-50 dark:bg-slate-700/50 rounded-xl flex items-center justify-center mb-3 border border-black/5 dark:border-white/5">
                <Bell className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-slate-400 font-nunito font-bold text-sm">
                {activeTab === 'unread' ? 'Yeni mesajınız bulunmuyor' : 'Okunmuş mesajınız yok'}
              </p>
            </motion.div>
          ) : (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {currentMessages.map((msg) => (
                <div key={msg.id}
                  className={`group relative bg-white dark:bg-slate-700/30 border-2 rounded-xl p-4 transition-all hover:-translate-y-0.5 ${!msg.read ? 'border-cyber-blue/30 bg-cyber-blue/5 shadow-neo-sm' : 'border-black/5 dark:border-white/5'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-nunito font-extrabold text-black dark:text-white text-sm">{msg.senderName}</span>
                        {!msg.read && <span className="w-2 h-2 bg-cyber-blue rounded-full animate-pulse" />}
                      </div>
                      <p className="font-nunito font-bold text-slate-600 dark:text-slate-300 text-xs leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                      <div className="flex items-center gap-1 text-[9px] font-nunito font-extrabold text-slate-400 uppercase tracking-wider">
                        <Calendar className="w-3 h-3" /><span>{formatDate(msg.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:self-start opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      {!msg.read && (
                        <button onClick={() => handleMarkAsRead(msg.id)} title="Okundu"
                          className="p-1.5 bg-cyber-emerald/10 text-cyber-emerald border border-cyber-emerald/20 hover:bg-cyber-emerald hover:text-black rounded-lg transition-all">
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => handleDelete(msg.id)} title="Sil"
                        className="p-1.5 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white rounded-lg transition-all">
                        <Trash2 className="w-4 h-4" />
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
