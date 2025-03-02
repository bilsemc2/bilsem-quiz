import React from 'react';

export interface Number {
  id: string;
  type: 'number';
  value: string;
  svg: React.ReactNode;
}

interface CreateNumberParams {
  id: string;
  value: string;
  svgContent: React.ReactNode;
}

const createNumber = ({
  id,
  value,
  svgContent
}: CreateNumberParams): Number => ({
  id,
  type: 'number',
  value,
  svg: svgContent,
});

// Önce 0 rakamını oluştur
const zero = createNumber({
  id: 'num-0',
  value: '0',
  svgContent: (
    <svg viewBox="0 0 40 40" className="w-full h-full">
      <text
        x="20"
        y="20"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize="24"
        fill="currentColor"
        fontWeight="bold"
      >
        0
      </text>
    </svg>
  )
});

// Diğer rakamları oluştur
export const numbers: Number[] = [
  zero,
  ...Array.from({ length: 9 }, (_, i) => {
    const num = i + 1;
    return createNumber({
      id: `num-${num}`,
      value: num.toString(),
      svgContent: (
        <svg viewBox="0 0 40 40" className="w-full h-full">
          <text
            x="20"
            y="20"
            dominantBaseline="middle"
            textAnchor="middle"
            fontSize="24"
            fill="currentColor"
            fontWeight="bold"
          >
            {num}
          </text>
        </svg>
      )
    });
  })
];
