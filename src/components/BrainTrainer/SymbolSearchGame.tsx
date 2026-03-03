import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, ScanSearch, Eye } from "lucide-react";
import { useSound } from "../../hooks/useSound";
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";

import {
  Anchor, Aperture, Archive, Asterisk, Award, Backpack, BadgeCheck, Banana, Beaker, Bell, Binary, Bird, Bluetooth, Bomb, Bone, Book, Bookmark, Box, Briefcase, Bug, Calculator, Calendar, Camera, Candy, Car, Castle, Cat, Cherry, Circle, Citrus, Cloud, Clover, Code, Coffee, Coins, Compass, Cookie, Crown, Database, Diamond, Dice1, Disc, Dna, DollarSign, Droplet, Drum, Ear, Egg, Feather, Figma, File, Film, Flag, Flame, Flashlight, Flower, Folder, Gamepad, Gem, Ghost, Gift, GitBranch, Glasses, Globe, Hammer, Heart, Hexagon, Home, Hourglass, Image, Inbox, Infinity as InfinityIcon, Key, Lamp, Layers, Leaf, Library, LifeBuoy, Lightbulb, Link, Lock, Magnet, Mail, Map, Medal, Megaphone, Menu, Mic, Microscope, Moon, Mountain, Mouse, Music, Navigation, Network, Nut, Octagon, Package, Palette, Paperclip, PartyPopper, Pen, Phone, PieChart, PiggyBank, Pin, Plane, Plug, Pocket, Power, Printer, Puzzle, QrCode, Quote, Radio, Rocket, Save, Scale, Scissors, Search, Server, Settings, Share, Shield, Ship, Shirt, Shovel, Skull, Smartphone, Snowflake, Sofa, Speaker, Sun, Sword, Syringe, Tablet, Tag, Tent, Terminal, Thermometer, ThumbsUp, Ticket, Tornado, ToyBrick, Train, Trash, TreeDeciduous, TreePine, Trophy, Truck, Tv, Umbrella, User, Utensils, Video, Wallet, Watch, Waves, Webcam, Wifi, Wind, Wine, Wrench, X, Zap, ZoomIn
} from "lucide-react";

import type { LucideIcon } from "lucide-react";
import { useSafeTimeout } from '../../hooks/useSafeTimeout';

const GAME_TITLE = "Sembol Arama";
const GAME_DESCRIPTION = "Hedef sembolü incele, arama grubunda olup olmadığını en hızlı şekilde bul!";
const TUZO_TEXT = "TUZÖ 5.7.1 Seçici Dikkat";

