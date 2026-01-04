import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAudio } from './contexts/AudioContext';
import { useResults } from './contexts/ResultsContext';
import Pitchfinder from "pitchfinder";
import { NOTE_FREQUENCIES } from './data/targetNotes';
import { songParts } from './data/songPerformanceData';
import { segmentPitches, compareMelodies, MelodyComparison } from './utils/audio';
import {
    PITCH_TOLERANCE_CENTS,
    DURATION_TOLERANCE_RATIO,
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

const SongPerformancePage: React.FC = () => {
    const navigate = useNavigate();
    const { getAudioContext, playNote, isSamplerReady } = useAudio();
    const { saveResult } = useResults();

    const [selectedPartIndex, setSelectedPartIndex] = useState(0);
    const [isPlayingSong, setIsPlayingSong] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordedAudioURL, setRecordedAudioURL] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<MelodyComparison | null>(null);
    const [showStory, setShowStory] = useState(true);
    const [storyStep, setStoryStep] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const introAudio = useRef<HTMLAudioElement | null>(null);
    const instructionAudio = useRef<HTMLAudioElement | null>(null);

    const playSelectedPart = useCallback(() => {
        const audioContext = getAudioContext();
        if (!audioContext || !isSamplerReady || isPlayingSong) return;
        if (audioContext.state === 'suspended') audioContext.resume();

        setIsPlayingSong(true);
        const selectedPart = songParts[selectedPartIndex];
        let currentTime = audioContext.currentTime + 0.1;

        selectedPart.notes.forEach(noteInfo => {
            playNote(noteInfo.note, noteInfo.duration, currentTime);
            currentTime += noteInfo.duration;
        });

        const totalDuration = selectedPart.notes.reduce((sum, note) => sum + note.duration, 0);
        setTimeout(() => {
            setIsPlayingSong(false);
        }, (totalDuration * 1000) + AUDIO_PLAYBACK_BUFFER_MS + 200);

    }, [getAudioContext, playNote, isPlayingSong, selectedPartIndex, isSamplerReady]);

    const playFullSong = useCallback(() => {
        const audioContext = getAudioContext();
        if (!audioContext || !isSamplerReady || isPlayingSong) return;
        if (audioContext.state === 'suspended') audioContext.resume();

        setIsPlayingSong(true);
        let currentTime = audioContext.currentTime + 0.1;

        songParts.forEach(part => {
            part.notes.forEach(noteInfo => {
                playNote(noteInfo.note, noteInfo.duration, currentTime);
                currentTime += noteInfo.duration;
            });
        });

        const totalDuration = songParts.reduce((acc, part) =>
            acc + part.notes.reduce((sum, n) => sum + n.duration, 0), 0
        );

        setTimeout(() => {
            setIsPlayingSong(false);
        }, (totalDuration * 1000) + AUDIO_PLAYBACK_BUFFER_MS + 500);

    }, [getAudioContext, playNote, isPlayingSong, isSamplerReady]);

    const analyzeAudio = useCallback(async (audioBlob: Blob) => {
        setIsAnalyzing(true);
        const audioContext = getAudioContext();
        if (!audioContext) return;

        try {
            const arrayBuffer = await audioBlob.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            const detectPitch = Pitchfinder.YIN({ sampleRate: audioContext.sampleRate });
            const float32Array = audioBuffer.getChannelData(0);

            const pitches = [];
            const hopSize = PITCH_WINDOW_SIZE / PITCH_HOP_SIZE_DIVISOR;
            for (let i = 0; i + PITCH_WINDOW_SIZE <= float32Array.length; i += hopSize) {
                const pitch = detectPitch(float32Array.slice(i, i + PITCH_WINDOW_SIZE));
                pitches.push({
                    time: (i / audioContext.sampleRate).toFixed(4),
                    frequency: pitch ? pitch.toFixed(2) : null
                });
            }

            const detectedNotes = segmentPitches(pitches, audioContext.sampleRate, MIN_NOTE_DURATION_SECONDS, FREQUENCY_TOLERANCE_HZ);
            const selectedPartNotes = songParts[selectedPartIndex].notes;
            const comparison = compareMelodies(
                selectedPartNotes,
                detectedNotes,
                NOTE_FREQUENCIES,
                PITCH_TOLERANCE_CENTS,
                DURATION_TOLERANCE_RATIO,
                MELODY_PITCH_WEIGHT,
                MELODY_DURATION_WEIGHT,
                MELODY_SEQUENCE_WEIGHT
            );

            setAnalysisResult(comparison);
            saveResult('song-performance', {
                score: comparison.overallScore,
                partName: songParts[selectedPartIndex].name,
                details: comparison
            });

        } catch (error) {
            console.error("Song Performance Analysis Err:", error);
        } finally {
            setIsAnalyzing(false);
        }
    }, [getAudioContext, selectedPartIndex, saveResult]);

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

    return (
        <div className="muzik-section-box">
            <h2 className="text-4xl font-black mb-10 text-center bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent font-poppins tracking-tight">
                Şarkı Performansı
            </h2>
            {showStory ? (
                <div className="max-w-2xl mx-auto">
                    {storyStep === 0 ? (
                        <StoryScreen
                            imageUrl={storyImageUrl}
                            text="Bilsem Müzik Sınavı - 'Şarkı Performansı'"
                            onPlayAudio={() => { if (!introAudio.current) introAudio.current = new Audio('/ses/15.mp3'); introAudio.current.play(); }}
                            onContinue={() => setStoryStep(1)}
                        />
                    ) : (
                        <StoryScreen
                            imageUrl={storyImageUrl}
                            text="Bu aşamada Yaşasın Okulumuz şarkısını duyduğun seslerden başlayarak söyle. Bu şarkı farklı tonlarda iki kere yöneltilecek."
                            onPlayAudio={() => { if (!instructionAudio.current) instructionAudio.current = new Audio('/ses/14.mp3'); instructionAudio.current.play(); }}
                            onContinue={() => setShowStory(false)}
                            continueButtonLabel="Başla"
                        />
                    )}
                </div>
            ) : (
                <div className="max-w-4xl mx-auto pb-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                        <div className="p-10 bg-white/40 dark:bg-slate-800/20 backdrop-blur-2xl rounded-[2.5rem] border border-white/30 dark:border-white/5 shadow-2xl">
                            <h3 className="text-xl font-bold mb-6 text-cyan-400">Şarkı Sözleri</h3>
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {songParts.map((part, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedPartIndex(index)}
                                        className={`w-full text-left p-4 rounded-2xl transition-all border ${selectedPartIndex === index
                                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold'
                                            : 'bg-transparent border-transparent text-slate-600 dark:text-slate-400 hover:bg-emerald-500/5'
                                            }`}
                                    >
                                        {part.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-6">
                            <div className="p-8 bg-white/5 rounded-3xl border border-white/10 shadow-xl flex-1 flex flex-col justify-center items-center text-center">
                                <span className="text-xs uppercase font-bold opacity-30 mb-4 tracking-widest">Kontrol Paneli</span>

                                <div className="flex flex-col gap-4 w-full">
                                    <button
                                        onClick={playSelectedPart}
                                        disabled={isPlayingSong || isRecording || isAnalyzing}
                                        className="py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black transition-all shadow-lg hover:-translate-y-1 disabled:opacity-50"
                                    >
                                        {isPlayingSong ? 'Çalınıyor...' : '1. Seçili Dizeyi Dinle'}
                                    </button>

                                    <button
                                        onClick={playFullSong}
                                        disabled={isPlayingSong || isRecording || isAnalyzing}
                                        className="py-4 px-6 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white rounded-2xl font-black transition-all shadow-xl hover:-translate-y-1 disabled:opacity-50"
                                    >
                                        2. Tüm Şarkıyı Dinle
                                    </button>

                                    <div className="h-px bg-white/10 my-2"></div>

                                    {!isRecording ? (
                                        <button
                                            onClick={startRecording}
                                            disabled={isPlayingSong || isAnalyzing}
                                            className="py-4 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-black transition-all shadow-xl hover:-translate-y-1"
                                        >
                                            3. Şarkıyı Söylemeye Başla
                                        </button>
                                    ) : (
                                        <button onClick={stopRecording} className="py-4 px-6 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold transition-all shadow-lg animate-pulse">
                                            Kaydı Durdur
                                        </button>
                                    )}
                                </div>

                                {(isRecording || isAnalyzing) && (
                                    <div className="mt-8 w-full">
                                        {isRecording && <RecordingIndicator />}
                                        {isAnalyzing && <LoadingIndicator />}
                                    </div>
                                )}
                            </div>

                            {recordedAudioURL && !isRecording && !isAnalyzing && (
                                <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                                    <audio controls src={recordedAudioURL} className="w-full"></audio>
                                </div>
                            )}
                        </div>
                    </div>

                    {analysisResult && !isAnalyzing && (
                        <div className={`p-8 rounded-[2.5rem] border ${analysisResult.overallScore >= 80 ? 'bg-green-500/10 border-green-500/20 text-green-700' : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-700'} shadow-2xl`}>
                            <h3 className="text-center text-3xl font-black mb-6 italic tracking-tight underline decoration-indigo-300">
                                Performans Özeti
                            </h3>

                            <div className="grid grid-cols-2 gap-6 mb-8">
                                <div className="bg-white/10 p-4 rounded-2xl text-center">
                                    <div className="text-2xl font-black">%{analysisResult.overallScore.toFixed(0)}</div>
                                    <div className="text-[10px] uppercase font-bold opacity-50">Genel Başarı</div>
                                </div>
                                <div className="bg-white/10 p-4 rounded-2xl text-center">
                                    <div className="text-2xl font-black">{analysisResult.pitchScore.toFixed(0)}</div>
                                    <div className="text-[10px] uppercase font-bold opacity-50">Perde Uyumu</div>
                                </div>
                            </div>

                            <p className="text-center font-medium mb-10 text-lg">"{analysisResult.feedback}"</p>

                            <button
                                onClick={() => navigate('/atolyeler/muzik/melody-difference')}
                                className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl hover:-translate-y-1"
                            >
                                Devam Et
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SongPerformancePage;
