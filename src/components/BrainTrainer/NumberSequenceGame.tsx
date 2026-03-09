import { TrendingUp } from "lucide-react";

import BrainTrainerShell from "./shared/BrainTrainerShell";
import NumberSequenceBoard from "./numberSequence/NumberSequenceBoard";
import {
  GAME_DESCRIPTION,
  GAME_TITLE,
  MAX_LEVEL,
  TUZO_TEXT,
} from "./numberSequence/constants";
import { useNumberSequenceController } from "./numberSequence/useNumberSequenceController";

const NumberSequenceGame: React.FC = () => {
  const { currentQuestion, engine, feedback, handleAnswer, isLocked, selectedAnswer } =
    useNumberSequenceController();

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: TrendingUp,
    accentColor: "cyber-blue",
    maxLevel: MAX_LEVEL,
    howToPlay: [
      <>Verilen sayı dizisindeki <strong>mantıksal kuralı</strong> bul</>,
      <>Eksik olan sayıyı seçeneklerden seç</>,
      <>Seviye arttıkça kurallar <strong>karmaşıklaşacak</strong></>,
    ]
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <NumberSequenceBoard
          currentQuestion={currentQuestion}
          isLocked={isLocked}
          onAnswer={handleAnswer}
          selectedAnswer={selectedAnswer}
        />
      )}
    </BrainTrainerShell>
  );
};

export default NumberSequenceGame;
