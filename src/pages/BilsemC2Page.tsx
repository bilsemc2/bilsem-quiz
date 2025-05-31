import { Link } from 'react-router-dom';
import { 
  Puzzle, 
  BoxIcon, 
  Shapes,
  Package,
  FlipHorizontal2,
  RotateCcw,
  KeyRound,
  Brain,
  Calculator,
  BookOpen,
  BookText,
  Star,
  Trophy,
  Zap
} from 'lucide-react';

const games = [
  {
    title: 'Hikayeler',
    description: 'Yapay zeka ile oluşturulan hikayeler koleksiyonunu keşfedin ve kendi hikayelerinizi oluşturun!',
    icon: <BookText className="w-8 h-8" />,
    path: '/stories',
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-700',
    category: 'Yaratıcılık',
    isNew: true,
    difficulty: 'Kolay'
  },
  {
    title: 'Hızlı Okuma',
    description: 'Göz egzersizleri, kelime tanıma ve okuma hızınızı geliştirin!',
    icon: <BookOpen className="w-8 h-8" />,
    path: '/speed-reading',
    color: 'from-rose-500 to-rose-600',
    bgColor: 'bg-rose-50 dark:bg-rose-900/20',
    borderColor: 'border-rose-200 dark:border-rose-700',
    category: 'Okuma',
    isNew: true,
    difficulty: 'Orta'
  },
  {
    title: 'Deyimler Dünyası',
    description: 'Türkçe deyimleri öğrenin, örneklerle pekiştirin ve eğlenceli oyunlarla bilginizi test edin!',
    icon: <BookOpen className="w-8 h-8" />,
    path: '/deyimler',
    color: 'from-amber-500 to-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-200 dark:border-amber-700',
    category: 'Dil',
    isNew: true,
    difficulty: 'Orta'
  },
  {
    title: 'Dolu-Boş Şekiller',
    description: 'Şekillerin dolu ve boş hallerini analiz edin. Örüntüyü bulun ve eksik şekli tamamlayın!',
    icon: <Shapes className="w-8 h-8" />,
    path: '/filled-empty',
    color: 'from-violet-500 to-violet-600',
    bgColor: 'bg-violet-50 dark:bg-violet-900/20',
    borderColor: 'border-violet-200 dark:border-violet-700',
    category: 'Geometri',
    isNew: true,
    difficulty: 'Orta'
  },
  {
    title: 'Hafıza Oyunu',
    description: 'Görsel hafızanızı test edin ve geliştirin. Resimleri eşleştirin ve puanınızı artırın!',
    icon: <Brain className="w-8 h-8" />,
    path: '/memory-game',
    color: 'from-emerald-500 to-emerald-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    borderColor: 'border-emerald-200 dark:border-emerald-700',
    category: 'Hafıza',
    isNew: true,
    difficulty: 'Kolay'
  },
  {
    title: 'Hafıza Oyunu 2',
    description: 'Daha zorlu hafıza egzersizleri ile kendinizi geliştirin. Yeni seviyeler ve farklı zorluklar!',
    icon: <Brain className="w-8 h-8" />,
    path: '/memory-game-2',
    color: 'from-cyan-500 to-cyan-600',
    bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
    borderColor: 'border-cyan-200 dark:border-cyan-700',
    category: 'Hafıza',
    isNew: true,
    difficulty: 'Zor'
  },
  {
    title: 'Eksik Parça',
    description: 'Şekil desenindeki eksik parçayı bulun. Farklı zorluk seviyeleriyle kendinizi test edin!',
    icon: <Puzzle className="w-8 h-8" />,
    path: '/missing-piece',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-700',
    category: 'Analiz',
    difficulty: 'Orta'
  },
  {
    title: 'Açık Küp',
    description: 'Açık küp sorularını çözün ve 3 boyutlu düşünme becerilerinizi geliştirin!',
    icon: <BoxIcon className="w-8 h-8" />,
    path: '/unfolded-cube',
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-700',
    category: '3D Düşünme',
    difficulty: 'Zor'
  },
  {
    title: 'Şekil Oyunu',
    description: 'Geometrik şekilleri tanıyın ve sınıflandırın. Geometri bilginizi test edin!',
    icon: <Shapes className="w-8 h-8" />,
    path: '/shape-game',
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-700',
    category: 'Geometri',
    difficulty: 'Kolay'
  },
  {
    title: 'Küp Sayma',
    description: '3 boyutlu yapılardaki küpleri sayın. Uzamsal düşünme becerilerinizi geliştirin!',
    icon: <Package className="w-8 h-8" />,
    path: '/cube-counting',
    color: 'from-red-500 to-red-600',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-700',
    category: '3D Düşünme',
    difficulty: 'Zor'
  },
  {
    title: 'Ayna Simetrisi',
    description: 'Şekillerin ayna simetrisini bulun. Simetri ve yansıma kavramlarını öğrenin!',
    icon: <FlipHorizontal2 className="w-8 h-8" />,
    path: '/mirror-games',
    color: 'from-yellow-500 to-yellow-600',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-700',
    category: 'Simetri',
    difficulty: 'Orta'
  },
  {
    title: 'Döndürme',
    description: 'Şekilleri zihninizde döndürün ve eşleştirin. Rotasyon ve açı kavramlarını keşfedin!',
    icon: <RotateCcw className="w-8 h-8" />,
    path: '/rotation-game',
    color: 'from-indigo-500 to-indigo-600',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    borderColor: 'border-indigo-200 dark:border-indigo-700',
    category: 'Uzamsal',
    difficulty: 'Orta'
  },
  {
    title: 'Şifreleme',
    description: 'Metinleri hayvan sembolleriyle şifreleyin ve çözün! Eğlenceli ve yaratıcı bir şifreleme deneyimi.',
    icon: <KeyRound className="w-8 h-8" />,
    path: '/visual-encoder',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-700',
    category: 'Kodlama',
    difficulty: 'Orta'
  },
  {
    title: 'Matematik M1',
    description: 'Matematik işlemlerini çöz, hızlı düşün ve doğru cevabı bul!',
    icon: <Calculator className="w-8 h-8" />,
    path: '/math/M1/m1',
    color: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-700',
    category: 'Matematik',
    isNew: true,
    difficulty: 'Orta'
  },
  {
    title: 'Matematik Dünyası',
    description: 'Matematik sorularını çöz, PDF oluştur ve kendini geliştir!',
    icon: <Calculator className="w-8 h-8" />,
    path: '/matematik-dunyasi',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-700',
    category: 'Matematik',
    isNew: true,
    difficulty: 'Orta'
  }
];

