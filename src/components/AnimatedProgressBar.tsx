import React, { useEffect, useState } from 'react';

interface AnimatedProgressBarProps {
    progress: number;
    color?: string;
    service?: {
        name: string;
        icon: string;
        isUnlocked: boolean;
        benefits: string[];
        requiredLevel: number;
        requiredProgress: number;
    };
    stats?: {
        level: number;
        experience: number;
    };
    onClick?: () => void;
}

export const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({
    progress,
    color = 'bg-blue-500',
    service,
    stats,
    onClick
}) => {
    const [currentProgress, setCurrentProgress] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setCurrentProgress(progress);
        }, 200);

        return () => clearTimeout(timer);
    }, [progress]);

    // Simple progress bar for level progress
    if (!service) {
        return (
            <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                    className={`${color} h-2.5 rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(100, Math.max(0, currentProgress))}%` }}
                />
            </div>
        );
    }

    // Service progress bar with circular animation
    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = circumference - (currentProgress / 100) * circumference;
    const gradientId = `gradient-${service.name.replace(/\s+/g, '-').toLowerCase()}`;

    return (
        <div
            className="relative group cursor-pointer transition-transform duration-300 hover:scale-105"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onClick}
        >
            <div className={`w-24 h-24 relative ${!service.isUnlocked ? 'opacity-70' : ''}`}>
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Gradient definition */}
                    <defs>
                        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#818CF8" />
                            <stop offset="100%" stopColor="#6366F1" />
                        </linearGradient>
                    </defs>

                    {/* Background circle */}
                    <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#E5E7EB"
                        strokeWidth="8"
                    />

                    {/* Progress circle with gradient and animation */}
                    <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke={`url(#${gradientId})`}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-1000 ease-out"
                        style={{
                            filter: 'drop-shadow(0 0 6px rgba(99, 102, 241, 0.4))'
                        }}
                    />

                    {/* Animated dots on the progress line */}
                    {service.isUnlocked && Array.from({ length: 3 }).map((_, i) => {
                        const angle = (currentProgress / 100) * 360 - (i * 20);
                        const radian = (angle - 90) * (Math.PI / 180);
                        const x = 50 + 45 * Math.cos(radian);
                        const y = 50 + 45 * Math.sin(radian);

                        return (
                            <circle
                                key={i}
                                cx={x}
                                cy={y}
                                r="2"
                                fill="#FFFFFF"
                                className="animate-pulse"
                                style={{
                                    animationDelay: `${i * 200}ms`,
                                    filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.8))'
                                }}
                            />
                        );
                    })}
                </svg>

                {/* Service icon in the center */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl transform transition-transform duration-300 hover:scale-110">
                        {service.icon}
                    </span>
                </div>
            </div>

            {/* Hover card with benefits */}
            <div
                className={`absolute right-0 bottom-full mb-2 transform bg-gradient-to-br from-indigo-50 to-white p-3 rounded-lg shadow-lg 
                    transition-all duration-500 ease-in-out w-56 z-10 border-l-4 border-indigo-500 origin-bottom text-sm
                    ${isHovered
                        ? 'opacity-100 scale-100 translate-y-0 visible'
                        : 'opacity-0 scale-95 translate-y-4 invisible'
                    }
                `}
            >
                <h4 className="font-medium text-indigo-700 mb-1.5">
                    {service.name}
                </h4>

                {!service.isUnlocked ? (
                    <div className="text-gray-600">
                        <div className="flex items-center gap-1 mb-1">
                            <span className="text-amber-500">⭐️</span>
                            <span className={`${(stats?.level ?? 0) >= service.requiredLevel ? 'text-emerald-500' : ''}`}>
                                Seviye {service.requiredLevel}
                            </span>
                            <span className="mx-1">•</span>
                            <span className={`${(stats?.experience ?? 0) >= service.requiredProgress ? 'text-emerald-500' : ''}`}>
                                {service.requiredProgress.toLocaleString()} XP
                            </span>
                        </div>
                        <div className="mt-2 text-sm text-gray-500">
                            Bu seviyeye ulaştığınızda {service.icon} kazanacaksınız!
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-1.5 text-emerald-600 mb-2">
                            <span>🎉</span>
                            <span>Tebrikler! Bu seviyeye ulaştınız!</span>
                        </div>
                        <ul className="text-gray-600 text-sm space-y-1">
                            {service.benefits.map((benefit, index) => (
                                <li key={index} className="flex items-start gap-1">
                                    <span className="text-emerald-500 mt-1">•</span>
                                    <span>{benefit}</span>
                                </li>
                            ))}
                        </ul>
                    </>
                )}

                <div className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-indigo-500 rotate-45 transition-all duration-300
                    ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}
                ></div>
            </div>
        </div>
    );
};
