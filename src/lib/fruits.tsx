import React from 'react';

export interface Fruit {
  id: string;
  type: 'fruit';
  value: string;
  svg: React.ReactNode;
}

interface CreateFruitParams {
  id: string;
  value: string;
  imagePath: string;
}

const createFruit = ({
  id,
  value,
  imagePath
}: CreateFruitParams): Fruit => ({
  id,
  type: 'fruit',
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

export const fruits: Fruit[] = [
  createFruit({ id: 'apple', value: 'Elma', imagePath: '/images/fruits/apple.png' }),
  createFruit({ id: 'pear', value: 'Armut', imagePath: '/images/fruits/pear.png' }),
  createFruit({ id: 'orange', value: 'Portakal', imagePath: '/images/fruits/orange.png' }),
  createFruit({ id: 'lemon', value: 'Limon', imagePath: '/images/fruits/lemon.png' }),
  createFruit({ id: 'banana', value: 'Muz', imagePath: '/images/fruits/banana.png' }),
  createFruit({ id: 'watermelon', value: 'Karpuz', imagePath: '/images/fruits/watermelon.png' }),
  createFruit({ id: 'grapes', value: 'Üzüm', imagePath: '/images/fruits/grapes.png' }),
  createFruit({ id: 'strawberry', value: 'Çilek', imagePath: '/images/fruits/strawberry.png' }),
  createFruit({ id: 'peach', value: 'Şeftali', imagePath: '/images/fruits/peach.png' }),
  createFruit({ id: 'cherries', value: 'Kiraz', imagePath: '/images/fruits/cherries.png' }),
  createFruit({ id: 'pineapple', value: 'Ananas', imagePath: '/images/fruits/pineapple.png' }),
  createFruit({ id: 'coconut', value: 'Hindistan Cevizi', imagePath: '/images/fruits/coconut.png' }),
];
