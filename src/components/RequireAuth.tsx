import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface RequireAuthProps {
    children: React.ReactNode;
}

export default function RequireAuth({ children }: RequireAuthProps) {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}
