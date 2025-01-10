import React from 'react';

interface CircularProgressProps {
    timeLeft: number;
    totalTime: number;
    onTimeout: () => void;
    size?: number;
    strokeWidth?: number;
    className?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
    timeLeft = 0,
    totalTime = 60,
    onTimeout,
    size = 40,
    strokeWidth = 4,
    className = ''
}) => {
    // Geçerli değerler kontrolü
    const validTimeLeft = Math.max(0, Math.min(timeLeft, totalTime));
    const validTotalTime = Math.max(1, totalTime); // 0'a bölmeyi önlemek için minimum 1
    
    const radius = Math.max(0, (size - strokeWidth) / 2);
    const circumference = radius * 2 * Math.PI;
    const progress = (validTimeLeft / validTotalTime) * 100;
    const offset = Number.isFinite(circumference) ? circumference - (progress / 100) * circumference : 0;

    // Renk değişimi için sınıflar
    const getColorClass = () => {
        if (validTimeLeft <= 5) return 'text-red-500';
        if (validTimeLeft <= 15) return 'text-yellow-500';
        return 'text-blue-500';
    };

    // Zamanı formatla
    const formatTime = (seconds: number) => {
        const validSeconds = Math.max(0, Math.round(seconds));
        const minutes = Math.floor(validSeconds / 60);
        const remainingSeconds = validSeconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // Geçersiz boyut kontrolü
    if (size <= 0 || strokeWidth <= 0 || size <= strokeWidth) {
        return null;
    }

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg
                className={`transform -rotate-90 ${className}`}
                style={{ width: size, height: size }}
            >
                {/* Arka plan dairesi */}
                <circle
                    className="text-gray-200"
                    strokeWidth={strokeWidth}
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                {/* İlerleme dairesi */}
                <circle
                    className={`transition-all duration-300 ${getColorClass()}`}
                    strokeWidth={strokeWidth}
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                    style={{
                        strokeDasharray: circumference,
                        strokeDashoffset: offset,
                        transition: 'stroke-dashoffset 0.3s ease'
                    }}
                />
            </svg>
            <span className={`absolute font-medium text-sm ${getColorClass()}`}>
                {formatTime(validTimeLeft)}
            </span>
        </div>
    );
};
