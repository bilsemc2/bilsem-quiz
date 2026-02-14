import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Focus, Sparkles, Trophy } from 'lucide-react';

interface StartOverlayProps {
    onStart: () => void;
}

export const StartOverlay: React.FC<StartOverlayProps> = ({ onStart }) => (
    <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-20">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-10 max-w-sm w-full text-center border border-white/20 mx-4">
            <div
                className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-[40%] flex items-center justify-center mx-auto mb-6"
               
            >
                <Focus size={48} className="text-white" />
            </div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent mb-2 italic">KARANLIK LABİRENT</h1>
            <p className="text-slate-400 mb-4 max-w-xs mx-auto text-sm">Fenerinle çıkışı bul! Pilleri topla ve beynini kullanarak yolu aydınlat.</p>
            <div className="bg-indigo-500/20 text-indigo-300 text-xs px-4 py-2 rounded-full mb-6 inline-block border border-indigo-500/30">
                TUZÖ 3.1.2 Karanlık Navigasyon / Uzamsal Bellek
            </div>
            <button
                onClick={onStart}
                className="w-full px-12 py-4 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-black text-xl rounded-2xl transition-all active:scale-95"
               
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
    <div className="absolute inset-0 flex items-center justify-center bg-emerald-600/90 backdrop-blur-md z-30">
        <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
        >
            <div
                className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-[40%] flex items-center justify-center mx-auto mb-4"
                style={{ boxShadow: 'inset 0 -6px 12px rgba(0,0,0,0.2), inset 0 6px 12px rgba(255,255,255,0.4), 0 6px 16px rgba(0,0,0,0.3)' }}
            >
                <Sparkles size={40} className="text-white" />
            </div>
            <h2 className="text-4xl font-black text-white italic mb-2 tracking-tighter">BÖLÜM TAMAM!</h2>
            <p className="text-emerald-100 font-bold mb-8 uppercase tracking-widest text-xs">Yeni Labirent Hazırlanıyor...</p>
            <button
                onClick={onNextLevel}
                className="px-12 py-4 bg-white text-emerald-600 font-black text-xl rounded-2xl transition-all active:scale-95"
                style={{ boxShadow: '0 6px 24px rgba(0,0,0,0.3)' }}
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
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-10 max-w-sm w-full text-center border border-white/20 mx-4">
            <div
                className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-[40%] flex items-center justify-center mx-auto mb-6"
                style={{ boxShadow: 'inset 0 -6px 12px rgba(0,0,0,0.2), inset 0 6px 12px rgba(255,255,255,0.4), 0 6px 16px rgba(0,0,0,0.3)' }}
            >
                <Trophy size={40} className="text-white" />
            </div>
            <h2 className="text-4xl font-black text-white mb-2 italic">OYUN BİTTİ</h2>
            <div className="text-indigo-300 font-bold mb-2 uppercase tracking-widest text-xs">TOPLAM PUAN</div>
            <div className="text-6xl font-black text-indigo-400 mb-2">{score}</div>
            <p className="text-slate-400 font-bold mb-8 uppercase tracking-widest text-xs">{level}. Seviyeye Ulaştın!</p>
            <div className="flex flex-col gap-4">
                <button
                    onClick={onRestart}
                    className="w-full px-12 py-4 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-black text-xl rounded-2xl transition-all active:scale-95"
                   
                >
                    YENİDEN DENE
                </button>
                <Link to="/bilsem-zeka" className="text-slate-400 font-bold hover:text-white transition-colors">DÖNÜŞ</Link>
            </div>
        </div>
    </div>
);
