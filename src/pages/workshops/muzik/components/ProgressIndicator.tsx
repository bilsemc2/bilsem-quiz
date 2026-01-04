import React from 'react';

interface ProgressIndicatorProps {
    currentRound: number;
    totalRounds: number;
    label?: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
    currentRound,
    totalRounds,
    label = 'İlerleme'
}) => {
    return (
        <div className="mb-10 text-center">
            <div className="flex items-center justify-between mb-3 px-2">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{label}</span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">{currentRound} / {totalRounds}</span>
            </div>

            <div className="flex gap-2 h-2 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
                {Array.from({ length: totalRounds }, (_, i) => i + 1).map(round => (
                    <div
                        key={round}
                        className={`h-full flex-1 transition-all duration-500 ${round <= currentRound
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                            : 'bg-transparent'
                            }`}
                    />
                ))}
            </div>

            <div className="flex justify-center gap-3 mt-4">
                {Array.from({ length: totalRounds }, (_, i) => i + 1).map(round => (
                    <div
                        key={round}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${round < currentRound
                            ? 'bg-emerald-500'
                            : round === currentRound
                                ? 'bg-emerald-500 ring-4 ring-emerald-500/20 scale-125'
                                : 'bg-slate-300 dark:bg-white/10'
                            }`}
                    />
                ))}
            </div>
        </div>
    );
};

export default ProgressIndicator;
