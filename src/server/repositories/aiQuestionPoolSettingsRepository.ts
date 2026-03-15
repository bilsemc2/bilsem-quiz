import { supabase } from '@/lib/supabase';
import {
    AI_QUESTION_POOL_DEFAULT_SETTINGS,
    type AIQuestionPoolDefaultSetting
} from '@/config/aiQuestionPoolDefaultSettings';

export type AIQuestionPoolLocale = '*' | 'tr' | 'en';

interface AIQuestionPoolSettingsDbRow {
    id: string;
    topic: string;
    locale: AIQuestionPoolLocale;
    max_served_count: number;
    target_pool_size: number;
    refill_batch_size: number;
    is_active: boolean;
    updated_at?: string;
}

export interface AIQuestionPoolSettings {
    id: string;
    topic: string;
    locale: AIQuestionPoolLocale;
    maxServedCount: number;
    targetPoolSize: number;
    refillBatchSize: number;
    isActive: boolean;
}

export interface AIQuestionPoolSettingsWriteInput {
    id?: string;
    topic: string;
    locale: AIQuestionPoolLocale;
    maxServedCount: number;
    targetPoolSize: number;
    refillBatchSize: number;
    isActive: boolean;
}

export interface AIQuestionPoolSettingsRepository {
    getEffectiveSettings: (topic: string, locale: 'tr' | 'en') => Promise<AIQuestionPoolSettings>;
    listSettings: () => Promise<AIQuestionPoolSettings[]>;
    upsertSetting: (input: AIQuestionPoolSettingsWriteInput) => Promise<AIQuestionPoolSettings>;
    deleteSetting: (id: string) => Promise<void>;
}

const DEFAULT_SETTINGS: AIQuestionPoolSettings = {
    id: 'default',
    topic: '*',
    locale: '*',
    maxServedCount: 2,
    targetPoolSize: 12,
    refillBatchSize: 5,
    isActive: true
};

const LOCAL_STORAGE_KEY = 'ai_question_pool_settings_local';

const normalizeTopic = (topic: string): string => {
    const trimmed = topic.trim();
    return trimmed.length > 0 ? trimmed : '*';
};

const clampPositiveInt = (value: number, fallback: number): number => {
    const normalized = Number.isFinite(value) ? Math.round(value) : fallback;
    return normalized > 0 ? normalized : fallback;
};

const mapRow = (row: AIQuestionPoolSettingsDbRow): AIQuestionPoolSettings => ({
    id: row.id,
    topic: row.topic,
    locale: row.locale,
    maxServedCount: clampPositiveInt(Number(row.max_served_count), DEFAULT_SETTINGS.maxServedCount),
    targetPoolSize: clampPositiveInt(Number(row.target_pool_size), DEFAULT_SETTINGS.targetPoolSize),
    refillBatchSize: clampPositiveInt(Number(row.refill_batch_size), DEFAULT_SETTINGS.refillBatchSize),
    isActive: Boolean(row.is_active)
});

const mapDefaultToSetting = (setting: AIQuestionPoolDefaultSetting, index: number): AIQuestionPoolSettings => ({
    id: `default-${index}-${setting.topic}-${setting.locale}`,
    topic: setting.topic,
    locale: setting.locale,
    maxServedCount: clampPositiveInt(setting.maxServedCount, DEFAULT_SETTINGS.maxServedCount),
    targetPoolSize: clampPositiveInt(setting.targetPoolSize, DEFAULT_SETTINGS.targetPoolSize),
    refillBatchSize: clampPositiveInt(setting.refillBatchSize, DEFAULT_SETTINGS.refillBatchSize),
    isActive: setting.isActive
});

const readLocalSettings = (): AIQuestionPoolSettings[] => {
    if (typeof window === 'undefined') {
        return AI_QUESTION_POOL_DEFAULT_SETTINGS.map(mapDefaultToSetting);
    }

    const fromDefaults = AI_QUESTION_POOL_DEFAULT_SETTINGS.map(mapDefaultToSetting);
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
        return fromDefaults;
    }

    try {
        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) {
            return fromDefaults;
        }

        const parsedRows = parsed
            .filter((item): item is AIQuestionPoolSettings => Boolean(item && typeof item === 'object'))
            .map((item, index) => ({
                id: typeof item.id === 'string' && item.id.length > 0 ? item.id : `local-${index}-${Date.now()}`,
                topic: normalizeTopic(String(item.topic ?? '*')),
                locale: (item.locale === 'tr' || item.locale === 'en' || item.locale === '*') ? item.locale : '*',
                maxServedCount: clampPositiveInt(Number(item.maxServedCount), DEFAULT_SETTINGS.maxServedCount),
                targetPoolSize: clampPositiveInt(Number(item.targetPoolSize), DEFAULT_SETTINGS.targetPoolSize),
                refillBatchSize: clampPositiveInt(Number(item.refillBatchSize), DEFAULT_SETTINGS.refillBatchSize),
                isActive: Boolean(item.isActive)
            }));

        const mergedByKey = new Map<string, AIQuestionPoolSettings>();
        for (const row of [...fromDefaults, ...parsedRows]) {
            mergedByKey.set(`${row.topic}::${row.locale}`, row);
        }

        return Array.from(mergedByKey.values());
    } catch {
        return fromDefaults;
    }
};

