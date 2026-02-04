import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Gamepad2, TrendingUp, Target, Clock, Award, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ZEKA_RENKLERI, ZekaTuru } from '../../constants/intelligenceTypes';

// Zeka türü açıklamaları - kullanıcıların anlaması için
const ZEKA_ACIKLAMALARI: Record<string, { icon: string; desc: string; skill: string }> = {
    'Görsel-Uzamsal Zeka': {
        icon: '🧩',
        desc: 'Şekilleri zihninde döndürme ve parçaları birleştirme yeteneği',
        skill: 'Puzzle, harita okuma, mühendislik'
    },
    'Çalışma Belleği': {
        icon: '🧠',
        desc: 'Bilgiyi kısa sürede tutma ve işleme kapasitesi',
        skill: 'Problem çözme, hesaplama, öğrenme'
    },
    'Sözel Zeka': {
        icon: '📖',
        desc: 'Kelime bilgisi ve dil anlama yeteneği',
        skill: 'Okuma, yazma, iletişim'
    },
    'Sayısal Zeka': {
        icon: '🔢',
        desc: 'Sayılarla düşünme ve matematiksel işlem yapma',
        skill: 'Matematik, mantık, analiz'
    },
    'Seçici Dikkat': {
        icon: '🎯',
        desc: 'Dikkat dağıtıcıları görmezden gelip hedefe odaklanma',
        skill: 'Konsantrasyon, detay görme'
    },
    'Bilişsel Esneklik': {
        icon: '🔄',
        desc: 'Farklı görevler arasında hızlı geçiş yapabilme',
        skill: 'Adaptasyon, çoklu görev'
    },
    'Görsel Algı': {
        icon: '👁️',
        desc: 'Görsel bilgiyi doğru yorumlama ve ayırt etme',
        skill: 'Gözlem, detay farkı bulma'
    },
    'Görsel Hafıza': {
        icon: '🖼️',
        desc: 'Görsel bilgiyi hatırlama ve geri çağırma',
        skill: 'Yüz tanıma, konum hatırlama'
    },
    'İşleme Hızı': {
        icon: '⚡',
        desc: 'Bilgiyi hızlı işleme ve karar verme süresi',
        skill: 'Hızlı düşünme, refleks'
    },
    'Akıcı Zeka': {
        icon: '💡',
        desc: 'Yeni problemleri mantıksal olarak çözme',
        skill: 'Soyut düşünme, örüntü bulma'
    },
    'Mantıksal Zeka': {
        icon: '🔗',
        desc: 'Neden-sonuç ilişkilerini anlama',
        skill: 'Analiz, strateji, planlama'
    },
};

interface GameStats {
    totalPlays: number;
    totalScore: number;
    averageScore: number;
    totalDuration: number;
    intelligenceBreakdown: Record<string, number>;
    recentGames: { game_id: string; score: number; created_at: string; game_name: string }[];
    // Haftalık karşılaştırma
    thisWeek: { plays: number; score: number; avgScore: number };
    lastWeek: { plays: number; score: number; avgScore: number };
    // Oyun bazında gelişim
    gameProgress: {
        game_id: string;
        game_name: string;
        playCount: number;
        firstScore: number;
        lastScore: number;
        bestScore: number;
        improvement: number; // yüzde
    }[];
}

