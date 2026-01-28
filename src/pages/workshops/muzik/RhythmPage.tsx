import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAudio } from './contexts/AudioContext';
import { useProgress } from './contexts/ProgressContext';
import { useResults } from './contexts/ResultsContext';
import {
    generateRhythmPool,
    compareRhythms,
    RhythmTarget
} from './utils/audio';
import {
    RHYTHM_ABS_TOLERANCE_MS,
    RHYTHM_REL_TOLERANCE,
    AUDIO_PLAYBACK_BUFFER_MS
} from './constants';
import { ProgressIndicator, StoryScreen } from './components';
import './muzik.css';

const storyImageUrl = "/images/muzik.webp";
const TAK_SOUND_URL = '/samples/piano/tak.mp3';

const RhythmPage: React.FC = () => {
    const navigate = useNavigate();
    const { getAudioContext } = useAudio();
    const { completeTest } = useProgress();
    const { saveResult } = useResults();

    const [userTaps, setUserTaps] = useState<number[]>([]);
    const [isListening, setIsListening] = useState(false);
    const [isRepeating, setIsRepeating] = useState(false);
    const [comparisonResult, setComparisonResult] = useState<{ score: number; feedback: string; intervalResults: boolean[] } | null>(null);
    const [activeBeatIndex, setActiveBeatIndex] = useState<number | null>(null);
    const [currentTargetRhythm, setCurrentTargetRhythm] = useState<RhythmTarget | null>(null);
    const [currentTargetIntervals, setCurrentTargetIntervals] = useState<number[]>([]);

    const [showStory, setShowStory] = useState(true);
    const [storyStep, setStoryStep] = useState(1);
    const [currentRound, setCurrentRound] = useState(1);
    const totalRounds = 2;

    const repeatStartTimeRef = useRef<number | null>(null);
    const introAudio = useRef<HTMLAudioElement | null>(null);
    const instructionAudio = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const pool = generateRhythmPool(1);
        const selected = pool[0];
        setCurrentTargetRhythm(selected);

        const intervals: number[] = [];
        if (selected && selected.times.length > 1) {
            for (let i = 1; i < selected.times.length; i++) {
                intervals.push((selected.times[i] - selected.times[i - 1]) * 1000);
            }
        }
        setCurrentTargetIntervals(intervals);

        setIsListening(false);
        setIsRepeating(false);
        setUserTaps([]);
        setActiveBeatIndex(null);
        setComparisonResult(null);
    }, [currentRound]);

    const playTakSound = useCallback(() => {
        const takSound = new Audio(TAK_SOUND_URL);
        takSound.play().catch(console.error);
    }, []);

    const playTargetRhythm = useCallback(() => {
        if (!currentTargetRhythm) return;
        const audioContext = getAudioContext();
        if (!audioContext) return;
        if (audioContext.state === 'suspended') audioContext.resume();

        setIsListening(true);
        setIsRepeating(false);
        setUserTaps([]);
        setComparisonResult(null);
        setActiveBeatIndex(null);

        const scheduledPlayTime = audioContext.currentTime + 0.2;
        const now = audioContext.currentTime;

        currentTargetRhythm.times.forEach((beatTime, index) => {
            const absoluteBeatTime = scheduledPlayTime + beatTime;
            const playDelay = Math.max(0, (absoluteBeatTime - now) * 1000);

            setTimeout(() => { playTakSound(); }, playDelay);
            setTimeout(() => { setActiveBeatIndex(index); }, playDelay);
            setTimeout(() => {
                setActiveBeatIndex(prev => prev === index ? null : prev);
            }, playDelay + 150);
        });

        const rhythmDuration = currentTargetRhythm.times[currentTargetRhythm.times.length - 1] * 1000;
        setTimeout(() => {
            setIsListening(false);
            setActiveBeatIndex(null);
        }, rhythmDuration + AUDIO_PLAYBACK_BUFFER_MS + 200);

    }, [getAudioContext, currentTargetRhythm, playTakSound]);

    const handleRhythmTap = useCallback(() => {
        if (!currentTargetRhythm || isListening) return;

        let currentStartTime = repeatStartTimeRef.current;
        let newTaps = [];

        if (!isRepeating) {
            setIsRepeating(true);
            currentStartTime = performance.now();
            repeatStartTimeRef.current = currentStartTime;
            newTaps = [0];
        } else {
            const tapTime = performance.now() - (currentStartTime || 0);
            newTaps = [...userTaps, tapTime];
        }

        setUserTaps(newTaps);
        playTakSound();

        if (newTaps.length === currentTargetRhythm.times.length) {
            const result = compareRhythms(
                newTaps,
                currentTargetIntervals,
                RHYTHM_ABS_TOLERANCE_MS,
                RHYTHM_REL_TOLERANCE,
                currentTargetRhythm.times.length
            );
            setComparisonResult(result);
            setIsRepeating(false);
            repeatStartTimeRef.current = null;
        }
    }, [currentTargetRhythm, isListening, isRepeating, userTaps, currentTargetIntervals, playTakSound]);

    const handleNext = () => {
        if (currentRound < totalRounds) {
            setCurrentRound(prev => prev + 1);
        } else if (comparisonResult) {
            saveResult('rhythm', {
                score: comparisonResult.score,
                totalRounds: totalRounds,
                details: comparisonResult
            });
            completeTest('rhythm');
            navigate('/atolyeler/muzik/melody');
        }
    };

    return (
        <div className="muzik-section-box">
            <h2 className="text-4xl font-black mb-10 text-center bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent font-poppins tracking-tight">
                Ritim Tekrarı
            </h2>

            {showStory ? (
                <div className="max-w-2xl mx-auto">
                    {storyStep === 1 ? (
                        <StoryScreen
                            imageUrl={storyImageUrl}
                            text="Bilsem Müzik Sınavı - 'Ritim Tekrarı'"
                            onPlayAudio={() => { if (!introAudio.current) introAudio.current = new Audio('/ses/7.mp3'); introAudio.current.play(); }}
                            onContinue={() => setStoryStep(2)}
                        />
                    ) : (
                        <StoryScreen
                            imageUrl={storyImageUrl}
                            text="Bu aşamada verilen tartımları dikkatle dinle ardından aynı tartımları kalemle vurarak tekrar et."
                            onPlayAudio={() => { if (!instructionAudio.current) instructionAudio.current = new Audio('/ses/9.mp3'); instructionAudio.current.play(); }}
                            onContinue={() => setShowStory(false)}
                            continueButtonLabel="Başla"
                        />
                    )}
                </div>
            ) : (
                <div className="max-w-4xl mx-auto pb-12">
                    <ProgressIndicator currentRound={currentRound} totalRounds={totalRounds} />

                    <div className="flex flex-col items-center gap-6 my-10 p-10 bg-white/40 dark:bg-slate-800/20 backdrop-blur-2xl rounded-[2.5rem] border border-white/30 dark:border-white/5 shadow-2xl relative overflow-hidden">
                        <div className="flex gap-3 flex-wrap justify-center min-h-[40px]">
                            {currentTargetRhythm?.times.map((_, index) => (
                                <div
                                    key={index}
                                    className={`w-4 h-12 rounded-full transition-all duration-150 ${activeBeatIndex === index
                                        ? 'bg-emerald-500 scale-y-125 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                                        : index < userTaps.length && isRepeating
                                            ? 'bg-teal-500/50'
                                            : 'bg-slate-400/20 dark:bg-white/10'
                                        }`}
                                />
                            ))}
                        </div>

                        <div className="flex flex-wrap justify-center gap-4 mt-8">
                            <button
                                onClick={playTargetRhythm}
                                disabled={isListening || isRepeating}
                                className={`py-4 px-10 rounded-2xl font-black transition-all shadow-xl ${isListening ? 'bg-emerald-400' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:shadow-emerald-500/20 hover:-translate-y-1'
                                    } text-white disabled:opacity-50`}
                            >
                                {isListening ? 'Dinleniyor...' : '1. Hedef Ritmi Dinle'}
                            </button>

                            <button
                                onClick={handleRhythmTap}
                                disabled={isListening || (isRepeating && userTaps.length >= (currentTargetRhythm?.times.length || 0))}
                                className={`py-4 px-10 rounded-2xl font-black transition-all shadow-xl ${isRepeating ? 'bg-emerald-600 animate-pulse' : 'bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 hover:-translate-y-1'
                                    } text-white disabled:opacity-50`}
                            >
                                {isRepeating ? `Vuruş Yap (${userTaps.length}/${currentTargetRhythm?.times.length})` : '2. Ritmi Tekrar Et'}
                            </button>
                        </div>
                    </div>

                    {comparisonResult && !isRepeating && (
                        <div className={`p-8 rounded-3xl border ${comparisonResult.score >= 80
                            ? 'bg-green-500/10 border-green-500/20 text-green-700'
                            : 'bg-orange-500/10 border-orange-500/20 text-orange-700'
                            } mb-6 shadow-lg`}>
                            <h3 className="text-2xl font-black mb-2 text-center uppercase tracking-tighter">
                                Skor: %{comparisonResult.score.toFixed(0)}
                            </h3>
                            <p className="text-center font-medium mb-6 opacity-80">{comparisonResult.feedback}</p>

                            <div className="flex justify-center gap-2 mb-8">
                                {comparisonResult.intervalResults.map((isCorrect: boolean, idx: number) => (
                                    <div
                                        key={idx}
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                            }`}
                                    >
                                        {isCorrect ? '✓' : '✗'}
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={handleNext}
                                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg hover:-translate-y-1"
                            >
                                {currentRound < totalRounds ? 'Sonraki Ritim' : 'Melodi Testine Geç'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default RhythmPage;
