import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Focus, Sparkles, Trophy } from 'lucide-react';

interface StartOverlayProps {
    onStart: () => void;
}

export const StartOverlay: React.FC<StartOverlayProps> = ({ onStart }) => (
    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20 p-4">
        <div className="bg-white rounded-[2rem] sm:rounded-[3rem] p-5 sm:p-6 max-w-sm w-full text-center border-2 border-black/10 shadow-neo-sm transform rotate-1 max-h-[90dvh] overflow-y-auto">
            <div
                className="w-14 h-14 sm:w-16 sm:h-16 bg-sky-400 border-2 border-black/10 shadow-neo-sm rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-3 transform -rotate-3"

            >
                <Focus size={36} className="text-black" strokeWidth={3} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-black mb-3 uppercase drop-shadow-[2px_2px_0_#fff] tracking-tighter">KARANLIK<br />LABİRENT</h1>
            <p className="text-black bg-rose-200 border-2 border-black/10 shadow-neo-sm rounded-xl p-3 mb-3 max-w-xs mx-auto text-xs sm:text-sm font-black -rotate-1">
                Fenerinle çıkışı bul! Pilleri topla ve yolu aydınlat.
            </p>
            <div className="bg-white text-black font-black text-[10px] sm:text-xs px-3 py-1.5 rounded-lg sm:rounded-xl mb-3 inline-block border-2 border-black/10 shadow-neo-sm rotate-2">
                TUZÖ 3.1.2 Karanlık Navigasyon / Uzamsal Bellek
            </div>
            <button
                onClick={onStart}
                className="w-full py-3 bg-yellow-400 text-black font-black text-lg sm:text-xl tracking-widest uppercase rounded-xl sm:rounded-2xl hover:-translate-y-1 hover:shadow-neo-sm active:translate-y-2 active:shadow-none transition-all border-2 border-black/10 shadow-neo-sm"
            >
                BAŞLA
            </button>
            <Link to="/bilsem-zeka" className="block mt-3 text-black hover:opacity-70 transition-colors font-black text-xs uppercase">
                Arcade'e Dön
            </Link>
        </div>
    </div>
);

interface LevelClearedOverlayProps {
    onNextLevel: () => void;
}

export const LevelClearedOverlay: React.FC<LevelClearedOverlayProps> = ({ onNextLevel }) => (
    <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-30 p-4">
        <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[2rem] sm:rounded-[3rem] p-5 sm:p-6 max-w-sm w-full text-center border-2 border-black/10 shadow-neo-sm transform -rotate-1 max-h-[90dvh] overflow-y-auto"
        >
            <div
                className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-400 border-2 border-black/10 shadow-neo-sm rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-3 transform rotate-3"
            >
                <Sparkles size={36} className="text-black" strokeWidth={3} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-black mb-3 uppercase drop-shadow-[2px_2px_0_#fff] tracking-tighter">BÖLÜM<br />TAMAM!</h2>
            <p className="text-black bg-sky-200 border-2 border-black/10 shadow-neo-sm rounded-xl p-2 mb-4 uppercase tracking-widest text-xs font-black rotate-2">
                Yeni Labirent Hazırlanıyor...
            </p>
            <button
                onClick={onNextLevel}
                className="w-full py-3 bg-emerald-400 text-black font-black text-lg sm:text-xl tracking-widest uppercase rounded-xl sm:rounded-2xl hover:-translate-y-1 hover:shadow-neo-sm active:translate-y-2 active:shadow-none transition-all border-2 border-black/10 shadow-neo-sm"
            >
                SONRAKİ SEVİYE
            </button>
        </motion.div>
    </div>
);

interface GameOverOverlayProps {
    score: number;
    level: number;
    onRestart: () => void;
}

export const GameOverOverlay: React.FC<GameOverOverlayProps> = ({ score, level, onRestart }) => (
    <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-30 p-4">
        <div className="bg-white rounded-[2rem] sm:rounded-[3rem] p-5 sm:p-6 max-w-sm w-full text-center border-2 border-black/10 shadow-neo-sm transform rotate-1 max-h-[90dvh] overflow-y-auto">
            <div
                className="w-14 h-14 sm:w-16 sm:h-16 bg-rose-400 border-2 border-black/10 shadow-neo-sm rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-3 transform -rotate-2"
            >
                <Trophy size={36} className="text-black" strokeWidth={3} />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-rose-500 mb-3 uppercase drop-shadow-[2px_2px_0_rgba(0,0,0,0.1)]">OYUN BİTTİ</h2>

            <div className="bg-sky-100 rounded-2xl p-4 mb-4 border-2 border-black/10 shadow-neo-sm -rotate-1">
                <div className="text-black font-black uppercase tracking-widest text-[10px] mb-1">TOPLAM PUAN</div>
                <div className="text-4xl sm:text-5xl font-black text-rose-500 tabular-nums drop-shadow-neo-sm">{score}</div>
            </div>

            <p className="text-black bg-yellow-300 border-2 border-black/10 shadow-neo-sm rounded-lg p-2 mb-4 uppercase tracking-widest text-xs font-black rotate-2 inline-block">
                {level}. Seviyeye Ulaştın!
            </p>

            <div className="flex flex-col gap-3">
                <button
                    onClick={onRestart}
                    className="w-full py-3 bg-rose-400 text-black font-black text-lg sm:text-xl tracking-widest uppercase rounded-xl sm:rounded-2xl hover:-translate-y-1 hover:shadow-neo-sm active:translate-y-2 active:shadow-none transition-all border-2 border-black/10 shadow-neo-sm"
                >
                    YENİDEN DENE
                </button>
                <Link to="/bilsem-zeka" className="text-black hover:opacity-70 transition-colors font-black text-xs uppercase">
                    Arcade'e Dön
                </Link>
            </div>
        </div>
    </div>
);
