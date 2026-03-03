import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Zap, Sparkles } from "lucide-react";
import { useSound } from "../../hooks/useSound";
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";
import { GAME_COLORS } from './shared/gameColors';
import { useSafeTimeout } from '../../hooks/useSafeTimeout';

const GAME_ID = "yaratik-mantigi";
const GAME_TITLE = "Yaratık Mantığı";
const GAME_DESCRIPTION = "Yaramaz yaratıkları özelliklerine göre grupla! Mantık yönergesini oku ve şartları sağlayan tüm yaratıkları seç.";
const TUZO_TEXT = "TUZÖ 5.5.3 Yönerge Takibi";

type CreatureColor = "red" | "blue" | "green" | "yellow" | "purple";
type CreatureShape = "fluff" | "slime" | "block" | "spiky";
type CreatureAccessory = "none" | "hat" | "glasses" | "bowtie" | "crown";
type CreatureEmotion = "happy" | "sad" | "surprised" | "sleepy" | "angry";

interface Creature {
  id: number;
  color: CreatureColor;
  shape: CreatureShape;
  accessory: CreatureAccessory;
  emotion: CreatureEmotion;
}

const ALL_COLORS: CreatureColor[] = ["red", "blue", "green", "yellow", "purple"];
const ALL_SHAPES: CreatureShape[] = ["fluff", "slime", "block", "spiky"];
const ALL_ACCESSORIES: CreatureAccessory[] = ["none", "hat", "glasses", "bowtie", "crown"];
const ALL_EMOTIONS: CreatureEmotion[] = ["happy", "sad", "surprised", "sleepy", "angry"];

const COLOR_VALUES: Record<CreatureColor, string> = {
  red: GAME_COLORS.incorrect,
  blue: GAME_COLORS.blue,
  green: GAME_COLORS.emerald,
  yellow: GAME_COLORS.orange,
  purple: GAME_COLORS.purple,
};

const STROKE_VALUES: Record<CreatureColor, string> = {
  red: "#991b1b",
  blue: GAME_COLORS.blue,
  green: "#166534",
  yellow: "#b45309",
  purple: "#6d28d9",
};

const TR = {
  colors: { red: "kırmızı", blue: "mavi", green: "yeşil", yellow: "sarı", purple: "mor" } as Record<CreatureColor, string>,
  colorsAcc: { red: "kırmızıları", blue: "mavileri", green: "yeşilleri", yellow: "sarıları", purple: "morları" } as Record<CreatureColor, string>,
  shapes: { fluff: "pofuduk", slime: "jöle", block: "köşeli", spiky: "dikenli" } as Record<CreatureShape, string>,
  accessories: { none: "aksesuarsız", hat: "şapkalı", glasses: "gözlüklü", bowtie: "papyonlu", crown: "taçlı" } as Record<CreatureAccessory, string>,
  emotions: { happy: "mutlu", sad: "üzgün", surprised: "şaşkın", sleepy: "uykulu", angry: "kızgın" } as Record<CreatureEmotion, string>,
};

const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
const cap = (s: string) => s.charAt(0).toLocaleUpperCase("tr-TR") + s.slice(1);

interface RuleResult {
  instruction: string;
  predicate: (c: Creature) => boolean;
}

const easyRule = (): RuleResult => {
  const t = Math.floor(Math.random() * 4);
  if (t === 0) {
    const v = pick(ALL_COLORS);
    return { instruction: `${cap(TR.colors[v])} renkli tüm yaratıkları seç.`, predicate: (c) => c.color === v };
  }
  if (t === 1) {
    const v = pick(ALL_SHAPES);
    return { instruction: `${cap(TR.shapes[v])} olan tüm yaratıkları seç.`, predicate: (c) => c.shape === v };
  }
  if (t === 2) {
    const v = pick(ALL_ACCESSORIES);
    return { instruction: v === "none" ? "Aksesuarı olmayan tüm yaratıkları seç." : `${cap(TR.accessories[v])} tüm yaratıkları seç.`, predicate: (c) => c.accessory === v };
  }
  const v = pick(ALL_EMOTIONS);
  return { instruction: `${cap(TR.emotions[v])} görünen tüm yaratıkları seç.`, predicate: (c) => c.emotion === v };
};

const mediumRule = (): RuleResult => {
  if (Math.random() > 0.5) {
    const co = pick(ALL_COLORS);
    const ac = pick(ALL_ACCESSORIES);
    const acT = ac === "none" ? "aksesuarsız" : TR.accessories[ac];
    return { instruction: `${cap(TR.colors[co])} ve ${acT} olanları seç.`, predicate: (c) => c.color === co && c.accessory === ac };
  }
  const co = pick(ALL_COLORS);
  const sh = pick(ALL_SHAPES);
  return { instruction: `${cap(TR.colors[co])} olan ama ${TR.shapes[sh]} olmayanları seç.`, predicate: (c) => c.color === co && c.shape !== sh };
};

