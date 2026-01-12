import React from 'react';
import { Play, Info, Navigation2, ArrowDownUp } from 'lucide-react';

interface MenuProps {
    onStart: () => void;
    highScore: number;
}

const Menu: React.FC<MenuProps> = ({ onStart, highScore }) => {
    return (
        <div className="max-w-md w-full bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="text-center mb-10">
                <div className="flex justify-center mb-4 gap-3">
                    <div className="p-4 bg-indigo-500/20 rounded-2xl border border-indigo-500/20">
                        <Navigation2 className="w-10 h-10 text-indigo-400 rotate-45" />
                    </div>
                    <div className="p-4 bg-red-500/20 rounded-2xl border border-red-500/20">
                        <ArrowDownUp className="w-10 h-10 text-red-400" />
                    </div>
                </div>
                <h2 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Ters Navigator
                </h2>
                <p className="text-slate-400">Beynini şaşırt, ters oklara hükmet!</p>
            </div>

            <div className="space-y-4">
                <button
                    onClick={onStart}
                    className="w-full py-5 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-indigo-600/20"
                >
                    <Play className="fill-current" />
                    MEYDAN OKU
                </button>

                <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 text-center">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">En İyi Skor</p>
                    <p className="text-2xl font-black text-yellow-500">{highScore}</p>
                </div>
            </div>

            <div className="mt-8 bg-red-500/5 p-6 rounded-2xl border border-red-500/20">
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-red-400 mt-1 shrink-0" />
                    <div className="text-sm text-slate-300 leading-relaxed">
                        <p className="mb-2 font-bold text-red-400">KRİTİK KURAL:</p>
                        <p>Ekranda <span className="text-white font-bold italic">YUKARI</span> yazıyorsa, gitmek için <span className="text-white font-bold underline">AŞAĞI</span> okuna basmalısın! Tüm oklar ters yöne çalışır.</p>
                        <p className="mt-2 opacity-70">Hedefe ulaşmak için beynindeki okuma refleksiyle savaş!</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Menu;
