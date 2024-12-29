import React from 'react';

export interface Animal {
  id: string;
  type: 'animal';
  value: string;
  svg: React.ReactNode;
}

interface CreateAnimalParams {
  id: string;
  value: string;
  imagePath: string;
}

const createAnimal = ({
  id,
  value,
  imagePath
}: CreateAnimalParams): Animal => ({
  id,
  type: 'animal',
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

export const animals: Animal[] = [
  createAnimal({ id: 'cat', value: 'Kedi', imagePath: '/images/animals/cat.png' }),
  createAnimal({ id: 'dog', value: 'Köpek', imagePath: '/images/animals/dog.png' }),
  createAnimal({ id: 'bird', value: 'Kuş', imagePath: '/images/animals/bird.png' }),
  createAnimal({ id: 'rabbit', value: 'Tavşan', imagePath: '/images/animals/rabbit.png' }),
  createAnimal({ id: 'fish', value: 'Balık', imagePath: '/images/animals/fish.png' }),
  createAnimal({ id: 'butterfly', value: 'Kelebek', imagePath: '/images/animals/butterfly.png' }),
  createAnimal({ id: 'owl', value: 'Baykuş', imagePath: '/images/animals/owl.png' }),
  createAnimal({ id: 'elephant', value: 'Fil', imagePath: '/images/animals/elephant.png' }),
  createAnimal({ id: 'penguin', value: 'Penguen', imagePath: '/images/animals/penguin.png' }),
  createAnimal({ id: 'lion', value: 'Aslan', imagePath: '/images/animals/lion.png' }),
  createAnimal({ id: 'giraffe', value: 'Zürafa', imagePath: '/images/animals/giraffe.png' }),
  createAnimal({ id: 'monkey', value: 'Maymun', imagePath: '/images/animals/monkey.png' }),
];