const UserGameStats: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<GameStats>({
        totalPlays: 0,
        totalScore: 0,
        averageScore: 0,
        totalDuration: 0,
        intelligenceBreakdown: {},
        recentGames: [],
        thisWeek: { plays: 0, score: 0, avgScore: 0 },
        lastWeek: { plays: 0, score: 0, avgScore: 0 },
        gameProgress: [],
    });

    // Collapsible section states
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        intelligence: false,
        recentGames: false,
        gameProgress: false
    });

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    useEffect(() => {
        if (user) fetchStats();
    }, [user]);

    const fetchStats = async () => {
        if (!user) return;
        setLoading(true);

        try {
            // Kullanıcının oyun verilerini çek
            const { data, error } = await supabase
                .from('game_plays')
                .select('game_id, score_achieved, duration_seconds, intelligence_type, created_at, metadata')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const plays = data || [];
            const totalScore = plays.reduce((sum, p) => sum + (p.score_achieved || 0), 0);
            const totalDuration = plays.reduce((sum, p) => sum + (p.duration_seconds || 0), 0);

            // Zeka türü dağılımı
            const intelligenceBreakdown: Record<string, number> = {};
            plays.forEach(p => {
                if (p.intelligence_type) {
                    intelligenceBreakdown[p.intelligence_type] = (intelligenceBreakdown[p.intelligence_type] || 0) + 1;
                }
            });

            // Son oyunlar
            const recentGames = plays.slice(0, 5).map(p => ({
                game_id: p.game_id,
                score: p.score_achieved || 0,
                created_at: p.created_at,
                game_name: (p.metadata && typeof p.metadata === 'object' && 'game_name' in p.metadata) ? (p.metadata as { game_name?: string }).game_name || p.game_id : p.game_id,
            }));

            // Haftalık karşılaştırma
            const now = new Date();
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

            const thisWeekPlays = plays.filter(p => new Date(p.created_at) >= oneWeekAgo);
            const lastWeekPlays = plays.filter(p => {
                const date = new Date(p.created_at);
                return date >= twoWeeksAgo && date < oneWeekAgo;
            });

            const thisWeekScore = thisWeekPlays.reduce((sum, p) => sum + (p.score_achieved || 0), 0);
            const lastWeekScore = lastWeekPlays.reduce((sum, p) => sum + (p.score_achieved || 0), 0);

            const thisWeek = {
                plays: thisWeekPlays.length,
                score: thisWeekScore,
                avgScore: thisWeekPlays.length > 0 ? Math.round(thisWeekScore / thisWeekPlays.length) : 0,
            };
            const lastWeek = {
                plays: lastWeekPlays.length,
                score: lastWeekScore,
                avgScore: lastWeekPlays.length > 0 ? Math.round(lastWeekScore / lastWeekPlays.length) : 0,
            };

            // Oyun bazında gelişim hesaplama
            const gameGroups: Record<string, { scores: { score: number; date: Date }[]; name: string }> = {};
            plays.forEach(p => {
                const gameId = p.game_id;
                const gameName = (p.metadata && typeof p.metadata === 'object' && 'game_name' in p.metadata) ? (p.metadata as { game_name?: string }).game_name || gameId : gameId;
                if (!gameGroups[gameId]) {
                    gameGroups[gameId] = { scores: [], name: gameName };
                }
                gameGroups[gameId].scores.push({
                    score: p.score_achieved || 0,
                    date: new Date(p.created_at)
                });
            });

            const gameProgress = Object.entries(gameGroups)
                .filter((entry) => entry[1].scores.length >= 2) // En az 2 oynama gerekli
                .map(([gameId, data]) => {
                    // Tarihe göre sırala (eskiden yeniye)
                    const sorted = [...data.scores].sort((a, b) => a.date.getTime() - b.date.getTime());
                    const firstScore = sorted[0].score;
                    const lastScore = sorted[sorted.length - 1].score;
                    const bestScore = Math.max(...sorted.map(s => s.score));
                    const improvement = firstScore > 0
                        ? Math.round(((lastScore - firstScore) / firstScore) * 100)
                        : lastScore > 0 ? 100 : 0;

                    return {
                        game_id: gameId,
                        game_name: data.name,
                        playCount: data.scores.length,
                        firstScore,
                        lastScore,
                        bestScore,
                        improvement,
                    };
                })
                .sort((a, b) => b.playCount - a.playCount) // En çok oynanan önce
                .slice(0, 5); // En fazla 5 oyun göster

            setStats({
                totalPlays: plays.length,
                totalScore,
                averageScore: plays.length > 0 ? Math.round(totalScore / plays.length) : 0,
                totalDuration,
                intelligenceBreakdown,
                recentGames,
                thisWeek,
                lastWeek,
                gameProgress,
            });
        } catch (err) {
            console.error('Stats yüklenirken hata:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        if (hours > 0) return `${hours}s ${mins}d`;
        return `${mins} dakika`;
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return 'Bugün';
        if (days === 1) return 'Dün';
        if (days < 7) return `${days} gün önce`;
        return date.toLocaleDateString('tr-TR');
    };

    const maxIntelligence = Math.max(...Object.values(stats.intelligenceBreakdown), 1);

    if (loading) {
        return (
            <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-6 flex justify-center items-center min-h-[200px]">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    if (stats.totalPlays === 0) {
        return (
            <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-8 text-center">
                <Gamepad2 className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white/60 mb-2">Henüz oyun verisi yok</h3>
                <p className="text-white/40 text-sm">
                    Tablet veya Bireysel Değerlendirme oyunlarını oynamaya başlayın!
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Özet İstatistikler - Compact 2x2 Grid */}
            <div className="grid grid-cols-4 gap-2">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-slate-800/90 border border-indigo-500/40 rounded-xl p-3 text-center"
                >
                    <Gamepad2 className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
                    <p className="text-xl font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">{stats.totalPlays}</p>
                    <span className="text-white/50 text-[10px]">Oyun</span>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05 }}
                    className="bg-slate-800/90 border border-amber-500/40 rounded-xl p-3 text-center"
                >
                    <Award className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                    <p className="text-xl font-black bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">{stats.totalScore.toLocaleString()}</p>
                    <span className="text-white/50 text-[10px]">Puan</span>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-slate-800/90 border border-emerald-500/40 rounded-xl p-3 text-center"
                >
                    <Target className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                    <p className="text-xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">{stats.averageScore}</p>
                    <span className="text-white/50 text-[10px]">Ort.</span>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15 }}
                    className="bg-slate-800/90 border border-cyan-500/40 rounded-xl p-3 text-center"
                >
                    <Clock className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                    <p className="text-xl font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{formatDuration(stats.totalDuration)}</p>
                    <span className="text-white/50 text-[10px]">Süre</span>
                </motion.div>
            </div>

            {/* Haftalık Gelişim - Compact */}
            {(stats.thisWeek.plays > 0 || stats.lastWeek.plays > 0) && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-slate-800/90 border border-purple-500/30 rounded-xl p-4"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-purple-400" />
                            <span className="font-bold text-white text-sm">Bu Hafta</span>
                        </div>
                        <span className="text-white/40 text-xs">
                            {stats.thisWeek.avgScore > stats.lastWeek.avgScore && stats.lastWeek.avgScore > 0
                                ? '🎉 Gelişim var!'
                                : stats.thisWeek.plays >= 5
                                    ? '💪 Harika!'
                                    : '🚀 Devam et!'}
                        </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <div className="bg-slate-700/60 rounded-lg p-2 text-center">
                            <p className="text-lg font-black text-white">{stats.thisWeek.plays}</p>
                            <div className="flex items-center justify-center gap-1">
                                <span className="text-white/50 text-[10px]">oyun</span>
                                {stats.lastWeek.plays > 0 && stats.thisWeek.plays !== stats.lastWeek.plays && (
                                    <span className={`text-[10px] ${stats.thisWeek.plays > stats.lastWeek.plays ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {stats.thisWeek.plays > stats.lastWeek.plays ? '↑' : '↓'}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="bg-slate-700/60 rounded-lg p-2 text-center">
                            <p className="text-lg font-black bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">{stats.thisWeek.score}</p>
                            <div className="flex items-center justify-center gap-1">
                                <span className="text-white/50 text-[10px]">puan</span>
                                {stats.lastWeek.score > 0 && stats.thisWeek.score !== stats.lastWeek.score && (
                                    <span className={`text-[10px] ${stats.thisWeek.score > stats.lastWeek.score ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {stats.thisWeek.score > stats.lastWeek.score ? '↑' : '↓'}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="bg-slate-700/60 rounded-lg p-2 text-center">
                            <p className="text-lg font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">{stats.thisWeek.avgScore}</p>
                            <span className="text-white/50 text-[10px]">ortalama</span>
                        </div>
                    </div>
                </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* Zeka Türü Dağılımı - Collapsible */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-slate-800/90 border border-purple-500/30 rounded-xl overflow-hidden"
                >
                    <button
                        onClick={() => toggleSection('intelligence')}
                        className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg flex items-center justify-center">
                                <Brain className="w-4 h-4 text-white" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold text-white text-sm">Zeka Dağılımı</h3>
                                <p className="text-purple-300/60 text-[10px]">
                                    {Object.keys(stats.intelligenceBreakdown).length} tür
                                </p>
                            </div>
                        </div>
                        {expandedSections.intelligence ? (
                            <ChevronUp className="w-4 h-4 text-purple-400" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-purple-400" />
                        )}
                    </button>

                    <AnimatePresence>
                        {expandedSections.intelligence && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="px-3 pb-3 overflow-hidden"
                            >

                                {Object.keys(stats.intelligenceBreakdown).length === 0 ? (
                                    <p className="text-white/40 text-sm text-center py-4">Henüz veri yok</p>
                                ) : (
                                    <div className="space-y-2">
                                        {Object.entries(stats.intelligenceBreakdown)
                                            .sort((a, b) => b[1] - a[1])
                                            .slice(0, 4)
                                            .map(([type, count]) => {
                                                const info = ZEKA_ACIKLAMALARI[type];
                                                return (
                                                    <div key={type} className="flex items-center gap-2 p-2 bg-slate-700/60 rounded-lg">
                                                        <span className="text-base">{info?.icon || '🧠'}</span>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-white font-medium text-xs truncate">{type}</span>
                                                                <span className="text-white/60 text-[10px]">{count}</span>
                                                            </div>
                                                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mt-1">
                                                                <div
                                                                    className="h-full rounded-full"
                                                                    style={{
                                                                        width: `${(count / maxIntelligence) * 100}%`,
                                                                        backgroundColor: ZEKA_RENKLERI[type as ZekaTuru] || '#6366F1'
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Son Oyunlar - Collapsible */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-slate-800/90 border border-emerald-500/30 rounded-xl overflow-hidden"
                >
                    <button
                        onClick={() => toggleSection('recentGames')}
                        className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                                <TrendingUp className="w-4 h-4 text-white" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold text-white text-sm">Son Oyunlar</h3>
                                <p className="text-emerald-300/60 text-[10px]">
                                    {stats.recentGames.length} oyun
                                </p>
                            </div>
                        </div>
                        {expandedSections.recentGames ? (
                            <ChevronUp className="w-4 h-4 text-emerald-400" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-emerald-400" />
                        )}
                    </button>

                    <AnimatePresence>
                        {expandedSections.recentGames && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="px-3 pb-3 overflow-hidden"
                            >
                                {stats.recentGames.length === 0 ? (
                                    <p className="text-white/40 text-xs text-center py-2">Henüz oyun yok</p>
                                ) : (
                                    <div className="space-y-1.5">
                                        {stats.recentGames.slice(0, 3).map((game, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center justify-between p-2 bg-slate-700/60 rounded-lg"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-white font-medium text-xs truncate">{game.game_name}</p>
                                                    <p className="text-white/40 text-[10px]">{formatDate(game.created_at)}</p>
                                                </div>
                                                <p className="text-amber-400 font-bold text-sm ml-2">{game.score}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* Oyun Bazında Gelişim - Collapsible */}
            {stats.gameProgress.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-slate-800/90 border border-amber-500/30 rounded-xl overflow-hidden"
                >
                    <button
                        onClick={() => toggleSection('gameProgress')}
                        className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                                <Award className="w-4 h-4 text-white" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold text-white text-sm">Gelişim</h3>
                                <p className="text-amber-300/60 text-[10px]">
                                    {stats.gameProgress.filter(g => g.improvement > 0).length} oyun ↑
                                </p>
                            </div>
                        </div>
                        {expandedSections.gameProgress ? (
                            <ChevronUp className="w-4 h-4 text-amber-400" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-amber-400" />
                        )}
                    </button>

                    <AnimatePresence>
                        {expandedSections.gameProgress && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="px-3 pb-3 overflow-hidden"
                            >
                                <div className="space-y-2">
                                    {stats.gameProgress.slice(0, 2).map((game, idx) => (
                                        <div
                                            key={idx}
                                            className="p-2 bg-slate-700/60 rounded-lg"
                                        >
                                            <div className="flex items-center justify-between mb-1.5">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-white font-medium text-xs truncate">{game.game_name}</p>
                                                    <p className="text-white/40 text-[10px]">{game.playCount}x</p>
                                                </div>
                                                <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${game.improvement > 0 ? 'bg-emerald-500/20 text-emerald-400' :
                                                    game.improvement < 0 ? 'bg-red-500/20 text-red-400' :
                                                        'bg-white/10 text-white/50'
                                                    }`}>
                                                    {game.improvement > 0 ? `+${game.improvement}%` : game.improvement < 0 ? `${game.improvement}%` : '='}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-1 text-center">
                                                <div className="bg-slate-600/50 rounded p-1">
                                                    <p className="text-white/40 text-[8px]">İlk</p>
                                                    <p className="text-white font-bold text-xs">{game.firstScore}</p>
                                                </div>
                                                <div className="bg-slate-600/50 rounded p-1">
                                                    <p className="text-white/40 text-[8px]">Son</p>
                                                    <p className="text-amber-400 font-bold text-xs">{game.lastScore}</p>
                                                </div>
                                                <div className="bg-amber-500/20 rounded p-1 border border-amber-500/20">
                                                    <p className="text-amber-400/60 text-[8px]">🏆</p>
                                                    <p className="text-amber-400 font-bold text-xs">{game.bestScore}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
        </div>
    );
};

export default UserGameStats;
