import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Brain, Heart, Play, RotateCcw, Sparkles, Star } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import { KidCard, KidGameFeedbackBanner, KidGameShell, KidGameStatusOverlay } from '../../../kid-ui';
import { useGameViewportFocus } from '../../../../hooks/useGameViewportFocus';
import BalloonBoard from './components/BalloonBoard';
import GuessPanel from './components/GuessPanel';
import PhaseStatusPanel from './components/PhaseStatusPanel';
import ResultPanel from './components/ResultPanel';
import { QuestionType } from './types';
import { useNeseliBalonlarGame } from './useNeseliBalonlarGame';

const QUESTION_LABELS: Record<QuestionType, string> = {
    [QuestionType.COLOR]: 'Renk',
    [QuestionType.NUMBER]: 'Sayı',
    [QuestionType.POSITION]: 'Konum',
    [QuestionType.ORDER]: 'Sıra',
};

const PHASE_LABELS = {
    idle: 'Hazır',
    watching: 'İzle',
    popping: 'Patlıyor',
    guessing: 'Cevapla',
    result: 'Kontrol',
    gameover: 'Bitti',
} as const;

const PREVIEW_BALLOONS = [
    { color: '#fb7185', number: 2 },
    { color: '#38bdf8', number: 5 },
    { color: '#a3e635', number: 3 },
    { color: '#f59e0b', number: 7 },
];

interface PreviewBalloonProps {
    color: string;
    number: number;
}

const PreviewBalloon: React.FC<PreviewBalloonProps> = ({ color, number }) => (
    <div className="flex flex-col items-center">
        <div
            className="relative flex h-24 w-20 items-center justify-center rounded-[50%_50%_50%_50%_/_60%_60%_40%_40%] border-2 border-black/10 shadow-neo-sm sm:h-28 sm:w-24"
            style={{ backgroundColor: color }}
        >
            <div className="absolute left-[18%] top-[14%] h-6 w-4 -rotate-12 rounded-full bg-white/45" />
            <span className="mt-2 text-3xl font-black text-white [text-shadow:2px_2px_0_rgba(0,0,0,0.55)] sm:text-4xl">
                {number}
            </span>
        </div>
        <div
            className="h-4 w-5 -mt-1 rounded-full border-2 border-black/10 border-t-0 shadow-neo-sm"
            style={{ backgroundColor: color }}
        />
        <div className="ml-[3px] h-10 w-1 rounded-full bg-black/70" />
    </div>
);

