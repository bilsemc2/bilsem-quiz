import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Music, Palette, Lock } from 'lucide-react';
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
    const talents = parseTalents(userData.yetenek_alani);
    const hasMusic = talents.some(t => t.toLowerCase().includes('müzik'));
    const hasArt = talents.some(t => t.toLowerCase().includes('resim'));

    const activeCls = "group flex items-center gap-4 bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl p-5 transition-all shadow-neo-sm hover:-translate-y-0.5 hover:shadow-neo-md active:translate-y-0.5 active:shadow-none focus:outline-none";
    const disabledCls = "group flex items-center gap-4 bg-gray-100 dark:bg-slate-800/50 border-2 border-black/5 dark:border-white/5 rounded-2xl p-5 opacity-60 transition-all shadow-none hover:opacity-80 hover:shadow-neo-sm focus:outline-none";

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Müzik Atölyesi */}
            {hasMusic ? (
                <Link to="/atolyeler/muzik" className={activeCls}>
                    <div className="w-12 h-12 bg-cyber-emerald border-2 border-black/10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-neo-sm flex-shrink-0">
                        <Music className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-nunito font-extrabold text-black dark:text-white text-base tracking-tight">Müzik Atölyesi</h3>
                        <p className="font-nunito font-bold text-slate-400 text-xs">Yetenek parkuruna katıl</p>
                    </div>
                    <span className="bg-cyber-emerald text-white text-[9px] font-nunito font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-lg border-2 border-black/10 shadow-sm flex-shrink-0">Yetkili</span>
                    <div className="bg-gray-50 dark:bg-slate-700 border-2 border-black/10 dark:border-white/10 rounded-xl p-2 group-hover:translate-x-1 transition-all flex-shrink-0">
                        <ChevronRight className="w-4 h-4 text-black dark:text-white" />
                    </div>
                </Link>
            ) : (
                <Link to="/atolyeler/muzik-sinav" className={disabledCls}>
                    <div className="w-12 h-12 bg-slate-300 dark:bg-slate-600 border-2 border-black/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Music className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-nunito font-extrabold text-slate-400 dark:text-slate-500 text-base tracking-tight">Müzik Atölyesi</h3>
                        <p className="font-nunito font-bold text-slate-300 dark:text-slate-600 text-xs">Detayları incele</p>
                    </div>
                    <span className="bg-slate-300 dark:bg-slate-600 text-white text-[9px] font-nunito font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-lg border-2 border-black/5 flex-shrink-0 flex items-center gap-1">
                        <Lock size={10} strokeWidth={3} /> Kilitli
                    </span>
                </Link>
            )}

            {/* Resim Atölyesi */}
            {hasArt ? (
                <Link to="/atolyeler/resim" className={activeCls}>
                    <div className="w-12 h-12 bg-cyber-pink border-2 border-black/10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-neo-sm flex-shrink-0">
                        <Palette className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-nunito font-extrabold text-black dark:text-white text-base tracking-tight">Resim Atölyesi</h3>
                        <p className="font-nunito font-bold text-slate-400 text-xs">Yaratıcılığını sergile</p>
                    </div>
                    <span className="bg-cyber-emerald text-white text-[9px] font-nunito font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-lg border-2 border-black/10 shadow-sm flex-shrink-0">Yetkili</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {'resim_analiz_hakki' in userData && typeof userData.resim_analiz_hakki === 'number' && (
                            <div className="bg-black/5 dark:bg-white/5 px-2 py-1 rounded-lg border border-black/10 dark:border-white/10 flex items-center gap-1">
                                <span className="text-[9px] font-nunito font-extrabold text-slate-500 uppercase">Analiz:</span>
                                <span className={`font-nunito font-extrabold text-xs ${(userData as UserProfile & { resim_analiz_hakki?: number }).resim_analiz_hakki! > 0 ? 'text-cyber-emerald' : 'text-red-500'}`}>
                                    {(userData as UserProfile & { resim_analiz_hakki?: number }).resim_analiz_hakki}
                                </span>
                            </div>
                        )}
                        <div className="bg-gray-50 dark:bg-slate-700 border-2 border-black/10 dark:border-white/10 rounded-xl p-2 group-hover:translate-x-1 transition-all">
                            <ChevronRight className="w-4 h-4 text-black dark:text-white" />
                        </div>
                    </div>
                </Link>
            ) : (
                <Link to="/atolyeler/resim" className={disabledCls}>
                    <div className="w-12 h-12 bg-slate-300 dark:bg-slate-600 border-2 border-black/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Palette className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-nunito font-extrabold text-slate-400 dark:text-slate-500 text-base tracking-tight">Resim Atölyesi</h3>
                        <p className="font-nunito font-bold text-slate-300 dark:text-slate-600 text-xs">Detayları incele</p>
                    </div>
                    <span className="bg-slate-300 dark:bg-slate-600 text-white text-[9px] font-nunito font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-lg border-2 border-black/5 flex-shrink-0 flex items-center gap-1">
                        <Lock size={10} strokeWidth={3} /> Kilitli
                    </span>
                </Link>
            )}
        </div>
    );
};

export default TalentWorkshopsSection;
