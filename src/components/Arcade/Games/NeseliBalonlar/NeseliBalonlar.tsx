import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useLocation } from 'react-router-dom';

import { BalloonState, GamePhase, QuestionType } from './types';
import { BALLOON_COLORS, POP_DELAY, GAME_ID } from './constants';
import Balloon from './components/Balloon';
import { useGamePersistence } from '../../../../hooks/useGamePersistence';
import ArcadeGameShell from '../../Shared/ArcadeGameShell';
import ArcadeFeedbackBanner from '../../Shared/ArcadeFeedbackBanner';
import { ARCADE_SCORE_FORMULA, ARCADE_SCORE_BASE, ARCADE_FEEDBACK_TEXTS } from '../../Shared/ArcadeConstants';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pickQuestionType(level: number): QuestionType {
    if (level <= 2) return Math.random() > 0.5 ? QuestionType.COLOR : QuestionType.NUMBER;
    if (level <= 4) {
        const r = Math.random();
        if (r < 0.33) return QuestionType.COLOR;
        if (r < 0.66) return QuestionType.NUMBER;
        return QuestionType.POSITION;
    }
    const r = Math.random();
    if (r < 0.25) return QuestionType.COLOR;
    if (r < 0.5) return QuestionType.NUMBER;
    if (r < 0.75) return QuestionType.POSITION;
    return QuestionType.ORDER;
}

function getWatchDuration(level: number): number {
    return Math.max(1500, 3500 - (level - 1) * 300);
}

function getLevelConfig(lvl: number) {
    const totalBalloons = Math.min(2 + lvl, 8);
    const numToPop = Math.min(Math.floor((lvl + 1) / 2), totalBalloons - 1);
    return { totalBalloons, numToPop };
}

function getShellStatus(phase: GamePhase, gameOver: boolean): 'START' | 'PLAYING' | 'GAME_OVER' | 'SUCCESS' {
    if (phase === 'idle') return 'START';
    if (gameOver || phase === 'gameover') return 'GAME_OVER';
    return 'PLAYING';
}

// ─── Component ───────────────────────────────────────────────────────────────

