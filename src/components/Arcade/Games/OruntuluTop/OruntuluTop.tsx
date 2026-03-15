import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Brain, Heart, Play, RotateCcw, Sparkles, Star, Target } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useArcadeSoundEffects } from '../../Shared/useArcadeSoundEffects';
import { useArcadeGameSession } from '../../Shared/useArcadeGameSession';
import { KidCard, KidGameShell, KidGameStatusOverlay } from '../../../kid-ui';
import { useGameViewportFocus } from '../../../../hooks/useGameViewportFocus';
import { COLOR_CONFIG, POWER_UP_CONFIG } from './constants';
import {
    calculateMatchReward,
    collectMatchingBubbles,
    createInitialBubbles,
    decorateBubblesWithPowerUps,
    ensureTargetAccessible,
    generatePatternDefinition,
    getComboMultiplier,
    getPowerUpSummary,
} from './logic';
import OruntuluTopCanvas from './OruntuluTopCanvas';
import { createExplosionParticles } from './physics';
import type { Bubble, BubbleColor, Particle } from './types';
import { useOruntuluTopCanvas } from './useOruntuluTopCanvas';

const PREVIEW_PATTERN: BubbleColor[] = ['red', 'blue', 'green'];

interface PreviewBubbleProps {
    color: BubbleColor;
    dashed?: boolean;
    label?: React.ReactNode;
}

const PreviewBubble: React.FC<PreviewBubbleProps> = ({ color, dashed = false, label }) => (
    <div className="flex flex-col items-center gap-2">
        <div
            className={[
                'relative flex h-14 w-14 items-center justify-center rounded-full border-4 shadow-neo-sm sm:h-16 sm:w-16',
                dashed ? 'border-dashed border-black/20 bg-white/90 text-slate-500' : 'border-black/10',
            ].join(' ')}
            style={dashed ? undefined : { backgroundColor: COLOR_CONFIG[color].hex }}
        >
            {!dashed && <div className="absolute left-3 top-3 h-4 w-4 rounded-full bg-white/60" />}
            {dashed && <span className="text-2xl font-black">?</span>}
        </div>
        {label ? (
            <div className="rounded-full border-2 border-black/10 bg-white/85 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-black shadow-neo-sm dark:border-white/10 dark:bg-slate-900/70 dark:text-white">
                {label}
            </div>
        ) : null}
    </div>
);

