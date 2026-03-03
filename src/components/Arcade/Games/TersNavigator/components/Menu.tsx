import React from 'react';
import { Play, Info, Navigation2, ArrowDownUp } from 'lucide-react';

interface MenuProps {
    onStart: () => void;
    highScore: number;
}

const Menu: React.FC<MenuProps> = ({ onStart, highScore }) => {
    return (
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-[3rem] p-8 sm:p-10 text-center border-2 border-black/10 dark:border-slate-700 shadow-neo-sm dark:shadow-[16px_16px_0_#0f172a] rotate-1 transition-colors duration-300">
            <div className="text-center mb-8">
                <div className="flex justify-center mb-6 gap-3">
                    <div className="p-4 bg-indigo-400 border-2 border-black/10 dark:border-slate-800 rounded-3xl shadow-neo-sm -rotate-3 transition-colors duration-300">
                        <Navigation2 className="w-10 h-10 text-black" strokeWidth={3} />
                    </div>
                    <div className="p-4 bg-rose-400 border-2 border-black/10 dark:border-slate-800 rounded-3xl shadow-neo-sm rotate-3 transition-colors duration-300">
                        <ArrowDownUp className="w-10 h-10 text-black" strokeWidth={3} />
                    </div>
                </div>
                <h2 className="text-4xl sm:text-5xl font-black mb-4 text-black dark:text-white uppercase tracking-tighter drop-shadow-[4px_4px_0_#fff] dark:drop-shadow-neo-sm transition-colors duration-300">
                    Ters Navigator
                </h2>
                <p className="text-black dark:text-white font-black bg-amber-100 dark:bg-slate-700 p-4 rounded-xl border-2 border-black/10 dark:border-slate-700 shadow-neo-sm -rotate-1 text-sm sm:text-base transition-colors duration-300">Beynini şaşırt, ters oklara hükmet!</p>
            </div>

            <div className="space-y-4">
                <button
                    onClick={onStart}
                    className="w-full py-5 px-6 bg-yellow-400 text-black border-2 border-black/10 dark:border-slate-800 rounded-2xl font-black text-2xl uppercase tracking-widest flex items-center justify-center gap-3 shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-sm active:translate-y-2 active:shadow-none transition-all"
                >
                    <Play className="fill-black stroke-black stroke-[3px]" size={28} />
                    MEYDAN OKU
                </button>

                <div className="bg-sky-100 dark:bg-slate-700 p-4 rounded-2xl border-2 border-black/10 dark:border-slate-800 text-center shadow-neo-sm rotate-1 transition-colors duration-300">
                    <p className="text-xs text-black dark:text-white font-black uppercase tracking-widest mb-1 transition-colors duration-300">En İyi Skor</p>
                    <p className="text-3xl font-black text-amber-500 tabular-nums drop-shadow-neo-sm">{highScore}</p>
                </div>

                <div className="bg-indigo-100 dark:bg-slate-700 border-2 border-black/10 dark:border-slate-800 shadow-neo-sm text-indigo-800 dark:text-indigo-400 text-xs px-4 py-2 rounded-xl text-center font-black -rotate-1 inline-block transition-colors duration-300">
                    TUZÖ 6.1.1 Ters Yönelim / Ketleyici Kontrol
                </div>
            </div>

            <div className="mt-8 bg-rose-200 dark:bg-slate-700 p-6 rounded-2xl border-2 border-black/10 dark:border-slate-800 shadow-neo-sm rotate-2 transition-colors duration-300">
                <div className="flex flex-col items-center gap-3">
                    <div className="bg-white dark:bg-slate-600 p-2 rounded-xl border-2 border-black/10 dark:border-slate-800 shadow-neo-sm -rotate-3 transition-colors duration-300">
                        <Info className="w-6 h-6 text-black dark:text-white transition-colors duration-300" strokeWidth={3} />
                    </div>
                    <div className="text-sm font-black text-black dark:text-white leading-relaxed transition-colors duration-300">
                        <p className="mb-2 uppercase tracking-widest bg-white dark:bg-slate-800 px-2 py-1 rounded inline-block border-2 border-black/10 dark:border-slate-700 rotate-1 transition-colors duration-300">KRİTİK KURAL:</p>
                        <p>Ekranda <span className="text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border-2 border-black/10 dark:border-slate-700 shadow-neo-sm -rotate-2 inline-block transition-colors duration-300">YUKARI</span> yazıyorsa, gitmek için <span className="text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border-2 border-black/10 dark:border-slate-700 shadow-neo-sm rotate-1 inline-block transition-colors duration-300">AŞAĞI</span> okuna basmalısın! Tüm oklar ters yöne çalışır.</p>
                        <p className="mt-4 opacity-80 bg-white/50 dark:bg-slate-800/50 p-2 rounded-lg border-2 border-black/20 dark:border-white/10 transition-colors duration-300">Hedefe ulaşmak için beynindeki okuma refleksiyle savaş!</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Menu;
