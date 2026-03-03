import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Puzzle, Check } from "lucide-react";
import { useSound } from "../../hooks/useSound";
import { useSafeTimeout } from '../../hooks/useSafeTimeout';
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";

// ============== CONSTANTS ==============
const GAME_ID = "mindmatch-oruntu";
const GAME_TITLE = "Zihin Eşleştirme";
const GAME_DESCRIPTION = "Kategoriye ait tüm öğeleri bul ve seç! Kalıbı çöz, eşleşmeyenleri ayır.";
const TUZO_TEXT = "TUZÖ 5.5.4 Kategori Analizi";
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;

// ============== TYPES ==============
interface EmojiDef {
  emoji: string;
  name: string;
}
interface PuzzleItem extends EmojiDef {
  id: string;
  isMatch: boolean;
}
interface PuzzleData {
  category: string;
  description: string;
  items: PuzzleItem[];
}
const CATEGORIES: Record<string, { description: string; items: EmojiDef[] }> = {
  Meyveler: {
    description: "Ağaçlarda ve bitkilerde yetişen tatlı yiyecekler",
    items: [
      { emoji: "🍎", name: "Elma" },
      { emoji: "🍌", name: "Muz" },
      { emoji: "🍇", name: "Üzüm" },
      { emoji: "🍓", name: "Çilek" },
      { emoji: "🍒", name: "Kiraz" },
      { emoji: "🍑", name: "Şeftali" },
      { emoji: "🍍", name: "Ananas" },
      { emoji: "🥝", name: "Kivi" },
      { emoji: "🍉", name: "Karpuz" },
      { emoji: "🍊", name: "Portakal" },
      { emoji: "🍐", name: "Armut" },
      { emoji: "🍋", name: "Limon" },
    ],
  },
  Taşıtlar: {
    description: "İnsanları veya yükleri taşıyan makineler",
    items: [
      { emoji: "🚗", name: "Araba" },
      { emoji: "🚕", name: "Taksi" },
      { emoji: "🚙", name: "Cip" },
      { emoji: "🚌", name: "Otobüs" },
      { emoji: "🏎️", name: "Yarış Arabası" },
      { emoji: "🚓", name: "Polis Arabası" },
      { emoji: "🚑", name: "Ambulans" },
      { emoji: "🚒", name: "İtfaiye" },
      { emoji: "✈️", name: "Uçak" },
      { emoji: "🚁", name: "Helikopter" },
      { emoji: "🚢", name: "Gemi" },
      { emoji: "🚂", name: "Lokomotif" },
    ],
  },
  Hayvanlar: {
    description: "Doğada veya evde yaşayan canlılar",
    items: [
      { emoji: "🐶", name: "Köpek" },
      { emoji: "🐱", name: "Kedi" },
      { emoji: "🐭", name: "Fare" },
      { emoji: "🐹", name: "Hamster" },
      { emoji: "🐰", name: "Tavşan" },
      { emoji: "🦊", name: "Tilki" },
      { emoji: "🐻", name: "Ayı" },
      { emoji: "🐼", name: "Panda" },
      { emoji: "🐨", name: "Koala" },
      { emoji: "🐯", name: "Kaplan" },
      { emoji: "🦁", name: "Aslan" },
      { emoji: "🐮", name: "İnek" },
    ],
  },
  "Spor Topları": {
    description: "Spor ve oyunlarda kullanılan yuvarlak nesneler",
    items: [
      { emoji: "⚽", name: "Futbol Topu" },
      { emoji: "🏀", name: "Basketbol" },
      { emoji: "🏈", name: "Amerikan Futbolu" },
      { emoji: "⚾", name: "Beyzbol" },
      { emoji: "🎾", name: "Tenis Topu" },
      { emoji: "🏐", name: "Voleybol" },
      { emoji: "🏉", name: "Ragbi Topu" },
      { emoji: "🎱", name: "Bilardo" },
      { emoji: "🥎", name: "Softbol" },
      { emoji: "🎳", name: "Bovling" },
    ],
  },
  "Fast Food": {
    description: "Hızlı hazırlanan lezzetli yiyecekler",
    items: [
      { emoji: "🍔", name: "Hamburger" },
      { emoji: "🍟", name: "Patates Kızartması" },
      { emoji: "🍕", name: "Pizza" },
      { emoji: "🌭", name: "Sosisli" },
      { emoji: "🥪", name: "Sandviç" },
      { emoji: "🌮", name: "Taco" },
      { emoji: "🌯", name: "Dürüm" },
      { emoji: "🥙", name: "Lavaş" },
      { emoji: "🍿", name: "Patlamış Mısır" },
      { emoji: "🍩", name: "Donut" },
    ],
  },
  "Hava Durumu": {
    description: "Atmosferin farklı halleri",
    items: [
      { emoji: "☀️", name: "Güneş" },
      { emoji: "🌤️", name: "Güneşli Bulutlu" },
      { emoji: "☁️", name: "Bulut" },
      { emoji: "🌧️", name: "Yağmur" },
      { emoji: "⛈️", name: "Fırtına" },
      { emoji: "🌩️", name: "Şimşek" },
      { emoji: "🌨️", name: "Kar" },
      { emoji: "❄️", name: "Kar Tanesi" },
      { emoji: "🌪️", name: "Kasırga" },
      { emoji: "🌈", name: "Gökkuşağı" },
    ],
  },
  Aletler: {
    description: "Tamir ve inşaat için kullanılan araçlar",
    items: [
      { emoji: "🔨", name: "Çekiç" },
      { emoji: "🪓", name: "Balta" },
      { emoji: "⛏️", name: "Kazma" },
      { emoji: "🛠️", name: "Anahtar" },
      { emoji: "🔧", name: "İngiliz Anahtarı" },
      { emoji: "🪛", name: "Tornavida" },
      { emoji: "📏", name: "Cetvel" },
      { emoji: "🪚", name: "Testere" },
      { emoji: "🧲", name: "Mıknatıs" },
      { emoji: "📐", name: "Gönye" },
    ],
  },
  "Deniz Canlıları": {
    description: "Suda yaşayan hayvanlar",
    items: [
      { emoji: "🐙", name: "Ahtapot" },
      { emoji: "🦑", name: "Kalamar" },
      { emoji: "🦐", name: "Karides" },
      { emoji: "🦞", name: "Istakoz" },
      { emoji: "🦀", name: "Yengeç" },
      { emoji: "🐡", name: "Balon Balığı" },
      { emoji: "🐠", name: "Tropikal Balık" },
      { emoji: "🐟", name: "Balık" },
      { emoji: "🐬", name: "Yunus" },
      { emoji: "🐳", name: "Balina" },
    ],
  },
  Sebzeler: {
    description: "Toprakta yetişen sağlıklı besinler",
    items: [
      { emoji: "🥦", name: "Brokoli" },
      { emoji: "🥬", name: "Marul" },
      { emoji: "🥒", name: "Salatalık" },
      { emoji: "🌽", name: "Mısır" },
      { emoji: "🥕", name: "Havuç" },
      { emoji: "🥔", name: "Patates" },
      { emoji: "🍆", name: "Patlıcan" },
      { emoji: "🧄", name: "Sarımsak" },
      { emoji: "🧅", name: "Soğan" },
      { emoji: "🍄", name: "Mantar" },
    ],
  },
  Giysiler: {
    description: "Giydiğimiz kıyafetler",
    items: [
      { emoji: "👕", name: "Tişört" },
      { emoji: "👖", name: "Pantolon" },
      { emoji: "🧣", name: "Atkı" },
      { emoji: "🧤", name: "Eldiven" },
      { emoji: "🧥", name: "Mont" },
      { emoji: "🧦", name: "Çorap" },
      { emoji: "👗", name: "Elbise" },
      { emoji: "👘", name: "Kimono" },
      { emoji: "🩳", name: "Şort" },
      { emoji: "👔", name: "Kravat" },
    ],
  },
  "Müzik Aletleri": {
    description: "Müzik yapımında kullanılan aletler",
    items: [
      { emoji: "🎹", name: "Piyano" },
      { emoji: "🎸", name: "Gitar" },
      { emoji: "🎺", name: "Trompet" },
      { emoji: "🎻", name: "Keman" },
      { emoji: "🥁", name: "Davul" },
      { emoji: "🪗", name: "Akordeon" },
      { emoji: "🎷", name: "Saksafon" },
      { emoji: "🪘", name: "Darbuka" },
      { emoji: "🎵", name: "Nota" },
      { emoji: "🎶", name: "Müzik" },
    ],
  },
  Çiçekler: {
    description: "Doğanın renkli güzellikleri",
    items: [
      { emoji: "🌸", name: "Kiraz Çiçeği" },
      { emoji: "🌹", name: "Gül" },
      { emoji: "🌻", name: "Ayçiçeği" },
      { emoji: "🌺", name: "Çarkıfelek" },
      { emoji: "🌷", name: "Lale" },
      { emoji: "🌼", name: "Papatya" },
      { emoji: "💐", name: "Buket" },
      { emoji: "🌿", name: "Yaprak" },
      { emoji: "🍀", name: "Yonca" },
      { emoji: "🪻", name: "Sümbül" },
    ],
  },
};

