import React from 'react';
import { Focus, Sparkles, Navigation2, FlipHorizontal2, Scissors, Compass, Search, Circle, Zap, Route, Lightbulb } from 'lucide-react';

export interface ArcadeGame {
    id: string;
    title: string;
    description: string;
    cost: number;
    color: string;
    icon: React.ReactNode;
    link: string;
    tuzo?: string;
}

export const ARCADE_GAMES: ArcadeGame[] = [
    {
        id: 'dark-maze',
        title: "Karanlık Labirent",
        description: "Fenerinle karanlık yolu aydınlat! Pilleri topla, engelleri aş ve çıkışı bul.",
        cost: 50,
        color: "from-slate-800 to-indigo-900",
        icon: <Focus size={48} className="text-white animate-pulse" />,
        link: "/bilsem-zeka/karanlik-labirent",
        tuzo: "5.3.3 Uzamsal İlişki Çözümleme"
    },
    {
        id: 'renkli-balon',
        title: "Renkli Balon Avı",
        description: "Örüntüdeki eksik sayıyı bul ve hedef balonunu lazerle patlat!",
        cost: 30,
        color: "from-sky-400 to-blue-600",
        icon: <Sparkles size={48} className="text-white animate-bounce" />,
        link: "/bilsem-zeka/renkli-balon",
        tuzo: "5.2.1 Sayısal Dizi Tamamlama"
    },
    {
        id: 'ters-navigator',
        title: "Ters Navigator",
        description: "Beynini şaşırt! YUKARI yazıyorsa AŞAĞI'ya bas, ters oklara hükmet!",
        cost: 40,
        color: "from-indigo-600 to-purple-700",
        icon: <Navigation2 size={48} className="text-white rotate-45" />,
        link: "/bilsem-zeka/ters-navigator",
        tuzo: "5.8.1 Bilişsel Esneklik"
    },
    {
        id: 'ayna-ustasi',
        title: "Ayna Ustası",
        description: "Sol tarafta çiz, sağ tarafta ayna görüntüsüyle hedefleri vur!",
        cost: 35,
        color: "from-rose-500 to-pink-600",
        icon: <FlipHorizontal2 size={48} className="text-white" />,
        link: "/bilsem-zeka/ayna-ustasi",
        tuzo: "5.3.3 Uzamsal İlişki Çözümleme"
    },
    {
        id: 'kraft-origami',
        title: "Kraft Origami",
        description: "Kağıdı katla, del ve açtığında simetrik desenleri keşfet!",
        cost: 40,
        color: "from-amber-500 to-orange-600",
        icon: <Scissors size={48} className="text-white" />,
        link: "/bilsem-zeka/kraft-origami",
        tuzo: "5.3.2 Desen Analizi"
    },
    {
        id: 'labirent-ustasi',
        title: "Labirent Ustası",
        description: "Algoritmik labirentlerde yolunu bul! 5 farklı zorluk seviyesi.",
        cost: 35,
        color: "from-indigo-500 to-purple-600",
        icon: <Compass size={48} className="text-white" />,
        link: "/bilsem-zeka/labirent-ustasi",
        tuzo: "5.3.3 Uzamsal İlişki Çözümleme"
    },
    {
        id: 'oruntulu-top',
        title: "Örüntü Avcısı",
        description: "Sapanla nişan al! Örüntüdeki eksik balonu bul ve doğru renkteki hedefi vur!",
        cost: 35,
        color: "from-emerald-500 to-teal-600",
        icon: <Focus size={48} className="text-white" />,
        link: "/bilsem-zeka/oruntulu-top",
        tuzo: "5.5.1 Analogik Akıl Yürütme"
    },
    {
        id: 'kart-dedektifi',
        title: "Kart Dedektifi",
        description: "Dikkatli ol! Gizli kuralları keşfet ve kartları doğru şekilde eşleştir.",
        cost: 40,
        color: "from-sky-400 to-blue-600",
        icon: <Search size={48} className="text-white" />,
        link: "/bilsem-zeka/kart-dedektifi",
        tuzo: "5.5.2 Kural Çıkarsama"
    },
    {
        id: 'neseli-balonlar',
        title: "Neşeli Balonlar",
        description: "Balonları izle, patlayan renkli balonları aklında tut ve doğru tahmin et!",
        cost: 35,
        color: "from-sky-300 to-blue-500",
        icon: <Circle size={48} className="text-white animate-bounce" />,
        link: "/bilsem-zeka/neseli-balonlar",
        tuzo: "5.4.2 Görsel Kısa Süreli Bellek"
    },
    {
        id: 'chromabreak',
        title: "ChromaBreak",
        description: "Blokları kır, renk sırasını hatırla ve hafıza testini geç!",
        cost: 40,
        color: "from-cyan-500 to-purple-600",
        icon: <Zap size={48} className="text-white" />,
        link: "/bilsem-zeka/chromabreak",
        tuzo: "5.4.2 Görsel Kısa Süreli Bellek"
    },
    {
        id: 'yol-bulmaca',
        title: "Yol Bulmaca",
        description: "Renkleri ve rakamları ezberle, doğru cevabın üzerinden geçerek hedefe ulaş!",
        cost: 40,
        color: "from-yellow-500 to-orange-600",
        icon: <Route size={48} className="text-white" />,
        link: "/bilsem-zeka/yol-bulmaca",
        tuzo: "5.9.2 Çalışma Belleği"
    },
    {
        id: 'renkli-lambalar',
        title: "Renkli Lambalar",
        description: "Renkli solucanların yollarını ezberle ve hedef renkteki lambaları bul!",
        cost: 35,
        color: "from-pink-500 to-purple-600",
        icon: <Lightbulb size={48} className="text-white" />,
        link: "/bilsem-zeka/renkli-lambalar",
        tuzo: "5.4.2 Görsel Kısa Süreli Bellek"
    }
];

