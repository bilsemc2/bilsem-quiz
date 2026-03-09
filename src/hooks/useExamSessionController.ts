import { useCallback, useRef, useState } from 'react';
import { EXAM_MODES, type ExamMode, type ExamSession } from '@/types/examTypes';
import { selectRandomModules } from '@/config/examModules';
import { persistCompletedExamSession } from '@/features/exam/model/examSessionUseCases';
import {
    buildCompletedExamPersistenceInput,
    clearExamSessionFromStorage,
    createExamSession,
    EXAM_SESSION_STORAGE_KEY,
    getCurrentExamModule,
    getDifficultyConfigForLevel,
    getExamProgress,
    getNextExamLevel,
    markExamSessionCompleted,
    readExamSessionFromStorage,
    submitExamModuleResult,
    writeExamSessionToStorage
} from '@/features/exam/model/examSessionModel';

const canUseLocalStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const readStoredExamSession = (): ExamSession | null => {
    if (!canUseLocalStorage()) {
        return null;
    }

    return readExamSessionFromStorage(window.localStorage, EXAM_SESSION_STORAGE_KEY);
};

const persistExamSession = (session: ExamSession | null) => {
    if (!canUseLocalStorage()) {
        return;
    }

    if (session) {
        writeExamSessionToStorage(window.localStorage, session, EXAM_SESSION_STORAGE_KEY);
        return;
    }

    clearExamSessionFromStorage(window.localStorage, EXAM_SESSION_STORAGE_KEY);
};

export const useExamSessionController = (userId?: string) => {
    const [session, setSession] = useState<ExamSession | null>(() => readStoredExamSession());
    const persistedCompletedSessionsRef = useRef<Set<string>>(new Set());

    const refreshSession = useCallback(() => {
        setSession(readStoredExamSession());
    }, []);

    const startExam = useCallback((mode: ExamMode) => {
        const modeConfig = EXAM_MODES.find((item) => item.id === mode) ?? EXAM_MODES[1];
        const nextSession = createExamSession({
            id: crypto.randomUUID(),
            userId: userId ?? 'anonymous',
            mode,
            modules: selectRandomModules(modeConfig.moduleCount)
        });

        persistedCompletedSessionsRef.current.delete(nextSession.id);
        setSession(nextSession);
        persistExamSession(nextSession);
    }, [userId]);

    const submitResult = useCallback(async (passed: boolean, score: number, maxScore: number, duration: number) => {
        if (!session) {
            return;
        }

        const updatedSession = submitExamModuleResult(session, {
            passed,
            score,
            maxScore,
            duration
        });

        setSession(updatedSession);
        persistExamSession(updatedSession);
    }, [session]);

    const finishExam = useCallback(async () => {
        if (!session || !userId) {
            return;
        }

        const completedSession = markExamSessionCompleted(session);
        if (persistedCompletedSessionsRef.current.has(completedSession.id)) {
            return;
        }

        const result = await persistCompletedExamSession(
            buildCompletedExamPersistenceInput(completedSession, userId)
        );

        if (!result.ok) {
            console.error('Sınav sonuçları kaydedilemedi:', result.error.cause ?? result.error.message);
            setSession(completedSession);
            persistExamSession(completedSession);
            return;
        }

        persistedCompletedSessionsRef.current.add(completedSession.id);
        setSession(completedSession);
        persistExamSession(null);
    }, [session, userId]);

    const abandonExam = useCallback(() => {
        if (session) {
            persistedCompletedSessionsRef.current.delete(session.id);
        }

        setSession(null);
        persistExamSession(null);
    }, [session]);

    return {
        session,
        isExamActive: session?.status === 'active',
        startExam,
        submitResult,
        refreshSession,
        getCurrentModule: () => getCurrentExamModule(session),
        getNextLevel: () => getNextExamLevel(session),
        getProgress: () => getExamProgress(session),
        finishExam,
        abandonExam,
        getDifficultyConfig: getDifficultyConfigForLevel
    };
};
