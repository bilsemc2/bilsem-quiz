import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Grid3X3, Star, Trophy, RotateCcw, ChevronLeft, Play,
  Eye, Zap, Heart, Sparkles, Timer as TimerIcon
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSound } from '../../hooks/useSound';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';
import { useExam } from '../../contexts/ExamContext';

// Game Constants
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;

const COLORS = [
  { id: 'red', name: 'Kırmızı', hex: '#FF6B6B' },
  { id: 'blue', name: 'Mavi', hex: '#4ECDC4' },
  { id: 'yellow', name: 'Sarı', hex: '#FFD93D' },
  { id: 'green', name: 'Yeşil', hex: '#6BCB77' },
  { id: 'purple', name: 'Mor', hex: '#9B59B6' },
];

type Phase = 'welcome' | 'playing' | 'showing' | 'feedback' | 'game_over' | 'victory';

const ColorGrid: React.FC = () => {
  const { playSound } = useSound();
  const { saveGamePlay } = useGamePersistence();
  const { submitResult } = useExam();
  const { feedbackState, showFeedback, dismissFeedback } = useGameFeedback({ duration: 1000 });
  const location = useLocation();
  const navigate = useNavigate();

  const examMode = location.state?.examMode || false;
  const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

  const [phase, setPhase] = useState<Phase>('welcome');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [sequence, setSequence] = useState<Array<{ cellId: number, colorId: string }>>([]);
  const [userSequence, setUserSequence] = useState<Array<{ cellId: number, colorId: string }>>([]);
  const [cells, setCells] = useState(Array(9).fill(null).map((_, i) => ({ id: i, activeColor: null as string | null })));

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const hasSavedRef = useRef(false);

  const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
  const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

  useEffect(() => {
    if (phase !== 'welcome' && phase !== 'game_over' && phase !== 'victory' && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && (phase === 'playing' || phase === 'showing')) {
      handleGameOver();
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [phase, timeLeft]);

  const showSequenceAnimation = async (seq: Array<{ cellId: number, colorId: string }>) => {
    setPhase('showing');
    const displayTime = Math.max(300, 1000 - (level * 30)); // Getting faster
    const delayTime = Math.max(100, 400 - (level * 10));

    await new Promise(r => setTimeout(r, 600));

    for (let i = 0; i < seq.length; i++) {
      const { cellId, colorId } = seq[i];
      setCells(prev => prev.map(c => c.id === cellId ? { ...c, activeColor: colorId } : c));
      playSound('pop');
      await new Promise(r => setTimeout(r, displayTime));
      setCells(prev => prev.map(c => c.id === cellId ? { ...c, activeColor: null } : c));
      if (i < seq.length - 1) await new Promise(r => setTimeout(r, delayTime));
    }
    setPhase('playing');
    setUserSequence([]);
  };

  const generateSequence = useCallback((lvl: number) => {
    const count = lvl + 1; // Level 1: 2 colors, Level 20: 21 colors
    const newSeq: Array<{ cellId: number, colorId: string }> = [];
    for (let i = 0; i < count; i++) {
      newSeq.push({
        cellId: Math.floor(Math.random() * 9),
        colorId: COLORS[Math.floor(Math.random() * COLORS.length)].id
      });
    }
    setSequence(newSeq);
    setCells(prev => prev.map(c => ({ ...c, activeColor: null })));
    showSequenceAnimation(newSeq);
  }, [level]);

  const handleStart = useCallback(() => {
    window.scrollTo(0, 0);
    setScore(0);
    setLives(INITIAL_LIVES);
    setLevel(1);
    setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
    startTimeRef.current = Date.now();
    hasSavedRef.current = false;
    generateSequence(1);
  }, [generateSequence, examMode, examTimeLimit]);

  useEffect(() => {
    if ((location.state?.autoStart || examMode) && phase === 'welcome') handleStart();
  }, [location.state, examMode, phase, handleStart]);

  const handleGameOver = useCallback(async () => {
    if (hasSavedRef.current) return;
    hasSavedRef.current = true;
    setPhase('game_over');
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
    if (examMode) {
      await submitResult(level >= 5, score, MAX_LEVEL * 100, duration);
      navigate('/atolyeler/sinav-simulasyonu/devam');
      return;
    }
    await saveGamePlay({
      game_id: 'renk-sekans',
      score_achieved: score,
      duration_seconds: duration,
      metadata: { levels_completed: level, final_lives: lives, game_name: 'Renk Sekansı' },
    });
  }, [saveGamePlay, score, level, lives, examMode, submitResult, navigate]);

  const handleVictory = useCallback(async () => {
    if (hasSavedRef.current) return;
    hasSavedRef.current = true;
    setPhase('victory');
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
    if (examMode) {
      await submitResult(true, score, MAX_LEVEL * 100, duration);
      navigate('/atolyeler/sinav-simulasyonu/devam');
      return;
    }
    await saveGamePlay({
      game_id: 'renk-sekans',
      score_achieved: score,
      duration_seconds: duration,
      metadata: { levels_completed: MAX_LEVEL, victory: true, game_name: 'Renk Sekansı' },
    });
  }, [saveGamePlay, score, examMode, submitResult, navigate]);

  const handleCellClick = (cellId: number) => {
    if (phase !== 'playing') return;

    const currentStep = userSequence.length;
    const expected = sequence[currentStep];

    if (cellId !== expected.cellId) {
      playSound('incorrect');
      showFeedback(false);
      setPhase('feedback');
      setLives(l => l - 1);
      setTimeout(() => {
        dismissFeedback();
        const nl = lives - 1;
        if (nl <= 0) { handleGameOver(); return; }
        generateSequence(level); // Retry level
      }, 1000);
      return;
    }


    setCells(prev => prev.map(c => c.id === cellId ? { ...c, activeColor: expected.colorId } : c));
    playSound('select');

    const newUserSequence = [...userSequence, expected];
    setUserSequence(newUserSequence);

    setTimeout(() => {
      setCells(prev => prev.map(c => c.id === cellId ? { ...c, activeColor: null } : c));
      if (newUserSequence.length === sequence.length) {
        setScore(s => s + level * 50);
        showFeedback(true);
        setPhase('feedback');
        setTimeout(() => {
          dismissFeedback();
          if (level >= MAX_LEVEL) { handleVictory(); return; }
          setLevel(l => l + 1);
          generateSequence(level + 1);
        }, 1000);
      }
    }, 300);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" /><div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
      </div>
      <div className="relative z-10 p-4 pt-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to={backLink} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"><ChevronLeft size={20} /><span>{backLabel}</span></Link>
          {(phase === 'playing' || phase === 'showing' || phase === 'feedback') && (
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30"><Star className="text-amber-400 fill-amber-400" size={18} /><span className="font-bold text-amber-400">{score}</span></div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30">{Array.from({ length: INITIAL_LIVES }).map((_, i) => (<Heart key={i} size={18} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-900'} />))}</div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 border border-blue-500/30"><TimerIcon className={timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'} size={18} /><span className={`font-bold ${timeLeft < 30 ? 'text-red-400' : 'text-blue-400'}`}>{formatTime(timeLeft)}</span></div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(124, 58, 237, 0.1) 100%)', border: '1px solid rgba(139, 92, 246, 0.3)' }}><Zap className="text-violet-400" size={18} /><span className="font-bold text-violet-400">{level}/{MAX_LEVEL}</span></div>
            </div>
          )}
        </div>
      </div>
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-4">
        <AnimatePresence mode="wait">
          {phase === 'welcome' && (
            <motion.div key="welcome" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
              <motion.div className="w-28 h-28 rounded-[40%] flex items-center justify-center mx-auto mb-6 shadow-[inset_0_-8px_16px_rgba(0,0,0,0.2),inset_0_8px_16px_rgba(255,255,255,0.3),0_8px_24px_rgba(0,0,0,0.3)] shadow-[inset_0_-8px_16px_rgba(0,0,0,0.2),inset_0_8px_16px_rgba(255,255,255,0.3)]" style={{ background: 'linear-gradient(135deg, #9B59B6 0%, #8E44AD 100%)', boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }} animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}><Grid3X3 size={52} className="text-white drop-shadow-lg" /></motion.div>
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Renk Sekansı</h1>
              <p className="text-slate-400 mb-8">Renklerin yanış sırasını aklında tut ve aynı sırayla tekrarla! Görsel hafızanı zirveye taşı.</p>
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                <h3 className="text-lg font-bold text-purple-300 mb-3 flex items-center gap-2"><Eye size={20} /> Nasıl Oynanır?</h3>
                <ul className="space-y-2 text-slate-300 text-sm">
                  <li className="flex items-center gap-2"><Sparkles size={14} className="text-pink-400" /><span>Ekranda yanıp sönen renkli kutuları izle</span></li>
                  <li className="flex items-center gap-2"><Sparkles size={14} className="text-pink-400" /><span>Sıra sana geldiğinde aynı kutulara aynı sırayla tıkla</span></li>
                  <li className="flex items-center gap-2"><Sparkles size={14} className="text-pink-400" /><span>Her seviyede kutu sayısı ve hız artacak!</span></li>
                </ul>
              </div>
              <div className="bg-purple-500/10 text-purple-300 text-[10px] px-4 py-2 rounded-full mb-6 inline-block border border-purple-500/30 font-bold uppercase tracking-widest">TUZÖ 5.4.2 Görsel Kısa Süreli Bellek</div>
              <motion.button whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 rounded-2xl font-bold text-xl" style={{ background: 'linear-gradient(135deg, #9B59B6 0%, #8E44AD 100%)', boxShadow: '0 8px 32px rgba(155, 89, 182, 0.4)' }}><div className="flex items-center gap-3"><Play size={28} className="fill-white" /><span>Başla</span></div></motion.button>
            </motion.div>
          )}
          {(phase === 'playing' || phase === 'showing' || phase === 'feedback') && (
            <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-md">
              <div className="text-center mb-8"><motion.p animate={{ scale: phase === 'showing' ? [1, 1.05, 1] : 1 }} transition={{ repeat: Infinity, duration: 2 }} className={`text-2xl font-black ${phase === 'showing' ? 'text-purple-300' : 'text-emerald-400'}`}>{phase === 'showing' ? '👀 Dikkatle İzle...' : '🎯 Sıra Sende!'}</motion.p></div>
              <div className="p-8 rounded-[40px] bg-slate-900/50 backdrop-blur-2xl border border-white/10 shadow-[0_24px_48px_rgba(0,0,0,0.4),inset_0_2px_4px_rgba(255,255,255,0.1)] shadow-[inset_0_-8px_16px_rgba(0,0,0,0.2),inset_0_8px_16px_rgba(255,255,255,0.3)]"><div className="grid grid-cols-3 gap-4">{cells.map((cell) => { const color = COLORS.find(c => c.id === cell.activeColor); return (<motion.button key={cell.id} whileHover={phase === 'playing' ? { scale: 0.95 } : {}} whileTap={phase === 'playing' ? { scale: 0.9 } : {}} onClick={() => handleCellClick(cell.id)} className="aspect-square rounded-3xl transition-all duration-300" style={{ background: cell.activeColor ? color?.hex : 'rgba(255,255,255,0.05)', boxShadow: cell.activeColor ? `0 0 40px ${color?.hex}80, inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3)` : 'inset 0 4px 8px rgba(0,0,0,0.2), 0 2px 4px rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />); })}</div></div>
            </motion.div>
          )}
          {(phase === 'game_over' || phase === 'victory') && (
            <motion.div key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
              <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-400 to-pink-600 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><Trophy size={48} className="text-white" /></motion.div>
              <h2 className="text-3xl font-bold text-amber-400 mb-2">{phase === 'victory' ? '🎖️ Hafıza Ustası!' : 'Harika Deneme!'}</h2>
              <p className="text-slate-400 mb-6">{phase === 'victory' ? 'Tüm sekansları başarıyla hatırladın!' : 'Sekansı biraz daha geliştirerek tekrar dene!'}</p>
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10"><div className="grid grid-cols-2 gap-4"><div className="text-center"><p className="text-slate-400 text-sm">Skor</p><p className="text-2xl font-bold text-amber-400">{score}</p></div><div className="text-center"><p className="text-slate-400 text-sm">Seviye</p><p className="text-2xl font-bold text-emerald-400">{level}/{MAX_LEVEL}</p></div></div></div>
              <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl font-bold text-xl mb-4" style={{ boxShadow: '0 8px 32px rgba(155, 89, 182, 0.4)' }}><div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Oyna</span></div></motion.button>
              <Link to={backLink} className="block text-slate-500 hover:text-white transition-colors">{location.state?.arcadeMode ? 'Bilsem Zeka' : 'Geri Dön'}</Link>
            </motion.div>
          )}
        </AnimatePresence>
        <GameFeedbackBanner feedback={feedbackState} />
      </div>
    </div>
  );
};

export default ColorGrid;