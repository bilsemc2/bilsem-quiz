import React from "react";
import { Calculator } from "lucide-react";

import BrainTrainerShell from "./shared/BrainTrainerShell";
import {
  GAME_DESCRIPTION,
  GAME_TITLE,
  MAX_LEVEL,
  TUZO_TEXT,
} from "./numberCipher/constants";
import NumberCipherBoard from "./numberCipher/NumberCipherBoard";
import { useNumberCipherController } from "./numberCipher/useNumberCipherController";

const NumberCipherGame: React.FC = () => {
  const {
    currentQuestion,
    engine,
    feedback,
    handleAnswer,
    selectedAnswer,
  } = useNumberCipherController();

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: Calculator,
    accentColor: "cyber-pink",
    maxLevel: MAX_LEVEL,
    howToPlay: [
      <>Verilen sayı <strong>örneklerini dikkatle incele</strong></>,
      <>Sayılar arasındaki <strong>gizli kuralı bul</strong></>,
      <>Soru işareti yerine gelecek <strong>doğru sayıyı seç</strong></>,
    ],
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() =>
        currentQuestion ? (
          <NumberCipherBoard
            currentQuestion={currentQuestion}
            feedbackActive={feedback.feedbackState !== null}
            onAnswer={handleAnswer}
            selectedAnswer={selectedAnswer}
          />
        ) : null}
    </BrainTrainerShell>
  );
};

export default NumberCipherGame;
