import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

// ═══════════════════════════════════════════════
// 🎮 KidButton — Çocuk Dostu Buton
// ═══════════════════════════════════════════════

type KidButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
type KidButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface KidButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
    children: React.ReactNode;
    variant?: KidButtonVariant;
    size?: KidButtonSize;
    icon?: LucideIcon;
    iconRight?: LucideIcon;
    fullWidth?: boolean;
    loading?: boolean;
}

const variantClasses: Record<KidButtonVariant, string> = {
    primary: 'bg-cyber-emerald text-black hover:brightness-110',
    secondary: 'bg-cyber-blue text-white hover:brightness-110',
    success: 'bg-cyber-gold text-black hover:brightness-110',
    danger: 'bg-cyber-pink text-white hover:brightness-110',
    ghost: 'bg-transparent text-black dark:text-white border-dashed hover:bg-black/5 dark:hover:bg-white/5',
};

const sizeClasses: Record<KidButtonSize, string> = {
    sm: 'h-9 px-4 text-sm gap-1.5',
    md: 'h-11 px-5 text-base gap-2',
    lg: 'h-[52px] px-7 text-lg gap-2.5',
    xl: 'h-[60px] px-9 text-xl gap-3',
};

const iconSizes: Record<KidButtonSize, number> = {
    sm: 16,
    md: 20,
    lg: 22,
    xl: 26,
};

const KidButton: React.FC<KidButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    icon: IconLeft,
    iconRight: IconRight,
    fullWidth = false,
    loading = false,
    className = '',
    disabled,
    ...motionProps
}) => {
    const isDisabled = disabled || loading;

    return (
        <motion.button
            whileHover={isDisabled ? undefined : { scale: 1.03, y: -2 }}
            whileTap={isDisabled ? undefined : { scale: 0.97, y: 2 }}
            className={[
                'inline-flex items-center justify-center',
                'font-nunito font-extrabold uppercase tracking-wider',
                'border-2 border-black/10 rounded-2xl',
                'shadow-neo-lg',
                'hover:-translate-y-0.5 hover:shadow-neo-xl',
                'active:translate-y-1 active:translate-x-[2px] active:shadow-none',
                'transition-all duration-200',
                'focus:outline-none focus-visible:ring-4 focus-visible:ring-cyber-yellow/50',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-neo-lg',
                'select-none cursor-pointer',
                variantClasses[variant],
                sizeClasses[size],
                fullWidth ? 'w-full' : '',
                className,
            ].filter(Boolean).join(' ')}
            disabled={isDisabled}
            {...motionProps}
        >
            {loading ? (
                <div className="w-5 h-5 border-3 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
                <>
                    {IconLeft && <IconLeft size={iconSizes[size]} className="stroke-[2.5] flex-shrink-0" />}
                    <span>{children}</span>
                    {IconRight && <IconRight size={iconSizes[size]} className="stroke-[2.5] flex-shrink-0" />}
                </>
            )}
        </motion.button>
    );
};

export default KidButton;
