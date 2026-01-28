// src/pages/workshops/muzik/utils/audio.ts
import { A4, SEMITONE, NOTE_NAMES } from '../constants';

export interface DetectedNote {
    frequency: string;
    noteName: string | null;
    startTime: string;
    duration: string;
}

export interface RhythmTarget {
    id: number;
    times: number[];
    description: string;
}

export interface RhythmDifferenceSet {
    id: number;
    rhythms: number[][];
    differentIndex: number;
}

export interface RhythmComparison {
    score: number;
    feedback: string;
    intervalResults: boolean[];
}

export interface MelodyDetailedResult {
    target: string;
    detected: string | null;
    sequenceMatch: boolean;
    pitchMatch: boolean;
    durationMatch: boolean;
    cents: string | null | undefined;
}

export interface MelodyComparison {
    overallScore: number;
    pitchScore: number;
    durationScore: number;
    sequenceScore: number;
    feedback: string;
    detailedResults: MelodyDetailedResult[];
    detectedNotesString?: string;
}

interface PitchPoint {
    time: string;
    frequency: string | null;
}

interface NoteSegment {
    startTime: number;
    points: { freq: number; time: number }[];
    lastTime: number;
}

/**
 * Converts frequency to note name (e.g., 440 Hz -> "A4")
 */
export function frequencyToNoteName(frequency: number): string | null {
    if (!frequency || frequency <= 0) return null;
    try {
        const midiNum = 12 * (Math.log2(frequency / A4)) + SEMITONE;
        const noteIndex = Math.round(midiNum);
        if (noteIndex < 0 || noteIndex >= 128) return null;
        const octave = Math.floor(noteIndex / 12) - 1;
        const name = NOTE_NAMES[noteIndex % 12];
        return name + octave;
    } catch (error) {
        console.error(`Freq Conv Err ${frequency}:`, error);
        return null;
    }
}

/**
 * Finalizes a note segment and adds it to detected notes
 */
export function finalizeSegment(
    segment: NoteSegment | null,
    detectedNotes: DetectedNote[],
    minDuration: number
) {
    if (!segment || segment.points.length === 0) return;
    const firstTime = segment.points[0].time;
    const lastTime = segment.lastTime;
    const duration = lastTime - firstTime;

    if (duration >= minDuration) {
        const avgFreq = segment.points.reduce((sum, point) => sum + point.freq, 0) / segment.points.length;
        detectedNotes.push({
            frequency: avgFreq.toFixed(2),
            noteName: frequencyToNoteName(avgFreq),
            startTime: firstTime.toFixed(4),
            duration: duration.toFixed(4)
        });
    }
}

/**
 * Segments raw pitch data into discrete note objects
 */
export function segmentPitches(
    pitches: PitchPoint[],
    sampleRate: number,
    minNoteDurationSeconds = 0.1,
    frequencyToleranceHz = 25
): DetectedNote[] {
    if (!pitches || pitches.length === 0 || !sampleRate) return [];
    const detectedNotes: DetectedNote[] = [];
    let currentNoteSegment: NoteSegment | null = null;

    for (let i = 0; i < pitches.length; i++) {
        const currentPoint = pitches[i];
        const currentTime = parseFloat(currentPoint.time);
        const currentFreq = currentPoint.frequency ? parseFloat(currentPoint.frequency) : null;

        if (currentFreq !== null) {
            if (currentNoteSegment === null) {
                currentNoteSegment = {
                    startTime: currentTime,
                    points: [{ freq: currentFreq, time: currentTime }],
                    lastTime: currentTime
                };
            } else {
                const referenceFreq = currentNoteSegment.points[0].freq;
                if (Math.abs(currentFreq - referenceFreq) <= frequencyToleranceHz) {
                    currentNoteSegment.points.push({ freq: currentFreq, time: currentTime });
                    currentNoteSegment.lastTime = currentTime;
                } else {
                    finalizeSegment(currentNoteSegment, detectedNotes, minNoteDurationSeconds);
                    currentNoteSegment = {
                        startTime: currentTime,
                        points: [{ freq: currentFreq, time: currentTime }],
                        lastTime: currentTime
                    };
                }
            }
        } else {
            if (currentNoteSegment !== null) {
                finalizeSegment(currentNoteSegment, detectedNotes, minNoteDurationSeconds);
                currentNoteSegment = null;
            }
        }
    }

    if (currentNoteSegment !== null) {
        finalizeSegment(currentNoteSegment, detectedNotes, minNoteDurationSeconds);
    }

    return detectedNotes;
}

