export type AccessDeniedReason = 'role' | 'talent' | 'xp' | null;

export interface AccessDecision {
    hasAccess: boolean;
    reason: AccessDeniedReason;
    normalizedTalents: string[];
}

export interface EvaluateAccessInput {
    requireAdmin?: boolean;
    requireTeacher?: boolean;
    requiredTalent?: string;
    skipXPCheck?: boolean;
    isAdmin?: boolean;
    role?: string | null;
    userXP: number;
    requiredXP: number;
    userTalent?: string | string[] | null;
}

export const normalizeTalents = (talents: string | string[] | null | undefined): string[] => {
    if (Array.isArray(talents)) {
        return talents.map((item) => item.trim()).filter(Boolean);
    }

    if (typeof talents === 'string') {
        return talents
            .split(/[,,;]/)
            .map((item) => item.trim())
            .filter(Boolean);
    }

    return [];
};

const normalizeTalentKey = (talent: string): string => talent
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export const evaluateAccess = (input: EvaluateAccessInput): AccessDecision => {
    const normalizedTalents = normalizeTalents(input.userTalent);
    const isTeacher = input.role === 'teacher';
    const isPrivileged = Boolean(input.isAdmin) || isTeacher;

    if (input.requireAdmin && !isPrivileged) {
        return { hasAccess: false, reason: 'role', normalizedTalents };
    }

    if (input.requireTeacher && !isPrivileged) {
        return { hasAccess: false, reason: 'role', normalizedTalents };
    }

    if (isPrivileged) {
        return { hasAccess: true, reason: null, normalizedTalents };
    }

    if (input.requiredTalent) {
        const requiredTalent = normalizeTalentKey(input.requiredTalent);
        const hasTalent = normalizedTalents.some((item) => normalizeTalentKey(item) === requiredTalent);
        if (!hasTalent) {
            return { hasAccess: false, reason: 'talent', normalizedTalents };
        }
    }

    if (input.skipXPCheck) {
        return { hasAccess: true, reason: null, normalizedTalents };
    }

    if (input.userXP < input.requiredXP) {
        return { hasAccess: false, reason: 'xp', normalizedTalents };
    }

    return { hasAccess: true, reason: null, normalizedTalents };
};
