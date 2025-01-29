import React from 'react';

interface CircularProgressProps {
    timeLeft: number;
    totalTime: number;
    progress: number;
}

export default function CircularProgress({
    timeLeft,
    totalTime,
    progress
}: CircularProgressProps) {
    const radius = 20;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative inline-flex">
            <svg className="w-16 h-16" viewBox="0 0 48 48">
                {/* Arka plan dairesi */}
                <circle
                    className="text-gray-200"
                    strokeWidth="4"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="24"
                    cy="24"
                />
                {/* İlerleme dairesi */}
                <circle
                    className={`
                        transform -rotate-90 origin-center
                        transition-all duration-300
                        ${timeLeft <= 10 ? 'text-red-500' : 'text-blue-500'}
                    `}
                    strokeWidth="4"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="24"
                    cy="24"
                />
            </svg>
            <span className={`
                absolute inset-0 flex items-center justify-center
                text-lg font-semibold
                ${timeLeft <= 10 ? 'text-red-500' : 'text-gray-700'}
            `}>
                {timeLeft}
            </span>
        </div>
    );
}
