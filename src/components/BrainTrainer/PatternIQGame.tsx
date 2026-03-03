import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Shapes, Sparkles, RefreshCw } from "lucide-react";
import { useSound } from "../../hooks/useSound";
import { useSafeTimeout } from '../../hooks/useSafeTimeout';
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";
import { GAME_COLORS } from './shared/gameColors';

const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;
const WAGON_COUNT = 5;
const GAME_ID = "patterniq-express";
enum ShapeType {
  LINE = "LINE",
  CIRCLE = "CIRCLE",
  SQUARE = "SQUARE",
  TRIANGLE = "TRIANGLE",
  ARROW = "ARROW",
}
enum TransformationType {
  ROTATION = "ROTATION",
  CLOCK_MOVE = "CLOCK_MOVE",
  CORNER_MOVE = "CORNER_MOVE",
}
interface LayerConfig {
  id: string;
  shape: ShapeType;
  color: string;
  transformation: TransformationType;
  startValue: number;
  stepChange: number;
  size?: number;
  offset?: number;
}
interface PatternData {
  id: string;
  difficulty: "Kolay" | "Orta" | "Zor";
  layers: LayerConfig[];
  description: string;
}
interface WagonState {
  index: number;
  layerStates: {
    layerId: string;
    rotation: number;
    position: number;
    visible: boolean;
  }[];
}
const COLORS = [GAME_COLORS.purple, GAME_COLORS.incorrect, GAME_COLORS.emerald, GAME_COLORS.yellow, GAME_COLORS.shapes[7]];
const SHAPES = [
  ShapeType.LINE,
  ShapeType.CIRCLE,
  ShapeType.SQUARE,
  ShapeType.TRIANGLE,
  ShapeType.ARROW,
];
const SHAPE_SIZE_MAP: Record<ShapeType, number> = {
  [ShapeType.LINE]: 42,
  [ShapeType.CIRCLE]: 24,
  [ShapeType.SQUARE]: 24,
  [ShapeType.TRIANGLE]: 28,
  [ShapeType.ARROW]: 34,
};
const getRandomItem = <T,>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
function generatePattern(level: number): PatternData {
  const maxLayers = level <= 5 ? 1 : level <= 12 ? 2 : 3;
  const layerCount = Math.min(getRandomInt(1, maxLayers), 3);
  const difficulty =
    layerCount === 1 ? "Kolay" : layerCount === 2 ? "Orta" : "Zor";
  const layers: LayerConfig[] = [];
  const usedShapes = new Set<ShapeType>();
  for (let i = 0; i < layerCount; i++) {
    let shape = getRandomItem(SHAPES);
    while (usedShapes.has(shape) && usedShapes.size < SHAPES.length)
      shape = getRandomItem(SHAPES);
    usedShapes.add(shape);
    const transTypes = [
      TransformationType.ROTATION,
      TransformationType.CLOCK_MOVE,
      TransformationType.CORNER_MOVE,
    ];
    let transType = getRandomItem(transTypes);
    if (shape === ShapeType.LINE || shape === ShapeType.ARROW)
      if (Math.random() > 0.3) transType = TransformationType.ROTATION;
    let startValue = 0,
      stepChange = 0;
    switch (transType) {
      case TransformationType.ROTATION:
        startValue = getRandomInt(0, 11) * 30;
        stepChange = getRandomItem([30, 45, 90, -30, -45, -90]);
        break;
      case TransformationType.CLOCK_MOVE:
        startValue = getRandomInt(1, 12);
        stepChange = getRandomItem([1, 2, 3, -1, -2]);
        break;
      case TransformationType.CORNER_MOVE:
        startValue = getRandomInt(0, 3);
        stepChange = getRandomItem([1, -1]);
        break;
    }
    layers.push({
      id: `layer-${i}`,
      shape,
      color: COLORS[i % COLORS.length],
      transformation: transType,
      startValue,
      stepChange,
      size: SHAPE_SIZE_MAP[shape],
      offset: transType === TransformationType.ROTATION ? 0 : 30,
    });
  }
  return {
    id: Date.now().toString(),
    difficulty,
    layers,
    description: layers
      .map((l) => `${l.shape} (${l.transformation})`)
      .join(" | "),
  };
}
function calculateWagonState(
  pattern: PatternData,
  wagonIndex: number,
): WagonState {
  const layerStates = pattern.layers.map((layer) => {
    let rotation = 0,
      position = 0;
    if (layer.transformation === TransformationType.ROTATION)
      rotation = layer.startValue + layer.stepChange * wagonIndex;
    else if (layer.transformation === TransformationType.CLOCK_MOVE) {
      const rawPos = layer.startValue + layer.stepChange * wagonIndex;
      position = (rawPos - 1) % 12;
      if (position < 0) position += 12;
      position += 1;
    } else if (layer.transformation === TransformationType.CORNER_MOVE) {
      const rawPos = layer.startValue + layer.stepChange * wagonIndex;
      position = rawPos % 4;
      if (position < 0) position += 4;
    }
    return { layerId: layer.id, rotation, position, visible: true };
  });
  return { index: wagonIndex, layerStates };
}
function generateOptions(
  pattern: PatternData,
  correctIndex: number,
): WagonState[] {
  const correctState = calculateWagonState(pattern, correctIndex);
  const areStatesEqual = (s1: WagonState, s2: WagonState): boolean => {
    if (s1.layerStates.length !== s2.layerStates.length) return false;
    return s1.layerStates.every((l1, i) => {
      const l2 = s2.layerStates[i];
      const r1 = ((l1.rotation % 360) + 360) % 360,
        r2 = ((l2.rotation % 360) + 360) % 360;
      return (
        l1.layerId === l2.layerId &&
        Math.abs(r1 - r2) < 0.1 &&
        l1.position === l2.position &&
        l1.visible === l2.visible
      );
    });
  };
  const options: WagonState[] = [correctState];
  let attempts = 0;
  while (options.length < 4 && attempts < 50) {
    attempts++;
    const fake: WagonState = JSON.parse(JSON.stringify(correctState));
    if (fake.layerStates.length > 0) {
      const layerToMod = getRandomItem(fake.layerStates);
      const config = pattern.layers.find((l) => l.id === layerToMod.layerId);
      if (config) {
        if (config.transformation === TransformationType.ROTATION)
          layerToMod.rotation += getRandomItem([90, 180, 270, 45, -45]);
        else if (config.transformation === TransformationType.CLOCK_MOVE) {
          let offset = getRandomItem([1, 2, 3, 4, 5, 6]);
          if (Math.random() > 0.5) offset *= -1;
          let newPos = layerToMod.position + offset;
          newPos = (newPos - 1) % 12;
          if (newPos < 0) newPos += 12;
          layerToMod.position = newPos + 1;
        } else if (config.transformation === TransformationType.CORNER_MOVE)
          layerToMod.position =
            (layerToMod.position + getRandomItem([1, 2, 3])) % 4;
      }
    }
    if (!options.some((opt) => areStatesEqual(opt, fake))) options.push(fake);
  }
  return options.sort(() => Math.random() - 0.5);
}
const WagonView: React.FC<{
  state: WagonState;
  pattern: PatternData;
  isQuestion?: boolean;
  isRevealed?: boolean;
  status?: "default" | "correct" | "wrong";
  onClick?: () => void;
}> = ({
  state,
  pattern,
  isQuestion,
  isRevealed,
  status = "default",
  onClick,
}) => {
    const renderedLayers = useMemo(() => {
      return state.layerStates.map((ls) => {
        const config = pattern.layers.find((l) => l.id === ls.layerId);
        if (!config || !ls.visible) return null;
        let translateX = 50,
          translateY = 50,
          rotation = 0;
        if (config.transformation === TransformationType.ROTATION)
          rotation = ls.rotation;
        else if (config.transformation === TransformationType.CLOCK_MOVE) {
          const angleRad = (ls.position - 3) * 30 * (Math.PI / 180);
          const radius = 35;
          translateX = 50 + radius * Math.cos(angleRad);
          translateY = 50 + radius * Math.sin(angleRad);
        } else if (config.transformation === TransformationType.CORNER_MOVE) {
          const margin = 20;
          switch (ls.position) {
            case 0:
              translateX = margin;
              translateY = margin;
              break;
            case 1:
              translateX = 100 - margin;
              translateY = margin;
              break;
            case 2:
              translateX = 100 - margin;
              translateY = 100 - margin;
              break;
            case 3:
              translateX = margin;
              translateY = 100 - margin;
              break;
          }
        }
        const strokeWidth = pattern.layers.length >= 3 ? 4.5 : 5.5;
        const cp = {
          stroke: config.color,
          strokeWidth,
          fill:
            config.shape === ShapeType.CIRCLE || config.shape === ShapeType.SQUARE
              ? `${config.color}33`
              : "none",
        };
        const size = config.size || 20,
          hf = size / 2;
        const om = (x: number, y: number) => (
          <circle
            cx={x}
            cy={y}
            r={4}
            fill="white"
            stroke={config.color}
            strokeWidth={2}
          />
        );
        let sSvg = null;
        switch (config.shape) {
          case ShapeType.CIRCLE:
            sSvg = (
              <g>
                <circle cx={0} cy={0} r={hf} {...cp} />
                {om(0, -hf)}
              </g>
            );
            break;
          case ShapeType.SQUARE:
            sSvg = (
              <g>
                <rect x={-hf} y={-hf} width={size} height={size} {...cp} />
                {om(hf - 2, -hf + 2)}
              </g>
            );
            break;
          case ShapeType.TRIANGLE: {
            const h = size * 0.866;
            sSvg = (
              <g>
                <polygon
                  points={`0,-${h / 2} -${hf},${h / 2} ${hf},${h / 2}`}
                  {...cp}
                />
                {om(0, -h / 2)}
              </g>
            );
            break;
          }
          case ShapeType.LINE:
            sSvg = (
              <g>
                <line
                  x1={0}
                  y1={0}
                  x2={0}
                  y2={-38}
                  stroke={config.color}
                  strokeWidth={5}
                  strokeLinecap="round"
                />
                {om(0, -38)}
              </g>
            );
            break;
          case ShapeType.ARROW:
            sSvg = (
              <g>
                <line
                  x1={0}
                  y1={10}
                  x2={0}
                  y2={-32}
                  stroke={config.color}
                  strokeWidth={5}
                  strokeLinecap="round"
                />
                <path
                  d="M -12 -20 L 0 -36 L 12 -20"
                  fill="none"
                  stroke={config.color}
                  strokeWidth={5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            );
            break;
        }
        return (
          <g
            key={config.id}
            transform={`translate(${translateX}, ${translateY}) rotate(${rotation})`}
          >
            {sSvg}
          </g>
        );
      });
    }, [state, pattern.layers]);
    if (isQuestion && !isRevealed)
      return (
        <div className="w-full aspect-square rounded-[2rem] bg-slate-100 dark:bg-slate-700 border-4 border-dashed border-slate-400 dark:border-slate-500 flex items-center justify-center animate-pulse shadow-neo-sm">
          <span className="text-5xl text-slate-400 dark:text-slate-500 font-nunito font-black">?</span>
        </div>
      );

    let containerClasses = "bg-white dark:bg-slate-800 border-2 border-black/10 transition-all duration-300 relative overflow-hidden";
    let wrapperClasses = "";

    if (status === "correct") {
      containerClasses = "bg-cyber-green/20 border-2 border-cyber-green ring-2 ring-cyber-green shadow-none relative overflow-hidden z-10";
    } else if (status === "wrong") {
      containerClasses = "bg-cyber-pink/20 border-2 border-cyber-pink ring-2 ring-cyber-pink opacity-80 relative overflow-hidden";
    } else {
      containerClasses += " shadow-neo-sm";
      if (onClick) {
        wrapperClasses = "block cursor-pointer hover:-translate-y-2 active:translate-y-1 transition-all group";
        containerClasses += " group-hover:shadow-neo-sm group-active:shadow-neo-sm";
      }
    }

    return (
      <div className={wrapperClasses} onClick={status === "default" && onClick ? onClick : undefined}>
        <div className={`w-full aspect-square rounded-[2rem] ${containerClasses}`}>
          <svg
            className="absolute inset-0 w-full h-full opacity-5 dark:opacity-20 pointer-events-none"
            viewBox="0 0 100 100"
            shapeRendering="geometricPrecision"
          >
            <line x1="50" y1="5" x2="50" y2="15" stroke="currentColor" strokeWidth="4" />
            <line x1="95" y1="50" x2="85" y2="50" stroke="currentColor" strokeWidth="4" />
            <line x1="50" y1="95" x2="50" y2="85" stroke="currentColor" strokeWidth="4" />
            <line x1="5" y1="50" x2="15" y2="50" stroke="currentColor" strokeWidth="4" />
            <circle cx="50" cy="50" r="3" fill="currentColor" />
          </svg>
          <svg
            className="w-full h-full p-2 sm:p-2.5"
            viewBox="0 0 100 100"
            shapeRendering="geometricPrecision"
          >
            {renderedLayers}
          </svg>
        </div>
      </div>
    );
  };

const PatternIQGame: React.FC = () => {
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: MAX_LEVEL,
    initialLives: INITIAL_LIVES,
    timeLimit: TIME_LIMIT,
  });

  const { playSound } = useSound();
  const safeTimeout = useSafeTimeout();
  const feedback = useGameFeedback({ duration: 1500 });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;


  const [currentPattern, setCurrentPattern] = useState<PatternData | null>(null);
  const [options, setOptions] = useState<WagonState[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const setupRound = useCallback((lvl: number) => {
    const pat = generatePattern(lvl);
    setCurrentPattern(pat);
    setOptions(generateOptions(pat, WAGON_COUNT - 1));
    setRevealed(false);
    setSelectedIndex(null);
  }, []);

  useEffect(() => {
    if (engine.phase === "playing" && !currentPattern) {
      playSound("slide");
      setupRound(engine.level);
    } else if (engine.phase === "welcome") {
      setCurrentPattern(null);
      setOptions([]);
      setSelectedIndex(null);
      setRevealed(false);
    }
  }, [engine.phase, engine.level, setupRound, currentPattern, playSound]);

  const handleAnswer = useCallback((idx: number) => {
    if (engine.phase !== "playing" || revealed || !currentPattern || !!feedbackState) return;
    setSelectedIndex(idx);
    setRevealed(true);

    const targetState = calculateWagonState(currentPattern, WAGON_COUNT - 1);
    const correct = checkAnswer(options[idx], targetState);

    showFeedback(correct);
    playSound(correct ? "correct" : "incorrect");

    safeTimeout(() => {
      dismissFeedback();
      if (correct) {
        engine.addScore(10 * engine.level);
        if (engine.level >= MAX_LEVEL) {
          engine.setGamePhase("victory");
          playSound("success");
        } else {
          engine.nextLevel();
          setupRound(engine.level + 1);
        }
      } else {
        engine.loseLife();
        if (engine.lives > 1) {
          setupRound(engine.level);
        }
      }
    }, 1500);
  }, [engine, revealed, currentPattern, feedbackState, options, showFeedback, playSound, safeTimeout, dismissFeedback, setupRound]);

  const skipQuestion = useCallback(() => {
    if (engine.phase !== "playing" || revealed || !!feedbackState) return;
    engine.addScore(-10); // Penalty
    playSound("click");
    setupRound(engine.level);
  }, [engine, revealed, feedbackState, playSound, setupRound]);

  const checkAnswer = (opt: WagonState, target: WagonState) => {
    return opt.layerStates.every((ls, i) => {
      const cs = target.layerStates[i];
      if (!cs) return false;
      const r1 = ((ls.rotation % 360) + 360) % 360,
        r2 = ((cs.rotation % 360) + 360) % 360;
      return Math.abs(r1 - r2) < 0.1 && ls.position === cs.position;
    });
  };

  const extraHudItems = (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={skipQuestion}
      disabled={engine.phase !== "playing" || !!feedbackState}
      className={`flex items-center gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-slate-800 rounded-xl border-2 border-black/10 transition-all shadow-neo-sm font-nunito font-bold text-sm text-black dark:text-white ${engine.phase !== "playing" || !!feedbackState ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-50"}`}
    >
      <RefreshCw
        size={16}
        className="stroke-[3] text-black dark:text-white"
      />
      <span>Atla</span>
    </motion.button>
  );

  const gameConfig = {
    title: "PatternIQ Express",
    description: "Görsel örüntülerin gizemini çöz ve bir sonraki şekli tahmin et. Mantık ve dikkat yeteneğini zirveye taşı!",
    tuzoCode: "TUZÖ 5.5.1 Örüntü Analizi",
    icon: Shapes,
    accentColor: "cyber-pink",
    wideLayout: true,
    maxLevel: MAX_LEVEL,
    howToPlay: [
      <>Şekillerin nasıl değiştiğine <strong>dikkat et</strong></>,
      <>Oluşan <strong>örüntü kuralını bul</strong></>,
      <>Sıradaki vagonu <strong>en hızlı şekilde seç</strong></>,
    ],
    extraHudItems: engine.phase === "playing" || engine.phase === "feedback" ? extraHudItems : undefined,
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        currentPattern ? (
          <div className="w-full max-w-7xl mx-auto">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border-2 border-black/10 shadow-neo-sm mb-3 text-center relative overflow-hidden">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-nunito font-black uppercase tracking-widest mb-6 flex items-center justify-center gap-3">
                <Shapes size={20} className="text-cyber-green" strokeWidth={2.5} /> Örüntüyü Çöz
              </p>
              <div className="grid grid-cols-5 items-center gap-2 sm:gap-4 lg:gap-5 w-full max-w-7xl mx-auto pl-2 pr-2">
                {Array.from({ length: WAGON_COUNT }).map((_, idx) => {
                  const state = calculateWagonState(currentPattern, idx);
                  const isLast = idx === WAGON_COUNT - 1;
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-1 sm:gap-2"
                    >
                      <div className="w-full">
                        <WagonView
                          state={state}
                          pattern={currentPattern}
                          isQuestion={isLast}
                          isRevealed={revealed}
                          status={isLast && revealed ? (feedbackState?.correct ? "correct" : "wrong") : "default"}
                        />
                      </div>
                      {!isLast && (
                        <div className="w-2 sm:w-6 h-2 bg-black dark:bg-white rounded-full shrink-0 border-2 border-transparent" />
                      )}
                    </div>
                  );
                })}
              </div>
              {currentPattern.difficulty && (
                <div className="mt-4 text-center flex justify-center">
                  <span
                    className={`px-4 py-1.5 rounded-full text-xs font-nunito font-black uppercase tracking-widest border-2 border-black/10 shadow-neo-sm text-black ${currentPattern.difficulty === "Kolay" ? "bg-cyber-green" :
                      currentPattern.difficulty === "Orta" ? "bg-cyber-yellow" : "bg-cyber-pink"
                      }`}
                  >
                    {currentPattern.difficulty}
                  </span>
                </div>
              )}
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border-2 border-black/10 shadow-neo-sm max-w-6xl xl:max-w-7xl mx-auto mb-3">
              <h2 className="text-xs font-nunito font-black text-center mb-4 flex items-center justify-center gap-2 text-cyber-pink uppercase tracking-widest">
                <Sparkles size={16} className="stroke-[3]" />
                Sıradaki Vagon Hangisi?
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 px-2">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2">
                    <div className="w-full max-w-[160px] lg:max-w-[200px] xl:max-w-[220px]">
                      <WagonView
                        state={opt}
                        pattern={currentPattern}
                        onClick={() => handleAnswer(idx)}
                        status={
                          revealed
                            ? idx === selectedIndex
                              ? feedbackState?.correct
                                ? "correct"
                                : "wrong"
                              : checkAnswer(opt, calculateWagonState(currentPattern, WAGON_COUNT - 1))
                                ? "correct"
                                : "default"
                            : "default"
                        }
                      />
                    </div>
                    <span className="text-xs sm:text-sm font-nunito font-black text-black dark:text-white uppercase tracking-widest bg-slate-200 dark:bg-slate-700 px-5 py-2 rounded-full border-2 border-black/10 shadow-neo-sm">
                      SEÇENEK {String.fromCharCode(65 + idx)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : <></>
      )}
    </BrainTrainerShell>
  );
};
export default PatternIQGame;
