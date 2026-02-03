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
        <div className="max-w-2xl w-full bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] p-8 md:p-12 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="text-center mb-10">
                <h2 className="text-4xl font-black mb-2 text-white italic tracking-tight uppercase">Süre Doldu!</h2>
                <div className="inline-block px-4 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-sm font-bold border border-indigo-500/30">
                    PERFORMANS ÖZETİ
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white/5 p-6 rounded-3xl border border-white/10 flex flex-col items-center">
                    <Activity className="w-6 h-6 text-indigo-400 mb-2" />
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Skor</span>
                    <span className="text-3xl font-black text-white">{stats.score}</span>
                </div>
                <div className="bg-white/5 p-6 rounded-3xl border border-white/10 flex flex-col items-center">
                    <Crosshair className="w-6 h-6 text-emerald-400 mb-2" />
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Doğruluk</span>
                    <span className="text-3xl font-black text-white">%{Math.round(stats.accuracy * 100)}</span>
                </div>
                <div className="bg-white/5 p-6 rounded-3xl border border-white/10 flex flex-col items-center">
                    <Clock className="w-6 h-6 text-amber-400 mb-2" />
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Ort. Süre</span>
                    <span className="text-3xl font-black text-white">{stats.averageTime.toFixed(2)}s</span>
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 mb-10 flex flex-col items-center justify-center text-center">
                <div
                    className="p-4 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-[40%] mb-4"
                    style={{ boxShadow: 'inset 0 -6px 12px rgba(0,0,0,0.2), inset 0 6px 12px rgba(255,255,255,0.3), 0 6px 16px rgba(0,0,0,0.3)' }}
                >
                    <Award className={`w-12 h-12 ${rank.color}`} />
                </div>
                <h3 className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs mb-1">Başarı Seviyeniz</h3>
                <p className={`text-4xl font-black tracking-tight ${rank.color}`}>{rank.title}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <button
                    onClick={onRestart}
                    className="flex-1 py-4 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                    style={{ boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)' }}
                >
                    <RotateCcw className="w-5 h-5" />
                    YENİDEN BAŞLA
                </button>
                <button
                    onClick={onMenu}
                    className="flex-1 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all border border-white/20"
                >
                    <Home className="w-5 h-5" />
                    MENÜYE DÖN
                </button>
            </div>
        </div>
    );
};

export default GameOver;
