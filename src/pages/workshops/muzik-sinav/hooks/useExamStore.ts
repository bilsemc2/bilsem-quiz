/**
 * useExamStore — Central state management for the BİLSEM music exam.
 * Tracks progress across all modules and computes final results.
 */

import { useCallback, useState } from 'react';
import type { ModuleScore, ExamResult, TestModule } from '../types';
import { buildExamResult } from '../utils/scoring';

const MODULE_CONFIG: { module: TestModule; label: string; maxPoints: number }[] = [
    { module: 'tek-ses', label: 'Tek Ses Tekrarı', maxPoints: 10 },
    { module: 'cift-ses', label: 'Çift Ses Tekrarı', maxPoints: 6 },
    { module: 'ezgi', label: 'Ezgi Tekrarı', maxPoints: 20 },
    { module: 'ritim', label: 'Ritim Tekrarı', maxPoints: 24 },
    { module: 'sarki', label: 'Şarkı Söyleme', maxPoints: 25 },
    { module: 'uretkenlik', label: 'Müzikal Üretkenlik', maxPoints: 15 },
];

export function useExamStore() {
    const [scores, setScores] = useState<Map<TestModule, ModuleScore>>(new Map());
    const [result, setResult] = useState<ExamResult | null>(null);

    const submitModuleScore = useCallback(
        (module: TestModule, earnedPoints: number, details: string = '') => {
            const config = MODULE_CONFIG.find((c) => c.module === module);
            if (!config) return;

            const clamped = Math.max(0, Math.min(config.maxPoints, earnedPoints));
            const score: ModuleScore = {
                module,
                label: config.label,
                maxPoints: config.maxPoints,
                earnedPoints: clamped,
                details,
            };

            setScores((prev) => {
                const next = new Map(prev);
                next.set(module, score);
                return next;
            });
        },
        []
    );

    const isModuleComplete = useCallback(
        (module: TestModule) => scores.has(module),
        [scores]
    );

    const getModuleScore = useCallback(
        (module: TestModule) => scores.get(module) ?? null,
        [scores]
    );

    const allModulesComplete = scores.size === MODULE_CONFIG.length;

    const finishExam = useCallback(
        (baraj: number = 80) => {
            const modules = MODULE_CONFIG.map((config) => {
                const existing = scores.get(config.module);
                return (
                    existing ?? {
                        module: config.module,
                        label: config.label,
                        maxPoints: config.maxPoints,
                        earnedPoints: 0,
                        details: 'Tamamlanmadı',
                    }
                );
            });
            const examResult = buildExamResult(modules, baraj);
            setResult(examResult);
            return examResult;
        },
        [scores]
    );

    const resetExam = useCallback(() => {
        setScores(new Map());
        setResult(null);
    }, []);

    return {
        scores,
        result,
        moduleConfig: MODULE_CONFIG,
        submitModuleScore,
        isModuleComplete,
        getModuleScore,
        allModulesComplete,
        finishExam,
        resetExam,
    };
}
