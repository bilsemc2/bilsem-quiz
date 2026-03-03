/**
 * aiMusicService — Frontend service that communicates with Gemini via gemini-proxy edge function.
 *
 * AI generates test content (notes, melodies, rhythms, songs, creativity prompts)
 * and analyzes student performance.
 *
 * Fallback: If AI is unavailable, uses local noteUtils.ts for content generation.
 */

import { supabase } from '../../../../lib/supabase';
import type { TestModule, AIContentResponse, AIAnalysisResponse, AIReportResponse } from '../types';
import { getRandomNote, getRandomMelody, getRandomRhythm } from '../utils/noteUtils';

// ── Content Generation ──

interface GenerateContentInput {
    module: TestModule;
    questionIndex: number;
    totalQuestions: number;
    difficulty: number;
    previousNotes?: string[];
}

export async function generateContent(input: GenerateContentInput): Promise<AIContentResponse> {
    try {
        const { data, error } = await supabase.functions.invoke('gemini-proxy', {
            body: {
                action: 'generateMusicExamContent',
                module: input.module,
                questionIndex: input.questionIndex,
                totalQuestions: input.totalQuestions,
                difficulty: input.difficulty,
                previousNotes: input.previousNotes ?? [],
            },
        });

        if (error || data?.error) {
            console.warn('[AI Music] Content generation failed, using fallback:', error?.message || data?.error);
            return generateFallbackContent(input);
        }

        return data.result as AIContentResponse;
    } catch (err) {
        console.warn('[AI Music] Network error, using fallback:', err);
        return generateFallbackContent(input);
    }
}

// ── Performance Analysis ──

interface AnalyzeInput {
    module: TestModule;
    target: unknown;
    detected: unknown;
    questionIndex: number;
    difficulty: number;
    /** Base64 encoded audio recording for Gemini multimodal analysis */
    audioBase64?: string;
    /** MIME type of the audio recording (e.g. 'audio/webm') */
    audioMimeType?: string;
}

export async function analyzePerformance(input: AnalyzeInput): Promise<AIAnalysisResponse> {
    try {
        const { data, error } = await supabase.functions.invoke('gemini-proxy', {
            body: {
                action: 'analyzeMusicExamPerformance',
                module: input.module,
                target: input.target,
                detected: input.detected,
                questionIndex: input.questionIndex,
                difficulty: input.difficulty,
                ...(input.audioBase64 && {
                    audioBase64: input.audioBase64,
                    audioMimeType: input.audioMimeType || 'audio/webm',
                }),
            },
        });

        if (data?.retryAfterSec) {
            return fallbackAnalysis('AI analiz limitine ulaştınız. Biraz bekleyin.');
        }

        if (error || data?.error) {
            console.warn('[AI Music] Analysis failed, using fallback:', error?.message || data?.error);
            return fallbackAnalysis('AI şu an kullanılamıyor.');
        }

        return data.result as AIAnalysisResponse;
    } catch (err) {
        console.warn('[AI Music] Analysis network error:', err);
        return fallbackAnalysis('Bağlantı hatası oluştu.');
    }
}


// ── Overall Report ──

interface ReportInput {
    moduleScores: {
        module: TestModule;
        earnedPoints: number;
        maxPoints: number;
        details: string;
    }[];
}

export async function generateReport(input: ReportInput): Promise<AIReportResponse> {
    try {
        const { data, error } = await supabase.functions.invoke('gemini-proxy', {
            body: {
                action: 'generateMusicExamReport',
                moduleScores: input.moduleScores,
            },
        });

        if (error || data?.error) {
            console.warn('[AI Music] Report generation failed:', error?.message || data?.error);
            return fallbackReport(input);
        }

        return data.result as AIReportResponse;
    } catch (err) {
        console.warn('[AI Music] Report network error:', err);
        return fallbackReport(input);
    }
}

// ── Fallback Generators ──

