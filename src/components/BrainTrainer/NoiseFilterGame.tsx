import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Volume2, VolumeX, XCircle, Headphones, CheckCircle2 } from "lucide-react";
import { useSound } from "../../hooks/useSound";
import { useSafeTimeout } from '../../hooks/useSafeTimeout';
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";
import {
  sounds,
  SoundItem,
  shuffleArray,
  getRandomElement,
  AUDIO_BASE_PATH,
  IMAGE_BASE_PATH,
  BACKGROUND_AUDIO,
} from "./noiseFilterData";

const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 10;
const GAME_ID = "gurultu-filtresi";
const NUMBER_OF_OPTIONS = 10;
const NoiseFilterGame: React.FC = () => {
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
  const { phase, level, addScore, loseLife, nextLevel } = engine;

  const [backgroundVolume, setBackgroundVolume] = useState(0.4);
  const [targetSound, setTargetSound] = useState<SoundItem | null>(null);
  const [options, setOptions] = useState<SoundItem[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const bgAudioRef = useRef<HTMLAudioElement | null>(null);
  const targetAudioRef = useRef<HTMLAudioElement | null>(null);
  const safelyPlay = useCallback((audio: HTMLAudioElement | null) => {
    if (!audio) return;
    audio.play().catch(() => {
      // Some browsers block autoplay until the next gesture.
    });
  }, []);

  useEffect(() => {
    bgAudioRef.current = new Audio(BACKGROUND_AUDIO);
    bgAudioRef.current.loop = true;
    bgAudioRef.current.volume = 0.4; // Initial volume

    return () => {
      bgAudioRef.current?.pause();
      bgAudioRef.current = null;
      targetAudioRef.current?.pause();
      targetAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (bgAudioRef.current) bgAudioRef.current.volume = backgroundVolume;
  }, [backgroundVolume]);

  const setupRound = useCallback(() => {
    const target = getRandomElement(sounds);
    if (!target) return;

    setTargetSound(target);
    setSelectedOption(null);

    const others = shuffleArray(
      sounds.filter((s) => s.name !== target.name),
    ).slice(0, NUMBER_OF_OPTIONS - 1);

    setOptions(shuffleArray([target, ...others]));

    safeTimeout(() => {
      targetAudioRef.current?.pause();
      targetAudioRef.current = new Audio(AUDIO_BASE_PATH + target.file);
      safelyPlay(targetAudioRef.current);
    }, 500);
  }, [safelyPlay]);

  useEffect(() => {
    if (phase === "welcome") {
      setTargetSound(null);
      setOptions([]);
      setSelectedOption(null);
      bgAudioRef.current?.pause();
      targetAudioRef.current?.pause();
    } else if (phase === "playing") {
      if (bgAudioRef.current?.paused) {
        safelyPlay(bgAudioRef.current);
      }
      if (!targetSound) {
        if (bgAudioRef.current) {
          bgAudioRef.current.currentTime = 0;
          safelyPlay(bgAudioRef.current);
        }
        setupRound();
        playSound("click");
      }
    } else if (phase === "game_over" || phase === "victory") {
      bgAudioRef.current?.pause();
      targetAudioRef.current?.pause();
    }
  }, [phase, setupRound, playSound, safelyPlay, targetSound]);

  useEffect(() => {
    if (phase !== "playing") return;

    const resumeBackground = () => {
      if (bgAudioRef.current?.paused) {
        safelyPlay(bgAudioRef.current);
      }
    };

    window.addEventListener("pointerdown", resumeBackground, { passive: true });
    window.addEventListener("keydown", resumeBackground);

    return () => {
      window.removeEventListener("pointerdown", resumeBackground);
      window.removeEventListener("keydown", resumeBackground);
    };
  }, [phase, safelyPlay]);

  const handleOption = (sound: SoundItem) => {
    if (phase !== "playing" || selectedOption !== null || !targetSound) return;

    setSelectedOption(sound.name);
    const correct = sound.name === targetSound.name;
    showFeedback(correct);
    playSound(correct ? "correct" : "wrong");

    targetAudioRef.current?.pause();

    safeTimeout(() => {
      dismissFeedback();
      if (correct) {
        addScore(20 * level);
        nextLevel();
        if (level < MAX_LEVEL) {
          setupRound();
        }
      } else {
        loseLife();
        if (engine.lives > 1) { // Checked internally by hook
          setupRound();
        }
      }
    }, 1500);
  };

  const extraHudItems = (
    <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-slate-800 border-2 border-black/10 rounded-xl shadow-neo-sm rotate-1">
      {backgroundVolume > 0 ? (
        <Volume2 className="text-cyber-purple" size={18} strokeWidth={3} />
      ) : (
        <VolumeX className="text-cyber-purple" size={18} strokeWidth={3} />
      )}
      <input
        type="range"
        min="0"
        max="1"
        step="0.1"
        value={backgroundVolume}
        onChange={(e) => setBackgroundVolume(parseFloat(e.target.value))}
        className="w-16 sm:w-20 accent-cyber-purple"
      />
    </div>
  );

  const gameConfig = {
    title: "Gürültü Filtresi",
    description: "Gürültülü ortamlarda bile hedef sesi ayırt edebilme yeteneğini geliştir. Dikkatini odakla ve doğru sesi bul!",
    tuzoCode: "TUZÖ 5.7.1 Seçici Dikkat",
    icon: Headphones,
    accentColor: "cyber-purple",
    maxLevel: MAX_LEVEL,
    wideLayout: true,
    howToPlay: [
      <>Arka plandaki gürültüye rağmen <strong>hedef sesi dinle</strong></>,
      <>Ekranda bu sese ait olan <strong>görseli bul ve tıkla</strong></>,
      <>Hatalı seçim yapmadan <strong>tüm seviyeleri tamamla</strong></>,
    ],
    extraHudItems: phase === "playing" || phase === "feedback" ? extraHudItems : null
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <div className="w-full max-w-6xl flex flex-col items-center gap-8">
          <div className="text-center relative">
            <p className="text-black dark:text-white font-nunito font-black uppercase text-xl sm:text-2xl mb-6 bg-cyber-blue text-white px-6 py-2 border-2 border-black/10 rounded-full shadow-neo-sm rotate-1 inline-block">
              Duyduğun Sesi Seç 🎧
            </p>

            <div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  targetAudioRef.current?.pause();
                  targetAudioRef.current = new Audio(
                    AUDIO_BASE_PATH + targetSound?.file,
                  );
                  safelyPlay(targetAudioRef.current);
                }}
                disabled={phase !== "playing"}
                className="px-8 py-4 bg-cyber-purple text-black dark:text-white border-2 border-black/10 font-nunito font-black text-lg uppercase tracking-widest shadow-neo-sm hover:shadow-neo-sm active:translate-y-[4px] active:translate-x-[4px] active:shadow-none rounded-[2rem] flex items-center gap-3 transition-all mx-auto"
              >
                <Headphones size={28} className="stroke-[3]" />
                <span>Sesi Tekrar Dinle</span>
              </motion.button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8 w-full">
            {options.map((sound) => {
              const isSelected = sound.name === selectedOption;
              const isTarget = sound.name === targetSound?.name;
              const showOk = !!feedbackState && isTarget;
              const showErr =
                !!feedbackState && isSelected && !isTarget;

              let bgColor = "bg-white dark:bg-slate-800";
              if (showOk) bgColor = "bg-cyber-green";
              if (showErr) bgColor = "bg-cyber-pink";
              else if (isSelected) bgColor = "bg-cyber-blue";

              return (
                <motion.button
                  key={sound.name}
                  whileTap={phase === "playing" && !feedbackState ? { scale: 0.95 } : {}}
                  onClick={() => handleOption(sound)}
                  disabled={phase !== "playing" || !!feedbackState}
                  className={`relative aspect-square rounded-[2rem] overflow-hidden border-2 border-black/10 transition-all group ${bgColor} ${isSelected ? "shadow-[8px_8px_0_rgba(0,0,0,1)]" : "shadow-neo-sm hover:shadow-neo-sm"}`}
                >
                  <img
                    src={IMAGE_BASE_PATH + sound.image}
                    alt={sound.name}
                    className={`w-full h-full object-cover p-2 ${!!feedbackState && !isTarget && !isSelected ? "opacity-30 grayscale" : ""}`}
                  />
                  {showOk && (
                    <div className="absolute inset-0 bg-cyber-green/40 flex items-center justify-center backdrop-blur-[2px]">
                      <CheckCircle2
                        size={64}
                        className="text-black drop-shadow-[4px_4px_0_rgba(255,255,255,1)]"
                        strokeWidth={3}
                      />
                    </div>
                  )}
                  {showErr && (
                    <div className="absolute inset-0 bg-cyber-pink/40 flex items-center justify-center backdrop-blur-[2px]">
                      <XCircle
                        size={64}
                        className="text-black drop-shadow-[4px_4px_0_rgba(255,255,255,1)]"
                        strokeWidth={3}
                      />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-black/90 p-2 border-t-4 border-black/10">
                    <p className="text-xs sm:text-sm font-nunito font-black text-white truncate text-center uppercase">
                      {sound.name}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}
    </BrainTrainerShell>
  );
};
export default NoiseFilterGame;
