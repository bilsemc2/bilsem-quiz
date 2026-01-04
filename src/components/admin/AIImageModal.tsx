import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Copy, Check, Wand2, Palette, Box } from 'lucide-react';
import { toast } from 'sonner';

interface AIImageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApplyPrompt?: (prompt: string) => void;
    initialTopic?: string;
}

const AIImageModal: React.FC<AIImageModalProps> = ({ isOpen, onClose, onApplyPrompt, initialTopic }) => {
    const [topic, setTopic] = useState('');
    const [generatedPrompt, setGeneratedPrompt] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (isOpen && initialTopic) {
            setTopic(initialTopic);
        }
    }, [isOpen, initialTopic]);

    const generatePrompt = () => {
        if (!topic.trim()) {
            toast.error('Lütfen bir konu girin');
            return;
        }

        const basePrompt = `A high-quality minimalist school illustration of "${topic}", 3D render, glassmorphism style, modern and clean educational-technological aesthetic. Color palette: vibrant purple, soft pink, and deep navy blue. Cinematic lighting, professional design, high resolution, 4K, detailed textures. --ar 16:10. Important: Keep the subject perfectly centered with enough padding on sides for various crops. Clean output optimized for webp format.`;

        setGeneratedPrompt(basePrompt);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedPrompt);
        setCopied(true);
        toast.success('Prompt kopyalandı!');
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100]" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl p-8 z-[101] outline-none">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                                <Sparkles className="w-6 h-6 text-white animate-pulse" />
                            </div>
                            <Dialog.Title className="text-xl font-black text-white">AI Görsel Tasarımcı</Dialog.Title>
                        </div>
                        <Dialog.Close className="p-2 hover:bg-white/5 rounded-full transition-colors">
                            <X className="w-5 h-5 text-slate-400" />
                        </Dialog.Close>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-widest">Yazı Konusu</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="Örn: Uzayda Yaşam, Matematik Dehası..."
                                    className="w-full px-6 py-4 bg-slate-800/50 border border-white/10 rounded-2xl text-white placeholder:text-slate-600 outline-none focus:border-purple-500/50 transition-all font-medium"
                                />
                                <button
                                    onClick={generatePrompt}
                                    className="absolute right-2 top-2 p-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-all active:scale-95"
                                    title="Prompt Oluştur"
                                >
                                    <Wand2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Standards Info */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-3">
                                <Palette className="w-5 h-5 text-pink-400" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase leading-none">Kurumsal<br />Renk Paleti</span>
                            </div>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-3">
                                <Box className="w-5 h-5 text-purple-400" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase leading-none">3D / Minimal<br />Tasarım Stili</span>
                            </div>
                        </div>

                        <AnimatePresence>
                            {generatedPrompt && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-3"
                                >
                                    <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest">Oluşturulan Prompt (VEO 3.1 / Midjourney)</label>
                                    <div className="relative group">
                                        <div className="w-full p-6 bg-slate-950/50 border border-white/5 rounded-3xl text-xs text-purple-300 leading-relaxed font-mono italic">
                                            {generatedPrompt}
                                        </div>
                                        <button
                                            onClick={copyToClipboard}
                                            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>

                                    <p className="text-[10px] text-slate-500 text-center font-medium"> Bu promptu kopyalayıp görsel oluşturucuya (VEO 3.1, DALLE vb.) yapıştırabilirsiniz. </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="mt-8 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-4 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-700 transition-all"
                        >
                            Kapat
                        </button>
                        {generatedPrompt && onApplyPrompt && (
                            <button
                                onClick={() => onApplyPrompt(generatedPrompt)}
                                className="flex-1 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-2xl shadow-lg shadow-purple-500/20 hover:scale-[1.02] transition-all active:scale-95"
                            >
                                Taslağa Uygula
                            </button>
                        )}
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export default AIImageModal;
