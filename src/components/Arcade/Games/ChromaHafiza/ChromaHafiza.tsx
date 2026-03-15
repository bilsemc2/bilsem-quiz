import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { Brain, ChevronRight, Eye, Heart, Layers3, Palette, Play, RotateCcw, Sparkles, Star, Target, Trophy } from 'lucide-react';
import { GamePhase, type PuzzlePiece } from './types';
import { GAME_NAME, TUZO_CODE } from './constants';
import GameScene from './components/GameScene';
import { ARCADE_FEEDBACK_TEXTS, ARCADE_SCORE_BASE, ARCADE_SCORE_FORMULA } from '../../Shared/ArcadeConstants';
import { useArcadeGameSession } from '../../Shared/useArcadeGameSession';
import { useArcadeSoundEffects } from '../../Shared/useArcadeSoundEffects';
import { KidCard, KidGameFeedbackBanner, KidGameShell, KidGameStatusOverlay } from '../../../kid-ui';
import { useGameViewportFocus } from '../../../../hooks/useGameViewportFocus';
import { canSelectPiece, createRoundState } from './logic';

const ChromaHafizaPreview: React.FC = () => {
    const steps = [
        {
            title: 'Renkleri Gözle',
            description: 'Parçalar ilk anda renklerini gösterecek. Hedef renge dikkat kesil.',
            accentColor: 'yellow',
        },
        {
            title: 'Parçaları Seç',
            description: 'Renkler gizlenince hedef renkte olan tüm parçaları hafızandan bul.',
            accentColor: 'blue',
        },
        {
            title: 'Bonus Topla',
            description: 'Doğru seçimle seviye bonusu al, hata yaparsan bir can eksilir.',
            accentColor: 'emerald',
        },
    ] as const;

    return (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <div className="rounded-[2rem] border-2 border-black/10 bg-white/85 p-5 shadow-neo-md dark:border-white/10 dark:bg-slate-900/80">
                <div className="rounded-[1.5rem] border-2 border-black/10 bg-[linear-gradient(180deg,#e0f2fe_0%,#ffffff_55%,#fef3c7_100%)] p-5 shadow-inner dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(30,41,59,0.96)_0%,rgba(15,23,42,0.96)_100%)]">
                    <div className="grid grid-cols-4 gap-3 sm:grid-cols-4">
                        {['#B85A73', '#3DA882', '#4A8BC2', '#C48B3A', '#7C5DAB', '#B87A5C', '#4A9999', '#ffffff'].map((color, index) => (
                            <div
                                key={`${color}-${index}`}
                                className="aspect-square rounded-[1.25rem] border-2 border-black/10 shadow-neo-sm"
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>

                    <div className="mt-6 rounded-[1.5rem] border-2 border-black/10 bg-cyber-blue px-4 py-4 text-center text-white shadow-neo-sm">
                        <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/70">Hedef Renk</div>
                        <div className="mt-3 flex items-center justify-center gap-3">
                            <div className="h-10 w-10 rounded-2xl border-2 border-black/10 bg-[#4A8BC2]" />
                            <span className="text-lg font-black uppercase tracking-wide">Mavi Tonda Parçaları Hatırla</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-4">
                {steps.map((step) => (
                    <KidCard key={step.title} accentColor={step.accentColor} animate={false} className="h-full">
                        <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                            Hafıza Görevi
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

const ChromaHafiza: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { playAreaRef, focusPlayArea } = useGameViewportFocus();
    const { playArcadeSound } = useArcadeSoundEffects();
    const {
        sessionState,
        startSession,
        addScore,
        advanceLevel,
        finishGame,
        loseLife,
        recordAttempt,
    } = useArcadeGameSession({ gameId: 'arcade-chroma-hafiza', initialLevel: 0 });

    const isResolvingRef = useRef(false);
    const roundStartedAtRef = useRef(0);
    const timeoutIdsRef = useRef<number[]>([]);

    const [gamePhase, setGamePhase] = useState<GamePhase>('idle');
    const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
    const [targetColor, setTargetColor] = useState('');
    const [isRevealing, setIsRevealing] = useState(false);
    const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [showLevelUp, setShowLevelUp] = useState(false);

    const clearScheduledTimeouts = useCallback(() => {
        timeoutIdsRef.current.forEach((timeoutId) => {
            window.clearTimeout(timeoutId);
        });
        timeoutIdsRef.current = [];
    }, []);

    const scheduleTimeout = useCallback((callback: () => void, delay: number) => {
        const timeoutId = window.setTimeout(() => {
            timeoutIdsRef.current = timeoutIdsRef.current.filter((id) => id !== timeoutId);
            callback();
        }, delay);

        timeoutIdsRef.current.push(timeoutId);
    }, []);

    const initLevel = useCallback((levelIdx: number) => {
        const { config, pieces: newPieces, targetColor: selectedColor } = createRoundState(levelIdx);

        clearScheduledTimeouts();
        setPieces(newPieces);
        setTargetColor(selectedColor);
        setGamePhase('preview');
        setIsRevealing(true);
        setShowLevelUp(false);

        scheduleTimeout(() => {
            setIsRevealing(false);
            setGamePhase('playing');
            roundStartedAtRef.current = Date.now();
            isResolvingRef.current = false;
        }, config.previewDuration);
    }, [clearScheduledTimeouts, scheduleTimeout]);

    const startGame = useCallback(() => {
        clearScheduledTimeouts();
        startSession();
        playArcadeSound('start');
        setGamePhase('preview');
        setFeedback(null);
        setShowLevelUp(false);
        isResolvingRef.current = false;
        initLevel(0);
        focusPlayArea();
    }, [clearScheduledTimeouts, focusPlayArea, initLevel, playArcadeSound, startSession]);

    useEffect(() => {
        if (location.state?.autoStart && sessionState.status === 'START') {
            startGame();
        }
    }, [location.state, sessionState.status, startGame]);

    useEffect(() => clearScheduledTimeouts, [clearScheduledTimeouts]);

    const handlePieceClick = useCallback((id: string) => {
        const selectedPiece = pieces.find((piece) => piece.id === id);

        if (!canSelectPiece({
            gamePhase,
            isResolving: isResolvingRef.current,
            piece: selectedPiece,
        })) {
            return;
        }

        recordAttempt({
            isCorrect: selectedPiece?.targetColor === targetColor,
            responseMs: roundStartedAtRef.current > 0 ? Date.now() - roundStartedAtRef.current : null,
        });
        playArcadeSound('hit');

        setPieces((previousPieces) => previousPieces.map((piece) => {
            if (piece.id === id) {
                const isCorrect = piece.targetColor === targetColor;
                return { ...piece, isSelected: true, isCorrect };
            }
            return piece;
        }));
    }, [gamePhase, pieces, playArcadeSound, recordAttempt, targetColor]);

    useEffect(() => {
        if (gamePhase !== 'playing' || isResolvingRef.current) {
            return;
        }

        const piecesForColor = pieces.filter((piece) => piece.targetColor === targetColor);
        const selectedCorrect = piecesForColor.filter((piece) => piece.isSelected);
        const lastSelectedWrongPiece = pieces.find((piece) => piece.isSelected && !piece.isCorrect);

        if (lastSelectedWrongPiece) {
            isResolvingRef.current = true;
            setGamePhase('reveal');
            setIsRevealing(true);
            setFeedback({
                message: ARCADE_FEEDBACK_TEXTS.ERROR_MESSAGES[
                    Math.floor(Math.random() * ARCADE_FEEDBACK_TEXTS.ERROR_MESSAGES.length)
                ],
                type: 'error',
            });
            playArcadeSound('fail');

            const nextSession = loseLife();

            scheduleTimeout(() => {
                setIsRevealing(false);
                setFeedback(null);

                if (nextSession.lives <= 0) {
                    setGamePhase('game_over');
                    void finishGame({
                        status: 'GAME_OVER',
                        metadata: {
                            game_name: GAME_NAME,
                            levels_completed: sessionState.level,
                            final_level: sessionState.level + 1,
                        },
                    });
                } else {
                    initLevel(sessionState.level);
                }

                isResolvingRef.current = false;
            }, 2000);

            return;
        }

        if (selectedCorrect.length === piecesForColor.length && piecesForColor.length > 0) {
            isResolvingRef.current = true;
            setGamePhase('reveal');
            setIsRevealing(true);

            const bonus = ARCADE_SCORE_FORMULA(ARCADE_SCORE_BASE, sessionState.level + 1);
            addScore(bonus);
            setFeedback({
                message: ARCADE_FEEDBACK_TEXTS.SUCCESS_MESSAGES[
                    Math.floor(Math.random() * ARCADE_FEEDBACK_TEXTS.SUCCESS_MESSAGES.length)
                ],
                type: 'success',
            });
            playArcadeSound('success');

            scheduleTimeout(() => {
                setIsRevealing(false);
                setFeedback(null);
                setShowLevelUp(true);
                setGamePhase('success');
                isResolvingRef.current = false;
            }, 2000);
        }
    }, [addScore, finishGame, gamePhase, initLevel, loseLife, pieces, playArcadeSound, scheduleTimeout, sessionState.level, targetColor]);

    const nextLevel = useCallback(() => {
        if (gamePhase !== 'success' || isResolvingRef.current) {
            return;
        }

        isResolvingRef.current = true;
        clearScheduledTimeouts();
        const nextSession = advanceLevel();
        playArcadeSound('levelUp');
        setShowLevelUp(false);
        initLevel(nextSession.level);
        focusPlayArea();
    }, [advanceLevel, clearScheduledTimeouts, focusPlayArea, gamePhase, initLevel, playArcadeSound]);

    const targetPieceCount = pieces.filter((piece) => piece.targetColor === targetColor).length;

    const overlay = gamePhase === 'idle' ? (
        <KidGameStatusOverlay
            tone="yellow"
            icon={Brain}
            title={GAME_NAME}
            description="Renkleri önce izle, sonra hafızandan hedef renkteki tüm parçaları bul."
            actions={[
                { label: 'Oyuna Başla', variant: 'primary', size: 'lg', icon: Play, onClick: startGame },
                { label: 'Hemen Deneyelim', variant: 'ghost', size: 'lg', icon: Sparkles, onClick: startGame },
            ]}
        />
    ) : gamePhase === 'game_over' ? (
        <KidGameStatusOverlay
            tone="pink"
            icon={Trophy}
            title="Hafıza Turu Bitti"
            description="İyi bir tur çıkardın. Bir kez daha deneyip daha uzun renk zinciri kurabilirsin."
            stats={[
                { label: 'Puan', value: sessionState.score, tone: 'blue' },
                { label: 'Seviye', value: sessionState.level + 1, tone: 'yellow' },
                { label: 'Can', value: sessionState.lives, tone: 'emerald' },
            ]}
            actions={[
                { label: 'Tekrar Oyna', variant: 'primary', size: 'lg', icon: RotateCcw, onClick: startGame },
                { label: "Arcade'e Dön", variant: 'ghost', size: 'lg', onClick: () => navigate('/bilsem-zeka') },
            ]}
            backdropClassName="bg-slate-950/60"
        />
    ) : null;

    return (
        <KidGameShell
            title={GAME_NAME}
            subtitle="Renk ipuçlarını aklında tut, gizlenen parçaları doğru seç ve seviyeyi büyüt."
            instruction="Renkler görünürken hedefi ezberle. Gizlenince aynı renkteki tüm parçaları seç."
            backHref="/bilsem-zeka"
            backLabel="Arcade'e Dön"
            badges={[
                { label: 'Görsel Hafıza', variant: 'difficulty' },
                { label: TUZO_CODE, variant: 'tuzo' },
            ]}
            stats={[
                { label: 'Seviye', value: sessionState.level + 1, tone: 'blue', icon: Layers3 },
                { label: 'Puan', value: sessionState.score, tone: 'yellow', icon: Star },
                {
                    label: 'Can',
                    value: `${sessionState.lives}/3`,
                    tone: sessionState.lives <= 1 ? 'pink' : 'emerald',
                    emphasis: sessionState.lives <= 1 ? 'danger' : 'default',
                    icon: Heart,
                },
                { label: 'Hedef Parça', value: targetPieceCount || '-', tone: 'orange', icon: Palette },
            ]}
            supportTitle="Hafıza Paneli"
            supportDescription="Hedef rengi ve o anki görev adımını buradan takip et."
            playAreaRef={playAreaRef}
            supportArea={(
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                    <div className="rounded-[1.5rem] border-2 border-black/10 bg-cyber-blue/15 px-4 py-4 shadow-neo-sm">
                        <div className="flex items-center gap-3">
                            <Target size={20} className="stroke-[2.5] text-black dark:text-white" />
                            <div className="text-sm font-black uppercase tracking-[0.2em] text-black dark:text-white">
                                Hedef Renk
                            </div>
                        </div>
                        <div className="mt-3 flex items-center gap-4">
                            <div
                                className="h-14 w-14 rounded-[1.25rem] border-2 border-black/10 shadow-neo-sm"
                                style={{ backgroundColor: targetColor || '#ffffff' }}
                            />
                            <div className="text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-300">
                                {gamePhase === 'preview' && 'Parçaları izle. Birazdan bu renkte olanları hafızandan seçeceksin.'}
                                {gamePhase === 'playing' && 'Bu renkteki tüm parçaları seç. Yanlış seçim bir can götürür.'}
                                {gamePhase === 'reveal' && 'Seçimlerin kontrol ediliyor. Bir sonraki adım birazdan açıklanacak.'}
                                {gamePhase === 'success' && 'Harika. Bonus puanın hazır, sonraki seviyeye geçebilirsin.'}
                                {(gamePhase === 'idle' || gamePhase === 'game_over') && 'Oyuna başladığında hedef renk burada belirecek.'}
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                        <div className="rounded-[1.5rem] border-2 border-black/10 bg-cyber-yellow/35 px-4 py-4 shadow-neo-sm">
                            <div className="text-xs font-black uppercase tracking-[0.2em] text-black dark:text-white">
                                Aşama
                            </div>
                            <div className="mt-2 text-sm font-black uppercase text-black dark:text-white">
                                {gamePhase === 'preview' && 'Renkleri İncele'}
                                {gamePhase === 'playing' && 'Seçmeye Başla'}
                                {gamePhase === 'reveal' && 'Kontrol Ediliyor'}
                                {gamePhase === 'success' && 'Seviye Tamam'}
                                {(gamePhase === 'idle' || gamePhase === 'game_over') && 'Hazırlık'}
                            </div>
                        </div>

                        <div className="rounded-[1.5rem] border-2 border-black/10 bg-cyber-emerald/20 px-4 py-4 shadow-neo-sm">
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-black dark:text-white">
                                <Eye size={16} className="stroke-[2.5]" />
                                Hatırlatma
                            </div>
                            <div className="mt-2 text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-300">
                                Önce renkleri grup olarak gör, sonra seçmeden önce hedef parçayı zihninde konumlandır.
                            </div>
                        </div>
                    </div>
                </div>
            )}
            overlay={(
                <>
                    {overlay}
                    <AnimatePresence>
                        {showLevelUp && gamePhase === 'success' && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                >
                                    <KidGameStatusOverlay
                                        tone="emerald"
                                        icon={Brain}
                                        title="Başarılı!"
                                        description="Hedef renkteki tüm parçaları buldun. Sıra bir sonraki desende."
                                        maxWidthClassName="max-w-sm"
                                        backdropClassName="bg-black/50"
                                        actions={[
                                            {
                                                label: 'Sonraki Seviye',
                                                variant: 'secondary',
                                                size: 'lg',
                                                icon: ChevronRight,
                                                onClick: nextLevel,
                                            },
                                        ]}
                                    >
                                        <p className="inline-flex rounded-xl border-2 border-black/10 bg-cyber-yellow px-4 py-2 text-base font-black uppercase tracking-wide text-black shadow-neo-sm">
                                            +{ARCADE_SCORE_FORMULA(ARCADE_SCORE_BASE, sessionState.level + 1)} puan
                                        </p>
                                    </KidGameStatusOverlay>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}
        >
            <div className="relative w-full">
                <KidGameFeedbackBanner message={feedback?.message ?? null} type={feedback?.type} />

                <AnimatePresence mode="wait">
                    {(gamePhase === 'idle' || gamePhase === 'game_over') && (
                        <motion.div
                            key="preview"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="w-full"
                        >
                            <ChromaHafizaPreview />
                        </motion.div>
                    )}

                    {gamePhase !== 'idle' && gamePhase !== 'game_over' && (
                        <motion.div
                            key="game"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="w-full"
                        >
                            <div className="relative min-h-[50dvh] rounded-[2rem] border-2 border-black/10 bg-white/85 shadow-neo-lg dark:border-white/10 dark:bg-slate-900/80">
                                <div className="absolute left-1/2 top-3 z-20 -translate-x-1/2 rounded-[1.5rem] border-2 border-black/10 bg-white/90 px-4 py-3 shadow-neo-sm dark:border-white/10 dark:bg-slate-800/90">
                                    <div className="flex items-center gap-3">
                                        <Target className="h-6 w-6 text-black dark:text-white" strokeWidth={3} />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                                Hedef Renk
                                            </span>
                                            <span className="text-sm font-black uppercase tracking-widest text-black dark:text-white">
                                                Bu Rengi Bul
                                            </span>
                                        </div>
                                        <div
                                            className="h-12 w-14 rounded-2xl border-2 border-black/10 shadow-neo-sm"
                                            style={{ backgroundColor: targetColor }}
                                        />
                                    </div>
                                </div>

                                {gamePhase === 'reveal' && (
                                    <div className="absolute left-1/2 top-24 z-20 -translate-x-1/2 rounded-xl border-2 border-black/10 bg-cyber-yellow px-4 py-2 shadow-neo-sm">
                                        <span className="text-xs font-black uppercase tracking-widest text-black">
                                            Kontrol Ediliyor...
                                        </span>
                                    </div>
                                )}

                                <div className="h-[58dvh] min-h-[420px] overflow-hidden rounded-[2rem]">
                                    <GameScene
                                        pieces={pieces}
                                        isRevealing={isRevealing}
                                        onPieceClick={handlePieceClick}
                                        isGameWon={gamePhase === 'success'}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </KidGameShell>
    );
};

export default ChromaHafiza;
