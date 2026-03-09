import React from 'react';
import ArcadeFeedbackBanner from '../../Shared/ArcadeFeedbackBanner';
import PatternTaskPanel from './PatternTaskPanel';
import type { BubbleColor } from './types';

interface OruntuluTopCanvasProps {
    containerRef: React.RefObject<HTMLDivElement>;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    isPlaying: boolean;
    currentPattern: BubbleColor[];
    feedback: { type: 'success' | 'error'; msg: string } | null;
    onPointerStart: (x: number, y: number) => void;
    onPointerMove: (x: number, y: number) => void;
    onPointerEnd: () => void;
}

const OruntuluTopCanvas: React.FC<OruntuluTopCanvasProps> = ({
    containerRef,
    canvasRef,
    isPlaying,
    currentPattern,
    feedback,
    onPointerStart,
    onPointerMove,
    onPointerEnd
}) => {
    return (
        <div
            ref={containerRef}
            className="absolute inset-0 overflow-hidden touch-none"
            style={{ WebkitTapHighlightColor: 'transparent' }}
        >
            <canvas
                ref={canvasRef}
                className="block h-full w-full cursor-crosshair touch-none"
                onMouseDown={(event) => {
                    if (isPlaying) {
                        onPointerStart(event.clientX, event.clientY);
                    }
                }}
                onMouseMove={(event) => onPointerMove(event.clientX, event.clientY)}
                onMouseUp={onPointerEnd}
                onTouchStart={(event) => {
                    if (isPlaying) {
                        onPointerStart(event.touches[0].clientX, event.touches[0].clientY);
                    }
                }}
                onTouchMove={(event) => onPointerMove(event.touches[0].clientX, event.touches[0].clientY)}
                onTouchEnd={onPointerEnd}
            />

            <ArcadeFeedbackBanner message={feedback?.msg ?? null} type={feedback?.type} />

            {isPlaying && (
                <>
                    <PatternTaskPanel currentPattern={currentPattern} />

                    <div className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-xl border-2 border-black/10 bg-white/80 px-4 py-2 text-center text-[10px] font-black uppercase tracking-widest text-black shadow-neo-sm backdrop-blur pointer-events-none transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white sm:block">
                        Beyaz topu örüntüye uygun renkteki bir balona fırlat!
                    </div>
                </>
            )}
        </div>
    );
};

export default OruntuluTopCanvas;
