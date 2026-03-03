import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

// ═══════════════════════════════════════════════
// 🔘 KidIconButton — Sadece İkon Buton
// ═══════════════════════════════════════════════

type KidIconButtonSize = 'sm' | 'md' | 'lg';
type KidIconButtonVariant = 'default' | 'ghost' | 'danger';

interface KidIconButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
    icon: LucideIcon;
    size?: KidIconButtonSize;
    variant?: KidIconButtonVariant;
    label: string; // WCAG: aria-label zorunlu
}

const sizeClasses: Record<KidIconButtonSize, { button: string; icon: number }> = {
    sm: { button: 'w-9 h-9', icon: 16 },
    md: { button: 'w-11 h-11', icon: 20 },
    lg: { button: 'w-14 h-14', icon: 24 },
};

const variantClasses: Record<KidIconButtonVariant, string> = {
    default: 'bg-white dark:bg-slate-700 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-slate-600',
    ghost: 'bg-transparent text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/10 border-transparent shadow-none',
    danger: 'bg-cyber-pink text-white hover:brightness-110',
};

const KidIconButton: React.FC<KidIconButtonProps> = ({
    icon: Icon,
    size = 'md',
    variant = 'default',
    label,
    className = '',
    disabled,
    ...motionProps
}) => {
    const { button: btnSize, icon: iconSize } = sizeClasses[size];

    return (
        <motion.button
            whileHover={disabled ? undefined : { scale: 1.1 }}
            whileTap={disabled ? undefined : { scale: 0.9 }}
            aria-label={label}
            className={[
                'inline-flex items-center justify-center',
                'border-2 border-black/10 dark:border-slate-500 rounded-xl',
                'shadow-neo-sm',
                'transition-all duration-200',
                'focus:outline-none focus-visible:ring-4 focus-visible:ring-cyber-yellow/50',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'cursor-pointer select-none',
                btnSize,
                variantClasses[variant],
                className,
            ].filter(Boolean).join(' ')}
            disabled={disabled}
            {...motionProps}
        >
            <Icon size={iconSize} className="stroke-[2.5]" />
        </motion.button>
    );
};

export default KidIconButton;
