import React from 'react';
import { AuthContext } from './auth/authContext';
import { useAuthSessionController } from '@/hooks/useAuthSessionController';
import { useLastSeenHeartbeat } from '@/hooks/useLastSeenHeartbeat';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const controller = useAuthSessionController();
    useLastSeenHeartbeat(controller.user?.id);

    return (
        <AuthContext.Provider value={controller}>
            {children}
        </AuthContext.Provider>
    );
};
