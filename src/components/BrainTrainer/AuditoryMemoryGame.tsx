import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Trophy, RotateCcw, Play, Star, Volume2, CheckCircle2, XCircle, ChevronLeft, Zap, Headphones, Music } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';

// Ses notaları - Web Audio API ile oluşturulacak
const NOTES = [
    { name: 'Do', frequency: 261.63, color: '#ef4444' },   // Kırmızı
    { name: 'Re', frequency: 293.66, color: '#f97316' },   // Turuncu
    { name: 'Mi', frequency: 329.63, color: '#eab308' },   // Sarı
    { name: 'Fa', frequency: 349.23, color: '#22c55e' },   // Yeşil
    { name: 'Sol', frequency: 392.00, color: '#06b6d4' },  // Cyan
    { name: 'La', frequency: 440.00, color: '#3b82f6' },   // Mavi
    { name: 'Si', frequency: 493.88, color: '#8b5cf6' },   // Mor
    { name: 'Do2', frequency: 523.25, color: '#ec4899' },  // Pembe
];

const AuditoryMemoryGame: React.FC = () => {
    const { saveGamePlay } = useGamePersistence();
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

    // Seviyeye göre dizi uzunluğu
    const getSequenceLength = (lvl: number) => Math.min(2 + lvl, 9); // Level 1 = 3, Level 7 = 9

    // Audio Context oluştur
    const getAudioContext = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
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
        // Resume audio context if suspended
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

    // Oyuncu nota seçti
    const handleNoteClick = useCallback((noteIndex: number) => {
        if (gameState !== 'answering') return;

        playNote(noteIndex, 300);
        const newPlayerSequence = [...playerSequence, noteIndex];
        setPlayerSequence(newPlayerSequence);

        // Doğru mu kontrol et
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
                    // Aynı seviyeyi tekrar dene
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
            saveGamePlay({
                game_id: 'isitsel-hafiza',
                score_achieved: score,
                duration_seconds: durationSeconds,
                lives_remaining: lives,
                metadata: {
                    correct_count: correctCount,
                    wrong_count: wrongCount,
                    best_level: bestLevel,
                    max_sequence_length: getSequenceLength(bestLevel),
                    game_name: 'İşitsel Hafıza',
                }
            });
        }
    }, [gameState]);

    // Sıra tekrar dinle
    const replaySequence = () => {
        if (gameState === 'answering') {
            playSequence(sequence);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 pt-24 pb-12 px-6">
            <div className="container mx-auto max-w-4xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-6"
                >
                    <Link
                        to="/atolyeler/bireysel-degerlendirme"
                        className="inline-flex items-center gap-2 text-indigo-400 font-bold hover:text-indigo-300 transition-colors mb-4 uppercase text-xs tracking-widest"
                    >
                        <ChevronLeft size={16} />
                        Bireysel Değerlendirme
                    </Link>
                    <h1 className="text-4xl lg:text-5xl font-black text-white mb-2">
                        🎵 <span className="text-indigo-400">İşitsel</span> Hafıza
                    </h1>
                    <p className="text-slate-400">Ses dizisini dinle ve tekrarla!</p>
                </motion.div>

                {/* Stats */}
                <div className="flex justify-center gap-4 mb-6 flex-wrap">
                    <div className="bg-slate-800/50 border border-white/10 rounded-xl px-5 py-2 flex items-center gap-2">
                        <Star className="w-5 h-5 text-amber-400" />
                        <span className="text-white font-bold">{score}</span>
                    </div>
                    {gameState !== 'idle' && gameState !== 'finished' && (
                        <>
                            <div className="bg-slate-800/50 border border-white/10 rounded-xl px-5 py-2 flex items-center gap-2">
                                <Music className="w-5 h-5 text-indigo-400" />
                                <span className="text-white font-bold">Seviye {level}</span>
                            </div>
                            <div className="bg-slate-800/50 border border-white/10 rounded-xl px-5 py-2 flex items-center gap-2">
                                {[...Array(3)].map((_, i) => (
                                    <span key={i} className={`text-xl ${i < lives ? 'text-red-400' : 'text-slate-600'}`}>♥</span>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Game Area */}
                <div className="flex flex-col items-center">
                    {/* Idle State */}
                    {gameState === 'idle' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center space-y-6"
                        >
                            <div className="bg-slate-800/50 border border-white/10 rounded-3xl p-8 max-w-lg">
                                <div className="text-6xl mb-4">🎵</div>
                                <h2 className="text-2xl font-bold text-white mb-4">İşitsel Hafıza Testi</h2>

                                <div className="bg-slate-700/50 rounded-xl p-4 mb-6">
                                    <p className="text-slate-300 text-sm mb-3">Nasıl Oynanır:</p>
                                    <div className="flex justify-center gap-2 mb-3">
                                        {[0, 1, 2, 3].map(i => (
                                            <div
                                                key={i}
                                                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                                                style={{ backgroundColor: NOTES[i].color }}
                                            >
                                                {i + 1}
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-slate-400 text-sm">
                                        Sesleri dinle, aynı sırayla tekrarla!
                                    </p>
                                </div>

                                <ul className="text-slate-400 text-sm space-y-2 text-left mb-6">
                                    <li className="flex items-center gap-2">
                                        <Headphones className="w-4 h-4 text-indigo-400" />
                                        Ses dizisini <strong className="text-white">dikkatle dinle</strong>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Volume2 className="w-4 h-4 text-emerald-400" />
                                        Aynı sırayla notaları tıkla
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-amber-400" />
                                        Her seviyede dizi uzuyor, 3 can!
                                    </li>
                                </ul>

                                <button
                                    onClick={startGame}
                                    className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-xl hover:from-indigo-400 hover:to-purple-400 transition-all flex items-center gap-3 mx-auto"
                                >
                                    <Play className="w-5 h-5" />
                                    Teste Başla
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Playing States */}
                    {(gameState === 'listening' || gameState === 'answering' || gameState === 'feedback') && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="w-full max-w-xl"
                        >
                            {/* Status */}
                            <div className={`bg-slate-800/70 border-2 rounded-2xl p-4 mb-6 text-center ${gameState === 'listening' ? 'border-indigo-500' :
                                    gameState === 'feedback' ? (isCorrect ? 'border-emerald-500' : 'border-red-500') :
                                        'border-amber-500'
                                }`}>
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
                                        <span className="text-lg font-bold">Doğru! +{100 + level * 50} puan</span>
                                    </div>
                                )}
                                {gameState === 'feedback' && isCorrect === false && (
                                    <div className="flex items-center justify-center gap-3 text-red-400">
                                        <XCircle className="w-6 h-6" />
                                        <span className="text-lg font-bold">Yanlış sıra! {lives > 1 ? `${lives - 1} can kaldı` : 'Oyun bitti!'}</span>
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
                                        whileHover={{ scale: gameState === 'answering' ? 1.05 : 1 }}
                                        whileTap={{ scale: gameState === 'answering' ? 0.95 : 1 }}
                                        className={`aspect-square rounded-2xl flex flex-col items-center justify-center text-white font-bold transition-all ${activeNote === index
                                                ? 'ring-4 ring-white scale-110'
                                                : ''
                                            } ${gameState !== 'answering'
                                                ? 'opacity-60 cursor-not-allowed'
                                                : 'hover:ring-2 hover:ring-white/50 cursor-pointer'
                                            }`}
                                        style={{
                                            backgroundColor: activeNote === index ? note.color : `${note.color}99`,
                                            boxShadow: activeNote === index ? `0 0 30px ${note.color}` : 'none'
                                        }}
                                    >
                                        <span className="text-2xl lg:text-3xl">{note.name}</span>
                                    </motion.button>
                                ))}
                            </div>

                            {/* Replay Button */}
                            {gameState === 'answering' && (
                                <div className="flex justify-center">
                                    <button
                                        onClick={replaySequence}
                                        className="px-6 py-3 bg-slate-700/50 border border-white/20 text-white font-bold rounded-xl hover:bg-slate-600/50 transition-all flex items-center gap-2"
                                    >
                                        <RotateCcw className="w-5 h-5" />
                                        Tekrar Dinle
                                    </button>
                                </div>
                            )}

                            {/* Progress */}
                            <div className="flex justify-center items-center gap-4 mt-4 text-sm text-slate-400">
                                <span>Dizi Uzunluğu: <strong className="text-indigo-400">{sequence.length}</strong></span>
                            </div>
                        </motion.div>
                    )}

                    {/* Finished State */}
                    {gameState === 'finished' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center space-y-6 w-full max-w-md"
                        >
                            <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-3xl p-8">
                                <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                                <h2 className="text-3xl font-black text-white mb-2">Oyun Bitti! 🎵</h2>

                                <div className="grid grid-cols-2 gap-4 my-6">
                                    <div className="bg-slate-800/50 rounded-xl p-4">
                                        <p className="text-slate-400 text-sm">Toplam Puan</p>
                                        <p className="text-2xl font-black text-amber-400">{score}</p>
                                    </div>
                                    <div className="bg-slate-800/50 rounded-xl p-4">
                                        <p className="text-slate-400 text-sm">En Yüksek Seviye</p>
                                        <p className="text-2xl font-black text-indigo-400">{bestLevel}</p>
                                    </div>
                                    <div className="bg-slate-800/50 rounded-xl p-4">
                                        <p className="text-slate-400 text-sm">Doğru Dizi</p>
                                        <p className="text-2xl font-black text-emerald-400">{correctCount}</p>
                                    </div>
                                    <div className="bg-slate-800/50 rounded-xl p-4">
                                        <p className="text-slate-400 text-sm">Max Uzunluk</p>
                                        <p className="text-2xl font-black text-purple-400">{getSequenceLength(bestLevel)}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-center gap-2 text-sm text-slate-400 mb-6">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span>{correctCount} Doğru</span>
                                    <span className="text-slate-600">|</span>
                                    <XCircle className="w-4 h-4 text-red-400" />
                                    <span>{wrongCount} Yanlış</span>
                                </div>

                                <div className="flex justify-center gap-4">
                                    <button
                                        onClick={startGame}
                                        className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-xl hover:from-indigo-400 hover:to-purple-400 transition-all flex items-center gap-2"
                                    >
                                        <RotateCcw className="w-5 h-5" />
                                        Tekrar Oyna
                                    </button>
                                    <Link
                                        to="/atolyeler/bireysel-degerlendirme"
                                        className="px-6 py-3 bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-600 transition-all"
                                    >
                                        Geri Dön
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuditoryMemoryGame;
