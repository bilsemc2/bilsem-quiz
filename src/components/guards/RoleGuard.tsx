import GuardAccessDeniedState from './GuardAccessDeniedState';
import GuardLoadingScreen from './GuardLoadingScreen';
import { useRouteAccessGate } from './RouteAccessGateContext';
import type { GuardChildrenProps } from './guardTypes';

export default function RoleGuard({ children }: GuardChildrenProps) {
    const {
        loading,
        accessDeniedReason,
        userTalent,
        requireAdmin,
        requireTeacher,
        requiredTalent
    } = useRouteAccessGate();

    if (loading) {
        return <GuardLoadingScreen />;
    }

    if (accessDeniedReason === 'role' || accessDeniedReason === 'talent') {
        return (
            <GuardAccessDeniedState
                reason={accessDeniedReason}
                requireAdmin={requireAdmin}
                requireTeacher={requireTeacher}
                requiredTalent={requiredTalent}
                userTalent={userTalent}
            />
        );
    }

    return <>{children}</>;
}
