import React, { useCallback, useRef, useState } from "react";

import type { FeedbackState } from "../../../hooks/useGameFeedback";
import { SELECTION_SIZE } from "./constants";
import { getSelectionFromPointer } from "./logic";
import type { PuzzleLevelData, SelectionPosition } from "./types";

interface PuzzleMasterCanvasProps {
  feedbackState: FeedbackState | null;
  isLoading: boolean;
  levelData: PuzzleLevelData | null;
  selection: SelectionPosition;
  onSelectionChange: (selection: SelectionPosition) => void;
}

const PuzzleMasterCanvas: React.FC<PuzzleMasterCanvasProps> = ({
  feedbackState,
  isLoading,
  levelData,
  selection,
  onSelectionChange,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const boardRef = useRef<HTMLDivElement | null>(null);

  const updateSelection = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      if (feedbackState || isLoading || !boardRef.current) {
        return;
      }

      const rect = boardRef.current.getBoundingClientRect();
      const clientX =
        "touches" in event ? event.touches[0]?.clientX ?? 0 : event.clientX;
      const clientY =
        "touches" in event ? event.touches[0]?.clientY ?? 0 : event.clientY;

      onSelectionChange(
        getSelectionFromPointer({
          clientX,
          clientY,
          rectLeft: rect.left,
          rectTop: rect.top,
          rectWidth: rect.width,
          rectHeight: rect.height,
        }),
      );
    },
    [feedbackState, isLoading, onSelectionChange],
  );

  const selectionClass = feedbackState?.correct
    ? "border-cyber-green bg-cyber-green/20"
    : feedbackState?.correct === false
      ? "border-cyber-pink bg-cyber-pink/20"
      : isDragging
        ? "border-white bg-white/10"
        : "border-white/80";

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 sm:p-4 border-2 border-black/10 shadow-neo-sm w-full relative flex justify-center">
      <div
        id="puzzle-board"
        ref={boardRef}
        className={`relative w-full aspect-square max-w-[480px] lg:max-w-[540px] rounded-xl overflow-hidden border-2 border-black/10 cursor-crosshair touch-none ${isLoading ? "opacity-50" : "opacity-100"} transition-opacity`}
        onMouseDown={(event) => {
          if (isLoading || feedbackState) {
            return;
          }

          setIsDragging(true);
          updateSelection(event);
        }}
        onMouseMove={(event) => {
          if (isDragging) {
            updateSelection(event);
          }
        }}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onTouchStart={(event) => {
          if (isLoading || feedbackState) {
            return;
          }

          setIsDragging(true);
          updateSelection(event);
        }}
        onTouchMove={(event) => {
          if (isDragging) {
            updateSelection(event);
          }
        }}
        onTouchEnd={() => setIsDragging(false)}
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M20 0v20H0V0h20zm-1 1H1v18h18V1z\' fill=\'%23000\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")',
          backgroundColor: "#e2e8f0",
        }}
      >
        {isLoading ? (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <div className="w-12 h-12 border-6 border-cyber-pink border-t-black rounded-full animate-spin" />
            <span className="mt-3 font-nunito font-black uppercase text-black dark:text-white text-sm">
              Oluşturuluyor...
            </span>
          </div>
        ) : null}

        {levelData?.imageUrl ? (
          <img
            src={levelData.imageUrl}
            className="w-full h-full object-cover select-none pointer-events-none"
            draggable={false}
            alt="Chaotic pattern board"
          />
        ) : null}

        <div
          className={`absolute pointer-events-none transition-all duration-100 border-[6px] rounded-xl shadow-[0_0_0_2px_rgba(0,0,0,0.8)_inset,0_0_20px_rgba(0,0,0,0.5)] ${selectionClass}`}
          style={{
            left: `${(selection.x / 512) * 100}%`,
            top: `${(selection.y / 512) * 100}%`,
            width: `${(SELECTION_SIZE / 512) * 100}%`,
            height: `${(SELECTION_SIZE / 512) * 100}%`,
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center opacity-50">
            <div className="w-full h-1 bg-black/80" />
            <div className="h-full w-1 bg-black/80 absolute" />
            <div className="w-full h-0.5 bg-white absolute" />
            <div className="h-full w-0.5 bg-white absolute" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PuzzleMasterCanvas;