/**
 * Compares a detected note against a target
 */
export function compareSingleNote(
    target: { note: string },
    detected: DetectedNote[]
) {
    if (!target) {
        return { match: false, detectedNote: null, feedback: "Hedef nota belirlenmemiş." };
    }

    if (!detected || detected.length === 0) {
        return { match: false, detectedNote: null, feedback: "Hiç nota tespit edilemedi." };
    }

    // Use reduce to find the longest note with proper type narrowing
    const longestNote = detected.reduce<DetectedNote | null>((longest, note) => {
        const duration = parseFloat(note.duration);
        const longestDuration = longest ? parseFloat(longest.duration) : 0;
        if (note.noteName && duration > longestDuration) {
            return note;
        }
        return longest;
    }, null);

    if (!longestNote || !longestNote.noteName) {
        return { match: false, detectedNote: null, feedback: "Anlamlı bir nota tespit edilemedi." };
    }

    const targetNoteName = target.note;
    const detectedNoteName = longestNote.noteName;
    const match = targetNoteName === detectedNoteName;
    const feedback = match
        ? `Doğru! Hedef (${targetNoteName}) ile en belirgin tespit edilen nota (${detectedNoteName}) eşleşti.`
        : `Yanlış. Hedef (${targetNoteName}) idi, ancak en belirgin tespit edilen nota (${detectedNoteName}) oldu.`;

    return { match, detectedNote: longestNote, feedback };
}

/**
 * Compares a response with multiple notes (dyad/triad)
 * Order is not important.
 */
export function compareMultiNoteResponse(
    targetNotes: string[],
    detected: DetectedNote[],
    requiredCount: number
) {
    const detectedNotesFiltered = detected.filter(n => n.noteName !== null);

    if (detectedNotesFiltered.length < requiredCount) {
        return {
            match: false,
            feedback: `Yetersiz sayıda nota tespit edildi (${detectedNotesFiltered.length}/${requiredCount}).`
        };
    }

    const detectedNoteNames = detectedNotesFiltered.slice(0, requiredCount).map(n => n.noteName as string);
    const targetNotesSet = new Set(targetNotes);
    const detectedNotesSet = new Set(detectedNoteNames);

    // Check if all target notes are present in detected notes
    const perfectMatch = targetNotes.length === detectedNoteNames.length &&
        targetNotes.every(note => detectedNotesSet.has(note)) &&
        detectedNoteNames.every(note => targetNotesSet.has(note));

    // For triads, we can allow partial match (2/3)
    const isTriad = requiredCount === 3;
    const matchCount = detectedNoteNames.filter(note => targetNotesSet.has(note)).length;
    const partialMatch = isTriad && matchCount >= 2;

    let feedback = '';
    let match = false;

    if (perfectMatch) {
        match = true;
        feedback = `Mükemmel! Hedef sesler (${targetNotes.join('-')}) ile tespit edilenler (${detectedNoteNames.join('-')}) tam olarak eşleşti.`;
    } else if (partialMatch) {
        match = true;
        feedback = `İyi! Hedef sesler (${targetNotes.join('-')}) ile tespit edilenler (${detectedNoteNames.join('-')}) arasında yeterli eşleşme (${matchCount}/3) var.`;
    } else {
        feedback = `Yanlış. Hedef sesler (${targetNotes.join('-')}) idi, ancak tespit edilenler (${detectedNoteNames.join('-')}) oldu.`;
    }

    if (detectedNotesFiltered.length > requiredCount) {
        feedback += ` (Fazladan ${detectedNotesFiltered.length - requiredCount} nota daha tespit edildi.)`;
    }

    return { match, feedback };
}

/**
 * Rhythm Utilities
 */

