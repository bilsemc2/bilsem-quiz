import React from 'react';
import { motion } from 'framer-motion';
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp
} from 'lucide-react';

import { KNOB_RADIUS } from '../constants';
import type { MoveDirection } from '../types';

interface VirtualJoystickProps {
    joystickRef: React.MutableRefObject<HTMLDivElement | null>;
    joystickPos: { x: number; y: number };
    isDragging: boolean;
    activeDirection: MoveDirection | null;
    onStart: () => void;
    onMove: (clientX: number, clientY: number) => void;
    onEnd: () => void;
}

const VirtualJoystick: React.FC<VirtualJoystickProps> = ({
    joystickRef,
    joystickPos,
    isDragging,
    activeDirection,
    onStart,
    onMove,
    onEnd
}) => {
    return (
        <div className="flex flex-col items-center gap-3 transform -rotate-1">
            <div
                ref={(node) => {
                    joystickRef.current = node;
                }}
                className="relative w-32 h-32 sm:w-40 sm:h-40 xl:w-44 xl:h-44 rounded-full bg-slate-100 border-2 border-black/10 shadow-neo-sm mt-4 xl:mt-0 touch-none cursor-pointer"
                onTouchStart={(event) => {
                    event.preventDefault();
                    onStart();
                }}
                onTouchMove={(event) => {
                    event.preventDefault();
                    const touch = event.touches[0];
                    onMove(touch.clientX, touch.clientY);
                }}
                onTouchEnd={onEnd}
                onMouseDown={onStart}
                onMouseMove={(event) => {
                    if (isDragging) {
                        onMove(event.clientX, event.clientY);
                    }
                }}
                onMouseUp={onEnd}
                onMouseLeave={onEnd}
            >
                <div className={`absolute top-2 left-1/2 -translate-x-1/2 transition-all duration-150 ${activeDirection === 'up' ? 'text-black scale-125' : 'text-slate-400'}`}>
                    <ChevronUp size={24} strokeWidth={4} />
                </div>
                <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 transition-all duration-150 ${activeDirection === 'down' ? 'text-black scale-125' : 'text-slate-400'}`}>
                    <ChevronDown size={24} strokeWidth={4} />
                </div>
                <div className={`absolute left-2 top-1/2 -translate-y-1/2 transition-all duration-150 ${activeDirection === 'left' ? 'text-black scale-125' : 'text-slate-400'}`}>
                    <ChevronLeft size={24} strokeWidth={4} />
                </div>
                <div className={`absolute right-2 top-1/2 -translate-y-1/2 transition-all duration-150 ${activeDirection === 'right' ? 'text-black scale-125' : 'text-slate-400'}`}>
                    <ChevronRight size={24} strokeWidth={4} />
                </div>

                <motion.div
                    className="absolute top-1/2 left-1/2 w-12 h-12 sm:w-14 sm:h-14 xl:w-16 xl:h-16 rounded-full bg-amber-400 border-2 border-black/10"
                    style={{
                        x: joystickPos.x - KNOB_RADIUS,
                        y: joystickPos.y - KNOB_RADIUS
                    }}
                    animate={{
                        scale: isDragging ? 0.95 : 1,
                        boxShadow: isDragging
                            ? '2px 2px 0 #000 inset'
                            : '4px 4px 0 #000'
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                />
            </div>

            <p className="text-black bg-white border-2 border-black/10 rounded-lg px-3 py-1 text-xs font-black uppercase tracking-widest text-center hidden xl:block shadow-neo-sm rotate-2">
                Fare ile surukle
                <br />
                veya klavye oklari
            </p>
        </div>
    );
};

export default VirtualJoystick;
