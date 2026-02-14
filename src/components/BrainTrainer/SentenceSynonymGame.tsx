import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RotateCcw, Play, Star, Heart, CheckCircle2, XCircle, ChevronLeft, Zap, MessageSquare, Loader2, Sparkles, Eye, Timer as TimerIcon } from 'lucide-react';
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
const GAME_ID = 'cumle-ici-es-anlam';

interface Option { id: string; text: string; }
interface Question { id: number; cumle: string; options: Option[]; correct_option_id: string; dogru_kelime: string; }

const SentenceSynonymGame: React.FC = () => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();
    const navigate = useNavigate();
    const { submitResult } = useExam();
    const { feedbackState, showFeedback, dismissFeedback } = useGameFeedback({ duration: 1500 });

    const [gameState, setGameState] = useState<'idle' | 'loading' | 'playing' | 'finished' | 'error'>('idle');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [wrongCount, setWrongCount] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const [_errorMessage, setErrorMessage] = useState('');

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef(0);
    const hasSavedRef = useRef(false);

    const examMode = location.state?.examMode || false;
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

    const fetchQuestions = useCallback(async () => {
        setGameState('loading');
        try {
            const { data, error } = await supabase.from('cumle_ici_es_anlam_sorulari').select('id, cumle, secenek_a, secenek_b, secenek_c, secenek_d, dogru_cevap, dogru_kelime').limit(100);
            if (error) throw error;
            if (!data || data.length === 0) { setErrorMessage('Soru bulunamadı.'); setGameState('error'); return; }
            const shuffled = data.sort(() => Math.random() - 0.5).slice(0, MAX_LEVEL);
            const labels = ['a', 'b', 'c', 'd'];
            const parsed: Question[] = shuffled.map(q => {
                const raw = [{ id: 'a', t: q.secenek_a }, { id: 'b', t: q.secenek_b }, { id: 'c', t: q.secenek_c }, { id: 'd', t: q.secenek_d }];
                const shuf = raw.sort(() => Math.random() - 0.5);
                const corrIdx = shuf.findIndex(o => o.id === q.dogru_cevap);
                return { id: q.id, cumle: q.cumle, options: shuf.map((o, i) => ({ id: labels[i], text: o.t })), correct_option_id: labels[corrIdx], dogru_kelime: q.dogru_kelime };
            });
            setQuestions(parsed); setGameState('playing');
        } catch { setErrorMessage('Sorular yüklenirken hata oluştu.'); setGameState('error'); }
    }, []);

    const handleStart = useCallback(() => {
        window.scrollTo(0, 0);
        setScore(0); setCorrectCount(0); setWrongCount(0); setLevel(1); setStreak(0); setBestStreak(0); setLives(INITIAL_LIVES);
        setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
        startTimeRef.current = Date.now(); hasSavedRef.current = false;
        fetchQuestions(); playSound('slide');
    }, [fetchQuestions, playSound, examMode, examTimeLimit]);

    useEffect(() => { if ((location.state?.autoStart || examMode) && gameState === 'idle') handleStart(); }, [location.state, gameState, handleStart, examMode]);

    useEffect(() => {
        if (gameState === 'playing' && timeLeft > 0) {
            timerRef.current = setInterval(() => setTimeLeft(p => {
                if (p <= 1) { clearInterval(timerRef.current!); setGameState('finished'); return 0; }
                return p - 1;
            }), 1000);
            return () => clearInterval(timerRef.current!);
        }
    }, [gameState, timeLeft]);

    const handleAnswer = (id: string) => {
        if (feedbackState || !questions[level - 1]) return;
        setSelectedAnswer(id);
        const correct = id === questions[level - 1].correct_option_id;
        playSound(correct ? 'correct' : 'incorrect'); showFeedback(correct);
        if (correct) {
            setCorrectCount(p => p + 1); setStreak(p => { const ns = p + 1; if (ns > bestStreak) setBestStreak(ns); return ns; });
            setScore(p => p + 100 + (streak * 10));
        } else {
            setWrongCount(p => p + 1); setStreak(0); setLives(l => l - 1);
        }
        setTimeout(() => {
            setSelectedAnswer(null); dismissFeedback();
            if (lives <= 1 && !correct) setGameState('finished');
            else if (level >= questions.length) setGameState('finished');
            else setLevel(p => p + 1);
        }, 1500);
    };

    const handleFinish = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (examMode) {
            await submitResult(correctCount >= questions.length / 2, score, MAX_LEVEL * 100, duration);
            navigate('/atolyeler/sinav-simulasyonu/devam'); return;
        }
        await saveGamePlay({ game_id: GAME_ID, score_achieved: score, duration_seconds: duration, metadata: { correct_count: correctCount, level_reached: level, accuracy: Math.round((correctCount / Math.max(1, correctCount + wrongCount)) * 100) } });
    }, [score, correctCount, level, wrongCount, questions.length, saveGamePlay, examMode, submitResult, navigate]);

    useEffect(() => { if (gameState === 'finished') handleFinish(); }, [gameState, handleFinish]);

    const formatSentence = (t: string) => { const m = t.match(/^'(.+?)'\s*cümlesindeki/); return m ? m[1] : t; };
    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    if (gameState === 'idle') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950 to-purple-950 flex items-center justify-center p-6 text-white relative overflow-hidden">
                <div className="fixed inset-0 pointer-events-none"><div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" /><div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" /></div>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl relative z-10">
                    <motion.div className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-violet-400 to-purple-600 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}><MessageSquare size={52} className="text-white drop-shadow-lg" /></motion.div>
                    <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-violet-300 via-purple-300 to-fuchsia-300 bg-clip-text text-transparent">Cümle İçi Eş Anlam</h1>
                    <p className="text-slate-300 mb-8 text-lg">Cümledeki kelimenin eş anlamlısını bul, bağlamsal zekanı kanıtla. Kelimelerin gücünü keşfet!</p>
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                        <h3 className="text-lg font-bold text-violet-300 mb-3 flex items-center gap-2"><Sparkles size={18} /> Nasıl Oynanır?</h3>
                        <ul className="space-y-2 text-slate-300 text-sm">
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-violet-500/30 rounded-full flex items-center justify-center text-[10px]">1</span><span>Cümlede vurgulanan kelimenin <strong>eş anlamlısını</strong> bul</span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-violet-500/30 rounded-full flex items-center justify-center text-[10px]">2</span><span>Aşağıdaki seçeneklerden <strong>en uygun olanı</strong> işaretle</span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-violet-500/30 rounded-full flex items-center justify-center text-[10px]">3</span><span>Hızlı ve doğru cevaplarla <strong>rekor seviyeye</strong> ulaş</span></li>
                        </ul>
                    </div>
                    <div className="bg-violet-500/10 text-violet-300 text-[10px] px-4 py-2 rounded-full mb-6 inline-block border border-violet-500/30 font-bold uppercase tracking-widest">TUZÖ 6.1.2 Sözcük Bilgisi (Bağlam)</div>
                    <motion.button whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl font-bold text-xl shadow-2xl"><div className="flex items-center gap-3"><Play size={28} className="fill-white" /><span>Başla</span></div></motion.button>
                </motion.div>
            </div>
        );
    }

    if (gameState === 'loading') return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-12 h-12 text-violet-400 animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950 to-purple-950 text-white relative overflow-hidden flex flex-col">
            <div className="relative z-10 p-4 pt-20">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link to={backLink} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"><ChevronLeft size={20} /><span>{backLabel}</span></Link>
                    {gameState === 'playing' && (
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30"><Star className="text-amber-400 fill-amber-400" size={18} /><span className="font-bold text-amber-400">{score}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30">{Array.from({ length: INITIAL_LIVES }).map((_, i) => (<Heart key={i} size={18} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-950'} />))}</div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(124, 58, 237, 0.1) 100%)', border: '1px solid rgba(168, 85, 247, 0.3)' }}><TimerIcon className={timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-purple-400'} size={18} /><span className={`font-bold ${timeLeft < 30 ? 'text-red-400' : 'text-purple-400'}`}>{formatTime(timeLeft)}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(124, 58, 237, 0.1) 100%)', border: '1px solid rgba(139, 92, 246, 0.3)' }}><Zap className="text-violet-400" size={18} /><span className="font-bold text-violet-400">Soru {level}/{MAX_LEVEL}</span></div>
                        </div>
                    )}
                </div>
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center p-4 flex-1">
                <AnimatePresence mode="wait">
                    {gameState === 'playing' && questions[level - 1] && (
                        <motion.div key={level} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -50 }} className="w-full max-w-2xl space-y-8">
                            <div className="bg-white/5 backdrop-blur-2xl rounded-[40px] p-10 border border-white/10 shadow-3xl text-center">
                                <p className="text-slate-400 text-sm font-black uppercase tracking-widest mb-6 flex items-center justify-center gap-2"><Eye size={20} className="text-violet-400" /> Bağlamı Çöz</p>
                                <h2 className="text-2xl lg:text-3xl font-black text-white leading-relaxed">"{formatSentence(questions[level - 1].cumle)}"</h2>
                                <div className="mt-6 flex justify-center"><div className="px-4 py-1 bg-violet-500/10 rounded-full border border-violet-500/20 text-[10px] text-violet-300 font-bold uppercase tracking-wider italic">Hangi kelime uygun?</div></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {questions[level - 1].options.map((opt, i) => (
                                    <motion.button key={opt.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} onClick={() => handleAnswer(opt.id)} disabled={!!selectedAnswer} className={`py-6 px-6 rounded-3xl font-black text-xl transition-all shadow-xl flex items-center justify-between group ${selectedAnswer === opt.id ? (opt.id === questions[level - 1].correct_option_id ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-red-500 border-red-400 text-white') : (selectedAnswer && opt.id === questions[level - 1].correct_option_id ? 'bg-emerald-500/20 border-emerald-500 text-white' : 'bg-white/5 border-white/10 hover:bg-white/10')}`} style={{ boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        <span className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-sm uppercase group-hover:bg-white/20 transition-colors">{opt.id}</span>
                                        <span>{opt.text}</span>
                                        <div className="w-10 h-10 flex items-center justify-center">{selectedAnswer === opt.id && (opt.id === questions[level - 1].correct_option_id ? <CheckCircle2 /> : <XCircle />)}</div>
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                    {gameState === 'finished' && (
                        <motion.div key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-xl">
                            <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-violet-500 to-purple-700 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><Trophy size={48} className="text-white" /></motion.div>
                            <h2 className="text-3xl font-black text-violet-400 mb-2">{correctCount >= MAX_LEVEL / 2 ? '🎖️ Dil Uzmanı!' : 'Harika!'}</h2>
                            <p className="text-slate-400 mb-6">{correctCount >= MAX_LEVEL / 2 ? 'Kelimelerin dünyasında gerçek bir rehbersin!' : 'Daha fazla kelime hazinesi için okumaya devam et.'}</p>
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10"><div className="grid grid-cols-2 gap-4"><div className="text-center"><p className="text-slate-400 text-sm font-bold">Skor</p><p className="text-3xl font-black text-amber-400">{score}</p></div><div className="text-center"><p className="text-slate-400 text-sm font-bold">Doğruluk</p><p className="text-3xl font-black text-emerald-400 mt-1">%{Math.round((correctCount / Math.max(1, correctCount + wrongCount)) * 100)}</p></div></div></div>
                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl font-bold text-xl mb-4 shadow-2xl"><div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Oyna</span></div></motion.button>
                            <Link to={backLink} className="block text-slate-500 hover:text-white transition-colors">Geri Dön</Link>
                        </motion.div>
                    )}
                </AnimatePresence>
                <GameFeedbackBanner feedback={feedbackState} />
            </div>
        </div>
    );
};

export default SentenceSynonymGame;
