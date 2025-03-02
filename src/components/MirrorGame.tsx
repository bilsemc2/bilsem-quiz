import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Cat, 
  Dog, 
  Bird, 
  Fish, 
  Heart,
  Star,
  Sun
} from 'lucide-react';

const icons = [
  { component: Cat, name: 'Kedi' },
  { component: Dog, name: 'Köpek' },
  { component: Bird, name: 'Kuş' },
  { component: Fish, name: 'Balık' },
  { component: Heart, name: 'Kalp' },
  { component: Star, name: 'Yıldız' },
  { component: Sun, name: 'Güneş' }
];

const MirrorGame = () => {
  const [currentIconIndex, setCurrentIconIndex] = useState(0);
  const [iconSize, setIconSize] = useState(100);
  const [iconColor, setIconColor] = useState('text-blue-500');
  
  const colors = [
    'text-blue-500',
    'text-red-500',
    'text-green-500',
    'text-purple-500',
    'text-orange-500'
  ];
  
  const showRandomIcon = () => {
    const newIndex = Math.floor(Math.random() * icons.length);
    const newSize = Math.floor(Math.random() * 50) + 80;
    const newColorIndex = Math.floor(Math.random() * colors.length);
    setCurrentIconIndex(newIndex);
    setIconSize(newSize);
    setIconColor(colors[newColorIndex]);
  };

  const CurrentIcon = icons[currentIconIndex].component;
  const iconName = icons[currentIconIndex].name;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-blue-600">Sihirli Ayna</h1>
        <p className="text-gray-600 mt-2">Şekillerin ayna görüntüsünü keşfet!</p>
      </div>
      
      <div className="flex items-center justify-center space-x-20 bg-white rounded-2xl p-12 shadow-xl backdrop-blur-lg bg-opacity-90">
        <div className="flex flex-col items-center transform transition-all duration-300 hover:scale-105">
          <CurrentIcon size={iconSize} className={`${iconColor} transition-all duration-300`} />
          <p className="mt-4 font-medium text-lg text-gray-700">{iconName}</p>
        </div>
        
        <div className="flex flex-col items-center relative transform transition-all duration-300 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-l from-gray-100 to-white opacity-50 rounded-lg" />
          <CurrentIcon 
            size={iconSize} 
            className={`${iconColor} transform -scale-x-100 transition-all duration-300`} 
          />
          <p className="mt-4 font-medium text-lg text-gray-700">Ayna Görüntüsü</p>
        </div>
      </div>

      <Button 
        onClick={showRandomIcon}
        className="mt-8 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-3 rounded-full text-lg transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
      >
        Yeni Şekil Göster 🎲
      </Button>

      <div className="mt-6 text-sm text-gray-500">
        İpucu: Şekillerin üzerine gelerek büyümelerini izleyebilirsin!
      </div>
    </div>
  );
};

export default MirrorGame;
