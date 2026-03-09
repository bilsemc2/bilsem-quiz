import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { GAME_COLORS } from "../shared/gameColors";
import {
  degreesToMinutes,
  getAngle,
  minutesToDegrees,
} from "./logic";

interface TimeExplorerClockProps {
  hours: number;
  minutes: number;
  isInteractive: boolean;
  onMinuteChange: (newMinutes: number) => void;
}

const VIEWBOX_SIZE = 280;
const CENTER = VIEWBOX_SIZE / 2;
const RADIUS = VIEWBOX_SIZE / 2 - 20;

const TimeExplorerClock: React.FC<TimeExplorerClockProps> = ({
  hours,
  minutes,
  isInteractive,
  onMinuteChange,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleStart = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      if (!isInteractive) {
        return;
      }

      setIsDragging(true);
      event.preventDefault();
    },
    [isInteractive],
  );

  const handleMove = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (!isDragging || !svgRef.current) {
        return;
      }

      const rect = svgRef.current.getBoundingClientRect();
      const clientX =
        "touches" in event ? event.touches[0].clientX : event.clientX;
      const clientY =
        "touches" in event ? event.touches[0].clientY : event.clientY;
      const degrees = getAngle(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
        clientX,
        clientY,
      );

      onMinuteChange(degreesToMinutes(degrees));
    },
    [isDragging, onMinuteChange],
  );

  const handleEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (!isDragging) {
      return undefined;
    }

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleEnd);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [handleEnd, handleMove, isDragging]);

  const minuteAngle = minutesToDegrees(minutes);
  const hourAngle = (hours % 12) * 30 + (minutes / 60) * 30;

  const renderedNumbers = useMemo(() => {
    return Array.from({ length: 12 }, (_, index) => {
      const number = index + 1;
      const x = CENTER + (RADIUS - 35) * Math.sin(number * (Math.PI / 6));
      const y = CENTER - (RADIUS - 35) * Math.cos(number * (Math.PI / 6));

      return (
        <text
          key={number}
          x={x}
          y={y + 2}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-black dark:fill-white"
          style={{
            fontSize: 26,
            fontWeight: 900,
            fontFamily: "Nunito, sans-serif",
          }}
        >
          {number}
        </text>
      );
    });
  }, []);

  const renderedTicks = useMemo(() => {
    return Array.from({ length: 60 }, (_, index) => {
      const isHourTick = index % 5 === 0;
      const angle = index * 6 * (Math.PI / 180);
      const innerRadius = isHourTick ? RADIUS - 12 : RADIUS - 7;
      const outerRadius = RADIUS;

      return (
        <line
          key={index}
          x1={CENTER + innerRadius * Math.sin(angle)}
          y1={CENTER - innerRadius * Math.cos(angle)}
          x2={CENTER + outerRadius * Math.sin(angle)}
          y2={CENTER - outerRadius * Math.cos(angle)}
          stroke="currentColor"
          className={
            isHourTick
              ? "text-black dark:text-white"
              : "text-slate-400 dark:text-slate-500"
          }
          strokeWidth={isHourTick ? 4 : 2}
          strokeLinecap="round"
        />
      );
    });
  }, []);

  const minuteTipX =
    CENTER + (RADIUS - 18) * Math.sin(minuteAngle * (Math.PI / 180));
  const minuteTipY =
    CENTER - (RADIUS - 18) * Math.cos(minuteAngle * (Math.PI / 180));
  const hourTipX =
    CENTER + (RADIUS - 75) * Math.sin(hourAngle * (Math.PI / 180));
  const hourTipY =
    CENTER - (RADIUS - 75) * Math.cos(hourAngle * (Math.PI / 180));

  return (
    <div className="relative touch-none w-full max-w-[280px] sm:max-w-[320px] aspect-square mx-auto">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
        className="block w-full h-full overflow-visible drop-shadow-lg"
      >
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          className="fill-[#FAF9F6] dark:fill-slate-800"
          stroke="black"
          strokeWidth="5"
        />
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS - 8}
          fill="none"
          stroke="currentColor"
          className="text-slate-200 dark:text-slate-700"
          strokeWidth="1.5"
        />
        {renderedTicks}
        {renderedNumbers}
        <line
          x1={CENTER}
          y1={CENTER}
          x2={hourTipX}
          y2={hourTipY}
          stroke="currentColor"
          className="stroke-black dark:stroke-white"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <g
          className={
            isInteractive ? "cursor-grab active:cursor-grabbing" : "cursor-default"
          }
          onMouseDown={handleStart}
          onTouchStart={handleStart}
        >
          <line
            x1={CENTER}
            y1={CENTER}
            x2={minuteTipX}
            y2={minuteTipY}
            stroke="transparent"
            strokeWidth="40"
            strokeLinecap="round"
          />
          <line
            x1={CENTER}
            y1={CENTER}
            x2={minuteTipX}
            y2={minuteTipY}
            stroke="black"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <line
            x1={CENTER}
            y1={CENTER}
            x2={minuteTipX}
            y2={minuteTipY}
            stroke={GAME_COLORS.pink}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle
            cx={minuteTipX}
            cy={minuteTipY}
            r={isInteractive ? 16 : 10}
            fill={GAME_COLORS.pink}
            stroke="black"
            strokeWidth="4"
          />
          <circle cx={CENTER} cy={CENTER} r="10" fill="black" />
          <circle cx={CENTER} cy={CENTER} r="5" fill={GAME_COLORS.emerald} />
        </g>
      </svg>
    </div>
  );
};

export default TimeExplorerClock;