const NeseliBalonlarPreview: React.FC = () => {
    const steps = [
        {
            title: 'Önce İzle',
            description: 'Balonların renklerini ve üzerlerindeki sayıları kısa sürede tara.',
            accentColor: 'yellow',
        },
        {
            title: 'Patlayanları Hatırla',
            description: 'Hangi balonların patladığını ya da hangi sırada patladığını aklında tut.',
            accentColor: 'blue',
        },
        {
            title: 'Doğru Cevabı Seç',
            description: 'Soru gelince sadece istenen ipucuna odaklan ve cevabı tamamla.',
            accentColor: 'emerald',
        },
    ] as const;

    return (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <div className="rounded-[2rem] border-2 border-black/10 bg-white/85 p-5 shadow-neo-md dark:border-white/10 dark:bg-slate-900/80">
                <div className="rounded-[1.5rem] border-2 border-black/10 bg-[linear-gradient(180deg,#e0f2fe_0%,#f0fdf4_55%,#fef3c7_100%)] p-6 shadow-inner dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(30,41,59,0.96)_0%,rgba(15,23,42,0.96)_100%)]">
                    <div className="flex flex-wrap items-end justify-center gap-4 sm:gap-6">
                        {PREVIEW_BALLOONS.map((balloon, index) => (
                            <PreviewBalloon key={`${balloon.color}-${index}`} color={balloon.color} number={balloon.number} />
                        ))}
                    </div>
                    <div className="mt-6 rounded-[1.5rem] border-2 border-black/10 bg-white/80 px-4 py-4 text-center shadow-neo-sm dark:border-white/10 dark:bg-slate-800/80">
                        <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                            Hafıza İpucu
                        </div>
                        <p className="mt-2 text-sm font-bold leading-relaxed text-slate-700 dark:text-slate-300">
                            Bir turda bazen renk, bazen sayı, bazen konum, bazen de patlama sırası sorulur.
                        </p>
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

const NeseliBalonlar: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { playAreaRef, focusPlayArea } = useGameViewportFocus();
    const {
        sessionState,
        balloons,
        phase,
        poppedIndices,
        popOrder,
        userGuesses,
        questionType,
        feedback,
        answerOptions,
        questionText,
        shouldHideRemaining,
        watchDurationMs,
        handleStartGame,
        handleGuess,
        submitGuesses,
    } = useNeseliBalonlarGame({ autoStart: location.state?.autoStart, onGameStart: focusPlayArea });

    const instruction = phase === 'guessing'
        ? `${questionText.main} ${questionText.highlight} ${questionText.rest}`.trim()
        : phase === 'watching'
            ? 'Balonların renklerini ve sayılarını aklında tut. Birazdan bazıları patlayacak.'
            : phase === 'popping'
                ? 'Patlayan balonları dikkatle izle. Soru birazdan gelecek.'
                : phase === 'result'
                    ? 'Doğru balonları kontrol ediyoruz. Sonraki tur birazdan başlıyor.'
                    : 'Balonları izle, patlayan renk ve sayı ipuçlarını hatırla, sonra doğru cevabı seç.';

    const overlay = sessionState.status === 'START' ? (
        <KidGameStatusOverlay
            tone="yellow"
            icon={Sparkles}
            title="Neşeli Balonlar"
            description="Balonları izle, patlayan renk ve sayı ipuçlarını aklında tut, sonra doğru cevabı seç."
            actions={[
                { label: 'Oyuna Başla', variant: 'primary', size: 'lg', icon: Play, onClick: handleStartGame },
                { label: 'Hemen Deneyelim', variant: 'ghost', size: 'lg', icon: Sparkles, onClick: handleStartGame },
            ]}
        />
    ) : sessionState.status === 'GAME_OVER' ? (
        <KidGameStatusOverlay
            tone="pink"
            icon={Brain}
            title="Balon Turu Bitti"
            description="Güzel hatırladın. Bir tur daha açıp daha uzun seri kurabilirsin."
            stats={[
                { label: 'Puan', value: sessionState.score, tone: 'blue' },
                { label: 'Seviye', value: sessionState.level, tone: 'yellow' },
                { label: 'Can', value: sessionState.lives, tone: 'emerald' },
            ]}
            actions={[
                { label: 'Tekrar Oyna', variant: 'primary', size: 'lg', icon: RotateCcw, onClick: handleStartGame },
                { label: "Arcade'e Dön", variant: 'ghost', size: 'lg', onClick: () => navigate('/bilsem-zeka') },
            ]}
            backdropClassName="bg-slate-950/60"
        />
    ) : null;

    return (
        <KidGameShell
            title="Neşeli Balonlar"
            subtitle="Balonları izle, patlayan ipuçlarını hatırla ve doğru cevabı seç."
            instruction={instruction}
            backHref="/bilsem-zeka"
            backLabel="Arcade'e Dön"
            badges={[
                { label: 'Renk-Sayı Hafızası', variant: 'difficulty' },
                { label: '1.1.1 Dikkat + Bellek', variant: 'tuzo' },
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
                    label: 'Tur Modu',
                    value: QUESTION_LABELS[questionType],
                    tone: 'orange',
                    icon: Sparkles,
                    helper: PHASE_LABELS[phase],
                },
            ]}
            supportTitle="Balon Rehberi"
            supportDescription="Bu turda neye odaklanacağını ve ipuçlarını burada görebilirsin."
            playAreaRef={playAreaRef}
            supportArea={(
                <div className="grid gap-3 lg:grid-cols-3">
                    <div className="rounded-[1.5rem] border-2 border-black/10 bg-cyber-yellow/35 px-4 py-4 shadow-neo-sm">
                        <div className="text-sm font-black uppercase tracking-[0.2em] text-black dark:text-white">
                            Tur Modu
                        </div>
                        <p className="mt-2 text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-300">
                            Bu turda <span className="font-black text-black dark:text-white">{QUESTION_LABELS[questionType]}</span> ipucuna odaklan.
                        </p>
                    </div>
                    <div className="rounded-[1.5rem] border-2 border-black/10 bg-cyber-blue/15 px-4 py-4 shadow-neo-sm">
                        <div className="text-sm font-black uppercase tracking-[0.2em] text-black dark:text-white">
                            İzleme Süresi
                        </div>
                        <p className="mt-2 text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-300">
                            Balonları yaklaşık {(watchDurationMs / 1000).toFixed(1)} saniye izliyorsun. İlk bakışta gruplamaya çalış.
                        </p>
                    </div>
                    <div className="rounded-[1.5rem] border-2 border-black/10 bg-cyber-emerald/20 px-4 py-4 shadow-neo-sm">
                        <div className="text-sm font-black uppercase tracking-[0.2em] text-black dark:text-white">
                            İpucu
                        </div>
                        <p className="mt-2 text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-300">
                            Önce renkleri aklında grupla, sonra balon sayıları ya da patlama sırasını ekle.
                        </p>
                    </div>
                </div>
            )}
            playAreaClassName="min-h-[720px]"
            overlay={overlay}
        >
            {sessionState.status === 'PLAYING' ? (
                <div className="relative overflow-hidden rounded-[1.75rem] border-2 border-black/10 bg-sky-200 p-2 transition-colors duration-300 dark:border-white/10 dark:bg-slate-900 sm:p-4">
                    <div className="absolute inset-0 opacity-10 pointer-events-none bg-[repeating-linear-gradient(45deg,transparent,transparent_20px,#000_20px,#000_40px)] dark:bg-[repeating-linear-gradient(45deg,transparent,transparent_20px,rgba(255,255,255,0.05)_20px,rgba(255,255,255,0.05)_40px)]" />
                    <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center justify-start">
                        <KidGameFeedbackBanner message={feedback?.message ?? null} type={feedback?.type} />

                        <BalloonBoard
                            balloons={balloons}
                            phase={phase}
                            questionType={questionType}
                            poppedIndices={poppedIndices}
                            userGuesses={userGuesses}
                            shouldHideRemaining={shouldHideRemaining}
                        />

                        <div className="flex w-full flex-col items-center">
                            <AnimatePresence mode="wait">
                                {(phase === 'watching' || phase === 'popping') && (
                                    <PhaseStatusPanel phase={phase} watchDurationMs={watchDurationMs} />
                                )}

                                {phase === 'guessing' && (
                                    <GuessPanel
                                        balloons={balloons}
                                        questionType={questionType}
                                        questionText={questionText}
                                        answerOptions={answerOptions}
                                        userGuesses={userGuesses}
                                        poppedCount={poppedIndices.length}
                                        onGuess={handleGuess}
                                        onSubmit={submitGuesses}
                                    />
                                )}

                                {phase === 'result' && (
                                    <ResultPanel
                                        balloons={balloons}
                                        poppedIndices={poppedIndices}
                                        popOrder={popOrder}
                                        questionType={questionType}
                                    />
                                )}
                            </AnimatePresence>
                        </div>
                    </main>
                </div>
            ) : (
                <NeseliBalonlarPreview />
            )}
        </KidGameShell>
    );
};

export default NeseliBalonlar;
