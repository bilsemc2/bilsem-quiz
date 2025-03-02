import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import MobileMenu from '../components/MobileMenu';
import { analyzeImage } from '../utils/imageAnalysis';
import { Navigate } from 'react-router-dom';

// Rastgele kelimeler listesi
const words = [
    'ağaç', 'güneş', 'deniz', 'dağ', 'kuş', 'çiçek', 'ev', 'bulut', 'yıldız', 'ay',
    'kelebek', 'gökkuşağı', 'balık', 'gemi', 'orman', 'nehir', 'köprü', 'kale',
    'bahçe', 'göl', 'şelale', 'ada', 'palmiye', 'kaktüs', 'aslan', 'fil', 'zürafa'
];

interface DrawingSubmission {
    id: string;
    user_id: string;
    image_url: string;
    words: string[];
    feedback: string;
    created_at: string;
}

export default function DrawingPage() {
    const { user } = useAuth();
    const [selectedWords, setSelectedWords] = useState<string[]>([]);
    const [timeLeft, setTimeLeft] = useState<number>(40 * 60); // 40 dakika
    const [isDrawing, setIsDrawing] = useState<boolean>(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [feedback, setFeedback] = useState<string>('');
    const [scores, setScores] = useState<{
        composition: number;
        lines: number;
        perspective: number;
        proportions: number;
        creativity: number;
        totalScore: number;
    }>({
        composition: 0,
        lines: 0,
        perspective: 0,
        proportions: 0,
        creativity: 0,
        totalScore: 0
    });
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Kullanıcı giriş yapmamışsa ana sayfaya yönlendir
    if (!user) {
        return <Navigate to="/" replace />;
    }

    // Rastgele 3 kelime seç
    useEffect(() => {
        const getRandomWords = () => {
            const shuffled = [...words].sort(() => 0.5 - Math.random());
            return shuffled.slice(0, 3);
        };
        setSelectedWords(getRandomWords());
    }, []);

    // Geri sayım
    useEffect(() => {
        if (isDrawing && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [isDrawing, timeLeft]);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleStartDrawing = () => {
        setIsDrawing(true);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const handleSubmit = async () => {
        if (!imageFile || !user) return;

        try {
            setFeedback('Resminiz yükleniyor...');
            
            // Resmi base64'e dönüştür
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve) => {
                reader.onload = () => {
                    const base64 = reader.result as string;
                    resolve(base64);
                };
            });
            reader.readAsDataURL(imageFile);
            const base64Image = await base64Promise;

            setFeedback('Resminiz analiz ediliyor...');
            
            // Yapay zeka analizi
            const result = await analyzeImage(base64Image, selectedWords);
            setFeedback(result.feedback);
            setScores(result.scores);

            // Resmi Storage'a yükle
            const fileName = `${user.id}/${Date.now()}.jpg`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('drawings')
                .upload(fileName, imageFile);

            if (uploadError) {
                console.error('Error uploading image:', uploadError);
                throw uploadError;
            }

            // Resmin public URL'ini al
            const { data: { publicUrl } } = supabase.storage
                .from('drawings')
                .getPublicUrl(fileName);

            // Veritabanına kaydet
            const { error: insertError } = await supabase
                .from('drawing_submissions')
                .insert({
                    user_id: user.id,
                    image_url: publicUrl,
                    words: selectedWords,
                    feedback: result.feedback,
                    scores: JSON.stringify({
                        composition: result.scores.composition,
                        lines: result.scores.lines,
                        perspective: result.scores.perspective,
                        proportions: result.scores.proportions,
                        creativity: result.scores.creativity,
                        totalScore: result.scores.totalScore
                    })
                })
                .select()
                .single();

            if (insertError) {
                console.error('Error inserting submission:', insertError);
                throw insertError;
            }

        } catch (error) {
            console.error('Error submitting drawing:', error);
            setFeedback('Resim yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Resim Oluşturma Görevi</h2>
                    
                    {/* Kelimeler */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Kullanılacak Kelimeler:</h3>
                        <div className="flex flex-wrap gap-2">
                            {selectedWords.map((word, index) => (
                                <span 
                                    key={index}
                                    className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                                >
                                    {word}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Süre */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Kalan Süre:</h3>
                        <div className="text-2xl font-bold text-gray-900">
                            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                        </div>
                    </div>

                    {/* Resim Yükleme */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Resim Yükleme:</h3>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
                            >
                                Resim Seç
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                className="hidden"
                            />
                            {imageFile && (
                                <button
                                    onClick={handleSubmit}
                                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors"
                                >
                                    Gönder
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Önizleme */}
                    {previewUrl && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Önizleme:</h3>
                            <div className="relative rounded-lg overflow-hidden border border-gray-200">
                                <img
                                    src={previewUrl}
                                    alt="Yüklenen resim önizlemesi"
                                    className="w-full h-auto max-h-96 object-contain"
                                />
                            </div>
                        </div>
                    )}

                    {/* Geri Bildirim */}
                    {feedback && (
                        <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
                            <h2 className="text-2xl font-bold mb-4">Değerlendirme</h2>
                            
                            {/* Scores */}
                            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <h3 className="text-lg font-semibold mb-3">Puanlama</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span>Kompozisyon:</span>
                                            <span className="font-semibold">{scores.composition}/20</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Çizgi:</span>
                                            <span className="font-semibold">{scores.lines}/20</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Perspektif:</span>
                                            <span className="font-semibold">{scores.perspective}/20</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Oran-Orantı:</span>
                                            <span className="font-semibold">{scores.proportions}/20</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Yaratıcılık:</span>
                                            <span className="font-semibold">{scores.creativity}/20</span>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-blue-200 flex justify-between">
                                            <span className="font-bold">Toplam Puan:</span>
                                            <span className="font-bold text-lg">{scores.totalScore}/100</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Detailed Feedback */}
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <h3 className="text-lg font-semibold mb-3">Detaylı Geri Bildirim</h3>
                                    <div className="whitespace-pre-wrap">{feedback}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