const RAW_ICONS: { c: LucideIcon; n: string }[] = [
  { c: Anchor, n: "Çapa" }, { c: Aperture, n: "Diyafram" }, { c: Archive, n: "Arşiv" }, { c: Asterisk, n: "Yıldız" }, { c: Award, n: "Ödül" }, { c: Backpack, n: "Çanta" }, { c: BadgeCheck, n: "Rozet" }, { c: Banana, n: "Muz" }, { c: Beaker, n: "Deney" }, { c: Bell, n: "Zil" }, { c: Binary, n: "İkili" }, { c: Bird, n: "Kuş" }, { c: Bluetooth, n: "Bluetooth" }, { c: Bomb, n: "Bomba" }, { c: Bone, n: "Kemik" }, { c: Book, n: "Kitap" }, { c: Bookmark, n: "Yer İmi" }, { c: Box, n: "Kutu" }, { c: Briefcase, n: "Evrak Çantası" }, { c: Bug, n: "Böcek" }, { c: Calculator, n: "Hesap" }, { c: Calendar, n: "Takvim" }, { c: Camera, n: "Kamera" }, { c: Candy, n: "Şeker" }, { c: Car, n: "Araba" }, { c: Castle, n: "Kale" }, { c: Cat, n: "Kedi" }, { c: Cherry, n: "Kiraz" }, { c: Circle, n: "Daire" }, { c: Citrus, n: "Narenciye" }, { c: Cloud, n: "Bulut" }, { c: Clover, n: "Yonca" }, { c: Code, n: "Kod" }, { c: Coffee, n: "Kahve" }, { c: Coins, n: "Para" }, { c: Compass, n: "Pusula" }, { c: Cookie, n: "Kurabiye" }, { c: Crown, n: "Taç" }, { c: Database, n: "Veri" }, { c: Diamond, n: "Elmas" }, { c: Dice1, n: "Zar" }, { c: Disc, n: "Disk" }, { c: Dna, n: "DNA" }, { c: DollarSign, n: "Dolar" }, { c: Droplet, n: "Damla" }, { c: Drum, n: "Davul" }, { c: Ear, n: "Kulak" }, { c: Egg, n: "Yumurta" }, { c: Eye, n: "Göz" }, { c: Feather, n: "Tüy" }, { c: Figma, n: "Figma" }, { c: File, n: "Dosya" }, { c: Film, n: "Film" }, { c: Flag, n: "Bayrak" }, { c: Flame, n: "Alev" }, { c: Flashlight, n: "El Feneri" }, { c: Flower, n: "Çiçek" }, { c: Folder, n: "Klasör" }, { c: Gamepad, n: "Oyun" }, { c: Gem, n: "Mücevher" }, { c: Ghost, n: "Hayalet" }, { c: Gift, n: "Hediye" }, { c: GitBranch, n: "Dal" }, { c: Glasses, n: "Gözlük" }, { c: Globe, n: "Küre" }, { c: Hammer, n: "Çekiç" }, { c: Heart, n: "Kalp" }, { c: Hexagon, n: "Altıgen" }, { c: Home, n: "Ev" }, { c: Hourglass, n: "Kum Saati" }, { c: Image, n: "Resim" }, { c: Inbox, n: "Gelen" }, { c: InfinityIcon, n: "Sonsuz" }, { c: Key, n: "Anahtar" }, { c: Lamp, n: "Lamba" }, { c: Layers, n: "Katman" }, { c: Leaf, n: "Yaprak" }, { c: Library, n: "Kütüphane" }, { c: LifeBuoy, n: "Can Simidi" }, { c: Lightbulb, n: "Ampul" }, { c: Link, n: "Bağlantı" }, { c: Lock, n: "Kilit" }, { c: Magnet, n: "Mıknatıs" }, { c: Mail, n: "Posta" }, { c: Map, n: "Harita" }, { c: Medal, n: "Madalya" }, { c: Megaphone, n: "Megafon" }, { c: Menu, n: "Menü" }, { c: Mic, n: "Mikrofon" }, { c: Microscope, n: "Mikroskop" }, { c: Moon, n: "Ay" }, { c: Mountain, n: "Dağ" }, { c: Mouse, n: "Fare" }, { c: Music, n: "Müzik" }, { c: Navigation, n: "Yön" }, { c: Network, n: "Ağ" }, { c: Nut, n: "Somun" }, { c: Octagon, n: "Sekizgen" }, { c: Package, n: "Paket" }, { c: Palette, n: "Palet" }, { c: Paperclip, n: "Ataç" }, { c: PartyPopper, n: "Konfeti" }, { c: Pen, n: "Kalem" }, { c: Phone, n: "Telefon" }, { c: PieChart, n: "Grafik" }, { c: PiggyBank, n: "Kumbara" }, { c: Pin, n: "Raptiye" }, { c: Plane, n: "Uçak" }, { c: Plug, n: "Fiş" }, { c: Pocket, n: "Cep" }, { c: Power, n: "Güç" }, { c: Printer, n: "Yazıcı" }, { c: Puzzle, n: "Bulmaca" }, { c: QrCode, n: "QR Kod" }, { c: Quote, n: "Alıntı" }, { c: Radio, n: "Radyo" }, { c: Rocket, n: "Roket" }, { c: Save, n: "Kaydet" }, { c: Scale, n: "Terazi" }, { c: Scissors, n: "Makas" }, { c: Search, n: "Arama" }, { c: Server, n: "Sunucu" }, { c: Settings, n: "Ayarlar" }, { c: Share, n: "Paylaş" }, { c: Shield, n: "Kalkan" }, { c: Ship, n: "Gemi" }, { c: Shirt, n: "Gömlek" }, { c: Shovel, n: "Kürek" }, { c: Skull, n: "Kafatası" }, { c: Smartphone, n: "Akıllı Telefon" }, { c: Snowflake, n: "Kar" }, { c: Sofa, n: "Kanepe" }, { c: Speaker, n: "Hoparlör" }, { c: Sun, n: "Güneş" }, { c: Sword, n: "Kılıç" }, { c: Syringe, n: "Şırınga" }, { c: Tablet, n: "Tablet" }, { c: Tag, n: "Etiket" }, { c: Tent, n: "Çadır" }, { c: Terminal, n: "Terminal" }, { c: Thermometer, n: "Termometre" }, { c: ThumbsUp, n: "Beğen" }, { c: Ticket, n: "Bilet" }, { c: Tornado, n: "Kasırga" }, { c: ToyBrick, n: "Lego" }, { c: Train, n: "Tren" }, { c: Trash, n: "Çöp" }, { c: TreeDeciduous, n: "Yapraklı Ağaç" }, { c: TreePine, n: "Çam" }, { c: Trophy, n: "Kupa" }, { c: Truck, n: "Kamyon" }, { c: Tv, n: "Televizyon" }, { c: Umbrella, n: "Şemsiye" }, { c: User, n: "Kullanıcı" }, { c: Utensils, n: "Çatal Bıçak" }, { c: Video, n: "Video" }, { c: Wallet, n: "Cüzdan" }, { c: Watch, n: "Saat" }, { c: Waves, n: "Dalga" }, { c: Webcam, n: "Web Kamera" }, { c: Wifi, n: "Wifi" }, { c: Wind, n: "Rüzgar" }, { c: Wine, n: "Şarap" }, { c: Wrench, n: "İngiliz Anahtarı" }, { c: X, n: "Çarpı" }, { c: Zap, n: "Şimşek" }, { c: ZoomIn, n: "Yakınlaştır" }
];

