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
            className="mb-8"
        >
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/30">
                    <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-pink-300 to-rose-400 bg-clip-text text-transparent">Son Simülasyon Sonucum</h2>
                    <p className="text-pink-300/60 text-sm">Sınav Simülasyonu performansı</p>
                </div>
            </div>

            <Link
                to="/atolyeler/sinav-simulasyonu/sonuc"
                className="block bg-gradient-to-r from-rose-600 to-red-700 rounded-2xl p-6 hover:shadow-xl hover:shadow-rose-500/20 transition-all group"
            >
                <div className="flex items-center gap-6">
                    <div className="text-center">
                        <div className="text-5xl font-black text-white">
                            {lastExamSession.bzp_score || lastExamSession.final_score}
                        </div>
                        <div className="text-rose-200 text-xs font-bold uppercase tracking-wider">
                            {lastExamSession.bzp_score ? 'BZP' : 'Skor'}
                        </div>
                    </div>

                    <div className="w-px h-16 bg-white/20" />

                    <div className="flex-1 grid grid-cols-3 gap-4 text-center">
                        <div>
                            <div className="text-2xl font-black text-white">
                                {lastExamSession.results.filter((r) => r.passed).length}
                            </div>
                            <div className="text-rose-200 text-xs">Başarılı</div>
                        </div>
                        <div>
                            <div className="text-2xl font-black text-white">{lastExamSession.results.length}</div>
                            <div className="text-rose-200 text-xs">Modül</div>
                        </div>
                        <div>
                            <div className="text-2xl font-black text-white">
                                {lastExamSession.final_score}%
                            </div>
                            <div className="text-rose-200 text-xs">Başarı</div>
                        </div>
                    </div>

                    <ChevronRight className="w-8 h-8 text-white/50 group-hover:text-white group-hover:translate-x-2 transition-all" />
                </div>

                {lastExamSession.results.filter((r) => !r.passed).length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/20">
                        <p className="text-rose-200/80 text-xs font-medium mb-2">💪 Gayret Gösterilecek Modüller:</p>
                        <div className="flex flex-wrap gap-2">
                            {lastExamSession.results
                                .map((r, idx) => ({ ...r, idx }))
                                .filter((r) => !r.passed)
                                .map((r) => (
                                    <span key={r.idx} className="bg-white/20 text-white text-xs px-2 py-1 rounded-lg">
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
