import React from 'react';
import { LucideIcon } from 'lucide-react';

// ═══════════════════════════════════════════════
// 🏷️ KidBadge — Çocuk Dostu Rozet/Etiket
// ═══════════════════════════════════════════════

type KidBadgeVariant = 'xp' | 'level' | 'tuzo' | 'difficulty' | 'status' | 'custom';

interface KidBadgeProps {
    children: React.ReactNode;
    variant?: KidBadgeVariant;
    icon?: LucideIcon;
    color?: string;
    pulse?: boolean;
    className?: string;
}

const variantStyles: Record<KidBadgeVariant, string> = {
    xp: 'bg-cyber-gold text-black',
    level: 'bg-cyber-blue text-white',
    tuzo: 'bg-cyber-purple text-white',
    difficulty: 'bg-cyber-orange text-black',
    status: 'bg-cyber-emerald text-black',
    custom: 'bg-white text-black',
};

const KidBadge: React.FC<KidBadgeProps> = ({
    children,
    variant = 'status',
    icon: Icon,
    pulse = false,
    className = '',
}) => {
    return (
        <span
            className={[
                'inline-flex items-center gap-1.5',
                'px-3 py-1',
                'font-nunito font-extrabold text-xs uppercase tracking-wider',
                'border-2 border-black/10 rounded-xl',
                'shadow-neo-sm',
                'select-none',
                pulse ? 'animate-pulse' : '',
                variantStyles[variant],
                className,
            ].filter(Boolean).join(' ')}
        >
            {Icon && <Icon size={14} className="stroke-[2.5] flex-shrink-0" />}
            {children}
        </span>
    );
};

export default KidBadge;
