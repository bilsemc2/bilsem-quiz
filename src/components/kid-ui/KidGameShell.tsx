import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Sparkles, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import KidBadge from './KidBadge';
import KidButton from './KidButton';
import KidCard from './KidCard';

type KidGameShellTone = 'yellow' | 'blue' | 'emerald' | 'pink' | 'orange' | 'purple';

export interface KidGameShellBadge
    extends Pick<React.ComponentProps<typeof KidBadge>, 'variant' | 'icon' | 'pulse' | 'className'> {
    label: React.ReactNode;
}

export interface KidGameShellAction
    extends Pick<React.ComponentProps<typeof KidButton>, 'variant' | 'icon' | 'iconRight' | 'disabled'> {
    label: React.ReactNode;
    onClick: () => void;
}

export interface KidGameShellStat {
    label: string;
    value: React.ReactNode;
    icon?: LucideIcon;
    tone?: KidGameShellTone;
    emphasis?: 'default' | 'danger' | 'success';
    helper?: React.ReactNode;
}

interface KidGameShellProps {
    title: string;
    subtitle: string;
    instruction?: React.ReactNode;
    backHref?: string;
    onBack?: () => void;
    backLabel?: string;
    badges?: KidGameShellBadge[];
    stats?: KidGameShellStat[];
    actions?: KidGameShellAction[];
    toolbar?: React.ReactNode;
    supportArea?: React.ReactNode;
    supportTitle?: string;
    supportDescription?: string;
    playAreaRef?: React.Ref<HTMLDivElement>;
    playAreaClassName?: string;
    className?: string;
    overlay?: React.ReactNode;
    children: React.ReactNode;
}

const statToneClasses: Record<KidGameShellTone, string> = {
    yellow: 'bg-cyber-yellow/85 text-black',
    blue: 'bg-cyber-blue text-white',
    emerald: 'bg-cyber-emerald text-black',
    pink: 'bg-cyber-pink text-white',
    orange: 'bg-cyber-orange text-black',
    purple: 'bg-cyber-purple text-white',
};

const statValueClasses: Record<NonNullable<KidGameShellStat['emphasis']>, string> = {
    default: 'text-inherit',
    danger: 'text-cyber-pink',
    success: 'text-cyber-emerald',
};

const backControlClasses = [
    'inline-flex items-center gap-2',
    'rounded-2xl border-2 border-black/10 bg-white/90 px-4 py-3',
    'font-nunito font-extrabold uppercase tracking-wide text-black',
    'shadow-neo-sm transition-all hover:-translate-y-1 hover:shadow-neo-md',
    'dark:bg-slate-800/90 dark:text-white dark:border-slate-700',
].join(' ');

