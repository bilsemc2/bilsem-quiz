import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RotateCcw, Play, Star, Heart, ChevronLeft, GitBranch, Loader2, AlertCircle, Sparkles, Eye, Timer as TimerIcon } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useSound } from '../../hooks/useSound';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useExam } from '../../contexts/ExamContext';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';

// ─── Constants ──────────────────────────────────────
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;

interface Option { id: string; text: string; }
interface Question {
    id: number; text: string; options: Option[];
    correct_option_id: string; explanation?: string;
}

const VerbalAnalogyGame: React.FC = () => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const { submitResult } = useExam();
    const { feedbackState, showFeedback, dismissFeedback } = useGameFeedback({ duration: 1500 });
    const location = useLocation();
    const navigate = useNavigate();

    const [gameState, setGameState] = useState<'idle' | 'loading' | 'playing' | 'finished' | 'error'>('idle');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const [streak, setStreak] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [errorMessage, setErrorMessage] = useState('');

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef(0);
    const hasSavedRef = useRef(false);

    const examMode = location.state?.examMode || false;
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

    const fetchQuestions = useCallback(async () => {
        setGameState('loading');
        try {
            const { data, error } = await supabase.from('analoji_sorulari').select('*').limit(100);
            if (error) throw error;
            if (!data || data.length === 0) { setErrorMessage('Soru bulunamadı.'); setGameState('error'); return; }

            const shuffled = data.sort(() => Math.random() - 0.5).slice(0, MAX_LEVEL);
            const labels = ['A', 'B', 'C', 'D'];
            const parsed: Question[] = shuffled.map(q => {
                const opts = [{ o: 'a', t: q.secenek_a }, { o: 'b', t: q.secenek_b }, { o: 'c', t: q.secenek_c }, { o: 'd', t: q.secenek_d }].sort(() => Math.random() - 0.5);
                const corIdx = opts.findIndex(o => o.o === q.dogru_cevap);
                return {
                    id: q.id, text: q.soru_metni,
                    options: opts.map((o, i) => ({ id: labels[i], text: o.t })),
                    correct_option_id: labels[corIdx], explanation: q.aciklama
                };
            });
            setQuestions(parsed);
            setGameState('playing');
        } catch { setErrorMessage('Yükleme hatası.'); setGameState('error'); }
    }, []);

    const startGame = useCallback(() => {
        window.scrollTo(0, 0);
        setScore(0); setLives(INITIAL_LIVES); setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
        setCurrentQuestionIndex(0); setStreak(0); setCorrectCount(0);
        startTimeRef.current = Date.now(); hasSavedRef.current = false;
        fetchQuestions();
    }, [fetchQuestions, examMode, examTimeLimit]);

    useEffect(() => {
        if ((location.state?.autoStart || examMode) && gameState === 'idle') startGame();
    }, [location.state, gameState, startGame, examMode]);

    useEffect(() => {
        if (gameState === 'playing' && timeLeft > 0) {
            timerRef.current = setInterval(() => setTimeLeft(p => {
                if (p <= 1) { clearInterval(timerRef.current!); setGameState('finished'); return 0; }
                return p - 1;
            }), 1000);
            return () => clearInterval(timerRef.current!);
        }
    }, [gameState, timeLeft]);

    const handleFinish = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const victory = correctCount >= 10;

        if (examMode) {
            await submitResult(victory || currentQuestionIndex >= 5, score, MAX_LEVEL * 100, duration);
            navigate("/atolyeler/sinav-simulasyonu/devam");
            return;
        }

        await saveGamePlay({
            game_id: 'sozel-analoji', score_achieved: score, duration_seconds: duration,
            metadata: { level_reached: currentQuestionIndex + 1, victory, correct_count: correctCount }
        });
    }, [gameState, score, currentQuestionIndex, correctCount, saveGamePlay, examMode, submitResult, navigate]);

    useEffect(() => {
        if (gameState === 'finished') handleFinish();
    }, [gameState, handleFinish]);

    const handleAnswer = (ansId: string) => {
        if (feedbackState || !questions[currentQuestionIndex]) return;
        const ok = ansId === questions[currentQuestionIndex].correct_option_id;
        showFeedback(ok);
        playSound(ok ? 'correct' : 'incorrect');

        if (ok) {
            setStreak(p => p + 1); setCorrectCount(p => p + 1);
            setScore(p => p + 100 + (streak * 10));
        } else {
            setStreak(0);
            setLives(l => {
                const nl = l - 1;
                if (nl <= 0) setTimeout(() => setGameState('finished'), 1500);
                return nl;
            });
        }

        setTimeout(() => {
            dismissFeedback();
            if (lives <= 0 && !ok) return;
            if (currentQuestionIndex + 1 >= questions.length) setGameState('finished');
            else setCurrentQuestionIndex(p => p + 1);
        }, 1500);
    };

    const formatText = (t: string) => t.replace(/::/g, ' ▸ ').replace(/:/g, ' → ');
    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    if (gameState === 'idle') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-pink-950 to-rose-950 flex items-center justify-center p-6 text-white relative overflow-hidden">
                <div className="fixed inset-0 pointer-events-none"><div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" /><div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl" /></div>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl relative z-10">
                    <motion.div className="w-28 h-28 rounded-[40%] flex items-center justify-center mx-auto mb-6" style={{ background: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)', boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }} animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}><GitBranch size={52} className="text-white drop-shadow-lg" /></motion.div>
                    <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">Sözel Analoji</h1>
                    <p className="text-slate-400 mb-8 text-lg">Kavramlar arasındaki ilişkiyi bul ve aynı mantığı diğer çifte uygula! Sözel akıl yürütme becerini geliştir.</p>
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                        <h3 className="text-lg font-bold text-pink-300 mb-3 flex items-center gap-2"><Eye size={20} /> Nasıl Oynanır?</h3>
                        <ul className="space-y-2 text-slate-300 text-sm">
                            <li className="flex items-center gap-2"><Sparkles size={14} className="text-pink-400" /><span>İki kelime arasındaki <strong>mantığı</strong> anla</span></li>
                            <li className="flex items-center gap-2"><Sparkles size={14} className="text-pink-400" /><span>Aynı mantıkla eksik parçayı <strong>tamamla</strong></span></li>
                            <li className="flex items-center gap-2"><Sparkles size={14} className="text-pink-400" /><span>5 canın bitmeden 20 soruyu çöz!</span></li>
                        </ul>
                    </div>
                    <div className="bg-pink-500/10 text-pink-300 text-[10px] px-4 py-2 rounded-full mb-6 inline-block border border-pink-500/30 font-bold uppercase tracking-widest">TUZÖ 6.2.1 Sözel Akıl Yürütme</div>
                    <motion.button whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={startGame} className="px-10 py-5 bg-gradient-to-r from-pink-500 to-rose-600 rounded-2xl font-bold text-xl"><div className="flex items-center gap-3"><Play size={28} className="fill-white" /><span>Başla</span></div></motion.button>
                </motion.div>
            </div>
        );
    }

    if (gameState === 'loading') return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 size={48} className="text-pink-400 animate-spin" /></div>;
    if (gameState === 'error') return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-center p-6"><div className="bg-red-500/10 p-8 rounded-3xl border border-red-500/20"><AlertCircle size={48} className="text-red-400 mx-auto mb-4" /><h2 className="text-xl font-bold mb-2">Hata</h2><p className="text-slate-400 mb-6">{errorMessage}</p><Link to={backLink} className="px-6 py-3 bg-red-500 rounded-xl font-bold">Geri Dön</Link></div></div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-pink-950 to-rose-950 text-white relative overflow-hidden">
            <div className="relative z-10 p-4 pt-20">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link to={backLink} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"><ChevronLeft size={20} /><span>{backLabel}</span></Link>
                    {(gameState === 'playing') && (
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)', border: '1px solid rgba(251, 191, 36, 0.3)' }}><Star className="text-amber-400 fill-amber-400" size={18} /><span className="font-bold text-amber-400">{score}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>{Array.from({ length: INITIAL_LIVES }).map((_, i) => (<Heart key={i} size={18} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-900'} />))}</div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.1) 100%)', border: '1px solid rgba(59, 130, 246, 0.3)' }}><TimerIcon className={timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'} size={18} /><span className={`font-bold ${timeLeft < 30 ? 'text-red-400' : 'text-blue-400'}`}>{formatTime(timeLeft)}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(219, 39, 119, 0.1) 100%)', border: '1px solid rgba(236, 72, 153, 0.3)' }}><GitBranch className="text-pink-400" size={18} /><span className="font-bold text-pink-400">{currentQuestionIndex + 1}/{MAX_LEVEL}</span></div>
                        </div>
                    )}
                </div>
            </div>
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-4">
                <AnimatePresence mode="wait">
                    {gameState === 'playing' && questions[currentQuestionIndex] && (
                        <motion.div key="game" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="w-full max-w-2xl text-center">
                            <div className="mb-6 h-2 bg-white/5 rounded-full overflow-hidden"><motion.div className="h-full bg-gradient-to-r from-pink-400 to-rose-400" initial={{ width: 0 }} animate={{ width: `${((currentQuestionIndex + 1) / MAX_LEVEL) * 100}%` }} /></div>
                            <div className="p-10 bg-white/5 backdrop-blur-3xl rounded-[48px] border border-white/10 shadow-3xl mb-8">
                                <p className="text-slate-400 font-bold mb-6 text-lg tracking-wide uppercase">İLİŞKİYİ TAMAMLA</p>
                                <motion.h2 key={currentQuestionIndex} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-2xl lg:text-3xl font-black leading-relaxed">
                                    {formatText(questions[currentQuestionIndex].text).split('?').map((p, i, a) => (
                                        <React.Fragment key={i}>
                                            {p}{i < a.length - 1 && (
                                                <span className={`inline-block px-4 py-1 rounded-xl mx-2 border-2 border-dashed ${feedbackState ? (feedbackState.correct ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-red-500/20 border-red-500 text-red-400') : 'bg-pink-500/10 border-pink-500/50 text-pink-400'}`}>
                                                    {feedbackState ? questions[currentQuestionIndex].options.find(o => o.id === questions[currentQuestionIndex].correct_option_id)?.text : '?'}
                                                </span>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </motion.h2>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {questions[currentQuestionIndex].options.map((opt, _i) => {
                                    const isCor = opt.id === questions[currentQuestionIndex].correct_option_id;
                                    const showR = feedbackState !== null;
                                    return (
                                        <motion.button key={opt.id} whileHover={!showR ? { scale: 1.02, y: -2 } : {}} whileTap={!showR ? { scale: 0.98 } : {}} onClick={() => handleAnswer(opt.id)} disabled={showR} className={`p-6 rounded-3xl flex items-center gap-4 transition-all duration-300 relative overflow-hidden shadow-xl ${showR ? (isCor ? 'bg-emerald-500 border-2 border-white' : 'bg-slate-800 opacity-20') : 'bg-slate-800/80 border border-white/10 hover:border-pink-500/50 hover:text-pink-400'}`}>
                                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xs font-black">{opt.id}</div>
                                            <div className="text-left font-bold tracking-wide text-lg">{opt.text}</div>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                    {gameState === 'finished' && (
                        <motion.div key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-xl">
                            <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-pink-500 to-rose-700 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><Trophy size={48} className="text-white" /></motion.div>
                            <h2 className="text-3xl font-bold text-amber-400 mb-2">{correctCount >= 15 ? '🎖️ Analoji Ustası!' : 'Tebrikler!'}</h2>
                            <p className="text-slate-400 mb-6">{correctCount >= 15 ? 'Sözel akıl yürütme becerin gerçekten inanılmaz!' : 'Daha fazla pratikle analoji becerini geliştirebilirsin.'}</p>
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10"><div className="grid grid-cols-2 gap-4"><div className="text-center"><p className="text-slate-400 text-sm">Skor</p><p className="text-2xl font-bold text-amber-400">{score}</p></div><div className="text-center"><p className="text-slate-400 text-sm">Doğru</p><p className="text-2xl font-bold text-pink-400">{correctCount}/{MAX_LEVEL}</p></div></div></div>
                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={startGame} className="px-10 py-5 bg-gradient-to-r from-pink-500 to-rose-600 rounded-2xl font-bold text-xl mb-4 shadow-2xl"><div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Oyna</span></div></motion.button>
                            <Link to={backLink} className="block text-slate-500 hover:text-white transition-colors">{location.state?.arcadeMode ? 'Bilsem Zeka' : 'Geri Dön'}</Link>
                        </motion.div>
                    )}
                </AnimatePresence>
                <GameFeedbackBanner feedback={feedbackState} />
            </div>
        </div>
    );
};

export default VerbalAnalogyGame;
