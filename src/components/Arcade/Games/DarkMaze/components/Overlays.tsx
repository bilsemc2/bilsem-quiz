import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Focus, Sparkles, Trophy } from 'lucide-react';

interface StartOverlayProps {
    onStart: () => void;
}

export const StartOverlay: React.FC<StartOverlayProps> = ({ onStart }) => (
    <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-20">
        <div className="text-center p-8">
            <div className="w-24 h-24 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl rotate-3">
                <Focus size={48} />
            </div>
            <h1 className="text-4xl font-black text-white mb-2 italic">KARANLIK LABİRENT</h1>
            <p className="text-slate-400 mb-8 max-w-xs text-sm">Fenerinle çıkışı bul! Pilleri topla ve beynini kullanarak yolu aydınlat.</p>
            <button
                onClick={onStart}
                className="px-12 py-4 bg-indigo-500 hover:bg-indigo-400 text-white font-black text-xl rounded-2xl transition-all shadow-[0_6px_0_#4338ca] active:translate-y-1 active:shadow-none"
            >
                BAŞLA
            </button>
        </div>
    </div>
);

interface LevelClearedOverlayProps {
    onNextLevel: () => void;
}

export const LevelClearedOverlay: React.FC<LevelClearedOverlayProps> = ({ onNextLevel }) => (
    <div className="absolute inset-0 flex items-center justify-center bg-indigo-600/90 backdrop-blur-md z-30">
        <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
        >
            <Sparkles size={64} className="text-amber-400 mx-auto mb-4" />
            <h2 className="text-4xl font-black text-white italic mb-2 tracking-tighter">BÖLÜM TAMAM!</h2>
            <p className="text-indigo-200 font-bold mb-8 uppercase tracking-widest text-xs">Yeni Labirent Hazırlanıyor...</p>
            <button
                onClick={onNextLevel}
                className="px-12 py-4 bg-white text-indigo-600 font-black text-xl rounded-2xl shadow-[0_6px_0_#e2e8f0] active:translate-y-1 active:shadow-none"
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
    <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-md z-30">
        <div className="text-center">
            <Trophy size={80} className="text-yellow-500 mx-auto mb-6" />
            <h2 className="text-4xl font-black text-white mb-2 italic">OYUN BİTTİ</h2>
            <div className="text-indigo-200 font-bold mb-2 uppercase tracking-widest text-xs">TOPLAM PUAN</div>
            <div className="text-6xl font-black text-indigo-400 mb-2">{score}</div>
            <p className="text-slate-500 font-bold mb-8 uppercase tracking-widest text-xs">{level}. Seviyeye Ulaştın!</p>
            <div className="flex flex-col gap-4">
                <button
                    onClick={onRestart}
                    className="px-12 py-4 bg-indigo-500 text-white font-black text-xl rounded-2xl shadow-[0_6px_0_#4338ca] active:translate-y-1 active:shadow-none"
                >
                    YENİDEN DENE
                </button>
                <Link to="/arcade" className="text-slate-400 font-bold hover:text-white">DÖNÜŞ</Link>
            </div>
        </div>
    </div>
);
