import { Link } from 'react-router-dom';
import { 
  Puzzle, 
  BoxIcon, 
  Shapes,
  Package,
  FlipHorizontal2,
  RotateCcw,
  KeyRound,
  FileText,
  Brain,
  Calculator,
  BookOpen
} from 'lucide-react';

const games = [
  {
    title: 'Deyimler Dünyası',
    description: 'Türkçe deyimleri öğrenin, örneklerle pekiştirin ve eğlenceli oyunlarla bilginizi test edin!',
    icon: <BookOpen className="w-12 h-12 text-amber-500" />,
    path: '/deyimler',
    color: 'bg-amber-100',
    isNew: true
  },
  {
    title: 'Dolu-Boş Şekiller',
    description: 'Şekillerin dolu ve boş hallerini analiz edin. Örüntüyü bulun ve eksik şekli tamamlayın!',
    icon: <Shapes className="w-12 h-12 text-violet-500" />,
    path: '/filled-empty',
    color: 'bg-violet-100',
    isNew: true
  },
  {
    title: 'Hafıza Oyunu',
    description: 'Görsel hafızanızı test edin ve geliştirin. Resimleri eşleştirin ve puanınızı artırın!',
    icon: <Brain className="w-12 h-12 text-emerald-500" />,
    path: '/memory-game',
    color: 'bg-emerald-100',
    isNew: true
  },
  {
    title: 'Hafıza Oyunu 2',
    description: 'Daha zorlu hafıza egzersizleri ile kendinizi geliştirin. Yeni seviyeler ve farklı zorluklar!',
    icon: <Brain className="w-12 h-12 text-cyan-500" />,
    path: '/memory-game-2',
    color: 'bg-cyan-100',
    isNew: true
  },
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
  },

  {
    title: 'Matematik M1',
    description: 'Matematik işlemlerini çöz, hızlı düşün ve doğru cevabı bul!',
    icon: <Calculator className="w-12 h-12 text-orange-500" />,
    path: '/math/M1/m1',
    color: 'bg-orange-100',
    isNew: true
  },
  {
    title: 'Matematik Dünyası',
    description: 'Matematik sorularını çöz, PDF oluştur ve kendini geliştir!',
    icon: <Calculator className="w-12 h-12 text-blue-500" />,
    path: '/matematik-dunyasi',
    color: 'bg-blue-100',
    isNew: true
  }
];

const BilsemC2Page = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">BilsemC2 Oyunları</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {games.map((game, index) => (
            <Link
              key={index}
              to={game.path}
              className="group relative"
            >
              <div className={`${game.color} p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
                <div className="flex items-start justify-between">
                  <div className="flex-shrink-0">{game.icon}</div>
                  {game.isNew && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">Yeni!</span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mt-4">{game.title}</h3>
                <p className="text-gray-600 mt-2">{game.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BilsemC2Page;
