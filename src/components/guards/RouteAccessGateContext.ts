import { createContext, useContext } from 'react';
import type { AccessDeniedReason } from '@/features/auth/model/accessControlUseCase';

interface RouteAccessGateContextValue {
    loading: boolean;
    hasAccess: boolean;
    accessDeniedReason: AccessDeniedReason;
    userXP: number;
    requiredXP: number;
    userTalent: string | string[] | null;
    requireAdmin: boolean;
    requireTeacher: boolean;
    requiredTalent?: string;
    applyXPDeductionIfNeeded: () => Promise<void>;
}

export const RouteAccessGateContext = createContext<RouteAccessGateContextValue | null>(null);

export const useRouteAccessGate = () => {
    const context = useContext(RouteAccessGateContext);

    if (!context) {
        throw new Error('useRouteAccessGate must be used within RouteAccessGateProvider');
    }

    return context;
};
