import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { Clock, ArrowRight, ArrowLeft } from "lucide-react";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useSound } from "../../hooks/useSound";
import { useSafeTimeout } from '../../hooks/useSafeTimeout';
import { GAME_COLORS } from './shared/gameColors';

const GAME_ID = "zaman-gezgini";
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;

const getRandomTime = (level: number): Date => {
  const date = new Date();
  const hours = Math.floor(Math.random() * 12) + 1;
  const granularity = level <= 5 ? 5 : level <= 10 ? 5 : level <= 15 ? 1 : 1;
  const maxMinute = 60 / granularity;
  const minutes = Math.floor(Math.random() * maxMinute) * granularity;
  date.setHours(hours);
  date.setMinutes(minutes);
  date.setSeconds(0);
  return date;
};

const addMinutes = (date: Date, minutes: number): Date => {
  const newDate = new Date(date);
  newDate.setMinutes(date.getMinutes() + minutes);
  return newDate;
};

const getTargetOffset = (level: number): number => {
  if (level <= 3) return 5;
  if (level <= 6) return 10;
  if (level <= 9) return 30;
  if (level <= 12) return 40;
  if (level <= 15) return 50;
  if (level <= 17) return 60;
  if (level <= 19) return -(Math.random() > 0.5 ? 10 : 15);
  return -(Math.random() > 0.5 ? 15 : 20);
};

const minutesToDegrees = (minutes: number): number => (minutes / 60) * 360;

const degreesToMinutes = (degrees: number): number => {
  let d = degrees % 360;
  if (d < 0) d += 360;
  const minutes = Math.round((d / 360) * 60);
  return minutes === 60 ? 0 : minutes;
};

const getAngle = (centerX: number, centerY: number, mouseX: number, mouseY: number): number => {
  const x = mouseX - centerX;
  const y = mouseY - centerY;
  const rad = Math.atan2(y, x);
  let deg = rad * (180 / Math.PI);
  deg += 90;
  if (deg < 0) deg += 360;
  return deg;
};

interface InlineClockProps {
  hours: number;
  minutes: number;
  isInteractive: boolean;
  onMinuteChange: (newMinutes: number) => void;
}