const OruntuluTopPreview: React.FC = () => {
    const steps = [
        {
            title: 'Diziyi Oku',
            description: 'Üstteki balonların renk sırasını hızlıca takip et.',
            accentColor: 'yellow',
        },
        {
            title: 'Eksik Rengi Bul',
            description: 'Sıradaki renk hangisiyse sadece ona odaklan.',
            accentColor: 'blue',
        },
        {
            title: 'Balonu Fırlat',
            description: 'Beyaz topu doğru renkteki balona gönder, yıldızları topla ve serini büyüt.',
            accentColor: 'emerald',
        },
    ] as const;

    return (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <div className="rounded-[2rem] border-2 border-black/10 bg-white/85 p-5 shadow-neo-md dark:border-white/10 dark:bg-slate-900/80">
                <div className="rounded-[1.5rem] border-2 border-black/10 bg-[linear-gradient(180deg,#dbeafe_0%,#ecfeff_52%,#fef3c7_100%)] p-6 shadow-inner dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(30,41,59,0.96)_0%,rgba(15,23,42,0.96)_100%)]">
                    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                        {PREVIEW_PATTERN.map((color, index) => (
                            <React.Fragment key={`${color}-${index}`}>
                                <PreviewBubble color={color} label={COLOR_CONFIG[color].label} />
                                <div className="hidden h-1 w-4 rounded-full bg-black/30 sm:block" />
                            </React.Fragment>
                        ))}
                        <PreviewBubble color="orange" dashed label="Eksik Renk" />
                    </div>

                    <div className="mt-8 grid gap-3 sm:grid-cols-3">
                        {Object.entries(COLOR_CONFIG).slice(0, 3).map(([colorKey, config]) => (
                            <div
                                key={colorKey}
                                className="rounded-[1.5rem] border-2 border-black/10 bg-white/80 px-4 py-4 text-center shadow-neo-sm dark:border-white/10 dark:bg-slate-800/80"
                            >
                                <div
                                    className="mx-auto h-10 w-10 rounded-full border-2 border-black/10"
                                    style={{ backgroundColor: config.hex }}
                                />
                                <div className="mt-3 text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                    Örnek Balon
                                </div>
                                <div className="mt-1 text-lg font-black text-black dark:text-white">
                                    {config.label}
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
                            Balon Görevi
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

const OruntuluTop: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { playAreaRef, focusPlayArea } = useGameViewportFocus();
    const { playArcadeSound } = useArcadeSoundEffects();
    const {
        sessionState,
        sessionRef,
        startSession,
        addScore,
        advanceLevel,
        loseLife,
        finishGame,
        recordAttempt,
        updateSession,
    } = useArcadeGameSession({ gameId: 'oruntulu-top' });

    const bubblesRef = useRef<Bubble[]>([]);
    const particlesRef = useRef<Particle[]>([]);
    const targetColorRef = useRef<BubbleColor | null>(null);
    const isResolvingRef = useRef(false);
    const timeoutIdsRef = useRef<number[]>([]);

    const [currentPattern, setCurrentPattern] = useState<BubbleColor[]>([]);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
    const [comboStreak, setComboStreak] = useState(0);
    const [bestCombo, setBestCombo] = useState(0);
    const [roundPowerUps, setRoundPowerUps] = useState({ star: 0, heart: 0 });

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

    const generateNextPattern = useCallback((level: number = sessionRef.current.level) => {
        const nextPattern = generatePatternDefinition(level);
        setCurrentPattern(nextPattern.pattern);
        targetColorRef.current = nextPattern.correct;
        return nextPattern.correct;
    }, [sessionRef]);

    const prepareRoundBubbles = useCallback((
        bubbles: Bubble[],
        targetColor: BubbleColor,
        gridCols: number,
        level: number,
    ) => {
        const accessibleBubbles = ensureTargetAccessible(bubbles, targetColor, gridCols);
        const decoratedBubbles = decorateBubblesWithPowerUps(accessibleBubbles, targetColor, level);
        setRoundPowerUps(getPowerUpSummary(decoratedBubbles));
        return decoratedBubbles;
    }, []);

    const {
        canvasRef,
        containerRef,
        getLayoutSnapshot,
        handlePointerStart,
        handlePointerMove,
        handlePointerEnd,
    } = useOruntuluTopCanvas({
        isPlaying: sessionState.status === 'PLAYING',
        feedbackActive: feedback !== null,
        isResolvingRef,
        bubblesRef,
        particlesRef,
        onLaunch: () => {
            playArcadeSound('launch');
        },
        onBubbleHit: (hitBubble) => {
            if (isResolvingRef.current || sessionRef.current.status !== 'PLAYING') {
                return;
            }

            isResolvingRef.current = true;

            if (hitBubble.color === targetColorRef.current) {
                const matches = collectMatchingBubbles(hitBubble, bubblesRef.current);
                const nextCombo = comboStreak + 1;
                const reward = calculateMatchReward({
                    level: sessionRef.current.level,
                    clusterSize: matches.length,
                    comboStreak: nextCombo,
                    powerUps: matches.flatMap((bubble) => (bubble.powerUp ? [bubble.powerUp] : [])),
                    currentLives: sessionRef.current.lives,
                });

                matches.forEach((bubble) => {
                    bubble.active = false;
                    particlesRef.current.push(
                        ...createExplosionParticles(bubble.x, bubble.y, COLOR_CONFIG[bubble.color].hex),
                    );
                });

                recordAttempt({ isCorrect: true, responseMs: null });
                addScore(reward.totalPoints);
                if (reward.lifeGain > 0) {
                    updateSession((current) => ({
                        ...current,
                        lives: Math.min(3, current.lives + reward.lifeGain),
                    }));
                }

                const advancedSession = advanceLevel();
                setComboStreak(nextCombo);
                setBestCombo((currentBest) => Math.max(currentBest, nextCombo));
                setRoundPowerUps(getPowerUpSummary(bubblesRef.current));

                const feedbackParts = [`Harika! +${reward.totalPoints} puan`];
                if (reward.comboMultiplier > 1) {
                    feedbackParts.push(`Combo x${reward.comboMultiplier.toFixed(1)}`);
                }
                if (reward.starBonus > 0) {
                    feedbackParts.push(`Yıldız +${reward.starBonus}`);
                }
                if (reward.lifeGain > 0) {
                    feedbackParts.push(`+${reward.lifeGain} can`);
                } else if (reward.overflowHeartBonus > 0) {
                    feedbackParts.push(`Kalp +${reward.overflowHeartBonus}`);
                }

                playArcadeSound(
                    reward.starBonus > 0 ||
                    reward.lifeGain > 0 ||
                    reward.overflowHeartBonus > 0 ||
                    reward.comboMultiplier > 1
                        ? 'reward'
                        : 'success',
                );
                setFeedback({ type: 'success', msg: feedbackParts.join(' • ') });

                scheduleTimeout(() => {
                    setFeedback(null);
                    isResolvingRef.current = false;

                    const nextLevel = advancedSession.level;
                    if (bubblesRef.current.filter((bubble) => bubble.active).length < 10) {
                        const layout = getLayoutSnapshot();
                        const nextBubbles = createInitialBubbles(layout);
                        const nextTarget = generateNextPattern(nextLevel);
                        bubblesRef.current = prepareRoundBubbles(nextBubbles, nextTarget, layout.gridCols, nextLevel);
                    } else {
                        const nextTarget = generateNextPattern(nextLevel);
                        bubblesRef.current = prepareRoundBubbles(
                            bubblesRef.current,
                            nextTarget,
                            getLayoutSnapshot().gridCols,
                            nextLevel,
                        );
                    }
                }, 1500);

                return;
            }

            const nextSession = loseLife();
            recordAttempt({ isCorrect: false, responseMs: null });
            playArcadeSound('fail');
            setComboStreak(0);
            setFeedback({ type: 'error', msg: 'Yanlış renk! Örüntüyü tekrar kontrol et.' });

            if (nextSession.lives <= 0) {
                scheduleTimeout(() => {
                    setFeedback(null);
                    isResolvingRef.current = false;
                    void finishGame({ status: 'GAME_OVER' });
                }, 1500);
                return;
            }

            scheduleTimeout(() => {
                setFeedback(null);
                isResolvingRef.current = false;
            }, 1500);
        },
    });

    const initGrid = useCallback(() => {
        const layout = getLayoutSnapshot();
        const nextBubbles = createInitialBubbles(layout);
        const nextTarget = generateNextPattern(sessionRef.current.level);
        bubblesRef.current = prepareRoundBubbles(nextBubbles, nextTarget, layout.gridCols, sessionRef.current.level);
    }, [generateNextPattern, getLayoutSnapshot, prepareRoundBubbles, sessionRef]);

    const startGame = useCallback(() => {
        clearScheduledTimeouts();
        playArcadeSound('start');
        startSession();
        setFeedback(null);
        setComboStreak(0);
        setBestCombo(0);
        setRoundPowerUps({ star: 0, heart: 0 });
        isResolvingRef.current = false;
        particlesRef.current = [];
        initGrid();
        focusPlayArea();
    }, [clearScheduledTimeouts, focusPlayArea, initGrid, playArcadeSound, startSession]);

    useEffect(() => {
        if (location.state?.autoStart && sessionState.status === 'START') {
            startGame();
        }
    }, [location.state, sessionState.status, startGame]);

    useEffect(() => clearScheduledTimeouts, [clearScheduledTimeouts]);

    const activeTargetLabel = targetColorRef.current
        ? COLOR_CONFIG[targetColorRef.current].label
        : 'Başlayınca açılır';
    const comboMultiplier = getComboMultiplier(comboStreak);
    const comboLabel = comboStreak > 0 ? `${comboStreak} seri` : 'Hazır';
    const comboHelper = comboStreak > 1 ? `x${comboMultiplier.toFixed(1)} puan bonusu` : 'İlk isabetle seri başlar';
    const supportHintMessage = comboStreak > 1
        ? `Seri sıcak! Combo x${comboMultiplier.toFixed(1)} ile puanını büyüt.`
        : roundPowerUps.star + roundPowerUps.heart > 0
            ? 'Yıldız ve kalp balonlarını zincirin içine alırsan ekstra ödül kazanırsın.'
            : 'Aynı renkteki kümeyi bul ve ilk serini başlat.';

    const overlay = sessionState.status === 'START' ? (
        <KidGameStatusOverlay
            tone="yellow"
            icon={Target}
            title="Örüntü Avcısı"
            description="Eksik balonun rengini bul, beyaz topu doğru hedefe fırlat, yıldız balonlarla puan topla ve kalp balonlarla nefes kazan."
            actions={[
                { label: 'Oyuna Başla', variant: 'primary', size: 'lg', icon: Play, onClick: startGame },
                { label: 'Hemen Deneyelim', variant: 'ghost', size: 'lg', icon: Sparkles, onClick: startGame },
            ]}
        />
    ) : sessionState.status === 'GAME_OVER' ? (
        <KidGameStatusOverlay
            tone="pink"
            icon={Brain}
            title="Balon Turu Bitti"
            description="Renk örüntülerini güzel takip ettin. Bir tur daha açıp daha uzun seri kurabilirsin."
            stats={[
                { label: 'Puan', value: sessionState.score, tone: 'blue' },
                { label: 'Seviye', value: sessionState.level, tone: 'yellow' },
                { label: 'Can', value: sessionState.lives, tone: 'emerald' },
                { label: 'En Uzun Seri', value: `${bestCombo}x`, tone: 'orange' },
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
            title="Örüntü Avcısı"
            subtitle="Eksik rengi bul, beyaz topu doğru balona fırlat ve zinciri büyüt."
            instruction={`Hedef renk: ${activeTargetLabel}. Örüntüyü tamamlayan balonu seç.`}
            backHref="/bilsem-zeka"
            backLabel="Arcade'e Dön"
            badges={[
                { label: 'Örüntü Tamamlama', variant: 'difficulty' },
                { label: '5.3.1 Dikkat + Örüntü', variant: 'tuzo' },
            ]}
            stats={[
                { label: 'Seviye', value: sessionState.level, tone: 'blue', icon: Brain },
                { label: 'Puan', value: sessionState.score, tone: 'yellow', icon: Star },
                {
                    label: 'Can',
                    value: `${sessionState.lives}/3`,
                    tone: sessionState.lives <= 1 ? 'pink' : 'emerald',
                    emphasis: sessionState.lives <= 1 ? 'danger' : 'default',
                    icon: Heart,
                },
                {
                    label: 'Combo',
                    value: comboLabel,
                    tone: comboStreak > 1 ? 'pink' : 'emerald',
                    icon: Sparkles,
                    helper: comboHelper,
                },
                {
                    label: 'Hedef Renk',
                    value: activeTargetLabel,
                    tone: 'orange',
                    icon: Target,
                    helper: `${currentPattern.length + 1} adımlı sıra`,
                },
            ]}
            supportTitle="Balon Rehberi"
            supportDescription="Örüntüyü tamamlamak, sürpriz balonları toplamak ve seriyi büyütmek için kısa ipuçları burada."
            playAreaRef={playAreaRef}
            supportArea={(
                <div className="grid gap-3 lg:grid-cols-3">
                    <div className="rounded-[1.5rem] border-2 border-black/10 bg-cyber-yellow/35 px-4 py-4 shadow-neo-sm">
                        <div className="text-sm font-black uppercase tracking-[0.2em] text-black dark:text-white">
                            Sıra Nasıl Okunur?
                        </div>
                        <p className="mt-2 text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-300">
                            Soldan sağa ilerle, eksik balonun gelmesi gereken renk sırasını aklında tut.
                        </p>
                    </div>
                    <div className="rounded-[1.5rem] border-2 border-black/10 bg-cyber-blue/15 px-4 py-4 shadow-neo-sm">
                        <div className="text-sm font-black uppercase tracking-[0.2em] text-black dark:text-white">
                            Combo Gücü
                        </div>
                        <p className="mt-2 text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-300">
                            Şu an <span className="font-black text-black dark:text-white">{comboLabel}</span> durumundasın.
                            {comboStreak > 1 ? ` Vuruşların x${comboMultiplier.toFixed(1)} ile çarpılıyor.` : ' İki doğru vuruşla bonus puan artmaya başlar.'}
                        </p>
                    </div>
                    <div className="rounded-[1.5rem] border-2 border-black/10 bg-cyber-emerald/20 px-4 py-4 shadow-neo-sm">
                        <div className="text-sm font-black uppercase tracking-[0.2em] text-black dark:text-white">
                            Sürpriz Balonlar
                        </div>
                        <p className="mt-2 text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-300">
                            {roundPowerUps.star > 0 ? `${roundPowerUps.star} ${POWER_UP_CONFIG.star.shortLabel.toLowerCase()} balon` : 'Bu tur yıldız bekliyor olabilir'}
                            {' ve '}
                            {roundPowerUps.heart > 0 ? `${roundPowerUps.heart} ${POWER_UP_CONFIG.heart.shortLabel.toLowerCase()} balon` : 'kalp desteği gizlenmiş olabilir'}.
                            Doğru kümeyi patlatırsan ekstra puan ve can kazanırsın.
                        </p>
                    </div>
                </div>
            )}
            playAreaClassName="min-h-[min(680px,84dvh)] sm:min-h-[min(720px,87dvh)]"
            overlay={overlay}
        >
            {sessionState.status === 'PLAYING' ? (
                <div className="relative h-[min(650px,82dvh)] overflow-hidden rounded-[1.75rem] border-2 border-black/10 bg-[linear-gradient(180deg,#dbeafe_0%,#e0f2fe_32%,#fef3c7_100%)] sm:h-[min(690px,85dvh)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.96)_0%,rgba(30,41,59,0.92)_55%,rgba(8,47,73,0.92)_100%)]">
                    <OruntuluTopCanvas
                        containerRef={containerRef}
                        canvasRef={canvasRef}
                        isPlaying={sessionState.status === 'PLAYING'}
                        currentPattern={currentPattern}
                        feedback={feedback}
                        hintMessage={supportHintMessage}
                        onPointerStart={handlePointerStart}
                        onPointerMove={handlePointerMove}
                        onPointerEnd={handlePointerEnd}
                    />
                </div>
            ) : (
                <OruntuluTopPreview />
            )}
        </KidGameShell>
    );
};

export default OruntuluTop;
