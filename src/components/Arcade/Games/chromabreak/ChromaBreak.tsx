import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { Brain, Heart, Layers3, Play, RotateCcw, Sparkles, Star, SwatchBook, Trophy } from 'lucide-react';
import { useArcadeSoundEffects } from '../../Shared/useArcadeSoundEffects';
import { useGamePersistence } from '../../../../hooks/useGamePersistence';
import { useGameViewportFocus } from '../../../../hooks/useGameViewportFocus';
import BreakoutGame from './components/BreakoutGame';
import QuizMode from './components/QuizMode';
import { COLORS, GamePhase, TIMING } from './types';
import { ARCADE_SCORE_BASE, ARCADE_SCORE_FORMULA, ARCADE_FEEDBACK_TEXTS } from '../../Shared/ArcadeConstants';
import { KidButton, KidCard, KidGameFeedbackBanner, KidGameShell, KidGameStatusOverlay } from '../../../kid-ui';

const GAME_ID = 'chromabreak';
const BLOCK_SCORE = ARCADE_SCORE_BASE / 2; // 10 puan per blok

const ChromaBreakPreview: React.FC = () => {
    const howToPlay = [
        { title: 'Blokları Kır', description: 'Topu fırlat, renkli blokları patlat ve puan topla.' },
        { title: 'Sırayı Hatırla', description: 'Vurduğun renkleri göz ucuyla değil, bilinçli şekilde aklında tut.' },
        { title: 'Quizde Kazan', description: 'Kısa hafıza sorusunu doğru cevapla ve bonus puan al.' },
    ];

    return (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
            <div className="rounded-[2rem] border-2 border-black/10 bg-white/85 p-5 shadow-neo-md dark:border-white/10 dark:bg-slate-900/80">
                <div className="rounded-[1.5rem] border-2 border-black/10 bg-[linear-gradient(180deg,#fef3c7_0%,#ffffff_55%,#e0f2fe_100%)] px-4 py-6 shadow-inner dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(30,41,59,0.96)_0%,rgba(15,23,42,0.96)_100%)]">
                    <div className="mx-auto grid max-w-2xl grid-cols-4 gap-3 sm:grid-cols-8">
                        {COLORS.map((color) => (
                            <div
                                key={color.name}
                                className="h-10 rounded-2xl border-2 border-black/10 shadow-neo-sm"
                                style={{ backgroundColor: color.hex }}
                            />
                        ))}
                    </div>

                    <div className="mt-12 flex justify-center">
                        <div className="w-52 rounded-full border-2 border-black/10 bg-slate-300 px-4 py-2 shadow-neo-sm">
                            <div className="h-3 rounded-full bg-slate-500" />
                        </div>
                    </div>

                    <div className="mt-5 flex justify-center">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-black/10 bg-cyber-pink shadow-neo-sm" />
                    </div>

                    <div className="mt-8 rounded-[1.5rem] border-2 border-black/10 bg-cyber-yellow/80 px-4 py-3 text-center text-sm font-black uppercase tracking-[0.22em] text-black shadow-neo-sm">
                        Renkleri gör, sırayı hisset, quizde hatırla
                    </div>
                </div>
            </div>

            <div className="grid gap-4">
                {howToPlay.map((step, index) => (
                    <KidCard
                        key={step.title}
                        accentColor={index === 0 ? 'yellow' : index === 1 ? 'blue' : 'emerald'}
                        animate={false}
                        className="h-full"
                    >
                        <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                            Adım {index + 1}
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

const ChromaBreak: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { playArcadeSound } = useArcadeSoundEffects();
    const { saveGamePlay } = useGamePersistence();
    const hasSavedRef = useRef(false);
    const startTimeRef = useRef<number>(0);
    const isResolvingRef = useRef(false);
    const timeoutIdsRef = useRef<number[]>([]);
    const { playAreaRef, focusPlayArea } = useGameViewportFocus();

    const [gamePhase, setGamePhase] = useState<GamePhase>(GamePhase.IDLE);
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [history, setHistory] = useState<string[]>([]);
    const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const autoStart = location.state?.autoStart ||
        new URLSearchParams(location.search).get('autoStart') === 'true';

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

    // ─── Save ────────────────────────────────────────────────────────────────
    const saveResult = useCallback(async (finalScore: number) => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        await saveGamePlay({
            game_id: GAME_ID,
            score_achieved: finalScore,
            duration_seconds: duration,
            difficulty_played: `level-${level}`,
            metadata: {
                blocks_hit: history.length,
                level_reached: level
            }
        });
    }, [saveGamePlay, level, history.length]);

    // ─── Breakout → Quiz transition ──────────────────────────────────────────
    const handleGameOver = useCallback((finalHistory: string[], finalScore: number) => {
        setHistory(finalHistory);
        setScore(finalScore);

        if (finalHistory.length >= 3) {
            setGamePhase(GamePhase.QUIZ_PREP);
            scheduleTimeout(() => {
                setGamePhase(GamePhase.QUIZZING);
            }, TIMING.QUIZ_PREP_DELAY_MS);
        } else {
            // Yeterli blok vurulamadı → can kaybı
            setLives(prev => {
                const newLives = prev - 1;
                if (newLives <= 0) {
                    clearScheduledTimeouts();
                    playArcadeSound('fail');
                    setGamePhase(GamePhase.RESULT);
                    void saveResult(finalScore);
                } else {
                    playArcadeSound('fail');
                    setFeedback({ message: 'Daha fazla blok vurmalısın! 💪', type: 'error' });
                    scheduleTimeout(() => {
                        setFeedback(null);
                        // Aynı seviyede tekrar dene
                        setGamePhase(GamePhase.PLAYING);
                        setHistory([]);
                        setScore(0);
                        focusPlayArea();
                    }, 2000);
                }
                return newLives;
            });
        }
    }, [clearScheduledTimeouts, focusPlayArea, playArcadeSound, saveResult, scheduleTimeout]);

    // ─── Quiz complete ───────────────────────────────────────────────────────
    const handleQuizComplete = useCallback((correct: boolean) => {
        if (isResolvingRef.current) return;
        isResolvingRef.current = true;

        if (correct) {
            const msgs = ARCADE_FEEDBACK_TEXTS.SUCCESS_MESSAGES;
            playArcadeSound('levelUp');
            setFeedback({ message: msgs[Math.floor(Math.random() * msgs.length)], type: 'success' });
            const bonus = ARCADE_SCORE_FORMULA(ARCADE_SCORE_BASE, level);
            setScore(prev => prev + bonus);
            setLevel(prev => prev + 1);

            scheduleTimeout(() => {
                setFeedback(null);
                isResolvingRef.current = false;
                // Sonraki seviyeye geç
                setGamePhase(GamePhase.PLAYING);
                setHistory([]);
                focusPlayArea();
            }, 2000);
        } else {
            const msgs = ARCADE_FEEDBACK_TEXTS.ERROR_MESSAGES;
            playArcadeSound('fail');
            setFeedback({ message: msgs[Math.floor(Math.random() * msgs.length)], type: 'error' });
            setLives(prev => {
                const newLives = prev - 1;
                if (newLives <= 0) {
                    scheduleTimeout(() => {
                        setFeedback(null);
                        isResolvingRef.current = false;
                        setGamePhase(GamePhase.RESULT);
                        void saveResult(score);
                    }, 2000);
                } else {
                    scheduleTimeout(() => {
                        setFeedback(null);
                        isResolvingRef.current = false;
                        // Aynı seviyede tekrar dene
                        setGamePhase(GamePhase.PLAYING);
                        setHistory([]);
                        focusPlayArea();
                    }, 2000);
                }
                return newLives;
            });
        }
    }, [focusPlayArea, level, playArcadeSound, saveResult, scheduleTimeout, score]);

    // ─── Start / Restart ─────────────────────────────────────────────────────
    const startGame = useCallback(() => {
        clearScheduledTimeouts();
        playArcadeSound('start');
        setGamePhase(GamePhase.PLAYING);
        setHistory([]);
        setScore(0);
        setLevel(1);
        setLives(3);
        setFeedback(null);
        startTimeRef.current = Date.now();
        hasSavedRef.current = false;
        isResolvingRef.current = false;
        focusPlayArea();
    }, [clearScheduledTimeouts, focusPlayArea, playArcadeSound]);

    useEffect(() => {
        if (autoStart && gamePhase === GamePhase.IDLE) {
            startGame();
        }
    }, [autoStart, gamePhase, startGame]);

    useEffect(() => clearScheduledTimeouts, [clearScheduledTimeouts]);

    const handleBlockHit = useCallback(() => {
        playArcadeSound('hit');
        setScore(prev => prev + BLOCK_SCORE);
    }, [playArcadeSound]);

    const finishGameNow = useCallback(() => {
        if (isResolvingRef.current) {
            return;
        }

        isResolvingRef.current = true;
        clearScheduledTimeouts();
        setGamePhase(GamePhase.RESULT);
        void saveResult(score);
    }, [clearScheduledTimeouts, saveResult, score]);

    const overlay = gamePhase === GamePhase.IDLE ? (
        <KidGameStatusOverlay
            tone="yellow"
            icon={Brain}
            title="ChromaBreak"
            description="Renkli blokları kır, kısa hafıza zincirini aklında tut ve quiz bonusuyla seviyeyi büyüt."
            actions={[
                { label: 'Oyuna Başla', variant: 'primary', size: 'lg', icon: Play, onClick: startGame },
                { label: 'Hızlı Başlangıç', variant: 'ghost', size: 'lg', icon: Sparkles, onClick: startGame },
            ]}
        >
            <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border-2 border-black/10 bg-cyber-yellow/80 px-4 py-4 shadow-neo-sm">
                    <div className="text-[11px] font-black uppercase tracking-[0.2em] text-black/70">1</div>
                    <div className="mt-2 text-sm font-black uppercase">Blok Kır</div>
                </div>
                <div className="rounded-2xl border-2 border-black/10 bg-cyber-blue px-4 py-4 text-white shadow-neo-sm">
                    <div className="text-[11px] font-black uppercase tracking-[0.2em] text-white/70">2</div>
                    <div className="mt-2 text-sm font-black uppercase">Rengi Hatırla</div>
                </div>
                <div className="rounded-2xl border-2 border-black/10 bg-cyber-emerald px-4 py-4 text-black shadow-neo-sm">
                    <div className="text-[11px] font-black uppercase tracking-[0.2em] text-black/70">3</div>
                    <div className="mt-2 text-sm font-black uppercase">Bonus Kazan</div>
                </div>
            </div>
        </KidGameStatusOverlay>
    ) : gamePhase === GamePhase.RESULT ? (
        <KidGameStatusOverlay
            tone="pink"
            icon={Trophy}
            title="Tur Tamamlandı"
            description="Renk hafızası ve refleks birlikte çalıştı. Bir tur daha deneyip skoru büyütebilirsin."
            stats={[
                { label: 'Puan', value: score, tone: 'blue' },
                { label: 'Seviye', value: level, tone: 'yellow' },
                { label: 'Can', value: lives, tone: 'emerald' },
            ]}
            actions={[
                { label: 'Tekrar Oyna', variant: 'primary', size: 'lg', icon: RotateCcw, onClick: startGame },
                { label: 'Geri Dön', variant: 'ghost', size: 'lg', onClick: () => navigate('/bilsem-zeka') },
            ]}
            backdropClassName="bg-slate-950/60"
        />
    ) : null;

    return (
        <KidGameShell
            title="ChromaBreak"
            subtitle="Refleksle blok kır, sonra hafızanı kullanıp renk zincirini doğru cevapla."
            instruction="Her vurduğun renk bir ipucu. Bloklar bittiğinde gelen hafıza sorusuna hazır ol."
            backHref="/bilsem-zeka"
            backLabel="Arcade'e Dön"
            badges={[
                { label: 'Arcade Hafıza', variant: 'difficulty' },
                { label: 'Blok + Quiz', variant: 'tuzo' }
            ]}
            stats={[
                { label: 'Seviye', value: level, tone: 'blue', icon: Layers3 },
                { label: 'Puan', value: score, tone: 'yellow', icon: Star },
                {
                    label: 'Can',
                    value: `${lives}/3`,
                    tone: lives <= 1 ? 'pink' : 'emerald',
                    emphasis: lives <= 1 ? 'danger' : 'default',
                    icon: Heart
                },
                { label: 'Renk Zinciri', value: history.length, tone: 'orange', icon: SwatchBook }
            ]}
            toolbar={gamePhase !== GamePhase.IDLE && gamePhase !== GamePhase.RESULT ? (
                <KidButton type="button" variant="danger" icon={Sparkles} onClick={finishGameNow}>
                    Turu Bitir
                </KidButton>
            ) : null}
            supportTitle="Güç ve Hafıza İpuçları"
            supportDescription="ChromaBreak'te kısa ama etkili destekler burada."
            playAreaRef={playAreaRef}
            supportArea={(
                <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-[1.5rem] border-2 border-black/10 bg-cyber-emerald/20 px-4 py-4 shadow-neo-sm">
                        <div className="text-2xl">🟢</div>
                        <div className="mt-2 text-sm font-black uppercase tracking-wide text-black dark:text-white">Uzat</div>
                        <div className="mt-1 text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-300">
                            Paddle bir süre büyür ve topu daha rahat yakalarsın.
                        </div>
                    </div>
                    <div className="rounded-[1.5rem] border-2 border-black/10 bg-cyber-blue/15 px-4 py-4 shadow-neo-sm">
                        <div className="text-2xl">🔵</div>
                        <div className="mt-2 text-sm font-black uppercase tracking-wide text-black dark:text-white">Yavaş</div>
                        <div className="mt-1 text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-300">
                            Top kısa süreli yavaşlar, pozisyon almak kolaylaşır.
                        </div>
                    </div>
                    <div className="rounded-[1.5rem] border-2 border-black/10 bg-cyber-yellow/35 px-4 py-4 shadow-neo-sm">
                        <div className="text-2xl">🧠</div>
                        <div className="mt-2 text-sm font-black uppercase tracking-wide text-black dark:text-white">Hatırlama</div>
                        <div className="mt-1 text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-300">
                            Son renkleri sıra duygusuyla izle; quizde en çok bunu kullanacaksın.
                        </div>
                    </div>
                </div>
            )}
            overlay={overlay}
        >
            <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center">
                <KidGameFeedbackBanner message={feedback?.message ?? null} type={feedback?.type} />

                <AnimatePresence mode="wait">
                    {gamePhase === GamePhase.PLAYING && (
                        <motion.div
                            key="playing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full"
                        >
                            <BreakoutGame
                                level={level}
                                onGameOver={handleGameOver}
                                onBlockHit={handleBlockHit}
                                onLaunch={() => playArcadeSound('launch')}
                            />
                        </motion.div>
                    )}

                    {gamePhase === GamePhase.QUIZ_PREP && (
                        <motion.div
                            key="prep"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="mt-4 flex min-h-[42vh] w-full max-w-2xl flex-col items-center justify-center rounded-[2.5rem] border-2 border-black/10 bg-cyber-blue/15 p-10 text-center shadow-neo-md"
                        >
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 1 }}
                                className="mb-6 rounded-full border-2 border-black/10 bg-white p-4 text-6xl shadow-neo-sm sm:text-7xl"
                            >
                                🧠
                            </motion.div>
                            <h2 className="text-3xl font-black uppercase tracking-tight text-black dark:text-white sm:text-4xl">
                                Hafıza Testi Geliyor
                            </h2>
                            <p className="mt-4 rounded-xl border-2 border-black/10 bg-cyber-yellow px-4 py-2 text-sm font-black uppercase tracking-[0.2em] text-black shadow-neo-sm">
                                Hazırlanıyor...
                            </p>
                        </motion.div>
                    )}

                    {gamePhase === GamePhase.QUIZZING && (
                        <motion.div
                            key="quiz"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="w-full"
                        >
                            <QuizMode
                                history={history}
                                level={level}
                                onQuizComplete={handleQuizComplete}
                            />
                        </motion.div>
                    )}

                    {(gamePhase === GamePhase.IDLE || gamePhase === GamePhase.RESULT) && (
                        <motion.div
                            key="preview"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="w-full"
                        >
                            <ChromaBreakPreview />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </KidGameShell>
    );
};

export default ChromaBreak;