const KidGameShell: React.FC<KidGameShellProps> = ({
    title,
    subtitle,
    instruction,
    backHref,
    onBack,
    backLabel = 'Geri Dön',
    badges = [],
    stats = [],
    actions = [],
    toolbar,
    supportArea,
    supportTitle = 'Destek Alani',
    supportDescription,
    playAreaRef,
    playAreaClassName = '',
    className = '',
    overlay,
    children,
}) => {
    const backControl = onBack ? (
        <button type="button" onClick={onBack} className={backControlClasses}>
            <ChevronLeft size={20} className="stroke-[2.5]" />
            <span>{backLabel}</span>
        </button>
    ) : backHref ? (
        <Link to={backHref} className={backControlClasses}>
            <ChevronLeft size={20} className="stroke-[2.5]" />
            <span>{backLabel}</span>
        </Link>
    ) : null;

    return (
        <div
            className={[
                'relative min-h-screen overflow-hidden bg-cyber-paper font-nunito text-black dark:bg-slate-950 dark:text-white',
                className,
            ].filter(Boolean).join(' ')}
        >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(220,241,38,0.32),transparent_28%),radial-gradient(circle_at_top_right,rgba(30,64,175,0.18),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.85)_0%,rgba(236,254,255,0.92)_52%,rgba(254,242,242,0.88)_100%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(220,241,38,0.14),transparent_24%),radial-gradient(circle_at_top_right,rgba(20,241,149,0.12),transparent_28%),linear-gradient(180deg,rgba(15,23,42,0.98)_0%,rgba(17,24,39,0.98)_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(rgba(15,23,42,0.08)_1px,transparent_1px)] [background-size:22px_22px] dark:bg-[radial-gradient(rgba(248,250,252,0.06)_1px,transparent_1px)]" />

            <motion.div
                aria-hidden="true"
                className="absolute left-[6%] top-28 h-16 w-16 rounded-[1.75rem] border-2 border-black/10 bg-cyber-yellow/80 shadow-neo-sm dark:border-white/10"
                animate={{ y: [0, -10, 0], rotate: [0, 8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
                aria-hidden="true"
                className="absolute right-[8%] top-40 h-10 w-10 rounded-full border-2 border-black/10 bg-cyber-pink/80 shadow-neo-sm dark:border-white/10"
                animate={{ y: [0, 12, 0], x: [0, -4, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
            />
            <motion.div
                aria-hidden="true"
                className="absolute bottom-20 left-[12%] h-12 w-12 rounded-2xl border-2 border-black/10 bg-cyber-emerald/80 shadow-neo-sm dark:border-white/10"
                animate={{ y: [0, -8, 0], rotate: [0, -10, 0] }}
                transition={{ duration: 5.6, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
            />

            <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-10 pt-20 sm:px-6 lg:gap-8 lg:px-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {backControl}
                    {badges.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                            {badges.map((badge, index) => (
                                <KidBadge
                                    key={`${index}-${String(badge.label)}`}
                                    variant={badge.variant}
                                    icon={badge.icon}
                                    pulse={badge.pulse}
                                    className={badge.className}
                                >
                                    {badge.label}
                                </KidBadge>
                            ))}
                        </div>
                    )}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <KidCard accentColor="yellow" animate={false} noPadding className="overflow-hidden">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.75),transparent_50%),linear-gradient(135deg,rgba(220,241,38,0.18)_0%,rgba(255,255,255,0.9)_55%,rgba(244,63,94,0.08)_100%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_40%),linear-gradient(135deg,rgba(30,41,59,0.9)_0%,rgba(15,23,42,0.95)_100%)]" />
                            <div className="relative grid gap-6 p-6 sm:p-8 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
                                <div className="space-y-4">
                                    <div className="inline-flex items-center gap-2 rounded-full border-2 border-black/10 bg-white/85 px-3 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-cyber-blue shadow-neo-sm dark:border-white/10 dark:bg-slate-900/70">
                                        <Sparkles size={14} className="stroke-[2.5]" />
                                        Çocuk Oyunu Kalıbı
                                    </div>
                                    <div className="space-y-3">
                                        <h1 className="max-w-3xl text-3xl font-black leading-none tracking-tight sm:text-4xl lg:text-5xl">
                                            {title}
                                        </h1>
                                        <p className="max-w-2xl text-base font-bold text-slate-600 dark:text-slate-300 sm:text-lg">
                                            {subtitle}
                                        </p>
                                        {instruction && (
                                            <div className="max-w-2xl rounded-[1.5rem] border-2 border-black/10 bg-white/80 px-4 py-3 text-sm font-bold text-slate-700 shadow-neo-sm dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-200 sm:text-base">
                                                {instruction}
                                            </div>
                                        )}
                                    </div>

                                    {actions.length > 0 && (
                                        <div className="flex flex-wrap gap-3 pt-2">
                                            {actions.map((action, index) => (
                                                <KidButton
                                                    key={`${index}-${String(action.label)}`}
                                                    type="button"
                                                    variant={action.variant}
                                                    icon={action.icon}
                                                    iconRight={action.iconRight}
                                                    disabled={action.disabled}
                                                    onClick={action.onClick}
                                                >
                                                    {action.label}
                                                </KidButton>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {toolbar && (
                                    <div className="flex flex-wrap items-center gap-3 xl:justify-end">
                                        {toolbar}
                                    </div>
                                )}
                            </div>

                            {stats.length > 0 && (
                                <div className="relative grid gap-3 border-t-2 border-black/10 bg-white/70 px-4 py-4 dark:border-white/10 dark:bg-slate-900/65 sm:grid-cols-2 sm:px-6 xl:grid-cols-4">
                                    {stats.map((stat, index) => {
                                        const Icon = stat.icon;
                                        return (
                                            <div
                                                key={`${stat.label}-${index}`}
                                                className={[
                                                    'rounded-[1.5rem] border-2 border-black/10 px-4 py-4 shadow-neo-sm dark:border-white/10',
                                                    statToneClasses[stat.tone || 'blue'],
                                                ].join(' ')}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <div className="text-[11px] font-black uppercase tracking-[0.22em] opacity-75">
                                                            {stat.label}
                                                        </div>
                                                        <div className={[
                                                            'mt-2 text-2xl font-black leading-none sm:text-3xl',
                                                            statValueClasses[stat.emphasis || 'default'],
                                                        ].join(' ')}>
                                                            {stat.value}
                                                        </div>
                                                        {stat.helper && (
                                                            <div className="mt-2 text-xs font-bold opacity-80">
                                                                {stat.helper}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {Icon && (
                                                        <div className="rounded-2xl border-2 border-black/10 bg-white/20 p-3 dark:border-white/10 dark:bg-white/10">
                                                            <Icon size={20} className="stroke-[2.5]" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </KidCard>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.06 }}
                >
                    <KidCard
                        accentColor="blue"
                        animate={false}
                        noPadding
                        className={['overflow-hidden', playAreaClassName].filter(Boolean).join(' ')}
                    >
                        <div className="relative">
                            <div className="absolute inset-0 bg-[radial-gradient(rgba(30,64,175,0.08)_1.5px,transparent_1.5px)] [background-size:20px_20px] dark:bg-[radial-gradient(rgba(20,241,149,0.08)_1.5px,transparent_1.5px)]" />
                            <div ref={playAreaRef} className="relative p-3 sm:p-5 lg:p-6">
                                {children}
                            </div>
                        </div>
                    </KidCard>
                </motion.div>

                {supportArea && (
                    <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.12 }}
                    >
                        <KidCard
                            accentColor="emerald"
                            animate={false}
                            title={supportTitle}
                            subtitle={supportDescription}
                        >
                            {supportArea}
                        </KidCard>
                    </motion.div>
                )}
            </div>

            {overlay}
        </div>
    );
};

export default KidGameShell;
