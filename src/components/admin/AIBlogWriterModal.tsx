import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Bot, Copy, Check, MessageSquareText, BookOpen, Rocket, Lightbulb, Import } from 'lucide-react';
import { toast } from 'sonner';

interface AIBlogWriterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApplyDraft: (data: { title: string; content: string; category: string }) => void;
    initialContent?: string;
    mode?: 'generate' | 'beautify';
}

const TONES = [
    { id: 'educational', label: 'Eğitici & Bilimsel', icon: BookOpen, color: 'text-blue-400' },
    { id: 'fun', label: 'Eğlenceli & Akıcı', icon: Rocket, color: 'text-pink-400' },
    { id: 'inspirational', label: 'İlham Verici', icon: Lightbulb, color: 'text-amber-400' },
    { id: 'technical', label: 'Teknik Özellikler', icon: MessageSquareText, color: 'text-purple-400' },
];

const AIBlogWriterModal: React.FC<AIBlogWriterModalProps> = ({ isOpen, onClose, onApplyDraft, initialContent = '', mode = 'generate' }) => {
    const [topic, setTopic] = useState('');
    const [tone, setTone] = useState('educational');
    const [copied, setCopied] = useState(false);
    const [importedContent, setImportedContent] = useState('');

    const generatePrompt = () => {
        const selectedTone = TONES.find(t => t.id === tone)?.label;

        if (mode === 'beautify') {
            return `Lütfen aşağıda paylaştığım metni, "${selectedTone}" tonunda profesyonel ve SEO uyumlu bir blog yazısına dönüştürerek GÜZELLEŞTİR.
Yazı şu kurallara uymalı:
1. Başlık çok çarpıcı ve SEO uyumlu olmalı.
2. İçerik HTML formatında (TipTap/ProseMirror uyumlu) olmalı; <h1>, <h2>, <p>, <strong>, <ul>, <li> etiketlerini kullan. 
3. Modern, akıcı ve bilgilendirici bir dil kullan. 
4. Metindeki anahtar noktaları <strong> etiketleri ile vurgula.
5. Yazı sonunda bir özet cümlesi bulundur.

GÜZELLEŞTİRİLECEK METİN:
"${initialContent}"

Lütfen bana şu yapıda bir yanıt ver (JSON değil, sadece aşağıdaki blokları ayırarak):
[TITLE]: Yazı Başlığı
[CATEGORY]: Kategori Adı
[CONTENT]: <h1>Başlık</h1><p>İçerik...</p>...`;
        }

        if (!topic.trim()) {
            toast.error('Lütfen bir konu girin');
            return '';
        }

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
            toast.success('İstem kopyalandı! Şimdi bunu Antigravity\'ye gönder.');
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
                toast.success('Yazı başarıyla güncellendi!');
                onClose();
            }
        } catch {
            toast.error('İşleme sırasında hata oluştu.');
        }
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white border-3 border-black/10 rounded-2xl shadow-neo-lg p-8 z-[101] outline-none overflow-y-auto max-h-[90vh]">
                    <div className="flex items-center justify-between mb-8 pb-6 border-b-2 border-black/10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#FF00EA] border-2 border-black/10 rounded-xl flex items-center justify-center shadow-neo-xs">
                                <Bot className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <Dialog.Title className="text-2xl font-black font-nunito text-black uppercase">
                                    {mode === 'beautify' ? 'AI Yazı Güzelleştirici' : 'AI Blog Yazarı'}
                                </Dialog.Title>
                                <p className="text-sm text-black/60 font-bold">
                                    {mode === 'beautify'
                                        ? 'Mevcut metninizi profesyonel bir blog yazısına dönüştürün.'
                                        : 'Asistanınız ile birlikte yazılarınızı dakikalar içinde hazırlayın.'}
                                </p>
                            </div>
                        </div>
                        <Dialog.Close className="p-2 border-2 border-black/10 rounded-lg hover:bg-gray-100 hover:-translate-y-1 transition-all">
                            <X className="w-6 h-6 text-black" />
                        </Dialog.Close>
                    </div>

                    <div className="space-y-8">
                        {/* Step 1: Configuration */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center text-sm font-black  transform -rotate-3">1</span>
                                <h3 className="text-lg font-nunito font-extrabold text-black uppercase tracking-wider">Özellikler</h3>
                            </div>

                            <div className="space-y-6">
                                {mode === 'generate' && (
                                    <div>
                                        <label className="block text-xs font-black text-black mb-2 uppercase tracking-wide">Konu / Tema</label>
                                        <input
                                            type="text"
                                            value={topic}
                                            onChange={(e) => setTopic(e.target.value)}
                                            placeholder="Örn: Yapay Zeka ve Çocuk Eğitimi..."
                                            className="w-full px-5 py-4 bg-gray-50 border-2 border-black/10 rounded-xl text-black placeholder:text-black/40 outline-none focus:-translate-y-1 shadow-neo-xs focus:shadow-neo-xs transition-all font-bold"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-black text-black mb-3 uppercase tracking-wide">Hedef Yazım Tonu</label>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        {TONES.map((t) => (
                                            <button
                                                key={t.id}
                                                onClick={() => setTone(t.id)}
                                                className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all uppercase tracking-wide ${tone === t.id
                                                    ? 'bg-[#14F195] border-black/20 text-black shadow-neo-xs -translate-y-1'
                                                    : 'bg-white border-black/10 text-black hover:-translate-y-1 shadow-neo-xs'
                                                    }`}
                                            >
                                                <t.icon className={`w-6 h-6 text-black`} />
                                                <span className="text-xs font-black">{t.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={copyPrompt}
                                    className="w-full py-4 bg-[#FFD700] border-2 border-black/10 text-black font-black uppercase rounded-xl hover:-translate-y-1 shadow-neo-xs active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3"
                                >
                                    {copied ? <Check className="w-6 h-6" /> : (mode === 'beautify' ? <Rocket className="w-6 h-6" /> : <Copy className="w-6 h-6" />)}
                                    {copied ? 'İstem Kopyalandı!' : (mode === 'beautify' ? 'Güzelleştirme İstemini Kopyala' : 'Antigravity İçin İstemi Kopyala')}
                                </button>
                                <p className="text-xs text-black/60 text-center font-bold">Bu butona basıp kopyalanan metni sohbete yapıştırarak asistanın yazıyı hazırlamasını sağlayın.</p>
                            </div>
                        </section>

                        {/* Step 2: Import */}
                        <section className="space-y-6 pt-6 border-t-2 border-black/10 border-dashed">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center text-sm font-black  transform rotate-3">2</span>
                                <h3 className="text-lg font-nunito font-extrabold text-black uppercase tracking-wider">İçeriği İçe Aktar</h3>
                            </div>

                            <div className="space-y-6">
                                <textarea
                                    value={importedContent}
                                    onChange={(e) => setImportedContent(e.target.value)}
                                    placeholder="Antigravity'nin cevabını buraya yapıştırın..."
                                    className="w-full h-32 px-5 py-4 bg-gray-50 border-2 border-black/10 rounded-xl text-black placeholder:text-black/40 outline-none focus:-translate-y-1 shadow-neo-xs focus:shadow-neo-xs transition-all font-mono leading-relaxed resize-none font-bold"
                                />

                                <button
                                    onClick={handleImport}
                                    disabled={!importedContent.trim()}
                                    className="w-full py-4 bg-[#14F195] border-2 border-black/10 text-black uppercase font-black rounded-xl hover:-translate-y-1 shadow-neo-xs active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
                                >
                                    <Import className="w-6 h-6" />
                                    {mode === 'beautify' ? 'Güzelleştirilmiş Hali Uygula' : 'Yazıyı Taslağa Uygula'}
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
