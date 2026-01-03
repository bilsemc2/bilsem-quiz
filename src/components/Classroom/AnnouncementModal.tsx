import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Megaphone } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface AnnouncementModalProps {
    visible: boolean;
    classId: string;
    userId: string;
    onCancel: () => void;
    onSuccess: () => void;
}

const AnnouncementModal = ({
    visible,
    classId,
    userId,
    onCancel,
    onSuccess,
}: AnnouncementModalProps) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal');
    const [expiresAt, setExpiresAt] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !content.trim()) {
            toast.error('Lütfen başlık ve içerik girin');
            return;
        }

        setLoading(true);
        const { error } = await supabase
            .from('announcements')
            .insert([{
                class_id: classId,
                title,
                content,
                priority,
                expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
                created_by: userId
            }]);

        setLoading(false);

        if (error) {
            console.error('Duyuru eklenirken hata:', error);
            toast.error('Duyuru eklenirken bir hata oluştu', {
                description: 'Lütfen daha sonra tekrar deneyiniz.'
            });
            return;
        }

        toast.success('Duyuru başarıyla eklendi', {
            description: 'Yeni duyuru tüm öğrenciler için görünür olacak.'
        });

        setTitle('');
        setContent('');
        setPriority('normal');
        setExpiresAt('');
        onSuccess();
    };

    const priorityColors = {
        low: 'bg-slate-100 text-slate-700 border-slate-300',
        normal: 'bg-blue-100 text-blue-700 border-blue-300',
        high: 'bg-red-100 text-red-700 border-red-300',
    };

    return (
        <Dialog.Root open={visible} onOpenChange={(open) => !open && onCancel()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg z-50">
                    <div className="flex items-center justify-between mb-6">
                        <Dialog.Title className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Megaphone className="w-5 h-5 text-amber-500" />
                            Yeni Duyuru
                        </Dialog.Title>
                        <Dialog.Close asChild>
                            <button className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </Dialog.Close>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Başlık</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Duyuru başlığı"
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">İçerik</label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Duyuru içeriği..."
                                rows={4}
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Önem Derecesi</label>
                            <div className="flex gap-2">
                                {(['low', 'normal', 'high'] as const).map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setPriority(p)}
                                        className={`flex-1 py-2 px-3 rounded-xl border-2 text-sm font-medium transition-all ${priority === p
                                            ? priorityColors[p] + ' border-current'
                                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                                            }`}
                                    >
                                        {p === 'low' ? 'Düşük' : p === 'normal' ? 'Normal' : 'Yüksek'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Bitiş Tarihi (Opsiyonel)</label>
                            <input
                                type="datetime-local"
                                value={expiresAt}
                                onChange={(e) => setExpiresAt(e.target.value)}
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onCancel}
                                className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2.5 bg-indigo-500 text-white font-medium rounded-xl hover:bg-indigo-600 transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Yayınlanıyor...' : 'Yayınla'}
                            </button>
                        </div>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export default AnnouncementModal;