function generateFallbackContent(input: GenerateContentInput): AIContentResponse {
    const difficulty = input.difficulty;

    switch (input.module) {
        case 'tek-ses':
            return {
                notes: [getRandomNote(3, 5)],
                hint: 'Notayı dikkatlice dinle ve tekrarla.',
                difficulty,
            };
        case 'cift-ses': {
            const root = getRandomNote(3, 4);
            const intervals = ['E', 'G', 'A', 'B'];
            const second = intervals[Math.floor(Math.random() * intervals.length)] +
                root.slice(-1);
            return {
                notes: [root, second],
                hint: 'İki sesi ayrı ayrı duy ve tekrarla.',
                difficulty,
            };
        }
        case 'ezgi': {
            const length = Math.min(3 + difficulty, 8);
            const notes = getRandomMelody(length, 4);
            const durations = notes.map(() => 0.5);
            return {
                melody: { notes, durations, name: 'Melodi' },
                hint: 'Melodiyi dikkatlice dinle ve tekrarla.',
                difficulty,
            };
        }
        case 'ritim': {
            const beats = Math.min(4 + difficulty * 2, 12);
            const rhythm = getRandomRhythm(beats, 100 + difficulty * 10);
            return {
                rhythm: {
                    beats: rhythm,
                    tempo: 100 + difficulty * 10,
                    name: 'Ritim',
                    timeSignature: '4/4',
                },
                hint: 'Ritmi dikkatlice dinle ve vur.',
                difficulty,
            };
        }
        case 'sarki':
            return {
                song: {
                    name: 'Küçük Kurbağa',
                    lyrics: 'Küçük kurbağa küçük kurbağa\nSuda yaşar suda yaşar\nBöyle olunca üzülme sakın\nBöyle olunca üzülme sakın',
                    melody: ['C4', 'D4', 'E4', 'C4', 'C4', 'D4', 'E4', 'C4',
                        'E4', 'F4', 'G4', 'E4', 'F4', 'G4'],
                    durations: Array(14).fill(0.4),
                },
                hint: 'Şarkıyı dinle ve söyle.',
                difficulty,
            };
        case 'uretkenlik':
            return {
                creativity: {
                    theme: 'Yağmur',
                    constraints: ['En az 8 vuruş', 'Temponu kendin belirle'],
                    inspiration: 'Yağmur damlalarının camdan süzülüşünü düşün.',
                    hints: ['Hafif → güçlü geçiş yap', 'Tekrarlayan bir motif kullan'],
                },
                hint: 'Serbest çal veya söyle!',
                difficulty,
            };
        default:
            return { difficulty, hint: 'Hazır ol!' };
    }
}

function fallbackAnalysis(message: string): AIAnalysisResponse {
    return {
        score: 0,
        maxScore: 0,
        accuracy: 0,
        feedback: {
            strengths: [],
            improvements: [message],
            tips: ['Tekrar dene!'],
        },
        encouragement: 'Denemekten vazgeçme! 🌟',
        detailedAnalysis: message,
    };
}

function fallbackReport(input: ReportInput): AIReportResponse {
    const total = input.moduleScores.reduce((s, m) => s + m.earnedPoints, 0);
    const maxTotal = input.moduleScores.reduce((s, m) => s + m.maxPoints, 0);
    return {
        overallScore: Math.round((total / maxTotal) * 100),
        moduleBreakdown: input.moduleScores.map((m) => ({
            module: m.module,
            score: m.earnedPoints,
            maxScore: m.maxPoints,
            grade: m.earnedPoints >= m.maxPoints * 0.8 ? 'A' : m.earnedPoints >= m.maxPoints * 0.6 ? 'B' : 'C',
            comment: m.details || 'Tamamlandı',
        })),
        strengths: ['Tüm modülleri tamamladın!'],
        improvements: ['Pratik yapmaya devam et.'],
        recommendations: ['Her gün 15 dakika müzik çalışması yap.'],
        detailedAnalysis: `Toplam skor: ${total}/${maxTotal}`,
        level: total >= maxTotal * 0.8 ? 'İleri' : total >= maxTotal * 0.5 ? 'Orta' : 'Başlangıç',
        encouragement: 'Harika bir iş çıkardın! 🎵',
    };
}
