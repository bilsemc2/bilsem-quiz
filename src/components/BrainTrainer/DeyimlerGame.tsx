import { Languages } from "lucide-react";

import BrainTrainerShell from "./shared/BrainTrainerShell";
import DeyimlerBoard from "./deyimler/DeyimlerBoard";
import {
  GAME_DESCRIPTION,
  GAME_TITLE,
  MAX_LEVEL,
  TUZO_TEXT,
} from "./deyimler/constants";
import DeyimlerLoadingState from "./deyimler/DeyimlerLoadingState";
import { useDeyimlerController } from "./deyimler/useDeyimlerController";

const DeyimlerGame: React.FC = () => {
  const {
    currentQuestion,
    engine,
    feedback,
    handleAnswer,
    isLoading,
    selectedAnswer,
    showExplanation,
  } = useDeyimlerController();

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: Languages,
    accentColor: "cyber-pink",
    maxLevel: MAX_LEVEL,
    howToPlay: [
      "Ekrandaki deyimde eksik olan kelimeyi bul.",
      "4 seçenekten doğru kelimeyi seç.",
      "Doğru cevaptan sonra deyimin açıklamasını göreceksin!",
    ],
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() =>
        isLoading ? (
          <DeyimlerLoadingState />
        ) : (
          <DeyimlerBoard
            currentQuestion={currentQuestion}
            feedbackState={feedback.feedbackState}
            level={engine.level}
            onAnswer={handleAnswer}
            selectedAnswer={selectedAnswer}
            showExplanation={showExplanation}
          />
        )
      }
    </BrainTrainerShell>
  );
};

export default DeyimlerGame;
