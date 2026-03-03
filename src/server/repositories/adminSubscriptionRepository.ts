import { supabase } from '@/lib/supabase';
import type { Package, UserSubscription } from '@/types/package';

export interface UpsertSubscriptionInput {
    user_id: string;
    package_id: string;
    status: UserSubscription['status'];
    credits_remaining: number | null;
    xp_remaining: number | null;
    expires_at: string | null;
    payment_reference: string | null;
    notes: string | null;
    activated_at: string | null;
}

interface SubscriptionRow {
    id: string;
    user_id: string;
    package_id: string;
    status: UserSubscription['status'];
    credits_remaining: number | null;
    xp_remaining: number | null;
    expires_at: string | null;
    payment_reference: string | null;
    notes: string | null;
    created_at: string;
    activated_at: string | null;
    created_by: string | null;
    package?: {
        id?: string;
        slug?: string;
        name?: string;
        description?: string | null;
        price?: number | null;
        price_renewal?: number | null;
        type?: Package['type'];
        initial_credits?: number | null;
        xp_required?: number | null;
        features?: unknown;
        includes?: unknown;
        payment_url?: string | null;
        whatsapp_url?: string | null;
        qr_code_url?: string | null;
        is_recommended?: boolean | null;
        is_active?: boolean | null;
        sort_order?: number | null;
        created_at?: string;
        updated_at?: string;
    } | null;
}

export interface AdminSubscriptionRepository {
    listSubscriptionsWithPackages: () => Promise<UserSubscription[]>;
    createSubscription: (input: UpsertSubscriptionInput) => Promise<void>;
    updateSubscription: (subscriptionId: string, input: UpsertSubscriptionInput) => Promise<void>;
    activateSubscription: (subscriptionId: string, activatedAtISO: string) => Promise<void>;
}

const normalizeStringArray = (value: unknown): string[] => {
    if (Array.isArray(value)) {
        return value.filter((item): item is string => typeof item === 'string');
    }

    return [];
};

const mapPackage = (row?: SubscriptionRow['package'] | null): Package | undefined => {
    if (!row || !row.id || !row.slug || !row.name || !row.type) {
        return undefined;
    }

    return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        description: row.description ?? null,
        price: Number(row.price) || 0,
        price_renewal: row.price_renewal !== null && row.price_renewal !== undefined ? Number(row.price_renewal) : null,
        type: row.type,
        initial_credits: row.initial_credits !== null && row.initial_credits !== undefined ? Number(row.initial_credits) : null,
        xp_required: row.xp_required !== null && row.xp_required !== undefined ? Number(row.xp_required) : null,
        features: normalizeStringArray(row.features),
        includes: normalizeStringArray(row.includes),
        payment_url: row.payment_url ?? null,
        whatsapp_url: row.whatsapp_url ?? null,
        qr_code_url: row.qr_code_url ?? null,
        is_recommended: Boolean(row.is_recommended),
        is_active: Boolean(row.is_active),
        sort_order: Number(row.sort_order) || 0,
        created_at: row.created_at,
        updated_at: row.updated_at
    };
};

const mapSubscription = (row: SubscriptionRow): UserSubscription => {
    return {
        id: row.id,
        user_id: row.user_id,
        package_id: row.package_id,
        status: row.status,
        credits_remaining: row.credits_remaining !== null ? Number(row.credits_remaining) : null,
        xp_remaining: row.xp_remaining !== null ? Number(row.xp_remaining) : null,
        expires_at: row.expires_at,
        payment_reference: row.payment_reference,
        notes: row.notes,
        created_at: row.created_at,
        activated_at: row.activated_at,
        created_by: row.created_by,
        package: mapPackage(row.package)
    };
};

const listSubscriptionsWithPackages = async (): Promise<UserSubscription[]> => {
    const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          package:packages(*)
        `)
        .order('created_at', { ascending: false });

    if (error || !data) {
        if (error) {
            console.error('admin subscriptions fetch failed:', error);
        }
        return [];
    }

    return (data as SubscriptionRow[]).map(mapSubscription);
};

const createSubscription = async (input: UpsertSubscriptionInput): Promise<void> => {
    const { error } = await supabase
        .from('user_subscriptions')
        .insert(input);

    if (error) {
        throw error;
    }
};

const updateSubscription = async (subscriptionId: string, input: UpsertSubscriptionInput): Promise<void> => {
    const { error } = await supabase
        .from('user_subscriptions')
        .update(input)
        .eq('id', subscriptionId);

    if (error) {
        throw error;
    }
};

const activateSubscription = async (subscriptionId: string, activatedAtISO: string): Promise<void> => {
    const { error } = await supabase
        .from('user_subscriptions')
        .update({
            status: 'active',
            activated_at: activatedAtISO
        })
        .eq('id', subscriptionId);

    if (error) {
        throw error;
    }
};

export const adminSubscriptionRepository: AdminSubscriptionRepository = {
    listSubscriptionsWithPackages,
    createSubscription,
    updateSubscription,
    activateSubscription
};
