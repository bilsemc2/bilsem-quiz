import React from 'react';
import { PerformanceStats } from '../types';
import { RotateCcw, Home, Activity, Clock, Crosshair, Award } from 'lucide-react';

interface GameOverProps {
    stats: PerformanceStats;
    onRestart: () => void;
    onMenu: () => void;
}

const GameOver: React.FC<GameOverProps> = ({ stats, onRestart, onMenu }) => {
    const getRank = (score: number) => {
        if (score > 600) return { title: "Zihin Ustası", color: "text-purple-400" };
        if (score > 400) return { title: "Odaklanma Uzmanı", color: "text-blue-400" };
        if (score > 200) return { title: "Hızlı Düşünür", color: "text-emerald-400" };
        return { title: "Çaylak", color: "text-slate-400" };
    };

    const rank = getRank(stats.score);

    return (
        <div className="max-w-2xl w-full bg-slate-900/80 backdrop-blur-2xl border border-slate-800 rounded-[2.5rem] p-8 md:p-12 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="text-center mb-10">
                <h2 className="text-4xl font-black mb-2 text-white italic tracking-tight uppercase">Süre Doldu!</h2>
                <div className="inline-block px-4 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-sm font-bold border border-indigo-500/20">
                    PERFORMANS ÖZETİ
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700 flex flex-col items-center group hover:border-indigo-500/50 transition-colors">
                    <Activity className="w-6 h-6 text-indigo-400 mb-2" />
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Skor</span>
                    <span className="text-3xl font-black text-white">{stats.score}</span>
                </div>
                <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700 flex flex-col items-center group hover:border-emerald-500/50 transition-colors">
                    <Crosshair className="w-6 h-6 text-emerald-400 mb-2" />
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Doğruluk</span>
                    <span className="text-3xl font-black text-white">%{Math.round(stats.accuracy * 100)}</span>
                </div>
                <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700 flex flex-col items-center group hover:border-yellow-500/50 transition-colors">
                    <Clock className="w-6 h-6 text-yellow-400 mb-2" />
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Ort. Süre</span>
                    <span className="text-3xl font-black text-white">{stats.averageTime.toFixed(2)}s</span>
                </div>
            </div>

            <div className="bg-slate-800/30 border border-slate-700/50 rounded-3xl p-8 mb-10 flex flex-col items-center justify-center text-center">
                <div className="p-4 bg-indigo-500/10 rounded-full mb-4">
                    <Award className={`w-12 h-12 ${rank.color}`} />
                </div>
                <h3 className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs mb-1">Başarı Seviyeniz</h3>
                <p className={`text-4xl font-black tracking-tight ${rank.color}`}>{rank.title}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <button
                    onClick={onRestart}
                    className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-indigo-600/20"
                >
                    <RotateCcw className="w-5 h-5" />
                    YENİDEN BAŞLA
                </button>
                <button
                    onClick={onMenu}
                    className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 border border-slate-700"
                >
                    <Home className="w-5 h-5" />
                    MENÜYE DÖN
                </button>
            </div>
        </div>
    );
};

export default GameOver;
