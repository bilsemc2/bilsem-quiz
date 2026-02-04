// Adaptif Sınav Simülasyonu Types

export type ExamCategory = 'memory' | 'logic' | 'attention' | 'verbal' | 'speed' | 'perception' | 'social';

export interface ExamModule {
    id: string;
    title: string;
    link: string;
    tuzo: string;
    category: ExamCategory;
    timeLimit: number; // saniye
    active: boolean;
}

export interface ExamResult {
    moduleId: string;
    moduleTitle: string;
    level: number;
    passed: boolean;
    score: number;
    maxScore: number;
    duration: number; // saniye
    category: ExamCategory;
}

export interface ExamSession {
    id: string;
    userId: string;
    startedAt: Date;
    completedAt: Date | null;
    modules: ExamModule[];         // Rastgele sıralanmış modüller
    currentIndex: number;          // Hangi modülde (0-based)
    currentLevel: number;          // 1-5 arası dinamik seviye
    results: ExamResult[];         // Her modülün sonucu
    status: 'active' | 'completed' | 'abandoned';
    examMode: ExamMode;
}

export type ExamMode = 'quick' | 'standard' | 'comprehensive' | 'full';

export interface ExamModeConfig {
    id: ExamMode;
    title: string;
    moduleCount: number;
    estimatedMinutes: number;
    icon: string;
}

export const EXAM_MODES: ExamModeConfig[] = [
    { id: 'quick', title: 'Hızlı Test', moduleCount: 5, estimatedMinutes: 10, icon: 'Zap' },
    { id: 'standard', title: 'Standart', moduleCount: 10, estimatedMinutes: 20, icon: 'Scale' },
    { id: 'comprehensive', title: 'Kapsamlı', moduleCount: 15, estimatedMinutes: 30, icon: 'Target' },
    { id: 'full', title: 'Tam Sınav', moduleCount: 20, estimatedMinutes: 45, icon: 'Trophy' },
];

// Zorluk seviyeleri
export interface DifficultyConfig {
    level: number;
    name: string;
    timeMultiplier: number;    // 1.0 = normal, 0.8 = daha az süre
    itemCountMultiplier: number; // 1.0 = normal, 1.2 = daha fazla öğe
}

export const DIFFICULTY_LEVELS: DifficultyConfig[] = [
    { level: 1, name: 'Kolay', timeMultiplier: 1.3, itemCountMultiplier: 0.7 },
    { level: 2, name: 'Orta-Kolay', timeMultiplier: 1.15, itemCountMultiplier: 0.85 },
    { level: 3, name: 'Orta', timeMultiplier: 1.0, itemCountMultiplier: 1.0 },
    { level: 4, name: 'Zor', timeMultiplier: 0.85, itemCountMultiplier: 1.15 },
    { level: 5, name: 'Uzman', timeMultiplier: 0.7, itemCountMultiplier: 1.3 },
];
