// Sınav Simülasyonu Hub Sayfası - Profesyonel Tasarım
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

// Category icons and colors
const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; gradient: string; bgColor: string }> = {
    memory: { icon: Brain, gradient: 'from-violet-600 to-purple-700', bgColor: 'bg-violet-500/10' },
    logic: { icon: Puzzle, gradient: 'from-emerald-600 to-teal-700', bgColor: 'bg-emerald-500/10' },
    attention: { icon: Eye, gradient: 'from-orange-600 to-red-700', bgColor: 'bg-orange-500/10' },
    verbal: { icon: MessageSquare, gradient: 'from-blue-600 to-indigo-700', bgColor: 'bg-blue-500/10' },
    speed: { icon: Gauge, gradient: 'from-yellow-600 to-amber-700', bgColor: 'bg-yellow-500/10' },
    perception: { icon: Lightbulb, gradient: 'from-pink-600 to-rose-700', bgColor: 'bg-pink-500/10' },
    social: { icon: Users, gradient: 'from-cyan-600 to-sky-700', bgColor: 'bg-cyan-500/10' }
};

const CATEGORY_LABELS: Record<string, string> = {
    memory: 'Bellek',
    logic: 'Mantık',
    attention: 'Dikkat',
    verbal: 'Sözel',
    speed: 'Hız',
    perception: 'Algı',
    social: 'Sosyal'
};

