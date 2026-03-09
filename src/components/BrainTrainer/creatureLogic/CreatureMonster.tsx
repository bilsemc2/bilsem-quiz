import React from "react";

import { COLOR_VALUES, STROKE_VALUES } from "./constants";
import type { Creature, CreatureAccessory, CreatureEmotion, CreatureShape } from "./types";

const SHAPE_PATHS: Record<CreatureShape, string> = {
  fluff:
    "M25,50 C20,35 35,20 50,30 C60,15 80,25 85,45 C95,50 90,70 80,80 C70,90 30,90 20,80 C10,70 15,55 25,50 Z",
  slime:
    "M50,15 C30,15 15,35 15,60 C15,85 25,90 30,85 C35,80 40,90 50,90 C60,90 65,80 70,85 C75,90 85,85 85,60 C85,35 70,15 50,15 Z",
  block: "M20,25 C20,15 80,15 80,25 L85,75 C85,85 15,85 15,75 L20,25 Z",
  spiky:
    "M50,15 L58,35 L80,30 L65,48 L85,65 L60,70 L50,90 L40,70 L15,65 L35,48 L20,30 L42,35 Z",
};

const CreatureFace: React.FC<{ emotion: CreatureEmotion }> = ({ emotion }) => {
  const eyeColor = "#1F2937";
  const normalEyes = (
    <>
      <circle cx="35" cy="50" r="5" fill={eyeColor} />
      <circle cx="65" cy="50" r="5" fill={eyeColor} />
      <circle cx="37" cy="48" r="2" fill="white" />
      <circle cx="67" cy="48" r="2" fill="white" />
    </>
  );

  if (emotion === "happy") {
    return (
      <g>
        <path d="M30 50 Q35 45 40 50" fill="none" stroke={eyeColor} strokeWidth="3" strokeLinecap="round" />
        <path d="M60 50 Q65 45 70 50" fill="none" stroke={eyeColor} strokeWidth="3" strokeLinecap="round" />
        <path d="M40 60 Q50 70 60 60" fill="none" stroke={eyeColor} strokeWidth="3" strokeLinecap="round" />
      </g>
    );
  }

  if (emotion === "sad") {
    return (
      <g>
        {normalEyes}
        <path d="M40 68 Q50 60 60 68" fill="none" stroke={eyeColor} strokeWidth="3" strokeLinecap="round" />
      </g>
    );
  }

  if (emotion === "surprised") {
    return (
      <g>
        {normalEyes}
        <ellipse cx="50" cy="65" rx="4" ry="6" fill={eyeColor} />
      </g>
    );
  }

  if (emotion === "angry") {
    return (
      <g>
        <path d="M30 45 L42 50" stroke={eyeColor} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M70 45 L58 50" stroke={eyeColor} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="38" cy="52" r="4" fill={eyeColor} />
        <circle cx="62" cy="52" r="4" fill={eyeColor} />
        <path d="M42 65 Q50 62 58 65" fill="none" stroke={eyeColor} strokeWidth="3" strokeLinecap="round" />
      </g>
    );
  }

  return (
    <g>
      <path d="M30 52 Q35 52 40 52" fill="none" stroke={eyeColor} strokeWidth="3" strokeLinecap="round" />
      <path d="M60 52 Q65 52 70 52" fill="none" stroke={eyeColor} strokeWidth="3" strokeLinecap="round" />
      <circle cx="50" cy="65" r="3" fill="none" stroke={eyeColor} strokeWidth="2" />
    </g>
  );
};

const CreatureAccessoryBadge: React.FC<{ accessory: CreatureAccessory }> = ({
  accessory,
}) => {
  if (accessory === "hat") {
    return (
      <g transform="translate(0,-10) rotate(-10,50,20)">
        <polygon points="30,30 50,5 70,30" fill="#FCD34D" stroke="#D97706" strokeWidth="2" />
        <circle cx="50" cy="5" r="4" fill="#EF4444" />
      </g>
    );
  }

  if (accessory === "glasses") {
    return (
      <g>
        <circle cx="35" cy="50" r="10" fill="rgba(255,255,255,0.4)" stroke="#0f172a" strokeWidth="2" />
        <circle cx="65" cy="50" r="10" fill="rgba(255,255,255,0.4)" stroke="#0f172a" strokeWidth="2" />
        <line x1="45" y1="50" x2="55" y2="50" stroke="#0f172a" strokeWidth="2" />
      </g>
    );
  }

  if (accessory === "bowtie") {
    return (
      <g transform="translate(0,35)">
        <path d="M50 55 L38 48 C35 45 35 55 38 60 L50 55 L62 60 C65 55 65 45 62 48 Z" fill="#EC4899" />
        <circle cx="50" cy="54" r="2" fill="#BE185D" />
      </g>
    );
  }

  if (accessory === "crown") {
    return (
      <g transform="translate(0,-12)">
        <path d="M30 35 L30 20 L40 30 L50 15 L60 30 L70 20 L70 35 Z" fill="#dcf126" stroke="#B45309" strokeWidth="2" />
      </g>
    );
  }

  return null;
};

interface CreatureMonsterProps {
  creature: Creature;
  size?: number;
}

const CreatureMonster: React.FC<CreatureMonsterProps> = ({
  creature,
  size = 80,
}) => {
  const fill = COLOR_VALUES[creature.color];
  const stroke = STROKE_VALUES[creature.color];

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="overflow-visible">
      <ellipse cx="50" cy="90" rx="30" ry="5" fill="black" opacity="0.1" />
      <path
        d={SHAPE_PATHS[creature.shape]}
        fill={fill}
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <CreatureFace emotion={creature.emotion} />
      <CreatureAccessoryBadge accessory={creature.accessory} />
    </svg>
  );
};

export default CreatureMonster;
