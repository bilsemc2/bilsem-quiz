import React, { useRef, useEffect, useState, useCallback } from 'react';
import { minutesToDegrees, degreesToMinutes, getAngle } from '../utils/clockUtils';

interface ClockProps {
  hours: number; // 0-12
  minutes: number; // 0-59
  isInteractive: boolean;
  onMinuteChange: (newMinutes: number) => void;
  onInteractionEnd?: () => void;
}

const Clock: React.FC<ClockProps> = ({ 
  hours, 
  minutes, 
  isInteractive, 
  onMinuteChange,
  onInteractionEnd
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Constants for clock dimensions
  const size = 300;
  const center = size / 2;
  const radius = size / 2 - 20;

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isInteractive) return;
    setIsDragging(true);
    e.preventDefault(); // Prevent scrolling on touch
  };

  const handleMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

    const deg = getAngle(
      rect.left + rect.width / 2, 
      rect.top + rect.height / 2, 
      clientX, 
      clientY
    );

    // Snap to nearest minute (6 degrees per minute)
    const rawMinutes = degreesToMinutes(deg);
    onMinuteChange(rawMinutes);
  }, [isDragging, onMinuteChange]);

  const handleEnd = useCallback(() => {
    setIsDragging(false);
    if (onInteractionEnd) onInteractionEnd();
  }, [onInteractionEnd]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove, { passive: false });
      window.addEventListener('touchend', handleEnd);
    } else {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, handleMove, handleEnd]);

  // Calculate hand angles
  const minuteAngle = minutesToDegrees(minutes);
  // Hour hand moves gradually based on minutes
  const hourAngle = (hours % 12) * 30 + (minutes / 60) * 30;

  // Generate clock numbers
  const renderNumbers = () => {
    const numbers = [];
    for (let i = 1; i <= 12; i++) {
      const angle = (i * 30) * (Math.PI / 180);
      // Adjust position: 0 angle is 3 o'clock in trig, but we want 12 at top
      // x = center + r * sin(a)
      // y = center - r * cos(a)
      const x = center + (radius - 40) * Math.sin(i * (Math.PI / 6));
      const y = center - (radius - 40) * Math.cos(i * (Math.PI / 6));
      
      numbers.push(
        <text
          key={i}
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-slate-600 text-xl font-bold font-sans pointer-events-none select-none"
        >
          {i}
        </text>
      );
    }
    return numbers;
  };

  // Generate ticks
  const renderTicks = () => {
    const ticks = [];
    for (let i = 0; i < 60; i++) {
      const isHour = i % 5 === 0;
      const angle = i * 6 * (Math.PI / 180);
      const innerR = isHour ? radius - 15 : radius - 10;
      const outerR = radius;
      
      const x1 = center + innerR * Math.sin(angle);
      const y1 = center - innerR * Math.cos(angle);
      const x2 = center + outerR * Math.sin(angle);
      const y2 = center - outerR * Math.cos(angle);

      ticks.push(
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={isHour ? "#475569" : "#94a3b8"}
          strokeWidth={isHour ? 3 : 1}
        />
      );
    }
    return ticks;
  };

  return (
    <div className="relative touch-none">
      <svg
        ref={svgRef}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="clock-shadow rounded-full bg-white block mx-auto"
      >
        {/* Clock Face Background */}
        <circle cx={center} cy={center} r={radius} fill="white" stroke="#e2e8f0" strokeWidth="4" />
        
        {/* Ticks and Numbers */}
        {renderTicks()}
        {renderNumbers()}

        {/* Hour Hand */}
        <line
          x1={center}
          y1={center}
          x2={center + (radius - 80) * Math.sin(hourAngle * (Math.PI / 180))}
          y2={center - (radius - 80) * Math.cos(hourAngle * (Math.PI / 180))}
          stroke="#1e293b"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* Minute Hand (Interactive) */}
        <g 
          className={`${isInteractive ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
          onMouseDown={handleStart}
          onTouchStart={handleStart}
        >
          {/* Invisible hit area for easier grabbing */}
          <line
            x1={center}
            y1={center}
            x2={center + (radius - 20) * Math.sin(minuteAngle * (Math.PI / 180))}
            y2={center - (radius - 20) * Math.cos(minuteAngle * (Math.PI / 180))}
            stroke="transparent"
            strokeWidth="40"
            strokeLinecap="round"
          />
          {/* Visible Hand */}
          <line
            x1={center}
            y1={center}
            x2={center + (radius - 20) * Math.sin(minuteAngle * (Math.PI / 180))}
            y2={center - (radius - 20) * Math.cos(minuteAngle * (Math.PI / 180))}
            stroke="#ef4444"
            strokeWidth="6"
            strokeLinecap="round"
            className="transition-transform duration-75 ease-out"
          />
          <circle cx={center} cy={center} r="6" fill="#ef4444" />
        </g>

        {/* Center Pin */}
        <circle cx={center} cy={center} r="4" fill="#cbd5e1" />
      </svg>
    </div>
  );
};

export default Clock;