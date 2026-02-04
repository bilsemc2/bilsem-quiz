// Sınav Devam Sayfası - Modül Arası Geçiş
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ChevronRight, Clock, Target,
    CheckCircle2, XCircle, TrendingUp, TrendingDown, Pause,
    AlertTriangle, X
} from 'lucide-react';
import { useExam } from '../../contexts/ExamContext';

const ExamContinuePage: React.FC = () => {
    const navigate = useNavigate();
    const [showExitModal, setShowExitModal] = useState(false);
    const {
        session,
        refreshSession,
        getCurrentModule,
        getProgress,
        getNextLevel,
        getDifficultyConfig,
        abandonExam
    } = useExam();

    // Sayfa yüklendiğinde localStorage'dan taze veri oku
    useEffect(() => {
        refreshSession();
    }, [refreshSession]);

    const currentModule = getCurrentModule();
    const progress = getProgress();
    const nextLevel = getNextLevel();
    const difficultyConfig = getDifficultyConfig(nextLevel);
    const lastResult = session?.results[session.results.length - 1];

    useEffect(() => {
        if (!session) {
            navigate('/atolyeler/sinav-simulasyonu');
        } else if (session.status === 'completed') {
            navigate('/atolyeler/sinav-simulasyonu/sonuc');
        } else if (!currentModule) {
            // No current module but session is active - something is wrong, go back
            navigate('/atolyeler/sinav-simulasyonu');
        }
    }, [session, currentModule, navigate]);

    if (!session || !currentModule) {
        // Loading state while redirect happens
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const handleContinue = () => {
        navigate(currentModule.link, {
            state: {
                examMode: true,
                examLevel: nextLevel,
                examTimeLimit: Math.round(currentModule.timeLimit * difficultyConfig.timeMultiplier)
            }
        });
    };

    const handleAbandon = () => {
        setShowExitModal(true);
    };

    const confirmAbandon = () => {
        abandonExam();
        navigate('/atolyeler/sinav-simulasyonu');
    };

    const passedCount = session.results.filter(r => r.passed).length;
    const failedCount = session.results.filter(r => !r.passed).length;

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-violet-600/10 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-900/90 backdrop-blur-xl rounded-[3rem] p-8 sm:p-12 border border-white/10 max-w-lg w-full relative z-10 shadow-2xl"
            >
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-slate-400 text-sm font-bold uppercase tracking-wider">İlerleme</span>
                        <span className="text-white font-black">{progress.current} / {progress.total}</span>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress.percentage}%` }}
                            transition={{ duration: 0.5 }}
                            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                        />
                    </div>
                </div>

                {lastResult && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mb-6 p-4 rounded-2xl border flex items-center gap-4 ${lastResult.passed
                            ? 'bg-emerald-500/10 border-emerald-500/30'
                            : 'bg-red-500/10 border-red-500/30'
                            }`}
                    >
                        {lastResult.passed ? (
                            <CheckCircle2 className="text-emerald-400 shrink-0" size={24} />
                        ) : (
                            <XCircle className="text-red-400 shrink-0" size={24} />
                        )}
                        <div className="flex-1">
                            <div className={`font-bold ${lastResult.passed ? 'text-emerald-300' : 'text-red-300'}`}>
                                {lastResult.moduleTitle}
                            </div>
                            <div className="text-sm text-slate-400">
                                {lastResult.passed ? 'Başarılı' : 'Gahyret Göstermeli'} • Seviye {lastResult.level}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-white font-black">{lastResult.score}</div>
                            <div className="text-slate-500 text-xs">puan</div>
                        </div>
                    </motion.div>
                )}

                <div className="grid grid-cols-3 gap-3 mb-8">
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                        <div className="text-xl font-black text-emerald-400">{passedCount}</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Başarılı</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                        <div className="text-xl font-black text-red-400">{failedCount}</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Gayret Göstermeli</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                        <div className="text-xl font-black text-indigo-400">{nextLevel}</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Seviye</div>
                    </div>
                </div>

                <div className="text-center mb-8">
                    <div className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-2">Sıradaki Modül</div>
                    <h2 className="text-3xl font-black text-white mb-2">{currentModule.title}</h2>

                    <div className="flex items-center justify-center gap-4 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {Math.round(currentModule.timeLimit * difficultyConfig.timeMultiplier)} sn
                        </span>
                        <span className="flex items-center gap-1">
                            <Target size={14} />
                            Seviye {nextLevel}
                        </span>
                    </div>

                    <div className={`inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full text-sm font-bold ${nextLevel > (session.currentLevel - 1)
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : nextLevel === 1
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-white/10 text-slate-300 border border-white/20'
                        }`}>
                        {nextLevel > 1 && lastResult?.passed && <TrendingUp size={16} />}
                        {nextLevel === 1 && lastResult && !lastResult.passed && <TrendingDown size={16} />}
                        {difficultyConfig.name}
                    </div>
                </div>

                <div className="bg-indigo-500/10 rounded-xl p-4 mb-8 text-center border border-indigo-500/20">
                    <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">TUZÖ Kodu</div>
                    <div className="text-indigo-300 font-bold">{currentModule.tuzo}</div>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={handleAbandon}
                        className="flex-1 py-4 bg-white/5 text-slate-400 font-bold rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                    >
                        <Pause size={18} /> Çık
                    </button>
                    <button
                        onClick={handleContinue}
                        className="flex-[2] py-4 bg-gradient-to-r from-indigo-600 to-violet-700 text-white font-black rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center justify-center gap-2"
                    >
                        DEVAM ET <ChevronRight size={20} />
                    </button>
                </div>
            </motion.div>

            {/* Exit Confirmation Modal */}
            <AnimatePresence>
                {showExitModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowExitModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-slate-900/95 backdrop-blur-xl rounded-3xl p-8 border border-white/10 max-w-md w-full shadow-2xl relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => setShowExitModal(false)}
                                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-white/10"
                            >
                                <X size={20} />
                            </button>

                            {/* Warning Icon */}
                            <div className="flex justify-center mb-6">
                                <motion.div
                                    className="w-20 h-20 rounded-full flex items-center justify-center"
                                    style={{
                                        background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                                        boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(245, 158, 11, 0.4)'
                                    }}
                                    animate={{ scale: [1, 1.05, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    <AlertTriangle size={36} className="text-white" />
                                </motion.div>
                            </div>

                            {/* Title */}
                            <h3 className="text-2xl font-black text-center text-white mb-3">
                                Sınavdan Çık?
                            </h3>

                            {/* Description */}
                            <p className="text-slate-400 text-center mb-6">
                                Sınavı iptal etmek istediğinize emin misiniz? <br />
                                <span className="text-amber-400 font-semibold">Tüm ilerlemeniz silinecek!</span>
                            </p>

                            {/* Progress Summary */}
                            <div className="bg-white/5 rounded-2xl p-4 mb-6 border border-white/10">
                                <div className="flex justify-around text-center">
                                    <div>
                                        <div className="text-lg font-bold text-emerald-400">{passedCount}</div>
                                        <div className="text-xs text-slate-500">Başarılı</div>
                                    </div>
                                    <div className="w-px bg-white/10" />
                                    <div>
                                        <div className="text-lg font-bold text-red-400">{failedCount}</div>
                                        <div className="text-xs text-slate-500">Gayret Göstermeli</div>
                                    </div>
                                    <div className="w-px bg-white/10" />
                                    <div>
                                        <div className="text-lg font-bold text-indigo-400">{progress.current}/{progress.total}</div>
                                        <div className="text-xs text-slate-500">İlerleme</div>
                                    </div>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setShowExitModal(false)}
                                    className="flex-1 py-4 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors"
                                >
                                    Vazgeç
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={confirmAbandon}
                                    className="flex-1 py-4 font-bold rounded-xl text-white"
                                    style={{
                                        background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                                        boxShadow: '0 4px 16px rgba(239, 68, 68, 0.3)'
                                    }}
                                >
                                    Evet, Çık
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ExamContinuePage;
