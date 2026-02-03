import React, { useCallback, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface TouchControlsProps {
    onMove: (dr: number, dc: number) => void;
}

const TouchControls: React.FC<TouchControlsProps> = ({ onMove }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const repeatIntervalRef = useRef<number | null>(null);

    // Prevent page scroll when touching controls
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const preventScroll = (e: TouchEvent) => {
            e.preventDefault();
        };

        container.addEventListener('touchmove', preventScroll, { passive: false });
        container.addEventListener('touchstart', preventScroll, { passive: false });

        return () => {
            container.removeEventListener('touchmove', preventScroll);
            container.removeEventListener('touchstart', preventScroll);
        };
    }, []);

    const handleTouchStart = useCallback((dr: number, dc: number, e: React.TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onMove(dr, dc);

        // Start repeat after holding
        repeatIntervalRef.current = window.setInterval(() => {
            onMove(dr, dc);
        }, 150);
    }, [onMove]);

    const handleTouchEnd = useCallback(() => {
        if (repeatIntervalRef.current) {
            clearInterval(repeatIntervalRef.current);
            repeatIntervalRef.current = null;
        }
    }, []);

    const buttonClass = "w-16 h-16 sm:w-20 sm:h-20 bg-white/10 rounded-2xl flex items-center justify-center active:bg-indigo-500/50 active:scale-90 transition-all border border-white/20 shadow-xl touch-none select-none";

    return (
        <div
            ref={containerRef}
            className="flex lg:hidden flex-col items-center gap-2 mt-6 touch-none select-none"
        >
            {/* Up */}
            <button
                onTouchStart={(e) => handleTouchStart(-1, 0, e)}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
                onClick={() => onMove(-1, 0)}
                className={buttonClass}
            >
                <ChevronUp className="text-indigo-400" size={32} />
            </button>

            {/* Left / Down / Right */}
            <div className="flex gap-2">
                <button
                    onTouchStart={(e) => handleTouchStart(0, -1, e)}
                    onTouchEnd={handleTouchEnd}
                    onTouchCancel={handleTouchEnd}
                    onClick={() => onMove(0, -1)}
                    className={buttonClass}
                >
                    <ChevronLeft className="text-indigo-400" size={32} />
                </button>
                <button
                    onTouchStart={(e) => handleTouchStart(1, 0, e)}
                    onTouchEnd={handleTouchEnd}
                    onTouchCancel={handleTouchEnd}
                    onClick={() => onMove(1, 0)}
                    className={buttonClass}
                >
                    <ChevronDown className="text-indigo-400" size={32} />
                </button>
                <button
                    onTouchStart={(e) => handleTouchStart(0, 1, e)}
                    onTouchEnd={handleTouchEnd}
                    onTouchCancel={handleTouchEnd}
                    onClick={() => onMove(0, 1)}
                    className={buttonClass}
                >
                    <ChevronRight className="text-indigo-400" size={32} />
                </button>
            </div>
        </div>
    );
};

export default TouchControls;