function generatePuzzle(level: number): PuzzleData {
  const categoryKeys = Object.keys(CATEGORIES);
  const targetKey =
    categoryKeys[Math.floor(Math.random() * categoryKeys.length)];
  const targetCategory = CATEGORIES[targetKey];
  const correctCount = level <= 5 ? 4 : level <= 12 ? 5 : 6;
  const totalItems = 9;
  const distractorCount = totalItems - correctCount;
  const shuffledTargets = [...targetCategory.items].sort(
    () => 0.5 - Math.random(),
  );
  const selectedTargets = shuffledTargets.slice(0, correctCount);
  const otherItems: EmojiDef[] = [];
  categoryKeys.forEach((key) => {
    if (key !== targetKey) otherItems.push(...CATEGORIES[key].items);
  });
  const selectedDistractors = otherItems
    .sort(() => 0.5 - Math.random())
    .slice(0, distractorCount);
  const items: PuzzleItem[] = [
    ...selectedTargets.map((item) => ({ ...item, isMatch: true, id: "" })),
    ...selectedDistractors.map((item) => ({ ...item, isMatch: false, id: "" })),
  ]
    .sort(() => 0.5 - Math.random())
    .map((item, index) => ({ ...item, id: `item-${Date.now()}-${index}` }));
  return {
    category: targetKey,
    description: targetCategory.description,
    items,
  };
}

