import { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, Sparkles } from 'lucide-react';
import { uploadImage } from '../../lib/storage';
import { toast } from 'sonner';
import AIImageModal from './AIImageModal';

interface ImageUploaderProps {
    value: string;
    onChange: (url: string) => void;
    label?: string;
    suggestedTitle?: string;
}

const ImageUploader = ({ value, onChange, label, suggestedTitle }: ImageUploaderProps) => {
    const [uploading, setUploading] = useState(false);
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check file type
        if (!file.type.startsWith('image/')) {
            toast.error('Lütfen sadece resim dosyası seçin');
            return;
        }

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Resim boyutu 5MB\'dan küçük olmalıdır');
            return;
        }

        try {
            setUploading(true);
            const url = await uploadImage(file);
            onChange(url);
            toast.success('Resim başarıyla yüklendi');
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Resim yüklenirken bir hata oluştu');
        } finally {
            setUploading(false);
        }
    };

    const removeImage = () => {
        onChange('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                {label && <label className="block text-sm font-bold text-slate-900">{label}</label>}
                <button
                    type="button"
                    onClick={() => setIsAIModalOpen(true)}
                    className="flex items-center gap-1.5 text-[10px] font-black text-purple-600 hover:text-purple-700 bg-purple-50 px-2 py-1 rounded-lg border border-purple-100 transition-colors uppercase tracking-tight"
                >
                    <Sparkles className="w-3 h-3" />
                    AI ile Tasarla
                </button>
            </div>

            <div className="relative">
                {value ? (
                    <div className="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 aspect-video lg:aspect-[21/9]">
                        <img
                            src={value}
                            alt="Preview"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2 bg-white rounded-lg text-slate-900 hover:bg-slate-100 transition-colors"
                                title="Değiştir"
                            >
                                <Upload className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={removeImage}
                                className="p-2 bg-red-500 rounded-lg text-white hover:bg-red-600 transition-colors"
                                title="Kaldır"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className={`w-full aspect-video lg:aspect-[21/9] flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-300 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 transition-all ${uploading ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                                <span className="text-sm font-medium text-slate-500">Yükleniyor...</span>
                            </>
                        ) : (
                            <>
                                <div className="p-3 bg-slate-100 rounded-full text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-500">
                                    <ImageIcon className="w-6 h-6" />
                                </div>
                                <div className="text-center">
                                    <span className="block text-sm font-bold text-slate-700">Resim Seç</span>
                                    <span className="text-xs text-slate-500">PNG, JPG, WebP (Max 5MB)</span>
                                </div>
                            </>
                        )}
                    </button>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleUpload}
                    className="hidden"
                />
            </div>

            {/* Bilgi Notu */}
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                <div className="flex gap-3">
                    <div className="shrink-0">
                        <Upload className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-amber-900 mb-2">İdeal Resim Standartları</h4>
                        <ul className="text-xs text-amber-800 space-y-1.5 list-disc pl-4 font-medium leading-relaxed">
                            <li><strong>Boyut/Oran:</strong> En iyi görünüm için <strong>1200x750px (16:10)</strong> veya <strong>1600x685px (21:9)</strong> tercih edilmelidir.</li>
                            <li><strong>Format:</strong> Site hızı için <strong>.webp</strong> formatı tavsiye edilir (.png veya .jpg de kabul edilir).</li>
                            <li><strong>Dosya Boyutu:</strong> Maksimum 5MB (<strong>300KB</strong> altı performans için idealdir).</li>
                            <li><strong>İçerik:</strong> Önemli kısımları görselin merkezinde tutun (farklı ekranlarda kırpılabilir).</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* AI Image Generator Modal */}
            <AIImageModal
                isOpen={isAIModalOpen}
                onClose={() => setIsAIModalOpen(false)}
                initialTopic={suggestedTitle}
            />
        </div>
    );
};

export default ImageUploader;
