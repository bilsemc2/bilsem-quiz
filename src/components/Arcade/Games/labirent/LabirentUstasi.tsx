import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    ArrowUp,
    Compass,
    Eye,
    EyeOff,
    Footprints,
    Play,
    RotateCcw,
    Route,
    Sparkles,
    Trophy,
} from 'lucide-react';
import { ARCADE_SCORE_FORMULA, ARCADE_SCORE_BASE } from '../../Shared/ArcadeConstants.ts';
import MazeCanvas from './components/MazeCanvas.tsx';
import { KidButton, KidCard, KidGameFeedbackBanner, KidGameShell, KidGameStatusOverlay } from '../../../kid-ui/index.ts';
import { LEVELS, PREVIEW_ROUTE, getMazeCellSize } from './logic.ts';
import { useLabirentController } from './useLabirentController.ts';

const LabirentPreview: React.FC = () => {
    const previewSteps = [
        {
            title: 'Yön Seç',
            description: 'Joystick ya da yön tuşlarıyla tek adımlık net hareketler yap.',
            accentColor: 'yellow',
        },
        {
            title: 'Rota Kur',
            description: 'Sarı iz kendi yolun, yeşil iz ise yardım için gösterilen çözüm.',
            accentColor: 'blue',
        },
        {
            title: 'Bitişe Ulaş',
            description: 'Kısa yoldan çıkışa ulaşırsan hem puan hem hız kazanırsın.',
            accentColor: 'emerald',
        },
    ] as const;

    return (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <div className="rounded-[2rem] border-2 border-black/10 bg-white/85 p-5 shadow-neo-md dark:border-white/10 dark:bg-slate-900/80">
                <div className="rounded-[1.5rem] border-2 border-black/10 bg-[linear-gradient(180deg,#e0f2fe_0%,#ffffff_55%,#ecfccb_100%)] p-5 shadow-inner dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(30,41,59,0.96)_0%,rgba(15,23,42,0.96)_100%)]">
                    <div className="mx-auto grid max-w-xl grid-cols-6 gap-2">
                        {Array.from({ length: 24 }).map((_, index) => {
                            const row = Math.floor(index / 6);
                            const col = index % 6;
                            const key = `${row}-${col}`;
                            const isStart = key === '0-0';
                            const isFinish = key === '3-5';
                            const isRoute = PREVIEW_ROUTE.has(key);

                            return (
                                <div
                                    key={key}
                                    className={[
                                        'flex aspect-square items-center justify-center rounded-2xl border-2 border-black/10 text-lg shadow-neo-sm',
                                        isStart
                                            ? 'bg-cyber-emerald text-black'
                                            : isFinish
                                                ? 'bg-cyber-yellow text-black'
                                                : isRoute
                                                    ? 'bg-cyber-orange/80 text-black'
                                                    : 'bg-white text-transparent dark:bg-slate-800',
                                    ].join(' ')}
                                >
                                    {isStart ? '🚀' : isFinish ? '🏁' : '•'}
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl border-2 border-black/10 bg-cyber-emerald/25 px-3 py-2 text-center text-xs font-black uppercase tracking-[0.2em] text-black dark:text-white">
                            Başlangıç
                        </div>
                        <div className="rounded-xl border-2 border-black/10 bg-cyber-orange/35 px-3 py-2 text-center text-xs font-black uppercase tracking-[0.2em] text-black dark:text-white">
                            Senin Yolun
                        </div>
                        <div className="rounded-xl border-2 border-black/10 bg-cyber-yellow/60 px-3 py-2 text-center text-xs font-black uppercase tracking-[0.2em] text-black dark:text-white">
                            Bitiş
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-4">
                {previewSteps.map((step) => (
                    <KidCard
                        key={step.title}
                        accentColor={step.accentColor}
                        animate={false}
                        className="h-full"
                    >
                        <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                            Labirent Görevi
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

const LabirentUstasi: React.FC = () => {
    const ctrl = useLabirentController();

    const overlay = (
        <>
            {ctrl.gamePhase === 'idle' && (
                <KidGameStatusOverlay
                    tone="yellow"
                    icon={Compass}
                    title="Labirent Ustasi"
                    description="Başlangıçtan bitişe ulaş, doğru rotayı kur ve seviyeler ilerledikçe daha büyük labirentleri aş."
                    actions={[
                        { label: 'Oyuna Başla', variant: 'primary', size: 'lg', icon: Play, onClick: ctrl.startGame },
                        { label: 'Hemen Deneyelim', variant: 'ghost', size: 'lg', icon: Sparkles, onClick: ctrl.startGame },
                    ]}
                >
                    <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border-2 border-black/10 bg-cyber-yellow/80 px-4 py-4 shadow-neo-sm">
                            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-black/70">1</div>
                            <div className="mt-2 text-sm font-black uppercase">Yönü Bul</div>
                        </div>
                        <div className="rounded-2xl border-2 border-black/10 bg-cyber-blue px-4 py-4 text-white shadow-neo-sm">
                            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-white/70">2</div>
                            <div className="mt-2 text-sm font-black uppercase">İz Bırak</div>
                        </div>
                        <div className="rounded-2xl border-2 border-black/10 bg-cyber-emerald px-4 py-4 text-black shadow-neo-sm">
                            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-black/70">3</div>
                            <div className="mt-2 text-sm font-black uppercase">Bitişe Ulaş</div>
                        </div>
                    </div>
                </KidGameStatusOverlay>
            )}

            {ctrl.gamePhase === 'finished' && (
                <KidGameStatusOverlay
                    tone="pink"
                    icon={Trophy}
                    title="Keşif Tamamlandı"
                    description="Yol bulma kaslarını güzel çalıştırdın. Yeni bir tur açıp daha hızlı bir rota deneyebilirsin."
                    stats={[
                        { label: 'Puan', value: ctrl.score, tone: 'blue' },
                        { label: 'Seviye', value: ctrl.currentLevel + 1, tone: 'yellow' },
                        { label: 'Hamle', value: ctrl.moves, tone: 'emerald' },
                    ]}
                    actions={[
                        { label: 'Tekrar Oyna', variant: 'primary', size: 'lg', icon: RotateCcw, onClick: ctrl.startGame },
                        { label: "Arcade'e Dön", variant: 'ghost', size: 'lg', onClick: () => ctrl.navigate('/bilsem-zeka') },
                    ]}
                    backdropClassName="bg-slate-950/60"
                />
            )}

            <AnimatePresence>
                {ctrl.showLevelWin && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <motion.div initial={{ scale: 0.86, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.86, opacity: 0 }}>
                            <KidGameStatusOverlay
                                tone="emerald"
                                icon={Trophy}
                                title={`Seviye ${ctrl.currentLevel + 1} Tamam`}
                                description={ctrl.currentLevel >= LEVELS.length - 1
                                    ? 'Son labirenti de aştın. Bu turu güzel bir finalle kapatabilirsin.'
                                    : 'Sıra daha büyük bir labirentte. Hazırsan sonraki seviyeye geçelim.'}
                                maxWidthClassName="max-w-lg"
                                backdropClassName="bg-slate-950/45"
                                actions={[
                                    {
                                        label: ctrl.currentLevel >= LEVELS.length - 1 ? 'Turu Bitir' : 'Sonraki Seviye',
                                        variant: 'secondary',
                                        size: 'lg',
                                        icon: Sparkles,
                                        onClick: ctrl.nextLevel,
                                    },
                                ]}
                            >
                                <p className="inline-flex rounded-xl border-2 border-black/10 bg-cyber-yellow px-5 py-2 text-lg font-black uppercase tracking-wide text-black shadow-neo-sm">
                                    +{ARCADE_SCORE_FORMULA(ARCADE_SCORE_BASE, ctrl.currentLevel + 1)} puan
                                </p>
                            </KidGameStatusOverlay>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );

    return (
        <KidGameShell
            title="Labirent Ustası"
            subtitle="Yönünü bul, çıkışa ulaş ve her seviyede daha büyük bir keşfi tamamla."
            instruction="Sarı iz senin yolun. Yardım istersen yeşil çözüm açılır ama 50 puan gider."
            backHref="/bilsem-zeka"
            backLabel="Arcade'e Dön"
            badges={[
                { label: 'Yol Bulma Oyunu', variant: 'difficulty' },
                { label: 'Dikkat + Planlama', variant: 'tuzo' },
            ]}
            stats={[
                {
                    label: 'Seviye',
                    value: `${ctrl.currentLevel + 1}/${LEVELS.length}`,
                    tone: 'blue',
                    icon: Compass,
                    helper: ctrl.level.name,
                },
                { label: 'Puan', value: ctrl.score, tone: 'yellow', icon: Trophy },
                { label: 'Hamle', value: ctrl.moves, tone: 'orange', icon: Footprints },
                {
                    label: 'Harita',
                    value: `${ctrl.level.rows}x${ctrl.level.cols}`,
                    tone: 'emerald',
                    icon: Route,
                },
            ]}
            toolbar={ctrl.gamePhase === 'playing' ? (
                <>
                    <KidButton
                        type="button"
                        variant={ctrl.solution.length > 0 ? 'ghost' : 'secondary'}
                        icon={ctrl.solution.length > 0 ? EyeOff : Eye}
                        onClick={ctrl.showSolutionToggle}
                    >
                        {ctrl.solution.length > 0 ? 'Çözümü Gizle' : 'Çözüm (-50)'}
                    </KidButton>
                    <KidButton type="button" variant="danger" icon={Sparkles} onClick={ctrl.finishGame}>
                        Turu Bitir
                    </KidButton>
                </>
            ) : null}
            supportTitle="Keşif Yardımları"
            supportDescription="Kontrolleri ve renk ipuçlarını buradan hızlica hatırlayabilirsin."
            playAreaRef={ctrl.playAreaRef}
            supportArea={(
                <div className="grid gap-3 lg:grid-cols-3">
                    <div className="rounded-[1.5rem] border-2 border-black/10 bg-cyber-yellow/35 px-4 py-4 shadow-neo-sm">
                        <div className="text-sm font-black uppercase tracking-[0.2em] text-black dark:text-white">Kontrol</div>
                        <p className="mt-2 text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-300">
                            Yön tuşları, WASD ya da joystick ile bitişe doğru ilerle.
                        </p>
                    </div>
                    <div className="rounded-[1.5rem] border-2 border-black/10 bg-cyber-blue/15 px-4 py-4 shadow-neo-sm">
                        <div className="text-sm font-black uppercase tracking-[0.2em] text-black dark:text-white">Renkler</div>
                        <p className="mt-2 text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-300">
                            Sarı yol senin izindir. Yeşil yol yardım için gösterilen çözümdür.
                        </p>
                    </div>
                    <div className="rounded-[1.5rem] border-2 border-black/10 bg-cyber-emerald/20 px-4 py-4 shadow-neo-sm">
                        <div className="text-sm font-black uppercase tracking-[0.2em] text-black dark:text-white">Hedef</div>
                        <p className="mt-2 text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-300">
                            Daha az hamleyle çıkışa ulaşmak hem ritmi hem puanı korumanı sağlar.
                        </p>
                    </div>
                </div>
            )}
            overlay={overlay}
        >
            <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center">
                <KidGameFeedbackBanner message={ctrl.feedback?.message ?? null} type={ctrl.feedback?.type} />

                <AnimatePresence mode="wait">
                    {ctrl.gamePhase === 'playing' ? (
                        <motion.div
                            key="maze-game"
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -14 }}
                            className="w-full"
                        >
                            <div className="flex w-full flex-col items-center justify-center gap-6 xl:flex-row xl:items-start">
                                <div className="relative flex max-w-full items-center justify-center overflow-hidden rounded-[2rem] border-2 border-black/10 bg-white/90 p-3 shadow-neo-lg dark:border-white/10 dark:bg-slate-900/80 sm:p-5">
                                    <MazeCanvas
                                        grid={ctrl.grid}
                                        solution={ctrl.solution}
                                        userPath={ctrl.userPath}
                                        playerPosition={ctrl.playerPosition}
                                        cellSize={getMazeCellSize(ctrl.level.rows, ctrl.level.cols)}
                                        onMoveRequest={ctrl.movePlayer}
                                    />
                                </div>

                                <div className="w-full max-w-sm rounded-[2rem] border-2 border-black/10 bg-white/90 p-6 shadow-neo-lg dark:border-white/10 dark:bg-slate-900/80">
                                    <div
                                        ref={ctrl.joystickRef}
                                        className="relative mx-auto h-36 w-36 rounded-full border-2 border-black/10 bg-slate-200 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1)] transition-colors duration-300 touch-none cursor-pointer dark:border-white/10 dark:bg-slate-700 sm:h-44 sm:w-44"
                                        onTouchStart={(event) => {
                                            event.preventDefault();
                                            ctrl.handleJoystickStart();
                                        }}
                                        onTouchMove={(event) => {
                                            event.preventDefault();
                                            const touch = event.touches[0];
                                            ctrl.handleJoystickMove(touch.clientX, touch.clientY);
                                        }}
                                        onTouchEnd={ctrl.handleJoystickEnd}
                                        onMouseDown={ctrl.handleJoystickStart}
                                        onMouseMove={(event) => {
                                            if (ctrl.isDragging) {
                                                ctrl.handleJoystickMove(event.clientX, event.clientY);
                                            }
                                        }}
                                        onMouseUp={ctrl.handleJoystickEnd}
                                        onMouseLeave={ctrl.handleJoystickEnd}
                                    >
                                        <div className={`absolute left-1/2 top-2 -translate-x-1/2 transition-all duration-150 ${ctrl.activeDirection === 'up' ? 'scale-125 text-black dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                                            <ArrowUp size={24} strokeWidth={4} />
                                        </div>
                                        <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 transition-all duration-150 ${ctrl.activeDirection === 'down' ? 'scale-125 text-black dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                                            <ArrowDown size={24} strokeWidth={4} />
                                        </div>
                                        <div className={`absolute left-2 top-1/2 -translate-y-1/2 transition-all duration-150 ${ctrl.activeDirection === 'left' ? 'scale-125 text-black dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                                            <ArrowLeft size={24} strokeWidth={4} />
                                        </div>
                                        <div className={`absolute right-2 top-1/2 -translate-y-1/2 transition-all duration-150 ${ctrl.activeDirection === 'right' ? 'scale-125 text-black dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                                            <ArrowRight size={24} strokeWidth={4} />
                                        </div>

                                        <div
                                            className="absolute left-1/2 top-1/2 flex h-16 w-16 items-center justify-center rounded-full border-2 border-black/10 bg-cyber-pink shadow-neo-sm transition-transform duration-75 sm:h-20 sm:w-20"
                                            style={{
                                                transform: `translate(calc(-50% + ${ctrl.joystickPos.x}px), calc(-50% + ${ctrl.joystickPos.y}px)) scale(${ctrl.isDragging ? 0.95 : 1})`,
                                            }}
                                        >
                                            <div className="absolute left-3 top-2 h-6 w-6 rounded-full bg-white/30 blur-[1px]" />
                                        </div>
                                    </div>

                                    <p className="mt-5 rounded-xl border-2 border-black/10 bg-cyber-yellow px-4 py-2 text-center text-sm font-black uppercase tracking-[0.22em] text-black shadow-neo-sm">
                                        Yönü Sen Ver
                                    </p>

                                    <div className="mt-5 grid gap-3 text-left">
                                        <div className="rounded-xl border-2 border-black/10 bg-cyber-blue/15 px-4 py-3 shadow-neo-sm">
                                            <div className="text-xs font-black uppercase tracking-[0.2em] text-black dark:text-white">
                                                Kısa İpucu
                                            </div>
                                            <div className="mt-2 text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-300">
                                                Köşeye sıkıştığında geriye dönüp yeni bir koridor denemekten çekinme.
                                            </div>
                                        </div>
                                        <div className="rounded-xl border-2 border-black/10 bg-cyber-emerald/20 px-4 py-3 shadow-neo-sm">
                                            <div className="text-xs font-black uppercase tracking-[0.2em] text-black dark:text-white">
                                                Bu Seviye
                                            </div>
                                            <div className="mt-2 text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-300">
                                                {ctrl.level.name} düzeyinde {ctrl.level.rows} satır ve {ctrl.level.cols} sütunlu bir labirenttesin.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="maze-preview"
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -14 }}
                            className="w-full"
                        >
                            <LabirentPreview />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </KidGameShell>
    );
};

export default LabirentUstasi;
