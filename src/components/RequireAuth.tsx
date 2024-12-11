import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function RequireAuth({ children }: { children: JSX.Element }) {
    const { user } = useAuth();
    const location = useLocation();

    if (!user) {
        // Giriş sayfasına yönlendir ve mevcut sayfayı state'e kaydet
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    return children;
}
