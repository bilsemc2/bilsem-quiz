import React, { useEffect, useState } from 'react';

interface CoinTossProps {
    onComplete?: () => void;
}

export const CoinToss: React.FC<CoinTossProps> = ({ onComplete }) => {
    const [animating, setAnimating] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setAnimating(false);
            onComplete?.();
        }, 1000); // Must match CSS animation duration

        return () => clearTimeout(timer);
    }, [onComplete]);

    if (!animating) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="animate-coin-toss">
                <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 rounded-full border-4 border-yellow-200 shadow-xl flex items-center justify-center relative perspective-1000 transform-style-3d">
                    <span className="text-4xl font-bold text-yellow-100 drop-shadow-md">XP</span>
                    <div className="absolute inset-0 rounded-full border border-yellow-300 opacity-50" />
                    <div className="absolute inset-2 rounded-full border-2 border-dashed border-yellow-700/30" />
                </div>
            </div>
        </div>
    );
};
