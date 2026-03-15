import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Brain, Bug, Heart, Play, RotateCcw, Star, Timer } from 'lucide-react';
import { KidCard, KidGameFeedbackBanner, KidGameShell, KidGameStatusOverlay } from '../../../kid-ui/index.ts';
import {
    INITIAL_LIVES,
    TIME_LIMIT,
    MAX_LEVEL,
    CREATURES,
    COLORS,
    CREATURE_BG,
    actionLabels,
} from './logic.ts';
import type { CreatureData } from './logic.ts';
import { useSevimliMantikController } from './useSevimliMantikController.ts';

const AnimatedCreature: React.FC<{
    data: CreatureData;
    isPlaying: boolean;
    onAnimationEnd?: (id: string) => void;
}> = ({ data, isPlaying, onAnimationEnd }) => {
    const controls = useAnimation();

    useEffect(() => {
        let cancelled = false;

        const runAnimation = async () => {
            if (isPlaying) {
                try {
                    switch (data.action) {
                        case 'jump':
                            await controls.start({ y: [0, -60, 0, -30, 0], scale: [1, 1.1, 0.9, 1.05, 1], transition: { duration: 0.8 } });
                            break;
                        case 'spin':
                            await controls.start({ rotate: 360, scale: [1, 1.2, 1], transition: { duration: 0.8 } });
                            break;
                        case 'shake':
                            await controls.start({ x: [-10, 10, -10, 10, -5, 5, 0], transition: { duration: 0.6 } });
                            break;
                        case 'move_right':
                            await controls.start({ x: 80, rotate: [0, 10, -10, 0], transition: { duration: 1 } });
                            break;
                        case 'move_left':
                            await controls.start({ x: -80, rotate: [0, -10, 10, 0], transition: { duration: 1 } });
                            break;
                        case 'grow':
                            await controls.start({ scale: [1, 1.5, 1.5, 1], transition: { duration: 1.2 } });
                            break;
                        case 'idle':
                        default:
                            await controls.start({ scale: [1, 1.05, 1], transition: { duration: 1 } });
                            break;
                    }
                } catch {
                    // Animations can be interrupted when the round changes.
                }

                if (!cancelled && onAnimationEnd) {
                    onAnimationEnd(data.id);
                }
            } else {
                controls.set({ x: 0, y: 0, rotate: 0, scale: 1 });
            }
        };

        void runAnimation();
        return () => {
            cancelled = true;
        };
    }, [controls, data.action, data.id, isPlaying, onAnimationEnd]);

    const background = CREATURE_BG[data.color] || 'bg-slate-300 border-slate-500';

    return (
        <div className="flex flex-col items-center justify-end">
            <div className="mb-1 h-3 w-20 rounded-full bg-black/20 blur-sm" />
            <motion.div
                animate={controls}
                className={`relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl border-2 border-black/10 bg-gradient-to-br ${background} shadow-neo-sm transition-colors duration-300 sm:h-32 sm:w-32 sm:rounded-[2rem] dark:border-white/10`}
            >
                <img src={data.imageUrl} alt={data.name} className="z-10 h-20 w-20 object-contain drop-shadow-md sm:h-24 sm:w-24" />
                <div className="absolute left-2 top-2 h-6 w-4 rotate-12 rounded-full bg-white/60" />
            </motion.div>
            <div className="mt-4 rotate-2 rounded-xl border-2 border-black/10 bg-white px-4 py-1.5 text-xs font-black text-black shadow-neo-sm transition-colors duration-300 sm:text-sm dark:border-white/10 dark:bg-slate-700 dark:text-white">
                {data.name}
            </div>
        </div>
    );
};

