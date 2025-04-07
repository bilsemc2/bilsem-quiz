import { useState, useEffect } from 'react';
import { RefreshCw, Clock, Trophy, Star, Award, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import RequireAuth from '../components/RequireAuth';
import { useXPCheck } from '../hooks/useXPCheck';

// ------------------ Tip Tanımları ------------------
type Difficulty = 'easy' | 'medium' | 'hard';

type Pattern = {
  defs: string;
  type: string;
  backgroundColor: string;
  foregroundColor: string;
  size: number;
  rotation: number;
  opacity: number;
  id: string;
};

interface GameState {
  pattern: Pattern[];
  x: number;
  y: number;
}

interface GameOption {
  x: number;
  y: number;
  pattern: Pattern[];
  isCorrect: boolean;
}

type DifficultySettings = {
  patterns: string[];
  timeLimit: number;
  numShapes: number;
  numOptions: number;
};

type DifficultyConfig = {
  [key in Difficulty]: DifficultySettings;
};

interface UseGameReturn {
  // State
  score: number;
  highScore: number;
  streak: number;
  totalPoints: number;
  totalXP: number;
  timeLeft: number;
  showTimeWarning: boolean;
  showResult: boolean;
  isPlaying: boolean;
  difficulty: Difficulty;
  options: GameOption[];
  selectedOption: number | null;
  gamePattern: Pattern[] | null;
  missingPiece: GameState;
  showNotification: boolean;
  notificationMessage: string;
  isSoundEnabled: boolean;
  correctOptionIndex: number | null;

  // Methods
  setDifficulty: (level: Difficulty) => void;
  startNewGame: () => void;
  handleSelection: (option: GameOption, index: number) => Promise<void>;
  setIsSoundEnabled: (enabled: boolean) => void;
}

// ------------------------------------------------------
// 1. useAdvancedMissingPieceGame: Oyun Mantığının Hook’u
// ------------------------------------------------------
function useAdvancedMissingPieceGame(user: any): UseGameReturn {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [totalXP, setTotalXP] = useState(0);

  const [timeLeft, setTimeLeft] = useState(30);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [options, setOptions] = useState<GameOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [gamePattern, setGamePattern] = useState<Pattern[] | null>(null);
  const [missingPiece, setMissingPiece] = useState<GameState>({ x: 0, y: 0, pattern: [] });

  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);

  const svgSize = 300;
  const pieceSize = 60;

  // Zorluk ayarları
  const difficultySettings: DifficultyConfig = {
    easy: {
      patterns: ['dots', 'stripes', 'zigzag', 'waves', 'checkerboard'],
      timeLimit: 30,
      numShapes: 10,
      numOptions: 4
    },
    medium: {
      patterns: [
        'dots', 'stripes', 'zigzag', 'waves', 'checkerboard', 
        'crosshatch', 'honeycomb', 'triangles'
      ],
      timeLimit: 25,
      numShapes: 15,
      numOptions: 6
    },
    hard: {
      patterns: [
        'dots', 'stripes', 'zigzag', 'waves', 'checkerboard', 
        'crosshatch', 'honeycomb', 'triangles', 'circles', 
        'diamonds', 'stars'
      ],
      timeLimit: 20,
      numShapes: 20,
      numOptions: 8
    }
  };

  // ------------------ Sesler ------------------
  const sounds: Record<string, HTMLAudioElement> = {
    correct: new Audio('/sounds/correct.mp3'),
    incorrect: new Audio('/sounds/wrong.mp3'),
    tick: new Audio('/sounds/tick.mp3'),
    timeWarning: new Audio('/sounds/time-warning.mp3'),
    timeout: new Audio('/sounds/timeout.mp3'),
    complete: new Audio('/sounds/complete.mp3'),
    next: new Audio('/sounds/next.mp3')
  };

  const playSound = (soundName: keyof typeof sounds) => {
    if (isSoundEnabled) {
      const sound = sounds[soundName];
      sound.currentTime = 0;
      sound.play().catch(error => console.log('Ses çalma hatası:', error));
    }
  };

  // ------------------ Yardımcı Fonksiyonlar ------------------
  // Geçici bildirim gösterme fonksiyonu
  const showTemporaryNotification = (message: string): void => {
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  // Rengi benzer tonda değiştirme
  const adjustColor = (hexColor: string, delta: number): string => {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    const adjustComponent = (component: number): number => {
      const adjusted = component + Math.round((Math.random() - 0.5) * delta);
      return Math.max(0, Math.min(255, adjusted));
    };

    const newR = adjustComponent(r).toString(16).padStart(2, '0');
    const newG = adjustComponent(g).toString(16).padStart(2, '0');
    const newB = adjustComponent(b).toString(16).padStart(2, '0');
    
    return `#${newR}${newG}${newB}`;
  };

  // Doğru desene benzer yanlış desen oluşturma
  const createSimilarPattern = (originalPattern: Pattern[], variationLevel: number): Pattern[] => {
    return originalPattern.map(pattern => {
      const variation = variationLevel * (Math.random() * 0.4 + 0.8); // 0.8-1.2 arası rastgele çarpan
      return {
        ...pattern,
        size: pattern.size * (0.9 + Math.random() * 0.2 * variation),
        rotation: pattern.rotation + (Math.random() - 0.5) * 45 * variation,
        foregroundColor: adjustColor(pattern.foregroundColor, variation * 20),
        opacity: pattern.opacity * (0.9 + Math.random() * 0.2)
      };
    });
  };

  // ------------------ Desen Oluşturma ------------------
  const vibrantColors = [
    '#FF4D6D', // Canlı Pembe
    '#FF9F1C', // Portakal
    '#FFBD00', // Güneş Sarısı
    '#4CAF50', // Yeşil
    '#00B4D8', // Okyanus Mavisi
    '#7209B7', // Mor
    '#F72585', // Fuşya
    '#4CC9F0', // Elektrik Mavisi
    '#FB5607', // Turuncu
    '#3A86FF'  // Parlak Mavi
  ];

  const getContrastColor = (baseColor: string) => {
    // Mevcut renge eşit olmayanlardan rastgele birini seç
    const colors = vibrantColors.filter(c => c !== baseColor);
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Her bir desen tipi için SVG tanımı
  const getPatternDefs = (pattern: Pattern): string => {
    const strokeWidth = pattern.size / 6;
    const { size, backgroundColor, foregroundColor, type, id } = pattern;

    switch (type) {
      case 'dots':
        return `
          <pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">
            <rect width="${size}" height="${size}" fill="${backgroundColor}"/>
            <circle cx="${size/2}" cy="${size/2}" r="${size/3}" 
                    fill="${foregroundColor}" stroke="none"/>
          </pattern>
        `;
      case 'stripes':
        return `
          <pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">
            <rect width="${size}" height="${size}" fill="${backgroundColor}"/>
            <rect width="${size}" height="${size/3}" fill="${foregroundColor}"/>
          </pattern>
        `;
      case 'zigzag':
        return `
          <pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">
            <rect width="${size}" height="${size}" fill="${backgroundColor}"/>
            <path d="M0 0 L${size/2} ${size} L${size} 0" 
                  stroke="${foregroundColor}" fill="none" stroke-width="${strokeWidth}"/>
          </pattern>
        `;
      case 'waves':
        return `
          <pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">
            <rect width="${size}" height="${size}" fill="${backgroundColor}"/>
            <path d="M0 ${size/2} Q${size/4} 0 ${size/2} ${size/2} T${size} ${size/2}" 
                  stroke="${foregroundColor}" fill="none" stroke-width="${strokeWidth}"/>
          </pattern>
        `;
      case 'checkerboard':
        return `
          <pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">
            <rect width="${size}" height="${size}" fill="${backgroundColor}"/>
            <rect width="${size/2}" height="${size/2}" fill="${foregroundColor}"/>
            <rect x="${size/2}" y="${size/2}" width="${size/2}" height="${size/2}" 
                  fill="${foregroundColor}"/>
          </pattern>
        `;
      case 'crosshatch':
        return `
          <pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">
            <rect width="${size}" height="${size}" fill="${backgroundColor}"/>
            <path d="M0 0 L${size} ${size} M0 ${size} L${size} 0" 
                  stroke="${foregroundColor}" stroke-width="${strokeWidth}"/>
          </pattern>
        `;
      case 'honeycomb':
        const s = size / 2;
        return `
          <pattern id="${id}" patternUnits="userSpaceOnUse" width="${size*3}" height="${size*1.732}">
            <rect width="${size*3}" height="${size*1.732}" fill="${backgroundColor}"/>
            <path d="M${s},0 l${s},${s*0.866} l0,${s*1.732} l-${s},${s*0.866} l-${s},-${s*0.866} l0,-${s*1.732} z" 
                  fill="none" stroke="${foregroundColor}" stroke-width="${strokeWidth}"/>
          </pattern>
        `;
      case 'triangles':
        return `
          <pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">
            <rect width="${size}" height="${size}" fill="${backgroundColor}"/>
            <path d="M0 0 L${size} 0 L${size/2} ${size}" 
                  fill="${foregroundColor}" stroke="${backgroundColor}" stroke-width="1"/>
          </pattern>
        `;
      case 'circles':
        return `
          <pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">
            <rect width="${size}" height="${size}" fill="${backgroundColor}"/>
            <circle cx="${size/2}" cy="${size/2}" r="${size/3}" 
                    stroke="${foregroundColor}" fill="none" stroke-width="${strokeWidth}"/>
          </pattern>
        `;
      case 'diamonds':
        return `
          <pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">
            <rect width="${size}" height="${size}" fill="${backgroundColor}"/>
            <path d="M${size/2} 0 L${size} ${size/2} L${size/2} ${size} L0 ${size/2} Z" 
                  fill="${foregroundColor}" stroke="${backgroundColor}" stroke-width="1"/>
          </pattern>
        `;
      case 'stars':
        const points = 5;
        const outerRadius = size / 3;
        const innerRadius = outerRadius * 0.4;
        let starPath = '';
        for (let i = 0; i < points * 2; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const angle = (i * Math.PI) / points;
          const x = size/2 + Math.cos(angle) * radius;
          const y = size/2 + Math.sin(angle) * radius;
          starPath += (i === 0 ? 'M' : 'L') + `${x},${y}`;
        }
        return `
          <pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">
            <rect width="${size}" height="${size}" fill="${backgroundColor}"/>
            <path d="${starPath}Z" fill="${foregroundColor}" 
                  stroke="${backgroundColor}" stroke-width="1"/>
          </pattern>
        `;
      default:
        return '';
    }
  };

  const generatePattern = (): Pattern => {
    const settings = difficultySettings[difficulty];
    const patternType = settings.patterns[Math.floor(Math.random() * settings.patterns.length)];

    const backgroundColor = vibrantColors[Math.floor(Math.random() * vibrantColors.length)];
    const foregroundColor = getContrastColor(backgroundColor);

    const basePattern: Pattern = {
      defs: '',
      type: patternType,
      backgroundColor,
      foregroundColor,
      size: 20 + Math.random() * 30,
      rotation: Math.random() * 360,
      opacity: 0.9 + Math.random() * 0.1,
      id: `pattern-${Math.random().toString(36).substr(2, 9)}`
    };

    return {
      ...basePattern,
      defs: getPatternDefs(basePattern)
    };
  };

  const generatePatternList = (): Pattern[] => {
    const { numShapes } = difficultySettings[difficulty];
    return Array.from({ length: numShapes }, () => generatePattern());
  };

  // ------------------ Oyun Akışı ------------------
  // Profil (points, xp) yüklenmesi
  useEffect(() => {
    const loadProfile = async (): Promise<void> => {
      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('points, experience')
          .eq('id', user.id)
          .single();

        if (!error && profile) {
          setTotalPoints(profile.points || 0);
          setTotalXP(profile.experience || 0);
        }
      }
    };
    loadProfile();
  }, [user]);

  // Zamanlayıcı
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isPlaying && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 6) setShowTimeWarning(true);
          return prev - 1;
        });

        if (timeLeft === 10) {
          setShowTimeWarning(true);
          playSound('timeWarning');
        }
      }, 1000);
    } else if (timeLeft === 0) {
      endGame();
    }
    return () => {
      if (timer) clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, timeLeft]);

  const endGame = (): void => {
    setIsPlaying(false);
    setShowResult(true);
    if (score > highScore) {
      setHighScore(score);
    }
    playSound('timeout');
  };

  const startNewGame = () => {
    playSound('next');
    const settings = difficultySettings[difficulty];
    const newPattern = generatePatternList();
    setGamePattern(newPattern);

    const x = Math.floor(Math.random() * (svgSize - pieceSize));
    const y = Math.floor(Math.random() * (svgSize - pieceSize));
    
    setMissingPiece({ x, y, pattern: newPattern });

    // Seçenekleri oluştur
    const newOptions: GameOption[] = [];
    
    // Doğru seçeneği ekle
    newOptions.push({ x, y, pattern: newPattern, isCorrect: true });
    
    // Yanlış seçenekler
    for (let i = 1; i < settings.numOptions; i++) {
      const variationLevel = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 0.7 : 0.5;
      const wrongPattern = createSimilarPattern(newPattern, variationLevel);

      const offsetX = (Math.random() - 0.5) * pieceSize * 0.3;
      const offsetY = (Math.random() - 0.5) * pieceSize * 0.3;

      newOptions.push({
        x: x + offsetX,
        y: y + offsetY,
        pattern: wrongPattern,
        isCorrect: false
      });
    }

    setOptions(newOptions.sort(() => Math.random() - 0.5));
    setSelectedOption(null);
    setShowResult(false);
    setTimeLeft(settings.timeLimit);
    setIsPlaying(true);
    setShowTimeWarning(false);
  };

  const [correctOptionIndex, setCorrectOptionIndex] = useState<number | null>(null);
  
  const handleSelection = async (option: GameOption, index: number): Promise<void> => {
    setSelectedOption(index);
    setShowResult(true);
    setIsPlaying(false); // süreyi durdur

    // Doğru seçeneğin indexini bul
    const correctIndex = options.findIndex(opt => opt.isCorrect);
    setCorrectOptionIndex(correctIndex);

    if (option.isCorrect && user) {
      const earnedPoints = Math.floor(
        timeLeft * (difficulty === 'hard' ? 3 : difficulty === 'medium' ? 2 : 1)
      );
      const earnedXP = Math.floor(earnedPoints * 0.1); // %10 XP

      setScore(score + earnedPoints);
      setStreak(streak + 1);
      
      // Başarılı cevap bildirimi
      showTemporaryNotification(`+${earnedPoints} puan ve +${earnedXP} XP kazandın!`);

      // Profili güncelle
      try {
        const { data: profile, error: fetchError } = await supabase
          .from('profiles')
          .select('points, experience')
          .eq('id', user.id)
          .single();

        if (fetchError) throw fetchError;

        const newPoints = (profile?.points || 0) + earnedPoints;
        const newXP = (profile?.experience || 0) + earnedXP;

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ points: newPoints, experience: newXP })
          .eq('id', user.id);

        if (updateError) throw updateError;

        setTotalPoints(newPoints);
        setTotalXP(newXP);
        
        // Doğru cevapta 1 saniye sonra yeni soruya geç
        setTimeout(() => {
          startNewGame();
        }, 1000);
      } catch (error) {
        console.error('Puan güncellenirken hata:', error);
      }
    } else {
      setStreak(0);
      // Yanlış cevapta 2 saniye doğru cevabı göster, sonra yeni soruya geç
      setTimeout(() => {
        startNewGame();
        setCorrectOptionIndex(null);
      }, 2000);
    }

    playSound(option.isCorrect ? 'correct' : 'incorrect');
  };

  return {
    // State
    score,
    highScore,
    streak,
    totalPoints,
    totalXP,
    timeLeft,
    showTimeWarning,
    showResult,
    isPlaying,
    difficulty,
    options,
    selectedOption,
    gamePattern,
    missingPiece,
    showNotification,
    notificationMessage,
    isSoundEnabled,
    correctOptionIndex,

    // Methods
    setDifficulty,
    startNewGame,
    handleSelection,
    setIsSoundEnabled
  };
}

