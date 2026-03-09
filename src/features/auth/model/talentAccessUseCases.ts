import { evaluateAccess, normalizeTalents } from './accessControlUseCase.ts';

export interface TalentAccessProfile {
    is_admin?: boolean;
    role?: string | null;
    yetenek_alani?: string | string[] | null;
}

export interface TalentAccessResult {
    hasAccess: boolean;
    userTalents: string[];
}

export const checkTalentAccess = (
    profile: TalentAccessProfile | null,
    requiredTalent: string
): TalentAccessResult => {
    const userTalents = normalizeTalents(profile?.yetenek_alani);

    if (!profile) {
        return {
            hasAccess: false,
            userTalents
        };
    }

    const decision = evaluateAccess({
        requiredTalent,
        skipXPCheck: true,
        isAdmin: profile.is_admin,
        role: profile.role,
        userTalent: profile.yetenek_alani,
        userXP: 0,
        requiredXP: 0
    });

    return {
        hasAccess: decision.hasAccess,
        userTalents
    };
};
