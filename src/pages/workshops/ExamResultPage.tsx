// Sınav Sonuç Sayfası
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Trophy, BarChart3, CheckCircle2, XCircle, Clock, Target, Repeat, Home, TrendingUp } from 'lucide-react';
import { useExam } from '../../contexts/ExamContext';
import { ExamCategory } from '../../types/examTypes';

const CATEGORY_LABELS: Record<ExamCategory, { label: string }> = {
    memory: { label: 'Bellek' }, logic: { label: 'Mantık' }, attention: { label: 'Dikkat' },
    verbal: { label: 'Sözel' }, speed: { label: 'Hız' }, perception: { label: 'Algı' }, social: { label: 'Sosyal' }
};

const ExamResultPage: React.FC = () => {
    const navigate = useNavigate();
    const { session, finishExam, abandonExam } = useExam();

    useEffect(() => {
        if (!session) navigate('/atolyeler/sinav-simulasyonu');
        else if (session.status === 'active') navigate('/atolyeler/sinav-simulasyonu/devam');
    }, [session, navigate]);

    useEffect(() => { if (session?.status === 'completed') finishExam(); }, [session, finishExam]);

    if (!session || session.results.length === 0) return null;

    const passedCount = session.results.filter(r => r.passed).length;
    const failedCount = session.results.filter(r => !r.passed).length;
    const totalScore = session.results.reduce((sum, r) => sum + r.score, 0);
    const maxScore = session.results.reduce((sum, r) => sum + r.maxScore, 0);
    const scorePercentage = Math.round((totalScore / maxScore) * 100);
    const totalDuration = session.results.reduce((sum, r) => sum + r.duration, 0);
    const avgLevel = (session.results.reduce((sum, r) => sum + r.level, 0) / session.results.length).toFixed(1);

    const categoryStats: Record<string, { passed: number; total: number }> = {};
    session.results.forEach(r => {
        if (!categoryStats[r.category]) categoryStats[r.category] = { passed: 0, total: 0 };
        categoryStats[r.category].total++;
        if (r.passed) categoryStats[r.category].passed++;
    });

    // BİLSEMc2 Zeka Puanı (BZP)
    const DIFF: Record<number, number> = { 1: 0.7, 2: 0.85, 3: 1.0, 4: 1.15, 5: 1.3 };
    const ws = session.results.map(r => (r.maxScore > 0 ? r.score / r.maxScore : 0) * (DIFF[r.level] || 1.0));
    const avg = ws.reduce((s, v) => s + v, 0) / ws.length;
    const bzpScore = Math.round(Math.max(70, Math.min(145, 100 + (avg - 0.5) * 60)));

    const getBZP = (s: number) => {
        if (s >= 130) return { label: 'Üstün', bg: 'bg-cyber-pink', text: 'text-white', desc: 'Olağanüstü bilişsel yetenek' };
        if (s >= 120) return { label: 'Çok Yüksek', bg: 'bg-cyber-emerald', text: 'text-black', desc: 'Yüksek bilişsel kapasite' };
        if (s >= 110) return { label: 'Yüksek', bg: 'bg-cyber-blue', text: 'text-white', desc: 'Ortalamanın üstü performans' };
        if (s >= 90) return { label: 'Ortalama', bg: 'bg-cyber-gold', text: 'text-black', desc: 'Normal bilişsel performans' };
        if (s >= 80) return { label: 'Gelişmekte', bg: 'bg-orange-400', text: 'text-black', desc: 'Gelişime açık alanlar var' };
        return { label: 'Destek Gerekli', bg: 'bg-red-500', text: 'text-white', desc: 'Hedefli çalışma önerilir' };
    };
    const bzp = getBZP(bzpScore);

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-800 pt-24 pb-12 px-4 sm:px-6 transition-colors duration-300">
            <div className="fixed inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(0,0,0,0.15)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
            <div className="container mx-auto max-w-4xl relative z-10">
                {/* Hero */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
                    <div className="w-20 h-20 bg-cyber-gold/10 border-3 border-cyber-gold/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Trophy size={40} className="text-cyber-gold" />
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-nunito font-extrabold text-black dark:text-white uppercase tracking-tight mb-4">
                        Sınav <span className="text-cyber-blue">Tamamlandı!</span>
                    </h1>
                    <p className="inline-block px-4 py-2 bg-white dark:bg-slate-800 border-2 border-black/10 rounded-xl text-black dark:text-white font-nunito font-extrabold uppercase tracking-widest text-sm">
                        {session.modules.length} Modül Değerlendirildi
                    </p>
                </motion.div>

                {/* BZP Card */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className={`${bzp.bg} border-2 border-black/10 rounded-2xl p-8 sm:p-10 mb-12 text-center ${bzp.text} shadow-neo-lg relative overflow-hidden`}>
                    <div className="relative z-10">
                        <div className="inline-block px-4 py-2 bg-black/20 rounded-xl text-white font-nunito font-extrabold uppercase tracking-widest text-xs mb-6">BİLSEMc2 Zeka Puanı</div>
                        <motion.div className="text-8xl sm:text-9xl font-nunito font-extrabold mb-2 tracking-tighter" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, delay: 0.3 }}>{bzpScore}</motion.div>
                        <div className="font-nunito font-extrabold text-2xl uppercase tracking-wider mb-2">{bzp.label}</div>
                        <div className="font-bold text-sm bg-black/10 inline-block px-4 py-2 rounded-xl">{bzp.desc}</div>

                        {/* Scale Bar */}
                        <div className="mt-8 max-w-md mx-auto">
                            <div className="relative h-3 bg-black/20 rounded-full overflow-hidden">
                                <motion.div className="absolute top-0 bottom-0 w-2 bg-white rounded-full shadow-[0_0_10px_white]"
                                    initial={{ left: '0%' }} animate={{ left: `${Math.min(100, Math.max(0, ((bzpScore - 70) / 75) * 100))}%` }}
                                    transition={{ duration: 0.8, delay: 0.5, type: 'spring' }} />
                            </div>
                            <div className="flex justify-between text-xs mt-2 font-extrabold uppercase tracking-widest opacity-80"><span>70</span><span>90</span><span>110</span><span>130</span><span>145</span></div>
                        </div>

                        {/* Stats Row */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10 pt-8 border-t-2 border-white/20">
                            <div><div className="text-2xl sm:text-3xl font-nunito font-extrabold mb-1">{scorePercentage}%</div><div className="text-xs font-extrabold uppercase tracking-widest opacity-80">Başarı</div></div>
                            <div><div className="text-2xl sm:text-3xl font-nunito font-extrabold mb-1">{passedCount}</div><div className="text-xs font-extrabold uppercase tracking-widest opacity-80">Başarılı</div></div>
                            <div><div className="text-2xl sm:text-3xl font-nunito font-extrabold mb-1">{failedCount}</div><div className="text-xs font-extrabold uppercase tracking-widest opacity-80">Gayret</div></div>
                            <div><div className="text-2xl sm:text-3xl font-nunito font-extrabold mb-1">{avgLevel}</div><div className="text-xs font-extrabold uppercase tracking-widest opacity-80">Seviye</div></div>
                        </div>
                    </div>
                </motion.div>

                {/* Mini Stats */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
                    {[
                        { icon: Clock, value: Math.round(totalDuration / 60), label: 'Dakika', color: 'text-cyber-blue' },
                        { icon: Target, value: session.modules.length, label: 'Modül', color: 'text-cyber-pink' },
                        { icon: TrendingUp, value: Math.max(...session.results.map(r => r.level)), label: 'Max Seviye', color: 'text-cyber-emerald' },
                        { icon: BarChart3, value: totalScore, label: 'Toplam Puan', color: 'text-cyber-gold' }
                    ].map((s, i) => (
                        <div key={i} className="bg-white dark:bg-slate-800 border-3 border-black/10 rounded-2xl p-5 text-center hover:-translate-y-1 transition-transform">
                            <s.icon className={`w-7 h-7 ${s.color} mx-auto mb-3`} />
                            <div className="text-2xl font-nunito font-extrabold text-black dark:text-white mb-1">{s.value}</div>
                            <div className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">{s.label}</div>
                        </div>
                    ))}
                </motion.div>

                {/* Radar Chart */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl p-8 sm:p-10 border-2 border-black/10 shadow-neo-md mb-12">
                    <h2 className="text-xl font-nunito font-extrabold text-black dark:text-white uppercase tracking-tight mb-8 flex items-center gap-3">
                        <div className="w-1.5 h-7 bg-cyber-blue rounded-full" /> <BarChart3 className="text-cyber-blue" size={24} /> Bilişsel Profil
                    </h2>
                    <div className="flex flex-col lg:flex-row items-center gap-8">
                        <div className="relative w-72 h-72 mx-auto">
                            <svg viewBox="0 0 200 200" className="w-full h-full">
                                {[0.25, 0.5, 0.75, 1].map((scale, i) => (
                                    <polygon key={i} points={(() => { const cats = Object.keys(categoryStats); const n = cats.length || 1; return cats.map((_, idx) => { const a = (Math.PI * 2 * idx) / n - Math.PI / 2; const r = 80 * scale; return `${100 + r * Math.cos(a)},${100 + r * Math.sin(a)}`; }).join(' '); })()} fill="none" stroke="currentColor" className="text-black/10 dark:text-white/10" strokeWidth="2" />
                                ))}
                                {Object.keys(categoryStats).map((_, idx) => { const n = Object.keys(categoryStats).length; const a = (Math.PI * 2 * idx) / n - Math.PI / 2; return <line key={idx} x1="100" y1="100" x2={100 + 80 * Math.cos(a)} y2={100 + 80 * Math.sin(a)} stroke="currentColor" className="text-black/10 dark:text-white/10" strokeWidth="2" />; })}
                                <motion.polygon initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.5 }}
                                    points={(() => { const cats = Object.entries(categoryStats); const n = cats.length || 1; return cats.map(([, s], idx) => { const p = s.total > 0 ? s.passed / s.total : 0; const a = (Math.PI * 2 * idx) / n - Math.PI / 2; const r = 80 * p; return `${100 + r * Math.cos(a)},${100 + r * Math.sin(a)}`; }).join(' '); })()}
                                    fill="rgba(51,116,255,0.2)" stroke="#3374FF" strokeWidth="3" strokeLinejoin="miter" style={{ transformOrigin: 'center' }} />
                                {Object.entries(categoryStats).map(([cat, s], idx) => { const n = Object.keys(categoryStats).length; const p = s.total > 0 ? s.passed / s.total : 0; const a = (Math.PI * 2 * idx) / n - Math.PI / 2; return <motion.circle key={cat} cx={100 + 80 * p * Math.cos(a)} cy={100 + 80 * p * Math.sin(a)} r="5" fill="#3374FF" stroke="white" strokeWidth="2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 + idx * 0.1 }} />; })}
                                {Object.entries(categoryStats).map(([cat], idx) => { const n = Object.keys(categoryStats).length; const a = (Math.PI * 2 * idx) / n - Math.PI / 2; return <text key={cat} x={100 + 95 * Math.cos(a)} y={100 + 95 * Math.sin(a)} textAnchor="middle" dominantBaseline="middle" className="fill-black dark:fill-white text-[11px] font-extrabold uppercase">{CATEGORY_LABELS[cat as ExamCategory]?.label}</text>; })}
                            </svg>
                        </div>
                        <div className="flex-1 space-y-3 w-full">
                            {Object.entries(categoryStats).map(([cat, s]) => {
                                const pct = Math.round((s.passed / s.total) * 100); return (
                                    <div key={cat} className="flex items-center gap-3 bg-gray-50 dark:bg-slate-700/50 border border-black/5 rounded-xl p-3">
                                        <div className="w-3 h-3 rounded-full bg-cyber-blue" />
                                        <div className="flex-1"><div className="flex justify-between items-center mb-1"><span className="text-xs font-extrabold text-black dark:text-white uppercase">{CATEGORY_LABELS[cat as ExamCategory]?.label}</span><span className="text-xs"><span className="text-black dark:text-white font-extrabold">{pct}%</span><span className="text-slate-400 ml-2">({s.passed}/{s.total})</span></span></div><div className="h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.5 }} className="h-full bg-cyber-blue rounded-full" /></div></div>
                                    </div>);
                            })}
                        </div>
                    </div>
                </motion.div>

                {/* Module Details */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl p-8 sm:p-10 border-2 border-black/10 shadow-neo-sm mb-12">
                    <h2 className="text-xl font-nunito font-extrabold text-black dark:text-white uppercase tracking-tight mb-6">Modül Detayları</h2>
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                        {session.results.map((r, i) => (
                            <div key={i} className={`flex items-center gap-4 p-4 rounded-xl border-2 ${r.passed ? 'bg-green-50 dark:bg-green-900/20 border-cyber-emerald/30' : 'bg-red-50 dark:bg-red-900/20 border-red-400/30'}`}>
                                {r.passed ? <CheckCircle2 className="text-cyber-emerald shrink-0" size={22} /> : <XCircle className="text-red-500 shrink-0" size={22} />}
                                <div className="flex-1 min-w-0"><div className={`font-extrabold text-base truncate ${r.passed ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>{r.moduleTitle}</div><div className="text-xs text-slate-400 font-bold">Seviye {r.level} • {r.duration}s</div></div>
                                <div className="text-right"><div className={`text-xl font-nunito font-extrabold ${r.passed ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{r.score}</div><div className="text-[10px] text-slate-400 font-extrabold uppercase">puan</div></div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Actions */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex flex-col sm:flex-row gap-4 mb-12">
                    <Link to="/atolyeler/bireysel-degerlendirme" className="flex-1 py-5 bg-white dark:bg-slate-800 border-3 border-black/10 text-black dark:text-white font-nunito font-extrabold uppercase tracking-widest rounded-xl hover:-translate-y-1 shadow-neo-sm transition-all flex items-center justify-center gap-3"><Home size={22} /> Ana Sayfa</Link>
                    <button onClick={() => { abandonExam(); navigate('/atolyeler/sinav-simulasyonu'); }} className="flex-1 py-5 bg-cyber-gold border-3 border-black/10 text-black font-nunito font-extrabold uppercase tracking-widest rounded-xl hover:-translate-y-1 shadow-neo-sm transition-all flex items-center justify-center gap-3"><Repeat size={22} /> Yeni Sınav</button>
                </motion.div>
            </div>
        </div>
    );
};

export default ExamResultPage;
