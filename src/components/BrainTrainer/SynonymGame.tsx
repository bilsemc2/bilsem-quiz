import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Heart, CheckCircle2, XCircle, ChevronLeft,
    BookOpen, AlertCircle, Sparkles, Timer as TimerIcon
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useSound } from '../../hooks/useSound';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useExam } from '../../contexts/ExamContext';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';

// ─── Constants ───────────────────────────────────────────────
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;
const GAME_ID = 'es-anlam';

interface Option { id: string; text: string; }
interface Question { id: number; kelime: string; options: Option[]; correct_option_id: string; es_anlami: string; }
type Phase = 'welcome' | 'loading' | 'playing' | 'feedback' | 'game_over' | 'victory' | 'finished' | 'error';

const SynonymGame: React.FC = () => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const { submitResult } = useExam();
    const { feedbackState, showFeedback, dismissFeedback } = useGameFeedback({ duration: 1500 });
    const location = useLocation();
    const navigate = useNavigate();

    const [phase, setPhase] = useState<Phase>('welcome');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const [streak, setStreak] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState('');

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef(0);
    const hasSavedRef = useRef(false);

    const examMode = location.state?.examMode || false;
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

    const fetchQuestions = useCallback(async () => {
        setPhase('loading');
        try {
            const { data, error } = await supabase.from('es_anlam_sorulari').select('id, kelime, secenek_a, secenek_b, secenek_c, secenek_d, dogru_cevap, es_anlami').limit(100);
            if (error) throw error;
            if (!data || data.length === 0) throw new Error('Soru bulunamadı.');
            const sel = data.sort(() => Math.random() - 0.5).slice(0, MAX_LEVEL);
            const optLabels = ['a', 'b', 'c', 'd'];
            const parsed: Question[] = sel.map(q => {
                const raw = [{ id: 'a', text: q.secenek_a }, { id: 'b', text: q.secenek_b }, { id: 'c', text: q.secenek_c }, { id: 'd', text: q.secenek_d }];
                const shuffled = raw.sort(() => Math.random() - 0.5);
                const corrIdx = shuffled.findIndex(o => o.id === q.dogru_cevap);
                return { id: q.id, kelime: q.kelime, options: shuffled.map((o, i) => ({ id: optLabels[i], text: o.text })), correct_option_id: optLabels[corrIdx], es_anlami: q.es_anlami };
            });
            setQuestions(parsed); setPhase('playing'); startTimeRef.current = Date.now();
        } catch (e: any) { setErrorMessage(e.message || 'Hata oluştu.'); setPhase('error'); }
    }, []);

    const handleStart = useCallback(() => {
        window.scrollTo(0, 0);
        setScore(0); setLives(INITIAL_LIVES); setCurrentIndex(0); setStreak(0); setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
        hasSavedRef.current = false; fetchQuestions(); playSound('slide');
    }, [fetchQuestions, playSound, examMode, examTimeLimit]);

    useEffect(() => { if ((location.state?.autoStart || examMode) && phase === 'welcome') handleStart(); }, [location.state, phase, handleStart, examMode]);

    useEffect(() => {
        if (phase === 'playing' && timeLeft > 0) {
            timerRef.current = setInterval(() => setTimeLeft(p => {
                if (p <= 1) { clearInterval(timerRef.current!); setPhase('game_over'); return 0; }
                return p - 1;
            }), 1000);
            return () => clearInterval(timerRef.current!);
        }
    }, [phase, timeLeft]);

    const handleAnswer = (ansId: string) => {
        if (phase !== 'playing' || selectedAnswer !== null) return;
        setSelectedAnswer(ansId);
        const correct = ansId === questions[currentIndex].correct_option_id;
        showFeedback(correct); playSound(correct ? 'correct' : 'incorrect');
        if (correct) setStreak(p => p + 1); else setStreak(0);
        setTimeout(() => {
            dismissFeedback(); setSelectedAnswer(null);
            if (correct) {
                setScore(p => p + 100 + streak * 10);
                if (currentIndex + 1 >= questions.length) setPhase('victory');
                else setCurrentIndex(p => p + 1);
            } else {
                setLives(l => {
                    const nl = l - 1;
                    if (nl <= 0) setTimeout(() => setPhase('game_over'), 500);
                    else if (currentIndex + 1 >= questions.length) setTimeout(() => setPhase('finished'), 500);
                    else setCurrentIndex(p => p + 1);
                    return nl;
                });
            }
        }, 1500);
    };

    const handleFinish = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (examMode) {
            await submitResult(currentIndex >= 5 || phase === 'victory', score, MAX_LEVEL * 100, duration);
            navigate("/atolyeler/sinav-simulasyonu/devam"); return;
        }
        await saveGamePlay({ game_id: GAME_ID, score_achieved: score, duration_seconds: duration, metadata: { level_reached: currentIndex + 1, victory: phase === 'victory' } });
    }, [phase, score, currentIndex, saveGamePlay, examMode, submitResult, navigate]);

    useEffect(() => { if (phase === 'game_over' || phase === 'victory' || phase === 'finished') handleFinish(); }, [phase, handleFinish]);

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    if (phase === 'welcome') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-950 flex items-center justify-center p-6 text-white relative overflow-hidden">
                <div className="fixed inset-0 pointer-events-none"><div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" /><div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" /></div>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl relative z-10">
                    <motion.div className="w-28 h-28 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-[40%] flex items-center justify-center mx-auto mb-6 shadow-2xl" animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}><BookOpen size={52} className="text-white drop-shadow-lg" /></motion.div>
                    <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent">Eş Anlam</h1>
                    <p className="text-slate-300 mb-8 text-lg">Verilen kelimenin eş anlamlısını bul ve kelime hazneni genişlet. Hızlı ve doğru kararlar vererek en yüksek skora ulaş!</p>
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                        <h3 className="text-lg font-bold text-emerald-300 mb-3 flex items-center gap-2"><Sparkles size={18} /> Nasıl Oynanır?</h3>
                        <ul className="space-y-2 text-slate-300 text-sm">
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-emerald-500/30 rounded-full flex items-center justify-center text-[10px]">1</span><span>Verilen kelimenin <strong>eş anlamlısını</strong> bul</span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-emerald-500/30 rounded-full flex items-center justify-center text-[10px]">2</span><span>Sana sunulan seçeneklerden <strong>doğru olanı</strong> işaretle</span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-emerald-500/30 rounded-full flex items-center justify-center text-[10px]">3</span><span>Hata yapmadan ilerleyerek <strong>seri bonusu</strong> kazan!</span></li>
                        </ul>
                    </div>
                    <div className="bg-emerald-500/10 text-emerald-300 text-[10px] px-4 py-2 rounded-full mb-6 inline-block border border-emerald-500/30 font-bold uppercase tracking-widest">TUZÖ 6.1.1 Sözcük Bilgisi</div>
                    <motion.button whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl font-bold text-xl shadow-2xl"><div className="flex items-center gap-3"><Play size={28} className="fill-white" /><span>Başla</span></div></motion.button>
                </motion.div>
            </div>
        );
    }

    if (phase === 'loading') return <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-950 flex items-center justify-center p-6 text-white"><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full" /></div>;

    if (phase === 'error') return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-950 flex items-center justify-center p-6 text-white">
            <div className="text-center max-w-md bg-white/5 backdrop-blur-xl rounded-[40px] p-8 border border-white/10 shadow-3xl">
                <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Hata Oluştu</h2>
                <p className="text-slate-400 mb-6">{errorMessage}</p>
                <Link to={backLink} className="px-8 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all font-bold">Geri Dön</Link>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-950 text-white relative overflow-hidden flex flex-col">
            <div className="relative z-10 p-4 pt-20">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link to={backLink} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"><ChevronLeft size={20} /><span>{backLabel}</span></Link>
                    {(phase !== 'game_over' && phase !== 'victory' && phase !== 'finished') && (
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)', border: '1px solid rgba(251, 191, 36, 0.3)' }}><Star className="text-amber-400 fill-amber-400" size={18} /><span className="font-bold text-amber-400">{score}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>{Array.from({ length: INITIAL_LIVES }).map((_, i) => (<Heart key={i} size={18} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-900'} />))}</div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.1) 100%)', border: '1px solid rgba(59, 130, 246, 0.3)' }}><TimerIcon className={timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'} size={18} /><span className={`font-bold ${timeLeft < 30 ? 'text-red-400' : 'text-blue-400'}`}>{formatTime(timeLeft)}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)', border: '1px solid rgba(16, 185, 129, 0.3)' }}><BookOpen className="text-emerald-400" size={18} /><span className="font-bold text-emerald-400">{currentIndex + 1}/{questions.length}</span></div>
                        </div>
                    )}
                </div>
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center p-4 flex-1">
                <AnimatePresence mode="wait">
                    {phase === 'playing' && (
                        <motion.div key="game" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full max-w-2xl">
                            <div className="h-3 bg-white/10 rounded-full mb-10 overflow-hidden border border-white/5 p-0.5 shadow-inner leading-none"><motion.div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg" animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} /></div>
                            <div className="bg-white/5 backdrop-blur-2xl rounded-[40px] p-12 mb-8 border border-white/10 shadow-3xl text-center relative overflow-hidden"><div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" /><p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">Bu kelimenin eş anlamlısı nedir?</p><motion.h2 key={currentIndex} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-5xl lg:text-7xl font-black text-emerald-400 drop-shadow-sm">"{questions[currentIndex].kelime}"</motion.h2></div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {questions[currentIndex].options.map((opt, idx) => {
                                    const isSel = selectedAnswer === opt.id; const isCorr = opt.id === questions[currentIndex].correct_option_id;
                                    const state = feedbackState !== null;
                                    return (
                                        <motion.button key={opt.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.1 }} onClick={() => handleAnswer(opt.id)} disabled={state} whileHover={!state ? { scale: 1.02, y: -4 } : {}} whileTap={!state ? { scale: 0.98 } : {}} className="relative py-6 px-8 rounded-3xl font-bold text-xl transition-all border-2 flex items-center justify-between overflow-hidden shadow-lg" style={{ background: state && isCorr ? 'rgba(16, 185, 129, 0.2)' : state && isSel && !isCorr ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.05)', borderColor: state && isCorr ? '#10b981' : state && isSel && !isCorr ? '#ef4444' : 'rgba(255,255,255,0.1)', color: state && isCorr ? '#34d399' : state && isSel && !isCorr ? '#f87171' : 'white' }}>
                                            <span className="flex items-center gap-4"><span className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-sm uppercase font-black text-slate-400">{opt.id}</span><span>{opt.text}</span></span>
                                            {state && isCorr && <CheckCircle2 className="text-emerald-400" size={24} />}
                                            {state && isSel && !isCorr && <XCircle className="text-red-400" size={24} />}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                    {(phase === 'game_over' || phase === 'victory' || phase === 'finished') && (
                        <motion.div key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-xl">
                            <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><Trophy size={48} className="text-white" /></motion.div>
                            <h2 className="text-3xl font-bold text-emerald-400 mb-2">{phase === 'victory' || currentIndex >= 5 ? '🎖️ Kelime Haznesi Ustası!' : 'Tebrikler!'}</h2>
                            <p className="text-slate-400 mb-6">{phase === 'victory' || currentIndex >= 5 ? 'Zengin kelime dağarcığınla harika bir performans sergiledin!' : 'Daha fazla kitap okuyarak ve bulmaca çözerek kelime hazneni geliştirebilirsin.'}</p>
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10"><div className="grid grid-cols-2 gap-4"><div className="text-center"><p className="text-slate-400 text-sm">Skor</p><p className="text-2xl font-bold text-amber-400">{score}</p></div><div className="text-center"><p className="text-slate-400 text-sm">Doğru</p><p className="text-2xl font-bold text-emerald-400">{currentIndex}/{MAX_LEVEL}</p></div></div></div>
                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl font-bold text-xl mb-4 shadow-2xl"><div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Oyna</span></div></motion.button>
                            <Link to={backLink} className="block text-slate-500 hover:text-white transition-colors">Geri Dön</Link>
                        </motion.div>
                    )}
                </AnimatePresence>
                <GameFeedbackBanner feedback={feedbackState} />
            </div>
        </div>
    );
};

export default SynonymGame;
