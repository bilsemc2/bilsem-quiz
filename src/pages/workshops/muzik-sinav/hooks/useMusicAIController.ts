import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PianoEngine } from '../engines/PianoEngine';
import { analyzePerformance, generateContent, generateReport } from '../services/aiMusicService';
import {
    advanceAdaptiveDifficulty,
    appendRecentMusicNotes,
    INITIAL_MUSIC_AI_DIFFICULTY
} from '../features/musicAI/model/musicAIModel';
import type { MusicAIContextValue } from '../contexts/musicAI/musicAIContext';

export const useMusicAIController = (): MusicAIContextValue => {
    const pianoRef = useRef<PianoEngine | null>(null);
    const previousNotesRef = useRef<string[]>([]);
    const streakRef = useRef({ correct: 0, wrong: 0 });
    const [isPianoReady, setIsPianoReady] = useState(false);
    const [isPianoLoading, setIsPianoLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [difficulty, setDifficulty] = useState(INITIAL_MUSIC_AI_DIFFICULTY);
    const [error, setError] = useState<string | null>(null);

    const initPiano = useCallback(async () => {
        if (pianoRef.current?.isReady || isPianoLoading) {
            return;
        }

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

    useEffect(() => (
        () => {
            pianoRef.current?.dispose();
        }
    ), []);

    const requestContent: MusicAIContextValue['requestContent'] = useCallback(async (
        module,
        questionIndex,
        totalQuestions
    ) => {
        setIsGenerating(true);
        setError(null);
        try {
            const result = await generateContent({
                module,
                questionIndex,
                totalQuestions,
                difficulty,
                previousNotes: previousNotesRef.current
            });

            previousNotesRef.current = appendRecentMusicNotes(
                appendRecentMusicNotes(previousNotesRef.current, result.notes),
                result.melody?.notes
            );

            return result;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'İçerik oluşturulamadı';
            setError(message);
            throw err;
        } finally {
            setIsGenerating(false);
        }
    }, [difficulty]);

    const requestAnalysis: MusicAIContextValue['requestAnalysis'] = useCallback(async (
        module,
        target,
        detected,
        questionIndex,
        audioBase64?,
        audioMimeType?
    ) => {
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
                audioMimeType
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Analiz yapılamadı';
            setError(message);
            throw err;
        } finally {
            setIsAnalyzing(false);
        }
    }, [difficulty]);

    const requestReport: MusicAIContextValue['requestReport'] = useCallback(async (
        moduleScores
    ) => {
        setIsGenerating(true);
        setError(null);
        try {
            return await generateReport({ moduleScores });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Rapor oluşturulamadı';
            setError(message);
            throw err;
        } finally {
            setIsGenerating(false);
        }
    }, []);

    const adjustDifficulty = useCallback((correct: boolean) => {
        const nextState = advanceAdaptiveDifficulty(
            {
                difficulty,
                streak: streakRef.current
            },
            correct
        );

        streakRef.current = nextState.streak;
        if (nextState.difficulty !== difficulty) {
            setDifficulty(nextState.difficulty);
        }
    }, [difficulty]);

    return useMemo(() => ({
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
        error
    }), [
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
        error
    ]);
};
