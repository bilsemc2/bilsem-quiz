import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Gamepad2, TrendingUp, Target, Clock, Award, Loader2, TrendingDown, Minus } from 'lucide-react';
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
                game_name: (p.metadata as any)?.game_name || p.game_id,
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
                const gameName = (p.metadata as any)?.game_name || gameId;
                if (!gameGroups[gameId]) {
                    gameGroups[gameId] = { scores: [], name: gameName };
                }
                gameGroups[gameId].scores.push({
                    score: p.score_achieved || 0,
                    date: new Date(p.created_at)
                });
            });

            const gameProgress = Object.entries(gameGroups)
                .filter(([_, data]) => data.scores.length >= 2) // En az 2 oynama gerekli
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
        <div className="space-y-6">
            {/* Özet İstatistikler */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-xl p-4"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Gamepad2 className="w-5 h-5 text-indigo-400" />
                        <span className="text-white/60 text-sm">Toplam Oyun</span>
                    </div>
                    <p className="text-2xl font-black text-white">{stats.totalPlays}</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl p-4"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Award className="w-5 h-5 text-amber-400" />
                        <span className="text-white/60 text-sm">Toplam Puan</span>
                    </div>
                    <p className="text-2xl font-black text-white">{stats.totalScore.toLocaleString()}</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-xl p-4"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Target className="w-5 h-5 text-emerald-400" />
                        <span className="text-white/60 text-sm">Ort. Puan</span>
                    </div>
                    <p className="text-2xl font-black text-white">{stats.averageScore}</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-xl p-4"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-cyan-400" />
                        <span className="text-white/60 text-sm">Toplam Süre</span>
                    </div>
                    <p className="text-2xl font-black text-white">{formatDuration(stats.totalDuration)}</p>
                </motion.div>
            </div>

            {/* Haftalık Gelişim */}
            {(stats.thisWeek.plays > 0 || stats.lastWeek.plays > 0) && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-2xl p-5"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-purple-400" />
                        <h3 className="font-bold text-white">Haftalık Gelişim</h3>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        {/* Oyun Sayısı */}
                        <div className="text-center">
                            <p className="text-white/50 text-xs mb-1">Oyun Sayısı</p>
                            <div className="flex items-center justify-center gap-1">
                                <span className="text-2xl font-black text-white">{stats.thisWeek.plays}</span>
                                {stats.lastWeek.plays > 0 && (
                                    <span className={`text-xs flex items-center gap-0.5 ${stats.thisWeek.plays > stats.lastWeek.plays ? 'text-emerald-400' :
                                        stats.thisWeek.plays < stats.lastWeek.plays ? 'text-red-400' : 'text-white/40'
                                        }`}>
                                        {stats.thisWeek.plays > stats.lastWeek.plays ? (
                                            <><TrendingUp className="w-3 h-3" /> +{stats.thisWeek.plays - stats.lastWeek.plays}</>
                                        ) : stats.thisWeek.plays < stats.lastWeek.plays ? (
                                            <><TrendingDown className="w-3 h-3" /> {stats.thisWeek.plays - stats.lastWeek.plays}</>
                                        ) : (
                                            <><Minus className="w-3 h-3" /> aynı</>
                                        )}
                                    </span>
                                )}
                            </div>
                            <p className="text-white/30 text-[10px]">bu hafta</p>
                        </div>

                        {/* Toplam Puan */}
                        <div className="text-center">
                            <p className="text-white/50 text-xs mb-1">Toplam Puan</p>
                            <div className="flex items-center justify-center gap-1">
                                <span className="text-2xl font-black text-amber-400">{stats.thisWeek.score}</span>
                                {stats.lastWeek.score > 0 && (
                                    <span className={`text-xs flex items-center gap-0.5 ${stats.thisWeek.score > stats.lastWeek.score ? 'text-emerald-400' :
                                        stats.thisWeek.score < stats.lastWeek.score ? 'text-red-400' : 'text-white/40'
                                        }`}>
                                        {stats.thisWeek.score > stats.lastWeek.score ? (
                                            <><TrendingUp className="w-3 h-3" /></>
                                        ) : stats.thisWeek.score < stats.lastWeek.score ? (
                                            <><TrendingDown className="w-3 h-3" /></>
                                        ) : null}
                                    </span>
                                )}
                            </div>
                            <p className="text-white/30 text-[10px]">bu hafta</p>
                        </div>

                        {/* Ortalama */}
                        <div className="text-center">
                            <p className="text-white/50 text-xs mb-1">Ort. Puan</p>
                            <div className="flex items-center justify-center gap-1">
                                <span className="text-2xl font-black text-emerald-400">{stats.thisWeek.avgScore}</span>
                                {stats.lastWeek.avgScore > 0 && (
                                    <span className={`text-xs flex items-center gap-0.5 ${stats.thisWeek.avgScore > stats.lastWeek.avgScore ? 'text-emerald-400' :
                                        stats.thisWeek.avgScore < stats.lastWeek.avgScore ? 'text-red-400' : 'text-white/40'
                                        }`}>
                                        {stats.thisWeek.avgScore > stats.lastWeek.avgScore ? (
                                            <><TrendingUp className="w-3 h-3" /> +{stats.thisWeek.avgScore - stats.lastWeek.avgScore}</>
                                        ) : stats.thisWeek.avgScore < stats.lastWeek.avgScore ? (
                                            <><TrendingDown className="w-3 h-3" /> {stats.thisWeek.avgScore - stats.lastWeek.avgScore}</>
                                        ) : (
                                            <><Minus className="w-3 h-3" /></>
                                        )}
                                    </span>
                                )}
                            </div>
                            <p className="text-white/30 text-[10px]">geçen hafta: {stats.lastWeek.avgScore || '-'}</p>
                        </div>
                    </div>

                    {/* Motivasyon mesajı */}
                    <div className="mt-4 pt-3 border-t border-white/10 text-center">
                        <p className="text-white/50 text-xs">
                            {stats.thisWeek.avgScore > stats.lastWeek.avgScore && stats.lastWeek.avgScore > 0
                                ? '🎉 Harika! Geçen haftaya göre gelişim gösteriyorsun!'
                                : stats.thisWeek.plays >= 5
                                    ? '💪 Bu hafta harika çalıştın, böyle devam!'
                                    : '🚀 Daha fazla oyun oyna ve gelişimini takip et!'}
                        </p>
                    </div>
                </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Zeka Türü Dağılımı */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-slate-800/50 border border-white/10 rounded-2xl p-6"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <Brain className="w-5 h-5 text-purple-400" />
                        <h3 className="font-bold text-white">Zeka Türü Dağılımı</h3>
                    </div>
                    <p className="text-white/40 text-xs mb-4">
                        Çubuk uzunlukları oyun sayısını gösterir. Farklı oyunlar oynayarak zeka profilini dengele!
                    </p>

                    {Object.keys(stats.intelligenceBreakdown).length === 0 ? (
                        <p className="text-white/40 text-sm text-center py-4">Henüz veri yok</p>
                    ) : (
                        <div className="space-y-4">
                            {Object.entries(stats.intelligenceBreakdown)
                                .sort((a, b) => b[1] - a[1])
                                .map(([type, count]) => {
                                    const info = ZEKA_ACIKLAMALARI[type];
                                    return (
                                        <div key={type} className="p-3 bg-white/5 rounded-xl">
                                            <div className="flex items-start gap-3 mb-2">
                                                <span className="text-2xl">{info?.icon || '🧠'}</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-white font-bold text-sm">{type}</span>
                                                        <span className="text-white/50 text-xs bg-white/10 px-2 py-0.5 rounded-full">{count} oyun</span>
                                                    </div>
                                                    <p className="text-white/50 text-xs mb-2">{info?.desc || 'Bilişsel yetenek'}</p>
                                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${(count / maxIntelligence) * 100}%` }}
                                                            transition={{ duration: 0.5, delay: 0.5 }}
                                                            className="h-full rounded-full"
                                                            style={{ backgroundColor: ZEKA_RENKLERI[type as ZekaTuru] || '#6366F1' }}
                                                        />
                                                    </div>
                                                    {info?.skill && (
                                                        <p className="text-[10px] text-white/30 mt-1.5">
                                                            💪 {info.skill}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                </motion.div>

                {/* Son Oyunlar */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-slate-800/50 border border-white/10 rounded-2xl p-6"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                        <h3 className="font-bold text-white">Son Oyunlarım</h3>
                    </div>

                    {stats.recentGames.length === 0 ? (
                        <p className="text-white/40 text-sm text-center py-4">Henüz oyun yok</p>
                    ) : (
                        <div className="space-y-3">
                            {stats.recentGames.map((game, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between p-3 bg-white/5 rounded-xl"
                                >
                                    <div>
                                        <p className="text-white font-medium text-sm">{game.game_name}</p>
                                        <p className="text-white/40 text-xs">{formatDate(game.created_at)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-amber-400 font-bold">{game.score}</p>
                                        <p className="text-white/30 text-xs">puan</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Oyun Bazında Gelişim */}
            {stats.gameProgress.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-slate-800/50 border border-white/10 rounded-2xl p-6"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <Award className="w-5 h-5 text-amber-400" />
                        <h3 className="font-bold text-white">Oyun Bazında Gelişim</h3>
                    </div>
                    <p className="text-white/40 text-xs mb-4">
                        İlk oynamana göre son puanın ne kadar değişti?
                    </p>

                    <div className="space-y-3">
                        {stats.gameProgress.map((game, idx) => (
                            <div
                                key={idx}
                                className="p-4 bg-white/5 rounded-xl"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <p className="text-white font-medium text-sm">{game.game_name}</p>
                                        <p className="text-white/40 text-xs">{game.playCount} oynama</p>
                                    </div>
                                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-bold ${game.improvement > 0 ? 'bg-emerald-500/20 text-emerald-400' :
                                            game.improvement < 0 ? 'bg-red-500/20 text-red-400' :
                                                'bg-white/10 text-white/50'
                                        }`}>
                                        {game.improvement > 0 ? (
                                            <><TrendingUp className="w-4 h-4" /> +{game.improvement}%</>
                                        ) : game.improvement < 0 ? (
                                            <><TrendingDown className="w-4 h-4" /> {game.improvement}%</>
                                        ) : (
                                            <><Minus className="w-4 h-4" /> Aynı</>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="bg-white/5 rounded-lg p-2">
                                        <p className="text-white/40 text-[10px]">İlk Puan</p>
                                        <p className="text-white font-bold">{game.firstScore}</p>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-2">
                                        <p className="text-white/40 text-[10px]">Son Puan</p>
                                        <p className="text-amber-400 font-bold">{game.lastScore}</p>
                                    </div>
                                    <div className="bg-amber-500/10 rounded-lg p-2 border border-amber-500/20">
                                        <p className="text-amber-400/60 text-[10px]">En İyi</p>
                                        <p className="text-amber-400 font-bold">🏆 {game.bestScore}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {stats.gameProgress.filter(g => g.improvement > 0).length > 0 && (
                        <div className="mt-4 pt-3 border-t border-white/10 text-center">
                            <p className="text-emerald-400/60 text-xs">
                                🎯 {stats.gameProgress.filter(g => g.improvement > 0).length} oyunda gelişim gösteriyorsun!
                            </p>
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
};

export default UserGameStats;
