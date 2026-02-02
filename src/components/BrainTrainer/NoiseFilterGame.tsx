import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer, Volume2, VolumeX,
    XCircle, ChevronLeft, Headphones, CheckCircle2, Home, Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import {
    sounds, SoundItem, shuffleArray, getRandomElement,
    AUDIO_BASE_PATH, IMAGE_BASE_PATH, BACKGROUND_AUDIO
} from './noiseFilterData';

// Game Constants
const NUMBER_OF_OPTIONS = 10;
const TARGET_SCORE = 10;
const TIME_LIMIT = 180;
const FEEDBACK_DELAY = 1500;

// Child-friendly feedback messages
const CORRECT_MESSAGES = [
    "Harika kulaklar! 🎧",
    "Mükemmel! ⭐",
    "Süper dinleme! 🌟",
    "Aferin! 🎉",
    "Tam isabet! 💫",
];

const WRONG_MESSAGES = [
    "Dikkatli dinle! 👂",
    "Tekrar deneyelim! 💪",
    "Odaklan ve dinle! 🎯",
];

type Phase = 'welcome' | 'playing' | 'feedback' | 'game_over' | 'victory';

const NoiseFilterGame: React.FC = () => {
    const { saveGamePlay } = useGamePersistence();
    const hasSavedRef = useRef(false);

    // Core State
    const [phase, setPhase] = useState<Phase>('welcome');
    const [score, setScore] = useState(0);
    const [attempts, setAttempts] = useState(0);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);

    // Game State
    const [targetSound, setTargetSound] = useState<SoundItem | null>(null);
    const [options, setOptions] = useState<SoundItem[]>([]);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [backgroundVolume, setBackgroundVolume] = useState(0.4);
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [isCorrect, setIsCorrect] = useState(false);

    // Refs
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);
    const backgroundAudioRef = useRef<HTMLAudioElement | null>(null);
    const targetAudioRef = useRef<HTMLAudioElement | null>(null);

    // Initialize background audio
    useEffect(() => {
        backgroundAudioRef.current = new Audio(BACKGROUND_AUDIO);
        backgroundAudioRef.current.loop = true;
        backgroundAudioRef.current.volume = backgroundVolume;

        return () => {
            backgroundAudioRef.current?.pause();
            backgroundAudioRef.current = null;
            targetAudioRef.current?.pause();
            targetAudioRef.current = null;
        };
    }, []);

    // Update background volume
    useEffect(() => {
        if (backgroundAudioRef.current) {
            backgroundAudioRef.current.volume = backgroundVolume;
        }
    }, [backgroundVolume]);

    // Timer Effect
    useEffect(() => {
        if (phase === 'playing' && timeLeft > 0) {
            timerRef.current = setTimeout(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && phase === 'playing') {
            handleGameOver();
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [phase, timeLeft]);

    // Setup new round
    const setupRound = useCallback(() => {
        const target = getRandomElement(sounds);
        if (!target) return;

        setTargetSound(target);
        setSelectedOption(null);

        const otherSounds = sounds.filter(s => s.name !== target.name);
        const shuffledOthers = shuffleArray(otherSounds);
        const selectedOthers = shuffledOthers.slice(0, NUMBER_OF_OPTIONS - 1);
        const allOptions = shuffleArray([target, ...selectedOthers]);
        setOptions(allOptions);

        setTimeout(() => {
            targetAudioRef.current?.pause();
            targetAudioRef.current = new Audio(AUDIO_BASE_PATH + target.file);
            targetAudioRef.current.play().catch(console.error);
        }, 500);
    }, []);

    // Start Game
    const handleStart = useCallback(() => {
        setPhase('playing');
        setScore(0);
        setAttempts(0);
        setTimeLeft(TIME_LIMIT);
        startTimeRef.current = Date.now();
        hasSavedRef.current = false;

        if (backgroundAudioRef.current) {
            backgroundAudioRef.current.currentTime = 0;
            backgroundAudioRef.current.volume = backgroundVolume;
            backgroundAudioRef.current.play().catch(console.error);
        }

        setupRound();
    }, [backgroundVolume, setupRound]);

    // Game Over Handler
    const handleGameOver = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;

        setPhase('game_over');
        backgroundAudioRef.current?.pause();
        targetAudioRef.current?.pause();

        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

        await saveGamePlay({
            game_id: 'gurultu-filtresi',
            score_achieved: score,
            duration_seconds: duration,
            metadata: {
                correct_answers: score,
                total_attempts: attempts,
                distraction_level: backgroundVolume,
            }
        });
    }, [saveGamePlay, score, attempts, backgroundVolume]);

    // Victory Handler
    const handleVictory = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;

        setPhase('victory');
        backgroundAudioRef.current?.pause();
        targetAudioRef.current?.pause();

        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

        await saveGamePlay({
            game_id: 'gurultu-filtresi',
            score_achieved: score + 50,
            duration_seconds: duration,
            metadata: {
                correct_answers: TARGET_SCORE,
                total_attempts: attempts,
                distraction_level: backgroundVolume,
                victory: true,
            }
        });
    }, [saveGamePlay, score, attempts, backgroundVolume]);

    // Handle Option Click
    const handleOptionClick = useCallback((sound: SoundItem) => {
        if (phase !== 'playing' || selectedOption !== null || !targetSound) return;

        setSelectedOption(sound.name);
        const correct = sound.name === targetSound.name;
        setIsCorrect(correct);
        setFeedbackMessage(
            correct
                ? CORRECT_MESSAGES[Math.floor(Math.random() * CORRECT_MESSAGES.length)]
                : WRONG_MESSAGES[Math.floor(Math.random() * WRONG_MESSAGES.length)]
        );
        setPhase('feedback');
        setAttempts(prev => prev + 1);

        targetAudioRef.current?.pause();

        setTimeout(() => {
            if (correct) {
                const newScore = score + 1;
                setScore(newScore);

                if (newScore >= TARGET_SCORE) {
                    handleVictory();
                } else {
                    setPhase('playing');
                    setupRound();
                }
            } else {
                handleGameOver();
            }
        }, FEEDBACK_DELAY);
    }, [phase, selectedOption, targetSound, score, handleVictory, handleGameOver, setupRound]);

    // Replay target sound
    const replaySound = useCallback(() => {
        if (targetSound && phase === 'playing') {
            targetAudioRef.current?.pause();
            targetAudioRef.current = new Audio(AUDIO_BASE_PATH + targetSound.file);
            targetAudioRef.current.play().catch(console.error);
        }
    }, [targetSound, phase]);

    // Format Time
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // 3D Gummy Card Style
    const getCardStyle = (isSelected: boolean, isTarget: boolean, isFeedback: boolean) => {
        if (!isFeedback) {
            return {
                boxShadow: 'inset 0 -4px 12px rgba(0,0,0,0.2), inset 0 4px 12px rgba(255,255,255,0.1), 0 6px 20px rgba(0,0,0,0.3)',
                borderRadius: '24px',
            };
        }
        if (isTarget) {
            return {
                boxShadow: 'inset 0 -4px 12px rgba(0,0,0,0.2), inset 0 4px 12px rgba(255,255,255,0.1), 0 0 30px rgba(16, 185, 129, 0.5)',
                borderRadius: '24px',
                outline: '4px solid #10B981',
            };
        }
        if (isSelected) {
            return {
                boxShadow: 'inset 0 -4px 12px rgba(0,0,0,0.3), 0 0 20px rgba(239, 68, 68, 0.4)',
                borderRadius: '24px',
                outline: '4px solid #EF4444',
                opacity: 0.6,
            };
        }
        return {
            boxShadow: 'inset 0 -4px 12px rgba(0,0,0,0.2)',
            borderRadius: '24px',
            opacity: 0.4,
        };
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-950 to-slate-900 text-white">
            {/* Decorative Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl" />
                <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <div className="relative z-10 p-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
                    <Link
                        to="/atolyeler/bireysel-degerlendirme"
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft size={20} />
                        <span>Geri</span>
                    </Link>

                    {(phase === 'playing' || phase === 'feedback') && (
                        <div className="flex items-center gap-3 flex-wrap justify-end">
                            {/* Progress */}
                            <div className="flex items-center gap-2 bg-emerald-500/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-emerald-500/30">
                                <Star className="text-emerald-400" size={18} />
                                <div className="flex gap-0.5">
                                    {Array.from({ length: TARGET_SCORE }).map((_, i) => (
                                        <div
                                            key={i}
                                            className={`w-2 h-2 rounded-full ${i < score ? 'bg-emerald-400' : 'bg-emerald-900/50'}`}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Timer */}
                            <div className="flex items-center gap-2 bg-blue-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-blue-500/30">
                                <Timer className="text-blue-400" size={18} />
                                <span className={`font-bold ${timeLeft <= 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'}`}>
                                    {formatTime(timeLeft)}
                                </span>
                            </div>

                            {/* Volume Control */}
                            <div className="flex items-center gap-2 bg-purple-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-purple-500/30">
                                {backgroundVolume > 0 ? <Volume2 className="text-purple-400" size={18} /> : <VolumeX className="text-purple-400" size={18} />}
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={backgroundVolume}
                                    onChange={(e) => setBackgroundVolume(parseFloat(e.target.value))}
                                    className="w-16 accent-purple-500"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4">
                <AnimatePresence mode="wait">
                    {/* Welcome Screen */}
                    {phase === 'welcome' && (
                        <motion.div
                            key="welcome"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center max-w-xl"
                        >
                            <motion.div
                                className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-[40%] flex items-center justify-center"
                                style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }}
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Headphones size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-purple-300 via-pink-300 to-indigo-300 bg-clip-text text-transparent">
                                Gürültü Filtresi
                            </h1>

                            <p className="text-slate-300 mb-6 text-lg">
                                Gürültüye rağmen hedef sesi tanı! 🎧
                            </p>

                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                                <h3 className="font-bold text-purple-300 mb-3 flex items-center gap-2">
                                    <Sparkles size={18} />
                                    Nasıl Oynanır?
                                </h3>
                                <ul className="text-sm text-slate-200 space-y-2">
                                    <li className="flex items-center gap-2">
                                        <span className="w-6 h-6 bg-purple-500/30 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                                        Arka planda gürültü çalacak
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-6 h-6 bg-purple-500/30 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                                        Hedef sesi dinle
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-6 h-6 bg-purple-500/30 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                                        Doğru resmi bul ve tıkla
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-6 h-6 bg-emerald-500/30 rounded-full flex items-center justify-center text-xs font-bold">🎯</span>
                                        10 doğru = Zafer!
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 mb-6 border border-white/20">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-200">Gürültü Seviyesi:</span>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.1"
                                            value={backgroundVolume}
                                            onChange={(e) => setBackgroundVolume(parseFloat(e.target.value))}
                                            className="w-28 accent-purple-500"
                                        />
                                        <span className="text-purple-300 font-bold w-12 text-right">{Math.round(backgroundVolume * 100)}%</span>
                                    </div>
                                </div>
                            </div>

                            {/* TUZÖ Badge */}
                            <div className="mb-6 inline-flex items-center gap-1.5 px-3 py-1 bg-violet-500/20 border border-violet-500/30 rounded-full">
                                <span className="text-[9px] font-black text-violet-300 uppercase tracking-wider">TUZÖ</span>
                                <span className="text-[9px] font-bold text-violet-400">5.7.1 Seçici Dikkat</span>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleStart}
                                className="px-10 py-5 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl font-bold text-xl"
                                style={{ boxShadow: '0 8px 32px rgba(139, 92, 246, 0.4)' }}
                            >
                                <div className="flex items-center gap-3">
                                    <Play size={28} className="fill-white" />
                                    <span>Başla</span>
                                </div>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* Game Board */}
                    {(phase === 'playing' || phase === 'feedback') && options.length > 0 && (
                        <motion.div
                            key="playing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full max-w-4xl"
                        >
                            {/* Feedback Overlay */}
                            <AnimatePresence>
                                {phase === 'feedback' && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.5 }}
                                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                                    >
                                        <motion.div
                                            initial={{ y: 50 }}
                                            animate={{ y: 0 }}
                                            className={`
                                                px-12 py-8 rounded-3xl text-center
                                                ${isCorrect
                                                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                                                    : 'bg-gradient-to-br from-orange-500 to-amber-600'
                                                }
                                            `}
                                            style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}
                                        >
                                            <motion.div
                                                animate={{ scale: [1, 1.2, 1], rotate: isCorrect ? [0, 10, -10, 0] : [0, -5, 5, 0] }}
                                                transition={{ duration: 0.5 }}
                                            >
                                                {isCorrect
                                                    ? <CheckCircle2 size={64} className="mx-auto mb-4 text-white" />
                                                    : <XCircle size={64} className="mx-auto mb-4 text-white" />
                                                }
                                            </motion.div>
                                            <p className="text-3xl font-black text-white">{feedbackMessage}</p>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Instructions */}
                            <div className="text-center mb-6">
                                <p className="text-slate-300 mb-3 text-lg">Duyduğun sesi bul! 👂</p>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={replaySound}
                                    disabled={phase !== 'playing'}
                                    className="px-5 py-2.5 bg-purple-600/50 hover:bg-purple-600 rounded-xl disabled:opacity-50 border border-purple-500/30"
                                    style={{ boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)' }}
                                >
                                    <div className="flex items-center gap-2">
                                        <Headphones size={18} />
                                        <span>Sesi Tekrar Çal</span>
                                    </div>
                                </motion.button>
                            </div>

                            {/* Options Grid - 3D Gummy Cards */}
                            <div className="grid grid-cols-5 gap-3 md:gap-4">
                                {options.map((sound) => {
                                    const isSelected = sound.name === selectedOption;
                                    const isTarget = sound.name === targetSound?.name;
                                    const isFeedback = phase === 'feedback';

                                    return (
                                        <motion.button
                                            key={sound.name}
                                            whileHover={phase === 'playing' ? { scale: 1.08, y: -4 } : {}}
                                            whileTap={phase === 'playing' ? { scale: 0.95 } : {}}
                                            onClick={() => handleOptionClick(sound)}
                                            disabled={phase !== 'playing'}
                                            className="relative aspect-square overflow-hidden bg-white/10 backdrop-blur-sm transition-all"
                                            style={getCardStyle(isSelected, isTarget, isFeedback)}
                                        >
                                            <img
                                                src={IMAGE_BASE_PATH + sound.image}
                                                alt={sound.name}
                                                className="w-full h-full object-cover"
                                                style={{ borderRadius: '20px' }}
                                            />
                                            <div
                                                className="absolute inset-x-0 bottom-0 p-2"
                                                style={{
                                                    background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
                                                    borderRadius: '0 0 20px 20px'
                                                }}
                                            >
                                                <p className="text-xs font-bold truncate text-white/90">{sound.name}</p>
                                            </div>

                                            {/* Correct/Incorrect indicator */}
                                            {phase === 'feedback' && isTarget && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="absolute inset-0 flex items-center justify-center bg-emerald-500/30"
                                                    style={{ borderRadius: '20px' }}
                                                >
                                                    <CheckCircle2 size={40} className="text-emerald-300 drop-shadow-lg" />
                                                </motion.div>
                                            )}
                                            {phase === 'feedback' && isSelected && !isTarget && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="absolute inset-0 flex items-center justify-center bg-red-500/30"
                                                    style={{ borderRadius: '20px' }}
                                                >
                                                    <XCircle size={40} className="text-red-300 drop-shadow-lg" />
                                                </motion.div>
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {/* Game Over Screen */}
                    {phase === 'game_over' && (
                        <motion.div
                            key="game_over"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center max-w-xl"
                        >
                            <motion.div
                                className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-orange-400 to-red-500 rounded-[40%] flex items-center justify-center"
                                style={{ boxShadow: 'inset 0 -6px 12px rgba(0,0,0,0.2), inset 0 6px 12px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }}
                            >
                                <XCircle size={48} className="text-white" />
                            </motion.div>

                            <h2 className="text-3xl font-black text-orange-300 mb-2">Tekrar Deneyelim!</h2>
                            <p className="text-slate-400 mb-4">
                                Doğru ses: <span className="text-white font-bold">{targetSound?.name}</span> idi 💪
                            </p>

                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/20">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Doğru Cevap</p>
                                        <p className="text-3xl font-black text-emerald-400">{score}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Hedef</p>
                                        <p className="text-3xl font-black text-purple-400">{TARGET_SCORE}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 justify-center">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleStart}
                                    className="px-8 py-4 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl font-bold text-lg"
                                    style={{ boxShadow: '0 8px 32px rgba(139, 92, 246, 0.4)' }}
                                >
                                    <div className="flex items-center gap-3">
                                        <RotateCcw size={24} />
                                        <span>Tekrar Dene</span>
                                    </div>
                                </motion.button>
                                <Link
                                    to="/atolyeler/bireysel-degerlendirme"
                                    className="px-6 py-4 bg-white/10 backdrop-blur-sm rounded-2xl font-bold flex items-center gap-2 border border-white/20"
                                >
                                    <Home size={20} />
                                    <span>Çıkış</span>
                                </Link>
                            </div>
                        </motion.div>
                    )}

                    {/* Victory Screen */}
                    {phase === 'victory' && (
                        <motion.div
                            key="victory"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center max-w-xl"
                        >
                            <motion.div
                                className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-[40%] flex items-center justify-center"
                                style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.4), 0 8px 32px rgba(251, 191, 36, 0.5)' }}
                                animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                <Trophy size={56} className="text-white" />
                            </motion.div>

                            <h2 className="text-4xl font-black text-amber-300 mb-2">🎉 Tebrikler!</h2>
                            <p className="text-slate-300 mb-6">Gürültüye rağmen tüm sesleri tanıdın!</p>

                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-amber-500/30">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Skor</p>
                                        <p className="text-3xl font-black text-amber-400">{score + 50}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Gürültü Seviyesi</p>
                                        <p className="text-3xl font-black text-purple-400">{Math.round(backgroundVolume * 100)}%</p>
                                    </div>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleStart}
                                className="px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-2xl font-bold text-lg text-slate-900"
                                style={{ boxShadow: '0 8px 32px rgba(251, 191, 36, 0.5)' }}
                            >
                                <div className="flex items-center gap-3">
                                    <RotateCcw size={24} />
                                    <span>Tekrar Oyna</span>
                                </div>
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default NoiseFilterGame;
