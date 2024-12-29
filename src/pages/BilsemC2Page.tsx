import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Puzzle, 
  BoxIcon, 
  Shapes,
  Package,
  FlipHorizontal2,
  RotateCcw,
  KeyRound,
  FileText
} from 'lucide-react';
import Snowfall from '../components/Snowfall';

const games = [
  {
    title: 'Bulmaca Oluştur',
    description: 'Kendi bulmacalarınızı oluşturun ve paylaşın. Yaratıcılığınızı konuşturun!',
    icon: <Puzzle className="w-12 h-12 text-pink-500" />,
    path: '/puzzle-creator',
    color: 'bg-pink-100'
  },
  {
    title: 'Eksik Parça',
    description: 'Şekil desenindeki eksik parçayı bulun. Farklı zorluk seviyeleriyle kendinizi test edin!',
    icon: <Puzzle className="w-12 h-12 text-blue-500" />,
    path: '/missing-piece',
    color: 'bg-blue-100'
  },
  {
    title: 'Açık Küp',
    description: 'Açık küp sorularını çözün ve 3 boyutlu düşünme becerilerinizi geliştirin!',
    icon: <BoxIcon className="w-12 h-12 text-purple-500" />,
    path: '/unfolded-cube',
    color: 'bg-purple-100'
  },
  {
    title: 'Şekil Oyunu',
    description: 'Geometrik şekilleri tanıyın ve sınıflandırın. Geometri bilginizi test edin!',
    icon: <Shapes className="w-12 h-12 text-green-500" />,
    path: '/shape-game',
    color: 'bg-green-100'
  },
  {
    title: 'Küp Sayma',
    description: '3 boyutlu yapılardaki küpleri sayın. Uzamsal düşünme becerilerinizi geliştirin!',
    icon: <Package className="w-12 h-12 text-red-500" />,
    path: '/cube-counting',
    color: 'bg-red-100'
  },
  {
    title: 'Ayna Simetrisi',
    description: 'Şekillerin ayna simetrisini bulun. Simetri ve yansıma kavramlarını öğrenin!',
    icon: <FlipHorizontal2 className="w-12 h-12 text-yellow-500" />,
    path: '/mirror-games',
    color: 'bg-yellow-100'
  },
  {
    title: 'Döndürme',
    description: 'Şekilleri zihninizde döndürün ve eşleştirin. Rotasyon ve açı kavramlarını keşfedin!',
    icon: <RotateCcw className="w-12 h-12 text-indigo-500" />,
    path: '/rotation-game',
    color: 'bg-indigo-100'
  },
  {
    title: 'Şifreleme',
    description: 'Metinleri hayvan sembolleriyle şifreleyin ve çözün! Eğlenceli ve yaratıcı bir şifreleme deneyimi.',
    icon: <KeyRound className="w-12 h-12 text-blue-500" />,
    path: '/visual-encoder',
    color: 'bg-blue-100'
  },
  {
    title: 'PDF Oluştur',
    description: 'Özel PDF\'ler oluşturun ve yazdırın. VIP üyeler için özel bir özellik!',
    icon: <FileText className="w-12 h-12 text-orange-500" />,
    path: '/create-pdf',
    color: 'bg-orange-100'
  }
];

const BilsemC2Page = () => {
  return (
    <div className="container mx-auto px-4 py-8 relative">
      <Snowfall />
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">BilsemC2 Oyunları</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {games.map((game, index) => (
            <Link
              key={index}
              to={game.path}
              className={`${game.color} p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300`}
            >
              <div className="flex items-center space-x-4">
                {game.icon}
                <div>
                  <h2 className="text-xl font-semibold">{game.title}</h2>
                  <p className="text-gray-600 mt-2">{game.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BilsemC2Page;
