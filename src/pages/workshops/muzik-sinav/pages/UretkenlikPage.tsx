/**
 * Müzikal Üretkenlik — Musical Creativity Test (15 points)
 * Tactile Cyber-Pop aesthetic.
 */

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, CheckCircle, Sparkles, Loader2 } from 'lucide-react';
import { useMicrophone } from '../hooks/useMicrophone';
import { useExam } from '../contexts/exam/useExam';
import { useAIMuzik } from '../contexts/musicAI/useAIMuzik';
import { MicrophoneButton } from '../components/MicrophoneButton';

const TOTAL_PROMPTS = 2;
type Phase = 'intro' | 'loading' | 'listen' | 'create' | 'result';

export default function UretkenlikPage() {
    const {
        piano,
        initPiano,
        requestContent,
        requestAnalysis
    } = useAIMuzik();
    const mic = useMicrophone();
    const { submitModuleScore, isModuleComplete } = useExam();

    const [phase, setPhase] = useState<Phase>('intro');
    const [currentPrompt, setCurrentPrompt] = useState(0);
    const [scores, setScores] = useState<number[]>([]);
    const [aiTheme, setAiTheme] = useState<{ theme: string; inspiration: string; hints: string[] } | null>(null);

    useEffect(() => { initPiano(); }, [initPiano]);

    const startPrompt = useCallback(async () => {
        setPhase('loading');
        const content = await requestContent('uretkenlik', currentPrompt, TOTAL_PROMPTS);
        const creativity = content.creativity;
        setAiTheme(creativity ? { theme: creativity.theme, inspiration: creativity.inspiration, hints: creativity.hints } : null);

        // Play a half-melody as inspiration
        const inspirationNotes = ['C4', 'E4', 'G4', 'A4'];
        const inspirationDurations = [0.5, 0.5, 0.5, 0.5];
        setPhase('listen');
        if (piano?.isReady) await piano.playMelody(inspirationNotes, inspirationDurations);
        setTimeout(() => setPhase('create'), 800);
    }, [currentPrompt, piano, requestContent]);

    const handleMicToggle = useCallback(async () => {
        if (mic.isListening) {
            mic.stopListening();
            const uniqueNotes = new Set(mic.capturedNotes).size;
            const length = mic.capturedNotes.length;
            const creativityPoints = Math.min(
                currentPrompt === 0 ? 8 : 7,
                Math.round((uniqueNotes * 1.5) + (length * 0.3))
            );
            setScores((prev) => [...prev, creativityPoints]);

            // Get audio recording for AI multimodal creativity analysis
            const audioData = await mic.getRecordingBase64();
            requestAnalysis(
                'uretkenlik',
                { promptIndex: currentPrompt },
                { capturedNotes: mic.capturedNotes, uniqueNotes, length, creativityPoints },
                currentPrompt,
                audioData?.base64,
                audioData?.mimeType,
            ).catch(() => { /* fallback */ });

            if (currentPrompt + 1 >= TOTAL_PROMPTS) {
                const total = [...scores, creativityPoints].reduce((a, b) => a + b, 0);
                submitModuleScore('uretkenlik', Math.min(15, total), `${TOTAL_PROMPTS} görevden ${Math.min(15, total)} puan`);
                setPhase('result');
            } else {
                setCurrentPrompt((p) => p + 1);
                setPhase('intro');
            }
            mic.resetCapture();
        } else {
            mic.resetCapture();
            await mic.startListening();
        }
    }, [currentPrompt, mic, requestAnalysis, scores, submitModuleScore]);

    const completed = isModuleComplete('uretkenlik');
    const totalScore = Math.min(15, scores.reduce((a, b) => a + b, 0));

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-12 px-6 transition-colors duration-300">
            <div className="max-w-3xl mx-auto space-y-8">
                {/* Header */}
                <div className="bg-white dark:bg-slate-800 p-8 md:p-10 border-3 border-black/10 rounded-2xl shadow-neo-md relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-4 bg-cyber-orange border-b-2 border-black/10" />
                    <div className="mt-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="inline-block px-4 py-2 border border-black/10 rounded-lg font-nunito font-extrabold uppercase tracking-widest bg-white dark:bg-slate-700 text-black dark:text-white text-xs">
                                Müzikal Üretkenlik • 15 Puan
                            </div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-2 bg-cyber-purple/10 border border-cyber-purple/20 rounded-lg">
                                <Sparkles className="w-3.5 h-3.5 text-cyber-purple" strokeWidth={2.5} />
                                <span className="font-nunito font-extrabold text-[10px] uppercase tracking-widest text-cyber-purple">AI Yönetimli</span>
                            </div>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-nunito font-extrabold text-black dark:text-white uppercase tracking-tight leading-none">
                            Müzikal <span className="text-cyber-orange">Üretkenlik</span>
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 font-nunito font-bold text-lg mt-2">
                            AI bir tema belirler — sen kendi müzikaliteni göster!
                        </p>
                    </div>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-2">
                    {Array.from({ length: TOTAL_PROMPTS }).map((_, i) => (
                        <div key={i} className={`h-2.5 flex-1 rounded-full border border-black/5 transition-all ${i < currentPrompt || (i === currentPrompt && phase === 'result') ? 'bg-cyber-emerald'
                            : i === currentPrompt ? 'bg-cyber-orange animate-pulse' : 'bg-gray-200 dark:bg-slate-700'
                            }`} />
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {phase === 'intro' && !completed && (
                        <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                            className="bg-white dark:bg-slate-800 border-3 border-black/10 rounded-2xl p-8 text-center space-y-6 shadow-neo-sm">
                            <div className="w-20 h-20 mx-auto bg-cyber-orange/10 border-2 border-cyber-orange/20 rounded-2xl flex items-center justify-center">
                                <Sparkles className="w-8 h-8 text-cyber-orange" strokeWidth={2.5} />
                            </div>
                            <h2 className="text-xl font-nunito font-extrabold text-black dark:text-white uppercase tracking-wider">
                                {currentPrompt === 0 ? 'Nasıl Çalışır?' : `Görev ${currentPrompt + 1}`}
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 font-nunito font-bold text-sm max-w-sm mx-auto">
                                AI sana bir tema ve ilham verir. Kendi yaratıcılığınla müzik yap!
                            </p>
                            <button onClick={startPrompt}
                                className="inline-flex items-center gap-2 px-8 py-3 bg-cyber-orange text-black border-2 border-black/10 font-nunito font-extrabold text-sm uppercase tracking-widest rounded-xl shadow-neo-sm hover:-translate-y-1 transition-all">
                                <Play className="w-4 h-4" strokeWidth={2.5} /> {currentPrompt === 0 ? 'Başla' : 'Devam'}
                            </button>
                        </motion.div>
                    )}

                    {phase === 'loading' && (
                        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="bg-white dark:bg-slate-800 border-3 border-black/10 rounded-2xl p-12 text-center space-y-4 shadow-neo-sm">
                            <Loader2 className="w-8 h-8 text-cyber-purple animate-spin mx-auto" strokeWidth={2.5} />
                            <p className="text-cyber-purple font-nunito font-extrabold text-sm uppercase tracking-widest">AI tema oluşturuyor...</p>
                        </motion.div>
                    )}

                    {phase === 'listen' && (
                        <motion.div key="listen" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="bg-white dark:bg-slate-800 border-3 border-black/10 rounded-2xl p-12 text-center space-y-4 shadow-neo-sm">
                            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6, repeat: Infinity }}
                                className="w-16 h-16 mx-auto bg-cyber-orange/10 border-2 border-cyber-orange/20 rounded-full flex items-center justify-center">
                                <Sparkles className="w-6 h-6 text-cyber-orange" strokeWidth={2.5} />
                            </motion.div>
                            <p className="text-cyber-orange font-nunito font-extrabold text-sm uppercase tracking-widest animate-pulse">Yarım melodiyi dinle...</p>
                        </motion.div>
                    )}

                    {phase === 'create' && (
                        <motion.div key="create" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-slate-800 border-3 border-black/10 rounded-2xl p-8 space-y-8 shadow-neo-sm">
                            <div className="text-center space-y-3">
                                <h2 className="text-lg font-nunito font-extrabold text-black dark:text-white uppercase tracking-wider">Şimdi Sen Tamamla!</h2>
                                {aiTheme && (
                                    <div className="px-4 py-3 bg-cyber-purple/5 border border-cyber-purple/15 rounded-xl space-y-1">
                                        <p className="font-nunito font-extrabold text-sm text-cyber-purple">🎯 Tema: {aiTheme.theme}</p>
                                        <p className="text-slate-400 font-nunito font-bold text-xs italic">{aiTheme.inspiration}</p>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col items-center gap-8">
                                <MicrophoneButton isListening={mic.isListening} audioLevel={mic.audioLevel} onClick={handleMicToggle} />
                                {mic.isListening && mic.capturedNotes.length > 0 && (
                                    <div className="flex gap-2 flex-wrap justify-center">
                                        {mic.capturedNotes.map((n, i) => (
                                            <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                className="px-2 py-1 bg-cyber-orange/10 border border-cyber-orange/20 rounded-md font-nunito font-extrabold text-xs text-cyber-orange">{n}</motion.span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {phase === 'result' && (
                        <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-slate-800 border-3 border-black/10 rounded-2xl p-8 text-center space-y-6 shadow-neo-sm">
                            <div className="text-5xl">✨</div>
                            <h2 className="text-xl font-nunito font-extrabold text-black dark:text-white uppercase tracking-wider">Üretkenlik Sonucu</h2>
                            <div className="text-3xl font-nunito font-extrabold text-black dark:text-white">{totalScore}<span className="text-slate-400 text-xl">/15</span></div>
                            <CheckCircle className="w-8 h-8 text-cyber-emerald mx-auto" strokeWidth={2.5} />
                            <p className="text-cyber-emerald font-nunito font-extrabold uppercase tracking-widest text-sm">Bölüm Tamamlandı!</p>
                        </motion.div>
                    )}

                    {completed && phase === 'intro' && (
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
