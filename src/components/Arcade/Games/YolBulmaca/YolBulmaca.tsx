import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { GameStage, SequenceItem, Question, GridPos, Point } from './types';
import { generateSequence, generateQuestion, generateSmartPositions } from './utils';
import { COLORS, MEMORIZE_TIME_BASE, GRID_SIZE } from './constants';
import { DrawingCanvas } from './components/DrawingCanvas';
import { useGamePersistence } from '../../../../hooks/useGamePersistence';
import ArcadeGameShell from '../../Shared/ArcadeGameShell';
import ArcadeFeedbackBanner from '../../Shared/ArcadeFeedbackBanner';
import { ARCADE_FEEDBACK_TEXTS, ARCADE_SCORE_FORMULA, ARCADE_SCORE_BASE } from '../../Shared/ArcadeConstants';

const GAME_ID = 'yol-bulmaca';

// ── GameStage → Shell Status Mapping ────────────────────────────────────────
const getShellStatus = (
    stage: GameStage,
    gameOver: boolean,
): 'START' | 'PLAYING' | 'GAME_OVER' | 'SUCCESS' => {
    if (stage === GameStage.START) return 'START';
    if (stage === GameStage.RESULT && gameOver) return 'GAME_OVER';
    return 'PLAYING';
};

const YolBulmaca: React.FC = () => {
    const location = useLocation();
    const { saveGamePlay } = useGamePersistence();

    // Arcade mode detection
    const isArcadeMode = location.state?.arcadeMode === true;
    const autoStart = location.state?.autoStart === true;

    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [stage, setStage] = useState<GameStage>(GameStage.START);
    const [sequence, setSequence] = useState<SequenceItem[]>([]);
    const [question, setQuestion] = useState<Question | null>(null);
    const [optionPositions, setOptionPositions] = useState<GridPos[]>([]);
    const [startPos, setStartPos] = useState<GridPos>({ row: 0, col: 0 });
    const [goalPos, setGoalPos] = useState<GridPos>({ row: 5, col: 5 });
    const [carPos, setCarPos] = useState<Point>({ x: 0, y: 0 });
    const [isSuccess, setIsSuccess] = useState(false);
    const [memorizeTimeLeft, setMemorizeTimeLeft] = useState(0);
    const [lives, setLives] = useState(3);
    const [gameOver, setGameOver] = useState(false);

    // Feedback Banner State
    const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const hasSavedRef = useRef(false);
    const isResolvingRef = useRef(false);
    const gameStartTimeRef = useRef<number>(0);

    // Global Unmount Cleanup
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    // Auto-clear feedback banner
    useEffect(() => {
        if (feedback) {
            const t = setTimeout(() => setFeedback(null), 1500);
            return () => clearTimeout(t);
        }
    }, [feedback]);

    // Auto-start for arcade mode
    useEffect(() => {
        if (autoStart && stage === GameStage.START) {
            handleStartGame();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoStart, stage]);

    // Save game result with useEffect (following SKILL.md pattern)
    useEffect(() => {
        if (gameOver && !hasSavedRef.current) {
            hasSavedRef.current = true;
            saveGamePlay({
                game_id: GAME_ID,
                score_achieved: score,
                duration_seconds: (Date.now() - gameStartTimeRef.current) / 1000,
                metadata: {
                    level_reached: level,
                    lives_remaining: 0,
                    is_arcade_mode: isArcadeMode
                }
            });
        }
    }, [gameOver, score, level, isArcadeMode, saveGamePlay]);

    const startLevel = useCallback((explicitLevel?: number) => {
        const lvl = explicitLevel ?? level;
        const nextSeq = generateSequence(lvl);
        const nextQuest = generateQuestion(nextSeq, lvl);

        const correctAnswerIndex = nextQuest.options.findIndex(o => o === nextQuest.answer);
        const { start, goal, optionPositions } = generateSmartPositions(
            correctAnswerIndex,
            nextQuest.options.length
        );

        setSequence(nextSeq);
        setQuestion(nextQuest);
        setStartPos(start);
        setGoalPos(goal);
        setOptionPositions(optionPositions);
        setStage(GameStage.MEMORIZE);
        setIsSuccess(false);
        setFeedback(null);
        isResolvingRef.current = false;

        const time = MEMORIZE_TIME_BASE + (lvl * 500);
        setMemorizeTimeLeft(time);

        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setMemorizeTimeLeft(prev => {
                if (prev <= 100) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    setStage(GameStage.QUESTION);
                    return 0;
                }
                return prev - 100;
            });
        }, 100);
    }, [level]);

    const handleStartGame = () => {
        window.scrollTo(0, 0);
        gameStartTimeRef.current = Date.now();
        setScore(0);
        setLevel(1);
        setLives(3);
        setGameOver(false);
        setFeedback(null);
        hasSavedRef.current = false;
        isResolvingRef.current = false;
        startLevel(1); // Explicit level=1 to avoid setState async race
    };

    const handleFinishDrawing = (drawnPath: GridPos[]) => {
        // Guard against empty paths
        if (!drawnPath || drawnPath.length === 0) {
            setStage(GameStage.QUESTION);
            return;
        }
        if (isResolvingRef.current) return;
        isResolvingRef.current = true;

        setStage(GameStage.ANIMATING);
        animateCar(drawnPath);
    };

    const animateCar = (drawnPath: GridPos[]) => {
        // Clear any previous animation
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        // Set initial position immediately
        const firstPos = drawnPath[0];
        setCarPos({
            x: (firstPos.col + 0.5) * (100 / GRID_SIZE),
            y: (firstPos.row + 0.5) * (100 / GRID_SIZE)
        });

        let index = 1; // Start from 1 since we already set position 0

        timerRef.current = setInterval(() => {
            if (index >= drawnPath.length) {
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
                checkResult(drawnPath);
                return;
            }
            const gridPos = drawnPath[index];
            const x = (gridPos.col + 0.5) * (100 / GRID_SIZE);
            const y = (gridPos.row + 0.5) * (100 / GRID_SIZE);
            setCarPos({ x, y });
            index++;
        }, 200);
    };

    const checkResult = (drawnPath: GridPos[]) => {
        if (!question) return;

        const answerIndex = question.options.findIndex(o => o === question.answer);
        const answerPos = optionPositions[answerIndex];

        const passedThroughAnswer = drawnPath.some(p => p.row === answerPos.row && p.col === answerPos.col);
        const reachedGoal = drawnPath[drawnPath.length - 1].row === goalPos.row && drawnPath[drawnPath.length - 1].col === goalPos.col;

        if (passedThroughAnswer && reachedGoal) {
            setScore(prev => prev + ARCADE_SCORE_FORMULA(ARCADE_SCORE_BASE, level));
            setIsSuccess(true);

            // Success feedback
            const msg = ARCADE_FEEDBACK_TEXTS.SUCCESS_MESSAGES[Math.floor(Math.random() * ARCADE_FEEDBACK_TEXTS.SUCCESS_MESSAGES.length)];
            setFeedback({ message: msg, type: 'success' });
        } else {
            setIsSuccess(false);

            // Error feedback
            const errMsg = ARCADE_FEEDBACK_TEXTS.ERROR_MESSAGES[Math.floor(Math.random() * ARCADE_FEEDBACK_TEXTS.ERROR_MESSAGES.length)];
            setFeedback({ message: errMsg, type: 'error' });

            setLives(prev => {
                const newLives = prev - 1;
                if (newLives <= 0) {
                    setGameOver(true);
                }
                return newLives;
            });
        }
        setStage(GameStage.RESULT);
        isResolvingRef.current = false;
    };

    const nextLevel = () => {
        if (gameOver) {
            handleStartGame();
            return;
        }
        if (isSuccess) {
            const nextLvl = level + 1;
            setLevel(nextLvl);
            startLevel(nextLvl); // Pass next level explicitly to avoid setState async race
        } else {
            startLevel(level); // Retry same level
        }
    };

    // Derive Shell status
    const shellStatus = getShellStatus(stage, gameOver);

    return (
        <ArcadeGameShell
            gameState={{ score, level, lives, status: shellStatus }}
            gameMetadata={{
                id: 'yol-bulmaca',
                title: 'YOL BULMACA',
                description: <p>Renkleri ve rakamları ezberle, doğru cevaba giden yolu çiz!</p>,
                tuzoCode: '7.1.1 Uzamsal Hafıza / Yön Bulma',
                icon: <Sparkles className="w-14 h-14 text-black" strokeWidth={3} />,
                iconBgColor: 'bg-rose-400',
                containerBgColor: 'bg-rose-200 dark:bg-slate-900'
            }}
            onStart={handleStartGame}
            onRestart={handleStartGame}
            showLevel={true}
            showLives={true}
        >
            <div className="h-full bg-rose-200 dark:bg-slate-900 flex flex-col items-center p-1 sm:p-2 md:p-4 touch-none [-webkit-tap-highlight-color:transparent] font-black overflow-hidden relative transition-colors duration-300">
                {/* Spacer for ArcadeGameShell HUD */}
                <div className="h-14 sm:h-16" />

                {/* Feedback Banner */}
                <ArcadeFeedbackBanner message={feedback?.message ?? null} type={feedback?.type} />

                <main className="w-full flex-1 flex flex-col items-center justify-start relative z-10">
                    {/* MEMORIZE Screen */}
                    {stage === GameStage.MEMORIZE && (
                        <div className="w-full text-center space-y-3 sm:space-y-6 max-w-2xl mx-auto">
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-2xl border-2 border-black/10 dark:border-slate-700 shadow-neo-sm rotate-1 w-max mx-auto mb-4 sm:mb-8 transition-colors duration-300">
                                <img src="/images/beyni.webp" alt="Beyin" className="w-12 h-12 sm:w-16 sm:h-16" />
                                <h2 className="text-2xl sm:text-3xl font-black text-black dark:text-white uppercase tracking-tighter transition-colors duration-300">
                                    Sıralamayı Ezberle!
                                </h2>
                            </div>
                            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-6">
                                {sequence.map((item, i) => (
                                    <div
                                        key={i}
                                        className="w-20 h-24 sm:w-24 sm:h-28 rounded-3xl flex flex-col items-center justify-center border-2 border-black/10 dark:border-slate-800 shadow-neo-sm transition-all hover:-translate-y-2 hover:shadow-neo-sm"
                                        style={{
                                            backgroundColor: item.type === 'color'
                                                ? COLORS.find(c => c.name === item.value)?.hex
                                                : '#e2e8f0',
                                            transform: `rotate(${i % 2 === 0 ? '3deg' : '-3deg'})`
                                        }}
                                    >
                                        <span className={`text-3xl sm:text-4xl font-black ${item.type === 'color' ? 'text-white drop-shadow-neo-sm' : 'text-black'}`}>
                                            {item.type === 'color' ? '' : item.value}
                                        </span>
                                        <span className="text-[10px] sm:text-xs uppercase font-black text-black dark:text-white bg-white dark:bg-slate-700 px-2 py-0.5 rounded-md border-2 border-black/10 dark:border-slate-600 mt-2 rotate-2 transition-colors duration-300">
                                            {i + 1}. Sıra
                                        </span>
                                    </div>
                                ))}
                            </div>
                            {/* Progress bar */}
                            <div className="w-full max-w-md mx-auto h-6 sm:h-8 bg-sky-100 dark:bg-slate-800 rounded-xl border-2 border-black/10 dark:border-slate-700 shadow-neo-sm overflow-hidden -rotate-1 relative p-1 mt-8 transition-colors duration-300">
                                <div
                                    className="h-full bg-yellow-400 transition-all duration-100 rounded-md border-r-4 border-black/10 dark:border-slate-800 relative overflow-hidden"
                                    style={{ width: `${(memorizeTimeLeft / (MEMORIZE_TIME_BASE + level * 500)) * 100}%` }}
                                >
                                    <div className="absolute top-0 left-0 w-full h-1/3 bg-white/40" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* QUESTION & DRAWING Screen */}
                    {(stage === GameStage.QUESTION || stage === GameStage.DRAWING || stage === GameStage.ANIMATING) && (
                        <div className="w-full flex flex-col items-center space-y-2 sm:space-y-4">
                            <div className="bg-white dark:bg-slate-800 border-4 sm:border-6 border-black/10 dark:border-slate-700 shadow-neo-sm sm:shadow-neo-sm rounded-2xl sm:rounded-3xl p-3 sm:p-4 w-full max-w-2xl text-center -rotate-1 relative transition-colors duration-300">
                                <div className="absolute -top-3 -left-3 sm:-top-4 sm:-left-4 bg-yellow-300 p-2 sm:p-3 border-2 border-black/10 rounded-xl shadow-neo-sm rotate-6">
                                    <span className="text-xl sm:text-2xl">📝</span>
                                </div>
                                <h3 className="text-sm sm:text-base font-black text-black dark:text-white uppercase tracking-[0.2em] mb-2 inline-block bg-sky-200 dark:bg-slate-700 px-3 py-1 rounded border-2 border-black/10 dark:border-slate-600 rotate-1 transition-colors duration-300">Soru</h3>
                                <p className="text-2xl sm:text-3xl font-black text-black dark:text-white mt-2 leading-tight transition-colors duration-300">{question?.text}</p>
                            </div>

                            <DrawingCanvas
                                startPos={startPos}
                                goalPos={goalPos}
                                correctAnswer={question?.answer || ''}
                                options={question?.options || []}
                                optionPositions={optionPositions}
                                onFinish={handleFinishDrawing}
                                isAnimating={stage === GameStage.ANIMATING}
                                carPos={carPos}
                            />

                            <div className="bg-amber-100 dark:bg-slate-800 border-3 border-black/10 dark:border-slate-700 px-3 sm:px-5 py-2 sm:py-3 rounded-full flex flex-row items-center justify-center gap-2 text-black dark:text-white text-[10px] sm:text-xs font-black shadow-neo-sm rotate-1 max-w-md mx-auto transition-colors duration-300">
                                <span className="w-3 h-3 sm:w-4 sm:h-4 bg-emerald-400 border-2 border-black/10 rounded-full animate-pulse shadow-neo-sm shrink-0"></span>
                                <span className="leading-tight uppercase text-center transition-colors duration-300">BAŞLA'dan BİTİŞ'e doğru cevaptan geçerek yol çiz!</span>
                            </div>
                        </div>
                    )}

                    {/* RESULT Screen (Success / Fail — NOT game over) */}
                    {stage === GameStage.RESULT && !gameOver && (
                        <div className="text-center space-y-3 sm:space-y-4 bg-white dark:bg-slate-800 border-2 border-black/10 dark:border-slate-700 rounded-[2rem] sm:rounded-[3rem] p-5 sm:p-6 shadow-neo-sm dark:shadow-[12px_12px_0_#0f172a] max-w-lg w-full -rotate-1 relative transition-colors duration-300 max-h-[85dvh] overflow-y-auto">
                            {isSuccess ? (
                                <>
                                    <div className="relative inline-block bg-sky-100 dark:bg-slate-700 p-3 rounded-full border-2 border-black/10 dark:border-slate-600 shadow-neo-sm rotate-3 transition-colors duration-300">
                                        <img
                                            src="/images/beyni.webp"
                                            alt="Tebrikler"
                                            className="w-16 h-16 sm:w-20 sm:h-20 mx-auto animate-bounce"
                                        />
                                        <div className="absolute -top-3 -right-4 text-3xl animate-spin-slow drop-shadow-neo-sm">⭐</div>
                                        <div className="absolute -bottom-1 -left-4 text-2xl animate-pulse drop-shadow-neo-sm">🎉</div>
                                    </div>
                                    <h2 className="text-2xl sm:text-3xl font-black text-emerald-500 uppercase tracking-tighter drop-shadow-neo-sm">
                                        Harikasın!
                                    </h2>
                                    <p className="text-black dark:text-white font-black text-sm bg-emerald-100 dark:bg-slate-700 p-3 rounded-xl border-2 border-black/10 dark:border-slate-600 inline-block shadow-neo-sm -rotate-1 transition-colors duration-300">
                                        Doğru yolu buldun ve <span className="text-amber-500 text-xl drop-shadow-neo-sm">{ARCADE_SCORE_FORMULA(ARCADE_SCORE_BASE, level)}</span> puan kazandın!
                                    </p>
                                    <button
                                        onClick={nextLevel}
                                        className="w-full py-3 bg-emerald-400 text-black border-2 border-black/10 dark:border-slate-800 rounded-xl sm:rounded-2xl font-black text-lg sm:text-xl uppercase tracking-widest flex items-center justify-center gap-2 shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-sm active:translate-y-2 active:shadow-none transition-all"
                                    >
                                        🚀 SONRAKİ SEVİYE
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="text-5xl sm:text-6xl drop-shadow-[3px_3px_0_rgba(0,0,0,0.2)] rotate-6">🤔</div>
                                    <h2 className="text-2xl sm:text-3xl font-black text-amber-500 uppercase tracking-tighter drop-shadow-neo-sm">
                                        Yanlış Yol!
                                    </h2>
                                    <p className="text-black dark:text-white font-black text-sm bg-rose-100 dark:bg-slate-700 p-3 rounded-xl border-2 border-black/10 dark:border-slate-600 inline-block shadow-neo-sm rotate-2 transition-colors duration-300">
                                        Kalan Can: <span className="text-rose-500 text-xl">{lives}</span>
                                    </p>
                                    <button
                                        onClick={nextLevel}
                                        className="w-full py-3 bg-yellow-400 text-black border-2 border-black/10 dark:border-slate-800 rounded-xl sm:rounded-2xl font-black text-lg sm:text-xl uppercase tracking-widest flex items-center justify-center gap-2 shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-sm active:translate-y-2 active:shadow-none transition-all"
                                    >
                                        🔄 TEKRAR DENE
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </ArcadeGameShell>
    );
};

export default YolBulmaca;
