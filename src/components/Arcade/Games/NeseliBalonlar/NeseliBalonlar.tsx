import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, ChevronLeft, Trophy, Star } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import confetti from 'canvas-confetti';

import { BalloonState, GamePhase, QuestionType } from './types';
import { BALLOON_COLORS, POP_DELAY, GAME_ID } from './constants';
import Balloon from './components/Balloon';
import { useGamePersistence } from '../../../../hooks/useGamePersistence';

// Seviye bazlı soru tipleri — ilerledikçe zorlaşır
function pickQuestionType(level: number): QuestionType {
    if (level <= 2) {
        // İlk 2 seviye: sadece RENK veya SAYI
        return Math.random() > 0.5 ? QuestionType.COLOR : QuestionType.NUMBER;
    }
    if (level <= 4) {
        // Seviye 3-4: POZİSYON eklenir
        const r = Math.random();
        if (r < 0.33) return QuestionType.COLOR;
        if (r < 0.66) return QuestionType.NUMBER;
        return QuestionType.POSITION;
    }
    // Seviye 5+: SIRA (ORDER) eklenir
    const r = Math.random();
    if (r < 0.25) return QuestionType.COLOR;
    if (r < 0.5) return QuestionType.NUMBER;
    if (r < 0.75) return QuestionType.POSITION;
    return QuestionType.ORDER;
}

// İzleme süresi — seviye arttıkça kısalır
function getWatchDuration(level: number): number {
    return Math.max(1500, 3500 - (level - 1) * 300);
}

