import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Music, Palette } from 'lucide-react';
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

    // Bireysel Değerlendirme artık hero card olarak ProfilePage'de gösterildiğinden burada sadece Müzik ve Resim gösterilir
    if (!hasMusic && !hasArt) return null;

    const cardCls = "group flex items-center gap-4 bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl p-5 transition-all shadow-neo-sm hover:-translate-y-0.5 hover:shadow-neo-md active:translate-y-0.5 active:shadow-none focus:outline-none";

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {hasMusic && (
                <Link to="/atolyeler/muzik" className={cardCls}>
                    <div className="w-12 h-12 bg-cyber-emerald border-2 border-black/10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-neo-sm flex-shrink-0">
                        <Music className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-nunito font-extrabold text-black dark:text-white text-base tracking-tight">Müzik Atölyesi</h3>
                        <p className="font-nunito font-bold text-slate-400 text-xs">Yetenek parkuruna katıl</p>
                    </div>
                    <span className="bg-red-500 text-white text-[9px] font-nunito font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-lg border-2 border-red-600/30 shadow-sm flex-shrink-0">Yetkili</span>
                    <div className="bg-gray-50 dark:bg-slate-700 border-2 border-black/10 dark:border-white/10 rounded-xl p-2 group-hover:translate-x-1 transition-all flex-shrink-0">
                        <ChevronRight className="w-4 h-4 text-black dark:text-white" />
                    </div>
                </Link>
            )}
            {hasArt && (
                <Link to="/atolyeler/resim" className={cardCls}>
                    <div className="w-12 h-12 bg-cyber-pink border-2 border-black/10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-neo-sm flex-shrink-0">
                        <Palette className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-nunito font-extrabold text-black dark:text-white text-base tracking-tight">Resim Atölyesi</h3>
                        <p className="font-nunito font-bold text-slate-400 text-xs">Yaratıcılığını sergile</p>
                    </div>
                    <span className="bg-red-500 text-white text-[9px] font-nunito font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-lg border-2 border-red-600/30 shadow-sm flex-shrink-0">Yetkili</span>
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
            )}
        </div>
    );
};

export default TalentWorkshopsSection;
