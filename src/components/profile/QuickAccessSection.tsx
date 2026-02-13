import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Tablet, Gamepad2, Palette, Music, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

interface QuickAccessButton {
    id: string;
    title: string;
    description: string;
    icon: React.ElementType;
    color: string;
    link: string;
    /** Which yetenek_alani values should see this button. Empty = everyone */
    talents: string[];
}

const ALL_BUTTONS: QuickAccessButton[] = [
    {
        id: 'tablet',
        title: 'Tablet Değerlendirme',
        description: 'Hazırlık oyunları',
        icon: Tablet,
        color: 'from-blue-500 to-cyan-500',
        link: '/atolyeler/tablet-degerlendirme',
        talents: ['genel yetenek', 'genel yetenek - tablet'],
    },
    {
        id: 'bireysel',
        title: 'Bireysel Değerlendirme',
        description: 'Detaylı hazırlık',
        icon: Tablet,
        color: 'from-emerald-500 to-teal-500',
        link: '/atolyeler/bireysel-degerlendirme',
        talents: ['genel yetenek', 'genel yetenek - bireysel'],
    },
    {
        id: 'resim',
        title: 'Resim Atölyesi',
        description: 'Görsel sanat hazırlığı',
        icon: Palette,
        color: 'from-pink-500 to-rose-500',
        link: '/atolyeler/resim',
        talents: ['resim'],
    },
    {
        id: 'muzik',
        title: 'Müzik Atölyesi',
        description: 'Müzik yetenek hazırlığı',
        icon: Music,
        color: 'from-amber-500 to-orange-500',
        link: '/atolyeler/muzik',
        talents: ['müzik'],
    },
    {
        id: 'arcade',
        title: 'BİLSEM Zeka',
        description: 'Jeton at, oyununa başla!',
        icon: Gamepad2,
        color: 'from-purple-500 to-indigo-500',
        link: '/bilsem-zeka',
        talents: [], // everyone sees this
    },
];

const parseYetenekAlani = (value: unknown): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) return parsed;
        } catch {
            return [value];
        }
    }
    return [];
};

const QuickAccessSection: React.FC = () => {
    const { profile } = useAuth();
    const userTalents = useMemo(() => parseYetenekAlani(profile?.yetenek_alani), [profile?.yetenek_alani]);

    const visibleButtons = useMemo(() => {
        if (userTalents.length === 0) return ALL_BUTTONS;

        return ALL_BUTTONS.filter(btn => {
            if (btn.talents.length === 0) return true;
            return btn.talents.some(t => userTalents.includes(t));
        });
    }, [userTalents]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
        >
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
                    <Sparkles className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-bold bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
                    Yetkili Olduklarım
                </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {visibleButtons.map((btn) => (
                    <Link
                        key={btn.id}
                        to={btn.link}
                        className="group flex items-center gap-4 bg-gradient-to-br from-slate-800/90 to-slate-900/90 hover:from-slate-700/90 hover:to-slate-800/90 border border-white/10 hover:border-white/20 rounded-2xl p-5 transition-all shadow-lg"
                    >
                        <div className={`w-14 h-14 bg-gradient-to-r ${btn.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg`}>
                            <btn.icon className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-white text-lg">{btn.title}</h3>
                            <p className="text-white/60 text-sm">{btn.description}</p>
                        </div>
                        <ChevronRight className="w-6 h-6 text-white/30 group-hover:text-white/60 group-hover:translate-x-1 transition-all" />
                    </Link>
                ))}
            </div>
        </motion.div>
    );
};

export default QuickAccessSection;
