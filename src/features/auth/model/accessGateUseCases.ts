import { authRepository, type AuthRepository } from '@/server/repositories/authRepository';
import { xpRepository, type XPRepository } from '@/server/repositories/xpRepository';
import { evaluateAccess, type AccessDeniedReason } from './accessControlUseCase';

export interface AccessCheckInput {
    userId: string;
    pagePath: string;
    requireAdmin?: boolean;
    requireTeacher?: boolean;
    skipXPCheck?: boolean;
    requiredTalent?: string;
}

export interface AccessCheckResult {
    hasAccess: boolean;
    reason: AccessDeniedReason;
    userXP: number;
    requiredXP: number;
    userTalent: string | string[] | null;
}

export const checkUserAccessForPath = async (
    input: AccessCheckInput,
    deps: {
        auth: Pick<AuthRepository, 'getAccessProfileByUserId'>;
        xp: Pick<XPRepository, 'getXPRequirementForPath'>;
    } = { auth: authRepository, xp: xpRepository }
): Promise<AccessCheckResult> => {
    const profile = await deps.auth.getAccessProfileByUserId(input.userId);
    if (!profile) {
        return {
            hasAccess: false,
            reason: 'role',
            userXP: 0,
            requiredXP: 0,
            userTalent: null
        };
    }

    const requiredXP = input.skipXPCheck ? 0 : await deps.xp.getXPRequirementForPath(input.pagePath);
    const decision = evaluateAccess({
        requireAdmin: input.requireAdmin,
        requireTeacher: input.requireTeacher,
        requiredTalent: input.requiredTalent,
        skipXPCheck: input.skipXPCheck,
        isAdmin: profile.is_admin,
        role: profile.role,
        userTalent: profile.yetenek_alani,
        userXP: profile.experience,
        requiredXP
    });

    return {
        hasAccess: decision.hasAccess,
        reason: decision.reason,
        userXP: profile.experience,
        requiredXP,
        userTalent: profile.yetenek_alani
    };
};

export const deductXPForPageVisit = async (
    input: { pagePath: string; requiredXP: number },
    deps: {
        auth: Pick<AuthRepository, 'getAccessToken'>;
        xp: Pick<XPRepository, 'executeXPTransaction'>;
    } = { auth: authRepository, xp: xpRepository }
) => {
    if (input.requiredXP <= 0) {
        return { success: true as const, newXP: 0, change: 0 };
    }

    const accessToken = await deps.auth.getAccessToken();
    if (!accessToken) {
        return { success: false as const, status: 401, error: 'Oturum bulunamadı' };
    }

    return deps.xp.executeXPTransaction(
        {
            action: 'deduct',
            amount: input.requiredXP,
            reason: `Sayfa ziyareti: ${input.pagePath}`
        },
        accessToken
    );
};
