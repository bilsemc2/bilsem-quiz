import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Brain, Tablet, Users, TrendingUp, Loader2, PieChart } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ZEKA_RENKLERI, ZekaTuru } from '../../constants/intelligenceTypes';

interface AnalyticsData {
    totalPlays: number;
    tabletPlays: number;
    bireyselPlays: number;
    intelligenceBreakdown: Record<string, number>;
    topPlayers: { name: string; plays: number; avgScore: number }[];
    recentActivity: { game_id: string; user_name: string; score: number; created_at: string }[];
}

const TalentAnalytics = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<AnalyticsData>({
        totalPlays: 0,
        tabletPlays: 0,
        bireyselPlays: 0,
        intelligenceBreakdown: {},
        topPlayers: [],
        recentActivity: [],
    });

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);

            // Toplam oyun sayıları
            const { data: allPlays, error: playsError } = await supabase
                .from('game_plays')
                .select('workshop_type, intelligence_type, score_achieved, user_id, game_id, created_at')
                .not('workshop_type', 'is', null);

            if (playsError) throw playsError;

            const plays = allPlays || [];
            const tabletPlays = plays.filter(p => p.workshop_type === 'tablet').length;
            const bireyselPlays = plays.filter(p => p.workshop_type === 'bireysel').length;

            // Zeka türü dağılımı
            const intelligenceBreakdown: Record<string, number> = {};
            plays.forEach(p => {
                if (p.intelligence_type) {
                    intelligenceBreakdown[p.intelligence_type] = (intelligenceBreakdown[p.intelligence_type] || 0) + 1;
                }
            });

            // Top oyuncular - profiles JOIN olmadan
            const { data: topPlayersData, error: topError } = await supabase
                .from('game_plays')
                .select('user_id, score_achieved')
                .not('workshop_type', 'is', null)
                .order('created_at', { ascending: false })
                .limit(100);

            console.log('Top Players Query:', { data: topPlayersData, error: topError });

            // Player stats hesapla
            const playerStats: Record<string, { plays: number; totalScore: number }> = {};
            (topPlayersData || []).forEach((p: any) => {
                const id = p.user_id;
                if (!playerStats[id]) {
                    playerStats[id] = { plays: 0, totalScore: 0 };
                }
                playerStats[id].plays++;
                playerStats[id].totalScore += p.score_achieved || 0;
            });

            // Profil isimlerini al
            const userIds = Object.keys(playerStats);
            let profileNames: Record<string, string> = {};
            if (userIds.length > 0) {
                const { data: profilesData } = await supabase
                    .from('profiles')
                    .select('id, name')
                    .in('id', userIds);

                (profilesData || []).forEach((p: any) => {
                    profileNames[p.id] = p.name || 'Bilinmiyor';
                });
            }

            const topPlayers = Object.entries(playerStats)
                .map(([id, stats]) => ({
                    name: profileNames[id] || 'Bilinmiyor',
                    plays: stats.plays,
                    avgScore: Math.round(stats.totalScore / stats.plays)
                }))
                .sort((a, b) => b.plays - a.plays)
                .slice(0, 5);

            // Son aktiviteler - profiles JOIN olmadan
            const { data: recentData, error: recentError } = await supabase
                .from('game_plays')
                .select('game_id, score_achieved, created_at, user_id')
                .not('workshop_type', 'is', null)
                .order('created_at', { ascending: false })
                .limit(10);

            console.log('Recent Activity Query:', { data: recentData, error: recentError });

            const recentActivity = (recentData || []).map((r: any) => ({
                game_id: r.game_id,
                user_name: profileNames[r.user_id] || 'Bilinmiyor',
                score: r.score_achieved || 0,
                created_at: r.created_at,
            }));

            setData({
                totalPlays: plays.length,
                tabletPlays,
                bireyselPlays,
                intelligenceBreakdown,
                topPlayers,
                recentActivity,
            });
        } catch (err) {
            console.error('Analytics yüklenirken hata:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
            </div>
        );
    }

    // Zeka türleri için en yüksek değer (bar chart için)
    const maxIntelligence = Math.max(...Object.values(data.intelligenceBreakdown), 1);

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-3">
                <Brain className="w-8 h-8 text-indigo-500" />
                <h1 className="text-2xl font-bold text-slate-800">Yetenek Analizi</h1>
            </div>

            {/* İstatistik Kartları */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <BarChart3 className="w-6 h-6" />
                        <span className="font-semibold">Toplam Oyun</span>
                    </div>
                    <div className="text-4xl font-bold">{data.totalPlays}</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <Tablet className="w-6 h-6" />
                        <span className="font-semibold">Tablet (1. Aşama)</span>
                    </div>
                    <div className="text-4xl font-bold">{data.tabletPlays}</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <Brain className="w-6 h-6" />
                        <span className="font-semibold">Bireysel (2. Aşama)</span>
                    </div>
                    <div className="text-4xl font-bold">{data.bireyselPlays}</div>
                </motion.div>
            </div>

            {/* Zeka Türü Dağılımı */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                    <PieChart className="w-6 h-6 text-indigo-500" />
                    <h2 className="text-lg font-semibold text-slate-800">Zeka Türü Dağılımı</h2>
                </div>

                {Object.keys(data.intelligenceBreakdown).length === 0 ? (
                    <div className="text-center text-slate-400 py-8">
                        Henüz veri yok. Öğrenciler oyun oynamaya başladığında burada zeka türü analizleri görünecek.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {Object.entries(data.intelligenceBreakdown)
                            .sort((a, b) => b[1] - a[1])
                            .map(([type, count]) => (
                                <div key={type} className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium text-slate-700">{type}</span>
                                        <span className="text-slate-500">{count} oyun</span>
                                    </div>
                                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(count / maxIntelligence) * 100}%` }}
                                            transition={{ duration: 0.5 }}
                                            className="h-full rounded-full"
                                            style={{ backgroundColor: ZEKA_RENKLERI[type as ZekaTuru] || '#6366F1' }}
                                        />
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* En Aktif Öğrenciler */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Users className="w-6 h-6 text-indigo-500" />
                        <h2 className="text-lg font-semibold text-slate-800">En Aktif Öğrenciler</h2>
                    </div>
                    {data.topPlayers.length === 0 ? (
                        <div className="text-center text-slate-400 py-4">Henüz veri yok</div>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {data.topPlayers.map((player, idx) => (
                                <li key={idx} className="py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-slate-400' : idx === 2 ? 'bg-amber-600' : 'bg-slate-300'}`}>
                                            {idx + 1}
                                        </div>
                                        <span className="font-medium text-slate-700">{player.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-indigo-600">{player.plays} oyun</div>
                                        <div className="text-xs text-slate-400">Ort. {player.avgScore} puan</div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Son Aktiviteler */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <TrendingUp className="w-6 h-6 text-indigo-500" />
                        <h2 className="text-lg font-semibold text-slate-800">Son Aktiviteler</h2>
                    </div>
                    {data.recentActivity.length === 0 ? (
                        <div className="text-center text-slate-400 py-4">Henüz aktivite yok</div>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {data.recentActivity.map((activity, idx) => (
                                <li key={idx} className="py-3 flex items-center justify-between">
                                    <div>
                                        <div className="font-medium text-slate-700">{activity.user_name}</div>
                                        <div className="text-sm text-slate-400">{activity.game_id}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-emerald-600">{activity.score} puan</div>
                                        <div className="text-xs text-slate-400">
                                            {new Date(activity.created_at).toLocaleDateString('tr-TR')}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TalentAnalytics;