const InlineClock: React.FC<InlineClockProps> = ({ hours, minutes, isInteractive, onMinuteChange }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Use a fixed viewBox coordinate system — SVG scales to any container size
  const vb = 280;
  const center = vb / 2;
  const radius = vb / 2 - 20;

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isInteractive) return;
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      const deg = getAngle(rect.left + rect.width / 2, rect.top + rect.height / 2, clientX, clientY);
      onMinuteChange(degreesToMinutes(deg));
    },
    [isDragging, onMinuteChange]
  );

  const handleEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleEnd);
      window.addEventListener("touchmove", handleMove, { passive: false });
      window.addEventListener("touchend", handleEnd);
    } else {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    }
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [isDragging, handleMove, handleEnd]);

  const minuteAngle = minutesToDegrees(minutes);
  const hourAngle = (hours % 12) * 30 + (minutes / 60) * 30;

  const renderedNumbers = useMemo(() => {
    const numbers = [];
    for (let i = 1; i <= 12; i++) {
      const x = center + (radius - 35) * Math.sin(i * (Math.PI / 6));
      const y = center - (radius - 35) * Math.cos(i * (Math.PI / 6));
      numbers.push(
        <text
          key={i}
          x={x}
          y={y + 2}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-black dark:fill-white"
          style={{ fontSize: 26, fontWeight: 900, fontFamily: 'Nunito, sans-serif' }}
        >
          {i}
        </text>
      );
    }
    return numbers;
  }, [center, radius]);

  const renderedTicks = useMemo(() => {
    const ticks = [];
    for (let i = 0; i < 60; i++) {
      const isHour = i % 5 === 0;
      const angle = i * 6 * (Math.PI / 180);
      const innerR = isHour ? radius - 12 : radius - 7;
      const outerR = radius;
      ticks.push(
        <line
          key={i}
          x1={center + innerR * Math.sin(angle)}
          y1={center - innerR * Math.cos(angle)}
          x2={center + outerR * Math.sin(angle)}
          y2={center - outerR * Math.cos(angle)}
          stroke="currentColor"
          className={isHour ? "text-black dark:text-white" : "text-slate-400 dark:text-slate-500"}
          strokeWidth={isHour ? 4 : 2}
          strokeLinecap="round"
        />
      );
    }
    return ticks;
  }, [center, radius]);

  const minTipX = center + (radius - 18) * Math.sin(minuteAngle * (Math.PI / 180));
  const minTipY = center - (radius - 18) * Math.cos(minuteAngle * (Math.PI / 180));
  const hourTipX = center + (radius - 75) * Math.sin(hourAngle * (Math.PI / 180));
  const hourTipY = center - (radius - 75) * Math.cos(hourAngle * (Math.PI / 180));

  return (
    <div className="relative touch-none w-full max-w-[280px] sm:max-w-[320px] aspect-square mx-auto">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${vb} ${vb}`}
        className="block w-full h-full overflow-visible drop-shadow-lg"
      >
        {/* Face */}
        <circle cx={center} cy={center} r={radius} className="fill-[#FAF9F6] dark:fill-slate-800" stroke="black" strokeWidth="5" />
        <circle cx={center} cy={center} r={radius - 8} fill="none" stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth="1.5" />
        {renderedTicks}
        {renderedNumbers}
        {/* Hour hand */}
        <line x1={center} y1={center} x2={hourTipX} y2={hourTipY} stroke="currentColor" className="stroke-black dark:stroke-white" strokeWidth="8" strokeLinecap="round" />
        {/* Minute hand (draggable) */}
        <g className={`${isInteractive ? "cursor-grab active:cursor-grabbing" : "cursor-default"}`} onMouseDown={handleStart} onTouchStart={handleStart}>
          <line x1={center} y1={center} x2={minTipX} y2={minTipY} stroke="transparent" strokeWidth="40" strokeLinecap="round" />
          <line x1={center} y1={center} x2={minTipX} y2={minTipY} stroke="black" strokeWidth="10" strokeLinecap="round" />
          <line x1={center} y1={center} x2={minTipX} y2={minTipY} stroke={GAME_COLORS.pink} strokeWidth="4" strokeLinecap="round" />
          <circle cx={minTipX} cy={minTipY} r={isInteractive ? 16 : 10} fill={GAME_COLORS.pink} stroke="black" strokeWidth="4" />
          <circle cx={center} cy={center} r="10" fill="black" />
          <circle cx={center} cy={center} r="5" fill={GAME_COLORS.emerald} />
        </g>
      </svg>
    </div>
  );
};

const TimeExplorerGame: React.FC = () => {
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: MAX_LEVEL,
    timeLimit: TIME_LIMIT,
    initialLives: INITIAL_LIVES,
  });

  const feedback = useGameFeedback({ duration: 1500 });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;
  const { playSound } = useSound();
  const safeTimeout = useSafeTimeout();
  const { phase, level, addScore, loseLife, nextLevel, setGamePhase } = engine;

  const [questionTime, setQuestionTime] = useState<Date>(new Date());
  const [targetOffset, setTargetOffset] = useState(5);
  const [userMinutes, setUserMinutes] = useState(0);
  const [displayHour, setDisplayHour] = useState(0);
  const [needsNewQuestion, setNeedsNewQuestion] = useState(false);
  const prevMinutesRef = useRef(0);

  const generateQuestion = useCallback((lvl: number) => {
    const newTime = getRandomTime(lvl);
    const newOffset = getTargetOffset(lvl);
    setQuestionTime(newTime);
    setTargetOffset(newOffset);
    setUserMinutes(newTime.getMinutes());
    setDisplayHour(newTime.getHours());
    prevMinutesRef.current = newTime.getMinutes();
    setNeedsNewQuestion(false);
  }, []);

  useEffect(() => {
    if (phase === "playing" && needsNewQuestion) {
      generateQuestion(level);
    }
  }, [phase, needsNewQuestion, level, generateQuestion]);

  // Initial question on game start
  useEffect(() => {
    if (phase === "playing") {
      generateQuestion(level);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const handleMinuteChange = useCallback((newMinutes: number) => {
    if (phase !== "playing" || feedbackState) return;

    const prev = prevMinutesRef.current;
    if (prev > 45 && newMinutes < 15) {
      setDisplayHour((h) => (h % 12) + 1);
    } else if (prev < 15 && newMinutes > 45) {
      setDisplayHour((h) => ((h - 2 + 12) % 12) + 1);
    }
    prevMinutesRef.current = newMinutes;
    setUserMinutes(newMinutes);
  }, [phase, feedbackState]);

  const checkAnswer = useCallback(() => {
    if (phase !== "playing" || feedbackState) return;

    const targetTime = addMinutes(questionTime, targetOffset);
    const targetMin = targetTime.getMinutes();
    const isCorrect = userMinutes === targetMin;

    const msg = isCorrect
      ? "Doğru zaman!"
      : `Doğru cevap: ${targetTime.getHours()}:${targetMin.toString().padStart(2, "0")}`;

    showFeedback(isCorrect, msg);
    playSound(isCorrect ? "correct" : "incorrect");

    if (isCorrect) {
      addScore(10 * level);

      safeTimeout(() => {
        dismissFeedback();
        if (level >= MAX_LEVEL) {
          setGamePhase("victory");
          playSound("success");
        } else {
          nextLevel();
          setNeedsNewQuestion(true);
          playSound("slide");
        }
      }, 1500);
    } else {
      loseLife();

      safeTimeout(() => {
        dismissFeedback();
        setNeedsNewQuestion(true);
      }, 1500);
    }
  }, [phase, feedbackState, questionTime, targetOffset, userMinutes, showFeedback, dismissFeedback, playSound, addScore, level, nextLevel, loseLife, setGamePhase, safeTimeout]);

  const isForward = targetOffset >= 0;
  const OffsetIcon = isForward ? ArrowRight : ArrowLeft;

  return (
    <BrainTrainerShell
      engine={engine}
      feedback={feedback}
      config={{
        title: "Zaman Gezgini",
        icon: Clock,
        description: "Saati oku, yelkovanı sürükle ve doğru zamanı göster! Seviyeler ilerledikçe dakika farkları büyür ve oyun hızlanır.",
        howToPlay: [
          "Hedeften kaç dakika ileri veya geri gitmen gerektiğini oku.",
          "Saati ayarlamak için yelkovanı (kırmızı ibre) sürükle.",
          "Doğru zamanı bulduğunda KONTROL ET butonuna bas.",
        ],
        tuzoCode: "5.2.1 Sayısal Akıl Yürütme",
        accentColor: "cyber-yellow",
        maxLevel: MAX_LEVEL,
      }}
    >
      {() => (
        <div className="w-full flex-1 flex items-center justify-center p-2 sm:p-4">
          {phase === "playing" && (
            <motion.div
              key={`round-${level}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-4xl"
            >
              {/* Desktop: side-by-side | Mobile: stacked */}
              <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-3 sm:gap-5 items-center">

                {/* LEFT: Clock */}
                <div className="flex flex-col items-center gap-2">
                  <InlineClock
                    hours={displayHour}
                    minutes={userMinutes}
                    isInteractive={phase === "playing" && !feedbackState}
                    onMinuteChange={handleMinuteChange}
                  />
                  <p className="text-slate-500 dark:text-slate-400 font-nunito font-medium text-xs sm:text-sm text-center">
                    {!feedbackState ? "☝️ Yelkovanı sürükle!" : "Değerlendiriliyor..."}
                  </p>
                </div>

                {/* RIGHT: Question + Answer + Button */}
                <div className="flex flex-col gap-3 sm:gap-4">

                  {/* Question */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-2 border-black/10 shadow-neo-sm">
                    <p className="text-slate-400 dark:text-slate-500 font-nunito font-bold uppercase tracking-widest text-[10px] sm:text-xs mb-2 text-center">GÖREV</p>
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                      <span className="text-3xl sm:text-4xl font-nunito font-black text-black dark:text-white drop-shadow-sm">
                        {questionTime.getHours()}:{questionTime.getMinutes().toString().padStart(2, "0")}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 font-nunito font-black px-3 py-1.5 text-sm sm:text-base text-black border-2 border-black/10 rounded-xl shadow-neo-sm ${isForward ? "bg-cyber-green" : "bg-cyber-pink"}`}>
                        <OffsetIcon size={16} strokeWidth={3} />
                        {Math.abs(targetOffset)} dk
                      </span>
                    </div>
                  </div>

                  {/* Answer display */}
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl px-4 py-3 sm:px-6 sm:py-4 border-2 border-black/10 shadow-neo-sm flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-nunito font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Cevabın</span>
                    <span className="text-2xl sm:text-3xl font-nunito font-black text-cyber-blue drop-shadow-sm">
                      {displayHour}:{userMinutes.toString().padStart(2, "0")}
                    </span>
                  </div>

                  {/* Submit button */}
                  {!feedbackState && (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={checkAnswer}
                      className="w-full px-6 py-4 sm:py-5 bg-cyber-green text-black font-nunito font-black text-base sm:text-lg uppercase tracking-widest border-2 border-black/10 shadow-neo-sm rounded-2xl hover:-translate-y-1 active:translate-y-1 active:shadow-none transition-all"
                    >
                      ✓ KONTROL ET
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default TimeExplorerGame;
