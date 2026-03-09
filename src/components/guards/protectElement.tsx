import type { ReactNode } from 'react';
import AuthGuard from './AuthGuard';
import RoleGuard from './RoleGuard';
import RouteAccessGateProvider from './RouteAccessGateProvider';
import XPGate from './XPGate';
import type { GuardOptions } from './guardTypes';

export const protectElement = (children: ReactNode, options: GuardOptions = {}) => (
    <AuthGuard>
        <RouteAccessGateProvider {...options}>
            <RoleGuard>
                <XPGate>{children}</XPGate>
            </RoleGuard>
        </RouteAccessGateProvider>
    </AuthGuard>
);
