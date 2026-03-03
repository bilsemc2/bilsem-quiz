/**
 * Scoring algorithms for the BİLSEM Music Exam
 *
 * Rubric (100 points total):
 *   İşitme (60): Tek Ses(10) + Çift Ses(6) + Ezgi(20) + Ritim(24)
 *   Şarkı (25):  Ses Rengi(5) + Doğruluk(10) + Aktarım(10)
 *   Üretkenlik (15): Yaratıcılık(15)
 *
 * Jury Formula:
 *   5 simulated jury scores → drop highest & lowest → average of remaining 3
 */

import type { ModuleScore, JuryScore, ExamResult } from '../types';

const JURY_NAMES = [
    'Prof. Dr. Ayşe Yılmaz',
    'Doç. Dr. Mehmet Kaya',
    'Dr. Zeynep Demir',
    'Öğr. Gör. Ali Çelik',
    'Dr. Elif Arslan',
];

/**
 * Generate 5 simulated jury scores based on the raw performance score.
 * Each jury adds ±10% variance to simulate real jury variation.
 */
export function generateJuryScores(rawScore: number): JuryScore[] {
    const scores: JuryScore[] = JURY_NAMES.map((name, i) => {
        const variance = (Math.random() - 0.5) * 0.2 * rawScore; // ±10%
        const score = Math.max(0, Math.min(100, Math.round(rawScore + variance)));
        return { juryId: i + 1, juryName: name, score, isDropped: false };
    });

    // Mark highest and lowest as dropped
    const sorted = [...scores].sort((a, b) => a.score - b.score);
    const lowest = sorted[0];
    const highest = sorted[sorted.length - 1];

    return scores.map((s) => ({
        ...s,
        isDropped: s.juryId === lowest.juryId || s.juryId === highest.juryId,
    }));
}

/**
 * Calculate the final score using the jury fairness formula.
 * Drop highest and lowest, average the remaining 3.
 */
export function calculateFinalScore(juryScores: JuryScore[]): number {
    const kept = juryScores.filter((s) => !s.isDropped);
    const sum = kept.reduce((acc, s) => acc + s.score, 0);
    return Math.round((sum / kept.length) * 10) / 10;
}

/**
 * Calculate the raw total score from individual module scores.
 */
export function calculateTotalScore(modules: ModuleScore[]): number {
    return modules.reduce((acc, m) => acc + m.earnedPoints, 0);
}

/**
 * Build the full exam result from module scores.
 */
export function buildExamResult(
    modules: ModuleScore[],
    barajScore: number = 80
): ExamResult {
    const totalScore = calculateTotalScore(modules);
    const juryScores = generateJuryScores(totalScore);
    const finalScore = calculateFinalScore(juryScores);

    return {
        moduleScores: modules,
        juryScores,
        totalScore,
        finalScore,
        barajPassed: finalScore >= barajScore,
        barajScore,
    };
}

/**
 * Calculate pitch accuracy as a percentage (0-100).
 * Perfect match = 100, each semitone off ≈ -25.
 */
export function calculatePitchAccuracy(
    targetFreq: number,
    detectedFreq: number
): number {
    if (detectedFreq <= 0) return 0;
    const semitonesDiff = 12 * Math.log2(detectedFreq / targetFreq);
    const accuracy = Math.max(0, 100 - Math.abs(semitonesDiff) * 25);
    return Math.round(accuracy);
}

/**
 * Calculate rhythm accuracy by comparing beat timings.
 * Each beat is compared with a tolerance window (±80ms default).
 */
export function calculateRhythmAccuracy(
    targetBeats: number[],
    detectedBeats: number[],
    toleranceMs: number = 80
): number {
    if (targetBeats.length === 0) return 0;
    let matchedBeats = 0;

    for (const target of targetBeats) {
        const closest = detectedBeats.reduce(
            (best, beat) =>
                Math.abs(beat - target) < Math.abs(best - target) ? beat : best,
            Infinity
        );
        if (Math.abs(closest - target) <= toleranceMs) {
            matchedBeats++;
        }
    }

    return Math.round((matchedBeats / targetBeats.length) * 100);
}

/**
 * Calculate melody accuracy by comparing note sequences.
 */
export function calculateMelodyAccuracy(
    targetNotes: string[],
    detectedNotes: string[]
): number {
    if (targetNotes.length === 0) return 0;
    let correct = 0;

    for (let i = 0; i < targetNotes.length; i++) {
        if (i < detectedNotes.length && detectedNotes[i] === targetNotes[i]) {
            correct++;
        }
    }

    return Math.round((correct / targetNotes.length) * 100);
}
