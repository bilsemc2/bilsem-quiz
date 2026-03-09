import React from "react";

import type { FeedbackState } from "../../../hooks/useGameFeedback";
import AuditoryMemoryAnsweringView from "./AuditoryMemoryAnsweringView";
import AuditoryMemoryListeningView from "./AuditoryMemoryListeningView";
import type { LocalPhase } from "./types";

interface AuditoryMemoryBoardProps {
  localPhase: LocalPhase;
  sequence: number[];
  playerSequence: number[];
  currentPlayIndex: number;
  activeNote: number | null;
  feedbackState: FeedbackState | null;
  onNoteClick: (noteIndex: number) => void;
}

const AuditoryMemoryBoard: React.FC<AuditoryMemoryBoardProps> = ({
  localPhase,
  sequence,
  playerSequence,
  currentPlayIndex,
  activeNote,
  feedbackState,
  onNoteClick,
}) => {
  if (feedbackState) {
    return null;
  }

  if (localPhase === "listening") {
    return (
      <AuditoryMemoryListeningView
        sequence={sequence}
        currentPlayIndex={currentPlayIndex}
      />
    );
  }

  if (localPhase === "answering") {
    return (
      <AuditoryMemoryAnsweringView
        sequence={sequence}
        playerSequence={playerSequence}
        activeNote={activeNote}
        onNoteClick={onNoteClick}
      />
    );
  }

  return null;
};

export default AuditoryMemoryBoard;