interface GameIcon {
  id: string;
  component: LucideIcon;
  name: string;
}

const ICONS: GameIcon[] = RAW_ICONS.filter((i) => i.c).map((i, idx) => ({
  id: `icon-${idx}`,
  component: i.c,
  name: i.n,
}));

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

interface RoundData {
  target: GameIcon;
  group: GameIcon[];
  hasTarget: boolean;
  startTime: number;
}

const generateRound = (level: number): RoundData => {
  let groupSize = 5;
  if (level > 5) groupSize = 9;
  if (level > 10) groupSize = 15;
  if (level > 15) groupSize = 20;

  const shuffled = shuffle(ICONS);
  const target = shuffled[0];
  const distractors = shuffled.slice(1, groupSize + 2);
  const hasTarget = Math.random() > 0.5;

  let group: GameIcon[];
  if (hasTarget) {
    group = [target, ...distractors.slice(0, groupSize - 1)];
  } else {
    group = distractors.slice(0, groupSize);
  }
  group = shuffle(group);

  return { target, group, hasTarget, startTime: Date.now() };
};

const SymbolSearchGame: React.FC = () => {
  const engine = useGameEngine({
    gameId: "sembol-arama",
    maxLevel: 20,
    initialLives: 5,
    timeLimit: 180,
  });

  const { playSound } = useSound();
  const safeTimeout = useSafeTimeout();
  const feedback = useGameFeedback({ duration: 1000 });

  const {
    phase,
    level,
    addScore,
    loseLife,
    nextLevel,
  } = engine;

  const { feedbackState, showFeedback, dismissFeedback } = feedback;

  const [round, setRound] = useState<RoundData | null>(null);
  const [userSelectedAnswer, setUserSelectedAnswer] = useState<boolean | null>(null);

  useEffect(() => {
    if (phase === "playing" && !round) {
      setRound(generateRound(level));
    } else if (phase === "welcome" && round) {
      setRound(null);
    }
  }, [phase, level, round]);

  const handleAnswer = useCallback(
    (userAnswer: boolean) => {
      if (!round || phase !== "playing" || feedbackState) return;

      setUserSelectedAnswer(userAnswer);
      const correct = userAnswer === round.hasTarget;

      playSound(correct ? "correct" : "incorrect");
      showFeedback(correct);

      safeTimeout(() => {
        dismissFeedback();
        setUserSelectedAnswer(null);

        if (correct) {
          addScore(10 * engine.level);
          if (engine.level >= 20) {
            engine.setGamePhase("victory");
            playSound("success");
          } else {
            nextLevel();
            setRound(generateRound(engine.level + 1));
          }
        } else {
          loseLife();
          if (engine.lives > 1) {
            setRound(generateRound(engine.level));
          }
        }
      }, 1000);
    },
    [round, phase, feedbackState, playSound, showFeedback, dismissFeedback, addScore, loseLife, nextLevel, engine, safeTimeout],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (phase !== "playing") return;
      if (e.key === "ArrowLeft") handleAnswer(false);
      if (e.key === "ArrowRight") handleAnswer(true);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, handleAnswer]);

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: ScanSearch,
    accentColor: "cyber-blue",
    maxLevel: 20,
    wideLayout: true,
    howToPlay: [
      "Hedef sembolü aklında tut",
      "Grupta varsa VAR, yoksa YOK butonuna tıkla",
      "Hızlı tepki vererek daha fazla puan kazan!"
    ]
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <div className="relative z-10 flex flex-col items-center justify-center p-2 flex-1 w-full max-w-7xl mx-auto">

          {round && (
            <motion.div
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full flex flex-col gap-5"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
                {/* Target Section */}
                <div className="md:col-span-4">
                  <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-black/10 p-5 sm:p-6 flex flex-col items-center justify-center relative shadow-neo-sm h-full">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                      <span className="bg-cyber-purple text-white px-4 py-1.5 rounded-full text-xs font-nunito font-black uppercase tracking-widest border-2 border-black/10 shadow-neo-sm whitespace-nowrap">
                        Hedef Sembol
                      </span>
                    </div>

                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-24 h-24 sm:w-28 sm:h-28 bg-cyber-yellow border-2 border-black/10 rounded-2xl flex items-center justify-center shadow-neo-sm mt-3"
                    >
                      {(() => {
                        const TargetIcon = round.target.component;
                        return (
                          <TargetIcon
                            className="w-14 h-14 sm:w-16 sm:h-16 text-black"
                            strokeWidth={2.5}
                          />
                        );
                      })()}
                    </motion.div>

                    <p className="mt-4 text-lg sm:text-xl font-black font-nunito text-black dark:text-white bg-slate-100 dark:bg-slate-700 px-5 py-1.5 rounded-xl border-2 border-black/10">
                      {round.target.name}
                    </p>
                  </div>
                </div>

                {/* Group Section */}
                <div className="md:col-span-8">
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl border-2 border-black/10 p-5 sm:p-6 flex flex-col items-center justify-center relative shadow-neo-sm h-full">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                      <span className="bg-cyber-blue text-white px-4 py-1.5 rounded-full text-xs font-nunito font-black uppercase tracking-widest border-2 border-black/10 shadow-neo-sm whitespace-nowrap">
                        Arama Grubu
                      </span>
                    </div>

                    <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mt-3 w-full">
                      <AnimatePresence mode="popLayout">
                        {round.group.map((icon, idx) => {
                          const IconComp = icon.component;
                          const bgColors = [
                            "bg-white",
                            "bg-cyber-pink",
                            "bg-cyber-yellow",
                            "bg-cyber-blue",
                            "bg-cyber-green",
                          ];
                          const bgColor = bgColors[idx % bgColors.length];
                          const textColor =
                            bgColor === "bg-white" ||
                              bgColor === "bg-cyber-yellow" ||
                              bgColor === "bg-cyber-green" ||
                              bgColor === "bg-cyber-pink"
                              ? "text-black"
                              : "text-white";

                          let itemClass = `w-14 h-14 sm:w-16 sm:h-16 ${bgColor} ${textColor} rounded-xl border-2 border-black/10 shadow-neo-sm flex items-center justify-center`;

                          if (feedbackState && icon.id === round.target.id) {
                            itemClass = `w-14 h-14 sm:w-16 sm:h-16 bg-cyber-green text-black rounded-xl border-2 border-black/10 shadow-neo-sm flex items-center justify-center scale-110 z-10 animate-bounce`;
                          } else if (feedbackState) {
                            itemClass += " opacity-30 grayscale";
                          }

                          return (
                            <motion.div
                              key={`${level}-${icon.id}-${idx}`}
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{
                                opacity: 1,
                                scale: 1,
                              }}
                              transition={{
                                type: "spring",
                                damping: 15,
                                delay: idx * 0.04,
                              }}
                              className={itemClass}
                            >
                              <IconComp
                                className="w-7 h-7 sm:w-9 sm:h-9"
                                strokeWidth={2.5}
                              />
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>

              {/* YOK / VAR Buttons */}
              <div className="grid grid-cols-2 gap-4 w-full max-w-3xl mx-auto">
                <motion.button
                  whileTap={!feedbackState ? { scale: 0.95 } : {}}
                  onClick={() => handleAnswer(false)}
                  disabled={!!feedbackState}
                  className={`py-5 sm:py-6 rounded-2xl font-nunito font-black text-xl sm:text-2xl uppercase tracking-widest border-2 border-black/10 transition-all ${feedbackState && userSelectedAnswer === false
                    ? round.hasTarget === false
                      ? "bg-cyber-green text-black shadow-neo-sm scale-105"
                      : "bg-cyber-pink text-black shadow-neo-sm"
                    : feedbackState
                      ? "bg-slate-200 dark:bg-slate-700 text-slate-400 opacity-50 shadow-none border-slate-300 dark:border-slate-600"
                      : "bg-white dark:bg-slate-800 text-black dark:text-white shadow-neo-sm active:translate-y-1 active:shadow-none"
                    }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <XCircle size={28} strokeWidth={3} />
                    <span>YOK</span>
                    <span className="text-[10px] opacity-50 hidden sm:block font-nunito tracking-normal font-bold">
                      ← Sol Ok
                    </span>
                  </div>
                </motion.button>

                <motion.button
                  whileTap={!feedbackState ? { scale: 0.95 } : {}}
                  onClick={() => handleAnswer(true)}
                  disabled={!!feedbackState}
                  className={`py-5 sm:py-6 rounded-2xl font-nunito font-black text-xl sm:text-2xl uppercase tracking-widest border-2 border-black/10 transition-all ${feedbackState && userSelectedAnswer === true
                    ? round.hasTarget === true
                      ? "bg-cyber-green text-black shadow-neo-sm scale-105"
                      : "bg-cyber-pink text-black shadow-neo-sm"
                    : feedbackState
                      ? "bg-slate-200 dark:bg-slate-700 text-slate-400 opacity-50 shadow-none border-slate-300 dark:border-slate-600"
                      : "bg-cyber-green text-black shadow-neo-sm active:translate-y-1 active:shadow-none"
                    }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <CheckCircle2 size={28} strokeWidth={3} />
                    <span>VAR</span>
                    <span className="text-[10px] opacity-50 hidden sm:block font-nunito tracking-normal font-bold">
                      Sağ Ok →
                    </span>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          )}

        </div>
      )}
    </BrainTrainerShell>
  );
};

export default SymbolSearchGame;
