import { useEffect, useState } from 'react';
import { Loader2, Gauge, Brain, Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { adminStatisticsRepository } from '@/server/repositories/adminStatisticsRepository';
import {
    buildAdaptiveDifficultyAnalyticsData,
    createEmptyAdaptiveDifficultyAnalyticsData,
    type AdaptiveDifficultyAnalyticsData
} from '@/features/admin/model/adaptiveDifficultyAnalyticsUseCases';

export default function AdaptiveDifficultyAnalytics() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<AdaptiveDifficultyAnalyticsData>(createEmptyAdaptiveDifficultyAnalyticsData());

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const attempts = await adminStatisticsRepository.listRecentAdaptiveQuestionAttempts(250);
                const profileIds = Array.from(new Set(attempts.map((attempt) => attempt.user_id).filter(Boolean)));
                const profiles = await adminStatisticsRepository.listProfilesByIds(profileIds);
                setData(buildAdaptiveDifficultyAnalyticsData({ attempts, profiles }));
            } catch (error) {
                console.error('Adaptive difficulty analytics yüklenemedi:', error);
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, []);

    if (loading) {
        return (
            <div className="flex min-h-[320px] items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-3">
                <Gauge className="h-8 w-8 text-indigo-500" />
                <h1 className="text-2xl font-bold text-slate-800">Adaptif Zorluk</h1>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-600 p-6 text-white shadow-lg">
                    <div className="mb-3 flex items-center gap-3">
                        <Brain className="h-5 w-5" />
                        <span className="font-semibold">Kararlı Deneme</span>
                    </div>
                    <div className="text-4xl font-bold">{data.totalAttempts}</div>
                </div>

                <div className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white shadow-lg">
                    <div className="mb-3 flex items-center gap-3">
                        <Activity className="h-5 w-5" />
                        <span className="font-semibold">Doğruluk</span>
                    </div>
                    <div className="text-4xl font-bold">%{data.overallAccuracyRate}</div>
                </div>

                <div className="rounded-2xl bg-gradient-to-r from-purple-500 to-fuchsia-600 p-6 text-white shadow-lg">
                    <div className="mb-3 flex items-center gap-3">
                        <Gauge className="h-5 w-5" />
                        <span className="font-semibold">Ort. Zorluk</span>
                    </div>
                    <div className="text-4xl font-bold">{data.averageDifficultyLevel}</div>
                </div>

                <div className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 p-6 text-white shadow-lg">
                    <div className="mb-3 flex items-center gap-3">
                        <Brain className="h-5 w-5" />
                        <span className="font-semibold">Aktif Öğrenci</span>
                    </div>
                    <div className="text-4xl font-bold">{data.uniqueLearners}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="rounded-2xl bg-white p-6 shadow-lg xl:col-span-2">
                    <h2 className="mb-5 text-lg font-semibold text-slate-800">Zorluk Dağılımı</h2>
                    {data.difficultyDistribution.length === 0 ? (
                        <div className="py-8 text-center text-slate-400">Henüz karar logu yok</div>
                    ) : (
                        <div className="space-y-4">
                            {data.difficultyDistribution.map((item) => (
                                <div key={item.difficultyLevel} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium text-slate-700">Seviye {item.difficultyLevel}</span>
                                        <span className="text-slate-500">
                                            {item.attempts} deneme · %{item.accuracyRate} doğruluk
                                        </span>
                                    </div>
                                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                                        <div
                                            className="h-full rounded-full bg-indigo-500"
                                            style={{
                                                width: `${Math.max(6, (item.attempts / Math.max(data.totalAttempts, 1)) * 100)}%`
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-lg">
                    <h2 className="mb-5 text-lg font-semibold text-slate-800">Karar Yönü</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3">
                            <div className="flex items-center gap-2 font-medium text-emerald-700">
                                <TrendingUp className="h-4 w-4" />
                                <span>Yükseltildi</span>
                            </div>
                            <span className="text-xl font-bold text-emerald-700">{data.increasedCount}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-xl bg-amber-50 px-4 py-3">
                            <div className="flex items-center gap-2 font-medium text-amber-700">
                                <Minus className="h-4 w-4" />
                                <span>Sabit</span>
                            </div>
                            <span className="text-xl font-bold text-amber-700">{data.steadyCount}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-xl bg-rose-50 px-4 py-3">
                            <div className="flex items-center gap-2 font-medium text-rose-700">
                                <TrendingDown className="h-4 w-4" />
                                <span>Düşürüldü</span>
                            </div>
                            <span className="text-xl font-bold text-rose-700">{data.decreasedCount}</span>
                        </div>
                        <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                            Ortalama tepki süresi: <span className="font-semibold text-slate-800">{data.averageResponseMs} ms</span>
                        </div>
                        <div className="rounded-xl border border-slate-100 px-4 py-3">
                            <div className="mb-2 text-sm font-semibold text-slate-700">Karar Modu</div>
                            <div className="space-y-2 text-sm text-slate-600">
                                <div className="flex items-center justify-between">
                                    <span>Rule only</span>
                                    <span className="font-bold text-slate-800">{data.ruleOnlyCount}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Hybrid AI</span>
                                    <span className="font-bold text-indigo-600">{data.hybridAppliedCount}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Rule fallback</span>
                                    <span className="font-bold text-amber-600">{data.hybridFallbackCount}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <div className="rounded-2xl bg-white p-6 shadow-lg">
                    <h2 className="mb-5 text-lg font-semibold text-slate-800">En Sık Karar Gerekçeleri</h2>
                    {data.topReasons.length === 0 ? (
                        <div className="py-6 text-center text-slate-400">Henüz gerekçe verisi yok</div>
                    ) : (
                        <ul className="space-y-3">
                            {data.topReasons.map((item) => (
                                <li key={item.reasonCode} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                                    <span className="font-mono text-sm text-slate-700">{item.reasonCode}</span>
                                    <span className="font-bold text-indigo-600">{item.count}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-lg">
                    <h2 className="mb-5 text-lg font-semibold text-slate-800">Son Kararlar</h2>
                    {data.recentDecisions.length === 0 ? (
                        <div className="py-6 text-center text-slate-400">Henüz karar logu yok</div>
                    ) : (
                        <ul className="space-y-3">
                            {data.recentDecisions.map((decision, index) => (
                                <li key={`${decision.createdAt}-${index}`} className="rounded-xl border border-slate-100 p-4">
                                    <div className="mb-2 flex items-center justify-between gap-3">
                                        <div>
                                            <div className="font-semibold text-slate-800">{decision.userName}</div>
                                            <div className="text-sm text-slate-500">{decision.topic}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-indigo-600">
                                                {decision.baseDifficulty} → {decision.difficultyLevel}
                                            </div>
                                            <div className="text-xs text-slate-400">
                                                {new Date(decision.createdAt).toLocaleDateString('tr-TR')}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-sm text-slate-600">{decision.explanation}</div>
                                    <div className="mt-2 text-xs text-slate-500">
                                        {decision.wasCorrect ? 'Doğru' : 'Yanlış'} · {decision.responseMs} ms
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
