import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './muzik.css';

const storyImageUrl = "/images/muzik.webp";

const FinishPage: React.FC = () => {
    const navigate = useNavigate();
    const [audioPlayed, setAudioPlayed] = useState(false);
    const [showScore, setShowScore] = useState(false);
    const thanksAudio = useRef<HTMLAudioElement | null>(null);

    const playThanksSound = () => {
        if (!thanksAudio.current) {
            thanksAudio.current = new Audio('/ses/16.mp3');
        }
        thanksAudio.current.play().catch(console.error);
    };

    useEffect(() => {
        if (!audioPlayed) {
            playThanksSound();
            setAudioPlayed(true);
            const timer = setTimeout(() => setShowScore(true), 2000);
            return () => clearTimeout(timer);
        }
    }, [audioPlayed]);

    return (
        <div className="muzik-section-box max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-black mb-10 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent font-poppins tracking-tight">
                Test Tamamlandı!
            </h1>

            <div className="mb-10 group relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                <img
                    src={storyImageUrl}
                    alt="Test Tamamlandı"
                    className="relative rounded-[2rem] w-full shadow-2xl border border-white/20"
                />
            </div>

            <div className="space-y-6 mb-12 px-6">
                <p className="text-xl font-medium leading-relaxed opacity-80 italic">
                    "Uygulama sona erdi. Yönelttiğimiz sorulara cevap verdiğin için teşekkür ederiz."
                </p>
                <p className="text-lg opacity-60">
                    Müzik yetenek testini başarıyla tamamladınız. Gösterdiğiniz ilgi için teşekkürler!
                </p>

                {showScore && (
                    <div className="p-10 bg-white/40 dark:bg-slate-800/20 backdrop-blur-2xl rounded-[2.5rem] border border-white/30 dark:border-white/5 shadow-2xl animate-[fadeIn_1s_ease-out]">
                        <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mb-4 flex items-center justify-center gap-3">
                            <span>✨</span> Test Başarıyla Bitti <span>✨</span>
                        </h3>
                        <p className="opacity-80 leading-relaxed font-medium">
                            Müzik yeteneğinizi keşfetme yolunda büyük bir adım attınız.
                            Detaylı analizlerinizi raporda inceleyebilirsiniz.
                        </p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                    onClick={() => navigate('/atolyeler/muzik/report')}
                    className="py-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl font-black text-xl hover:shadow-2xl hover:shadow-emerald-500/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-3"
                >
                    Raporumu Görüntüle 📊
                </button>

                <button
                    onClick={playThanksSound}
                    className="py-5 bg-slate-800 dark:bg-slate-700 text-white rounded-2xl font-black text-xl hover:bg-slate-900 transition-all shadow-xl hover:-translate-y-1"
                >
                    Mesajı Tekrar Dinle 🔊
                </button>

                <button
                    onClick={() => navigate('/atolyeler/muzik/single-note')}
                    className="sm:col-span-2 py-4 bg-emerald-600/10 text-emerald-600 rounded-2xl font-bold hover:bg-emerald-600/20 transition-all"
                >
                    Testi Baştan Başlat 🔄
                </button>
            </div>
        </div>
    );
};

export default FinishPage;
