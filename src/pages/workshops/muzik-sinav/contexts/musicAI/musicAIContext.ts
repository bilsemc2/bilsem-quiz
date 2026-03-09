import { createContext } from 'react';
import { PianoEngine } from '../../engines/PianoEngine';
import type {
    AIAnalysisResponse,
    AIContentResponse,
    AIReportResponse,
    TestModule
} from '../../types';

export interface MusicAIContextValue {
    piano: PianoEngine | null;
    isPianoReady: boolean;
    isPianoLoading: boolean;
    initPiano: () => Promise<void>;
    requestContent: (module: TestModule, questionIndex: number, totalQuestions: number) => Promise<AIContentResponse>;
    isGenerating: boolean;
    requestAnalysis: (
        module: TestModule,
        target: unknown,
        detected: unknown,
        questionIndex: number,
        audioBase64?: string,
        audioMimeType?: string
    ) => Promise<AIAnalysisResponse>;
    isAnalyzing: boolean;
    requestReport: (moduleScores: { module: TestModule; earnedPoints: number; maxPoints: number; details: string }[]) => Promise<AIReportResponse>;
    difficulty: number;
    adjustDifficulty: (correct: boolean) => void;
    error: string | null;
}

export const MusicAIContext = createContext<MusicAIContextValue | null>(null);