const hardRule = (creatures: Creature[]): RuleResult => {
  if (Math.random() > 0.5) {
    const ck = pick(ALL_COLORS);
    const t1 = pick(ALL_COLORS);
    let t2 = pick(ALL_COLORS);
    while (t2 === t1) t2 = pick(ALL_COLORS);
    const exists = creatures.some((c) => c.color === ck);
    return { instruction: `Eğer ekranda en az bir ${TR.colors[ck]} yaratık varsa ${TR.colorsAcc[t1]} seç, yoksa ${TR.colorsAcc[t2]} seç.`, predicate: (c) => (exists ? c.color === t1 : c.color === t2) };
  }
  const c1 = pick(ALL_COLORS);
  const s1 = pick(ALL_SHAPES);
  let c2 = pick(ALL_COLORS);
  while (c2 === c1) c2 = pick(ALL_COLORS);
  const s2 = pick(ALL_SHAPES);
  return { instruction: `${cap(TR.colors[c1])} ${TR.shapes[s1]} VEYA ${TR.colors[c2]} ${TR.shapes[s2]} olanları seç.`, predicate: (c) => (c.color === c1 && c.shape === s1) || (c.color === c2 && c.shape === s2) };
};

interface RoundData {
  creatures: Creature[];
  instruction: string;
  targetIds: number[];
}

const getCreatureTraitLines = (creature: Creature): string[] => [
  `Renk: ${TR.colors[creature.color]}`,
  `Tip: ${TR.shapes[creature.shape]}`,
  `Aksesuar: ${TR.accessories[creature.accessory]}`,
  `Duygu: ${TR.emotions[creature.emotion]}`,
];

const generateRound = (level: number): RoundData => {
  const count = level <= 5 ? 6 : level <= 12 ? 9 : 12;
  const diff = level <= 6 ? "easy" : level <= 13 ? "medium" : "hard";
  let creatures: Creature[], rule: RuleResult, targetIds: number[];
  let attempts = 0;
  do {
    creatures = Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      color: pick(ALL_COLORS),
      shape: pick(ALL_SHAPES),
      accessory: pick(ALL_ACCESSORIES),
      emotion: pick(ALL_EMOTIONS),
    }));
    rule = diff === "hard" ? hardRule(creatures) : diff === "medium" ? mediumRule() : easyRule();
    targetIds = creatures.filter(rule.predicate).map((c) => c.id);
    attempts++;
  } while (targetIds.length === 0 && attempts < 10);
  return { creatures, instruction: rule.instruction, targetIds };
};

const SHAPE_PATHS: Record<CreatureShape, string> = {
  fluff: "M25,50 C20,35 35,20 50,30 C60,15 80,25 85,45 C95,50 90,70 80,80 C70,90 30,90 20,80 C10,70 15,55 25,50 Z",
  slime: "M50,15 C30,15 15,35 15,60 C15,85 25,90 30,85 C35,80 40,90 50,90 C60,90 65,80 70,85 C75,90 85,85 85,60 C85,35 70,15 50,15 Z",
  block: "M20,25 C20,15 80,15 80,25 L85,75 C85,85 15,85 15,75 L20,25 Z",
  spiky: "M50,15 L58,35 L80,30 L65,48 L85,65 L60,70 L50,90 L40,70 L15,65 L35,48 L20,30 L42,35 Z",
};