const NeseliBalonlar: React.FC = () => {
    const { saveGamePlay } = useGamePersistence();
    const location = useLocation();

    // ─── State ───────────────────────────────────────────────────────────────
    const [balloons, setBalloons] = useState<BalloonState[]>([]);
    const [phase, setPhase] = useState<GamePhase>('idle');
    const [poppedIndices, setPoppedIndices] = useState<number[]>([]);
    const [popOrder, setPopOrder] = useState<number[]>([]);
    const [userGuesses, setUserGuesses] = useState<number[]>([]);
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [lives, setLives] = useState(3);
    const [questionType, setQuestionType] = useState<QuestionType>(QuestionType.NUMBER);
    const [gameOver, setGameOver] = useState(false);
    const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const gameStartTimeRef = useRef<number>(0);
    const hasSavedRef = useRef(false);
    const isResolvingRef = useRef(false);

    // ─── Auto-Start from Hub ─────────────────────────────────────────────────
    useEffect(() => {
        if (location.state?.autoStart && phase === 'idle') {
            handleStartGame();
        }
    }, [location.state]);

    // ─── Game Init ───────────────────────────────────────────────────────────
    const initLevel = useCallback((currentLvl: number) => {
        const { totalBalloons } = getLevelConfig(currentLvl);
        const randomNumbers = Array.from({ length: 10 }, (_, i) => i + 1)
            .sort(() => Math.random() - 0.5)
            .slice(0, totalBalloons);
        const shuffledColors = [...BALLOON_COLORS].sort(() => Math.random() - 0.5);

        const newBalloons: BalloonState[] = shuffledColors.slice(0, totalBalloons).map((color, index) => ({
            id: Date.now() + index + Math.floor(Math.random() * 1000),
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

    const handleStartGame = useCallback(() => {
        hasSavedRef.current = false;
        gameStartTimeRef.current = Date.now();
        setLevel(1);
        setScore(0);
        setLives(3);
        setGameOver(false);
        setFeedback(null);
        initLevel(1);
    }, [initLevel]);

    // ─── Save Game ───────────────────────────────────────────────────────────
    const doSave = useCallback(() => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        saveGamePlay({
            game_id: GAME_ID,
            score_achieved: score,
            duration_seconds: (Date.now() - gameStartTimeRef.current) / 1000,
            metadata: { level_reached: level }
        });
    }, [score, level, saveGamePlay]);

    // ─── Phase Transitions ───────────────────────────────────────────────────
    useEffect(() => {
        if (phase === 'watching') {
            const timer = setTimeout(() => setPhase('popping'), getWatchDuration(level));
            return () => clearTimeout(timer);
        }

        if (phase === 'popping') {
            const { numToPop } = getLevelConfig(level);
            const shuffledBalloons = [...balloons].sort(() => 0.5 - Math.random());
            const indices = shuffledBalloons.slice(0, numToPop).map(b => b.id);

            setPoppedIndices(indices);
            setPopOrder([...indices]);

            indices.forEach((id, i) => {
                setTimeout(() => {
                    setBalloons(prev => prev.map(b => b.id === id ? { ...b, isPopped: true } : b));
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

    // ─── Answer Options ──────────────────────────────────────────────────────
    const answerOptions = useMemo(() => {
        if (questionType === QuestionType.COLOR) {
            const usedColorNames = new Set(balloons.map(b => b.color.name));
            const distractors = BALLOON_COLORS.filter(c => !usedColorNames.has(c.name));
            const numDistractors = Math.min(Math.floor(level / 2) + 1, distractors.length, 3);
            const shuffledDistractors = [...distractors].sort(() => Math.random() - 0.5).slice(0, numDistractors);

            const options = balloons.map(b => ({
                id: b.id, label: b.color.name, colorDot: b.color.primary, isDistractor: false
            }));
            shuffledDistractors.forEach((c, i) => {
                options.push({ id: -(i + 1), label: c.name, colorDot: c.primary, isDistractor: true });
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
                id: b.id, label: String(b.displayValue), colorDot: undefined as string | undefined, isDistractor: false
            }));
            shuffledDistractors.forEach((n, i) => {
                options.push({ id: -(i + 1), label: String(n), colorDot: undefined, isDistractor: true });
            });
            return options.sort(() => Math.random() - 0.5);
        }

        if (questionType === QuestionType.POSITION) {
            return [...balloons]
                .sort((a, b) => a.position - b.position)
                .map((balloon) => ({
                    id: balloon.id, label: `${balloon.position + 1}. sıra`,
                    colorDot: undefined as string | undefined, isDistractor: false
                }));
        }

        // ORDER
        return balloons
            .filter(b => poppedIndices.includes(b.id))
            .map(b => ({ id: b.id, label: b.color.name, colorDot: b.color.primary, isDistractor: false }))
            .sort(() => Math.random() - 0.5);
    }, [questionType, balloons, level, poppedIndices]);

    // ─── Handle Guess ────────────────────────────────────────────────────────
    const handleGuess = (optionId: number) => {
        if (phase !== 'guessing' || isResolvingRef.current) return;

        if (questionType === QuestionType.ORDER) {
            if (userGuesses.length > 0 && userGuesses[userGuesses.length - 1] === optionId) {
                setUserGuesses(prev => prev.slice(0, -1));
            } else if (!userGuesses.includes(optionId) && userGuesses.length < poppedIndices.length) {
                setUserGuesses(prev => [...prev, optionId]);
            }
            return;
        }

        if (questionType === QuestionType.POSITION) {
            if (userGuesses.includes(optionId)) {
                setUserGuesses(prev => prev.filter(g => g !== optionId));
            } else if (userGuesses.length < poppedIndices.length) {
                setUserGuesses(prev => [...prev, optionId]);
            }
            return;
        }

        // COLOR & NUMBER: toggle
        if (userGuesses.includes(optionId)) {
            setUserGuesses(prev => prev.filter(g => g !== optionId));
        } else if (userGuesses.length < poppedIndices.length) {
            setUserGuesses(prev => [...prev, optionId]);
        }
    };

    // ─── Submit ──────────────────────────────────────────────────────────────
    const submitGuesses = () => {
        if (isResolvingRef.current) return;
        isResolvingRef.current = true;

        let isCorrect = false;
        if (questionType === QuestionType.ORDER) {
            isCorrect = userGuesses.length === popOrder.length &&
                userGuesses.every((g, i) => g === popOrder[i]);
        } else if (questionType === QuestionType.POSITION) {
            const poppedPositions = poppedIndices
                .map(id => balloons.find(b => b.id === id)?.position)
                .filter((p): p is number => p !== undefined);
            const guessedPositions = userGuesses
                .map(id => balloons.find(b => b.id === id)?.position)
                .filter((p): p is number => p !== undefined);
            isCorrect = guessedPositions.length === poppedPositions.length &&
                guessedPositions.every(p => poppedPositions.includes(p));
        } else {
            isCorrect = userGuesses.length === poppedIndices.length &&
                userGuesses.every(g => poppedIndices.includes(g));
        }

        if (isCorrect) {
            const msgs = ARCADE_FEEDBACK_TEXTS.SUCCESS_MESSAGES;
            setFeedback({ message: msgs[Math.floor(Math.random() * msgs.length)], type: 'success' });
            setScore(prev => prev + ARCADE_SCORE_FORMULA(ARCADE_SCORE_BASE, level));
        } else {
            const msgs = ARCADE_FEEDBACK_TEXTS.ERROR_MESSAGES;
            setFeedback({ message: msgs[Math.floor(Math.random() * msgs.length)], type: 'error' });
            setLives(prev => prev - 1);
        }

        setPhase('result');

        setTimeout(() => {
            setFeedback(null);
            isResolvingRef.current = false;

            if (!isCorrect && lives <= 1) {
                setGameOver(true);
                setPhase('gameover');
                doSave();
            } else if (isCorrect) {
                const newLvl = level + 1;
                setLevel(newLvl);
                initLevel(newLvl);
            } else {
                // Yanlış ama can var — aynı seviyeyi tekrar dene
                initLevel(level);
            }
        }, 2000);
    };

    // ─── Question Text ───────────────────────────────────────────────────────
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

    const shouldHideRemaining = level >= 3;
    const shellStatus = getShellStatus(phase, gameOver);

    // ─── Render ──────────────────────────────────────────────────────────────
    return (
        <ArcadeGameShell
            gameState={{ score, level, lives, status: shellStatus }}
            gameMetadata={{
                id: 'neseli-balonlar',
                title: 'NEŞELİ BALONLAR',
                description: <p>Balonları izle, patlayan balonların renk ve rakamlarını hatırla!</p>,
                tuzoCode: '1.1.1 Renk-Sayı Hafızası',
                icon: <Sparkles className="w-14 h-14 text-black" strokeWidth={3} />,
                iconBgColor: 'bg-sky-400',
                containerBgColor: 'bg-sky-200 dark:bg-slate-900'
            }}
            onStart={handleStartGame}
            onRestart={handleStartGame}
            showLevel={true}
            showLives={true}
        >
            <div className="h-full bg-sky-200 dark:bg-slate-900 flex flex-col items-center p-1 sm:p-2 md:p-4 overflow-hidden relative transition-colors duration-300">
                {/* Spacer for Shell HUD */}
                <div className="h-14 sm:h-16" />

                {/* Feedback Banner */}
                <ArcadeFeedbackBanner message={feedback?.message ?? null} type={feedback?.type} />

                {/* Background */}
                <div className="absolute inset-0 opacity-10 pointer-events-none bg-[repeating-linear-gradient(45deg,transparent,transparent_20px,#000_20px,#000_40px)] dark:bg-[repeating-linear-gradient(45deg,transparent,transparent_20px,rgba(255,255,255,0.05)_20px,rgba(255,255,255,0.05)_40px)] z-0" />

                {/* Main Game Area */}
                <main className="w-full flex-1 flex flex-col items-center justify-start relative z-10 max-w-5xl mx-auto">

                    {/* Balloon Display */}
                    <div className="flex flex-wrap justify-center gap-2 sm:gap-4 md:gap-6 min-h-[100px] sm:min-h-[160px] md:min-h-[200px] items-start mb-3 sm:mb-6">
                        {balloons.map((balloon) => {
                            const isHidden = shouldHideRemaining && phase === 'guessing' && !balloon.isPopped;
                            const isPositionMask = phase === 'guessing' && questionType === QuestionType.POSITION;

                            return (
                                <div key={balloon.id} className="relative group">
                                    <Balloon
                                        color={balloon.color}
                                        isPopped={(balloon.isPopped && phase !== 'result') || isHidden || isPositionMask}
                                        isVisible={(balloon.isVisible && !isHidden && !isPositionMask) || (phase === 'result' && poppedIndices.includes(balloon.id))}
                                        displayLabel={(phase === 'watching' || phase === 'idle') ? balloon.displayValue : undefined}
                                    />
                                    {isPositionMask && (
                                        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-16 h-20 sm:w-20 sm:h-24 rounded-[50%_50%_50%_50%_/_60%_60%_40%_40%] border-2 border-black/10 dark:border-slate-950 flex items-center justify-center transition-all ${userGuesses.includes(balloon.id) ? 'bg-yellow-400 scale-110 shadow-none -translate-y-1' : 'bg-gray-200 dark:bg-slate-700 shadow-inner opacity-90'}`}>
                                            <span className={`text-2xl sm:text-4xl font-black ${userGuesses.includes(balloon.id) ? 'text-black' : 'text-black/50 dark:text-white/50'}`}>?</span>
                                        </div>
                                    )}
                                    {phase === 'guessing' && !isPositionMask && !balloon.isVisible && (
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-20 sm:w-20 sm:h-24 rounded-[50%_50%_50%_50%_/_60%_60%_40%_40%] border-2 border-black/10 dark:border-slate-950 flex items-center justify-center bg-white dark:bg-slate-700 shadow-neo-sm">
                                            <span className="text-2xl sm:text-4xl font-black text-black dark:text-white">?</span>
                                        </div>
                                    )}
                                    {phase === 'guessing' && !isPositionMask && isHidden && (
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-20 sm:w-20 sm:h-24 rounded-[50%_50%_50%_50%_/_60%_60%_40%_40%] border-2 border-black/10 dark:border-slate-950 border-dashed flex items-center justify-center bg-gray-100 dark:bg-slate-800 opacity-60">
                                            <span className="text-xl sm:text-3xl font-black text-black/50 dark:text-white/50">?</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Control Panel */}
                    <div className="flex flex-col items-center w-full">
                        <AnimatePresence mode="wait">
                            {phase === 'watching' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-center gap-3 sm:gap-4"
                                >
                                    <div className="text-lg sm:text-2xl font-black text-black bg-purple-300 px-5 sm:px-8 py-2 sm:py-3 rounded-2xl border-2 border-black/10 shadow-neo-sm -rotate-1">
                                        Balonları Aklında Tut! 🧠
                                    </div>
                                    <div className="w-48 sm:w-64 h-3 sm:h-4 bg-gray-200 dark:bg-slate-700 border-2 border-black/10 dark:border-slate-950 rounded-full overflow-hidden shadow-[inset_0_4px_4px_rgba(0,0,0,0.1)]">
                                        <motion.div
                                            initial={{ width: '100%' }}
                                            animate={{ width: '0%' }}
                                            transition={{ duration: getWatchDuration(level) / 1000, ease: 'linear' }}
                                            className="h-full bg-rose-500 rounded-full"
                                        />
                                    </div>
                                </motion.div>
                            )}

                            {phase === 'popping' && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-lg sm:text-2xl font-black text-black bg-rose-400 animate-pulse px-5 sm:px-8 py-2 sm:py-3 rounded-2xl border-2 border-black/10 shadow-neo-sm rotate-1"
                                >
                                    Dikkat! Patlıyorlar! 💥
                                </motion.div>
                            )}

                            {phase === 'guessing' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="w-full max-w-3xl space-y-3 sm:space-y-5"
                                >
                                    {/* Question */}
                                    <div className="text-center">
                                        <h2 className="text-base sm:text-xl md:text-2xl font-black text-black dark:text-white mb-2 bg-white dark:bg-slate-800 border-2 border-black/10 dark:border-slate-700 py-3 sm:py-4 px-3 rounded-2xl shadow-neo-sm rotate-1 transition-colors duration-300">
                                            {questionType === QuestionType.ORDER ? (
                                                <>Balonlar hangi <span className="text-rose-500 underline decoration-4 decoration-yellow-400 underline-offset-4">SIRADA</span> patladı?</>
                                            ) : (
                                                <>{questionText.main} <span className="text-rose-500 underline decoration-4 decoration-yellow-400 underline-offset-4">{questionText.highlight}</span> {questionText.rest}</>
                                            )}
                                        </h2>
                                        {questionType === QuestionType.ORDER && (
                                            <p className="text-sm font-bold text-black bg-yellow-400 inline-block px-3 py-1 border-2 border-black/10 rounded-xl shadow-neo-sm -rotate-2">
                                                Önce patlayanı en başa koy! 1, 2, 3...
                                            </p>
                                        )}
                                    </div>

                                    {/* Answer Options */}
                                    <div className="flex justify-center w-full">
                                        {questionType === QuestionType.NUMBER ? (
                                            <div className="grid grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3 bg-gray-100 dark:bg-slate-800 p-3 sm:p-5 rounded-2xl border-2 border-black/10 dark:border-slate-700 shadow-[inset_4px_4px_0_rgba(0,0,0,0.1)]">
                                                {answerOptions.map((opt) => (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => handleGuess(opt.id)}
                                                        className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl font-black text-xl sm:text-2xl transition-all border-2 border-black/10 dark:border-slate-950 ${userGuesses.includes(opt.id)
                                                            ? 'bg-yellow-400 text-black shadow-none translate-x-0.5 translate-y-0.5'
                                                            : 'bg-white dark:bg-slate-700 text-black dark:text-white shadow-neo-sm hover:-translate-y-1 active:translate-y-1 active:shadow-none'
                                                            }`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : questionType === QuestionType.COLOR ? (
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 bg-gray-100 dark:bg-slate-800 p-3 sm:p-5 rounded-2xl border-2 border-black/10 dark:border-slate-700 shadow-[inset_4px_4px_0_rgba(0,0,0,0.1)]">
                                                {answerOptions.map((opt) => (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => handleGuess(opt.id)}
                                                        className={`px-3 sm:px-4 py-2 sm:py-3 rounded-xl font-black text-sm sm:text-base transition-all border-2 border-black/10 dark:border-slate-950 flex items-center justify-center gap-2 ${userGuesses.includes(opt.id)
                                                            ? 'bg-yellow-400 text-black shadow-none translate-x-0.5 translate-y-0.5'
                                                            : 'bg-white dark:bg-slate-700 text-black dark:text-white shadow-neo-sm hover:-translate-y-1 active:translate-y-1 active:shadow-none'
                                                            }`}
                                                    >
                                                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-3 border-black/10 shadow-neo-sm shrink-0" style={{ backgroundColor: opt.colorDot }}></div>
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : questionType === QuestionType.POSITION ? (
                                            <div className="grid grid-cols-4 md:grid-cols-8 gap-2 sm:gap-3 bg-gray-100 dark:bg-slate-800 p-3 sm:p-5 rounded-2xl border-2 border-black/10 dark:border-slate-700 shadow-[inset_4px_4px_0_rgba(0,0,0,0.1)]">
                                                {answerOptions.map((opt) => (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => handleGuess(opt.id)}
                                                        className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl font-black text-xs sm:text-sm transition-all border-2 border-black/10 dark:border-slate-950 ${userGuesses.includes(opt.id)
                                                            ? 'bg-yellow-400 text-black shadow-none translate-x-0.5 translate-y-0.5'
                                                            : 'bg-white dark:bg-slate-700 text-black dark:text-white shadow-neo-sm hover:-translate-y-1 active:translate-y-1 active:shadow-none'
                                                            }`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            /* ORDER */
                                            <div className="flex flex-col items-center gap-3 w-full">
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 bg-gray-100 dark:bg-slate-800 p-3 sm:p-5 rounded-2xl border-2 border-black/10 dark:border-slate-700 shadow-[inset_4px_4px_0_rgba(0,0,0,0.1)] w-full">
                                                    {answerOptions.map((opt) => {
                                                        const orderIdx = userGuesses.indexOf(opt.id);
                                                        return (
                                                            <button
                                                                key={opt.id}
                                                                onClick={() => handleGuess(opt.id)}
                                                                className={`px-3 sm:px-4 py-2 sm:py-3 rounded-xl font-black text-sm sm:text-base transition-all border-2 border-black/10 dark:border-slate-950 flex items-center justify-center gap-2 relative ${orderIdx >= 0
                                                                    ? 'bg-yellow-400 text-black shadow-none translate-x-0.5 translate-y-0.5'
                                                                    : 'bg-white dark:bg-slate-700 text-black dark:text-white shadow-neo-sm hover:-translate-y-1 active:translate-y-1 active:shadow-none'
                                                                    }`}
                                                            >
                                                                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-3 border-black/10 shadow-neo-sm shrink-0" style={{ backgroundColor: opt.colorDot }}></div>
                                                                {opt.label}
                                                                {orderIdx >= 0 && (
                                                                    <span className="absolute -top-2 -right-2 w-6 h-6 sm:w-8 sm:h-8 bg-cyan-400 border-3 border-black/10 rounded-full flex items-center justify-center text-black text-xs sm:text-sm font-black shadow-neo-sm">
                                                                        {orderIdx + 1}
                                                                    </span>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                {userGuesses.length > 0 && (
                                                    <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 bg-white dark:bg-slate-800 border-2 border-black/10 dark:border-slate-700 p-2 sm:p-3 rounded-xl shadow-neo-sm transition-colors duration-300">
                                                        <span className="font-black text-black dark:text-white text-xs sm:text-sm mr-1">SIRA:</span>
                                                        {userGuesses.map((g, i) => {
                                                            const b = balloons.find(bl => bl.id === g);
                                                            return (
                                                                <span key={i} className="flex items-center gap-1 bg-gray-100 dark:bg-slate-700 border-2 border-black/10 dark:border-slate-600 px-2 py-1 rounded-lg">
                                                                    <span className="text-black dark:text-white font-black text-xs">{i + 1}.</span>
                                                                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-black/10" style={{ backgroundColor: b?.color.primary }} />
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Submit */}
                                    <div className="flex flex-col items-center gap-2 sm:gap-3">
                                        <div className="text-sm sm:text-lg font-black text-black dark:text-white bg-yellow-400 px-4 py-1.5 rounded-xl border-2 border-black/10 shadow-neo-sm rotate-2">
                                            Seçilen: {userGuesses.length} / {poppedIndices.length}
                                        </div>
                                        <button
                                            onClick={submitGuesses}
                                            disabled={userGuesses.length !== poppedIndices.length}
                                            className={`px-8 sm:px-14 py-3 sm:py-4 rounded-2xl font-black text-lg sm:text-2xl transition-all border-2 border-black/10 dark:border-slate-950 uppercase ${userGuesses.length === poppedIndices.length
                                                ? 'bg-emerald-400 text-black shadow-neo-sm hover:-translate-y-1 active:translate-y-2 active:shadow-none'
                                                : 'bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-slate-500 shadow-neo-sm cursor-not-allowed'
                                                }`}
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
                                    className="text-center space-y-3 sm:space-y-4"
                                >
                                    <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl border-2 border-black/10 dark:border-slate-700 shadow-neo-sm inline-block transition-colors duration-300">
                                        <p className="text-base sm:text-xl font-black text-black dark:text-white mb-3 uppercase transition-colors duration-300">
                                            {questionType === QuestionType.ORDER ? 'Doğru Patlama Sırası' : 'Patlayan Balonlar'}
                                        </p>
                                        <div className="flex flex-wrap gap-3 justify-center">
                                            {(questionType === QuestionType.ORDER ? popOrder : poppedIndices).map((id, i) => {
                                                const balloonData = balloons.find(b => b.id === id);
                                                if (!balloonData) return null;
                                                return (
                                                    <div key={id} className="flex flex-col items-center bg-gray-100 dark:bg-slate-700 p-2 sm:p-3 rounded-xl border-2 border-black/10 dark:border-slate-600 shadow-neo-sm">
                                                        {questionType === QuestionType.ORDER && (
                                                            <div className="text-xs font-black text-black bg-yellow-400 px-2 py-0.5 rounded-full border-2 border-black/10 mb-1">{i + 1}. sıra</div>
                                                        )}
                                                        <div className="w-10 h-14 sm:w-12 sm:h-16 rounded-full mb-1 border-2 border-black/10 shadow-[inset_-4px_-4px_0_rgba(0,0,0,0.2)]" style={{ backgroundColor: balloonData.color.primary }}></div>
                                                        <div className="text-lg sm:text-xl font-black text-black dark:text-white">{balloonData.displayValue}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </main>
            </div>
        </ArcadeGameShell>
    );
};

export default NeseliBalonlar;
