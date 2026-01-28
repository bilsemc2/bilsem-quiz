import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface AdminMessage {
  id: string;
  message: string;
  sender_id: string;
  created_at: string;
  sender_name?: string;
}

const AdminMessageNotification = () => {
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();

  // Don't show on profile page as it has its own message section
  const isProfilePage = location.pathname === '/profile';

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel('admin-messages-notif')
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
  }, []);

  useEffect(() => {
    if (messages.length > 0 && !isProfilePage) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [messages, isProfilePage]);

  const fetchMessages = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('admin_messages')
      .select(`
        *,
        sender:sender_id(name)
      `)
      .eq('receiver_id', user.id)
      .eq('read', false)
      .order('created_at', { ascending: false });

    if (data) {
      const formattedMessages = data.map(msg => ({
        ...msg,
        sender_name: (msg.sender && typeof msg.sender === 'object' && 'name' in msg.sender) ? (msg.sender as { name?: string }).name : undefined
      }));
      setMessages(formattedMessages);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('admin_messages')
        .update({ read: true })
        .eq('id', id);

      if (error) throw error;

      // Local state'i hemen güncelle
      setMessages(prev => prev.filter(msg => msg.id !== id));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const currentMessage = messages[0];

  if (!isVisible || !currentMessage) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.8 }}
        className="fixed bottom-6 right-6 z-[100] max-w-[320px] w-full"
      >
        <div className="relative group">
          {/* Unread Count Badge */}
          {messages.length > 1 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -left-2 w-6 h-6 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-slate-900 z-10 shadow-lg"
            >
              {messages.length}
            </motion.div>
          )}

          {/* Main Card */}
          <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 overflow-hidden">
            {/* Gradient Glow */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl" />

            <div className="relative flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
                <Bell className="w-5 h-5 text-white animate-bounce" />
              </div>

              <div className="flex-1 min-w-0 pr-6">
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">
                  Yeni Duyuru
                </p>
                <h4 className="text-sm font-bold text-white truncate mb-1">
                  {currentMessage.sender_name || 'Eğitmeninizden'}
                </h4>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                  {currentMessage.message}
                </p>

                <Link
                  to="/profile"
                  onClick={() => handleMarkAsRead(currentMessage.id)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-all"
                >
                  Mesajı Oku
                  <ChevronRight size={14} />
                </Link>
              </div>

              {/* Close Button */}
              <button
                onClick={() => handleMarkAsRead(currentMessage.id)}
                className="absolute -top-1 -right-1 p-1 text-slate-500 hover:text-white transition-colors"
                title="Kapat"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AdminMessageNotification;
