/**
 * Tek Ses Tekrarı — Single Note Repetition Test (10 points)
 * 5 questions × 2 points. AI generates target notes, PianoEngine plays real piano sound.
 */

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, ArrowRight, CheckCircle, Loader2, Sparkles } from 'lucide-react';
import { useMicrophone } from '../hooks/useMicrophone';
import { useExam } from '../contexts/ExamContext';
import { useAIMuzik } from '../contexts/MusicAIContext';
import { MicrophoneButton } from '../components/MicrophoneButton';
import { frequencyToNoteName, noteNameToFrequency } from '../utils/noteUtils';
import { calculatePitchAccuracy } from '../utils/scoring';
import type { TestState } from '../types';

const TOTAL_QUESTIONS = 5;
const POINTS_PER_QUESTION = 2;

export default function TekSesPage() {
    const ai = useAIMuzik();
    const mic = useMicrophone();
    const { submitModuleScore, isModuleComplete } = useExam();

    const [state, setState] = useState<TestState>({
        phase: 'intro', currentQuestion: 0, totalQuestions: TOTAL_QUESTIONS, score: 0, maxScore: 10,
    });
    const [targetNote, setTargetNote] = useState('');
    const [aiHint, setAiHint] = useState('');
    const [results, setResults] = useState<{ note: string; detected: string; accuracy: number; points: number }[]>([]);
    const [aiFeedback, setAiFeedback] = useState<string | null>(null);

    // Init piano on mount
    useEffect(() => {
        ai.initPiano();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const startQuestion = useCallback(async () => {
        setState((s) => ({ ...s, phase: 'playing' }));
        setAiFeedback(null);

        // 1. AI generates the note
        const content = await ai.requestContent('tek-ses', state.currentQuestion, TOTAL_QUESTIONS);
        const note = content.notes?.[0] || 'C4';
        setTargetNote(note);
        setAiHint(content.hint || '');

        // 2. Piano plays it
        if (ai.piano?.isReady) {
            ai.piano.playNote(note, 1.0);
        }

        // 3. Wait for the note to ring, then open microphone
        setTimeout(() => setState((s) => ({ ...s, phase: 'recording' })), 2000);
    }, [ai, state.currentQuestion]);

    const handleMicToggle = useCallback(async () => {
        if (mic.isListening) {
            mic.stopListening();
            setState((s) => ({ ...s, phase: 'analyzing' }));

            const detectedNote = mic.capturedNotes.length > 0
                ? mic.capturedNotes[mic.capturedNotes.length - 1]
                : frequencyToNoteName(mic.currentFrequency || 0);

            const accuracy = calculatePitchAccuracy(noteNameToFrequency(targetNote), noteNameToFrequency(detectedNote));
            const points = accuracy >= 80 ? POINTS_PER_QUESTION : accuracy >= 50 ? 1 : 0;

            setResults((prev) => [...prev, { note: targetNote, detected: detectedNote, accuracy, points }]);
            ai.adjustDifficulty(points >= 1);

            // Get audio recording for AI multimodal analysis
            const audioData = await mic.getRecordingBase64();

            // AI analysis with audio (non-blocking for speed)
            ai.requestAnalysis(
                'tek-ses',
                { note: targetNote },
                { note: detectedNote, accuracy },
                state.currentQuestion,
                audioData?.base64,
                audioData?.mimeType,
            )
                .then((analysis) => setAiFeedback(analysis.encouragement))
                .catch(() => { /* fallback: no feedback */ });

            const newScore = state.score + points;
            const newQ = state.currentQuestion + 1;
            setState((s) => ({ ...s, phase: 'result', currentQuestion: newQ, score: newScore }));

            if (newQ >= TOTAL_QUESTIONS) {
                submitModuleScore('tek-ses', newScore, `${newQ} sorudan ${newScore} puan`);
            }

            mic.resetCapture();
        } else {
            mic.resetCapture();
            await mic.startListening();
        }
    }, [mic, targetNote, state.score, state.currentQuestion, submitModuleScore, ai]);


    const completed = isModuleComplete('tek-ses');

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-12 px-6 relative overflow-hidden transition-colors duration-300">
            <div className="max-w-3xl mx-auto space-y-8 relative z-10">
                {/* Header */}
                <div className="bg-white dark:bg-slate-800 p-8 md:p-10 border-3 border-black/10 rounded-2xl shadow-neo-md relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-4 bg-cyber-blue border-b-2 border-black/10" />
                    <div className="mt-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="inline-block px-4 py-2 border border-black/10 rounded-lg font-nunito font-extrabold uppercase tracking-widest bg-white dark:bg-slate-700 text-black dark:text-white text-xs">
                                İşitme Bölümü • 10 Puan
                            </div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-2 bg-cyber-purple/10 border border-cyber-purple/20 rounded-lg">
                                <Sparkles className="w-3.5 h-3.5 text-cyber-purple" strokeWidth={2.5} />
                                <span className="font-nunito font-extrabold text-[10px] uppercase tracking-widest text-cyber-purple">AI Yönetimli</span>
                            </div>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-nunito font-extrabold text-black dark:text-white uppercase tracking-tight leading-none">
                            Tek Ses <span className="text-cyber-blue">Tekrarı</span>
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 font-nunito font-bold text-lg mt-2">
                            AI piyanodan bir nota çalar — sen dinle ve aynı sesi tekrar et.
                        </p>
                        {/* Difficulty indicator */}
                        <div className="flex items-center gap-1.5 mt-3">
                            <span className="text-slate-400 dark:text-slate-500 font-nunito font-bold text-xs uppercase tracking-wider">Zorluk:</span>
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className={`w-3 h-3 rounded-full border border-black/10 ${i < ai.difficulty ? 'bg-cyber-blue' : 'bg-gray-200 dark:bg-slate-700'}`} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-2">
                    {Array.from({ length: TOTAL_QUESTIONS }).map((_, i) => (
                        <div key={i} className={`h-2.5 flex-1 rounded-full border border-black/5 transition-all duration-500 ${i < state.currentQuestion
                            ? results[i]?.points === 2 ? 'bg-cyber-emerald' : results[i]?.points === 1 ? 'bg-cyber-gold' : 'bg-cyber-pink/40'
                            : i === state.currentQuestion && state.phase !== 'intro' ? 'bg-cyber-blue animate-pulse' : 'bg-gray-200 dark:bg-slate-700'
                            }`} />
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {state.phase === 'intro' && !completed && (
                        <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                            className="bg-white dark:bg-slate-800 border-3 border-black/10 rounded-2xl p-8 text-center space-y-6 shadow-neo-sm">
                            <div className="w-20 h-20 mx-auto bg-cyber-blue/10 border-2 border-cyber-blue/20 rounded-2xl flex items-center justify-center text-4xl">🎹</div>
                            <div className="space-y-2">
                                <h2 className="text-xl font-nunito font-extrabold text-black dark:text-white uppercase tracking-wider">Nasıl Çalışır?</h2>
                                <p className="text-slate-500 dark:text-slate-400 font-nunito font-bold text-sm leading-relaxed max-w-sm mx-auto">
                                    AI her turda sana özel bir piyano notası seçer. Gerçek piyano sesini dinle, mikrofon butonuna bas ve aynı sesi "na" veya "la" hecesiyle söyle.
                                </p>
                            </div>
                            <div className="flex items-center justify-center gap-2 text-xs font-nunito font-extrabold text-slate-400 uppercase tracking-widest">
                                <span className="text-cyber-pink">🎯 5 soru</span> • <span>Her biri 2 puan</span> • <span className="text-cyber-purple">AI adaptif zorluk</span>
                            </div>
                            <button onClick={startQuestion}
                                disabled={ai.isPianoLoading}
                                className="inline-flex items-center gap-2 px-8 py-3 bg-cyber-blue text-black border-2 border-black/10 font-nunito font-extrabold text-sm uppercase tracking-widest rounded-xl shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-md transition-all disabled:opacity-50">
                                {ai.isPianoLoading ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} /> Piyano Yükleniyor...</>
                                ) : (
                                    <><Play className="w-4 h-4" strokeWidth={2.5} /> Başla</>
                                )}
                            </button>
                        </motion.div>
                    )}

                    {state.phase === 'playing' && (
                        <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="bg-white dark:bg-slate-800 border-3 border-black/10 rounded-2xl p-12 text-center space-y-4 shadow-neo-sm">
                            {ai.isGenerating ? (
                                <div className="flex flex-col items-center gap-3">
                                    <Loader2 className="w-8 h-8 text-cyber-purple animate-spin" strokeWidth={2.5} />
                                    <p className="text-cyber-purple font-nunito font-extrabold text-sm uppercase tracking-widest">AI nota seçiyor...</p>
                                </div>
                            ) : (
                                <>
                                    <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.5, repeat: Infinity }}
                                        className="w-16 h-16 mx-auto bg-cyber-blue/10 border-2 border-cyber-blue/20 rounded-full flex items-center justify-center text-3xl">
                                        🎹
                                    </motion.div>
                                    <p className="text-cyber-blue font-nunito font-extrabold text-sm uppercase tracking-widest animate-pulse">Piyanoyu dinle...</p>
                                    {aiHint && (
                                        <p className="text-slate-400 dark:text-slate-500 font-nunito font-bold text-xs italic">{aiHint}</p>
                                    )}
                                </>
                            )}
                        </motion.div>
                    )}

                    {state.phase === 'recording' && (
                        <motion.div key="recording" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-slate-800 border-3 border-black/10 rounded-2xl p-8 space-y-8 shadow-neo-sm">
                            <div className="text-center">
                                <span className="text-slate-400 font-nunito font-extrabold text-xs uppercase tracking-widest">
                                    Soru {state.currentQuestion + 1} / {TOTAL_QUESTIONS}
                                </span>
                                <div className="mt-2 text-4xl font-nunito font-extrabold text-cyber-blue">{targetNote}</div>
                                {aiHint && (
                                    <p className="text-slate-400 dark:text-slate-500 font-nunito font-bold text-xs mt-2 italic">💡 {aiHint}</p>
                                )}
                            </div>
                            <div className="flex flex-col items-center gap-6">
                                <MicrophoneButton isListening={mic.isListening} audioLevel={mic.audioLevel} onClick={handleMicToggle} />
                                {mic.isListening && mic.currentFrequency > 0 && (
                                    <div className="px-4 py-2 bg-cyber-emerald/10 border-2 border-cyber-emerald/20 rounded-xl">
                                        <span className="font-nunito font-extrabold text-sm text-cyber-emerald">
                                            Algılanan: {frequencyToNoteName(mic.currentFrequency)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {state.phase === 'analyzing' && (
                        <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="bg-white dark:bg-slate-800 border-3 border-black/10 rounded-2xl p-12 text-center space-y-4 shadow-neo-sm">
                            <Loader2 className="w-8 h-8 text-cyber-purple animate-spin mx-auto" strokeWidth={2.5} />
                            <p className="text-cyber-purple font-nunito font-extrabold text-sm uppercase tracking-widest">AI analiz ediyor...</p>
                        </motion.div>
                    )}

                    {state.phase === 'result' && (
                        <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-slate-800 border-3 border-black/10 rounded-2xl p-8 text-center space-y-6 shadow-neo-sm">
                            {results.length > 0 && (() => {
                                const last = results[results.length - 1];
                                return (
                                    <div className="space-y-4">
                                        <div className="text-5xl">{last.points === 2 ? '🎉' : last.points === 1 ? '👍' : '💪'}</div>
                                        <div className="space-y-1">
                                            <div className="text-sm font-nunito font-bold text-slate-500 dark:text-slate-400">
                                                Hedef: <span className="text-cyber-blue font-extrabold">{last.note}</span> → Algılanan: <span className="text-cyber-pink font-extrabold">{last.detected}</span>
                                            </div>
                                            <div className="text-black dark:text-white font-nunito font-extrabold text-lg">Doğruluk: %{last.accuracy}</div>
                                        </div>
                                        <div className={`inline-block px-4 py-2 border-2 rounded-xl font-nunito font-extrabold text-sm ${last.points === 2 ? 'bg-cyber-emerald/10 border-cyber-emerald/30 text-cyber-emerald'
                                            : last.points === 1 ? 'bg-cyber-gold/10 border-cyber-gold/30 text-cyber-gold'
                                                : 'bg-cyber-pink/10 border-cyber-pink/30 text-cyber-pink'
                                            }`}>
                                            +{last.points} puan
                                        </div>
                                        {/* AI feedback */}
                                        {aiFeedback && (
                                            <div className="px-4 py-3 bg-cyber-purple/5 border border-cyber-purple/15 rounded-xl">
                                                <div className="flex items-center gap-1.5 justify-center mb-1">
                                                    <Sparkles className="w-3.5 h-3.5 text-cyber-purple" strokeWidth={2.5} />
                                                    <span className="font-nunito font-extrabold text-[10px] uppercase tracking-widest text-cyber-purple">AI Değerlendirme</span>
                                                </div>
                                                <p className="text-slate-600 dark:text-slate-400 font-nunito font-bold text-sm">{aiFeedback}</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                            <p className="text-slate-400 font-nunito font-extrabold text-sm">
                                Toplam: <span className="text-black dark:text-white">{state.score}/10</span>
                            </p>
                            {state.currentQuestion < TOTAL_QUESTIONS ? (
                                <button onClick={startQuestion}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-cyber-blue/10 border-2 border-cyber-blue/20 text-cyber-blue font-nunito font-extrabold text-sm uppercase tracking-widest rounded-xl hover:-translate-y-0.5 transition-all">
                                    <ArrowRight className="w-4 h-4" strokeWidth={2.5} /> Sonraki Nota
                                </button>
                            ) : (
                                <div className="space-y-3">
                                    <CheckCircle className="w-8 h-8 text-cyber-emerald mx-auto" strokeWidth={2.5} />
                                    <p className="text-cyber-emerald font-nunito font-extrabold uppercase tracking-widest text-sm">Bölüm Tamamlandı!</p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {completed && state.phase === 'intro' && (
                        <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="bg-white dark:bg-slate-800 border-3 border-cyber-emerald/30 rounded-2xl p-8 text-center space-y-4 shadow-neo-sm">
                            <CheckCircle className="w-12 h-12 text-cyber-emerald mx-auto" strokeWidth={2.5} />
                            <h2 className="text-xl font-nunito font-extrabold text-black dark:text-white uppercase tracking-wider">Bu bölüm tamamlandı</h2>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
