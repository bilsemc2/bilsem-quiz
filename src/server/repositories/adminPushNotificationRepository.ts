import { supabase } from '@/lib/supabase';

export interface SendPushNotificationInput {
    title: string;
    body: string;
    url: string;
    accessToken: string;
    supabaseUrl: string;
}

export interface SendPushNotificationResult {
    sent: number;
    failed: number;
    total: number;
}

export interface AdminPushNotificationRepository {
    countSubscribers: () => Promise<number>;
    sendPushNotification: (input: SendPushNotificationInput) => Promise<SendPushNotificationResult>;
}

const countSubscribers = async (): Promise<number> => {
    const { count, error } = await supabase
        .from('push_subscriptions')
        .select('*', { count: 'exact', head: true });

    if (error) {
        throw error;
    }

    return count ?? 0;
};

const sendPushNotification = async (
    input: SendPushNotificationInput
): Promise<SendPushNotificationResult> => {
    const response = await fetch(`${input.supabaseUrl}/functions/v1/send-push-notification`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${input.accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            title: input.title,
            body: input.body,
            url: input.url
        })
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result?.error || 'Bildirim gönderilemedi');
    }

    return {
        sent: Number(result?.sent) || 0,
        failed: Number(result?.failed) || 0,
        total: Number(result?.total) || 0
    };
};

export const adminPushNotificationRepository: AdminPushNotificationRepository = {
    countSubscribers,
    sendPushNotification
};
