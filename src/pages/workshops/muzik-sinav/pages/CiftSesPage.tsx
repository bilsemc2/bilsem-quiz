/**
 * Çift Ses Tekrarı — Double Note Repetition Test (6 points)
 * 3 questions × 2 points. Tactile Cyber-Pop aesthetic.
 */

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, ArrowRight, CheckCircle, Sparkles } from 'lucide-react';
import { useMicrophone } from '../hooks/useMicrophone';
import { useExam } from '../contexts/ExamContext';
import { useAIMuzik } from '../contexts/MusicAIContext';
import { MicrophoneButton } from '../components/MicrophoneButton';
import { frequencyToNoteName, noteNameToFrequency } from '../utils/noteUtils';
import { calculatePitchAccuracy } from '../utils/scoring';
import type { TestState } from '../types';

const TOTAL_QUESTIONS = 3;
const POINTS_PER_QUESTION = 2;

export default function CiftSesPage() {
    const ai = useAIMuzik();
    const mic = useMicrophone();
    const { submitModuleScore, isModuleComplete } = useExam();

    const [state, setState] = useState<TestState>({
        phase: 'intro', currentQuestion: 0, totalQuestions: TOTAL_QUESTIONS, score: 0, maxScore: 6,
    });
    const [targetNotes, setTargetNotes] = useState<string[]>([]);
    const [_aiHint, setAiHint] = useState('');
    const [results, setResults] = useState<{ accuracy: number; points: number }[]>([]);

    useEffect(() => { ai.initPiano(); }, []);

    const startQuestion = useCallback(async () => {
        setState((s) => ({ ...s, phase: 'playing' }));
        const content = await ai.requestContent('cift-ses', state.currentQuestion, TOTAL_QUESTIONS);
        const notes = content.notes || ['C4', 'E4'];
        setTargetNotes(notes);
        setAiHint(content.hint || '');
        if (ai.piano?.isReady) ai.piano.playChord(notes, 1.2);
        setTimeout(() => setState((s) => ({ ...s, phase: 'recording' })), 2500);
    }, [ai, state.currentQuestion]);

    const handleMicToggle = useCallback(async () => {
        if (mic.isListening) {
            mic.stopListening();
            setState((s) => ({ ...s, phase: 'analyzing' }));

            const captured = mic.capturedNotes.slice(-2);
            let totalAcc = 0;
            targetNotes.forEach((target, i) => {
                const detected = captured[i] || frequencyToNoteName(mic.currentFrequency || 0);
                totalAcc += calculatePitchAccuracy(noteNameToFrequency(target), noteNameToFrequency(detected));
            });
            const accuracy = Math.round(totalAcc / targetNotes.length);
            const points = accuracy >= 70 ? POINTS_PER_QUESTION : accuracy >= 40 ? 1 : 0;

            setResults((prev) => [...prev, { accuracy, points }]);
            ai.adjustDifficulty(points >= 1);

            // Get audio recording for AI multimodal analysis
            const audioData = await mic.getRecordingBase64();
            ai.requestAnalysis(
                'cift-ses',
                { notes: targetNotes },
                { notes: captured, accuracy },
                state.currentQuestion,
                audioData?.base64,
                audioData?.mimeType,
            ).catch(() => { /* fallback */ });

            const newScore = state.score + points;
            const newQ = state.currentQuestion + 1;
            setState((s) => ({ ...s, phase: 'result', currentQuestion: newQ, score: newScore }));

            if (newQ >= TOTAL_QUESTIONS) {
                submitModuleScore('cift-ses', newScore, `${newQ} sorudan ${newScore} puan`);
            }
            mic.resetCapture();
        } else {
            mic.resetCapture();
            await mic.startListening();
        }
    }, [mic, targetNotes, state.score, state.currentQuestion, submitModuleScore, ai]);

    const completed = isModuleComplete('cift-ses');

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-12 px-6 relative overflow-hidden transition-colors duration-300">
            <div className="max-w-3xl mx-auto space-y-8 relative z-10">
                <div className="bg-white dark:bg-slate-800 p-8 md:p-10 border-3 border-black/10 rounded-2xl shadow-neo-md relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-4 bg-cyber-purple border-b-2 border-black/10" />
                    <div className="mt-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="inline-block px-4 py-2 border border-black/10 rounded-lg font-nunito font-extrabold uppercase tracking-widest bg-white dark:bg-slate-700 text-black dark:text-white text-xs">
                                İşitme Bölümü • 6 Puan
                            </div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-2 bg-cyber-purple/10 border border-cyber-purple/20 rounded-lg">
                                <Sparkles className="w-3.5 h-3.5 text-cyber-purple" strokeWidth={2.5} />
                                <span className="font-nunito font-extrabold text-[10px] uppercase tracking-widest text-cyber-purple">AI Yönetimli</span>
                            </div>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-nunito font-extrabold text-black dark:text-white uppercase tracking-tight leading-none">
                            Çift Ses <span className="text-cyber-purple">Tekrarı</span>
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 font-nunito font-bold text-lg mt-2">
                            AI piyanodan iki ses çalar — sen duyduğun sesleri sırayla tekrar et.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {Array.from({ length: TOTAL_QUESTIONS }).map((_, i) => (
                        <div key={i} className={`h-2.5 flex-1 rounded-full border border-black/5 transition-all duration-500 ${i < state.currentQuestion
                            ? results[i]?.points >= 2 ? 'bg-cyber-emerald' : results[i]?.points >= 1 ? 'bg-cyber-gold' : 'bg-cyber-pink/40'
                            : i === state.currentQuestion && state.phase !== 'intro' ? 'bg-cyber-purple animate-pulse' : 'bg-gray-200 dark:bg-slate-700'
                            }`} />
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {state.phase === 'intro' && !completed && (
                        <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                            className="bg-white dark:bg-slate-800 border-3 border-black/10 rounded-2xl p-8 text-center space-y-6 shadow-neo-sm">
                            <div className="w-20 h-20 mx-auto bg-cyber-purple/10 border-2 border-cyber-purple/20 rounded-2xl flex items-center justify-center text-4xl">🎶</div>
                            <div className="space-y-2">
                                <h2 className="text-xl font-nunito font-extrabold text-black dark:text-white uppercase tracking-wider">Nasıl Çalışır?</h2>
                                <p className="text-slate-500 dark:text-slate-400 font-nunito font-bold text-sm leading-relaxed max-w-sm mx-auto">
                                    İki nota aynı anda çalınır. Duyduğun iki sesi sırayla seslendir.
                                </p>
                            </div>
                            <button onClick={startQuestion}
                                className="inline-flex items-center gap-2 px-8 py-3 bg-cyber-purple text-white border-2 border-black/10 font-nunito font-extrabold text-sm uppercase tracking-widest rounded-xl shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-md transition-all">
                                <Play className="w-4 h-4" strokeWidth={2.5} /> Başla
                            </button>
                        </motion.div>
                    )}

                    {state.phase === 'playing' && (
                        <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="bg-white dark:bg-slate-800 border-3 border-black/10 rounded-2xl p-12 text-center space-y-4 shadow-neo-sm">
                            <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.5, repeat: Infinity }}
                                className="w-16 h-16 mx-auto bg-cyber-purple/10 border-2 border-cyber-purple/20 rounded-full flex items-center justify-center text-3xl">🎶</motion.div>
                            <p className="text-cyber-purple font-nunito font-extrabold text-sm uppercase tracking-widest animate-pulse">İki sesi dinle...</p>
                        </motion.div>
                    )}

                    {state.phase === 'recording' && (
                        <motion.div key="recording" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-slate-800 border-3 border-black/10 rounded-2xl p-8 space-y-8 shadow-neo-sm">
                            <div className="text-center">
                                <span className="text-slate-400 font-nunito font-extrabold text-xs uppercase tracking-widest">
                                    Soru {state.currentQuestion + 1} / {TOTAL_QUESTIONS}
                                </span>
                                <div className="mt-2 flex justify-center gap-3">
                                    {targetNotes.map((n, i) => (
                                        <span key={i} className="text-3xl font-nunito font-extrabold text-cyber-purple">{n}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-col items-center gap-6">
                                <MicrophoneButton isListening={mic.isListening} audioLevel={mic.audioLevel} onClick={handleMicToggle} />
                            </div>
                        </motion.div>
                    )}

                    {state.phase === 'result' && (
                        <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-slate-800 border-3 border-black/10 rounded-2xl p-8 text-center space-y-6 shadow-neo-sm">
                            {results.length > 0 && (() => {
                                const last = results[results.length - 1];
                                return (
                                    <div className="space-y-4">
                                        <div className="text-5xl">{last.points >= 2 ? '🎉' : last.points >= 1 ? '👍' : '💪'}</div>
                                        <div className="text-black dark:text-white font-nunito font-extrabold text-lg">Doğruluk: %{last.accuracy}</div>
                                        <div className={`inline-block px-4 py-2 border-2 rounded-xl font-nunito font-extrabold text-sm ${last.points >= 2 ? 'bg-cyber-emerald/10 border-cyber-emerald/30 text-cyber-emerald' : last.points >= 1 ? 'bg-cyber-gold/10 border-cyber-gold/30 text-cyber-gold' : 'bg-cyber-pink/10 border-cyber-pink/30 text-cyber-pink'
                                            }`}>+{last.points} puan</div>
                                    </div>
                                );
                            })()}
                            <p className="text-slate-400 font-nunito font-extrabold text-sm">Toplam: <span className="text-black dark:text-white">{state.score}/6</span></p>
                            {state.currentQuestion < TOTAL_QUESTIONS ? (
                                <button onClick={startQuestion}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-cyber-purple/10 border-2 border-cyber-purple/20 text-cyber-purple font-nunito font-extrabold text-sm uppercase tracking-widest rounded-xl hover:-translate-y-0.5 transition-all">
                                    <ArrowRight className="w-4 h-4" strokeWidth={2.5} /> Sonraki
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
