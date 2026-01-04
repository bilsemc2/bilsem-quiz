import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit, X, Loader2, Ticket, ArrowLeft, Calendar, Zap, Users, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

interface PromoCode {
    id: string;
    code: string;
    xp_reward: number;
    max_uses: number;
    current_uses: number;
    expires_at: string | null;
    created_at: string;
}

export default function PromoCodeManagement() {
    const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [newCode, setNewCode] = useState({
        code: '',
        xp_reward: 50,
        max_uses: 100,
        expires_at: ''
    });

    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingCode, setEditingCode] = useState<PromoCode | null>(null);
    const [editFormData, setEditFormData] = useState({
        code: '',
        xp_reward: 0,
        max_uses: 0,
        expires_at: ''
    });

    const [usageDialogOpen, setUsageDialogOpen] = useState(false);
    const [usageList, setUsageList] = useState<any[]>([]);
    const [fetchingUsage, setFetchingUsage] = useState(false);
    const [selectedCodeName, setSelectedCodeName] = useState('');

    const fetchPromoCodes = async () => {
        try {
            const { data, error } = await supabase
                .from('promo_codes')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPromoCodes(data || []);
        } catch (error) {
            console.error('Promo kodlar yüklenirken hata:', error);
            toast.error('Kodlar yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPromoCodes();
    }, []);

    const handleAddCode = async () => {
        if (!newCode.code || newCode.xp_reward <= 0) {
            toast.warning('Lütfen gerekli alanları doldurun');
            return;
        }

        try {
            // 1. Kodun benzersiz olduğunu kontrol et
            const { data: existing } = await supabase
                .from('promo_codes')
                .select('id')
                .eq('code', newCode.code.toUpperCase().trim())
                .maybeSingle();

            if (existing) {
                toast.error('Bu kod zaten tanımlanmış.');
                return;
            }

            const { data, error } = await supabase
                .from('promo_codes')
                .insert([{
                    code: newCode.code.toUpperCase().trim(),
                    xp_reward: newCode.xp_reward,
                    max_uses: newCode.max_uses,
                    expires_at: newCode.expires_at || null
                }])
                .select()
                .single();

            if (error) throw error;

            setPromoCodes([data, ...promoCodes]);
            setNewCode({ code: '', xp_reward: 50, max_uses: 100, expires_at: '' });
            toast.success('Promo kod başarıyla oluşturuldu');
        } catch (error: any) {
            console.error('Kod eklenirken hata:', error);
            toast.error(`Kod eklenemedi: ${error.message || 'Bir hata oluştu'}`);
        }
    };

    const handleDeleteCode = async (id: string) => {
        if (!window.confirm('Bu kodu silmek istediğinizden emin misiniz?')) return;
        try {
            const { error } = await supabase
                .from('promo_codes')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setPromoCodes(promoCodes.filter(c => c.id !== id));
            toast.success('Kod silindi');
        } catch (error) {
            toast.error('Silme işlemi başarısız');
        }
    };

    const handleEditClick = (code: PromoCode) => {
        setEditingCode(code);
        setEditFormData({
            code: code.code,
            xp_reward: code.xp_reward,
            max_uses: code.max_uses,
            expires_at: code.expires_at ? new Date(code.expires_at).toISOString().split('T')[0] : ''
        });
        setEditDialogOpen(true);
    };

    const handleUpdateCode = async () => {
        if (!editingCode?.id || !editFormData.code) return;

        try {
            const updateData = {
                code: editFormData.code.toUpperCase().trim(),
                xp_reward: editFormData.xp_reward,
                max_uses: editFormData.max_uses,
                expires_at: editFormData.expires_at || null
            };

            const { error } = await supabase
                .from('promo_codes')
                .update(updateData)
                .eq('id', editingCode.id);

            if (error) throw error;

            setPromoCodes(prev =>
                prev.map(c => c?.id === editingCode.id ? { ...c, ...updateData } : c)
            );

            toast.success('Kod güncellendi');
            setEditDialogOpen(false);
        } catch (error: any) {
            console.error('Kod güncellenirken hata:', error);
            toast.error(`Güncelleme başarısız: ${error.message || 'Bir hata oluştu'}`);
        }
    };

    const handleViewUsage = async (code: PromoCode) => {
        setSelectedCodeName(code.code);
        setUsageDialogOpen(true);
        setFetchingUsage(true);
        try {
            const { data, error } = await supabase
                .from('promo_code_usage')
                .select(`
                    id,
                    used_at,
                    profiles (
                        name,
                        email,
                        avatar_url
                    )
                `)
                .eq('promo_code_id', code.id)
                .order('used_at', { ascending: false });

            if (error) throw error;
            setUsageList(data || []);
        } catch (error) {
            console.error('Kullanım verileri yüklenirken hata:', error);
            toast.error('Kullanım listesi yüklenemedi');
        } finally {
            setFetchingUsage(false);
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
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        to="/admin"
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors group"
                    >
                        <ArrowLeft className="w-6 h-6 text-slate-600 group-hover:text-indigo-600" />
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Ticket className="w-6 h-6 text-indigo-500" />
                        Promo Kod Yönetimi
                    </h1>
                </div>
            </div>

            {/* Yeni Kod Ekle */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
                <h2 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Yeni Kod Oluştur
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-500 uppercase">Kod Metni</label>
                        <input
                            type="text"
                            value={newCode.code}
                            onChange={(e) => setNewCode({ ...newCode, code: e.target.value.toUpperCase() })}
                            placeholder="BILSEM2026"
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all uppercase font-mono"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-500 uppercase">XP Ödülü</label>
                        <input
                            type="number"
                            value={newCode.xp_reward}
                            onChange={(e) => setNewCode({ ...newCode, xp_reward: parseInt(e.target.value) || 0 })}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-500 uppercase">Kullanım Limiti</label>
                        <input
                            type="number"
                            value={newCode.max_uses}
                            onChange={(e) => setNewCode({ ...newCode, max_uses: parseInt(e.target.value) || 0 })}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-500 uppercase">Son Kullanma (Opsiyonel)</label>
                        <input
                            type="date"
                            value={newCode.expires_at}
                            onChange={(e) => setNewCode({ ...newCode, expires_at: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                        />
                    </div>
                </div>

                <button
                    onClick={handleAddCode}
                    className="w-full md:w-auto px-8 py-3 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                >
                    <Plus className="w-5 h-5" /> Kod Oluştur
                </button>
            </div>

            {/* Kod Listesi */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200 text-left">
                            <tr>
                                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase">Kod</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase">XP Ödülü</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase">Kullanım</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase">Durum</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {promoCodes.map((code) => {
                                if (!code) return null;
                                const isExpired = code.expires_at && new Date(code.expires_at) < new Date();
                                const isFull = code.current_uses >= code.max_uses;

                                return (
                                    <motion.tr
                                        key={code.id}
                                        className="hover:bg-slate-50 transition-colors"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-slate-100 rounded-lg">
                                                    <Ticket className="w-4 h-4 text-slate-500" />
                                                </div>
                                                <span className="font-mono font-bold text-slate-900">{code.code}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                                                <Zap className="w-4 h-4" /> +{code.xp_reward}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <Users className="w-4 h-4 text-slate-400" />
                                                {code.current_uses} / {code.max_uses}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            {isExpired ? (
                                                <span className="px-2 py-1 bg-red-100 text-red-600 rounded-lg text-xs font-bold flex items-center gap-1 w-fit">
                                                    <Calendar className="w-3 h-3" /> SÜRESİ DOLDU
                                                </span>
                                            ) : isFull ? (
                                                <span className="px-2 py-1 bg-amber-100 text-amber-600 rounded-lg text-xs font-bold flex items-center gap-1 w-fit">
                                                    LİMİT DOLDU
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 bg-emerald-100 text-emerald-600 rounded-lg text-xs font-bold flex items-center gap-1 w-fit">
                                                    AKTİF
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleViewUsage(code)}
                                                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                    title="Kullanımları Gör"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEditClick(code)}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                    title="Düzenle"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteCode(code.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Sil"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Düzenleme Dialoğu */}
            <Dialog.Root open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 animate-in fade-in" />
                    <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl shadow-2xl p-8 w-full max-w-lg z-50 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-8">
                            <Dialog.Title className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                <Edit className="w-6 h-6 text-indigo-500" /> Kod Düzenle
                            </Dialog.Title>
                            <Dialog.Close asChild>
                                <button className="p-2 hover:bg-slate-100 rounded-full transition-all group">
                                    <X className="w-6 h-6 text-slate-400 group-hover:text-slate-600" />
                                </button>
                            </Dialog.Close>
                        </div>

                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 uppercase">Kod Metni</label>
                                <input
                                    type="text"
                                    value={editFormData.code}
                                    onChange={(e) => setEditFormData({ ...editFormData, code: e.target.value.toUpperCase() })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-mono font-bold text-slate-900"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 uppercase">XP Ödülü</label>
                                    <input
                                        type="number"
                                        value={editFormData.xp_reward}
                                        onChange={(e) => setEditFormData({ ...editFormData, xp_reward: parseInt(e.target.value) || 0 })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 uppercase">Üst Limit</label>
                                    <input
                                        type="number"
                                        value={editFormData.max_uses}
                                        onChange={(e) => setEditFormData({ ...editFormData, max_uses: parseInt(e.target.value) || 0 })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 uppercase">Son Kullanma Tarihi</label>
                                <input
                                    type="date"
                                    value={editFormData.expires_at}
                                    onChange={(e) => setEditFormData({ ...editFormData, expires_at: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 mt-10">
                            <Dialog.Close asChild>
                                <button className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-2xl transition-all border border-slate-100">
                                    İptal
                                </button>
                            </Dialog.Close>
                            <button
                                onClick={handleUpdateCode}
                                className="flex-[2] py-3 bg-indigo-500 text-white font-bold rounded-2xl hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-100"
                            >
                                Değişiklikleri Kaydet
                            </button>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            {/* Kullanım Listesi Dialoğu */}
            <Dialog.Root open={usageDialogOpen} onOpenChange={setUsageDialogOpen}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 animate-in fade-in" />
                    <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl shadow-2xl p-8 w-full max-w-2xl z-50 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
                        <div className="flex items-center justify-between mb-6">
                            <Dialog.Title className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                <Users className="w-6 h-6 text-emerald-500" />
                                <span className="font-mono text-indigo-600">{selectedCodeName}</span> Kullanımları
                            </Dialog.Title>
                            <Dialog.Close asChild>
                                <button className="p-2 hover:bg-slate-100 rounded-full transition-all group">
                                    <X className="w-6 h-6 text-slate-400 group-hover:text-slate-600" />
                                </button>
                            </Dialog.Close>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {fetchingUsage ? (
                                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                    <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                                    <p className="text-slate-500 font-medium">Yükleniyor...</p>
                                </div>
                            ) : usageList.length > 0 ? (
                                <table className="w-full">
                                    <thead className="bg-slate-50 sticky top-0 z-10">
                                        <tr>
                                            <th className="py-3 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Öğrenci</th>
                                            <th className="py-3 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">E-posta</th>
                                            <th className="py-3 px-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Tarih</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {usageList.map((usage, idx) => {
                                            const profile = usage.profiles;
                                            return (
                                                <motion.tr
                                                    key={usage.id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className="hover:bg-slate-50 transition-colors"
                                                >
                                                    <td className="py-3 px-4 font-medium text-slate-900">
                                                        <div className="flex items-center gap-3">
                                                            <img
                                                                src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.email}`}
                                                                alt=""
                                                                className="w-8 h-8 rounded-full bg-slate-100"
                                                            />
                                                            <span className="truncate max-w-[150px]">{profile?.name || 'İsimsiz'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-500 text-sm italic">
                                                        <span className="truncate max-w-[200px] block">{profile?.email || '-'}</span>
                                                    </td>
                                                    <td className="py-3 px-4 text-right text-slate-400 text-xs">
                                                        {new Date(usage.used_at).toLocaleString('tr-TR', {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                                        <Users className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <p className="text-slate-500 font-medium text-center">
                                        Bu kod henüz hiç kullanılmamış.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                            <Dialog.Close asChild>
                                <button className="px-6 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all">
                                    Kapat
                                </button>
                            </Dialog.Close>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </div>
    );
}