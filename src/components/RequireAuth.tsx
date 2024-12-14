import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface RequireAuthProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
}

export default function RequireAuth({ children, requireAdmin = false }: RequireAuthProps) {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/" replace />;
    }

    // Admin kontrolü
    if (requireAdmin && user.email !== 'yaprakyesili@msn.com') {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}