const NeseliBalonlar: React.FC = () => {
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();

    const [balloons, setBalloons] = useState<BalloonState[]>([]);
    const [phase, setPhase] = useState<GamePhase>('idle');
    const [poppedIndices, setPoppedIndices] = useState<number[]>([]);
    const [popOrder, setPopOrder] = useState<number[]>([]); // ORDER sorusu için patlama sırası
    const [userGuesses, setUserGuesses] = useState<number[]>([]);
    const [score, setScore] = useState({ correct: 0, total: 0 });
    const [level, setLevel] = useState(1);
    const [questionType, setQuestionType] = useState<QuestionType>(QuestionType.NUMBER);

    const gameStartTimeRef = useRef<number>(0);
    const hasSavedRef = useRef(false);

    const getLevelConfig = (lvl: number) => {
        const totalBalloons = Math.min(2 + lvl, 8);
        const numToPop = Math.min(Math.floor((lvl + 1) / 2), totalBalloons - 1);
        return { totalBalloons, numToPop };
    };

    const initGame = useCallback((currentLvl: number) => {
        const { totalBalloons } = getLevelConfig(currentLvl);

        const randomNumbers = Array.from({ length: 10 }, (_, i) => i + 1)
            .sort(() => Math.random() - 0.5)
            .slice(0, totalBalloons);

        const shuffledColors = [...BALLOON_COLORS].sort(() => Math.random() - 0.5);

        const newBalloons: BalloonState[] = shuffledColors.slice(0, totalBalloons).map((color, index) => ({
            id: index,
            displayValue: randomNumbers[index],
            color,
            isPopped: false,
            isVisible: true,
            position: index,
        }));

        setQuestionType(pickQuestionType(currentLvl));
        setBalloons(newBalloons);
        setPoppedIndices([]);
        setPopOrder([]);
        setUserGuesses([]);
        setPhase('watching');
    }, []);

    const startGame = useCallback(() => {
        window.scrollTo(0, 0);
        hasSavedRef.current = false;
        gameStartTimeRef.current = Date.now();
        setLevel(1);
        setScore({ correct: 0, total: 0 });
        initGame(1);
    }, [initGame]);

    const nextLevel = () => {
        const newLvl = level + 1;
        setLevel(newLvl);
        initGame(newLvl);
    };

    const retryLevel = () => {
        initGame(level);
    };

    // Auto-start from Hub
    useEffect(() => {
        if (location.state?.autoStart && phase === 'idle') {
            startGame();
        }
    }, [location.state, phase, startGame]);

    // Watching -> Popping transition
    useEffect(() => {
        if (phase === 'watching') {
            const timer = setTimeout(() => {
                setPhase('popping');
            }, getWatchDuration(level));
            return () => clearTimeout(timer);
        }

        if (phase === 'popping') {
            const { numToPop } = getLevelConfig(level);
            const indices = Array.from({ length: balloons.length }, (_, i) => i)
                .sort(() => 0.5 - Math.random())
                .slice(0, numToPop);

            setPoppedIndices(indices);
            setPopOrder([...indices]); // Patlama sırasını kaydet

            indices.forEach((idx, i) => {
                setTimeout(() => {
                    setBalloons(prev => prev.map(b => b.id === idx ? { ...b, isPopped: true } : b));

                    if (i === indices.length - 1) {
                        setTimeout(() => {
                            setBalloons(prev => prev.map(b => b.isPopped ? { ...b, isVisible: false } : b));
                            setPhase('guessing');
                        }, 1000);
                    }
                }, i * POP_DELAY);
            });
        }
    }, [phase, level, balloons.length]);

    // Seçeneklerde DISTRACTOR (yanıltıcı) ekle
    const answerOptions = useMemo(() => {
        if (questionType === QuestionType.COLOR) {
            // Mevcut balonların renkleri + havuzdan ekstra renkler
            const usedColorNames = new Set(balloons.map(b => b.color.name));
            const distractors = BALLOON_COLORS.filter(c => !usedColorNames.has(c.name));
            // Seviyeye göre distractor sayısı artır
            const numDistractors = Math.min(Math.floor(level / 2) + 1, distractors.length, 3);
            const shuffledDistractors = [...distractors].sort(() => Math.random() - 0.5).slice(0, numDistractors);

            // Her balon bir seçenek + distractors
            const options = balloons.map(b => ({
                id: b.id,
                label: b.color.name,
                colorDot: b.color.primary,
                isDistractor: false
            }));

            shuffledDistractors.forEach((c, i) => {
                options.push({
                    id: -(i + 1), // negative id = distractor
                    label: c.name,
                    colorDot: c.primary,
                    isDistractor: true
                });
            });

            return options.sort(() => Math.random() - 0.5);
        }

        if (questionType === QuestionType.NUMBER) {
            const usedNumbers = new Set(balloons.map(b => b.displayValue));
            const allNumbers = Array.from({ length: 10 }, (_, i) => i + 1);
            const unusedNumbers = allNumbers.filter(n => !usedNumbers.has(n));
            const numDistractors = Math.min(Math.floor(level / 2) + 1, unusedNumbers.length, 3);
            const shuffledDistractors = [...unusedNumbers].sort(() => Math.random() - 0.5).slice(0, numDistractors);

            const options = balloons.map(b => ({
                id: b.id,
                label: String(b.displayValue),
                colorDot: undefined as string | undefined,
                isDistractor: false
            }));

            shuffledDistractors.forEach((n, i) => {
                options.push({
                    id: -(i + 1),
                    label: String(n),
                    colorDot: undefined,
                    isDistractor: true
                });
            });

            return options.sort(() => Math.random() - 0.5);
        }

        if (questionType === QuestionType.POSITION) {
            // Pozisyon sorusu: "Kaçıncı sırada patladı?" → 1. 2. 3. ...
            return Array.from({ length: balloons.length }, (_, i) => ({
                id: i,
                label: `${i + 1}. sıra`,
                colorDot: undefined as string | undefined,
                isDistractor: false
            }));
        }

        // ORDER: Sıralama sorusu — seçenekler renk adları
        return balloons
            .filter(b => poppedIndices.includes(b.id))
            .map(b => ({
                id: b.id,
                label: b.color.name,
                colorDot: b.color.primary,
                isDistractor: false
            }))
            .sort(() => Math.random() - 0.5);
    }, [questionType, balloons, level, poppedIndices]);

    const handleGuess = (optionId: number) => {
        if (phase !== 'guessing') return;

        if (questionType === QuestionType.ORDER) {
            // ORDER: sıralı seçim — toggle yerine ekleme/son seçimi geri alma
            if (userGuesses.length > 0 && userGuesses[userGuesses.length - 1] === optionId) {
                // Son seçimi geri al
                setUserGuesses(prev => prev.slice(0, -1));
            } else if (!userGuesses.includes(optionId) && userGuesses.length < poppedIndices.length) {
                setUserGuesses(prev => [...prev, optionId]);
            }
            return;
        }

        // POSITION sorusu: tek seçim
        if (questionType === QuestionType.POSITION) {
            if (userGuesses.includes(optionId)) {
                setUserGuesses(prev => prev.filter(g => g !== optionId));
            } else if (userGuesses.length < poppedIndices.length) {
                setUserGuesses(prev => [...prev, optionId]);
            }
            return;
        }

        // COLOR & NUMBER: toggle seçim
        if (userGuesses.includes(optionId)) {
            setUserGuesses(prev => prev.filter(g => g !== optionId));
        } else if (userGuesses.length < poppedIndices.length) {
            setUserGuesses(prev => [...prev, optionId]);
        }
    };

    const submitGuesses = () => {
        let isCorrect = false;

        if (questionType === QuestionType.ORDER) {
            // ORDER: sıralama doğru mu?
            isCorrect = userGuesses.length === popOrder.length &&
                userGuesses.every((g, i) => g === popOrder[i]);
        } else if (questionType === QuestionType.POSITION) {
            // POSITION: patlayan balonların pozisyonlarını seçti mi?
            const poppedPositions = poppedIndices.map(idx => balloons[idx].position);
            isCorrect = userGuesses.length === poppedPositions.length &&
                userGuesses.every(g => poppedPositions.includes(g));
        } else {
            // COLOR & NUMBER: patlayan balonların id'lerini seçti mi?
            isCorrect = userGuesses.length === poppedIndices.length &&
                userGuesses.every(g => poppedIndices.includes(g));
        }

        if (isCorrect) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }

        setScore(prev => ({
            correct: prev.correct + (isCorrect ? 1 : 0),
            total: prev.total + 1
        }));
        setPhase('result');
    };

    const isSuccess = useMemo(() => {
        if (questionType === QuestionType.ORDER) {
            return userGuesses.length === popOrder.length &&
                userGuesses.every((g, i) => g === popOrder[i]);
        }
        if (questionType === QuestionType.POSITION) {
            const poppedPositions = poppedIndices.map(idx => balloons[idx].position);
            return userGuesses.length === poppedPositions.length &&
                userGuesses.every(g => poppedPositions.includes(g));
        }
        return userGuesses.length === poppedIndices.length &&
            userGuesses.every(g => poppedIndices.includes(g));
    }, [questionType, userGuesses, poppedIndices, popOrder, balloons]);

    // Game Over save logic
    useEffect(() => {
        if (phase === 'result' && !hasSavedRef.current) {
            hasSavedRef.current = true;
            saveGamePlay({
                game_id: GAME_ID,
                score_achieved: score.correct * 10 + (isSuccess ? 10 : 0),
                duration_seconds: (Date.now() - gameStartTimeRef.current) / 1000,
                metadata: { level_reached: level, correct_rounds: score.correct + (isSuccess ? 1 : 0), total_rounds: score.total + 1 }
            });
        }
    }, [phase, level, score, isSuccess, saveGamePlay]);

    useEffect(() => {
        if (phase === 'watching') {
            hasSavedRef.current = false;
        }
    }, [phase]);

    // Soru metni
    const questionText = useMemo(() => {
        const count = poppedIndices.length;
        switch (questionType) {
            case QuestionType.COLOR:
                return { main: `Hangi ${count} balonun`, highlight: 'RENGİ', rest: 'patladı?' };
            case QuestionType.NUMBER:
                return { main: `Hangi ${count} balonun`, highlight: 'RAKAMI', rest: 'patladı?' };
            case QuestionType.POSITION:
                return { main: `Patlayan ${count} balon`, highlight: 'NEREDE', rest: 'duruyordu?' };
            case QuestionType.ORDER:
                return { main: 'Balonlar hangi', highlight: 'SIRADA', rest: 'patladı?' };
        }
    }, [questionType, poppedIndices.length]);

    // Tahmin fazında kalan balonları gizle (seviye 3+)
    const shouldHideRemaining = level >= 3;

    return (
        <div className="flex flex-col items-center min-h-screen overflow-hidden bg-gradient-to-br from-violet-950 via-purple-950 to-slate-900 p-2 sm:p-4 md:p-10 select-none pt-16 sm:pt-20 touch-none" style={{ WebkitTapHighlightColor: 'transparent' }}>
            {/* HUD */}
            <div className="fixed top-16 sm:top-20 left-2 sm:left-4 right-2 sm:right-4 z-30 flex justify-between items-center pointer-events-none">
                <div className="flex gap-2 sm:gap-4 pointer-events-auto">
                    <Link to="/bilsem-zeka" className="bg-white/10 backdrop-blur-xl px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl shadow-lg flex items-center gap-1.5 sm:gap-2 border border-white/20 hover:bg-white/20 transition-colors">
                        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-pink-400" />
                        <span className="font-bold text-white text-xs sm:text-sm">BİLSEM</span>
                    </Link>
                </div>
                <div className="flex gap-2 sm:gap-3 pointer-events-auto">
                    <div className="bg-emerald-500/20 backdrop-blur-xl px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl shadow-lg flex items-center gap-1.5 sm:gap-2 border border-emerald-500/30">
                        <Star className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 fill-emerald-400" />
                        <span className="font-bold text-emerald-400 text-sm sm:text-base">Bölüm {level}</span>
                    </div>
                    <div className="bg-amber-500/20 backdrop-blur-xl px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl shadow-lg flex items-center gap-1.5 sm:gap-2 border border-amber-500/30">
                        <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                        <span className="font-bold text-amber-400 text-sm sm:text-base">{score.correct * 10}</span>
                    </div>
                </div>
            </div>

            {/* Ana Oyun Alanı */}
            <div className="relative w-full max-w-5xl bg-white/10 backdrop-blur-xl rounded-2xl sm:rounded-[3rem] p-3 sm:p-6 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/20 overflow-hidden mt-12 sm:mt-16">
                <h1 className="text-center text-xl sm:text-3xl md:text-4xl font-black bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent mb-4 sm:mb-8 drop-shadow-sm">
                    🎈 NEŞELİ BALONLAR 🎈
                </h1>

                {/* Balonlar Gösterim Alanı */}
                <div className="flex flex-wrap justify-center gap-3 sm:gap-6 md:gap-10 min-h-[200px] sm:min-h-[300px] items-start mb-6 sm:mb-10">
                    {balloons.map((balloon) => {
                        // Tahmin fazında kalan balonları gizle (seviye 3+)
                        const isHidden = shouldHideRemaining && phase === 'guessing' && !balloon.isPopped;
                        return (
                            <div key={balloon.id} className="relative group">
                                <Balloon
                                    color={balloon.color}
                                    isPopped={(balloon.isPopped && phase !== 'result') || isHidden}
                                    isVisible={(balloon.isVisible && !isHidden) || (phase === 'result' && poppedIndices.includes(balloon.id))}
                                    displayLabel={(phase === 'watching' || phase === 'idle') ? balloon.displayValue : undefined}
                                    highlighted={userGuesses.includes(balloon.id)}
                                />
                                {phase === 'guessing' && !balloon.isVisible && (
                                    <div
                                        onClick={() => {
                                            if (questionType === QuestionType.POSITION) return; // Pozisyon ayrı seçilir
                                            handleGuess(balloon.id);
                                        }}
                                        className={`absolute top-0 left-1/2 -translate-x-1/2 w-20 h-24 rounded-[50%_50%_50%_50%_/_60%_60%_40%_40%] border-4 border-dashed flex items-center justify-center cursor-pointer transition-all ${userGuesses.includes(balloon.id)
                                            ? 'bg-yellow-200 border-yellow-500 scale-110'
                                            : 'bg-white/30 border-white/50 hover:bg-white/50'
                                            }`}
                                    >
                                        <span className="text-4xl font-black text-white/60">?</span>
                                    </div>
                                )}
                                {/* Seviye 3+ kalan balonları gizle — soru işareti göster */}
                                {isHidden && phase === 'guessing' && (
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-24 rounded-[50%_50%_50%_50%_/_60%_60%_40%_40%] border-4 border-dashed border-white/20 flex items-center justify-center bg-white/10">
                                        <span className="text-3xl font-black text-white/30">?</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Dinamik Kontrol Paneli */}
                <div className="flex flex-col items-center">
                    <AnimatePresence mode="wait">
                        {phase === 'idle' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="flex flex-col items-center gap-3 sm:gap-4"
                            >
                                <button
                                    onClick={startGame}
                                    onTouchStart={(e) => { e.preventDefault(); startGame(); }}
                                    className="group relative px-10 sm:px-16 py-4 sm:py-6 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-black text-xl sm:text-3xl rounded-xl sm:rounded-2xl transition-all flex items-center gap-3 sm:gap-4 touch-none"
                                    style={{ boxShadow: '0 8px 32px rgba(168, 85, 247, 0.4)', WebkitTapHighlightColor: 'transparent' }}
                                >
                                    <Play className="w-6 h-6 sm:w-8 sm:h-8" fill="white" /> OYNA
                                </button>
                                <div className="bg-pink-500/20 text-pink-300 text-[10px] sm:text-xs px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-pink-500/30 text-center">
                                    TÜZÖ 1.1.1 Renk-Sayı Hafızası
                                </div>
                            </motion.div>
                        )}

                        {phase === 'watching' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col items-center gap-4"
                            >
                                <div className="text-xl sm:text-3xl font-black text-white bg-purple-500/30 backdrop-blur-xl px-6 sm:px-8 py-3 rounded-2xl border border-purple-500/40">
                                    Balonları Aklında Tut! 🧠
                                </div>
                                {/* Süre göstergesi */}
                                <div className="w-48 h-2 bg-white/20 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: '100%' }}
                                        animate={{ width: '0%' }}
                                        transition={{ duration: getWatchDuration(level) / 1000, ease: 'linear' }}
                                        className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
                                    />
                                </div>
                                <div className="text-xs text-white/50">
                                    ⏱ {(getWatchDuration(level) / 1000).toFixed(1)}s
                                </div>
                            </motion.div>
                        )}

                        {phase === 'popping' && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-xl sm:text-3xl font-black text-pink-300 animate-pulse bg-pink-500/30 backdrop-blur-xl px-6 sm:px-8 py-3 rounded-2xl border border-pink-500/40"
                            >
                                Dikkat! Patlıyorlar! 💥
                            </motion.div>
                        )}

                        {phase === 'guessing' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="w-full max-w-3xl space-y-6 sm:space-y-8"
                            >
                                <div className="text-center">
                                    <h2 className="text-lg sm:text-2xl md:text-4xl font-black text-white mb-4 bg-white/10 backdrop-blur-xl py-3 sm:py-4 rounded-2xl border border-white/20">
                                        {questionText.main} <span className="text-pink-400">{questionText.highlight}</span> {questionText.rest}
                                    </h2>
                                    {questionType === QuestionType.ORDER && (
                                        <p className="text-sm text-purple-300/70 animate-pulse">
                                            Önce patlayan balonu ilk seç! 1, 2, 3...
                                        </p>
                                    )}
                                </div>

                                <div className="flex justify-center">
                                    {questionType === QuestionType.NUMBER ? (
                                        <div className="grid grid-cols-4 md:grid-cols-6 gap-3 bg-white/40 p-4 sm:p-6 rounded-[2rem] border-2 border-white shadow-inner">
                                            {answerOptions.map((opt) => (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => handleGuess(opt.id)}
                                                    className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl font-black text-xl sm:text-2xl transition-all shadow-md ${userGuesses.includes(opt.id)
                                                        ? 'bg-yellow-400 text-white translate-y-2 shadow-none scale-110'
                                                        : opt.isDistractor
                                                            ? 'bg-white/80 text-sky-400 hover:bg-sky-50'
                                                            : 'bg-white text-sky-500 hover:bg-sky-50'
                                                        }`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    ) : questionType === QuestionType.COLOR ? (
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 bg-white/40 p-4 sm:p-6 rounded-[2rem] border-2 border-white shadow-inner">
                                            {answerOptions.map((opt) => (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => handleGuess(opt.id)}
                                                    className={`px-4 sm:px-6 py-3 sm:py-4 rounded-2xl font-bold text-base sm:text-lg transition-all shadow-md flex items-center gap-3 border-b-4 ${userGuesses.includes(opt.id)
                                                        ? 'bg-yellow-100 border-yellow-400 translate-y-2 shadow-none scale-105'
                                                        : 'bg-white border-gray-200 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full shadow-inner flex-shrink-0" style={{ backgroundColor: opt.colorDot }}></div>
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    ) : questionType === QuestionType.POSITION ? (
                                        <div className="grid grid-cols-4 md:grid-cols-8 gap-3 bg-white/40 p-4 sm:p-6 rounded-[2rem] border-2 border-white shadow-inner">
                                            {answerOptions.map((opt) => (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => handleGuess(opt.id)}
                                                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl font-black text-sm sm:text-base transition-all shadow-md ${userGuesses.includes(opt.id)
                                                        ? 'bg-yellow-400 text-white translate-y-2 shadow-none scale-110'
                                                        : 'bg-white text-purple-500 hover:bg-purple-50'
                                                        }`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        /* ORDER sorusu */
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 bg-white/40 p-4 sm:p-6 rounded-[2rem] border-2 border-white shadow-inner">
                                                {answerOptions.map((opt) => {
                                                    const orderIdx = userGuesses.indexOf(opt.id);
                                                    return (
                                                        <button
                                                            key={opt.id}
                                                            onClick={() => handleGuess(opt.id)}
                                                            className={`px-4 sm:px-6 py-3 sm:py-4 rounded-2xl font-bold text-base sm:text-lg transition-all shadow-md flex items-center gap-3 border-b-4 relative ${orderIdx >= 0
                                                                ? 'bg-yellow-100 border-yellow-400 translate-y-2 shadow-none scale-105'
                                                                : 'bg-white border-gray-200 hover:bg-gray-50'
                                                                }`}
                                                        >
                                                            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full shadow-inner flex-shrink-0" style={{ backgroundColor: opt.colorDot }}></div>
                                                            {opt.label}
                                                            {orderIdx >= 0 && (
                                                                <span className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
                                                                    {orderIdx + 1}
                                                                </span>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            {userGuesses.length > 0 && (
                                                <div className="flex items-center gap-2 text-sm text-white/60">
                                                    <span>Seçim sırası:</span>
                                                    {userGuesses.map((g, i) => {
                                                        const b = balloons.find(bl => bl.id === g);
                                                        return (
                                                            <span key={i} className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-lg">
                                                                <span className="text-white font-bold">{i + 1}.</span>
                                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: b?.color.primary }} />
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col items-center gap-4 sm:gap-6">
                                    <div className="text-xl sm:text-2xl font-black text-white">
                                        Seçilen: {userGuesses.length} / {poppedIndices.length}
                                    </div>
                                    <button
                                        onClick={submitGuesses}
                                        disabled={userGuesses.length !== poppedIndices.length}
                                        className={`px-12 sm:px-20 py-4 sm:py-5 rounded-2xl font-black text-xl sm:text-2xl transition-all ${userGuesses.length === poppedIndices.length
                                            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                                            : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                            }`}
                                        style={{ boxShadow: userGuesses.length === poppedIndices.length ? '0 8px 32px rgba(16, 185, 129, 0.4)' : 'none' }}
                                    >
                                        TAMAMDIR! ✅
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {phase === 'result' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center space-y-6 sm:space-y-8"
                            >
                                <div className={`text-4xl sm:text-6xl md:text-8xl font-black drop-shadow-lg ${isSuccess ? 'text-emerald-400' : 'text-pink-400'}`}>
                                    {isSuccess ? 'HARİKA! 🎉' : 'Olsun! 🍭'}
                                </div>

                                <div className="bg-white/10 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-white/20 inline-block">
                                    <p className="text-xl sm:text-2xl font-black text-white mb-4 sm:mb-6">
                                        {questionType === QuestionType.ORDER ? 'Doğru Patlama Sırası:' : 'İşte Patlayan Balonlar:'}
                                    </p>
                                    <div className="flex flex-wrap gap-4 justify-center">
                                        {(questionType === QuestionType.ORDER ? popOrder : poppedIndices).map((idx, i) => (
                                            <div key={idx} className="flex flex-col items-center" style={{ animationDelay: `${i * 100}ms` }}>
                                                {questionType === QuestionType.ORDER && (
                                                    <div className="text-xs font-bold text-purple-300 mb-1">{i + 1}. sıra</div>
                                                )}
                                                <div className="w-14 h-18 sm:w-16 sm:h-20 rounded-full mb-2 shadow-lg" style={{ backgroundColor: balloons[idx].color.primary }}></div>
                                                <div className="text-lg sm:text-xl font-black text-white bg-white/20 px-4 py-1 rounded-full">
                                                    {balloons[idx].displayValue}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row gap-4 sm:gap-6 justify-center pt-4 sm:pt-6">
                                    {isSuccess ? (
                                        <button
                                            onClick={nextLevel}
                                            className="px-10 sm:px-12 py-5 sm:py-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-xl sm:text-2xl rounded-2xl transition-all"
                                            style={{ boxShadow: '0 8px 32px rgba(16, 185, 129, 0.4)' }}
                                        >
                                            SONRAKİ BÖLÜM 🚀
                                        </button>
                                    ) : (
                                        <button
                                            onClick={retryLevel}
                                            className="px-10 sm:px-12 py-5 sm:py-6 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-black text-xl sm:text-2xl rounded-2xl transition-all"
                                            style={{ boxShadow: '0 8px 32px rgba(249, 115, 22, 0.4)' }}
                                        >
                                            TEKRAR DENE 🔄
                                        </button>
                                    )}
                                    <button
                                        onClick={startGame}
                                        className="px-8 sm:px-10 py-5 sm:py-6 bg-white/10 border border-white/30 text-white font-black text-lg sm:text-xl rounded-2xl transition-all hover:bg-white/20"
                                    >
                                        EN BAŞA DÖN
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Decorations */}
            <div className="mt-10 flex gap-10 opacity-60">
                <span className="text-yellow-400 text-5xl animate-spin" style={{ animationDuration: '10s' }}>☀️</span>
                <span className="text-white text-5xl animate-pulse">☁️</span>
                <span className="text-sky-400 text-4xl">🐦</span>
            </div>
        </div>
    );
};

export default NeseliBalonlar;
