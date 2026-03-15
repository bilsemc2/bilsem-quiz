import React from 'react';
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    Eye,
    EyeOff,
    Play,
    RotateCcw,
    Scissors,
    Sparkles,
    Trophy,
} from 'lucide-react';
import { KidCard, KidGameFeedbackBanner, KidGameShell, KidGameStatusOverlay } from '../../../kid-ui/index.ts';
import { FoldDirection, PunchShape } from './types.ts';
import { useKraftOrigamiController, PAPER_COLORS } from './useKraftOrigamiController.ts';

const ShapeIcon = ({ shape, className }: { shape: PunchShape; className?: string }) => {
    switch (shape) {
        case PunchShape.HEART:
            return (
                <svg viewBox="0 0 24 24" className={className} fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
            );
        case PunchShape.STAR:
            return (
                <svg viewBox="0 0 24 24" className={className} fill="currentColor">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
            );
        case PunchShape.SQUARE:
            return <div className={`aspect-square rounded-sm bg-current ${className}`} />;
        default:
            return <div className={`aspect-square rounded-full bg-current ${className}`} />;
    }
};

const KraftOrigamiPreview: React.FC = () => {
    const previewShapes: PunchShape[] = [PunchShape.CIRCLE, PunchShape.HEART, PunchShape.STAR, PunchShape.SQUARE];

    return (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <div className="rounded-[2rem] border-2 border-black/10 bg-white/85 p-5 shadow-neo-md dark:border-white/10 dark:bg-slate-900/80">
                <div className="rounded-[1.5rem] border-2 border-black/10 bg-[linear-gradient(180deg,#fef3c7_0%,#ffffff_45%,#dcfce7_100%)] p-6 shadow-inner dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(30,41,59,0.96)_0%,rgba(15,23,42,0.96)_100%)]">
                    <div className="mx-auto flex max-w-sm items-center justify-between gap-3 rounded-[1.5rem] border-2 border-black/10 bg-white/85 px-4 py-4 shadow-neo-sm dark:border-white/10 dark:bg-slate-800/80">
                        <div className="grid gap-2">
                            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Katla</div>
                            <div className="flex gap-2">
                                {[ChevronLeft, ChevronUp, ChevronRight].map((Icon, index) => (
                                    <div key={index} className="grid h-10 w-10 place-items-center rounded-2xl border-2 border-black/10 bg-cyber-pink/85 text-white shadow-neo-sm">
                                        <Icon size={18} className="stroke-[2.5]" />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="h-24 w-24 rounded-[1.75rem] border-2 border-black/10 bg-[#d4b483] shadow-neo-sm" />
                        <div className="grid gap-2">
                            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Del</div>
                            <div className="grid grid-cols-2 gap-2">
                                {previewShapes.map((shape) => (
                                    <div key={shape} className="grid h-10 w-10 place-items-center rounded-2xl border-2 border-black/10 bg-cyber-blue text-white shadow-neo-sm">
                                        <ShapeIcon shape={shape} className="h-4 w-4" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 rounded-[1.5rem] border-2 border-black/10 bg-cyber-emerald/20 px-4 py-4 text-center shadow-neo-sm">
                        <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Son Adım</div>
                        <div className="mt-2 text-lg font-black text-black dark:text-white">Kağıdı aç ve simetrik deseni keşfet</div>
                    </div>
                </div>
            </div>

            <div className="grid gap-4">
                {[
                    { title: 'Önce Katla', desc: 'Ok düğmeleri görünür parçayı küçültür. Her katlama yeni bir simetri katmanı kurar.', color: 'yellow' },
                    { title: 'Sonra Del', desc: 'Seçtiğin şekli görünür katmana uygula. Her delik açıldığında kopyalanacak bir iz bırakır.', color: 'blue' },
                    { title: 'Simetriyi Aç', desc: 'Kağıdı açınca küçük bir delik bile büyük bir desene dönüşür. Farklı katlarla yeni sürprizler dene.', color: 'emerald' },
                ].map((step) => (
                    <KidCard key={step.title} accentColor={step.color} animate={false}>
                        <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Origami Görevi</div>
                        <div className="mt-2 text-2xl font-black tracking-tight text-black dark:text-white">{step.title}</div>
                        <p className="mt-2 text-sm font-bold leading-relaxed text-slate-600 dark:text-slate-300">{step.desc}</p>
                    </KidCard>
                ))}
            </div>
        </div>
    );
};

const KraftOrigami: React.FC = () => {
    const ctrl = useKraftOrigamiController();

    const overlay = ctrl.gamePhase === 'idle' ? (
        <KidGameStatusOverlay
            tone="orange" icon={Scissors} title="Kraft Origami"
            description="Kağıdı katla, del ve açıldığında simetrik deseni keşfet. Her kat yeni bir sürpriz oluşturur."
            actions={[
                { label: 'Oyuna Başla', variant: 'primary', size: 'lg', icon: Play, onClick: ctrl.startGame },
                { label: "Arcade'e Dön", variant: 'ghost', size: 'lg', onClick: () => ctrl.navigate('/bilsem-zeka') },
            ]}
        />
    ) : ctrl.gamePhase === 'finished' ? (
        <KidGameStatusOverlay
            tone="emerald" icon={Trophy} title="Desen Hazır"
            description="Kendi simetrik origami desenini oluşturdun. Yeni denemede farklı kat yönleriyle bambasşka sonuçlar çıkarabilirsin."
            stats={[
                { label: 'Puan', value: ctrl.score, tone: 'yellow' },
                { label: 'Katlama', value: ctrl.state.folds.length, tone: 'orange' },
                { label: 'Açılan Delik', value: ctrl.finalPunches.length, tone: 'blue' },
            ]}
            actions={[
                { label: 'Yeniden Başla', variant: 'primary', size: 'lg', icon: RotateCcw, onClick: ctrl.startGame },
                { label: "Arcade'e Dön", variant: 'ghost', size: 'lg', onClick: () => ctrl.navigate('/bilsem-zeka') },
            ]}
            backdropClassName="bg-slate-950/60"
        />
    ) : null;

    return (
        <KidGameShell
            title="Kraft Origami"
            subtitle="Kağıdı katla, şekli del ve açıldığında oluşan simetriyi keşfet."
            instruction={ctrl.instruction}
            backHref="/bilsem-zeka" backLabel="Arcade'e Dön"
            badges={[
                { label: 'Simetri Keşfi', variant: 'difficulty' },
                { label: 'TUZÖ 5.5.1', variant: 'tuzo' },
            ]}
            stats={[
                { label: 'Katlama', value: `${ctrl.state.folds.length}/6`, tone: 'orange', icon: Scissors, helper: 'Her kat yeni bir yansıma ekseni kurar' },
                { label: 'Delik', value: ctrl.finalPunches.length, tone: 'blue', icon: Sparkles, helper: ctrl.state.punches.length === 0 ? 'Önce görünür parçayı del' : 'Açıldığında çoğalır' },
                { label: 'Görünüm', value: ctrl.state.isUnfolded ? 'Açık' : 'Katlı', tone: ctrl.state.isUnfolded ? 'emerald' : 'yellow', icon: ctrl.state.isUnfolded ? Eye : EyeOff, helper: ctrl.state.isUnfolded ? 'Simetriyi inceliyorsun' : 'Delmeye hazırsın' },
                { label: 'Puan', value: ctrl.score, tone: 'purple', icon: Trophy, helper: `${ctrl.currentPaperColorName} kağıdı ile çalışıyorsun` },
            ]}
            actions={ctrl.gamePhase === 'playing' ? [
                { label: 'Sıfırla', variant: 'ghost', icon: RotateCcw, onClick: ctrl.handleReset },
                { label: ctrl.state.isUnfolded ? 'Kapat' : 'Aç', variant: 'secondary', icon: ctrl.state.isUnfolded ? EyeOff : Eye, disabled: ctrl.state.punches.length === 0, onClick: ctrl.toggleUnfold },
                { label: 'Bitir', variant: 'success', icon: Sparkles, disabled: ctrl.state.punches.length === 0, onClick: ctrl.finishGame },
            ] : []}
            supportTitle="Origami Rehberi"
            supportDescription="Daha zengin desenler kurmak için katlama ve delme adımlarını küçük ipuçlarıyla takip et."
            playAreaRef={ctrl.playAreaRef} playAreaClassName="min-h-[900px]"
            supportArea={(
                <div className="grid gap-5">
                    <KraftOrigamiPreview />
                    <div className="grid gap-4 lg:grid-cols-3">
                        <div className="rounded-[1.5rem] border-2 border-black/10 bg-cyber-yellow/30 px-4 py-4 shadow-neo-sm">
                            <div className="text-sm font-black uppercase tracking-[0.2em] text-black dark:text-white">Farklı Yönleri Karıştır</div>
                            <p className="mt-2 text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-300">Aynı yönü art arda kullanmak yerine sağ, sol, yukarı ve aşağı katlamaları birleştirirsen desen daha şaşırtıcı olur.</p>
                        </div>
                        <div className="rounded-[1.5rem] border-2 border-black/10 bg-cyber-blue/15 px-4 py-4 shadow-neo-sm">
                            <div className="text-sm font-black uppercase tracking-[0.2em] text-black dark:text-white">Merkez ve Kenar</div>
                            <p className="mt-2 text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-300">Deliği merkeze yaklaştırırsan düzenli motifler, kenara yaklaştırırsan daha hareketli boşluklar elde edersin.</p>
                        </div>
                        <div className="rounded-[1.5rem] border-2 border-black/10 bg-cyber-emerald/20 px-4 py-4 shadow-neo-sm">
                            <div className="text-sm font-black uppercase tracking-[0.2em] text-black dark:text-white">Şekli Değiştir</div>
                            <p className="mt-2 text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-300">Aynı kat planını kare, kalp ve yıldızla tekrar dene. Hangi şeklin en dengeli sonucu verdiğini karşılaştır.</p>
                        </div>
                    </div>
                </div>
            )}
            overlay={overlay}
        >
            <div className="relative flex flex-col gap-6">
                <KidGameFeedbackBanner message={ctrl.feedback?.message ?? null} type={ctrl.feedback?.type} />

                <div className="grid gap-6 xl:grid-cols-[minmax(250px,300px)_minmax(0,1fr)]">
                    <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
                        <section className="rounded-[1.8rem] border-2 border-black/10 bg-cyber-blue/10 p-4 shadow-neo-sm dark:border-white/10 dark:bg-cyber-blue/10">
                            <h2 className="rounded-2xl border-2 border-black/10 bg-white/80 px-4 py-2 text-center text-[11px] font-black uppercase tracking-[0.22em] text-black shadow-neo-sm dark:border-white/10 dark:bg-slate-800/80 dark:text-white">Delgeç Şekli</h2>
                            <div className="mt-4 grid grid-cols-2 gap-3">
                                {Object.values(PunchShape).map((shape) => (
                                    <button
                                        key={shape} type="button"
                                        onClick={() => ctrl.setCurrentShape(shape)}
                                        className={['aspect-square rounded-[1.5rem] border-2 border-black/10 transition-all', 'flex items-center justify-center shadow-neo-sm', ctrl.currentShape === shape ? 'translate-y-1 bg-cyber-yellow text-black shadow-none' : 'bg-white text-black hover:-translate-y-1 dark:border-white/10 dark:bg-slate-800 dark:text-white'].join(' ')}
                                    >
                                        <ShapeIcon shape={shape} className="h-7 w-7" />
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section className="rounded-[1.8rem] border-2 border-black/10 bg-cyber-emerald/15 p-4 shadow-neo-sm dark:border-white/10 dark:bg-cyber-emerald/10">
                            <h2 className="rounded-2xl border-2 border-black/10 bg-white/80 px-4 py-2 text-center text-[11px] font-black uppercase tracking-[0.22em] text-black shadow-neo-sm dark:border-white/10 dark:bg-slate-800/80 dark:text-white">Katlama</h2>
                            <div className="relative mx-auto mt-5 h-32 w-32 rounded-full border-2 border-black/10 bg-white/85 shadow-inner dark:border-white/10 dark:bg-slate-800/80">
                                <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-black/10 bg-cyber-orange shadow-neo-sm" />
                                {([
                                    { dir: FoldDirection.UP, cls: 'absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 hover:-translate-y-[55%]', Icon: ChevronUp },
                                    { dir: FoldDirection.RIGHT, cls: 'absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 hover:translate-x-[55%]', Icon: ChevronRight },
                                    { dir: FoldDirection.DOWN, cls: 'absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 hover:translate-y-[55%]', Icon: ChevronDown },
                                    { dir: FoldDirection.LEFT, cls: 'absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 hover:-translate-x-[55%]', Icon: ChevronLeft },
                                ] as const).map(({ dir, cls, Icon }) => (
                                    <button
                                        key={dir} type="button"
                                        onClick={() => ctrl.handleFold(dir)}
                                        disabled={ctrl.state.isUnfolded || ctrl.state.folds.length >= 6}
                                        className={`${cls} grid h-10 w-10 place-items-center rounded-2xl border-2 border-black/10 bg-cyber-pink text-white shadow-neo-sm transition-all disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10`}
                                    >
                                        <Icon size={20} className="stroke-[2.5]" />
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section className="rounded-[1.8rem] border-2 border-black/10 bg-cyber-pink/10 p-4 shadow-neo-sm dark:border-white/10 dark:bg-cyber-pink/10">
                            <h2 className="rounded-2xl border-2 border-black/10 bg-white/80 px-4 py-2 text-center text-[11px] font-black uppercase tracking-[0.22em] text-black shadow-neo-sm dark:border-white/10 dark:bg-slate-800/80 dark:text-white">Kağıt Rengi</h2>
                            <div className="mt-4 flex flex-wrap justify-center gap-3">
                                {PAPER_COLORS.map((paperColor) => (
                                    <button
                                        key={paperColor.value} type="button" aria-label={paperColor.name}
                                        onClick={() => ctrl.setState((prev) => ({ ...prev, paperColor: paperColor.value }))}
                                        className={['h-10 w-10 rounded-full border-2 border-black/10 transition-all shadow-neo-sm', ctrl.state.paperColor === paperColor.value ? 'scale-110 translate-y-1 shadow-none' : 'hover:-translate-y-1'].join(' ')}
                                        style={{ backgroundColor: paperColor.value }}
                                    />
                                ))}
                            </div>
                            <div className="mt-4 text-center text-xs font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">
                                Aktif renk: {ctrl.currentPaperColorName}
                            </div>
                        </section>
                    </div>

                    <div className="rounded-[2rem] border-2 border-black/10 bg-[linear-gradient(180deg,rgba(236,253,245,0.92)_0%,rgba(254,249,195,0.9)_100%)] p-4 shadow-neo-md dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98)_0%,rgba(22,101,52,0.28)_100%)] sm:p-6">
                        <div className="relative flex min-h-[520px] items-center justify-center overflow-hidden rounded-[2rem] border-2 border-black/10 bg-emerald-100/90 p-6 dark:border-white/10 dark:bg-emerald-950/30">
                            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '30px 30px' }} />

                            <div className="relative z-10 aspect-square w-full max-w-[360px]">
                                <div
                                    className={['absolute overflow-hidden border-2 border-black/10 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]', ctrl.state.isUnfolded ? 'rounded-[0.75rem]' : 'rounded-sm', ctrl.isPunchable ? 'cursor-crosshair' : 'cursor-default'].join(' ')}
                                    onClick={ctrl.handlePunch}
                                    style={{
                                        backgroundColor: ctrl.state.paperColor,
                                        width: `${(ctrl.state.isUnfolded ? 1 : ctrl.foldedDim.width) * 100}%`,
                                        height: `${(ctrl.state.isUnfolded ? 1 : ctrl.foldedDim.height) * 100}%`,
                                        left: `${(ctrl.state.isUnfolded ? 0 : ctrl.foldedDim.offsetX) * 100}%`,
                                        top: `${(ctrl.state.isUnfolded ? 0 : ctrl.foldedDim.offsetY) * 100}%`,
                                        boxShadow: ctrl.state.isUnfolded ? '10px 10px 0 rgba(15, 23, 42, 0.45)' : '6px 6px 0 rgba(15, 23, 42, 0.35)',
                                        aspectRatio: '1 / 1',
                                    }}
                                >
                                    {!ctrl.state.isUnfolded && ctrl.state.folds.length > 0 && (
                                        <div className="pointer-events-none absolute inset-0 shadow-[inset_4px_4px_0_rgba(0,0,0,0.1)]" />
                                    )}

                                    {ctrl.finalPunches.map((punch, index) => (
                                        <div
                                            key={`${punch.shape}-${index}`}
                                            className="absolute -translate-x-1/2 -translate-y-1/2 text-emerald-100"
                                            style={{
                                                left: `${(ctrl.state.isUnfolded ? punch.x : (punch.x - ctrl.foldedDim.offsetX) / ctrl.foldedDim.width) * 100}%`,
                                                top: `${(ctrl.state.isUnfolded ? punch.y : (punch.y - ctrl.foldedDim.offsetY) / ctrl.foldedDim.height) * 100}%`,
                                            }}
                                        >
                                            <ShapeIcon shape={punch.shape} className="h-6 w-6 sm:h-7 sm:w-7" />
                                        </div>
                                    ))}

                                    {!ctrl.state.isUnfolded && ctrl.state.folds.length === 0 && (
                                        <div className="absolute inset-0 grid place-items-center p-6 text-center">
                                            <div className="rotate-2 rounded-2xl border-2 border-black/10 bg-white/85 px-4 py-3 text-xs font-black uppercase tracking-[0.24em] text-black shadow-neo-sm">
                                                Önce Katla, Sonra Del
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </KidGameShell>
    );
};

export default KraftOrigami;
