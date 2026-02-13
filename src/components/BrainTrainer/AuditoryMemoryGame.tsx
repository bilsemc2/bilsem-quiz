import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RotateCcw, Play, Star, Heart, Volume2, ChevronLeft, Music, Sparkles, Timer as TimerIcon, Zap } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import { useExam } from '../../contexts/ExamContext';
import GameFeedbackBanner from './shared/GameFeedbackBanner';
import { useSound } from '../../hooks/useSound';

const NOTES = [
    { name: 'Do', frequency: 261.63, color: '#FF6B6B' }, { name: 'Re', frequency: 293.66, color: '#FFA07A' }, { name: 'Mi', frequency: 329.63, color: '#FFD93D' },
    { name: 'Fa', frequency: 349.23, color: '#6BCB77' }, { name: 'Sol', frequency: 392.00, color: '#4ECDC4' }, { name: 'La', frequency: 440.00, color: '#4A90D9' },
    { name: 'Si', frequency: 493.88, color: '#9B59B6' }, { name: 'Do2', frequency: 523.25, color: '#FF9FF3' },
];

const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;
const GAME_ID = 'isitsel-hafiza';

type Phase = 'welcome' | 'playing' | 'listening' | 'answering' | 'feedback' | 'game_over' | 'victory';

const AuditoryMemoryGame: React.FC = () => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const { submitResult } = useExam();
    const { feedbackState, showFeedback, dismissFeedback } = useGameFeedback({ duration: 1500 });
    const location = useLocation();
    const navigate = useNavigate();

    const [phase, setPhase] = useState<Phase>('welcome');
    const [sequence, setSequence] = useState<number[]>([]);
    const [playerSequence, setPlayerSequence] = useState<number[]>([]);
    const [currentPlayIndex, setCurrentPlayIndex] = useState(-1);
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const [activeNote, setActiveNote] = useState<number | null>(null);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef(0);
    const audioContextRef = useRef<AudioContext | null>(null);
    const hasSavedRef = useRef(false);

    const examMode = location.state?.examMode || false;
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

    const playNote = useCallback((noteIndex: number, duration = 400) => {
        if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        const ctx = audioContextRef.current;
        const note = NOTES[noteIndex];
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine'; osc.frequency.setValueAtTime(note.frequency, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + duration / 1000);
        setActiveNote(noteIndex); setTimeout(() => setActiveNote(null), duration);
    }, []);

    const playSequence = useCallback(async (seq: number[]) => {
        setPhase('listening'); setCurrentPlayIndex(-1);
        for (let i = 0; i < seq.length; i++) {
            await new Promise(r => setTimeout(r, 600));
            setCurrentPlayIndex(i); playNote(seq[i], 400);
            await new Promise(r => setTimeout(r, 400));
        }
        // Keep last note visible for a moment before transitioning
        await new Promise(r => setTimeout(r, 800));
        setCurrentPlayIndex(-1); await new Promise(r => setTimeout(r, 400));
        setPhase('answering'); setPlayerSequence([]);
    }, [playNote]);

    const startLevel = useCallback((lvl: number) => {
        const len = Math.min(2 + lvl, 9);
        const seq = Array.from({ length: len }, () => Math.floor(Math.random() * NOTES.length));
        setSequence(seq); playSound('slide');
        playSequence(seq);
    }, [playSequence, playSound]);

    const handleStart = useCallback(() => {
        window.scrollTo(0, 0); setPhase('playing'); setScore(0); setLives(INITIAL_LIVES); setLevel(1); setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
        startTimeRef.current = Date.now(); hasSavedRef.current = false; startLevel(1);
    }, [startLevel, examMode, examTimeLimit]);

    useEffect(() => { if ((location.state?.autoStart || examMode) && phase === 'welcome') handleStart(); }, [location.state, examMode, phase, handleStart]);

    useEffect(() => {
        if ((phase === 'listening' || phase === 'answering' || phase === 'playing') && timeLeft > 0) {
            timerRef.current = setInterval(() => setTimeLeft(p => {
                if (p <= 1) { clearInterval(timerRef.current!); setPhase('game_over'); return 0; }
                return p - 1;
            }), 1000);
            return () => clearInterval(timerRef.current!);
        }
    }, [phase, timeLeft]);

    const handleNoteClick = (idx: number) => {
        if (phase !== 'answering' || !!feedbackState) return;
        playNote(idx, 300);
        const newPlayerSequence = [...playerSequence, idx];
        setPlayerSequence(newPlayerSequence);

        if (idx !== sequence[playerSequence.length]) {
            playSound('incorrect'); showFeedback(false); setLives(l => { const nl = l - 1; if (nl <= 0) setPhase('game_over'); return nl; });
            setTimeout(() => { dismissFeedback(); if (lives > 1) playSequence(sequence); }, 1000);
            return;
        }

        if (newPlayerSequence.length === sequence.length) {
            playSound('correct'); showFeedback(true); setScore(s => s + 50 + level * 10);
            setTimeout(() => {
                dismissFeedback();
                if (level >= MAX_LEVEL) setPhase('victory');
                else { const nl = level + 1; setLevel(nl); setTimeLeft(p => Math.min(p + 20, TIME_LIMIT)); startLevel(nl); }
            }, 1000);
        } else playSound('pop');
    };

    const handleFinish = useCallback(async (v: boolean) => {
        if (hasSavedRef.current) return; hasSavedRef.current = true;
        const dur = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (examMode) { await submitResult(v || level >= 5, score, MAX_LEVEL * 200, dur); navigate('/atolyeler/sinav-simulasyonu/devam'); return; }
        await saveGamePlay({ game_id: GAME_ID, score_achieved: score, duration_seconds: dur, metadata: { level: level, victory: v } });
    }, [score, level, examMode, submitResult, navigate, saveGamePlay]);

    useEffect(() => { if (phase === 'game_over' || phase === 'victory') handleFinish(phase === 'victory'); }, [phase, handleFinish]);

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    if (phase === 'welcome') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-pink-950 to-rose-950 flex items-center justify-center p-6 text-white relative overflow-hidden">
                <div className="fixed inset-0 pointer-events-none"><div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" /><div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl" /></div>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl relative z-10">
                    <motion.div className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-pink-400 to-rose-600 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}><Music size={52} className="text-white drop-shadow-lg" /></motion.div>
                    <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-pink-300 via-rose-300 to-red-300 bg-clip-text text-transparent">İşitsel Hafıza</h1>
                    <p className="text-slate-300 mb-8 text-lg">Melodileri dikkatle dinle, notaların sırasını aklında tut ve aynı müziği tekrar çalarak hafızanı kanıtla!</p>
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                        <h3 className="text-lg font-bold text-pink-300 mb-3 flex items-center gap-2"><Sparkles size={18} /> Nasıl Oynanır?</h3>
                        <ul className="space-y-2 text-slate-300 text-sm">
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-pink-500/30 rounded-full flex items-center justify-center text-[10px]">1</span><span>Çalınan <strong>nota dizisini</strong> pür dikkat dinle</span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-pink-500/30 rounded-full flex items-center justify-center text-[10px]">2</span><span>Dinleme bittikten sonra notalara <strong>aynı sırayla</strong> tıkla</span></li>
                            <li className="flex items-center gap-2"><span className="w-5 h-5 bg-pink-500/30 rounded-full flex items-center justify-center text-[10px]">3</span><span>Diziler uzadıkça melodiyi aklında tutmak daha da zorlaşacak!</span></li>
                        </ul>
                    </div>
                    <div className="bg-pink-500/10 text-pink-300 text-[10px] px-4 py-2 rounded-full mb-6 inline-block border border-pink-500/30 font-bold uppercase tracking-widest">TUZÖ 5.4.2 İşitsel Melodi Dizisi & Çalışma Belleği</div>
                    <motion.button whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-pink-500 to-rose-600 rounded-2xl font-bold text-xl shadow-2xl"><div className="flex items-center gap-3"><Play size={28} className="fill-white" /><span>Başla</span></div></motion.button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-pink-950 to-rose-950 text-white relative overflow-hidden flex flex-col">
            <div className="relative z-10 p-4 pt-20">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link to={backLink} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"><ChevronLeft size={20} /><span>{backLabel}</span></Link>
                    {(phase === 'listening' || phase === 'answering' || phase === 'playing') && (
                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20"><Star className="text-amber-400 fill-amber-400" size={16} /><span className="font-bold text-amber-400">{score}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20">{Array.from({ length: INITIAL_LIVES }).map((_, i) => (<Heart key={i} size={16} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-950'} />))}</div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20"><TimerIcon className={timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'} size={16} /><span className={`font-bold ${timeLeft < 30 ? 'text-red-400' : 'text-blue-400'}`}>{formatTime(timeLeft)}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20"><Zap className="text-emerald-400" size={16} /><span className="font-bold text-emerald-400">Puan x{level}</span></div>
                        </div>
                    )}
                </div>
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center p-4 flex-1">
                <AnimatePresence mode="wait">
                    {phase === 'listening' && (
                        <motion.div key="listening" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} className="flex flex-col items-center gap-8">
                            <motion.div animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-24 h-24 bg-pink-500/20 rounded-full flex items-center justify-center border-4 border-pink-400/50 shadow-2xl text-pink-400"><Volume2 size={40} /></motion.div>
                            <h2 className="text-3xl font-black text-pink-300">DİKKATLE DİNLE!</h2>
                            {/* Active Note Display */}
                            <AnimatePresence mode="wait">
                                {currentPlayIndex >= 0 && currentPlayIndex < sequence.length && (
                                    <motion.div
                                        key={currentPlayIndex}
                                        initial={{ scale: 0.5, opacity: 0, y: 10 }}
                                        animate={{ scale: 1, opacity: 1, y: 0 }}
                                        exit={{ scale: 0.8, opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="flex flex-col items-center gap-2"
                                    >
                                        <motion.div
                                            animate={{ scale: [1, 1.15, 1] }}
                                            transition={{ duration: 0.4, repeat: Infinity }}
                                            className="w-20 h-20 rounded-[35%] flex items-center justify-center text-white text-2xl font-black shadow-2xl border-2 border-white/30"
                                            style={{
                                                backgroundColor: NOTES[sequence[currentPlayIndex]].color,
                                                boxShadow: `0 0 30px ${NOTES[sequence[currentPlayIndex]].color}60, inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2)`
                                            }}
                                        >
                                            {NOTES[sequence[currentPlayIndex]].name}
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            {/* Sequence Progress */}
                            <div className="flex gap-3 items-center">
                                {sequence.map((noteIdx, i) => (
                                    <motion.div
                                        key={i}
                                        animate={i === currentPlayIndex ? { scale: 1.3 } : { scale: 1 }}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all duration-300 ${i === currentPlayIndex
                                            ? 'border-white/50 text-white shadow-lg'
                                            : i < currentPlayIndex
                                                ? 'border-white/20 text-white/80'
                                                : 'border-white/10 text-white/20'
                                            }`}
                                        style={{
                                            backgroundColor: i <= currentPlayIndex ? `${NOTES[noteIdx].color}${i === currentPlayIndex ? '' : '80'}` : 'rgba(255,255,255,0.05)',
                                            boxShadow: i === currentPlayIndex ? `0 0 16px ${NOTES[noteIdx].color}60` : 'none'
                                        }}
                                    >
                                        {i <= currentPlayIndex ? NOTES[noteIdx].name : '?'}
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {phase === 'answering' && (
                        <motion.div key="answering" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl flex flex-col items-center gap-12">
                            <h2 className="text-3xl font-black text-white/50 tracking-widest uppercase">SIRAYLA ÇAL</h2>
                            <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-4 w-full">
                                {NOTES.map((note, idx) => (
                                    <motion.button key={idx} whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={() => handleNoteClick(idx)} className={`aspect-square sm:aspect-[3/4] rounded-2xl border-2 transition-all shadow-xl flex flex-col items-center justify-between p-4 group ${activeNote === idx ? 'scale-110 shadow-3xl' : 'hover:shadow-2xl'}`} style={{ backgroundColor: activeNote === idx ? note.color : `${note.color}15`, borderColor: activeNote === idx ? 'white' : `${note.color}40`, color: activeNote === idx ? 'white' : note.color }}>
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform"><Music size={16} /></div>
                                        <span className="text-xl font-black font-mono">{note.name}</span>
                                        <div className="w-full h-1 rounded-full bg-white/20 mt-2" />
                                    </motion.button>
                                ))}
                            </div>
                            <div className="flex gap-3 mt-4">
                                {sequence.map((_, i) => (
                                    <div key={i} className={`w-4 h-4 rounded-full border border-white/20 ${i < playerSequence.length ? 'bg-emerald-500' : 'bg-white/5'}`} />
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {feedbackState && (
                        <motion.div key="feed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center"><h2 className={`text-5xl font-black ${feedbackState.correct ? 'text-emerald-400' : 'text-red-400'} drop-shadow-2xl italic tracking-tighter`}>{feedbackState.correct ? 'HARİKA MELODİ! 🎵' : 'DİKKAT!'}</h2><GameFeedbackBanner feedback={feedbackState} /></motion.div>
                    )}

                    {(phase === 'game_over' || phase === 'victory') && (
                        <motion.div key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-xl">
                            <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-pink-500 to-rose-700 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><Trophy size={48} className="text-white" /></motion.div>
                            <h2 className="text-3xl font-black text-pink-400 mb-2">{phase === 'victory' || level >= 5 ? '🎖️ Melodi Dehası!' : 'Harika!'}</h2>
                            <p className="text-slate-400 mb-6">{phase === 'victory' || level >= 5 ? 'İşitsel hafıza ve melodi işleme becerin tek kelimeyle mükemmel!' : 'Duyduğun notaları zihninde daha iyi tutmak için melodiye odaklanmalısın!'}</p>
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10"><div className="grid grid-cols-2 gap-4"><div className="text-center"><p className="text-slate-400 text-sm font-bold">Skor</p><p className="text-3xl font-black text-amber-400">{score}</p></div><div className="text-center"><p className="text-slate-400 text-sm font-bold">Seviye</p><p className="text-3xl font-black text-emerald-400">{level}/{MAX_LEVEL}</p></div></div></div>
                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-pink-500 to-rose-600 rounded-2xl font-bold text-xl mb-4 shadow-2xl"><div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Oyna</span></div></motion.button>
                            <Link to={backLink} className="block text-slate-500 hover:text-white transition-colors">Geri Dön</Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AuditoryMemoryGame;
