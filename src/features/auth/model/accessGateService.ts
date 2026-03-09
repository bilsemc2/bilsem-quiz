import { evaluateAccess, type AccessDeniedReason } from './accessControlUseCase.ts';

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

export interface AccessCheckDeps {
    auth: {
        getAccessProfileByUserId: (userId: string) => Promise<{
            is_admin?: boolean;
            role?: string | null;
            yetenek_alani?: string | string[] | null;
            experience: number;
        } | null>;
    };
    xp: {
        getXPRequirementForPath: (pagePath: string) => Promise<number>;
    };
}

export interface XPDeductionDeps {
    auth: {
        getAccessToken: () => Promise<string | null>;
    };
    xp: {
        executeXPTransaction: (
            payload: {
                action: 'deduct';
                amount: number;
                reason: string;
            },
            accessToken: string
        ) => Promise<{
            success: boolean;
            status?: number;
            error?: string;
            newXP?: number;
            change?: number;
        }>;
    };
}

export const checkUserAccess = async (
    input: AccessCheckInput,
    deps: AccessCheckDeps
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
        userTalent: profile.yetenek_alani ?? null
    };
};

export const deductPageVisitXP = async (
    input: { pagePath: string; requiredXP: number },
    deps: XPDeductionDeps
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
