import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Settings } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface SettingsModalProps {
    visible: boolean;
    classId: string;
    classData: { name: string; grade: number } | null;
    onCancel: () => void;
    onSuccess: () => void;
}

const SettingsModal = ({
    visible,
    classId,
    classData,
    onCancel,
    onSuccess,
}: SettingsModalProps) => {
    const [name, setName] = useState(classData?.name || '');
    const [grade, setGrade] = useState(classData?.grade || 5);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (classData) {
            setName(classData.name);
            setGrade(classData.grade);
        }
    }, [classData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.error('Lütfen sınıf adı girin');
            return;
        }

        setLoading(true);
        const { error } = await supabase
            .from('classes')
            .update({ name, grade })
            .eq('id', classId);

        setLoading(false);

        if (error) {
            console.error('Sınıf güncellenirken hata:', error);
            toast.error('Sınıf güncellenirken bir hata oluştu', {
                description: 'Ayarlar kaydedilemedi. Lütfen tekrar deneyin.'
            });
            return;
        }

        toast.success('Sınıf başarıyla güncellendi', {
            description: 'Yeni ayarlar kaydedildi.'
        });
        onSuccess();
    };

    return (
        <Dialog.Root open={visible} onOpenChange={(open) => !open && onCancel()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md z-50">
                    <div className="flex items-center justify-between mb-6">
                        <Dialog.Title className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Settings className="w-5 h-5 text-indigo-500" />
                            Sınıf Ayarları
                        </Dialog.Title>
                        <Dialog.Close asChild>
                            <button className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </Dialog.Close>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Sınıf Adı
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Örn: 5-A Matematik"
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Sınıf Seviyesi
                            </label>
                            <select
                                value={grade}
                                onChange={(e) => setGrade(Number(e.target.value))}
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white"
                            >
                                {[5, 6, 7, 8, 9, 10, 11, 12].map(g => (
                                    <option key={g} value={g}>{g}. Sınıf</option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-indigo-500 text-white font-medium rounded-xl hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                        </button>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export default SettingsModal;
