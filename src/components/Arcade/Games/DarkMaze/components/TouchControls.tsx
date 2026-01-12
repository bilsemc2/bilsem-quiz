import React from 'react';
import { ChevronLeft } from 'lucide-react';

interface TouchControlsProps {
    onMove: (dr: number, dc: number) => void;
}

const TouchControls: React.FC<TouchControlsProps> = ({ onMove }) => {
    return (
        <div className="md:flex lg:hidden absolute -bottom-40 left-1/2 -translate-x-1/2 grid grid-cols-3 gap-3">
            <div />
            <button onClick={() => onMove(-1, 0)} className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center active:bg-indigo-500/50 active:scale-90 transition-all border border-white/10 shadow-xl">
                <ChevronLeft className="rotate-90 text-indigo-400" size={32} />
            </button>
            <div />
            <button onClick={() => onMove(0, -1)} className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center active:bg-indigo-500/50 active:scale-90 transition-all border border-white/10 shadow-xl">
                <ChevronLeft className="text-indigo-400" size={32} />
            </button>
            <button onClick={() => onMove(1, 0)} className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center active:bg-indigo-500/50 active:scale-90 transition-all border border-white/10 shadow-xl">
                <ChevronLeft className="-rotate-90 text-indigo-400" size={32} />
            </button>
            <button onClick={() => onMove(0, 1)} className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center active:bg-indigo-500/50 active:scale-90 transition-all border border-white/10 shadow-xl">
                <ChevronLeft className="rotate-180 text-indigo-400" size={32} />
            </button>
        </div>
    );
};

export default TouchControls;
