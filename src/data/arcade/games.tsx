import React from 'react';
import { Focus, Sparkles, Navigation2, FlipHorizontal2, Scissors, Compass } from 'lucide-react';

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
    },
    {
        id: 'ayna-ustasi',
        title: "Ayna Ustası",
        description: "Sol tarafta çiz, sağ tarafta ayna görüntüsüyle hedefleri vur!",
        cost: 35,
        color: "from-rose-500 to-pink-600",
        icon: <FlipHorizontal2 size={48} className="text-white" />,
        link: "/arcade/ayna-ustasi"
    },
    {
        id: 'kraft-origami',
        title: "Kraft Origami",
        description: "Kağıdı katla, del ve açtığında simetrik desenleri keşfet!",
        cost: 40,
        color: "from-amber-500 to-orange-600",
        icon: <Scissors size={48} className="text-white" />,
        link: "/arcade/kraft-origami"
    },
    {
        id: 'labirent-ustasi',
        title: "Labirent Ustası",
        description: "Algoritmik labirentlerde yolunu bul! 5 farklı zorluk seviyesi.",
        cost: 35,
        color: "from-indigo-500 to-purple-600",
        icon: <Compass size={48} className="text-white" />,
        link: "/arcade/labirent-ustasi"
    }
];