const resolveFromRows = (
    rows: AIQuestionPoolSettings[],
    topic: string,
    locale: 'tr' | 'en'
): AIQuestionPoolSettings => {
    const normalizedTopic = normalizeTopic(topic);
    const candidates = rows.filter((row) =>
        row.isActive &&
        (row.topic === normalizedTopic || row.topic === '*') &&
        (row.locale === locale || row.locale === '*')
    );

    if (candidates.length === 0) {
        return DEFAULT_SETTINGS;
    }

    candidates.sort((a, b) => resolvePriority(
        {
            id: a.id,
            topic: a.topic,
            locale: a.locale,
            max_served_count: a.maxServedCount,
            target_pool_size: a.targetPoolSize,
            refill_batch_size: a.refillBatchSize,
            is_active: a.isActive
        },
        normalizedTopic,
        locale
    ) - resolvePriority(
        {
            id: b.id,
            topic: b.topic,
            locale: b.locale,
            max_served_count: b.maxServedCount,
            target_pool_size: b.targetPoolSize,
            refill_batch_size: b.refillBatchSize,
            is_active: b.isActive
        },
        normalizedTopic,
        locale
    ));

    return candidates[0];
};

const resolvePriority = (row: AIQuestionPoolSettingsDbRow, topic: string, locale: 'tr' | 'en'): number => {
    if (row.topic === topic && row.locale === locale) return 0;
    if (row.topic === topic && row.locale === '*') return 1;
    if (row.topic === '*' && row.locale === locale) return 2;
    if (row.topic === '*' && row.locale === '*') return 3;
    return 99;
};

const getEffectiveSettings = async (topic: string, locale: 'tr' | 'en'): Promise<AIQuestionPoolSettings> => {
    const normalizedTopic = normalizeTopic(topic);

    const { data, error } = await supabase
        .from('ai_question_pool_settings')
        .select('id, topic, locale, max_served_count, target_pool_size, refill_batch_size, is_active, updated_at')
        .eq('is_active', true)
        .in('topic', [normalizedTopic, '*'])
        .in('locale', [locale, '*']);

    if (error || !data || data.length === 0) {
        if (error) {
            console.error('ai question pool settings fetch failed:', error);
        }
        const fallbackRows = readLocalSettings();
        return resolveFromRows(fallbackRows, normalizedTopic, locale);
    }

    const rows = data as unknown as AIQuestionPoolSettingsDbRow[];
    const sorted = rows.sort((a, b) => {
        const rankDiff = resolvePriority(a, normalizedTopic, locale) - resolvePriority(b, normalizedTopic, locale);
        if (rankDiff !== 0) return rankDiff;
        const aTime = a.updated_at ? Date.parse(a.updated_at) : 0;
        const bTime = b.updated_at ? Date.parse(b.updated_at) : 0;
        return bTime - aTime;
    });

    return mapRow(sorted[0]);
};

const listSettings = async (): Promise<AIQuestionPoolSettings[]> => {
    const { data, error } = await supabase
        .from('ai_question_pool_settings')
        .select('id, topic, locale, max_served_count, target_pool_size, refill_batch_size, is_active')
        .order('topic', { ascending: true })
        .order('locale', { ascending: true });

    if (error || !data) {
        if (error) {
            console.error('ai question pool settings list failed:', error);
        }
        return readLocalSettings();
    }

    const dbRows = (data as unknown as AIQuestionPoolSettingsDbRow[]).map(mapRow);
    if (dbRows.length > 0) {
        return dbRows;
    }

    return readLocalSettings();
};

const upsertSetting = async (input: AIQuestionPoolSettingsWriteInput): Promise<AIQuestionPoolSettings> => {
    const topic = normalizeTopic(input.topic);
    const locale: AIQuestionPoolLocale = input.locale;

    const payload = {
        id: input.id,
        topic,
        locale,
        max_served_count: clampPositiveInt(input.maxServedCount, DEFAULT_SETTINGS.maxServedCount),
        target_pool_size: clampPositiveInt(input.targetPoolSize, DEFAULT_SETTINGS.targetPoolSize),
        refill_batch_size: clampPositiveInt(input.refillBatchSize, DEFAULT_SETTINGS.refillBatchSize),
        is_active: input.isActive
    };

    const { data, error } = await supabase
        .from('ai_question_pool_settings')
        .upsert(payload, { onConflict: 'topic,locale' })
        .select('id, topic, locale, max_served_count, target_pool_size, refill_batch_size, is_active')
        .single();

    if (error || !data) {
        throw error ?? new Error('ai question pool setting upsert failed');
    }

    return mapRow(data as unknown as AIQuestionPoolSettingsDbRow);
};

const deleteSetting = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('ai_question_pool_settings')
        .delete()
        .eq('id', id);

    if (error) {
        throw error;
    }
};

export const aiQuestionPoolSettingsRepository: AIQuestionPoolSettingsRepository = {
    getEffectiveSettings,
    listSettings,
    upsertSetting,
    deleteSetting
};
