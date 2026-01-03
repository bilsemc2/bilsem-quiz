import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit, X, Loader2, Zap } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { XPRequirement } from '../../types/xpRequirements';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

export default function XPRequirementsManagement() {
  const { user } = useAuth();
  const [requirements, setRequirements] = useState<XPRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRequirement, setNewRequirement] = useState({
    page_path: '',
    required_xp: 0,
    description: ''
  });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<XPRequirement | null>(null);
  const [editFormData, setEditFormData] = useState({
    page_path: '',
    required_xp: 0,
    description: ''
  });

  const checkIsAdmin = async () => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      if (!profile?.is_admin) {
        toast.error('Bu sayfaya erişim yetkiniz yok');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Admin kontrolü yapılırken hata:', error);
      toast.error('Yetki kontrolü yapılamadı');
      return false;
    }
  };

  useEffect(() => {
    const fetchRequirements = async () => {
      try {
        const isAdmin = await checkIsAdmin();
        if (!isAdmin) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('xp_requirements')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          toast.error('XP gereksinimleri yüklenirken hata oluştu');
          throw error;
        }

        const validRequirements = (data || []).filter(req => req && req.page_path);
        setRequirements(validRequirements);
      } catch (error) {
        console.error('XP gereksinimleri yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequirements();
  }, []);

  const handleAddRequirement = async () => {
    if (!newRequirement.page_path || newRequirement.required_xp <= 0) {
      toast.warning('Lütfen tüm alanları doldurun');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('xp_requirements')
        .insert([{
          page_path: newRequirement.page_path,
          required_xp: newRequirement.required_xp,
          description: newRequirement.description || null
        }])
        .select()
        .single();

      if (error) throw error;

      setRequirements([data, ...requirements]);
      setNewRequirement({ page_path: '', required_xp: 0, description: '' });
      toast.success('XP gereksinimi başarıyla eklendi');
    } catch (error) {
      console.error('XP gereksinimi eklenirken hata:', error);
      toast.error('XP gereksinimi eklenirken hata oluştu');
    }
  };

  const handleDeleteRequirement = async (id: string) => {
    if (!window.confirm('Bu gereksinimi silmek istediğinizden emin misiniz?')) return;
    try {
      const { error } = await supabase
        .from('xp_requirements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setRequirements(requirements.filter(req => req.id !== id));
      toast.success('XP gereksinimi başarıyla silindi');
    } catch (error) {
      console.error('XP gereksinimi silinirken hata:', error);
      toast.error('XP gereksinimi silinirken hata oluştu');
    }
  };

  const handleEditClick = (requirement: XPRequirement) => {
    setEditingRequirement(requirement);
    setEditFormData({
      page_path: requirement.page_path,
      required_xp: requirement.required_xp,
      description: requirement.description || ''
    });
    setEditDialogOpen(true);
  };

  const handleUpdateRequirement = async () => {
    if (!editingRequirement?.id || !editFormData.page_path) {
      toast.error('Geçersiz güncelleme verisi');
      return;
    }

    try {
      const updateData = {
        page_path: editFormData.page_path,
        required_xp: editFormData.required_xp,
        description: editFormData.description || null
      };

      const { error } = await supabase
        .from('xp_requirements')
        .update(updateData)
        .eq('id', editingRequirement.id);

      if (error) throw error;

      setRequirements(prev =>
        prev.map(req =>
          req?.id === editingRequirement.id ? { ...editingRequirement, ...updateData } as XPRequirement : req
        ).filter((req): req is XPRequirement => Boolean(req && req.page_path))
      );

      toast.success('XP gereksinimi başarıyla güncellendi');
      setEditDialogOpen(false);
      setEditingRequirement(null);
    } catch (error) {
      console.error('XP gereksinimi güncellenirken hata:', error);
      toast.error('Güncelleme sırasında bir hata oluştu');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
        <Zap className="w-6 h-6 text-amber-500" />
        XP Gereksinimleri Yönetimi
      </h1>

      {/* Add New Requirement */}
      <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
        <h2 className="font-bold text-slate-700">Yeni Gereksinim Ekle</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Sayfa Yolu</label>
            <input
              type="text"
              value={newRequirement.page_path}
              onChange={(e) => setNewRequirement({ ...newRequirement, page_path: e.target.value })}
              placeholder="/quiz/123"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Gereken XP</label>
            <input
              type="number"
              min={0}
              value={newRequirement.required_xp}
              onChange={(e) => setNewRequirement({ ...newRequirement, required_xp: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Açıklama</label>
            <input
              type="text"
              value={newRequirement.description}
              onChange={(e) => setNewRequirement({ ...newRequirement, description: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
            />
          </div>
        </div>
        <button
          onClick={handleAddRequirement}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 text-white font-medium rounded-xl hover:bg-indigo-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Yeni Gereksinim Ekle
        </button>
      </div>

      {/* Requirements Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-4 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider">Sayfa Yolu</th>
                <th className="text-left py-4 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider">Gereken XP</th>
                <th className="text-left py-4 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider">Açıklama</th>
                <th className="text-center py-4 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requirements.filter(req => req && req.page_path).map((req, idx) => (
                <motion.tr
                  key={req.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="py-4 px-6 font-mono text-sm text-slate-700">{req.page_path}</td>
                  <td className="py-4 px-6">
                    <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full font-bold">{req.required_xp}</span>
                  </td>
                  <td className="py-4 px-6 text-slate-600">{req.description || '-'}</td>
                  <td className="py-4 px-6">
                    <div className="flex justify-center gap-1">
                      <button
                        onClick={() => handleEditClick(req)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRequirement(req.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog.Root open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md z-50">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-xl font-bold text-slate-800">XP Gereksinimini Düzenle</Dialog.Title>
              <Dialog.Close asChild>
                <button className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-500" /></button>
              </Dialog.Close>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Sayfa Yolu</label>
                <input
                  type="text"
                  value={editFormData.page_path}
                  onChange={(e) => setEditFormData({ ...editFormData, page_path: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Gereken XP</label>
                <input
                  type="number"
                  min={0}
                  value={editFormData.required_xp}
                  onChange={(e) => setEditFormData({ ...editFormData, required_xp: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Açıklama</label>
                <input
                  type="text"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Dialog.Close asChild>
                <button className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl">İptal</button>
              </Dialog.Close>
              <button onClick={handleUpdateRequirement} className="px-6 py-2.5 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600">
                Güncelle
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
