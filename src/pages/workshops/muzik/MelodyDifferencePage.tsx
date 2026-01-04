import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAudio } from './contexts/AudioContext';
import { useProgress } from './contexts/ProgressContext';
import { useResults } from './contexts/ResultsContext';
import { melodyDifferenceSets, MelodyDifferenceSet } from './data/melodyDifferenceData';
import { StoryScreen } from './components';
import './muzik.css';

const storyImageUrl = "/images/muzik.webp";

const MelodyDifferencePage: React.FC = () => {
    const navigate = useNavigate();
    const { getAudioContext, playNote, isSamplerReady } = useAudio();
    const { completeTest } = useProgress();
    const { saveResult } = useResults();

    const [currentSetIndex, setCurrentSetIndex] = useState(0);
    const [currentSet, setCurrentSet] = useState<MelodyDifferenceSet | null>(null);
    const [resultMessage, setResultMessage] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [showStory, setShowStory] = useState(true);
    const [storyStep, setStoryStep] = useState(0);

    const melodyResultsRef = useRef<{ setIndex: number; isCorrect: boolean }[]>([]);
    const introAudio = useRef<HTMLAudioElement | null>(null);
    const instructionAudio = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (currentSetIndex < melodyDifferenceSets.length) {
            setCurrentSet(melodyDifferenceSets[currentSetIndex]);
            setResultMessage('');
        } else {
            const results = melodyResultsRef.current;
            const totalCorrect = results.filter(r => r.isCorrect).length;
            const score = (totalCorrect / melodyDifferenceSets.length) * 100;

            saveResult('melody-difference', {
                score,
                totalRounds: melodyDifferenceSets.length,
                correctCount: totalCorrect,
                details: results
            });

            completeTest('melody-difference');
            navigate('/atolyeler/muzik/rhythm-difference');
        }
    }, [currentSetIndex, navigate, completeTest, saveResult]);

    const playSpecificMelody = useCallback(async (melodyIndex: number) => {
        if (!currentSet || isPlaying || !isSamplerReady) return;

        const melody = currentSet.melodies[melodyIndex];
        const audioContext = getAudioContext();
        if (!audioContext) return;
        if (audioContext.state === 'suspended') audioContext.resume();

        setIsPlaying(true);
        let currentTime = audioContext.currentTime + 0.1;
        let totalDuration = 0;

        melody.forEach(noteInfo => {
            playNote(noteInfo.note, noteInfo.duration, currentTime);
            currentTime += noteInfo.duration;
            totalDuration += noteInfo.duration;
        });

        setTimeout(() => {
            setIsPlaying(false);
        }, (totalDuration * 1000) + 200);

    }, [currentSet, isPlaying, getAudioContext, playNote, isSamplerReady]);

    const handleSelection = (selectedIndex: number) => {
        if (!currentSet || resultMessage) return;

        const isCorrect = selectedIndex === currentSet.differentIndex;
        if (isCorrect) {
            setResultMessage('Doğru!');
            melodyResultsRef.current.push({ setIndex: currentSetIndex, isCorrect: true });
        } else {
            setResultMessage(`Yanlış. Farklı olan melodi ${currentSet.differentIndex + 1}. sıradakiydi.`);
            melodyResultsRef.current.push({ setIndex: currentSetIndex, isCorrect: false });
        }
    };

    const loadNextSet = () => {
        setCurrentSetIndex(prev => prev + 1);
    };

    if (!currentSet && currentSetIndex >= melodyDifferenceSets.length) {
        return (
            <div className="muzik-section-box text-center py-20">
                <h2 className="text-3xl font-bold mb-4">Test Bitti!</h2>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
        );
    }

    return (
        <div className="muzik-section-box">
            <h2 className="text-4xl font-black mb-10 text-center bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent font-poppins tracking-tight">
                Melodi Farklılıkları
            </h2>

            {showStory ? (
                <div className="max-w-2xl mx-auto">
                    {storyStep === 0 ? (
                        <StoryScreen
                            imageUrl={storyImageUrl}
                            text="Bilsem Müzik Sınavı - 'Melodi Farklılıkları'"
                            onPlayAudio={() => { if (!introAudio.current) introAudio.current = new Audio('/ses/11.mp3'); introAudio.current.play(); }}
                            onContinue={() => setStoryStep(1)}
                        />
                    ) : (
                        <StoryScreen
                            imageUrl={storyImageUrl}
                            text="Bu aşamada üç farklı melodi duyacaksın. Bunlardan biri diğerlerinden farklı. Dikkatle dinle ve farklı olanı bul."
                            onPlayAudio={() => { if (!instructionAudio.current) instructionAudio.current = new Audio('/ses/12.mp3'); instructionAudio.current.play(); }}
                            onContinue={() => setShowStory(false)}
                            continueButtonLabel="Başla"
                        />
                    )}
                </div>
            ) : (
                <div className="max-w-4xl mx-auto pb-12">
                    <div className="mb-10 text-center">
                        <span className="px-5 py-2 bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-black uppercase tracking-widest border border-emerald-500/20">
                            Soru {currentSetIndex + 1} / {melodyDifferenceSets.length}
                        </span>
                        <p className="text-xl mt-6 text-slate-700 dark:text-slate-300 font-medium">Aşağıdaki melodileri dinleyin ve farklı olanı seçin.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                        {currentSet?.melodies.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => playSpecificMelody(index)}
                                disabled={isPlaying}
                                className={`py-8 px-6 backdrop-blur-2xl rounded-[2rem] font-bold transition-all relative overflow-hidden group border ${isPlaying ? 'bg-white/20 border-white/10 text-emerald-600/50' : 'bg-white/40 dark:bg-slate-800/20 hover:bg-white/60 dark:hover:bg-slate-800/40 border-white/30 dark:border-white/5 shadow-2xl hover:-translate-y-2'
                                    }`}
                            >
                                <span className="relative z-10 flex flex-col items-center gap-3">
                                    <span className="text-[10px] uppercase font-black tracking-[0.2em] opacity-40">Melodi</span>
                                    <span className="text-4xl font-black text-slate-800 dark:text-white">{index + 1}</span>
                                </span>
                                {isPlaying && (
                                    <div className="absolute bottom-0 left-0 h-1.5 bg-emerald-500 animate-[progress_1s_ease-in-out_infinite]" style={{ width: '100%' }}></div>
                                )}
                            </button>
                        ))}
                    </div>

                    {!resultMessage ? (
                        <div className="text-center p-10 bg-white/40 dark:bg-slate-800/20 backdrop-blur-2xl rounded-[2.5rem] border border-white/30 dark:border-white/5 shadow-2xl">
                            <h3 className="text-2xl font-black mb-8 text-slate-800 dark:text-white">Hangisi farklı?</h3>
                            <div className="flex justify-center gap-6">
                                {[0, 1, 2].map((index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleSelection(index)}
                                        disabled={isPlaying}
                                        className="w-20 h-20 rounded-[1.5rem] bg-slate-800 dark:bg-slate-700 text-white font-black text-2xl hover:bg-slate-900 dark:hover:bg-slate-600 transition-all shadow-xl hover:-translate-y-2 active:scale-95 disabled:opacity-50"
                                    >
                                        {index + 1}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className={`p-8 rounded-3xl border ${resultMessage === 'Doğru!' ? 'bg-green-500/10 border-green-500/20 text-green-700' : 'bg-red-500/10 border-red-500/20 text-red-700'} shadow-lg`}>
                            <h3 className="text-2xl font-black mb-4 text-center italic">
                                {resultMessage}
                            </h3>
                            <button
                                onClick={loadNextSet}
                                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg hover:-translate-y-1"
                            >
                                {currentSetIndex < melodyDifferenceSets.length - 1 ? 'Sonraki Soru' : 'Ritim Farklılıkları Testine Geç'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MelodyDifferencePage;
