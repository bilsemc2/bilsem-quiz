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
        <div className="max-w-2xl w-full bg-white dark:bg-slate-800 rounded-[3rem] p-8 md:p-12 shadow-neo-sm dark:shadow-[16px_16px_0_#0f172a] border-2 border-black/10 dark:border-slate-700 animate-in fade-in slide-in-from-bottom-8 duration-500 transform rotate-1 transition-colors duration-300">
            <div className="text-center mb-10">
                <h2 className="text-5xl sm:text-6xl font-black mb-4 text-black dark:text-white italic tracking-tighter uppercase drop-shadow-[4px_4px_0_#fff] dark:drop-shadow-neo-sm transition-colors duration-300">Süre Doldu!</h2>
                <div className="inline-block px-4 py-2 bg-indigo-200 dark:bg-slate-700 text-black dark:text-white border-2 border-black/10 dark:border-slate-800 shadow-neo-sm rounded-xl text-sm font-black tracking-widest uppercase -rotate-2 transition-colors duration-300">
                    PERFORMANS ÖZETİ
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-amber-100 dark:bg-slate-700 p-6 rounded-3xl border-2 border-black/10 dark:border-slate-800 shadow-neo-sm flex flex-col items-center rotate-2 transition-colors duration-300">
                    <Activity className="w-8 h-8 text-black dark:text-white mb-2 transition-colors duration-300" strokeWidth={3} />
                    <span className="text-xs text-black dark:text-white font-black uppercase tracking-widest mb-1 transition-colors duration-300">Skor</span>
                    <span className="text-4xl font-black text-amber-600 dark:text-amber-400 drop-shadow-[2px_2px_0_#fff] dark:drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)] transition-colors duration-300">{stats.score}</span>
                </div>
                <div className="bg-emerald-100 dark:bg-slate-700 p-6 rounded-3xl border-2 border-black/10 dark:border-slate-800 shadow-neo-sm flex flex-col items-center -rotate-1 transition-colors duration-300">
                    <Crosshair className="w-8 h-8 text-black dark:text-white mb-2 transition-colors duration-300" strokeWidth={3} />
                    <span className="text-xs text-black dark:text-white font-black uppercase tracking-widest mb-1 transition-colors duration-300">Doğruluk</span>
                    <span className="text-4xl font-black text-emerald-600 dark:text-emerald-400 drop-shadow-[2px_2px_0_#fff] dark:drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)] transition-colors duration-300">%{Math.round(stats.accuracy * 100)}</span>
                </div>
                <div className="bg-sky-100 dark:bg-slate-700 p-6 rounded-3xl border-2 border-black/10 dark:border-slate-800 shadow-neo-sm flex flex-col items-center rotate-1 transition-colors duration-300">
                    <Clock className="w-8 h-8 text-black dark:text-white mb-2 transition-colors duration-300" strokeWidth={3} />
                    <span className="text-xs text-black dark:text-white font-black uppercase tracking-widest mb-1 transition-colors duration-300">Ort. Süre</span>
                    <span className="text-4xl font-black text-sky-600 dark:text-sky-400 drop-shadow-[2px_2px_0_#fff] dark:drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)] transition-colors duration-300">{stats.averageTime.toFixed(2)}s</span>
                </div>
            </div>

            <div className="bg-rose-100 dark:bg-slate-700 border-2 border-black/10 dark:border-slate-800 rounded-3xl p-8 mb-10 flex flex-col items-center justify-center text-center shadow-neo-sm -rotate-1 transition-colors duration-300">
                <div className="p-4 bg-white dark:bg-slate-800 border-2 border-black/10 dark:border-slate-700 rounded-3xl shadow-neo-sm mb-4 rotate-3 transition-colors duration-300">
                    <Award className="w-12 h-12 text-black dark:text-white transition-colors duration-300" strokeWidth={3} />
                </div>
                <h3 className="text-black dark:text-white font-black uppercase tracking-[0.2em] text-sm mb-2 bg-white dark:bg-slate-800 px-3 py-1 rounded-lg border-2 border-black/10 dark:border-slate-700 inline-block -rotate-2 transition-colors duration-300">Başarı Seviyeniz</h3>
                <p className={`text-4xl sm:text-5xl font-black tracking-tighter uppercase drop-shadow-[2px_2px_0_#fff] dark:drop-shadow-[2px_2px_0_rgba(0,0,0,0.8)] transition-colors duration-300 ${rank.color === 'text-slate-400' ? 'text-slate-600 dark:text-slate-300' : rank.color.replace('400', '600') + ' dark:' + rank.color}`}>{rank.title}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                    onClick={onRestart}
                    className="flex-1 py-5 bg-emerald-400 text-black border-2 border-black/10 dark:border-slate-800 rounded-2xl font-black text-xl flex items-center justify-center gap-3 shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-sm active:translate-y-2 active:shadow-none transition-all uppercase tracking-widest"
                >
                    <RotateCcw className="w-6 h-6" strokeWidth={3} />
                    YENİDEN BAŞLA
                </button>
                <button
                    onClick={onMenu}
                    className="flex-1 py-5 bg-slate-200 dark:bg-slate-700 text-black dark:text-white border-2 border-black/10 dark:border-slate-800 rounded-2xl font-black text-xl flex items-center justify-center gap-3 shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-sm active:translate-y-2 active:shadow-none transition-all uppercase tracking-widest"
                >
                    <Home className="w-6 h-6" strokeWidth={3} />
                    MENÜYE DÖN
                </button>
            </div>
        </div>
    );
};

export default GameOver;