export function generateRandomRhythm(length: number, baseInterval = 0.25, variationChance = 0): number[] {
    const rhythm = [0];
    let currentTime = 0;

    for (let i = 1; i < length; i++) {
        let interval = baseInterval;
        if (Math.random() < variationChance) {
            interval = Math.random() * (baseInterval * 1.5 - baseInterval * 0.8) + baseInterval * 0.8;
        }
        currentTime += interval;
        rhythm.push(parseFloat(currentTime.toFixed(2)));
    }
    return rhythm;
}

export function generateRhythmPool(count = 6): RhythmTarget[] {
    const rhythms: RhythmTarget[] = [];
    for (let i = 1; i <= count; i++) {
        const rhythmLength = Math.floor(Math.random() * 4) + 13;
        const rhythmType = Math.floor(Math.random() * 4);
        let baseInterval = 0.25;
        let variationChance = 0;

        switch (rhythmType) {
            case 0: baseInterval = 0.25; variationChance = 0; break;
            case 1: baseInterval = 0.25; variationChance = 0.2; break;
            case 2: baseInterval = 0.2; variationChance = 0.1; break;
            case 3: baseInterval = 0.3; variationChance = 0.3; break;
        }

        const times = generateRandomRhythm(rhythmLength, baseInterval, variationChance);
        let description = "";
        if (variationChance === 0) description = `${rhythmLength} vuruş (eşit aralıklı)`;
        else if (baseInterval <= 0.2) description = `${rhythmLength} vuruş (hızlı)`;
        else if (baseInterval >= 0.3) description = `${rhythmLength} vuruş (yavaş)`;
        else description = `${rhythmLength} vuruş (karmaşık)`;

        rhythms.push({ id: i, times, description });
    }
    return rhythms;
}

export function createDifferentRhythm(originalRhythm: number[], differenceCount = 1): number[] {
    const newRhythm = [...originalRhythm];
    for (let i = 0; i < differenceCount; i++) {
        const indexToChange = Math.floor(Math.random() * (newRhythm.length - 1)) + 1;
        const originalTime = newRhythm[indexToChange];
        const direction = Math.random() > 0.5 ? 1 : -1;
        const changeAmount = Math.random() * (0.3 - 0.1) + 0.1;

        let newTime = originalTime + (direction * changeAmount);
        if (indexToChange > 0) newTime = Math.max(newTime, newRhythm[indexToChange - 1] + 0.1);
        if (indexToChange < newRhythm.length - 1) newTime = Math.min(newTime, newRhythm[indexToChange + 1] - 0.1);

        newRhythm[indexToChange] = parseFloat(newTime.toFixed(2));
    }
    return newRhythm;
}

export function generateRhythmDifferenceSets(count = 3): RhythmDifferenceSet[] {
    const sets: RhythmDifferenceSet[] = [];
    for (let i = 1; i <= count; i++) {
        const rhythmLength = Math.floor(Math.random() * 5) + 8;
        const baseInterval = parseFloat((Math.random() * (0.4 - 0.2) + 0.2).toFixed(2));
        const mainRhythm = generateRandomRhythm(rhythmLength, baseInterval, 0.2);
        const differentRhythm = createDifferentRhythm(mainRhythm);
        const differentIndex = Math.floor(Math.random() * 3);

        const rhythms: number[][] = [];
        for (let j = 0; j < 3; j++) {
            rhythms.push(j === differentIndex ? differentRhythm : mainRhythm);
        }

        sets.push({ id: i, rhythms, differentIndex });
    }
    return sets;
}

export function compareRhythms(
    taps: number[],
    targetIntervals: number[],
    absTolerance: number,
    relTolerance: number,
    targetBeatCount: number
): RhythmComparison {
    if (!taps || taps.length < 2) return { score: 0, feedback: "Yetersiz tıklama.", intervalResults: [] };

    if (taps.length !== targetBeatCount) {
        return {
            score: 0,
            feedback: `Hatalı vuruş sayısı! Hedef ${targetBeatCount}, siz ${taps.length} vuruş yaptınız.`,
            intervalResults: Array(targetIntervals.length).fill(false)
        };
    }

    let correctIntervals = 0;
    const intervalResults: boolean[] = [];

    for (let i = 1; i < taps.length; i++) {
        const interval = taps[i] - taps[i - 1];
        const targetInterval = targetIntervals[i - 1];
        const diff = Math.abs(interval - targetInterval);

        const isCorrect = targetInterval > 10
            ? (diff <= absTolerance && diff <= targetInterval * relTolerance)
            : (diff <= absTolerance);

        intervalResults.push(isCorrect);
        if (isCorrect) correctIntervals++;
    }

    const score = targetIntervals.length > 0 ? (correctIntervals / targetIntervals.length) * 100 : 0;
    return {
        score,
        feedback: `${targetIntervals.length} aralığın ${correctIntervals} tanesi doğru.`,
        intervalResults
    };
}

