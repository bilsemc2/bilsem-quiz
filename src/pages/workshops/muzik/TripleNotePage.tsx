import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAudio } from './contexts/AudioContext';
import { useNavigate } from 'react-router-dom';
import { useProgress } from './contexts/ProgressContext';
import { useResults } from './contexts/ResultsContext';
import Pitchfinder from "pitchfinder";
import { POSSIBLE_TARGET_TRIADS, TargetTriad } from './data/targetNotes';
import { segmentPitches, compareMultiNoteResponse } from './utils/audio';
import {
    TRIPLE_NOTE_ROUNDS,
    PITCH_WINDOW_SIZE,
    PITCH_HOP_SIZE_DIVISOR,
    AUDIO_PLAYBACK_BUFFER_MS,
    MIN_NOTE_DURATION_SECONDS,
    FREQUENCY_TOLERANCE_HZ
} from './constants';
import { ProgressIndicator, LoadingIndicator, RecordingIndicator, StoryScreen } from './components';
import './muzik.css';

const storyImageUrl = "/images/muzik.webp";

interface RoundResult {
    round: number;
    targetNotes: string;
    match: boolean;
    feedback: string;
}

const TripleNotePage: React.FC = () => {
    const navigate = useNavigate();
    const { getAudioContext, playNote, isSamplerReady } = useAudio();
    const { completeTest } = useProgress();
    const { saveResult } = useResults();

    const [currentTargetTriad, setCurrentTargetTriad] = useState<TargetTriad | null>(null);
    const [isPlayingTarget, setIsPlayingTarget] = useState(false);
    const [showRecordInstruction, setShowRecordInstruction] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<{ match: boolean; feedback: string } | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const [showStory, setShowStory] = useState(true);
    const [storyStep, setStoryStep] = useState(1);
    const [restartCounter, setRestartCounter] = useState(0);
    const [currentRound, setCurrentRound] = useState(1);
    const [roundResults, setRoundResults] = useState<RoundResult[]>([]);

    const introAudio = useRef<HTMLAudioElement | null>(null);
    const instructionAudio = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (POSSIBLE_TARGET_TRIADS.length > 0) {
            const randomIndex = Math.floor(Math.random() * POSSIBLE_TARGET_TRIADS.length);
            setCurrentTargetTriad(POSSIBLE_TARGET_TRIADS[randomIndex]);
        }
        setIsPlayingTarget(false);
        setShowRecordInstruction(false);
        setIsRecording(false);
        setIsAnalyzing(false);
        setAnalysisResult(null);
    }, [restartCounter]);

    const playTargetTriad = useCallback(() => {
        if (!currentTargetTriad || !isSamplerReady) return;
        const audioContext = getAudioContext();
        if (!audioContext) return;
        if (audioContext.state === 'suspended') audioContext.resume();

        setIsPlayingTarget(true);
        setShowRecordInstruction(false);

        const [note1, note2, note3] = currentTargetTriad.notes;
        const duration = currentTargetTriad.duration;
        const startTime = audioContext.currentTime + 0.2;

        playNote(note1, duration, startTime);
        playNote(note2, duration, startTime);
        playNote(note3, duration, startTime);

        setTimeout(() => {
            setIsPlayingTarget(false);
            setShowRecordInstruction(true);
        }, (duration * 1000) + AUDIO_PLAYBACK_BUFFER_MS);
    }, [getAudioContext, playNote, isPlayingTarget, currentTargetTriad, isSamplerReady]);

    const analyzeAudio = useCallback(async (audioBlob: Blob) => {
        if (!currentTargetTriad) return;
        setIsAnalyzing(true);
        const audioContext = getAudioContext();
        if (!audioContext) return;

        try {
            const arrayBuffer = await audioBlob.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            const detectPitch = Pitchfinder.YIN({ sampleRate: audioContext.sampleRate });
            const float32Array = audioBuffer.getChannelData(0);
            const windowSize = PITCH_WINDOW_SIZE;
            const hopSize = windowSize / PITCH_HOP_SIZE_DIVISOR;
            const pitches = [];

            for (let i = 0; i + windowSize <= float32Array.length; i += hopSize) {
                const pitch = detectPitch(float32Array.slice(i, i + windowSize));
                pitches.push({
                    time: (i / audioContext.sampleRate).toFixed(4),
                    frequency: pitch ? pitch.toFixed(2) : null
                });
            }

            const detectedNotes = segmentPitches(pitches, audioContext.sampleRate, MIN_NOTE_DURATION_SECONDS, FREQUENCY_TOLERANCE_HZ);
            const comparison = compareMultiNoteResponse(currentTargetTriad.notes, detectedNotes, 3);
            setAnalysisResult(comparison);

        } catch (error: unknown) {
            console.error("Analysis Err:", error);
            setAnalysisResult({ match: false, feedback: `Analiz hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}` });
        } finally {
            setIsAnalyzing(false);
        }
    }, [getAudioContext, currentTargetTriad]);

    const startRecording = useCallback(async () => {
        setAnalysisResult(null);
        if (!navigator.mediaDevices?.getUserMedia) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.onstart = () => setIsRecording(true);
            mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setIsRecording(false);
                stream.getTracks().forEach(t => t.stop());
                if (audioBlob.size > 0) analyzeAudio(audioBlob);
            };
            mediaRecorder.start();
        } catch (err) {
            console.error('Mic Err:', err);
            setIsRecording(false);
        }
    }, [analyzeAudio]);

    const stopRecording = () => {
        if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    };

    const handleNext = () => {
        if (analysisResult) {
            const result: RoundResult = {
                round: currentRound,
                targetNotes: currentTargetTriad?.notes.join(', ') || '',
                match: analysisResult.match,
                feedback: analysisResult.feedback
            };
            setRoundResults(prev => [...prev, result]);
        }

        if (currentRound < TRIPLE_NOTE_ROUNDS) {
            setCurrentRound(prev => prev + 1);
            setRestartCounter(prev => prev + 1);
        } else {
            completeTest('triple-note');
            const finalResults = [...roundResults];
            if (analysisResult) {
                finalResults.push({
                    round: currentRound,
                    targetNotes: currentTargetTriad?.notes.join(', ') || '',
                    match: analysisResult.match,
                    feedback: analysisResult.feedback
                });
            }

            saveResult('triple-note', {
                score: (finalResults.filter(r => r.match).length / TRIPLE_NOTE_ROUNDS) * 100,
                totalRounds: TRIPLE_NOTE_ROUNDS,
                correctCount: finalResults.filter(r => r.match).length,
                details: finalResults
            });

            navigate('/atolyeler/muzik/melody');
        }
    };

    return (
        <div className="muzik-section-box">
            <h2 className="text-4xl font-black mb-10 text-center bg-gradient-to-r from-teal-600 to-indigo-600 bg-clip-text text-transparent font-poppins tracking-tight">
                Üç Sesli Akor Tekrarı
            </h2>

            {showStory ? (
                <div className="max-w-2xl mx-auto">
                    {storyStep === 1 ? (
                        <StoryScreen
                            imageUrl={storyImageUrl}
                            text="Bilsem Müzik sınavı - 'Üç Ses Tekrarı'"
                            onPlayAudio={() => { if (!introAudio.current) introAudio.current = new Audio('/ses/6.mp3'); introAudio.current.play(); }}
                            onContinue={() => setStoryStep(2)}
                        />
                    ) : (
                        <StoryScreen
                            imageUrl={storyImageUrl}
                            text="Bu aşamada aynı anda duyacağın üç sesi bize 'na' ya da 'la' hecesiyle tekrar et."
                            onPlayAudio={() => { if (!instructionAudio.current) instructionAudio.current = new Audio('/ses/5.mp3'); instructionAudio.current.play(); }}
                            onContinue={() => setShowStory(false)}
                            continueButtonLabel="Başla"
                        />
                    )}
                </div>
            ) : (
                <div className="max-w-4xl mx-auto pb-12">
                    <ProgressIndicator currentRound={currentRound} totalRounds={TRIPLE_NOTE_ROUNDS} />

                    <div className="flex flex-col items-center gap-6 my-10 p-10 bg-white/40 dark:bg-slate-800/20 backdrop-blur-2xl rounded-[2.5rem] border border-white/30 dark:border-white/5 shadow-2xl">
                        {currentTargetTriad ? (
                            <div className="text-center">
                                <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-[0.2em] mb-2 block">Hedef Akor</span>
                                <div className="text-6xl font-black text-slate-800 dark:text-white mt-1 drop-shadow-sm font-poppins capitalize">
                                    {currentTargetTriad.name}
                                </div>
                                <div className="text-xl text-teal-600 dark:text-teal-400 font-bold font-mono mt-4 px-8 py-3 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full inline-block border border-emerald-500/20">{currentTargetTriad.notes.join(' - ')}</div>
                            </div>
                        ) : <p className="animate-pulse text-indigo-400">Yükleniyor...</p>}

                        <div className="flex flex-wrap justify-center gap-4 mt-4">
                            <button
                                onClick={playTargetTriad}
                                disabled={!isSamplerReady || isPlayingTarget || isRecording || isAnalyzing}
                                className={`py-4 px-10 rounded-2xl font-black transition-all shadow-xl ${isPlayingTarget ? 'bg-emerald-400' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:shadow-emerald-500/20 hover:-translate-y-1'
                                    } text-white disabled:opacity-50`}
                            >
                                {isPlayingTarget ? 'Çalınıyor...' : '1. Hedef Akoru Dinle'}
                            </button>

                            {showRecordInstruction && !isRecording && !isAnalyzing && (
                                <button
                                    onClick={startRecording}
                                    className="py-4 px-10 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white rounded-2xl font-black transition-all shadow-xl hover:-translate-y-1"
                                >
                                    2. Tekrar Etmeye Başla
                                </button>
                            )}

                            {isRecording && (
                                <button onClick={stopRecording} className="py-3 px-8 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold transition-all shadow-lg animate-pulse">
                                    3. Kaydı Durdur
                                </button>
                            )}
                        </div>

                        {isRecording && <RecordingIndicator />}
                        {isAnalyzing && <LoadingIndicator />}
                    </div>

                    {analysisResult && !isAnalyzing && (
                        <div className={`p-6 rounded-2xl border ${analysisResult.match ? 'bg-green-500/10 border-green-500/20 text-green-700' : 'bg-red-500/10 border-red-500/20 text-red-700'} mb-6`}>
                            <p className="font-bold">{analysisResult.feedback}</p>
                            <button onClick={handleNext} className="mt-4 py-2 px-6 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all">
                                {currentRound < TRIPLE_NOTE_ROUNDS ? 'Sonraki Üç Ses' : 'Testi Tamamla'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TripleNotePage;
