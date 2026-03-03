import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Gamepad2 } from 'lucide-react';

const QuickAccessSection: React.FC = () => (
    <Link
        to="/bilsem-zeka"
        className="group flex items-center gap-4 bg-cyber-gold border-2 border-black/10 rounded-2xl p-5 transition-all shadow-neo-md hover:-translate-y-0.5 hover:shadow-neo-lg active:translate-y-0.5 active:shadow-neo-sm focus:outline-none"
    >
        <div className="w-14 h-14 bg-red-500 border-2 border-black/20 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-neo-sm flex-shrink-0">
            <Gamepad2 className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1 min-w-0">
            <h3 className="font-nunito font-extrabold text-black text-lg tracking-tight">BİLSEM Zeka Oyunları</h3>
            <p className="font-nunito font-bold text-black/60 text-xs">Jeton at, oyununa başla!</p>
        </div>
        <div className="bg-white/30 border-2 border-black/10 rounded-xl p-2.5 group-hover:translate-x-1 transition-all flex-shrink-0">
            <ChevronRight className="w-5 h-5 text-black" />
        </div>
    </Link>
);

export default QuickAccessSection;