/**
 * Melody Utilities
 */

export function compareMelodies(
    target: { note: string; duration: number }[],
    detected: DetectedNote[],
    frequencies: { [key: string]: number },
    pitchTolerance: number,
    durationTolerance: number,
    melodyPitchWeight: number,
    melodyDurationWeight: number,
    melodySequenceWeight: number
): MelodyComparison {
    if (!target || target.length === 0) {
        return { overallScore: 0, pitchScore: 0, durationScore: 0, sequenceScore: 0, feedback: "Hedef melodi yok.", detailedResults: [] };
    }
    const detectedNotesFiltered = detected.filter(n => n.noteName !== null && n.frequency && n.duration);
    if (!detectedNotesFiltered || detectedNotesFiltered.length === 0) {
        return { overallScore: 0, pitchScore: 0, durationScore: 0, sequenceScore: 0, feedback: "Anlamlı nota tespit edilemedi.", detailedResults: [] };
    }
    const targetNotes = target;
    const detectedNotes = detectedNotesFiltered;
    const comparisonLength = Math.min(targetNotes.length, detectedNotes.length);

    let sequenceMatches = 0;
    let pitchMatches = 0;
    let durationMatches = 0;
    const detailedResults = [];

    for (let i = 0; i < comparisonLength; i++) {
        const targetNote = targetNotes[i];
        const detectedNote = detectedNotes[i];
        const targetNoteName = targetNote.note;
        const detectedNoteName = detectedNote.noteName;
        const targetFreq = frequencies[targetNoteName];
        const detectedFreq = parseFloat(detectedNote.frequency);
        const targetDuration = targetNote.duration;
        const detectedDuration = parseFloat(detectedNote.duration);

        let sequenceMatch = false;
        let pitchMatch = false;
        let durationMatch = false;
        let centDifference = null;

        if (targetNoteName === detectedNoteName) {
            sequenceMatch = true;
            sequenceMatches++;
        }
        if (targetFreq && detectedFreq > 0) {
            centDifference = 1200 * Math.log2(detectedFreq / targetFreq);
            if (Math.abs(centDifference) <= pitchTolerance) {
                pitchMatch = true;
                pitchMatches++;
            }
        }
        if (targetDuration > 0) {
            const durationDiffRatio = Math.abs(detectedDuration - targetDuration) / targetDuration;
            if (durationDiffRatio <= durationTolerance) {
                durationMatch = true;
                durationMatches++;
            }
        }
        detailedResults.push({
            target: targetNoteName,
            detected: detectedNoteName,
            sequenceMatch,
            pitchMatch,
            durationMatch,
            cents: centDifference?.toFixed(1)
        });
    }

    const seqScore = comparisonLength > 0 ? (sequenceMatches / comparisonLength) * 100 : 0;
    const pitchScore = comparisonLength > 0 ? (pitchMatches / comparisonLength) * 100 : 0;
    const durationScore = comparisonLength > 0 ? (durationMatches / comparisonLength) * 100 : 0;
    const overallScore = (pitchScore * melodyPitchWeight) + (durationScore * melodyDurationWeight) + (seqScore * melodySequenceWeight);

    let feedback = `Pitch: ${pitchScore.toFixed(0)}%, Süre: ${durationScore.toFixed(0)}%. ${comparisonLength} notanın ${sequenceMatches}'i doğru sırada.`;
    if (targetNotes.length !== detectedNotes.length) {
        feedback += ` (Tespit: ${detectedNotes.length}, Hedef: ${targetNotes.length} nota)`;
    }

    return { overallScore, pitchScore, durationScore, sequenceScore: seqScore, feedback, detailedResults };
}
