import React from 'react';

export interface Bilsemc2Item {
  id: string;
  type: 'bilsemc2';
  value: string;
  svg: React.ReactNode;
}

interface CreateBilsemc2Params {
  id: string;
  value: string;
  imagePath: string;
}

const createBilsemc2Item = ({
  id,
  value,
  imagePath
}: CreateBilsemc2Params): Bilsemc2Item => ({
  id,
  type: 'bilsemc2',
  value,
  svg: (
    <div className="w-16 h-16 relative flex items-center justify-center">
      <img 
        src={imagePath}
        alt={value}
        width={64}
        height={64}
        className="object-contain"
      />
    </div>
  ),
});

export const bilsemc2Items: Bilsemc2Item[] = [
  createBilsemc2Item({ id: 'daire', value: 'Daire', imagePath: '/images/bilsemc2/circle.svg' }),
  createBilsemc2Item({ id: 'kare', value: 'Kare', imagePath: '/images/bilsemc2/square.svg' }),
  createBilsemc2Item({ id: 'ucgen', value: 'Üçgen', imagePath: '/images/bilsemc2/triangle.svg' }),
  createBilsemc2Item({ id: 'besgen', value: 'Beşgen', imagePath: '/images/bilsemc2/pentagon.svg' }),
  createBilsemc2Item({ id: 'dikdortgen', value: 'Dikdörtgen', imagePath: '/images/bilsemc2/rectangle.svg' }),
  createBilsemc2Item({ id: 'altigen', value: 'Altıgen', imagePath: '/images/bilsemc2/hexagon.svg' }),
  createBilsemc2Item({ id: 'yildiz', value: 'Yıldız', imagePath: '/images/bilsemc2/star.svg' }),
  createBilsemc2Item({ id: 'baklava', value: 'Baklava', imagePath: '/images/bilsemc2/diamond.svg' }),
  createBilsemc2Item({ id: 'oval', value: 'Oval', imagePath: '/images/bilsemc2/oval.svg' }),
  createBilsemc2Item({ id: 'kalp', value: 'Kalp', imagePath: '/images/bilsemc2/heart.svg' }),
  createBilsemc2Item({ id: 'arti', value: 'Artı', imagePath: '/images/bilsemc2/cross.svg' }),
  createBilsemc2Item({ id: 'soru', value: 'Soru İşareti', imagePath: '/images/bilsemc2/question.svg' }),
  createBilsemc2Item({ id: 'ok-sag', value: 'Sağa Ok', imagePath: '/images/bilsemc2/arrow-right.svg' }),
  createBilsemc2Item({ id: 'ok-sol', value: 'Sola Ok', imagePath: '/images/bilsemc2/arrow-left.svg' }),
];
