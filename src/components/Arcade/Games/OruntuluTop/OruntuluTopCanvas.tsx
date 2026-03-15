import React from 'react';
import { KidGameFeedbackBanner } from '../../../kid-ui';
import PatternTaskPanel from './PatternTaskPanel';
import { toCanvasPoint } from './pointerUtils';
import type { BubbleColor } from './types';

interface OruntuluTopCanvasProps {
    containerRef: React.RefObject<HTMLDivElement>;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    isPlaying: boolean;
    currentPattern: BubbleColor[];
    feedback: { type: 'success' | 'error'; msg: string } | null;
    hintMessage: string;
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
    hintMessage,
    onPointerStart,
    onPointerMove,
    onPointerEnd
}) => {
    const getCanvasPoint = (target: HTMLCanvasElement, clientX: number, clientY: number) =>
        toCanvasPoint(clientX, clientY, target.getBoundingClientRect());

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
                        const point = getCanvasPoint(event.currentTarget, event.clientX, event.clientY);
                        onPointerStart(point.x, point.y);
                    }
                }}
                onMouseMove={(event) => {
                    const point = getCanvasPoint(event.currentTarget, event.clientX, event.clientY);
                    onPointerMove(point.x, point.y);
                }}
                onMouseUp={onPointerEnd}
                onTouchStart={(event) => {
                    if (isPlaying) {
                        const point = getCanvasPoint(
                            event.currentTarget,
                            event.touches[0].clientX,
                            event.touches[0].clientY,
                        );
                        onPointerStart(point.x, point.y);
                    }
                }}
                onTouchMove={(event) => {
                    const point = getCanvasPoint(
                        event.currentTarget,
                        event.touches[0].clientX,
                        event.touches[0].clientY,
                    );
                    onPointerMove(point.x, point.y);
                }}
                onTouchEnd={onPointerEnd}
            />

            <KidGameFeedbackBanner message={feedback?.msg ?? null} type={feedback?.type} />

            {isPlaying && (
                <>
                    <PatternTaskPanel currentPattern={currentPattern} />

                    <div className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-xl border-2 border-black/10 bg-white/80 px-4 py-2 text-center text-[10px] font-black uppercase tracking-widest text-black shadow-neo-sm backdrop-blur pointer-events-none transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white sm:block">
                        {hintMessage}
                    </div>
                </>
            )}
        </div>
    );
};

export default OruntuluTopCanvas;
