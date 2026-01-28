import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAudio } from './contexts/AudioContext';
import { useNavigate } from 'react-router-dom';
import Pitchfinder from "pitchfinder";
import { POSSIBLE_TARGET_NOTES, TargetNote } from './data/targetNotes';
import { segmentPitches, compareSingleNote } from './utils/audio';
import {
    TRANSITION_DELAY_MS,
    MIN_NOTE_DURATION_SECONDS,
    FREQUENCY_TOLERANCE_HZ,
    SINGLE_NOTE_ROUNDS,
    PITCH_WINDOW_SIZE,
    PITCH_HOP_SIZE_DIVISOR,
    AUDIO_PLAYBACK_BUFFER_MS
} from './constants';
import { ProgressIndicator, LoadingIndicator, RecordingIndicator, StoryScreen } from './components';
import { useProgress } from './contexts/ProgressContext';
import { useResults } from './contexts/ResultsContext';
import './muzik.css';

const storyImageUrl = "/images/muzik.webp";

interface RoundResult {
    round: number;
    targetNote: string;
    detectedNote: string;
    match: boolean;
    feedback: string;
}

const SingleNotePage: React.FC = () => {
    const navigate = useNavigate();
    const { getAudioContext, playNote } = useAudio();
    const { completeTest } = useProgress();
    const { saveResult } = useResults();

    const [currentTargetNote, setCurrentTargetNote] = useState<TargetNote | null>(null);
    const [isPlayingTarget, setIsPlayingTarget] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordedAudioURL, setRecordedAudioURL] = useState('');
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState('');
    const [currentRound, setCurrentRound] = useState(1);
    const [roundResults, setRoundResults] = useState<RoundResult[]>([]);

    const [showStory, setShowStory] = useState(true);
    const [storyStep, setStoryStep] = useState(1);

    const introAudio = useRef<HTMLAudioElement | null>(null);
    const instructionAudio = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const randomIndex = Math.floor(Math.random() * POSSIBLE_TARGET_NOTES.length);
        const selectedNote = POSSIBLE_TARGET_NOTES[randomIndex];
        setCurrentTargetNote(selectedNote);

        setIsPlayingTarget(false);
        setIsRecording(false);
        setRecordedAudioURL('');
        setIsAnalyzing(false);
        setAnalysisResult('');
    }, [currentRound]);

    const playTargetSingleNote = useCallback(() => {
        if (!currentTargetNote) return;

        const audioContext = getAudioContext();
        if (!audioContext) {
            alert("Ses sistemi başlatılamadı.");
            return;
        }

        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        if (isPlayingTarget) return;

        const noteName = currentTargetNote.note;
        setIsPlayingTarget(true);

        const playStartTime = audioContext.currentTime + 0.1;
        playNote(noteName, currentTargetNote.duration, playStartTime);

        setTimeout(() => {
            setIsPlayingTarget(false);
        }, (currentTargetNote.duration * 1000) + AUDIO_PLAYBACK_BUFFER_MS);

    }, [getAudioContext, playNote, isPlayingTarget, currentTargetNote]);

    const analyzeAudio = useCallback(async (audioBlob: Blob) => {
        if (!currentTargetNote) return;
        setIsAnalyzing(true);
        setAnalysisResult('Analiz ediliyor...');
        const audioContext = getAudioContext();
        if (!audioContext) {
            setAnalysisResult('Analiz Err: Context yok.');
            setIsAnalyzing(false);
            return;
        }

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

            const detectedNotes = segmentPitches(
                pitches,
                audioContext.sampleRate,
                MIN_NOTE_DURATION_SECONDS,
                FREQUENCY_TOLERANCE_HZ
            );

            const comparison = compareSingleNote(currentTargetNote, detectedNotes);
            setAnalysisResult(comparison.feedback);

            const roundResult: RoundResult = {
                round: currentRound,
                targetNote: currentTargetNote.note,
                detectedNote: comparison.detectedNote?.noteName || 'Tespit edilemedi',
                match: comparison.match,
                feedback: comparison.feedback
            };

            setRoundResults(prev => [...prev, roundResult]);

            setTimeout(() => {
                if (currentRound < SINGLE_NOTE_ROUNDS) {
                    setCurrentRound(prevRound => prevRound + 1);
                } else {
                    setAnalysisResult('Uygulama tamamlandı. Sonraki adıma geçiliyor...');

                    const finalResults = [...roundResults, roundResult];
                    const totalCorrect = finalResults.filter(r => r.match).length;

                    saveResult('single-note', {
                        score: (totalCorrect / SINGLE_NOTE_ROUNDS) * 100,
                        totalRounds: SINGLE_NOTE_ROUNDS,
                        correctCount: totalCorrect,
                        details: finalResults
                    });

                    completeTest('single-note');

                    setTimeout(() => {
                        navigate('/atolyeler/muzik/double-note');
                    }, TRANSITION_DELAY_MS);
                }
            }, TRANSITION_DELAY_MS);

        } catch (error: unknown) {
            console.error("Analysis Err:", error);
            setAnalysisResult(`Analiz hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
        } finally {
            setIsAnalyzing(false);
        }
    }, [getAudioContext, currentTargetNote, currentRound, navigate, roundResults, saveResult, completeTest]);

    const startRecording = useCallback(async () => {
        setRecordedAudioURL('');
        setAnalysisResult('');
        setIsAnalyzing(false);

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert('Mikrofon desteklenmiyor.');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.onstart = () => {
                setIsRecording(true);
            };

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const audioUrl = URL.createObjectURL(audioBlob);
                setRecordedAudioURL(audioUrl);
                setIsRecording(false);
                stream.getTracks().forEach(track => track.stop());

                if (audioBlob.size > 0) {
                    analyzeAudio(audioBlob);
                } else {
                    setAnalysisResult("Kayıt boş.");
                }
            };

            mediaRecorder.start();
        } catch (err: unknown) {
            console.error('Mic Err:', err);
            alert(`Mikrofon hatası: ${err instanceof Error ? err.name : 'Bilinmeyen hata'}`);
            setIsRecording(false);
        }
    }, [analyzeAudio]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
    }, []);

    const playIntroSound = () => {
        if (!introAudio.current) {
            introAudio.current = new Audio('/ses/1_.mp3');
        }
        introAudio.current.play().catch(console.error);
    };

    const playInstructionSound = () => {
        if (!instructionAudio.current) {
            instructionAudio.current = new Audio('/ses/3.mp3');
        }
        instructionAudio.current.play().catch(console.error);
    };

    return (
        <div className="muzik-section-box">
            <h2 className="text-4xl font-black mb-10 text-center bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent font-poppins tracking-tight">
                Tek Ses Tekrarı
            </h2>

            {showStory ? (
                <div className="max-w-2xl mx-auto">
                    {storyStep === 1 ? (
                        <StoryScreen
                            imageUrl={storyImageUrl}
                            text="Bilsem Müzik Sınavı - 'Tek Ses Tekrarı'"
                            onPlayAudio={playIntroSound}
                            onContinue={() => setStoryStep(2)}
                        />
                    ) : (
                        <StoryScreen
                            imageUrl={storyImageUrl}
                            text="Şimdi bir ses duyacaksın. Bu sesi 'na' veya 'la' hecesiyle tekrar et."
                            onPlayAudio={playInstructionSound}
                            onContinue={() => setShowStory(false)}
                            continueButtonLabel="Başla"
                        />
                    )}
                </div>
            ) : (
                <div className="max-w-4xl mx-auto pb-12">
                    <ProgressIndicator currentRound={currentRound} totalRounds={SINGLE_NOTE_ROUNDS} />

                    <div className="flex flex-col items-center gap-6 my-10 p-10 bg-white/40 dark:bg-slate-800/20 backdrop-blur-2xl rounded-[2.5rem] border border-white/30 dark:border-white/5 shadow-2xl">
                        {currentTargetNote ? (
                            <div className="text-center">
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] mb-2 block">Hedef Nota</span>
                                <div className="text-7xl font-black text-slate-800 dark:text-white mt-1 drop-shadow-sm font-poppins">
                                    {currentTargetNote.note}
                                </div>
                            </div>
                        ) : (
                            <p className="animate-pulse text-emerald-600 dark:text-emerald-400 font-bold">Hedef nota yükleniyor...</p>
                        )}

                        <div className="flex flex-wrap justify-center gap-4 mt-4">
                            <button
                                onClick={playTargetSingleNote}
                                disabled={!currentTargetNote || isRecording || isPlayingTarget || isAnalyzing}
                                className={`py-4 px-10 rounded-2xl font-black transition-all shadow-xl flex items-center gap-3 ${isPlayingTarget ? 'bg-emerald-400' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:shadow-emerald-500/20 hover:-translate-y-1'
                                    } text-white disabled:opacity-50 disabled:translate-y-0`}
                            >
                                {isPlayingTarget ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Çalınıyor...
                                    </>
                                ) : '1. Hedef Notayı Dinle'}
                            </button>

                            {!isRecording ? (
                                <button
                                    onClick={startRecording}
                                    disabled={!currentTargetNote || isPlayingTarget || isAnalyzing}
                                    className="py-4 px-10 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white rounded-2xl font-black transition-all shadow-xl hover:-translate-y-1 disabled:opacity-50 disabled:translate-y-0"
                                >
                                    2. Tekrar Etmeye Başla
                                </button>
                            ) : (
                                <button
                                    onClick={stopRecording}
                                    className="py-3 px-8 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold transition-all shadow-lg animate-pulse"
                                >
                                    3. Kaydı Durdur
                                </button>
                            )}
                        </div>

                        {isRecording && <RecordingIndicator />}
                        {isAnalyzing && <LoadingIndicator />}
                    </div>

                    {recordedAudioURL && !isRecording && !isAnalyzing && (
                        <div className="mb-8 p-6 bg-indigo-50/5 rounded-2xl border border-indigo-500/10">
                            <p className="text-sm font-bold text-indigo-400 mb-3 uppercase">Kaydınız</p>
                            <audio controls src={recordedAudioURL} className="w-full"></audio>
                        </div>
                    )}

                    {analysisResult && !isAnalyzing && (
                        <div className={`p-6 rounded-2xl border ${analysisResult.includes('Doğru')
                            ? 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400'
                            : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-700 dark:text-indigo-300'
                            }`}>
                            <h4 className="font-bold mb-2 uppercase text-xs tracking-widest">Analiz Sonucu</h4>
                            <p className="text-lg font-medium">{analysisResult}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SingleNotePage;
