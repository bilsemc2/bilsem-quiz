import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronLeft, Home, Heart, Star, Sparkles } from 'lucide-react';
import { GameStage, SequenceItem, Question, GridPos, Point } from './types';
import { generateSequence, generateQuestion, generateSmartPositions } from './utils';
import { COLORS, MEMORIZE_TIME_BASE, GRID_SIZE } from './constants';
import { DrawingCanvas } from './components/DrawingCanvas';
import { useGamePersistence } from '../../../../hooks/useGamePersistence';

const GAME_ID = 'yol-bulmaca';

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

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const hasSavedRef = useRef(false);
    const gameStartTimeRef = useRef<number>(0);

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

    const startLevel = useCallback(() => {
        const nextSeq = generateSequence(level);
        const nextQuest = generateQuestion(nextSeq, level);

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

        const time = MEMORIZE_TIME_BASE + (level * 500);
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
        hasSavedRef.current = false;
        startLevel();
    };

    const handleFinishDrawing = (drawnPath: GridPos[]) => {
        // Guard against empty paths
        if (!drawnPath || drawnPath.length === 0) {
            setStage(GameStage.QUESTION);
            return;
        }
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
            setScore(prev => prev + 100 * level);
            setIsSuccess(true);
        } else {
            setIsSuccess(false);
            setLives(prev => {
                const newLives = prev - 1;
                if (newLives <= 0) {
                    setGameOver(true);
                    // saveGamePlay is handled by useEffect when gameOver becomes true
                }
                return newLives;
            });
        }
        setStage(GameStage.RESULT);
    };

    const nextLevel = () => {
        if (gameOver) {
            handleStartGame();
            return;
        }
        if (isSuccess) {
            setLevel(prev => prev + 1);
        }
        startLevel();
    };

    // Soft pastel colors for child-friendly dark theme
    const softColors = {
        bg: 'bg-[#1a1f2e]', // Soft dark blue-gray
        card: 'bg-[#242938]/80',
        border: 'border-[#3d4563]/50',
        text: 'text-[#e8ebf4]',
        muted: 'text-[#9ca3c0]',
        accent: 'from-[#7c5ce0] to-[#a855f7]', // Soft purple gradient
        success: 'from-[#34d399] to-[#10b981]', // Soft green gradient
        warning: 'from-[#fbbf24] to-[#f59e0b]', // Soft amber gradient
    };

    return (
        <div className={`min-h-screen ${softColors.bg} flex flex-col items-center p-2 sm:p-4 md:p-6 lg:p-8 pt-16 sm:pt-20 touch-none`} style={{ WebkitTapHighlightColor: 'transparent' }}>
            {/* Soft background glow */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px]" />
            </div>

            {/* Navigation */}
            <div className="w-full flex justify-between items-center mb-4 sm:mb-6 relative z-10">
                <Link
                    to="/bilsem-zeka"
                    className={`flex items-center gap-1.5 sm:gap-2 ${softColors.muted} hover:${softColors.text} transition-colors font-semibold text-xs sm:text-sm`}
                >
                    <ChevronLeft size={16} className="sm:w-[18px] sm:h-[18px]" />
                    <span>BİLSEM</span>
                </Link>
                <Link
                    to="/"
                    className={`flex items-center gap-2 ${softColors.muted} hover:${softColors.text} transition-colors`}
                >
                    <Home size={16} className="sm:w-[18px] sm:h-[18px]" />
                </Link>
            </div>

            {/* Header */}
            <header className="w-full flex justify-between items-center mb-4 sm:mb-8 relative z-10">
                <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                        <h1 className="text-lg sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                            Yol Bulmaca
                        </h1>
                    </div>
                    <span className={`text-xs sm:text-sm font-medium ${softColors.muted} flex items-center gap-1 mt-0.5 sm:mt-1`}>
                        <Star size={12} className="sm:w-3.5 sm:h-3.5 text-amber-400" />
                        Seviye {level}
                    </span>
                </div>
                <div className="text-right flex items-center gap-3 sm:gap-6">
                    {/* Lives */}
                    <div className="flex gap-1 sm:gap-1.5">
                        {[...Array(3)].map((_, i) => (
                            <Heart
                                key={i}
                                className={`w-5 h-5 sm:w-6 sm:h-6 transition-all duration-300 ${i < lives
                                    ? 'text-pink-400 fill-pink-400 drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]'
                                    : 'text-gray-600'
                                    }`}
                            />
                        ))}
                    </div>
                    {/* Score */}
                    <div className={`${softColors.card} ${softColors.border} border rounded-xl sm:rounded-2xl px-2.5 sm:px-4 py-1.5 sm:py-2`}>
                        <div className={`text-[10px] sm:text-xs font-medium ${softColors.muted}`}>Puan</div>
                        <div className="text-lg sm:text-2xl font-bold text-amber-400">{score}</div>
                    </div>
                </div>
            </header>

            <main className="w-full flex-grow flex flex-col items-center justify-center relative z-10">
                {/* START Screen */}
                {stage === GameStage.START && (
                    <div className="text-center space-y-8">
                        <div className="relative">
                            <img
                                src="/images/beyni.webp"
                                alt="Beyin"
                                className="w-32 h-32 mx-auto animate-bounce"
                                style={{ filter: 'drop-shadow(0 10px 30px rgba(124, 92, 224, 0.3))' }}
                            />
                            <div className="absolute -top-2 -right-2 text-3xl animate-pulse">✨</div>
                        </div>
                        <h2 className={`text-3xl font-bold ${softColors.text}`}>
                            Merhaba Küçük Kaşif! 🚗
                        </h2>
                        <p className={`${softColors.muted} max-w-sm mx-auto text-lg leading-relaxed`}>
                            Renkleri ve rakamları hafızana al, sonra doğru cevaba giden yolu çiz!
                        </p>
                        <button
                            onClick={handleStartGame}
                            className={`px-10 py-5 bg-gradient-to-r ${softColors.accent} text-white font-bold text-xl rounded-3xl 
                                hover:scale-105 active:scale-95 transition-all duration-200 
                                shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40`}
                        >
                            🎮 Haydi Başlayalım!
                        </button>
                    </div>
                )}

                {/* MEMORIZE Screen */}
                {stage === GameStage.MEMORIZE && (
                    <div className="w-full text-center space-y-8">
                        <div className="flex items-center justify-center gap-3">
                            <img src="/images/beyni.webp" alt="Beyin" className="w-12 h-12" />
                            <h2 className={`text-2xl font-bold ${softColors.text}`}>
                                Sıralamayı Ezberle! 🧠
                            </h2>
                        </div>
                        <div className="flex flex-wrap justify-center gap-4">
                            {sequence.map((item, i) => (
                                <div
                                    key={i}
                                    className="w-20 h-20 rounded-3xl flex flex-col items-center justify-center border-2 border-white/10 shadow-xl transition-transform hover:scale-105"
                                    style={{
                                        backgroundColor: item.type === 'color'
                                            ? COLORS.find(c => c.name === item.value)?.hex
                                            : '#374151',
                                        boxShadow: item.type === 'color'
                                            ? `0 8px 32px ${COLORS.find(c => c.name === item.value)?.hex}40`
                                            : '0 8px 32px rgba(0,0,0,0.3)'
                                    }}
                                >
                                    <span className="text-white text-2xl font-bold drop-shadow-lg">
                                        {item.type === 'color' ? '' : item.value}
                                    </span>
                                    <span className="text-[10px] uppercase font-semibold text-white/60 mt-1">
                                        {i + 1}. Sıra
                                    </span>
                                </div>
                            ))}
                        </div>
                        {/* Soft progress bar */}
                        <div className="w-full max-w-md mx-auto h-3 bg-[#374151] rounded-full overflow-hidden">
                            <div
                                className={`h-full bg-gradient-to-r ${softColors.accent} transition-all duration-100 rounded-full`}
                                style={{ width: `${(memorizeTimeLeft / (MEMORIZE_TIME_BASE + level * 500)) * 100}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* QUESTION & DRAWING Screen */}
                {(stage === GameStage.QUESTION || stage === GameStage.DRAWING || stage === GameStage.ANIMATING) && (
                    <div className="w-full flex flex-col items-center space-y-6">
                        <div className={`${softColors.card} backdrop-blur-sm ${softColors.border} border rounded-3xl p-6 w-full text-center`}>
                            <h3 className="text-lg font-semibold text-purple-400 mb-2">📝 Soru:</h3>
                            <p className={`text-xl font-bold ${softColors.text}`}>{question?.text}</p>
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

                        <div className={`${softColors.card} ${softColors.border} border px-5 py-4 rounded-2xl flex items-center gap-3 ${softColors.muted} text-sm font-medium`}>
                            <span className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></span>
                            BAŞLA'dan BİTİŞ'e doğru cevaptan geçerek yol çiz! ✏️
                        </div>
                    </div>
                )}

                {/* RESULT Screen */}
                {stage === GameStage.RESULT && (
                    <div className="text-center space-y-8">
                        {gameOver ? (
                            <>
                                <div className="text-8xl">😢</div>
                                <h2 className="text-3xl font-bold text-pink-400">
                                    Canların Bitti!
                                </h2>
                                <p className={`${softColors.muted} text-lg`}>
                                    Toplam Puan: <span className="text-amber-400 font-bold">{score}</span>
                                </p>
                                <div className="flex gap-4 justify-center flex-wrap">
                                    <button
                                        onClick={handleStartGame}
                                        className={`px-8 py-4 bg-gradient-to-r ${softColors.accent} text-white font-bold rounded-2xl 
                                            hover:scale-105 active:scale-95 transition-all shadow-lg shadow-purple-500/25`}
                                    >
                                        🔄 Tekrar Dene
                                    </button>
                                    <Link
                                        to="/bilsem-zeka"
                                        className={`px-8 py-4 ${softColors.card} ${softColors.border} border ${softColors.text} font-semibold rounded-2xl 
                                            hover:bg-[#2d3548] transition-colors`}
                                    >
                                        🏠 Oyunlara Dön
                                    </Link>
                                </div>
                            </>
                        ) : isSuccess ? (
                            <>
                                <div className="relative">
                                    <img
                                        src="/images/beyni.webp"
                                        alt="Tebrikler"
                                        className="w-36 h-36 mx-auto animate-bounce"
                                        style={{ filter: 'drop-shadow(0 0 40px rgba(52, 211, 153, 0.4))' }}
                                    />
                                    <div className="absolute -top-2 -right-4 text-4xl animate-spin-slow">⭐</div>
                                    <div className="absolute -bottom-2 -left-4 text-3xl animate-pulse">🎉</div>
                                </div>
                                <h2 className="text-3xl font-bold text-emerald-400">
                                    Harikasın! 🌟
                                </h2>
                                <p className={`${softColors.muted} text-lg`}>
                                    Doğru yolu buldun ve <span className="text-amber-400 font-bold">{100 * level}</span> puan kazandın!
                                </p>
                                <button
                                    onClick={nextLevel}
                                    className={`px-10 py-5 bg-gradient-to-r ${softColors.success} text-white font-bold text-lg rounded-3xl 
                                        hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-500/25`}
                                >
                                    🚀 Sonraki Seviye
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="text-8xl">🤔</div>
                                <h2 className="text-3xl font-bold text-amber-400">
                                    Tekrar Deneyelim!
                                </h2>
                                <p className={`${softColors.muted} text-lg`}>
                                    Doğru yolu bulamadın. Kalan can:
                                    <span className="inline-flex gap-1 ml-2">
                                        {[...Array(lives)].map((_, i) => (
                                            <Heart key={i} size={20} className="text-pink-400 fill-pink-400" />
                                        ))}
                                    </span>
                                </p>
                                <button
                                    onClick={nextLevel}
                                    className={`px-10 py-5 bg-gradient-to-r ${softColors.warning} text-white font-bold text-lg rounded-3xl 
                                        hover:scale-105 active:scale-95 transition-all shadow-lg shadow-amber-500/25`}
                                >
                                    🔄 Tekrar Dene
                                </button>
                            </>
                        )}
                    </div>
                )}
            </main>

            <footer className={`mt-8 ${softColors.muted} text-sm text-center pb-8 font-medium relative z-10`}>
                ✨ Hafızanı güçlendir, yolu çiz ve kazancını topla!
            </footer>
        </div>
    );
};

export default YolBulmaca;
