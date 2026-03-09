import React from "react";
import { Plus } from "lucide-react";

import BrainTrainerShell from "./shared/BrainTrainerShell";
import StreamSumBoard from "./streamSum/StreamSumBoard";
import {
  GAME_DESCRIPTION,
  GAME_TITLE,
  MAX_LEVEL,
  TUZO_TEXT,
} from "./streamSum/constants";
import { useStreamSumController } from "./streamSum/useStreamSumController";

const StreamSumGame: React.FC = () => {
  const {
    current,
    engine,
    feedback,
    handleDelete,
    handleInput,
    input,
    previous,
    waitingForInput,
  } = useStreamSumController();

  return (
    <BrainTrainerShell
      engine={engine}
      feedback={feedback}
      config={{
        title: GAME_TITLE,
        icon: Plus,
        description: GAME_DESCRIPTION,
        howToPlay: [
          "Ekrana gelen sayıyı aklında tut.",
          "Yeni sayı gelince, onu bir öncekiyle topla.",
          "Toplamı ekran klavyesinden hızlıca gir.",
        ],
        tuzoCode: TUZO_TEXT,
        accentColor: "cyber-blue",
        maxLevel: MAX_LEVEL,
        wideLayout: true,
      }}
    >
      {({ phase }) => (
        <div className="w-full h-full flex flex-col items-center justify-center p-2">
          {phase === "playing" && current !== null ? (
            <StreamSumBoard
              current={current}
              feedbackState={feedback.feedbackState}
              input={input}
              onDelete={handleDelete}
              onDigit={handleInput}
              previous={previous}
              waitingForInput={waitingForInput}
            />
          ) : null}
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default StreamSumGame;
