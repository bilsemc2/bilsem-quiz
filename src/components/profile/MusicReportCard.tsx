import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Music, Trophy, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/auth/useAuth';
import {
    loadMusicReportCardData,
    type MusicReportSummary as Report
} from '@/features/profile/model/musicReportUseCases';

const SKILL_BARS = [
    { key: 'pitch_score', label: 'Perde Duyma', max: 60, color: 'bg-cyber-pink' },
    { key: 'rhythm_score', label: 'Ritim', max: 24, color: 'bg-cyber-blue' },
    { key: 'melody_score', label: 'Melodik Hafıza', max: 20, color: 'bg-cyber-emerald' },
    { key: 'expression_score', label: 'Müzikal İfade', max: 25, color: 'bg-cyber-gold' },
];

const LEVEL_COLORS: Record<string, string> = {
    'Başlangıç': 'bg-gray-200 text-gray-600',
    'Gelişen': 'bg-cyber-blue/15 text-cyber-blue',
    'Orta': 'bg-cyber-gold/15 text-cyber-gold',
    'İleri': 'bg-cyber-emerald/15 text-cyber-emerald',
    'Üstün': 'bg-cyber-pink/15 text-cyber-pink',
};

const MusicReportCard: React.FC = () => {
    const { user } = useAuth();
    const [report, setReport] = useState<Report | null>(null);
    const [completedCount, setCompletedCount] = useState(0);

    useEffect(() => {
        if (!user) return;
        const load = async () => {
            try {
                const data = await loadMusicReportCardData(user.id);
                setReport(data.report);
                setCompletedCount(data.completedCount);
            } catch (error) {
                console.error('Music report card load failed:', error);
                setReport(null);
                setCompletedCount(0);
            }
        };
        void load();
    }, [user]);

    // Hiç test yapılmamışsa gösterme
    if (completedCount === 0 && !report) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6"
        >
            <div className="bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl overflow-hidden shadow-neo-sm">
                <div className="h-1.5 bg-cyber-gold" />
                <div className="p-5">
                    {/* Başlık */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-cyber-gold/10 border-2 border-cyber-gold/20 rounded-xl flex items-center justify-center">
                                <Music className="w-5 h-5 text-cyber-gold" />
                            </div>
                            <div>
                                <h3 className="font-nunito text-sm font-extrabold text-black dark:text-white">Müzik Karnesi</h3>
                                <p className="text-slate-400 font-nunito font-bold text-[10px]">BİLSEM yetenek değerlendirmesi</p>
                            </div>
                        </div>
                        <Link
                            to="/atolyeler/muzik/genel-rapor"
                            className="text-[10px] font-nunito font-extrabold text-cyber-gold uppercase tracking-wider hover:underline"
                        >
                            Detaylar →
                        </Link>
                    </div>

                    {report ? (
                        <>
                            {/* Skor + Seviye */}
                            <div className="flex items-center gap-4 mb-4">
                                <div className="flex items-center gap-1.5">
                                    <Trophy className="w-5 h-5 text-cyber-gold" />
                                    <span className="font-nunito font-black text-3xl text-black dark:text-white">{report.overall_score}</span>
                                    <span className="text-slate-400 font-nunito font-bold text-xs">/100</span>
                                </div>
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-nunito font-extrabold uppercase tracking-wider ${LEVEL_COLORS[report.level] || 'bg-gray-100 text-gray-500'}`}>
                                    {report.level}
                                </span>
                                <span className="text-[9px] text-slate-400 font-nunito font-bold ml-auto">
                                    {new Date(report.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                </span>
                            </div>

                            {/* Mini Beceri Barları */}
                            <div className="space-y-2">
                                {SKILL_BARS.map((skill) => {
                                    const val = report[skill.key as keyof Report] as number;
                                    const pct = Math.round((val / skill.max) * 100);
                                    return (
                                        <div key={skill.key} className="flex items-center gap-2">
                                            <span className="text-[10px] font-nunito font-extrabold text-slate-500 w-24 truncate">{skill.label}</span>
                                            <div className="flex-1 h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${skill.color}`} style={{ width: `${pct}%` }} />
                                            </div>
                                            <span className="text-[10px] font-nunito font-black text-slate-600 dark:text-slate-300 w-8 text-right">{val}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        /* Henüz rapor yok — ilerleme göster */
                        <div className="text-center py-2">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <TrendingUp className="w-4 h-4 text-cyber-emerald" />
                                <span className="font-nunito font-extrabold text-sm text-black dark:text-white">
                                    {completedCount}/8 Test Tamamlandı
                                </span>
                            </div>
                            <div className="w-full max-w-xs mx-auto h-2.5 bg-gray-100 dark:bg-slate-700 border border-black/5 rounded-full overflow-hidden">
                                <div className="h-full bg-cyber-emerald rounded-full transition-all" style={{ width: `${(completedCount / 8) * 100}%` }} />
                            </div>
                            <p className="text-[10px] text-slate-400 font-nunito font-bold mt-2">
                                {completedCount < 8 ? 'Tüm testleri tamamla, müzik karneni al!' : 'Karneni oluşturmak için Müzik Atölyesine git!'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default MusicReportCard;
