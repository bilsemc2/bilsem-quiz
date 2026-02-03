import React from 'react';
import { Play, Info, Navigation2, ArrowDownUp } from 'lucide-react';

interface MenuProps {
    onStart: () => void;
    highScore: number;
}

const Menu: React.FC<MenuProps> = ({ onStart, highScore }) => {
    return (
        <div className="max-w-md w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="text-center mb-10">
                <div className="flex justify-center mb-4 gap-3">
                    <div
                        className="p-4 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-[30%]"
                        style={{ boxShadow: 'inset 0 -6px 12px rgba(0,0,0,0.2), inset 0 6px 12px rgba(255,255,255,0.3), 0 6px 16px rgba(0,0,0,0.3)' }}
                    >
                        <Navigation2 className="w-10 h-10 text-white rotate-45" />
                    </div>
                    <div
                        className="p-4 bg-gradient-to-br from-rose-500 to-pink-600 rounded-[30%]"
                        style={{ boxShadow: 'inset 0 -6px 12px rgba(0,0,0,0.2), inset 0 6px 12px rgba(255,255,255,0.3), 0 6px 16px rgba(0,0,0,0.3)' }}
                    >
                        <ArrowDownUp className="w-10 h-10 text-white" />
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
                    className="w-full py-5 px-6 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-2xl font-bold text-xl flex items-center justify-center gap-3 transition-all transform active:scale-95"
                    style={{ boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)' }}
                >
                    <Play className="fill-current" />
                    MEYDAN OKU
                </button>

                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-center">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">En İyi Skor</p>
                    <p className="text-2xl font-black text-amber-400">{highScore}</p>
                </div>

                <div className="bg-indigo-500/20 text-indigo-300 text-xs px-4 py-2 rounded-full text-center border border-indigo-500/30">
                    TUZÖ 6.1.1 Ters Yönelim / Ketleyici Kontrol
                </div>
            </div>

            <div className="mt-8 bg-rose-500/10 p-6 rounded-2xl border border-rose-500/30">
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-rose-400 mt-1 shrink-0" />
                    <div className="text-sm text-slate-300 leading-relaxed">
                        <p className="mb-2 font-bold text-rose-400">KRİTİK KURAL:</p>
                        <p>Ekranda <span className="text-white font-bold italic">YUKARI</span> yazıyorsa, gitmek için <span className="text-white font-bold underline">AŞAĞI</span> okuna basmalısın! Tüm oklar ters yöne çalışır.</p>
                        <p className="mt-2 opacity-70">Hedefe ulaşmak için beynindeki okuma refleksiyle savaş!</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Menu;
