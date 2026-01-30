import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer, Volume2, VolumeX,
    XCircle, ChevronLeft, Headphones, CheckCircle2
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

        // Create options
        const otherSounds = sounds.filter(s => s.name !== target.name);
        const shuffledOthers = shuffleArray(otherSounds);
        const selectedOthers = shuffledOthers.slice(0, NUMBER_OF_OPTIONS - 1);
        const allOptions = shuffleArray([target, ...selectedOthers]);
        setOptions(allOptions);

        // Play target sound after delay
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

        // Start background audio
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
                // One wrong = game over (TÜZÖ style)
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

    // Get option class
    const getOptionClass = (sound: SoundItem) => {
        if (phase !== 'feedback') return '';
        if (sound.name === targetSound?.name) return 'ring-4 ring-emerald-500';
        if (sound.name === selectedOption) return 'ring-4 ring-red-500 opacity-50';
        return 'opacity-30';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900 text-white">
            {/* Decorative Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
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
                            {/* Score */}
                            <div className="flex items-center gap-2 bg-emerald-500/20 px-3 py-1.5 rounded-xl">
                                <Star className="text-emerald-400" size={18} />
                                <span className="font-bold text-emerald-400">{score}/{TARGET_SCORE}</span>
                            </div>

                            {/* Timer */}
                            <div className="flex items-center gap-2 bg-blue-500/20 px-3 py-1.5 rounded-xl">
                                <Timer className="text-blue-400" size={18} />
                                <span className={`font-bold ${timeLeft <= 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'}`}>
                                    {formatTime(timeLeft)}
                                </span>
                            </div>

                            {/* Volume Control */}
                            <div className="flex items-center gap-2 bg-purple-500/20 px-3 py-1.5 rounded-xl">
                                {backgroundVolume > 0 ? <Volume2 className="text-purple-400" size={18} /> : <VolumeX className="text-purple-400" size={18} />}
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={backgroundVolume}
                                    onChange={(e) => setBackgroundVolume(parseFloat(e.target.value))}
                                    className="w-20 accent-purple-500"
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
                            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl flex items-center justify-center">
                                <Headphones size={48} className="text-white" />
                            </div>

                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                                Gürültü Filtresi
                            </h1>

                            <p className="text-slate-400 mb-6">
                                Arka plandaki gürültüye rağmen hedef sesi tanı! Dikkat dağıtıcı seslere aldırma,
                                sadece çalınan sese odaklan.
                            </p>

                            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-4 mb-6 text-left">
                                <h3 className="font-semibold text-purple-400 mb-2">Nasıl Oynanır:</h3>
                                <ul className="text-sm text-slate-300 space-y-1">
                                    <li>• Arka planda kalabalık/gürültü sesi çalacak</li>
                                    <li>• Hedef ses 1 kez oynatılacak</li>
                                    <li>• 10 resimden doğru olanı seç</li>
                                    <li>• Tek seferde doğru bul!</li>
                                    <li>• 10 doğru = zafer!</li>
                                </ul>
                            </div>

                            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-4 mb-6">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-300">Dikkat Dağıtıcı Seviyesi:</span>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.1"
                                            value={backgroundVolume}
                                            onChange={(e) => setBackgroundVolume(parseFloat(e.target.value))}
                                            className="w-32 accent-purple-500"
                                        />
                                        <span className="text-purple-400 font-bold w-12">{Math.round(backgroundVolume * 100)}%</span>
                                    </div>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleStart}
                                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl font-bold text-lg shadow-lg shadow-purple-500/25"
                            >
                                <div className="flex items-center gap-3">
                                    <Play size={24} />
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
                            {/* Instructions */}
                            <div className="text-center mb-6">
                                <p className="text-slate-400 mb-2">Duyduğunuz ses hangisi?</p>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={replaySound}
                                    disabled={phase !== 'playing'}
                                    className="px-4 py-2 bg-purple-600/50 hover:bg-purple-600 rounded-xl text-sm disabled:opacity-50"
                                >
                                    <div className="flex items-center gap-2">
                                        <Headphones size={16} />
                                        <span>Sesi Tekrar Çal</span>
                                    </div>
                                </motion.button>
                            </div>

                            {/* Options Grid */}
                            <div className="grid grid-cols-5 gap-3 md:gap-4">
                                {options.map((sound) => (
                                    <motion.button
                                        key={sound.name}
                                        whileHover={phase === 'playing' ? { scale: 1.05 } : {}}
                                        whileTap={phase === 'playing' ? { scale: 0.95 } : {}}
                                        onClick={() => handleOptionClick(sound)}
                                        disabled={phase !== 'playing'}
                                        className={`relative aspect-square rounded-2xl overflow-hidden bg-slate-800/50 transition-all ${getOptionClass(sound)}`}
                                    >
                                        <img
                                            src={IMAGE_BASE_PATH + sound.image}
                                            alt={sound.name}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                            <p className="text-xs font-medium truncate">{sound.name}</p>
                                        </div>

                                        {/* Correct/Incorrect indicator */}
                                        {phase === 'feedback' && sound.name === targetSound?.name && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/30">
                                                <CheckCircle2 size={48} className="text-emerald-400" />
                                            </div>
                                        )}
                                        {phase === 'feedback' && sound.name === selectedOption && sound.name !== targetSound?.name && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-red-500/30">
                                                <XCircle size={48} className="text-red-400" />
                                            </div>
                                        )}
                                    </motion.button>
                                ))}
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
                            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-red-500 to-rose-600 rounded-3xl flex items-center justify-center">
                                <XCircle size={48} className="text-white" />
                            </div>

                            <h2 className="text-3xl font-bold text-amber-400 mb-4">Tekrar Deneyelim! 💪</h2>
                            <p className="text-slate-400 mb-4">
                                Doğru ses: <span className="text-white font-bold">{targetSound?.name}</span> idi.
                            </p>

                            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 mb-6">
                                <div className="text-center">
                                    <p className="text-slate-400 text-sm">Final Skor</p>
                                    <p className="text-3xl font-bold text-amber-400">{score}/{TARGET_SCORE}</p>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleStart}
                                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl font-bold text-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <RotateCcw size={24} />
                                    <span>Tekrar Dene</span>
                                </div>
                            </motion.button>
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
                            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-500 to-yellow-400 rounded-3xl flex items-center justify-center animate-bounce">
                                <Trophy size={48} className="text-white" />
                            </div>

                            <h2 className="text-3xl font-bold text-amber-400 mb-4">🎉 Tebrikler!</h2>
                            <p className="text-slate-300 mb-6">Gürültüye rağmen tüm sesleri doğru tanıdın!</p>

                            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 mb-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Skor</p>
                                        <p className="text-2xl font-bold text-amber-400">{score + 50}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Dikkat Dağıtıcı</p>
                                        <p className="text-2xl font-bold text-purple-400">{Math.round(backgroundVolume * 100)}%</p>
                                    </div>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleStart}
                                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl font-bold text-lg"
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
