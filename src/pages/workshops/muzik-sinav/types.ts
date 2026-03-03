// TypeScript interfaces for the BİLSEM Müzik Sınavı modules

export type TestModule =
    | 'tek-ses'
    | 'cift-ses'
    | 'ezgi'
    | 'ritim'
    | 'sarki'
    | 'uretkenlik';

export interface ModuleScore {
    module: TestModule;
    label: string;
    maxPoints: number;
    earnedPoints: number;
    details: string;
}

export interface JuryScore {
    juryId: number;
    juryName: string;
    score: number;
    isDropped: boolean;
}

export interface ExamResult {
    moduleScores: ModuleScore[];
    juryScores: JuryScore[];
    totalScore: number;
    finalScore: number; // After jury formula
    barajPassed: boolean;
    barajScore: number;
}

export interface NoteInfo {
    name: string;
    octave: number;
    frequency: number;
}

export interface RhythmPattern {
    name: string;
    beats: number[];     // timestamps in ms relative to start
    tempo: number;        // BPM
}

export interface MelodySequence {
    name: string;
    notes: string[];
    durations: number[];  // note durations in seconds
}

export interface PitchResult {
    frequency: number;
    noteName: string;
    confidence: number;
    cents: number;        // pitch deviation in cents
}

export interface TestState {
    phase: 'intro' | 'playing' | 'recording' | 'analyzing' | 'result';
    currentQuestion: number;
    totalQuestions: number;
    score: number;
    maxScore: number;
}

export interface SidebarItem {
    path: string;
    label: string;
    icon: string;
    module: TestModule;
    maxPoints: number;
    completed: boolean;
    score: number | null;
}

// ── AI Response Types ──

export interface AIContentResponse {
    /** Tek Ses / Çift Ses */
    notes?: string[];
    /** Ezgi */
    melody?: { notes: string[]; durations: number[]; name: string };
    /** Ritim */
    rhythm?: { beats: number[]; tempo: number; name: string; timeSignature: string };
    /** Şarkı */
    song?: { name: string; lyrics: string; melody: string[]; durations: number[] };
    /** Üretkenlik */
    creativity?: { theme: string; constraints: string[]; inspiration: string; hints: string[] };
    /** Genel */
    hint?: string;
    difficulty: number;
}

export interface AIAnalysisResponse {
    score: number;
    maxScore: number;
    accuracy: number;
    feedback: {
        strengths: string[];
        improvements: string[];
        tips: string[];
    };
    encouragement: string;
    detailedAnalysis: string;
}

export interface AIReportResponse {
    overallScore: number;
    moduleBreakdown: {
        module: TestModule;
        score: number;
        maxScore: number;
        grade: string;
        comment: string;
    }[];
    strengths: string[];
    improvements: string[];
    recommendations: string[];
    detailedAnalysis: string;
    level: string;
    encouragement: string;
}
