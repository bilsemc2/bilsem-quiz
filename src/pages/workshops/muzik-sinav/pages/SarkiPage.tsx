/**
 * Şarkı Söyleme — Singing Test (25 points)
 * Voice quality 5p, accuracy 10p, transposition 10p. Tactile Cyber-Pop aesthetic.
 */

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, CheckCircle, Sparkles, Loader2 } from 'lucide-react';
import { useMicrophone } from '../hooks/useMicrophone';
import { useExam } from '../contexts/ExamContext';
import { useAIMuzik } from '../contexts/MusicAIContext';
import { MicrophoneButton } from '../components/MicrophoneButton';

type Phase = 'intro' | 'loading' | 'singing' | 'transpose' | 'result';

export default function SarkiPage() {
    const ai = useAIMuzik();
    const mic = useMicrophone();
    const { submitModuleScore, isModuleComplete } = useExam();

    const [phase, setPhase] = useState<Phase>('intro');
    const [songInfo, setSongInfo] = useState<{ name: string; lyrics: string; melody: string[]; durations: number[] } | null>(null);
    const [scores, setScores] = useState({ voiceQuality: 0, accuracy: 0, transposition: 0 });

    useEffect(() => { ai.initPiano(); }, []);

    const startSinging = useCallback(async () => {
        setPhase('loading');
        const content = await ai.requestContent('sarki', 0, 1);
        const song = content.song || { name: 'Küçük Kurbağa', lyrics: '', melody: ['C4', 'D4', 'E4', 'C4'], durations: [0.4, 0.4, 0.4, 0.4] };
        setSongInfo(song);
        if (ai.piano?.isReady) await ai.piano.playMelody(song.melody, song.durations);
        setPhase('singing');
    }, [ai]);

    const handleSingingToggle = useCallback(async () => {
        if (mic.isListening) {
            mic.stopListening();
            const uniqueNotes = new Set(mic.capturedNotes).size;
            const notesCount = mic.capturedNotes.length;
            const voiceQuality = Math.min(5, Math.round(mic.audioLevel * 2 + uniqueNotes * 0.5));
            const accuracy = Math.min(10, Math.round(notesCount * 0.8 + uniqueNotes * 0.7));
            setScores((s) => ({ ...s, voiceQuality, accuracy }));

            // Get audio recording for AI multimodal voice analysis
            const audioData = await mic.getRecordingBase64();
            if (audioData && songInfo) {
                ai.requestAnalysis(
                    'sarki',
                    { song: songInfo.name, melody: songInfo.melody },
                    { capturedNotes: mic.capturedNotes, voiceQuality, accuracy },
                    0,
                    audioData.base64,
                    audioData.mimeType,
                ).catch(() => { /* fallback */ });
            }

            setPhase('transpose');
            mic.resetCapture();
        } else {
            mic.resetCapture();
            await mic.startListening();
        }
    }, [mic, songInfo, ai]);

    const handleTransposeToggle = useCallback(async () => {
        if (mic.isListening) {
            mic.stopListening();
            const distinctNotes = new Set(mic.capturedNotes).size;
            const transposition = Math.min(10, Math.round(distinctNotes * 1.5 + mic.capturedNotes.length * 0.4));
            const finalScores = { ...scores, transposition };
            setScores(finalScores);

            const totalScore = finalScores.voiceQuality + finalScores.accuracy + finalScores.transposition;
            submitModuleScore('sarki', totalScore, `Ses Rengi: ${finalScores.voiceQuality}, Doğruluk: ${finalScores.accuracy}, Ton: ${finalScores.transposition}`);
            setPhase('result');
            mic.resetCapture();
        } else {
            mic.resetCapture();
            // Play transposed melody
            if (songInfo && ai.piano?.isReady) {
                const transposedMelody = songInfo.melody.map((note) => {
                    return note.replace(/\d/, (d) => String(Math.min(6, Number(d) + 1)));
                });
                await ai.piano.playMelody(transposedMelody, songInfo.durations);
            }
            setTimeout(async () => await mic.startListening(), 1500);
        }
    }, [mic, scores, songInfo, ai, submitModuleScore]);

    const completed = isModuleComplete('sarki');
    const totalScore = scores.voiceQuality + scores.accuracy + scores.transposition;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-12 px-6 relative overflow-hidden transition-colors duration-300">
            <div className="max-w-3xl mx-auto space-y-8 relative z-10">
                <div className="bg-white dark:bg-slate-800 p-8 md:p-10 border-3 border-black/10 rounded-2xl shadow-neo-md relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-4 bg-cyber-gold border-b-2 border-black/10" />
                    <div className="mt-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="inline-block px-4 py-2 border border-black/10 rounded-lg font-nunito font-extrabold uppercase tracking-widest bg-white dark:bg-slate-700 text-black dark:text-white text-xs">
                                Şarkı Söyleme • 25 Puan
                            </div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-2 bg-cyber-purple/10 border border-cyber-purple/20 rounded-lg">
                                <Sparkles className="w-3.5 h-3.5 text-cyber-purple" strokeWidth={2.5} />
                                <span className="font-nunito font-extrabold text-[10px] uppercase tracking-widest text-cyber-purple">AI Yönetimli</span>
                            </div>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-nunito font-extrabold text-black dark:text-white uppercase tracking-tight leading-none">
                            Şarkı <span className="text-cyber-gold">Söyleme</span>
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 font-nunito font-bold text-lg mt-2">
                            AI sana bir şarkı seçer, piyanodan çalar — sen söyle.
                        </p>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {phase === 'intro' && !completed && (
                        <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                            className="bg-white dark:bg-slate-800 border-3 border-black/10 rounded-2xl p-8 text-center space-y-6 shadow-neo-sm">
                            <div className="w-20 h-20 mx-auto bg-cyber-gold/10 border-2 border-cyber-gold/20 rounded-2xl flex items-center justify-center text-4xl">🎤</div>
                            <div className="space-y-2">
                                <h2 className="text-xl font-nunito font-extrabold text-black dark:text-white uppercase tracking-wider">Nasıl Çalışır?</h2>
                                <p className="text-slate-500 dark:text-slate-400 font-nunito font-bold text-sm leading-relaxed max-w-sm mx-auto">
                                    AI sana bir şarkı seçer ve piyanodan çalar. Sen de söyle! Ses rengi (5p), doğruluk (10p) ve ton aktarımı (10p) değerlendirilir.
                                </p>
                            </div>
                            <button onClick={startSinging}
                                className="inline-flex items-center gap-2 px-8 py-3 bg-cyber-gold text-black border-2 border-black/10 font-nunito font-extrabold text-sm uppercase tracking-widest rounded-xl shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-md transition-all">
                                <Play className="w-4 h-4" strokeWidth={2.5} /> Başla
                            </button>
                        </motion.div>
                    )}

                    {phase === 'loading' && (
                        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="bg-white dark:bg-slate-800 border-3 border-black/10 rounded-2xl p-12 text-center space-y-4 shadow-neo-sm">
                            <Loader2 className="w-8 h-8 text-cyber-purple animate-spin mx-auto" strokeWidth={2.5} />
                            <p className="text-cyber-purple font-nunito font-extrabold text-sm uppercase tracking-widest">AI şarkı seçiyor ve piyanodan çalıyor...</p>
                        </motion.div>
                    )}



                    {phase === 'singing' && (
                        <motion.div key="singing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-slate-800 border-3 border-black/10 rounded-2xl p-8 space-y-8 shadow-neo-sm">
                            <div className="text-center space-y-2">
                                <h2 className="text-lg font-nunito font-extrabold text-black dark:text-white uppercase tracking-wider">
                                    "{songInfo?.name || 'Şarkı'}" — Söyle!
                                </h2>
                                {songInfo?.lyrics && <p className="text-slate-400 font-nunito font-bold text-sm whitespace-pre-line max-w-xs mx-auto">{songInfo.lyrics}</p>}
                                <p className="text-slate-400 font-nunito font-bold text-xs">Mikrofona bas ve şarkını söyle.</p>
                            </div>
                            <div className="flex flex-col items-center gap-8">
                                <MicrophoneButton isListening={mic.isListening} audioLevel={mic.audioLevel} onClick={handleSingingToggle} />
                                {mic.isListening && mic.capturedNotes.length > 0 && (
                                    <div className="flex gap-1.5 flex-wrap justify-center">
                                        {mic.capturedNotes.map((n, i) => (
                                            <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                className="px-2 py-1 bg-cyber-gold/10 border border-cyber-gold/20 rounded-md font-nunito font-extrabold text-xs text-cyber-gold">{n}</motion.span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {phase === 'transpose' && (
                        <motion.div key="transpose" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-slate-800 border-3 border-black/10 rounded-2xl p-8 space-y-8 shadow-neo-sm">
                            <div className="text-center space-y-2">
                                <div className="inline-block px-4 py-2 bg-cyber-emerald/10 border-2 border-cyber-emerald/20 rounded-xl font-nunito font-extrabold uppercase tracking-widest text-cyber-emerald text-xs">
                                    Ton Aktarımı
                                </div>
                                <h2 className="text-lg font-nunito font-extrabold text-black dark:text-white uppercase tracking-wider">
                                    Farklı Tonda Söyle
                                </h2>
                                <p className="text-slate-400 font-nunito font-bold text-sm">Bir ton yukarı çalınacak, aynı şarkıyı yeni tonda söyle.</p>
                            </div>
                            <div className="flex flex-col items-center gap-8">
                                <MicrophoneButton
                                    isListening={mic.isListening}
                                    audioLevel={mic.audioLevel}
                                    onClick={handleTransposeToggle}
                                    statusText={mic.isListening ? 'Dinliyor... Kapatmak için Dokun' : 'Ton Değiştirip Söyle'}
                                />
                            </div>
                        </motion.div>
                    )}

                    {phase === 'result' && (
                        <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-slate-800 border-3 border-black/10 rounded-2xl p-8 text-center space-y-6 shadow-neo-sm">
                            <div className="text-5xl">🎤</div>
                            <h2 className="text-xl font-nunito font-extrabold text-black dark:text-white uppercase tracking-wider">Şarkı Sonucu</h2>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 bg-gray-50 dark:bg-slate-700 border-2 border-black/10 rounded-xl">
                                    <div className="text-2xl font-nunito font-extrabold text-cyber-blue">{scores.voiceQuality}</div>
                                    <div className="text-[10px] font-nunito font-extrabold uppercase tracking-widest text-slate-400 mt-1">Ses Rengi /5</div>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-slate-700 border-2 border-black/10 rounded-xl">
                                    <div className="text-2xl font-nunito font-extrabold text-cyber-pink">{scores.accuracy}</div>
                                    <div className="text-[10px] font-nunito font-extrabold uppercase tracking-widest text-slate-400 mt-1">Doğruluk /10</div>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-slate-700 border-2 border-black/10 rounded-xl">
                                    <div className="text-2xl font-nunito font-extrabold text-cyber-emerald">{scores.transposition}</div>
                                    <div className="text-[10px] font-nunito font-extrabold uppercase tracking-widest text-slate-400 mt-1">Ton /10</div>
                                </div>
                            </div>
                            <div className="text-3xl font-nunito font-extrabold text-black dark:text-white">{totalScore}<span className="text-slate-400 text-xl">/25</span></div>
                            <div className="space-y-3">
                                <CheckCircle className="w-8 h-8 text-cyber-emerald mx-auto" strokeWidth={2.5} />
                                <p className="text-cyber-emerald font-nunito font-extrabold uppercase tracking-widest text-sm">Bölüm Tamamlandı!</p>
                            </div>
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
