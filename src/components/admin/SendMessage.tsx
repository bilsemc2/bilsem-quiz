import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Search, Users, Loader2, Check } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
}

const SendMessage = () => {
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
      setSelectedUsers(data?.map(user => user.id) || []);
      toast.success(`${data?.length || 0} öğrenci seçildi`);
      setOpenUserSearch(false);
    } catch (err) {
      console.error('Tüm kullanıcılar yüklenirken hata:', err);
      setError('Kullanıcılar yüklenemedi');
    } finally {
      setUserSearchLoading(false);
    }
  };

  // Hızlı filtre fonksiyonları
  const loadUsersByGrade = async (grade: number) => {
    setUserSearchLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('grade', grade)
        .order('name');

      if (error) throw error;
      setUsers(data || []);
      setSelectedUsers(prev => [...new Set([...prev, ...(data?.map(u => u.id) || [])])]);
      toast.success(`${data?.length || 0} öğrenci eklendi (${grade}. Sınıf)`);
    } catch (err) {
      console.error('Sınıf filtresi hatası:', err);
      toast.error('Kullanıcılar yüklenemedi');
    } finally {
      setUserSearchLoading(false);
    }
  };

  const loadVipUsers = async () => {
    setUserSearchLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('is_vip', true)
        .order('name');

      if (error) throw error;
      setUsers(data || []);
      setSelectedUsers(prev => [...new Set([...prev, ...(data?.map(u => u.id) || [])])]);
      toast.success(`${data?.length || 0} VIP öğrenci eklendi`);
    } catch (err) {
      console.error('VIP filtresi hatası:', err);
      toast.error('Kullanıcılar yüklenemedi');
    } finally {
      setUserSearchLoading(false);
    }
  };

  const loadUsersByYetenek = async (yetenek: string) => {
    setUserSearchLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, yetenek_alani')
        .order('name');

      if (error) throw error;

      // yetenek_alani JSON array olarak saklanıyor, bu yüzden client-side filtreleme yapıyoruz
      const filtered = (data || []).filter(u => {
        const yetenekler = Array.isArray(u.yetenek_alani) ? u.yetenek_alani : [];
        return yetenekler.includes(yetenek);
      });

      setUsers(filtered);
      setSelectedUsers(prev => [...new Set([...prev, ...filtered.map(u => u.id)])]);
      toast.success(`${filtered.length} öğrenci eklendi (${yetenek})`);
    } catch (err) {
      console.error('Yetenek filtresi hatası:', err);
      toast.error('Kullanıcılar yüklenemedi');
    } finally {
      setUserSearchLoading(false);
    }
  };

  const clearSelectedUsers = () => {
    setSelectedUsers([]);
    toast.success('Seçim temizlendi');
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
        <Send className="w-6 h-6 text-indigo-500" />
        Öğrencilere Mesaj Gönder
      </h1>

      {/* Hızlı Alıcı Filtreleri */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-700">Hızlı Seçim</h2>
          {selectedUsers.length > 0 && (
            <button
              onClick={clearSelectedUsers}
              className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Temizle ({selectedUsers.length})
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Sınıf Butonları */}
          <div className="flex gap-1 bg-white rounded-lg p-1 shadow-sm">
            {[1, 2, 3].map(grade => (
              <button
                key={grade}
                onClick={() => loadUsersByGrade(grade)}
                disabled={userSearchLoading}
                className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-indigo-100 hover:text-indigo-700 rounded-md transition disabled:opacity-50"
              >
                {grade}. Sınıf
              </button>
            ))}
          </div>

          {/* VIP */}
          <button
            onClick={loadVipUsers}
            disabled={userSearchLoading}
            className="px-3 py-1.5 text-sm font-medium bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg transition flex items-center gap-1 disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.54-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
            </svg>
            VIP
          </button>

          {/* Yetenek Alanları */}
          <div className="flex gap-1 bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => loadUsersByYetenek('genel yetenek')}
              disabled={userSearchLoading}
              className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-100 rounded-md transition disabled:opacity-50"
            >
              Genel Yetenek
            </button>
            <button
              onClick={() => loadUsersByYetenek('resim')}
              disabled={userSearchLoading}
              className="px-3 py-1.5 text-sm font-medium text-pink-600 hover:bg-pink-100 rounded-md transition disabled:opacity-50"
            >
              Resim
            </button>
            <button
              onClick={() => loadUsersByYetenek('müzik')}
              disabled={userSearchLoading}
              className="px-3 py-1.5 text-sm font-medium text-purple-600 hover:bg-purple-100 rounded-md transition disabled:opacity-50"
            >
              Müzik
            </button>
          </div>

          {/* Tüm Öğrenciler */}
          <button
            onClick={loadAllUsers}
            disabled={userSearchLoading}
            className="px-3 py-1.5 text-sm font-medium bg-indigo-500 text-white hover:bg-indigo-600 rounded-lg transition flex items-center gap-1 disabled:opacity-50"
          >
            {userSearchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
            Tümü
          </button>
        </div>

        {/* Seçili Kullanıcı Sayısı */}
        {selectedUsers.length > 0 && (
          <div className="mt-3 text-sm text-indigo-600 font-medium">
            ✔ {selectedUsers.length} alıcı seçili
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
        {/* Alıcı Seçimi */}
        <div>
          <Dialog.Root open={openUserSearch} onOpenChange={setOpenUserSearch}>
            <Dialog.Trigger asChild>
              <button className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2">
                <Search className="w-4 h-4" />
                Detaylı Ara
              </button>
            </Dialog.Trigger>

            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
              <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg max-h-[85vh] overflow-hidden z-50">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title className="text-xl font-bold text-slate-800">Alıcı Seç</Dialog.Title>
                  <Dialog.Close asChild>
                    <button className="p-1 hover:bg-slate-100 rounded-lg">
                      <X className="w-5 h-5 text-slate-500" />
                    </button>
                  </Dialog.Close>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="İsim ara..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                      />
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                    <button
                      onClick={loadUsers}
                      disabled={userSearchLoading}
                      className="px-4 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors disabled:opacity-50"
                    >
                      {userSearchLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Ara'}
                    </button>
                  </div>

                  <button
                    onClick={loadAllUsers}
                    disabled={userSearchLoading}
                    className="w-full px-4 py-2 border border-purple-300 text-purple-600 rounded-xl hover:bg-purple-50 transition-colors"
                  >
                    Tüm Öğrencileri Seç
                  </button>

                  <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl">
                    {users.length === 0 ? (
                      <div className="p-4 text-center text-slate-500">
                        Arama yapın veya tüm öğrencileri yükleyin
                      </div>
                    ) : (
                      <ul className="divide-y divide-slate-100">
                        {users.map((u) => (
                          <li
                            key={u.id}
                            onClick={() => toggleUser(u.id)}
                            className={`p-3 cursor-pointer hover:bg-slate-50 flex items-center justify-between ${selectedUsers.includes(u.id) ? 'bg-indigo-50' : ''
                              }`}
                          >
                            <div>
                              <div className="font-medium text-slate-700">{u.name}</div>
                              <div className="text-sm text-slate-500">{u.email}</div>
                            </div>
                            {selectedUsers.includes(u.id) && (
                              <Check className="w-5 h-5 text-indigo-600" />
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <Dialog.Close asChild>
                    <button className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl">
                      İptal
                    </button>
                  </Dialog.Close>
                  <Dialog.Close asChild>
                    <button className="px-4 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600">
                      Tamam
                    </button>
                  </Dialog.Close>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>

          {/* Seçili Kullanıcılar */}
          <div className="flex flex-wrap gap-2 mt-3">
            {selectedUsers.length > 0 ? (
              selectedUsers.slice(0, 10).map(userId => {
                const selectedUser = users.find(u => u.id === userId);
                return (
                  <motion.span
                    key={userId}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
                  >
                    {selectedUser?.name || userId.slice(0, 8)}
                    <button
                      onClick={() => setSelectedUsers(prev => prev.filter(id => id !== userId))}
                      className="hover:bg-indigo-200 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.span>
                );
              })
            ) : (
              <span className="text-slate-500">Alıcı seçilmedi</span>
            )}
            {selectedUsers.length > 10 && (
              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm">
                +{selectedUsers.length - 10} daha
              </span>
            )}
          </div>
        </div>

        {/* Konu */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Konu</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Mesaj konusu..."
            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
          />
        </div>

        {/* Mesaj */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Mesaj</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Mesajınızı yazın..."
            rows={6}
            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none resize-none"
          />
        </div>

        {/* Hata Mesajı */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gönder Butonu */}
        <button
          onClick={handleSendMessage}
          disabled={sending || !message.trim() || selectedUsers.length === 0}
          className="w-full sm:w-auto px-6 py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
        >
          {sending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Gönderiliyor...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Mesaj Gönder
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SendMessage;
