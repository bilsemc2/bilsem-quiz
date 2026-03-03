/**
 * ReportPage — Final exam report with jury scoring.
 * Tactile Cyber-Pop aesthetic.
 */

import { motion } from 'framer-motion';
import { Trophy, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useExam } from '../contexts/ExamContext';
import { generateJuryScores, calculateFinalScore } from '../utils/scoring';

const modules = [
    { key: 'tek-ses' as const, label: 'Tek Ses', max: 10, color: 'cyber-blue' },
    { key: 'cift-ses' as const, label: 'Çift Ses', max: 6, color: 'cyber-purple' },
    { key: 'ezgi' as const, label: 'Ezgi', max: 20, color: 'cyber-emerald' },
    { key: 'ritim' as const, label: 'Ritim', max: 24, color: 'cyber-pink' },
    { key: 'sarki' as const, label: 'Şarkı', max: 25, color: 'cyber-gold' },
    { key: 'uretkenlik' as const, label: 'Üretkenlik', max: 15, color: 'cyber-orange' },
];

const MEB_BARAJ = 70;

export default function ReportPage() {
    const navigate = useNavigate();
    const { getModuleScore, allModulesComplete } = useExam();

    const rawTotal = modules.reduce((sum, m) => sum + (getModuleScore(m.key)?.earnedPoints ?? 0), 0);
    const juryScores = generateJuryScores(rawTotal);
    const finalScore = calculateFinalScore(juryScores);
    const passed = finalScore >= MEB_BARAJ;

    if (!allModulesComplete) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-6">
                <div className="bg-white dark:bg-slate-800 border-3 border-black/10 rounded-2xl p-8 text-center space-y-4 shadow-neo-sm max-w-md">
                    <p className="text-slate-500 dark:text-slate-400 font-nunito font-bold">
                        Raporu görmek için tüm 6 modülü tamamla.
                    </p>
                    <button onClick={() => navigate('/atolyeler/muzik-sinav/tek-ses')}
                        className="px-6 py-3 bg-cyber-blue text-black border-2 border-black/10 font-nunito font-extrabold text-sm uppercase tracking-widest rounded-xl shadow-neo-sm hover:-translate-y-1 transition-all">
                        Testlere Dön
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-12 px-6 transition-colors duration-300">
            <div className="max-w-3xl mx-auto space-y-8">
                {/* Header */}
                <div className="bg-white dark:bg-slate-800 p-8 md:p-10 border-3 border-black/10 rounded-2xl shadow-neo-md relative overflow-hidden text-center">
                    <div className="absolute top-0 left-0 w-full h-4 bg-cyber-gold border-b-2 border-black/10" />
                    <Trophy className="w-12 h-12 text-cyber-gold mx-auto mt-4 mb-4" strokeWidth={2.5} />
                    <h1 className="text-4xl md:text-5xl font-nunito font-extrabold text-black dark:text-white uppercase tracking-tight leading-none">
                        Sınav <span className="text-cyber-gold">Raporu</span>
                    </h1>
                </div>

                {/* Module Scores */}
                <div className="bg-white dark:bg-slate-800 border-3 border-black/10 rounded-2xl p-6 shadow-neo-sm">
                    <h2 className="font-nunito font-extrabold text-sm uppercase tracking-widest text-slate-400 mb-4">Modül Puanları</h2>
                    <div className="space-y-3">
                        {modules.map((m) => {
                            const moduleScore = getModuleScore(m.key);
                            const earned = moduleScore?.earnedPoints ?? 0;
                            const pct = (earned / m.max) * 100;
                            return (
                                <div key={m.key} className="flex items-center gap-4">
                                    <span className="w-24 font-nunito font-extrabold text-xs uppercase tracking-wider text-black dark:text-white">{m.label}</span>
                                    <div className="flex-1 bg-gray-100 dark:bg-slate-700 border border-black/5 h-3 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${pct}%` }}
                                            transition={{ duration: 0.8, delay: 0.2 }}
                                            className={`h-full rounded-full bg-${m.color}`}
                                        />
                                    </div>
                                    <span className="w-16 text-right font-nunito font-extrabold text-sm text-black dark:text-white">
                                        {earned}/{m.max}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-4 pt-4 border-t border-black/10 dark:border-white/10 flex items-center justify-between">
                        <span className="font-nunito font-extrabold text-sm uppercase tracking-widest text-slate-400">Ham Toplam</span>
                        <span className="font-nunito font-extrabold text-2xl text-black dark:text-white">{rawTotal}<span className="text-slate-400 text-lg">/100</span></span>
                    </div>
                </div>

                {/* Jury Scores */}
                <div className="bg-white dark:bg-slate-800 border-3 border-black/10 rounded-2xl p-6 shadow-neo-sm">
                    <h2 className="font-nunito font-extrabold text-sm uppercase tracking-widest text-slate-400 mb-4">5 Jüri Puanlaması</h2>
                    <div className="flex gap-3 justify-center mb-4">
                        {juryScores.map((jury, i) => {
                            return (
                                <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.1 }}
                                    className={`w-16 h-16 rounded-xl border-2 flex flex-col items-center justify-center ${jury.isDropped
                                        ? 'bg-gray-100 dark:bg-slate-700 border-black/5 opacity-50 line-through'
                                        : 'bg-cyber-gold/10 border-cyber-gold/30'
                                        }`}>
                                    <span className="font-nunito font-extrabold text-lg text-black dark:text-white">{jury.score}</span>
                                    <span className="text-[8px] font-nunito font-extrabold uppercase tracking-widest text-slate-400">Jüri {i + 1}</span>
                                </motion.div>
                            );
                        })}
                    </div>
                    <p className="text-center text-slate-400 font-nunito font-bold text-xs">
                        En yüksek ve en düşük puan çıkartılır, kalan 3 puanın ortalaması alınır.
                    </p>
                </div>

                {/* Final Score */}
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5 }}
                    className={`border-3 rounded-2xl p-8 text-center shadow-neo-md ${passed
                        ? 'bg-cyber-emerald/5 dark:bg-cyber-emerald/10 border-cyber-emerald/30'
                        : 'bg-cyber-pink/5 dark:bg-cyber-pink/10 border-cyber-pink/30'
                        }`}>
                    <div className="text-6xl font-nunito font-extrabold text-black dark:text-white mb-2">{finalScore}</div>
                    <div className="text-slate-400 font-nunito font-extrabold text-sm uppercase tracking-widest mb-4">100 Üzerinden Nihai Puan</div>
                    <div className={`inline-block px-6 py-2 border-2 rounded-xl font-nunito font-extrabold text-sm uppercase tracking-widest ${passed
                        ? 'bg-cyber-emerald/10 border-cyber-emerald/30 text-cyber-emerald'
                        : 'bg-cyber-pink/10 border-cyber-pink/30 text-cyber-pink'
                        }`}>
                        {passed ? '✓ MEB Barajını Geçtin!' : `✗ MEB Barajı: ${MEB_BARAJ} — Geçemedin`}
                    </div>
                </motion.div>

                {/* Back */}
                <div className="text-center">
                    <button onClick={() => navigate('/atolyeler/muzik-sinav')}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-slate-700 border-2 border-black/10 text-black dark:text-white font-nunito font-extrabold text-sm uppercase tracking-widest rounded-xl hover:-translate-y-0.5 transition-all">
                        <ArrowLeft className="w-4 h-4" strokeWidth={2.5} /> Ana Sayfaya Dön
                    </button>
                </div>
            </div>
        </div>
    );
}
