import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface TestResult {
    score: number;
    overallScore?: number;
    timestamp: string;
    [key: string]: any;
}

interface ResultsContextType {
    testResults: Record<string, TestResult>;
    saveResult: (testId: string, resultData: any) => void;
    resetResults: () => void;
    getResult: (testId: string) => TestResult | undefined;
    getOverallPerformance: () => number;
}

const ResultsContext = createContext<ResultsContextType | undefined>(undefined);

export function ResultsProvider({ children }: { children: ReactNode }) {
    const [testResults, setTestResults] = useState<Record<string, TestResult>>(() => {
        const saved = localStorage.getItem('musicTestResults');
        return saved ? JSON.parse(saved) : {};
    });

    useEffect(() => {
        localStorage.setItem('musicTestResults', JSON.stringify(testResults));
    }, [testResults]);

    const saveResult = (testId: string, resultData: any) => {
        setTestResults(prev => ({
            ...prev,
            [testId]: {
                ...resultData,
                timestamp: new Date().toISOString()
            }
        }));
    };

    const resetResults = () => {
        setTestResults({});
        localStorage.removeItem('musicTestResults');
    };

    const getResult = (testId: string) => {
        return testResults[testId];
    };

    const getOverallPerformance = () => {
        const categories = Object.keys(testResults);
        if (categories.length === 0) return 0;

        const totalScore = categories.reduce((sum, cat) => {
            const result = testResults[cat];
            return sum + (result.score || result.overallScore || 0);
        }, 0);

        return totalScore / categories.length;
    };

    return (
        <ResultsContext.Provider value={{
            testResults,
            saveResult,
            resetResults,
            getResult,
            getOverallPerformance
        }}>
            {children}
        </ResultsContext.Provider>
    );
}

export function useResults() {
    const context = useContext(ResultsContext);
    if (!context) {
        throw new Error('useResults must be used within ResultsProvider');
    }
    return context;
}
