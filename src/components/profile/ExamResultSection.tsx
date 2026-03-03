import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface ExamResult {
    bzp_score: number | null;
    final_score: number;
    results: Array<{ passed: boolean; score: number; maxScore: number; level: number; moduleTitle?: string; moduleId?: string }>;
    completed_at: string;
}

interface ExamResultSectionProps {
    lastExamSession: ExamResult | null;
}

const ExamResultSection: React.FC<ExamResultSectionProps> = ({ lastExamSession }) => {
    if (!lastExamSession || lastExamSession.results.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6"
        >
            <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h2 className="font-nunito text-xl font-extrabold text-black dark:text-white tracking-tight">Son Simülasyon Sonucum</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-nunito font-bold text-xs">Sınav Simülasyonu performansı</p>
                </div>
            </div>

            <Link
                to="/atolyeler/sinav-simulasyonu/sonuc"
                className="block bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl p-6 hover:-translate-y-0.5 hover:shadow-neo-lg shadow-neo-md active:translate-y-0.5 active:shadow-neo-sm transition-all group focus:outline-none"
            >
                <div className="flex items-center gap-6">
                    <div className="text-center bg-red-500 px-6 py-4 rounded-2xl border-2 border-red-600/20 shadow-neo-sm">
                        <div className="font-nunito text-5xl font-extrabold text-white">
                            {lastExamSession.bzp_score || lastExamSession.final_score}
                        </div>
                        <div className="text-white/80 text-[9px] font-nunito font-extrabold uppercase tracking-wider mt-1">
                            {lastExamSession.bzp_score ? 'BZP Puanı' : 'Genel Skor'}
                        </div>
                    </div>

                    <div className="w-px h-16 bg-black/5 dark:bg-white/5 hidden md:block" />

                    <div className="flex-1 grid grid-cols-3 gap-3 text-center">
                        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-3 border border-black/5 dark:border-white/5">
                            <div className="font-nunito text-2xl font-extrabold text-black dark:text-white">
                                {lastExamSession.results.filter((r) => r.passed).length}
                            </div>
                            <div className="text-slate-400 text-[9px] font-nunito font-extrabold uppercase tracking-wider mt-1">Başarılı</div>
                        </div>
                        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-3 border border-black/5 dark:border-white/5">
                            <div className="font-nunito text-2xl font-extrabold text-black dark:text-white">{lastExamSession.results.length}</div>
                            <div className="text-slate-400 text-[9px] font-nunito font-extrabold uppercase tracking-wider mt-1">Toplam Modül</div>
                        </div>
                        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-3 border border-black/5 dark:border-white/5">
                            <div className="font-nunito text-2xl font-extrabold text-black dark:text-white">
                                {lastExamSession.final_score}%
                            </div>
                            <div className="text-slate-400 text-[9px] font-nunito font-extrabold uppercase tracking-wider mt-1">Başarı Oranı</div>
                        </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-slate-700/50 border-2 border-black/10 dark:border-white/10 rounded-xl p-2.5 flex-shrink-0 group-hover:translate-x-1 transition-transform ml-2 hidden sm:block">
                        <ChevronRight className="w-5 h-5 text-black dark:text-white" />
                    </div>
                </div>

                {lastExamSession.results.filter((r) => !r.passed).length > 0 && (
                    <div className="mt-5 pt-4 border-t border-black/5 dark:border-white/5">
                        <p className="text-black dark:text-white font-nunito font-extrabold text-xs mb-2.5 flex items-center gap-2">
                            <span className="bg-cyber-gold/10 text-cyber-gold text-[9px] px-2 py-0.5 rounded-md border border-cyber-gold/20 font-extrabold">💪</span>
                            Geliştirilecek Modüller:
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {lastExamSession.results
                                .map((r, idx) => ({ ...r, idx }))
                                .filter((r) => !r.passed)
                                .map((r) => (
                                    <span key={r.idx} className="bg-black/5 dark:bg-white/5 text-black dark:text-white font-nunito font-extrabold text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-lg border border-black/10 dark:border-white/10">
                                        {r.moduleTitle || `Modül ${r.level}`}
                                    </span>
                                ))}
                        </div>
                    </div>
                )}
            </Link>
        </motion.div>
    );
};

export default ExamResultSection;
