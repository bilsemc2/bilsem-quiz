export type AIQuestionPoolLocale = '*' | 'tr' | 'en';

export interface AIQuestionPoolDefaultSetting {
    topic: string;
    locale: AIQuestionPoolLocale;
    maxServedCount: number;
    targetPoolSize: number;
    refillBatchSize: number;
    isActive: boolean;
}

export const AI_QUESTION_POOL_DEFAULT_SETTINGS: AIQuestionPoolDefaultSetting[] = [
    {
        topic: '*',
        locale: '*',
        maxServedCount: 2,
        targetPoolSize: 12,
        refillBatchSize: 5,
        isActive: true
    },
    {
        topic: 'problem çözme',
        locale: 'tr',
        maxServedCount: 2,
        targetPoolSize: 16,
        refillBatchSize: 6,
        isActive: true
    },
    {
        topic: 'analitik düşünme',
        locale: 'tr',
        maxServedCount: 2,
        targetPoolSize: 14,
        refillBatchSize: 5,
        isActive: true
    },
    {
        topic: 'yaratıcı mantık',
        locale: 'tr',
        maxServedCount: 3,
        targetPoolSize: 12,
        refillBatchSize: 4,
        isActive: true
    },
    {
        topic: 'sözel anlama',
        locale: 'tr',
        maxServedCount: 3,
        targetPoolSize: 10,
        refillBatchSize: 4,
        isActive: true
    },
    {
        topic: 'çıkarım ve mantık',
        locale: 'tr',
        maxServedCount: 2,
        targetPoolSize: 14,
        refillBatchSize: 5,
        isActive: true
    },
    {
        topic: 'hafıza ve sınıflama',
        locale: 'tr',
        maxServedCount: 2,
        targetPoolSize: 15,
        refillBatchSize: 6,
        isActive: true
    }
];
