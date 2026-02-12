import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RotateCcw, Play, Star, Heart, Volume2, ChevronLeft, Music, Sparkles, CheckCircle2, XCircle, Headphones, Eye } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import { useExam } from '../../contexts/ExamContext';
// Ses notaları - Web Audio API ile oluşturulacak
const NOTES = [
    { name: 'Do', frequency: 261.63, color: '#FF6B6B' },   // Kırmızı
    { name: 'Re', frequency: 293.66, color: '#FFA07A' },   // Turuncu
    { name: 'Mi', frequency: 329.63, color: '#FFD93D' },   // Sarı
    { name: 'Fa', frequency: 349.23, color: '#6BCB77' },   // Yeşil
    { name: 'Sol', frequency: 392.00, color: '#4ECDC4' },  // Cyan
    { name: 'La', frequency: 440.00, color: '#4A90D9' },   // Mavi
    { name: 'Si', frequency: 493.88, color: '#9B59B6' },   // Mor
    { name: 'Do2', frequency: 523.25, color: '#FF9FF3' },  // Pembe
];

// Child-friendly messages


interface AuditoryMemoryGameProps {
    examMode?: boolean;
    examLevel?: number;
    examTimeLimit?: number;
}

const AuditoryMemoryGame: React.FC<AuditoryMemoryGameProps> = ({ examMode: examModeProp = false }) => {
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();
    const navigate = useNavigate();
    const { submitResult } = useExam();
    const { feedbackState } = useGameFeedback();

    // examMode can come from props OR location.state (when navigating from ExamContinuePage)
    const examMode = examModeProp || location.state?.examMode === true;
    const [gameState, setGameState] = useState<'idle' | 'playing' | 'listening' | 'answering' | 'feedback' | 'finished'>('idle');
    const [sequence, setSequence] = useState<number[]>([]);
    const [playerSequence, setPlayerSequence] = useState<number[]>([]);
    const [currentPlayIndex, setCurrentPlayIndex] = useState(-1);
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [correctCount, setCorrectCount] = useState(0);
    const [wrongCount, setWrongCount] = useState(0);
    const [bestLevel, setBestLevel] = useState(0);
    const [activeNote, setActiveNote] = useState<number | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const gameStartTimeRef = useRef<number>(0);
    const hasSavedRef = useRef<boolean>(false);
    const audioContextRef = useRef<AudioContext | null>(null);

    // Back link
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    // Seviyeye göre dizi uzunluğu
    const getSequenceLength = (lvl: number) => Math.min(2 + lvl, 9);

    // Audio Context oluştur
    const getAudioContext = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        }
        return audioContextRef.current;
    }, []);

    // Ses çal
    const playNote = useCallback((noteIndex: number, duration = 400) => {
        const audioContext = getAudioContext();
        const note = NOTES[noteIndex];

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(note.frequency, audioContext.currentTime);

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + duration / 1000);

        // Visual feedback
        setActiveNote(noteIndex);
        setTimeout(() => setActiveNote(null), duration);
    }, [getAudioContext]);

    // Sırayı çal
    const playSequence = useCallback(async (seq: number[]) => {
        setGameState('listening');
        setCurrentPlayIndex(-1);

        for (let i = 0; i < seq.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 600));
            setCurrentPlayIndex(i);
            playNote(seq[i], 400);
            await new Promise(resolve => setTimeout(resolve, 400));
        }

        setCurrentPlayIndex(-1);
        await new Promise(resolve => setTimeout(resolve, 300));
        setGameState('answering');
        setPlayerSequence([]);
    }, [playNote]);

    // Yeni sıra oluştur
    const generateSequence = useCallback((lvl: number): number[] => {
        const length = getSequenceLength(lvl);
        const seq: number[] = [];
        for (let i = 0; i < length; i++) {
            seq.push(Math.floor(Math.random() * NOTES.length));
        }
        return seq;
    }, []);

    // Yeni tur başlat
    const startNewRound = useCallback((currentLevel: number) => {
        const newSeq = generateSequence(currentLevel);
        setSequence(newSeq);
        setPlayerSequence([]);
        setIsCorrect(null);
        playSequence(newSeq);
    }, [generateSequence, playSequence]);

    // Oyunu başlat
    const startGame = useCallback(() => {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        setScore(0);
        setLives(3);
        setLevel(1);
        setCorrectCount(0);
        setWrongCount(0);
        setBestLevel(0);
        gameStartTimeRef.current = Date.now();
        hasSavedRef.current = false;
        setGameState('playing');
        startNewRound(1);
    }, [getAudioContext, startNewRound]);

    // Handle Auto Start from HUB or Exam Mode
    useEffect(() => {
        if ((location.state?.autoStart || examMode) && gameState === 'idle') {
            startGame();
        }
    }, [location.state, gameState, startGame, examMode]);

    // Oyuncu nota seçti
    const handleNoteClick = useCallback((noteIndex: number) => {
        if (gameState !== 'answering') return;

        playNote(noteIndex, 300);
        const newPlayerSequence = [...playerSequence, noteIndex];
        setPlayerSequence(newPlayerSequence);

        const currentIndex = newPlayerSequence.length - 1;
        if (newPlayerSequence[currentIndex] !== sequence[currentIndex]) {
            // Yanlış!
            setIsCorrect(false);
            setWrongCount(prev => prev + 1);
            setLives(prev => prev - 1);
            setGameState('feedback');

            setTimeout(() => {
                if (lives <= 1) {
                    setGameState('finished');
                } else {
                    startNewRound(level);
                }
            }, 1500);
        } else if (newPlayerSequence.length === sequence.length) {
            // Tamamladı!
            setIsCorrect(true);
            setCorrectCount(prev => prev + 1);
            const levelBonus = level * 50;
            setScore(prev => prev + 100 + levelBonus);
            const newLevel = level + 1;
            if (newLevel > bestLevel) setBestLevel(newLevel);
            setLevel(newLevel);
            setGameState('feedback');

            setTimeout(() => {
                startNewRound(newLevel);
            }, 1500);
        }
    }, [gameState, playerSequence, sequence, level, lives, bestLevel, playNote, startNewRound]);

    // Oyun bittiğinde verileri kaydet
    useEffect(() => {
        if (gameState === 'finished' && gameStartTimeRef.current > 0 && !hasSavedRef.current) {
            hasSavedRef.current = true;
            const durationSeconds = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);

            // Exam mode: submit result and navigate
            if (examMode) {
                const passed = score > 300;
                (async () => {
                    await submitResult(passed, score, 1000, durationSeconds);
                    navigate('/atolyeler/sinav-simulasyonu/devam');
                })();
                return;
            }

            saveGamePlay({
                game_id: 'isitsel-bellek',
                score_achieved: score,
                duration_seconds: durationSeconds,
                lives_remaining: lives,
                metadata: {
                    correct_count: correctCount,
                    wrong_count: wrongCount,
                    level_reached: level,
                    game_name: 'İşitsel Bellek',
                }
            });
        }
    }, [gameState, score, lives, correctCount, wrongCount, level, saveGamePlay, examMode, submitResult, navigate]);

    // Sıra tekrar dinle
    const replaySequence = () => {
        if (gameState === 'answering') {
            playSequence(sequence);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-white">
            {/* Decorative Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <div className="relative z-10 p-4 pt-20">
                <div className="max-w-4xl mx-auto flex items-center justify-between flex-wrap gap-4">
                    <Link
                        to={backLink}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft size={20} />
                        <span>{backLabel}</span>
                    </Link>

                    {gameState !== 'idle' && gameState !== 'finished' && (
                        <div className="flex items-center gap-4 flex-wrap">
                            {/* Score */}
                            <div
                                className="flex items-center gap-2 px-4 py-2 rounded-xl"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)',
                                    boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(251, 191, 36, 0.3)'
                                }}
                            >
                                <Star className="text-amber-400 fill-amber-400" size={18} />
                                <span className="font-bold text-amber-400">{score}</span>
                            </div>

                            {/* Lives */}
                            <div
                                className="flex items-center gap-2 px-4 py-2 rounded-xl"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)',
                                    boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)'
                                }}
                            >
                                {[...Array(3)].map((_, i) => (
                                    <Heart
                                        key={i}
                                        size={18}
                                        className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-900'}
                                    />
                                ))}
                            </div>

                            {/* Level */}
                            <div
                                className="flex items-center gap-2 px-4 py-2 rounded-xl"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(79, 70, 229, 0.1) 100%)',
                                    boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(99, 102, 241, 0.3)'
                                }}
                            >
                                <Music className="text-indigo-400" size={18} />
                                <span className="font-bold text-indigo-400">Seviye {level}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-4">
                <AnimatePresence mode="wait">
                    {/* Welcome Screen */}
                    {gameState === 'idle' && (
                        <motion.div
                            key="welcome"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center max-w-xl"
                        >
                            {/* 3D Gummy Icon */}
                            <motion.div
                                className="w-28 h-28 rounded-[40%] flex items-center justify-center mx-auto mb-6"
                                style={{
                                    background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                                    boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)'
                                }}
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Headphones size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                🎵 İşitsel Hafıza
                            </h1>

                            {/* Example */}
                            <div
                                className="rounded-2xl p-5 mb-6"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}
                            >
                                <p className="text-slate-400 text-sm mb-3">Nasıl Oynanır:</p>
                                <div className="flex justify-center gap-2 mb-3">
                                    {[0, 1, 2, 3].map(i => (
                                        <div
                                            key={i}
                                            className="w-12 h-12 rounded-[30%] flex items-center justify-center text-white font-bold"
                                            style={{
                                                background: `linear-gradient(135deg, ${NOTES[i].color} 0%, ${NOTES[i].color}99 100%)`,
                                                boxShadow: 'inset 0 -3px 6px rgba(0,0,0,0.2), inset 0 3px 6px rgba(255,255,255,0.2)'
                                            }}
                                        >
                                            {i + 1}
                                        </div>
                                    ))}
                                </div>
                                <p className="text-slate-400 text-sm">Sesleri dinle, aynı sırayla tekrarla!</p>
                            </div>

                            {/* Instructions */}
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                                <h3 className="text-lg font-bold text-indigo-300 mb-3 flex items-center gap-2">
                                    <Eye size={20} /> Nasıl Oynanır?
                                </h3>
                                <ul className="space-y-2 text-slate-300 text-sm">
                                    <li className="flex items-center gap-2">
                                        <Sparkles size={14} className="text-purple-400" />
                                        <span>Ses dizisini <strong>dikkatle dinle</strong></span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Sparkles size={14} className="text-purple-400" />
                                        <span>Aynı sırayla notaları tıkla</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Sparkles size={14} className="text-purple-400" />
                                        <span>Her seviyede dizi uzuyor, 3 can!</span>
                                    </li>
                                </ul>
                            </div>

                            {/* TUZÖ Badge */}
                            <div className="bg-indigo-500/10 text-indigo-300 text-xs px-4 py-2 rounded-full mb-6 inline-block border border-indigo-500/30">
                                TUZÖ 5.4.3 İşitsel Kısa Süreli Bellek
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05, y: -4 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={startGame}
                                className="px-8 py-4 rounded-2xl font-bold text-lg"
                                style={{
                                    background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(99, 102, 241, 0.4)'
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <Play size={24} fill="currentColor" />
                                    <span>Teste Başla</span>
                                </div>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* Playing States */}
                    {(gameState === 'listening' || gameState === 'answering' || gameState === 'feedback') && (
                        <motion.div
                            key="game"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full max-w-xl"
                        >
                            {/* Status */}
                            <div
                                className="rounded-2xl p-4 mb-6 text-center"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.2)',
                                    border: gameState === 'listening' ? '2px solid rgba(99, 102, 241, 0.5)' :
                                        gameState === 'feedback' && isCorrect ? '2px solid rgba(16, 185, 129, 0.5)' :
                                            gameState === 'feedback' && !isCorrect ? '2px solid rgba(239, 68, 68, 0.5)' :
                                                '2px solid rgba(245, 158, 11, 0.5)'
                                }}
                            >
                                {gameState === 'listening' && (
                                    <div className="flex items-center justify-center gap-3 text-indigo-400">
                                        <Volume2 className="w-6 h-6 animate-pulse" />
                                        <span className="text-lg font-bold">Dinle... ({currentPlayIndex + 1}/{sequence.length})</span>
                                    </div>
                                )}
                                {gameState === 'answering' && (
                                    <div className="flex items-center justify-center gap-3 text-amber-400">
                                        <Music className="w-6 h-6" />
                                        <span className="text-lg font-bold">
                                            Tekrarla! ({playerSequence.length}/{sequence.length})
                                        </span>
                                    </div>
                                )}
                                {gameState === 'feedback' && isCorrect && (
                                    <div className="flex items-center justify-center gap-3 text-emerald-400">
                                        <CheckCircle2 className="w-6 h-6" />
                                        <span className="text-lg font-bold">{feedbackState?.message}</span>
                                    </div>
                                )}
                                {gameState === 'feedback' && isCorrect === false && (
                                    <div className="flex items-center justify-center gap-3 text-red-400">
                                        <XCircle className="w-6 h-6" />
                                        <span className="text-lg font-bold">{feedbackState?.message}</span>
                                    </div>
                                )}
                            </div>

                            {/* Note Buttons */}
                            <div className="grid grid-cols-4 gap-3 mb-6">
                                {NOTES.map((note, index) => (
                                    <motion.button
                                        key={index}
                                        onClick={() => handleNoteClick(index)}
                                        disabled={gameState !== 'answering'}
                                        whileHover={gameState === 'answering' ? { scale: 1.05, y: -4 } : {}}
                                        whileTap={gameState === 'answering' ? { scale: 0.95 } : {}}
                                        className="aspect-square rounded-[30%] flex flex-col items-center justify-center text-white font-bold transition-all"
                                        style={{
                                            background: `linear-gradient(135deg, ${note.color} 0%, ${note.color}99 100%)`,
                                            boxShadow: activeNote === index
                                                ? `inset 0 -4px 8px rgba(0,0,0,0.2), 0 0 30px ${note.color}`
                                                : 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2)',
                                            transform: activeNote === index ? 'scale(1.1)' : undefined,
                                            opacity: gameState !== 'answering' ? 0.6 : 1,
                                            cursor: gameState === 'answering' ? 'pointer' : 'not-allowed'
                                        }}
                                    >
                                        <span className="text-2xl lg:text-3xl drop-shadow">{note.name}</span>
                                    </motion.button>
                                ))}
                            </div>

                            {/* Replay Button */}
                            {gameState === 'answering' && (
                                <div className="flex justify-center">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={replaySequence}
                                        className="px-6 py-3 rounded-xl font-bold flex items-center gap-2"
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                                            boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2)',
                                            border: '1px solid rgba(255,255,255,0.2)'
                                        }}
                                    >
                                        <RotateCcw className="w-5 h-5" />
                                        Tekrar Dinle
                                    </motion.button>
                                </div>
                            )}

                            {/* Progress */}
                            <div className="flex justify-center items-center gap-4 mt-4 text-sm text-slate-400">
                                <span>Dizi Uzunluğu: <strong className="text-indigo-400">{sequence.length}</strong></span>
                            </div>
                        </motion.div>
                    )}

                    {/* Game Over */}
                    {gameState === 'finished' && (
                        <motion.div
                            key="gameover"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center max-w-xl"
                        >
                            <motion.div
                                className="w-28 h-28 rounded-[40%] flex items-center justify-center mx-auto mb-6"
                                style={{
                                    background: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
                                    boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)'
                                }}
                                animate={{ rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <Trophy size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h2 className="text-3xl font-black text-amber-300 mb-2">
                                {bestLevel >= 5 ? '🎉 Harika!' : 'Oyun Bitti!'}
                            </h2>
                            <p className="text-slate-400 mb-6">
                                {bestLevel >= 5 ? 'Müthiş kulak hafızası!' : 'Tekrar deneyelim!'}
                            </p>

                            <div
                                className="rounded-2xl p-6 mb-8"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}
                            >
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Skor</p>
                                        <p className="text-3xl font-bold text-amber-400">{score}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">En İyi Seviye</p>
                                        <p className="text-3xl font-bold text-indigo-400">{bestLevel}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Doğru Dizi</p>
                                        <p className="text-3xl font-bold text-emerald-400">{correctCount}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Max Uzunluk</p>
                                        <p className="text-3xl font-bold text-purple-400">{getSequenceLength(bestLevel)}</p>
                                    </div>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={startGame}
                                className="w-full px-6 py-4 rounded-2xl font-bold text-lg mb-4"
                                style={{
                                    background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(99, 102, 241, 0.4)'
                                }}
                            >
                                <div className="flex items-center justify-center gap-3">
                                    <RotateCcw size={24} />
                                    <span>Tekrar Oyna</span>
                                </div>
                            </motion.button>

                            <Link
                                to={backLink}
                                className="block text-slate-500 hover:text-white transition-colors"
                            >
                                {location.state?.arcadeMode ? 'Bilsem Zeka' : 'Geri Dön'}
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AuditoryMemoryGame;

