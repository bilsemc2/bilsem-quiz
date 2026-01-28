import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useResults } from './contexts/ResultsContext';
import { useProgress } from './contexts/ProgressContext';
import { useModal } from './contexts/ModalContext';
import './muzik.css';

const ReportPage: React.FC = () => {
    const { testResults, getOverallPerformance, resetResults } = useResults();
    const { resetProgress } = useProgress();
    const { confirm } = useModal();
    const navigate = useNavigate();

    const overallScore = getOverallPerformance();

    const handleReset = async () => {
        const ok = await confirm({
            title: 'Testi Sıfırla',
            message: 'Tüm ilerlemeniz ve sonuçlarınız silinecektir. Emin misiniz?',
            confirmText: 'Evet, Sıfırla',
            cancelText: 'Vazgeç'
        });

        if (ok) {
            resetResults();
            resetProgress();
            navigate('/atolyeler/muzik');
        }
    };

    const getScoreColorClass = (score: number) => {
        if (score >= 80) return 'text-emerald-500';
        if (score >= 50) return 'text-amber-500';
        return 'text-rose-500';
    };

    const getScoreBgClass = (score: number) => {
        if (score >= 80) return 'bg-emerald-500';
        if (score >= 50) return 'bg-amber-500';
        return 'bg-rose-500';
    };

    const categories = [
        { id: 'single-note', name: 'Tek Ses Tekrarı', icon: '🎵' },
        { id: 'double-note', name: 'İki Ses Tekrarı', icon: '🎶' },
        { id: 'triple-note', name: 'Üç Ses Tekrarı', icon: '🎼' },
        { id: 'melody', name: 'Melodi Tekrarı', icon: '🎹' },
        { id: 'rhythm', name: 'Ritim Tekrarı', icon: '🥁' },
        { id: 'melody-difference', name: 'Melodi Farklılıkları', icon: '🎸' },
        { id: 'rhythm-difference', name: 'Ritim Farklılıkları', icon: '🎺' },
        { id: 'song-performance', name: 'Şarkı Performansı', icon: '🎤' }
    ];

    return (
        <div className="muzik-section-box max-w-5xl mx-auto p-12">
            <header className="text-center mb-16">
                <h1 className="text-6xl font-black mb-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent animate-[shimmer_3s_infinite_linear] bg-[length:200%_auto] font-poppins tracking-tight">
                    Müzik Yetenek Raporun 🌟
                </h1>
                <p className="text-xl opacity-70 font-medium text-slate-600 dark:text-slate-400">Harika bir iş çıkardın! İşte test sonuçların:</p>
            </header>

            <section className="relative mb-20 p-14 bg-white/40 dark:bg-slate-800/20 backdrop-blur-2xl rounded-[3.5rem] border border-white/30 dark:border-white/5 shadow-2xl overflow-hidden group">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                <div className="relative text-center z-10">
                    <div className={`text-8xl font-black mb-4 drop-shadow-2xl ${getScoreColorClass(overallScore)}`}>
                        %{overallScore.toFixed(0)}
                    </div>
                    <div className="text-2xl font-bold opacity-80 uppercase tracking-widest">Genel Başarı Puanı</div>
                    <div className="mt-8 flex justify-center gap-2">
                        {[...Array(5)].map((_, i) => (
                            <span key={i} className={`text-4xl ${i < Math.round(overallScore / 20) ? 'grayscale-0' : 'grayscale opacity-20'}`}>⭐</span>
                        ))}
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                {categories.map(cat => {
                    const result = (testResults as Record<string, { score?: number; overallScore?: number } | undefined>)[cat.id];
                    const score = result ? (result.score ?? result.overallScore ?? 0) : null;

                    return (
                        <div key={cat.id} className="p-8 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl rounded-[2rem] border border-white/20 shadow-lg hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between group">
                            <div className="flex items-center gap-5 mb-8">
                                <div className="w-16 h-16 rounded-[1.25rem] bg-emerald-500/10 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-500">
                                    {cat.icon}
                                </div>
                                <span className="text-sm font-black uppercase tracking-wider opacity-70 leading-tight">{cat.name}</span>
                            </div>

                            {score !== null ? (
                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <span className={`text-2xl font-black ${getScoreColorClass(score)}`}>%{score.toFixed(0)}</span>
                                        <span className="text-[10px] font-bold opacity-30 uppercase tracking-widest">Başarı</span>
                                    </div>
                                    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${getScoreBgClass(score)}`}
                                            style={{ width: `${score}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-xs font-bold opacity-30 italic text-center py-4 border-2 border-dashed border-white/5 rounded-2xl">
                                    Henüz tamamlanmadı
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <section className="p-12 bg-white/40 dark:bg-slate-800/20 backdrop-blur-2xl rounded-[3rem] border border-white/30 dark:border-white/5 mb-20 relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mb-6 flex items-center gap-4">
                        <span className="text-4xl">🌈</span> Uzman Görüşü ve Tavsiyeler
                    </h3>
                    <p className="text-lg leading-relaxed font-medium opacity-80 italic">
                        {overallScore >= 80 ? (
                            "Olağanüstü bir müzik kulağına sahipsin! Sesleri ve ritimleri algılama yeteneğin çok gelişmiş. Bir müzik enstrümanı çalmaya başlamak için harika bir zaman olabilir."
                        ) : overallScore >= 50 ? (
                            "Müzikal yeteneğin oldukça iyi! Bazı seslerde ve ritimlerde biraz daha pratik yaparak mükemmel hale gelebilirsin. Müzik dinlerken ritim tutmaya devam et!"
                        ) : (
                            "Müzik dünyasına harika bir adım attın! Sesleri tanımaya ve ritimleri yakalamaya başladın. Bol bol müzik dinleyerek ve şarkı söyleyerek kulağını daha da geliştirebilirsin."
                        )}
                    </p>
                </div>
            </section>

            <footer className="flex flex-col sm:flex-row justify-center gap-4">
                <button
                    onClick={() => navigate('/atolyeler/muzik')}
                    className="py-5 px-14 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl font-black text-xl hover:shadow-2xl hover:shadow-emerald-500/20 transition-all hover:-translate-y-1"
                >
                    Workshop Paneline Dön 🏠
                </button>
                <button
                    onClick={handleReset}
                    className="py-5 px-12 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-2xl font-bold text-lg hover:bg-rose-500 hover:text-white transition-all shadow-lg hover:-translate-y-1"
                >
                    Testi Sıfırla 🔄
                </button>
            </footer>
        </div>
    );
};

export default ReportPage;
