import { authRepository, type AuthRepository } from '@/server/repositories/authRepository';
import {
    pushSubscriptionRepository,
    type PushSubscriptionInput,
    type PushSubscriptionRepository
} from '@/server/repositories/pushSubscriptionRepository';

interface PushSubscriptionJsonValue {
    endpoint?: string;
    keys?: {
        p256dh?: string;
        auth?: string;
    };
}

const normalizePushValue = (value: string | undefined): string | null => {
    const normalized = value?.trim();
    return normalized ? normalized : null;
};

export const toPushSubscriptionInput = (
    userId: string,
    subscription: Pick<PushSubscription, 'toJSON'>
): PushSubscriptionInput | null => {
    const payload = subscription.toJSON() as PushSubscriptionJsonValue;
    const endpoint = normalizePushValue(payload.endpoint);
    const p256dh = normalizePushValue(payload.keys?.p256dh);
    const auth = normalizePushValue(payload.keys?.auth);

    if (!endpoint || !p256dh || !auth) {
        return null;
    }

    return {
        userId,
        endpoint,
        p256dh,
        auth
    };
};

export const persistCurrentUserPushSubscription = async (
    subscription: Pick<PushSubscription, 'toJSON'>,
    deps: {
        auth: Pick<AuthRepository, 'getSessionUser'>;
        push: Pick<PushSubscriptionRepository, 'upsertSubscription'>;
    } = { auth: authRepository, push: pushSubscriptionRepository }
): Promise<boolean> => {
    const user = await deps.auth.getSessionUser();
    if (!user) {
        return false;
    }

    const payload = toPushSubscriptionInput(user.id, subscription);
    if (!payload) {
        return false;
    }

    await deps.push.upsertSubscription(payload);
    return true;
};

export const removePushSubscriptionByEndpoint = async (
    endpoint: string,
    deps: Pick<PushSubscriptionRepository, 'deleteSubscriptionByEndpoint'> = pushSubscriptionRepository
): Promise<void> => {
    const normalizedEndpoint = endpoint.trim();
    if (!normalizedEndpoint) {
        return;
    }

    await deps.deleteSubscriptionByEndpoint(normalizedEndpoint);
};
