import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth/useAuth';
import GuardLoadingScreen from './GuardLoadingScreen';
import type { GuardChildrenProps } from './guardTypes';

export default function AuthGuard({ children }: GuardChildrenProps) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <GuardLoadingScreen />;
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}
