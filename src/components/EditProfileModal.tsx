import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, RefreshCw, User } from 'lucide-react';
import { toast } from 'sonner';
import { updateEditableProfile } from '@/features/profile/model/profileUseCases';

// ═══════════════════════════════════════════════
// ✏️ EditProfileModal — Kid-UI Çocuk Dostu Tasarım
// ═══════════════════════════════════════════════

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
      const updated = await updateEditableProfile({
        name: formData.name,
        school: formData.school,
        avatar_url: formData.avatar_url
      });

      if (!updated) {
        toast.error('Kullanıcı oturumu bulunamadı');
        return;
      }

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

  const inputCls =
    "w-full px-4 py-3 bg-gray-50 dark:bg-slate-700/50 border-2 border-black/10 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyber-blue/30 focus:border-cyber-blue/30 font-nunito font-bold text-sm text-black dark:text-white transition-all";

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl overflow-hidden shadow-neo-lg w-[90%] max-w-md z-50 transition-colors duration-300">
          {/* Accent Strip */}
          <div className="h-2 bg-cyber-pink" />

          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="font-nunito text-lg font-extrabold text-black dark:text-white flex items-center gap-2.5 uppercase tracking-tight">
                <div className="w-8 h-8 bg-cyber-pink/10 border-2 border-cyber-pink/20 rounded-xl flex items-center justify-center">
                  <User className="w-4 h-4 text-cyber-pink" />
                </div>
                Profili Düzenle
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="p-1.5 border-2 border-black/10 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg transition-all text-black dark:text-white">
                  <X className="w-4 h-4" />
                </button>
              </Dialog.Close>
            </div>

            <div className="space-y-5">
              {/* Avatar */}
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-gray-50 dark:bg-slate-700/30 border-2 border-black/5 dark:border-white/5 rounded-xl p-4 transition-colors">
                <img
                  src={formData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=default`}
                  alt="Avatar"
                  className="w-20 h-20 rounded-2xl border-3 border-black/10 shadow-neo-sm bg-white object-cover"
                />
                <div className="flex flex-col gap-1.5 items-center sm:items-start">
                  <button
                    onClick={generateNewAvatar}
                    className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-black/10 bg-cyber-gold text-black rounded-lg font-nunito font-extrabold text-xs shadow-neo-sm hover:shadow-neo-md transition-all uppercase tracking-wider"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Zar At
                  </button>
                  <p className="text-[9px] text-slate-400 font-nunito font-bold uppercase tracking-widest">Rastgele Avatar Üret</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block font-nunito font-extrabold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                    İsim
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block font-nunito font-extrabold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                    Okul
                  </label>
                  <input
                    type="text"
                    name="school"
                    value={formData.school}
                    onChange={handleChange}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block font-nunito font-extrabold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                    Sınıf 🔒
                  </label>
                  <input
                    type="text"
                    name="grade"
                    value={formData.grade}
                    disabled
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-slate-700 text-slate-400 border-2 border-black/5 dark:border-white/5 border-dashed rounded-xl cursor-not-allowed font-nunito font-bold text-sm"
                  />
                  <p className="text-[9px] uppercase font-nunito font-bold text-slate-400 mt-1.5">
                    Sınıf bilgisi sadece öğretmen tarafından değiştirilebilir
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2.5 mt-6">
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-gray-100 dark:bg-slate-700 text-black dark:text-white border-3 border-black/10 font-nunito font-extrabold rounded-xl shadow-neo-sm hover:shadow-neo-md transition-all uppercase text-xs tracking-wider"
              >
                Vazgeç
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2.5 bg-cyber-emerald text-black border-3 border-black/10 font-nunito font-extrabold rounded-xl shadow-neo-sm hover:shadow-neo-md transition-all disabled:opacity-50 uppercase text-xs tracking-wider"
              >
                {loading ? 'Yükleniyor...' : 'Değişiklikleri Uygula'}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default EditProfileModal;
