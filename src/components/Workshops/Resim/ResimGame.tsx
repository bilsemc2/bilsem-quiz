import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, BookOpen, Utensils, Camera, RotateCcw, Send, Palette, User, MessageCircle, ChevronLeft, Lock } from 'lucide-react';
import { ActivityMode, ActivityState } from './types';
import { generateActivityPrompt, generateStillLifeImage, analyzeDrawing } from './geminiService';
import { Timer } from './Timer';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';

interface ResimGameProps {
    onBack: () => void;
}

const ResimGame: React.FC<ResimGameProps> = ({ onBack }) => {
    const [state, setState] = useState<ActivityState>({
        mode: ActivityMode.THREE_WORDS,
        status: 'IDLE'
    });
    const { user } = useAuth();
    const [analysisQuota, setAnalysisQuota] = useState<number | null>(null);
    const [isTeacher, setIsTeacher] = useState(false);

    // Kullanıcının analiz hakkını kontrol et
    useEffect(() => {
        const fetchQuota = async () => {
            if (!user) return;

            const { data: profile, error } = await supabase
                .from('profiles')
                .select('resim_analiz_hakki, role, is_admin')
                .eq('id', user.id)
                .maybeSingle();

            if (error || !profile) {
                setAnalysisQuota(0);
                return;
            }

            // Admin veya öğretmen ise sınırsız hak
            if (profile.is_admin || profile.role === 'teacher') {
                setIsTeacher(true);
                setAnalysisQuota(999);
                return;
            }

            setAnalysisQuota(profile.resim_analiz_hakki ?? 3);
        };

        fetchQuota();
    }, [user]);

    const startTask = async (mode: ActivityMode) => {
        setState({ ...state, mode, status: 'GENERATING', error: undefined });
        try {
            let data: any = {};
            if (mode === ActivityMode.THREE_WORDS) {
                const wordsStr = await generateActivityPrompt(mode);
                data.words = wordsStr?.split(',').map((w: string) => w.trim()) || [];
            } else if (mode === ActivityMode.STORY_CONTINUATION) {
                data.story = await generateActivityPrompt(mode);
            } else {
                data.imageUrl = await generateStillLifeImage();
            }

            setState({
                mode,
                status: 'DRAWING',
                promptData: data,
                startTime: Date.now()
            });
        } catch (err) {
            console.error(err);
            setState({ ...state, status: 'IDLE', error: 'Görev hazırlanırken bir hata oluştu. Lütfen tekrar dene.' });
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setState(prev => ({ ...prev, uploadedImage: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const submitDrawing = async () => {
        if (!state.uploadedImage) return;

        setState(prev => ({ ...prev, status: 'ANALYZING' }));
        try {
            const feedback = await analyzeDrawing(state.mode, state.promptData, state.uploadedImage);

            // Analiz başarılı oldu, hakkı düşür (öğretmen değilse)
            if (user && !isTeacher) {
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ resim_analiz_hakki: Math.max(0, (analysisQuota ?? 1) - 1) })
                    .eq('id', user.id);

                if (!updateError) {
                    setAnalysisQuota(prev => Math.max(0, (prev ?? 1) - 1));
                }
            }

            setState(prev => ({ ...prev, status: 'FINISHED', feedback }));
        } catch (err) {
            console.error(err);
            setState(prev => ({ ...prev, status: 'DRAWING', error: 'Analiz sırasında bir hata oluştu.' }));
        }
    };

    const reset = () => {
        setState({ mode: ActivityMode.THREE_WORDS, status: 'IDLE' });
    };

    return (
        <div className="w-full max-w-6xl mx-auto px-4 py-8">
            <AnimatePresence mode="wait">
                {state.status === 'IDLE' && (
                    <motion.div
                        key="idle"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="space-y-12"
                    >
                        <div className="text-center space-y-4">
                            <button
                                onClick={onBack}
                                className="inline-flex items-center gap-2 text-pink-400 font-bold hover:text-pink-300 transition-colors mb-4 uppercase text-xs tracking-widest"
                            >
                                <ChevronLeft size={16} />
                                Atölye Sayfasına Dön
                            </button>
                            <h2 className="text-4xl md:text-5xl font-black text-white">Bir Görev Seç</h2>
                            <p className="text-slate-400 text-lg font-medium">Hayal gücünü hangi macera ile başlatmak istersin?</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <ModeCard
                                title="3 Kelime Challenge"
                                desc="Sana vereceğimiz 3 gizemli kelimeyi aynı resimde buluştur!"
                                icon={<Sparkles />}
                                color="from-pink-500 to-purple-600"
                                onClick={() => startTask(ActivityMode.THREE_WORDS)}
                            />
                            <ModeCard
                                title="Hikayeyi Tamamla"
                                desc="Yarım kalmış bir hikayeyi oku ve devamını hayalinle çiz!"
                                icon={<BookOpen />}
                                color="from-purple-500 to-indigo-600"
                                onClick={() => startTask(ActivityMode.STORY_CONTINUATION)}
                            />
                            <ModeCard
                                title="Siyah Beyaz Masa"
                                desc="Masadaki nesneleri dikkatle incele ve aynısını çizmeye çalış."
                                icon={<Utensils />}
                                color="from-indigo-500 to-blue-600"
                                onClick={() => startTask(ActivityMode.STILL_LIFE)}
                            />
                        </div>
                    </motion.div>
                )}

                {state.status === 'GENERATING' && (
                    <motion.div
                        key="generating"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-20 space-y-8"
                    >
                        <div className="relative">
                            <div className="w-24 h-24 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin"></div>
                            <Palette className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-pink-500" size={32} />
                        </div>
                        <p className="text-2xl font-bold text-white text-center animate-pulse">
                            Öğretmeniniz senin için harika bir görev hazırlıyor...
                        </p>
                    </motion.div>
                )}

                {(state.status === 'DRAWING' || state.status === 'ANALYZING') && (
                    <motion.div
                        key="active"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/5 backdrop-blur-2xl rounded-[3rem] border border-white/10 p-8 md:p-12 shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-8">
                            <Timer durationSeconds={2400} onTimeUp={() => { }} />
                        </div>

                        <div className="space-y-12">
                            <div className="bg-gradient-to-br from-pink-500/10 to-purple-600/10 rounded-3xl p-8 border border-pink-500/20">
                                {state.mode === ActivityMode.THREE_WORDS && (
                                    <div className="text-center space-y-6">
                                        <p className="text-pink-400 font-black uppercase tracking-[0.2em] text-sm">Bu Kelimeleri Resminde Kullan</p>
                                        <div className="flex justify-center gap-4 flex-wrap">
                                            {state.promptData?.words?.map(word => (
                                                <span key={word} className="px-8 py-3 bg-white/10 rounded-2xl border border-white/20 text-white font-black text-2xl shadow-xl backdrop-blur-md">
                                                    {word}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {state.mode === ActivityMode.STORY_CONTINUATION && (
                                    <div className="text-center space-y-6">
                                        <p className="text-purple-400 font-black uppercase tracking-[0.2em] text-sm">Hikayenin Başı</p>
                                        <p className="text-2xl md:text-3xl font-medium text-white italic leading-relaxed">
                                            "{state.promptData?.story}"
                                        </p>
                                        <p className="text-indigo-400 font-bold text-lg">...peki sonra ne oldu? Çizerek göster!</p>
                                    </div>
                                )}
                                {state.mode === ActivityMode.STILL_LIFE && (
                                    <div className="text-center space-y-6">
                                        <p className="text-indigo-400 font-black uppercase tracking-[0.2em] text-sm">Bu Masayı Çiz</p>
                                        <img src={state.promptData?.imageUrl} alt="Still Life Reference" className="mx-auto rounded-3xl shadow-2xl border-8 border-white/5 max-h-80 object-cover" />
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col items-center space-y-8">
                                <p className="text-slate-400 text-lg font-medium text-center max-w-lg">
                                    Resmini kağıda yap, bitince fotoğrafını çekip buraya yükle!
                                </p>

                                {!state.uploadedImage ? (
                                    <label className="w-full max-w-xl cursor-pointer group">
                                        <div className="border-4 border-dashed border-white/10 rounded-[2.5rem] p-16 flex flex-col items-center transition-all duration-300 group-hover:border-pink-500/50 group-hover:bg-pink-500/5">
                                            <div className="w-20 h-20 bg-pink-500/20 text-pink-500 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                                <Camera size={40} />
                                            </div>
                                            <span className="text-white font-black text-xl mb-2">Resmini Seç veya Fotoğraf Çek</span>
                                            <span className="text-slate-500 font-medium text-sm">PNG, JPG veya JPEG</span>
                                            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                                        </div>
                                    </label>
                                ) : (
                                    <div className="w-full flex flex-col items-center space-y-8">
                                        <div className="relative group">
                                            <img src={state.uploadedImage} className="max-h-[500px] rounded-3xl shadow-2xl border-8 border-white/10 object-contain" alt="Çizimin" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl flex items-center justify-center">
                                                <button
                                                    onClick={() => setState(prev => ({ ...prev, uploadedImage: undefined }))}
                                                    className="bg-white text-slate-900 font-black py-3 px-8 rounded-full flex items-center gap-2 hover:scale-105 transition-transform"
                                                >
                                                    <RotateCcw size={18} /> Değiştir
                                                </button>
                                            </div>
                                        </div>
                                        {/* Kalan hak bilgisi */}
                                        {!isTeacher && analysisQuota !== null && (
                                            <p className="text-center text-sm text-slate-400 mb-2">
                                                Kalan analiz hakkı: <span className="font-bold text-pink-400">{analysisQuota}</span>
                                            </p>
                                        )}

                                        {analysisQuota !== null && analysisQuota <= 0 && !isTeacher ? (
                                            <div className="space-y-3 text-center">
                                                <button
                                                    disabled
                                                    className="group relative inline-flex items-center justify-center gap-4 px-16 py-6 bg-slate-600/50 text-slate-400 font-black text-2xl rounded-full cursor-not-allowed overflow-hidden"
                                                >
                                                    <span className="relative flex items-center gap-3">
                                                        <Lock className="w-6 h-6" /> Analiz Hakkınız Bitti
                                                    </span>
                                                </button>
                                                <p className="text-rose-400 text-sm font-medium">
                                                    Analiz hakkınız tükendi. Daha fazla hak için öğretmeninize başvurun.
                                                </p>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={submitDrawing}
                                                disabled={state.status === 'ANALYZING'}
                                                className="group relative inline-flex items-center justify-center gap-4 px-16 py-6 bg-gradient-to-r from-pink-600 to-purple-700 text-white font-black text-2xl rounded-full hover:shadow-2xl hover:shadow-pink-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {state.status === 'ANALYZING' ? (
                                                    <span className="flex items-center gap-4">
                                                        <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                                                        Öğretmen Bakıyor...
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-4">
                                                        Öğretmene Gönder! <Send className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                                    </span>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {state.status === 'FINISHED' && (
                    <motion.div
                        key="finished"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-12"
                    >
                        <div className="text-center space-y-4">
                            <h2 className="text-5xl font-black text-white tracking-tight">Harika İş Çıkardın! 🌟</h2>
                            <p className="text-slate-400 text-xl font-medium">Resim öğretmenin senin çalışmanı inceledi.</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-pink-400 font-bold uppercase tracking-widest text-xs ml-2">
                                    <User size={14} /> Senin Eserin
                                </div>
                                <img src={state.uploadedImage} className="w-full rounded-[2.5rem] shadow-2xl border-8 border-white/5 object-contain max-h-[600px] bg-slate-900" alt="Sonuç" />
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-purple-400 font-bold uppercase tracking-widest text-xs ml-2">
                                    <MessageCircle size={14} /> Öğretmenin Yorumu
                                </div>
                                <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-10 border border-white/10 shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"></div>
                                    <div className="text-slate-200 leading-relaxed text-xl whitespace-pre-wrap font-medium relative z-10">
                                        {state.feedback}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4">
                                    <button
                                        onClick={() => setState(prev => ({ ...prev, status: 'DRAWING', uploadedImage: undefined, feedback: undefined }))}
                                        className="w-full py-6 bg-white/10 text-white font-bold text-xl rounded-[2rem] border border-white/20 hover:bg-white/20 transition-all duration-300"
                                    >
                                        Bu Görev İçin Yeni Resim Yükle
                                    </button>
                                    <button
                                        onClick={reset}
                                        className="w-full py-8 bg-gradient-to-r from-pink-600 to-purple-700 text-white font-black text-2xl rounded-[2rem] hover:shadow-2xl hover:shadow-pink-500/40 transition-all duration-300 transform hover:-translate-y-1 active:scale-95"
                                    >
                                        Yeni Bir Göreve Başla!
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {state.error && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 bg-red-500/20 backdrop-blur-md border border-red-500/50 text-white px-8 py-4 rounded-2xl flex items-center justify-between"
                >
                    <span className="font-bold">{state.error}</span>
                    <button onClick={() => setState(prev => ({ ...prev, error: undefined }))} className="text-white/60 hover:text-white">Kapat</button>
                </motion.div>
            )}
        </div>
    );
};

const ModeCard: React.FC<{ title: string; desc: string; icon: React.ReactNode; color: string; onClick: () => void }> = ({ title, desc, icon, color, onClick }) => (
    <motion.button
        whileHover={{ y: -10 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="group relative bg-white/5 backdrop-blur-xl p-10 rounded-[3.5rem] border border-white/10 shadow-2xl hover:border-white/20 transition-all duration-500 text-left flex flex-col h-full overflow-hidden"
    >
        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 blur-3xl transition-opacity duration-500`} />

        <div className={`w-20 h-20 bg-gradient-to-br ${color} text-white rounded-[1.75rem] flex items-center justify-center mb-8 text-4xl shadow-2xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
            {icon}
        </div>

        <h3 className="text-2xl font-black mb-4 text-white group-hover:text-pink-400 transition-colors">{title}</h3>
        <p className="text-slate-400 font-medium leading-relaxed mb-8 flex-grow">{desc}</p>

        <div className="flex items-center gap-3 text-pink-500 font-black uppercase tracking-widest text-sm">
            Hemen Başla <ChevronLeft className="rotate-180 translate-x-0 group-hover:translate-x-2 transition-transform" size={18} />
        </div>
    </motion.button>
);

export default ResimGame;
