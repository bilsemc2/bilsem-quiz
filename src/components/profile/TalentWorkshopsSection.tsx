import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Music, Palette, Lock, Brain, Gamepad2, Languages, LucideIcon } from 'lucide-react';
import { UserProfile } from '@/types/profile';

interface TalentWorkshopsSectionProps {
    userData: UserProfile;
}

interface WorkshopCard {
    id: string;
    title: string;
    subtitle: string;
    link: string;
    icon: LucideIcon;
    iconBg: string;
    activeBg?: string;
    talentMatch: (talents: string[]) => boolean;
    alwaysAccessible?: boolean;
    extraBadge?: (userData: UserProfile) => React.ReactNode;
    showAtBottom?: boolean;
}

const hasGenelYetenek = (talents: string[]) =>
    talents.some(v => v === 'genel yetenek');

const WORKSHOP_CARDS: WorkshopCard[] = [
    {
        id: 'arcade',
        title: 'BİLSEM Zeka Oyunları',
        subtitle: 'Jeton at, oyununa başla!',
        link: '/bilsem-zeka',
        icon: Gamepad2,
        iconBg: 'bg-red-500',
        activeBg: 'bg-cyber-gold',
        talentMatch: () => false,
        alwaysAccessible: true,
        showAtBottom: true,
    },
    {
        id: 'tablet',
        title: 'Tablet Değerlendirme',
        subtitle: '1. Aşama simülasyonları',
        link: '/atolyeler/tablet-degerlendirme',
        icon: Brain,
        iconBg: 'bg-cyber-purple',
        talentMatch: (t) => hasGenelYetenek(t) || t.includes('genel yetenek - tablet'),
    },
    {
        id: 'bireysel',
        title: 'Bireysel Değerlendirme',
        subtitle: '2. Aşama simülasyonları',
        link: '/atolyeler/bireysel-degerlendirme',
        icon: Brain,
        iconBg: 'bg-cyber-blue',
        talentMatch: (t) => hasGenelYetenek(t) || t.includes('genel yetenek - bireysel'),
    },
    {
        id: 'muzik',
        title: 'Müzik Atölyesi',
        subtitle: 'Yetenek parkuruna katıl',
        link: '/atolyeler/muzik',
        icon: Music,
        iconBg: 'bg-cyber-emerald',
        talentMatch: (t) => t.some(v => v.includes('müzik') || v.includes('muzik')),
    },
    {
        id: 'resim',
        title: 'Resim Atölyesi',
        subtitle: 'Yaratıcılığını sergile',
        link: '/atolyeler/resim',
        icon: Palette,
        iconBg: 'bg-cyber-pink',
        talentMatch: (t) => t.some(v => v.includes('resim')),
        extraBadge: (ud) => {
            const hakki = (ud as UserProfile & { resim_analiz_hakki?: number }).resim_analiz_hakki;
            if (typeof hakki !== 'number') return null;
            return (
                <div className="bg-black/5 dark:bg-white/5 px-2 py-1 rounded-lg border border-black/10 dark:border-white/10 flex items-center gap-1">
                    <span className="text-[9px] font-nunito font-extrabold text-slate-500 uppercase">Analiz:</span>
                    <span className={`font-nunito font-extrabold text-xs ${hakki > 0 ? 'text-cyber-emerald' : 'text-red-500'}`}>{hakki}</span>
                </div>
            );
        },
    },
    {
        id: 'deyimler',
        title: 'Deyimler Atölyesi',
        subtitle: 'Karikatürlerle deyim öğren!',
        link: '/deyimler',
        icon: Languages,
        iconBg: 'bg-cyber-pink',
        talentMatch: () => false,
        alwaysAccessible: true,
        showAtBottom: true,
    },
];

function parseTalents(talentsInput: string | string[] | undefined): string[] {
    if (!talentsInput) return [];
    if (Array.isArray(talentsInput)) return talentsInput.map(t => t.trim().toLowerCase());
    if (typeof talentsInput === 'string') {
        return talentsInput.split(/[,,;]/).map(t => t.trim().toLowerCase()).filter(Boolean);
    }
    return [String(talentsInput).trim().toLowerCase()];
}

const TOP_FREE_CARDS = WORKSHOP_CARDS.filter(c => c.alwaysAccessible && !c.showAtBottom);
const TALENT_CARDS = WORKSHOP_CARDS.filter(c => !c.alwaysAccessible);
const BOTTOM_FREE_CARDS = WORKSHOP_CARDS.filter(c => c.alwaysAccessible && c.showAtBottom);

const CardLink: React.FC<{ card: WorkshopCard; hasAccess: boolean; userData: UserProfile }> = ({ card, hasAccess, userData }) => {
    const activeCls = "group flex items-center gap-4 bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl p-5 transition-all shadow-neo-md hover:-translate-y-0.5 hover:shadow-neo-lg active:translate-y-0.5 active:shadow-neo-sm focus:outline-none";
    const disabledCls = "group flex items-center gap-4 bg-gray-100 dark:bg-slate-800/50 border-2 border-black/5 dark:border-white/5 rounded-2xl p-5 opacity-60 transition-all shadow-none hover:opacity-80 hover:shadow-neo-sm focus:outline-none";
    const bgOverride = hasAccess && card.activeBg ? card.activeBg : '';

    return (
        <Link to={card.link} className={hasAccess ? `${activeCls} ${bgOverride}` : disabledCls}>
            <div className={`w-14 h-14 ${hasAccess ? card.iconBg : 'bg-slate-300 dark:bg-slate-600'} border-2 border-black/10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-neo-sm flex-shrink-0`}>
                <card.icon className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
                <h3 className={`font-nunito font-extrabold text-lg tracking-tight ${hasAccess ? 'text-black dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                    {card.title}
                </h3>
                <p className={`font-nunito font-bold text-xs ${hasAccess ? 'text-slate-400' : 'text-slate-300 dark:text-slate-600'}`}>
                    {card.subtitle}
                </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                {!card.alwaysAccessible && (
                    hasAccess
                        ? <span className="bg-cyber-emerald text-white text-[9px] font-nunito font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-lg border-2 border-black/10 shadow-sm">Yetkili</span>
                        : <span className="bg-slate-300 dark:bg-slate-600 text-white text-[9px] font-nunito font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-lg border-2 border-black/5 flex items-center gap-1"><Lock size={10} strokeWidth={3} /> Kilitli</span>
                )}
                {hasAccess && card.extraBadge?.(userData)}
                <div className="bg-gray-50 dark:bg-slate-700 border-2 border-black/10 dark:border-white/10 rounded-xl p-2.5 group-hover:translate-x-1 transition-all">
                    <ChevronRight className="w-5 h-5 text-black dark:text-white" />
                </div>
            </div>
        </Link>
    );
};

const TalentWorkshopsSection: React.FC<TalentWorkshopsSectionProps> = ({ userData }) => {
    const talents = parseTalents(userData.yetenek_alani);

    return (
        <div className="space-y-4">
            {/* Herkese Açık — Üst */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {TOP_FREE_CARDS.map(card => (
                    <CardLink key={card.id} card={card} hasAccess={true} userData={userData} />
                ))}
            </div>

            {/* Yetenek Alanına Göre */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {TALENT_CARDS.map(card => (
                    <CardLink key={card.id} card={card} hasAccess={card.talentMatch(talents)} userData={userData} />
                ))}
            </div>

            {/* Herkese Açık — Alt */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {BOTTOM_FREE_CARDS.map(card => (
                    <CardLink key={card.id} card={card} hasAccess={true} userData={userData} />
                ))}
            </div>
        </div>
    );
};

export default TalentWorkshopsSection;