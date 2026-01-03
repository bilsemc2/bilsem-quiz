import { motion } from 'framer-motion';
import { Crown, Loader2 } from 'lucide-react';
import { LeaderboardEntry } from './types';

interface LeaderboardSectionProps {
    leaderboard: LeaderboardEntry[];
    currentUserId?: string;
    loading: boolean;
}

const LeaderboardSection = ({
    leaderboard,
    currentUserId,
    loading,
}: LeaderboardSectionProps) => {
    const getRankDisplay = (rank: number) => {
        if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400" />;
        if (rank === 2) return <Crown className="w-5 h-5 text-slate-400" />;
        if (rank === 3) return <Crown className="w-5 h-5 text-orange-400" />;
        return <span className="w-6 text-center text-slate-400 font-bold">{rank}</span>;
    };

    const getProgressColor = (rate: number) => {
        if (rate > 80) return 'bg-emerald-500';
        if (rate > 50) return 'bg-indigo-500';
        return 'bg-amber-500';
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Sınıf Sıralaması</h2>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                </div>
            ) : leaderboard.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="text-left py-3 px-2 text-xs font-bold text-slate-500 uppercase tracking-wider w-16">Sıra</th>
                                <th className="text-left py-3 px-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Öğrenci</th>
                                <th className="text-left py-3 px-2 text-xs font-bold text-slate-500 uppercase tracking-wider w-24">Puan</th>
                                <th className="text-left py-3 px-2 text-xs font-bold text-slate-500 uppercase tracking-wider w-32">Başarı</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboard.map((entry, idx) => (
                                <motion.tr
                                    key={entry.student_id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${entry.student_id === currentUserId ? 'bg-indigo-50' : ''
                                        }`}
                                >
                                    <td className="py-3 px-2">
                                        {getRankDisplay(entry.rank ?? idx + 1)}
                                    </td>
                                    <td className="py-3 px-2">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={entry.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.student_id}`}
                                                alt=""
                                                className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                                            />
                                            <span className={`font-bold ${entry.student_id === currentUserId ? 'text-indigo-600' : 'text-slate-700'}`}>
                                                {entry.student_name}
                                                {entry.student_id === currentUserId && ' (Sen)'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-2">
                                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg font-extrabold text-sm">
                                            {entry.total_score}
                                        </span>
                                    </td>
                                    <td className="py-3 px-2">
                                        <div className="space-y-1">
                                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${getProgressColor(entry.completion_rate)} transition-all`}
                                                    style={{ width: `${entry.completion_rate}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                                %{entry.completion_rate} başarı
                                            </span>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-slate-400 font-medium">Henüz sıralama bilgisi bulunmuyor.</p>
                </div>
            )}
        </div>
    );
};

export default LeaderboardSection;
