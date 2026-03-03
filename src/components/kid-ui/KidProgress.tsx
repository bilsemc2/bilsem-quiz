import React from 'react';
import { motion } from 'framer-motion';

// ═══════════════════════════════════════════════
// 📊 KidProgress — Çocuk Dostu İlerleme Göstergesi
// ═══════════════════════════════════════════════

type KidProgressVariant = 'bar' | 'ring';

interface KidProgressProps {
    value: number;          // 0-100
    variant?: KidProgressVariant;
    color?: string;
    label?: string;
    showPercent?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    animated?: boolean;
}

const colorMap: Record<string, string> = {
    emerald: 'bg-cyber-emerald',
    gold: 'bg-cyber-gold',
    blue: 'bg-cyber-blue',
    pink: 'bg-cyber-pink',
    purple: 'bg-cyber-purple',
    orange: 'bg-cyber-orange',
    red: 'bg-cyber-red',
};

const ringColorMap: Record<string, string> = {
    emerald: 'stroke-[#14F195]',
    gold: 'stroke-[#FFD700]',
    blue: 'stroke-[#1e40af]',
    pink: 'stroke-[#f43f5e]',
    purple: 'stroke-[#B026FF]',
    orange: 'stroke-[#FF9500]',
    red: 'stroke-[#FF2745]',
};

const barHeights: Record<string, string> = {
    sm: 'h-3',
    md: 'h-4',
    lg: 'h-6',
};

const ringSizes: Record<string, number> = {
    sm: 48,
    md: 72,
    lg: 96,
};

const KidProgress: React.FC<KidProgressProps> = ({
    value,
    variant = 'bar',
    color = 'emerald',
    label,
    showPercent = true,
    size = 'md',
    className = '',
    animated = true,
}) => {
    const clampedValue = Math.min(100, Math.max(0, value));

    if (variant === 'ring') {
        const ringSize = ringSizes[size];
        const strokeWidth = size === 'sm' ? 6 : size === 'md' ? 8 : 10;
        const radius = (ringSize - strokeWidth) / 2;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (clampedValue / 100) * circumference;
        const strokeColor = ringColorMap[color] || ringColorMap.emerald;

        return (
            <div className={`relative inline-flex items-center justify-center ${className}`}>
                <svg width={ringSize} height={ringSize} className="-rotate-90">
                    <circle
                        cx={ringSize / 2}
                        cy={ringSize / 2}
                        r={radius}
                        stroke="#e2e8f0"
                        strokeWidth={strokeWidth}
                        fill="none"
                    />
                    <motion.circle
                        cx={ringSize / 2}
                        cy={ringSize / 2}
                        r={radius}
                        className={strokeColor}
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={animated ? { strokeDashoffset: circumference } : { strokeDashoffset: offset }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {showPercent && (
                        <span className="font-nunito font-black text-black dark:text-white" style={{ fontSize: ringSize * 0.22 }}>
                            {Math.round(clampedValue)}%
                        </span>
                    )}
                    {label && (
                        <span className="font-nunito font-bold text-black/60 dark:text-white/60" style={{ fontSize: ringSize * 0.12 }}>
                            {label}
                        </span>
                    )}
                </div>
            </div>
        );
    }

    // Bar variant
    const bgColor = colorMap[color] || colorMap.emerald;

    return (
        <div className={`w-full ${className}`}>
            {(label || showPercent) && (
                <div className="flex justify-between items-center mb-1.5">
                    {label && <span className="font-nunito font-bold text-sm text-black dark:text-white">{label}</span>}
                    {showPercent && <span className="font-nunito font-extrabold text-sm text-black/70 dark:text-white/70">{Math.round(clampedValue)}%</span>}
                </div>
            )}
            <div className={`${barHeights[size]} bg-gray-200 dark:bg-slate-700 border-2 border-black/10 rounded-full overflow-hidden shadow-inner`}>
                <motion.div
                    className={`h-full ${bgColor} rounded-full`}
                    initial={animated ? { width: 0 } : { width: `${clampedValue}%` }}
                    animate={{ width: `${clampedValue}%` }}
                    transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                />
            </div>
        </div>
    );
};

export default KidProgress;
