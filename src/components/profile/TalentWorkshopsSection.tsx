import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Sparkles, Brain, Music, Palette } from 'lucide-react';
import { motion } from 'framer-motion';
import { UserProfile } from '@/types/profile';

interface TalentWorkshopsSectionProps {
    userData: UserProfile;
}

function parseTalents(talentsInput: string | string[] | undefined): string[] {
    if (!talentsInput) return [];
    if (Array.isArray(talentsInput)) return talentsInput;
    if (typeof talentsInput === 'string') {
        return talentsInput.split(/[,,;]/).map(t => t.trim()).filter(Boolean);
    }
    return [String(talentsInput)];
}

const TalentWorkshopsSection: React.FC<TalentWorkshopsSectionProps> = ({ userData }) => {
    if (!userData.yetenek_alani) return null;

    const talents = parseTalents(userData.yetenek_alani);
    const hasMusic = talents.some(t => t.toLowerCase().includes('müzik'));
    const hasArt = talents.some(t => t.toLowerCase().includes('resim'));
    const hasGeneral = talents.some(t => t.toLowerCase().includes('genel yetenek') || t.toLowerCase().includes('genel zihinsel'));

    if (!hasMusic && !hasArt && !hasGeneral) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-8"
        >
            <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
                    <Sparkles className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-bold bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">Yetenek Atölyelerim</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {hasGeneral && (
                    <Link
                        to="/atolyeler/bireysel-degerlendirme"
                        className="group flex items-center gap-4 bg-slate-800/90 hover:bg-slate-700/90 border border-indigo-500/40 rounded-2xl p-5 transition-all"
                    >
                        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/20">
                            <Brain className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-white text-lg">Bireysel Değerlendirme</h3>
                            <p className="text-indigo-400/70 text-sm">2. Aşama simülasyonları</p>
                        </div>
                        <ChevronRight className="w-6 h-6 text-indigo-500/50 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                    </Link>
                )}
                {hasMusic && (
                    <Link
                        to="/atolyeler/muzik"
                        className="group flex items-center gap-4 bg-slate-800/90 hover:bg-slate-700/90 border border-emerald-500/40 rounded-2xl p-5 transition-all"
                    >
                        <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/20">
                            <Music className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-white text-lg">Müzik Atölyesi</h3>
                            <p className="text-emerald-400/70 text-sm">Yetenek parkuruna katıl</p>
                        </div>
                        <ChevronRight className="w-6 h-6 text-emerald-500/50 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                    </Link>
                )}
                {hasArt && (
                    <Link
                        to="/atolyeler/resim"
                        className="group flex items-center gap-4 bg-slate-800/90 hover:bg-slate-700/90 border border-pink-500/40 rounded-2xl p-5 transition-all"
                    >
                        <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-pink-500/20">
                            <Palette className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-white text-lg">Resim Atölyesi</h3>
                            <p className="text-pink-400/70 text-sm">Yaratıcılığını sergile</p>
                        </div>
                        {'resim_analiz_hakki' in userData && typeof userData.resim_analiz_hakki === 'number' && (
                            <div className="bg-pink-500/20 px-3 py-1.5 rounded-xl border border-pink-500/30">
                                <span className="text-xs text-pink-300">Analiz: </span>
                                <span className={`font-bold ${(userData as UserProfile & { resim_analiz_hakki?: number }).resim_analiz_hakki! > 0 ? 'text-pink-400' : 'text-rose-400'}`}>
                                    {(userData as UserProfile & { resim_analiz_hakki?: number }).resim_analiz_hakki}
                                </span>
                            </div>
                        )}
                        <ChevronRight className="w-6 h-6 text-pink-500/50 group-hover:text-pink-400 group-hover:translate-x-1 transition-all" />
                    </Link>
                )}
            </div>
        </motion.div>
    );
};

export default TalentWorkshopsSection;
