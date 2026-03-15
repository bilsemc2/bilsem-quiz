import React from "react";
import { Headphones, Volume2, VolumeX } from "lucide-react";

import NoiseFilterBoard from "./noiseFilter/NoiseFilterBoard";
import {
  GAME_DESCRIPTION,
  GAME_TITLE,
  MAX_LEVEL,
  TUZO_TEXT,
} from "./noiseFilter/constants";
import { useNoiseFilterController } from "./noiseFilter/useNoiseFilterController";
import BrainTrainerShell from "./shared/BrainTrainerShell";

const NoiseFilterGame: React.FC = () => {
  const {
    backgroundVolume,
    currentRound,
    engine,
    feedback,
    handleOption,
    handleReplayTarget,
    isInteractionLocked,
    selectedOptionName,
    setBackgroundVolume,
  } = useNoiseFilterController();

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
        onChange={(event) =>
          setBackgroundVolume(Number.parseFloat(event.target.value))
        }
        aria-label="Arka plan gürültü seviyesi"
        className="w-16 sm:w-20 accent-cyber-purple"
      />
    </div>
  );

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: Headphones,
    accentColor: "cyber-purple",
    maxLevel: MAX_LEVEL,
    wideLayout: true,
    howToPlay: [
      <span key="h1">
        Arka plandaki gürültüye rağmen <strong>hedef sesi dinle</strong>
      </span>,
      <span key="h2">
        Ekranda bu sese ait olan <strong>görseli bul ve tıkla</strong>
      </span>,
      <span key="h3">
        Hatalı seçim yapmadan <strong>tüm seviyeleri tamamla</strong>
      </span>,
    ],
    extraHudItems,
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <NoiseFilterBoard
          canReplay={engine.phase === "playing" && currentRound !== null}
          feedbackState={feedback.feedbackState}
          isLocked={isInteractionLocked}
          options={currentRound?.options ?? []}
          selectedOptionName={selectedOptionName}
          targetSoundName={currentRound?.targetSound.name ?? null}
          onOptionSelect={handleOption}
          onReplayTarget={handleReplayTarget}
        />
      )}
    </BrainTrainerShell>
  );
};

export default NoiseFilterGame;
