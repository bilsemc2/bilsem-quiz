// Sınav Simülasyonu Context
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
    ExamSession,
    ExamResult,
    ExamMode,
    ExamModule,
    EXAM_MODES,
    DIFFICULTY_LEVELS
} from '../types/examTypes';
import { selectRandomModules } from '../config/examModules';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

interface ExamContextType {
    // State
    session: ExamSession | null;
    isExamActive: boolean;

    // Actions
    startExam: (mode: ExamMode) => void;
    submitResult: (passed: boolean, score: number, maxScore: number, duration: number) => Promise<void>;
    refreshSession: () => void;
    getCurrentModule: () => ExamModule | null;
    getNextLevel: () => number;
    getProgress: () => { current: number; total: number; percentage: number };
    finishExam: () => Promise<void>;
    abandonExam: () => void;

    // Helpers
    getDifficultyConfig: (level: number) => typeof DIFFICULTY_LEVELS[0];
}

const ExamContext = createContext<ExamContextType | undefined>(undefined);

export const ExamProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();

    // Lazy initialization: restore session from localStorage on mount
    const [session, setSession] = useState<ExamSession | null>(() => {
        const stored = localStorage.getItem('exam_session');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                // Validate session structure
                if (parsed && parsed.modules && parsed.currentIndex !== undefined) {
                    return parsed;
                }
            } catch {
                console.error('Failed to parse exam session');
            }
        }
        return null;
    });

    // LocalStorage'dan session'ı yeniden oku - navigate sonrası güncel veri için
    const refreshSession = useCallback(() => {
        const stored = localStorage.getItem('exam_session');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (parsed && parsed.modules && parsed.currentIndex !== undefined) {
                    setSession(parsed);
                }
            } catch {
                console.error('Failed to parse exam session');
            }
        } else {
            setSession(null);
        }
    }, []);

    // Sınav başlat
    const startExam = useCallback((mode: ExamMode) => {
        const modeConfig = EXAM_MODES.find(m => m.id === mode) || EXAM_MODES[1];
        const selectedModules = selectRandomModules(modeConfig.moduleCount);

        const newSession: ExamSession = {
            id: crypto.randomUUID(),
            userId: user?.id || 'anonymous',
            startedAt: new Date(),
            completedAt: null,
            modules: selectedModules,
            currentIndex: 0,
            currentLevel: 1, // Her zaman kolay seviyeden başla
            results: [],
            status: 'active',
            examMode: mode
        };

        setSession(newSession);

        // LocalStorage'a yedekle (sayfa yenileme durumu için)
        localStorage.setItem('exam_session', JSON.stringify(newSession));
    }, [user]);

    // Sonuç gönder - Promise döner, localStorage güncellenince resolve olur
    const submitResult = useCallback((passed: boolean, score: number, maxScore: number, duration: number): Promise<void> => {
        return new Promise((resolve) => {
            if (!session) {
                resolve();
                return;
            }

            const currentModule = session.modules[session.currentIndex];

            const result: ExamResult = {
                moduleId: currentModule.id,
                moduleTitle: currentModule.title,
                level: session.currentLevel,
                passed,
                score,
                maxScore,
                duration,
                category: currentModule.category
            };

            // Yeni seviye hesapla
            let newLevel = session.currentLevel;
            if (passed) {
                newLevel = Math.min(5, session.currentLevel + 1);
            } else {
                newLevel = Math.max(1, session.currentLevel - 1); // Başarısız olursa kademeli düşüş
            }

            const updatedSession: ExamSession = {
                ...session,
                results: [...session.results, result],
                currentIndex: session.currentIndex + 1,
                currentLevel: newLevel,
                status: session.currentIndex + 1 >= session.modules.length ? 'completed' : 'active',
                completedAt: session.currentIndex + 1 >= session.modules.length ? new Date() : null
            };

            // localStorage'a önce yaz, sonra state güncelle
            localStorage.setItem('exam_session', JSON.stringify(updatedSession));
            setSession(updatedSession);
            resolve();
        });
    }, [session]);

    // Mevcut modülü getir
    const getCurrentModule = useCallback((): ExamModule | null => {
        if (!session || session.currentIndex >= session.modules.length) return null;
        return session.modules[session.currentIndex];
    }, [session]);

    // Sonraki seviyeyi getir
    const getNextLevel = useCallback((): number => {
        return session?.currentLevel || 1;
    }, [session]);

    // İlerleme durumu
    const getProgress = useCallback(() => {
        if (!session) return { current: 0, total: 0, percentage: 0 };
        return {
            current: session.currentIndex + 1,
            total: session.modules.length,
            percentage: Math.round(((session.currentIndex) / session.modules.length) * 100)
        };
    }, [session]);

    // Sınavı bitir ve Supabase'e kaydet
    const finishExam = useCallback(async () => {
        if (!session || !user) return;

        const finalSession = {
            ...session,
            status: 'completed' as const,
            completedAt: new Date()
        };

        // Toplam skor hesapla
        const totalScore = session.results.reduce((sum, r) => sum + r.score, 0);
        const maxPossibleScore = session.results.reduce((sum, r) => sum + r.maxScore, 0);

        // Kategori bazlı performans
        const categoryScores: Record<string, { correct: number; total: number }> = {};
        session.results.forEach(r => {
            if (!categoryScores[r.category]) {
                categoryScores[r.category] = { correct: 0, total: 0 };
            }
            categoryScores[r.category].total++;
            if (r.passed) categoryScores[r.category].correct++;
        });

        // Yetenek tahmini (basit ortalama)
        const passRate = session.results.filter(r => r.passed).length / session.results.length;
        const abilityEstimate = (passRate * 6) - 3; // -3 ile +3 arası

        // BZP (BİLSEM Zeka Puanı) hesapla - zorluk çarpanlı
        const DIFFICULTY_MULTIPLIERS: Record<number, number> = { 1: 0.7, 2: 0.85, 3: 1.0, 4: 1.15, 5: 1.3 };
        const weightedScores = session.results.map(r => {
            const baseScore = r.maxScore > 0 ? r.score / r.maxScore : 0;
            return baseScore * (DIFFICULTY_MULTIPLIERS[r.level] || 1.0);
        });
        const avgWeighted = weightedScores.reduce((a, b) => a + b, 0) / weightedScores.length;
        const bzpScore = Math.round(Math.max(70, Math.min(145, 100 + (avgWeighted - 0.5) * 60)));

        try {
            await supabase.from('exam_sessions').insert({
                id: session.id,
                user_id: user.id,
                started_at: session.startedAt,
                completed_at: finalSession.completedAt,
                module_count: session.modules.length,
                results: session.results,
                final_score: Math.round((totalScore / maxPossibleScore) * 100),
                bzp_score: bzpScore,
                ability_estimate: abilityEstimate.toFixed(2)
            });
        } catch (error) {
            console.error('Sınav sonuçları kaydedilemedi:', error);
        }

        setSession(finalSession);
        localStorage.removeItem('exam_session');
    }, [session, user]);

    // Sınavı iptal et
    const abandonExam = useCallback(() => {
        setSession(null);
        localStorage.removeItem('exam_session');
    }, []);

    // Zorluk config getir
    const getDifficultyConfig = useCallback((level: number) => {
        return DIFFICULTY_LEVELS.find(d => d.level === level) || DIFFICULTY_LEVELS[2];
    }, []);

    return (
        <ExamContext.Provider value={{
            session,
            isExamActive: session?.status === 'active',
            startExam,
            submitResult,
            refreshSession,
            getCurrentModule,
            getNextLevel,
            getProgress,
            finishExam,
            abandonExam,
            getDifficultyConfig
        }}>
            {children}
        </ExamContext.Provider>
    );
};

export const useExam = () => {
    const context = useContext(ExamContext);
    if (!context) {
        throw new Error('useExam must be used within an ExamProvider');
    }
    return context;
};
