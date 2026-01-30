import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer, Target,
    CheckCircle2, XCircle, ChevronLeft, Zap, Heart,
    Volume2, Headphones, ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';

// Game Constants
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180; // 3 dakika
const MAX_LEVEL = 20;

// Rakam ses dosyaları
const NUMBER_SOUNDS: Record<number, string> = {
    0: '/mp3/rakamlar/0-sifir.mp3',
    1: '/mp3/rakamlar/1-bir.mp3',
    2: '/mp3/rakamlar/2-iki.mp3',
    3: '/mp3/rakamlar/3-uc.mp3',
    4: '/mp3/rakamlar/4-dort.mp3',
    5: '/mp3/rakamlar/5-bes.mp3',
    6: '/mp3/rakamlar/6-alti.mp3',
    7: '/mp3/rakamlar/7-yedi.mp3',
    8: '/mp3/rakamlar/8-sekiz.mp3',
    9: '/mp3/rakamlar/9-dokuz.mp3',
};

type Phase = 'welcome' | 'listening' | 'question' | 'feedback' | 'game_over' | 'victory';

interface Question {
    text: string;
    answer: number | string;
    options: (number | string)[];
    type: 'number' | 'order';
}

const NumberMemoryGame: React.FC = () => {
    // Persistence Hook
    const { saveGamePlay } = useGamePersistence();
    const hasSavedRef = useRef(false);

    // Core State
    const [phase, setPhase] = useState<Phase>('welcome');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [level, setLevel] = useState(1);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);

    // Game-Specific State
    const [numberSequence, setNumberSequence] = useState<number[]>([]);
    const [currentPlayIndex, setCurrentPlayIndex] = useState(-1);
    const [question, setQuestion] = useState<Question | null>(null);
    const [selectedAnswer, setSelectedAnswer] = useState<number | string | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

    // Refs
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Seviyeye göre dizi uzunluğu: Level 1 = 3 sayı, Level 20 = 7 sayı
    const getSequenceLength = (lvl: number): number => {
        return Math.min(3 + Math.floor(lvl / 4), 7);
    };

    // Timer Effect
    useEffect(() => {
        if ((phase === 'listening' || phase === 'question') && timeLeft > 0) {
            timerRef.current = setTimeout(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && (phase === 'listening' || phase === 'question')) {
            handleGameOver();
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [phase, timeLeft]);

    // Rastgele sayı dizisi oluştur
    const generateSequence = useCallback((lvl: number): number[] => {
        const length = getSequenceLength(lvl);
        const seq: number[] = [];
        for (let i = 0; i < length; i++) {
            seq.push(Math.floor(Math.random() * 10)); // 0-9 arası
        }
        return seq;
    }, []);

    // Ses çal - timeout ile korumalı
    const playNumber = useCallback((num: number): Promise<void> => {
        return new Promise((resolve) => {
            // Maximum 3 saniye timeout - ses yüklenemezse devam et
            const timeout = setTimeout(() => {
                console.warn(`Audio timeout for number ${num}`);
                resolve();
            }, 3000);

            if (audioRef.current) {
                audioRef.current.pause();
            }
            const audio = new Audio(NUMBER_SOUNDS[num]);
            audioRef.current = audio;

            audio.onended = () => {
                clearTimeout(timeout);
                resolve();
            };
            audio.onerror = () => {
                clearTimeout(timeout);
                console.error(`Audio error for number ${num}`);
                resolve();
            };
            audio.oncanplaythrough = () => {
                audio.play().catch(() => {
                    clearTimeout(timeout);
                    resolve();
                });
            };
            audio.load();
        });
    }, []);

    // Dizi seslerini çal
    const playSequence = useCallback(async (seq: number[]) => {
        setPhase('listening');
        for (let i = 0; i < seq.length; i++) {
            setCurrentPlayIndex(i);
            await playNumber(seq[i]);
            await new Promise(resolve => setTimeout(resolve, 400)); // Sesler arası bekleme
        }
        setCurrentPlayIndex(-1);
        // Soru oluştur
        generateQuestion(seq);
        setPhase('question');
    }, [playNumber]);

    // Soru oluştur
    const generateQuestion = useCallback((seq: number[]) => {
        const questionTypes = [
            // Tip 1: N. rakam hangisi?
            () => {
                const pos = Math.floor(Math.random() * seq.length);
                const ordinal = pos + 1;
                const answer = seq[pos];
                const options = [answer];
                while (options.length < 4) {
                    const fake = Math.floor(Math.random() * 10);
                    if (!options.includes(fake)) options.push(fake);
                }
                return {
                    text: `${ordinal}. söylenen rakam hangisiydi?`,
                    answer,
                    options: options.sort(() => Math.random() - 0.5),
                    type: 'number' as const
                };
            },
            // Tip 2: İki rakamın toplamı
            () => {
                if (seq.length < 2) return null;
                const pos1 = Math.floor(Math.random() * seq.length);
                let pos2 = Math.floor(Math.random() * seq.length);
                while (pos2 === pos1) pos2 = Math.floor(Math.random() * seq.length);
                const answer = seq[pos1] + seq[pos2];
                const options = [answer];
                while (options.length < 4) {
                    const fake = answer + Math.floor(Math.random() * 7) - 3;
                    if (!options.includes(fake) && fake >= 0 && fake <= 18) options.push(fake);
                }
                return {
                    text: `${pos1 + 1}. ve ${pos2 + 1}. rakamların toplamı kaçtır?`,
                    answer,
                    options: options.sort(() => Math.random() - 0.5),
                    type: 'number' as const
                };
            },
            // Tip 3: İleri sıralama
            () => {
                const forwardOrder = seq.join(' - ');
                // Yanlış seçenekler oluştur
                const shuffled1 = [...seq].sort(() => Math.random() - 0.5).join(' - ');
                const shuffled2 = [...seq].reverse().sort(() => Math.random() - 0.5).join(' - ');
                const reversed = [...seq].reverse().join(' - ');
                const options = [forwardOrder];
                if (shuffled1 !== forwardOrder && !options.includes(shuffled1)) options.push(shuffled1);
                if (reversed !== forwardOrder && !options.includes(reversed)) options.push(reversed);
                if (shuffled2 !== forwardOrder && !options.includes(shuffled2)) options.push(shuffled2);
                while (options.length < 4) {
                    const fake = [...seq].sort(() => Math.random() - 0.5).join(' - ');
                    if (!options.includes(fake)) options.push(fake);
                }
                return {
                    text: 'Rakamlar hangi sırayla söylendi? (İleri)',
                    answer: forwardOrder,
                    options: options.slice(0, 4).sort(() => Math.random() - 0.5),
                    type: 'order' as const
                };
            },
            // Tip 4: Geri sıralama
            () => {
                const backwardOrder = [...seq].reverse().join(' - ');
                const forwardOrder = seq.join(' - ');
                const shuffled1 = [...seq].sort(() => Math.random() - 0.5).join(' - ');
                const shuffled2 = [...seq].reverse().sort(() => Math.random() - 0.5).join(' - ');
                const options = [backwardOrder];
                if (forwardOrder !== backwardOrder && !options.includes(forwardOrder)) options.push(forwardOrder);
                if (shuffled1 !== backwardOrder && !options.includes(shuffled1)) options.push(shuffled1);
                if (shuffled2 !== backwardOrder && !options.includes(shuffled2)) options.push(shuffled2);
                while (options.length < 4) {
                    const fake = [...seq].sort(() => Math.random() - 0.5).join(' - ');
                    if (!options.includes(fake)) options.push(fake);
                }
                return {
                    text: 'Rakamlar ters sırayla hangisi? (Geri)',
                    answer: backwardOrder,
                    options: options.slice(0, 4).sort(() => Math.random() - 0.5),
                    type: 'order' as const
                };
            },
            // Tip 5: En büyük rakam hangisiydi?
            () => {
                const maxNum = Math.max(...seq);
                const options = [maxNum];
                while (options.length < 4) {
                    const fake = Math.floor(Math.random() * 10);
                    if (!options.includes(fake)) options.push(fake);
                }
                return {
                    text: 'Söylenen rakamlardan en büyüğü hangisiydi?',
                    answer: maxNum,
                    options: options.sort(() => Math.random() - 0.5),
                    type: 'number' as const
                };
            },
            // Tip 6: Kaç farklı rakam söylendi?
            () => {
                const uniqueCount = new Set(seq).size;
                const options = [uniqueCount];
                while (options.length < 4) {
                    const fake = Math.floor(Math.random() * seq.length) + 1;
                    if (!options.includes(fake) && fake <= 10) options.push(fake);
                }
                return {
                    text: 'Kaç farklı rakam söylendi?',
                    answer: uniqueCount,
                    options: options.sort(() => Math.random() - 0.5),
                    type: 'number' as const
                };
            },
        ];

        let q: Question | null = null;
        let attempts = 0;
        while (!q && attempts < 10) {
            const randomType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
            q = randomType();
            attempts++;
        }

        if (!q) {
            q = questionTypes[0]()!;
        }

        setQuestion(q);
    }, []);

    // Level başlat
    const startLevel = useCallback((lvl: number) => {
        const seq = generateSequence(lvl);
        setNumberSequence(seq);
        setQuestion(null);
        setSelectedAnswer(null);
        setIsCorrect(null);
        playSequence(seq);
    }, [generateSequence, playSequence]);

    // Oyunu başlat
    const handleStart = useCallback(() => {
        setScore(0);
        setLives(INITIAL_LIVES);
        setLevel(1);
        setTimeLeft(TIME_LIMIT);
        startTimeRef.current = Date.now();
        hasSavedRef.current = false;
        startLevel(1);
    }, [startLevel]);

    // Game Over Handler
    const handleGameOver = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;

        setPhase('game_over');

        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

        await saveGamePlay({
            game_id: 'sayisal-hafiza',
            score_achieved: score,
            duration_seconds: duration,
            metadata: {
                levels_completed: level,
                final_lives: lives,
                game_name: 'Sayısal Hafıza',
            }
        });
    }, [saveGamePlay, score, level, lives]);

    // Victory Handler
    const handleVictory = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;

        setPhase('victory');

        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

        await saveGamePlay({
            game_id: 'sayisal-hafiza',
            score_achieved: score,
            duration_seconds: duration,
            metadata: {
                levels_completed: MAX_LEVEL,
                victory: true,
                game_name: 'Sayısal Hafıza',
            }
        });
    }, [saveGamePlay, score]);

    // Cevap seç
    const handleAnswer = useCallback((answer: number | string) => {
        if (phase !== 'question' || selectedAnswer !== null) return;

        setSelectedAnswer(answer);
        const correct = answer === question?.answer;
        setIsCorrect(correct);
        setPhase('feedback');

        setTimeout(() => {
            if (correct) {
                const newScore = score + 10 * level;
                setScore(newScore);

                if (level >= MAX_LEVEL) {
                    handleVictory();
                } else {
                    const newLevel = level + 1;
                    setLevel(newLevel);
                    startLevel(newLevel);
                }
            } else {
                const newLives = lives - 1;
                setLives(newLives);

                if (newLives <= 0) {
                    handleGameOver();
                } else {
                    // Aynı seviyeyi tekrar
                    startLevel(level);
                }
            }
        }, 1500);
    }, [phase, selectedAnswer, question, score, level, lives, handleVictory, handleGameOver, startLevel]);

    // Tekrar dinle
    const replaySequence = useCallback(() => {
        if (phase === 'question') {
            playSequence(numberSequence);
        }
    }, [phase, numberSequence, playSequence]);

    // Format Time
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950 to-slate-900 text-white">
            {/* Decorative Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <div className="relative z-10 p-4 pt-20">
                <div className="max-w-4xl mx-auto flex items-center justify-between flex-wrap gap-4">
                    <Link
                        to="/atolyeler/bireysel-degerlendirme"
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft size={20} />
                        <span>Geri</span>
                    </Link>

                    {(phase === 'listening' || phase === 'question' || phase === 'feedback') && (
                        <div className="flex items-center gap-4 flex-wrap">
                            {/* Score */}
                            <div className="flex items-center gap-2 bg-amber-500/20 px-4 py-2 rounded-xl">
                                <Star className="text-amber-400" size={20} />
                                <span className="font-bold text-amber-400">{score}</span>
                            </div>

                            {/* Lives */}
                            <div className="flex items-center gap-2 bg-red-500/20 px-4 py-2 rounded-xl">
                                <Heart className="text-red-400" size={20} />
                                <span className="font-bold text-red-400">{lives}</span>
                            </div>

                            {/* Timer */}
                            <div className="flex items-center gap-2 bg-blue-500/20 px-4 py-2 rounded-xl">
                                <Timer className="text-blue-400" size={20} />
                                <span className={`font-bold ${timeLeft <= 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'}`}>
                                    {formatTime(timeLeft)}
                                </span>
                            </div>

                            {/* Level */}
                            <div className="flex items-center gap-2 bg-emerald-500/20 px-4 py-2 rounded-xl">
                                <Zap className="text-emerald-400" size={20} />
                                <span className="font-bold text-emerald-400">Seviye {level}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-4">
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
                            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl flex items-center justify-center">
                                <Headphones size={48} className="text-white" />
                            </div>

                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                                🔢 Sayısal Hafıza
                            </h1>

                            <p className="text-slate-400 mb-8">
                                Sesli okunan rakamları dinle ve soruları doğru cevapla!
                                Rakamların sırasını, toplamını veya belirli pozisyondaki sayıyı hatırla.
                            </p>

                            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 mb-8 text-left">
                                <h3 className="text-lg font-bold text-violet-400 mb-4">Soru Tipleri:</h3>
                                <ul className="space-y-3 text-slate-300 text-sm">
                                    <li className="flex items-center gap-3">
                                        <ArrowRight className="text-violet-400" size={16} />
                                        <span>N. söylenen rakam hangisiydi?</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <ArrowRight className="text-violet-400" size={16} />
                                        <span>İki rakamın toplamı kaçtır?</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <ArrowRight className="text-violet-400" size={16} />
                                        <span>Rakamların doğru sırası (ileri/geri)</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <ArrowRight className="text-violet-400" size={16} />
                                        <span>En büyük rakam hangisiydi?</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="flex flex-wrap justify-center gap-4 mb-8">
                                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2">
                                    <Heart className="text-red-400" size={16} />
                                    <span className="text-sm text-slate-300">{INITIAL_LIVES} Can</span>
                                </div>
                                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2">
                                    <Timer className="text-blue-400" size={16} />
                                    <span className="text-sm text-slate-300">{TIME_LIMIT / 60} Dakika</span>
                                </div>
                                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2">
                                    <Target className="text-emerald-400" size={16} />
                                    <span className="text-sm text-slate-300">{MAX_LEVEL} Seviye</span>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleStart}
                                className="px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl font-bold text-lg shadow-lg shadow-violet-500/25"
                            >
                                <div className="flex items-center gap-3">
                                    <Play size={24} />
                                    <span>Başla</span>
                                </div>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* Listening Phase */}
                    {phase === 'listening' && (
                        <motion.div
                            key="listening"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center"
                        >
                            <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-12">
                                <motion.div
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ repeat: Infinity, duration: 1 }}
                                    className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center"
                                >
                                    <Volume2 size={64} className="text-white" />
                                </motion.div>

                                <h2 className="text-3xl font-bold text-violet-400 mb-4">Dinle...</h2>

                                <div className="flex justify-center gap-3 mt-8">
                                    {numberSequence.map((_, index) => (
                                        <motion.div
                                            key={index}
                                            animate={{
                                                scale: currentPlayIndex === index ? 1.3 : 1,
                                                backgroundColor: currentPlayIndex === index ? '#8b5cf6' : '#475569'
                                            }}
                                            className="w-8 h-8 rounded-full"
                                        />
                                    ))}
                                </div>

                                <p className="text-slate-400 mt-6">
                                    {currentPlayIndex + 1} / {numberSequence.length} rakam
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {/* Question Phase */}
                    {(phase === 'question' || phase === 'feedback') && question && (
                        <motion.div
                            key="question"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="w-full max-w-2xl"
                        >
                            <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8">
                                {/* Replay Button */}
                                <div className="flex justify-end mb-4">
                                    <button
                                        onClick={replaySequence}
                                        disabled={phase === 'feedback'}
                                        className="flex items-center gap-2 px-4 py-2 bg-violet-500/20 rounded-xl text-violet-400 hover:bg-violet-500/30 transition-colors disabled:opacity-50"
                                    >
                                        <Volume2 size={18} />
                                        <span className="text-sm">Tekrar Dinle</span>
                                    </button>
                                </div>

                                {/* Question */}
                                <h2 className="text-2xl font-bold text-center text-white mb-8">
                                    {question.text}
                                </h2>

                                {/* Options */}
                                <div className={`grid gap-4 ${question.type === 'order' ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                    {question.options.map((opt, index) => {
                                        const isSelected = selectedAnswer === opt;
                                        const isCorrectAnswer = opt === question.answer;

                                        let bgColor = 'bg-slate-700/50 hover:bg-slate-600/50';
                                        if (phase === 'feedback') {
                                            if (isCorrectAnswer) {
                                                bgColor = 'bg-emerald-500/30 border-emerald-500';
                                            } else if (isSelected && !isCorrectAnswer) {
                                                bgColor = 'bg-red-500/30 border-red-500';
                                            }
                                        }

                                        return (
                                            <motion.button
                                                key={index}
                                                whileHover={{ scale: phase === 'question' ? 1.02 : 1 }}
                                                whileTap={{ scale: phase === 'question' ? 0.98 : 1 }}
                                                onClick={() => handleAnswer(opt)}
                                                disabled={phase === 'feedback'}
                                                className={`p-5 rounded-2xl border-2 border-transparent font-bold text-xl transition-all ${bgColor} ${question.type === 'order' ? 'text-lg' : 'text-2xl'
                                                    }`}
                                            >
                                                {opt}
                                            </motion.button>
                                        );
                                    })}
                                </div>

                                {/* Feedback */}
                                {phase === 'feedback' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`mt-6 p-4 rounded-xl flex items-center justify-center gap-3 ${isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                                            }`}
                                    >
                                        {isCorrect ? (
                                            <>
                                                <CheckCircle2 size={24} />
                                                <span className="font-bold">Doğru! +{10 * level} puan</span>
                                            </>
                                        ) : (
                                            <>
                                                <XCircle size={24} />
                                                <span className="font-bold">Yanlış! Doğru cevap: {question.answer}</span>
                                            </>
                                        )}
                                    </motion.div>
                                )}
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

                            <h2 className="text-3xl font-bold text-red-400 mb-4">Oyun Bitti!</h2>

                            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 mb-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Skor</p>
                                        <p className="text-2xl font-bold text-amber-400">{score}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-400 text-sm">Seviye</p>
                                        <p className="text-2xl font-bold text-emerald-400">{level}</p>
                                    </div>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleStart}
                                className="px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl font-bold text-lg"
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
                            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-3xl flex items-center justify-center animate-bounce">
                                <Trophy size={48} className="text-white" />
                            </div>

                            <h2 className="text-3xl font-bold text-amber-400 mb-4">🎉 Şampiyon!</h2>

                            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 mb-6">
                                <p className="text-4xl font-bold text-amber-400">{score}</p>
                                <p className="text-slate-400">Toplam Puan</p>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleStart}
                                className="px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-2xl font-bold text-lg"
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

export default NumberMemoryGame;
