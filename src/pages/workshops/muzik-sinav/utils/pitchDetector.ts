/**
 * YIN-based pitch detection algorithm.
 * Detects fundamental frequency from raw audio data.
 */

import { frequencyToNoteName } from './noteUtils';

interface PitchDetectionResult {
    frequency: number;
    noteName: string;
    confidence: number;
}

/**
 * Detect pitch from an AnalyserNode's time-domain data using autocorrelation.
 */
export function detectPitch(
    analyser: AnalyserNode,
    sampleRate: number
): PitchDetectionResult | null {
    const bufferLength = analyser.fftSize;
    const buffer = new Float32Array(bufferLength);
    analyser.getFloatTimeDomainData(buffer);

    // Check if there's enough signal (RMS)
    let rms = 0;
    for (let i = 0; i < bufferLength; i++) {
        rms += buffer[i] * buffer[i];
    }
    rms = Math.sqrt(rms / bufferLength);
    if (rms < 0.01) return null; // Too quiet

    // Autocorrelation
    const correlations = new Float32Array(bufferLength);
    for (let lag = 0; lag < bufferLength; lag++) {
        let sum = 0;
        for (let i = 0; i < bufferLength - lag; i++) {
            sum += buffer[i] * buffer[i + lag];
        }
        correlations[lag] = sum;
    }

    // Find the first peak after the initial drop
    let foundPeak = false;
    let bestLag = -1;
    let bestCorr = -1;

    // skip lag 0 (always max), look for first valley then peak
    let i = 1;
    // Go past zero-lag peak
    while (i < bufferLength && correlations[i] > correlations[i - 1]) i++;
    // Go past first valley
    while (i < bufferLength && correlations[i] < correlations[i - 1]) i++;
    // Now find the peak
    while (i < bufferLength) {
        if (correlations[i] > bestCorr) {
            bestCorr = correlations[i];
            bestLag = i;
        }
        if (correlations[i] < correlations[i - 1]) {
            foundPeak = true;
            break;
        }
        i++;
    }

    if (!foundPeak || bestLag === -1) return null;

    const confidence = bestCorr / correlations[0];
    if (confidence < 0.8) return null; // Not confident enough

    const frequency = sampleRate / bestLag;

    // Only accept reasonable music frequencies (80 Hz to 1200 Hz)
    if (frequency < 80 || frequency > 1200) return null;

    return {
        frequency: Math.round(frequency * 10) / 10,
        noteName: frequencyToNoteName(frequency),
        confidence: Math.round(confidence * 100) / 100,
    };
}

/**
 * Get the current audio level (volume) from an AnalyserNode.
 * Returns a value 0-100.
 */
export function getAudioLevel(analyser: AnalyserNode): number {
    const bufferLength = analyser.fftSize;
    const buffer = new Float32Array(bufferLength);
    analyser.getFloatTimeDomainData(buffer);

    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
        sum += buffer[i] * buffer[i];
    }
    const rms = Math.sqrt(sum / bufferLength);
    // Normalize to 0-100 range
    return Math.min(100, Math.round(rms * 500));
}
