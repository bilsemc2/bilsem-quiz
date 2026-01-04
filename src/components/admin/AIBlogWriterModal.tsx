import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Bot, Copy, Check, MessageSquareText, BookOpen, Rocket, Lightbulb, Import } from 'lucide-react';
import { toast } from 'sonner';

interface AIBlogWriterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApplyDraft: (data: { title: string; content: string; category: string }) => void;
}

const TONES = [
    { id: 'educational', label: 'Eğitici & Bilimsel', icon: BookOpen, color: 'text-blue-400' },
    { id: 'fun', label: 'Eğlenceli & Akıcı', icon: Rocket, color: 'text-pink-400' },
    { id: 'inspirational', label: 'İlham Verici', icon: Lightbulb, color: 'text-amber-400' },
    { id: 'technical', label: 'Teknik Özellikler', icon: MessageSquareText, color: 'text-purple-400' },
];

const AIBlogWriterModal: React.FC<AIBlogWriterModalProps> = ({ isOpen, onClose, onApplyDraft }) => {
    const [topic, setTopic] = useState('');
    const [tone, setTone] = useState('educational');
    const [copied, setCopied] = useState(false);
    const [importedContent, setImportedContent] = useState('');

    const generatePrompt = () => {
        if (!topic.trim()) {
            toast.error('Lütfen bir konu girin');
            return '';
        }

        const selectedTone = TONES.find(t => t.id === tone)?.label;

        return `Lütfen "${topic}" konusu üzerine, "${selectedTone}" tonunda profesyonel bir blog yazısı yaz. 
Yazı şu kurallara uymalı:
1. Başlık çok çarpıcı ve SEO uyumlu olmalı.
2. İçerik HTML formatında (TipTap/ProseMirror uyumlu) olmalı; <h1>, <h2>, <p>, <strong>, <ul>, <li> etiketlerini kullan. 
3. Modern, akıcı ve bilgilendirici bir dil kullan. 
4. Yazı sonunda bir özet cümlesi bulundur.

Lütfen bana şu yapıda bir yanıt ver (JSON değil, sadece aşağıdaki blokları ayırarak):
[TITLE]: Yazı Başlığı
[CATEGORY]: Kategori Adı
[CONTENT]: <h1>Başlık</h1><p>İçerik...</p>...`;
    };

    const copyPrompt = () => {
        const prompt = generatePrompt();
        if (prompt) {
            navigator.clipboard.writeText(prompt);
            setCopied(true);
            toast.success('İstem kopyalandı! Şimdi bunu asistanına gönder.');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleImport = () => {
        if (!importedContent.includes('[TITLE]') || !importedContent.includes('[CONTENT]')) {
            toast.error('Geçersiz içerik formatı. Lütfen asistanın cevabını tam olarak yapıştırın.');
            return;
        }

        try {
            const titleMatch = importedContent.match(/\[TITLE\]:\s*(.*)/);
            const categoryMatch = importedContent.match(/\[CATEGORY\]:\s*(.*)/);
            const contentMatch = importedContent.match(/\[CONTENT\]:\s*([\s\S]*)/);

            if (titleMatch && contentMatch) {
                onApplyDraft({
                    title: titleMatch[1].trim(),
                    category: categoryMatch ? categoryMatch[1].trim() : 'BİLSEM',
                    content: contentMatch[1].trim(),
                });
                toast.success('Yazı taslağı başarıyla uygulandı!');
                onClose();
            }
        } catch (error) {
            toast.error('İşleme sırasında hata oluştu.');
        }
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100]" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl p-8 z-[101] outline-none overflow-y-auto max-h-[90vh]">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                                <Bot className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <Dialog.Title className="text-xl font-black text-white">AI Blog Yazarı</Dialog.Title>
                                <p className="text-xs text-slate-400 font-medium">Asistanınız ile birlikte yazılarınızı dakikalar içinde hazırlayın.</p>
                            </div>
                        </div>
                        <Dialog.Close className="p-2 hover:bg-white/5 rounded-full transition-colors">
                            <X className="w-5 h-5 text-slate-400" />
                        </Dialog.Close>
                    </div>

                    <div className="space-y-8">
                        {/* Step 1: Configuration */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white">1</span>
                                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Temel Bilgiler</h3>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-widest">Konu / Tema</label>
                                    <input
                                        type="text"
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        placeholder="Örn: Yapay Zeka ve Çocuk Eğitimi..."
                                        className="w-full px-5 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white outline-none focus:border-indigo-500/50 transition-all font-medium"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-widest">Yazım Tonu</label>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                                        {TONES.map((t) => (
                                            <button
                                                key={t.id}
                                                onClick={() => setTone(t.id)}
                                                className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${tone === t.id
                                                    ? 'bg-indigo-500/10 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                                                    : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                                                    }`}
                                            >
                                                <t.icon className={`w-5 h-5 ${tone === t.id ? t.color : ''}`} />
                                                <span className="text-[10px] font-bold">{t.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={copyPrompt}
                                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl shadow-indigo-900/20"
                                >
                                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                    {copied ? 'İstem Kopyalandı!' : 'Antigravity İçin İstemi Kopyala'}
                                </button>
                                <p className="text-[10px] text-slate-500 text-center font-medium">Bu butona basıp kopyalanan metni sohbete yapıştırarak asistanınızın yazıyı hazırlamasını sağlayın.</p>
                            </div>
                        </section>

                        {/* Step 2: Import */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white">2</span>
                                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">İçeriği İçe Aktar</h3>
                            </div>

                            <div className="space-y-4">
                                <textarea
                                    value={importedContent}
                                    onChange={(e) => setImportedContent(e.target.value)}
                                    placeholder="Antigravity'nin cevabını buraya yapıştırın..."
                                    className="w-full h-32 px-5 py-4 bg-slate-800/50 border border-white/10 rounded-2xl text-xs text-slate-300 outline-none focus:border-emerald-500/50 transition-all font-mono leading-relaxed resize-none"
                                />

                                <button
                                    onClick={handleImport}
                                    disabled={!importedContent.trim()}
                                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-black rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl shadow-emerald-900/20"
                                >
                                    <Import className="w-5 h-5" />
                                    Yazıyı Taslağa Uygula
                                </button>
                            </div>
                        </section>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export default AIBlogWriterModal;
