import { createContext } from 'react';
import type { ModuleScore, ExamResult, TestModule } from '../../types';

export interface MusicExamContextValue {
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

export const MusicExamContext = createContext<MusicExamContextValue | null>(null);
