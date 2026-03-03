import React from 'react';

// ═══════════════════════════════════════════════
// 👤 KidAvatar — Çocuk Dostu Avatar
// ═══════════════════════════════════════════════

type KidAvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface KidAvatarProps {
    src: string;
    alt?: string;
    size?: KidAvatarSize;
    level?: number;
    online?: boolean;
    className?: string;
}

const sizeClasses: Record<KidAvatarSize, string> = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
    xl: 'w-28 h-28',
};

const badgeSizeClasses: Record<KidAvatarSize, string> = {
    sm: 'w-5 h-5 text-[9px] -bottom-1 -right-1',
    md: 'w-6 h-6 text-[10px] -bottom-1 -right-1',
    lg: 'w-8 h-8 text-xs -bottom-2 -right-2',
    xl: 'w-10 h-10 text-sm -bottom-2 -right-2',
};

const KidAvatar: React.FC<KidAvatarProps> = ({
    src,
    alt = 'Avatar',
    size = 'md',
    level,
    online,
    className = '',
}) => {
    return (
        <div className={`relative inline-block ${className}`}>
            <img
                src={src}
                alt={alt}
                className={[
                    sizeClasses[size],
                    'rounded-2xl border-2 border-black/10 shadow-neo-md',
                    'bg-white object-cover',
                ].join(' ')}
            />

            {/* Level badge */}
            {level !== undefined && (
                <div className={[
                    'absolute flex items-center justify-center',
                    'bg-cyber-gold border-2 border-black/10 rounded-full',
                    'font-nunito font-black text-black shadow-neo-sm',
                    badgeSizeClasses[size],
                ].join(' ')}>
                    {level}
                </div>
            )}

            {/* Online indicator */}
            {online && (
                <div className={[
                    'absolute top-0 right-0',
                    'w-3 h-3 bg-cyber-emerald border-2 border-black/10 rounded-full',
                    size === 'sm' ? '-top-0.5 -right-0.5 w-2.5 h-2.5' : '',
                ].join(' ')} />
            )}
        </div>
    );
};

export default KidAvatar;
