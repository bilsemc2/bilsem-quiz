/**
 * Ritim Tekrarı — Rhythm Repetition Test (24 points)
 * 4 questions × 6 points. Tactile Cyber-Pop aesthetic.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, ArrowRight, CheckCircle, Sparkles } from 'lucide-react';
import { useExam } from '../contexts/ExamContext';
import { useAIMuzik } from '../contexts/MusicAIContext';
import { calculateRhythmAccuracy } from '../utils/scoring';
import type { TestState } from '../types';

const TOTAL_QUESTIONS = 4;
const POINTS_PER_QUESTION = 6;


export default function RitimPage() {
    const ai = useAIMuzik();
    const { submitModuleScore, isModuleComplete } = useExam();

    const [state, setState] = useState<TestState>({
        phase: 'intro', currentQuestion: 0, totalQuestions: TOTAL_QUESTIONS, score: 0, maxScore: 24,
    });
    const [targetBeats, setTargetBeats] = useState<number[]>([]);
    const [userBeats, setUserBeats] = useState<number[]>([]);
    const [isTapping, setIsTapping] = useState(false);
    const [results, setResults] = useState<{ accuracy: number; points: number }[]>([]);
    const tapStartRef = useRef<number>(0);

    useEffect(() => { ai.initPiano(); }, []);

    const startQuestion = useCallback(async () => {
        setUserBeats([]);
        setState((s) => ({ ...s, phase: 'playing' }));
        const content = await ai.requestContent('ritim', state.currentQuestion, TOTAL_QUESTIONS);
        const beats = content.rhythm?.beats || [0, 500, 1000, 1500, 2000, 2500];
        setTargetBeats(beats);
        if (ai.piano?.isReady) await ai.piano.playRhythm(beats, content.rhythm?.tempo || 100);
        const totalDuration = Math.max(...beats) + 800;
        setTimeout(() => {
            setState((s) => ({ ...s, phase: 'recording' }));
            setIsTapping(true);
            tapStartRef.current = performance.now();
        }, totalDuration);
    }, [ai, state.currentQuestion]);

    const handleTap = useCallback(async () => {
        if (!isTapping) return;
        const tapTime = performance.now() - tapStartRef.current;
        setUserBeats((prev) => [...prev, Math.round(tapTime)]);
        if (ai.piano?.isReady) ai.piano.playNote('C5', 0.08);
    }, [isTapping, ai]);

    const finishTapping = useCallback(() => {
        setIsTapping(false);
        setState((s) => ({ ...s, phase: 'analyzing' }));

        const accuracy = calculateRhythmAccuracy(targetBeats, userBeats);
        const points = Math.round((accuracy / 100) * POINTS_PER_QUESTION);

        setResults((prev) => [...prev, { accuracy, points }]);
        ai.adjustDifficulty(points >= 4);
        const newScore = state.score + points;
        const newQ = state.currentQuestion + 1;
        setState((s) => ({ ...s, phase: 'result', currentQuestion: newQ, score: newScore }));

        if (newQ >= TOTAL_QUESTIONS) {
            submitModuleScore('ritim', newScore, `${newQ} ritimden ${newScore} puan`);
        }
    }, [targetBeats, userBeats, state.score, state.currentQuestion, submitModuleScore, ai]);

    const completed = isModuleComplete('ritim');

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-12 px-6 relative overflow-hidden transition-colors duration-300">
            <div className="max-w-3xl mx-auto space-y-8 relative z-10">
                <div className="bg-white dark:bg-slate-800 p-8 md:p-10 border-3 border-black/10 rounded-2xl shadow-neo-md relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-4 bg-cyber-pink border-b-2 border-black/10" />
                    <div className="mt-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="inline-block px-4 py-2 border border-black/10 rounded-lg font-nunito font-extrabold uppercase tracking-widest bg-white dark:bg-slate-700 text-black dark:text-white text-xs">
                                İşitme Bölümü • 24 Puan
                            </div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-2 bg-cyber-purple/10 border border-cyber-purple/20 rounded-lg">
                                <Sparkles className="w-3.5 h-3.5 text-cyber-purple" strokeWidth={2.5} />
                                <span className="font-nunito font-extrabold text-[10px] uppercase tracking-widest text-cyber-purple">AI Yönetimli</span>
                            </div>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-nunito font-extrabold text-black dark:text-white uppercase tracking-tight leading-none">
                            Ritim <span className="text-cyber-pink">Tekrarı</span>
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 font-nunito font-bold text-lg mt-2">
                            AI bir ritim oluşturur — dinle ve aynı ritmde vur.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {Array.from({ length: TOTAL_QUESTIONS }).map((_, i) => (
                        <div key={i} className={`h-2.5 flex-1 rounded-full border border-black/5 transition-all duration-500 ${i < state.currentQuestion
                            ? results[i]?.points >= 5 ? 'bg-cyber-emerald' : results[i]?.points >= 3 ? 'bg-cyber-gold' : 'bg-cyber-pink/40'
                            : i === state.currentQuestion && state.phase !== 'intro' ? 'bg-cyber-pink animate-pulse' : 'bg-gray-200 dark:bg-slate-700'
                            }`} />
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {state.phase === 'intro' && !completed && (
                        <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                            className="bg-white dark:bg-slate-800 border-3 border-black/10 rounded-2xl p-8 text-center space-y-6 shadow-neo-sm">
                            <div className="w-20 h-20 mx-auto bg-cyber-pink/10 border-2 border-cyber-pink/20 rounded-2xl flex items-center justify-center text-4xl">🥁</div>
                            <div className="space-y-2">
                                <h2 className="text-xl font-nunito font-extrabold text-black dark:text-white uppercase tracking-wider">Nasıl Çalışır?</h2>
                                <p className="text-slate-500 dark:text-slate-400 font-nunito font-bold text-sm leading-relaxed max-w-sm mx-auto">
                                    Bir ritim kalıbı çalınır. Dinledikten sonra büyük vuruş butonuna dokunarak aynı zamanlamada tekrar et. Bitti? "Bitti" butonuna bas.
                                </p>
                            </div>
                            <button onClick={startQuestion}
                                className="inline-flex items-center gap-2 px-8 py-3 bg-cyber-pink text-white border-2 border-black/10 font-nunito font-extrabold text-sm uppercase tracking-widest rounded-xl shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-md transition-all">
                                <Play className="w-4 h-4" strokeWidth={2.5} /> Başla
                            </button>
                        </motion.div>
                    )}

                    {state.phase === 'playing' && (
                        <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="bg-white dark:bg-slate-800 border-3 border-black/10 rounded-2xl p-12 text-center space-y-4 shadow-neo-sm">
                            <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.5, repeat: Infinity }}
                                className="w-16 h-16 mx-auto bg-cyber-pink/10 border-2 border-cyber-pink/20 rounded-full flex items-center justify-center text-3xl">🥁</motion.div>
                            <p className="text-cyber-pink font-nunito font-extrabold text-sm uppercase tracking-widest animate-pulse">Ritmi dinle...</p>
                        </motion.div>
                    )}

                    {state.phase === 'recording' && (
                        <motion.div key="recording" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-slate-800 border-3 border-black/10 rounded-2xl p-8 space-y-8 shadow-neo-sm">
                            <div className="text-center">
                                <span className="text-slate-400 font-nunito font-extrabold text-xs uppercase tracking-widest">
                                    Ritim {state.currentQuestion + 1} / {TOTAL_QUESTIONS} — Vuruşlar: {userBeats.length}
                                </span>
                            </div>
                            <div className="flex justify-center">
                                <motion.button whileTap={{ scale: 0.85 }} onClick={handleTap}
                                    className="w-32 h-32 rounded-2xl bg-cyber-pink/10 border-4 border-cyber-pink/40 text-4xl
                                        active:bg-cyber-pink active:shadow-neo-md transition-all select-none touch-manipulation shadow-neo-sm">
                                    👋
                                </motion.button>
                            </div>
                            <div className="flex justify-center gap-1.5">
                                {userBeats.map((_, i) => (
                                    <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }}
                                        className="w-3 h-3 bg-cyber-pink rounded-full border border-black/10" />
                                ))}
                            </div>
                            <div className="text-center">
                                <button onClick={finishTapping}
                                    className="px-8 py-3 bg-gray-100 dark:bg-slate-700 border-2 border-black/10 text-black dark:text-white font-nunito font-extrabold text-sm uppercase tracking-widest rounded-xl hover:-translate-y-0.5 transition-all">
                                    ✓ Bitti
                                </button>
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
                                        <div className="text-5xl">{last.points >= 5 ? '🎉' : last.points >= 3 ? '👍' : '💪'}</div>
                                        <div className="text-black dark:text-white font-nunito font-extrabold text-lg">Doğruluk: %{last.accuracy}</div>
                                        <div className={`inline-block px-4 py-2 border-2 rounded-xl font-nunito font-extrabold text-sm ${last.points >= 5 ? 'bg-cyber-emerald/10 border-cyber-emerald/30 text-cyber-emerald' : last.points >= 3 ? 'bg-cyber-gold/10 border-cyber-gold/30 text-cyber-gold' : 'bg-cyber-pink/10 border-cyber-pink/30 text-cyber-pink'
                                            }`}>+{last.points} puan</div>
                                    </div>
                                );
                            })()}
                            <p className="text-slate-400 font-nunito font-extrabold text-sm">Toplam: <span className="text-black dark:text-white">{state.score}/24</span></p>
                            {state.currentQuestion < TOTAL_QUESTIONS ? (
                                <button onClick={startQuestion}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-cyber-pink/10 border-2 border-cyber-pink/20 text-cyber-pink font-nunito font-extrabold text-sm uppercase tracking-widest rounded-xl hover:-translate-y-0.5 transition-all">
                                    <ArrowRight className="w-4 h-4" strokeWidth={2.5} /> Sonraki Ritim
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
