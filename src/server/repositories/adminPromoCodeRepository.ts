import { supabase } from '@/lib/supabase';

interface PromoCodeRow {
    id: string;
    code: string;
    xp_reward: number | null;
    max_uses: number | null;
    current_uses: number | null;
    expires_at: string | null;
    created_at: string;
}

interface PromoCodeUsageProfileRow {
    name: string | null;
    email: string | null;
    avatar_url: string | null;
}

interface PromoCodeUsageRow {
    id: string;
    used_at: string;
    profiles: PromoCodeUsageProfileRow | PromoCodeUsageProfileRow[] | null;
}

export interface AdminPromoCodeRecord {
    id: string;
    code: string;
    xp_reward: number;
    max_uses: number;
    current_uses: number;
    expires_at: string | null;
    created_at: string;
}

export interface AdminPromoCodeUsageRecord {
    id: string;
    used_at: string;
    profile_name: string | null;
    profile_email: string | null;
    profile_avatar_url: string | null;
}

export interface UpsertPromoCodeInput {
    code: string;
    xp_reward: number;
    max_uses: number;
    expires_at: string | null;
}

export interface AdminPromoCodeRepository {
    listPromoCodes: () => Promise<AdminPromoCodeRecord[]>;
    getPromoCodeByCode: (code: string) => Promise<AdminPromoCodeRecord | null>;
    createPromoCode: (input: UpsertPromoCodeInput) => Promise<AdminPromoCodeRecord>;
    updatePromoCode: (promoCodeId: string, input: UpsertPromoCodeInput) => Promise<AdminPromoCodeRecord>;
    deletePromoCode: (promoCodeId: string) => Promise<void>;
    listPromoCodeUsages: (promoCodeId: string) => Promise<AdminPromoCodeUsageRecord[]>;
}

const toSafeInt = (value: number | null): number => {
    return Number(value) || 0;
};

const mapPromoCodeRow = (row: PromoCodeRow): AdminPromoCodeRecord => {
    return {
        id: row.id,
        code: row.code,
        xp_reward: toSafeInt(row.xp_reward),
        max_uses: toSafeInt(row.max_uses),
        current_uses: toSafeInt(row.current_uses),
        expires_at: row.expires_at,
        created_at: row.created_at
    };
};

const normalizeUsageProfile = (
    value: PromoCodeUsageProfileRow | PromoCodeUsageProfileRow[] | null
): PromoCodeUsageProfileRow | null => {
    if (!value) {
        return null;
    }

    if (Array.isArray(value)) {
        return value[0] ?? null;
    }

    return value;
};

const mapPromoCodeUsageRow = (row: PromoCodeUsageRow): AdminPromoCodeUsageRecord => {
    const profile = normalizeUsageProfile(row.profiles);

    return {
        id: row.id,
        used_at: row.used_at,
        profile_name: profile?.name ?? null,
        profile_email: profile?.email ?? null,
        profile_avatar_url: profile?.avatar_url ?? null
    };
};

const listPromoCodes = async (): Promise<AdminPromoCodeRecord[]> => {
    const { data, error } = await supabase
        .from('promo_codes')
        .select('id, code, xp_reward, max_uses, current_uses, expires_at, created_at')
        .order('created_at', { ascending: false });

    if (error || !data) {
        if (error) {
            throw error;
        }
        return [];
    }

    return (data as PromoCodeRow[]).map(mapPromoCodeRow);
};

const getPromoCodeByCode = async (code: string): Promise<AdminPromoCodeRecord | null> => {
    const { data, error } = await supabase
        .from('promo_codes')
        .select('id, code, xp_reward, max_uses, current_uses, expires_at, created_at')
        .eq('code', code)
        .maybeSingle();

    if (error) {
        throw error;
    }

    if (!data) {
        return null;
    }

    return mapPromoCodeRow(data as PromoCodeRow);
};

const createPromoCode = async (input: UpsertPromoCodeInput): Promise<AdminPromoCodeRecord> => {
    const { data, error } = await supabase
        .from('promo_codes')
        .insert([input])
        .select('id, code, xp_reward, max_uses, current_uses, expires_at, created_at')
        .single();

    if (error || !data) {
        throw error ?? new Error('Promo code could not be created');
    }

    return mapPromoCodeRow(data as PromoCodeRow);
};

const updatePromoCode = async (
    promoCodeId: string,
    input: UpsertPromoCodeInput
): Promise<AdminPromoCodeRecord> => {
    const { data, error } = await supabase
        .from('promo_codes')
        .update(input)
        .eq('id', promoCodeId)
        .select('id, code, xp_reward, max_uses, current_uses, expires_at, created_at')
        .single();

    if (error || !data) {
        throw error ?? new Error('Promo code could not be updated');
    }

    return mapPromoCodeRow(data as PromoCodeRow);
};

const deletePromoCode = async (promoCodeId: string): Promise<void> => {
    const { error } = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', promoCodeId);

    if (error) {
        throw error;
    }
};

const listPromoCodeUsages = async (promoCodeId: string): Promise<AdminPromoCodeUsageRecord[]> => {
    const { data, error } = await supabase
        .from('promo_code_usage')
        .select(`
            id,
            used_at,
            profiles (
                name,
                email,
                avatar_url
            )
        `)
        .eq('promo_code_id', promoCodeId)
        .order('used_at', { ascending: false });

    if (error || !data) {
        if (error) {
            throw error;
        }
        return [];
    }

    return (data as PromoCodeUsageRow[]).map(mapPromoCodeUsageRow);
};

export const adminPromoCodeRepository: AdminPromoCodeRepository = {
    listPromoCodes,
    getPromoCodeByCode,
    createPromoCode,
    updatePromoCode,
    deletePromoCode,
    listPromoCodeUsages
};
