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
        <div className="bg-white dark:bg-slate-800 px-6 py-3 border-2 border-black/10 dark:border-white/10 rounded-xl shadow-neo-xs inline-flex items-center gap-3">
            <span className="text-2xl font-nunito font-extrabold text-black dark:text-white">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
            <span className="text-[10px] text-cyber-pink font-black uppercase tracking-widest bg-cyber-pink/10 px-2 py-1 rounded-md relative -top-1">Kaldı</span>
        </div>
    );
};
