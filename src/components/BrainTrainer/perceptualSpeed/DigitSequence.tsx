import React from "react";

interface DigitSequenceProps {
  value: string;
}

const DigitSequence: React.FC<DigitSequenceProps> = ({ value }) => (
  <div className="w-full max-w-3xl px-1 sm:px-2">
    <div
      className="grid items-center justify-items-center gap-1 sm:gap-2"
      style={{ gridTemplateColumns: `repeat(${value.length}, minmax(0, 1fr))` }}
    >
      {value.split("").map((digit, index) => (
        <span
          key={`${value}-${index}`}
          className="font-mono font-bold text-[clamp(1.6rem,6.8vw,3.8rem)] md:text-[clamp(2rem,5.4vw,5rem)] leading-none text-black dark:text-white drop-shadow-neo-sm sm:drop-shadow-neo-sm tabular-nums select-none"
        >
          {digit}
        </span>
      ))}
    </div>
  </div>
);

export default DigitSequence;
