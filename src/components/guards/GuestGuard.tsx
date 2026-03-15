import { Navigate, useLocation } from 'react-router-dom';
import { resolvePostLoginPath } from '@/features/auth/model/loginRedirect';
import { useAuth } from '@/contexts/auth/useAuth';
import GuardLoadingScreen from './GuardLoadingScreen';
import type { GuardChildrenProps } from './guardTypes';

export default function GuestGuard({ children }: GuardChildrenProps) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <GuardLoadingScreen />;
    }

    if (user) {
        return <Navigate to={resolvePostLoginPath(location.state)} replace />;
    }

    return <>{children}</>;
}
