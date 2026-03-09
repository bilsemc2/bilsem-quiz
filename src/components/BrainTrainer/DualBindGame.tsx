import { Link2 } from "lucide-react";

import BrainTrainerShell from "./shared/BrainTrainerShell";
import DualBindBoard from "./dualBind/DualBindBoard";
import {
  GAME_DESCRIPTION,
  GAME_TITLE,
  MAX_LEVEL,
  TUZO_TEXT,
} from "./dualBind/constants";
import { useDualBindController } from "./dualBind/useDualBindController";

const DualBindGame: React.FC = () => {
  const {
    countdown,
    currentQuestion,
    engine,
    feedback,
    handleAnswer,
    isLocked,
    localPhase,
    symbolColors,
  } = useDualBindController();

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: Link2,
    accentColor: "cyber-pink",
    maxLevel: MAX_LEVEL,
    howToPlay: [
      "Şekil ve renk eşleşmelerini kısa sürede ezberle.",
      "'Bu renk hangi şekildi?' veya 'Bu şekil hangi renkti?' sorularını cevapla.",
      "20 seviyeyi tamamlayarak şampiyonluğa ulaş!"
    ]
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {({ phase }) =>
        phase === "playing" ? (
          <div className="relative z-10 flex flex-1 w-full max-w-2xl mx-auto flex-col items-center justify-center p-2">
            <DualBindBoard
              countdown={countdown}
              currentQuestion={currentQuestion}
              isLocked={isLocked}
              localPhase={localPhase}
              onAnswer={handleAnswer}
              symbolColors={symbolColors}
            />
          </div>
        ) : null
      }
    </BrainTrainerShell>
  );
};

export default DualBindGame;
