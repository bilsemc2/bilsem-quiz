import * as Dialog from '@radix-ui/react-dialog';
import { X, Award } from 'lucide-react';
import BadgeList from '../Badge/BadgeList';

interface BadgesModalProps {
    visible: boolean;
    onCancel: () => void;
}

const BadgesModal = ({ visible, onCancel }: BadgesModalProps) => {
    const allBadges = [
        {
            id: '1',
            name: 'İlk Ödev',
            description: 'İlk ödevini tamamladın!',
            icon: '🎥',
            earnedAt: '2025-02-01'
        },
        {
            id: '2',
            name: 'Hızlı Çözücü',
            description: 'Bu rozeti kazanmak için: Herhangi bir ödevi 5 dakikadan kısa sürede %100 doğru cevaplamalısın.',
            icon: '⚡',
            isLocked: true
        },
        {
            id: '3',
            name: 'Mükemmel',
            description: 'Bir ödevden tam puan aldın!',
            icon: '⭐',
            earnedAt: '2025-02-10'
        },
        {
            id: '4',
            name: 'Şampiyon',
            description: 'Bu rozeti kazanmak için: 10 farklı ödevden tam puan almalısın. Şu ana kadar 2/10 ödevi tamamladın.',
            icon: '🏆',
            isLocked: true
        },
        {
            id: '5',
            name: 'Çalışkan',
            description: 'Bu rozeti kazanmak için: 30 gün üst üste en az 1 ödev yapmalısın. Şu ana kadar en uzun serien: 3 gün.',
            icon: '📚',
            isLocked: true
        }
    ];

    return (
        <Dialog.Root open={visible} onOpenChange={(open) => !open && onCancel()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-3xl max-h-[85vh] overflow-y-auto z-50">
                    <div className="flex items-center justify-between mb-6">
                        <Dialog.Title className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Award className="w-5 h-5 text-amber-500" />
                            Tüm Rozetler
                        </Dialog.Title>
                        <Dialog.Close asChild>
                            <button className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </Dialog.Close>
                    </div>

                    <BadgeList badges={allBadges} />
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export default BadgesModal;
