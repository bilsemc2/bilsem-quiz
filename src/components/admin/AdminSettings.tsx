import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, Info, ToggleLeft, ToggleRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface Settings {
  allowRegistration: boolean;
  maintenanceMode: boolean;
  notificationEmail: string;
  maxClassSize: number;
  maxQuizAttempts: number;
  quizTimeLimit: number;
  pageXpRequirement: number;
}

const AdminSettings = () => {
  const [settings, setSettings] = useState<Settings>({
    allowRegistration: true,
    maintenanceMode: false,
    notificationEmail: '',
    maxClassSize: 30,
    maxQuizAttempts: 3,
    quizTimeLimit: 60,
    pageXpRequirement: 10,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('settings')
        .upsert([{ id: 1, ...settings }]);

      if (error) throw error;
      toast.success('Ayarlar başarıyla kaydedildi');
    } catch (err) {
      console.error('Ayarlar kaydedilirken hata:', err);
      toast.error('Ayarlar kaydedilirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const ToggleSwitch = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
    <label className="flex items-center justify-between cursor-pointer group">
      <span className="text-slate-700 font-medium">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-6 rounded-full transition-colors ${checked ? 'bg-indigo-500' : 'bg-slate-300'}`}
      >
        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-7' : 'translate-x-1'}`} />
      </button>
    </label>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
        <Settings className="w-6 h-6 text-indigo-500" />
        Sistem Ayarları
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Genel Ayarlar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <h2 className="text-lg font-bold text-slate-800 mb-4">Genel Ayarlar</h2>
          <div className="space-y-5">
            <ToggleSwitch
              checked={settings.allowRegistration}
              onChange={(v) => setSettings(prev => ({ ...prev, allowRegistration: v }))}
              label="Yeni Kayıtlara İzin Ver"
            />
            <ToggleSwitch
              checked={settings.maintenanceMode}
              onChange={(v) => setSettings(prev => ({ ...prev, maintenanceMode: v }))}
              label="Bakım Modu"
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Bildirim E-postası</label>
              <input
                type="email"
                value={settings.notificationEmail}
                onChange={(e) => setSettings(prev => ({ ...prev, notificationEmail: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                placeholder="admin@example.com"
              />
              <p className="text-xs text-slate-500 mt-1">Sistem bildirimleri bu e-posta adresine gönderilecek</p>
            </div>
          </div>
        </motion.div>

        {/* Sınıf ve Quiz Ayarları */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <h2 className="text-lg font-bold text-slate-800 mb-4">Sınıf ve Quiz Ayarları</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Maksimum Sınıf Mevcudu</label>
              <input
                type="number"
                min={1}
                value={settings.maxClassSize}
                onChange={(e) => setSettings(prev => ({ ...prev, maxClassSize: parseInt(e.target.value) || 0 }))}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Maksimum Quiz Deneme Sayısı</label>
              <input
                type="number"
                min={1}
                value={settings.maxQuizAttempts}
                onChange={(e) => setSettings(prev => ({ ...prev, maxQuizAttempts: parseInt(e.target.value) || 0 }))}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Quiz Zaman Sınırı (dakika)</label>
              <input
                type="number"
                min={1}
                value={settings.quizTimeLimit}
                onChange={(e) => setSettings(prev => ({ ...prev, quizTimeLimit: parseInt(e.target.value) || 0 }))}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Sayfa XP Gereksinimi</label>
              <input
                type="number"
                min={0}
                value={settings.pageXpRequirement}
                onChange={(e) => setSettings(prev => ({ ...prev, pageXpRequirement: parseInt(e.target.value) || 0 }))}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
              />
              <p className="text-xs text-slate-500 mt-1">Bir sayfaya girmek için gereken minimum XP miktarı</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-500 text-white font-medium rounded-xl hover:bg-indigo-600 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
        </button>
      </div>

      {/* Info Alert */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700">
          Not: Bazı ayarlar değiştirildikten sonra sistemin yeniden başlatılması gerekebilir.
        </p>
      </div>
    </div>
  );
};

export default AdminSettings;
