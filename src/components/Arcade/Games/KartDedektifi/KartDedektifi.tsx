import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Brain, Heart, Layers3, Play, RotateCcw, Search, Sparkles, Star } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import { ARCADE_SCORE_BASE, ARCADE_SCORE_FORMULA } from '../../Shared/ArcadeConstants';
import { useArcadeGameSession } from '../../Shared/useArcadeGameSession';
import { useArcadeSoundEffects } from '../../Shared/useArcadeSoundEffects';
import Card from './components/Card';
import { CONSECUTIVE_LIMIT, REFERENCE_CARDS, RULE_LABELS } from './constants';
import { Color, RuleType, Shape, type CardData } from './types';
import { KidCard, KidGameFeedbackBanner, KidGameShell, KidGameStatusOverlay } from '../../../kid-ui';
import { useGameViewportFocus } from '../../../../hooks/useGameViewportFocus';

const PREVIEW_TARGET_CARD: CardData = {
    id: 'preview-target',
    color: Color.Blue,
    shape: Shape.Heart,
    number: 2,
};

const RULE_DESCRIPTIONS: Record<RuleType, string> = {
    [RuleType.Color]: 'Ortadaki kartın rengini referans kartlardan biriyle eşleştir.',
    [RuleType.Shape]: 'Bu turda sadece şekle odaklan ve aynı şekli bul.',
    [RuleType.Number]: 'Kart üzerindeki sembol sayısını aynı olan kartla eşleştir.',
};

