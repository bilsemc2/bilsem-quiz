import type { XPRequirement as XPRequirementEntity } from '@/types/xpRequirements';

export const isAdminProfile = (profile: { is_admin?: boolean } | null): boolean => {
    return Boolean(profile?.is_admin);
};

export const normalizeXPRequirements = (
    requirements: XPRequirementEntity[]
): XPRequirementEntity[] => {
    return requirements.filter((requirement) => Boolean(requirement && requirement.page_path));
};
