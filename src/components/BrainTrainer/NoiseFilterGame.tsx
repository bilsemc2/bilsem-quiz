import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer as TimerIcon, Volume2, VolumeX,
    XCircle, ChevronLeft, Headphones, CheckCircle2, Zap, Heart,
    Sparkles
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';
import { useExam } from '../../contexts/ExamContext';
import { useSound } from '../../hooks/useSound';
import {
    sounds, SoundItem, shuffleArray, getRandomElement,
    AUDIO_BASE_PATH, IMAGE_BASE_PATH, BACKGROUND_AUDIO
} from './noiseFilterData';

// ─── Constants ───────────────────────────────────────────────
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 10; // Keeping 10 for this game as it is audio-heavy
const GAME_ID = 'gurultu-filtresi';
const NUMBER_OF_OPTIONS = 10;

type Phase = 'welcome' | 'playing' | 'feedback' | 'game_over' | 'victory';

const NoiseFilterGame: React.FC = () => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const { submitResult } = useExam();
    const location = useLocation();
    const navigate = useNavigate();
    const { feedbackState, showFeedback, dismissFeedback } = useGameFeedback({ duration: 1500 });

    const [phase, setPhase] = useState<Phase>('welcome');
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const [backgroundVolume, setBackgroundVolume] = useState(0.4);
    const [targetSound, setTargetSound] = useState<SoundItem | null>(null);
    const [options, setOptions] = useState<SoundItem[]>([]);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef(0);
    const hasSavedRef = useRef(false);
    const bgAudioRef = useRef<HTMLAudioElement | null>(null);
    const targetAudioRef = useRef<HTMLAudioElement | null>(null);

    const examMode = location.state?.examMode || false;
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

    useEffect(() => {
        bgAudioRef.current = new Audio(BACKGROUND_AUDIO);
        bgAudioRef.current.loop = true;
        bgAudioRef.current.volume = backgroundVolume;
        return () => {
            bgAudioRef.current?.pause(); bgAudioRef.current = null;
            targetAudioRef.current?.pause(); targetAudioRef.current = null;
        };
    }, []);

    useEffect(() => { if (bgAudioRef.current) bgAudioRef.current.volume = backgroundVolume; }, [backgroundVolume]);

    const setupRound = useCallback(() => {
        const target = getRandomElement(sounds); if (!target) return;
        setTargetSound(target); setSelectedOption(null);
        const others = shuffleArray(sounds.filter(s => s.name !== target.name)).slice(0, NUMBER_OF_OPTIONS - 1);
        setOptions(shuffleArray([target, ...others]));
        setTimeout(() => {
            targetAudioRef.current?.pause();
            targetAudioRef.current = new Audio(AUDIO_BASE_PATH + target.file);
            targetAudioRef.current.play().catch(console.error);
        }, 500);
    }, []);

    const handleStart = useCallback(() => {
        window.scrollTo(0, 0);
        setPhase('playing'); setScore(0); setLevel(1); setLives(INITIAL_LIVES);
        setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
        startTimeRef.current = Date.now(); hasSavedRef.current = false;
        if (bgAudioRef.current) { bgAudioRef.current.currentTime = 0; bgAudioRef.current.play().catch(console.error); }
        setupRound(); playSound('slide');
    }, [setupRound, playSound, examMode, examTimeLimit]);

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

    const handleFinish = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        bgAudioRef.current?.pause(); targetAudioRef.current?.pause();
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (examMode) {
            await submitResult(level >= 5 || phase === 'victory', score, MAX_LEVEL * 100, duration);
            navigate("/atolyeler/sinav-simulasyonu/devam"); return;
        }
        await saveGamePlay({ game_id: GAME_ID, score_achieved: score, duration_seconds: duration, metadata: { level_reached: level, victory: phase === 'victory' } });
    }, [phase, score, level, saveGamePlay, examMode, submitResult, navigate]);

    useEffect(() => { if (phase === 'game_over' || phase === 'victory') handleFinish(); }, [phase, handleFinish]);

    const handleOption = (sound: SoundItem) => {
        if (phase !== 'playing' || selectedOption !== null || !targetSound) return;
        setSelectedOption(sound.name);
        const correct = sound.name === targetSound.name;
        showFeedback(correct); playSound(correct ? 'correct' : 'incorrect');
        targetAudioRef.current?.pause();
        setTimeout(() => {
            dismissFeedback();
            if (correct) {
                setScore(p => p + 20 * level);
                if (level >= MAX_LEVEL) setPhase('victory');
                else { setLevel(l => l + 1); setupRound(); }
            } else {
                setLives(l => {
                    const nl = l - 1;
                    if (nl <= 0) setTimeout(() => setPhase('game_over'), 500);
                    else setupRound();
                    return nl;
                });
            }
        }, 1500);
    };

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    if (phase === 'welcome') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-950 to-slate-900 flex items-center justify-center p-6 text-white relative overflow-hidden">
                <div className="fixed inset-0 pointer-events-none"><div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl animate-pulse" /><div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl" /></div>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl relative z-10">
                    <motion.div className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-[40%] flex items-center justify-center" style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }} animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}><Headphones size={52} className="text-white drop-shadow-lg" /></motion.div>
                    <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-purple-300 via-pink-300 to-indigo-300 bg-clip-text text-transparent">Gürültü Filtresi</h1>
                    <p className="text-slate-300 mb-8 text-lg">Gürültülü ortamlarda bile hedef sesi ayırt edebilme yeteneğini geliştir. Dikkatini odakla ve doğru sesi bul!</p>
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                        <h3 className="text-lg font-bold text-purple-300 mb-3 flex items-center gap-2"><Sparkles size={18} /> Nasıl Oynanır?</h3>
                        <ul className="space-y-2 text-slate-300 text-sm">
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-purple-500/30 rounded-full flex items-center justify-center text-[10px]">1</span><span>Arka plandaki gürültüye rağmen <strong>hedef sesi dinle</strong></span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-purple-500/30 rounded-full flex items-center justify-center text-[10px]">2</span><span>Ekranda bu sese ait olan <strong>görseli bul ve tıkla</strong></span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-purple-500/30 rounded-full flex items-center justify-center text-[10px]">3</span><span>Hatalı seçim yapmadan <strong>tüm seviyeleri tamamla</strong></span></li>
                        </ul>
                    </div>
                    <div className="bg-violet-500/10 text-violet-300 text-[10px] px-4 py-2 rounded-full mb-6 inline-block border border-violet-500/30 font-bold uppercase tracking-widest">TUZÖ 5.7.1 Seçici Dikkat</div>
                    <motion.button whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl font-bold text-xl shadow-2xl"><div className="flex items-center gap-3"><Play size={28} className="fill-white" /><span>Başla</span></div></motion.button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-950 to-slate-900 text-white relative overflow-hidden flex flex-col">
            <div className="relative z-10 p-4 pt-20">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link to={backLink} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"><ChevronLeft size={20} /><span>{backLabel}</span></Link>
                    {(phase !== 'game_over' && phase !== 'victory') && (
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/20 border border-purple-500/30">
                                {backgroundVolume > 0 ? <Volume2 className="text-purple-400" size={18} /> : <VolumeX className="text-purple-400" size={18} />}
                                <input type="range" min="0" max="1" step="0.1" value={backgroundVolume} onChange={(e) => setBackgroundVolume(parseFloat(e.target.value))} className="w-16 accent-purple-500" />
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)', border: '1px solid rgba(251, 191, 36, 0.3)' }}><Star className="text-amber-400 fill-amber-400" size={18} /><span className="font-bold text-amber-400">{score}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>{Array.from({ length: INITIAL_LIVES }).map((_, i) => (<Heart key={i} size={18} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-900'} />))}</div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.1) 100%)', border: '1px solid rgba(59, 130, 246, 0.3)' }}><TimerIcon className={timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'} size={18} /><span className={`font-bold ${timeLeft < 30 ? 'text-red-400' : 'text-blue-400'}`}>{formatTime(timeLeft)}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(147, 51, 234, 0.1) 100%)', border: '1px solid rgba(168, 85, 247, 0.3)' }}><Zap className="text-purple-400" size={18} /><span className="font-bold text-purple-400">Seviye {level}/{MAX_LEVEL}</span></div>
                        </div>
                    )}
                </div>
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center p-4 flex-1">
                <AnimatePresence mode="wait">
                    {(phase === 'playing' || phase === 'feedback') && (
                        <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-4xl flex flex-col items-center gap-8">
                            <div className="text-center">
                                <p className="text-slate-300 mb-4 text-xl">Duyduğun sesi aşağıdan seç! 🎧</p>
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { targetAudioRef.current?.pause(); targetAudioRef.current = new Audio(AUDIO_BASE_PATH + targetSound?.file); targetAudioRef.current.play(); }} disabled={phase !== 'playing'} className="px-6 py-3 bg-purple-600/30 hover:bg-purple-600/50 rounded-2xl border border-purple-400/30 flex items-center gap-3 transition-all"><Headphones size={24} /><span>Sesi Tekrar Dinle</span></motion.button>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 w-full">
                                {options.map((sound) => {
                                    const isSelected = sound.name === selectedOption;
                                    const isTarget = sound.name === targetSound?.name;
                                    const showOk = phase === 'feedback' && isTarget;
                                    const showErr = phase === 'feedback' && isSelected && !isTarget;
                                    return (
                                        <motion.button key={sound.name} whileHover={phase === 'playing' ? { scale: 1.05, y: -4 } : {}} whileTap={phase === 'playing' ? { scale: 0.95 } : {}} onClick={() => handleOption(sound)} disabled={phase !== 'playing'} className="relative aspect-square rounded-3xl overflow-hidden border-4 transition-all" style={{ background: 'rgba(255,255,255,0.05)', borderColor: showOk ? '#22c55e' : showErr ? '#ef4444' : isSelected ? '#a855f7' : 'transparent', boxShadow: isSelected ? '0 0 20px rgba(168, 85, 247, 0.4)' : 'none' }}>
                                            <img src={IMAGE_BASE_PATH + sound.image} alt={sound.name} className={`w-full h-full object-cover ${phase === 'feedback' && !isTarget && !isSelected ? 'opacity-30 grayscale' : ''}`} />
                                            {phase === 'feedback' && isTarget && <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center"><CheckCircle2 size={48} className="text-emerald-400 drop-shadow-lg" /></div>}
                                            {phase === 'feedback' && isSelected && !isTarget && <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center"><XCircle size={48} className="text-red-400 drop-shadow-lg" /></div>}
                                            <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2"><p className="text-[10px] font-bold text-white truncate text-center">{sound.name}</p></div>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                    {(phase === 'game_over' || phase === 'victory') && (
                        <motion.div key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-xl">
                            <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-violet-500 to-purple-700 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><Trophy size={48} className="text-white" /></motion.div>
                            <h2 className="text-3xl font-bold text-amber-400 mb-2">{phase === 'victory' || level >= 5 ? '🎖️ Keskin Kulak!' : 'Tebrikler!'}</h2>
                            <p className="text-slate-400 mb-6">{phase === 'victory' || level >= 5 ? 'Gürültüye rağmen sesleri ayırt etme yeteneğin gerçekten muazzam!' : 'Daha fazla pratikle seçici dikkatini geliştirebilirsin.'}</p>
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10"><div className="grid grid-cols-2 gap-4"><div className="text-center"><p className="text-slate-400 text-sm">Skor</p><p className="text-2xl font-bold text-amber-400">{score}</p></div><div className="text-center"><p className="text-slate-400 text-sm">Seviye</p><p className="text-2xl font-bold text-purple-400">{level}/{MAX_LEVEL}</p></div></div></div>
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

export default NoiseFilterGame;
