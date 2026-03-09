import React, { ReactNode } from 'react';
import { useAuth } from '@/contexts/auth/useAuth';
import { useExamSessionController } from '@/hooks/useExamSessionController';
import { ExamContext } from './exam/examContext';

export const ExamProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const controller = useExamSessionController(user?.id);

    return (
        <ExamContext.Provider value={controller}>
            {children}
        </ExamContext.Provider>
    );
};
