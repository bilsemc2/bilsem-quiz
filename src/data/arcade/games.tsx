import React from 'react';
import { Focus, Sparkles, Navigation2, FlipHorizontal2, Scissors, Compass, Search, Circle, Zap, Route, Lightbulb, Bug } from 'lucide-react';

export type GameCategory = 'memory' | 'spatial' | 'flexibility';

export const CATEGORY_INFO: Record<GameCategory, { title: string; color: string; icon: string }> = {
    memory: { title: '🧠 Hafıza Oyunları', color: 'from-violet-500 to-purple-600', icon: '🧠' },
    spatial: { title: '🧩 Uzamsal Zeka', color: 'from-cyan-500 to-blue-600', icon: '🧩' },
    flexibility: { title: '⚡ Bilişsel Esneklik', color: 'from-amber-500 to-orange-600', icon: '⚡' }
};

export interface ArcadeGame {
    id: string;
    title: string;
    description: string;
    cost: number;
    color: string;
    icon: React.ReactNode;
    link: string;
    tuzo?: string;
    category: GameCategory;
}

export const ARCADE_GAMES: ArcadeGame[] = [
    // HAFIZA OYUNLARI
    {
        id: 'neseli-balonlar',
        title: "Neşeli Balonlar",
        description: "Balonları izle, patlayan renkli balonları aklında tut ve doğru tahmin et!",
        cost: 35,
        color: "from-sky-300 to-blue-500",
        icon: <Circle size={48} className="text-white animate-bounce" />,
        link: "/bilsem-zeka/neseli-balonlar",
        tuzo: "5.4.2 Görsel Kısa Süreli Bellek",
        category: 'memory'
    },
    {
        id: 'chromabreak',
        title: "ChromaBreak",
        description: "Blokları kır, renk sırasını hatırla ve hafıza testini geç!",
        cost: 40,
        color: "from-cyan-500 to-purple-600",
        icon: <Zap size={48} className="text-white" />,
        link: "/bilsem-zeka/chromabreak",
        tuzo: "5.4.2 Görsel Kısa Süreli Bellek",
        category: 'memory'
    },
    {
        id: 'renkli-lambalar',
        title: "Renkli Lambalar",
        description: "Renkli solucanların yollarını ezberle ve hedef renkteki lambaları bul!",
        cost: 35,
        color: "from-pink-500 to-purple-600",
        icon: <Lightbulb size={48} className="text-white" />,
        link: "/bilsem-zeka/renkli-lambalar",
        tuzo: "5.4.2 Görsel Kısa Süreli Bellek",
        category: 'memory'
    },
    {
        id: 'yol-bulmaca',
        title: "Yol Bulmaca",
        description: "Renkleri ve rakamları ezberle, doğru cevabın üzerinden geçerek hedefe ulaş!",
        cost: 40,
        color: "from-yellow-500 to-orange-600",
        icon: <Route size={48} className="text-white" />,
        link: "/bilsem-zeka/yol-bulmaca",
        tuzo: "5.9.2 Çalışma Belleği",
        category: 'memory'
    },
    {
        id: 'chroma-hafiza',
        title: "Chroma Hafıza",
        description: "3D parçaların renklerini ezberle ve hedef renkteki tüm parçaları bul!",
        cost: 40,
        color: "from-blue-500 to-purple-600",
        icon: <Sparkles size={48} className="text-white" />,
        link: "/bilsem-zeka/chroma-hafiza",
        tuzo: "5.4.2 Görsel Kısa Süreli Bellek",
        category: 'memory'
    },
    // UZAMSAL ZEKA
    {
        id: 'dark-maze',
        title: "Karanlık Labirent",
        description: "Fenerinle karanlık yolu aydınlat! Pilleri topla, engelleri aş ve çıkışı bul.",
        cost: 50,
        color: "from-slate-800 to-indigo-900",
        icon: <Focus size={48} className="text-white animate-pulse" />,
        link: "/bilsem-zeka/karanlik-labirent",
        tuzo: "5.3.3 Uzamsal İlişki Çözümleme",
        category: 'spatial'
    },
    {
        id: 'ayna-ustasi',
        title: "Ayna Ustası",
        description: "Sol tarafta çiz, sağ tarafta ayna görüntüsüyle hedefleri vur!",
        cost: 35,
        color: "from-rose-500 to-pink-600",
        icon: <FlipHorizontal2 size={48} className="text-white" />,
        link: "/bilsem-zeka/ayna-ustasi",
        tuzo: "5.3.3 Uzamsal İlişki Çözümleme",
        category: 'spatial'
    },
    {
        id: 'kraft-origami',
        title: "Kraft Origami",
        description: "Kağıdı katla, del ve açtığında simetrik desenleri keşfet!",
        cost: 40,
        color: "from-amber-500 to-orange-600",
        icon: <Scissors size={48} className="text-white" />,
        link: "/bilsem-zeka/kraft-origami",
        tuzo: "5.3.2 Desen Analizi",
        category: 'spatial'
    },
    {
        id: 'labirent-ustasi',
        title: "Labirent Ustası",
        description: "Algoritmik labirentlerde yolunu bul! 5 farklı zorluk seviyesi.",
        cost: 35,
        color: "from-indigo-500 to-purple-600",
        icon: <Compass size={48} className="text-white" />,
        link: "/bilsem-zeka/labirent-ustasi",
        tuzo: "5.3.3 Uzamsal İlişki Çözümleme",
        category: 'spatial'
    },
    // BİLİŞSEL ESNEKLİK
    {
        id: 'renkli-balon',
        title: "Renkli Balon Avı",
        description: "Örüntüdeki eksik sayıyı bul ve hedef balonunu lazerle patlat!",
        cost: 30,
        color: "from-sky-400 to-blue-600",
        icon: <Sparkles size={48} className="text-white animate-bounce" />,
        link: "/bilsem-zeka/renkli-balon",
        tuzo: "5.2.1 Sayısal Dizi Tamamlama",
        category: 'flexibility'
    },
    {
        id: 'ters-navigator',
        title: "Ters Navigator",
        description: "Beynini şaşırt! YUKARI yazıyorsa AŞAĞI'ya bas, ters oklara hükmet!",
        cost: 40,
        color: "from-indigo-600 to-purple-700",
        icon: <Navigation2 size={48} className="text-white rotate-45" />,
        link: "/bilsem-zeka/ters-navigator",
        tuzo: "5.8.1 Bilişsel Esneklik",
        category: 'flexibility'
    },
    {
        id: 'oruntulu-top',
        title: "Örüntü Avcısı",
        description: "Sapanla nişan al! Örüntüdeki eksik balonu bul ve doğru renkteki hedefi vur!",
        cost: 35,
        color: "from-emerald-500 to-teal-600",
        icon: <Focus size={48} className="text-white" />,
        link: "/bilsem-zeka/oruntulu-top",
        tuzo: "5.5.1 Analogik Akıl Yürütme",
        category: 'flexibility'
    },
    {
        id: 'kart-dedektifi',
        title: "Kart Dedektifi",
        description: "Dikkatli ol! Gizli kuralları keşfet ve kartları doğru şekilde eşleştir.",
        cost: 40,
        color: "from-sky-400 to-blue-600",
        icon: <Search size={48} className="text-white" />,
        link: "/bilsem-zeka/kart-dedektifi",
        tuzo: "5.5.2 Kural Çıkarsama",
        category: 'flexibility'
    },
    {
        id: 'sevimli-mantik',
        title: "Sevimli Mantık",
        description: "Robotların hareketlerini izle, koşulları değerlendir ve doğru renge tıkla!",
        cost: 40,
        color: "from-indigo-500 to-purple-600",
        icon: <Bug size={48} className="text-white" />,
        link: "/bilsem-zeka/sevimli-mantik",
        tuzo: "5.5.2 Koşullu Çıkarım",
        category: 'flexibility'
    }
];

// Helper: Get games by category
export const getGamesByCategory = (category: GameCategory): ArcadeGame[] => {
    return ARCADE_GAMES.filter(game => game.category === category);
};
