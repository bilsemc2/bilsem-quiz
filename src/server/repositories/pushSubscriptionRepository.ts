import { supabase } from '@/lib/supabase';

export interface PushSubscriptionInput {
    userId: string;
    endpoint: string;
    p256dh: string;
    auth: string;
}

export interface PushSubscriptionRepository {
    upsertSubscription: (input: PushSubscriptionInput) => Promise<void>;
    deleteSubscriptionByEndpoint: (endpoint: string) => Promise<void>;
}

const upsertSubscription = async (input: PushSubscriptionInput): Promise<void> => {
    const { error } = await supabase
        .from('push_subscriptions')
        .upsert(
            {
                user_id: input.userId,
                endpoint: input.endpoint,
                p256dh: input.p256dh,
                auth: input.auth
            },
            {
                onConflict: 'endpoint'
            }
        );

    if (error) {
        throw error;
    }
};

const deleteSubscriptionByEndpoint = async (endpoint: string): Promise<void> => {
    const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', endpoint);

    if (error) {
        throw error;
    }
};

export const pushSubscriptionRepository: PushSubscriptionRepository = {
    upsertSubscription,
    deleteSubscriptionByEndpoint
};
