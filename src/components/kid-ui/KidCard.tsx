import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

// ═══════════════════════════════════════════════
// 🃏 KidCard — Çocuk Dostu Kart
// ═══════════════════════════════════════════════

type KidCardVariant = 'default' | 'game' | 'stat' | 'achievement';

interface KidCardProps {
    children: React.ReactNode;
    variant?: KidCardVariant;
    accentColor?: string;
    icon?: LucideIcon;
    title?: string;
    subtitle?: string;
    onClick?: () => void;
    className?: string;
    noPadding?: boolean;
    animate?: boolean;
}

const accentMap: Record<string, string> = {
    emerald: 'bg-cyber-emerald',
    pink: 'bg-cyber-pink',
    blue: 'bg-cyber-blue',
    purple: 'bg-cyber-purple',
    orange: 'bg-cyber-orange',
    gold: 'bg-cyber-gold',
    red: 'bg-cyber-red',
    yellow: 'bg-cyber-yellow',
};

const KidCard: React.FC<KidCardProps> = ({
    children,
    // variant reserved for future styling
    accentColor,
    icon: Icon,
    title,
    subtitle,
    onClick,
    className = '',
    noPadding = false,
    animate = true,
}) => {
    const isClickable = !!onClick;

    const baseClasses = [
        'relative bg-white dark:bg-slate-800',
        'border-3 border-black/10 dark:border-slate-700',
        'rounded-2xl overflow-hidden',
        'shadow-neo-lg',
        isClickable ? 'cursor-pointer hover:-translate-y-1 hover:shadow-neo-xl active:translate-y-1 active:shadow-neo-sm transition-all' : '',
        noPadding ? '' : 'p-6',
        className,
    ].filter(Boolean).join(' ');

    const accentBg = accentColor ? (accentMap[accentColor] || accentColor) : null;

    const content = (
        <>
            {/* Accent strip */}
            {accentBg && (
                <div className={`absolute top-0 left-0 right-0 h-2 ${accentBg}`} />
            )}

            {/* Header */}
            {(Icon || title) && (
                <div className={`flex items-center gap-3 ${accentBg ? 'mt-1' : ''} ${title ? 'mb-4' : ''}`}>
                    {Icon && (
                        <div className={`w-10 h-10 ${accentBg || 'bg-cyber-blue'} border-2 border-black/10 rounded-xl flex items-center justify-center shadow-neo-sm`}>
                            <Icon className="w-5 h-5 text-white" />
                        </div>
                    )}
                    {title && (
                        <div className="flex-1 min-w-0">
                            <h3 className="font-nunito text-lg font-black text-black dark:text-white truncate">{title}</h3>
                            {subtitle && <p className="text-black/60 dark:text-white/60 font-bold text-sm truncate">{subtitle}</p>}
                        </div>
                    )}
                </div>
            )}

            {/* Body */}
            {children}
        </>
    );

    if (animate) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className={baseClasses}
                onClick={onClick}
            >
                {content}
            </motion.div>
        );
    }

    return (
        <div className={baseClasses} onClick={onClick}>
            {content}
        </div>
    );
};

export default KidCard;
