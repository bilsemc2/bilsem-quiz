// AI Operations Analytics — Type Definitions

export interface AIOperationsAlert {
    severity: 'warning' | 'critical';
    code: string;
    message: string;
}

export interface AIOperationsProviderSummary {
    providerName: string;
    totalJobs: number;
    completedJobs: number;
    failedJobs: number;
    averageLatencyMs: number;
    fallbackRate: number;
    cacheReuseRate: number;
    estimatedTotalTokens: number;
    estimatedCostUsd: number;
    cacheSavedTokens: number;
    estimatedCacheSavingsUsd: number;
}

export interface AIOperationsModelSummary {
    providerName: string;
    modelName: string;
    totalJobs: number;
    completedJobs: number;
    failedJobs: number;
    averageLatencyMs: number;
    estimatedTotalTokens: number;
    estimatedCostUsd: number;
    cacheSavedTokens: number;
    estimatedCacheSavingsUsd: number;
}

export interface AIOperationsReviewBreakdown {
    candidate: number;
    active: number;
    rejected: number;
}

export interface AIOperationsSourceBreakdown {
    ai: number;
    fallback: number;
    bank: number;
}

export interface AIOperationsRecentJob {
    id: string;
    providerName: string;
    modelName: string | null;
    topic: string;
    status: string;
    latencyMs: number | null;
    requestedQuestionCount: number;
    generatedQuestionCount: number;
    fallbackQuestionCount: number;
    estimatedCostUsd: number;
    createdAt: string;
    errorMessage: string | null;
}

export interface AIOperationsAnalyticsData {
    totalJobs: number;
    completedJobs: number;
    failedJobs: number;
    pendingJobs: number;
    failureRate: number;
    fallbackRate: number;
    cacheReuseRate: number;
    averageLatencyMs: number;
    estimatedTotalTokens: number;
    estimatedCostUsd: number;
    last24hEstimatedCostUsd: number;
    previous24hEstimatedCostUsd: number;
    costTrendRate: number;
    cacheSavedTokens: number;
    estimatedCacheSavingsUsd: number;
    averageQualityScore: number;
    lowQualityQuestionCount: number;
    reviewedQuestionCount: number;
    approvalRate: number;
    approvedLast24h: number;
    averageReviewTurnaroundMinutes: number;
    reviewBreakdown: AIOperationsReviewBreakdown;
    sourceBreakdown: AIOperationsSourceBreakdown;
    providerSummaries: AIOperationsProviderSummary[];
    modelSummaries: AIOperationsModelSummary[];
    recentJobs: AIOperationsRecentJob[];
    alerts: AIOperationsAlert[];
}

export interface BuildAIOperationsAnalyticsInput {
    jobs: import('@/server/repositories/aiOperationsRepository').AdminAIGenerationJobRecord[];
    questions: import('@/server/repositories/aiOperationsRepository').AdminAIQuestionRecord[];
    recentJobLimit?: number;
    nowISO?: string;
}
