/**
 * ExamContext — Provides exam state to all child components.
 */

import type { ReactNode } from 'react';
import { useExamStore } from '../hooks/useExamStore';
import { MusicExamContext } from './exam/examContext';

export function ExamProvider({ children }: { children: ReactNode }) {
    const store = useExamStore();
    return <MusicExamContext.Provider value={store}>{children}</MusicExamContext.Provider>;
}
