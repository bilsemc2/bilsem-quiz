import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAudio } from './contexts/AudioContext';
import { useProgress } from './contexts/ProgressContext';
import { useResults } from './contexts/ResultsContext';
import { generateRhythmDifferenceSets, RhythmDifferenceSet } from './utils/audio';
import { StoryScreen } from './components';
import './muzik.css';

const storyImageUrl = "/images/muzik.webp";
const TAK_SOUND_URL = '/samples/piano/tak.mp3';

const RhythmDifferencePage: React.FC = () => {
    const navigate = useNavigate();
    const { getAudioContext } = useAudio();
    const { completeTest } = useProgress();
    const { saveResult } = useResults();

    const [showStory, setShowStory] = useState(true);
    const [storyStep, setStoryStep] = useState(0);
    const [currentSetIndex, setCurrentSetIndex] = useState(0);
    const [rhythmSets] = useState<RhythmDifferenceSet[]>(() => generateRhythmDifferenceSets(3));
    const [currentSet, setCurrentSet] = useState<RhythmDifferenceSet | null>(null);
    const [resultMessage, setResultMessage] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);

    const rhythmResultsRef = useRef<{ setIndex: number; isCorrect: boolean }[]>([]);
    const introAudio = useRef<HTMLAudioElement | null>(null);
    const instructionAudio = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (currentSetIndex < rhythmSets.length) {
            setCurrentSet(rhythmSets[currentSetIndex]);
            setResultMessage('');
            setIsPlaying(false);
        } else {
            const results = rhythmResultsRef.current;
            const totalCorrect = results.filter(r => r.isCorrect).length;

            saveResult('rhythm-difference', {
                score: (totalCorrect / rhythmSets.length) * 100,
                totalRounds: rhythmSets.length,
                correctCount: totalCorrect,
                details: results
            });

            completeTest('rhythm-difference');
            navigate('/atolyeler/muzik/song-performance');
        }
    }, [currentSetIndex, rhythmSets, navigate, completeTest, saveResult]);

    const playSpecificRhythm = useCallback(async (rhythmIndex: number) => {
        if (!currentSet || isPlaying) return;

        const audioContext = getAudioContext();
        if (!audioContext) return;
        if (audioContext.state === 'suspended') await audioContext.resume();

        const rhythmTimes = currentSet.rhythms[rhythmIndex];
        setIsPlaying(true);

        const playTakSound = (delay: number) => {
            setTimeout(() => {
                const takSound = new Audio(TAK_SOUND_URL);
                takSound.play().catch(console.error);
            }, delay * 1000);
        };

        let maxTime = 0;
        rhythmTimes.forEach(beatTime => {
            playTakSound(beatTime);
            if (beatTime > maxTime) maxTime = beatTime;
        });

        setTimeout(() => {
            setIsPlaying(false);
        }, (maxTime * 1000) + 500);
    }, [currentSet, isPlaying, getAudioContext]);

    const handleSelection = (selectedIndex: number) => {
        if (!currentSet || resultMessage || isPlaying) return;

        if (selectedIndex === currentSet.differentIndex) {
            setResultMessage('Doğru!');
            rhythmResultsRef.current.push({ setIndex: currentSetIndex, isCorrect: true });
        } else {
            setResultMessage(`Yanlış. Farklı olan ritim ${currentSet.differentIndex + 1}. sıradakiydi.`);
            rhythmResultsRef.current.push({ setIndex: currentSetIndex, isCorrect: false });
        }
    };

    const loadNextSet = () => {
        setCurrentSetIndex(prev => prev + 1);
    };

    return (
        <div className="muzik-section-box">
            <h2 className="text-4xl font-black mb-10 text-center bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent font-poppins tracking-tight">
                Ritim Farklılıkları
            </h2>

            {showStory ? (
                <div className="max-w-2xl mx-auto">
                    {storyStep === 0 ? (
                        <StoryScreen
                            imageUrl={storyImageUrl}
                            text="Bilsem Müzik Sınavı - 'Ritim Farklılıkları'"
                            onPlayAudio={() => { if (!introAudio.current) introAudio.current = new Audio('/ses/10.mp3'); introAudio.current.play(); }}
                            onContinue={() => setStoryStep(1)}
                        />
                    ) : (
                        <StoryScreen
                            imageUrl={storyImageUrl}
                            text="Bu bölümde tartım kalıplarından oluşan soru dinleyeceğiz ancak biri diğerlerine göre biraz farklı. Hangisinin farklı olduğunu bulup bize numarasını söyler misin?"
                            onPlayAudio={() => { if (!instructionAudio.current) instructionAudio.current = new Audio('/ses/13.mp3'); instructionAudio.current.play(); }}
                            onContinue={() => setShowStory(false)}
                            continueButtonLabel="Başla"
                        />
                    )}
                </div>
            ) : (
                <div className="max-w-4xl mx-auto pb-12">
                    <div className="mb-10 text-center">
                        <span className="px-5 py-2 bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-black uppercase tracking-widest border border-emerald-500/20">
                            Soru {currentSetIndex + 1} / {rhythmSets.length}
                        </span>
                        <p className="text-xl mt-6 text-slate-700 dark:text-slate-300 font-medium">Ritimleri dinleyin ve farklı olanı bulun.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
                        {currentSet?.rhythms.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => playSpecificRhythm(index)}
                                disabled={isPlaying}
                                className={`group py-12 px-6 backdrop-blur-2xl rounded-[2.5rem] font-bold transition-all relative overflow-hidden flex flex-col items-center gap-4 border ${isPlaying
                                    ? 'bg-white/20 border-white/10 text-emerald-600/50'
                                    : 'bg-white/40 dark:bg-slate-800/20 hover:bg-white/60 dark:hover:bg-slate-800/40 border-white/30 dark:border-white/5 shadow-2xl hover:-translate-y-2'
                                    }`}
                            >
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isPlaying ? 'bg-emerald-200/50' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                    }`}>
                                    <span className="text-3xl font-black">{index + 1}</span>
                                </div>
                                <span className="uppercase tracking-[0.2em] text-[10px] opacity-50 font-black">Ritim Kalıbı</span>
                                {isPlaying && (
                                    <div className="absolute inset-0 bg-emerald-400/5 animate-pulse"></div>
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
                        <div className={`p-10 rounded-[2.5rem] border ${resultMessage === 'Doğru!' ? 'bg-green-500/10 border-green-500/20 text-green-700' : 'bg-red-500/10 border-red-500/20 text-red-700'} shadow-2xl`}>
                            <h3 className="text-3xl font-black mb-8 text-center italic tracking-tight">
                                {resultMessage}
                            </h3>
                            <button
                                onClick={loadNextSet}
                                className="w-full py-5 bg-orange-600 text-white rounded-2xl font-bold hover:bg-orange-700 transition-all shadow-xl hover:-translate-y-1"
                            >
                                {currentSetIndex < rhythmSets.length - 1 ? 'Sonraki Soru' : 'Şarkı Söyleme Testine Geç'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default RhythmDifferencePage;
