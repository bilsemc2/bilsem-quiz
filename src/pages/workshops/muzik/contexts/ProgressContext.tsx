import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface TestInfo {
    id: string;
    path: string;
    name: string;
    icon: string;
    alwaysUnlocked?: boolean;
}

export const TEST_ORDER: TestInfo[] = [
    { id: 'home', path: '/atolyeler/muzik', name: 'Ana Sayfa', icon: '🏠', alwaysUnlocked: true },
    { id: 'single-note', path: '/atolyeler/muzik/single-note', name: 'Tek Ses Tekrarı', icon: '🎵' },
    { id: 'double-note', path: '/atolyeler/muzik/double-note', name: 'İki Ses Tekrarı', icon: '🎶' },
    { id: 'triple-note', path: '/atolyeler/muzik/triple-note', name: 'Üç Ses Tekrarı', icon: '🎼' },
    { id: 'melody', path: '/atolyeler/muzik/melody', name: 'Melodi Tekrarı', icon: '🎹' },
    { id: 'rhythm', path: '/atolyeler/muzik/rhythm', name: 'Ritim Tekrarı', icon: '🥁' },
    { id: 'song-performance', path: '/atolyeler/muzik/song-performance', name: 'Şarkı Performansı', icon: '🎤' },
    { id: 'melody-diff', path: '/atolyeler/muzik/melody-diff', name: 'Melodi Farklılıkları', icon: '🎸' },
    { id: 'rhythm-diff', path: '/atolyeler/muzik/rhythm-diff', name: 'Ritim Farklılıkları', icon: '🎺' },
    { id: 'finish', path: '/atolyeler/muzik/finish', name: 'Bitir', icon: '🎊', alwaysUnlocked: true }
];

interface ProgressContextType {
    completedTests: string[];
    completeTest: (testId: string) => void;
    isTestCompleted: (testId: string) => boolean;
    isTestLocked: (testId: string) => boolean;
    resetProgress: () => void;
    getCompletedCount: () => number;
    getTotalTestCount: () => number;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export function ProgressProvider({ children }: { children: ReactNode }) {
    const [completedTests, setCompletedTests] = useState<string[]>(() => {
        const saved = localStorage.getItem('musicTestProgress');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('musicTestProgress', JSON.stringify(completedTests));
    }, [completedTests]);

    const completeTest = (testId: string) => {
        if (!completedTests.includes(testId)) {
            setCompletedTests(prev => [...prev, testId]);
        }
    };

    const isTestCompleted = (testId: string) => {
        return completedTests.includes(testId);
    };

    const isTestLocked = (testId: string) => {
        const testIndex = TEST_ORDER.findIndex(test => test.id === testId);
        if (testIndex === -1) return true;

        const test = TEST_ORDER[testIndex];
        if (test.alwaysUnlocked) return false;
        if (isTestCompleted(testId)) return false;

        if (testIndex > 0) {
            const previousTest = TEST_ORDER[testIndex - 1];
            if (previousTest.alwaysUnlocked) return false;
            return !isTestCompleted(previousTest.id);
        }

        return false;
    };

    const resetProgress = () => {
        setCompletedTests([]);
        localStorage.removeItem('musicTestProgress');
    };

    const getCompletedCount = () => {
        return completedTests.length;
    };

    const getTotalTestCount = () => {
        return TEST_ORDER.filter(test => !test.alwaysUnlocked).length;
    };

    return (
        <ProgressContext.Provider value={{
            completedTests,
            completeTest,
            isTestCompleted,
            isTestLocked,
            resetProgress,
            getCompletedCount,
            getTotalTestCount
        }}>
            {children}
        </ProgressContext.Provider>
    );
}

export function useProgress() {
    const context = useContext(ProgressContext);
    if (!context) {
        throw new Error('useProgress must be used within ProgressProvider');
    }
    return context;
}
