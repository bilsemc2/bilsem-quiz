/**
 * MusicAIContext — Central AI brain for the Music Exam Workshop.
 *
 * Provides:
 * - AI content generation (melodies, rhythms, songs, notes)
 * - Real piano sound playback (Tone.js Sampler)
 * - AI performance analysis
 * - Adaptive difficulty management
 */

import React, { createContext, useContext, useRef, useState, useCallback, useEffect, type ReactNode } from 'react';
import { PianoEngine } from '../engines/PianoEngine';
import { generateContent, analyzePerformance, generateReport } from '../services/aiMusicService';
import type { TestModule, AIContentResponse, AIAnalysisResponse, AIReportResponse } from '../types';

interface MusicAIContextType {
    // Piano
    piano: PianoEngine | null;
    isPianoReady: boolean;
    isPianoLoading: boolean;
    initPiano: () => Promise<void>;

    // AI Content
    requestContent: (module: TestModule, questionIndex: number, totalQuestions: number) => Promise<AIContentResponse>;
    isGenerating: boolean;

    // AI Analysis
    requestAnalysis: (module: TestModule, target: unknown, detected: unknown, questionIndex: number, audioBase64?: string, audioMimeType?: string) => Promise<AIAnalysisResponse>;
    isAnalyzing: boolean;

    // AI Report
    requestReport: (moduleScores: { module: TestModule; earnedPoints: number; maxPoints: number; details: string }[]) => Promise<AIReportResponse>;

    // Adaptive Difficulty
    difficulty: number;
    adjustDifficulty: (correct: boolean) => void;

    // State
    error: string | null;
}

const MusicAIContext = createContext<MusicAIContextType | null>(null);

export const MusicAIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const pianoRef = useRef<PianoEngine | null>(null);
    const [isPianoReady, setIsPianoReady] = useState(false);
    const [isPianoLoading, setIsPianoLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [difficulty, setDifficulty] = useState(2); // 1-5, start at 2
    const [error, setError] = useState<string | null>(null);
    const previousNotesRef = useRef<string[]>([]);
    const streakRef = useRef({ correct: 0, wrong: 0 });

    // ── Piano Init ──
    const initPiano = useCallback(async () => {
        if (pianoRef.current?.isReady || isPianoLoading) return;
        setIsPianoLoading(true);
        try {
            const engine = new PianoEngine();
            await engine.init();
            pianoRef.current = engine;
            setIsPianoReady(true);
        } catch (err) {
            console.error('[MusicAI] Piano init failed:', err);
            setError('Piyano yüklenemedi');
        } finally {
            setIsPianoLoading(false);
        }
    }, [isPianoLoading]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            pianoRef.current?.dispose();
        };
    }, []);

    // ── AI Content Generation ──
    const requestContent = useCallback(async (
        module: TestModule,
        questionIndex: number,
        totalQuestions: number,
    ): Promise<AIContentResponse> => {
        setIsGenerating(true);
        setError(null);
        try {
            const result = await generateContent({
                module,
                questionIndex,
                totalQuestions,
                difficulty,
                previousNotes: previousNotesRef.current,
            });
            // Track generated notes to avoid repetition
            if (result.notes) {
                previousNotesRef.current = [...previousNotesRef.current, ...result.notes].slice(-20);
            }
            if (result.melody?.notes) {
                previousNotesRef.current = [...previousNotesRef.current, ...result.melody.notes].slice(-20);
            }
            return result;
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'İçerik oluşturulamadı';
            setError(msg);
            throw err;
        } finally {
            setIsGenerating(false);
        }
    }, [difficulty]);

    // ── AI Analysis ──
    const requestAnalysis = useCallback(async (
        module: TestModule,
        target: unknown,
        detected: unknown,
        questionIndex: number,
        audioBase64?: string,
        audioMimeType?: string,
    ): Promise<AIAnalysisResponse> => {
        setIsAnalyzing(true);
        setError(null);
        try {
            return await analyzePerformance({
                module,
                target,
                detected,
                questionIndex,
                difficulty,
                audioBase64,
                audioMimeType,
            });

        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Analiz yapılamadı';
            setError(msg);
            throw err;
        } finally {
            setIsAnalyzing(false);
        }
    }, [difficulty]);

    // ── AI Report ──
    const requestReport = useCallback(async (
        moduleScores: { module: TestModule; earnedPoints: number; maxPoints: number; details: string }[],
    ): Promise<AIReportResponse> => {
        setIsGenerating(true);
        setError(null);
        try {
            return await generateReport({ moduleScores });
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Rapor oluşturulamadı';
            setError(msg);
            throw err;
        } finally {
            setIsGenerating(false);
        }
    }, []);

    // ── Adaptive Difficulty ──
    const adjustDifficulty = useCallback((correct: boolean) => {
        if (correct) {
            streakRef.current.correct++;
            streakRef.current.wrong = 0;
            // Increase difficulty after 2 consecutive correct
            if (streakRef.current.correct >= 2) {
                setDifficulty((d) => Math.min(5, d + 1));
                streakRef.current.correct = 0;
            }
        } else {
            streakRef.current.wrong++;
            streakRef.current.correct = 0;
            // Decrease difficulty after 2 consecutive wrong
            if (streakRef.current.wrong >= 2) {
                setDifficulty((d) => Math.max(1, d - 1));
                streakRef.current.wrong = 0;
            }
        }
    }, []);

    return (
        <MusicAIContext.Provider value={{
            piano: pianoRef.current,
            isPianoReady,
            isPianoLoading,
            initPiano,
            requestContent,
            isGenerating,
            requestAnalysis,
            isAnalyzing,
            requestReport,
            difficulty,
            adjustDifficulty,
            error,
        }}>
            {children}
        </MusicAIContext.Provider>
    );
};

export function useAIMuzik(): MusicAIContextType {
    const ctx = useContext(MusicAIContext);
    if (!ctx) throw new Error('useAIMuzik must be used within MusicAIProvider');
    return ctx;
}