const getDifficultyIcon = (difficulty: string) => {
  switch(difficulty) {
    case 'Kolay': return <Star className="w-4 h-4 text-green-500" />;
    case 'Orta': return <Trophy className="w-4 h-4 text-yellow-500" />;
    case 'Zor': return <Zap className="w-4 h-4 text-red-500" />;
    default: return <Star className="w-4 h-4 text-gray-500" />;
  }
};

const getDifficultyColor = (difficulty: string) => {
  switch(difficulty) {
    case 'Kolay': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
    case 'Orta': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'Zor': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
    default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400';
  }
};

const BilsemC2Page = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Puzzle className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              BilsemC2
            </h1>
          </div>
          <h2 className="text-2xl lg:text-3xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Eğitici Oyunlar Koleksiyonu
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Zeka geliştirici oyunlar, hafıza egzersizleri ve yaratıcılık atölyeleri ile kendinizi keşfedin! 🧠✨
          </p>
          
          {/* Stats */}
          <div className="flex justify-center gap-8 mt-8 flex-wrap">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{games.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Oyun</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{games.filter(g => g.isNew).length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Yeni Oyun</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-pink-600 dark:text-pink-400">8</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Kategori</div>
            </div>
          </div>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {games.map((game, index) => (
            <Link
              key={index}
              to={game.path}
              className="group block transform hover:scale-[1.02] transition-all duration-300"
            >
              <div className={`
                relative overflow-hidden rounded-2xl border-2 shadow-lg hover:shadow-2xl transition-all duration-500
                ${game.bgColor} ${game.borderColor}
                hover:border-opacity-60
              `}>
                {/* Gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                
                {/* Content */}
                <div className="relative p-6 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-r ${game.color} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      {game.icon}
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      {game.isNew && (
                        <div className="relative">
                          <span className="inline-flex items-center gap-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg animate-pulse">
                            <Zap className="w-3 h-3" />
                            Yeni!
                          </span>
                        </div>
                      )}
                      <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(game.difficulty)}`}>
                        {getDifficultyIcon(game.difficulty)}
                        {game.difficulty}
                      </div>
                    </div>
                  </div>

                  {/* Category */}
                  <div className="inline-flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></span>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{game.category}</span>
                  </div>

                  {/* Title and Description */}
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                      {game.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed line-clamp-3">
                      {game.description}
                    </p>
                  </div>

                  {/* Play Button */}
                  <div className="pt-2">
                    <div className={`
                      inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm
                      bg-gradient-to-r ${game.color} text-white
                      group-hover:shadow-lg group-hover:scale-105
                      transition-all duration-300
                    `}>
                      Oyna
                      <div className="group-hover:translate-x-1 transition-transform duration-300">→</div>
                    </div>
                  </div>
                </div>

                {/* Hover effect border */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${game.color} opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none`}></div>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-16 p-8 bg-white/50 dark:bg-gray-800/50 rounded-2xl backdrop-blur-sm">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Eğlenirken öğrenmeye hazır mısın? 🚀
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Her oyun, farklı becerilerini geliştirmek için özel olarak tasarlandı. 
            Hemen bir oyun seç ve maceraya başla!
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <div className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Star className="w-4 h-4 text-green-500" />
              Kolay Seviye
            </div>
            <div className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Trophy className="w-4 h-4 text-yellow-500" />
              Orta Seviye
            </div>
            <div className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Zap className="w-4 h-4 text-red-500" />
              Zor Seviye
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BilsemC2Page;
