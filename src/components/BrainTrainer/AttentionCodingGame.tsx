import React from "react";
import { Code2 } from "lucide-react";

import BrainTrainerShell from "./shared/BrainTrainerShell";
import AttentionCodingBoard from "./attentionCoding/AttentionCodingBoard";
import {
  GAME_DESCRIPTION,
  GAME_TITLE,
  MAX_LEVEL,
  TUZO_TEXT,
} from "./attentionCoding/constants";
import { useAttentionCodingController } from "./attentionCoding/useAttentionCodingController";

const AttentionCodingGame: React.FC = () => {
  const {
    availableShapes,
    currentIndex,
    engine,
    feedback,
    items,
    keyMappings,
    handleAnswer,
  } = useAttentionCodingController();

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: Code2,
    accentColor: "cyber-pink",
    maxLevel: MAX_LEVEL,
    howToPlay: [
      "Üstteki tablodan her sayıya karşılık gelen şekli bul",
      "Sorulan sayıya ait doğru şekli aşağıdaki butonlardan seç",
      "Tüm eşleştirmeleri hata yapmadan ve hızla tamamla"
    ]
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {({ phase }) => (
        <div className="relative z-10 flex flex-col items-center justify-center p-2 flex-1">
          {phase === "playing" && items.length > 0 ? (
            <AttentionCodingBoard
              availableShapes={availableShapes}
              currentIndex={currentIndex}
              items={items}
              keyMappings={keyMappings}
              onAnswer={handleAnswer}
            />
          ) : null}
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default AttentionCodingGame;
