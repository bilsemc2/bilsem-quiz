import { useMemo } from 'react';
import { useAuth } from '@/contexts/auth/useAuth';
import { checkTalentAccess } from '@/features/auth/model/talentAccessUseCases';

export const useTalentAccess = (requiredTalent: string) => {
    const { user, profile, loading } = useAuth();

    return useMemo(() => {
        if (loading) {
            return {
                loading: true,
                hasAccess: false,
                userTalents: [] as string[]
            };
        }

        if (!user) {
            return {
                loading: false,
                hasAccess: false,
                userTalents: [] as string[]
            };
        }

        const result = checkTalentAccess(profile, requiredTalent);
        return {
            loading: false,
            hasAccess: result.hasAccess,
            userTalents: result.userTalents
        };
    }, [loading, user, profile, requiredTalent]);
};
