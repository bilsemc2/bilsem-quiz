import React from 'react';

export interface Shape {
  id: string;
  type: 'shape';
  value: string;
  svg: React.ReactNode;
}

interface CreateShapeParams {
  id: string;
  value: string;
  svgContent: React.ReactNode;
}

const createShape = ({
  id,
  value,
  svgContent
}: CreateShapeParams): Shape => ({
  id,
  type: 'shape',
  value,
  svg: svgContent,
});

export const shapes: Shape[] = [
  // Temel şekiller
  createShape({
    id: 'circle',
    value: 'Daire',
    svgContent: (
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <circle cx="20" cy="20" r="15" stroke="currentColor" fill="none" strokeWidth="2" />
      </svg>
    )
  }),
  createShape({
    id: 'square',
    value: 'Kare',
    svgContent: (
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <rect x="5" y="5" width="30" height="30" stroke="currentColor" fill="none" strokeWidth="2" />
      </svg>
    )
  }),
  createShape({
    id: 'triangle',
    value: 'Üçgen',
    svgContent: (
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <polygon points="20,5 35,35 5,35" stroke="currentColor" fill="none" strokeWidth="2" />
      </svg>
    )
  }),
  createShape({
    id: 'pentagon',
    value: 'Beşgen',
    svgContent: (
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <polygon points="20,5 35,15 30,35 10,35 5,15" stroke="currentColor" fill="none" strokeWidth="2" />
      </svg>
    )
  }),
  createShape({
    id: 'rectangle',
    value: 'Dikdörtgen',
    svgContent: (
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <rect x="5" y="10" width="30" height="20" stroke="currentColor" fill="none" strokeWidth="2" />
      </svg>
    )
  }),
  createShape({
    id: 'hexagon',
    value: 'Altıgen',
    svgContent: (
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <path d="M30 10 L35 20 L30 30 L10 30 L5 20 L10 10 Z" stroke="currentColor" fill="none" strokeWidth="2" />
      </svg>
    )
  }),
  createShape({
    id: 'star',
    value: 'Yıldız',
    svgContent: (
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <path d="M20 5 L23 15 L33 15 L25 22 L28 32 L20 26 L12 32 L15 22 L7 15 L17 15 Z" stroke="currentColor" fill="none" strokeWidth="2" />
      </svg>
    )
  }),
  createShape({
    id: 'diamond',
    value: 'Baklava',
    svgContent: (
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <path d="M20 5 L35 20 L20 35 L5 20 Z" stroke="currentColor" fill="none" strokeWidth="2" />
      </svg>
    )
  }),
  createShape({
    id: 'oval',
    value: 'Oval',
    svgContent: (
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <ellipse cx="20" cy="20" rx="15" ry="10" stroke="currentColor" fill="none" strokeWidth="2" />
      </svg>
    )
  }),
  // Daha karmaşık şekiller
  createShape({
    id: 'heart',
    value: 'Kalp',
    svgContent: (
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <path d="M20 35 L10 25 A10 10 0 0 1 20 15 A10 10 0 0 1 30 25 Z" stroke="currentColor" fill="none" strokeWidth="2" />
      </svg>
    )
  }),
  createShape({
    id: 'cross',
    value: 'Artı',
    svgContent: (
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <path d="M15 5 L25 5 L25 15 L35 15 L35 25 L25 25 L25 35 L15 35 L15 25 L5 25 L5 15 L15 15 Z" stroke="currentColor" fill="none" strokeWidth="2" />
      </svg>
    )
  }),
  // Soru işareti
  createShape({
    id: 'modern-question',
    value: 'Modern Soru İşareti',
    svgContent: (
      <svg viewBox="0 0 40 40" className="w-full h-full">
        {/* Ana eğri - daha akıcı eğri */}
        <path
          d="M12 12 
             C12 6, 28 6, 28 12
             S20 16, 20 22
             Q20 24, 20 26"
          stroke="currentColor"
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
        />

        <circle
          cx="20"
          cy="33"
          r="2.5"
          fill="currentColor"
        />
      </svg>
    )
  }),
  // Oklar
  createShape({
    id: 'arrow-right',
    value: 'Sağa Ok',
    svgContent: (
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <path d="M5 20 L30 20 M25 15 L30 20 L25 25" stroke="currentColor" fill="none" strokeWidth="2" />
      </svg>
    )
  }),
  createShape({
    id: 'arrow-left',
    value: 'Sola Ok',
    svgContent: (
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <path d="M35 20 L10 20 M15 15 L10 20 L15 25" stroke="currentColor" fill="none" strokeWidth="2" />
      </svg>
    )
  }),
  createShape({
    id: 'arrow-up',
    value: 'Yukarı Ok',
    svgContent: (
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <path d="M20 35 L20 10 M15 15 L20 10 L25 15" stroke="currentColor" fill="none" strokeWidth="2" />
      </svg>
    )
  }),
  createShape({
    id: 'arrow-down',
    value: 'Aşağı Ok',
    svgContent: (
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <path d="M20 5 L20 30 M15 25 L20 30 L25 25" stroke="currentColor" fill="none" strokeWidth="2" />
      </svg>
    )
  }),
  createShape({
    id: 'arrow-diagonal-up',
    value: 'Çapraz Yukarı Ok',
    svgContent: (
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <path d="M10 30 L30 10 M25 10 L30 10 L30 15" stroke="currentColor" fill="none" strokeWidth="2" />
      </svg>
    )
  }),
  createShape({
    id: 'arrow-diagonal-down',
    value: 'Çapraz Aşağı Ok',
    svgContent: (
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <path d="M10 10 L30 30 M25 30 L30 30 L30 25" stroke="currentColor" fill="none" strokeWidth="2" />
      </svg>
    )
  })
];
