import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAudio } from './contexts/AudioContext';
import { useProgress } from './contexts/ProgressContext';
import { useResults } from './contexts/ResultsContext';
import Pitchfinder from "pitchfinder";
import { NOTE_FREQUENCIES, generateRandomMelody, TargetMelody } from './data/targetNotes';
import { segmentPitches, compareMelodies, MelodyComparison } from './utils/audio';
import {
    PITCH_TOLERANCE_CENTS,
    DURATION_TOLERANCE_RATIO,
    MIN_MELODY_NOTES,
    PITCH_WINDOW_SIZE,
    PITCH_HOP_SIZE_DIVISOR,
    MIN_NOTE_DURATION_SECONDS,
    FREQUENCY_TOLERANCE_HZ,
    MELODY_PITCH_WEIGHT,
    MELODY_DURATION_WEIGHT,
    MELODY_SEQUENCE_WEIGHT,
    AUDIO_PLAYBACK_BUFFER_MS
} from './constants';
import { LoadingIndicator, RecordingIndicator, StoryScreen } from './components';
import './muzik.css';

const storyImageUrl = "/images/muzik.webp";

const MelodyPage: React.FC = () => {
    const navigate = useNavigate();
    const { getAudioContext, playNote, isSamplerReady } = useAudio();
    const { completeTest } = useProgress();
    const { saveResult } = useResults();

    const [currentTargetMelody, setCurrentTargetMelody] = useState<TargetMelody | null>(null);
    const [isPlayingMelody, setIsPlayingMelody] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordedAudioURL, setRecordedAudioURL] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<MelodyComparison | null>(null);

    const [showStory, setShowStory] = useState(true);
    const [storyStep, setStoryStep] = useState(1);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const introAudio = useRef<HTMLAudioElement | null>(null);
    const instructionAudio = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Create a random melody for this session
        const notes = generateRandomMelody(MIN_MELODY_NOTES);
        const randomMelody: TargetMelody = {
            id: Date.now(),
            name: "Rastgele Melodi",
            melody: notes
        };
        setCurrentTargetMelody(randomMelody);

        setIsPlayingMelody(false);
        setIsRecording(false);
        setRecordedAudioURL('');
        setIsAnalyzing(false);
        setAnalysisResult(null);
    }, []);

    const playTargetMelody = useCallback(() => {
        if (!currentTargetMelody || !isSamplerReady) return;
        const audioContext = getAudioContext();
        if (!audioContext) return;
        if (audioContext.state === 'suspended') audioContext.resume();

        if (isPlayingMelody) return;
        setIsPlayingMelody(true);

        let currentTime = audioContext.currentTime + 0.2;
        currentTargetMelody.melody.forEach(noteInfo => {
            playNote(noteInfo.note, noteInfo.duration, currentTime);
            currentTime += noteInfo.duration;
        });

        const totalDuration = currentTargetMelody.melody.reduce((sum, n) => sum + n.duration, 0);
        setTimeout(() => {
            setIsPlayingMelody(false);
        }, (totalDuration * 1000) + AUDIO_PLAYBACK_BUFFER_MS + 300);

    }, [getAudioContext, playNote, isPlayingMelody, currentTargetMelody, isSamplerReady]);

    const analyzeAudio = useCallback(async (audioBlob: Blob) => {
        if (!currentTargetMelody) return;
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
            const comparison = compareMelodies(
                currentTargetMelody.melody,
                detectedNotes,
                NOTE_FREQUENCIES,
                PITCH_TOLERANCE_CENTS,
                DURATION_TOLERANCE_RATIO,
                MELODY_PITCH_WEIGHT,
                MELODY_DURATION_WEIGHT,
                MELODY_SEQUENCE_WEIGHT
            );

            if (detectedNotes.length > 0) {
                comparison.detectedNotesString = detectedNotes.map(n =>
                    `${n.noteName || '?'} (${parseFloat(n.duration).toFixed(2)}s)`
                ).join(', ');
            }

            setAnalysisResult(comparison);
            saveResult('melody', comparison);

        } catch (error: unknown) {
            console.error("Melody Analysis Err:", error);
        } finally {
            setIsAnalyzing(false);
        }
    }, [getAudioContext, currentTargetMelody, saveResult]);

    const startRecording = useCallback(async () => {
        setRecordedAudioURL('');
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
                setRecordedAudioURL(URL.createObjectURL(audioBlob));
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
        completeTest('melody');
        navigate('/atolyeler/muzik/melody-difference');
    };

    return (
        <div className="muzik-section-box">
            <h2 className="text-4xl font-black mb-10 text-center bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent font-poppins tracking-tight">
                Melodi Tekrarı
            </h2>
            {showStory ? (
                <div className="max-w-2xl mx-auto">
                    {storyStep === 1 ? (
                        <StoryScreen
                            imageUrl={storyImageUrl}
                            text="Bilsem Müzik Sınavı - 'Melodi Tekrarı'"
                            onPlayAudio={() => { if (!introAudio.current) introAudio.current = new Audio('/ses/8.mp3'); introAudio.current.play(); }}
                            onContinue={() => setStoryStep(2)}
                        />
                    ) : (
                        <StoryScreen
                            imageUrl={storyImageUrl}
                            text="Şimdi bir melodi duyacaksın. Bu melodiyi 'na' veya 'la' hecesiyle tekrar et."
                            onPlayAudio={() => { if (!instructionAudio.current) instructionAudio.current = new Audio('/ses/5.mp3'); instructionAudio.current.play(); }}
                            onContinue={() => setShowStory(false)}
                            continueButtonLabel="Başla"
                        />
                    )}
                </div>
            ) : (
                <div className="max-w-4xl mx-auto pb-12">
                    <div className="flex flex-col items-center gap-6 my-10 p-10 bg-white/40 dark:bg-slate-800/20 backdrop-blur-2xl rounded-[2.5rem] border border-white/30 dark:border-white/5 shadow-2xl">
                        {currentTargetMelody ? (
                            <div className="text-center w-full">
                                <span className="text-sm font-bold text-emerald-400 uppercase tracking-widest">Hedef Melodi</span>
                                <div className="text-xl font-bold text-indigo-900 dark:text-white mt-2 flex flex-wrap justify-center gap-2">
                                    {currentTargetMelody.melody.map((m, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-white/10 rounded-lg text-sm">{m.note}</span>
                                    ))}
                                </div>
                            </div>
                        ) : <p className="animate-pulse text-indigo-400">Yükleniyor...</p>}

                        <div className="flex flex-wrap justify-center gap-4 mt-6">
                            <button
                                onClick={playTargetMelody}
                                disabled={!isSamplerReady || isPlayingMelody || isRecording || isAnalyzing}
                                className={`py-4 px-10 rounded-2xl font-black transition-all shadow-xl ${isPlayingMelody ? 'bg-emerald-400' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:shadow-emerald-500/20 hover:-translate-y-1'
                                    } text-white disabled:opacity-50`}
                            >
                                {isPlayingMelody ? 'Çalınıyor...' : '1. Melodiyi Dinle'}
                            </button>
                            {!isRecording ? (
                                <button
                                    onClick={startRecording}
                                    disabled={!isSamplerReady || isPlayingMelody || isAnalyzing}
                                    className="py-4 px-10 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white rounded-2xl font-black transition-all shadow-xl hover:-translate-y-1 disabled:opacity-50"
                                >
                                    2. Tekrar Etmeye Başla
                                </button>
                            ) : (
                                <button onClick={stopRecording} className="py-3 px-8 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold transition-all shadow-lg animate-pulse">
                                    3. Kaydı Durdur
                                </button>
                            )}
                        </div>

                        {isRecording && <RecordingIndicator />}
                        {isAnalyzing && <LoadingIndicator />}
                    </div>

                    {recordedAudioURL && !isRecording && !isAnalyzing && (
                        <div className="mb-8 p-6 bg-white/5 rounded-2xl border border-white/10">
                            <audio controls src={recordedAudioURL} className="w-full"></audio>
                        </div>
                    )}

                    {analysisResult && !isAnalyzing && (
                        <div className={`p-8 rounded-3xl border ${analysisResult.overallScore >= 80 ? 'bg-green-500/10 border-green-500/20 text-green-700' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-700'} mb-6 shadow-xl`}>
                            <div className="text-center mb-6">
                                <h3 className="text-4xl font-black mb-1">%{analysisResult.overallScore.toFixed(0)}</h3>
                                <p className="text-sm font-bold opacity-60 uppercase tracking-widest">Genel Başarı Skoru</p>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-8">
                                <div className="text-center p-4 bg-white/5 rounded-2xl">
                                    <div className="text-lg font-bold">%{analysisResult.pitchScore.toFixed(0)}</div>
                                    <div className="text-[10px] uppercase font-bold opacity-50">Perde</div>
                                </div>
                                <div className="text-center p-4 bg-white/5 rounded-2xl">
                                    <div className="text-lg font-bold">%{analysisResult.durationScore.toFixed(0)}</div>
                                    <div className="text-[10px] uppercase font-bold opacity-50">Süre</div>
                                </div>
                                <div className="text-center p-4 bg-white/5 rounded-2xl">
                                    <div className="text-lg font-bold">%{analysisResult.sequenceScore.toFixed(0)}</div>
                                    <div className="text-[10px] uppercase font-bold opacity-50">Sıra</div>
                                </div>
                            </div>

                            <p className="text-center font-medium mb-8 leading-relaxed italic opacity-80">"{analysisResult.feedback}"</p>

                            <button onClick={handleNext} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg hover:-translate-y-1">
                                Melodi Farklılıkları Testine Geç
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MelodyPage;
