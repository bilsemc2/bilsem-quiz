import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Gamepad2, TrendingUp, Target, Clock, Award, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import {
    buildGameStatsSummary,
    emptyGameStatsSummary,
    loadUserGamePlays,
    type GameStatsSummary
} from '@/features/games/model/gamePlayUseCases';
import { useAuth } from '@/contexts/auth/useAuth';
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

const UserGameStats: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<GameStatsSummary>(emptyGameStatsSummary);

    // Collapsible section states
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        intelligence: false,
        recentGames: false,
        gameProgress: false
    });

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const fetchStats = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        try {
            const plays = await loadUserGamePlays(user.id);
            setStats(buildGameStatsSummary(plays));
        } catch (err) {
            console.error('Stats yüklenirken hata:', err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (!user) {
            setStats(emptyGameStatsSummary);
            setLoading(false);
            return;
        }

        void fetchStats();
    }, [user, fetchStats]);

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
            <div className="bg-white dark:bg-slate-900 border-2 border-black/10 rounded-2xl p-6 flex justify-center items-center min-h-[200px] shadow-neo-sm ">
                <Loader2 className="w-8 h-8 text-[#14F195] animate-spin" />
            </div>
        );
    }

    if (stats.totalPlays === 0) {
        return (
            <div className="bg-white dark:bg-slate-900 border-2 border-black/10 rounded-2xl p-8 text-center shadow-neo-sm ">
                <Gamepad2 className="w-12 h-12 text-black/20 dark:text-white/20 mx-auto mb-4" />
                <h3 className="text-lg font-extrabold text-black/60 dark:text-white/60 mb-2 font-nunito">Henüz oyun verisi yok</h3>
                <p className="text-black/40 dark:text-white/40 font-bold text-sm">
                    Tablet veya Bireysel Değerlendirme oyunlarını oynamaya başlayın!
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Özet İstatistikler - Compact 2x2 Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white dark:bg-slate-800 border-2 border-black/10 dark:border-white/10 rounded-xl p-3 text-center shadow-neo-sm hover:translate-y-0.5 hover:shadow-neo-sm transition-all"
                >
                    <div className="w-8 h-8 bg-[#3374FF]/10 dark:bg-[#3374FF]/20 rounded-lg flex items-center justify-center mx-auto mb-2 border-2 border-black/10">
                        <Gamepad2 className="w-4 h-4 text-[#3374FF] dark:text-[#3374FF]" />
                    </div>
                    <p className="text-2xl font-extrabold text-black dark:text-white font-nunito leading-none">{stats.totalPlays}</p>
                    <span className="text-black/50 dark:text-white/50 text-[10px] uppercase font-bold tracking-wider">Oyun</span>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05 }}
                    className="bg-white dark:bg-slate-800 border-2 border-black/10 dark:border-white/10 rounded-xl p-3 text-center shadow-neo-sm hover:translate-y-0.5 hover:shadow-neo-sm transition-all"
                >
                    <div className="w-8 h-8 bg-[#FFD700]/10 dark:bg-[#FFD700]/20 rounded-lg flex items-center justify-center mx-auto mb-2 border-2 border-black/10">
                        <Award className="w-4 h-4 text-[#FFD700]" />
                    </div>
                    <p className="text-2xl font-extrabold text-black dark:text-white font-nunito leading-none">{stats.totalScore.toLocaleString()}</p>
                    <span className="text-black/50 dark:text-white/50 text-[10px] uppercase font-bold tracking-wider">Puan</span>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-slate-800 border-2 border-black/10 dark:border-white/10 rounded-xl p-3 text-center shadow-neo-sm hover:translate-y-0.5 hover:shadow-neo-sm transition-all"
                >
                    <div className="w-8 h-8 bg-[#14F195]/10 dark:bg-[#14F195]/20 rounded-lg flex items-center justify-center mx-auto mb-2 border-2 border-black/10">
                        <Target className="w-4 h-4 text-[#14F195]" />
                    </div>
                    <p className="text-2xl font-extrabold text-black dark:text-white font-nunito leading-none">{stats.averageScore}</p>
                    <span className="text-black/50 dark:text-white/50 text-[10px] uppercase font-bold tracking-wider">Ortalama</span>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15 }}
                    className="bg-white dark:bg-slate-800 border-2 border-black/10 dark:border-white/10 rounded-xl p-3 text-center shadow-neo-sm hover:translate-y-0.5 hover:shadow-neo-sm transition-all"
                >
                    <div className="w-8 h-8 bg-[#FF00EA]/10 dark:bg-[#FF00EA]/20 rounded-lg flex items-center justify-center mx-auto mb-2 border-2 border-black/10">
                        <Clock className="w-4 h-4 text-[#FF00EA]" />
                    </div>
                    <p className="text-2xl font-extrabold text-black dark:text-white font-nunito leading-none">{formatDuration(stats.totalDuration)}</p>
                    <span className="text-black/50 dark:text-white/50 text-[10px] uppercase font-bold tracking-wider">Süre</span>
                </motion.div>
            </div>

            {/* Haftalık Gelişim - Compact */}
            {(stats.thisWeek.plays > 0 || stats.lastWeek.plays > 0) && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-slate-900 border-2 border-black/10 rounded-2xl p-5 shadow-neo-sm "
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-500 border-2 border-black/10 dark:border-white/10 rounded-xl flex items-center justify-center shadow-neo-sm">
                                <TrendingUp className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-nunito font-extrabold text-black dark:text-white text-lg">Bu Hafta</span>
                        </div>
                        <span className="text-black/60 dark:text-white/60 font-bold text-xs bg-gray-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border-2 border-black/10 border-dashed">
                            {stats.thisWeek.avgScore > stats.lastWeek.avgScore && stats.lastWeek.avgScore > 0
                                ? '🎉 Gelişim var!'
                                : stats.thisWeek.plays >= 5
                                    ? '💪 Harika!'
                                    : '🚀 Devam et!'}
                        </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-gray-100 dark:bg-slate-800 border-2 border-black/10 dark:border-white/10 rounded-xl p-3 text-center">
                            <p className="text-2xl font-extrabold text-black dark:text-white font-nunito leading-none mb-1">{stats.thisWeek.plays}</p>
                            <div className="flex items-center justify-center gap-1">
                                <span className="text-black/50 dark:text-white/50 text-[10px] uppercase font-bold tracking-wider">oyun</span>
                                {stats.lastWeek.plays > 0 && stats.thisWeek.plays !== stats.lastWeek.plays && (
                                    <span className={`text-[10px] font-extrabold ${stats.thisWeek.plays > stats.lastWeek.plays ? 'text-[#14F195]' : 'text-[#FF2745]'}`}>
                                        {stats.thisWeek.plays > stats.lastWeek.plays ? '↑' : '↓'}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="bg-gray-100 dark:bg-slate-800 border-2 border-black/10 dark:border-white/10 rounded-xl p-3 text-center">
                            <p className="text-2xl font-extrabold text-[#FFD700] dark:text-[#FFD700] font-nunito leading-none drop-shadow-sm mb-1">{stats.thisWeek.score}</p>
                            <div className="flex items-center justify-center gap-1">
                                <span className="text-black/50 dark:text-white/50 text-[10px] uppercase font-bold tracking-wider">puan</span>
                                {stats.lastWeek.score > 0 && stats.thisWeek.score !== stats.lastWeek.score && (
                                    <span className={`text-[10px] font-extrabold ${stats.thisWeek.score > stats.lastWeek.score ? 'text-[#14F195]' : 'text-[#FF2745]'}`}>
                                        {stats.thisWeek.score > stats.lastWeek.score ? '↑' : '↓'}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="bg-gray-100 dark:bg-slate-800 border-2 border-black/10 dark:border-white/10 rounded-xl p-3 text-center">
                            <p className="text-2xl font-extrabold text-[#14F195] dark:text-[#14F195] font-nunito leading-none mb-1">{stats.thisWeek.avgScore}</p>
                            <span className="text-black/50 dark:text-white/50 text-[10px] uppercase font-bold tracking-wider">ortalama</span>
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
                    className="bg-white dark:bg-slate-900 border-2 border-black/10 rounded-2xl overflow-hidden shadow-neo-sm "
                >
                    <button
                        onClick={() => toggleSection('intelligence')}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors focus:outline-none"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-500 border-2 border-black/10 dark:border-white/10 rounded-xl flex items-center justify-center shadow-neo-sm">
                                <Brain className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-nunito font-extrabold text-black dark:text-white text-base leading-tight">Zeka Dağılımı</h3>
                                <p className="text-black/60 dark:text-white/60 font-bold text-[10px] uppercase tracking-wider mt-0.5">
                                    {Object.keys(stats.intelligenceBreakdown).length} tür
                                </p>
                            </div>
                        </div>
                        {expandedSections.intelligence ? (
                            <ChevronUp className="w-5 h-5 text-black dark:text-white" />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-black dark:text-white" />
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
                                    <p className="text-black/40 dark:text-white/40 font-bold text-xs text-center py-4">Henüz veri yok</p>
                                ) : (
                                    <div className="space-y-2 px-4 pb-4">
                                        {Object.entries(stats.intelligenceBreakdown)
                                            .sort((a, b) => b[1] - a[1])
                                            .slice(0, 4)
                                            .map(([type, count]) => {
                                                const info = ZEKA_ACIKLAMALARI[type];
                                                return (
                                                    <div key={type} className="flex items-center gap-3 p-2.5 bg-gray-100 dark:bg-slate-800 border border-black/5 dark:border-white/5 rounded-xl">
                                                        <span className="text-xl bg-white dark:bg-slate-700 w-8 h-8 flex items-center justify-center rounded-lg border-2 border-black/10">{info?.icon || '🧠'}</span>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="text-black dark:text-white font-extrabold text-xs truncate">{type}</span>
                                                                <span className="text-black/60 dark:text-white/60 font-bold text-[10px]">{count}</span>
                                                            </div>
                                                            <div className="h-2 bg-white border-2 border-black/10 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full border-r-2 border-black/10"
                                                                    style={{
                                                                        width: `${(count / maxIntelligence) * 100}%`,
                                                                        backgroundColor: ZEKA_RENKLERI[type as ZekaTuru] || '#14F195'
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
                    className="bg-white dark:bg-slate-900 border-2 border-black/10 rounded-2xl overflow-hidden shadow-neo-sm "
                >
                    <button
                        onClick={() => toggleSection('recentGames')}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors focus:outline-none"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#3374FF] border-2 border-black/10 dark:border-white/10 rounded-xl flex items-center justify-center shadow-neo-sm">
                                <TrendingUp className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-nunito font-extrabold text-black dark:text-white text-base leading-tight">Son Oyunlar</h3>
                                <p className="text-black/60 dark:text-white/60 font-bold text-[10px] uppercase tracking-wider mt-0.5">
                                    {stats.recentGames.length} oyun
                                </p>
                            </div>
                        </div>
                        {expandedSections.recentGames ? (
                            <ChevronUp className="w-5 h-5 text-black dark:text-white" />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-black dark:text-white" />
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
                                    <p className="text-black/40 dark:text-white/40 font-bold text-xs text-center py-2">Henüz oyun yok</p>
                                ) : (
                                    <div className="space-y-2 px-4 pb-4">
                                        {stats.recentGames.slice(0, 3).map((game, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center justify-between p-2.5 bg-gray-100 dark:bg-slate-800 border border-black/5 dark:border-white/5 rounded-xl"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-black dark:text-white font-extrabold text-xs truncate">{game.game_name}</p>
                                                    <p className="text-black/50 dark:text-white/50 font-bold text-[10px] mt-0.5">{formatDate(game.created_at)}</p>
                                                </div>
                                                <div className="bg-[#FFD700] px-2 py-1 rounded-lg border-2 border-black/10 shadow-neo-sm">
                                                    <p className="text-black font-extrabold text-sm leading-none">{game.score}</p>
                                                </div>
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
                    className="bg-white dark:bg-slate-900 border-2 border-black/10 rounded-2xl overflow-hidden shadow-neo-sm  lg:col-span-2"
                >
                    <button
                        onClick={() => toggleSection('gameProgress')}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors focus:outline-none"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#FFD700] border-2 border-black/10 dark:border-white/10 rounded-xl flex items-center justify-center shadow-neo-sm">
                                <Award className="w-5 h-5 text-black" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-nunito font-extrabold text-black dark:text-white text-base leading-tight">Gelişim</h3>
                                <p className="text-black/60 dark:text-white/60 font-bold text-[10px] uppercase tracking-wider mt-0.5">
                                    {stats.gameProgress.filter(g => g.improvement > 0).length} oyun ↑
                                </p>
                            </div>
                        </div>
                        {expandedSections.gameProgress ? (
                            <ChevronUp className="w-5 h-5 text-black dark:text-white" />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-black dark:text-white" />
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
                                <div className="space-y-3 px-4 pb-4">
                                    {stats.gameProgress.slice(0, 2).map((game, idx) => (
                                        <div
                                            key={idx}
                                            className="p-3 bg-gray-100 dark:bg-slate-800 border border-black/5 dark:border-white/5 rounded-xl"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-black dark:text-white font-extrabold text-xs truncate">{game.game_name}</p>
                                                    <p className="text-black/50 dark:text-white/50 font-bold text-[10px] uppercase">{game.playCount} oynama</p>
                                                </div>
                                                <div className={`flex items-center gap-0.5 px-2 py-1 border-2 border-black/10 rounded-lg text-[10px] font-extrabold shadow-neo-sm ${game.improvement > 0 ? 'bg-[#14F195] text-black' :
                                                    game.improvement < 0 ? 'bg-[#FF2745] text-white' :
                                                        'bg-gray-200 dark:bg-slate-600 text-black dark:text-white'
                                                    }`}>
                                                    {game.improvement > 0 ? `+${game.improvement}%` : game.improvement < 0 ? `${game.improvement}%` : '='}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2 text-center mt-3 border-t-2 border-black/10 dark:border-white/10 pt-3">
                                                <div className="">
                                                    <p className="text-black/40 dark:text-white/40 font-bold uppercase tracking-wider text-[8px] mb-0.5">İlk</p>
                                                    <p className="text-black dark:text-white font-extrabold text-sm">{game.firstScore}</p>
                                                </div>
                                                <div className="border-x-2 border-black/10 dark:border-white/10">
                                                    <p className="text-black/40 dark:text-white/40 font-bold uppercase tracking-wider text-[8px] mb-0.5">Son</p>
                                                    <p className="text-black dark:text-white font-extrabold text-sm">{game.lastScore}</p>
                                                </div>
                                                <div className="">
                                                    <p className="text-black/40 dark:text-white/40 font-bold uppercase tracking-wider text-[8px] mb-0.5">En İyi</p>
                                                    <p className="text-black dark:text-white font-extrabold text-sm">{game.bestScore}</p>
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