const SevimliMantikPreview: React.FC = () => {
    return (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
            <div className="rounded-[2rem] border-2 border-black/10 bg-white/85 p-5 shadow-neo-md dark:border-white/10 dark:bg-slate-900/80">
                <div className="rounded-[1.5rem] border-2 border-black/10 bg-[linear-gradient(180deg,#ede9fe_0%,#ffffff_45%,#dbeafe_100%)] p-6 shadow-inner dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(30,41,59,0.96)_0%,rgba(15,23,42,0.96)_100%)]">
                    <div className="grid gap-4 sm:grid-cols-2">
                        {CREATURES.slice(0, 2).map((creature, index) => (
                            <div key={creature.id} className="rounded-[1.5rem] border-2 border-black/10 bg-white/85 p-4 text-center shadow-neo-sm dark:border-white/10 dark:bg-slate-800/80">
                                <img src={creature.imageUrl} alt={creature.name} className="mx-auto h-20 w-20 rounded-2xl border-2 border-black/10 bg-slate-100 p-2 shadow-neo-sm" />
                                <div className="mt-3 text-sm font-black uppercase tracking-[0.18em] text-black dark:text-white">{creature.name}</div>
                                <div className="mt-2 rounded-lg border-2 border-black/10 bg-cyber-yellow/70 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-black shadow-neo-sm">
                                    {index === 0 ? 'zıplarsa' : 'dönerse'}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        {COLORS.slice(0, 2).map((option) => (
                            <div key={option.id} className={`rounded-[1.5rem] border-2 border-black/10 bg-gradient-to-br ${option.bgColor} px-4 py-4 text-center text-lg font-black text-white shadow-neo-sm`}>
                                <span className="rounded-lg bg-white/25 px-3 py-1">{option.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid gap-4">
                {[
                    { title: 'Robotları İzle', desc: 'Her robotun hangi hareketi yaptığını dikkatle takip et. Kuralın ilk parçası burada çözülür.', color: 'yellow' },
                    { title: 'Koşulu Kur', desc: 'Kural bazen tek koşul, bazen de "ve / veya" ile gelen iki koşul içerir. Önce hangi tarafın doğru olduğuna karar ver.', color: 'blue' },
                    { title: 'Doğru Rengi Seç', desc: 'Koşulu sağlayan seçenek hangi renkse ona dokun. Süre akarken hızlı ama sakin düşünmek en önemli kısım.', color: 'emerald' },
                ].map((step) => (
                    <KidCard key={step.title} accentColor={step.color} animate={false}>
                        <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Mantık Görevi</div>
                        <div className="mt-2 text-2xl font-black tracking-tight text-black dark:text-white">{step.title}</div>
                        <p className="mt-2 text-sm font-bold leading-relaxed text-slate-600 dark:text-slate-300">{step.desc}</p>
                    </KidCard>
                ))}
            </div>
        </div>
    );
};

const SevimliMantik: React.FC = () => {
    const ctrl = useSevimliMantikController();

    const overlay = ctrl.phase === 'welcome' ? (
        <KidGameStatusOverlay
            tone="purple" icon={Bug} title="Sevimli Mantık"
            description="Robotların hareketlerini izle, koşulu doğru çöz ve verilen kurala uyan renge dokun."
            actions={[
                { label: 'Oyuna Başla', variant: 'primary', size: 'lg', icon: Play, onClick: ctrl.handleStart },
                { label: "Arcade'e Dön", variant: 'ghost', size: 'lg', onClick: () => ctrl.navigate('/bilsem-zeka') },
            ]}
        />
    ) : ctrl.phase === 'game_over' ? (
        <KidGameStatusOverlay
            tone="pink" icon={Heart} title="Süre Bitti"
            description="Koşulları çözmeye devam ederken süre ve canlar tükendi. Yeni turda kuralları biraz daha sakin okuyup ilerleyebilirsin."
            stats={[
                { label: 'Puan', value: ctrl.score, tone: 'yellow' },
                { label: 'Seviye', value: ctrl.level, tone: 'blue' },
                { label: 'Can', value: ctrl.lives, tone: 'emerald' },
            ]}
            actions={[
                { label: 'Tekrar Oyna', variant: 'primary', size: 'lg', icon: RotateCcw, onClick: ctrl.handleStart },
                { label: "Arcade'e Dön", variant: 'ghost', size: 'lg', onClick: () => ctrl.navigate('/bilsem-zeka') },
            ]}
            backdropClassName="bg-slate-950/60"
        />
    ) : ctrl.phase === 'victory' ? (
        <KidGameStatusOverlay
            tone="emerald" icon={Star} title="Mantık Ustası"
            description="Tüm seviyeleri tamamladın. Koşullu çıkarım ve dikkat tarafını birlikte çok güçlü kullandın."
            stats={[
                { label: 'Puan', value: ctrl.score, tone: 'yellow' },
                { label: 'Seviye', value: MAX_LEVEL, tone: 'blue' },
                { label: 'Süre', value: ctrl.formatTime(ctrl.timeLeft), tone: 'orange' },
            ]}
            actions={[
                { label: 'Yeniden Başla', variant: 'primary', size: 'lg', icon: RotateCcw, onClick: ctrl.handleStart },
                { label: "Arcade'e Dön", variant: 'ghost', size: 'lg', onClick: () => ctrl.navigate('/bilsem-zeka') },
            ]}
            backdropClassName="bg-slate-950/60"
        />
    ) : null;

    return (
        <KidGameShell
            title="Sevimli Mantık"
            subtitle="Robotların hareketlerini izle, mantık kuralını çöz ve doğru renge dokun."
            instruction={
                ctrl.round && (ctrl.phase === 'playing' || ctrl.phase === 'animating')
                    ? ctrl.round.instruction
                    : `Robotların hareketlerine göre doğru rengi seç. ${INITIAL_LIVES} canın, ${TIME_LIMIT / 60} dakikan ve ${MAX_LEVEL} seviyen var.`
            }
            backHref="/bilsem-zeka" backLabel="Arcade'e Dön"
            badges={[
                { label: 'Koşullu Çıkarım', variant: 'difficulty' },
                { label: 'TUZÖ 5.2.1', variant: 'tuzo' },
            ]}
            stats={[
                { label: 'Süre', value: ctrl.formatTime(ctrl.timeLeft), tone: ctrl.timeLeft <= 30 ? 'pink' : 'blue', icon: Timer, emphasis: ctrl.timeLeft <= 30 ? 'danger' : 'default', helper: ctrl.timeLeft <= 30 ? 'Son saniyeler' : 'Süren akıyor' },
                { label: 'Puan', value: ctrl.score, tone: 'yellow', icon: Star, helper: 'Her doğru seçim seviye puanı getirir' },
                { label: 'Can', value: `${ctrl.lives}/${INITIAL_LIVES}`, tone: ctrl.lives <= 1 ? 'pink' : 'emerald', emphasis: ctrl.lives <= 1 ? 'danger' : 'default', icon: Heart, helper: ctrl.lives <= 1 ? 'Son şans' : 'Yanlış seçim can götürür' },
                { label: 'Seviye', value: ctrl.level, tone: 'orange', icon: Brain, helper: `${ctrl.getDifficulty(ctrl.level).toUpperCase()} zorluk` },
            ]}
            actions={ctrl.phase === 'playing' ? [
                { label: 'Tekrar İzle', variant: 'ghost', icon: RotateCcw, onClick: ctrl.handleReplay },
            ] : []}
            supportTitle="Mantık Rehberi"
            supportDescription="Kuralları daha net çözmek ve yanlış seçimi azaltmak için kısa ipuçları burada."
            playAreaRef={ctrl.playAreaRef} playAreaClassName="min-h-[840px]"
            supportArea={(
                <div className="grid gap-3 lg:grid-cols-3">
                    <div className="rounded-[1.5rem] border-2 border-black/10 bg-cyber-yellow/30 px-4 py-4 shadow-neo-sm">
                        <div className="text-sm font-black uppercase tracking-[0.2em] text-black dark:text-white">Önce İzle</div>
                        <p className="mt-2 text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-300">Robotların hangi hareketi yaptığını zihninde tek tek isimlendir. Hareketi hatırlamak, kuralı çözmenin ilk adımı.</p>
                    </div>
                    <div className="rounded-[1.5rem] border-2 border-black/10 bg-cyber-blue/15 px-4 py-4 shadow-neo-sm">
                        <div className="text-sm font-black uppercase tracking-[0.2em] text-black dark:text-white">VE / VEYA</div>
                        <p className="mt-2 text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-300">"VE" iki koşulun da doğru olmasını ister. "VEYA" ise en az birinin doğru olmasıyla çalışır.</p>
                    </div>
                    <div className="rounded-[1.5rem] border-2 border-black/10 bg-cyber-emerald/20 px-4 py-4 shadow-neo-sm">
                        <div className="text-sm font-black uppercase tracking-[0.2em] text-black dark:text-white">Son Kontrol</div>
                        <p className="mt-2 text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-300">Renge dokunmadan önce kuralı son kez kendi cümlenle içinden tekrarla. Bu, acele yanlışlarını azaltır.</p>
                    </div>
                </div>
            )}
            overlay={overlay}
        >
            {ctrl.round && (ctrl.phase === 'playing' || ctrl.phase === 'animating') ? (
                <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-5 px-2 sm:px-4">
                    <div className="w-full rounded-full border-2 border-black/10 bg-slate-200 p-1 shadow-neo-sm dark:border-white/10 dark:bg-slate-800">
                        <motion.div
                            className="h-4 rounded-full border-r-4 border-black/10 bg-cyber-emerald dark:border-white/10"
                            initial={{ width: 0 }}
                            animate={{ width: `${(ctrl.level / MAX_LEVEL) * 100}%` }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>

                    <KidCard accentColor="blue" animate={false} className="w-full">
                        <div className="flex flex-col items-center gap-6">
                            <div className="flex flex-wrap justify-center items-end gap-8 sm:gap-16 min-h-[220px]">
                                {ctrl.round.creatures.map((creature) => (
                                    <AnimatedCreature
                                        key={creature.id}
                                        data={creature}
                                        isPlaying={ctrl.phase === 'animating'}
                                        onAnimationEnd={ctrl.handleAnimationEnd}
                                    />
                                ))}
                            </div>

                            {ctrl.phase === 'playing' ? (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap justify-center gap-3">
                                    {ctrl.round.creatures.map((creature) => (
                                        <div key={creature.id} className="rotate-[-2deg] rounded-xl border-2 border-black/10 bg-white px-4 py-2 text-sm font-black text-black shadow-neo-sm transition-colors duration-300 dark:border-white/10 dark:bg-slate-700 dark:text-white">
                                            {creature.name.split(' ').pop()}: {actionLabels[creature.action]}
                                        </div>
                                    ))}
                                </motion.div>
                            ) : (
                                <KidCard accentColor="yellow" animate={false} className="w-full max-w-sm text-center">
                                    <div className="text-lg font-black uppercase text-black dark:text-white">Animasyonu izle...</div>
                                </KidCard>
                            )}
                        </div>
                    </KidCard>

                    {ctrl.phase === 'playing' ? (
                        <div className="grid w-full max-w-md grid-cols-2 gap-4">
                            {ctrl.round.options.map((option) => (
                                <motion.button
                                    key={option.id}
                                    type="button"
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => ctrl.handleOptionSelect(option.id)}
                                    disabled={ctrl.isResolvingRef.current}
                                    className={`rounded-2xl border-2 border-black/10 bg-gradient-to-br ${option.bgColor} py-5 text-xl font-black text-white shadow-neo-sm transition-all hover:shadow-neo-md active:translate-y-1 dark:border-white/10`}
                                >
                                    <span className="rounded-lg bg-white/30 px-3 py-1">{option.label}</span>
                                </motion.button>
                            ))}
                        </div>
                    ) : null}

                    <KidGameFeedbackBanner message={ctrl.feedback?.message ?? null} type={ctrl.feedback?.type} />
                </div>
            ) : (
                <SevimliMantikPreview />
            )}
        </KidGameShell>
    );
};

export default SevimliMantik;
