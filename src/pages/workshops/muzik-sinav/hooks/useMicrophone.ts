/**
 * useMicrophone — Manages microphone input, real-time pitch detection,
 * beat/note capture via Web Audio API, AND audio recording via MediaRecorder
 * for Gemini multimodal AI analysis.
 */

import { useCallback, useRef, useState } from 'react';
import { detectPitch, getAudioLevel } from '../utils/pitchDetector';

export function useMicrophone() {
    const [isListening, setIsListening] = useState(false);
    const [permission, setPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
    const [currentNote, setCurrentNote] = useState<string | null>(null);
    const [currentFrequency, setCurrentFrequency] = useState<number>(0);
    const [confidence, setConfidence] = useState(0);
    const [audioLevel, setAudioLevel] = useState(0);
    const [capturedNotes, setCapturedNotes] = useState<string[]>([]);
    const [capturedBeats, setCapturedBeats] = useState<number[]>([]);
    const [hasRecording, setHasRecording] = useState(false);

    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animFrameRef = useRef<number>(0);
    const startTimeRef = useRef<number>(0);
    const lastBeatRef = useRef<number>(0);

    // MediaRecorder for audio capture
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const recordedBlobRef = useRef<Blob | null>(null);

    const startListening = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setPermission('granted');
            streamRef.current = stream;

            // ── Audio Context for pitch detection ──
            const audioCtx = new AudioContext();
            audioContextRef.current = audioCtx;

            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 4096;
            analyser.smoothingTimeConstant = 0.8;
            source.connect(analyser);
            analyserRef.current = analyser;

            // ── MediaRecorder for audio capture ──
            chunksRef.current = [];
            recordedBlobRef.current = null;
            setHasRecording(false);

            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : MediaRecorder.isTypeSupported('audio/webm')
                    ? 'audio/webm'
                    : 'audio/mp4';

            const recorder = new MediaRecorder(stream, { mimeType });
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };
            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: mimeType });
                recordedBlobRef.current = blob;
                setHasRecording(true);
            };
            mediaRecorderRef.current = recorder;
            recorder.start(100); // collect chunks every 100ms

            setCapturedNotes([]);
            setCapturedBeats([]);
            startTimeRef.current = performance.now();
            lastBeatRef.current = 0;
            setIsListening(true);

            // ── Real-time pitch detection loop ──
            const detect = () => {
                if (!analyserRef.current || !audioContextRef.current) return;

                const level = getAudioLevel(analyserRef.current);
                setAudioLevel(level);

                // Beat detection: sudden volume spike
                if (level > 30 && performance.now() - lastBeatRef.current > 100) {
                    const beatTime = performance.now() - startTimeRef.current;
                    setCapturedBeats((prev) => [...prev, Math.round(beatTime)]);
                    lastBeatRef.current = performance.now();
                }

                const result = detectPitch(
                    analyserRef.current,
                    audioContextRef.current.sampleRate
                );

                if (result) {
                    setCurrentNote(result.noteName);
                    setCurrentFrequency(result.frequency);
                    setConfidence(result.confidence);
                    setCapturedNotes((prev) => {
                        if (prev[prev.length - 1] !== result.noteName) {
                            return [...prev, result.noteName];
                        }
                        return prev;
                    });
                }

                animFrameRef.current = requestAnimationFrame(detect);
            };

            detect();
        } catch {
            setPermission('denied');
        }
    }, []);

    const stopListening = useCallback(() => {
        cancelAnimationFrame(animFrameRef.current);

        // Stop MediaRecorder first (triggers onstop which saves the blob)
        if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        mediaRecorderRef.current = null;

        streamRef.current?.getTracks().forEach((t) => t.stop());
        audioContextRef.current?.close();
        audioContextRef.current = null;
        analyserRef.current = null;
        setIsListening(false);
        setAudioLevel(0);
    }, []);

    /**
     * Get the recorded audio as a base64 string for Gemini multimodal API.
     * Returns null if no recording is available.
     */
    const getRecordingBase64 = useCallback(async (): Promise<{ base64: string; mimeType: string } | null> => {
        const blob = recordedBlobRef.current;
        if (!blob || blob.size === 0) return null;

        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                // Strip the "data:audio/webm;base64," prefix
                const base64 = dataUrl.split(',')[1];
                resolve({ base64, mimeType: blob.type.split(';')[0] || 'audio/webm' });
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    }, []);

    const resetCapture = useCallback(() => {
        setCapturedNotes([]);
        setCapturedBeats([]);
        setCurrentNote(null);
        setCurrentFrequency(0);
        setConfidence(0);
        recordedBlobRef.current = null;
        chunksRef.current = [];
        setHasRecording(false);
    }, []);

    return {
        isListening,
        permission,
        currentNote,
        currentFrequency,
        confidence,
        audioLevel,
        capturedNotes,
        capturedBeats,
        hasRecording,
        startListening,
        stopListening,
        getRecordingBase64,
        resetCapture,
    };
}

