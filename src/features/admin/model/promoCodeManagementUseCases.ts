import type {
    AdminPromoCodeRecord,
    AdminPromoCodeUsageRecord,
    UpsertPromoCodeInput
} from '@/server/repositories/adminPromoCodeRepository';

export interface PromoCodeFormData {
    code: string;
    xp_reward: number;
    max_uses: number;
    expires_at: string;
}

export const createDefaultPromoCodeFormData = (): PromoCodeFormData => ({
    code: '',
    xp_reward: 50,
    max_uses: 100,
    expires_at: ''
});

export const normalizePromoCodeText = (value: string): string => {
    return value.trim().toUpperCase();
};

const clampToPositiveInt = (value: number, fallback: number): number => {
    const safe = Number.isFinite(value) ? Math.round(value) : fallback;
    return safe > 0 ? safe : fallback;
};

export const toPromoCodeMutationInput = (input: PromoCodeFormData): UpsertPromoCodeInput => {
    return {
        code: normalizePromoCodeText(input.code),
        xp_reward: clampToPositiveInt(Number(input.xp_reward), 1),
        max_uses: clampToPositiveInt(Number(input.max_uses), 1),
        expires_at: input.expires_at.trim() || null
    };
};

export const toPromoCodeEditFormData = (promoCode: AdminPromoCodeRecord): PromoCodeFormData => {
    return {
        code: promoCode.code,
        xp_reward: promoCode.xp_reward,
        max_uses: promoCode.max_uses,
        expires_at: promoCode.expires_at ? new Date(promoCode.expires_at).toISOString().split('T')[0] : ''
    };
};

export const isPromoCodeExpired = (
    promoCode: Pick<AdminPromoCodeRecord, 'expires_at'>,
    now: Date = new Date()
): boolean => {
    if (!promoCode.expires_at) {
        return false;
    }

    const expiresTime = new Date(promoCode.expires_at).getTime();
    if (!Number.isFinite(expiresTime)) {
        return false;
    }

    return expiresTime < now.getTime();
};

export const isPromoCodeUsageFull = (
    promoCode: Pick<AdminPromoCodeRecord, 'current_uses' | 'max_uses'>
): boolean => {
    return promoCode.current_uses >= promoCode.max_uses;
};

export const toPromoCodeUsageAvatarUrl = (usage: AdminPromoCodeUsageRecord): string => {
    if (usage.profile_avatar_url && usage.profile_avatar_url.trim()) {
        return usage.profile_avatar_url;
    }

    const seed = usage.profile_email?.trim() || 'bilsem-user';
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
};
