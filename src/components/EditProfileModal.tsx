import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, RefreshCw, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface EditProfileModalProps {
  open?: boolean;
  onClose: () => void;
  userData: {
    name: string;
    grade?: string;
    school?: string;
    email?: string;
    avatar_url?: string;
  };
  onUpdate?: () => void;
  onSave?: () => void;
}

const EditProfileModal = ({
  open = true,
  onClose,
  userData,
  onUpdate,
  onSave,
}: EditProfileModalProps) => {
  const [formData, setFormData] = useState({
    name: userData.name || '',
    school: userData.school || '',
    grade: userData.grade || '',
    avatar_url: userData.avatar_url || '',
  });
  const [loading, setLoading] = useState(false);

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
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Kullanıcı oturumu bulunamadı');
        return;
      }

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
      onUpdate?.();
      onSave?.();
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Profil güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const generateNewAvatar = async () => {
    const seed = Math.random().toString(36).substring(7);
    const newAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
    setFormData(prev => ({ ...prev, avatar_url: newAvatar }));
    toast.success('Yeni avatar oluşturuldu! Kaydetmek için "Kaydet" butonuna tıklayın.');
  };

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md z-50">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-500" />
              Profili Düzenle
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </Dialog.Close>
          </div>

          <div className="space-y-5">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <img
                src={formData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=default`}
                alt="Avatar"
                className="w-20 h-20 rounded-full border-4 border-indigo-100"
              />
              <button
                onClick={generateNewAvatar}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-medium hover:bg-indigo-100 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Yeni Avatar
              </button>
            </div>

            {/* Form Fields */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">İsim</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Okul</label>
              <input
                type="text"
                name="school"
                value={formData.school}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Sınıf</label>
              <input
                type="text"
                name="grade"
                value={formData.grade}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              İptal
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 bg-indigo-500 text-white font-medium rounded-xl hover:bg-indigo-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default EditProfileModal;