const MonsterSVG: React.FC<{ creature: Creature; size?: number }> = ({ creature, size = 80 }) => {
  const { color, shape, accessory, emotion } = creature;
  const fill = COLOR_VALUES[color];
  const stroke = STROKE_VALUES[color];
  const eyeC = "#1F2937";
  const path = SHAPE_PATHS[shape];

  const renderFace = () => {
    const normEyes = (
      <>
        <circle cx="35" cy="50" r="5" fill={eyeC} />
        <circle cx="65" cy="50" r="5" fill={eyeC} />
        <circle cx="37" cy="48" r="2" fill="white" />
        <circle cx="67" cy="48" r="2" fill="white" />
      </>
    );
    let eyes: React.ReactNode, mouth: React.ReactNode;
    switch (emotion) {
      case "happy":
        eyes = (
          <>
            <path d="M30 50 Q35 45 40 50" fill="none" stroke={eyeC} strokeWidth="3" strokeLinecap="round" />
            <path d="M60 50 Q65 45 70 50" fill="none" stroke={eyeC} strokeWidth="3" strokeLinecap="round" />
          </>
        );
        mouth = <path d="M40 60 Q50 70 60 60" fill="none" stroke={eyeC} strokeWidth="3" strokeLinecap="round" />;
        break;
      case "sad":
        eyes = normEyes;
        mouth = <path d="M40 68 Q50 60 60 68" fill="none" stroke={eyeC} strokeWidth="3" strokeLinecap="round" />;
        break;
      case "surprised":
        eyes = normEyes;
        mouth = <ellipse cx="50" cy="65" rx="4" ry="6" fill={eyeC} />;
        break;
      case "angry":
        eyes = (
          <>
            <path d="M30 45 L42 50" stroke={eyeC} strokeWidth="2.5" strokeLinecap="round" />
            <path d="M70 45 L58 50" stroke={eyeC} strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="38" cy="52" r="4" fill={eyeC} />
            <circle cx="62" cy="52" r="4" fill={eyeC} />
          </>
        );
        mouth = <path d="M42 65 Q50 62 58 65" fill="none" stroke={eyeC} strokeWidth="3" strokeLinecap="round" />;
        break;
      case "sleepy":
        eyes = (
          <>
            <path d="M30 52 Q35 52 40 52" fill="none" stroke={eyeC} strokeWidth="3" strokeLinecap="round" />
            <path d="M60 52 Q65 52 70 52" fill="none" stroke={eyeC} strokeWidth="3" strokeLinecap="round" />
          </>
        );
        mouth = <circle cx="50" cy="65" r="3" fill="none" stroke={eyeC} strokeWidth="2" />;
        break;
    }
    return <g>{eyes}{mouth}</g>;
  };

  const renderAccessory = () => {
    switch (accessory) {
      case "hat":
        return (
          <g transform="translate(0,-10) rotate(-10,50,20)">
            <polygon points="30,30 50,5 70,30" fill="#FCD34D" stroke="#D97706" strokeWidth="2" />
            <circle cx="50" cy="5" r="4" fill="#EF4444" />
          </g>
        );
      case "glasses":
        return (
          <g>
            <circle cx="35" cy="50" r="10" fill="rgba(255,255,255,0.4)" stroke={GAME_COLORS.dark} strokeWidth="2" />
            <circle cx="65" cy="50" r="10" fill="rgba(255,255,255,0.4)" stroke={GAME_COLORS.dark} strokeWidth="2" />
            <line x1="45" y1="50" x2="55" y2="50" stroke={GAME_COLORS.dark} strokeWidth="2" />
          </g>
        );
      case "bowtie":
        return (
          <g transform="translate(0,35)">
            <path d="M50 55 L38 48 C35 45 35 55 38 60 L50 55 L62 60 C65 55 65 45 62 48 Z" fill="#EC4899" />
            <circle cx="50" cy="54" r="2" fill="#BE185D" />
          </g>
        );
      case "crown":
        return (
          <g transform="translate(0,-12)">
            <path d="M30 35 L30 20 L40 30 L50 15 L60 30 L70 20 L70 35 Z" fill={GAME_COLORS.yellow} stroke="#B45309" strokeWidth="2" />
          </g>
        );
      default:
        return null;
    }
  };

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="overflow-visible">
      <ellipse cx="50" cy="90" rx="30" ry="5" fill="black" opacity="0.1" />
      <path d={path} fill={fill} stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" />
      {renderFace()}
      {renderAccessory()}
    </svg>
  );
};

