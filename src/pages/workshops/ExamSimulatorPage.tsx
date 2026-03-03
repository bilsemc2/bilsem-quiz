// Sınav Simülasyonu Hub Sayfası
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import {
    Brain, ChevronLeft, Play, Target, Scale,
    Zap, ChevronRight, AlertCircle, CheckCircle2,
    Clock, BookOpen, Trophy, BarChart3, Shield,
    Lightbulb, Puzzle, Eye, MessageSquare, Gauge, Users, LucideIcon
} from 'lucide-react';
import { useExam } from '../../contexts/ExamContext';
import { useAuth } from '../../contexts/AuthContext';
import { EXAM_MODES, ExamMode } from '../../types/examTypes';
import { getActiveModules, getModuleCountByCategory } from '../../config/examModules';
import AccessDeniedScreen from '../../components/AccessDeniedScreen';

const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; bgColor: string; textColor: string }> = {
    memory: { icon: Brain, bgColor: 'bg-cyber-purple/10', textColor: 'text-cyber-purple' },
    logic: { icon: Puzzle, bgColor: 'bg-cyber-emerald/10', textColor: 'text-cyber-emerald' },
    attention: { icon: Eye, bgColor: 'bg-cyber-gold/10', textColor: 'text-cyber-gold' },
    verbal: { icon: MessageSquare, bgColor: 'bg-cyber-pink/10', textColor: 'text-cyber-pink' },
    speed: { icon: Gauge, bgColor: 'bg-orange-100 dark:bg-orange-900/20', textColor: 'text-orange-500' },
    perception: { icon: Lightbulb, bgColor: 'bg-cyber-blue/10', textColor: 'text-cyber-blue' },
    social: { icon: Users, bgColor: 'bg-gray-100 dark:bg-slate-700', textColor: 'text-slate-600 dark:text-slate-300' }
};

const CATEGORY_LABELS: Record<string, string> = {
    memory: 'Bellek', logic: 'Mantık', attention: 'Dikkat',
    verbal: 'Sözel', speed: 'Hız', perception: 'Algı', social: 'Sosyal'
};

const MODE_ICONS: Record<string, LucideIcon> = { Zap, Scale, Target, Trophy };

