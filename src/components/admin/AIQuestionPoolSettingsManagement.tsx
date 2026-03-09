import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit, X, Loader2, ArrowLeft, Brain, Upload, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/auth/useAuth';
import { authRepository } from '@/server/repositories/authRepository';
import { isAdminProfile } from '@/features/admin/model/xpRequirementsUseCases';
import {
    aiQuestionPoolSettingsRepository,
    type AIQuestionPoolLocale,
    type AIQuestionPoolSettings
} from '../../server/repositories/aiQuestionPoolSettingsRepository';

interface SettingsForm {
    topic: string;
    locale: AIQuestionPoolLocale;
    maxServedCount: number;
    targetPoolSize: number;
    refillBatchSize: number;
    isActive: boolean;
}

const DEFAULT_FORM: SettingsForm = {
    topic: '*',
    locale: '*',
    maxServedCount: 2,
    targetPoolSize: 12,
    refillBatchSize: 5,
    isActive: true
};

export default function AIQuestionPoolSettingsManagement() {
    const { user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false);
    const [settings, setSettings] = useState<AIQuestionPoolSettings[]>([]);
    const [newSetting, setNewSetting] = useState<SettingsForm>(DEFAULT_FORM);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingSetting, setEditingSetting] = useState<AIQuestionPoolSettings | null>(null);
    const [editForm, setEditForm] = useState<SettingsForm>(DEFAULT_FORM);

    const checkIsAdmin = useCallback(async () => {
        if (!user?.id) {
            return false;
        }

        try {
            const profile = await authRepository.getProfileByUserId(user.id);

            if (!isAdminProfile(profile)) {
                toast.error('Bu sayfaya erişim yetkiniz yok');
                return false;
            }
            return true;
        } catch (error) {
            console.error('Admin kontrolü yapılamadı:', error);
            toast.error('Yetki kontrolü yapılamadı');
            return false;
        }
    }, [user?.id]);

    const fetchSettings = useCallback(async () => {
        try {
            const rows = await aiQuestionPoolSettingsRepository.listSettings();
            setSettings(rows);
        } catch (error) {
            console.error('Ayarlar yüklenemedi:', error);
            toast.error('Ayarlar yüklenirken hata oluştu');
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            try {
                const isAdmin = await checkIsAdmin();
                if (!isAdmin) {
                    setLoading(false);
                    return;
                }
                await fetchSettings();
            } finally {
                setLoading(false);
            }
        };

        void init();
    }, [checkIsAdmin, fetchSettings]);

    const normalizeForm = (form: SettingsForm): SettingsForm => ({
        topic: form.topic.trim() || '*',
        locale: form.locale,
        maxServedCount: Math.max(1, Math.round(form.maxServedCount)),
        targetPoolSize: Math.max(1, Math.round(form.targetPoolSize)),
        refillBatchSize: Math.max(1, Math.round(form.refillBatchSize)),
        isActive: form.isActive
    });

    const handleCreateOrUpsert = async () => {
        try {
            const normalized = normalizeForm(newSetting);
            await aiQuestionPoolSettingsRepository.upsertSetting(normalized);
            toast.success('Ayar kaydedildi');
            setNewSetting(DEFAULT_FORM);
            await fetchSettings();
        } catch (error) {
            console.error('Ayar kaydedilemedi:', error);
            toast.error('Ayar kaydedilirken hata oluştu');
        }
    };

    const handleEditClick = (item: AIQuestionPoolSettings) => {
        setEditingSetting(item);
        setEditForm({
            topic: item.topic,
            locale: item.locale,
            maxServedCount: item.maxServedCount,
            targetPoolSize: item.targetPoolSize,
            refillBatchSize: item.refillBatchSize,
            isActive: item.isActive
        });
        setEditDialogOpen(true);
    };

    const handleUpdate = async () => {
        if (!editingSetting) {
            return;
        }

        try {
            const normalized = normalizeForm(editForm);
            await aiQuestionPoolSettingsRepository.upsertSetting({
                ...normalized,
                id: editingSetting.id
            });
            toast.success('Ayar güncellendi');
            setEditDialogOpen(false);
            setEditingSetting(null);
            await fetchSettings();
        } catch (error) {
            console.error('Ayar güncellenemedi:', error);
            toast.error('Ayar güncellenirken hata oluştu');
        }
    };

    const handleDelete = async (item: AIQuestionPoolSettings) => {
        if (item.topic === '*' && item.locale === '*') {
            toast.warning('Global varsayılan satır silinemez');
            return;
        }

        if (!window.confirm('Bu ayar kuralı silinsin mi?')) {
            return;
        }

        try {
            await aiQuestionPoolSettingsRepository.deleteSetting(item.id);
            toast.success('Ayar silindi');
            await fetchSettings();
        } catch (error) {
            console.error('Ayar silinemedi:', error);
            toast.error('Ayar silinirken hata oluştu');
        }
    };

    const updateNewSetting = <K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) => {
        setNewSetting((prev) => ({ ...prev, [key]: value }));
    };

    const updateEditSetting = <K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) => {
        setEditForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleExportSettings = () => {
        try {
            const payload = settings.map((item) => ({
                topic: item.topic,
                locale: item.locale,
                maxServedCount: item.maxServedCount,
                targetPoolSize: item.targetPoolSize,
                refillBatchSize: item.refillBatchSize,
                isActive: item.isActive
            }));

            const fileNameDate = new Date().toISOString().slice(0, 10);
            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `ai-question-pool-settings-${fileNameDate}.json`;
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
            window.URL.revokeObjectURL(url);
            toast.success('Ayarlar JSON olarak indirildi');
        } catch (error) {
            console.error('Ayar export hatası:', error);
            toast.error('Ayarlar dışa aktarılırken hata oluştu');
        }
    };

    const sanitizeImportedItem = (value: unknown): SettingsForm | null => {
        if (!value || typeof value !== 'object') {
            return null;
        }

        const candidate = value as Partial<SettingsForm>;
        const locale = candidate.locale;
        const normalizedLocale: AIQuestionPoolLocale =
            locale === 'tr' || locale === 'en' || locale === '*'
                ? locale
                : '*';

        return normalizeForm({
            topic: typeof candidate.topic === 'string' ? candidate.topic : '*',
            locale: normalizedLocale,
            maxServedCount: Number(candidate.maxServedCount) || 1,
            targetPoolSize: Number(candidate.targetPoolSize) || 1,
            refillBatchSize: Number(candidate.refillBatchSize) || 1,
            isActive: typeof candidate.isActive === 'boolean' ? candidate.isActive : true
        });
    };

    const handleImportFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) {
            return;
        }

        try {
            setImporting(true);
            const content = await file.text();
            const parsed = JSON.parse(content) as unknown;
            const rawItems = Array.isArray(parsed)
                ? parsed
                : parsed && typeof parsed === 'object' && Array.isArray((parsed as { settings?: unknown }).settings)
                    ? (parsed as { settings: unknown[] }).settings
                    : null;

            if (!rawItems) {
                toast.error('JSON formatı geçersiz. Dizi veya { settings: [...] } bekleniyor.');
                return;
            }

            const sanitizedItems = rawItems
                .map(sanitizeImportedItem)
                .filter((item): item is SettingsForm => Boolean(item));

            if (sanitizedItems.length === 0) {
                toast.error('Geçerli ayar bulunamadı');
                return;
            }

            const results = await Promise.allSettled(
                sanitizedItems.map(async (item) => aiQuestionPoolSettingsRepository.upsertSetting(item))
            );

            const successCount = results.filter((result) => result.status === 'fulfilled').length;
            const failureCount = results.length - successCount;

            await fetchSettings();

            if (failureCount > 0) {
                toast.warning(`${successCount} kural içe aktarıldı, ${failureCount} kural başarısız oldu`);
                return;
            }

            toast.success(`${successCount} kural başarıyla içe aktarıldı`);
        } catch (error) {
            console.error('Ayar import hatası:', error);
            toast.error('Ayarlar içe aktarılırken hata oluştu');
        } finally {
            setImporting(false);
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
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <Link
                    to="/admin"
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors group"
                    title="Geri Dön"
                >
                    <ArrowLeft className="w-6 h-6 text-slate-600 group-hover:text-indigo-600" />
                </Link>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Brain className="w-6 h-6 text-indigo-500" />
                    AI Soru Havuzu Ayarları
                </h1>
                <div className="flex items-center gap-2 ml-auto">
                    <button
                        onClick={handleExportSettings}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        JSON Dışa Aktar
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={importing}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-500 rounded-xl hover:bg-indigo-600 transition-colors disabled:opacity-60"
                    >
                        {importing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Upload className="w-4 h-4" />
                        )}
                        JSON İçe Aktar
                    </button>
                </div>
            </div>
            <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(event) => void handleImportFileChange(event)}
            />

            <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
                <h2 className="font-bold text-slate-900 uppercase tracking-tight text-sm">Yeni Kural Ekle / Üzerine Yaz</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-900 mb-1.5">Topic</label>
                        <input
                            type="text"
                            value={newSetting.topic}
                            onChange={(event) => updateNewSetting('topic', event.target.value)}
                            placeholder="* veya problem çözme"
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-slate-900 font-medium outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-900 mb-1.5">Locale</label>
                        <select
                            value={newSetting.locale}
                            onChange={(event) => updateNewSetting('locale', event.target.value as AIQuestionPoolLocale)}
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-slate-900 font-medium outline-none"
                        >
                            <option value="*">* (Tümü)</option>
                            <option value="tr">tr</option>
                            <option value="en">en</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <label className="inline-flex items-center gap-2 font-semibold text-slate-700">
                            <input
                                type="checkbox"
                                checked={newSetting.isActive}
                                onChange={(event) => updateNewSetting('isActive', event.target.checked)}
                            />
                            Aktif
                        </label>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-900 mb-1.5">Max Served Count</label>
                        <input
                            type="number"
                            min={1}
                            value={newSetting.maxServedCount}
                            onChange={(event) => updateNewSetting('maxServedCount', Number(event.target.value) || 1)}
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-slate-900 font-medium outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-900 mb-1.5">Target Pool Size</label>
                        <input
                            type="number"
                            min={1}
                            value={newSetting.targetPoolSize}
                            onChange={(event) => updateNewSetting('targetPoolSize', Number(event.target.value) || 1)}
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-slate-900 font-medium outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-900 mb-1.5">Refill Batch Size</label>
                        <input
                            type="number"
                            min={1}
                            value={newSetting.refillBatchSize}
                            onChange={(event) => updateNewSetting('refillBatchSize', Number(event.target.value) || 1)}
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-slate-900 font-medium outline-none"
                        />
                    </div>
                </div>

                <button
                    onClick={handleCreateOrUpsert}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 text-white font-medium rounded-xl hover:bg-indigo-600 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Kaydet
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="text-left py-4 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider">Topic</th>
                                <th className="text-left py-4 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider">Locale</th>
                                <th className="text-left py-4 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider">Max Served</th>
                                <th className="text-left py-4 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider">Target Pool</th>
                                <th className="text-left py-4 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider">Refill Batch</th>
                                <th className="text-left py-4 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider">Durum</th>
                                <th className="text-center py-4 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {settings.map((item, index) => (
                                <motion.tr
                                    key={item.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: index * 0.02 }}
                                    className="hover:bg-slate-50 transition-colors"
                                >
                                    <td className="py-4 px-6 font-mono text-sm text-slate-700">{item.topic}</td>
                                    <td className="py-4 px-6 text-slate-700">{item.locale}</td>
                                    <td className="py-4 px-6 text-slate-700">{item.maxServedCount}</td>
                                    <td className="py-4 px-6 text-slate-700">{item.targetPoolSize}</td>
                                    <td className="py-4 px-6 text-slate-700">{item.refillBatchSize}</td>
                                    <td className="py-4 px-6">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                                            {item.isActive ? 'Aktif' : 'Pasif'}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex justify-center gap-1">
                                            <button
                                                onClick={() => handleEditClick(item)}
                                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item)}
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

            <Dialog.Root open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
                    <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md z-50">
                        <div className="flex items-center justify-between mb-6">
                            <Dialog.Title className="text-xl font-bold text-slate-800">Kuralı Düzenle</Dialog.Title>
                            <Dialog.Close asChild>
                                <button className="p-1 hover:bg-slate-100 rounded-lg">
                                    <X className="w-5 h-5 text-slate-500" />
                                </button>
                            </Dialog.Close>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Topic</label>
                                <input
                                    type="text"
                                    value={editForm.topic}
                                    onChange={(event) => updateEditSetting('topic', event.target.value)}
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Locale</label>
                                <select
                                    value={editForm.locale}
                                    onChange={(event) => updateEditSetting('locale', event.target.value as AIQuestionPoolLocale)}
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                                >
                                    <option value="*">* (Tümü)</option>
                                    <option value="tr">tr</option>
                                    <option value="en">en</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Max Served Count</label>
                                <input
                                    type="number"
                                    min={1}
                                    value={editForm.maxServedCount}
                                    onChange={(event) => updateEditSetting('maxServedCount', Number(event.target.value) || 1)}
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Target Pool Size</label>
                                <input
                                    type="number"
                                    min={1}
                                    value={editForm.targetPoolSize}
                                    onChange={(event) => updateEditSetting('targetPoolSize', Number(event.target.value) || 1)}
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Refill Batch Size</label>
                                <input
                                    type="number"
                                    min={1}
                                    value={editForm.refillBatchSize}
                                    onChange={(event) => updateEditSetting('refillBatchSize', Number(event.target.value) || 1)}
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                                />
                            </div>
                            <label className="inline-flex items-center gap-2 font-semibold text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={editForm.isActive}
                                    onChange={(event) => updateEditSetting('isActive', event.target.checked)}
                                />
                                Aktif
                            </label>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <Dialog.Close asChild>
                                <button className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl">İptal</button>
                            </Dialog.Close>
                            <button
                                onClick={handleUpdate}
                                className="px-6 py-2.5 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600"
                            >
                                Güncelle
                            </button>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </div>
    );
}
