import React from 'react';
import { BalloonColor } from '../types';

interface BalloonProps {
    color: BalloonColor;
    isPopped: boolean;
    isVisible: boolean;
    onClick?: () => void;
    displayLabel?: number;
    highlighted?: boolean;
}

const Balloon: React.FC<BalloonProps> = ({
    color,
    isPopped,
    isVisible,
    onClick,
    displayLabel,
    highlighted
}) => {
    if (!isVisible && !isPopped) return <div className="w-24 h-40" />;

    return (
        <div
            className={`relative flex flex-col items-center transition-all duration-300 transform ${isPopped ? 'scale-150 opacity-0 pointer-events-none' : 'scale-100 opacity-100'
                } ${onClick ? 'cursor-pointer hover:scale-110 active:scale-95' : ''}`}
            onClick={onClick}
        >
            {/* Balloon Body */}
            <div
                className={`balloon-sway relative w-20 h-24 rounded-[50%_50%_50%_50%_/_60%_60%_40%_40%] shadow-lg transition-all ${highlighted ? 'ring-8 ring-yellow-400 ring-opacity-60 scale-105' : ''
                    }`}
                style={{
                    background: `radial-gradient(circle at 30% 30%, ${color.highlight}, ${color.primary} 60%, ${color.secondary})`,
                }}
            >
                {/* Shine */}
                <div className="absolute top-[15%] left-[20%] w-5 h-7 bg-white opacity-30 rounded-full blur-[1px] transform -rotate-45"></div>

                {/* Face (Eyes) */}
                <div className="absolute top-[40%] left-1/2 -translate-x-1/2 flex gap-4 opacity-40">
                    <div className="w-2 h-2 bg-black rounded-full"></div>
                    <div className="w-2 h-2 bg-black rounded-full"></div>
                </div>
                {/* Face (Smile) */}
                <div className="absolute top-[55%] left-1/2 -translate-x-1/2 w-4 h-2 border-b-2 border-black opacity-30 rounded-full"></div>

                {/* Label */}
                {displayLabel !== undefined && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-white text-3xl font-bold drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] select-none">
                            {displayLabel}
                        </span>
                    </div>
                )}
            </div>

            {/* Balloon Knot */}
            <div
                className="w-5 h-3 -mt-1 rounded-full shadow-sm"
                style={{ backgroundColor: color.secondary }}
            ></div>

            {/* String */}
            <div className="w-0.5 h-12 bg-gradient-to-b from-gray-400 to-gray-300"></div>
        </div>
    );
};

export default Balloon;
