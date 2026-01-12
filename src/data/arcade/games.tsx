import React from 'react';
import { Focus, Sparkles, Navigation2 } from 'lucide-react';

export interface ArcadeGame {
    id: string;
    title: string;
    description: string;
    cost: number;
    color: string;
    icon: React.ReactNode;
    link: string;
}

export const ARCADE_GAMES: ArcadeGame[] = [
    {
        id: 'dark-maze',
        title: "Karanlık Labirent",
        description: "Fenerinle karanlık yolu aydınlat! Pilleri topla, engelleri aş ve çıkışı bul.",
        cost: 50,
        color: "from-slate-800 to-indigo-900",
        icon: <Focus size={48} className="text-white animate-pulse" />,
        link: "/arcade/karanlik-labirent"
    },
    {
        id: 'renkli-balon',
        title: "Renkli Balon Avı",
        description: "Örüntüdeki eksik sayıyı bul ve hedef balonunu lazerle patlat!",
        cost: 30,
        color: "from-sky-400 to-blue-600",
        icon: <Sparkles size={48} className="text-white animate-bounce" />,
        link: "/arcade/renkli-balon"
    },
    {
        id: 'ters-navigator',
        title: "Ters Navigator",
        description: "Beynini şaşırt! YUKARI yazıyorsa AŞAĞI'ya bas, ters oklara hükmet!",
        cost: 40,
        color: "from-indigo-600 to-purple-700",
        icon: <Navigation2 size={48} className="text-white rotate-45" />,
        link: "/arcade/ters-navigator"
    }
];
