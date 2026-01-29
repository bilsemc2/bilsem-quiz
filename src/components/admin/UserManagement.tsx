import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';
import { Edit, Trash2, X, Loader2, Users, ChevronLeft, ChevronRight, Search, Key } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  name: string;
  points: number;
  experience: number;
  is_vip: boolean;
  is_active: boolean;
  grade?: number;
  referred_by?: string;
  yetenek_alani?: string[] | string;
  resim_analiz_hakki?: number;
  class_students?: {
    classes: { id: string; name: string; grade: number };
  }[];
}

const YETENEK_ALANLARI = [
  { value: 'genel yetenek', label: 'Genel Yetenek', isParent: true },
  { value: 'genel yetenek - tablet', label: '↳ Tablet Değerlendirme (1. Aşama)', parent: 'genel yetenek' },
  { value: 'genel yetenek - bireysel', label: '↳ Bireysel Değerlendirme (2. Aşama)', parent: 'genel yetenek' },
  { value: 'resim', label: 'Resim', isParent: true },
  { value: 'müzik', label: 'Müzik', isParent: true },
];

// yetenek_alani veritabanında JSON array olarak saklanıyor: ["genel yetenek", "resim"]
const parseYetenekAlani = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return [value];
    }
  }
  return [];
};

const formatYetenekAlani = (value: string[]): string[] | null => {
  if (!value || value.length === 0) return null;
  return value;
};

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '', email: '', points: 0, experience: 0, grade: 0, referred_by: '', yetenek_alani: [] as string[], resim_analiz_hakki: 3,
  });
  const [filters, setFilters] = useState({
    name: '', email: '', grade: '', showOnlyVip: false, yetenek_alani: '',
  });
  // Password reset state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordResetUser, setPasswordResetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);
  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles').select('*, class_students(classes(id, name, grade))').order('created_at', { ascending: false });
      if (error) throw error;
      setUsers(data || []);
      setFilteredUsers(data || []);
      setError(null);
    } catch (err) {
      console.error('Kullanıcılar yüklenirken hata:', err);
      setError('Kullanıcılar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Filtreleme - users değiştiğinde
  useEffect(() => {
    let result = [...users];
    if (filters.name) result = result.filter(u => u.name?.toLowerCase().includes(filters.name.toLowerCase()));
    if (filters.email) result = result.filter(u => u.email.toLowerCase().includes(filters.email.toLowerCase()));
    if (filters.grade) result = result.filter(u => u.grade === parseInt(filters.grade));
    if (filters.showOnlyVip) result = result.filter(u => u.is_vip);
    if (filters.yetenek_alani) {
      result = result.filter(u => {
        const yetenekler = parseYetenekAlani(u.yetenek_alani);
        return yetenekler.includes(filters.yetenek_alani);
      });
    }
    setFilteredUsers(result);
  }, [users, filters]);

  // Filtre değiştiğinde sayfayı sıfırla (users değiştiğinde değil)
  useEffect(() => {
    setPage(0);
  }, [filters]);

  const handleToggleVip = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('profiles').update({ is_vip: !currentStatus }).eq('id', userId);
      if (error) throw error;
      setUsers(users.map(u => u.id === userId ? { ...u, is_vip: !currentStatus } : u));
      toast.success('VIP durumu güncellendi');
    } catch {
      toast.error('Güncelleme hatası');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name || '', email: user.email || '', points: user.points || 0, experience: user.experience || 0,
      grade: user.grade || 0, referred_by: user.referred_by || '',
      yetenek_alani: parseYetenekAlani(user.yetenek_alani),
      resim_analiz_hakki: user.resim_analiz_hakki ?? 3,
    });
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingUser) return;
    try {
      const { error } = await supabase.from('profiles').update({
        name: editFormData.name,
        email: editFormData.email,
        points: editFormData.points,
        experience: editFormData.experience,
        grade: editFormData.grade,
        referred_by: editFormData.referred_by || null,
        yetenek_alani: formatYetenekAlani(editFormData.yetenek_alani),
        resim_analiz_hakki: editFormData.resim_analiz_hakki,
      }).eq('id', editingUser.id);

      if (error) throw error;

      // Optimistik güncelleme: Sadece düzenlenen kullanıcıyı local state'de güncelle
      setUsers(prev => prev.map(u =>
        u.id === editingUser.id
          ? {
            ...u,
            name: editFormData.name,
            email: editFormData.email,
            points: editFormData.points,
            experience: editFormData.experience,
            grade: editFormData.grade,
            referred_by: editFormData.referred_by,
            yetenek_alani: editFormData.yetenek_alani,
          }
          : u
      ));

      setEditDialogOpen(false);
      toast.success('Kullanıcı güncellendi');
    } catch {
      console.error('Güncelleme hatası');
      toast.error('Güncelleme hatası');
    }
  };

  const handleOpenDeleteDialog = (user: User) => {
    setDeletingUser(user);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    try {
      setDeleting(true);
      await supabase.from('profiles').delete().eq('id', deletingUser.id);
      setUsers(users.filter(u => u.id !== deletingUser.id));
      toast.success('Kullanıcı silindi');
      setDeleteDialogOpen(false);
      setDeletingUser(null);
    } catch {
      toast.error('Silme hatası');
    } finally {
      setDeleting(false);
    }
  };

  const handleResetAllXP = async () => {
    if (!window.confirm('TÜM KULLANICILARIN XP değerlerini sıfırlamak istediğinizden emin misiniz? Bu işlem geri alınamaz!')) return;
    if (!window.confirm('Bu işlemi ONAYLIYOR musunuz? Tüm XP\'ler 0 olacak!')) return;
    try {
      const { error } = await supabase.from('profiles').update({ experience: 0 }).gte('experience', 0);
      if (error) throw error;
      setUsers(users.map(u => ({ ...u, experience: 0 })));
      toast.success('Tüm XP değerleri sıfırlandı');
    } catch (err) {
      console.error('XP sıfırlama hatası:', err);
      toast.error('XP sıfırlama hatası');
    }
  };

  const handleOpenPasswordReset = (user: User) => {
    setPasswordResetUser(user);
    setNewPassword('');
    setPasswordDialogOpen(true);
  };

  const handleResetPassword = async () => {
    if (!passwordResetUser || !newPassword) return;
    if (newPassword.length < 6) {
      toast.error('Şifre en az 6 karakter olmalı');
      return;
    }
    try {
      setResettingPassword(true);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`${supabaseUrl}/functions/v1/admin-reset-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({
          targetUserId: passwordResetUser.id,
          newPassword: newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Şifre güncellenemedi');
      }

      toast.success(`${passwordResetUser.name || passwordResetUser.email} kullanıcısının şifresi güncellendi`);
      setPasswordDialogOpen(false);
      setNewPassword('');
      setPasswordResetUser(null);
    } catch (err: unknown) {
      console.error('Şifre sıfırlama hatası:', err);
      toast.error(err instanceof Error ? err.message : 'Şifre sıfırlama hatası');
    } finally {
      setResettingPassword(false);
    }
  };

  const paginatedUsers = filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);

  const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      type="button"
      onClick={onChange}
      className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-indigo-500' : 'bg-slate-300'}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );

  if (loading) return <div className="flex justify-center items-center min-h-[400px]"><Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /></div>;
  if (error) return <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">{error}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
        <Users className="w-6 h-6 text-indigo-500" />
        Kullanıcı Yönetimi
      </h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white rounded-xl p-4 shadow-sm items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="İsim ara..." value={filters.name} onChange={(e) => setFilters(p => ({ ...p, name: e.target.value }))}
            className="pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none w-40" />
        </div>
        <input type="text" placeholder="E-posta ara..." value={filters.email} onChange={(e) => setFilters(p => ({ ...p, email: e.target.value }))}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none w-40" />
        <input type="number" placeholder="Sınıf" value={filters.grade} onChange={(e) => setFilters(p => ({ ...p, grade: e.target.value }))}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none w-20" />
        <select value={filters.showOnlyVip ? 'true' : 'false'} onChange={(e) => setFilters(p => ({ ...p, showOnlyVip: e.target.value === 'true' }))}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none">
          <option value="false">Tüm VIP</option>
          <option value="true">Sadece VIP</option>
        </select>
        <select value={filters.yetenek_alani} onChange={(e) => setFilters(p => ({ ...p, yetenek_alani: e.target.value }))}
          className="px-3 py-2 border border-indigo-200 rounded-lg text-sm focus:border-indigo-500 outline-none bg-indigo-50">
          <option value="">Tüm Yetenek Alanları</option>
          {YETENEK_ALANLARI.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <div className="flex-1" />
        <button
          onClick={handleResetAllXP}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Tüm XP Sıfırla
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-3 px-4 font-bold text-slate-600 uppercase text-xs">Ad Soyad</th>
                <th className="text-left py-3 px-4 font-bold text-slate-600 uppercase text-xs">E-posta</th>
                <th className="text-right py-3 px-4 font-bold text-slate-600 uppercase text-xs">Puan</th>
                <th className="text-right py-3 px-4 font-bold text-slate-600 uppercase text-xs">XP</th>
                <th className="text-center py-3 px-4 font-bold text-slate-600 uppercase text-xs">VIP</th>
                <th className="text-center py-3 px-4 font-bold text-slate-600 uppercase text-xs">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedUsers.map((user, idx) => (
                <motion.tr key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-medium text-slate-800">{user.name || '-'}</td>
                  <td className="py-3 px-4 text-slate-600">{user.email}</td>
                  <td className="py-3 px-4 text-right"><span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded font-bold">{user.points}</span></td>
                  <td className="py-3 px-4 text-right"><span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded font-bold">{user.experience}</span></td>
                  <td className="py-3 px-4 text-center"><ToggleSwitch checked={user.is_vip} onChange={() => handleToggleVip(user.id, user.is_vip)} /></td>
                  <td className="py-3 px-4">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => handleEdit(user)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Düzenle"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleOpenPasswordReset(user)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg" title="Şifre Sıfırla"><Key className="w-4 h-4" /></button>
                      <button onClick={() => handleOpenDeleteDialog(user)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Sil"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>Sayfa:</span>
            <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
              className="px-2 py-1 border border-slate-300 rounded text-sm">
              {[5, 10, 25].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">{page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, filteredUsers.length)} / {filteredUsers.length}</span>
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="p-1 rounded hover:bg-slate-200 disabled:opacity-50"><ChevronLeft className="w-5 h-5" /></button>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="p-1 rounded hover:bg-slate-200 disabled:opacity-50"><ChevronRight className="w-5 h-5" /></button>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog.Root open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
          <Dialog.Content aria-describedby={undefined} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto z-50">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-xl font-bold text-slate-900">Kullanıcı Düzenle</Dialog.Title>
              <Dialog.Close asChild><button className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-600" /></button></Dialog.Close>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-1">Ad Soyad</label>
                  <input type="text" value={editFormData.name} onChange={(e) => setEditFormData(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-indigo-500 text-slate-900 font-medium outline-none placeholder:text-slate-400" placeholder="Kullanıcı adı" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-1">E-posta</label>
                  <input type="email" value={editFormData.email} onChange={(e) => setEditFormData(p => ({ ...p, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-indigo-500 text-slate-900 font-medium outline-none placeholder:text-slate-400" placeholder="Email adresi" />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-1">Puan</label>
                  <input type="number" value={editFormData.points} onChange={(e) => setEditFormData(p => ({ ...p, points: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-indigo-500 text-slate-900 font-bold outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-1">XP</label>
                  <input type="number" value={editFormData.experience} onChange={(e) => setEditFormData(p => ({ ...p, experience: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-indigo-500 text-slate-900 font-bold outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-1">Sınıf</label>
                  <input type="number" value={editFormData.grade} onChange={(e) => setEditFormData(p => ({ ...p, grade: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-indigo-500 text-slate-900 font-bold outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-pink-600 mb-1">🎨 Analiz Hakkı</label>
                  <input type="number" value={editFormData.resim_analiz_hakki} onChange={(e) => setEditFormData(p => ({ ...p, resim_analiz_hakki: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-pink-300 rounded-lg focus:border-pink-500 text-slate-900 font-bold outline-none bg-pink-50" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">Yetenek Alanları</label>
                <div className="flex flex-wrap gap-3">
                  {YETENEK_ALANLARI.map(opt => (
                    <label key={opt.value} className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition border ${editFormData.yetenek_alani.includes(opt.value) ? 'bg-indigo-50 border-indigo-300' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <input
                        type="checkbox"
                        checked={editFormData.yetenek_alani.includes(opt.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditFormData(p => ({ ...p, yetenek_alani: [...p.yetenek_alani, opt.value] }));
                          } else {
                            setEditFormData(p => ({ ...p, yetenek_alani: p.yetenek_alani.filter(v => v !== opt.value) }));
                          }
                        }}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${editFormData.yetenek_alani.includes(opt.value) ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'}`}>
                        {editFormData.yetenek_alani.includes(opt.value) && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm font-medium text-slate-900">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-1">Referans Kodu</label>
                <input type="text" value={editFormData.referred_by} onChange={(e) => setEditFormData(p => ({ ...p, referred_by: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-indigo-500 text-slate-900 font-medium outline-none placeholder:text-slate-400" placeholder="Referans kodu" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <Dialog.Close asChild><button className="px-5 py-2 text-slate-700 font-medium hover:bg-slate-100 rounded-lg transition-colors">İptal</button></Dialog.Close>
              <button onClick={handleSave} className="px-8 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all active:scale-95">Kaydet</button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Password Reset Dialog */}
      <Dialog.Root open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
          <Dialog.Content aria-describedby={undefined} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md z-50">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-500" />
                Şifre Sıfırla
              </Dialog.Title>
              <Dialog.Close asChild><button className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-600" /></button></Dialog.Close>
            </div>
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  <strong>{passwordResetUser?.name || passwordResetUser?.email}</strong> kullanıcısının şifresini değiştiriyorsunuz.
                </p>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-1">Yeni Şifre</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="En az 6 karakter"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-amber-500 text-slate-900 font-medium outline-none placeholder:text-slate-400"
                  minLength={6}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Dialog.Close asChild>
                <button className="px-5 py-2 text-slate-700 font-medium hover:bg-slate-100 rounded-lg transition-colors">
                  İptal
                </button>
              </Dialog.Close>
              <button
                onClick={handleResetPassword}
                disabled={resettingPassword || newPassword.length < 6}
                className="px-6 py-2 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600 shadow-md shadow-amber-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {resettingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
                Şifreyi Güncelle
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Confirmation Dialog */}
      <Dialog.Root open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
          <Dialog.Content aria-describedby={undefined} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md z-50">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-xl font-bold text-red-600 flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Kullanıcıyı Sil
              </Dialog.Title>
              <Dialog.Close asChild><button className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-600" /></button></Dialog.Close>
            </div>
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-slate-800 mb-2">
                  <strong>{deletingUser?.name || deletingUser?.email}</strong> kullanıcısını silmek istediğinizden emin misiniz?
                </p>
                <p className="text-sm text-red-600 font-medium">
                  ⚠️ Bu işlem geri alınamaz!
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Dialog.Close asChild>
                <button className="px-5 py-2 text-slate-700 font-medium hover:bg-slate-100 rounded-lg transition-colors">
                  Vazgeç
                </button>
              </Dialog.Close>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-6 py-2 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 shadow-md shadow-red-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Evet, Sil
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};

export default UserManagement;
