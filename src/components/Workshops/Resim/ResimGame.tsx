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
            const data: { words?: string[]; story?: string; imageUrl?: string } = {};
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
                                className="inline-flex items-center gap-2 text-black dark:text-white hover:text-cyber-pink transition-all mb-6 font-nunito font-extrabold uppercase text-sm tracking-widest bg-white dark:bg-slate-800 border-2 border-black/10 dark:border-white/20 px-4 py-2 rounded-xl shadow-neo-xs hover:-translate-y-1 hover:shadow-neo-sm"
                            >
                                <ChevronLeft size={16} strokeWidth={3} />
                                Atölye Sayfasına Dön
                            </button>
                            <h2 className="text-4xl md:text-5xl lg:text-7xl font-nunito font-extrabold text-black dark:text-white uppercase tracking-tighter">Bir Görev <span className="text-cyber-pink">Seç</span></h2>
                            <p className="text-slate-700 dark:text-slate-400 text-lg font-bold font-chivo">Hayal gücünü hangi macera ile başlatmak istersin?</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <ModeCard
                                title="3 Kelime Challenge"
                                desc="Sana vereceğimiz 3 gizemli kelimeyi aynı resimde buluştur!"
                                icon={<Sparkles strokeWidth={2.5} size={40} />}
                                color="bg-cyber-pink"
                                onClick={() => startTask(ActivityMode.THREE_WORDS)}
                            />
                            <ModeCard
                                title="Hikayeyi Tamamla"
                                desc="Yarım kalmış bir hikayeyi oku ve devamını hayalinle çiz!"
                                icon={<BookOpen strokeWidth={2.5} size={40} />}
                                color="bg-cyber-purple"
                                onClick={() => startTask(ActivityMode.STORY_CONTINUATION)}
                            />
                            <ModeCard
                                title="Siyah Beyaz Masa"
                                desc="Masadaki nesneleri dikkatle incele ve aynısını çizmeye çalış."
                                icon={<Utensils strokeWidth={2.5} size={40} />}
                                color="bg-cyber-blue"
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
                            <div className="w-32 h-32 border-4 border-black/10 dark:border-white/20 border-t-cyber-pink rounded-full animate-spin shadow-neo-md"></div>
                            <Palette className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-black dark:text-white" size={48} strokeWidth={2.5} />
                        </div>
                        <p className="text-3xl font-nunito font-extrabold text-black dark:text-white text-center animate-pulse uppercase tracking-tight">
                            Harika bir görev hazırlanıyor...
                        </p>
                    </motion.div>
                )}

                {(state.status === 'DRAWING' || state.status === 'ANALYZING') && (
                    <motion.div
                        key="active"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-slate-800 border-2 border-black/10 dark:border-white/20 p-8 md:p-12 rounded-2xl shadow-neo-lg relative overflow-hidden"
                    >
                        <div className="absolute top-4 right-4 sm:top-8 sm:right-8 z-20">
                            <Timer durationSeconds={2400} onTimeUp={() => { }} />
                        </div>

                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.3) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                        <div className="space-y-12 relative z-10 pt-20 sm:pt-0">
                            <div className="bg-white dark:bg-slate-900 p-8 border-2 border-black/10 dark:border-white/20 rounded-2xl shadow-neo-md">
                                {state.mode === ActivityMode.THREE_WORDS && (
                                    <div className="text-center space-y-8">
                                        <p className="text-white font-nunito font-extrabold uppercase tracking-[0.2em] text-sm bg-cyber-pink inline-block px-4 py-2 rounded-xl">Bu Kelimeleri Resminde Kullan</p>
                                        <div className="flex justify-center gap-6 flex-wrap">
                                            {state.promptData?.words?.map(word => (
                                                <span key={word} className="px-8 py-4 bg-white dark:bg-slate-800 border-2 border-black/10 dark:border-white/20 text-black dark:text-white font-nunito font-extrabold text-3xl rounded-xl shadow-neo-sm uppercase transform -rotate-2 hover:rotate-0 transition-transform">
                                                    {word}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {state.mode === ActivityMode.STORY_CONTINUATION && (
                                    <div className="text-center space-y-8">
                                        <p className="text-white font-nunito font-extrabold uppercase tracking-[0.2em] text-sm bg-cyber-purple inline-block px-4 py-2 rounded-xl">Hikayenin Başı</p>
                                        <div className="bg-white dark:bg-slate-800 p-8 border-2 border-black/10 dark:border-white/20 rounded-2xl shadow-neo-sm transform rotate-1">
                                            <p className="text-2xl md:text-3xl font-chivo font-bold text-black dark:text-white italic leading-relaxed">
                                                "{state.promptData?.story}"
                                            </p>
                                        </div>
                                        <p className="text-cyber-pink font-nunito font-extrabold text-2xl uppercase tracking-wider">...peki sonra ne oldu? Çizerek göster!</p>
                                    </div>
                                )}
                                {state.mode === ActivityMode.STILL_LIFE && (
                                    <div className="text-center space-y-8">
                                        <p className="text-white font-nunito font-extrabold uppercase tracking-[0.2em] text-sm bg-cyber-blue inline-block px-4 py-2 rounded-xl">Bu Resmi Çiz</p>
                                        <div className="inline-block border-3 border-black/10 rounded-2xl shadow-neo-md transform -rotate-1 hover:rotate-0 transition-transform bg-white p-2 overflow-hidden">
                                            <img src={state.promptData?.imageUrl} alt="Still Life Reference" className="max-h-80 object-cover rounded-xl" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col items-center space-y-8">
                                <p className="text-slate-800 dark:text-slate-200 text-xl font-bold font-chivo text-center max-w-lg bg-white/80 dark:bg-slate-800/80 p-4 border-l-4 border-cyber-emerald">
                                    Resmini kağıda çiz, bitince fotoğrafını çekip buraya yükle!
                                </p>

                                {!state.uploadedImage ? (
                                    <label className="w-full max-w-xl cursor-pointer group">
                                        <div className="bg-white dark:bg-slate-800 border-2 border-dashed border-black/20 dark:border-white/20 rounded-2xl p-16 flex flex-col items-center transition-all duration-300 group-hover:border-solid group-hover:border-cyber-pink/30 hover:shadow-neo-md hover:-translate-y-2">
                                            <div className="w-24 h-24 bg-cyber-pink/10 rounded-2xl text-cyber-pink flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform">
                                                <Camera size={48} strokeWidth={2.5} />
                                            </div>
                                            <span className="text-black dark:text-white font-nunito font-extrabold text-2xl mb-2 text-center uppercase">Resmini Seç veya <br /> Fotoğraf Çek</span>
                                            <span className="text-slate-500 font-bold text-sm bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-lg mt-4">PNG, JPG veya JPEG</span>
                                            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                                        </div>
                                    </label>
                                ) : (
                                    <div className="w-full flex flex-col items-center space-y-8">
                                        <div className="relative group inline-block">
                                            <img src={state.uploadedImage} className="max-h-[500px] border-3 border-black/10 rounded-2xl shadow-neo-md object-contain bg-white dark:bg-slate-700 p-2 transform rotate-1" alt="Çizimin" />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm m-2">
                                                <button
                                                    onClick={() => setState(prev => ({ ...prev, uploadedImage: undefined }))}
                                                    className="bg-cyber-yellow text-black font-nunito font-extrabold text-xl uppercase tracking-widest py-4 px-8 border-2 border-black/10 rounded-xl flex items-center gap-3 shadow-neo-sm hover:shadow-neo-md hover:-translate-y-1 transition-all"
                                                >
                                                    <RotateCcw size={24} strokeWidth={3} /> Değiştir
                                                </button>
                                            </div>
                                        </div>
                                        {/* Kalan hak bilgisi */}
                                        {!isTeacher && analysisQuota !== null && (
                                            <p className="text-center font-nunito font-extrabold uppercase p-3 bg-white dark:bg-slate-800 border-2 border-black/10 dark:border-white/20 rounded-xl shadow-neo-xs transform -rotate-1">
                                                Kalan analiz hakkı: <span className="font-black text-cyber-pink text-xl">{analysisQuota}</span>
                                            </p>
                                        )}

                                        {analysisQuota !== null && analysisQuota <= 0 && !isTeacher ? (
                                            <div className="space-y-4 text-center">
                                                <button
                                                    disabled
                                                    className="group relative inline-flex items-center justify-center gap-4 px-12 py-6 bg-slate-200 dark:bg-slate-700 text-slate-400 font-nunito font-extrabold text-2xl uppercase rounded-2xl border-2 border-slate-300 shadow-neo-md cursor-not-allowed"
                                                >
                                                    <span className="relative flex items-center gap-3">
                                                        <Lock className="w-8 h-8" strokeWidth={3} /> Analiz Hakkınız Bitti
                                                    </span>
                                                </button>
                                                <p className="text-red-500 font-bold bg-white dark:bg-slate-800 border-2 border-red-500/30 rounded-xl px-4 py-2">
                                                    Daha fazla hak için öğretmeninize başvurun.
                                                </p>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={submitDrawing}
                                                disabled={state.status === 'ANALYZING'}
                                                className="group relative inline-flex items-center justify-center gap-4 px-12 py-6 bg-cyber-emerald text-black font-nunito font-extrabold text-2xl uppercase tracking-wider rounded-2xl border-2 border-black/10 shadow-neo-md hover:shadow-neo-lg hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {state.status === 'ANALYZING' ? (
                                                    <span className="flex items-center gap-4">
                                                        <div className="w-8 h-8 border-2 border-black/10 border-t-white rounded-full animate-spin"></div>
                                                        Öğretmen Bakıyor...
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-4">
                                                        Öğretmene Gönder! <Send size={28} strokeWidth={3} className="group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" />
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
                        <div className="bg-cyber-yellow border-2 border-black/10 rounded-2xl p-10 shadow-neo-md text-center">
                            <h2 className="text-3xl md:text-5xl lg:text-6xl font-nunito font-extrabold text-black tracking-tight uppercase mb-4">Harika İş Çıkardın! 🌟</h2>
                            <p className="text-black/80 text-xl font-bold font-chivo">Resim öğretmenin senin çalışmanı inceledi.</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 text-black dark:text-white font-nunito font-extrabold uppercase tracking-widest bg-white dark:bg-slate-800 border-2 border-black/10 dark:border-white/20 rounded-xl p-4 shadow-neo-xs w-max">
                                    <User size={24} strokeWidth={3} className="text-cyber-pink" /> Senin Eserin
                                </div>
                                <div className="bg-white dark:bg-slate-800 border-2 border-black/10 dark:border-white/20 rounded-2xl p-4 shadow-neo-md">
                                    <img src={state.uploadedImage} className="w-full border-2 border-black/10 rounded-xl object-contain max-h-[600px] bg-slate-100 dark:bg-slate-900" alt="Sonuç" />
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center gap-3 text-black dark:text-white font-nunito font-extrabold uppercase tracking-widest bg-white dark:bg-slate-800 border-2 border-black/10 dark:border-white/20 rounded-xl p-4 shadow-neo-xs w-max">
                                    <MessageCircle size={24} strokeWidth={3} className="text-cyber-blue" /> Öğretmenin Yorumu
                                </div>
                                <div className="bg-white dark:bg-slate-800 border-2 border-black/10 dark:border-white/20 rounded-2xl p-8 md:p-12 shadow-neo-md relative overflow-hidden">
                                    <div className="absolute top-0 right-0 -mr-6 -mt-6 opacity-10 blur-xl w-32 h-32 bg-cyber-pink pointer-events-none" />
                                    <div className="text-slate-800 dark:text-slate-200 font-chivo leading-relaxed text-lg md:text-xl whitespace-pre-wrap font-bold relative z-10">
                                        {state.feedback}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-6 mt-8">
                                    <button
                                        onClick={() => setState(prev => ({ ...prev, status: 'DRAWING', uploadedImage: undefined, feedback: undefined }))}
                                        className="w-full py-5 bg-white dark:bg-slate-800 text-black dark:text-white font-nunito font-extrabold text-xl uppercase tracking-widest rounded-2xl border-2 border-black/10 dark:border-white/20 shadow-neo-sm hover:shadow-neo-md hover:-translate-y-1 transition-all"
                                    >
                                        Bu Görev İçin Yeni Resim Yükle
                                    </button>
                                    <button
                                        onClick={reset}
                                        className="w-full py-6 bg-cyber-pink text-white font-nunito font-extrabold text-2xl uppercase tracking-widest rounded-2xl border-2 border-black/10 shadow-neo-md hover:shadow-neo-lg hover:-translate-y-1 transition-all"
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
                    className="mt-8 bg-white border-2 border-red-500/30 rounded-2xl shadow-neo-sm px-8 py-6 flex items-center justify-between"
                >
                    <span className="font-nunito font-extrabold text-red-500 text-xl uppercase tracking-wider">{state.error}</span>
                    <button onClick={() => setState(prev => ({ ...prev, error: undefined }))} className="text-black bg-slate-200 px-4 py-2 border-2 border-black/10 rounded-xl font-bold uppercase text-sm hover:bg-slate-300 transition-colors">Kapat</button>
                </motion.div>
            )}
        </div>
    );
};

const ModeCard: React.FC<{ title: string; desc: string; icon: React.ReactNode; color: string; onClick: () => void }> = ({ title, desc, icon, color, onClick }) => (
    <motion.button
        whileHover={{ y: -8, x: -8 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={`group relative bg-white dark:bg-slate-800 p-8 rounded-2xl border-2 border-black/10 dark:border-white/20 shadow-neo-md hover:shadow-neo-lg transition-all duration-300 text-left flex flex-col h-full overflow-hidden`}
    >
        <div className={`w-24 h-24 ${color} rounded-2xl border-2 border-black/10 text-white flex items-center justify-center mb-8 shadow-neo-sm transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110`}>
            {icon}
        </div>

        <h3 className="text-3xl font-nunito font-extrabold mb-4 text-black dark:text-white uppercase leading-none tracking-tight">{title}</h3>
        <p className="text-slate-700 dark:text-slate-400 font-bold font-chivo leading-relaxed mb-8 flex-grow">{desc}</p>

        <div className="flex items-center gap-3 text-black dark:text-white font-nunito font-extrabold uppercase tracking-widest text-sm bg-slate-100 dark:bg-slate-700 p-3 rounded-xl border-2 border-black/10 dark:border-white/10 w-max">
            Hemen Başla <ChevronLeft strokeWidth={3} className="rotate-180 transition-transform group-hover:translate-x-2" size={18} />
        </div>
    </motion.button>
);

export default ResimGame;
