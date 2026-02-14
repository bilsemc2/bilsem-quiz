import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Star, Trophy, Timer as TimerIcon, RotateCcw, ChevronLeft, Play, Target, Sparkles, Heart, Eye, Palette, Zap } from 'lucide-react';
import { useSound } from '../../hooks/useSound';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';
import { useExam } from '../../contexts/ExamContext';

// Renk sabitleri
const COLORS: Record<string, string> = {
  kırmızı: '#FF5252',
  mavi: '#4285F4',
  sarı: '#FFC107',
  yeşil: '#0F9D58',
  pembe: '#E91E63',
  turuncu: '#FF9800',
  mor: '#9C27B0',
  turkuaz: '#00BCD4'
};

const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;

type Phase = 'welcome' | 'playing' | 'showing' | 'feedback' | 'game_over' | 'victory';

const ColorPerception: React.FC = () => {
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
  const [currentColors, setCurrentColors] = useState<string[]>([]);
  const [userSelections, setUserSelections] = useState<string[]>([]);

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

  const generateColors = useCallback((lvl: number) => {
    const colorNames = Object.keys(COLORS);
    const shuffled = [...colorNames].sort(() => 0.5 - Math.random());
    // Level 1-5: 2 colors, 6-10: 3 colors, 11-15: 4 colors, 16+: 5 colors
    const colorCount = lvl <= 5 ? 2 : lvl <= 10 ? 3 : lvl <= 15 ? 4 : 5;
    const selectedColors = shuffled.slice(0, colorCount);

    setCurrentColors(selectedColors);
    setUserSelections([]);
    setPhase('showing');

    const displayDuration = Math.max(800, 4000 - (lvl * 150)); // Faster as levels increase

    setTimeout(() => {
      setPhase('playing');
    }, displayDuration);
  }, []);

  const handleStart = useCallback(() => {
    window.scrollTo(0, 0);
    setScore(0);
    setLives(INITIAL_LIVES);
    setLevel(1);
    setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
    startTimeRef.current = Date.now();
    hasSavedRef.current = false;
    generateColors(1);
  }, [generateColors, examMode, examTimeLimit]);

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
      game_id: 'renk-algilama',
      score_achieved: score,
      duration_seconds: duration,
      metadata: { levels_completed: level, final_lives: lives, game_name: 'Renk Algılama' },
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
      game_id: 'renk-algilama',
      score_achieved: score,
      duration_seconds: duration,
      metadata: { levels_completed: MAX_LEVEL, victory: true, game_name: 'Renk Algılama' },
    });
  }, [saveGamePlay, score, examMode, submitResult, navigate]);

  const handleColorSelect = (colorName: string) => {
    if (phase !== 'playing') return;

    const newUserSelections = [...userSelections, colorName];
    setUserSelections(newUserSelections);
    playSound('select');

    if (newUserSelections.length === currentColors.length) {
      const correctSet = new Set(currentColors);
      const isCorrect = newUserSelections.every(color => correctSet.has(color));

      showFeedback(isCorrect);
      setPhase('feedback');

      if (isCorrect) {
        playSound('correct');
        setScore(s => s + level * 100);
      } else {
        playSound('incorrect');
        setLives(l => l - 1);
      }

      setTimeout(() => {
        dismissFeedback();
        const nl = isCorrect ? lives : lives - 1;
        if (!isCorrect && nl <= 0) { handleGameOver(); return; }
        if (isCorrect && level >= MAX_LEVEL) { handleVictory(); return; }

        if (isCorrect) setLevel(l => l + 1);
        generateColors(isCorrect ? level + 1 : level);
      }, 1000);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-fuchsia-950 to-purple-950 text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl" /><div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
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
              <motion.div className="w-28 h-28 rounded-[40%] flex items-center justify-center mx-auto mb-6 shadow-[inset_0_-8px_16px_rgba(0,0,0,0.2),inset_0_8px_16px_rgba(255,255,255,0.3),0_8px_24px_rgba(0,0,0,0.3)] shadow-[inset_0_-8px_16px_rgba(0,0,0,0.2),inset_0_8px_16px_rgba(255,255,255,0.3)]" style={{ background: 'linear-gradient(135deg, #E879F9 0%, #C026D3 100%)', boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }} animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}><Palette size={52} className="text-white drop-shadow-lg" /></motion.div>
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">Renk Algılama</h1>
              <p className="text-slate-400 mb-8">Ekranda beliren renkleri hızla ezberle ve doğru seç! Görsel işlem hızını ve belleğini geliştir.</p>
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                <h3 className="text-lg font-bold text-fuchsia-300 mb-3 flex items-center gap-2"><Eye size={20} /> Nasıl Oynanır?</h3>
                <ul className="space-y-2 text-slate-300 text-sm">
                  <li className="flex items-center gap-2"><Sparkles size={14} className="text-fuchsia-400" /><span>Ekranda bir grup rengi göreceksin, onları aklında tut</span></li>
                  <li className="flex items-center gap-2"><Sparkles size={14} className="text-fuchsia-400" /><span>Renkler kaybolunca, gördüğün tüm renkleri butonlardan seç</span></li>
                  <li className="flex items-center gap-2"><Sparkles size={14} className="text-fuchsia-400" /><span>İlerledikçe renk sayısı artacak ve süre kısalacak!</span></li>
                </ul>
              </div>
              <div className="bg-fuchsia-500/10 text-fuchsia-300 text-[10px] px-4 py-2 rounded-full mb-6 inline-block border border-fuchsia-500/30 font-bold uppercase tracking-widest">TUZÖ 5.4.1 Görsel Kısa Süreli Bellek</div>
              <motion.button whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 rounded-2xl font-bold text-xl" style={{ background: 'linear-gradient(135deg, #E879F9 0%, #C026D3 100%)', boxShadow: '0 8px 32px rgba(232, 121, 249, 0.4)' }}><div className="flex items-center gap-3"><Play size={28} className="fill-white" /><span>Başla</span></div></motion.button>
            </motion.div>
          )}
          {(phase === 'playing' || phase === 'showing' || phase === 'feedback') && (
            <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-md">
              <div className="rounded-[40px] overflow-hidden mb-8 aspect-square relative shadow-2xl border-4 border-white/10 bg-slate-900/50 backdrop-blur-xl">
                <AnimatePresence>
                  {phase === 'showing' && (
                    <motion.div key="colors" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col">
                      {currentColors.map((colorName, idx) => (<div key={idx} className="flex-1 w-full" style={{ backgroundColor: COLORS[colorName] }} />))}
                    </motion.div>
                  )}
                </AnimatePresence>
                {phase === 'playing' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 space-y-6">
                    <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1, repeat: Infinity }} className="w-20 h-20 rounded-3xl flex items-center justify-center bg-gradient-to-br from-fuchsia-400 to-purple-600 shadow-lg shadow-fuchsia-500/40"><Target size={40} className="text-white" /></motion.div>
                    <h4 className="text-2xl font-black text-white">Renkleri Seç!</h4>
                    <div className="flex gap-4">
                      {currentColors.map((_, i) => (<div key={i} className="w-16 h-16 rounded-2xl transition-all duration-300" style={{ background: userSelections[i] ? COLORS[userSelections[i]] : 'rgba(255,255,255,0.05)', border: userSelections[i] ? '4px solid white' : '4px dashed rgba(255,255,255,0.2)' }} />))}
                    </div>
                  </div>
                )}
                {phase === 'showing' && (<div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full text-xs font-black tracking-widest text-fuchsia-300 border border-white/10 uppercase animate-pulse">Ezberle!</div>)}
              </div>
              <div className={`grid grid-cols-2 gap-4 transition-all duration-500 ${phase === 'playing' ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>
                {Object.entries(COLORS).map(([name, code]) => (
                  <motion.button key={name} whileHover={{ scale: 0.98, y: -2 }} whileTap={{ scale: 0.95 }} onClick={() => handleColorSelect(name)} className="p-6 rounded-2xl font-black text-white uppercase shadow-lg border border-white/10 transition-shadow hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]" style={{ backgroundColor: code }}>{name}</motion.button>
                ))}
              </div>
            </motion.div>
          )}
          {(phase === 'game_over' || phase === 'victory') && (
            <motion.div key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
              <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-fuchsia-400 to-purple-600 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><Trophy size={48} className="text-white" /></motion.div>
              <h2 className="text-3xl font-bold text-amber-400 mb-2">{phase === 'victory' ? '🎖️ Renklerin Efendisi!' : 'Tebrikler!'}</h2>
              <p className="text-slate-400 mb-6">{phase === 'victory' ? 'Bütün renkleri kusursuz algıladın!' : 'Harika bir performans sergiledin!'}</p>
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10"><div className="grid grid-cols-2 gap-4"><div className="text-center"><p className="text-slate-400 text-sm">Skor</p><p className="text-2xl font-bold text-amber-400">{score}</p></div><div className="text-center"><p className="text-slate-400 text-sm">Seviye</p><p className="text-2xl font-bold text-emerald-400">{level}/{MAX_LEVEL}</p></div></div></div>
              <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-fuchsia-500 to-purple-600 rounded-2xl font-bold text-xl mb-4" style={{ boxShadow: '0 8px 32px rgba(232, 121, 249, 0.4)' }}><div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Oyna</span></div></motion.button>
              <Link to={backLink} className="block text-slate-500 hover:text-white transition-colors">{location.state?.arcadeMode ? 'Bilsem Zeka' : 'Geri Dön'}</Link>
            </motion.div>
          )}
        </AnimatePresence>
        <GameFeedbackBanner feedback={feedbackState} />
      </div>
    </div>
  );
};

export default ColorPerception;
