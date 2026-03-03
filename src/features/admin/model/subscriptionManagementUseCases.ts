import type { MessageRecipientRow } from '@/server/repositories/profileRepository';
import type { UpsertSubscriptionInput } from '@/server/repositories/adminSubscriptionRepository';
import type { Package, UserSubscription } from '@/types/package';

export interface SubscriptionUserOption {
    id: string;
    name: string;
    email: string;
}

export interface SubscriptionFormData {
    user_id: string;
    package_id: string;
    status: UserSubscription['status'];
    credits_remaining: number;
    xp_remaining: number;
    expires_at: string;
    payment_reference: string;
    notes: string;
}

export const toSubscriptionUserOptions = (
    recipients: MessageRecipientRow[]
): SubscriptionUserOption[] => {
    return recipients.map((recipient) => ({
        id: recipient.id,
        name: recipient.name?.trim() || 'İsimsiz Kullanıcı',
        email: recipient.email?.trim() || '-'
    }));
};

export const attachUsersToSubscriptions = (
    subscriptions: UserSubscription[],
    users: SubscriptionUserOption[]
): UserSubscription[] => {
    const userById = new Map(users.map((user) => [user.id, user]));

    return subscriptions.map((subscription) => {
        const user = userById.get(subscription.user_id);

        if (!user) {
            return {
                ...subscription,
                user: undefined
            };
        }

        return {
            ...subscription,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        };
    });
};

export const toSubscriptionMutationInput = (
    formData: SubscriptionFormData
): UpsertSubscriptionInput => {
    return {
        user_id: formData.user_id,
        package_id: formData.package_id,
        status: formData.status,
        credits_remaining: formData.credits_remaining || null,
        xp_remaining: formData.xp_remaining || null,
        expires_at: formData.expires_at || null,
        payment_reference: formData.payment_reference || null,
        notes: formData.notes || null,
        activated_at: formData.status === 'active' ? new Date().toISOString() : null
    };
};

export const applyPackageDefaults = (
    packageId: string,
    packages: Package[],
    prevFormData: SubscriptionFormData
): SubscriptionFormData => {
    const pkg = packages.find((item) => item.id === packageId);
    if (!pkg) {
        return prevFormData;
    }

    return {
        ...prevFormData,
        package_id: packageId,
        credits_remaining: pkg.initial_credits || 0,
        xp_remaining: pkg.xp_required || 0,
        expires_at: pkg.type === 'time_based' || pkg.type === 'bundle'
            ? '2026-04-06'
            : ''
    };
};