const MindMatchGame: React.FC = () => {
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: MAX_LEVEL,
    initialLives: INITIAL_LIVES,
    timeLimit: TIME_LIMIT,
  });

  const { playSound } = useSound();
  const safeTimeout = useSafeTimeout();
  const feedback = useGameFeedback({ duration: 1000 });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;
  const { phase, level, addScore, loseLife, nextLevel } = engine;

  const [puzzle, setPuzzle] = useState<PuzzleData | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isChecking, setIsChecking] = useState(false);

  const initLevel = useCallback((lvl: number) => {
    const newPuzzle = generatePuzzle(lvl);
    setPuzzle(newPuzzle);
    setSelectedIds(new Set());
    setIsChecking(false);
  }, []);

  useEffect(() => {
    if (phase === "playing" && !puzzle) {
      initLevel(level);
    } else if (phase === "welcome") {
      setPuzzle(null);
      setSelectedIds(new Set());
      setIsChecking(false);
    }
  }, [phase, level, initLevel, puzzle]);

  const toggleCard = (id: string) => {
    if (phase !== "playing" || isChecking || feedbackState) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const checkAnswer = () => {
    if (!puzzle || phase !== "playing" || isChecking) return;
    setIsChecking(true);
    const correctIds = new Set(
      puzzle.items.filter((i) => i.isMatch).map((i) => i.id),
    );
    const missed = Array.from(correctIds).filter((id) => !selectedIds.has(id));
    const wrong = Array.from(selectedIds).filter((id) => !correctIds.has(id));
    const isCorrect = missed.length === 0 && wrong.length === 0;

    if (isCorrect) {
      addScore(10 * level);
      showFeedback(true);
      playSound("correct");
      safeTimeout(() => {
        dismissFeedback();
        setIsChecking(false);
        nextLevel();
        if (level < MAX_LEVEL) {
          initLevel(level + 1);
        }
      }, 1200);
    } else {
      showFeedback(false);
      playSound("incorrect");
      loseLife();
      safeTimeout(() => {
        dismissFeedback();
        setIsChecking(false);
        setSelectedIds(new Set());
      }, 1500);
    }
  };

  const getCardClass = (item: PuzzleItem) => {
    const isSelected = selectedIds.has(item.id);
    const isRevealed = isChecking || feedbackState;
    if (isRevealed) {
      if (item.isMatch && isSelected)
        return 'bg-cyber-green text-black border-2 border-black/10 shadow-none translate-y-1';
      if (item.isMatch && !isSelected)
        return 'bg-cyber-blue text-white border-2 border-dashed border-black/10 shadow-neo-sm opacity-50';
      if (!item.isMatch && isSelected)
        return 'bg-cyber-pink text-black border-2 border-black/10 shadow-none translate-y-1 animate-pulse';
      return 'bg-white dark:bg-slate-800 text-black border-2 border-black/10 shadow-neo-sm opacity-30';
    }
    if (isSelected)
      return 'bg-cyber-yellow text-black border-2 border-black/10 shadow-neo-sm translate-y-0.5';
    return 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white border-2 border-black/10 shadow-neo-sm';
  };

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: Puzzle,
    accentColor: "cyber-pink",
    maxLevel: MAX_LEVEL,
    wideLayout: true,
    howToPlay: [
      <>Kategori ismine göre doğru öğeleri <strong>bul</strong></>,
      <>Hepsini seçince <strong>Kontrol Et</strong>'e tıkla</>,
      <>Yanlış seçimler can götürür, <strong>dikkatli ol!</strong></>,
    ],
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => puzzle ? (
        <div className="w-full max-w-3xl flex flex-col items-center gap-4">
          {/* Kategori Kartı */}
          <div className="w-full bg-white dark:bg-slate-800 rounded-2xl p-5 border-2 border-black/10 shadow-neo-sm relative text-center">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-cyber-blue text-white px-4 py-1.5 rounded-full font-nunito font-black uppercase tracking-widest text-xs border-2 border-black/10 shadow-neo-sm">
              Kategori
            </div>
            <h2 className="text-2xl sm:text-3xl font-nunito font-black text-black dark:text-white mt-3 mb-2">
              {puzzle.category}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-nunito font-medium text-sm">
              Bu kategoriye ait{" "}
              <strong className="text-black dark:text-white font-black">
                {puzzle.items.filter((i) => i.isMatch).length}
              </strong>{" "}
              öğeyi bul
            </p>
          </div>

          {/* Öğe Kartları */}
          <div className="grid grid-cols-3 gap-3 w-full">
            {puzzle.items.map((item, idx) => {
              const cardClass = getCardClass(item);
              const isSelected = selectedIds.has(item.id);
              return (
                <motion.button
                  key={item.id}
                  whileTap={!isChecking && !feedbackState ? { scale: 0.95 } : {}}
                  onClick={() => toggleCard(item.id)}
                  disabled={isChecking || !!feedbackState}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className={`relative rounded-xl flex flex-col items-center justify-center p-3 sm:p-4 transition-all duration-200 active:translate-y-1 active:shadow-none ${cardClass}`}
                >
                  <span className="text-3xl sm:text-5xl select-none mb-1">
                    {item.emoji}
                  </span>
                  <span className="text-xs sm:text-sm font-nunito font-black text-center leading-tight">
                    {item.name}
                  </span>
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 w-7 h-7 bg-cyber-green border-2 border-black/10 rounded-lg flex items-center justify-center shadow-neo-sm z-10">
                      <Check size={14} className="text-black stroke-[3]" />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Kontrol Et Butonu */}
          {!isChecking && !feedbackState && (
            <motion.button
              whileTap={selectedIds.size > 0 ? { scale: 0.95 } : {}}
              onClick={checkAnswer}
              disabled={selectedIds.size === 0}
              className={`w-full max-w-sm py-4 rounded-xl font-nunito font-black text-lg uppercase tracking-widest transition-all border-2 flex items-center justify-center gap-3 active:translate-y-1 active:shadow-none ${selectedIds.size > 0
                ? "bg-cyber-yellow text-black border-black/10 shadow-neo-sm"
                : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-300 dark:border-slate-700 shadow-none cursor-not-allowed"
                }`}
            >
              <CheckCircle2
                size={22}
                className={selectedIds.size > 0 ? "stroke-[3]" : ""}
              />
              <span>Kontrol Et ({selectedIds.size})</span>
            </motion.button>
          )}
        </div>
      ) : <></>}
    </BrainTrainerShell>
  );
};
export default MindMatchGame;