const KartDedektifiPreview: React.FC = () => {
    const steps = [
        {
            title: 'Kartı İncele',
            description: 'Ortadaki kartın rengini, şeklini ve sayı ipucunu hızlıca tara.',
            accentColor: 'yellow',
        },
        {
            title: 'Kurala Odaklan',
            description: 'Her turda sadece tek kural önemlidir. Doğru ipucunu seç.',
            accentColor: 'blue',
        },
        {
            title: 'Seri Kur',
            description: 'Beş doğru eşleşmeden sonra kural değişir. Ritmi koru.',
            accentColor: 'emerald',
        },
    ] as const;

    return (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <div className="rounded-[2rem] border-2 border-black/10 bg-white/85 p-5 shadow-neo-md dark:border-white/10 dark:bg-slate-900/80">
                <div className="rounded-[1.5rem] border-2 border-black/10 bg-[linear-gradient(180deg,#e0f2fe_0%,#ffffff_55%,#fef3c7_100%)] p-5 shadow-inner dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(30,41,59,0.96)_0%,rgba(15,23,42,0.96)_100%)]">
                    <div className="flex flex-col items-center">
                        <div className="rounded-full border-2 border-black/10 bg-cyber-yellow/75 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-black shadow-neo-sm">
                            Ortadaki Kart
                        </div>
                        <div className="mt-4">
                            <Card card={PREVIEW_TARGET_CARD} isReference disabled />
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                        {REFERENCE_CARDS.map((referenceCard) => (
                            <div key={referenceCard.id} className="flex flex-col items-center gap-2">
                                <Card card={referenceCard} disabled />
                                <div className="rounded-xl border-2 border-black/10 bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-black shadow-neo-sm dark:border-white/10 dark:bg-slate-800/80 dark:text-white">
                                    {referenceCard.color} • {referenceCard.shape}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid gap-4">
                {steps.map((step) => (
                    <KidCard key={step.title} accentColor={step.accentColor} animate={false} className="h-full">
                        <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                            Dedektif Görevi
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

const KartDedektifi: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { playAreaRef, focusPlayArea } = useGameViewportFocus();
    const { playArcadeSound } = useArcadeSoundEffects();
    const {
        sessionState,
        startSession,
        addScore,
        advanceLevel,
        loseLife,
        finishGame,
        recordAttempt,
    } = useArcadeGameSession({ gameId: 'kart-dedektifi' });

    const [currentRule, setCurrentRule] = useState<RuleType>(RuleType.Color);
    const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
    const [currentCard, setCurrentCard] = useState<CardData | null>(null);
    const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

    const promptStartedAtRef = useRef(0);
    const isResolvingRef = useRef(false);
    const consecutiveWrongRef = useRef(0);
    const roundResetTimeoutRef = useRef<number | null>(null);

    const clearRoundResetTimeout = useCallback(() => {
        if (roundResetTimeoutRef.current !== null) {
            window.clearTimeout(roundResetTimeoutRef.current);
            roundResetTimeoutRef.current = null;
        }
    }, []);

    const generateRandomCard = useCallback(() => {
        const colors = Object.values(Color);
        const shapes = Object.values(Shape);
        const id = Math.random().toString(36).substring(7);

        return {
            id,
            color: colors[Math.floor(Math.random() * colors.length)],
            shape: shapes[Math.floor(Math.random() * shapes.length)],
            number: Math.floor(Math.random() * 4) + 1,
        };
    }, []);

    const startGame = useCallback(() => {
        clearRoundResetTimeout();
        startSession();
        playArcadeSound('start');
        setCurrentRule(RuleType.Color);
        setConsecutiveCorrect(0);
        setFeedback(null);
        setCurrentCard(generateRandomCard());
        promptStartedAtRef.current = Date.now();
        isResolvingRef.current = false;
        consecutiveWrongRef.current = 0;
        focusPlayArea();
    }, [clearRoundResetTimeout, focusPlayArea, generateRandomCard, playArcadeSound, startSession]);

    useEffect(() => {
        if (location.state?.autoStart && sessionState.status === 'START') {
            startGame();
        }
    }, [location.state, sessionState.status, startGame]);

    useEffect(() => clearRoundResetTimeout, [clearRoundResetTimeout]);

    useEffect(() => {
        if (sessionState.lives <= 0 && sessionState.status === 'PLAYING') {
            clearRoundResetTimeout();
            isResolvingRef.current = true;
            void finishGame({ status: 'GAME_OVER' });
        }
    }, [clearRoundResetTimeout, finishGame, sessionState.lives, sessionState.status]);

    useEffect(() => {
        if (!currentCard && sessionState.status !== 'GAME_OVER') {
            setCurrentCard(generateRandomCard());
        }
    }, [currentCard, generateRandomCard, sessionState.status]);

    const checkMatch = useCallback((referenceCard: CardData) => {
        if (!currentCard || sessionState.status !== 'PLAYING' || isResolvingRef.current) {
            return;
        }

        isResolvingRef.current = true;
        let isCorrect = false;

        if (currentRule === RuleType.Color) {
            isCorrect = currentCard.color === referenceCard.color;
        } else if (currentRule === RuleType.Shape) {
            isCorrect = currentCard.shape === referenceCard.shape;
        } else if (currentRule === RuleType.Number) {
            isCorrect = currentCard.number === referenceCard.number;
        }

        recordAttempt({
            isCorrect,
            responseMs: promptStartedAtRef.current > 0 ? Date.now() - promptStartedAtRef.current : null,
        });

        if (isCorrect) {
            addScore(ARCADE_SCORE_FORMULA(ARCADE_SCORE_BASE, sessionState.level));
            setFeedback({ message: 'Dedektif iş başında! 🔍', type: 'success' });
            consecutiveWrongRef.current = 0;
        } else {
            loseLife();
            consecutiveWrongRef.current += 1;
            playArcadeSound('fail');

            if (consecutiveWrongRef.current >= 3) {
                setFeedback({ message: 'İpucu: Sadece aktif kurala odaklan! 💡', type: 'warning' });
            } else {
                setFeedback({ message: 'Hmm, bu değildi! 🤔', type: 'error' });
            }
        }

        const nextConsecutive = isCorrect ? consecutiveCorrect + 1 : 0;

        if (nextConsecutive >= CONSECUTIVE_LIMIT) {
            const rules = Object.values(RuleType);
            const availableRules = rules.filter((rule) => rule !== currentRule);
            const nextRule = availableRules[Math.floor(Math.random() * availableRules.length)];

            advanceLevel();
            playArcadeSound('levelUp');
            setCurrentRule(nextRule);
            setConsecutiveCorrect(0);
            setFeedback({ message: 'Kural değişiyor! Hazır mısın? 🔄', type: 'warning' });
        } else {
            if (isCorrect) {
                playArcadeSound('success');
            }
            setConsecutiveCorrect(nextConsecutive);
        }

        clearRoundResetTimeout();
        roundResetTimeoutRef.current = window.setTimeout(() => {
            roundResetTimeoutRef.current = null;
            setCurrentCard(generateRandomCard());
            setFeedback(null);
            isResolvingRef.current = false;
            promptStartedAtRef.current = Date.now();
        }, 800);
    }, [
        addScore,
        advanceLevel,
        consecutiveCorrect,
        currentCard,
        currentRule,
        clearRoundResetTimeout,
        generateRandomCard,
        loseLife,
        playArcadeSound,
        recordAttempt,
        sessionState.level,
        sessionState.status,
    ]);

    const overlay = sessionState.status === 'START' ? (
        <KidGameStatusOverlay
            tone="yellow"
            icon={Search}
            title="Kart Dedektifi"
            description="Ortadaki kartı incele, aktif kurala göre eşleştir ve kural değişimlerine hızlı uyum sağla."
            actions={[
                { label: 'Oyuna Başla', variant: 'primary', size: 'lg', icon: Play, onClick: startGame },
                { label: 'Hemen Deneyelim', variant: 'ghost', size: 'lg', icon: Sparkles, onClick: startGame },
            ]}
        />
    ) : sessionState.status === 'GAME_OVER' ? (
        <KidGameStatusOverlay
            tone="pink"
            icon={Brain}
            title="Dedektif Turu Bitti"
            description="Kural değişimlerini güzel takip ettin. Bir tur daha açıp daha uzun seri kurabilirsin."
            stats={[
                { label: 'Puan', value: sessionState.score, tone: 'blue' },
                { label: 'Seviye', value: sessionState.level, tone: 'yellow' },
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
            title="Kart Dedektifi"
            subtitle="Kuralı keşfet, ortadaki kartı doğru eşleştir ve seri kur."
            instruction={`Aktif kural: ${RULE_LABELS[currentRule]}. Ortadaki kartı bu kurala göre eşleştir.`}
            backHref="/bilsem-zeka"
            backLabel="Arcade'e Dön"
            badges={[
                { label: 'Kural Keşfi', variant: 'difficulty' },
                { label: 'Dikkat + Esneklik', variant: 'tuzo' },
            ]}
            stats={[
                { label: 'Seviye', value: sessionState.level, tone: 'blue', icon: Layers3 },
                { label: 'Puan', value: sessionState.score, tone: 'yellow', icon: Star },
                {
                    label: 'Can',
                    value: `${sessionState.lives}/3`,
                    tone: sessionState.lives <= 1 ? 'pink' : 'emerald',
                    emphasis: sessionState.lives <= 1 ? 'danger' : 'default',
                    icon: Heart,
                },
                {
                    label: 'Kural',
                    value: RULE_LABELS[currentRule],
                    tone: 'orange',
                    icon: Search,
                    helper: `${consecutiveCorrect}/${CONSECUTIVE_LIMIT} doğru sonra değişir`,
                },
            ]}
            supportTitle="Dedektif Rehberi"
            supportDescription="Aktif kurala odaklan, seri ilerlemesini izle ve ipuçlarını kaçırma."
            playAreaRef={playAreaRef}
            supportArea={(
                <div className="grid gap-3 lg:grid-cols-3">
                    <div className="rounded-[1.5rem] border-2 border-black/10 bg-cyber-yellow/35 px-4 py-4 shadow-neo-sm">
                        <div className="text-sm font-black uppercase tracking-[0.2em] text-black dark:text-white">
                            Aktif Kural
                        </div>
                        <p className="mt-2 text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-300">
                            {RULE_DESCRIPTIONS[currentRule]}
                        </p>
                    </div>
                    <div className="rounded-[1.5rem] border-2 border-black/10 bg-cyber-blue/15 px-4 py-4 shadow-neo-sm">
                        <div className="text-sm font-black uppercase tracking-[0.2em] text-black dark:text-white">
                            Seri Takibi
                        </div>
                        <p className="mt-2 text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-300">
                            {consecutiveCorrect} doğru yaptın. {CONSECUTIVE_LIMIT} doğruya ulaşırsan yeni kural gelir.
                        </p>
                    </div>
                    <div className="rounded-[1.5rem] border-2 border-black/10 bg-cyber-emerald/20 px-4 py-4 shadow-neo-sm">
                        <div className="text-sm font-black uppercase tracking-[0.2em] text-black dark:text-white">
                            İpucu
                        </div>
                        <p className="mt-2 text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-300">
                            Yanlış seçimler arttığında tek özelliğe odaklan: renk, şekil ya da sayı.
                        </p>
                    </div>
                </div>
            )}
            overlay={overlay}
        >
            <div className="relative w-full">
                {sessionState.status === 'PLAYING' ? (
                    <div className="flex w-full flex-col items-center gap-6">
                        <KidGameFeedbackBanner message={feedback?.message ?? null} type={feedback?.type} />

                        <div className="w-full max-w-3xl rounded-[2rem] border-2 border-black/10 bg-white/90 p-6 shadow-neo-lg dark:border-white/10 dark:bg-slate-900/80">
                            <div className="flex flex-col items-center">
                                <div className="rounded-full border-2 border-black/10 bg-cyber-yellow/75 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-black shadow-neo-sm">
                                    Sıradaki Kart
                                </div>
                                <div className="mt-5">
                                    <AnimatePresence mode="wait">
                                        {currentCard && (
                                            <motion.div
                                                key={currentCard.id}
                                                initial={{ scale: 0.82, opacity: 0, rotateY: 90 }}
                                                animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                                                exit={{ scale: 1.08, opacity: 0, rotateY: -90 }}
                                                transition={{ type: 'spring', damping: 15 }}
                                            >
                                                <Card card={currentCard} isReference disabled />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>

                        <div className="grid w-full max-w-5xl grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
                            {REFERENCE_CARDS.map((referenceCard) => (
                                <motion.div
                                    key={referenceCard.id}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.96 }}
                                    className="flex flex-col items-center gap-3"
                                >
                                    <Card
                                        card={referenceCard}
                                        onClick={() => checkMatch(referenceCard)}
                                        disabled={isResolvingRef.current}
                                    />
                                    <div className="rounded-xl border-2 border-black/10 bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-black shadow-neo-sm dark:border-white/10 dark:bg-slate-800/80 dark:text-white">
                                        {referenceCard.color} • {referenceCard.shape}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <KartDedektifiPreview />
                )}
            </div>
        </KidGameShell>
    );
};

export default KartDedektifi;
