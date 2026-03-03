import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface GameHUDProps {
    energy: number;
    timeLeft: number;
    level: number;
    score: number;
    lastCollectionTime: number;
}

const GameHUD: React.FC<GameHUDProps> = ({ energy, timeLeft, level, score, lastCollectionTime }) => {
    return (
        <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-4 sm:p-6 rounded-[2rem] border-2 border-black/10 mb-8 shadow-neo-sm rotate-1 gap-4">
            <Link to="/bilsem-zeka" className="flex items-center gap-2 text-black font-black hover:opacity-70 transition-opacity uppercase tracking-widest bg-slate-100 px-4 py-2 rounded-xl border-2 border-black/10 shadow-neo-sm -rotate-2">
                <ChevronLeft size={24} strokeWidth={3} /> Bilsem Zeka
            </Link>

            <div className="flex flex-wrap justify-center sm:justify-end items-center gap-3 sm:gap-6 w-full sm:w-auto">
                {/* Energy */}
                <div className="flex flex-col items-center bg-emerald-100 px-4 py-2 rounded-xl border-2 border-black/10 shadow-neo-sm rotate-1">
                    <span className="text-[10px] sm:text-xs uppercase tracking-widest text-black font-black mb-1">ENERJİ</span>
                    <div className="w-20 sm:w-24 h-4 bg-white rounded-full overflow-hidden border-2 border-black/10 relative">
                        <motion.div
                            className={`h-full border-r-2 border-black/10 ${energy < 20 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-400'}`}
                            animate={{
                                width: `${energy}%`,
                                backgroundColor: Date.now() - lastCollectionTime < 500 ? '#4ade80' : undefined,
                            }}
                        />
                    </div>
                </div>

                {/* Time */}
                <div className="flex flex-col items-center bg-rose-100 px-4 py-2 rounded-xl border-2 border-black/10 shadow-neo-sm -rotate-1 min-w-[80px]">
                    <span className="text-[10px] sm:text-xs uppercase tracking-widest text-black font-black">SÜRE</span>
                    <div className={`text-xl sm:text-2xl font-black ${timeLeft < 10 ? 'text-rose-600 animate-pulse' : 'text-black'}`}>{timeLeft}s</div>
                </div>

                {/* Level */}
                <div className="flex flex-col items-center bg-sky-100 px-4 py-2 rounded-xl border-2 border-black/10 shadow-neo-sm rotate-2 min-w-[80px]">
                    <span className="text-[10px] sm:text-xs uppercase font-black text-black tracking-widest">SEVİYE</span>
                    <span className="font-black text-xl sm:text-2xl text-black">{level}</span>
                </div>

                {/* Score */}
                <div className="flex flex-col items-center bg-yellow-300 px-4 py-2 rounded-xl border-2 border-black/10 shadow-neo-sm min-w-[80px] -rotate-2">
                    <div className="flex items-center gap-1 text-[10px] sm:text-xs uppercase font-black text-black tracking-widest">
                        <Zap size={14} className="fill-black stroke-black" /> SKOR
                    </div>
                    <span className="font-black text-xl sm:text-2xl text-black">{score}</span>
                </div>
            </div>
        </div>
    );
};

export default GameHUD;