const ExamSimulatorPage: React.FC = () => {
    const navigate = useNavigate();
    const { profile } = useAuth();
    const { session, isExamActive, startExam } = useExam();
    const [selectedMode, setSelectedMode] = useState<ExamMode>('standard');
    const [showConfirm, setShowConfirm] = useState(false);

    const activeModules = getActiveModules();
    const categoryCounts = getModuleCountByCategory();
    const modeConfig = EXAM_MODES.find(m => m.id === selectedMode)!;

    useEffect(() => {
        if (isExamActive && session) navigate('/atolyeler/sinav-simulasyonu/devam');
    }, [isExamActive, session, navigate]);

    const handleStartExam = () => { startExam(selectedMode); navigate('/atolyeler/sinav-simulasyonu/devam'); };

    const hasExamAccess = (y: string[] | string | null | undefined): boolean => {
        if (!y) return false;
        const s = Array.isArray(y) ? y : [y];
        return s.some(v => v === 'genel yetenek' || v === 'genel yetenek - bireysel');
    };

    if (!profile) return <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center"><div className="w-12 h-12 border-4 border-cyber-emerald border-t-transparent rounded-full animate-spin" /></div>;

    if (!hasExamAccess(profile?.yetenek_alani)) return <AccessDeniedScreen requiredTalent="Genel Yetenek" backLink="/atolyeler/bireysel-degerlendirme" backLabel="Bireysel Değerlendirme" additionalMessage="Yakında diğer yetenek alanları için de simülasyonlar eklenecek! 🚀" />;

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-800 pt-20 pb-12 px-4 sm:px-6 relative overflow-hidden transition-colors duration-300">
            <div className="fixed inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(0,0,0,0.15)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

            <div className="relative z-10 container mx-auto max-w-5xl">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
                    <Link to="/atolyeler/bireysel-degerlendirme" className="inline-flex items-center gap-2 text-black dark:text-white font-nunito font-extrabold uppercase text-xs tracking-widest bg-white dark:bg-slate-800 border-3 border-black/10 rounded-xl px-4 py-2 shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-md transition-all mb-6">
                        <ChevronLeft size={14} strokeWidth={3} /> Bireysel Değerlendirme
                    </Link>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-cyber-emerald/10 border-3 border-cyber-emerald/30 rounded-2xl"><Brain size={32} className="text-cyber-emerald" strokeWidth={2.5} /></div>
                            <div>
                                <h1 className="text-3xl md:text-5xl font-nunito font-extrabold text-black dark:text-white uppercase tracking-tight leading-none mb-1">Sınav <span className="text-cyber-blue">Simülasyonu</span></h1>
                                <p className="text-slate-500 font-nunito font-bold text-sm">Gerçekçi BİLSEM değerlendirme deneyimi</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl px-5 py-3 shadow-neo-sm">
                            <div><div className="text-[10px] font-nunito font-extrabold text-slate-400 uppercase tracking-widest">Hazır Modül</div><div className="text-3xl font-nunito font-extrabold text-black dark:text-white leading-none">{activeModules.length}</div></div>
                            <div className="w-10 h-10 bg-cyber-gold/10 border-2 border-cyber-gold/20 rounded-xl flex items-center justify-center"><Trophy size={20} className="text-cyber-gold" strokeWidth={2.5} /></div>
                        </div>
                    </div>
                </motion.div>

                {/* Mode Selection */}
                <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl p-6 md:p-8 mb-8 shadow-neo-md">
                    <h2 className="text-lg md:text-xl font-nunito font-extrabold text-black dark:text-white mb-6 flex items-center gap-3 uppercase tracking-tight"><Target size={24} className="text-cyber-blue" strokeWidth={3} /> Test Modu Seçin</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {EXAM_MODES.map(mode => (
                            <button key={mode.id} onClick={() => setSelectedMode(mode.id)} className={`p-5 border-3 rounded-2xl transition-all text-left flex flex-col justify-between h-full group ${selectedMode === mode.id ? 'bg-cyber-blue/10 border-cyber-blue shadow-neo-sm -translate-y-1' : 'bg-gray-50 dark:bg-slate-700 border-black/10 hover:border-black hover:bg-white dark:hover:bg-slate-600'}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-2 rounded-xl border-2 ${selectedMode === mode.id ? 'bg-cyber-blue/10 border-cyber-blue/30' : 'bg-gray-100 dark:bg-slate-800 border-transparent'}`}>
                                        {(() => { const I = MODE_ICONS[mode.icon]; return I ? <I size={24} className={selectedMode === mode.id ? 'text-cyber-blue' : 'text-slate-400'} strokeWidth={2.5} /> : null; })()}
                                    </div>
                                    {selectedMode === mode.id && <CheckCircle2 size={22} className="text-cyber-emerald" strokeWidth={2.5} />}
                                </div>
                                <div>
                                    <div className={`font-nunito font-extrabold uppercase text-lg mb-1 leading-tight ${selectedMode === mode.id ? 'text-black dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>{mode.title}</div>
                                    <div className={`font-bold text-sm ${selectedMode === mode.id ? 'text-slate-600' : 'text-slate-400'}`}>{mode.moduleCount} modül • {mode.estimatedMinutes} dk</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </motion.section>

                {/* How It Works */}
                <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl p-6 md:p-8 mb-8 shadow-neo-sm">
                    <h2 className="text-lg md:text-xl font-nunito font-extrabold text-black dark:text-white mb-6 flex items-center gap-3 uppercase tracking-tight"><Zap size={24} className="text-cyber-gold" strokeWidth={3} /> Nasıl Çalışır?</h2>
                    <div className="grid sm:grid-cols-3 gap-5">
                        {[
                            { icon: BarChart3, title: 'Rastgele Sıra', desc: `${modeConfig.moduleCount} modül karışık sırayla gelir`, color: 'cyber-emerald' },
                            { icon: Target, title: 'Adaptif Zorluk', desc: 'Performansına göre zorluk ayarlanır', color: 'cyber-blue' },
                            { icon: Trophy, title: 'Detaylı Rapor', desc: 'Kategori bazlı sonuç analizi', color: 'cyber-purple' }
                        ].map((step, idx) => (
                            <div key={idx} className="flex flex-col gap-3 p-5 bg-gray-50 dark:bg-slate-700 border-3 border-black/10 rounded-2xl hover:-translate-y-1 transition-transform">
                                <div className={`w-12 h-12 bg-${step.color}/10 border-2 border-${step.color}/20 rounded-xl flex items-center justify-center`}><step.icon size={24} className={`text-${step.color}`} strokeWidth={2.5} /></div>
                                <div><div className="text-black dark:text-white font-nunito font-extrabold uppercase tracking-tight mb-1">{step.title}</div><div className="text-slate-500 font-nunito font-bold text-sm leading-snug">{step.desc}</div></div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 p-5 bg-cyber-pink/10 border-3 border-cyber-pink/30 rounded-2xl flex items-start gap-4">
                        <AlertCircle size={24} className="text-cyber-pink shrink-0 mt-0.5" strokeWidth={2.5} />
                        <p className="text-slate-600 dark:text-slate-300 font-nunito font-bold text-sm leading-relaxed"><strong className="font-extrabold uppercase tracking-wider text-black dark:text-white block mb-1">Önemli Uyarı:</strong>Sınav başladıktan sonra ara verilemez. Lütfen hazırlıklı olun ve kesintisiz <span className="font-extrabold text-black dark:text-white">{modeConfig.estimatedMinutes} dakika</span> ayırın.</p>
                    </div>
                </motion.section>

                {/* Category Stats */}
                <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-12">
                    <h2 className="text-lg md:text-xl font-nunito font-extrabold text-black dark:text-white mb-6 flex items-center gap-3 uppercase tracking-tight"><BookOpen size={24} className="text-cyber-pink" strokeWidth={3} /> Test Kategorileri</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                        {Object.entries(categoryCounts).map(([cat, count]) => {
                            const c = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.memory; const I = c.icon; return (
                                <div key={cat} className={`${c.bgColor} border-3 border-black/10 rounded-2xl p-5 text-center hover:-translate-y-1 transition-all`}><I size={28} className={`mx-auto mb-3 ${c.textColor}`} strokeWidth={2.5} /><div className={`text-3xl font-nunito font-extrabold leading-none mb-2 ${c.textColor}`}>{count}</div><div className={`text-[10px] font-nunito font-extrabold uppercase tracking-widest ${c.textColor}`}>{CATEGORY_LABELS[cat]}</div></div>
                            );
                        })}
                    </div>
                </motion.section>

                {/* Start Button */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-center pb-8">
                    <button onClick={() => setShowConfirm(true)} className="inline-flex items-center gap-4 px-10 py-5 bg-cyber-gold text-black font-nunito font-extrabold text-xl md:text-2xl uppercase tracking-widest border-2 border-black/10 rounded-2xl shadow-neo-lg hover:-translate-y-1 active:translate-y-1 active:shadow-none transition-all"><Play size={28} fill="currentColor" /> Sınavı Başlat <ChevronRight size={28} strokeWidth={3} /></button>
                    <div className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border-2 border-black/10 rounded-xl"><Clock size={18} className="text-cyber-blue" strokeWidth={2.5} /><span className="font-nunito font-extrabold uppercase tracking-widest text-sm text-slate-600 dark:text-slate-300">Tahmini süre: {modeConfig.estimatedMinutes} dk</span></div>
                </motion.div>

                {/* Confirmation Modal */}
                <AnimatePresence>
                    {showConfirm && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowConfirm(false)}>
                            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl p-6 sm:p-10 max-w-md w-full shadow-neo-lg relative">
                                <div className="w-16 h-16 bg-cyber-blue/10 border-3 border-cyber-blue/30 rounded-2xl flex items-center justify-center mx-auto mb-6"><Shield size={36} className="text-cyber-blue" strokeWidth={2.5} /></div>
                                <h3 className="text-2xl font-nunito font-extrabold text-black dark:text-white text-center mb-4 uppercase tracking-tight">Sınava Hazır mısın?</h3>
                                <p className="text-slate-500 font-nunito font-bold text-center mb-8"><span className="text-cyber-blue font-extrabold block text-xl mb-1">{modeConfig.title}</span> Modunda <span className="font-extrabold text-black dark:text-white">{modeConfig.moduleCount} modül</span> çözeceksin.</p>
                                <div className="bg-gray-50 dark:bg-slate-700 border-2 border-black/10 rounded-2xl p-4 mb-8 flex items-center justify-center gap-3"><Clock size={20} className="text-cyber-blue" strokeWidth={2.5} /><span className="font-nunito font-extrabold uppercase text-black dark:text-white">Tahmini süre: {modeConfig.estimatedMinutes} dk</span></div>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button onClick={() => setShowConfirm(false)} className="flex-1 py-4 bg-gray-100 dark:bg-slate-700 text-black dark:text-white font-nunito font-extrabold uppercase tracking-wider border-3 border-black/10 rounded-xl shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-md transition-all">Vazgeç</button>
                                    <button onClick={handleStartExam} className="flex-1 py-4 bg-cyber-emerald text-black font-nunito font-extrabold uppercase tracking-wider border-3 border-black/10 rounded-xl shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-md transition-all flex items-center justify-center gap-2"><CheckCircle2 size={22} strokeWidth={2.5} /> Başlat</button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ExamSimulatorPage;
