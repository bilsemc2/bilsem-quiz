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

export const DrawingPage: React.FC = () => {
    const { user } = useAuth();
    const [selectedWords, setSelectedWords] = useState<string[]>([]);
    const [timeLeft, setTimeLeft] = useState<number>(40 * 60); // 40 dakika
    const [isDrawing, setIsDrawing] = useState<boolean>(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [feedback, setFeedback] = useState<string>('');
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
            const feedback = await analyzeImage(base64Image, selectedWords);

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
            const { data, error } = await supabase
                .from('drawing_submissions')
                .insert({
                    user_id: user.id,
                    image_url: publicUrl,
                    words: selectedWords,
                    feedback: feedback
                })
                .select()
                .single();

            if (error) {
                console.error('Error inserting submission:', error);
                throw error;
            }

            setFeedback(feedback);
            
        } catch (error) {
            console.error('Error submitting drawing:', error);
            setFeedback('Resim yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                        Resim Kompozisyonu
                    </h1>
                    
                    {/* Mobile Menu */}
                    <div className="flex md:hidden items-center">
                        <MobileMenu />
                    </div>
                </div>

                {/* Main Content */}
                <div className="space-y-8">
                    {/* Words Section */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">Kelimeleriniz:</h2>
                        <div className="flex flex-wrap gap-3">
                            {selectedWords.map((word, index) => (
                                <span
                                    key={index}
                                    className="px-4 py-2 bg-indigo-100 text-indigo-800 rounded-full font-medium"
                                >
                                    {word}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Timer Section */}
                    {isDrawing && (
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-xl font-semibold mb-4">Kalan Süre:</h2>
                            <div className="text-4xl font-bold text-indigo-600">
                                {formatTime(timeLeft)}
                            </div>
                        </div>
                    )}

                    {/* Upload Section */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        {!isDrawing ? (
                            <button
                                onClick={handleStartDrawing}
                                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                                Çizime Başla
                            </button>
                        ) : (
                            <div className="space-y-4">
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                                    {previewUrl ? (
                                        <div className="space-y-4">
                                            <img
                                                src={previewUrl}
                                                alt="Preview"
                                                className="max-w-full h-auto mx-auto rounded-lg"
                                            />
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="text-indigo-600 hover:text-indigo-800"
                                            >
                                                Başka bir resim seç
                                            </button>
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="cursor-pointer"
                                        >
                                            <div className="text-gray-500">
                                                <svg
                                                    className="mx-auto h-12 w-12 text-gray-400"
                                                    stroke="currentColor"
                                                    fill="none"
                                                    viewBox="0 0 48 48"
                                                    aria-hidden="true"
                                                >
                                                    <path
                                                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                                        strokeWidth={2}
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />
                                                </svg>
                                                <p className="mt-1">Resminizi yüklemek için tıklayın</p>
                                            </div>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                </div>

                                <button
                                    onClick={handleSubmit}
                                    disabled={!imageFile}
                                    className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                                        imageFile
                                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700'
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                                >
                                    Resmi Gönder
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Feedback Section */}
                    {feedback && (
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-xl font-semibold mb-4">Geri Bildirim:</h2>
                            <p className="text-gray-700">{feedback}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DrawingPage;