// ------------------------------------------------------
// 2. Alt Bileşenler
// ------------------------------------------------------

/** Scoreboard: Üst çubukta puanlar, XP, rekor, seri vs. gösterir. */
function Scoreboard(props: {
  score: number;
  highScore: number;
  totalPoints: number;
  totalXP: number;
  streak: number;
}) {
  const { score, highScore, totalPoints, totalXP, streak } = props;
  return (
    <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow">
      <div className="flex items-center gap-4">
        {/* Skor */}
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <span className="font-bold">{score}</span>
        </div>
        {/* Toplam Puan */}
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-blue-500" />
          <span>Toplam: {totalPoints}</span>
        </div>
        {/* XP */}
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-500" />
          <span>XP: {totalXP}</span>
        </div>
        {/* Rekor */}
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-purple-500" />
          <span>En Yüksek: {highScore}</span>
        </div>
        {/* Seri */}
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-green-500" />
          <span>Seri: {streak}</span>
        </div>
      </div>
    </div>
  );
}

/** DifficultySelector: Zorluk seviyelerini seçmek için buton grubu. */
function DifficultySelector(props: {
  currentDifficulty: Difficulty;
  onChange: (level: Difficulty) => void;
}) {
  const { currentDifficulty, onChange } = props;
  const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];

  return (
    <div className="flex justify-center gap-4">
      {difficulties.map((level) => (
        <button
          key={level}
          onClick={() => onChange(level)}
          className={`px-4 py-2 rounded-lg transition-colors ${
            currentDifficulty === level
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          {level.charAt(0).toUpperCase() + level.slice(1)}
        </button>
      ))}
    </div>
  );
}

/** GameInstructions: Oyunun açıklama metnini gösterir. */
function GameInstructions() {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
      <h2 className="text-xl font-bold mb-3">Nasıl Oynanır?</h2>
      <div className="space-y-2 text-gray-600">
        <p>1. Ekrandaki şekil deseninde kırmızı çerçeve ile gösterilen eksik parçayı bulun.</p>
        <p>2. Aşağıdaki seçeneklerden eksik parçaya uygun olanı seçin.</p>
        <p>3. Süre bitmeden doğru parçayı seçmeye çalışın.</p>
        <p>4. Mazaret uydurma; soruyu ve seçenekleri beğenmezsen Yeni Oyun'a bas.</p>
        <p>5. Hayır. Şekilli seçeneklerin hepsi aynı değil; birbirine çok benzer.</p>

        <div className="mt-4 bg-blue-50 p-3 rounded">
          <p className="font-semibold mb-2">Zorluk Seviyeleri:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <span className="font-medium">Önce oynamak istediğin zorluk seviyesine bas:</span> Sonra Yeni Oyun'a
            </li>
            <li>
              <span className="font-medium">Kolay:</span> 30 saniye, basit şekiller, 4 seçenek (x1 puan)
            </li>
            <li>
              <span className="font-medium">Orta:</span> 25 saniye, karışık şekiller, 6 seçenek (x2 puan)
            </li>
            <li>
              <span className="font-medium">Zor:</span> 20 saniye, tüm şekiller, 8 seçenek (x3 puan)
            </li>
          </ul>
        </div>
        <p className="mt-4 text-sm text-gray-500">
          Not: Ne kadar hızlı cevaplarsanız o kadar çok puan kazanırsınız!
        </p>
      </div>
    </div>
  );
}

/** PatternRenderer: Bir veya birden fazla Pattern’i SVG içinde çizer. */
function PatternRenderer(props: { pattern: Pattern[]; size: number; keyPrefix?: string }) {
  const { pattern, size, keyPrefix = '' } = props;

  return (
    <g>
      {pattern.map((p, i) => (
        <g key={`${keyPrefix}-${i}`}>
          {/* Pattern tanımları */}
          <defs dangerouslySetInnerHTML={{ __html: p.defs }} />
          {/* Pattern uygulanacak dikdörtgen */}
          <rect
            x="0"
            y="0"
            width={size}
            height={size}
            fill={`url(#${p.id})`}
            opacity={p.opacity}
            transform={`rotate(${p.rotation} ${size / 2} ${size / 2})`}
          />
        </g>
      ))}
    </g>
  );
}

/** OptionSquare: Alt taraftaki seçeneklerden bir tanesini temsil eder. */
function OptionSquare(props: {
  option: GameOption;
  index: number;
  selectedOption: number | null;
  correctOptionIndex: number | null;
  showResult: boolean;
  onSelect: (option: GameOption, index: number) => void;
  svgViewBox: { x: number; y: number; size: number };
}) {
  const { option, index, selectedOption, correctOptionIndex, showResult, onSelect, svgViewBox } = props;
  const { size } = svgViewBox;

  // Seçim yapılmış ve şu anda bu kare seçilmiş mi?
  const isSelected = selectedOption === index;
  const isCorrectOption = correctOptionIndex === index;

  // Seçim sonrası doğru/yanlış stilini ayarla
  let borderClass = 'border-gray-200';
  let bgClass = '';
  if (showResult) {
    if (isCorrectOption) {
      borderClass = 'border-green-500';
      bgClass = 'bg-green-100 bg-opacity-50 animate-pulse';
    } else if (isSelected && !option.isCorrect) {
      borderClass = 'border-red-500';
      bgClass = 'bg-red-100 bg-opacity-50';
    }
  }

  return (
    <div
      className={`relative cursor-pointer transform transition-all duration-200 hover:scale-105 ${
        isSelected ? 'ring-2 ring-blue-500 scale-105' : ''
      }`}
      style={{ width: '80px', height: '80px' }}
      onClick={() => onSelect(option, index)}
    >
      <svg
        className="border rounded bg-white w-full h-full shadow-sm hover:shadow-md transition-shadow"
        viewBox={`${option.x} ${option.y} ${size} ${size}`}
      >
        <PatternRenderer pattern={option.pattern} size={300} keyPrefix={`option-${index}`} />
      </svg>
      <div 
        className={`absolute inset-0 border-2 rounded ${borderClass} ${bgClass}`}
      />
    </div>
  );
}

// ------------------------------------------------------
// 3. Ana Bileşen (Container): AdvancedMissingPieceGame
// ------------------------------------------------------
export default function AdvancedMissingPieceGame() {
  const { user } = useAuth();
  const { hasEnoughXP, userXP, requiredXP, loading: xpLoading } = useXPCheck(false);

  // Hook’tan state ve metotları çekiyoruz
  const {
    score,
    highScore,
    streak,
    totalPoints,
    totalXP,
    timeLeft,
    showTimeWarning,
    showResult,
    isPlaying,
    difficulty,
    options,
    selectedOption,
    gamePattern,
    missingPiece,
    showNotification,
    notificationMessage,
    isSoundEnabled,
    correctOptionIndex,

    setDifficulty,
    startNewGame,
    handleSelection,
    setIsSoundEnabled
  } = useAdvancedMissingPieceGame(user);

  // ------------------ Render ------------------
  return (
    <RequireAuth>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
        {xpLoading ? (
          // XP hesaplanırken
          <div className="flex justify-center items-center min-h-screen">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : !hasEnoughXP ? (
          // XP yetersiz
          <div className="container mx-auto px-4 py-8">
            {/* Örnek: XPWarning component’i (Projenizde varsa) */}
            <p className="text-center text-red-500 font-bold">
              Bu oyuna başlamak için yeterli XP’niz yok (Gerekli XP: {requiredXP}, Sizde: {userXP})
            </p>
          </div>
        ) : (
          // Oyun Alanı
          <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center mb-6">
              {/* Sol: Skor */}
              <Scoreboard
                score={score}
                highScore={highScore}
                totalPoints={totalPoints}
                totalXP={totalXP}
                streak={streak}
              />
              
              {/* Sağ: Zaman */}
              <div className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full shadow-md ${showTimeWarning ? 'animate-bounce text-yellow-300' : ''}`}>
                <Clock className="w-6 h-6 text-white" />
                <span className="font-mono text-lg font-bold text-white">{timeLeft}s</span>
              </div>
            </div>

            {/* Zorluk Seçici */}
            <DifficultySelector currentDifficulty={difficulty} onChange={setDifficulty} />

            {/* Ana Oyun Alanı: SVG + Eksik Parça */}
            <div className="relative bg-gradient-to-br from-pink-400 via-purple-400 to-blue-500 rounded-xl shadow-xl p-8 mx-auto max-w-2xl border-4 border-purple-300">
              <svg width="300" height="300" className="mx-auto rounded-lg shadow-inner bg-white">
                {gamePattern && (
                  <PatternRenderer pattern={gamePattern} size={300} keyPrefix="game" />
                )}
                <rect
                  x={missingPiece.x}
                  y={missingPiece.y}
                  width={60}
                  height={60}
                  fill="white"
                  stroke="#FF9AA2"
                  strokeWidth="3"
                  strokeDasharray="8,8"
                  className={`${showTimeWarning ? 'animate-pulse' : ''} drop-shadow-lg`}
                />
              </svg>
            </div>

            {/* Seçenekler */}
            <div className="mt-8 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 p-6 rounded-xl shadow-lg">
              <div className="flex flex-wrap justify-center gap-6">
                {options.map((option, index) => (
                  <div 
                    key={`option-${index}`} 
                    className={`transform hover:scale-105 transition-transform duration-200 
                              ${selectedOption === index ? 
                                option.isCorrect ? 'ring-4 ring-green-400 ring-offset-4' : 'ring-4 ring-red-400 ring-offset-4'
                                : correctOptionIndex === index ? 'ring-4 ring-green-400 ring-offset-4 animate-pulse' : ''}
                              bg-white rounded-lg shadow-md hover:shadow-xl p-2 cursor-pointer`}
                  >
                    <OptionSquare
                      option={option}
                      index={index}
                      selectedOption={selectedOption}
                      correctOptionIndex={correctOptionIndex}
                      showResult={showResult}
                      onSelect={handleSelection}
                      svgViewBox={{ x: option.x, y: option.y, size: 60 }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Kontrol Butonları */}
            <div className="flex justify-center gap-4">
              <button
                onClick={startNewGame}
                className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-lg"
              >
                {isPlaying ? 'Yeni Oyun' : 'Başla'}
              </button>
            </div>

            {/* Seçim Sonucu */}
            {showResult && (
              <div className="text-center space-y-2">
                {selectedOption !== null && options[selectedOption]?.isCorrect ? (
                  <>
                    <p className="text-xl font-bold text-green-500">
                      Tebrikler! Doğru Cevap!
                    </p>
                    <p className="text-lg text-blue-500">
                      <span>+{Math.floor(timeLeft * (difficulty === 'hard' ? 3 : difficulty === 'medium' ? 2 : 1))} puan</span>
                      <span className="mx-2">|</span>
                      <span>+{Math.floor(timeLeft * (difficulty === 'hard' ? 0.3 : difficulty === 'medium' ? 0.2 : 0.1))} XP</span>
                    </p>
                  </>
                ) : (
                  <p className="text-xl font-bold text-red-500">
                    Yanlış! Tekrar dene
                  </p>
                )}
              </div>
            )}
  {/* Oyun Açıklaması */}
  <GameInstructions />
            {/* Sabit konumlu bildirim */}
            {showNotification && (
              <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in-out">
                {notificationMessage}
              </div>
            )}
            
            {/* Ses kontrolü - Alt kısımda */}
            <div className="fixed bottom-4 right-4">
              <button
                onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                className="p-3 rounded-full hover:bg-gray-100 bg-white shadow-lg transition-all duration-200 hover:scale-110"
                title={isSoundEnabled ? 'Sesi Kapat' : 'Sesi Aç'}
              >
                {isSoundEnabled ? (
                  // Ses Açık İkonu
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" 
                       viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728
                         M12 18.012l-7-4.2V10.2l7-4.2v12.012z" />
                  </svg>
                ) : (
                  // Ses Kapalı İkonu
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" 
                       viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 
                         3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </RequireAuth>
  );
}