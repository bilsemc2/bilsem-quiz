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
                className={`balloon-sway relative w-20 h-24 rounded-[50%_50%_50%_50%_/_60%_60%_40%_40%] border-2 border-black/10 shadow-neo-sm transition-all ${highlighted ? 'border-yellow-400 scale-110 shadow-none -translate-y-1' : ''
                    }`}
                style={{
                    backgroundColor: highlighted ? '#FACC15' : color.primary,
                }}
            >
                {/* Shine (Hard edge for toy look) */}
                <div className="absolute top-[10%] left-[15%] w-4 h-6 bg-white/40 rounded-full transform -rotate-45"></div>

                {/* Face (Eyes) — hide when number label is shown */}
                {displayLabel === undefined && (
                    <div className="absolute top-[40%] left-1/2 -translate-x-1/2 flex gap-4 opacity-80">
                        <div className="w-2.5 h-2.5 bg-black rounded-full"></div>
                        <div className="w-2.5 h-2.5 bg-black rounded-full"></div>
                    </div>
                )}
                {/* Face (Smile) — hide when number label is shown */}
                {displayLabel === undefined && (
                    <div className="absolute top-[55%] left-1/2 -translate-x-1/2 w-4 h-2 border-b-4 border-black/10 rounded-full"></div>
                )}

                {/* Label */}
                {displayLabel !== undefined && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none mt-2">
                        <span className="text-white text-3xl font-black" style={{ WebkitTextStroke: '2px black' }}>
                            {displayLabel}
                        </span>
                    </div>
                )}
            </div>

            {/* Balloon Knot */}
            <div
                className="w-5 h-4 -mt-1.5 rounded-full border-2 border-black/10 border-t-0 shadow-neo-sm"
                style={{ backgroundColor: highlighted ? '#FACC15' : color.primary }}
            ></div>

            {/* String */}
            <div className="w-1 h-12 bg-black ml-[4px]"></div>
        </div>
    );
};

export default Balloon;
