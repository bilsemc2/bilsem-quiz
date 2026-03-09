import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth/useAuth';
import { checkUserAccessForPath, deductXPForPageVisit } from '@/features/auth/model/accessGateUseCases';
import { showXPDeduct } from '@/components/xpToastService';
import { RouteAccessGateContext } from './RouteAccessGateContext';
import { shouldSkipXPCheck } from './routeGuardModel';
import type { GuardChildrenProps, GuardOptions } from './guardTypes';

interface RouteAccessGateProviderProps extends GuardChildrenProps, GuardOptions {}

export default function RouteAccessGateProvider({
    children,
    requireAdmin = false,
    requireTeacher = false,
    skipXPCheck = false,
    requiredTalent
}: RouteAccessGateProviderProps) {
    const { user, loading: authLoading } = useAuth();
    const location = useLocation();
    const isArcadeMode = Boolean((location.state as { arcadeMode?: boolean } | null)?.arcadeMode);
    const effectiveSkipXPCheck = shouldSkipXPCheck({ skipXPCheck }, isArcadeMode);
    const [loading, setLoading] = useState(true);
    const [userXP, setUserXP] = useState(0);
    const [requiredXP, setRequiredXP] = useState(0);
    const [hasAccess, setHasAccess] = useState(false);
    const [accessDeniedReason, setAccessDeniedReason] = useState<'role' | 'talent' | 'xp' | null>('role');
    const [userTalent, setUserTalent] = useState<string | string[] | null>(null);
    const xpDeductionAttemptedRef = useRef(false);

    useEffect(() => {
        xpDeductionAttemptedRef.current = false;
    }, [location.pathname, requireAdmin, requireTeacher, effectiveSkipXPCheck, requiredTalent]);

    useEffect(() => {
        let isActive = true;

        const checkAccess = async () => {
            if (authLoading) {
                return;
            }

            if (!user) {
                if (isActive) {
                    setLoading(false);
                    setHasAccess(false);
                    setAccessDeniedReason('role');
                }
                return;
            }

            setLoading(true);

            try {
                const accessResult = await checkUserAccessForPath({
                    userId: user.id,
                    pagePath: location.pathname,
                    requireAdmin,
                    requireTeacher,
                    requiredTalent,
                    skipXPCheck: effectiveSkipXPCheck
                });

                if (!isActive) {
                    return;
                }

                setUserXP(accessResult.userXP);
                setRequiredXP(accessResult.requiredXP);
                setHasAccess(accessResult.hasAccess);
                setAccessDeniedReason(accessResult.reason);
                setUserTalent(accessResult.reason === 'talent' ? accessResult.userTalent : null);
            } catch (error) {
                console.error('Erişim kontrolü sırasında hata:', error);

                if (isActive) {
                    setHasAccess(false);
                    setAccessDeniedReason('role');
                    setUserTalent(null);
                }
            } finally {
                if (isActive) {
                    setLoading(false);
                }
            }
        };

        void checkAccess();

        return () => {
            isActive = false;
        };
    }, [
        authLoading,
        user,
        location.pathname,
        requireAdmin,
        requireTeacher,
        requiredTalent,
        effectiveSkipXPCheck
    ]);

    const applyXPDeductionIfNeeded = async () => {
        if (!hasAccess || requiredXP <= 0 || xpDeductionAttemptedRef.current) {
            return;
        }

        xpDeductionAttemptedRef.current = true;

        try {
            const result = await deductXPForPageVisit({
                pagePath: location.pathname,
                requiredXP
            });

            if (result.success && typeof result.change === 'number' && result.change !== 0 && typeof result.newXP === 'number') {
                showXPDeduct(requiredXP, 'Oyun erişimi');
                setUserXP(result.newXP);
            }
        } catch {
            // Edge Function erişim hatası — sessizce devam et
        }
    };

    return (
        <RouteAccessGateContext.Provider
            value={{
                loading,
                hasAccess,
                accessDeniedReason,
                userXP,
                requiredXP,
                userTalent,
                requireAdmin,
                requireTeacher,
                requiredTalent,
                applyXPDeductionIfNeeded
            }}
        >
            {children}
        </RouteAccessGateContext.Provider>
    );
}
