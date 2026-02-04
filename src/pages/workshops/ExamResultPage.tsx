// Sınav Sonuç Sayfası
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import {
    Trophy, BarChart3, CheckCircle2, XCircle,
    Clock, Target, Repeat, Home, TrendingUp
} from 'lucide-react';
import { useExam } from '../../contexts/ExamContext';
import { ExamCategory } from '../../types/examTypes';

const CATEGORY_LABELS: Record<ExamCategory, { label: string; color: string }> = {
    memory: { label: 'Bellek', color: 'violet' },
    logic: { label: 'Mantık', color: 'blue' },
    attention: { label: 'Dikkat', color: 'cyan' },
    verbal: { label: 'Sözel', color: 'pink' },
    speed: { label: 'Hız', color: 'amber' },
    perception: { label: 'Algı', color: 'emerald' },
    social: { label: 'Sosyal', color: 'rose' }
};

const ExamResultPage: React.FC = () => {
    const navigate = useNavigate();
    const { session, finishExam, abandonExam } = useExam();

    useEffect(() => {
        if (!session) {
            navigate('/atolyeler/sinav-simulasyonu');
        } else if (session.status === 'active') {
            navigate('/atolyeler/sinav-simulasyonu/devam');
        }
    }, [session, navigate]);

    useEffect(() => {
        if (session?.status === 'completed') {
            finishExam();
        }
    }, [session, finishExam]);

    if (!session || session.results.length === 0) {
        return null;
    }

    const passedCount = session.results.filter(r => r.passed).length;
    const failedCount = session.results.filter(r => !r.passed).length;
    const totalScore = session.results.reduce((sum, r) => sum + r.score, 0);
    const maxScore = session.results.reduce((sum, r) => sum + r.maxScore, 0);
    const scorePercentage = Math.round((totalScore / maxScore) * 100);
    const totalDuration = session.results.reduce((sum, r) => sum + r.duration, 0);

    const categoryStats: Record<string, { passed: number; total: number }> = {};
    session.results.forEach(r => {
        if (!categoryStats[r.category]) {
            categoryStats[r.category] = { passed: 0, total: 0 };
        }
        categoryStats[r.category].total++;
        if (r.passed) categoryStats[r.category].passed++;
    });

    const avgLevel = (session.results.reduce((sum, r) => sum + r.level, 0) / session.results.length).toFixed(1);

    // BİLSEMc2 Zeka Puanı (BZP) - IQ benzeri skorlama
    // Zorluk çarpanları
    const DIFFICULTY_MULTIPLIERS: Record<number, number> = {
        1: 0.7,
        2: 0.85,
        3: 1.0,
        4: 1.15,
        5: 1.3
    };

    // Her modül için ağırlıklı puan hesapla
    const weightedScores = session.results.map(r => {
        const baseScore = r.maxScore > 0 ? r.score / r.maxScore : 0;
        const multiplier = DIFFICULTY_MULTIPLIERS[r.level] || 1.0;
        return baseScore * multiplier;
    });

    // Ortalama ağırlıklı puan
    const avgWeightedScore = weightedScores.reduce((sum, s) => sum + s, 0) / weightedScores.length;

    // IQ benzeri ölçeğe dönüştür: 100 ortalama, 15 standart sapma simülasyonu
    // Formül: BZP = 100 + (avgWeightedScore - 0.5) * 60
    // Bu 0% -> ~70, 50% -> 100, 100% -> ~130 verir
    const bzpRaw = 100 + (avgWeightedScore - 0.5) * 60;
    const bzpScore = Math.round(Math.max(70, Math.min(145, bzpRaw))); // 70-145 aralığında sınırla

    // BZP yorumu
    const getBZPInterpretation = (score: number): { label: string; color: string; description: string } => {
        if (score >= 130) return { label: 'Üstün', color: 'from-purple-500 to-violet-600', description: 'Olağanüstü bilişsel yetenek' };
        if (score >= 120) return { label: 'Çok Yüksek', color: 'from-indigo-500 to-blue-600', description: 'Yüksek bilişsel kapasite' };
        if (score >= 110) return { label: 'Yüksek', color: 'from-emerald-500 to-teal-600', description: 'Ortalamanın üstü performans' };
        if (score >= 90) return { label: 'Ortalama', color: 'from-amber-500 to-orange-600', description: 'Normal bilişsel performans' };
        if (score >= 80) return { label: 'Gelişmekte', color: 'from-orange-500 to-red-600', description: 'Gelişime açık alanlar var' };
        return { label: 'Destek Gerekli', color: 'from-red-500 to-rose-600', description: 'Hedefli çalışma önerilir' };
    };

    const bzpInfo = getBZPInterpretation(bzpScore);

    const handleNewExam = () => {
        abandonExam();
        navigate('/atolyeler/sinav-simulasyonu');
    };

    return (
        <div className="min-h-screen bg-slate-950 pt-24 pb-12 px-4 sm:px-6">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[100px]" />
            </div>

            <div className="container mx-auto max-w-4xl relative z-10">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
                    <div className="w-24 h-24 bg-gradient-to-br from-emerald-500/20 to-teal-600/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
                        <Trophy size={48} className="text-emerald-400" />
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-2">
                        Sınav <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Tamamlandı!</span>
                    </h1>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">
                        {session.modules.length} Modül Değerlendirildi
                    </p>
                </motion.div>

                {/* BİLSEM Zeka Puanı (BZP) Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className={`bg-gradient-to-br ${bzpInfo.color} rounded-[2.5rem] p-8 sm:p-10 mb-8 text-center text-white relative overflow-hidden`}
                >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.15),_transparent_60%)]" />
                    <div className="relative z-10">
                        {/* BZP Ana Skor */}
                        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70 mb-2">
                            BiLSeMc2 Zeka Puanı
                        </div>
                        <motion.div
                            className="text-7xl sm:text-8xl font-black mb-1"
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                        >
                            {bzpScore}
                        </motion.div>
                        <div className="text-white/90 font-bold text-xl mb-1">{bzpInfo.label}</div>
                        <div className="text-white/60 text-sm">{bzpInfo.description}</div>

                        {/* IQ Gauge / Scale Bar */}
                        <div className="mt-6 max-w-md mx-auto">
                            <div className="relative h-3 bg-black/20 rounded-full overflow-hidden">
                                {/* Scale markers */}
                                <div className="absolute inset-0 flex">
                                    <div className="flex-1 border-r border-white/20" />
                                    <div className="flex-1 border-r border-white/20" />
                                    <div className="flex-1 border-r border-white/20" />
                                    <div className="flex-1" />
                                </div>
                                {/* Score indicator */}
                                <motion.div
                                    className="absolute top-0 bottom-0 w-1 bg-white rounded-full shadow-lg"
                                    initial={{ left: '0%' }}
                                    animate={{ left: `${Math.min(100, Math.max(0, ((bzpScore - 70) / 75) * 100))}%` }}
                                    transition={{ duration: 0.8, delay: 0.5, type: 'spring' }}
                                />
                            </div>
                            <div className="flex justify-between text-[10px] text-white/50 mt-1 font-bold">
                                <span>70</span>
                                <span>90</span>
                                <span>110</span>
                                <span>130</span>
                                <span>145</span>
                            </div>
                        </div>

                        {/* Stats Row */}
                        <div className="flex justify-center gap-4 sm:gap-6 mt-6 pt-6 border-t border-white/20">
                            <div>
                                <div className="text-xl sm:text-2xl font-black">{scorePercentage}%</div>
                                <div className="text-white/70 text-xs">Başarı</div>
                            </div>
                            <div className="w-px bg-white/20" />
                            <div>
                                <div className="text-xl sm:text-2xl font-black text-emerald-300">{passedCount}</div>
                                <div className="text-white/70 text-xs">Başarılı</div>
                            </div>
                            <div className="w-px bg-white/20" />
                            <div>
                                <div className="text-xl sm:text-2xl font-black text-amber-300">{failedCount}</div>
                                <div className="text-white/70 text-xs">Gayret</div>
                            </div>
                            <div className="w-px bg-white/20" />
                            <div>
                                <div className="text-xl sm:text-2xl font-black">{avgLevel}</div>
                                <div className="text-white/70 text-xs">Seviye</div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
                >
                    <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-5 text-center border border-white/10">
                        <Clock className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
                        <div className="text-2xl font-black text-white">{Math.round(totalDuration / 60)}</div>
                        <div className="text-slate-500 text-xs font-bold uppercase">Dakika</div>
                    </div>
                    <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-5 text-center border border-white/10">
                        <Target className="w-6 h-6 text-violet-400 mx-auto mb-2" />
                        <div className="text-2xl font-black text-white">{session.modules.length}</div>
                        <div className="text-slate-500 text-xs font-bold uppercase">Modül</div>
                    </div>
                    <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-5 text-center border border-white/10">
                        <TrendingUp className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                        <div className="text-2xl font-black text-white">{Math.max(...session.results.map(r => r.level))}</div>
                        <div className="text-slate-500 text-xs font-bold uppercase">Max Seviye</div>
                    </div>
                    <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-5 text-center border border-white/10">
                        <BarChart3 className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                        <div className="text-2xl font-black text-white">{totalScore}</div>
                        <div className="text-slate-500 text-xs font-bold uppercase">Toplam Puan</div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/10 mb-8"
                >
                    <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                        <BarChart3 className="text-indigo-400" /> Bilişsel Profil
                    </h2>

                    {/* Radar Chart */}
                    <div className="flex flex-col lg:flex-row items-center gap-8">
                        <div className="relative w-72 h-72 mx-auto">
                            <svg viewBox="0 0 200 200" className="w-full h-full">
                                {/* Background circles */}
                                {[0.25, 0.5, 0.75, 1].map((scale, i) => (
                                    <polygon
                                        key={i}
                                        points={(() => {
                                            const categories = Object.keys(categoryStats);
                                            const n = categories.length || 1;
                                            return categories.map((_, idx) => {
                                                const angle = (Math.PI * 2 * idx) / n - Math.PI / 2;
                                                const r = 80 * scale;
                                                return `${100 + r * Math.cos(angle)},${100 + r * Math.sin(angle)}`;
                                            }).join(' ');
                                        })()}
                                        fill="none"
                                        stroke="rgba(255,255,255,0.1)"
                                        strokeWidth="1"
                                    />
                                ))}

                                {/* Axis lines */}
                                {Object.keys(categoryStats).map((_, idx) => {
                                    const n = Object.keys(categoryStats).length;
                                    const angle = (Math.PI * 2 * idx) / n - Math.PI / 2;
                                    return (
                                        <line
                                            key={idx}
                                            x1="100"
                                            y1="100"
                                            x2={100 + 80 * Math.cos(angle)}
                                            y2={100 + 80 * Math.sin(angle)}
                                            stroke="rgba(255,255,255,0.1)"
                                            strokeWidth="1"
                                        />
                                    );
                                })}

                                {/* Data polygon */}
                                <motion.polygon
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.8, delay: 0.5 }}
                                    points={(() => {
                                        const categories = Object.entries(categoryStats);
                                        const n = categories.length || 1;
                                        return categories.map(([_, stats], idx) => {
                                            const percentage = stats.total > 0 ? stats.passed / stats.total : 0;
                                            const angle = (Math.PI * 2 * idx) / n - Math.PI / 2;
                                            const r = 80 * percentage;
                                            return `${100 + r * Math.cos(angle)},${100 + r * Math.sin(angle)}`;
                                        }).join(' ');
                                    })()}
                                    fill="rgba(99, 102, 241, 0.3)"
                                    stroke="rgb(99, 102, 241)"
                                    strokeWidth="2"
                                    style={{ transformOrigin: 'center' }}
                                />

                                {/* Data points */}
                                {Object.entries(categoryStats).map(([cat, stats], idx) => {
                                    const n = Object.keys(categoryStats).length;
                                    const percentage = stats.total > 0 ? stats.passed / stats.total : 0;
                                    const angle = (Math.PI * 2 * idx) / n - Math.PI / 2;
                                    const r = 80 * percentage;
                                    const x = 100 + r * Math.cos(angle);
                                    const y = 100 + r * Math.sin(angle);
                                    return (
                                        <motion.circle
                                            key={cat}
                                            cx={x}
                                            cy={y}
                                            r="4"
                                            fill="rgb(99, 102, 241)"
                                            stroke="white"
                                            strokeWidth="2"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.8 + idx * 0.1 }}
                                        />
                                    );
                                })}

                                {/* Labels */}
                                {Object.entries(categoryStats).map(([cat, _], idx) => {
                                    const catInfo = CATEGORY_LABELS[cat as ExamCategory];
                                    const n = Object.keys(categoryStats).length;
                                    const angle = (Math.PI * 2 * idx) / n - Math.PI / 2;
                                    const labelR = 95;
                                    const x = 100 + labelR * Math.cos(angle);
                                    const y = 100 + labelR * Math.sin(angle);
                                    return (
                                        <text
                                            key={cat}
                                            x={x}
                                            y={y}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                            className="fill-slate-300 text-[10px] font-bold"
                                        >
                                            {catInfo.label}
                                        </text>
                                    );
                                })}
                            </svg>
                        </div>

                        {/* Legend / Stats */}
                        <div className="flex-1 space-y-3">
                            {Object.entries(categoryStats).map(([cat, stats]) => {
                                const catInfo = CATEGORY_LABELS[cat as ExamCategory];
                                const percentage = Math.round((stats.passed / stats.total) * 100);
                                return (
                                    <div key={cat} className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-indigo-500" />
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-bold text-slate-300">{catInfo.label}</span>
                                                <span className="text-sm">
                                                    <span className="text-white font-bold">{percentage}%</span>
                                                    <span className="text-slate-500 ml-2">({stats.passed}/{stats.total})</span>
                                                </span>
                                            </div>
                                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mt-1">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${percentage}%` }}
                                                    transition={{ duration: 0.8, delay: 0.5 }}
                                                    className="h-full bg-indigo-500 rounded-full"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/10 mb-8"
                >
                    <h2 className="text-xl font-black text-white mb-6">Modül Detayları</h2>

                    <div className="space-y-3 max-h-80 overflow-y-auto">
                        {session.results.map((result, i) => (
                            <div
                                key={i}
                                className={`flex items-center gap-4 p-4 rounded-xl border ${result.passed
                                    ? 'bg-emerald-500/5 border-emerald-500/20'
                                    : 'bg-red-500/5 border-red-500/20'
                                    }`}
                            >
                                {result.passed ? (
                                    <CheckCircle2 className="text-emerald-400 shrink-0" size={20} />
                                ) : (
                                    <XCircle className="text-red-400 shrink-0" size={20} />
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="text-white font-bold truncate">{result.moduleTitle}</div>
                                    <div className="text-slate-500 text-xs">Seviye {result.level} • {result.duration}s</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-white font-bold">{result.score}</div>
                                    <div className="text-slate-500 text-xs">puan</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-col sm:flex-row gap-4"
                >
                    <Link
                        to="/atolyeler/bireysel-degerlendirme"
                        className="flex-1 py-4 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                    >
                        <Home size={20} /> Ana Sayfa
                    </Link>
                    <button
                        onClick={handleNewExam}
                        className="flex-1 py-4 bg-gradient-to-r from-indigo-600 to-violet-700 text-white font-black rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center justify-center gap-2"
                    >
                        <Repeat size={20} /> Yeni Sınav
                    </button>
                </motion.div>
            </div>
        </div>
    );
};

export default ExamResultPage;
