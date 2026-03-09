import { useEffect } from 'react';
import XPWarning from '@/components/XPWarning';
import GuardLoadingScreen from './GuardLoadingScreen';
import { useRouteAccessGate } from './RouteAccessGateContext';
import type { GuardChildrenProps } from './guardTypes';

export default function XPGate({ children }: GuardChildrenProps) {
    const {
        loading,
        accessDeniedReason,
        userXP,
        requiredXP,
        applyXPDeductionIfNeeded
    } = useRouteAccessGate();

    useEffect(() => {
        if (loading || accessDeniedReason !== null) {
            return;
        }

        void applyXPDeductionIfNeeded();
    }, [loading, accessDeniedReason, applyXPDeductionIfNeeded]);

    if (loading) {
        return <GuardLoadingScreen />;
    }

    if (accessDeniedReason === 'xp') {
        return (
            <XPWarning
                requiredXP={requiredXP}
                currentXP={userXP}
                title="Bu Sayfaya Erişmek için XP Yetersiz"
            />
        );
    }

    if (accessDeniedReason === 'role' || accessDeniedReason === 'talent') {
        return null;
    }

    return <>{children}</>;
}
