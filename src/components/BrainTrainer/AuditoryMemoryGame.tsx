import React from "react";
import { Music } from "lucide-react";

import AuditoryMemoryBoard from "./auditoryMemory/AuditoryMemoryBoard";
import {
  GAME_DESCRIPTION,
  GAME_TITLE,
  MAX_LEVEL,
  TUZO_TEXT,
} from "./auditoryMemory/constants";
import { useAuditoryMemoryController } from "./auditoryMemory/useAuditoryMemoryController";
import BrainTrainerShell from "./shared/BrainTrainerShell";

const AuditoryMemoryGame: React.FC = () => {
  const {
    engine,
    feedback,
    localPhase,
    sequence,
    playerSequence,
    currentPlayIndex,
    activeNote,
    handleNoteClick,
  } = useAuditoryMemoryController();

  return (
    <BrainTrainerShell
      config={{
        title: GAME_TITLE,
        description: GAME_DESCRIPTION,
        tuzoCode: TUZO_TEXT,
        icon: Music,
        accentColor: "cyber-pink",
        maxLevel: MAX_LEVEL,
        wideLayout: true,
        howToPlay: [
          "Calinan nota dizisini dikkatle dinle.",
          "Dinleme bittikten sonra notalara ayni sirayla tikla.",
          "Diziler uzadikca melodiyi akilda tutmak zorlasacak.",
        ],
      }}
      engine={engine}
      feedback={feedback}
    >
      {({ phase, feedbackState }) => (
        <div className="relative z-10 flex flex-col items-center justify-center p-2 flex-1">
          {phase === "playing" ? (
            <AuditoryMemoryBoard
              localPhase={localPhase}
              sequence={sequence}
              playerSequence={playerSequence}
              currentPlayIndex={currentPlayIndex}
              activeNote={activeNote}
              feedbackState={feedbackState}
              onNoteClick={handleNoteClick}
            />
          ) : null}
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default AuditoryMemoryGame;
