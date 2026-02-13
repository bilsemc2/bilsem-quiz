import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RotateCcw, Play, Star, Heart, ChevronLeft, Zap, Smile, Timer as TimerIcon, Sparkles, Eye } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSound } from '../../hooks/useSound';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useExam } from '../../contexts/ExamContext';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';

// ─── Constants ──────────────────────────────────────
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;

const EMOTIONS = [
    { id: 'mutlu', name: 'Mutlu', emoji: '😊', description: 'Neşeli, sevinçli', color: '#eab308' },
    { id: 'uzgun', name: 'Üzgün', emoji: '😢', description: 'Kederli, hüzünlü', color: '#3b82f6' },
    { id: 'kizgin', name: 'Kızgın', emoji: '😠', description: 'Öfkeli, sinirli', color: '#ef4444' },
    { id: 'saskin', name: 'Şaşkın', emoji: '😲', description: 'Hayret içinde', color: '#f97316' },
    { id: 'korkmus', name: 'Korkmuş', emoji: '😨', description: 'Ürkmüş, endişeli', color: '#a855f7' },
    { id: 'igrenme', name: 'İğrenme', emoji: '🤢', description: 'Tiksinmiş', color: '#22c55e' },
    { id: 'nötr', name: 'Nötr', emoji: '😐', description: 'Tarafsız, sakin', color: '#64748b' },
    { id: 'dusunceli', name: 'Düşünceli', emoji: '🤔', description: 'Derin düşüncede', color: '#06b6d4' },
];

const EXPRESSION_VARIANTS: Record<string, string[]> = {
    'mutlu': ['😊', '😄', '😁', '🙂', '☺️', '😃'],
    'uzgun': ['😢', '😞', '😔', '🙁', '😿', '😥'],
    'kizgin': ['😠', '😡', '🤬', '😤', '💢', '👿'],
    'saskin': ['😲', '😮', '😯', '🤯', '😳', '🫢'],
    'korkmus': ['😨', '😰', '😱', '🫣', '😧', '🥶'],
    'igrenme': ['🤢', '🤮', '😖', '😣', '🥴', '😬'],
    'nötr': ['😐', '😑', '😶', '🫡', '😏', '🙄'],
    'dusunceli': ['🤔', '🧐', '🤨', '😕', '💭', '🤷'],
};

interface Question {
    emoji: string;
    correctEmotion: typeof EMOTIONS[0];
    options: typeof EMOTIONS[0][];
}

type Phase = 'welcome' | 'playing' | 'game_over' | 'victory';

