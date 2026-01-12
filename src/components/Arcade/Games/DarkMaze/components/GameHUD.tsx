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
        <div className="flex items-center justify-between bg-white/5 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/10 mb-8 shadow-2xl">
            <Link to="/arcade" className="flex items-center gap-2 text-indigo-400 font-bold hover:text-white transition-colors">
                <ChevronLeft size={20} /> ARCADE
            </Link>

            <div className="flex items-center gap-8">
                <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase tracking-widest text-slate-500 font-black">ENERJİ</span>
                    <div className="w-24 h-2 bg-slate-800 rounded-full mt-2 overflow-hidden border border-white/10 relative">
                        <motion.div
                            className={`h-full ${energy < 20 ? 'bg-rose-500 animate-pulse' : 'bg-green-500'}`}
                            animate={{
                                width: `${energy}%`,
                                backgroundColor: Date.now() - lastCollectionTime < 500 ? '#4ade80' : undefined,
                                scaleY: Date.now() - lastCollectionTime < 300 ? 1.5 : 1
                            }}
                        />
                    </div>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase tracking-widest text-slate-500 font-black">SÜRE</span>
                    <div className={`text-2xl font-black ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{timeLeft}s</div>
                </div>
                <div className="flex items-center gap-2 bg-indigo-500/20 px-4 py-2 rounded-2xl border border-indigo-500/30">
                    <span className="text-[10px] uppercase font-black text-indigo-400">SEVİYE</span>
                    <span className="font-black text-xl">{level}</span>
                </div>
                <div className="flex items-center gap-2 bg-emerald-500/20 px-4 py-2 rounded-2xl border border-emerald-500/30">
                    <Zap size={16} className="text-emerald-400" />
                    <span className="font-black text-xl">{score}</span>
                </div>
            </div>
        </div>
    );
};

export default GameHUD;
