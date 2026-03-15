import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Brain, Heart, Play, RotateCcw, Sparkles, Star, Target } from 'lucide-react';
import { GameStage, SequenceItem, Question, GridPos, Point } from './types';
import { generateSequence, generateQuestion, generateSmartPositions } from './utils';
import { COLORS, MEMORIZE_TIME_BASE, GRID_SIZE } from './constants';
import { DrawingCanvas } from './components/DrawingCanvas';
import { useGamePersistence } from '../../../../hooks/useGamePersistence';
import { useGameViewportFocus } from '../../../../hooks/useGameViewportFocus';
import { ARCADE_FEEDBACK_TEXTS, ARCADE_SCORE_FORMULA, ARCADE_SCORE_BASE } from '../../Shared/ArcadeConstants';
import { useArcadeSoundEffects } from '../../Shared/useArcadeSoundEffects';
import { KidCard, KidGameFeedbackBanner, KidGameShell, KidGameStatusOverlay } from '../../../kid-ui';

const GAME_ID = 'yol-bulmaca';

const YolBulmacaPreview: React.FC = () => {
    const steps = [
        {
            title: 'Sırayı Ezberle',
            description: 'Renk ve rakam kartlarını birkaç saniye dikkatle incele.',
            accentColor: 'yellow',
        },
        {
            title: 'Soruyu Çöz',
            description: 'Hangi kart doğru cevapsa onu zihninde işaretle.',
            accentColor: 'blue',
        },
        {
            title: 'Yolu Çiz',
            description: "BAŞLA'dan çık, doğru cevaptan geç ve BİTİŞ'e ulaş.",
            accentColor: 'emerald',
        },
    ] as const;

    return (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <div className="rounded-[2rem] border-2 border-black/10 bg-white/85 p-5 shadow-neo-md dark:border-white/10 dark:bg-slate-900/80">
                <div className="rounded-[1.5rem] border-2 border-black/10 bg-[linear-gradient(180deg,#ffe4e6_0%,#ffffff_45%,#dbeafe_100%)] p-6 shadow-inner dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(30,41,59,0.96)_0%,rgba(15,23,42,0.96)_100%)]">
                    <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
                        {[{ value: 'Mavi', color: '#74B9FF' }, { value: 7, color: '#e2e8f0' }, { value: 'Yeşil', color: '#55EFC4' }, { value: 12, color: '#e2e8f0' }].map((item, index) => (
                            <div
                                key={`${item.value}-${index}`}
                                className="flex h-20 w-16 flex-col items-center justify-center rounded-[1.5rem] border-2 border-black/10 shadow-neo-sm sm:h-24 sm:w-20"
                                style={{ backgroundColor: item.color, transform: `rotate(${index % 2 === 0 ? '3deg' : '-3deg'})` }}
                            >
                                <div className="text-2xl font-black text-black sm:text-3xl">
                                    {typeof item.value === 'number' ? item.value : ''}
                                </div>
                                <div className="mt-2 rounded-lg border-2 border-black/10 bg-white/80 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-black">
                                    {typeof item.value === 'number' ? 'Rakam' : item.value}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 rounded-[1.5rem] border-2 border-black/10 bg-cyber-yellow/80 px-4 py-4 text-center shadow-neo-sm">
                        <div className="text-[11px] font-black uppercase tracking-[0.22em] text-black/70">
                            Örnek Görev
                        </div>
                        <div className="mt-2 text-lg font-black text-black">
                            2. sıradaki rakam nedir?
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-4">
                {steps.map((step) => (
                    <KidCard key={step.title} accentColor={step.accentColor} animate={false} className="h-full">
                        <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                            Yol Görevi
                        </div>
                        <div className="mt-2 text-2xl font-black tracking-tight text-black dark:text-white">
                            {step.title}
                        </div>
                        <p className="mt-2 text-sm font-bold leading-relaxed text-slate-600 dark:text-slate-300">
                            {step.description}
                        </p>
                    </KidCard>
                ))}
            </div>
        </div>
    );
};

const YolBulmaca: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { saveGamePlay } = useGamePersistence();
    const { playAreaRef, focusPlayArea } = useGameViewportFocus();
    const { playArcadeSound } = useArcadeSoundEffects();

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
    const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const hasSavedRef = useRef(false);
    const isResolvingRef = useRef(false);
    const gameStartTimeRef = useRef<number>(0);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    useEffect(() => {
        if (!feedback) {
            return;
        }
        const timeout = setTimeout(() => setFeedback(null), 1500);
        return () => clearTimeout(timeout);
    }, [feedback]);

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
                    is_arcade_mode: isArcadeMode,
                },
            });
        }
    }, [gameOver, score, level, isArcadeMode, saveGamePlay]);

    const startLevel = useCallback((explicitLevel?: number) => {
        const nextLevel = explicitLevel ?? level;
        const nextSequence = generateSequence(nextLevel);
        const nextQuestion = generateQuestion(nextSequence, nextLevel);

        const correctAnswerIndex = nextQuestion.options.findIndex((item) => item === nextQuestion.answer);
        const { start, goal, optionPositions } = generateSmartPositions(correctAnswerIndex, nextQuestion.options.length);

        setSequence(nextSequence);
        setQuestion(nextQuestion);
        setStartPos(start);
        setGoalPos(goal);
        setOptionPositions(optionPositions);
        setStage(GameStage.MEMORIZE);
        setIsSuccess(false);
        setFeedback(null);
        isResolvingRef.current = false;

        const time = MEMORIZE_TIME_BASE + (nextLevel * 500);
        setMemorizeTimeLeft(time);

        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setMemorizeTimeLeft((prev) => {
                if (prev <= 100) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    setStage(GameStage.QUESTION);
                    return 0;
                }
                return prev - 100;
            });
        }, 100);
    }, [level]);

    const handleStartGame = useCallback(() => {
        gameStartTimeRef.current = Date.now();
        setScore(0);
        setLevel(1);
        setLives(3);
        setGameOver(false);
        setFeedback(null);
        hasSavedRef.current = false;
        isResolvingRef.current = false;
        startLevel(1);
        playArcadeSound('start');
        focusPlayArea();
    }, [focusPlayArea, playArcadeSound, startLevel]);

    useEffect(() => {
        if (autoStart && stage === GameStage.START) {
            handleStartGame();
        }
    }, [autoStart, stage, handleStartGame]);

    const checkResult = useCallback((drawnPath: GridPos[]) => {
        if (!question) {
            return;
        }

        const answerIndex = question.options.findIndex((item) => item === question.answer);
        const answerPos = optionPositions[answerIndex];
        const passedThroughAnswer = drawnPath.some((item) => item.row === answerPos.row && item.col === answerPos.col);
        const lastStep = drawnPath[drawnPath.length - 1];
        const reachedGoal = lastStep.row === goalPos.row && lastStep.col === goalPos.col;

        if (passedThroughAnswer && reachedGoal) {
            setScore((prev) => prev + ARCADE_SCORE_FORMULA(ARCADE_SCORE_BASE, level));
            setIsSuccess(true);
            playArcadeSound('success');
            const message =
                ARCADE_FEEDBACK_TEXTS.SUCCESS_MESSAGES[
                    Math.floor(Math.random() * ARCADE_FEEDBACK_TEXTS.SUCCESS_MESSAGES.length)
                ];
            setFeedback({ message, type: 'success' });
        } else {
            setIsSuccess(false);
            playArcadeSound('fail');
            const message =
                ARCADE_FEEDBACK_TEXTS.ERROR_MESSAGES[
                    Math.floor(Math.random() * ARCADE_FEEDBACK_TEXTS.ERROR_MESSAGES.length)
                ];
            setFeedback({ message, type: 'error' });
            setLives((prev) => {
                const nextLives = prev - 1;
                if (nextLives <= 0) {
                    setGameOver(true);
                }
                return nextLives;
            });
        }

        setStage(GameStage.RESULT);
        isResolvingRef.current = false;
    }, [goalPos.col, goalPos.row, level, optionPositions, playArcadeSound, question]);

    const animateCar = useCallback((drawnPath: GridPos[]) => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        const firstStep = drawnPath[0];
        setCarPos({
            x: (firstStep.col + 0.5) * (100 / GRID_SIZE),
            y: (firstStep.row + 0.5) * (100 / GRID_SIZE),
        });

        let index = 1;
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
            setCarPos({
                x: (gridPos.col + 0.5) * (100 / GRID_SIZE),
                y: (gridPos.row + 0.5) * (100 / GRID_SIZE),
            });
            index += 1;
        }, 200);
    }, [checkResult]);

    const handleFinishDrawing = useCallback((drawnPath: GridPos[]) => {
        if (!drawnPath || drawnPath.length === 0) {
            setStage(GameStage.QUESTION);
            return;
        }
        if (isResolvingRef.current) {
            return;
        }

        isResolvingRef.current = true;
        setStage(GameStage.ANIMATING);
        animateCar(drawnPath);
    }, [animateCar]);

    const nextLevel = useCallback(() => {
        if (gameOver) {
            handleStartGame();
            return;
        }

        if (isSuccess) {
            const upcomingLevel = level + 1;
            setLevel(upcomingLevel);
            playArcadeSound('levelUp');
            startLevel(upcomingLevel);
            focusPlayArea();
            return;
        }

        startLevel(level);
        focusPlayArea();
    }, [focusPlayArea, gameOver, handleStartGame, isSuccess, level, playArcadeSound, startLevel]);

    const targetOptionCount = question?.options.length ?? 0;
    const overlay = stage === GameStage.START ? (
        <KidGameStatusOverlay
            tone="yellow"
            icon={Sparkles}
            title="Yol Bulmaca"
            description="Renk ve rakam sırasını ezberle, soruyu çöz ve doğru cevaptan geçerek yolu tamamla."
            actions={[
                { label: 'Oyuna Başla', variant: 'primary', size: 'lg', icon: Play, onClick: handleStartGame },
                { label: "Arcade'e Dön", variant: 'ghost', size: 'lg', onClick: () => navigate('/bilsem-zeka') },
            ]}
        />
    ) : stage === GameStage.RESULT ? (
        <KidGameStatusOverlay
            tone={gameOver ? 'pink' : isSuccess ? 'emerald' : 'orange'}
            icon={isSuccess ? Star : gameOver ? Heart : Target}
            title={isSuccess ? 'Doğru Yolu Buldun' : gameOver ? 'Canlar Tükendi' : 'Bir Tur Daha Deneyelim'}
            description={
                isSuccess
                    ? 'Doğru cevaptan geçip bitişe ulaştın. Yeni seviyede hafıza zinciri biraz daha büyüyecek.'
                    : gameOver
                        ? 'Yanlış rotalar canları bitirdi. Yeni turda önce doğru cevabı sakince belirleyip sonra çizgiye başla.'
                        : 'Bu kez doğru cevaptan geçemedin. Aynı seviyeyi tekrar açıp daha net bir rota çizebilirsin.'
            }
            stats={[
                { label: 'Puan', value: score, tone: 'yellow' },
                { label: 'Seviye', value: level, tone: 'blue' },
                { label: 'Can', value: lives, tone: gameOver ? 'pink' : 'emerald' },
            ]}
            actions={[
                {
                    label: gameOver ? 'Yeniden Başla' : isSuccess ? 'Sonraki Seviye' : 'Tekrar Dene',
                    variant: 'primary',
                    size: 'lg',
                    icon: isSuccess ? Play : RotateCcw,
                    onClick: nextLevel,
                },
                { label: "Arcade'e Dön", variant: 'ghost', size: 'lg', onClick: () => navigate('/bilsem-zeka') },
            ]}
            backdropClassName="bg-slate-950/60"
        />
    ) : null;

    return (
        <KidGameShell
            title="Yol Bulmaca"
            subtitle="Sıralamayı ezberle, soruyu çöz ve doğru cevaptan geçerek bitişe ulaş."
            instruction="Önce kartları aklında tut. Sonra doğru cevabı seçecek yolu BAŞLA'dan BİTİŞ'e kadar çiz."
            backHref="/bilsem-zeka"
            backLabel="Arcade'e Dön"
            badges={[
                { label: 'Uzamsal Hafıza', variant: 'difficulty' },
                { label: 'TUZÖ 7.1.1', variant: 'tuzo' },
            ]}
            stats={[
                {
                    label: 'Seviye',
                    value: level,
                    tone: 'blue',
                    icon: Brain,
                    helper: `${sequence.length || 0} kart gösteriliyor`,
                },
                {
                    label: 'Puan',
                    value: score,
                    tone: 'yellow',
                    icon: Star,
                    helper: isSuccess ? 'Son tur başarılı' : 'Her doğru rota puan kazandırır',
                },
                {
                    label: 'Can',
                    value: `${lives}/3`,
                    tone: lives <= 1 ? 'pink' : 'emerald',
                    emphasis: lives <= 1 ? 'danger' : 'default',
                    icon: Heart,
                    helper: gameOver ? 'Yeni tur gerekiyor' : 'Yanlış yol can azaltır',
                },
                {
                    label: 'Durum',
                    value: stage === GameStage.MEMORIZE ? 'Ezber' : stage === GameStage.QUESTION || stage === GameStage.DRAWING ? 'Çizim' : stage === GameStage.ANIMATING ? 'Animasyon' : stage === GameStage.RESULT ? 'Sonuç' : 'Hazır',
                    tone: 'orange',
                    icon: Target,
                    helper: question ? `${targetOptionCount} seçenek` : 'Görev bekleniyor',
                },
            ]}
            supportTitle="Rota Rehberi"
            supportDescription="Doğru rotayı daha kolay bulmak ve hata riskini azaltmak için kısa ipuçları burada."
            playAreaRef={playAreaRef}
            playAreaClassName="min-h-[860px]"
            supportArea={(
                <div className="grid gap-3 lg:grid-cols-3">
                    <div className="rounded-[1.5rem] border-2 border-black/10 bg-cyber-yellow/30 px-4 py-4 shadow-neo-sm">
                        <div className="text-sm font-black uppercase tracking-[0.2em] text-black dark:text-white">
                            Ezber Taktigi
                        </div>
                        <p className="mt-2 text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-300">
                            Kartları tek tek değil sıra halinde hatırla. İlk, orta ve son parçayı aklında sabitlemek soruyu çözmeni hızlandırır.
                        </p>
                    </div>
                    <div className="rounded-[1.5rem] border-2 border-black/10 bg-cyber-blue/15 px-4 py-4 shadow-neo-sm">
                        <div className="text-sm font-black uppercase tracking-[0.2em] text-black dark:text-white">
                            Rota Kurma
                        </div>
                        <p className="mt-2 text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-300">
                            Önce doğru cevabın kutusunu bul, sonra BAŞLA ile BİTİŞ arasındaki en kısa güvenli hattı zihninde çiz.
                        </p>
                    </div>
                    <div className="rounded-[1.5rem] border-2 border-black/10 bg-cyber-emerald/20 px-4 py-4 shadow-neo-sm">
                        <div className="text-sm font-black uppercase tracking-[0.2em] text-black dark:text-white">
                            Hata Önleme
                        </div>
                        <p className="mt-2 text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-300">
                            Emin değilsen çizgiye hemen başlamadan önce soruyu bir kez daha oku. Doğru cevap kutusuna uğramadan bitişe gitmek sayılmaz.
                        </p>
                    </div>
                </div>
            )}
            overlay={overlay}
        >
            <div className="space-y-5 bg-rose-200/60 text-black dark:bg-slate-950/40 dark:text-white">
                <KidGameFeedbackBanner message={feedback?.message ?? null} type={feedback?.type} />

                {stage === GameStage.START ? (
                    <YolBulmacaPreview />
                ) : stage === GameStage.MEMORIZE ? (
                    <div className="w-full space-y-5">
                        <KidCard accentColor="yellow" animate={false} className="mx-auto w-full max-w-2xl text-center">
                            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                                <img src="/images/beyni.webp" alt="Beyin" className="h-14 w-14 sm:h-16 sm:w-16" />
                                <h2 className="text-2xl font-black uppercase tracking-tight text-black dark:text-white sm:text-3xl">
                                    Sıralamayı Ezberle
                                </h2>
                            </div>
                            <div className="mt-6 flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-6">
                                {sequence.map((item, index) => (
                                    <div
                                        key={`${item.type}-${item.value}-${index}`}
                                        className="flex h-24 w-20 flex-col items-center justify-center rounded-3xl border-2 border-black/10 shadow-neo-sm"
                                        style={{
                                            backgroundColor: item.type === 'color'
                                                ? COLORS.find((color) => color.name === item.value)?.hex
                                                : '#e2e8f0',
                                            transform: `rotate(${index % 2 === 0 ? '3deg' : '-3deg'})`,
                                        }}
                                    >
                                        <span className={`text-3xl font-black ${item.type === 'color' ? 'text-white drop-shadow-neo-sm' : 'text-black'}`}>
                                            {item.type === 'color' ? '' : item.value}
                                        </span>
                                        <span className="mt-2 rounded-md border-2 border-black/10 bg-white/85 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-black">
                                            {index + 1}. sıra
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </KidCard>

                        <KidCard accentColor="blue" animate={false} className="mx-auto w-full max-w-md">
                            <div className="text-center">
                                <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                                    Ezberleme Süresi
                                </div>
                                <div className="mt-3 h-7 rounded-xl border-2 border-black/10 bg-sky-100 p-1 shadow-neo-sm dark:border-white/10 dark:bg-slate-800">
                                    <div
                                        className="h-full rounded-md border-r-4 border-black/10 bg-cyber-yellow transition-all duration-100"
                                        style={{ width: `${(memorizeTimeLeft / (MEMORIZE_TIME_BASE + level * 500)) * 100}%` }}
                                    />
                                </div>
                                <div className="mt-3 text-3xl font-black text-black dark:text-white">
                                    {(memorizeTimeLeft / 1000).toFixed(1)} sn
                                </div>
                            </div>
                        </KidCard>
                    </div>
                ) : stage === GameStage.QUESTION || stage === GameStage.DRAWING || stage === GameStage.ANIMATING ? (
                    <div className="w-full space-y-5">
                        <KidCard accentColor="yellow" animate={false} className="mx-auto w-full max-w-2xl text-center">
                            <div className="inline-flex items-center gap-2 rounded-full border-2 border-black/10 bg-cyber-blue/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-black dark:text-white">
                                <Target size={16} className="stroke-[2.5]" />
                                Soru
                            </div>
                            <div className="mt-4 text-2xl font-black leading-tight text-black dark:text-white sm:text-3xl">
                                {question?.text}
                            </div>
                        </KidCard>

                        <div className="mx-auto w-full max-w-3xl">
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
                        </div>

                        <KidCard accentColor="emerald" animate={false} className="mx-auto w-full max-w-md text-center">
                            <div className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-black dark:text-white">
                                <span className="h-3 w-3 animate-pulse rounded-full border-2 border-black/10 bg-cyber-emerald shadow-neo-sm" />
                                BAŞLA'dan çık, doğru cevaptan geç, BİTİŞ'e var
                            </div>
                        </KidCard>
                    </div>
                ) : (
                    <YolBulmacaPreview />
                )}
            </div>
        </KidGameShell>
    );
};

export default YolBulmaca;