const FaceExpressionGame: React.FC = () => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const { feedbackState, showFeedback, dismissFeedback } = useGameFeedback({ duration: 1000 });
    const { submitResult } = useExam();
    const location = useLocation();
    const navigate = useNavigate();

    const [phase, setPhase] = useState<Phase>('welcome');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [level, setLevel] = useState(1);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [streak, setStreak] = useState(0);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);
    const hasSavedRef = useRef<boolean>(false);

    const examMode = location.state?.examMode || false;
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

    const generateQuestion = useCallback((): Question => {
        const correctEmotion = EMOTIONS[Math.floor(Math.random() * EMOTIONS.length)];
        const variants = EXPRESSION_VARIANTS[correctEmotion.id];
        const emoji = variants[Math.floor(Math.random() * variants.length)];
        const wrongOptions = EMOTIONS.filter(e => e.id !== correctEmotion.id).sort(() => Math.random() - 0.5).slice(0, 3);
        const options = [correctEmotion, ...wrongOptions].sort(() => Math.random() - 0.5);
        return { emoji, correctEmotion, options };
    }, []);

    const handleStart = useCallback(() => {
        window.scrollTo(0, 0);
        setPhase('playing');
        setScore(0);
        setLives(INITIAL_LIVES);
        setLevel(1);
        setStreak(0);
        setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
        startTimeRef.current = Date.now();
        hasSavedRef.current = false;
        setCurrentQuestion(generateQuestion());
    }, [generateQuestion, examMode, examTimeLimit]);

    useEffect(() => {
        if ((location.state?.autoStart || examMode) && phase === 'welcome') handleStart();
    }, [location.state, phase, handleStart, examMode]);

    useEffect(() => {
        if (phase === 'playing' && timeLeft > 0) {
            timerRef.current = setInterval(() => setTimeLeft(p => {
                if (p <= 1) {
                    clearInterval(timerRef.current!);
                    setPhase('game_over');
                    return 0;
                }
                return p - 1;
            }), 1000);
            return () => clearInterval(timerRef.current!);
        }
    }, [phase, timeLeft]);

    const handleFinish = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const isVictory = phase === 'victory';

        if (examMode) {
            await submitResult(isVictory || level >= 5, score, MAX_LEVEL * 100, duration);
            navigate("/atolyeler/sinav-simulasyonu/devam");
            return;
        }

        await saveGamePlay({
            game_id: 'yuz-ifadesi',
            score_achieved: score,
            duration_seconds: duration,
            metadata: { level_reached: level, game_name: 'Yüz İfadesi Tanıma', victory: isVictory }
        });
    }, [phase, score, level, saveGamePlay, examMode, submitResult, navigate]);

    useEffect(() => {
        if (phase === 'game_over' || phase === 'victory') handleFinish();
    }, [phase, handleFinish]);

    const handleAnswer = (emotionId: string) => {
        if (feedbackState || !currentQuestion) return;

        const isCorrect = emotionId === currentQuestion.correctEmotion.id;
        showFeedback(isCorrect);
        playSound(isCorrect ? 'correct' : 'incorrect');

        if (isCorrect) {
            setStreak(p => p + 1);
            setScore(p => p + 10 * level + (streak * 5));
        } else {
            setStreak(0);
            setLives(l => {
                const nl = l - 1;
                if (nl <= 0) setTimeout(() => setPhase('game_over'), 1000);
                return nl;
            });
        }

        setTimeout(() => {
            dismissFeedback();
            if (lives <= 0 && !isCorrect) return;

            if (level >= MAX_LEVEL) {
                setPhase('victory');
            } else {
                setLevel(p => p + 1);
                setCurrentQuestion(generateQuestion());
            }
        }, 1200);
    };

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    if (phase === 'welcome') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-fuchsia-950 to-purple-950 flex items-center justify-center p-6 text-white relative overflow-hidden">
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl animate-pulse" /><div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
                </div>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl relative z-10">
                    <motion.div className="w-28 h-28 rounded-[40%] flex items-center justify-center mx-auto mb-6" style={{ background: 'linear-gradient(135deg, #D946EF 0%, #C026D3 100%)', boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }} animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}><Smile size={52} className="text-white drop-shadow-lg" /></motion.div>
                    <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-fuchsia-300 to-purple-300 bg-clip-text text-transparent">Yüz İfadesi Tanıma</h1>
                    <p className="text-slate-400 mb-8 text-lg">Duyguları gözlerinden tanı! Emojilerin hangi duyguyu temsil ettiğini bul ve empati yeteneğini geliştir.</p>
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                        <h3 className="text-lg font-bold text-fuchsia-300 mb-3 flex items-center gap-2"><Eye size={20} /> Nasıl Oynanır?</h3>
                        <ul className="space-y-2 text-slate-300 text-sm">
                            <li className="flex items-center gap-2"><Sparkles size={14} className="text-fuchsia-400" /><span>Ekrana gelen yüz ifadesini dikkatle incele</span></li>
                            <li className="flex items-center gap-2"><Sparkles size={14} className="text-fuchsia-400" /><span>Alttaki seçeneklerden doğru duyguyu seç</span></li>
                            <li className="flex items-center gap-2"><Sparkles size={14} className="text-fuchsia-400" /><span>Hızlı ve doğru cevaplarla en yüksek skora ulaş!</span></li>
                        </ul>
                    </div>
                    <div className="bg-fuchsia-500/10 text-fuchsia-300 text-[10px] px-4 py-2 rounded-full mb-6 inline-block border border-fuchsia-500/30 font-bold uppercase tracking-widest">TUZÖ 7.1.1 Sosyal Algı</div>
                    <motion.button whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-fuchsia-500 to-purple-600 rounded-2xl font-bold text-xl" style={{ boxShadow: '0 8px 32px rgba(217, 70, 239, 0.4)' }}><div className="flex items-center gap-3"><Play size={28} className="fill-white" /><span>Başla</span></div></motion.button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-fuchsia-950 to-purple-950 text-white relative overflow-hidden">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl animate-pulse" /><div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
            </div>
            <div className="relative z-10 p-4 pt-20">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link to={backLink} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"><ChevronLeft size={20} /><span>{backLabel}</span></Link>
                    {(phase === 'playing') && (
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)', border: '1px solid rgba(251, 191, 36, 0.3)' }}><Star className="text-amber-400 fill-amber-400" size={18} /><span className="font-bold text-amber-400">{score}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>{Array.from({ length: INITIAL_LIVES }).map((_, i) => (<Heart key={i} size={18} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-900'} />))}</div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.1) 100%)', border: '1px solid rgba(59, 130, 246, 0.3)' }}><TimerIcon className={timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'} size={18} /><span className={`font-bold ${timeLeft < 30 ? 'text-red-400' : 'text-blue-400'}`}>{formatTime(timeLeft)}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(217, 70, 239, 0.2) 0%, rgba(192, 38, 211, 0.1) 100%)', border: '1px solid rgba(217, 70, 239, 0.3)' }}><Zap className="text-fuchsia-400" size={18} /><span className="font-bold text-fuchsia-400">{level}/{MAX_LEVEL}</span></div>
                        </div>
                    )}
                </div>
            </div>
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-4">
                <AnimatePresence mode="wait">
                    {phase === 'playing' && currentQuestion && (
                        <motion.div key="game" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="w-full max-w-xl text-center">
                            <div className="p-10 bg-white/5 backdrop-blur-3xl rounded-[48px] border border-white/10 shadow-3xl mb-8 relative overflow-hidden">
                                <p className="text-slate-400 font-bold mb-6 text-lg tracking-wide uppercase">BU HANGİ DUYGU?</p>
                                <motion.div key={level} initial={{ scale: 0.5, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', damping: 12 }} className="text-9xl drop-shadow-2xl mb-4">{currentQuestion.emoji}</motion.div>
                                <div className="absolute -bottom-10 -right-10 opacity-10 rotate-12"><Smile size={200} /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {currentQuestion.options.map((emotion, _idx) => {
                                    const showingResult = feedbackState !== null;
                                    const isCorrect = emotion.id === currentQuestion.correctEmotion.id;
                                    return (
                                        <motion.button key={emotion.id} whileHover={!showingResult ? { scale: 1.05, y: -2 } : {}} whileTap={!showingResult ? { scale: 0.95 } : {}} onClick={() => handleAnswer(emotion.id)} disabled={showingResult} className={`p-5 rounded-3xl flex items-center gap-4 transition-all duration-300 relative overflow-hidden shadow-xl ${showingResult ? (isCorrect ? 'bg-emerald-500 border-2 border-white' : 'bg-slate-800 opacity-20') : 'bg-slate-800/80 border border-white/10 hover:border-fuchsia-500/50'}`}>
                                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-3xl" style={{ backgroundColor: emotion.color + '20' }}>{emotion.emoji}</div>
                                            <div className="text-left font-black tracking-wide text-xl">{emotion.name}</div>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                    {(phase === 'game_over' || phase === 'victory') && (
                        <motion.div key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
                            <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-fuchsia-500 to-purple-700 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><Trophy size={48} className="text-white" /></motion.div>
                            <h2 className="text-3xl font-bold text-amber-400 mb-2">{phase === 'victory' ? '🎖️ Duygu Ustası!' : 'Tebrikler!'}</h2>
                            <p className="text-slate-400 mb-6">{phase === 'victory' ? 'İnsan duygularını anlama konusunda gerçek bir profesyonelsin!' : 'Sosyal algını daha da güçlendirmek için tekrar dene.'}</p>
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10"><div className="grid grid-cols-2 gap-4"><div className="text-center"><p className="text-slate-400 text-sm">Skor</p><p className="text-2xl font-bold text-amber-400">{score}</p></div><div className="text-center"><p className="text-slate-400 text-sm">Seviye</p><p className="text-2xl font-bold text-fuchsia-400">{level}/{MAX_LEVEL}</p></div></div></div>
                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-fuchsia-500 to-purple-600 rounded-2xl font-bold text-xl mb-4" style={{ boxShadow: '0 8px 32px rgba(217, 70, 239, 0.4)' }}><div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Oyna</span></div></motion.button>
                            <Link to={backLink} className="block text-slate-500 hover:text-white transition-colors">{location.state?.arcadeMode ? 'Bilsem Zeka' : 'Geri Dön'}</Link>
                        </motion.div>
                    )}
                </AnimatePresence>
                <GameFeedbackBanner feedback={feedbackState} />
            </div>
        </div>
    );
};

export default FaceExpressionGame;