// Mode icons mapping
const MODE_ICONS: Record<string, LucideIcon> = {
    Zap,
    Scale,
    Target,
    Trophy
};

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
        if (isExamActive && session) {
            navigate('/atolyeler/sinav-simulasyonu/devam');
        }
    }, [isExamActive, session, navigate]);

    const handleStartExam = () => {
        startExam(selectedMode);
        navigate('/atolyeler/sinav-simulasyonu/devam');
    };

    // Yetenek alanı erişim kontrolü - IndividualAssessmentPage ile aynı mantık
    const hasExamAccess = (yetenekAlani: string[] | string | null | undefined): boolean => {
        if (!yetenekAlani) return false;
        const skills = Array.isArray(yetenekAlani) ? yetenekAlani : [yetenekAlani];
        return skills.some(s => s === 'genel yetenek' || s === 'genel yetenek - bireysel');
    };

    const canAccess = hasExamAccess(profile?.yetenek_alani);

    // Loading state
    if (!profile) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Yetenek alanı kontrolü - Sadece Genel Yetenek kullanıcıları erişebilir
    if (!canAccess) {
        return (
            <AccessDeniedScreen
                requiredTalent="Genel Yetenek"
                backLink="/atolyeler/bireysel-degerlendirme"
                backLabel="Bireysel Değerlendirme"
                additionalMessage="Yakında diğer yetenek alanları için de simülasyonlar eklenecek! 🚀"
            />
        );
    }


    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 pt-20 pb-12 px-4 sm:px-6">
            <div className="container mx-auto max-w-5xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10"
                >
                    <Link
                        to="/atolyeler/bireysel-degerlendirme"
                        className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors mb-6 text-sm"
                    >
                        <ChevronLeft size={16} />
                        Bireysel Değerlendirme
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <Brain size={28} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold text-white">
                                    Sınav Simülasyonu
                                </h1>
                                <p className="text-slate-400 mt-1">
                                    Gerçekçi BİLSEM değerlendirme deneyimi
                                </p>
                            </div>
                        </div>

                        {/* Stats Badge */}
                        <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl px-5 py-3">
                            <div>
                                <div className="text-xs text-slate-500 uppercase tracking-wider">Hazır Modül</div>
                                <div className="text-2xl font-bold text-white">{activeModules.length}</div>
                            </div>
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                                <Trophy size={20} className="text-white" />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Mode Selection */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mb-6"
                >
                    <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-3">
                        <Target size={20} className="text-indigo-400" />
                        Test Modu Seçin
                    </h2>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {EXAM_MODES.map(mode => (
                            <button
                                key={mode.id}
                                onClick={() => setSelectedMode(mode.id)}
                                className={`p-4 rounded-xl border-2 transition-all text-left ${selectedMode === mode.id
                                    ? 'bg-indigo-600/20 border-indigo-500 shadow-lg shadow-indigo-500/10'
                                    : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600 hover:bg-slate-800'
                                    }`}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    {(() => {
                                        const IconComponent = MODE_ICONS[mode.icon];
                                        return IconComponent ? <IconComponent size={24} className="text-indigo-400" /> : null;
                                    })()}
                                    {selectedMode === mode.id && (
                                        <CheckCircle2 size={16} className="text-indigo-400" />
                                    )}
                                </div>
                                <div className="text-white font-medium">{mode.title}</div>
                                <div className="text-slate-500 text-sm mt-1">
                                    {mode.moduleCount} modül • {mode.estimatedMinutes} dk
                                </div>
                            </button>
                        ))}
                    </div>
                </motion.section>

                {/* How It Works */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mb-6"
                >
                    <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-3">
                        <Zap size={20} className="text-amber-400" />
                        Nasıl Çalışır?
                    </h2>

                    <div className="grid sm:grid-cols-3 gap-4">
                        {[
                            { icon: BarChart3, title: 'Rastgele Sıra', desc: `${modeConfig.moduleCount} modül karışık sırayla gelir`, color: 'text-emerald-400' },
                            { icon: Target, title: 'Adaptif Zorluk', desc: 'Performansına göre zorluk ayarlanır', color: 'text-blue-400' },
                            { icon: Trophy, title: 'Detaylı Rapor', desc: 'Kategori bazlı sonuç analizi', color: 'text-violet-400' }
                        ].map((step, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
                                <div className={`w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center ${step.color}`}>
                                    <step.icon size={20} />
                                </div>
                                <div>
                                    <div className="text-white font-medium">{step.title}</div>
                                    <div className="text-slate-500 text-sm mt-0.5">{step.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Warning */}
                    <div className="mt-5 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
                        <AlertCircle size={20} className="text-amber-400 shrink-0 mt-0.5" />
                        <p className="text-amber-200/80 text-sm">
                            <strong className="text-amber-200">Önemli:</strong> Sınav başladıktan sonra ara verilemez.
                            Lütfen <span className="text-white font-medium">{modeConfig.estimatedMinutes} dakika</span> ayırın.
                        </p>
                    </div>
                </motion.section>

                {/* Category Stats */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-8"
                >
                    <h2 className="text-sm font-medium text-slate-400 mb-4 flex items-center gap-2">
                        <BookOpen size={16} />
                        Test Kategorileri
                    </h2>
                    <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
                        {Object.entries(categoryCounts).map(([category, count]) => {
                            const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.memory;
                            const Icon = config.icon;
                            return (
                                <div
                                    key={category}
                                    className={`${config.bgColor} border border-slate-700/50 rounded-xl p-3 text-center`}
                                >
                                    <Icon size={20} className="mx-auto text-slate-400 mb-1" />
                                    <div className="text-xl font-bold text-white">{count}</div>
                                    <div className="text-slate-500 text-xs mt-0.5">
                                        {CATEGORY_LABELS[category]}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </motion.section>

                {/* Start Button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-center"
                >
                    <button
                        onClick={() => setShowConfirm(true)}
                        className="inline-flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-lg rounded-xl shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5"
                    >
                        <Play size={22} fill="currentColor" />
                        Sınavı Başlat
                        <ChevronRight size={20} />
                    </button>
                    <p className="text-slate-600 text-sm mt-3 flex items-center justify-center gap-1">
                        <Clock size={14} />
                        Tahmini süre: {modeConfig.estimatedMinutes} dakika
                    </p>
                </motion.div>

                {/* Confirmation Modal */}
                <AnimatePresence>
                    {showConfirm && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6"
                            onClick={() => setShowConfirm(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                onClick={e => e.stopPropagation()}
                                className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl"
                            >
                                <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/20">
                                    <Shield size={32} className="text-white" />
                                </div>

                                <h3 className="text-2xl font-bold text-white text-center mb-2">
                                    Sınava Hazır mısın?
                                </h3>
                                <p className="text-slate-400 text-center mb-6">
                                    <span className="text-indigo-400 font-medium">{modeConfig.title}</span> modunda{' '}
                                    <span className="text-white font-medium">{modeConfig.moduleCount} modül</span> çözeceksin.
                                </p>

                                <div className="bg-slate-800/50 rounded-xl p-4 mb-6 flex items-center justify-center gap-2 text-slate-400">
                                    <Clock size={16} />
                                    <span>Tahmini süre: {modeConfig.estimatedMinutes} dakika</span>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowConfirm(false)}
                                        className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-colors border border-slate-700"
                                    >
                                        Vazgeç
                                    </button>
                                    <button
                                        onClick={handleStartExam}
                                        className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                                    >
                                        <CheckCircle2 size={18} />
                                        Başlat
                                    </button>
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
