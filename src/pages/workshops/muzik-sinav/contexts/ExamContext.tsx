/**
 * ExamContext — Provides exam state to all child components.
 */

import { createContext, useContext, type ReactNode } from 'react';
import { useExamStore } from '../hooks/useExamStore';
import type { ModuleScore, ExamResult, TestModule } from '../types';

interface ExamContextType {
    scores: Map<TestModule, ModuleScore>;
    result: ExamResult | null;
    moduleConfig: { module: TestModule; label: string; maxPoints: number }[];
    submitModuleScore: (module: TestModule, points: number, details?: string) => void;
    isModuleComplete: (module: TestModule) => boolean;
    getModuleScore: (module: TestModule) => ModuleScore | null;
    allModulesComplete: boolean;
    finishExam: (baraj?: number) => ExamResult;
    resetExam: () => void;
}

const ExamContext = createContext<ExamContextType | null>(null);

export function ExamProvider({ children }: { children: ReactNode }) {
    const store = useExamStore();
    return <ExamContext.Provider value={store}>{children}</ExamContext.Provider>;
}

export function useExam(): ExamContextType {
    const ctx = useContext(ExamContext);
    if (!ctx) throw new Error('useExam must be used within ExamProvider');
    return ctx;
}
