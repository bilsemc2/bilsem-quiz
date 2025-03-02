import React from 'react';

export interface Letter {
  id: string;
  type: 'letter';
  value: string;
  svg: React.ReactNode;
}

const turkishAlphabet = [
  'A', 'B', 'C', 'Ç', 'D', 'E', 'F', 'G', 'Ğ', 'H',
  'I', 'İ', 'J', 'K', 'L', 'M', 'N', 'O', 'Ö', 'P',
  'R', 'S', 'Ş', 'T', 'U', 'Ü', 'V', 'Y', 'Z'
];

export const letters: Letter[] = turkishAlphabet.map(letter => ({
  id: `letter-${letter}`,
  type: 'letter',
  value: letter,
  svg: (
    <svg viewBox="0 0 40 40" className="w-full h-full">
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize="24"
        fill="currentColor"
        fontWeight="bold"
      >
        {letter}
      </text>
    </svg>
  )
}));
