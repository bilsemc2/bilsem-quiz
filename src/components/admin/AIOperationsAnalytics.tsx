import { useEffect, useState, type ReactNode } from 'react';
import {
    Activity,
    AlertTriangle,
    Bot,
    CheckCircle2,
    Clock3,
    Loader2,
    ShieldAlert,
    TriangleAlert
} from 'lucide-react';
import { aiOperationsRepository } from '@/server/repositories/aiOperationsRepository';
import {
    buildAIOperationsAnalyticsData,
    createEmptyAIOperationsAnalyticsData,
    type AIOperationsAnalyticsData
} from '@/features/admin/model/aiOperationsAnalyticsUseCases';

const alertToneClasses = {
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
    critical: 'border-rose-200 bg-rose-50 text-rose-800'
} as const;

export default function AIOperationsAnalytics() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<AIOperationsAnalyticsData>(createEmptyAIOperationsAnalyticsData());

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const [jobs, questions] = await Promise.all([
                    aiOperationsRepository.listRecentGenerationJobs(250),
                    aiOperationsRepository.listRecentQuestions(500)
                ]);
                setData(buildAIOperationsAnalyticsData({ jobs, questions }));
            } catch (error) {
                console.error('AI operations analytics yüklenemedi:', error);
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
                <Bot className="h-8 w-8 text-indigo-500" />
                <h1 className="text-2xl font-bold text-slate-800">AI Operasyon</h1>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                    icon={<Bot className="h-5 w-5" />}
                    title="Toplam Job"
                    value={data.totalJobs}
                    gradient="from-indigo-500 to-blue-600"
                />
                <MetricCard
                    icon={<Clock3 className="h-5 w-5" />}
                    title="Ort. Latency"
                    value={`${data.averageLatencyMs} ms`}
                    gradient="from-cyan-500 to-sky-600"
                />
                <MetricCard
                    icon={<TriangleAlert className="h-5 w-5" />}
                    title="Fallback Oranı"
                    value={`%${data.fallbackRate}`}
                    gradient="from-amber-500 to-orange-600"
                />
                <MetricCard
                    icon={<ShieldAlert className="h-5 w-5" />}
                    title="Hata Oranı"
                    value={`%${data.failureRate}`}
                    gradient="from-rose-500 to-pink-600"
                />
                <MetricCard
                    icon={<Activity className="h-5 w-5" />}
                    title="Cache Reuse"
                    value={`%${data.cacheReuseRate}`}
                    gradient="from-emerald-500 to-teal-600"
                />
                <MetricCard
                    icon={<CheckCircle2 className="h-5 w-5" />}
                    title="Kalite Skoru"
                    value={data.averageQualityScore}
                    gradient="from-violet-500 to-fuchsia-600"
                />
                <MetricCard
                    icon={<Bot className="h-5 w-5" />}
                    title="Tahmini Maliyet"
                    value={formatUsd(data.estimatedCostUsd)}
                    gradient="from-slate-700 to-slate-900"
                />
                <MetricCard
                    icon={<Clock3 className="h-5 w-5" />}
                    title="Son 24s Maliyet"
                    value={formatUsd(data.last24hEstimatedCostUsd)}
                    gradient="from-emerald-700 to-lime-700"
                />
                <MetricCard
                    icon={<Activity className="h-5 w-5" />}
                    title="Cache Tasarruf"
                    value={formatUsd(data.estimatedCacheSavingsUsd)}
                    gradient="from-cyan-700 to-blue-800"
                />
            </div>

            {data.alerts.length > 0 && (
                <div className="space-y-3">
                    {data.alerts.map((alert) => (
                        <div
                            key={alert.code}
                            className={`rounded-2xl border px-4 py-3 ${alertToneClasses[alert.severity]}`}
                        >
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                                <div>
                                    <div className="text-sm font-semibold uppercase tracking-wide">
                                        {alert.severity === 'critical' ? 'Kritik Alarm' : 'Uyarı'}
                                    </div>
                                    <div className="text-sm">{alert.message}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="rounded-2xl bg-white p-6 shadow-lg xl:col-span-2">
                    <h2 className="mb-5 text-lg font-semibold text-slate-800">Provider Özeti</h2>
                    {data.providerSummaries.length === 0 ? (
                        <div className="py-8 text-center text-slate-400">Henüz provider verisi yok</div>
                    ) : (
                        <div className="space-y-4">
                            {data.providerSummaries.map((summary) => (
                                <div key={summary.providerName} className="rounded-2xl border border-slate-100 p-4">
                                    <div className="mb-3 flex items-center justify-between gap-3">
                                        <div className="font-semibold text-slate-800">{summary.providerName}</div>
                                        <div className="text-sm text-slate-500">{summary.totalJobs} job</div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-sm text-slate-600 md:grid-cols-4">
                                        <InfoPill label="Tamamlandı" value={summary.completedJobs} />
                                        <InfoPill label="Başarısız" value={summary.failedJobs} />
                                        <InfoPill label="Latency" value={`${summary.averageLatencyMs} ms`} />
                                        <InfoPill label="Fallback" value={`%${summary.fallbackRate}`} />
                                        <InfoPill label="Cache" value={`%${summary.cacheReuseRate}`} />
                                        <InfoPill label="Token" value={summary.estimatedTotalTokens.toLocaleString('tr-TR')} />
                                        <InfoPill label="Maliyet" value={formatUsd(summary.estimatedCostUsd)} />
                                        <InfoPill label="Saved Token" value={summary.cacheSavedTokens.toLocaleString('tr-TR')} />
                                        <InfoPill label="Tasarruf" value={formatUsd(summary.estimatedCacheSavingsUsd)} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-lg">
                    <h2 className="mb-5 text-lg font-semibold text-slate-800">Kalite Durumu</h2>
                    <div className="space-y-4">
                        <StatusRow label="Candidate" value={data.reviewBreakdown.candidate} tone="slate" />
                        <StatusRow label="Active" value={data.reviewBreakdown.active} tone="emerald" />
                        <StatusRow label="Rejected" value={data.reviewBreakdown.rejected} tone="rose" />
                        <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                            <div className="mb-2 font-semibold text-slate-700">Review Akışı</div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span>Reviewed</span>
                                    <span className="font-bold text-slate-800">{data.reviewedQuestionCount}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Approval Oranı</span>
                                    <span className="font-bold text-slate-800">%{data.approvalRate}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Son 24s Approval</span>
                                    <span className="font-bold text-slate-800">{data.approvedLast24h}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Ort. Review Süresi</span>
                                    <span className="font-bold text-slate-800">
                                        {data.averageReviewTurnaroundMinutes} dk
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                            <div className="mb-2 font-semibold text-slate-700">Soru Kaynağı</div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span>AI</span>
                                    <span className="font-bold text-slate-800">{data.sourceBreakdown.ai}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Fallback</span>
                                    <span className="font-bold text-slate-800">{data.sourceBreakdown.fallback}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Bank</span>
                                    <span className="font-bold text-slate-800">{data.sourceBreakdown.bank}</span>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                            <div className="mb-2 font-semibold text-slate-700">Maliyet ve Kalite</div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span>Tahmini Token</span>
                                    <span className="font-bold text-slate-800">
                                        {data.estimatedTotalTokens.toLocaleString('tr-TR')}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Tahmini USD</span>
                                    <span className="font-bold text-slate-800">{formatUsd(data.estimatedCostUsd)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Son 24s USD</span>
                                    <span className="font-bold text-slate-800">{formatUsd(data.last24hEstimatedCostUsd)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Önceki 24s USD</span>
                                    <span className="font-bold text-slate-800">{formatUsd(data.previous24hEstimatedCostUsd)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Maliyet Trendi</span>
                                    <span className={`font-bold ${data.costTrendRate > 0 ? 'text-rose-700' : data.costTrendRate < 0 ? 'text-emerald-700' : 'text-slate-800'}`}>
                                        {formatSignedRate(data.costTrendRate)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Saved Token</span>
                                    <span className="font-bold text-slate-800">
                                        {data.cacheSavedTokens.toLocaleString('tr-TR')}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Cache Tasarruf</span>
                                    <span className="font-bold text-slate-800">{formatUsd(data.estimatedCacheSavingsUsd)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Düşük Kalite Soru</span>
                                    <span className="font-bold text-slate-800">{data.lowQualityQuestionCount}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-lg">
                <h2 className="mb-5 text-lg font-semibold text-slate-800">Son AI Job’ları</h2>
                {data.recentJobs.length === 0 ? (
                    <div className="py-8 text-center text-slate-400">Henüz AI job verisi yok</div>
                ) : (
                    <div className="space-y-3">
                        {data.recentJobs.map((job) => (
                            <div key={job.id} className="rounded-2xl border border-slate-100 p-4">
                                <div className="mb-2 flex items-center justify-between gap-3">
                                    <div>
                                        <div className="font-semibold text-slate-800">{job.providerName}</div>
                                        <div className="text-sm text-slate-500">
                                            {job.modelName ? `${job.modelName} · ${job.topic}` : job.topic}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <JobStatus status={job.status} />
                                        <div className="mt-1 text-xs text-slate-400">
                                            {new Date(job.createdAt).toLocaleString('tr-TR')}
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm text-slate-600 md:grid-cols-5">
                                    <InfoPill label="Latency" value={job.latencyMs === null ? 'Bekliyor' : `${job.latencyMs} ms`} />
                                    <InfoPill label="İstenen" value={job.requestedQuestionCount} />
                                    <InfoPill label="Üretilen" value={job.generatedQuestionCount} />
                                    <InfoPill label="Fallback" value={job.fallbackQuestionCount} />
                                    <InfoPill label="Maliyet" value={formatUsd(job.estimatedCostUsd)} />
                                </div>
                                {job.errorMessage && (
                                    <div className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
                                        {job.errorMessage}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-lg">
                <h2 className="mb-5 text-lg font-semibold text-slate-800">Model Özeti</h2>
                {data.modelSummaries.length === 0 ? (
                    <div className="py-8 text-center text-slate-400">Henüz model verisi yok</div>
                ) : (
                    <div className="space-y-4">
                        {data.modelSummaries.map((summary) => (
                            <div
                                key={`${summary.providerName}-${summary.modelName}`}
                                className="rounded-2xl border border-slate-100 p-4"
                            >
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <div>
                                        <div className="font-semibold text-slate-800">{summary.modelName}</div>
                                        <div className="text-sm text-slate-500">{summary.providerName}</div>
                                    </div>
                                    <div className="text-sm text-slate-500">{summary.totalJobs} job</div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm text-slate-600 md:grid-cols-5">
                                    <InfoPill label="Tamamlandı" value={summary.completedJobs} />
                                    <InfoPill label="Başarısız" value={summary.failedJobs} />
                                    <InfoPill label="Latency" value={`${summary.averageLatencyMs} ms`} />
                                    <InfoPill label="Token" value={summary.estimatedTotalTokens.toLocaleString('tr-TR')} />
                                    <InfoPill label="Maliyet" value={formatUsd(summary.estimatedCostUsd)} />
                                    <InfoPill label="Saved Token" value={summary.cacheSavedTokens.toLocaleString('tr-TR')} />
                                    <InfoPill label="Tasarruf" value={formatUsd(summary.estimatedCacheSavingsUsd)} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function formatUsd(value: number) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 4,
        maximumFractionDigits: 4
    }).format(value);
}

function formatSignedRate(value: number) {
    if (value > 0) {
        return `+%${value}`;
    }

    if (value < 0) {
        return `-%${Math.abs(value)}`;
    }

    return '%0';
}

function MetricCard({
    icon,
    title,
    value,
    gradient
}: {
    icon: ReactNode;
    title: string;
    value: string | number;
    gradient: string;
}) {
    return (
        <div className={`rounded-2xl bg-gradient-to-r ${gradient} p-6 text-white shadow-lg`}>
            <div className="mb-3 flex items-center gap-3">
                {icon}
                <span className="font-semibold">{title}</span>
            </div>
            <div className="text-4xl font-bold">{value}</div>
        </div>
    );
}

function InfoPill({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-xl bg-slate-50 px-3 py-2">
            <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
            <div className="font-semibold text-slate-800">{value}</div>
        </div>
    );
}

function StatusRow({
    label,
    value,
    tone
}: {
    label: string;
    value: number;
    tone: 'slate' | 'emerald' | 'rose';
}) {
    const toneClass =
        tone === 'emerald'
            ? 'bg-emerald-50 text-emerald-700'
            : tone === 'rose'
                ? 'bg-rose-50 text-rose-700'
                : 'bg-slate-50 text-slate-700';

    return (
        <div className={`flex items-center justify-between rounded-xl px-4 py-3 ${toneClass}`}>
            <span className="font-medium">{label}</span>
            <span className="text-xl font-bold">{value}</span>
        </div>
    );
}

function JobStatus({ status }: { status: string }) {
    if (status === 'completed') {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Tamamlandı
            </span>
        );
    }

    if (status === 'failed') {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700">
                <ShieldAlert className="h-3.5 w-3.5" />
                Hatalı
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
            <Activity className="h-3.5 w-3.5" />
            Bekliyor
        </span>
    );
}
