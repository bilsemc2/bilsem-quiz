import type { SendPushNotificationInput } from '@/server/repositories/adminPushNotificationRepository';

export interface PushNotificationDraft {
    title: string;
    body: string;
    url: string;
}

interface BuildPushNotificationInputParams {
    draft: PushNotificationDraft;
    accessToken: string;
    supabaseUrl: string;
}

export const isPushNotificationDraftValid = (draft: PushNotificationDraft): boolean => {
    return draft.title.trim().length > 0 && draft.body.trim().length > 0;
};

export const buildPushNotificationInput = (
    params: BuildPushNotificationInputParams
): SendPushNotificationInput => {
    return {
        title: params.draft.title.trim(),
        body: params.draft.body.trim(),
        url: params.draft.url.trim() || '/',
        accessToken: params.accessToken,
        supabaseUrl: params.supabaseUrl
    };
};

export const buildSubscriberLabel = (subscriberCount: number | null): string => {
    return `Tüm Abonelere Gönder (${subscriberCount ?? 0})`;
};
