export interface Package {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    price: number;
    price_renewal: number | null;
    type: 'xp_based' | 'credit_based' | 'time_based' | 'bundle';
    initial_credits: number | null;
    xp_required: number | null;
    features: string[];
    includes: string[];
    payment_url: string | null;
    whatsapp_url: string | null;
    qr_code_url: string | null;
    is_recommended: boolean;
    is_active: boolean;
    sort_order: number;
    created_at?: string;
    updated_at?: string;
}

export interface UserSubscription {
    id: string;
    user_id: string;
    package_id: string;
    status: 'pending' | 'active' | 'expired' | 'cancelled';
    credits_remaining: number | null;
    xp_remaining: number | null;
    expires_at: string | null;
    payment_reference: string | null;
    notes: string | null;
    created_at: string;
    activated_at: string | null;
    created_by: string | null;
    package?: Package;
    user?: {
        id: string;
        name: string;
        email: string;
    };
}

export type PackageType = Package['type'];
export type SubscriptionStatus = UserSubscription['status'];
