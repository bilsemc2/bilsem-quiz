import React from 'react';
import { type LucideIcon } from 'lucide-react';
import KidButton from './KidButton';
import KidCard from './KidCard';

type KidGameStatusTone = 'yellow' | 'blue' | 'emerald' | 'pink' | 'orange' | 'purple';

export interface KidGameStatusOverlayAction
    extends Pick<React.ComponentProps<typeof KidButton>, 'variant' | 'icon' | 'size' | 'className'> {
    label: React.ReactNode;
    onClick: () => void;
}

export interface KidGameStatusOverlayStat {
    label: string;
    value: React.ReactNode;
    tone?: KidGameStatusTone;
}

interface KidGameStatusOverlayProps {
    tone?: KidGameStatusTone;
    icon?: LucideIcon;
    title: React.ReactNode;
    description?: React.ReactNode;
    actions?: KidGameStatusOverlayAction[];
    stats?: KidGameStatusOverlayStat[];
    children?: React.ReactNode;
    maxWidthClassName?: string;
    backdropClassName?: string;
    className?: string;
}

const toneSurfaceClasses: Record<KidGameStatusTone, string> = {
    yellow: 'bg-cyber-yellow text-black',
    blue: 'bg-cyber-blue text-white',
    emerald: 'bg-cyber-emerald text-black',
    pink: 'bg-cyber-pink text-white',
    orange: 'bg-cyber-orange text-black',
    purple: 'bg-cyber-purple text-white',
};

const statToneClasses: Record<KidGameStatusTone, string> = {
    yellow: 'bg-cyber-yellow/80 text-black',
    blue: 'bg-cyber-blue text-white',
    emerald: 'bg-cyber-emerald text-black',
    pink: 'bg-cyber-pink text-white',
    orange: 'bg-cyber-orange text-black',
    purple: 'bg-cyber-purple text-white',
};

const KidGameStatusOverlay: React.FC<KidGameStatusOverlayProps> = ({
    tone = 'yellow',
    icon: Icon,
    title,
    description,
    actions = [],
    stats = [],
    children,
    maxWidthClassName = 'max-w-xl',
    backdropClassName = 'bg-slate-950/55',
    className = '',
}) => {
    const actionGridClass =
        actions.length >= 3 ? 'sm:grid-cols-3' : actions.length === 2 ? 'sm:grid-cols-2' : '';
    const statGridClass =
        stats.length >= 3 ? 'sm:grid-cols-3' : stats.length === 2 ? 'sm:grid-cols-2' : '';

    return (
        <div className={`fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-4 sm:items-center sm:py-8 p-4 backdrop-blur-sm ${backdropClassName}`}>
            <KidCard
                accentColor={tone}
                animate={false}
                className={['w-full text-center', maxWidthClassName, className].filter(Boolean).join(' ')}
            >
                {Icon && (
                    <div className={`mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] border-2 border-black/10 shadow-neo-md ${toneSurfaceClasses[tone]}`}>
                        <Icon size={44} className="stroke-[2.5]" />
                    </div>
                )}

                <h2 className="mt-6 text-4xl font-black uppercase tracking-tight text-black dark:text-white sm:text-5xl">
                    {title}
                </h2>

                {description && (
                    <p className="mt-3 text-base font-bold leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
                        {description}
                    </p>
                )}

                {children && <div className="mt-6">{children}</div>}

                {stats.length > 0 && (
                    <div className={`mt-6 grid gap-3 ${statGridClass}`}>
                        {stats.map((stat) => (
                            <div
                                key={stat.label}
                                className={`rounded-2xl border-2 border-black/10 px-4 py-4 shadow-neo-sm ${statToneClasses[stat.tone || tone]}`}
                            >
                                <div className="text-[11px] font-black uppercase tracking-[0.2em] opacity-75">
                                    {stat.label}
                                </div>
                                <div className="mt-2 text-3xl font-black">
                                    {stat.value}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {actions.length > 0 && (
                    <div className={`mt-6 grid gap-3 ${actionGridClass}`}>
                        {actions.map((action) => (
                            <KidButton
                                key={String(action.label)}
                                type="button"
                                variant={action.variant || 'primary'}
                                size={action.size || 'lg'}
                                icon={action.icon}
                                className={action.className}
                                fullWidth
                                onClick={action.onClick}
                            >
                                {action.label}
                            </KidButton>
                        ))}
                    </div>
                )}
            </KidCard>
        </div>
    );
};

export default KidGameStatusOverlay;
