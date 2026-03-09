import { createContext } from 'react';
import type { ExamMode, ExamModule, DifficultyConfig, ExamSession } from '@/types/examTypes';

export interface ExamContextType {
    session: ExamSession | null;
    isExamActive: boolean;
    startExam: (mode: ExamMode) => void;
    submitResult: (passed: boolean, score: number, maxScore: number, duration: number) => Promise<void>;
    refreshSession: () => void;
    getCurrentModule: () => ExamModule | null;
    getNextLevel: () => number;
    getProgress: () => { current: number; total: number; percentage: number };
    finishExam: () => Promise<void>;
    abandonExam: () => void;
    getDifficultyConfig: (level: number) => DifficultyConfig;
}

export const ExamContext = createContext<ExamContextType | undefined>(undefined);