const CreatureLogicGame: React.FC = () => {
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: 20,
    initialLives: 5,
    timeLimit: 180,
  });

  const { playSound } = useSound();
  const safeTimeout = useSafeTimeout();
  const feedback = useGameFeedback({ duration: 1500 });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;

  const {
    phase,
    level,
    addScore,
    loseLife,
    nextLevel,
  } = engine;

  const [round, setRound] = useState<RoundData | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);


  useEffect(() => {
    if (phase === "playing" && !round) {
      setRound(generateRound(level));
    } else if (phase === "welcome") {
      setRound(null);
      setSelectedIds([]);
    }
  }, [phase, level, round]);

  const handleCreatureClick = useCallback((id: number) => {
    if (phase !== "playing" || !!feedbackState) return;
    playSound("pop");
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, [phase, feedbackState, playSound]);

  const handleSubmit = useCallback(() => {
    if (!round || phase !== "playing" || selectedIds.length === 0 || !!feedbackState) return;
    const correct =
      selectedIds.length === round.targetIds.length &&
      selectedIds.every((id) => round.targetIds.includes(id));

    showFeedback(correct);
    playSound(correct ? "correct" : "incorrect");

    safeTimeout(() => {
      dismissFeedback();
      if (correct) {
        addScore(10 * level);
        nextLevel();
      } else {
        loseLife();
      }
      setSelectedIds([]);
      setRound(null); // regenerate on next render via effect
    }, 1200);
  }, [round, phase, selectedIds, feedbackState, showFeedback, dismissFeedback, playSound, addScore, level, nextLevel, loseLife, safeTimeout]);

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: Sparkles,
    accentColor: "cyber-blue",
    maxLevel: 20,
    howToPlay: [
      "Üstteki renkli yönergeyi dikkatle oku",
      "Yaratıklardan şartı sağlayanların hepsine tıkla",
      "Tüm seçimlerini yaptıktan sonra onayla butonuna bas!"
    ]
  };

  // Pre-generate background to avoid flashing
  if (phase === "playing" && !round) return null;

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 p-2">
          {phase === "playing" && round && (
            <div
              className="w-full max-w-3xl"
            >
              <div
                className="p-4 sm:p-5 rounded-2xl bg-cyber-pink border-2 border-black/10 shadow-neo-sm mb-4 relative overflow-hidden"
              >
                <div className="relative z-10 flex items-start gap-3 text-black">
                  <Zap
                    className="text-black flex-shrink-0 mt-1 fill-black"
                    size={20}
                  />
                  <p className="text-lg sm:text-xl font-nunito font-black uppercase tracking-tight leading-tight">
                    {round.instruction}
                  </p>
                </div>
              </div>

              <div
                className={`grid gap-3 sm:gap-4 mb-4 ${round.creatures.length <= 6 ? "grid-cols-2 sm:grid-cols-3 mx-auto max-w-xl" : round.creatures.length <= 9 ? "grid-cols-3 mx-auto max-w-2xl" : "grid-cols-3 sm:grid-cols-4"}`}
              >
                {round.creatures.map((creature, _idx) => {
                  const isSelected = selectedIds.includes(creature.id);
                  const showResults = !!feedbackState;
                  const isTarget = round.targetIds.includes(creature.id);
                  const traitLines = getCreatureTraitLines(creature);

                  let bgClass = "bg-white dark:bg-slate-800";
                  let borderClass = "border-black";

                  if (showResults) {
                    if (isTarget && isSelected) {
                      bgClass = "bg-cyber-green/20";
                      borderClass = "border-cyber-green";
                    } else if (isTarget && !isSelected) {
                      bgClass = "bg-cyber-yellow/20";
                      borderClass = "border-cyber-yellow border-dashed";
                    } else if (!isTarget && isSelected) {
                      bgClass = "bg-cyber-pink/20";
                      borderClass = "border-cyber-pink";
                    }
                  } else if (isSelected) {
                    bgClass = "bg-slate-100 dark:bg-slate-700";
                    borderClass = "border-cyber-blue border-[6px]";
                  }

                  return (
                    <button
                      key={creature.id}
                      onClick={() => handleCreatureClick(creature.id)}
                      disabled={showResults}
                      className={`min-h-[160px] sm:min-h-[180px] p-2 sm:p-3 outline-none flex flex-col items-center justify-center gap-1.5 rounded-xl sm:rounded-2xl border-4 ${borderClass} ${bgClass} transition-all duration-200 shadow-neo-sm active:scale-95`}
                    >
                      <MonsterSVG creature={creature} size={72} />
                      <div className="w-full mt-0.5 px-1 py-1 bg-black/5 dark:bg-white/5 border border-black/20 dark:border-white/20 rounded-lg">
                        <p className="text-[9px] sm:text-[10px] leading-tight text-black dark:text-white font-nunito font-semibold text-center break-words">
                          {traitLines[0]}
                        </p>
                        <p className="text-[9px] sm:text-[10px] leading-tight text-black dark:text-white font-nunito font-semibold text-center break-words">
                          {traitLines[1]}
                        </p>
                        <p className="text-[9px] sm:text-[10px] leading-tight text-black dark:text-white font-nunito font-semibold text-center break-words">
                          {traitLines[2]}
                        </p>
                        <p className="text-[9px] sm:text-[10px] leading-tight text-black dark:text-white font-nunito font-semibold text-center break-words">
                          {traitLines[3]}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-center">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSubmit}
                  disabled={selectedIds.length === 0 || !!feedbackState}
                  className="px-8 py-3 bg-cyber-blue text-white font-nunito font-black text-lg sm:text-xl uppercase tracking-widest border-2 border-black/10 shadow-neo-sm rounded-xl transition-all active:translate-y-1 active:shadow-none disabled:opacity-50 flex items-center gap-2"
                >
                  <span>Onayla</span>
                </motion.button>
              </div>
            </div>
          )}
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default CreatureLogicGame;
