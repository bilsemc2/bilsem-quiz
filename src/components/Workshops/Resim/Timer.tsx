import React, { useState, useEffect } from 'react';

interface TimerProps {
    durationSeconds: number;
    onTimeUp: () => void;
}

export const Timer: React.FC<TimerProps> = ({ durationSeconds, onTimeUp }) => {
    const [timeLeft, setTimeLeft] = useState(durationSeconds);

    useEffect(() => {
        if (timeLeft <= 0) {
            onTimeUp();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, onTimeUp]);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
        <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/20 shadow-lg inline-flex items-center space-x-2 animate-pulse">
            <span className="text-2xl font-black text-white">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Kaldı</span>
        </div>
    );
};
