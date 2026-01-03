import * as Dialog from '@radix-ui/react-dialog';
import { X, Copy, Users } from 'lucide-react';
import { toast } from 'sonner';

interface InviteModalProps {
    visible: boolean;
    classId: string;
    onCancel: () => void;
}

const InviteModal = ({ visible, classId, onCancel }: InviteModalProps) => {
    const displayCode = classId?.split('-')[0].toUpperCase() || '';

    const handleCopyCode = () => {
        navigator.clipboard.writeText(classId || '');
        toast.success('Sınıf kodu kopyalandı', {
            description: `Kod: ${displayCode} kopyalandı.`
        });
    };

    return (
        <Dialog.Root open={visible} onOpenChange={(open) => !open && onCancel()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm z-50">
                    <div className="flex items-center justify-between mb-6">
                        <Dialog.Title className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-500" />
                            Öğrenci Davet Et
                        </Dialog.Title>
                        <Dialog.Close asChild>
                            <button className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </Dialog.Close>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl text-center mb-6 border border-blue-100">
                        <div className="text-sm text-blue-600 font-medium mb-2">Sınıf Kodu</div>
                        <div className="text-4xl font-black tracking-[0.3em] text-blue-700">
                            {displayCode}
                        </div>
                    </div>

                    <p className="text-slate-600 text-center mb-6 text-sm">
                        Öğrencileriniz bu kodu kullanarak sınıfa katılabilirler.
                    </p>

                    <button
                        onClick={handleCopyCode}
                        className="w-full py-3 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                    >
                        <Copy className="w-5 h-5" />
                        Kodu Kopyala
                    </button>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export default InviteModal;
